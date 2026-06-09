package com.mbitms.controller;

import com.mbitms.entity.Supplier;
import com.mbitms.service.SupplierService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    public ResponseEntity<List<Supplier>> getAllSuppliers() {
        return ResponseEntity.ok(supplierService.getAllSuppliers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Supplier> getSupplier(@PathVariable Long id) {
        return ResponseEntity.ok(supplierService.getSupplierById(id));
    }

    @PostMapping
    public ResponseEntity<Supplier> createSupplier(@RequestBody Supplier supplier,
                                                    Authentication auth) {
        return ResponseEntity.ok(supplierService.createSupplier(supplier, auth.getName()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Supplier> updateSupplier(@PathVariable Long id,
                                                    @RequestBody Supplier supplier,
                                                    Authentication auth) {
        return ResponseEntity.ok(supplierService.updateSupplier(id, supplier, auth.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivateSupplier(@PathVariable Long id,
                                                    Authentication auth) {
        supplierService.deactivateSupplier(id, auth.getName());
        return ResponseEntity.ok().build();
    }
}