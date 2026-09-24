import express from 'express'
import { createEvent, getAllEvents, updateEvents, closeEvents } from "../controllers/eventController";
import { protect, authorize } from '../middlewares/authMiddleware';

const router = express.Router()

/*router.post('/create-event', protect, authorize('admin'), createEvent)
router.put('/:id/update-event', protect, authorize('admin'), updateEvents)
router.post('/:id/close-event', protect, authorize('admin'), closeEvents)

router.get('/get-all-events', protect, getAllEvents)
*/

router.route ('/')
.get(protect, getAllEvents)
.post(protect, authorize('admin'), createEvent)

router.route('/:id')
.put(protect, authorize('admin'), updateEvents)

router.route('/:close')
.patch(protect, authorize('admin'), closeEvents)

export default router;