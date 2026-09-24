import express from 'express'
import { googleLogin, register, login, forgotPassword, resetPassword, logout, getMe } from "../controllers/authController";
import { protect } from '../middlewares/authMiddleware';

const router = express.Router()

router.post('/googleLogin', googleLogin)
router.post('/register', register)
router.post('/login', login)
router.post('forgotPassword', forgotPassword)
router.post('resetPassword', resetPassword)
router.post('logout', logout)

router.get('/getMe', getMe)

export default router;