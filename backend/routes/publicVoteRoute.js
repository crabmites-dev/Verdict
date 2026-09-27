import express from 'express'
import { getActivePublicPolls } from '../controllers/publicVoteController'

const router = express.Router()

router.get('/active-polls', getActivePublicPolls)

export default router