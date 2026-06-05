package com.mbitms.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class ReceivePODTO {
    private List<ReceiveItemDTO> items;

    @Data
    public static class ReceiveItemDTO {
        private Long poItemId;
        private Double receivedQuantity;
        private String batchNumber;
        private LocalDate expiryDate;
    }
}