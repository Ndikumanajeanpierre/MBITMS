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
    private final AuditLogService auditLogService;

    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findByActiveTrue();
    }

    public Supplier getSupplierById(Long id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
    }

    public Supplier createSupplier(Supplier supplier, String userEmail) {
        supplier.setActive(true);
        Supplier saved = supplierRepository.save(supplier);

        auditLogService.log(
            userEmail,
            "CREATE",
            "Supplier",
            saved.getId().toString(),
            "Supplier added: " + saved.getName() + " — " + saved.getEmail()
        );

        return saved;
    }

    public Supplier updateSupplier(Long id, Supplier updated, String userEmail) {
        Supplier supplier = getSupplierById(id);
        supplier.setName(updated.getName());
        supplier.setContact(updated.getContact());
        supplier.setEmail(updated.getEmail());
        supplier.setAddress(updated.getAddress());
        Supplier saved = supplierRepository.save(supplier);

        auditLogService.log(
            userEmail,
            "UPDATE",
            "Supplier",
            saved.getId().toString(),
            "Supplier updated: " + saved.getName() + " — " + saved.getEmail()
        );

        return saved;
    }

    public void deactivateSupplier(Long id, String userEmail) {
        Supplier supplier = getSupplierById(id);
        supplier.setActive(false);
        supplierRepository.save(supplier);

        auditLogService.log(
            userEmail,
            "DELETE",
            "Supplier",
            supplier.getId().toString(),
            "Supplier deactivated: " + supplier.getName()
        );
    }
}