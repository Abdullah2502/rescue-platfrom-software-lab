package com.shazan.Nexora.service.volunteer;

import com.shazan.Nexora.common.exception.ApiException;
import com.shazan.Nexora.domain.enums.Role;
import com.shazan.Nexora.domain.volunteer.Volunteer;
import com.shazan.Nexora.dto.location.LocationDto;
import com.shazan.Nexora.dto.volunteer.VolunteerResponse;
import com.shazan.Nexora.repository.location.DistrictRepository;
import com.shazan.Nexora.repository.location.DivisionRepository;
import com.shazan.Nexora.repository.location.ThanaRepository;
import com.shazan.Nexora.repository.volunteer.VolunteerRepository;
import com.shazan.Nexora.security.CurrentUser;
import lombok.RequiredArgsConstructor;
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

    @Transactional(readOnly = true)
    public VolunteerResponse me() {
        return toResponse(requireVolunteer());
    }

    @Transactional
    public VolunteerResponse updateMyProfile(com.shazan.Nexora.dto.volunteer.UpdateVolunteerProfileRequest req) {
        Volunteer v = requireVolunteer();
        if (req.phone() != null) v.setPhone(req.phone());
        if (req.nid() != null) v.setNid(req.nid());
        if (req.dateOfBirth() != null) v.setDateOfBirth(req.dateOfBirth());
        if (req.skills() != null) v.setSkills(new ArrayList<>(req.skills()));
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
        // Copy skills into a new ArrayList while the transaction session is still active
        List<String> safeSkills = v.getSkills() == null ? List.of() : new ArrayList<>(v.getSkills());

        return new VolunteerResponse(
                v.getId(), 
                v.getName(), 
                v.getEmail(), 
                v.getPhone(), 
                v.getNid(),
                v.getDateOfBirth(), 
                v.getGender(),
                v.getDivision() == null ? null : new LocationDto(
                        v.getDivision().getId(), 
                        v.getDivision().getName(), 
                        v.getDivision().getBnName(), 
                        null
                ),
                v.getDistrict() == null ? null : new LocationDto(
                        v.getDistrict().getId(), 
                        v.getDistrict().getName(), 
                        v.getDistrict().getBnName(), 
                        v.getDistrict().getDivision() != null ? v.getDistrict().getDivision().getId() : null
                ),
                v.getThana() == null ? null : new LocationDto(
                        v.getThana().getId(), 
                        v.getThana().getName(), 
                        v.getThana().getBnName(), 
                        v.getThana().getDistrict() != null ? v.getThana().getDistrict().getId() : null
                ),
                safeSkills, 
                v.getStatus()
        );
    }
}