import express from 'express'
import { settingController } from '../usecase/setting/setting.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

const router = express.Router()

router.get('/', settingController.getAll)
router.get('/:key', settingController.getByKey)

router.put('/:key', requireAuth, requireAdmin, settingController.updateByKey)
router.delete('/:key', requireAuth, requireAdmin, settingController.delete)

export default router
