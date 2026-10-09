import express from 'express';
import { getActivePublicPolls, castPublicVote, verifyVoterToken } from '../controllers/publicVoteController.js';

const router = express.Router();

router.get('/active-polls', getActivePublicPolls);
router.post('/verify-token', verifyVoterToken);
router.post('/vote', castPublicVote);

export default router;