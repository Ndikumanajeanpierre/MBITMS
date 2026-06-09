package com.mbitms.service;

import com.mbitms.entity.Branch;
import com.mbitms.repository.BranchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BranchService {

    private final BranchRepository branchRepository;
    private final AuditLogService auditLogService;

    public List<Branch> getAllBranches() {
        return branchRepository.findAll();
    }

    public List<Branch> getActiveBranches() {
        return branchRepository.findByActiveTrue();
    }

    public Branch getBranchById(Long id) {
        return branchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Branch not found"));
    }

    public Branch createBranch(Branch branch, String userEmail) {
        branch.setActive(true);
        Branch saved = branchRepository.save(branch);

        auditLogService.log(
            userEmail,
            "CREATE",
            "Branch",
            saved.getId().toString(),
            "Branch created: " + saved.getName() + " — " + saved.getLocation()
        );

        return saved;
    }

    public Branch updateBranch(Long id, Branch updated, String userEmail) {
        Branch branch = getBranchById(id);
        branch.setName(updated.getName());
        branch.setLocation(updated.getLocation());
        branch.setContact(updated.getContact());
        Branch saved = branchRepository.save(branch);

        auditLogService.log(
            userEmail,
            "UPDATE",
            "Branch",
            saved.getId().toString(),
            "Branch updated: " + saved.getName() + " — " + saved.getLocation()
        );

        return saved;
    }

    public void deactivateBranch(Long id, String userEmail) {
        Branch branch = getBranchById(id);
        branch.setActive(false);
        branchRepository.save(branch);

        auditLogService.log(
            userEmail,
            "DELETE",
            "Branch",
            branch.getId().toString(),
            "Branch deactivated: " + branch.getName()
        );
    }
}