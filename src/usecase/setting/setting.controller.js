import { settingService } from './setting.service.js'

export const settingController = {
    async getAll(req, res, next) {
        try {
            const settings = await settingService.getAllSettings()
            res.json(settings)
        } catch (err) {
            next(err)
        }
    },

    async getByKey(req, res, next) {
        try {
            const { key } = req.params
            const setting = await settingService.getSettingByKey(key)
            res.json(setting)
        } catch (err) {
            next(err)
        }
    },

    async updateByKey(req, res, next) {
        try {
            const { key } = req.params
            const updated = await settingService.updateSettingByKey(key, req.body)
            res.json(updated)
        } catch (err) {
            next(err)
        }
    },

    async delete(req, res, next) {
        try {
            const { key } = req.params
            const deleted = await settingService.deleteSetting(key)
            res.json({ message: `Setting '${key}' deleted`, deleted })
        } catch (err) {
            next(err)
        }
    },
}
