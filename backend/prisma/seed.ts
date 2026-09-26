import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting StockSense Database Seeding...');

  // 1. Seed Roles & Users
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@stocksense.io' },
    update: {},
    create: {
      email: 'admin@stocksense.io',
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      isActive: true,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@stocksense.io' },
    update: {},
    create: {
      email: 'manager@stocksense.io',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Connor',
      role: 'INVENTORY_MANAGER',
      isActive: true,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@stocksense.io' },
    update: {},
    create: {
      email: 'staff@stocksense.io',
      passwordHash,
      firstName: 'John',
      lastName: 'Doe',
      role: 'WAREHOUSE_STAFF',
      isActive: true,
    },
  });

  console.log(`👤 Users seeded: ${admin.email}, ${manager.email}, ${staff.email}`);

  // 2. Seed Warehouse Spatial Hierarchy
  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'WH-MAIN' },
    update: {},
    create: {
      code: 'WH-MAIN',
      name: 'Central Distribution Center',
      address: '742 Evergreen Terrace, Sector 5, Logistics Hub',
      isActive: true,
    },
  });

  const zone = await prisma.zone.upsert({
    where: {
      warehouseId_code: {
        warehouseId: warehouse.id,
        code: 'ZONE-A',
      },
    },
    update: {},
    create: {
      warehouseId: warehouse.id,
      code: 'ZONE-A',
      name: 'Dry Goods & Raw Metals',
    },
  });

  const rack = await prisma.rack.upsert({
    where: {
      zoneId_code: {
        zoneId: zone.id,
        code: 'R01',
      },
    },
    update: {},
    create: {
      zoneId: zone.id,
      code: 'R01',
      aisleNumber: 'Aisle 01',
    },
  });

  const shelf = await prisma.shelf.upsert({
    where: {
      rackId_code: {
        rackId: rack.id,
        code: 'S01',
      },
    },
    update: {},
    create: {
      rackId: rack.id,
      code: 'S01',
      levelNumber: 1,
    },
  });

  const bin = await prisma.bin.upsert({
    where: { barcode: 'WH-MAIN-ZA-R01-S01-B01' },
    update: {},
    create: {
      shelfId: shelf.id,
      code: 'B01',
      barcode: 'WH-MAIN-ZA-R01-S01-B01',
      isLocked: false,
    },
  });

  console.log(`🏢 Spatial hierarchy seeded: ${warehouse.code} -> ${zone.code} -> ${rack.code} -> ${shelf.code} -> ${bin.code}`);

  // 3. Seed Category & Product
  const category = await prisma.category.upsert({
    where: { code: 'RAW-METALS' },
    update: {},
    create: {
      code: 'RAW-METALS',
      name: 'Raw Metals & Structural',
      description: 'Steel, copper, aluminum rods, bars, and sheets',
    },
  });

  const product = await prisma.product.upsert({
    where: { sku: 'STL-12M' },
    update: {},
    create: {
      sku: 'STL-12M',
      name: 'Steel Rods 12mm High-Tensile',
      description: 'Standard 12mm high-tensile structural steel reinforcement rods',
      categoryId: category.id,
      uom: 'KG',
      costPrice: 45.0,
      salePrice: 65.0,
      isBatchTracked: true,
      isSerialTracked: false,
    },
  });

  // 4. Seed Reorder Rule
  await prisma.reorderRule.upsert({
    where: {
      productId_warehouseId: {
        productId: product.id,
        warehouseId: warehouse.id,
      },
    },
    update: {},
    create: {
      productId: product.id,
      warehouseId: warehouse.id,
      minStock: 50.0,
      maxStock: 500.0,
      safetyStock: 30.0,
      reorderQuantity: 250.0,
    },
  });

  // 5. Seed Initial Stock Balance and Ledger Entry
  const initialStock = 120.0;
  const initialReserved = 20.0;

  await prisma.stockBalance.upsert({
    where: {
      productId_binId: {
        productId: product.id,
        binId: bin.id,
      },
    },
    update: {},
    create: {
      productId: product.id,
      binId: bin.id,
      physicalQty: initialStock,
      reservedQty: initialReserved,
    },
  });

  await prisma.stockLedger.create({
    data: {
      productId: product.id,
      sku: product.sku,
      binId: bin.id,
      movementType: 'RECEIPT',
      quantity: initialStock,
      qtyBefore: 0.0,
      qtyAfter: initialStock,
      referenceDocType: 'SEED',
      referenceDocId: 'INITIAL-STOCK-001',
      performedById: admin.id,
      reason: 'Initial system seed stock allocation',
    },
  });

  console.log(`📦 Seeded Product: ${product.name} (SKU: ${product.sku}) with ${initialStock} KG initial stock.`);
  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
