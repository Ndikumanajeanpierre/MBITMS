package com.mbitms.controller;

import com.mbitms.service.CsvService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/csv")
@RequiredArgsConstructor
public class CsvController {

    private final CsvService csvService;

    @PostMapping("/import/items")
    public ResponseEntity<String> importItems(@RequestParam("file") MultipartFile file) {
        try {
            String result = csvService.importItems(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Import failed: " + e.getMessage());
        }
    }

    @GetMapping("/export/items")
    public ResponseEntity<byte[]> exportItems() {
        try {
            byte[] data = csvService.exportItems();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=items.csv")
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(data);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/export/stock/{branchId}")
    public ResponseEntity<byte[]> exportStock(@PathVariable Long branchId) {
        try {
            byte[] data = csvService.exportStock(branchId);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=stock.csv")
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(data);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}