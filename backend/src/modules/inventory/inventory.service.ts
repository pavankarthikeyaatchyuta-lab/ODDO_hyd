import { prisma } from '../../core/database/prisma';
import { BadRequestError, NotFoundError } from '../../core/errors/app-error';
import { logger } from '../../core/logger/logger';
import { 
  MovementType, 
  AdjustmentReasonCode,
  StockStatus 
} from '../../types/shared';

export class InventoryEngineService {
  /**
   * Helper to format a complete location hierarchy path:
   * e.g. "WH-MAIN > Bulk Storage > Rack 01 > Shelf 02 > Bin 05"
   */
  static async getBinPath(binId: string, tx: any = prisma): Promise<{ path: string; warehouseId: string; warehouseName: string }> {
    const bin = await tx.bin.findUnique({
      where: { id: binId },
      include: {
        shelf: {
          include: {
            rack: {
              include: {
                zone: {
                  include: {
                    warehouse: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!bin) {
      throw new NotFoundError(`Location bin not found: ${binId}`);
    }

    const wh = bin.shelf.rack.zone.warehouse;
    const path = `${wh.code} > ${bin.shelf.rack.zone.name} > ${bin.shelf.rack.code} > ${bin.shelf.code} > ${bin.code}`;
    return {
      path,
      warehouseId: wh.id,
      warehouseName: wh.name,
    };
  }

  /**
   * Computes stock status given current quantity and product minimum threshold
   */
  static computeStockStatus(currentQty: number, minStock: number): StockStatus {
    if (currentQty <= 0) return 'OUT_OF_STOCK';
    if (currentQty <= minStock) return 'LOW_STOCK';
    return 'IN_STOCK';
  }

  /**
   * 1. RECEIPTS: Validate incoming shipment and increase stock
   * Formula: Existing Stock + Received Quantity = New Stock
   */
  static async executeReceiptValidation(receiptId: string, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const receipt = await tx.receipt.findUnique({
        where: { id: receiptId },
        include: {
          supplier: true,
          warehouse: true,
          items: {
            include: {
              product: true,
              bin: true,
            },
          },
        },
      });

      if (!receipt) {
        throw new NotFoundError(`Receipt not found: ${receiptId}`);
      }

      if (receipt.status === 'DONE' || receipt.status === 'VALIDATED') {
        throw new BadRequestError(`Receipt ${receipt.receiptNumber} has already been validated.`);
      }

      if (receipt.status === 'CANCELLED') {
        throw new BadRequestError(`Cannot validate cancelled receipt ${receipt.receiptNumber}.`);
      }

      if (receipt.items.length === 0) {
        throw new BadRequestError(`Receipt ${receipt.receiptNumber} contains no items.`);
      }

      for (const item of receipt.items) {
        if (item.quantityReceived <= 0) {
          throw new BadRequestError(`Received quantity for ${item.product.name} must be greater than 0.`);
        }

        const binInfo = await this.getBinPath(item.binId, tx);

        // Fetch or create stock balance record
        let balance = await tx.stockBalance.findUnique({
          where: {
            productId_binId: {
              productId: item.productId,
              binId: item.binId,
            },
          },
        });

        const qtyBefore = balance ? balance.physicalQty : 0.0;
        const qtyAfter = qtyBefore + item.quantityReceived;

        if (balance) {
          await tx.stockBalance.update({
            where: { id: balance.id },
            data: { physicalQty: qtyAfter },
          });
        } else {
          balance = await tx.stockBalance.create({
            data: {
              productId: item.productId,
              binId: item.binId,
              physicalQty: qtyAfter,
            },
          });
        }

        // Record immutable ledger entry
        await tx.stockLedger.create({
          data: {
            productId: item.productId,
            sku: item.product.sku,
            warehouseId: receipt.warehouseId || binInfo.warehouseId,
            binId: item.binId,
            movementType: 'RECEIPT',
            quantity: item.quantityReceived,
            qtyBefore,
            qtyAfter,
            referenceDocType: 'RECEIPT',
            referenceDocId: receipt.id,
            referenceDocNumber: receipt.receiptNumber,
            sourceLocation: receipt.supplier ? receipt.supplier.name : 'External Supplier',
            destLocation: binInfo.path,
            performedById: userId,
            reason: receipt.notes || 'Inbound goods receipt validated',
          },
        });
      }

      // Mark receipt validated & done
      const updatedReceipt = await tx.receipt.update({
        where: { id: receipt.id },
        data: {
          status: 'DONE',
          validatedAt: new Date(),
          receivedAt: receipt.receivedAt || new Date(),
        },
        include: {
          supplier: true,
          warehouse: true,
          items: {
            include: {
              product: true,
              bin: true,
            },
          },
        },
      });

      logger.info(`[INVENTORY ENGINE] Receipt ${receipt.receiptNumber} validated by User ${userId}`);
      return updatedReceipt;
    }, { maxWait: 15000, timeout: 30000 });
  }

  /**
   * 2. DELIVERY ORDERS: Validate outbound shipment and decrease stock
   * Formula: Existing Stock - Delivered Quantity = New Stock
   * Fails if any item exceeds available stock.
   */
  static async executeDeliveryValidation(deliveryOrderId: string, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const deliveryOrder = await tx.deliveryOrder.findUnique({
        where: { id: deliveryOrderId },
        include: {
          warehouse: true,
          items: {
            include: {
              product: true,
              bin: true,
            },
          },
        },
      });

      if (!deliveryOrder) {
        throw new NotFoundError(`Delivery order not found: ${deliveryOrderId}`);
      }

      if (deliveryOrder.status === 'DONE' || deliveryOrder.status === 'VALIDATED') {
        throw new BadRequestError(`Delivery order ${deliveryOrder.doNumber} has already been validated.`);
      }

      if (deliveryOrder.status === 'CANCELLED') {
        throw new BadRequestError(`Cannot validate cancelled delivery order ${deliveryOrder.doNumber}.`);
      }

      if (deliveryOrder.items.length === 0) {
        throw new BadRequestError(`Delivery order ${deliveryOrder.doNumber} contains no items.`);
      }

      // Pre-validation pass: Check stock availability for ALL items first
      for (const item of deliveryOrder.items) {
        if (item.quantityDemanded <= 0) {
          throw new BadRequestError(`Demanded quantity for ${item.product.name} must be greater than 0.`);
        }

        const balance = await tx.stockBalance.findUnique({
          where: {
            productId_binId: {
              productId: item.productId,
              binId: item.binId,
            },
          },
        });

        const available = balance ? balance.physicalQty : 0.0;
        if (available < item.quantityDemanded) {
          const binInfo = await this.getBinPath(item.binId, tx);
          throw new BadRequestError(
            `Insufficient stock for product "${item.product.name}" (${item.product.sku}) at location [${binInfo.path}]. Available: ${available} ${item.product.uom}, Demanded: ${item.quantityDemanded} ${item.product.uom}.`
          );
        }
      }

      // Stock deduction & ledger creation pass
      for (const item of deliveryOrder.items) {
        const balance = await tx.stockBalance.findUnique({
          where: {
            productId_binId: {
              productId: item.productId,
              binId: item.binId,
            },
          },
        });

        const qtyBefore = balance!.physicalQty;
        const qtyAfter = qtyBefore - item.quantityDemanded;
        const binInfo = await this.getBinPath(item.binId, tx);

        await tx.stockBalance.update({
          where: { id: balance!.id },
          data: { physicalQty: qtyAfter },
        });

        await tx.deliveryOrderItem.update({
          where: { id: item.id },
          data: { quantityPicked: item.quantityDemanded },
        });

        await tx.stockLedger.create({
          data: {
            productId: item.productId,
            sku: item.product.sku,
            warehouseId: deliveryOrder.warehouseId || binInfo.warehouseId,
            binId: item.binId,
            movementType: 'DELIVERY',
            quantity: -item.quantityDemanded, // Negative for outflow
            qtyBefore,
            qtyAfter,
            referenceDocType: 'DELIVERY_ORDER',
            referenceDocId: deliveryOrder.id,
            referenceDocNumber: deliveryOrder.doNumber,
            sourceLocation: binInfo.path,
            destLocation: deliveryOrder.customerName,
            performedById: userId,
            reason: deliveryOrder.notes || 'Outbound customer delivery validated',
          },
        });

        // Trigger notification if product falls below minimum stock
        if (qtyAfter <= item.product.minStock) {
          await tx.notification.create({
            data: {
              title: qtyAfter === 0 ? 'Out of Stock Alert' : 'Low Stock Warning',
              message: `Product ${item.product.name} (${item.product.sku}) stock dropped to ${qtyAfter} ${item.product.uom} (Min: ${item.product.minStock}).`,
              severity: qtyAfter === 0 ? 'CRITICAL' : 'WARNING',
              linkUrl: `/products`,
            },
          });
        }
      }

      const updatedDO = await tx.deliveryOrder.update({
        where: { id: deliveryOrder.id },
        data: {
          status: 'DONE',
          dispatchedAt: new Date(),
        },
        include: {
          warehouse: true,
          items: {
            include: {
              product: true,
              bin: true,
            },
          },
        },
      });

      logger.info(`[INVENTORY ENGINE] Delivery Order ${deliveryOrder.doNumber} validated by User ${userId}`);
      return updatedDO;
    }, { maxWait: 15000, timeout: 30000 });
  }

  /**
   * 3. INTERNAL TRANSFERS: Move stock between internal locations
   * Total company stock remains unchanged (delta = 0).
   * Source stock decreases, Destination stock increases.
   */
  static async executeTransferCompletion(transferId: string, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const transfer = await tx.transfer.findUnique({
        where: { id: transferId },
        include: {
          sourceWarehouse: true,
          destWarehouse: true,
          items: {
            include: {
              product: true,
              sourceBin: true,
              destBin: true,
            },
          },
        },
      });

      if (!transfer) {
        throw new NotFoundError(`Transfer not found: ${transferId}`);
      }

      if (transfer.status === 'DONE' || transfer.status === 'COMPLETED') {
        throw new BadRequestError(`Transfer ${transfer.transferNumber} has already been completed.`);
      }

      if (transfer.status === 'CANCELLED') {
        throw new BadRequestError(`Cannot complete cancelled transfer ${transfer.transferNumber}.`);
      }

      if (transfer.items.length === 0) {
        throw new BadRequestError(`Transfer ${transfer.transferNumber} contains no items.`);
      }

      // Check stock availability in source location
      for (const item of transfer.items) {
        if (item.sourceBinId === item.destBinId) {
          throw new BadRequestError(`Source and destination locations cannot be identical for ${item.product.name}.`);
        }

        if (item.quantity <= 0) {
          throw new BadRequestError(`Transfer quantity for ${item.product.name} must be greater than 0.`);
        }

        const srcBalance = await tx.stockBalance.findUnique({
          where: {
            productId_binId: {
              productId: item.productId,
              binId: item.sourceBinId,
            },
          },
        });

        const available = srcBalance ? srcBalance.physicalQty : 0.0;
        if (available < item.quantity) {
          const srcInfo = await this.getBinPath(item.sourceBinId, tx);
          throw new BadRequestError(
            `Insufficient stock to transfer "${item.product.name}" from [${srcInfo.path}]. Available: ${available} ${item.product.uom}, Requested: ${item.quantity} ${item.product.uom}.`
          );
        }
      }

      // Execute transfers
      for (const item of transfer.items) {
        const srcInfo = await this.getBinPath(item.sourceBinId, tx);
        const destInfo = await this.getBinPath(item.destBinId, tx);

        // 1. Deduct from source bin
        const srcBalance = await tx.stockBalance.findUnique({
          where: {
            productId_binId: {
              productId: item.productId,
              binId: item.sourceBinId,
            },
          },
        });

        const srcBefore = srcBalance!.physicalQty;
        const srcAfter = srcBefore - item.quantity;

        await tx.stockBalance.update({
          where: { id: srcBalance!.id },
          data: { physicalQty: srcAfter },
        });

        // 2. Add to destination bin
        let destBalance = await tx.stockBalance.findUnique({
          where: {
            productId_binId: {
              productId: item.productId,
              binId: item.destBinId,
            },
          },
        });

        const destBefore = destBalance ? destBalance.physicalQty : 0.0;
        const destAfter = destBefore + item.quantity;

        if (destBalance) {
          await tx.stockBalance.update({
            where: { id: destBalance.id },
            data: { physicalQty: destAfter },
          });
        } else {
          await tx.stockBalance.create({
            data: {
              productId: item.productId,
              binId: item.destBinId,
              physicalQty: destAfter,
            },
          });
        }

        // 3. Immutable ledger records: Outbound leg
        await tx.stockLedger.create({
          data: {
            productId: item.productId,
            sku: item.product.sku,
            warehouseId: srcInfo.warehouseId,
            binId: item.sourceBinId,
            movementType: 'INTERNAL_TRANSFER',
            quantity: -item.quantity,
            qtyBefore: srcBefore,
            qtyAfter: srcAfter,
            referenceDocType: 'INTERNAL_TRANSFER',
            referenceDocId: transfer.id,
            referenceDocNumber: transfer.transferNumber,
            sourceLocation: srcInfo.path,
            destLocation: destInfo.path,
            performedById: userId,
            reason: `Transfer outbound -> ${destInfo.path}`,
          },
        });

        // 4. Immutable ledger records: Inbound leg
        await tx.stockLedger.create({
          data: {
            productId: item.productId,
            sku: item.product.sku,
            warehouseId: destInfo.warehouseId,
            binId: item.destBinId,
            movementType: 'INTERNAL_TRANSFER',
            quantity: item.quantity,
            qtyBefore: destBefore,
            qtyAfter: destAfter,
            referenceDocType: 'INTERNAL_TRANSFER',
            referenceDocId: transfer.id,
            referenceDocNumber: transfer.transferNumber,
            sourceLocation: srcInfo.path,
            destLocation: destInfo.path,
            performedById: userId,
            reason: `Transfer inbound <- ${srcInfo.path}`,
          },
        });
      }

      const updatedTransfer = await tx.transfer.update({
        where: { id: transfer.id },
        data: {
          status: 'DONE',
          completedAt: new Date(),
        },
        include: {
          sourceWarehouse: true,
          destWarehouse: true,
          items: {
            include: {
              product: true,
              sourceBin: true,
              destBin: true,
            },
          },
        },
      });

      logger.info(`[INVENTORY ENGINE] Internal Transfer ${transfer.transferNumber} completed by User ${userId}`);
      return updatedTransfer;
    }, { maxWait: 15000, timeout: 30000 });
  }

  /**
   * 4. STOCK ADJUSTMENTS: Reconcile physical inventory discrepancies
   * Difference = Physical Count - Recorded Stock
   * New Stock = Recorded Stock + Difference
   */
  static async executeStockAdjustment(dto: {
    productId: string;
    binId: string;
    countedQty: number;
    reasonCode: AdjustmentReasonCode;
    notes?: string;
    userId: string;
  }) {
    if (dto.countedQty < 0) {
      throw new BadRequestError('Physical counted quantity cannot be negative.');
    }

    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: dto.productId },
      });

