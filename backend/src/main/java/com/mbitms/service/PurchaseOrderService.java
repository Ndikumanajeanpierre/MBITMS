package com.mbitms.service;

import com.mbitms.dto.PurchaseOrderDTO;
import com.mbitms.dto.ReceivePODTO;
import com.mbitms.entity.*;
import com.mbitms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

    private final PurchaseOrderRepository poRepository;
    private final PurchaseOrderItemRepository poItemRepository;
    private final SupplierRepository supplierRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final InventoryItemRepository itemRepository;
    private final StockLevelRepository stockLevelRepository;
    private final StockBatchRepository stockBatchRepository;
    private final AuditLogService auditLogService;

    public List<PurchaseOrder> getAllPOs() {
        return poRepository.findAll();
    }

    public List<PurchaseOrder> getPOsByBranch(Long branchId) {
        return poRepository.findByBranchId(branchId);
    }

    public PurchaseOrder getPOById(Long id) {
        return poRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase Order not found"));
    }

    @Transactional
    public PurchaseOrder createPO(PurchaseOrderDTO dto, String email) {
        Supplier supplier = supplierRepository.findById(dto.getSupplierId())
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        Branch branch = branchRepository.findById(dto.getBranchId())
                .orElseThrow(() -> new RuntimeException("Branch not found"));
        User createdBy = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        PurchaseOrder po = new PurchaseOrder();
        po.setSupplier(supplier);
        po.setBranch(branch);
        po.setCreatedBy(createdBy);
        po.setStatus("DRAFT");
        po.setCreatedAt(LocalDateTime.now());

        PurchaseOrder savedPO = poRepository.save(po);

        double totalValue = 0.0;
        for (PurchaseOrderDTO.POItemDTO itemDTO : dto.getItems()) {
            InventoryItem item = itemRepository.findById(itemDTO.getItemId())
                    .orElseThrow(() -> new RuntimeException("Item not found"));
            PurchaseOrderItem poItem = new PurchaseOrderItem();
            poItem.setPurchaseOrder(savedPO);
            poItem.setItem(item);
            poItem.setQuantity(itemDTO.getQuantity());
            poItem.setUnitCost(itemDTO.getUnitCost());
            poItemRepository.save(poItem);
            totalValue += itemDTO.getQuantity() * itemDTO.getUnitCost();
        }

        savedPO.setTotalValue(totalValue);
        poRepository.save(savedPO);

        auditLogService.log(email, "CREATE", "PurchaseOrder",
                savedPO.getId().toString(), "PO created for supplier: " + supplier.getName());

        return savedPO;
    }

    @Transactional
    public PurchaseOrder receivePO(Long poId, ReceivePODTO dto, String email) {
        PurchaseOrder po = getPOById(poId);

        for (ReceivePODTO.ReceiveItemDTO receiveItem : dto.getItems()) {
            PurchaseOrderItem poItem = poItemRepository.findById(receiveItem.getPoItemId())
                    .orElseThrow(() -> new RuntimeException("PO Item not found"));

            StockLevel stock = stockLevelRepository
                    .findByItemIdAndBranchId(poItem.getItem().getId(), po.getBranch().getId())
                    .orElseGet(() -> {
                        StockLevel s = new StockLevel();
                        s.setItem(poItem.getItem());
                        s.setBranch(po.getBranch());
                        s.setQuantity(0.0);
                        s.setReorderLevel(0.0);
                        return s;
                    });

            stock.setQuantity(stock.getQuantity() + receiveItem.getReceivedQuantity());
            stockLevelRepository.save(stock);

            StockBatch batch = new StockBatch();
            batch.setItem(poItem.getItem());
            batch.setBranch(po.getBranch());
            batch.setPurchaseOrder(po);
            batch.setBatchNumber(receiveItem.getBatchNumber());
            batch.setQuantity(receiveItem.getReceivedQuantity());
            batch.setExpiryDate(receiveItem.getExpiryDate());
            stockBatchRepository.save(batch);
        }

        po.setStatus("RECEIVED");
        auditLogService.log(email, "RECEIVE", "PurchaseOrder",
                po.getId().toString(), "PO received at branch: " + po.getBranch().getName());

        return poRepository.save(po);
    }
}