import { settingService } from "./setting.service.js";

export const settingController = {
    async getAll(req, res, next) {
        try {
            const settings = await settingService.getAllSettings();
            res.json({
                success: true,
                message: "Settings fetched successfully",
                data: settings,
            });
        } catch (err) {
            next(err);
        }
    },

    async getByKey(req, res, next) {
        try {
            const { key } = req.params;
            const setting = await settingService.getSettingByKey(key);
            res.json({
                success: true,
                message: `Setting '${key}' fetched successfully`,
                data: setting,
            });
        } catch (err) {
            next(err);
        }
    },

    async updateByKey(req, res, next) {
        try {
            const { key } = req.params;
            const updated = await settingService.updateSettingByKey(
                key,
                req.body,
            );
            res.json({
                success: true,
                message: `Setting '${key}' updated successfully`,
                data: updated,
            });
        } catch (err) {
            next(err);
        }
    },

    async delete(req, res, next) {
        try {
            const { key } = req.params;
            const deleted = await settingService.deleteSetting(key);
            res.json({
                success: true,
                message: `Setting '${key}' deleted successfully`,
                data: deleted,
            });
        } catch (err) {
            next(err);
        }
    },
};
