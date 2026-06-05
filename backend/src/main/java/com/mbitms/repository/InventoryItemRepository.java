package com.mbitms.repository;

import com.mbitms.entity.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {
    List<InventoryItem> findByActiveTrue();
    List<InventoryItem> findByCategoryAndActiveTrue(String category);
    Optional<InventoryItem> findByCode(String code);
    boolean existsByCode(String code);
}