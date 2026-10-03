// backend/routes/exportRoutes.js
import express from 'express';
import { exportCategoryCSV, exportCategoryPDF } from '../controllers/exportController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Protection et restriction d'accès au rôle Administrateur
router.get('/category/:categoryId/csv', protect, authorize('admin'), exportCategoryCSV);
router.get('/category/:categoryId/pdf', protect, authorize('admin'), exportCategoryPDF);

export default router;
