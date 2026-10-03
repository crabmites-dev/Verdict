import express from 'express';
import { createCategorie, getCategoriesByEvents, createCandidate, getCandidateByEvent } from '../controllers/juryController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { createCriterion, getCriteriaByCategorie, submitJuryRating } from '../controllers/ratingController.js';

const router = express.Router();

router.post('/categories', protect, authorize('admin'), createCategorie);
router.post('/candidates', protect, authorize('admin'), createCandidate);

router.get('/categories/event/:eventId', protect, getCategoriesByEvents);
router.get('/candidates/event/:eventId', protect, getCandidateByEvent);

router.post('/criteria', protect, authorize('admin'), createCriterion);
router.get('/criteria/category/:categoryId', protect, getCriteriaByCategorie);

router.post('/ratings', protect, authorize('jury', 'admin'), submitJuryRating);

export default router;