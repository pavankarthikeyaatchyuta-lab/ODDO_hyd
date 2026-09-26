import { prisma } from '../../core/database/prisma';
import { BadRequestError, ConflictError, NotFoundError } from '../../core/errors/app-error';
import { InventoryEngineService } from '../inventory/inventory.service';
import { StockStatus } from '../../types/shared';

export class ProductsService {
  /**
   * List products with search, category filtering, stock status calculation, and pagination
   */
  static async listProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    stockStatus?: StockStatus;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(params.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
        { category: { name: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    if (params.categoryId) {
      where.categoryId = params.categoryId;
    }

    const [rawProducts, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, code: true } },
          stockBalances: {
            select: { physicalQty: true },
          },
        },
        orderBy: { [params.sortBy || 'createdAt']: params.sortOrder || 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    // Compute live stock balances & stock status
    const mapped = rawProducts.map((p) => {
      const totalStock = p.stockBalances.reduce((sum, b) => sum + b.physicalQty, 0);
      const stockStatus = InventoryEngineService.computeStockStatus(totalStock, p.minStock);

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        description: p.description,
        categoryId: p.categoryId,
        categoryName: p.category.name,
        uom: p.uom,
        costPrice: p.costPrice,
        salePrice: p.salePrice,
        minStock: p.minStock,
        maxStock: p.maxStock,
        reorderQuantity: p.reorderQuantity,
        isActive: p.isActive,
        totalStock,
        stockStatus,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    });

    // Filter by stockStatus in memory if requested
    const filtered = params.stockStatus 
      ? mapped.filter((item) => item.stockStatus === params.stockStatus) 
      : mapped;

    const paginated = filtered.slice(skip, skip + limit);

    return {
      items: paginated,
      pagination: {
        page,
        limit,
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / limit) || 1,
      },
    };
  }

