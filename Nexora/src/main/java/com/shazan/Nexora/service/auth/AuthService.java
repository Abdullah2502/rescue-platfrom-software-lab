package com.shazan.Nexora.service.auth;

import com.shazan.Nexora.common.exception.ApiException;
import com.shazan.Nexora.domain.admin.SuperAdmin;
import com.shazan.Nexora.domain.enums.NgoStatus;
import com.shazan.Nexora.domain.enums.Role;
import com.shazan.Nexora.domain.location.District;
import com.shazan.Nexora.domain.location.Division;
import com.shazan.Nexora.domain.location.Thana;
import com.shazan.Nexora.domain.ngo.Ngo;
import com.shazan.Nexora.domain.volunteer.Volunteer;
import com.shazan.Nexora.dto.auth.AuthResponse;
import com.shazan.Nexora.dto.auth.LoginRequest;
import com.shazan.Nexora.dto.auth.RegisterNgoRequest;
import com.shazan.Nexora.dto.auth.RegisterVolunteerRequest;
import com.shazan.Nexora.email.EmailService;
import com.shazan.Nexora.repository.admin.SuperAdminRepository;
import com.shazan.Nexora.repository.location.DistrictRepository;
import com.shazan.Nexora.repository.location.DivisionRepository;
import com.shazan.Nexora.repository.location.ThanaRepository;
import com.shazan.Nexora.repository.ngo.NgoRepository;
import com.shazan.Nexora.repository.volunteer.VolunteerRepository;
import com.shazan.Nexora.security.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final SuperAdminRepository superAdminRepository;
    private final NgoRepository ngoRepository;
    private final VolunteerRepository volunteerRepository;
    private final DivisionRepository divisionRepository;
    private final DistrictRepository districtRepository;
    private final ThanaRepository thanaRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwt;
    private final EmailService email;

    @Transactional
    public AuthResponse registerVolunteer(RegisterVolunteerRequest req) {
        if (volunteerRepository.existsByEmail(req.email())) {
            throw ApiException.conflict("EMAIL_EXISTS", "Email already registered");
        }
        Division division = req.divisionId() == null ? null
                : divisionRepository.findById(req.divisionId())
                        .orElseThrow(() -> ApiException.badRequest("DIVISION_NOT_FOUND", "Invalid division"));
        District district = req.districtId() == null ? null
                : districtRepository.findById(req.districtId())
                        .orElseThrow(() -> ApiException.badRequest("DISTRICT_NOT_FOUND", "Invalid district"));
        Thana thana = req.thanaId() == null ? null
                : thanaRepository.findById(req.thanaId())
                        .orElseThrow(() -> ApiException.badRequest("THANA_NOT_FOUND", "Invalid thana"));

        List<String> skills = req.skills() == null || req.skills().isBlank()
                ? List.of()
                : Arrays.stream(req.skills().split(",")).map(String::trim).filter(s -> !s.isBlank()).toList();

        Volunteer v = Volunteer.builder()
                .name(req.name()).email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .phone(req.phone()).nid(req.nid())
                .dateOfBirth(req.dateOfBirth()).gender(req.gender())
                .division(division).district(district).thana(thana)
                .profession(req.profession())
                .certificateDocuments(req.certificateDocuments() == null ? new java.util.ArrayList<>()
                        : new java.util.ArrayList<>(req.certificateDocuments()))
                .skills(new java.util.ArrayList<>(skills))
                .status(com.shazan.Nexora.domain.enums.VolunteerStatus.PENDING_VERIFICATION)
                .build();
        volunteerRepository.save(v);
        log.info("New volunteer registered, awaiting super-admin approval: {}", v.getEmail());
        email.sendVolunteerPendingReview(v, "https://nexora.bd/login");
        // Self-registered volunteers can't sign in until the super admin
        // approves them — mirror the NGO flow and return null tokens.
        return new AuthResponse(null, null, 0L,
                new AuthResponse.UserPrincipal(v.getId(), v.getEmail(), v.getName(), "ROLE_VOLUNTEER", null,
                        v.getStatus().name()));
    }

    @Transactional
    public AuthResponse registerNgo(RegisterNgoRequest req) {
        if (ngoRepository.existsByEmail(req.email())) {
            throw ApiException.conflict("EMAIL_EXISTS", "Email already registered");
        }
        if (ngoRepository.existsByRegistrationNo(req.registrationNo())) {
            throw ApiException.conflict("REGN_EXISTS", "Registration number already used");
        }
        Division division = divisionRepository.findById(req.divisionId())
                .orElseThrow(() -> ApiException.badRequest("DIVISION_NOT_FOUND", "Invalid division"));
        District district = districtRepository.findById(req.districtId())
                .orElseThrow(() -> ApiException.badRequest("DISTRICT_NOT_FOUND", "Invalid district"));
        Thana thana = thanaRepository.findById(req.thanaId())
                .orElseThrow(() -> ApiException.badRequest("THANA_NOT_FOUND", "Invalid thana"));

        Ngo ngo = Ngo.builder()
                .name(req.name()).email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .registrationNo(req.registrationNo())
                .registrationCertificateUrl(req.registrationCertificateUrl())
                .phone(req.phone()).website(req.website()).logoUrl(req.logoUrl())
                .division(division).district(district).thana(thana)
                .status(NgoStatus.PENDING)
                .build();
        ngoRepository.save(ngo);
        log.info("New NGO registered, awaiting approval: {}", ngo.getEmail());
        // Inform applicant — but no JWT yet since they can't log in.
        email.sendNgoApproval(ngo, EmailService.ApprovalOutcome.PENDING, null, "https://nexora.bd/login");
        return new AuthResponse(null, null, 0L,
                new AuthResponse.UserPrincipal(ngo.getId(), ngo.getEmail(), ngo.getName(), "ROLE_NGO_ADMIN",
                        ngo.getId(), ngo.getStatus().name()));
    }

    public AuthResponse login(LoginRequest req) {
        Optional<SuperAdmin> sa = superAdminRepository.findByEmail(req.email());
        if (sa.isPresent() && passwordEncoder.matches(req.password(), sa.get().getPasswordHash())) {
            return tokenForSuperAdmin(sa.get());
        }
        Optional<Ngo> ngoOpt = ngoRepository.findByEmail(req.email());
        if (ngoOpt.isPresent()) {
            Ngo ngo = ngoOpt.get();
            if (!passwordEncoder.matches(req.password(), ngo.getPasswordHash())) {
                throw ApiException.unauthorized("BAD_CREDENTIALS", "Invalid email or password");
            }
            if (ngo.getStatus() == NgoStatus.PENDING) {
                throw ApiException.forbidden("NGO_PENDING", "Your NGO is pending approval");
            }
            if (ngo.getStatus() == NgoStatus.REJECTED) {
                throw ApiException.forbidden("NGO_REJECTED", "Your NGO was rejected: " + ngo.getRejectionReason());
            }
            return tokenForNgo(ngo);
        }
        Optional<Volunteer> vOpt = volunteerRepository.findByEmail(req.email());
        if (vOpt.isPresent()) {
            Volunteer v = vOpt.get();
            if (v.getPasswordHash() == null) {
                throw ApiException.forbidden("PASSWORD_NOT_SET",
                        "Please set your password first using the link in your invite email");
            }
            if (!passwordEncoder.matches(req.password(), v.getPasswordHash())) {
                throw ApiException.unauthorized("BAD_CREDENTIALS", "Invalid email or password");
            }
            var vStatus = v.getStatus();
            if (vStatus == com.shazan.Nexora.domain.enums.VolunteerStatus.PENDING_VERIFICATION) {
                throw ApiException.forbidden("VOLUNTEER_PENDING",
                        "Your volunteer account is awaiting Super Admin approval");
            }
            if (vStatus == com.shazan.Nexora.domain.enums.VolunteerStatus.INACTIVE) {
                throw ApiException.forbidden("VOLUNTEER_INACTIVE", "Your volunteer account has been deactivated");
            }
            return tokenForVolunteer(v);
        }
        throw ApiException.unauthorized("BAD_CREDENTIALS", "Invalid email or password");
    }

    public AuthResponse refresh(String refreshToken) {
        Claims c;
        try {
            c = jwt.parse(refreshToken);
        } catch (Exception ex) {
            throw ApiException.unauthorized("INVALID_REFRESH", "Invalid refresh token");
        }
        if (!"refresh".equals(c.get("type", String.class))) {
            throw ApiException.unauthorized("INVALID_REFRESH", "Not a refresh token");
        }
        String email = c.get("email", String.class);
        String role = c.get("role", String.class);
        Long userId = Long.parseLong(c.getSubject());
        return switch (role) {
            case "ROLE_SUPER_ADMIN" -> tokenForSuperAdmin(superAdminRepository.findById(userId)
                    .orElseThrow(() -> ApiException.unauthorized("USER_NOT_FOUND", "User not found")));
            case "ROLE_NGO_ADMIN" -> {
                Ngo ngo = ngoRepository.findById(userId)
                        .orElseThrow(() -> ApiException.unauthorized("USER_NOT_FOUND", "User not found"));
                if (ngo.getStatus() != NgoStatus.APPROVED) {
                    throw ApiException.forbidden("NGO_NOT_APPROVED", "NGO is not approved");
                }
                yield tokenForNgo(ngo);
            }
            case "ROLE_VOLUNTEER" -> {
                Volunteer v = volunteerRepository.findById(userId)
                        .orElseThrow(() -> ApiException.unauthorized("USER_NOT_FOUND", "User not found"));
                if (v.getStatus() != com.shazan.Nexora.domain.enums.VolunteerStatus.ACTIVE) {
                    throw ApiException.forbidden("VOLUNTEER_NOT_ACTIVE", "Volunteer is not active");
                }
                yield tokenForVolunteer(v);
            }
            default -> throw ApiException.unauthorized("UNKNOWN_ROLE", "Unknown role");
        };
    }

    private AuthResponse tokenForSuperAdmin(SuperAdmin u) {
        String access = jwt.generateAccessToken(u.getId(), u.getEmail(), Role.ROLE_SUPER_ADMIN, null);
        String refresh = jwt.generateRefreshToken(u.getId(), u.getEmail(), Role.ROLE_SUPER_ADMIN, null);
        return new AuthResponse(access, refresh, jwt.getAccessExpiryMs(),
                new AuthResponse.UserPrincipal(u.getId(), u.getEmail(), u.getName(), "ROLE_SUPER_ADMIN", null, null));
    }

    private AuthResponse tokenForNgo(Ngo u) {
        String access = jwt.generateAccessToken(u.getId(), u.getEmail(), Role.ROLE_NGO_ADMIN, u.getId());
        String refresh = jwt.generateRefreshToken(u.getId(), u.getEmail(), Role.ROLE_NGO_ADMIN, u.getId());
        return new AuthResponse(access, refresh, jwt.getAccessExpiryMs(),
                new AuthResponse.UserPrincipal(u.getId(), u.getEmail(), u.getName(), "ROLE_NGO_ADMIN", u.getId(),
                        u.getStatus().name()));
    }

    private AuthResponse tokenForVolunteer(Volunteer u) {
        String access = jwt.generateAccessToken(u.getId(), u.getEmail(), Role.ROLE_VOLUNTEER, null);
        String refresh = jwt.generateRefreshToken(u.getId(), u.getEmail(), Role.ROLE_VOLUNTEER, null);
        return new AuthResponse(access, refresh, jwt.getAccessExpiryMs(),
                new AuthResponse.UserPrincipal(u.getId(), u.getEmail(), u.getName(), "ROLE_VOLUNTEER", null, null));
    }

    public String generateTempPassword() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 16);
    }
}
