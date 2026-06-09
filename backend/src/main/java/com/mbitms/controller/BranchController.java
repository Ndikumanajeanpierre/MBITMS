package com.mbitms.controller;

import com.mbitms.entity.Branch;
import com.mbitms.service.BranchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/branches")
@RequiredArgsConstructor
public class BranchController {

    private final BranchService branchService;

    @GetMapping
    public ResponseEntity<List<Branch>> getAllBranches() {
        return ResponseEntity.ok(branchService.getActiveBranches());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Branch> getBranch(@PathVariable Long id) {
        return ResponseEntity.ok(branchService.getBranchById(id));
    }

    @PostMapping
    public ResponseEntity<Branch> createBranch(@RequestBody Branch branch,
                                                Authentication auth) {
        return ResponseEntity.ok(branchService.createBranch(branch, auth.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Branch> updateBranch(@PathVariable Long id,
                                                @RequestBody Branch branch,
                                                Authentication auth) {
        return ResponseEntity.ok(branchService.updateBranch(id, branch, auth.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivateBranch(@PathVariable Long id,
                                                  Authentication auth) {
        branchService.deactivateBranch(id, auth.getName());
        return ResponseEntity.ok().build();
    }
}