  /**
   * Get detailed product view with stock across warehouses, locations and recent ledger history
   */
  static async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        stockBalances: {
          include: {
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
        stockLedgers: {
          take: 15,
          orderBy: { timestamp: 'desc' },
          include: {
            performedBy: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundError(`Product not found with ID: ${id}`);
    }

    const totalStock = product.stockBalances.reduce((sum, b) => sum + b.physicalQty, 0);
    const stockStatus = InventoryEngineService.computeStockStatus(totalStock, product.minStock);

    // Aggregate stock by warehouse
    const warehouseStockMap = new Map<string, { warehouseId: string; warehouseCode: string; warehouseName: string; quantity: number }>();
    const stockByLocation: any[] = [];

    for (const b of product.stockBalances) {
      const wh = b.bin.shelf.rack.zone.warehouse;
      const existing = warehouseStockMap.get(wh.id) || {
        warehouseId: wh.id,
        warehouseCode: wh.code,
        warehouseName: wh.name,
        quantity: 0,
      };
      existing.quantity += b.physicalQty;
      warehouseStockMap.set(wh.id, existing);

      stockByLocation.push({
        binId: b.bin.id,
        binCode: b.bin.code,
        barcode: b.bin.barcode,
        locationPath: `${wh.code} > ${b.bin.shelf.rack.zone.name} > ${b.bin.shelf.rack.code} > ${b.bin.shelf.code} > ${b.bin.code}`,
        warehouseId: wh.id,
        warehouseName: wh.name,
        quantity: b.physicalQty,
      });
    }

    const recentMovements = product.stockLedgers.map((l) => ({
      id: l.id,
      timestamp: l.timestamp.toISOString(),
      movementType: l.movementType as any,
      quantity: l.quantity,
      qtyBefore: l.qtyBefore,
      qtyAfter: l.qtyAfter,
      referenceDocNumber: l.referenceDocNumber,
      referenceDocType: l.referenceDocType,
      performedByName: l.performedBy ? `${l.performedBy.firstName} ${l.performedBy.lastName}` : 'System',
      reason: l.reason,
    }));

    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      category: {
        id: product.category.id,
        name: product.category.name,
        code: product.category.code,
        description: product.category.description,
        createdAt: product.category.createdAt.toISOString(),
      },
      uom: product.uom,
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      minStock: product.minStock,
      maxStock: product.maxStock,
      reorderQuantity: product.reorderQuantity,
      isActive: product.isActive,
      totalStock,
      stockStatus,
      stockByWarehouse: Array.from(warehouseStockMap.values()),
      stockByLocation,
      recentMovements,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }

  /**
   * Create a new product with optional initial stock seeding into a specific bin
   */
  static async createProduct(dto: {
    sku: string;
    name: string;
    description?: string;
    categoryId: string;
    uom?: string;
    costPrice?: number;
    salePrice?: number;
    minStock?: number;
    maxStock?: number;
    reorderQuantity?: number;
    isActive?: boolean;
    initialStock?: number;
    initialBinId?: string;
  }, userId?: string) {
    const existingSku = await prisma.product.findUnique({
      where: { sku: dto.sku.trim().toUpperCase() },
    });

    if (existingSku) {
      throw new ConflictError(`A product with SKU "${dto.sku.trim().toUpperCase()}" already exists.`);
    }

    const category = await prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundError(`Category not found with ID: ${dto.categoryId}`);
    }

    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          sku: dto.sku.trim().toUpperCase(),
          name: dto.name.trim(),
          description: dto.description?.trim(),
          categoryId: dto.categoryId,
          uom: dto.uom || 'PCS',
          costPrice: dto.costPrice ?? 0,
          salePrice: dto.salePrice ?? 0,
          minStock: dto.minStock ?? 10,
          maxStock: dto.maxStock ?? 100,
          reorderQuantity: dto.reorderQuantity ?? 20,
          isActive: dto.isActive ?? true,
        },
      });

      // Handle initial stock placement if provided
      if (dto.initialStock && dto.initialStock > 0 && dto.initialBinId) {
        const binInfo = await InventoryEngineService.getBinPath(dto.initialBinId, tx);

        await tx.stockBalance.create({
          data: {
            productId: product.id,
            binId: dto.initialBinId,
            physicalQty: dto.initialStock,
          },
        });

        await tx.stockLedger.create({
          data: {
            productId: product.id,
            sku: product.sku,
            warehouseId: binInfo.warehouseId,
            binId: dto.initialBinId,
            movementType: 'RECEIPT',
            quantity: dto.initialStock,
            qtyBefore: 0,
            qtyAfter: dto.initialStock,
            referenceDocType: 'RECEIPT',
            referenceDocNumber: `INIT-${product.sku}`,
            sourceLocation: 'Opening Inventory',
            destLocation: binInfo.path,
            performedById: userId,
            reason: 'Initial opening stock entry',
          },
        });
      }

      return product;
    });
  }

  /**
   * Update an existing product
   */
  static async updateProduct(id: string, dto: any) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError(`Product not found with ID: ${id}`);
    }

    if (dto.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: dto.categoryId } });
      if (!category) {
        throw new NotFoundError(`Category not found with ID: ${dto.categoryId}`);
      }
    }

    return await prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Delete or deactivate a product
   */
  static async deleteProduct(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockBalances: true,
        stockLedgers: { take: 1 },
      },
    });

    if (!product) {
      throw new NotFoundError(`Product not found with ID: ${id}`);
    }

    const currentStock = product.stockBalances.reduce((s, b) => s + b.physicalQty, 0);
    if (currentStock > 0) {
      throw new BadRequestError(`Cannot delete product with active inventory balance (${currentStock} ${product.uom} remaining). Deactivate the product instead.`);
    }

    if (product.stockLedgers.length > 0) {
      // Archive / Deactivate if referenced in immutable history
      return await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return await prisma.product.delete({ where: { id } });
  }

  /**
   * Categories: List categories with product count
   */
  static async listCategories() {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      description: c.description,
      createdAt: c.createdAt.toISOString(),
      productCount: c._count.products,
    }));
  }

  /**
   * Categories: Create new category
   */
  static async createCategory(dto: { name: string; code: string; description?: string }) {
    const existing = await prisma.category.findFirst({
      where: {
        OR: [
          { name: { equals: dto.name.trim(), mode: 'insensitive' } },
          { code: { equals: dto.code.trim().toUpperCase() } },
        ],
      },
    });

    if (existing) {
      throw new ConflictError(`Category with name "${dto.name}" or code "${dto.code}" already exists.`);
    }

    return await prisma.category.create({
      data: {
        name: dto.name.trim(),
        code: dto.code.trim().toUpperCase(),
        description: dto.description?.trim(),
      },
    });
  }
}
