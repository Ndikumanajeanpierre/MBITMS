package com.mbitms.dto;

public class TransferRequestDTO {
    private Long itemId;
    private Long fromBranchId;
    private Long toBranchId;
    private Double quantity;
    private String reason;

    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public Long getFromBranchId() { return fromBranchId; }
    public void setFromBranchId(Long fromBranchId) { this.fromBranchId = fromBranchId; }
    public Long getToBranchId() { return toBranchId; }
    public void setToBranchId(Long toBranchId) { this.toBranchId = toBranchId; }
    public Double getQuantity() { return quantity; }
    public void setQuantity(Double quantity) { this.quantity = quantity; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}