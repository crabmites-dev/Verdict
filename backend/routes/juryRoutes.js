import express from 'express';
import { 
    createCategorie, 
    getCategoriesByEvents, 
    createCandidate, 
    getCandidateByEvent,
    getJuryEvaluationBoard,
    submitBulkRatings
} from '../controllers/juryController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import { createCriterion, getCriteriaByCategorie, submitJuryRating } from '../controllers/ratingController.js';

const router = express.Router();

// Configuration par l'Admin
router.post('/categories', protect, authorize('admin'), createCategorie);
router.post('/candidates', protect, authorize('admin'), createCandidate);

router.get('/categories/event/:eventId', protect, getCategoriesByEvents);
router.get('/candidates/event/:eventId', protect, getCandidateByEvent);

router.post('/criteria', protect, authorize('admin'), createCriterion);
router.get('/criteria/category/:categoryId', protect, getCriteriaByCategorie);

// Espace d'Évaluation du Jury
router.get('/evaluation-board/:eventId', protect, authorize('jury', 'admin'), getJuryEvaluationBoard);
router.post('/ratings', protect, authorize('jury', 'admin'), submitJuryRating);
router.post('/bulk-ratings', protect, authorize('jury', 'admin'), submitBulkRatings);

export default router;