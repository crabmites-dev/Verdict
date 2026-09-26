import express from 'express'
import { createCategorie, getCategoriesByEvents, createCandidate, getCandidateByEvent } from '../controllers/juryController'
import { protect, authorize } from '../middlewares/authMiddleware'
import { auth } from 'google-auth-library'
import { createCriterion, getCriteriaByCategorie, submitJuryRating } from '../controllers/ratingController'
const router = express.Router()

router.post('/categories', protect, authorize('admin'), createCategorie)
router.post('/candidates', protect, auth('admin'), createCandidate)

router.get('/categories/event/:eventId', protect, getCategoriesByEvents)
router.get('/candidates/event/:eventId', protect, getCandidateByEvent)

router.post('/criteria', protect, authorize('admin', createCriterion))
router.post('/criteria/category/:categoryId', getCriteriaByCategorie)

router.rating('/ratings', protect, authorise('jury', 'admin', submitJuryRating))

export default router