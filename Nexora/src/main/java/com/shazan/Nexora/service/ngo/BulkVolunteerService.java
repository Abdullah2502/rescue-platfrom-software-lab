package com.shazan.Nexora.service.ngo;

import com.opencsv.CSVReader;
import com.opencsv.CSVReaderBuilder;
import com.opencsv.CSVWriter;
import com.shazan.Nexora.common.exception.ApiException;
import com.shazan.Nexora.domain.enums.Gender;
import com.shazan.Nexora.domain.location.District;
import com.shazan.Nexora.domain.location.Division;
import com.shazan.Nexora.domain.location.Thana;
import com.shazan.Nexora.domain.ngo.Ngo;
import com.shazan.Nexora.domain.volunteer.Volunteer;
import com.shazan.Nexora.dto.volunteer.AddVolunteerRequest;
import com.shazan.Nexora.dto.volunteer.BulkUploadResponse;
import com.shazan.Nexora.dto.volunteer.BulkUploadResponse.RowError;
import com.shazan.Nexora.email.EmailService;
import com.shazan.Nexora.repository.location.DistrictRepository;
import com.shazan.Nexora.repository.location.DivisionRepository;
import com.shazan.Nexora.repository.location.ThanaRepository;
import com.shazan.Nexora.repository.volunteer.VolunteerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Parses a CSV upload from an NGO and inserts each row as a volunteer under
 * that NGO. Each row is processed independently — a bad row records an
 * error in the response and the loop continues.
 *
 * CSV format: comment lines start with `#` and are skipped. The first
 * non-comment line is the header. Recognized columns (case-insensitive):
 * name, email, phone, division, district, thana, skills, nid,
 * dateOfBirth, gender.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BulkVolunteerService {

    private static final long MAX_FILE_BYTES = 10L * 1024 * 1024; // 10 MB
    private static final int MAX_ROWS = 5_000;
    private static final String PHONE_REGEX = "^(\\+880|0)1[3-9]\\d{8}$";
    private static final String EMAIL_REGEX = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";

    private static final List<String> REQUIRED_COLUMNS = List.of("name", "email", "phone", "division", "gender");

    private static final List<String> TEMPLATE_INSTRUCTIONS = List.of(
            "# Nexora bulk volunteer import — fill one row per volunteer.",
            "# Delete this sample row before uploading. Save the file as CSV (UTF-8).",
            "#",
            "# Columns:",
            "#   name          — Full name (required, max 100 chars).",
            "#   email         — Unique email (required, valid address; one row per email).",
            "#   phone         — Bangladesh mobile: +8801XXXXXXXXX or 01XXXXXXXXX (required).",
            "#   division      — Division name as listed in the platform (required).",
            "#                   Examples: Dhaka, Chattogram, Khulna, Rajshahi, Sylhet,",
            "#                   Barisal, Rangpur, Mymensingh.",
            "#   district      — District name within the chosen division (optional).",
            "#   thana         — Thana/Upazila name within the chosen district (optional).",
            "#   gender        — One of MALE, FEMALE, OTHER (required, case-insensitive).",
            "#   skills        — Comma-separated, e.g. \"first_aid, search_rescue\" (optional).",
            "#   nid           — National ID number (optional).",
            "#   dateOfBirth   — ISO date YYYY-MM-DD, e.g. 1995-01-15 (optional).",
            "#",
            "# Up to 5,000 rows per upload. Each successful row triggers a setup",
            "# email with a password-setup link for the new volunteer.");

    private static final List<String> TEMPLATE_HEADER = List.of(
            "name", "email", "phone", "division", "district", "thana",
            "gender", "skills", "nid", "dateOfBirth");

    private static final List<String> TEMPLATE_SAMPLE_ROW = List.of(
            "Sample Volunteer",
            "sample@example.org",
            "+8801712345678",
            "Dhaka",
            "Dhaka",
            "Mirpur",
            "MALE",
            "first_aid, search_rescue",
            "1234567890",
            "1995-01-15");

    private final DivisionRepository divisionRepository;
    private final DistrictRepository districtRepository;
    private final ThanaRepository thanaRepository;
    private final VolunteerRepository volunteerRepository;
    private final EmailService email;

    /**
     * Build the downloadable CSV template. Lines starting with `#` are
     * OpenCSV comment markers and will be skipped on re-upload, so NGOs
     * see human-readable instructions in Excel while the parser only
     * sees the real header + sample row.
     */
    public byte[] buildTemplate() {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
                CSVWriter writer = new CSVWriter(new java.io.OutputStreamWriter(baos, StandardCharsets.UTF_8))) {
            for (String comment : TEMPLATE_INSTRUCTIONS) {
                writer.writeNext(new String[] { comment }, false);
            }
            writer.writeNext(TEMPLATE_HEADER.toArray(new String[0]), false);
            writer.writeNext(TEMPLATE_SAMPLE_ROW.toArray(new String[0]), false);
            writer.flush();
            return baos.toByteArray();
        } catch (IOException ex) {
            throw ApiException.badRequest("TEMPLATE_FAILED", "Could not build CSV template");
        }
    }

    public BulkUploadResponse processUpload(MultipartFile file, Ngo ngo) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("EMPTY_FILE", "Upload a non-empty CSV file");
        }
        if (file.getSize() > MAX_FILE_BYTES) {
            throw ApiException.badRequest("FILE_TOO_LARGE",
                    "CSV exceeds the 10 MB limit (" + (file.getSize() / 1024 / 1024) + " MB uploaded)");
        }

        List<RowError> errors = new ArrayList<>();
        int success = 0;
        int total = 0;

        // Strip `#`-comment and blank lines manually — OpenCSV 5.10's
        // CSVParserBuilder doesn't expose a comment-marker API (added in a
        // later release), so we filter at the BufferedReader level and let
        // OpenCSV's CSVReader handle quoting / escaping from there.
        String filtered;
        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(
                        new ByteArrayInputStream(file.getBytes()), StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) {
                String trimmed = line.trim();
                if (trimmed.isEmpty())
                    continue;
                if (trimmed.startsWith("#"))
                    continue;
                sb.append(line).append('\n');
            }
            filtered = sb.toString();
        } catch (IOException ex) {
            throw ApiException.badRequest("CSV_PARSE_FAILED",
                    "Could not read CSV: " + ex.getMessage());
        }

        try (CSVReader csv = new CSVReaderBuilder(new StringReader(filtered)).build()) {

            String[] header = csv.readNextSilently();
            if (header == null) {
                throw ApiException.badRequest("EMPTY_FILE", "CSV has no header row");
            }
            Map<String, Integer> cols = indexColumns(header);

            List<String> missing = new ArrayList<>();
            for (String req : REQUIRED_COLUMNS) {
                if (!cols.containsKey(req))
                    missing.add(req);
            }
            if (!missing.isEmpty()) {
                throw ApiException.badRequest("MISSING_COLUMNS",
                        "CSV header is missing required column(s): " + String.join(", ", missing));
            }

            String[] row;
            // Track which row number we surface to the NGO — header is row 1
            // so the first data row is 2. readNextSilently() doesn't tell us
            // the original file line, so we keep our own counter.
            int fileLine = 1; // header consumed
            while ((row = csv.readNextSilently()) != null) {
                fileLine++;
                if (isBlank(row))
                    continue;
                total++;
                if (total > MAX_ROWS) {
                    throw ApiException.badRequest("TOO_MANY_ROWS",
                            "CSV exceeds the " + MAX_ROWS + " row limit");
                }
                try {
                    AddVolunteerRequest req = parseRow(row, cols);
                    // Reuse the same insert path as the single-add endpoint.
                    // Idempotent on email — duplicate addresses are treated as
                    // success (existing record returned) without re-sending
                    // the welcome email.
                    insertOne(ngo, req);
                    success++;
                } catch (RowValidationException ex) {
                    errors.add(new RowError(fileLine, ex.getMessage()));
                } catch (Exception ex) {
                    log.warn("Bulk row {} failed", fileLine, ex);
                    errors.add(new RowError(fileLine,
                            "Unexpected error: " + ex.getClass().getSimpleName()));
                }
            }

        } catch (IOException ex) {
            throw ApiException.badRequest("CSV_PARSE_FAILED",
                    "Could not parse CSV: " + ex.getMessage());
        }

        long batchId = UUID.randomUUID().getLeastSignificantBits() & Long.MAX_VALUE;
        return new BulkUploadResponse(batchId, total, success, errors.size(), errors);
    }

    /* --------------------------------------------------------------- */
    /* Internals */
    /* --------------------------------------------------------------- */

    private Map<String, Integer> indexColumns(String[] header) {
        Map<String, Integer> map = new HashMap<>();
        for (int i = 0; i < header.length; i++) {
            String h = header[i] == null ? "" : header[i].trim().toLowerCase(Locale.ROOT);
            if (!h.isEmpty())
                map.put(h, i);
        }
        return map;
    }

    private AddVolunteerRequest parseRow(String[] row, Map<String, Integer> cols) {
        String name = cell(row, cols, "name");
        String email = cell(row, cols, "email");
        String phone = cell(row, cols, "phone");
        String divName = cell(row, cols, "division");
        String distName = cell(row, cols, "district");
        String thanaName = cell(row, cols, "thana");
        String gender = cell(row, cols, "gender");
        String skillsRaw = cell(row, cols, "skills");
        String nid = cell(row, cols, "nid");
        String dobRaw = cell(row, cols, "dateOfBirth");

        if (name.isBlank())
            throw new RowValidationException("name is required");
        if (email.isBlank())
            throw new RowValidationException("email is required");
        if (!email.matches(EMAIL_REGEX))
            throw new RowValidationException("invalid email: " + email);
        if (phone.isBlank())
            throw new RowValidationException("phone is required");
        if (!phone.matches(PHONE_REGEX))
            throw new RowValidationException(
                    "invalid phone (use +8801XXXXXXXXX or 01XXXXXXXXX): " + phone);
        if (divName.isBlank())
            throw new RowValidationException("division is required");

        Division division = divisionRepository.findByNameIgnoreCase(divName)
                .orElseThrow(() -> new RowValidationException(
                        "unknown division '" + divName + "' — use a division name from the platform"));

        District district = null;
        if (!distName.isBlank()) {
            district = districtRepository.findByNameIgnoreCaseAndDivision(distName, division)
                    .orElseThrow(() -> new RowValidationException(
                            "unknown district '" + distName + "' in division '" + division.getName() + "'"));
        }

        Thana thana = null;
        if (!thanaName.isBlank()) {
            if (district == null) {
                throw new RowValidationException(
                        "thana provided without a district (row " + thanaName + ")");
            }
            final District resolvedDistrict = district;
            String resolvedDistrictName = resolvedDistrict.getName();
            thana = thanaRepository.findByNameIgnoreCaseAndDistrict(thanaName, resolvedDistrict)
                    .orElseThrow(() -> new RowValidationException(
                            "unknown thana '" + thanaName + "' in district '" + resolvedDistrictName + "'"));
        }

        Gender genderEnum;
        try {
            genderEnum = Gender.valueOf(gender.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException | NullPointerException ex) {
            throw new RowValidationException(
                    "invalid gender '" + gender + "' — must be MALE, FEMALE, or OTHER");
        }

        List<String> skills = skillsRaw == null || skillsRaw.isBlank()
                ? List.of()
                : Arrays.stream(skillsRaw.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList();

        LocalDate dob = null;
        if (dobRaw != null && !dobRaw.isBlank()) {
            try {
                dob = LocalDate.parse(dobRaw.trim());
            } catch (DateTimeParseException ex) {
                throw new RowValidationException(
                        "invalid dateOfBirth '" + dobRaw + "' — use YYYY-MM-DD");
            }
        }

        String finalNid = (nid == null || nid.isBlank()) ? null : nid.trim();
        String safeName = name.trim();
        String safeEmail = email.trim().toLowerCase(Locale.ROOT);
        String safePhone = phone.trim();

        return new AddVolunteerRequest(
                safeName, safeEmail, safePhone, finalNid, dob, genderEnum,
                division.getId(),
                district == null ? null : district.getId(),
                thana == null ? null : thana.getId(),
                skills);
    }

    private void insertOne(Ngo ngo, AddVolunteerRequest req) {
        Optional<Volunteer> existing = volunteerRepository.findByEmail(req.email());
        if (existing.isPresent()) {
            // Idempotent — silently skip duplicates, count as success.
            return;
        }

        // Changed to default password "12345678"
        String tempPassword = "12345678";

        Division division = divisionRepository.findById(req.divisionId()).orElseThrow();
        District district = req.districtId() == null ? null
                : districtRepository.findById(req.districtId()).orElseThrow();
        Thana thana = req.thanaId() == null ? null
                : thanaRepository.findById(req.thanaId()).orElseThrow();

        Volunteer v = Volunteer.builder()
                .name(req.name()).email(req.email())
                .passwordHash(new BCryptPasswordEncoder(10).encode(tempPassword))
                .phone(req.phone()).nid(req.nid())
                .dateOfBirth(req.dateOfBirth()).gender(req.gender())
                .division(division).district(district).thana(thana)
                .skills(req.skills() == null ? new ArrayList<>() : new ArrayList<>(req.skills()))
                .mustSetPassword(true)
                .recruitedByNgo(ngo)
                .build();
        volunteerRepository.save(v);

        // Email generation skipped for now
        // email.sendVolunteerAddedByNgo(v, ngo, "https://nexora.bd/set-password?email="
        // + v.getEmail());
    }

    private static String cell(String[] row, Map<String, Integer> cols, String name) {
        Integer idx = cols.get(name);
        if (idx == null || idx >= row.length || row[idx] == null)
            return "";
        return row[idx].trim();
    }

    private static boolean isBlank(String[] row) {
        if (row == null || row.length == 0)
            return true;
        for (String s : row) {
            if (s != null && !s.trim().isEmpty())
                return false;
        }
        return true;
    }

    /** Local exception so the row loop can capture per-row failures cleanly. */
    private static class RowValidationException extends RuntimeException {
        RowValidationException(String message) {
            super(message);
        }
    }
}