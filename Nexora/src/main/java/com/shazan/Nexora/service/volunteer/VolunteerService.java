package com.shazan.Nexora.service.volunteer;

import com.shazan.Nexora.common.PageResponse;
import com.shazan.Nexora.common.exception.ApiException;
import com.shazan.Nexora.domain.enums.NgoStatus;
import com.shazan.Nexora.domain.enums.Role;
import com.shazan.Nexora.domain.ngo.Ngo;
import com.shazan.Nexora.domain.volunteer.Volunteer;
import com.shazan.Nexora.dto.location.LocationDto;
import com.shazan.Nexora.dto.ngo.NgoResponse;
import com.shazan.Nexora.dto.volunteer.VolunteerResponse;
import com.shazan.Nexora.repository.location.DistrictRepository;
import com.shazan.Nexora.repository.location.DivisionRepository;
import com.shazan.Nexora.repository.location.ThanaRepository;
import com.shazan.Nexora.repository.ngo.NgoRepository;
import com.shazan.Nexora.repository.volunteer.VolunteerRepository;
import com.shazan.Nexora.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VolunteerService {

    private final VolunteerRepository volunteerRepository;
    private final DivisionRepository divisionRepository;
    private final DistrictRepository districtRepository;
    private final ThanaRepository thanaRepository;
    private final NgoRepository ngoRepository;

    @Transactional(readOnly = true)
    public VolunteerResponse me() {
        return toResponse(requireVolunteer());
    }

    @Transactional
    public VolunteerResponse updateMyProfile(com.shazan.Nexora.dto.volunteer.UpdateVolunteerProfileRequest req) {
        Volunteer v = requireVolunteer();
        if (req.phone() != null)
            v.setPhone(req.phone());
        if (req.nid() != null)
            v.setNid(req.nid());
        if (req.dateOfBirth() != null)
            v.setDateOfBirth(req.dateOfBirth());
        if (req.skills() != null)
            v.setSkills(new ArrayList<>(req.skills()));
        if (req.profession() != null)
            v.setProfession(req.profession());
        if (req.certificateDocuments() != null)
            v.setCertificateDocuments(new ArrayList<>(req.certificateDocuments()));
        if (req.divisionId() != null) {
            v.setDivision(divisionRepository.findById(req.divisionId())
                    .orElseThrow(() -> ApiException.badRequest("DIVISION_NOT_FOUND", "Invalid division")));
        }
        if (req.districtId() != null) {
            v.setDistrict(districtRepository.findById(req.districtId())
                    .orElseThrow(() -> ApiException.badRequest("DISTRICT_NOT_FOUND", "Invalid district")));
        }
        if (req.thanaId() != null) {
            v.setThana(thanaRepository.findById(req.thanaId())
                    .orElseThrow(() -> ApiException.badRequest("THANA_NOT_FOUND", "Invalid thana")));
        }
        volunteerRepository.save(v);
        return toResponse(v);
    }

    private Volunteer requireVolunteer() {
        var cu = CurrentUser.require();
        if (!Role.ROLE_VOLUNTEER.name().equals(cu.role())) {
            throw ApiException.forbidden("NOT_VOLUNTEER", "Volunteer role required");
        }
        return volunteerRepository.findById(cu.id())
                .orElseThrow(() -> ApiException.notFound("VOLUNTEER_NOT_FOUND", "Volunteer not found"));
    }

    private VolunteerResponse toResponse(Volunteer v) {
        // Copy collections into new ArrayLists while the transaction session is still
        // active
        List<String> safeSkills = v.getSkills() == null ? List.of() : new ArrayList<>(v.getSkills());
        List<String> safeCerts = v.getCertificateDocuments() == null ? List.of()
                : new ArrayList<>(v.getCertificateDocuments());

        return new VolunteerResponse(
                v.getId(),
                v.getName(),
                v.getEmail(),
                v.getPhone(),
                v.getNid(),
                v.getDateOfBirth(),
                v.getGender(),
                v.getDivision() == null ? null
                        : new LocationDto(
                                v.getDivision().getId(),
                                v.getDivision().getName(),
                                v.getDivision().getBnName(),
                                null),
                v.getDistrict() == null ? null
                        : new LocationDto(
                                v.getDistrict().getId(),
                                v.getDistrict().getName(),
                                v.getDistrict().getBnName(),
                                v.getDistrict().getDivision() != null ? v.getDistrict().getDivision().getId() : null),
                v.getThana() == null ? null
                        : new LocationDto(
                                v.getThana().getId(),
                                v.getThana().getName(),
                                v.getThana().getBnName(),
                                v.getThana().getDistrict() != null ? v.getThana().getDistrict().getId() : null),
                safeSkills,
                v.getStatus(),
                v.getCreatedAt(),
                v.getProfession(),
                safeCerts);
    }

    @Transactional(readOnly = true)
    public PageResponse<NgoResponse> listActiveNgos(Long divisionId, Long districtId, String q, int page, int size) {
        requireVolunteer();
        var pageable = PageRequest.of(page, size, Sort.by("name").ascending());
        var stream = ngoRepository.findAllByStatus(NgoStatus.APPROVED).stream();
        if (divisionId != null) {
            stream = stream.filter(n -> n.getDivision() != null && n.getDivision().getId().equals(divisionId));
        }
        if (districtId != null) {
            stream = stream.filter(n -> n.getDistrict() != null && n.getDistrict().getId().equals(districtId));
        }
        if (q != null && !q.isBlank()) {
            String lower = q.trim().toLowerCase();
            stream = stream.filter(n -> (n.getName() != null && n.getName().toLowerCase().contains(lower))
                    || (n.getRegistrationNo() != null && n.getRegistrationNo().toLowerCase().contains(lower)));
        }
        List<NgoResponse> list = stream.map(this::toNgoResponse).toList();
        int start = Math.min((int) pageable.getOffset(), list.size());
        int end = Math.min(start + pageable.getPageSize(), list.size());
        var sublist = list.subList(start, end);
        int totalPages = size == 0 ? 1 : (int) Math.ceil((double) list.size() / size);
        return new PageResponse<>(sublist, page, size, list.size(), totalPages, page == 0, end >= list.size());
    }

    @Transactional(readOnly = true)
    public NgoResponse getNgoDetails(Long id) {
        requireVolunteer();
        Ngo ngo = ngoRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("NGO_NOT_FOUND", "NGO not found"));
        if (ngo.getStatus() != NgoStatus.APPROVED) {
            throw ApiException.notFound("NGO_NOT_FOUND", "NGO not found or not active");
        }
        return toNgoResponse(ngo);
    }

    private NgoResponse toNgoResponse(Ngo ngo) {
        return new NgoResponse(
                ngo.getId(), ngo.getName(), ngo.getEmail(), ngo.getRegistrationNo(),
                ngo.getLogoUrl(), ngo.getRegistrationCertificateUrl(), ngo.getPhone(), ngo.getWebsite(),
                ngo.getDivision() == null ? null
                        : new LocationDto(ngo.getDivision().getId(), ngo.getDivision().getName(),
                                ngo.getDivision().getBnName(), null),
                ngo.getDistrict() == null ? null
                        : new LocationDto(ngo.getDistrict().getId(), ngo.getDistrict().getName(),
                                ngo.getDistrict().getBnName(), ngo.getDistrict().getDivision().getId()),
                ngo.getThana() == null ? null
                        : new LocationDto(ngo.getThana().getId(), ngo.getThana().getName(), ngo.getThana().getBnName(),
                                ngo.getThana().getDistrict().getId()),
                ngo.getStatus(), ngo.getRejectionReason(), ngo.getApprovedAt(), ngo.getCreatedAt());
    }
}