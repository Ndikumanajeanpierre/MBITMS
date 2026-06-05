package com.mbitms.dto;

import lombok.Data;

@Data
public class TransferRequestDTO {
    private Long itemId;
    private Long fromBranchId;
    private Long toBranchId;
    private Double quantity;
    private String reason;
}