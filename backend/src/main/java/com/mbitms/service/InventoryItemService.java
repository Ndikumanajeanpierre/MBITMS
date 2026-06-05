package com.mbitms.service;

import com.mbitms.entity.InventoryItem;
import com.mbitms.entity.StockLevel;
import com.mbitms.entity.Branch;
import com.mbitms.repository.BranchRepository;
import com.mbitms.repository.InventoryItemRepository;
import com.mbitms.repository.StockLevelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InventoryItemService {

    private final InventoryItemRepository itemRepository;
    private final StockLevelRepository stockLevelRepository;
    private final BranchRepository branchRepository;

    public List<InventoryItem> getAllItems() {
        return itemRepository.findByActiveTrue();
    }

    public List<InventoryItem> getItemsByCategory(String category) {
        return itemRepository.findByCategoryAndActiveTrue(category);
    }

    public InventoryItem getItemById(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found"));
    }

    public InventoryItem createItem(InventoryItem item) {
        if (itemRepository.existsByCode(item.getCode())) {
            throw new RuntimeException("Item code already exists");
        }
        item.setActive(true);
        return itemRepository.save(item);
    }

    public InventoryItem updateItem(Long id, InventoryItem updated) {
        InventoryItem item = getItemById(id);
        item.setName(updated.getName());
        item.setCategory(updated.getCategory());
        item.setUnit(updated.getUnit());
        return itemRepository.save(item);
    }

    public void deactivateItem(Long id) {
        InventoryItem item = getItemById(id);
        item.setActive(false);
        itemRepository.save(item);
    }

    public String uploadImage(Long itemId, MultipartFile file) throws IOException {
        InventoryItem item = getItemById(itemId);
        String uploadDir = "uploads/items/";
        Files.createDirectories(Paths.get(uploadDir));
        String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(uploadDir + filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        String imageUrl = "/uploads/items/" + filename;
        item.setImageUrl(imageUrl);
        itemRepository.save(item);
        return imageUrl;
    }

    public List<StockLevel> getStockByBranch(Long branchId) {
        return stockLevelRepository.findByBranchId(branchId);
    }

    public StockLevel setReorderLevel(Long itemId, Long branchId, Double reorderLevel) {
        StockLevel stock = stockLevelRepository
                .findByItemIdAndBranchId(itemId, branchId)
                .orElseGet(() -> {
                    StockLevel s = new StockLevel();
                    s.setItem(itemRepository.findById(itemId)
                            .orElseThrow(() -> new RuntimeException("Item not found")));
                    s.setBranch(branchRepository.findById(branchId)
                            .orElseThrow(() -> new RuntimeException("Branch not found")));
                    return s;
                });
        stock.setReorderLevel(reorderLevel);
        return stockLevelRepository.save(stock);
    }

    public List<StockLevel> getLowStockByBranch(Long branchId) {
        List<StockLevel> levels = stockLevelRepository.findByBranchId(branchId);
        return levels.stream()
                .filter(s -> s.getQuantity() <= s.getReorderLevel())
                .toList();
    }
}