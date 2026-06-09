package com.mbitms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "approvals")
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

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public TransferRequest getTransfer() { return transfer; }
    public void setTransfer(TransferRequest transfer) { this.transfer = transfer; }
    public User getApprover() { return approver; }
    public void setApprover(User approver) { this.approver = approver; }
    public Integer getLevel() { return level; }
    public void setLevel(Integer level) { this.level = level; }
    public String getDecision() { return decision; }
    public void setDecision(String decision) { this.decision = decision; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public LocalDateTime getDecidedAt() { return decidedAt; }
    public void setDecidedAt(LocalDateTime decidedAt) { this.decidedAt = decidedAt; }
}