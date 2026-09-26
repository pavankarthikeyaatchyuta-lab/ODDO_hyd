import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/core/database/prisma';
import bcrypt from 'bcryptjs';

describe('StockSense Authentication & Authorization Suite', () => {
  const app = createApp();

  let adminToken: string;
  let managerToken: string;
  let staffToken: string;
  let auditorToken: string;

  beforeAll(async () => {
    // Ensure test database is seeded
    const passwordHash = await bcrypt.hash('Password123!', 10);

    await prisma.user.upsert({
      where: { email: 'admin@stocksense.io' },
      update: { passwordHash },
      create: {
        email: 'admin@stocksense.io',
        passwordHash,
        firstName: 'System',
        lastName: 'Admin',
        role: 'ADMIN',
        isActive: true,
      },
    });

    await prisma.user.upsert({
      where: { email: 'manager@stocksense.io' },
      update: { passwordHash },
      create: {
        email: 'manager@stocksense.io',
        passwordHash,
        firstName: 'Sarah',
        lastName: 'Connor',
        role: 'INVENTORY_MANAGER',
        isActive: true,
      },
    });

    await prisma.user.upsert({
      where: { email: 'staff@stocksense.io' },
      update: { passwordHash },
      create: {
        email: 'staff@stocksense.io',
        passwordHash,
        firstName: 'John',
        lastName: 'Doe',
        role: 'WAREHOUSE_STAFF',
        isActive: true,
      },
    });

    await prisma.user.upsert({
      where: { email: 'auditor@stocksense.io' },
      update: { passwordHash },
      create: {
        email: 'auditor@stocksense.io',
        passwordHash,
        firstName: 'Elena',
        lastName: 'Rostova',
        role: 'VIEWER_AUDITOR',
        isActive: true,
      },
    });

    // Obtain tokens for all 4 roles
    const adminRes = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@stocksense.io',
      password: 'Password123!',
    });
    adminToken = adminRes.body.data.tokens.accessToken;

    const managerRes = await request(app).post('/api/v1/auth/login').send({
      email: 'manager@stocksense.io',
      password: 'Password123!',
    });
    managerToken = managerRes.body.data.tokens.accessToken;

    const staffRes = await request(app).post('/api/v1/auth/login').send({
      email: 'staff@stocksense.io',
      password: 'Password123!',
    });
    staffToken = staffRes.body.data.tokens.accessToken;

    const auditorRes = await request(app).post('/api/v1/auth/login').send({
      email: 'auditor@stocksense.io',
      password: 'Password123!',
    });
    auditorToken = auditorRes.body.data.tokens.accessToken;
  });

  // =========================================================================
  // 1. User Registration Tests
  // =========================================================================
  describe('POST /api/v1/auth/register', () => {
    const uniqueEmail = `testuser_${Date.now()}@example.com`;

    it('should register a new user successfully with complex password', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: uniqueEmail,
        password: 'SecurePassword123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'WAREHOUSE_STAFF',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(uniqueEmail);
      expect(res.body.data.user.role).toBe('WAREHOUSE_STAFF');
      expect(res.body.data.user).toHaveProperty('permissions');
      expect(res.body.data.tokens).toHaveProperty('accessToken');
      expect(res.body.data.tokens).toHaveProperty('refreshToken');
    });

    it('should reject registration if email already exists (409 Conflict)', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: uniqueEmail,
        password: 'SecurePassword123!',
        firstName: 'Duplicate',
        lastName: 'User',
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('should reject registration with weak password (missing number/uppercase)', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'weakpass@example.com',
        password: 'simplepassword',
        firstName: 'Weak',
        lastName: 'Pass',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // =========================================================================
  // 2. Login & Credential Verification Tests
  // =========================================================================
  describe('POST /api/v1/auth/login', () => {
    it('should authenticate user and return tokens and permissions', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@stocksense.io',
        password: 'Password123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('admin@stocksense.io');
      expect(res.body.data.user.role).toBe('ADMIN');
      expect(res.body.data.user.permissions).toContain('products:delete');
      expect(res.body.data.tokens.accessToken).toBeDefined();
    });

    it('should reject invalid password with 401 Unauthorized', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@stocksense.io',
        password: 'WrongPassword999!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Invalid credentials/i);
    });

    it('should reject non-existent user with 401 Unauthorized', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'doesnotexist@stocksense.io',
        password: 'Password123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // 3. Profile Management & Password Change
  // =========================================================================
  describe('Profile & Password Management', () => {
    it('GET /api/v1/auth/me should return authenticated user profile', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('manager@stocksense.io');
      expect(res.body.data.role).toBe('INVENTORY_MANAGER');
      expect(res.body.data.permissions).toContain('stock:adjust');
    });

    it('GET /api/v1/auth/me should fail without bearer token (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('PUT /api/v1/auth/me should update profile details', async () => {
      const res = await request(app)
        .put('/api/v1/auth/me')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ firstName: 'Sarah J.', lastName: 'Connor' });

      expect(res.status).toBe(200);
      expect(res.body.data.firstName).toBe('Sarah J.');
    });

    it('POST /api/v1/auth/password/change should fail with wrong current password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/password/change')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          currentPassword: 'IncorrectOldPassword1!',
          newPassword: 'BrandNewPassword123!',
          confirmPassword: 'BrandNewPassword123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/current password you entered is incorrect/i);
    });

    it('POST /api/v1/auth/password/change should succeed with correct credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/password/change')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          currentPassword: 'Password123!',
          newPassword: 'BrandNewPassword123!',
          confirmPassword: 'BrandNewPassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify login with new password
      const loginCheck = await request(app).post('/api/v1/auth/login').send({
        email: 'staff@stocksense.io',
        password: 'BrandNewPassword123!',
      });
      expect(loginCheck.status).toBe(200);

      // Reset back for subsequent test runs
      await request(app)
        .post('/api/v1/auth/password/change')
        .set('Authorization', `Bearer ${loginCheck.body.data.tokens.accessToken}`)
        .send({
          currentPassword: 'BrandNewPassword123!',
          newPassword: 'Password123!',
          confirmPassword: 'Password123!',
        });
    });
  });

  // =========================================================================
  // 4. Token Refresh & Logout Invalidation
  // =========================================================================
  describe('Session Lifecycle & Token Invalidation', () => {
    it('POST /api/v1/auth/refresh should rotate tokens', async () => {
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@stocksense.io',
        password: 'Password123!',
      });
      const originalRefresh = loginRes.body.data.tokens.refreshToken;

      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: originalRefresh });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.data.tokens.accessToken).toBeDefined();
      expect(refreshRes.body.data.tokens.refreshToken).toBeDefined();
    });

    it('POST /api/v1/auth/logout should revoke current token', async () => {
      // Login a temporary session
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@stocksense.io',
        password: 'Password123!',
      });
      const tempToken = loginRes.body.data.tokens.accessToken;

      // Access endpoint successfully
      const check1 = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tempToken}`);
      expect(check1.status).toBe(200);

      // Logout
      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${tempToken}`);
      expect(logoutRes.status).toBe(200);

      // Attempt to access endpoint with revoked token -> must fail with 401
      const check2 = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${tempToken}`);
      expect(check2.status).toBe(401);
      expect(check2.body.error.message).toMatch(/Session has been revoked/i);
    });
  });

  // =========================================================================
  // 5. OTP Password Reset Flow
  // =========================================================================
  describe('OTP-based Password Reset', () => {
    it('POST /api/v1/auth/otp/request should dispatch OTP', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ email: 'admin@stocksense.io' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('devOtpHint');
    });

    it('POST /api/v1/auth/otp/reset should reject wrong OTP code (400)', async () => {
      const res = await request(app).post('/api/v1/auth/otp/reset').send({
        email: 'admin@stocksense.io',
        otp: '000000',
        newPassword: 'NewPassword999!',
      });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/Invalid OTP code/i);
    });

    it('POST /api/v1/auth/otp/reset should succeed with valid OTP', async () => {
      const reqRes = await request(app)
        .post('/api/v1/auth/otp/request')
        .send({ email: 'admin@stocksense.io' });
      const validOtp = reqRes.body.data.devOtpHint;

      const resetRes = await request(app).post('/api/v1/auth/otp/reset').send({
        email: 'admin@stocksense.io',
        otp: validOtp,
        newPassword: 'ResetPassword123!',
      });

      expect(resetRes.status).toBe(200);

      // Login with reset password
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@stocksense.io',
        password: 'ResetPassword123!',
      });
      expect(loginRes.status).toBe(200);

      // Restore original password
      await request(app)
        .post('/api/v1/auth/password/change')
        .set('Authorization', `Bearer ${loginRes.body.data.tokens.accessToken}`)
        .send({
          currentPassword: 'ResetPassword123!',
          newPassword: 'Password123!',
          confirmPassword: 'Password123!',
        });
    });
  });

  // =========================================================================
  // 6. Role-Based Access Control & Permission Enforcement Tests
  // =========================================================================
  describe('Backend RBAC & Granular Permission Checks', () => {
    // 6.1 Admin (Superuser)
    describe('Admin Role Permissions', () => {
      it('Admin CAN delete products (products:delete)', async () => {
        const res = await request(app)
          .delete('/api/v1/sensitive/products/PRD-100')
          .set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
      });

      it('Admin CAN manage users (users:manage)', async () => {
        const res = await request(app)
          .post('/api/v1/sensitive/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ email: 'new@example.com' });
        expect(res.status).toBe(200);
      });

      it('Admin CAN adjust stock (stock:adjust)', async () => {
        const res = await request(app)
          .post('/api/v1/sensitive/stock/adjust')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ diff: -5 });
        expect(res.status).toBe(200);
      });
    });

    // 6.2 Inventory Manager
    describe('Inventory Manager Role Permissions', () => {
      it('Manager CAN adjust stock (stock:adjust)', async () => {
        const res = await request(app)
          .post('/api/v1/sensitive/stock/adjust')
          .set('Authorization', `Bearer ${managerToken}`)
          .send({ diff: -2 });
        expect(res.status).toBe(200);
      });

      it('Manager CAN approve purchase orders (purchase_orders:approve)', async () => {
        const res = await request(app)
          .post('/api/v1/sensitive/purchase-orders/PO-101/approve')
          .set('Authorization', `Bearer ${managerToken}`);
        expect(res.status).toBe(200);
      });

      it('Manager CANNOT delete products (403 Forbidden - missing products:delete)', async () => {
        const res = await request(app)
          .delete('/api/v1/sensitive/products/PRD-100')
          .set('Authorization', `Bearer ${managerToken}`);
        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe('FORBIDDEN');
        expect(res.body.error.message).toMatch(/missing required permission 'products:delete'/i);
      });

      it('Manager CANNOT manage users (403 Forbidden - missing users:manage)', async () => {
        const res = await request(app)
          .post('/api/v1/sensitive/users')
          .set('Authorization', `Bearer ${managerToken}`);
        expect(res.status).toBe(403);
        expect(res.body.error.message).toMatch(/missing required permission 'users:manage'/i);
      });
    });

    // 6.3 Warehouse Staff
    describe('Warehouse Staff Role Permissions', () => {
      it('Staff CAN receive stock (stock:receive)', async () => {
        const res = await request(app)
          .post('/api/v1/sensitive/stock/receive')
          .set('Authorization', `Bearer ${staffToken}`)
          .send({ qty: 10 });
        expect(res.status).toBe(200);
      });

      it('Staff CAN deliver stock (stock:deliver)', async () => {
        const res = await request(app)
          .post('/api/v1/sensitive/stock/deliver')
          .set('Authorization', `Bearer ${staffToken}`)
          .send({ qty: 5 });
        expect(res.status).toBe(200);
      });

      it('Staff CAN transfer stock (stock:transfer)', async () => {
        const res = await request(app)
          .post('/api/v1/sensitive/stock/transfer')
          .set('Authorization', `Bearer ${staffToken}`)
          .send({ qty: 5 });
        expect(res.status).toBe(200);
      });

      it('Staff CANNOT adjust stock (403 Forbidden - missing stock:adjust)', async () => {
        const res = await request(app)
          .post('/api/v1/sensitive/stock/adjust')
          .set('Authorization', `Bearer ${staffToken}`);
        expect(res.status).toBe(403);
        expect(res.body.error.message).toMatch(/missing required permission 'stock:adjust'/i);
      });

      it('Staff CANNOT approve inventory counts (403 Forbidden)', async () => {
        const res = await request(app)
          .post('/api/v1/sensitive/inventory-counts/CNT-1/approve')
          .set('Authorization', `Bearer ${staffToken}`);
        expect(res.status).toBe(403);
      });

      it('Staff CANNOT approve purchase orders (403 Forbidden)', async () => {
        const res = await request(app)
          .post('/api/v1/sensitive/purchase-orders/PO-1/approve')
          .set('Authorization', `Bearer ${staffToken}`);
        expect(res.status).toBe(403);
      });
    });

    // 6.4 Viewer / Auditor
    describe('Viewer/Auditor Role Permissions', () => {
      it('Auditor CAN view stock ledger (ledger:view)', async () => {
        const res = await request(app)
          .get('/api/v1/sensitive/ledger')
          .set('Authorization', `Bearer ${auditorToken}`);
        expect(res.status).toBe(200);
      });

      it('Auditor CANNOT receive stock (403 Forbidden)', async () => {
        const res = await request(app)
          .post('/api/v1/sensitive/stock/receive')
          .set('Authorization', `Bearer ${auditorToken}`);
        expect(res.status).toBe(403);
      });

      it('Auditor CANNOT adjust stock (403 Forbidden)', async () => {
        const res = await request(app)
          .post('/api/v1/sensitive/stock/adjust')
          .set('Authorization', `Bearer ${auditorToken}`);
        expect(res.status).toBe(403);
      });
    });

    // 6.5 Unauthenticated Requests
    describe('Unauthenticated Requests', () => {
      it('should reject unauthenticated calls to sensitive endpoints with 401', async () => {
        const res = await request(app).post('/api/v1/sensitive/stock/adjust');
        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('UNAUTHORIZED');
      });
    });
  });
});
