package com.mbitms.controller;

import com.mbitms.entity.StockBatch;
import com.mbitms.repository.StockBatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/batches")
@RequiredArgsConstructor
public class StockBatchController {

    private final StockBatchRepository stockBatchRepository;

    @GetMapping
    public ResponseEntity<List<StockBatch>> getAllBatches() {
        return ResponseEntity.ok(stockBatchRepository.findAll());
    }

    @GetMapping("/expiring")
    public ResponseEntity<List<StockBatch>> getExpiringBatches() {
        LocalDate today = LocalDate.now();
        LocalDate in30Days = today.plusDays(30);
        return ResponseEntity.ok(
            stockBatchRepository.findByExpiryDateBetween(today, in30Days)
        );
    }

    @GetMapping("/expired")
    public ResponseEntity<List<StockBatch>> getExpiredBatches() {
        return ResponseEntity.ok(
            stockBatchRepository.findByExpiryDateBefore(LocalDate.now())
        );
    }

    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<StockBatch>> getBatchesByBranch(
            @PathVariable Long branchId) {
        return ResponseEntity.ok(
            stockBatchRepository.findByBranchId(branchId)
        );
    }
}