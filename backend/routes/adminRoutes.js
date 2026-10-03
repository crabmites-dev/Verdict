import express from 'express'
import { getStats, getAuditLog } from '../controllers/adminController'
import { protect, authorize } from '../middlewares/authMiddleware'

const router = express.Router()

router('/dashboard-stats', protect, authorize('admin'), getStats)
router('/audit-log', protect, authorize('admin'), getAuditLog)

export default router