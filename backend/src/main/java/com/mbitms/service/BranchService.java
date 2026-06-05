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

    public Branch createBranch(Branch branch) {
        branch.setActive(true);
        return branchRepository.save(branch);
    }

    public Branch updateBranch(Long id, Branch updated) {
        Branch branch = getBranchById(id);
        branch.setName(updated.getName());
        branch.setLocation(updated.getLocation());
        branch.setContact(updated.getContact());
        return branchRepository.save(branch);
    }

    public void deactivateBranch(Long id) {
        Branch branch = getBranchById(id);
        branch.setActive(false);
        branchRepository.save(branch);
    }
}