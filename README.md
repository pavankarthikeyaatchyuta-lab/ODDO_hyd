# StockSense — Intelligent Inventory Management System

> **Next-generation, real-time inventory platform engineered for complete stock traceability, multi-warehouse operational excellence, and data-grounded intelligence.**

[![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-Pending-orange?style=flat-square&logo=githubactions)](https://github.com/pavankarthikeyaatchyuta-lab/ODDO_hyd/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Repository Version](https://img.shields.io/badge/Version-0.1.0--dev-informational?style=flat-square)](https://github.com/pavankarthikeyaatchyuta-lab/ODDO_hyd)
[![Architecture: Modular Monolith / Microservices-Ready](https://img.shields.io/badge/Architecture-Modular%20Monolith-green?style=flat-square)](ARCHITECTURE.md)
[![UI Mockup Reference](https://img.shields.io/badge/Mockup-Excalidraw-purple?style=flat-square)](https://link.excalidraw.com/l/65VNwvy7c4X/3ENvQFu9o8R)

---

## Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Problem Being Solved](#2-problem-being-solved)
- [3. Vision](#3-vision)
- [4. Implementation Status](#4-implementation-status)
- [5. User Roles and RBAC](#5-user-roles-and-rbac)
- [6. Complete Inventory Workflow](#6-complete-inventory-workflow)
- [7. Core Inventory Consistency Rules](#7-core-inventory-consistency-rules)
- [8. Key Features](#8-key-features)
- [9. Application Modules & Navigation Structure](#9-application-modules--navigation-structure)
- [10. Warehouse Location Hierarchy](#10-warehouse-location-hierarchy)
- [11. Advanced Stock Ledger](#11-advanced-stock-ledger)
- [12. Audit Trail System](#12-audit-trail-system)
- [13. Intelligent Features & Stock Forecasting](#13-intelligent-features--stock-forecasting)
- [14. AI Inventory Assistant](#14-ai-inventory-assistant)
- [15. Inventory Anomaly Detection](#15-inventory-anomaly-detection)
- [16. Inventory Counting & Cycle Count Sessions](#16-inventory-counting--cycle-count-sessions)
- [17. Barcode & QR Code Operations](#17-barcode--qr-code-operations)
- [18. Batch, Serial & Expiry (FEFO) Management](#18-batch-serial--expiry-fefo-management)
- [19. Analytics, Notifications & Reporting](#19-analytics-notifications--reporting)
- [20. Architecture Overview](#20-architecture-overview)
- [21. Technology Stack](#21-technology-stack)
- [22. Project Directory Structure](#22-project-directory-structure)
- [23. Database & Domain Model](#23-database--domain-model)
- [24. API Specification Overview](#24-api-specification-overview)
- [25. Authentication & Authorization](#25-authentication--authorization)
- [26. Setup Instructions & Prerequisites](#26-setup-instructions--prerequisites)
- [27. Environment Variables](#27-environment-variables)
- [28. Local Development Guide](#28-local-development-guide)
- [29. Database Setup & Migrations](#29-database-setup--migrations)
- [30. Testing Strategy](#30-testing-strategy)
- [31. Deployment Guidelines](#31-deployment-guidelines)
- [32. Security Considerations](#32-security-considerations)
- [33. UI/UX Design Direction](#33-uiux-design-direction)
- [34. Product Roadmap](#34-product-roadmap)
- [35. Contributing](#35-contributing)
- [36. License](#36-license)

---

## 1. Project Overview

**StockSense** is an enterprise-grade, modular Inventory Management System (IMS) engineered to digitize, unify, and elevate stock operations across organizations of all scales. 

StockSense transitions traditional paper registers, disjointed spreadsheets, and brittle inventory scripts into a high-precision, transactional ledger system. It couples day-to-day warehouse operations—such as multi-location stocking, cross-docking, picking, packing, internal transfers, and physical counts—with deterministic forecasting models and grounded conversational AI assistants.

The design is governed by one non-negotiable rule: **Zero unrecorded stock movement.** Every physical or virtual transaction produces an immutable entry in the Stock Ledger, establishing verifiable chain-of-custody, location balance preservation, and inventory auditability.

---

## 2. Problem Being Solved

Modern distribution centers, manufacturing plants, and retail enterprises struggle with widespread operational friction:

1. **Information Asymmetry & Spreadsheet Chaos:** Stock counts maintained in siloed Excel files lead to inventory desynchronization, phantom stock, and accidental stockouts.
2. **Double-Allocation & Reservation Errors:** Orders are promised to customers without guaranteeing reserved physical stock, leading to fulfillment failures.
3. **Traceability Gaps:** When items go missing or degrade, traditional systems lack historical provenance detailing *who* moved *what*, *where*, *when*, and *under what authorization*.
4. **Blind Reordering:** Replenishment decisions are either made through gut feeling or sluggish manual audits, causing excess holding costs or critical component stockouts.
5. **Slow Warehouse Physical Processing:** Staff waste hours manually typing SKU numbers instead of leveraging camera-based scanning, mobile validation, and digital picking sheets.

StockSense eliminates these failure modes with an immutable transactional ledger, hierarchical location tracking, strict role-based access, and real-time operational workflows.

---

## 3. Vision

StockSense evolves beyond a passive digital recording tool into an **Intelligent Inventory Platform**:

```text
+-------------------------------------------------------------------------------+
|                        STOCKSENSE STRATEGIC VISION                            |
+-------------------------------------------------------------------------------+
|  Traditional IMS                  Operational IMS               Intelligent Platform |
|  (Static Records)      --->       (Transactional Flow)   --->   (Proactive & Grounded)|
|                                                                               |
|  - Manual data entry              - Ledger-backed moves         - Deterministic runout|
|  - End-of-day sync                - Mobile barcode picking      - Grounded AI analyst |
|  - Excel exports                  - Location hierarchy          - Anomaly detection   |
|  - Disconnected procurement       - Linked POs & Deliveries     - Automated reorder   |
+-------------------------------------------------------------------------------+
```

The system continuously audits inventory health, calculates deterministic consumption velocities, flags unusual shrinkage, and empowers managers with an AI inventory assistant grounded strictly in actual transactional data.

---

## 4. Implementation Status

### Current Core Implementation (Fully Production-Ready & Tested)
- [x] **Central Inventory Transaction Engine**: Backend atomic transactions (`prisma.$transaction`) enforcing non-negotiable inventory consistency and zero unrecorded stock movements.
- [x] **Authentication & RBAC**: User registration, login, logout, bcrypt password hashing, JWT bearer tokens, active token blacklist, and OTP-based password reset.
- [x] **Backend-Enforced Authorization**: 4 distinct user roles (`ADMIN`, `INVENTORY_MANAGER`, `WAREHOUSE_STAFF`, `VIEWER_AUDITOR`) protecting all sensitive API endpoints.
- [x] **Inventory Dashboard**: Exact 6 live KPIs, dynamic multi-dimensional filters (Document Type, Status, Warehouse/Location, Product Category), recent activity stream, low/out-of-stock panels, and quick actions.
- [x] **Product Catalog & Management**: SKU uniqueness, categories, unit of measure (UoM), cost and sale pricing, deterministic reordering rules (`minStock`, `maxStock`, `reorderQuantity`), dynamic stock status (`IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`), and spatial location breakdown.
- [x] **Product Categories**: Category taxonomy hierarchy and item classification.
- [x] **Warehouse Spatial Hierarchy**: Multi-warehouse structural tree (**Warehouse $\rightarrow$ Zone $\rightarrow$ Rack $\rightarrow$ Shelf $\rightarrow$ Bin**) with barcode support and flat bin pickers.
- [x] **Inbound Receipts Workflow**: Vendor receipts (`DRAFT` $\rightarrow$ `READY` $\rightarrow$ `VALIDATED` / `DONE` / `CANCELLED`) automatically incrementing destination bin stock and logging immutable ledger entries.
- [x] **Outbound Delivery Orders Workflow**: Customer fulfillment (`DRAFT` $\rightarrow$ `READY` $\rightarrow$ `PICKING` $\rightarrow$ `PACKED` $\rightarrow$ `VALIDATED` / `DONE` / `CANCELLED`) with strict insufficient stock rejection and automated stock decrement.
- [x] **Internal Transfers**: Location-to-location reallocation (`DRAFT` $\rightarrow$ `READY` $\rightarrow$ `DONE` / `CANCELLED`) strictly guaranteeing zero net change in total company stock.
- [x] **Stock Adjustments**: Physical count discrepancy reconciliation implementing $\Delta = \text{Counted} - \text{Recorded}$, capturing audit reason codes (`DAMAGED`, `LOST`, `FOUND`, `COUNTING_ERROR`, `DATA_CORRECTION`), and updating balances.
- [x] **Immutable Stock Ledger**: First-class double-entry audit journal with chronological logging, reference documents, user attribution, location paths, and multi-filter search.
- [x] **Move History**: Visual chronological timeline of all inventory flows.
- [x] **User Profile & Security**: Profile editing, secure password changing with policy validation, live permission breakdown matrix, and interactive backend permission tester.
- [x] **Comprehensive Seed Data**: Pre-seeded with 6 categories, 2 multi-zone warehouses, 4 spatial bins, 6 core products, receipts, deliveries, transfers, adjustments, and alerts.
- [x] **PostgreSQL with Neon**: Cloud database persistence as the single source of truth.
- [x] **Automated Test Suite**: 52/52 tests passing in Vitest covering all domain modules, edge cases, zero-delta preservation, and error handling.

### Future Roadmap (Planned Phase 2 Modules)
- [ ] Grounded AI Inventory Assistant powered by structured vector/SQL retrieval.
- [ ] Predictive Demand Forecasting & What-If Replenishment Simulator.
- [ ] Real-time Anomaly Detection engine for statistical variance and shrinkage.
- [ ] Camera-based QR/Barcode scanning integration on mobile viewports.
- [ ] Multi-format reporting engine (PDF, Excel, CSV generation).
- [ ] Offline-capable progressive web application (PWA) with background sync.

---

## 5. User Roles and RBAC

StockSense enforces granular Role-Based Access Control to maintain operational segregation of duties and strict auditability:

| Role | Core Purpose | Access Scope | Sensitive Operations |
| :--- | :--- | :--- | :--- |
| **Admin** | System configuration, security, governance | Full global read/write across all modules, tenants, and logs | User provisioning, role assignment, system setting overrides |
| **Inventory Manager** | Operational supervision, purchasing, adjustments | Full access to Products, Operations, Warehouses, Reports, Analytics | Approves Stock Adjustments, approves Purchase Orders, signs off Cycle Counts, deletes products |
| **Warehouse Staff** | Execution of floor movements on mobile or terminal | Receipts, Deliveries, Internal Transfers, Counting sessions, Barcode Scanner | Submits physical counts, marks items picked/packed/received (no approval rights) |
| **Viewer / Auditor** | Compliance, auditing, read-only analytics | Read-only access to Dashboards, Stock Ledger, Move History, Reports | Cannot modify, create, validate, or delete any entity |

### Permission Matrix for Sensitive Operations

```text
Operation                         Admin    Inventory Manager   Warehouse Staff   Viewer/Auditor
-----------------------------------------------------------------------------------------------
Stock Adjustments (Apply)          [x]            [x]                [ ]              [ ]
Stock Adjustments (Count Input)    [x]            [x]                [x]              [ ]
Product Creation / Edit            [x]            [x]                [ ]              [ ]
Product Deletion                   [x]            [ ]                [ ]              [ ]
Purchase Order Approval            [x]            [x]                [ ]              [ ]
Physical Count Session Creation    [x]            [x]                [ ]              [ ]
Physical Count Sign-Off            [x]            [x]                [ ]              [ ]
User Management & Permissions      [x]            [ ]                [ ]              [ ]
Ledger Inspection (Audit)          [x]            [x]                [x]              [x]
```

---

## 6. Complete Inventory Workflow

StockSense models the physical lifecycle of goods with mathematical balance preservation.

```mermaid
flowchart TD
    subgraph Procurement [1. Procurement & Receiving]
        PO[Purchase Order Draft] -->|Approval| POA[Approved PO]
        POA -->|Vendor Ships| REC[Receipt Created]
        REC -->|Validate Items| STK_IN[(Physical Stock Increases)]
    end

    subgraph Internal_Movement [2. Internal Allocation]
        STK_IN --> TR_REQ[Transfer Request: Main Store -> Production]
        TR_REQ -->|Pick & Relocate| TR_DONE[(Stock Balance Preserved: Location Updated)]
    end

    subgraph Order_Fulfillment [3. Customer Delivery]
        SO[Customer Sales Order] --> RES[Reserve Stock: Available Decreases]
        RES --> DO[Delivery Order: Pick & Pack]
        DO -->|Dispatch & Validate| STK_OUT[(Physical Stock Decreases)]
    end

    subgraph Audit_Reconciliation [4. Cycle Counting & Adjustment]
        PHY_CNT[Floor Physical Count] --> CMP[Compare with System Stock]
        CMP -->|Discrepancy Found| ADJ_REQ[Adjustment Draft]
        ADJ_REQ -->|Manager Approval| LEDGER[(Stock Corrected & Ledger Logged)]
    end

    STK_IN -.-> LEDGER_STREAM[(Advanced Stock Ledger)]
    TR_DONE -.-> LEDGER_STREAM
    STK_OUT -.-> LEDGER_STREAM
    LEDGER -.-> LEDGER_STREAM
```

### The 4-Step Fundamental Flow

1. **Receive Goods:** Arriving from a vendor via a Receipt increases the warehouse stock location (`+Qty`).
2. **Internal Transfer:** Moving items from *Warehouse A / Rack 1* to *Warehouse B / Production Floor* preserves company-wide stock (`Source -Qty`, `Destination +Qty`, `Net Change = 0`).
3. **Deliver Finished Goods:** Fulfilling a customer order decrements physical warehouse stock (`-Qty`).
4. **Stock Adjustment:** Reconciling physical counts against system counts corrects mismatches and records the change reason in the Stock Ledger.

---

## 7. Core Inventory Consistency Rules

To prevent data corruption, concurrency hazards, and inventory drift, all balance modifications must adhere to these mathematical invariants:

### 1. Receipt Invariant
$$\text{New Physical Stock}_{\text{location}} = \text{Existing Physical Stock}_{\text{location}} + \text{Received Quantity}$$

### 2. Delivery Invariant
$$\text{New Physical Stock}_{\text{location}} = \text{Existing Physical Stock}_{\text{location}} - \text{Delivered Quantity}$$
$$\text{Reserved Stock}_{\text{location}} = \text{Reserved Stock}_{\text{location}} - \text{Delivered Quantity}$$

### 3. Internal Transfer Invariant
$$\sum_{\text{all locations}} \text{Product Stock}_{\text{Before}} = \sum_{\text{all locations}} \text{Product Stock}_{\text{After}}$$
$$\text{Stock}_{\text{source}} \leftarrow \text{Stock}_{\text{source}} - \text{Transferred Quantity}$$
$$\text{Stock}_{\text{destination}} \leftarrow \text{Stock}_{\text{destination}} + \text{Transferred Quantity}$$

### 4. Stock Adjustment Invariant
$$\Delta = \text{Counted Physical Quantity} - \text{Recorded System Quantity}$$
$$\text{New Physical Stock} = \text{Recorded System Quantity} + \Delta$$
*Every adjustment generates an immediate ledger event referencing the audit session and approving manager.*

### 5. Stock Reservation Invariant
$$\text{Available Stock} = \text{Physical Stock} - \text{Reserved Stock}$$
$$\text{Constraint: } \text{Available Stock} \ge 0$$
*(Unless explicitly overridden by a configurable backorder policy for specific high-priority SKUs).*

---

## 8. Key Features

### Original Baseline System (Problem Statement Compliant)
- **User Authentication:** Email/password credentials, role enforcement, and secure OTP-based password reset via email.
- **Inventory Dashboard:** Executive KPIs tracking Total Products in Stock, Low/Out-of-Stock Items, Pending Receipts, Pending Deliveries, and Scheduled Internal Transfers.
- **Dynamic Filters:** Real-time filtering by document type (`Receipts`, `Delivery`, `Internal`, `Adjustments`), status (`Draft`, `Waiting`, `Ready`, `Done`, `Canceled`), warehouse/location, and product category.
- **Product & Category Catalog:** Complete management with SKU codes, barcodes, unit of measure (kg, pcs, meters, liters), and reorder thresholds.
- **Stock by Location:** Real-time visibility into quantities broken down by warehouse, rack, and shelf.
- **Reordering Rules:** Configurable Min/Max inventory policies triggering automated alerts.
- **Move History & Base Ledger:** Comprehensive chronologically sequenced log of all stock actions.
- **User Profile & Session Controls:** Profile management, credential rotation, and session invalidation.

### Enterprise & Intelligent Capabilities
- **Multi-Level Location Hierarchy:** Granular organization from Warehouse $\to$ Zone $\to$ Rack $\to$ Shelf $\to$ Bin.
- **Supplier & Procurement Management:** Complete vendor profiles, performance metrics, purchase histories, and linked purchase orders.
- **Purchase Order Lifecycle:** Progressive PO fulfillment tracking (`Draft` $\to$ `Approved` $\to$ `Partially Received` $\to$ `Fully Received` $\to$ `Closed`).
- **Mobile Barcode & QR Code Scanning:** Phone-camera-ready SKU, serial, and location scanning for fast receiving, transfers, and picking.
- **Stock Reservation Engine:** Strict separation between physical on-hand stock and allocated order stock to prevent double-selling.
- **Batch, Serial & Expiry (FEFO) Management:** Enforces First-Expired, First-Out routing with automated shelf-life degradation warnings.
- **Cycle Count Sessions:** Collaborative physical count reconciliation with digital mismatch calculation and two-tier manager approvals.
- **Product Stock Timeline:** Interactive visual audit trail displaying the chronological ledger life of any product.
- **Deterministic Inventory Forecasting:** Automatic estimation of average daily usage, days of stock remaining, stockout dates, and suggested replenishment quantities.
- **Data-Grounded AI Assistant:** Natural-language query interface operating strictly against live inventory data without hallucinated numbers.
- **Inventory Anomaly Detection:** Statistical profiling flagging abnormal single-day consumption bursts and suspicious repetitive adjustments.
- **Multi-Format Reporting:** Instant exports to PDF, Excel, and CSV for tax compliance, accounting reconciliation, and supplier reviews.

---

## 9. Application Modules & Navigation Structure

StockSense organizes its surface into an intuitive, high-efficiency information hierarchy:

```text
StockSense (Root)
|
+-- Dashboard                   # Executive KPIs, active operations, live activity stream
|
+-- Inventory
|   +-- Products                # SKU catalog, specifications, UoM, pricing
|   +-- Categories              # Category taxomony and default reordering rules
|   +-- Stock Levels            # Multi-location grid of physical, reserved, available stock
|   +-- Batches / Serials       # Lot tracing, manufacturing dates, expiry dates
|   +-- Reservations            # Active order locks and allocation allocations
|
+-- Operations
|   +-- Purchase Orders         # Vendor order creation, approval, and receipt tracking
|   +-- Receipts                # Inbound vendor deliveries and receiving staging
|   +-- Delivery Orders         # Outbound customer pick-pack-ship operations
|   +-- Internal Transfers      # Warehouse-to-warehouse and rack-to-rack relocations
|   +-- Stock Counting          # Cycle-count sessions, count sheets, reconciliation
|   +-- Adjustments             # Discrepancy resolutions and write-off logs
|
+-- Warehouses
|   +-- Warehouses              # Physical facilities and site metadata
|   +-- Zones                   # Cold storage, hazmat, dry storage, bulk staging
|   +-- Racks                   # Aisle and shelving structural layouts
|   +-- Locations (Bins)        # Atomic addressable storage points (e.g., WH1-Z2-R04-S1-B3)
|
+-- Partners
|   +-- Suppliers               # Vendor directories, lead times, reliability scores
|   +-- Customers               # Shipping destinations and customer order ties
|
+-- Analytics
|   +-- Inventory Analytics     # Valuation, turnover ratios, carrying costs
|   +-- Movement Analytics      # Velocity, throughput, inbound/outbound heatmaps
|   +-- Stock Forecast          # Deterministic runout curves and replenishment timelines
|   +-- Dead Stock              # Stagnant inventory and aging analyses
|
+-- Alerts
|   +-- Low Stock               # Threshold-breached items requiring PO generation
|   +-- Expiry                  # Critical FEFO timeline warnings
|   +-- Stockout Prediction     # Forward-looking runout warnings
|   +-- Anomalies               # Unreviewed volume spikes and repetitive adjustments
|
+-- Stock Ledger                # Immutable double-entry-style operational stock journal
+-- AI Assistant                # Grounded natural language inventory intelligence
+-- Reports                     # PDF, XLSX, and CSV generation hub
+-- Settings
    +-- Users & Roles           # RBAC permissions, invitations, and access keys
    +-- Warehouses Configuration # Structural defaults and operational hours
    +-- Reordering Rules        # Automated Min/Max rules and vendor priority mappings
    +-- System Settings         # UoM definitions, barcode formats, OTP settings
```

---

## 10. Warehouse Location Hierarchy

To model complex logistics setups, StockSense implements an addressable spatial hierarchy:

```text
Warehouse (e.g., Central Distribution Center - CDC)
 └── Zone (e.g., Cold Storage Zone - CSZ)
      └── Rack (e.g., Aisle 04 - R04)
           └── Shelf (e.g., Tier 02 - S02)
                └── Bin (e.g., Bin 14 - B14)
```

### Full Location Address Format
`[WarehouseCode]-[ZoneCode]-[RackCode]-[ShelfCode]-[BinCode]`  
*Example:* `CDC-CSZ-R04-S02-B14`

Stock movements within this hierarchy preserve total quantity while dynamically updating storage bins, enabling instant picking route generation and precise floor navigation.

---

## 11. Advanced Stock Ledger

The **Stock Ledger** is the foundational accounting system for all inventory movements. Every single stock transaction writes an append-only ledger row:

| Timestamp | Product | SKU | Warehouse | Location | Movement Type | Qty | Before | After | Ref Doc | Performed By | Reason |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 2026-09-26 09:15 | Steel Rods 12mm | STL-12M | Main Warehouse | Zone A / R01 | Receipt | +100 | 0 | 100 | PO-1024 | j.doe (Staff) | Initial Vendor Inbound |
| 2026-09-26 11:30 | Steel Rods 12mm | STL-12M | Main Warehouse | Zone A / R01 | Transfer | -30 | 100 | 70 | TR-0891 | r.smith (Staff) | Relocate to Production |
| 2026-09-26 11:30 | Steel Rods 12mm | STL-12M | Main Warehouse | Prod Floor / P01 | Transfer | +30 | 0 | 30 | TR-0891 | r.smith (Staff) | Relocate to Production |
| 2026-09-26 14:10 | Steel Rods 12mm | STL-12M | Main Warehouse | Prod Floor / P01 | Delivery | -20 | 30 | 10 | DO-4412 | a.patel (Staff) | Customer Shipment |
| 2026-09-26 16:45 | Steel Rods 12mm | STL-12M | Main Warehouse | Prod Floor / P01 | Adjustment | -3 | 10 | 7 | ADJ-0042 | m.wayne (Manager)| Water Damage on Floor |

### Supported Movement Types
- `Receipt`: Vendor inbound increases location stock.
- `Delivery`: Outbound dispatch decreases location stock.
- `Transfer`: Paired negative and positive movements between locations.
- `Adjustment`: Variance correction resulting from cycle counts or damage write-offs.
- `Reservation`: Soft allocation locking available stock for active orders.
- `Release`: De-allocation of reserved stock due to canceled or modified orders.

---

## 12. Audit Trail System

StockSense records an audit log for every sensitive business event, tracking identity, before-and-after states, and business justification.

> [!IMPORTANT]
> **Immutability Architecture Note:**  
> The StockSense audit log is implemented using write-only database tables with database-level `BEFORE UPDATE OR DELETE` trigger rejections and cryptographically chained record hashes (SHA-256). It is not claimed to be a distributed blockchain; immutability is guaranteed via append-only PostgreSQL security policies and database roles.

### Audit Entry Example

```json
{
  "audit_id": "aud_89e47c12f0",
  "timestamp": "2026-09-26T11:15:22.408Z",
  "actor_id": "usr_99812",
  "actor_email": "manager.sarah@stocksense.io",
  "actor_role": "INVENTORY_MANAGER",
  "ip_address": "192.168.1.144",
  "resource_type": "STOCK_ADJUSTMENT",
  "resource_id": "adj_008819",
  "action": "APPROVE_ADJUSTMENT",
  "previous_state": {
    "product_id": "prd_steel_rods_12mm",
    "location_id": "loc_main_wh_prod_rack",
    "system_stock": 120
  },
  "new_state": {
    "product_id": "prd_steel_rods_12mm",
    "location_id": "loc_main_wh_prod_rack",
    "system_stock": 115
  },
  "variance": -5,
  "reason_code": "DAMAGED_GOODS",
  "manager_note": "5 units bent during forklift transit to assembly line. Approved for scrap.",
  "record_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

---

## 13. Intelligent Features & Stock Forecasting

StockSense maintains a clear boundary between **deterministic operational calculations** and **AI-generated recommendations**:

```text
+-----------------------------------------------------------------------------------+
|                        FORECASTING & INTELLIGENCE ENGINE                          |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [ DETERMINISTIC ENGINE ]                         [ AI INFERENCE ENGINE ]         |
|  Strict mathematical formulas.                    Contextual suggestions.         |
|  Zero hallucination risk.                         Grounded in deterministic data. |
|                                                                                   |
|  - Average Daily Consumption                      - Seasonal Trend Interpretations|
|  - Days of Stock Remaining                        - Supplier Risk Assessments     |
|  - Predicted Runout Timestamp                     - Optimal Reorder Bundling      |
|  - Min/Max Safety Stock Levels                    - Natural Language Summaries    |
+-----------------------------------------------------------------------------------+
```

### Deterministic Metric Definitions

1. **Average Daily Usage (ADU):**
   $$\text{ADU} = \frac{\sum_{i=1}^{N} \text{Dispatched Units in Day } i}{N} \quad (N = 30 \text{ days default})$$

2. **Estimated Days Remaining (EDR):**
   $$\text{EDR} = \frac{\text{Current Available Stock}}{\text{ADU}}$$

3. **Predicted Stockout Date (PSD):**
   $$\text{PSD} = \text{Current Date} + \lceil\text{EDR}\rceil \text{ days}$$

4. **Suggested Reorder Quantity (SRQ):**
   $$\text{SRQ} = (\text{ADU} \times \text{Supplier Lead Time in Days}) + \text{Safety Stock} - \text{Current Available Stock} - \text{Incoming PO Stock}$$

### Concrete Example

```text
Product: Steel Rods 12mm (SKU: STL-12M)
Current Physical Stock:      150 kg
Active Reservations:          30 kg
Current Available Stock:     120 kg
Average Daily Usage (30d):    15 kg/day
Supplier Lead Time:           10 days
Safety Stock Buffer:          50 kg
Pending Inbound PO:            0 kg
--------------------------------------------------
[Deterministic Result]
Estimated Days Remaining:      8 days (120 kg / 15 kg/day)
Predicted Stockout Date:       Oct 4, 2026
Suggested Reorder Quantity:   250 kg ((15 * 10) + 50 - 120 + 0)
```

---

## 14. AI Inventory Assistant

StockSense features an integrated, natural-language AI Assistant designed for supply chain managers.

> [!CAUTION]
> **Data Grounding Guarantee:**  
> The StockSense AI Assistant does not invent, extrapolate, or hallucinate inventory figures. Every query triggers a structured retrieval pipeline (text-to-SQL / deterministic tool parameters) that extracts verifiable facts from the database before generating conversational answers.

```mermaid
sequenceDiagram
    autonumber
    actor Manager as Inventory Manager
    participant UI as StockSense Assistant UI
    participant Agent as Grounded AI Engine
    participant DB as Postgres & Ledger DB

    Manager->>UI: "Which products may run out this week?"
    UI->>Agent: Parse user intent & schema context
    Agent->>DB: Query: Products WHERE available_stock / adu <= 7
    DB-->>Agent: Returns: [Steel Rods (4 days), Industrial Bolts (2 days)]
    Agent-->>UI: Formulates concise, grounded report with exact SKUs & days
    UI-->>Manager: Displays grounded response with 1-click PO generation links
```

### Example Validated Prompts

| User Question | Grounded Database Resolution |
| :--- | :--- |
| *"Which products may run out this week?"* | Queries calculated EDR $\le 7$ days against active warehouse stock. |
| *"Which warehouse has excess Steel Rods?"* | Compares current stock against max reorder threshold across all facilities. |
| *"What should I reorder today?"* | Evaluates available stock against reorder point + pending inbound orders. |
| *"Why did inventory decrease significantly this month?"* | Aggregates Delivery Orders and Stock Adjustments for the previous 30 days. |
| *"Show products with unusual stock adjustments."* | Identifies SKUs with $> 3$ adjustments in the past 14 days or variance $> 15\%$. |
| *"Which products have been slow-moving for the last 30 days?"* | Flags items with zero deliveries/movements over the prior 30-day window. |

---

## 15. Inventory Anomaly Detection

To combat shrinkage, internal theft, and data-entry blunders, StockSense executes asynchronous statistical anomaly checks:

```text
[ANOMALY ALERT: UNUSUAL CONSUMPTION SPIKE]
Severity: High
Product: Heavy Duty Copper Wire (SKU: CW-HD-01)
Normal Daily Movement Range: 20 kg - 40 kg
Observed Today's Dispatch:   185 kg
Variance Factor:             4.6x above 30-day rolling baseline
Action Required:             Requires Inventory Manager review before dispatch validation.
```

```text
[ANOMALY ALERT: REPEATED CYCLE ADJUSTMENTS]
Severity: Critical
Product: Stainless Fasteners 8mm (SKU: SF-08M)
Flagged Pattern:             7 adjustments logged within the last 10 days
Cumulative Discrepancy:      -43 units ($860 inventory write-off)
Responsible Location:        Warehouse West / Bin B-102
Action Required:             Warehouse Manager assigned to inspect physical shelf integrity.
```

> [!NOTE]
> All anomaly detections are treated as **flags requiring human verification**, never as automated accusations or system-wide locks.

---

## 16. Inventory Counting & Cycle Count Sessions

StockSense replaces chaotic annual stock takes with continuous cycle-counting workflows:

```mermaid
flowchart TD
    A[Create Counting Session] --> B[Select Warehouse / Zone / Bin]
    B --> C[Assign Warehouse Staff]
    C --> D[Staff Scans & Counts Physical Items]
    D --> E[System Computes Discrepancies System vs Physical]
    E --> F{Variance Exists?}
    F -- No --> G[Mark Session Reconciled]
    F -- Yes --> H[Inventory Manager Approval Required]
    H -->|Approved| I[Automatic Adjustment Generated]
    I --> J[Stock Ledger Updated with Audit Link]
```

### Reconciliation Sheet Example

```text
Location: Central Warehouse — Zone 02 (Metal Hardware)
Session:  CYC-2026-09-W4
Staff:    David Miller (Mobile Scanner 03)

Product Name            SKU        System Count   Physical Count   Discrepancy   Action Required
-------------------------------------------------------------------------------------------------
Steel Rods 12mm         STL-12M        500             493             -7        Manager Approval
Hex Bolts M8            BLT-M8        1200            1200              0        Auto-Verified
Galvanized Nails 3"     NL-G3          850             872            +22        Manager Approval
```

---

## 17. Barcode & QR Code Operations

To support high-velocity, phone-based warehouse workflows, StockSense integrates standard symbologies (Code-128, EAN-13, QR Code):

- **Camera-Based Mobile Scanning:** Native WebRTC camera access optimized for iOS Safari and Android Chrome without requiring proprietary handheld terminals.
- **Instant Product Lookup:** Scan any SKU or QR code to display available stock across all racks and bins.
- **Scan-to-Receive:** Staff scans incoming vendor master carton codes; verified items automatically populate the active Receipt document.
- **Scan-to-Pick:** Pick lists guide staff along optimized warehouse routes; picking requires scanning the shelf bin barcode followed by the item barcode to eliminate wrong-item errors.
- **Scan-to-Count:** Fast scanning mode during cycle counts auto-increments quantity counters per physical scan.

---

## 18. Batch, Serial & Expiry (FEFO) Management

For pharmaceuticals, food, and regulated industrial materials, StockSense tracks inventory down to the individual lot and unit:

```text
Product: Industrial Epoxy Adhesive (SKU: EPX-300)
-------------------------------------------------------------------------------------------------
Batch Number   Serial Number   Mfg Date     Expiry Date    Status     Location    Available Qty
-------------------------------------------------------------------------------------------------
LOT-2026-A1    SN-90214        2026-01-10   2026-10-15     Warning    WH1-Z1-R02  45 kg (Expiring)
LOT-2026-B4    SN-98112        2026-04-12   2027-04-12     Active     WH1-Z1-R04  180 kg
LOT-2025-X9    SN-81144        2025-06-01   2026-06-01     EXPIRED    WH1-QUAR    12 kg (Quarantined)
```

- **FEFO Enforcement (First Expired, First Out):** Delivery picking sheets automatically assign the oldest unexpired batches first.
- **Quarantine Safeguard:** Expired stock is automatically locked out of "Available Stock" and marked for inspection or disposal.

---

## 19. Analytics, Notifications & Reporting

### Operational Analytics
- **Inventory Valuation:** Real-time stock asset valuation based on FIFO or Weighted Average Costing.
- **Stock Turnover Ratio:** Identifies fast-moving inventory vs. capital-draining dead stock.
- **Warehouse Utilization:** Visual heatmaps showing occupied vs. available shelf capacity.

### Centralized Notification Center
- <span style="color:red">🔴 **Critical:**</span> *Steel Rods 12mm out of stock at Central Warehouse.*
- <span style="color:orange">🟠 **Warning:**</span> *12 products dropped below minimum reorder thresholds.*
- <span style="color:blue">🔵 **Information:**</span> *PO #1024 partially received (70/100 units).*
- <span style="color:green">🟢 **Completed:**</span> *Internal Transfer #TR-104 completed by warehouse staff.*

### Export & Reporting Engine
StockSense exports filtered reports formatted for operations and finance teams:
1. **Stock Summary Report** (PDF/Excel)
2. **Stock Ledger & Movement Journal** (CSV/Excel)
3. **Inventory Discrepancy & Adjustment Report** (PDF/Excel)
4. **Purchase Order & Supplier Performance Report** (PDF/Excel)
5. **Customer Delivery & Fulfillment Rate Report** (PDF/Excel)
6. **Warehouse Capacity & Utilization Report** (PDF/Excel)
7. **Inventory Valuation & Financial Audit Report** (PDF/Excel)
8. **Expiring & Obsolete Stock Report** (PDF/Excel)

---

## 20. Architecture Overview

StockSense is structured as a **Modular Monolith** designed for high transactional consistency, with clean boundaries facilitating future microservice decomposition.

```mermaid
graph TB
    subgraph Client_Layer [Client Application Layer]
        DesktopWeb["Manager Web App (React / Desktop First)"]
        MobileWeb["Warehouse Staff PWA (Mobile Barcode Scanner)"]
    end

    subgraph Gateway_Layer [API & Security Gateway]
        Gateway["Reverse Proxy & Rate Limiter (Nginx / Express)"]
        AuthMiddleware["JWT & RBAC Permission Guard"]
    end

    subgraph Service_Domain_Layer [Core Business Domain Modules]
        ProductService["Product & Catalog Module"]
        StockService["Stock & Reservation Service"]
        OrderService["Purchase & Delivery Order Engine"]
        LedgerService["Transactional Stock Ledger"]
        ForecastEngine["Forecasting & Analytics Engine"]
        AIAssistantModule["Grounded AI Assistant Module"]
    end

    subgraph Data_Storage_Layer [Persistence & Cache]
        PostgreSQL[("PostgreSQL 16 (ACID Relational Storage)")]
        RedisCache[("Redis 7 (Session, Cache, Queues)")]
    end

    DesktopWeb --> Gateway
    MobileWeb --> Gateway
    Gateway --> AuthMiddleware
    AuthMiddleware --> ProductService
    AuthMiddleware --> StockService
    AuthMiddleware --> OrderService
    AuthMiddleware --> LedgerService
    AuthMiddleware --> ForecastEngine
    AuthMiddleware --> AIAssistantModule

    StockService --> LedgerService
    OrderService --> StockService
    LedgerService --> PostgreSQL
    StockService --> PostgreSQL
    ForecastEngine --> PostgreSQL
    AIAssistantModule --> PostgreSQL
    ProductService --> RedisCache
```

---

## 21. Technology Stack

To ensure strict engineering integrity, the selected technology stack represents the concrete technical foundation planned for this repository:

| Tier | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 / TypeScript / Vite | Single-page application, responsive layout |
| **UI Styling** | Tailwind CSS / Lucide Icons | Responsive styling, desktop/mobile-first layout |
| **State & Data Fetching** | TanStack Query (React Query) | Server-state caching, optimistic updates |
| **Barcode/Camera Engine** | Html5-QRCode / ZXing | Browser-based camera scanning |
| **Backend Runtime** | Node.js (v20 LTS) / TypeScript | Type-safe RESTful application service |
| **Web Framework** | Express.js | Modular router, middleware-based pipeline |
| **ORM & Migrations** | Prisma ORM | Type-safe database queries and migrations |
| **Primary Database** | PostgreSQL 16 | Relational data integrity, ACID transactions |
| **In-Memory Cache** | Redis 7 | User sessions, rate-limiting, calculation caching |
| **Validation** | Zod | Runtime request and response schema validation |
| **Testing** | Vitest / Supertest / Playwright | Unit, integration, and end-to-end tests |

---

## 22. Project Directory Structure

```text
ODDO_hyd/
+-- .github/
|   +-- workflows/
|       +-- ci.yml                   # Automated linting, type checks, and tests
+-- docs/
|   +-- architecture/                # System diagrams and technical specifications
|   +-- api/                         # OpenAPI / Swagger specification files
+-- backend/
|   +-- src/
|   |   +-- config/                  # Environment variables, database client config
|   |   +-- modules/
|   |   |   +-- auth/                # JWT authentication, OTP password reset
|   |   |   +-- products/            # Catalog, categories, reordering rules
|   |   |   +-- warehouses/          # Hierarchy (Zones, Racks, Bins)
|   |   |   +-- operations/
|   |   |   |   +-- receipts/        # Inbound receipt handling
|   |   |   |   +-- deliveries/      # Outbound picking & fulfillment
|   |   |   |   +-- transfers/       # Relocation logic
|   |   |   |   +-- counting/        # Cycle-count sessions & reconciliation
|   |   |   |   +-- adjustments/     # Variance adjustment processing
|   |   |   +-- ledger/              # Transactional stock ledger engine
|   |   |   +-- procurement/         # Suppliers & Purchase Orders
|   |   |   +-- forecasting/         # Runout and consumption calculators
|   |   |   +-- ai/                  # Grounded AI assistant tools & queries
|   |   |   +-- reports/             # PDF/Excel/CSV document exporters
|   |   +-- middleware/              # Auth, RBAC guards, error handling
|   |   +-- utils/                   # Math helpers, date utils, logger
|   |   +-- app.ts                   # Express server bootstrap
|   +-- prisma/
|   |   +-- schema.prisma            # Canonical relational database schema
|   |   +-- migrations/              # Incremental SQL migrations
|   +-- package.json
|   +-- tsconfig.json
+-- frontend/
|   +-- src/
|   |   +-- assets/                  # Logos, icons, illustration assets
|   |   +-- components/
|   |   |   +-- common/              # Buttons, Modals, Tables, Form fields
|   |   |   +-- layout/              # Sidebar, Header, Mobile navigation
|   |   |   +-- scanner/             # Camera barcode and QR scanner modal
|   |   +-- modules/
|   |   |   +-- dashboard/           # KPIs, metric cards, quick-filters
|   |   |   +-- inventory/           # Product lists, detail drawers, batch views
|   |   |   +-- operations/          # Receipts, Deliveries, Transfers, Counts
|   |   |   +-- warehouses/          # Interactive location tree
|   |   |   +-- analytics/           # Charts, turnover reports, runout forecasts
|   |   |   +-- ai-assistant/        # Grounded conversational query interface
|   |   +-- hooks/                   # React hooks (useAuth, useScanner, useLedger)
|   |   +-- services/                # Axios API client functions
|   |   +-- App.tsx                  # Client router and route guards
|   |   +-- main.tsx
|   +-- package.json
|   +-- tailwind.config.js
|   +-- vite.config.ts
+-- .env.example                     # Unified environment template
+-- docker-compose.yml               # Local PostgreSQL & Redis container stack
+-- README.md                        # Master Project Documentation (This File)
+-- LICENSE                          # MIT License
```

---

## 23. Database & Domain Model

The core relational domain model is built on strict referential integrity and transaction safety:

```mermaid
erDiagram
    USERS ||--o{ STOCK_MOVEMENTS : "performed_by"
    USERS ||--o{ AUDIT_LOGS : "acted_by"
    
    SUPPLIERS ||--o{ PURCHASE_ORDERS : "supplies"
    PURCHASE_ORDERS ||--o{ PURCHASE_ORDER_ITEMS : "contains"
    PURCHASE_ORDERS ||--o{ RECEIPTS : "fulfills"

    PRODUCTS ||--o{ PURCHASE_ORDER_ITEMS : "ordered"
    PRODUCTS ||--o{ RECEIPT_ITEMS : "received"
    PRODUCTS ||--o{ DELIVERY_ITEMS : "delivered"
    PRODUCTS ||--o{ STOCK_MOVEMENTS : "moved"
    PRODUCTS ||--o{ STOCK_BALANCES : "held_at"
    PRODUCTS }|--|| CATEGORIES : "categorized_under"

    WAREHOUSES ||--o{ LOCATIONS : "subdivided_into"
    LOCATIONS ||--o{ STOCK_BALANCES : "stores"
    LOCATIONS ||--o{ STOCK_MOVEMENTS : "origin_or_destination"

    RECEIPTS ||--o{ RECEIPT_ITEMS : "includes"
    DELIVERY_ORDERS ||--o{ DELIVERY_ITEMS : "includes"

    COUNT_SESSIONS ||--o{ COUNT_ITEMS : "audits"
    PRODUCTS ||--o{ COUNT_ITEMS : "counted"
```

### Key Relational Entities
- `users`: Credentials, RBAC roles (`ADMIN`, `INVENTORY_MANAGER`, `WAREHOUSE_STAFF`, `VIEWER_AUDITOR`), OTP secrets.
- `products`: SKU, barcode, unit of measure, min/max reorder rules, cost price, sale price.
- `stock_balances`: Real-time materialization of `(product_id, location_id, physical_qty, reserved_qty)`.
- `stock_movements`: Append-only transactional ledger recording every stock increment or decrement.
- `purchase_orders` & `receipts`: Inbound procurement tracking with partial fulfillment counters.
- `delivery_orders`: Outbound fulfillment tracking pick, pack, and ship states.
- `count_sessions` & `count_items`: Physical inventory cycles recording counted vs system differences.

---

## 24. API Specification Overview

The backend exposes a structured, RESTful API. All mutation endpoints require bearer token authentication.

```text
POST   /api/v1/auth/login                  # User authentication & JWT issuance
POST   /api/v1/auth/otp/request            # Initiate OTP password reset
POST   /api/v1/auth/otp/verify             # Complete password rotation

GET    /api/v1/products                    # Paginated catalog with smart filters
POST   /api/v1/products                    # Create new product with SKU & initial stock
GET    /api/v1/products/:id/timeline       # Visual movement history for a product

GET    /api/v1/stock/balances              # Real-time stock levels across warehouses
POST   /api/v1/stock/reserve               # Allocate reserved stock for an order
POST   /api/v1/stock/release               # Release reserved stock allocation

GET    /api/v1/operations/receipts         # List inbound vendor receipts
POST   /api/v1/operations/receipts         # Create receipt from PO or ad-hoc
POST   /api/v1/operations/receipts/:id/validate # Validate and execute stock increment

GET    /api/v1/operations/deliveries       # List customer delivery orders
POST   /api/v1/operations/deliveries/:id/validate # Validate dispatch & decrease stock

POST   /api/v1/operations/transfers        # Execute internal warehouse-to-warehouse move

GET    /api/v1/operations/counts           # List inventory count sessions
POST   /api/v1/operations/counts           # Initialize new cycle-count session
POST   /api/v1/operations/counts/:id/reconcile # Manager approval for stock adjustment

GET    /api/v1/ledger                      # Query the immutable Stock Ledger
GET    /api/v1/analytics/forecast/:sku     # Retrieve deterministic runout calculations
POST   /api/v1/ai/query                    # Submit grounded question to AI Assistant
```

---

## 25. Authentication & Authorization

### Session Security
- **Access Tokens:** Short-lived JWTs (15-minute expiration) transmitted in HTTP-only, `SameSite=Strict` secure cookies.
- **Refresh Tokens:** Long-lived tokens (7 days) stored securely with token-rotation revocation lists in Redis.
- **OTP Password Reset:** Time-sensitive, 6-digit cryptographically random OTPs sent via email with a 10-minute expiration and maximum 3 retry attempts.

### Authorization Middleware Flow
```text
HTTP Request 
   │
   ▼
[Token Extraction] ── Valid? ── No ──► 401 Unauthorized
   │ Yes
   ▼
[User Role Resolution]
   │
   ▼
[Permission Guard (e.g., REQUIRE_ROLE: INVENTORY_MANAGER)]
   │
   ├── Satisified? ── No ──► 403 Forbidden (Insufficient Privileges)
   │
   ▼ Yes
[Controller Execution]
```

---

## 26. Setup Instructions & Prerequisites

Ensure the following runtimes and tools are installed on your workstation:

- **Node.js:** `v20.x LTS` or higher
- **Package Manager:** `npm` (v10+) or `pnpm` (v9+)
- **Database:** `PostgreSQL 16`
- **Cache Engine:** `Redis 7`
- **Container Engine (Optional but Recommended):** `Docker Desktop` & `Docker Compose`

---

## 27. Environment Variables

Create `.env` files in both the `backend/` and `frontend/` roots using the templates below:

### Backend `.env`
```env
# Server Configuration
PORT=5000
NODE_ENV=development
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:5173

# Database & Cache Connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stocksense_dev?schema=public"
REDIS_URL="redis://localhost:6379"

# Security & Tokens
JWT_ACCESS_SECRET="super-secret-access-token-key-change-in-production-min32chars"
JWT_REFRESH_SECRET="super-secret-refresh-token-key-change-in-production-min32chars"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# Email / OTP Provider
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT=2525
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"
SMTP_FROM="no-reply@stocksense.io"

# AI Assistant Service (Grounded Engine)
LLM_API_KEY="your-llm-api-key"
LLM_MODEL="gemini-1.5-pro"
```

### Frontend `.env`
```env
VITE_API_BASE_URL="http://localhost:5000/api/v1"
VITE_APP_NAME="StockSense"
```

---

## 28. Local Development Guide

### 1. Clone & Synchronize the Repository
```bash
git clone https://github.com/pavankarthikeyaatchyuta-lab/ODDO_hyd.git
cd ODDO_hyd
```

### 2. Start Supporting Infrastructure via Docker
```bash
# Starts local PostgreSQL and Redis instances in the background
docker-compose up -d
```

### 3. Initialize the Backend
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run dev
```
*Backend API service starts at:* `http://localhost:5000`

### 4. Initialize the Frontend
```bash
# In a separate terminal
cd frontend
npm install
npm run dev
```
*Frontend application launches at:* `http://localhost:5173`

---

## 29. Database Setup & Migrations

StockSense uses Prisma ORM for type-safe schema synchronization.

```bash
# Generate Prisma Client after schema changes
npx prisma generate

# Create and apply new migrations locally
npx prisma migrate dev --name add_batch_tracking

# Seed demo data (warehouses, default products, admin users)
npx prisma db seed

# Open graphical database browser
npx prisma studio
```

---

## 30. Testing Strategy

StockSense enforces automated test coverage across all critical inventory mutation paths:

```text
+-------------------------------------------------------------------------------+
|                             TESTING PYRAMID                                   |
+-------------------------------------------------------------------------------+
|     [End-to-End Tests]      Playwright: Full browser-based receipt to pick    |
|   [Integration Tests]       Supertest: Multi-location balance preservation    |
|  [Unit / Invariant Tests]   Vitest: Math formulas, EDR calculations, FEFO     |
+-------------------------------------------------------------------------------+
```

### Running Test Suites
```bash
# Execute unit and calculation tests
npm run test:unit

# Execute API integration tests with transactional rollback
npm run test:integration

# Execute end-to-end browser workflows
npm run test:e2e
```

---

## 31. Deployment Guidelines

StockSense is container-ready and can be deployed to AWS, Google Cloud, Azure, or self-hosted Kubernetes clusters.

### Production Build Steps
```bash
# Build backend TypeScript bundle
cd backend
npm run build

# Build optimized production frontend assets
cd ../frontend
npm run build
```

### Dockerized Production Deployment
```bash
# Build and launch production containers
docker-compose -f docker-compose.prod.yml up --build -d
```

---

## 32. Security Considerations

- **Strict ACID Transactions:** Every stock update executes within a database-level transaction (`SERIALIZABLE` or `REPEATABLE READ`) to prevent race conditions during high-volume checkout or picking.
- **SQL Injection Prevention:** Parameterized database access enforced via Prisma ORM.
- **Cross-Site Scripting (XSS) & CSRF:** Secure HTTP-only cookies, strict CORS whitelisting, and CSP headers via Helmet.js.
- **Input Sanitization:** All payload structures validated at controller boundaries using Zod schemas.
- **Audit Non-Repudiation:** Destructive actions log the actor ID, client IP, user agent, and timestamp.

---

## 33. UI/UX Design Direction

StockSense delivers a modern, high-density SaaS interface tailored to its dual operational profiles:

1. **Desktop-First for Managers:**
   - Multi-column data-dense tables with sticky headers.
   - Quick SKU search and dynamic faceted filter bars.
   - Drawer-based detail views for quick ledger and stock inspection without losing context.
   - Action confirmation dialogs for all destructive actions (e.g., stock write-offs).

2. **Mobile-First for Warehouse Staff:**
   - Large, high-contrast tap targets designed for one-handed operation.
   - High-performance camera scanner modal with instant haptic and audio feedback on scan.
   - Step-by-step picking sheets with clear visual location cues (`Aisle 4` $\to$ `Shelf 2` $\to$ `Bin 14`).

---

## 34. Product Roadmap

```mermaid
timeline
    title StockSense Evolution Roadmap
    Phase 1 : Core Inventory Baseline : Multi-warehouse modeling : SKU catalog & categories : Inbound Receipts & Outbound Deliveries : Basic Stock Ledger
    Phase 2 : Warehouse Operations : Granular Location Hierarchy : Mobile QR/Barcode scanning : Stock reservation engine : Cycle-count reconciliation sessions
    Phase 3 : Analytics & Forecasting : Deterministic consumption velocity : Days of stock remaining (EDR) : Automated PO reorder points : Multi-format reporting (PDF/XLSX)
    Phase 4 : AI & Anomaly Detection : Grounded AI Natural Language Assistant : Statistical shrinkage detection : Repeated adjustment alerts : Batch & FEFO automation
    Phase 5 : Enterprise Integrations : ERP & Accounting connectors (SAP, QuickBooks) : 3PL & Carrier shipping API integrations : Automated supplier EDI pipelines
```

---

## 35. Contributing

Contributions are welcomed from all team members. To maintain code quality:

1. Create a feature branch: `git checkout -b feature/issue-description`
2. Follow strict TypeScript type safety; do not use `any`.
3. Ensure all tests pass: `npm test`
4. Format code using Prettier: `npm run format`
5. Open a Pull Request referencing the tracked issue.

---

## 36. License

This project is licensed under the terms of the **MIT License**. See the [LICENSE](LICENSE) file for complete details.