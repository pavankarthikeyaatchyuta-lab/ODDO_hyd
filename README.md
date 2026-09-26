# StockSense — Step 3: Authentication & Authorization Foundation

> **Milestone Status:** ✅ Fully Implemented, Tested, and Verified Locally  
> **Workspace Folder:** `step3/` (Isolated development step; not pushed directly to GitHub per instructions)  
> **Total Test Coverage:** 35 Passed Tests (`tests/auth.test.ts` & `tests/health.test.ts`)

---

## 1. Milestone Overview

In this milestone, we built the complete, production-grade **Authentication and Role-Based Authorization (RBAC)** infrastructure for **StockSense**, addressing all user security requirements before enabling physical inventory mutations.

Security enforcement is performed **strictly at the backend level** using Express middleware guards. Client-side route protection acts as a UX convenience, while every sensitive API endpoint enforces cryptographic JWT signature checks and granular permission validation.

---

## 2. Implemented Features

### 1. User Registration (`POST /api/v1/auth/register`)
- Input validation via Zod enforcing email format, name fields, and password complexity (minimum 8 characters, at least 1 uppercase letter, at least 1 numeric digit).
- Password hashed with `bcryptjs` using 10 salt rounds.
- Returns created user profile along with immediate access and refresh tokens.
- Rejects duplicate email addresses with `409 Conflict`.

### 2. User Login (`POST /api/v1/auth/login`)
- Verifies email and password against stored bcrypt hash.
- Rejects deactivated accounts or invalid credentials with `401 Unauthorized`.
- Updates user's `lastLoginAt` timestamp in the database.
- Issues short-lived Access Token (JWT, 15m expiration) and long-lived Refresh Token (JWT, 7d expiration).
- Returns user profile including assigned role and computed permissions list.

### 3. Logout & Token Revocation (`POST /api/v1/auth/logout`)
- Implements an active Token Revocation Blacklist using unique JWT identifier (`jti`) claims.
- Revokes both the active access token and associated refresh token.
- Prevents stolen or leaked tokens from being reused after user sign-out (returns `401 Unauthorized: Session has been revoked`).

### 4. Session & Token Rotation (`POST /api/v1/auth/refresh`)
- Rotates access and refresh tokens without requiring user re-authentication.
- Validates refresh token authenticity and automatically blacklists the old refresh token `jti` to prevent replay attacks.

### 5. Profile Management (`GET /api/v1/auth/me` & `PUT /api/v1/auth/me`)
- Returns the full profile of the authenticated user, role, and active permissions array.
- Allows updating profile details (first name, last name).

### 6. Authenticated Password Change (`POST /api/v1/auth/password/change`)
- Requires the user's current password, new password, and confirmation.
- Verifies current password before applying changes.
- Rejects matching old and new passwords.
- Updates password hash and logs security audit trail.

### 7. OTP-Based Password Reset (`POST /api/v1/auth/otp/request` & `POST /api/v1/auth/otp/reset`)
- **Step 1 (Request):** User submits email. Server generates a cryptographically random 6-digit numeric OTP valid for 10 minutes.
- **Anti-Enumeration Guard:** Uniform generic message returned even if email does not exist in the database.
- **Step 2 (Reset):** User submits email, 6-digit OTP, and new password. Server verifies match and timestamp validity.
- Rejects incorrect OTP codes or expired OTP sessions with `400 Bad Request`.
- On success, updates user's password hash and clears the OTP secret.

---

## 3. Role-Based Access Control (RBAC) & Sensitive Operations

### 3.1 Role Hierarchy

| Role | Operational Scope | Description |
| :--- | :--- | :--- |
| **`ADMIN`** | Global Superuser | Possesses universal privileges across all modules, sensitive approvals, user management, and product deletions. |
| **`INVENTORY_MANAGER`** | Warehouse Operations Lead | Approves Purchase Orders, validates Stock Adjustments, signs off Cycle Counts, creates/updates catalog SKUs. Cannot delete products or manage users. |
| **`WAREHOUSE_STAFF`** | Floor Staff / Scanner Operator | Executes receiving, picking, deliveries, and internal transfers. Cannot adjust stock or approve POs without manager sign-off. |
| **`VIEWER_AUDITOR`** | Read-Only Compliance Auditor | Can inspect the immutable Stock Ledger and analytics reports. Cannot execute any mutations. |

### 3.2 Granular Permission Matrix

```text
Permission Key               Admin   Inventory Manager   Warehouse Staff   Viewer/Auditor
-----------------------------------------------------------------------------------------
products:create_update        [x]           [x]                [ ]              [ ]
products:delete               [x]           [ ]                [ ]              [ ]
purchase_orders:create        [x]           [x]                [ ]              [ ]
purchase_orders:approve       [x]           [x]                [ ]              [ ]
stock:receive                 [x]           [x]                [x]              [ ]
stock:deliver                 [x]           [x]                [x]              [ ]
stock:transfer                [x]           [x]                [x]              [ ]
stock:adjust                  [x]           [x]                [ ]              [ ]
inventory_counts:approve      [x]           [x]                [ ]              [ ]
users:manage                  [x]           [ ]                [ ]              [ ]
warehouses:manage             [x]           [x]                [ ]              [ ]
ledger:view                   [x]           [x]                [x]              [x]
analytics:view                [x]           [x]                [ ]              [x]
```

