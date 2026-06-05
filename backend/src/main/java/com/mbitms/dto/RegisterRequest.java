package com.mbitms.dto;

import com.mbitms.enums.Role;
import lombok.Data;

@Data
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private Role role;
    private Long branchId;
}