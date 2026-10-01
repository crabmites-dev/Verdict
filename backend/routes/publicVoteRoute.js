import express from 'express'
import { getActivePublicPolls, castPublicVote } from '../controllers/publicVoteController'

const router = express.Router()

router.get('/active-polls', getActivePublicPolls)

router.post('/vote', castPublicVote)

export default router