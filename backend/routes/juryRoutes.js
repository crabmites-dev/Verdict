import express from 'express'
import { createCategorie, getCategoriesByEvents, createCandidate, getCandidateByEvent } from '../controllers/juryController'
import { protect, authorize } from '../middlewares/authMiddleware'
import { auth } from 'google-auth-library'
const router = express.Router()

router.post('/categories', protect, authorize('admin'), createCategorie)
router.post('/candidates', protect, auth('admin'), createCandidate)

router.get('/categories/event/:eventId', protect, getCategoriesByEvents)
router.get('/candidates/event/:eventId', protect, getCandidateByEvent)

export default router