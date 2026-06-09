package com.mbitms.repository;

import com.mbitms.entity.TransferRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface TransferRequestRepository extends JpaRepository<TransferRequest, Long> {

    @Query("SELECT t FROM TransferRequest t " +
           "JOIN FETCH t.fromBranch " +
           "JOIN FETCH t.toBranch " +
           "JOIN FETCH t.item")
    List<TransferRequest> findAll();

    @Query("SELECT t FROM TransferRequest t " +
           "JOIN FETCH t.fromBranch " +
           "JOIN FETCH t.toBranch " +
           "JOIN FETCH t.item " +
           "WHERE t.fromBranch.id = :branchId")
    List<TransferRequest> findByFromBranchId(@Param("branchId") Long branchId);

    @Query("SELECT t FROM TransferRequest t " +
           "JOIN FETCH t.fromBranch " +
           "JOIN FETCH t.toBranch " +
           "JOIN FETCH t.item " +
           "WHERE t.toBranch.id = :branchId")
    List<TransferRequest> findByToBranchId(@Param("branchId") Long branchId);

    @Query("SELECT t FROM TransferRequest t " +
           "JOIN FETCH t.fromBranch " +
           "JOIN FETCH t.toBranch " +
           "JOIN FETCH t.item " +
           "WHERE t.requestedBy.id = :userId")
    List<TransferRequest> findByRequestedById(@Param("userId") Long userId);

    @Query("SELECT t FROM TransferRequest t " +
           "JOIN FETCH t.fromBranch " +
           "JOIN FETCH t.toBranch " +
           "JOIN FETCH t.item " +
           "WHERE t.status = :status")
    List<TransferRequest> findByStatus(@Param("status") String status);

    @Query("SELECT t FROM TransferRequest t " +
           "JOIN FETCH t.fromBranch " +
           "JOIN FETCH t.toBranch " +
           "JOIN FETCH t.item " +
           "WHERE t.fromBranch.id = :fromId OR t.toBranch.id = :toId")
    List<TransferRequest> findByFromBranchIdOrToBranchId(
            @Param("fromId") Long fromId,
            @Param("toId") Long toId);
}