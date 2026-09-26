import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/core/database/prisma';

const app = createApp();

let adminToken: string;
let managerToken: string;
let staffToken: string;
let auditorToken: string;

let testWarehouseId: string;
let testBin1Id: string;
let testBin2Id: string;
let testCategoryId: string;
let testProductId: string;
let testProductSku: string;

beforeAll(async () => {
  // Warm up Neon connection
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  // Login all 4 seed accounts sequentially to avoid connection bursts
  const resAdmin = await request(app).post('/api/v1/auth/login').send({ email: 'admin@stocksense.io', password: 'Password123!' });
  const resManager = await request(app).post('/api/v1/auth/login').send({ email: 'manager@stocksense.io', password: 'Password123!' });
  const resStaff = await request(app).post('/api/v1/auth/login').send({ email: 'staff@stocksense.io', password: 'Password123!' });
  const resAuditor = await request(app).post('/api/v1/auth/login').send({ email: 'auditor@stocksense.io', password: 'Password123!' });

  adminToken = resAdmin.body.data.tokens.accessToken;
  managerToken = resManager.body.data.tokens.accessToken;
  staffToken = resStaff.body.data.tokens.accessToken;
  auditorToken = resAuditor.body.data.tokens.accessToken;

  // Retrieve seeded warehouse and bins
  const wh = await prisma.warehouse.findUnique({
    where: { code: 'WH-MAIN' },
    include: {
      zones: {
        include: {
          racks: {
            include: {
              shelves: {
                include: { bins: true },
              },
            },
          },
        },
      },
    },
  });

  testWarehouseId = wh!.id;
  const allBins = wh!.zones.flatMap((z) => z.racks.flatMap((r) => r.shelves.flatMap((s) => s.bins)));
  testBin1Id = allBins[0].id;
  testBin2Id = allBins[1].id;

  const cat = await prisma.category.findFirst();
  testCategoryId = cat!.id;
});

