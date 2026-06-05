package com.mbitms.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "approvals")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Approval {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "transfer_id", nullable = false)
    private TransferRequest transfer;

    @ManyToOne
    @JoinColumn(name = "approver_id", nullable = false)
    private User approver;

    private Integer level;
    private String decision;
    private String comment;
    private LocalDateTime decidedAt;
}