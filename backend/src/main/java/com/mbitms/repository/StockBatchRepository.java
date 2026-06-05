package com.mbitms.repository;

import com.mbitms.entity.StockBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface StockBatchRepository extends JpaRepository<StockBatch, Long> {
    List<StockBatch> findByBranchId(Long branchId);
    List<StockBatch> findByItemIdAndBranchId(Long itemId, Long branchId);
    List<StockBatch> findByExpiryDateBefore(LocalDate date);
    List<StockBatch> findByExpiryDateBetween(LocalDate start, LocalDate end);
}