describe('Central Inventory Engine & Domain Modules', () => {
  describe('Product Management & Reordering Rules', () => {
    it('should create a new product with initial stock and record opening ledger', async () => {
      testProductSku = `TST-${Date.now().toString(36).toUpperCase()}`;
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          sku: testProductSku,
          name: 'Precision Carbide Drill Bit',
          description: 'High performance industrial drill bit',
          categoryId: testCategoryId,
          uom: 'PCS',
          costPrice: 15.0,
          salePrice: 28.0,
          minStock: 20.0,
          maxStock: 200.0,
          reorderQuantity: 50.0,
          initialStock: 40.0,
          initialBinId: testBin1Id,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sku).toBe(testProductSku);
      testProductId = res.body.data.id;

      // Verify stock balance was created
      const bal = await prisma.stockBalance.findUnique({
        where: { productId_binId: { productId: testProductId, binId: testBin1Id } },
      });
      expect(bal?.physicalQty).toBe(40.0);
    });

    it('should reject creating a duplicate SKU (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          sku: testProductSku,
          name: 'Duplicate SKU Bit',
          categoryId: testCategoryId,
          uom: 'PCS',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should search products by SKU and name', async () => {
      const res = await request(app)
        .get(`/api/v1/products?search=${testProductSku}`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].sku).toBe(testProductSku);
      expect(res.body.data[0].totalStock).toBe(40.0);
      expect(res.body.data[0].stockStatus).toBe('IN_STOCK');
    });

    it('should return complete product details with stock by location', async () => {
      const res = await request(app)
        .get(`/api/v1/products/${testProductId}`)
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.stockByLocation.length).toBeGreaterThan(0);
      expect(res.body.data.stockByLocation[0].quantity).toBe(40.0);
    });
  });

  describe('Receipts Workflow: Existing Stock + Received Quantity = New Stock', () => {
    let receiptId: string;

    it('should create a receipt in DRAFT status', async () => {
      const res = await request(app)
        .post('/api/v1/operations/receipts')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          warehouseId: testWarehouseId,
          notes: 'Inbound shipment of carbide drill bits',
          items: [
            {
              productId: testProductId,
              binId: testBin1Id,
              quantityReceived: 30.0,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('DRAFT');
      receiptId = res.body.data.id;

      // Stock should NOT change in DRAFT status
      const bal = await prisma.stockBalance.findUnique({
        where: { productId_binId: { productId: testProductId, binId: testBin1Id } },
      });
      expect(bal?.physicalQty).toBe(40.0);
    });

    it('should advance receipt status to READY', async () => {
      const res = await request(app)
        .patch(`/api/v1/operations/receipts/${receiptId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'READY' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('READY');
    });

    it('should validate receipt and transactionally increase stock: 40 + 30 = 70', async () => {
      const res = await request(app)
        .post(`/api/v1/operations/receipts/${receiptId}/validate`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('DONE');

      // Verify stock increased
      const bal = await prisma.stockBalance.findUnique({
        where: { productId_binId: { productId: testProductId, binId: testBin1Id } },
      });
      expect(bal?.physicalQty).toBe(70.0);

      // Verify Stock Ledger entry was created
      const ledger = await prisma.stockLedger.findFirst({
        where: { referenceDocId: receiptId, movementType: 'RECEIPT' },
      });
      expect(ledger).toBeDefined();
      expect(ledger?.quantity).toBe(30.0);
      expect(ledger?.qtyBefore).toBe(40.0);
      expect(ledger?.qtyAfter).toBe(70.0);
    });

    it('should reject re-validating an already completed receipt', async () => {
      const res = await request(app)
        .post(`/api/v1/operations/receipts/${receiptId}/validate`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Internal Transfers: Location Movement with Total Stock Consistency', () => {
    let transferId: string;

    it('should create an internal transfer in DRAFT status', async () => {
      const res = await request(app)
        .post('/api/v1/operations/transfers')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          sourceWarehouseId: testWarehouseId,
          destWarehouseId: testWarehouseId,
          notes: 'Transfer 20 bits from Bin 1 to Bin 2',
          items: [
            {
              productId: testProductId,
              sourceBinId: testBin1Id,
              destBinId: testBin2Id,
              quantity: 20.0,
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('DRAFT');
      transferId = res.body.data.id;
    });

    it('should complete transfer: Source 70 - 20 = 50, Dest 0 + 20 = 20, Total = 70', async () => {
      const res = await request(app)
        .post(`/api/v1/operations/transfers/${transferId}/complete`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('DONE');

      const [srcBal, destBal] = await Promise.all([
        prisma.stockBalance.findUnique({
          where: { productId_binId: { productId: testProductId, binId: testBin1Id } },
        }),
        prisma.stockBalance.findUnique({
          where: { productId_binId: { productId: testProductId, binId: testBin2Id } },
        }),
      ]);

      expect(srcBal?.physicalQty).toBe(50.0);
      expect(destBal?.physicalQty).toBe(20.0);
      expect(srcBal!.physicalQty + destBal!.physicalQty).toBe(70.0); // Total company stock preserved!
    });
  });

  describe('Delivery Orders: Existing Stock - Delivered Quantity = New Stock', () => {
    let doId: string;

    it('should reject delivery validation if demanded quantity exceeds available stock', async () => {
      // Demanding 100 when only 50 available in Bin 1
      const createRes = await request(app)
        .post('/api/v1/operations/deliveries')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          customerName: 'Excess Order LLC',
          warehouseId: testWarehouseId,
          items: [
            {
              productId: testProductId,
              binId: testBin1Id,
              quantityDemanded: 100.0,
            },
          ],
        });

      const excessDoId = createRes.body.data.id;

      const validateRes = await request(app)
        .post(`/api/v1/operations/deliveries/${excessDoId}/validate`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(validateRes.status).toBe(400);
      expect(validateRes.body.error.message).toContain('Insufficient stock');
    });

    it('should validate legitimate delivery order: Bin 1 stock 50 - 15 = 35', async () => {
      const createRes = await request(app)
        .post('/api/v1/operations/deliveries')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          customerName: 'AeroTech Systems Inc',
          warehouseId: testWarehouseId,
          items: [
            {
              productId: testProductId,
              binId: testBin1Id,
              quantityDemanded: 15.0,
            },
          ],
        });

      doId = createRes.body.data.id;

      const validateRes = await request(app)
        .post(`/api/v1/operations/deliveries/${doId}/validate`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(validateRes.status).toBe(200);
      expect(validateRes.body.data.status).toBe('DONE');

      const bal = await prisma.stockBalance.findUnique({
        where: { productId_binId: { productId: testProductId, binId: testBin1Id } },
      });
      expect(bal?.physicalQty).toBe(35.0);

      // Verify negative quantity in Stock Ledger
      const ledger = await prisma.stockLedger.findFirst({
        where: { referenceDocId: doId, movementType: 'DELIVERY' },
      });
      expect(ledger?.quantity).toBe(-15.0);
      expect(ledger?.qtyBefore).toBe(50.0);
      expect(ledger?.qtyAfter).toBe(35.0);
    });
  });

  describe('Stock Adjustments: Physical Count Reconciliation', () => {
    it('should perform stock adjustment for damaged goods: Counted 32 vs Recorded 35 (Diff: -3)', async () => {
      const res = await request(app)
        .post('/api/v1/operations/adjustments')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          productId: testProductId,
          binId: testBin1Id,
          countedQty: 32.0,
          reasonCode: 'DAMAGED',
          notes: 'Tool tip chipped during handling',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.differenceQty).toBe(-3.0);
      expect(res.body.data.recordedQty).toBe(35.0);
      expect(res.body.data.countedQty).toBe(32.0);

      // Verify balance was updated
      const bal = await prisma.stockBalance.findUnique({
        where: { productId_binId: { productId: testProductId, binId: testBin1Id } },
      });
      expect(bal?.physicalQty).toBe(32.0);

      // Verify Ledger
      const ledger = await prisma.stockLedger.findFirst({
        where: { referenceDocId: res.body.data.id, movementType: 'ADJUSTMENT' },
      });
      expect(ledger?.quantity).toBe(-3.0);
      expect(ledger?.qtyBefore).toBe(35.0);
      expect(ledger?.qtyAfter).toBe(32.0);
    });
  });

  describe('Stock Ledger & Move History Queries', () => {
    it('should query stock ledger filtered by product SKU and return chronological entries', async () => {
      const res = await request(app)
        .get(`/api/v1/inventory/ledger?search=${testProductSku}`)
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(4); // Opening + Receipt + Transfer + Delivery + Adjustment
      expect(res.body.pagination.totalItems).toBeGreaterThanOrEqual(4);
    });

    it('should query move history operational timeline', async () => {
      const res = await request(app)
        .get('/api/v1/inventory/move-history?limit=10')
        .set('Authorization', `Bearer ${auditorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('locationSummary');
      expect(res.body.data[0]).toHaveProperty('isPositive');
    });
  });

  describe('Dashboard KPIs and Telemetry', () => {
    it('should calculate accurate KPIs reflecting all inventory transactions', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/kpis')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalProductsInStock).toBeGreaterThan(0);
      expect(res.body.data).toHaveProperty('lowStockItemsCount');
      expect(res.body.data).toHaveProperty('outOfStockItemsCount');
      expect(res.body.data).toHaveProperty('pendingReceiptsCount');
      expect(res.body.data).toHaveProperty('pendingDeliveriesCount');
      expect(res.body.data).toHaveProperty('scheduledTransfersCount');
    });

    it('should retrieve dashboard recent operational activity', async () => {
      const res = await request(app)
        .get('/api/v1/dashboard/recent-activity')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('recentReceipts');
      expect(res.body.data).toHaveProperty('recentDeliveries');
      expect(res.body.data).toHaveProperty('recentTransfers');
      expect(res.body.data).toHaveProperty('recentMovements');
    });
  });
});
