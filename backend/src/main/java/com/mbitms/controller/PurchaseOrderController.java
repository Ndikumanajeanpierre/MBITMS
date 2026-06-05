package com.mbitms.controller;

import com.mbitms.dto.PurchaseOrderDTO;
import com.mbitms.dto.ReceivePODTO;
import com.mbitms.entity.PurchaseOrder;
import com.mbitms.service.PurchaseOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchase-orders")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final PurchaseOrderService poService;

    @GetMapping
    public ResponseEntity<List<PurchaseOrder>> getAllPOs() {
        return ResponseEntity.ok(poService.getAllPOs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PurchaseOrder> getPO(@PathVariable Long id) {
        return ResponseEntity.ok(poService.getPOById(id));
    }

    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<PurchaseOrder>> getPOsByBranch(@PathVariable Long branchId) {
        return ResponseEntity.ok(poService.getPOsByBranch(branchId));
    }

    @PostMapping
    public ResponseEntity<PurchaseOrder> createPO(@RequestBody PurchaseOrderDTO dto,
                                                   Authentication auth) {
        return ResponseEntity.ok(poService.createPO(dto, auth.getName()));
    }

    @PostMapping("/{id}/receive")
    public ResponseEntity<PurchaseOrder> receivePO(@PathVariable Long id,
                                                    @RequestBody ReceivePODTO dto,
                                                    Authentication auth) {
        return ResponseEntity.ok(poService.receivePO(id, dto, auth.getName()));
    }
}