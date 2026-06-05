package com.mbitms.repository;

import com.mbitms.entity.StockLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface StockLevelRepository extends JpaRepository<StockLevel, Long> {
    List<StockLevel> findByBranchId(Long branchId);
    List<StockLevel> findByItemId(Long itemId);
    Optional<StockLevel> findByItemIdAndBranchId(Long itemId, Long branchId);
    List<StockLevel> findByBranchIdAndQuantityLessThanEqual(Long branchId, Double quantity);
}