### 3.3 Protected Sensitive Endpoints (`/api/v1/sensitive/*`)

All sensitive operations are protected by `requireAuth` and granular `requirePermission(...)` middleware:

```text
POST   /api/v1/sensitive/products                      # products:create_update
DELETE /api/v1/sensitive/products/:id                  # products:delete (Admin only)
POST   /api/v1/sensitive/purchase-orders               # purchase_orders:create
POST   /api/v1/sensitive/purchase-orders/:id/approve   # purchase_orders:approve
POST   /api/v1/sensitive/stock/receive                 # stock:receive
POST   /api/v1/sensitive/stock/deliver                 # stock:deliver
POST   /api/v1/sensitive/stock/transfer                # stock:transfer
POST   /api/v1/sensitive/stock/adjust                  # stock:adjust
POST   /api/v1/sensitive/inventory-counts/:id/approve  # inventory_counts:approve
POST   /api/v1/sensitive/users                         # users:manage (Admin only)
POST   /api/v1/sensitive/warehouses                    # warehouses:manage
GET    /api/v1/sensitive/ledger                        # ledger:view
```

---

## 4. Standard Error Response Specifications

All error responses strictly adhere to standard HTTP status codes and RFC 7807 problem details:

- **`401 Unauthorized` (Missing / Invalid Token / Expired Session / Invalid Credentials):**
  ```json
  {
    "success": false,
    "error": {
      "code": "UNAUTHORIZED",
      "message": "Invalid credentials. Check email and password."
    },
    "timestamp": "2026-09-26T04:13:20Z"
  }
  ```

- **`403 Forbidden` (User lacks required granular permission):**
  ```json
  {
    "success": false,
    "error": {
      "code": "FORBIDDEN",
      "message": "Access forbidden: missing required permission 'products:delete'. Current role 'INVENTORY_MANAGER' does not have this capability."
    },
    "timestamp": "2026-09-26T04:13:30Z"
  }
  ```

- **`400 Bad Request` (Invalid or Expired OTP):**
  ```json
  {
    "success": false,
    "error": {
      "code": "BAD_REQUEST",
      "message": "Invalid OTP code. Please enter the correct 6-digit code."
    },
    "timestamp": "2026-09-26T04:13:25Z"
  }
  ```

- **`409 Conflict` (Duplicate User Email):**
  ```json
  {
    "success": false,
    "error": {
      "code": "CONFLICT",
      "message": "A user with this email address already exists in the system."
    },
    "timestamp": "2026-09-26T04:13:18Z"
  }
  ```

---

## 5. Seeded Test Accounts

The following demo accounts are seeded and ready for testing:

| Role | Email Address | Password | Key Characteristics |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@stocksense.io` | `Password123!` | Can delete products, manage users, approve all actions. |
| **Inventory Manager** | `manager@stocksense.io` | `Password123!` | Can approve POs and adjust stock. Cannot delete products or manage users. |
| **Warehouse Staff** | `staff@stocksense.io` | `Password123!` | Can receive, deliver, and transfer stock. Cannot adjust stock or approve POs. |
| **Viewer / Auditor** | `auditor@stocksense.io` | `Password123!` | Read-only ledger inspection. Cannot execute stock moves. |

---

## 6. Automated Test Suite Results

Ran with **Vitest v3.2.7**:

```text
 ✓ tests/health.test.ts (2 tests)
 ✓ tests/auth.test.ts (33 tests)

 Test Files  2 passed (2)
      Tests  35 passed (35)
   Duration  7.97s
```

### Verified Test Scenarios
- [x] Complex password validation (rejects weak passwords missing uppercase/number)
- [x] Duplicate email registration prevention (`409 Conflict`)
- [x] Successful login & token issuance
- [x] Invalid password rejection (`401 Unauthorized`)
- [x] Non-existent user rejection (`401 Unauthorized`)
- [x] Profile retrieval and update
- [x] Password change with old password verification
- [x] Token rotation on `/auth/refresh`
- [x] Logout token revocation and rejection of blacklisted tokens
- [x] OTP request generation with expiry
- [x] OTP verification rejection on mismatch
- [x] OTP password reset and subsequent login
- [x] Admin permission execution (`products:delete`, `users:manage`, `stock:adjust`)
- [x] Manager permission execution (`stock:adjust`, `purchase_orders:approve`)
- [x] Manager permission rejection on `products:delete` (`403 Forbidden`)
- [x] Manager permission rejection on `users:manage` (`403 Forbidden`)
- [x] Staff permission execution (`stock:receive`, `stock:deliver`, `stock:transfer`)
- [x] Staff permission rejection on `stock:adjust` (`403 Forbidden`)
- [x] Staff permission rejection on `purchase_orders:approve` (`403 Forbidden`)
- [x] Auditor permission execution on `ledger:view`
- [x] Auditor permission rejection on `stock:receive` and `stock:adjust` (`403 Forbidden`)
- [x] Unauthenticated request rejection (`401 Unauthorized`)

---

## 7. How to Run Step 3 Locally

### 1. Start the Backend API
In terminal 1:
```bash
cd step3/backend
npm run dev
```
*API is accessible at:* `http://localhost:5000`

### 2. Start the Frontend Application
In terminal 2:
```bash
cd step3/frontend
npm run dev
```
*Web application opens at:* `http://localhost:5173`

### 3. Run the Automated Tests
```bash
cd step3/backend
npm run test
```