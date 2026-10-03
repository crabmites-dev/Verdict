import { categoryResults, getCategoryResults } from "../controllers/resultController";
import express from 'express'
import { protect, authorize } from "../middlewares/authMiddleware";

const router = express.Router()

router.post('/results/:categoryId', protect, authorize('admin', 'jury'), categoryResults)
router.post('/category/:categoryId', protect, getCategoryResults)

export default router