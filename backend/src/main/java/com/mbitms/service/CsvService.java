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

import java.io.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CsvService {

    private final InventoryItemRepository itemRepository;
    private final StockLevelRepository stockLevelRepository;
    private final BranchRepository branchRepository;

    public String importItems(MultipartFile file) throws IOException {
        BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream()));
        String line;
        int imported = 0;
        int skipped = 0;
        reader.readLine(); // skip header
        while ((line = reader.readLine()) != null) {
            String[] fields = line.split(",");
            if (fields.length < 4) continue;
            String code = fields[0].trim();
            if (itemRepository.existsByCode(code)) {
                skipped++;
                continue;
            }
            InventoryItem item = new InventoryItem();
            item.setCode(code);
            item.setName(fields[1].trim());
            item.setCategory(fields[2].trim());
            item.setUnit(fields[3].trim());
            item.setActive(true);
            itemRepository.save(item);
            imported++;
        }
        return imported + " items imported, " + skipped + " skipped (duplicate codes)";
    }

    public byte[] exportItems() throws IOException {
        List<InventoryItem> items = itemRepository.findByActiveTrue();
        StringWriter writer = new StringWriter();
        writer.write("code,name,category,unit\n");
        for (InventoryItem item : items) {
            writer.write(String.format("%s,%s,%s,%s\n",
                    item.getCode(),
                    item.getName(),
                    item.getCategory() != null ? item.getCategory() : "",
                    item.getUnit() != null ? item.getUnit() : ""));
        }
        return writer.toString().getBytes();
    }

    public byte[] exportStock(Long branchId) throws IOException {
        List<StockLevel> levels = stockLevelRepository.findByBranchId(branchId);
        StringWriter writer = new StringWriter();
        writer.write("item_code,item_name,category,quantity,reorder_level\n");
        for (StockLevel s : levels) {
            writer.write(String.format("%s,%s,%s,%s,%s\n",
                    s.getItem().getCode(),
                    s.getItem().getName(),
                    s.getItem().getCategory() != null ? s.getItem().getCategory() : "",
                    s.getQuantity(),
                    s.getReorderLevel()));
        }
        return writer.toString().getBytes();
    }
}