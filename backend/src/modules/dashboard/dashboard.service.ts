import { prisma } from '../../core/database/prisma';
import { InventoryEngineService } from '../inventory/inventory.service';

export class DashboardService {
  /**
   * Computes exact KPIs required by StockSense specification with dynamic filtering
   */
  static async getDashboardKPIs(filters?: {
    warehouseId?: string;
    locationId?: string;
    categoryId?: string;
    documentType?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    // 1. Fetch products and calculate live stock quantities & statuses
    const productWhere: any = {};
    if (filters?.categoryId) productWhere.categoryId = filters.categoryId;

    const products = await prisma.product.findMany({
      where: productWhere,
      include: {
        stockBalances: {
          include: {
            bin: {
              include: {
                shelf: { include: { rack: { include: { zone: true } } } },
              },
            },
          },
        },
      },
    });

    let totalProductsInStock = 0;
    let lowStockItemsCount = 0;
    let outOfStockItemsCount = 0;
    let totalStockUnits = 0;

    for (const p of products) {
      // If warehouse or location filter specified, filter balances
      let balances = p.stockBalances;
      if (filters?.warehouseId) {
        balances = balances.filter((b) => b.bin.shelf.rack.zone.warehouseId === filters.warehouseId);
      }
      if (filters?.locationId) {
        balances = balances.filter((b) => b.binId === filters.locationId);
      }

      const totalProductStock = balances.reduce((sum, b) => sum + b.physicalQty, 0);
      totalStockUnits += totalProductStock;

      const status = InventoryEngineService.computeStockStatus(totalProductStock, p.minStock);
      if (status === 'IN_STOCK') {
        totalProductsInStock++;
      } else if (status === 'LOW_STOCK') {
        lowStockItemsCount++;
        totalProductsInStock++; // Counted as in stock with alert
      } else {
        outOfStockItemsCount++;
      }
    }

    // 2. Pending Receipts (DRAFT, WAITING, READY)
    const receiptWhere: any = {};
    if (filters?.status) {
      receiptWhere.status = filters.status;
    } else {
      receiptWhere.status = { in: ['DRAFT', 'WAITING', 'READY'] };
    }
    if (filters?.warehouseId) receiptWhere.warehouseId = filters.warehouseId;
    if (filters?.locationId) {
      receiptWhere.items = { some: { binId: filters.locationId } };
    }
    if (filters?.categoryId) {
      receiptWhere.items = { some: { product: { categoryId: filters.categoryId } } };
    }
    if (filters?.startDate || filters?.endDate) {
      receiptWhere.createdAt = {};
      if (filters.startDate) receiptWhere.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) receiptWhere.createdAt.lte = new Date(filters.endDate);
    }
    const pendingReceiptsCount = await prisma.receipt.count({ where: receiptWhere });

    // 3. Pending Deliveries (DRAFT, WAITING, READY, PICKING, PACKED)
    const doWhere: any = {};
    if (filters?.status) {
      doWhere.status = filters.status;
    } else {
      doWhere.status = { in: ['DRAFT', 'WAITING', 'READY', 'PICKING', 'PACKED'] };
    }
    if (filters?.warehouseId) doWhere.warehouseId = filters.warehouseId;
    if (filters?.locationId) {
      doWhere.items = { some: { binId: filters.locationId } };
    }
    if (filters?.categoryId) {
      doWhere.items = { some: { product: { categoryId: filters.categoryId } } };
    }
    if (filters?.startDate || filters?.endDate) {
      doWhere.createdAt = {};
      if (filters.startDate) doWhere.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) doWhere.createdAt.lte = new Date(filters.endDate);
    }
    const pendingDeliveriesCount = await prisma.deliveryOrder.count({ where: doWhere });

