import { Router } from 'express';
import { LedgerController } from './ledger.controller';
import { authenticate, requirePermission } from '../../core/middleware/auth-guard';

export const ledgerRouter = Router();

// Authentication and ledger:view permission required
ledgerRouter.use(authenticate);
ledgerRouter.use(requirePermission('ledger:view'));

ledgerRouter.get('/ledger', LedgerController.getStockLedger);
ledgerRouter.get('/move-history', LedgerController.getMoveHistory);
ledgerRouter.get('/overview', LedgerController.getInventoryOverview);
