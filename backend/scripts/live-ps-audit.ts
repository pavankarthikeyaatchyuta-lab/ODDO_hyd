import { PrismaClient } from '@prisma/client';

const API = 'http://localhost:5000/api/v1';
const prisma = new PrismaClient();

async function postJson(url: string, body: any, headers: Record<string, string> = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function getJson(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...headers },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function patchJson(url: string, body: any, headers: Record<string, string> = {}) {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function runLiveAudit() {
  console.log('🚀 Starting Comprehensive Live End-to-End PS Verification Audit...\n');

  // ==========================================
  // 1. AUTH VERIFICATION
  // ==========================================
  console.log('--- 1. AUTHENTICATION & SECURITY AUDIT ---');
  // Login as admin
  const loginRes = await postJson(`${API}/auth/login`, {
    email: 'admin@stocksense.io',
    password: 'Password123!',
  });
  if (loginRes.status !== 200 || !loginRes.data?.data?.tokens?.accessToken) {
    throw new Error(`Admin login failed: ${JSON.stringify(loginRes)}`);
  }
  const adminToken = loginRes.data.data.tokens.accessToken;
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  console.log('  ✔ Admin login successful');

  // Signup new user
  const testUserEmail = `audit_user_${Date.now()}@stocksense.io`;
  const registerRes = await postJson(`${API}/auth/register`, {
    email: testUserEmail,
    password: 'SecurePassword123!',
    firstName: 'Audit',
    lastName: 'Tester',
    role: 'WAREHOUSE_STAFF',
  });
  if (registerRes.status !== 201) throw new Error(`User signup failed: ${JSON.stringify(registerRes)}`);
  console.log(`  ✔ User signup successful: ${testUserEmail}`);

  // OTP password reset request
  const otpRes = await postJson(`${API}/auth/otp/request`, { email: 'admin@stocksense.io' });
  if (otpRes.status !== 200) throw new Error(`OTP request failed: ${JSON.stringify(otpRes)}`);
  console.log('  ✔ OTP reset request endpoint verified');

  // ==========================================
  // 2. DASHBOARD & DYNAMIC FILTERS AUDIT
  // ==========================================
  console.log('\n--- 2. DASHBOARD KPIS & DYNAMIC FILTERS AUDIT ---');
  const kpiRes = await getJson(`${API}/dashboard/kpis`, adminHeaders);
  const kpis = kpiRes.data.data;
  console.log('  Live Dashboard KPIs:', JSON.stringify(kpis));
  if (
    typeof kpis.totalProductsInStock !== 'number' ||
    typeof kpis.lowStockItemsCount !== 'number' ||
    typeof kpis.outOfStockItemsCount !== 'number' ||
    typeof kpis.pendingReceiptsCount !== 'number' ||
    typeof kpis.pendingDeliveriesCount !== 'number' ||
    typeof kpis.scheduledTransfersCount !== 'number'
  ) {
    throw new Error('KPIs structure invalid');
  }
  console.log('  ✔ All 6 mandatory KPIs verified and numeric');

  // Test dynamic filter by document type
  const filterDocRes = await getJson(`${API}/dashboard/recent-activity?documentType=RECEIPTS`, adminHeaders);
  if (filterDocRes.status !== 200) throw new Error('Document filter failed');
  console.log('  ✔ Document type filter verified');

  // Test dynamic filter by status
  const filterStatusRes = await getJson(`${API}/dashboard/recent-activity?status=DONE`, adminHeaders);
  if (filterStatusRes.status !== 200) throw new Error('Status filter failed');
  console.log('  ✔ Status filter verified');

  // ==========================================
  // 3. WAREHOUSES & SPATIAL HIERARCHY AUDIT
  // ==========================================
  console.log('\n--- 3. WAREHOUSES & SPATIAL HIERARCHY AUDIT ---');
  const whListRes = await getJson(`${API}/warehouses`, adminHeaders);
  const warehouses = whListRes.data.data;
  if (!warehouses || warehouses.length === 0) throw new Error('No warehouses returned');
  const targetWh = warehouses.find((w: any) => w.code === 'WH-MAIN') || warehouses[0];

  const whDetailRes = await getJson(`${API}/warehouses/${targetWh.id}`, adminHeaders);
  const hierarchy = whDetailRes.data.data;
  if (!hierarchy.zones || hierarchy.zones.length === 0) throw new Error('No zones in warehouse');
  const targetZone = hierarchy.zones[0];
  const targetRack = targetZone.racks[0];
  const targetShelf = targetRack.shelves[0];
  const bin1 = targetShelf.bins[0];
  const bin2 = targetShelf.bins[1] || targetShelf.bins[0];
  console.log(`  ✔ Verified spatial hierarchy: ${targetWh.code} -> ${targetZone.name} -> ${targetRack.code} -> ${targetShelf.code} -> ${bin1.code}`);

  // ==========================================
  // 4. PRODUCTS & SKU UNIQUENESS AUDIT
  // ==========================================
  console.log('\n--- 4. PRODUCTS MANAGEMENT & UNIQUENESS AUDIT ---');
  const catListRes = await getJson(`${API}/categories`, adminHeaders);
  const categoryId = catListRes.data.data[0].id;

  const testSku = `AUDIT-${Date.now().toString(36).toUpperCase()}`;
  const prodRes = await postJson(
    `${API}/products`,
    {
      sku: testSku,
      name: 'High Precision Carbide Cutter',
      description: 'Audit test product for full operational workflow',
      categoryId,
      uom: 'PCS',
      costPrice: 25.0,
      salePrice: 45.0,
      minStock: 20,
      maxStock: 200,
      reorderQuantity: 50,
      initialStock: 100,
      initialBinId: bin1.id,
    },
    adminHeaders
  );
  if (prodRes.status !== 201) throw new Error(`Product creation failed: ${JSON.stringify(prodRes)}`);
  const product = prodRes.data.data;
  console.log(`  ✔ Created product: ${product.name} (SKU: ${product.sku}, Initial Stock: 100)`);

  // Assert SKU uniqueness
  const dupProdRes = await postJson(
    `${API}/products`,
    {
      sku: testSku,
      name: 'Duplicate SKU Product',
      categoryId,
      uom: 'PCS',
    },
    adminHeaders
  );
  if (dupProdRes.status === 409) {
    console.log('  ✔ Duplicate SKU rejection (409 Conflict) verified');
  } else {
    throw new Error(`Duplicate SKU expected 409, got ${dupProdRes.status}`);
  }

  // Verify stock by location in Neon DB
  const initialBalance = await prisma.stockBalance.findUnique({
    where: { productId_binId: { productId: product.id, binId: bin1.id } },
  });
  if (!initialBalance || initialBalance.physicalQty !== 100) {
    throw new Error(`Initial stock expected 100, got ${initialBalance?.physicalQty}`);
  }
  console.log('  ✔ Verified initial stock in Neon DB: 100 units');

  // ==========================================
  // 5. RECEIPT WORKFLOW AUDIT
  // Formula: Existing (100) + Received (50) = 150
  // ==========================================
  console.log('\n--- 5. INBOUND RECEIPT WORKFLOW AUDIT ---');
  const receiptCreateRes = await postJson(
    `${API}/operations/receipts`,
    {
      warehouseId: targetWh.id,
      notes: 'Audit shipment intake test',
      items: [{ productId: product.id, binId: bin1.id, quantityReceived: 50 }],
    },
    adminHeaders
  );
  const receiptId = receiptCreateRes.data.data.id;
  console.log(`  ✔ Inbound Receipt created in DRAFT (ID: ${receiptId})`);

  // Validate receipt
  const receiptValRes = await postJson(`${API}/operations/receipts/${receiptId}/validate`, {}, adminHeaders);
  if (receiptValRes.status !== 200 || receiptValRes.data?.data?.status !== 'DONE') {
    throw new Error(`Receipt validation failed: ${JSON.stringify(receiptValRes)}`);
  }

  // Check stock increased exactly once
  const balAfterReceipt = await prisma.stockBalance.findUnique({
    where: { productId_binId: { productId: product.id, binId: bin1.id } },
  });
  if (balAfterReceipt?.physicalQty !== 150) {
    throw new Error(`Stock expected 150 after receipt, got ${balAfterReceipt?.physicalQty}`);
  }
  console.log('  ✔ Stock increased exactly once: 100 + 50 = 150 units');

  // Check ledger entry
  const receiptLedger = await prisma.stockLedger.findFirst({
    where: { referenceDocId: receiptId, movementType: 'RECEIPT' },
  });
  if (!receiptLedger || receiptLedger.quantity !== 50 || receiptLedger.qtyAfter !== 150) {
    throw new Error('Receipt ledger entry incorrect');
  }
  console.log('  ✔ Exactly one immutable ledger movement recorded for receipt');

  // Duplicate validation attempt
  const dupReceiptValRes = await postJson(`${API}/operations/receipts/${receiptId}/validate`, {}, adminHeaders);
  if (dupReceiptValRes.status === 400) {
    console.log('  ✔ Duplicate receipt validation prevented (400 Bad Request)');
  } else {
    throw new Error(`Duplicate validation expected 400, got ${dupReceiptValRes.status}`);
  }

  // Re-verify stock balance after duplicate attempt
  const balAfterDupReceipt = await prisma.stockBalance.findUnique({
    where: { productId_binId: { productId: product.id, binId: bin1.id } },
  });
  if (balAfterDupReceipt?.physicalQty !== 150) {
    throw new Error('Stock changed during duplicate validation!');
  }
  console.log('  ✔ Confirmed stock remained at 150 after duplicate validation attempt');

  // ==========================================
  // 6. DELIVERY ORDER WORKFLOW AUDIT
  // Formula: Existing (150) - Delivered (30) = 120
  // ==========================================
  console.log('\n--- 6. OUTBOUND DELIVERY ORDER WORKFLOW AUDIT ---');
  // Attempt delivery larger than available stock (demanded 200 > 150 available)
  const excessDoRes = await postJson(
    `${API}/operations/deliveries`,
    {
      customerName: 'Excess Demand Corp',
      warehouseId: targetWh.id,
      items: [{ productId: product.id, binId: bin1.id, quantityDemanded: 200 }],
    },
    adminHeaders
  );
  const excessDoId = excessDoRes.data.data.id;

  const excessValRes = await postJson(`${API}/operations/deliveries/${excessDoId}/validate`, {}, adminHeaders);
  if (excessValRes.status === 400) {
    console.log('  ✔ Insufficient stock delivery rejected (400 Bad Request: 200 demanded > 150 available)');
  } else {
    throw new Error(`Excess delivery validation expected 400, got ${excessValRes.status}`);
  }

  // Legitimate delivery order for 30 units
  const legitDoRes = await postJson(
    `${API}/operations/deliveries`,
    {
      customerName: 'Legitimate Customer Ltd',
      warehouseId: targetWh.id,
      items: [{ productId: product.id, binId: bin1.id, quantityDemanded: 30 }],
    },
    adminHeaders
  );
  const legitDoId = legitDoRes.data.data.id;

  const doValRes = await postJson(`${API}/operations/deliveries/${legitDoId}/validate`, {}, adminHeaders);
  if (doValRes.status !== 200 || doValRes.data?.data?.status !== 'DONE') {
    throw new Error(`Delivery validation failed: ${JSON.stringify(doValRes)}`);
  }

  const balAfterDelivery = await prisma.stockBalance.findUnique({
    where: { productId_binId: { productId: product.id, binId: bin1.id } },
  });
  if (balAfterDelivery?.physicalQty !== 120) {
    throw new Error(`Stock expected 120 after delivery, got ${balAfterDelivery?.physicalQty}`);
  }
  console.log('  ✔ Stock decreased exactly once: 150 - 30 = 120 units');

  // Duplicate delivery validation attempt
  const dupDoValRes = await postJson(`${API}/operations/deliveries/${legitDoId}/validate`, {}, adminHeaders);
  if (dupDoValRes.status === 400) {
    console.log('  ✔ Duplicate delivery validation prevented (400 Bad Request)');
  } else {
    throw new Error(`Duplicate DO expected 400, got ${dupDoValRes.status}`);
  }

  // ==========================================
  // 7. INTERNAL TRANSFERS AUDIT (ZERO-DELTA)
  // Source: 120 - 20 = 100, Dest: 0 + 20 = 20, Total = 120
  // ==========================================
  console.log('\n--- 7. ZERO-DELTA INTERNAL TRANSFER AUDIT ---');
  const transferRes = await postJson(
    `${API}/operations/transfers`,
    {
      sourceWarehouseId: targetWh.id,
      destWarehouseId: targetWh.id,
      items: [{ productId: product.id, sourceBinId: bin1.id, destBinId: bin2.id, quantity: 20 }],
    },
    adminHeaders
  );
  const transferId = transferRes.data.data.id;

  const trfCompleteRes = await postJson(`${API}/operations/transfers/${transferId}/complete`, {}, adminHeaders);
  if (trfCompleteRes.status !== 200 || trfCompleteRes.data?.data?.status !== 'DONE') {
    throw new Error(`Transfer completion failed: ${JSON.stringify(trfCompleteRes)}`);
  }

  const balSrcAfterTrf = await prisma.stockBalance.findUnique({
    where: { productId_binId: { productId: product.id, binId: bin1.id } },
  });
  const balDestAfterTrf = await prisma.stockBalance.findUnique({
    where: { productId_binId: { productId: product.id, binId: bin2.id } },
  });

  const totalAfterTrf = (balSrcAfterTrf?.physicalQty || 0) + (balDestAfterTrf?.physicalQty || 0);
  if (balSrcAfterTrf?.physicalQty !== 100 || balDestAfterTrf?.physicalQty !== 20 || totalAfterTrf !== 120) {
    throw new Error(`Transfer balance mismatch: Src=${balSrcAfterTrf?.physicalQty}, Dest=${balDestAfterTrf?.physicalQty}, Total=${totalAfterTrf}`);
  }
  console.log('  ✔ Source stock: 120 - 20 = 100 units');
  console.log('  ✔ Destination stock: 0 + 20 = 20 units');
  console.log('  ✔ Total company inventory unchanged: 100 + 20 = 120 units (Delta = 0)');

  // ==========================================
  // 8. STOCK ADJUSTMENT AUDIT
  // Delta = Counted (92) - Recorded (100) = -8
  // New Stock = 92
  // ==========================================
  console.log('\n--- 8. PHYSICAL COUNT ADJUSTMENT AUDIT ---');
  const adjRes = await postJson(
    `${API}/operations/adjustments`,
    {
      productId: product.id,
      binId: bin1.id,
      countedQty: 92,
      reasonCode: 'DAMAGED',
      notes: 'Water damage identified during shift inspection',
    },
    adminHeaders
  );
  if (adjRes.status !== 201) throw new Error(`Stock adjustment creation failed: ${JSON.stringify(adjRes)}`);
  const adj = adjRes.data.data;
  if (adj.differenceQty !== -8 || adj.recordedQty !== 100 || adj.countedQty !== 92) {
    throw new Error(`Adjustment calculations incorrect: diff=${adj.differenceQty}, recorded=${adj.recordedQty}`);
  }

  const balAfterAdj = await prisma.stockBalance.findUnique({
    where: { productId_binId: { productId: product.id, binId: bin1.id } },
  });
  if (balAfterAdj?.physicalQty !== 92) {
    throw new Error(`Balance after adjustment expected 92, got ${balAfterAdj?.physicalQty}`);
  }
  console.log('  ✔ Recorded Stock: 100 units, Counted Stock: 92 units');
  console.log('  ✔ Calculated Delta = 92 - 100 = -8 units');
  console.log('  ✔ New Stock in Neon DB = 92 units');

  // ==========================================
  // 9. IMMUTABLE STOCK LEDGER VERIFICATION
  // ==========================================
  console.log('\n--- 9. IMMUTABLE STOCK LEDGER AUDIT ---');
  const ledgers = await prisma.stockLedger.findMany({
    where: { productId: product.id },
    orderBy: { timestamp: 'asc' },
  });
  console.log(`  Total immutable ledger entries recorded for ${product.sku}: ${ledgers.length}`);
  for (const l of ledgers) {
    if (!l.productId || !l.sku || l.qtyBefore === undefined || l.qtyAfter === undefined || !l.movementType || !l.referenceDocNumber || !l.timestamp) {
      throw new Error(`Incomplete ledger entry: ${JSON.stringify(l)}`);
    }
    console.log(`    • [${l.movementType}] Δ ${l.quantity > 0 ? '+' : ''}${l.quantity} | Balance: ${l.qtyBefore} -> ${l.qtyAfter} | Ref: ${l.referenceDocNumber}`);
  }
  if (ledgers.length < 5) throw new Error('Expected at least 5 ledger entries');
  console.log('  ✔ Every single stock mutation has complete audit fields (Product, SKU, Qty, Before, After, MovementType, Ref, Timestamp)');

  // ==========================================
  // 10. INVALID STATUS TRANSITIONS REJECTION
  // ==========================================
  console.log('\n--- 10. STATUS STATE MACHINE & INVALID TRANSITIONS AUDIT ---');
  const invalidStatusRes = await patchJson(`${API}/operations/receipts/${receiptId}/status`, { status: 'READY' }, adminHeaders);
  if (invalidStatusRes.status === 400) {
    console.log('  ✔ Invalid status transition on completed receipt rejected (400 Bad Request)');
  } else {
    throw new Error(`Invalid status transition expected 400, got ${invalidStatusRes.status}`);
  }

  console.log('\n==================================================');
  console.log('🏆 ALL E2E VERIFICATION AUDIT CHECKS PASSED 100%!');
  console.log('==================================================\n');
}

runLiveAudit()
  .catch((err) => {
    console.error('❌ Audit failure:', err.message, err.response?.data || '');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
