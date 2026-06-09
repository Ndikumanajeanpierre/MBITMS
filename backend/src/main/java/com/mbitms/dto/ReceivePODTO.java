package com.mbitms.dto;

import java.time.LocalDate;
import java.util.List;

public class ReceivePODTO {
    private List<ReceiveItemDTO> items;

    public List<ReceiveItemDTO> getItems() { return items; }
    public void setItems(List<ReceiveItemDTO> items) { this.items = items; }

    public static class ReceiveItemDTO {
        private Long poItemId;
        private Double receivedQuantity;
        private String batchNumber;
        private LocalDate expiryDate;

        public Long getPoItemId() { return poItemId; }
        public void setPoItemId(Long poItemId) { this.poItemId = poItemId; }
        public Double getReceivedQuantity() { return receivedQuantity; }
        public void setReceivedQuantity(Double receivedQuantity) { this.receivedQuantity = receivedQuantity; }
        public String getBatchNumber() { return batchNumber; }
        public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }
        public LocalDate getExpiryDate() { return expiryDate; }
        public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }
    }
}