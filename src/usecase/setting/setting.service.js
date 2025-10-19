import { settingRepository } from './setting.repository.js'

export const settingService = {
    async getAllSettings() {
        return await settingRepository.findAll()
    },

    async getSettingByKey(key) {
        const setting = await settingRepository.findByKey(key)
        if (!setting) throw new Error(`Setting '${key}' not found`)
        return setting
    },

    async updateSettingByKey(key, payload) {
        if (!payload.value && payload.isActive === undefined)
            throw new Error('Missing value or isActive field')

        const updated = await settingRepository.upsert(key, {
            value: payload.value,
            isActive: payload.isActive,
        })

        return updated
    },

    async deleteSetting(key) {
        return await settingRepository.deleteByKey(key)
    },
}
