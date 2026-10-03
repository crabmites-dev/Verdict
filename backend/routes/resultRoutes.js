import { categoryResults, getCategoryResults } from "../controllers/resultController.js";
import express from 'express';
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post('/calculate/:categoryId', protect, authorize('admin', 'jury'), categoryResults);
router.get('/category/:categoryId', protect, getCategoryResults);

export default router;