      if (!product) {
        throw new NotFoundError(`Product not found: ${dto.productId}`);
      }

      const binInfo = await this.getBinPath(dto.binId, tx);

      let balance = await tx.stockBalance.findUnique({
        where: {
          productId_binId: {
            productId: dto.productId,
            binId: dto.binId,
          },
        },
      });

      const recordedQty = balance ? balance.physicalQty : 0.0;
      const differenceQty = dto.countedQty - recordedQty;
      const countedQty = dto.countedQty;

      // Update or create stock balance
      if (balance) {
        await tx.stockBalance.update({
          where: { id: balance.id },
          data: { physicalQty: countedQty },
        });
      } else {
        balance = await tx.stockBalance.create({
          data: {
            productId: dto.productId,
            binId: dto.binId,
            physicalQty: countedQty,
          },
        });
      }

      // Generate unique adjustment number
      const adjustmentNumber = `ADJ-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

      // Create StockAdjustment record
      const adjustment = await tx.stockAdjustment.create({
        data: {
          adjustmentNumber,
          productId: dto.productId,
          binId: dto.binId,
          warehouseId: binInfo.warehouseId,
          recordedQty,
          countedQty,
          differenceQty,
          reasonCode: dto.reasonCode,
          notes: dto.notes,
          adjustedById: dto.userId,
        },
      });

      // Write to immutable Stock Ledger
      await tx.stockLedger.create({
        data: {
          productId: dto.productId,
          sku: product.sku,
          warehouseId: binInfo.warehouseId,
          binId: dto.binId,
          movementType: 'ADJUSTMENT',
          quantity: differenceQty,
          qtyBefore: recordedQty,
          qtyAfter: countedQty,
          referenceDocType: 'STOCK_ADJUSTMENT',
          referenceDocId: adjustment.id,
          referenceDocNumber: adjustment.adjustmentNumber,
          sourceLocation: binInfo.path,
          performedById: dto.userId,
          reason: `${dto.reasonCode}${dto.notes ? ': ' + dto.notes : ''}`,
        },
      });

      logger.info(`[INVENTORY ENGINE] Adjustment ${adjustmentNumber} executed for ${product.sku} (Diff: ${differenceQty}) by User ${dto.userId}`);

      return {
        ...adjustment,
        productName: product.name,
        productSku: product.sku,
        uom: product.uom,
        binPath: binInfo.path,
        warehouseName: binInfo.warehouseName,
      };
    }, { maxWait: 15000, timeout: 30000 });
  }
}
