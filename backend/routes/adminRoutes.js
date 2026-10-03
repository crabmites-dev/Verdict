import express from 'express';
import { getStats, getAuditLog } from '../controllers/adminController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/dashboard-stats', protect, authorize('admin'), getStats);
router.get('/audit-log', protect, authorize('admin'), getAuditLog);

export default router;