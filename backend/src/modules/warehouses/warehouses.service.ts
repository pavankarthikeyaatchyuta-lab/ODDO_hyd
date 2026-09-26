import { prisma } from '../../core/database/prisma';
import { ConflictError, NotFoundError, BadRequestError } from '../../core/errors/app-error';

export class WarehousesService {
  /**
   * List all warehouses with aggregated bin counts and total active stock units
   */
  static async listWarehouses() {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        zones: {
          include: {
            racks: {
              include: {
                shelves: {
                  include: {
                    bins: {
                      include: {
                        stockBalances: {
                          select: { physicalQty: true },
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
      orderBy: { code: 'asc' },
    });

    return warehouses.map((wh) => {
      let totalBins = 0;
      let totalStock = 0;

      for (const zone of wh.zones) {
        for (const rack of zone.racks) {
          for (const shelf of rack.shelves) {
            totalBins += shelf.bins.length;
            for (const bin of shelf.bins) {
              totalStock += bin.stockBalances.reduce((acc, b) => acc + b.physicalQty, 0);
            }
          }
        }
      }

      return {
        id: wh.id,
        code: wh.code,
        name: wh.name,
        address: wh.address,
        isActive: wh.isActive,
        zoneCount: wh.zones.length,
        totalBins,
        totalStock,
        createdAt: wh.createdAt.toISOString(),
      };
    });
  }

  /**
   * Retrieve complete spatial hierarchy for a specific warehouse
   */
  static async getWarehouseHierarchy(id: string) {
    const wh = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        zones: {
          include: {
            racks: {
              include: {
                shelves: {
                  include: {
                    bins: {
                      include: {
                        stockBalances: {
                          include: {
                            product: { select: { id: true, name: true, sku: true, uom: true } },
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

    if (!wh) {
      throw new NotFoundError(`Warehouse not found with ID: ${id}`);
    }

    let totalBins = 0;
    let totalStock = 0;

    const formattedZones = wh.zones.map((zone) => ({
      id: zone.id,
      code: zone.code,
      name: zone.name,
      racks: zone.racks.map((rack) => ({
        id: rack.id,
        code: rack.code,
        aisleNumber: rack.aisleNumber,
        shelves: rack.shelves.map((shelf) => ({
          id: shelf.id,
          code: shelf.code,
          levelNumber: shelf.levelNumber,
          bins: shelf.bins.map((bin) => {
            totalBins++;
            const binStockSum = bin.stockBalances.reduce((acc, b) => acc + b.physicalQty, 0);
            totalStock += binStockSum;

            return {
              id: bin.id,
              code: bin.code,
              barcode: bin.barcode,
              isLocked: bin.isLocked,
              locationPath: `${wh.code} > ${zone.name} > ${rack.code} > ${shelf.code} > ${bin.code}`,
              currentStockCount: binStockSum,
              stockItems: bin.stockBalances.map((sb) => ({
                productId: sb.product.id,
                productName: sb.product.name,
                sku: sb.product.sku,
                uom: sb.product.uom,
                quantity: sb.physicalQty,
              })),
            };
          }),
        })),
      })),
    }));

    return {
      id: wh.id,
      code: wh.code,
      name: wh.name,
      address: wh.address,
      isActive: wh.isActive,
      totalBins,
      totalStock,
      zones: formattedZones,
    };
  }

  /**
   * Create a new warehouse
   */
  static async createWarehouse(dto: { code: string; name: string; address?: string; isActive?: boolean }) {
    const existing = await prisma.warehouse.findUnique({
      where: { code: dto.code.trim().toUpperCase() },
    });

    if (existing) {
      throw new ConflictError(`Warehouse with code "${dto.code.trim().toUpperCase()}" already exists.`);
    }

    return await prisma.warehouse.create({
      data: {
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        address: dto.address?.trim(),
        isActive: dto.isActive ?? true,
      },
    });
  }

  /**
   * Update warehouse details
   */
  static async updateWarehouse(id: string, dto: { name?: string; address?: string; isActive?: boolean }) {
    const wh = await prisma.warehouse.findUnique({ where: { id } });
    if (!wh) {
      throw new NotFoundError(`Warehouse not found with ID: ${id}`);
    }

    return await prisma.warehouse.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Flat list of all available active bins with human-readable breadcrumb path
   */
  static async getAllBins(warehouseId?: string) {
    const where: any = {
      isLocked: false,
    };

    if (warehouseId) {
      where.shelf = {
        rack: {
          zone: {
            warehouseId,
          },
        },
      };
    }

    const bins = await prisma.bin.findMany({
      where,
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
      orderBy: { barcode: 'asc' },
    });

    return bins.map((b) => {
      const wh = b.shelf.rack.zone.warehouse;
      return {
        id: b.id,
        code: b.code,
        barcode: b.barcode,
        locationPath: `${wh.code} > ${b.shelf.rack.zone.name} > ${b.shelf.rack.code} > ${b.shelf.code} > ${b.code}`,
        warehouseId: wh.id,
        warehouseName: wh.name,
        warehouseCode: wh.code,
      };
    });
  }

  /**
   * Create Zone
   */
  static async createZone(dto: { warehouseId: string; code: string; name: string }) {
    const wh = await prisma.warehouse.findUnique({ where: { id: dto.warehouseId } });
    if (!wh) throw new NotFoundError('Warehouse not found');

    const existing = await prisma.zone.findUnique({
      where: { warehouseId_code: { warehouseId: dto.warehouseId, code: dto.code.toUpperCase() } },
    });
    if (existing) throw new ConflictError(`Zone ${dto.code} already exists in this warehouse`);

    return await prisma.zone.create({
      data: {
        warehouseId: dto.warehouseId,
        code: dto.code.toUpperCase(),
        name: dto.name,
      },
    });
  }

  /**
   * Create Rack
   */
  static async createRack(dto: { zoneId: string; code: string; aisleNumber?: string }) {
    const zone = await prisma.zone.findUnique({ where: { id: dto.zoneId } });
    if (!zone) throw new NotFoundError('Zone not found');

    const existing = await prisma.rack.findUnique({
      where: { zoneId_code: { zoneId: dto.zoneId, code: dto.code.toUpperCase() } },
    });
    if (existing) throw new ConflictError(`Rack ${dto.code} already exists in this zone`);

    return await prisma.rack.create({
      data: {
        zoneId: dto.zoneId,
        code: dto.code.toUpperCase(),
        aisleNumber: dto.aisleNumber,
      },
    });
  }

  /**
   * Create Shelf
   */
  static async createShelf(dto: { rackId: string; code: string; levelNumber?: number }) {
    const rack = await prisma.rack.findUnique({ where: { id: dto.rackId } });
    if (!rack) throw new NotFoundError('Rack not found');

    const existing = await prisma.shelf.findUnique({
      where: { rackId_code: { rackId: dto.rackId, code: dto.code.toUpperCase() } },
    });
    if (existing) throw new ConflictError(`Shelf ${dto.code} already exists in this rack`);

    return await prisma.shelf.create({
      data: {
        rackId: dto.rackId,
        code: dto.code.toUpperCase(),
        levelNumber: dto.levelNumber,
      },
    });
  }

  /**
   * Create Bin
   */
  static async createBin(dto: { shelfId: string; code: string; barcode: string }) {
    const shelf = await prisma.shelf.findUnique({ where: { id: dto.shelfId } });
    if (!shelf) throw new NotFoundError('Shelf not found');

    const existingCode = await prisma.bin.findUnique({
      where: { shelfId_code: { shelfId: dto.shelfId, code: dto.code.toUpperCase() } },
    });
    if (existingCode) throw new ConflictError(`Bin ${dto.code} already exists in this shelf`);

    const existingBarcode = await prisma.bin.findUnique({
      where: { barcode: dto.barcode.toUpperCase() },
    });
    if (existingBarcode) throw new ConflictError(`Barcode ${dto.barcode} is already assigned to another bin`);

    return await prisma.bin.create({
      data: {
        shelfId: dto.shelfId,
        code: dto.code.toUpperCase(),
        barcode: dto.barcode.toUpperCase(),
      },
    });
  }
}
