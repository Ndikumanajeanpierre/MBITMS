package com.mbitms.service;

import com.mbitms.entity.Supplier;
import com.mbitms.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findByActiveTrue();
    }

    public Supplier getSupplierById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
    }

    public Supplier createSupplier(Supplier supplier) {
        supplier.setActive(true);
        return supplierRepository.save(supplier);
    }

    public Supplier updateSupplier(Long id, Supplier updated) {
        Supplier supplier = getSupplierById(id);
        supplier.setName(updated.getName());
        supplier.setContact(updated.getContact());
        supplier.setEmail(updated.getEmail());
        supplier.setAddress(updated.getAddress());
        return supplierRepository.save(supplier);
    }

    public void deactivateSupplier(Long id) {
        Supplier supplier = getSupplierById(id);
        supplier.setActive(false);
        supplierRepository.save(supplier);
    }
}