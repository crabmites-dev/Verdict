import express from 'express';
import { 
    createEvent, 
    getAllEvents, 
    updateEvents, 
    closeEvents,
    launchEvents,
    generateVoterTokens,
    getVoterTokens
} from "../controllers/eventController.js";
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Routes événements
router.route('/')
    .get(protect, getAllEvents)
    .post(protect, authorize('admin'), createEvent);

router.route('/:id')
    .put(protect, authorize('admin'), updateEvents);

router.route('/:id/launch')
    .patch(protect, authorize('admin'), launchEvents);

router.route('/:id/close')
    .patch(protect, authorize('admin'), closeEvents);

// Routes d'administration des jetons de scrutin hybride (Universitaire / Entreprise)
router.route('/:id/voter-tokens')
    .post(protect, authorize('admin'), generateVoterTokens)
    .get(protect, authorize('admin'), getVoterTokens);

export default router;
