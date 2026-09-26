import { prisma } from '../../core/database/prisma';
import { NotFoundError, BadRequestError, ConflictError } from '../../core/errors/app-error';
import { InventoryEngineService } from '../inventory/inventory.service';

export class OperationsService {
  // ==========================================
  // 1. RECEIPTS
  // ==========================================

  static async listReceipts(params: {
    status?: string;
    warehouseId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.warehouseId) where.warehouseId = params.warehouseId;
    if (params.search) {
      where.OR = [
        { receiptNumber: { contains: params.search, mode: 'insensitive' } },
        { supplier: { name: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const [items, totalCount] = await Promise.all([
      prisma.receipt.findMany({
        where,
        include: {
          supplier: true,
          warehouse: true,
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true, uom: true } },
              bin: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.receipt.count({ where }),
    ]);

    return {
      items: items.map((r) => ({
        id: r.id,
        receiptNumber: r.receiptNumber,
        supplierId: r.supplierId,
        supplierName: r.supplier?.name || 'N/A',
        warehouseId: r.warehouseId,
        warehouseName: r.warehouse?.name || 'N/A',
        status: r.status,
        receivedAt: r.receivedAt?.toISOString() || null,
        validatedAt: r.validatedAt?.toISOString() || null,
        notes: r.notes,
        createdAt: r.createdAt.toISOString(),
        itemCount: r.items.length,
        totalQuantity: r.items.reduce((sum, item) => sum + item.quantityReceived, 0),
      })),
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }

  static async getReceiptById(id: string) {
    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: {
        supplier: true,
        warehouse: true,
        items: {
          include: {
            product: true,
            bin: {
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
            },
          },
        },
      },
    });

    if (!receipt) {
      throw new NotFoundError(`Receipt not found with ID: ${id}`);
    }

    return {
      id: receipt.id,
      receiptNumber: receipt.receiptNumber,
      supplierId: receipt.supplierId,
      supplierName: receipt.supplier?.name || null,
      warehouseId: receipt.warehouseId,
      warehouseName: receipt.warehouse?.name || null,
      status: receipt.status,
      receivedAt: receipt.receivedAt?.toISOString() || null,
      validatedAt: receipt.validatedAt?.toISOString() || null,
      notes: receipt.notes,
      createdAt: receipt.createdAt.toISOString(),
      items: receipt.items.map((i) => {
        const wh = i.bin.shelf.rack.zone.warehouse;
        const binPath = `${wh.code} > ${i.bin.shelf.rack.zone.name} > ${i.bin.shelf.rack.code} > ${i.bin.shelf.code} > ${i.bin.code}`;
        return {
          id: i.id,
          productId: i.productId,
          productName: i.product.name,
          productSku: i.product.sku,
          uom: i.product.uom,
          binId: i.binId,
          binPath,
          quantityReceived: i.quantityReceived,
        };
      }),
    };
  }

  static async createReceipt(dto: {
    supplierId?: string;
    warehouseId?: string;
    notes?: string;
    items: Array<{ productId: string; binId: string; quantityReceived: number }>;
  }) {
    const receiptNumber = `REC-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    return await prisma.receipt.create({
      data: {
        receiptNumber,
        supplierId: dto.supplierId,
        warehouseId: dto.warehouseId,
        notes: dto.notes,
        status: 'DRAFT',
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            binId: item.binId,
            quantityReceived: item.quantityReceived,
          })),
        },
      },
      include: {
        items: true,
      },
    });
  }

  static async updateReceiptStatus(id: string, status: 'READY' | 'CANCELLED') {
    const receipt = await prisma.receipt.findUnique({ where: { id } });
    if (!receipt) throw new NotFoundError('Receipt not found');
    if (receipt.status === 'DONE' || receipt.status === 'VALIDATED') {
      throw new BadRequestError('Cannot change status of a completed/validated receipt');
    }

    return await prisma.receipt.update({
      where: { id },
      data: { status },
    });
  }

  static async validateReceipt(id: string, userId: string) {
    return await InventoryEngineService.executeReceiptValidation(id, userId);
  }

  // ==========================================
  // 2. DELIVERY ORDERS
  // ==========================================

  static async listDeliveries(params: {
    status?: string;
    warehouseId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.warehouseId) where.warehouseId = params.warehouseId;
    if (params.search) {
      where.OR = [
        { doNumber: { contains: params.search, mode: 'insensitive' } },
        { customerName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [items, totalCount] = await Promise.all([
      prisma.deliveryOrder.findMany({
        where,
        include: {
          warehouse: true,
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true, uom: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.deliveryOrder.count({ where }),
    ]);

    return {
      items: items.map((d) => ({
        id: d.id,
        doNumber: d.doNumber,
        customerName: d.customerName,
        warehouseId: d.warehouseId,
        warehouseName: d.warehouse?.name || 'N/A',
        status: d.status,
        dispatchedAt: d.dispatchedAt?.toISOString() || null,
        notes: d.notes,
        createdAt: d.createdAt.toISOString(),
        itemCount: d.items.length,
        totalQuantity: d.items.reduce((sum, item) => sum + item.quantityDemanded, 0),
      })),
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }

  static async getDeliveryById(id: string) {
    const delivery = await prisma.deliveryOrder.findUnique({
      where: { id },
      include: {
        warehouse: true,
        items: {
          include: {
            product: true,
            bin: {
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
            },
          },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundError(`Delivery order not found with ID: ${id}`);
    }

    // Include real-time available stock in bin for each item
    const formattedItems = await Promise.all(
      delivery.items.map(async (i) => {
        const wh = i.bin.shelf.rack.zone.warehouse;
        const binPath = `${wh.code} > ${i.bin.shelf.rack.zone.name} > ${i.bin.shelf.rack.code} > ${i.bin.shelf.code} > ${i.bin.code}`;
        const bal = await prisma.stockBalance.findUnique({
          where: {
            productId_binId: {
              productId: i.productId,
              binId: i.binId,
            },
          },
        });

        return {
          id: i.id,
          productId: i.productId,
          productName: i.product.name,
          productSku: i.product.sku,
          uom: i.product.uom,
          binId: i.binId,
          binPath,
          quantityDemanded: i.quantityDemanded,
          quantityPicked: i.quantityPicked,
          availableStock: bal ? bal.physicalQty : 0,
        };
      })
    );

    return {
      id: delivery.id,
      doNumber: delivery.doNumber,
      customerName: delivery.customerName,
      warehouseId: delivery.warehouseId,
      warehouseName: delivery.warehouse?.name || null,
      status: delivery.status,
      dispatchedAt: delivery.dispatchedAt?.toISOString() || null,
      notes: delivery.notes,
      createdAt: delivery.createdAt.toISOString(),
      items: formattedItems,
    };
  }

  static async createDelivery(dto: {
    customerName: string;
    warehouseId?: string;
    notes?: string;
    items: Array<{ productId: string; binId: string; quantityDemanded: number }>;
  }) {
    const doNumber = `DO-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    return await prisma.deliveryOrder.create({
      data: {
        doNumber,
        customerName: dto.customerName.trim(),
        warehouseId: dto.warehouseId,
        notes: dto.notes,
        status: 'DRAFT',
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            binId: item.binId,
            quantityDemanded: item.quantityDemanded,
          })),
        },
      },
      include: {
        items: true,
      },
    });
  }

