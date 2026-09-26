import { prisma } from '../../core/database/prisma';
import { MovementType, StockStatus } from '../../types/shared';
import { InventoryEngineService } from '../inventory/inventory.service';

export class LedgerService {
  /**
   * Complete, searchable, filterable Stock Ledger journal
   */
  static async getStockLedger(params: {
    productId?: string;
    warehouseId?: string;
    binId?: string;
    movementType?: MovementType;
    referenceDocType?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 25));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.productId) where.productId = params.productId;
    if (params.warehouseId) where.warehouseId = params.warehouseId;
    if (params.binId) where.binId = params.binId;
    if (params.movementType) where.movementType = params.movementType;
    if (params.referenceDocType) where.referenceDocType = params.referenceDocType;

    if (params.startDate || params.endDate) {
      where.timestamp = {};
      if (params.startDate) where.timestamp.gte = new Date(params.startDate);
      if (params.endDate) where.timestamp.lte = new Date(params.endDate);
    }

    if (params.search) {
      where.OR = [
        { sku: { contains: params.search, mode: 'insensitive' } },
        { referenceDocNumber: { contains: params.search, mode: 'insensitive' } },
        { reason: { contains: params.search, mode: 'insensitive' } },
        { product: { name: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const [entries, totalCount] = await Promise.all([
      prisma.stockLedger.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true, uom: true } },
          warehouse: { select: { id: true, name: true, code: true } },
          bin: {
            include: {
              shelf: { include: { rack: { include: { zone: { include: { warehouse: true } } } } } },
            },
          },
          performedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { [params.sortBy || 'timestamp']: params.sortOrder || 'desc' },
        skip,
        take: limit,
      }),
      prisma.stockLedger.count({ where }),
    ]);

    const formatted = entries.map((entry) => {
      const wh = entry.warehouse || entry.bin.shelf.rack.zone.warehouse;
      const locationPath = `${wh.code} > ${entry.bin.shelf.rack.zone.name} > ${entry.bin.shelf.rack.code} > ${entry.bin.shelf.code} > ${entry.bin.code}`;

      return {
        id: entry.id,
        timestamp: entry.timestamp.toISOString(),
        productId: entry.productId,
        productName: entry.product.name,
        sku: entry.sku,
        uom: entry.product.uom,
        warehouseId: entry.warehouseId || wh.id,
        warehouseName: wh.name,
        binId: entry.binId,
        locationPath,
        movementType: entry.movementType as MovementType,
        quantity: entry.quantity,
        qtyBefore: entry.qtyBefore,
        qtyAfter: entry.qtyAfter,
        referenceDocType: entry.referenceDocType,
        referenceDocId: entry.referenceDocId,
        referenceDocNumber: entry.referenceDocNumber,
        sourceLocation: entry.sourceLocation,
        destLocation: entry.destLocation,
        performedById: entry.performedById,
        performedByName: entry.performedBy ? `${entry.performedBy.firstName} ${entry.performedBy.lastName}` : 'System',
        reason: entry.reason,
        createdAt: entry.createdAt.toISOString(),
      };
    });

    return {
      items: formatted,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    };
  }

  /**
   * Operational simplified Move History timeline
   */
  static async getMoveHistory(params: {
    productId?: string;
    warehouseId?: string;
    movementType?: MovementType;
    limit?: number;
  }) {
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 30));
    const where: any = {};

    if (params.productId) where.productId = params.productId;
    if (params.warehouseId) where.warehouseId = params.warehouseId;
    if (params.movementType) where.movementType = params.movementType;

    const entries = await prisma.stockLedger.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true, uom: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        bin: {
          include: {
            shelf: { include: { rack: { include: { zone: { include: { warehouse: true } } } } } },
          },
        },
        performedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return entries.map((e) => {
      const wh = e.warehouse || e.bin.shelf.rack.zone.warehouse;
      const binPath = `${wh.code} > ${e.bin.shelf.rack.zone.name} > ${e.bin.shelf.rack.code} > ${e.bin.shelf.code} > ${e.bin.code}`;

      return {
        id: e.id,
        timestamp: e.timestamp.toISOString(),
        productName: e.product.name,
        sku: e.sku,
        uom: e.product.uom,
        movementType: e.movementType,
        quantity: e.quantity,
        isPositive: e.quantity > 0,
        warehouseName: wh.name,
        locationSummary: e.movementType === 'INTERNAL_TRANSFER' && e.sourceLocation && e.destLocation
          ? `${e.sourceLocation} → ${e.destLocation}`
          : binPath,
        referenceDocNumber: e.referenceDocNumber,
        referenceDocType: e.referenceDocType,
        performedBy: e.performedBy ? `${e.performedBy.firstName} ${e.performedBy.lastName}` : 'System',
        reason: e.reason,
      };
    });
  }

  /**
   * Global Stock Overview: Aggregated and breakdown per warehouse & location
   */
  static async getInventoryOverview(params: {
    warehouseId?: string;
    categoryId?: string;
    stockStatus?: StockStatus;
    search?: string;
  }) {
    const productWhere: any = {};
    if (params.categoryId) productWhere.categoryId = params.categoryId;
    if (params.search) {
      productWhere.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where: productWhere,
      include: {
        category: true,
        stockBalances: {
          include: {
            bin: {
              include: {
                shelf: { include: { rack: { include: { zone: { include: { warehouse: true } } } } } },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const overview = products.map((p) => {
      const totalStock = p.stockBalances.reduce((acc, b) => acc + b.physicalQty, 0);
      const stockStatus = InventoryEngineService.computeStockStatus(totalStock, p.minStock);

      const locations = p.stockBalances
        .filter((b) => !params.warehouseId || b.bin.shelf.rack.zone.warehouse.id === params.warehouseId)
        .map((b) => {
          const wh = b.bin.shelf.rack.zone.warehouse;
          return {
            binId: b.bin.id,
            binCode: b.bin.code,
            barcode: b.bin.barcode,
            warehouseName: wh.name,
            locationPath: `${wh.code} > ${b.bin.shelf.rack.zone.name} > ${b.bin.shelf.rack.code} > ${b.bin.shelf.code} > ${b.bin.code}`,
            quantity: b.physicalQty,
          };
        });

      return {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        categoryName: p.category.name,
        uom: p.uom,
        totalStock,
        minStock: p.minStock,
        maxStock: p.maxStock,
        reorderQuantity: p.reorderQuantity,
        stockStatus,
        locations,
      };
    });

    if (params.stockStatus) {
      return overview.filter((item) => item.stockStatus === params.stockStatus);
    }

    return overview;
  }
}
