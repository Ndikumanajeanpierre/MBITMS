package com.mbitms.repository;

import com.mbitms.entity.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    List<PurchaseOrder> findBySupplierId(Long supplierId);
    List<PurchaseOrder> findByBranchId(Long branchId);
    List<PurchaseOrder> findByStatus(String status);
}