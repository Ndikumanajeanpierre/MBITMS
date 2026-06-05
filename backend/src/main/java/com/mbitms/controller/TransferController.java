package com.mbitms.controller;

import com.mbitms.dto.ApprovalDTO;
import com.mbitms.dto.TransferRequestDTO;
import com.mbitms.entity.TransferRequest;
import com.mbitms.service.TransferService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transfers")
@RequiredArgsConstructor
public class TransferController {

    private final TransferService transferService;

    @PostMapping
    public ResponseEntity<TransferRequest> createTransfer(
            @RequestBody TransferRequestDTO dto,
            Authentication auth) {
        return ResponseEntity.ok(
                transferService.createTransfer(dto, auth.getName()));
    }

    @GetMapping
    public ResponseEntity<List<TransferRequest>> getAllTransfers(
            @RequestParam(required = false) String status) {
        if (status != null) {
            return ResponseEntity.ok(transferService.getTransfersByStatus(status));
        }
        return ResponseEntity.ok(transferService.getAllTransfers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TransferRequest> getTransfer(@PathVariable Long id) {
        return ResponseEntity.ok(transferService.getTransferById(id));
    }

    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<TransferRequest>> getTransfersByBranch(
            @PathVariable Long branchId) {
        return ResponseEntity.ok(transferService.getTransfersByBranch(branchId));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<TransferRequest> approve(
            @PathVariable Long id,
            @RequestBody ApprovalDTO dto,
            Authentication auth) {
        return ResponseEntity.ok(
                transferService.approveTransfer(id, dto, auth.getName(), 1));
    }

    @PostMapping("/{id}/approve/l2")
    public ResponseEntity<TransferRequest> approveL2(
            @PathVariable Long id,
            @RequestBody ApprovalDTO dto,
            Authentication auth) {
        return ResponseEntity.ok(
                transferService.approveTransfer(id, dto, auth.getName(), 2));
    }

    @PostMapping("/{id}/transit")
    public ResponseEntity<TransferRequest> markInTransit(@PathVariable Long id) {
        return ResponseEntity.ok(transferService.markInTransit(id));
    }

    @PostMapping("/{id}/receive")
    public ResponseEntity<TransferRequest> markReceived(@PathVariable Long id) {
        return ResponseEntity.ok(transferService.markReceived(id));
    }
}