  static async updateDeliveryStatus(id: string, status: 'READY' | 'PICKING' | 'PACKED' | 'CANCELLED') {
    const delivery = await prisma.deliveryOrder.findUnique({ where: { id } });
    if (!delivery) throw new NotFoundError('Delivery order not found');
    if (delivery.status === 'DONE' || delivery.status === 'VALIDATED') {
      throw new BadRequestError('Cannot change status of a completed/dispatched delivery order');
    }

    return await prisma.deliveryOrder.update({
      where: { id },
      data: { status },
    });
  }

  static async validateDelivery(id: string, userId: string) {
    return await InventoryEngineService.executeDeliveryValidation(id, userId);
  }

  // ==========================================
  // 3. INTERNAL TRANSFERS
  // ==========================================

  static async listTransfers(params: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status) where.status = params.status;
    if (params.search) {
      where.transferNumber = { contains: params.search, mode: 'insensitive' };
    }

    const [items, totalCount] = await Promise.all([
      prisma.transfer.findMany({
        where,
        include: {
          sourceWarehouse: true,
          destWarehouse: true,
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true, uom: true } },
            },
          },
        },
        orderBy: { initiatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transfer.count({ where }),
    ]);

    return {
      items: items.map((t) => ({
        id: t.id,
        transferNumber: t.transferNumber,
        sourceWarehouseId: t.sourceWarehouseId,
        sourceWarehouseName: t.sourceWarehouse?.name || 'N/A',
        destWarehouseId: t.destWarehouseId,
        destWarehouseName: t.destWarehouse?.name || 'N/A',
        status: t.status,
        initiatedAt: t.initiatedAt.toISOString(),
        completedAt: t.completedAt?.toISOString() || null,
        notes: t.notes,
        itemCount: t.items.length,
        totalQuantity: t.items.reduce((sum, i) => sum + i.quantity, 0),
      })),
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }

  static async getTransferById(id: string) {
    const transfer = await prisma.transfer.findUnique({
      where: { id },
      include: {
        sourceWarehouse: true,
        destWarehouse: true,
        items: {
          include: {
            product: true,
            sourceBin: {
              include: {
                shelf: { include: { rack: { include: { zone: { include: { warehouse: true } } } } } },
              },
            },
            destBin: {
              include: {
                shelf: { include: { rack: { include: { zone: { include: { warehouse: true } } } } } },
              },
            },
          },
        },
      },
    });

    if (!transfer) {
      throw new NotFoundError(`Transfer not found with ID: ${id}`);
    }

    return {
      id: transfer.id,
      transferNumber: transfer.transferNumber,
      sourceWarehouseId: transfer.sourceWarehouseId,
      sourceWarehouseName: transfer.sourceWarehouse?.name || null,
      destWarehouseId: transfer.destWarehouseId,
      destWarehouseName: transfer.destWarehouse?.name || null,
      status: transfer.status,
      initiatedAt: transfer.initiatedAt.toISOString(),
      completedAt: transfer.completedAt?.toISOString() || null,
      notes: transfer.notes,
      items: transfer.items.map((i) => {
        const srcWh = i.sourceBin.shelf.rack.zone.warehouse;
        const destWh = i.destBin.shelf.rack.zone.warehouse;
        const sourceBinPath = `${srcWh.code} > ${i.sourceBin.shelf.rack.zone.name} > ${i.sourceBin.shelf.rack.code} > ${i.sourceBin.shelf.code} > ${i.sourceBin.code}`;
        const destBinPath = `${destWh.code} > ${i.destBin.shelf.rack.zone.name} > ${i.destBin.shelf.rack.code} > ${i.destBin.shelf.code} > ${i.destBin.code}`;

        return {
          id: i.id,
          productId: i.productId,
          productName: i.product.name,
          productSku: i.product.sku,
          uom: i.product.uom,
          sourceBinId: i.sourceBinId,
          sourceBinPath,
          destBinId: i.destBinId,
          destBinPath,
          quantity: i.quantity,
        };
      }),
    };
  }

  static async createTransfer(dto: {
    sourceWarehouseId?: string;
    destWarehouseId?: string;
    notes?: string;
    items: Array<{ productId: string; sourceBinId: string; destBinId: string; quantity: number }>;
  }) {
    const transferNumber = `TRF-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    return await prisma.transfer.create({
      data: {
        transferNumber,
        sourceWarehouseId: dto.sourceWarehouseId,
        destWarehouseId: dto.destWarehouseId,
        notes: dto.notes,
        status: 'DRAFT',
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            sourceBinId: item.sourceBinId,
            destBinId: item.destBinId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: true,
      },
    });
  }

  static async updateTransferStatus(id: string, status: 'READY' | 'IN_TRANSIT' | 'CANCELLED') {
    const transfer = await prisma.transfer.findUnique({ where: { id } });
    if (!transfer) throw new NotFoundError('Transfer not found');
    if (transfer.status === 'DONE' || transfer.status === 'COMPLETED') {
      throw new BadRequestError('Cannot change status of a completed transfer');
    }

    return await prisma.transfer.update({
      where: { id },
      data: { status },
    });
  }

  static async completeTransfer(id: string, userId: string) {
    return await InventoryEngineService.executeTransferCompletion(id, userId);
  }

  // ==========================================
  // 4. STOCK ADJUSTMENTS
  // ==========================================

  static async listAdjustments(params: {
    productId?: string;
    warehouseId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.productId) where.productId = params.productId;
    if (params.warehouseId) where.warehouseId = params.warehouseId;

    const [items, totalCount] = await Promise.all([
      prisma.stockAdjustment.findMany({
        where,
        include: {
          product: true,
          warehouse: true,
          adjustedBy: { select: { firstName: true, lastName: true, email: true } },
          bin: {
            include: {
              shelf: { include: { rack: { include: { zone: { include: { warehouse: true } } } } } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.stockAdjustment.count({ where }),
    ]);

    return {
      items: items.map((a) => {
        const wh = a.bin.shelf.rack.zone.warehouse;
        const binPath = `${wh.code} > ${a.bin.shelf.rack.zone.name} > ${a.bin.shelf.rack.code} > ${a.bin.shelf.code} > ${a.bin.code}`;

        return {
          id: a.id,
          adjustmentNumber: a.adjustmentNumber,
          productId: a.productId,
          productName: a.product.name,
          productSku: a.product.sku,
          uom: a.product.uom,
          binId: a.binId,
          binPath,
          warehouseName: a.warehouse?.name || wh.name,
          recordedQty: a.recordedQty,
          countedQty: a.countedQty,
          differenceQty: a.differenceQty,
          reasonCode: a.reasonCode,
          notes: a.notes,
          adjustedById: a.adjustedById,
          adjustedByName: a.adjustedBy ? `${a.adjustedBy.firstName} ${a.adjustedBy.lastName}` : 'System',
          createdAt: a.createdAt.toISOString(),
        };
      }),
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }

  static async createAdjustment(dto: {
    productId: string;
    binId: string;
    countedQty: number;
    reasonCode: any;
    notes?: string;
  }, userId: string) {
    return await InventoryEngineService.executeStockAdjustment({
      ...dto,
      userId,
    });
  }

  // ==========================================
  // 5. SUPPLIERS
  // ==========================================

  static async listSuppliers() {
    return await prisma.supplier.findMany({
      orderBy: { name: 'asc' },
    });
  }

  static async createSupplier(dto: {
    code: string;
    name: string;
    contactEmail?: string;
    phone?: string;
    address?: string;
    leadTimeDays?: number;
  }) {
    const existing = await prisma.supplier.findUnique({
      where: { code: dto.code.trim().toUpperCase() },
    });

    if (existing) {
      throw new ConflictError(`Supplier code "${dto.code}" already exists.`);
    }

    return await prisma.supplier.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        contactEmail: dto.contactEmail?.trim() || null,
        phone: dto.phone?.trim() || null,
        address: dto.address?.trim() || null,
        leadTimeDays: dto.leadTimeDays ?? 7,
      },
    });
  }
}
