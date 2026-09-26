import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting StockSense Complete Demo & Production Seed...');

  // 1. Seed Roles & Users for all 4 RBAC levels
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@stocksense.io' },
    update: { passwordHash, isActive: true },
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
    update: { passwordHash, isActive: true },
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
    update: { passwordHash, isActive: true },
    create: {
      email: 'staff@stocksense.io',
      passwordHash,
      firstName: 'John',
      lastName: 'Doe',
      role: 'WAREHOUSE_STAFF',
      isActive: true,
    },
  });

  const auditor = await prisma.user.upsert({
    where: { email: 'auditor@stocksense.io' },
    update: { passwordHash, isActive: true },
    create: {
      email: 'auditor@stocksense.io',
      passwordHash,
      firstName: 'Elena',
      lastName: 'Rostova',
      role: 'VIEWER_AUDITOR',
      isActive: true,
    },
  });

  console.log('👤 Seeded 4 Standard RBAC Users:');
  console.log('   - ADMIN: admin@stocksense.io (Password123!)');
  console.log('   - INVENTORY_MANAGER: manager@stocksense.io (Password123!)');
  console.log('   - WAREHOUSE_STAFF: staff@stocksense.io (Password123!)');
  console.log('   - VIEWER_AUDITOR: auditor@stocksense.io (Password123!)');

  // 2. Seed Categories
  const catRaw = await prisma.category.upsert({
    where: { code: 'RAW-METALS' },
    update: {},
    create: {
      code: 'RAW-METALS',
      name: 'Raw Metals & Structural',
      description: 'Steel rods, copper pipes, and heavy structural alloys',
    },
  });

  const catFurn = await prisma.category.upsert({
    where: { code: 'FURNITURE' },
    update: {},
    create: {
      code: 'FURNITURE',
      name: 'Office & Warehouse Furniture',
      description: 'Desks, ergonomic chairs, and industrial shelving',
    },
  });

  const catElec = await prisma.category.upsert({
    where: { code: 'ELECTRICAL' },
    update: {},
    create: {
      code: 'ELECTRICAL',
      name: 'Electrical & Wiring',
      description: 'Copper cables, conduits, and circuit components',
    },
  });

  const catFast = await prisma.category.upsert({
    where: { code: 'FASTENERS' },
    update: {},
    create: {
      code: 'FASTENERS',
      name: 'Fasteners & Hardware',
      description: 'High-tensile bolts, nuts, washers, and anchor pins',
    },
  });

  const catChem = await prisma.category.upsert({
    where: { code: 'CHEMICALS' },
    update: {},
    create: {
      code: 'CHEMICALS',
      name: 'Industrial Chemicals & Paint',
      description: 'Epoxy primers, industrial coatings, and sealants',
    },
  });

  const catPpe = await prisma.category.upsert({
    where: { code: 'PPE' },
    update: {},
    create: {
      code: 'PPE',
      name: 'Safety & PPE',
      description: 'Gloves, helmets, eye protection, and protective wear',
    },
  });

  // 3. Seed Warehouses
  const whMain = await prisma.warehouse.upsert({
    where: { code: 'WH-MAIN' },
    update: {},
    create: {
      code: 'WH-MAIN',
      name: 'Central Distribution Center',
      address: '742 Logistics Boulevard, Sector 5, Logistics Hub',
      isActive: true,
    },
  });

  const whWest = await prisma.warehouse.upsert({
    where: { code: 'WH-WEST' },
    update: {},
    create: {
      code: 'WH-WEST',
      name: 'West Coast Logistics Facility',
      address: 'Pier 42 Maritime Parkway, Docklands',
      isActive: true,
    },
  });

  // 4. Seed Spatial Hierarchy for WH-MAIN
  const zoneA = await prisma.zone.upsert({
    where: { warehouseId_code: { warehouseId: whMain.id, code: 'ZONE-A' } },
    update: {},
    create: { warehouseId: whMain.id, code: 'ZONE-A', name: 'Heavy Metals & Structural' },
  });

  const zoneB = await prisma.zone.upsert({
    where: { warehouseId_code: { warehouseId: whMain.id, code: 'ZONE-B' } },
    update: {},
    create: { warehouseId: whMain.id, code: 'ZONE-B', name: 'General Storage & Parts' },
  });

  const rack01 = await prisma.rack.upsert({
    where: { zoneId_code: { zoneId: zoneA.id, code: 'R01' } },
    update: {},
    create: { zoneId: zoneA.id, code: 'R01', aisleNumber: 'Aisle 01' },
  });

  const shelf01 = await prisma.shelf.upsert({
    where: { rackId_code: { rackId: rack01.id, code: 'S01' } },
    update: {},
    create: { rackId: rack01.id, code: 'S01', levelNumber: 1 },
  });

  const bin01 = await prisma.bin.upsert({
    where: { barcode: 'WH-MAIN-ZA-R01-S01-B01' },
    update: {},
    create: { shelfId: shelf01.id, code: 'B01', barcode: 'WH-MAIN-ZA-R01-S01-B01' },
  });

  const bin02 = await prisma.bin.upsert({
    where: { barcode: 'WH-MAIN-ZA-R01-S01-B02' },
    update: {},
    create: { shelfId: shelf01.id, code: 'B02', barcode: 'WH-MAIN-ZA-R01-S01-B02' },
  });

  const rack02 = await prisma.rack.upsert({
    where: { zoneId_code: { zoneId: zoneB.id, code: 'R02' } },
    update: {},
    create: { zoneId: zoneB.id, code: 'R02', aisleNumber: 'Aisle 02' },
  });

  const shelf02 = await prisma.shelf.upsert({
    where: { rackId_code: { rackId: rack02.id, code: 'S01' } },
    update: {},
    create: { rackId: rack02.id, code: 'S01', levelNumber: 1 },
  });

  const bin03 = await prisma.bin.upsert({
    where: { barcode: 'WH-MAIN-ZB-R02-S01-B01' },
    update: {},
    create: { shelfId: shelf02.id, code: 'B01', barcode: 'WH-MAIN-ZB-R02-S01-B01' },
  });

  // WH-WEST locations
  const zoneWestA = await prisma.zone.upsert({
    where: { warehouseId_code: { warehouseId: whWest.id, code: 'ZONE-W1' } },
    update: {},
    create: { warehouseId: whWest.id, code: 'ZONE-W1', name: 'Outbound Transit Bay' },
  });

  const rackWest01 = await prisma.rack.upsert({
    where: { zoneId_code: { zoneId: zoneWestA.id, code: 'R01' } },
    update: {},
    create: { zoneId: zoneWestA.id, code: 'R01', aisleNumber: 'Aisle 01' },
  });

  const shelfWest01 = await prisma.shelf.upsert({
    where: { rackId_code: { rackId: rackWest01.id, code: 'S01' } },
    update: {},
    create: { rackId: rackWest01.id, code: 'S01', levelNumber: 1 },
  });

  const binWest01 = await prisma.bin.upsert({
    where: { barcode: 'WH-WEST-W1-R01-S01-B01' },
    update: {},
    create: { shelfId: shelfWest01.id, code: 'B01', barcode: 'WH-WEST-W1-R01-S01-B01' },
  });

  // 5. Seed Products
  const pSteel = await prisma.product.upsert({
    where: { sku: 'STL-ROD-01' },
    update: { minStock: 50, maxStock: 300, reorderQuantity: 100 },
    create: {
      sku: 'STL-ROD-01',
      name: 'Steel Rods 12mm High-Tensile',
      description: 'Cold-drawn 12mm high-tensile structural steel reinforcement rods',
      categoryId: catRaw.id,
      uom: 'PCS',
      costPrice: 45.0,
      salePrice: 70.0,
      minStock: 50,
      maxStock: 300,
      reorderQuantity: 100,
      isActive: true,
    },
  });

  const pChair = await prisma.product.upsert({
    where: { sku: 'CHR-ERG-01' },
    update: { minStock: 20, maxStock: 100, reorderQuantity: 40 },
    create: {
      sku: 'CHR-ERG-01',
      name: 'Office Chairs Ergonomic Pro',
      description: 'Mesh lumbar support swivel chairs with adjustable armrests',
      categoryId: catFurn.id,
      uom: 'PCS',
      costPrice: 120.0,
      salePrice: 199.0,
      minStock: 20,
      maxStock: 100,
      reorderQuantity: 40,
      isActive: true,
    },
  });

  const pCopper = await prisma.product.upsert({
    where: { sku: 'COP-WIR-02' },
    update: { minStock: 25, maxStock: 150, reorderQuantity: 50 },
    create: {
      sku: 'COP-WIR-02',
      name: 'Copper Wire Spool 2.5mm',
      description: 'Pure copper insulated electrical cable spools (100m)',
      categoryId: catElec.id,
      uom: 'BOX',
      costPrice: 85.0,
      salePrice: 140.0,
      minStock: 25,
      maxStock: 150,
      reorderQuantity: 50,
      isActive: true,
    },
  });

  const pBolts = await prisma.product.upsert({
    where: { sku: 'BLT-HEX-10' },
    update: { minStock: 200, maxStock: 2000, reorderQuantity: 500 },
    create: {
      sku: 'BLT-HEX-10',
      name: 'Bolts M10 Zinc-Plated Grade 8.8',
      description: 'M10 x 50mm hex head structural fasteners with matching nuts',
      categoryId: catFast.id,
      uom: 'PCS',
      costPrice: 0.5,
      salePrice: 1.2,
      minStock: 200,
      maxStock: 2000,
      reorderQuantity: 500,
      isActive: true,
    },
  });

  const pPaint = await prisma.product.upsert({
    where: { sku: 'PNT-IND-05' },
    update: { minStock: 15, maxStock: 80, reorderQuantity: 30 },
    create: {
      sku: 'PNT-IND-05',
      name: 'Industrial Paint Epoxy Gloss 5L',
      description: 'Heavy chemical and abrasion-resistant polyurethane industrial floor paint',
      categoryId: catChem.id,
      uom: 'LITER',
      costPrice: 60.0,
      salePrice: 95.0,
      minStock: 15,
      maxStock: 80,
      reorderQuantity: 30,
      isActive: true,
    },
  });

  const pGloves = await prisma.product.upsert({
    where: { sku: 'GLV-SAF-02' },
    update: { minStock: 30, maxStock: 200, reorderQuantity: 80 },
    create: {
      sku: 'GLV-SAF-02',
      name: 'Safety Gloves Nitrile Cut-Resistant',
      description: 'Level 5 cut-resistant micro-foam nitrile coated work gloves',
      categoryId: catPpe.id,
      uom: 'BOX',
      costPrice: 12.0,
      salePrice: 24.0,
      minStock: 30,
      maxStock: 200,
      reorderQuantity: 80,
      isActive: true,
    },
  });

  // 6. Seed Suppliers
  const supApex = await prisma.supplier.upsert({
    where: { code: 'SUP-APEX' },
    update: {},
    create: {
      code: 'SUP-APEX',
      name: 'Apex Metals & Structural Ltd',
      contactEmail: 'orders@apexmetals.com',
      phone: '+1-800-555-0199',
      address: '100 Industrial Parkway, Steel City',
      leadTimeDays: 5,
    },
  });

  const supGlobal = await prisma.supplier.upsert({
    where: { code: 'SUP-GLOBAL' },
    update: {},
    create: {
      code: 'SUP-GLOBAL',
      name: 'Global Hardware & Fasteners Inc',
      contactEmail: 'sales@globalhardware.com',
      phone: '+1-888-222-4411',
      address: '50 Assembly Lane, Detroit, MI',
      leadTimeDays: 3,
    },
  });

  // 7. Seed Real Stock Balances & Initial Ledgers
  // Steel: 150 (In Stock)
  await prisma.stockBalance.upsert({
    where: { productId_binId: { productId: pSteel.id, binId: bin01.id } },
    update: { physicalQty: 150 },
    create: { productId: pSteel.id, binId: bin01.id, physicalQty: 150 },
  });

  // Office Chairs: 45 (In Stock)
  await prisma.stockBalance.upsert({
    where: { productId_binId: { productId: pChair.id, binId: bin03.id } },
    update: { physicalQty: 45 },
    create: { productId: pChair.id, binId: bin03.id, physicalQty: 45 },
  });

  // Copper Wire: 8 (LOW STOCK - Min is 25!)
  await prisma.stockBalance.upsert({
    where: { productId_binId: { productId: pCopper.id, binId: bin02.id } },
    update: { physicalQty: 8 },
    create: { productId: pCopper.id, binId: bin02.id, physicalQty: 8 },
  });

  // Hex Bolts: 1200 (In Stock)
  await prisma.stockBalance.upsert({
    where: { productId_binId: { productId: pBolts.id, binId: bin03.id } },
    update: { physicalQty: 1200 },
    create: { productId: pBolts.id, binId: bin03.id, physicalQty: 1200 },
  });

  // Industrial Paint: 0 (OUT OF STOCK - Min is 15!)
  await prisma.stockBalance.upsert({
    where: { productId_binId: { productId: pPaint.id, binId: bin02.id } },
    update: { physicalQty: 0 },
    create: { productId: pPaint.id, binId: bin02.id, physicalQty: 0 },
  });

  // Safety Gloves: 85 in WH-MAIN, 20 in WH-WEST (Multi-warehouse stock)
  await prisma.stockBalance.upsert({
    where: { productId_binId: { productId: pGloves.id, binId: bin03.id } },
    update: { physicalQty: 85 },
    create: { productId: pGloves.id, binId: bin03.id, physicalQty: 85 },
  });

  await prisma.stockBalance.upsert({
    where: { productId_binId: { productId: pGloves.id, binId: binWest01.id } },
    update: { physicalQty: 20 },
    create: { productId: pGloves.id, binId: binWest01.id, physicalQty: 20 },
  });

  // 8. Seed Operations (Receipts, Deliveries, Transfers, Adjustments)
  // Validated Receipt
  const recDone = await prisma.receipt.upsert({
    where: { receiptNumber: 'REC-2026-001' },
    update: {},
    create: {
      receiptNumber: 'REC-2026-001',
      supplierId: supApex.id,
      warehouseId: whMain.id,
      status: 'DONE',
      receivedAt: new Date(Date.now() - 86400000 * 2),
      validatedAt: new Date(Date.now() - 86400000 * 2),
      notes: 'Initial opening procurement shipment from Apex',
      items: {
        create: [
          { productId: pSteel.id, binId: bin01.id, quantityReceived: 100 },
          { productId: pBolts.id, binId: bin03.id, quantityReceived: 1000 },
        ],
      },
    },
  });

  // Pending Receipt (READY)
  await prisma.receipt.upsert({
    where: { receiptNumber: 'REC-2026-002' },
    update: {},
    create: {
      receiptNumber: 'REC-2026-002',
      supplierId: supGlobal.id,
      warehouseId: whMain.id,
      status: 'READY',
      notes: 'Restock of copper spools and safety gloves awaiting dock reception',
      items: {
        create: [
          { productId: pCopper.id, binId: bin02.id, quantityReceived: 50 },
          { productId: pGloves.id, binId: bin03.id, quantityReceived: 40 },
        ],
      },
    },
  });

  // Validated Delivery Order
  await prisma.deliveryOrder.upsert({
    where: { doNumber: 'DO-2026-001' },
    update: {},
    create: {
      doNumber: 'DO-2026-001',
      customerName: 'Metropolis High-Rise Construction Ltd',
      warehouseId: whMain.id,
      status: 'DONE',
      dispatchedAt: new Date(Date.now() - 86400000),
      notes: 'Urgent structural framing consignment',
      items: {
        create: [
          { productId: pSteel.id, binId: bin01.id, quantityDemanded: 20, quantityPicked: 20 },
        ],
      },
    },
  });

  // Pending Delivery Order (PICKING)
  await prisma.deliveryOrder.upsert({
    where: { doNumber: 'DO-2026-002' },
    update: {},
    create: {
      doNumber: 'DO-2026-002',
      customerName: 'Apex Headquarters Furnishing',
      warehouseId: whMain.id,
      status: 'PICKING',
      notes: 'Executive seating delivery',
      items: {
        create: [
          { productId: pChair.id, binId: bin03.id, quantityDemanded: 5, quantityPicked: 0 },
        ],
      },
    },
  });

  // Completed Internal Transfer
  await prisma.transfer.upsert({
    where: { transferNumber: 'TRF-2026-001' },
    update: {},
    create: {
      transferNumber: 'TRF-2026-001',
      sourceWarehouseId: whMain.id,
      destWarehouseId: whWest.id,
      status: 'DONE',
      initiatedAt: new Date(Date.now() - 86400000 * 3),
      completedAt: new Date(Date.now() - 86400000 * 3 + 7200000),
      notes: 'Replenishment of safety equipment to West Coast docklands',
      items: {
        create: [
          {
            productId: pGloves.id,
            sourceBinId: bin03.id,
            destBinId: binWest01.id,
            quantity: 20,
          },
        ],
      },
    },
  });

  // Physical Stock Adjustment (Damaged goods correction)
  await prisma.stockAdjustment.upsert({
    where: { adjustmentNumber: 'ADJ-2026-001' },
    update: {},
    create: {
      adjustmentNumber: 'ADJ-2026-001',
      productId: pSteel.id,
      binId: bin01.id,
      warehouseId: whMain.id,
      recordedQty: 153,
      countedQty: 150,
      differenceQty: -3,
      reasonCode: 'DAMAGED',
      notes: 'Water damage during severe monsoon moisture exposure',
      adjustedById: manager.id,
    },
  });

  // 9. Immutable Stock Ledger Journal Entries
  await prisma.stockLedger.createMany({
    data: [
      {
        productId: pSteel.id,
        sku: pSteel.sku,
        warehouseId: whMain.id,
        binId: bin01.id,
        movementType: 'RECEIPT',
        quantity: 100,
        qtyBefore: 53,
        qtyAfter: 153,
        referenceDocType: 'RECEIPT',
        referenceDocId: recDone.id,
        referenceDocNumber: 'REC-2026-001',
        sourceLocation: 'Apex Metals & Structural Ltd',
        destLocation: 'WH-MAIN > Heavy Metals & Structural > R01 > S01 > B01',
        performedById: staff.id,
        reason: 'Inbound goods receipt validated',
        createdAt: new Date(Date.now() - 86400000 * 2),
      },
      {
        productId: pSteel.id,
        sku: pSteel.sku,
        warehouseId: whMain.id,
        binId: bin01.id,
        movementType: 'ADJUSTMENT',
        quantity: -3,
        qtyBefore: 153,
        qtyAfter: 150,
        referenceDocType: 'STOCK_ADJUSTMENT',
        referenceDocNumber: 'ADJ-2026-001',
        sourceLocation: 'WH-MAIN > Heavy Metals & Structural > R01 > S01 > B01',
        performedById: manager.id,
        reason: 'DAMAGED: Water damage during severe monsoon moisture exposure',
        createdAt: new Date(Date.now() - 86400000),
      },
      {
        productId: pGloves.id,
        sku: pGloves.sku,
        warehouseId: whMain.id,
        binId: bin03.id,
        movementType: 'INTERNAL_TRANSFER',
        quantity: -20,
        qtyBefore: 105,
        qtyAfter: 85,
        referenceDocType: 'INTERNAL_TRANSFER',
        referenceDocNumber: 'TRF-2026-001',
        sourceLocation: 'WH-MAIN > General Storage > R02 > S01 > B01',
        destLocation: 'WH-WEST > Outbound Transit Bay > R01 > S01 > B01',
        performedById: staff.id,
        reason: 'Transfer outbound -> West Coast docklands',
        createdAt: new Date(Date.now() - 86400000 * 3),
      },
      {
        productId: pGloves.id,
        sku: pGloves.sku,
        warehouseId: whWest.id,
        binId: binWest01.id,
        movementType: 'INTERNAL_TRANSFER',
        quantity: 20,
        qtyBefore: 0,
        qtyAfter: 20,
        referenceDocType: 'INTERNAL_TRANSFER',
        referenceDocNumber: 'TRF-2026-001',
        sourceLocation: 'WH-MAIN > General Storage > R02 > S01 > B01',
        destLocation: 'WH-WEST > Outbound Transit Bay > R01 > S01 > B01',
        performedById: staff.id,
        reason: 'Transfer inbound <- Central Distribution Center',
        createdAt: new Date(Date.now() - 86400000 * 3),
      },
    ],
  });

  // 10. Seed Notifications for Low Stock & Out of Stock
  await prisma.notification.createMany({
    data: [
      {
        title: 'Out of Stock Alert',
        message: 'Industrial Paint Epoxy Gloss 5L (PNT-IND-05) has 0 LITER remaining. Immediate reorder recommended.',
        severity: 'CRITICAL',
        linkUrl: '/products',
        isRead: false,
      },
      {
        title: 'Low Stock Warning',
        message: 'Copper Wire Spool 2.5mm (COP-WIR-02) current stock (8 BOX) is below reorder threshold (25 BOX).',
        severity: 'WARNING',
        linkUrl: '/products',
        isRead: false,
      },
      {
        title: 'Pending Receipt Arriving',
        message: 'Shipment REC-2026-002 from Global Hardware & Fasteners Inc is marked READY for warehouse reception.',
        severity: 'INFO',
        linkUrl: '/operations/receipts',
        isRead: false,
      },
    ],
  });

  console.log('✅ Realistic StockSense Seed Complete:');
  console.log('   - 6 Categories, 2 Warehouses, 4 Spatial Bins');
  console.log('   - 6 Core Products with In-Stock, Low-Stock (Copper), and Out-of-Stock (Paint)');
  console.log('   - Receipts (1 Done, 1 Ready), Deliveries (1 Done, 1 Picking), Transfers (1 Done)');
  console.log('   - Live Stock Ledgers, Adjustments, and System Notifications');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