    // 4. Internal Transfers Scheduled (DRAFT, WAITING, READY, IN_TRANSIT)
    const transferWhere: any = {};
    if (filters?.status) {
      transferWhere.status = filters.status;
    } else {
      transferWhere.status = { in: ['DRAFT', 'WAITING', 'READY', 'IN_TRANSIT'] };
    }
    if (filters?.warehouseId) {
      transferWhere.OR = [
        { sourceWarehouseId: filters.warehouseId },
        { destWarehouseId: filters.warehouseId },
      ];
    }
    if (filters?.locationId) {
      transferWhere.items = {
        some: {
          OR: [{ sourceBinId: filters.locationId }, { destBinId: filters.locationId }],
        },
      };
    }
    if (filters?.categoryId) {
      transferWhere.items = {
        some: { product: { categoryId: filters.categoryId } },
      };
    }
    const scheduledTransfersCount = await prisma.transfer.count({ where: transferWhere });

    return {
      totalProductsInStock,
      lowStockItemsCount,
      outOfStockItemsCount,
      pendingReceiptsCount,
      pendingDeliveriesCount,
      scheduledTransfersCount,
      totalStockUnits,
    };
  }

  /**
   * Recent Activity: Real receipts, deliveries, transfers, adjustments, and ledger movements
   */
  static async getRecentActivity(filters?: {
    limit?: number;
    warehouseId?: string;
    locationId?: string;
    categoryId?: string;
    documentType?: string;
    status?: string;
  }) {
    const limit = filters?.limit ? Math.max(1, Math.min(50, Number(filters.limit))) : 6;

    // Build common filter conditions
    const receiptWhere: any = {};
    const doWhere: any = {};
    const transferWhere: any = {};
    const adjWhere: any = {};
    const ledgerWhere: any = {};

    if (filters?.status) {
      receiptWhere.status = filters.status;
      doWhere.status = filters.status;
      transferWhere.status = filters.status;
    }

    if (filters?.warehouseId) {
      receiptWhere.warehouseId = filters.warehouseId;
      doWhere.warehouseId = filters.warehouseId;
      transferWhere.OR = [
        { sourceWarehouseId: filters.warehouseId },
        { destWarehouseId: filters.warehouseId },
      ];
      adjWhere.warehouseId = filters.warehouseId;
      ledgerWhere.warehouseId = filters.warehouseId;
    }

    if (filters?.locationId) {
      receiptWhere.items = { some: { binId: filters.locationId } };
      doWhere.items = { some: { binId: filters.locationId } };
      transferWhere.items = {
        some: { OR: [{ sourceBinId: filters.locationId }, { destBinId: filters.locationId }] },
      };
      adjWhere.binId = filters.locationId;
      ledgerWhere.binId = filters.locationId;
    }

    if (filters?.categoryId) {
      receiptWhere.items = { some: { product: { categoryId: filters.categoryId } } };
      doWhere.items = { some: { product: { categoryId: filters.categoryId } } };
      transferWhere.items = { some: { product: { categoryId: filters.categoryId } } };
      adjWhere.product = { categoryId: filters.categoryId };
      ledgerWhere.product = { categoryId: filters.categoryId };
    }

    const [recentReceipts, recentDeliveries, recentTransfers, recentAdjustments, recentMovements] = await Promise.all([
      prisma.receipt.findMany({
        take: limit,
        where: receiptWhere,
        orderBy: { createdAt: 'desc' },
        include: { supplier: true, warehouse: true, items: true },
      }),
      prisma.deliveryOrder.findMany({
        take: limit,
        where: doWhere,
        orderBy: { createdAt: 'desc' },
        include: { warehouse: true, items: true },
      }),
      prisma.transfer.findMany({
        take: limit,
        where: transferWhere,
        orderBy: { initiatedAt: 'desc' },
        include: { sourceWarehouse: true, destWarehouse: true, items: true },
      }),
      prisma.stockAdjustment.findMany({
        take: limit,
        where: adjWhere,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, sku: true, uom: true } },
          bin: {
            include: {
              shelf: { include: { rack: { include: { zone: { include: { warehouse: true } } } } } },
            },
          },
          adjustedBy: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.stockLedger.findMany({
        take: limit,
        where: ledgerWhere,
        orderBy: { timestamp: 'desc' },
        include: {
          product: { select: { name: true, sku: true, uom: true } },
          performedBy: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    return {
      recentReceipts: recentReceipts.map((r) => ({
        id: r.id,
        receiptNumber: r.receiptNumber,
        supplierName: r.supplier?.name || 'N/A',
        warehouseName: r.warehouse?.name || 'N/A',
        status: r.status,
        itemCount: r.items.length,
        createdAt: r.createdAt.toISOString(),
      })),
      recentDeliveries: recentDeliveries.map((d) => ({
        id: d.id,
        doNumber: d.doNumber,
        customerName: d.customerName,
        warehouseName: d.warehouse?.name || 'N/A',
        status: d.status,
        itemCount: d.items.length,
        createdAt: d.createdAt.toISOString(),
      })),
      recentTransfers: recentTransfers.map((t) => ({
        id: t.id,
        transferNumber: t.transferNumber,
        sourceWarehouse: t.sourceWarehouse?.name || 'N/A',
        destWarehouse: t.destWarehouse?.name || 'N/A',
        status: t.status,
        itemCount: t.items.length,
        createdAt: t.initiatedAt.toISOString(),
      })),
      recentAdjustments: recentAdjustments.map((a) => ({
        id: a.id,
        adjustmentNumber: a.adjustmentNumber,
        productName: a.product.name,
        sku: a.product.sku,
        warehouseName: a.bin.shelf.rack.zone.warehouse.name,
        locationPath: `${a.bin.shelf.rack.zone.warehouse.code} > ${a.bin.shelf.rack.zone.name} > ${a.bin.shelf.rack.code} > ${a.bin.shelf.code} > ${a.bin.code}`,
        recordedQty: a.recordedQty,
        countedQty: a.countedQty,
        differenceQty: a.differenceQty,
        reasonCode: a.reasonCode,
        uom: a.product.uom,
        performedBy: a.adjustedBy ? `${a.adjustedBy.firstName} ${a.adjustedBy.lastName}` : 'System',
        createdAt: a.createdAt.toISOString(),
      })),
      recentMovements: recentMovements.map((m) => ({
        id: m.id,
        productName: m.product.name,
        sku: m.sku,
        movementType: m.movementType,
        quantity: m.quantity,
        qtyAfter: m.qtyAfter,
        uom: m.product.uom,
        reference: m.referenceDocNumber || m.referenceDocType,
        performedBy: m.performedBy ? `${m.performedBy.firstName} ${m.performedBy.lastName}` : 'System',
        timestamp: m.timestamp.toISOString(),
      })),
    };
  }

  /**
   * List of products currently requiring reorder or out of stock
   */
  static async getStockAlerts() {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        stockBalances: true,
      },
    });

    const lowStockList: any[] = [];
    const outOfStockList: any[] = [];

    for (const p of products) {
      const totalStock = p.stockBalances.reduce((acc, b) => acc + b.physicalQty, 0);
      const status = InventoryEngineService.computeStockStatus(totalStock, p.minStock);

      const alertItem = {
        id: p.id,
        sku: p.sku,
        name: p.name,
        categoryName: p.category.name,
        uom: p.uom,
        currentStock: totalStock,
        minStock: p.minStock,
        maxStock: p.maxStock,
        reorderQuantity: p.reorderQuantity,
        stockStatus: status,
      };

      if (status === 'OUT_OF_STOCK') {
        outOfStockList.push(alertItem);
      } else if (status === 'LOW_STOCK') {
        lowStockList.push(alertItem);
      }
    }

    return {
      lowStock: lowStockList,
      outOfStock: outOfStockList,
    };
  }
}
