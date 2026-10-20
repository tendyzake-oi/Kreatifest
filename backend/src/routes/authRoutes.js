import { Router } from 'express'
import {
  deleteMyAccount,
  getMyActivities,
  getMyProjects,
  getMySettings,
  login,
  me,
  register,
  updateMyProfile,
  updatePassword,
} from '../controllers/authController.js'
import authMiddleware from '../middleware/authMiddleware.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', authMiddleware, me)
router.patch('/me', authMiddleware, updateMyProfile)
router.get('/me/projects', authMiddleware, getMyProjects)
router.get('/me/activities', authMiddleware, getMyActivities)
router.get('/me/settings', authMiddleware, getMySettings)
router.patch('/me/password', authMiddleware, updatePassword)
router.delete('/me', authMiddleware, deleteMyAccount)

export default router
