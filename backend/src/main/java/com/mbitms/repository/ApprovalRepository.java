package com.mbitms.repository;

import com.mbitms.entity.Approval;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ApprovalRepository extends JpaRepository<Approval, Long> {
    List<Approval> findByTransferId(Long transferId);
    List<Approval> findByApproverId(Long approverId);
}