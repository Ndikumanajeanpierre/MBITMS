package com.mbitms.controller;

import com.mbitms.entity.InventoryItem;
import com.mbitms.entity.StockLevel;
import com.mbitms.service.InventoryItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class InventoryItemController {

    private final InventoryItemService itemService;

    @GetMapping
    public ResponseEntity<List<InventoryItem>> getAllItems(
            @RequestParam(required = false) String category) {
        if (category != null) {
            return ResponseEntity.ok(itemService.getItemsByCategory(category));
        }
        return ResponseEntity.ok(itemService.getAllItems());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InventoryItem> getItem(@PathVariable Long id) {
        return ResponseEntity.ok(itemService.getItemById(id));
    }

    @PostMapping
    public ResponseEntity<InventoryItem> createItem(@RequestBody InventoryItem item) {
        return ResponseEntity.ok(itemService.createItem(item));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InventoryItem> updateItem(@PathVariable Long id,
                                                     @RequestBody InventoryItem item) {
        return ResponseEntity.ok(itemService.updateItem(id, item));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivateItem(@PathVariable Long id) {
        itemService.deactivateItem(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/image")
    public ResponseEntity<String> uploadImage(@PathVariable Long id,
                                               @RequestParam("file") MultipartFile file)
            throws IOException {
        return ResponseEntity.ok(itemService.uploadImage(id, file));
    }

    @GetMapping("/stock/branch/{branchId}")
    public ResponseEntity<List<StockLevel>> getStockByBranch(@PathVariable Long branchId) {
        return ResponseEntity.ok(itemService.getStockByBranch(branchId));
    }

    @GetMapping("/stock/low/{branchId}")
    public ResponseEntity<List<StockLevel>> getLowStock(@PathVariable Long branchId) {
        return ResponseEntity.ok(itemService.getLowStockByBranch(branchId));
    }
}