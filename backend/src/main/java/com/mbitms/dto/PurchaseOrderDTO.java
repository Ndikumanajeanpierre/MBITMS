package com.mbitms.dto;

import lombok.Data;
import java.util.List;

@Data
public class PurchaseOrderDTO {
    private Long supplierId;
    private Long branchId;
    private List<POItemDTO> items;

    @Data
    public static class POItemDTO {
        private Long itemId;
        private Double quantity;
        private Double unitCost;
    }
}