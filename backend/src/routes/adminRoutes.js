import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import {
  createProject,
  createUser,
  importUsers,
  deleteUser,
  getOverview,
  getSettings,
  getSetupStatus,
  listActivities,
  listLogins,
  listProjects,
  listUsers,
  setupInitialAdmin,
  updateOwnPassword,
  updateWhatsAppGroup,
  updateUser,
} from '../controllers/adminController.js'
import adminMiddleware from '../middleware/adminMiddleware.js'
import authMiddleware from '../middleware/authMiddleware.js'

const router = Router()
const setupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: 'Terlalu banyak percobaan setup. Coba lagi dalam 15 menit.' }),
})

router.get('/setup/status', getSetupStatus)
router.post('/setup', setupLimiter, setupInitialAdmin)
router.use(authMiddleware, adminMiddleware)
router.get('/overview', getOverview)
router.get('/settings', getSettings)
router.patch('/settings/whatsapp', updateWhatsAppGroup)
router.patch('/me/password', updateOwnPassword)
router.get('/users', listUsers)
router.post('/users', createUser)
router.post('/users/import', importUsers)
router.patch('/users/:id', updateUser)
router.delete('/users/:id', deleteUser)
router.get('/projects', listProjects)
router.post('/projects', createProject)
router.get('/activities', listActivities)
router.get('/logins', listLogins)

export default router
