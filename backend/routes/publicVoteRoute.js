import express from 'express';
import { 
    getActivePublicPolls, 
    getPollDetails, 
    verifyVoterToken, 
    castPublicVote 
} from '../controllers/publicVoteController.js';

const router = express.Router();

router.get('/active-polls', getActivePublicPolls);
router.get('/poll-details/:eventId', getPollDetails);
router.post('/verify-token', verifyVoterToken);
router.post('/vote', castPublicVote);

export default router;