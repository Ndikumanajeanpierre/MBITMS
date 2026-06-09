package com.mbitms.repository;

import com.mbitms.entity.StockLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StockLevelRepository extends JpaRepository<StockLevel, Long> {

    List<StockLevel> findByBranchId(Long branchId);

    List<StockLevel> findByItemId(Long itemId);

    List<StockLevel> findByBranchIdAndQuantityLessThanEqual(Long branchId, Double quantity);

    // Safe query — returns a list to avoid NonUniqueResultException if duplicates exist
    @Query("SELECT s FROM StockLevel s WHERE s.item.id = :itemId AND s.branch.id = :branchId ORDER BY s.id DESC")
    List<StockLevel> findAllByItemIdAndBranchId(@Param("itemId") Long itemId, @Param("branchId") Long branchId);

    // Keep for backward compatibility — safe now that unique constraint is on the table
    Optional<StockLevel> findByItemIdAndBranchId(Long itemId, Long branchId);
}