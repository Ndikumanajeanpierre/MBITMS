package com.mbitms.service;

import com.mbitms.dto.ApprovalDTO;
import com.mbitms.dto.TransferRequestDTO;
import com.mbitms.entity.*;
import com.mbitms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransferService {

    private final TransferRequestRepository transferRepository;
    private final ApprovalRepository approvalRepository;
    private final InventoryItemRepository itemRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final StockLevelRepository stockLevelRepository;
    private final AuditLogService auditLogService;

    private static final Double QTY_THRESHOLD = 50.0;
    private static final Double VALUE_THRESHOLD = 500000.0;

    // Safe helper — never throws NonUniqueResultException
    private StockLevel getStockLevel(Long itemId, Long branchId) {
        List<StockLevel> levels = stockLevelRepository.findAllByItemIdAndBranchId(itemId, branchId);
        if (levels.isEmpty()) {
            throw new RuntimeException("No stock found for this item at source branch");
        }
        return levels.get(0);
    }

    public TransferRequest createTransfer(TransferRequestDTO dto, String email) {
        User requester = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        InventoryItem item = itemRepository.findById(dto.getItemId())
                .orElseThrow(() -> new RuntimeException("Item not found"));
        Branch fromBranch = branchRepository.findById(dto.getFromBranchId())
                .orElseThrow(() -> new RuntimeException("Source branch not found"));
        Branch toBranch = branchRepository.findById(dto.getToBranchId())
                .orElseThrow(() -> new RuntimeException("Destination branch not found"));

        StockLevel stock = getStockLevel(dto.getItemId(), dto.getFromBranchId());
        if (stock.getQuantity() < dto.getQuantity()) {
            throw new RuntimeException("Insufficient stock. Available: " + stock.getQuantity());
        }

        TransferRequest transfer = new TransferRequest();
        transfer.setItem(item);
        transfer.setFromBranch(fromBranch);
        transfer.setToBranch(toBranch);
        transfer.setRequestedBy(requester);
        transfer.setQuantity(dto.getQuantity());
        transfer.setReason(dto.getReason());
        transfer.setStatus("PENDING");
        transfer.setCreatedAt(LocalDateTime.now());
        transfer.setUpdatedAt(LocalDateTime.now());

        TransferRequest saved = transferRepository.save(transfer);

        auditLogService.log(
            email,
            "CREATE",
            "TransferRequest",
            saved.getId().toString(),
            "Transfer requested: " + saved.getQuantity() + "x " + item.getName() +
            " from " + fromBranch.getName() + " to " + toBranch.getName()
        );

        return saved;
    }

    public TransferRequest getTransferById(Long id) {
        return transferRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transfer not found"));
    }

    public List<TransferRequest> getAllTransfers() {
        return transferRepository.findAll();
    }

    public List<TransferRequest> getTransfersByBranch(Long branchId) {
        return transferRepository.findByFromBranchIdOrToBranchId(branchId, branchId);
    }

    public List<TransferRequest> getTransfersByStatus(String status) {
        return transferRepository.findByStatus(status);
    }

    @Transactional
    public TransferRequest approveTransfer(Long transferId, ApprovalDTO dto,
                                            String approverEmail, Integer level) {
        TransferRequest transfer = getTransferById(transferId);
        User approver = userRepository.findByEmail(approverEmail)
                .orElseThrow(() -> new RuntimeException("Approver not found"));

        Approval approval = new Approval();
        approval.setTransfer(transfer);
        approval.setApprover(approver);
        approval.setLevel(level);
        approval.setDecision(dto.getDecision());
        approval.setComment(dto.getComment());
        approval.setDecidedAt(LocalDateTime.now());
        approvalRepository.save(approval);

        if ("REJECTED".equals(dto.getDecision())) {
            transfer.setStatus("REJECTED");

            auditLogService.log(
                approverEmail,
                "REJECT",
                "TransferRequest",
                transfer.getId().toString(),
                "Transfer rejected by " + approver.getName() +
                (dto.getComment() != null ? ": " + dto.getComment() : "")
            );

        } else if ("APPROVED".equals(dto.getDecision())) {
            boolean needsL2 = transfer.getQuantity() >= QTY_THRESHOLD ||
                    (transfer.getTotalValue() != null &&
                            transfer.getTotalValue() >= VALUE_THRESHOLD);

            if (level == 1 && needsL2) {
                transfer.setStatus("L1_APPROVED");

                auditLogService.log(
                    approverEmail,
                    "APPROVE",
                    "TransferRequest",
                    transfer.getId().toString(),
                    "Transfer L1 approved by " + approver.getName() + " — escalated to Head Office"
                );

            } else {
                transfer.setStatus("APPROVED");

                auditLogService.log(
                    approverEmail,
                    "APPROVE",
                    "TransferRequest",
                    transfer.getId().toString(),
                    "Transfer fully approved by " + approver.getName()
                );
            }
        }

        transfer.setUpdatedAt(LocalDateTime.now());
        return transferRepository.save(transfer);
    }

    @Transactional
    public TransferRequest markInTransit(Long transferId, String userEmail) {
        TransferRequest transfer = getTransferById(transferId);
        if (!"APPROVED".equals(transfer.getStatus())) {
            throw new RuntimeException("Transfer must be approved before marking in transit");
        }
        transfer.setStatus("IN_TRANSIT");
        transfer.setUpdatedAt(LocalDateTime.now());
        TransferRequest saved = transferRepository.save(transfer);

        auditLogService.log(
            userEmail,
            "UPDATE",
            "TransferRequest",
            saved.getId().toString(),
            "Transfer marked as IN_TRANSIT"
        );

        return saved;
    }

    @Transactional
    public TransferRequest markReceived(Long transferId, String userEmail) {
        TransferRequest transfer = getTransferById(transferId);
        if (!"IN_TRANSIT".equals(transfer.getStatus())) {
            throw new RuntimeException("Transfer must be in transit before receiving");
        }

        StockLevel fromStock = getStockLevel(
                transfer.getItem().getId(),
                transfer.getFromBranch().getId());

        fromStock.setQuantity(fromStock.getQuantity() - transfer.getQuantity());
        stockLevelRepository.save(fromStock);

        List<StockLevel> toStockList = stockLevelRepository
                .findAllByItemIdAndBranchId(
                        transfer.getItem().getId(),
                        transfer.getToBranch().getId());

        StockLevel toStock = toStockList.isEmpty() ? null : toStockList.get(0);
        if (toStock == null) {
            toStock = new StockLevel();
            toStock.setItem(transfer.getItem());
            toStock.setBranch(transfer.getToBranch());
            toStock.setQuantity(0.0);
            toStock.setReorderLevel(0.0);
        }

        toStock.setQuantity(toStock.getQuantity() + transfer.getQuantity());
        stockLevelRepository.save(toStock);

        transfer.setStatus("COMPLETED");
        transfer.setUpdatedAt(LocalDateTime.now());
        TransferRequest saved = transferRepository.save(transfer);

        auditLogService.log(
            userEmail,
            "RECEIVE",
            "TransferRequest",
            saved.getId().toString(),
            "Transfer completed — " + saved.getQuantity() + "x " + saved.getItem().getName() +
            " received at " + saved.getToBranch().getName()
        );

        return saved;
    }
}