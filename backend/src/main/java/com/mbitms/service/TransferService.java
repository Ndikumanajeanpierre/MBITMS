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

    // Thresholds for L2 approval
    private static final Double QTY_THRESHOLD = 50.0;
    private static final Double VALUE_THRESHOLD = 500000.0;

    public TransferRequest createTransfer(TransferRequestDTO dto, String email) {
        User requester = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        InventoryItem item = itemRepository.findById(dto.getItemId())
                .orElseThrow(() -> new RuntimeException("Item not found"));
        Branch fromBranch = branchRepository.findById(dto.getFromBranchId())
                .orElseThrow(() -> new RuntimeException("Source branch not found"));
        Branch toBranch = branchRepository.findById(dto.getToBranchId())
                .orElseThrow(() -> new RuntimeException("Destination branch not found"));

        // Check stock availability
        StockLevel stock = stockLevelRepository
                .findByItemIdAndBranchId(dto.getItemId(), dto.getFromBranchId())
                .orElseThrow(() -> new RuntimeException("No stock found for this item at source branch"));

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

        return transferRepository.save(transfer);
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
        } else if ("APPROVED".equals(dto.getDecision())) {
            boolean needsL2 = transfer.getQuantity() >= QTY_THRESHOLD ||
                    (transfer.getTotalValue() != null &&
                            transfer.getTotalValue() >= VALUE_THRESHOLD);

            if (level == 1 && needsL2) {
                transfer.setStatus("L1_APPROVED");
            } else {
                transfer.setStatus("APPROVED");
            }
        }

        transfer.setUpdatedAt(LocalDateTime.now());
        return transferRepository.save(transfer);
    }

    @Transactional
    public TransferRequest markInTransit(Long transferId) {
        TransferRequest transfer = getTransferById(transferId);
        if (!"APPROVED".equals(transfer.getStatus())) {
            throw new RuntimeException("Transfer must be approved before marking in transit");
        }
        transfer.setStatus("IN_TRANSIT");
        transfer.setUpdatedAt(LocalDateTime.now());
        return transferRepository.save(transfer);
    }

    @Transactional
    public TransferRequest markReceived(Long transferId) {
        TransferRequest transfer = getTransferById(transferId);
        if (!"IN_TRANSIT".equals(transfer.getStatus())) {
            throw new RuntimeException("Transfer must be in transit before receiving");
        }

        // Update stock levels
        StockLevel fromStock = stockLevelRepository
                .findByItemIdAndBranchId(
                        transfer.getItem().getId(),
                        transfer.getFromBranch().getId())
                .orElseThrow(() -> new RuntimeException("Source stock not found"));

        fromStock.setQuantity(fromStock.getQuantity() - transfer.getQuantity());
        stockLevelRepository.save(fromStock);

        StockLevel toStock = stockLevelRepository
                .findByItemIdAndBranchId(
                        transfer.getItem().getId(),
                       transfer.getToBranch().getId())
                .orElseGet(() -> {
                    StockLevel s = new StockLevel();
                    s.setItem(transfer.getItem());
                    s.setBranch(transfer.getToBranch());
                    s.setQuantity(0.0);
                    s.setReorderLevel(0.0);
                    return s;
                });

        toStock.setQuantity(toStock.getQuantity() + transfer.getQuantity());
        stockLevelRepository.save(toStock);

        transfer.setStatus("COMPLETED");
        transfer.setUpdatedAt(LocalDateTime.now());
        return transferRepository.save(transfer);
    }
}