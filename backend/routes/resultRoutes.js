// backend/routes/resultRoutes.js
import { categoryResults, getCategoryResults } from "../controllers/resultController.js";
import express from 'express';
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Calcul et consolidation (Admin & Jury)
router.post('/calculate/:categoryId', protect, authorize('admin', 'jury'), categoryResults);

// Consultation publique ou par les membres
router.get('/category/:categoryId', getCategoryResults);

export default router;