package com.mbitms.repository;

import com.mbitms.entity.TransferRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TransferRequestRepository extends JpaRepository<TransferRequest, Long> {
    List<TransferRequest> findByFromBranchId(Long branchId);
    List<TransferRequest> findByToBranchId(Long branchId);
    List<TransferRequest> findByRequestedById(Long userId);
    List<TransferRequest> findByStatus(String status);
    List<TransferRequest> findByFromBranchIdOrToBranchId(Long fromId, Long toId);
}