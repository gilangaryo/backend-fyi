import express from 'express'
import { settingController } from '../usecase/setting/setting.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import prisma from '../prisma/client.js'
const router = express.Router()

router.get('/announcement', settingController.getAll)
router.get('/announcement/:key', settingController.getByKey)

router.put('/announcement/:key', requireAuth, requireAdmin, settingController.updateByKey)
router.delete('/announcement/:key', requireAuth, requireAdmin, settingController.delete)

router.get("/store-status", async (req, res) => {

    const setting = await prisma.setting.findUnique({
        where: { key: "store_status" },
    });
    res.json({
        success: true,
        data: { isOpen: setting?.value === "open" },
    });
});

router.put("/store-status", async (req, res) => {
    const { isOpen } = req.body;
    await prisma.setting.upsert({
        where: { key: "store_status" },
        update: {
            value: isOpen ? "open" : "closed",
            isActive: isOpen ? true : false
        },
        create: { key: "store_status", value: isOpen ? "open" : "closed" },
    });
    res.json({
        success: true,
        message: `Store is now ${isOpen ? "OPEN" : "CLOSED"}.`,
    });
});


// setting default courier 
router.get("/default-courier", async (req, res) => {
    const setting = await prisma.setting.findUnique({
        where: { key: "default_courier" },
    });
    res.json({
        success: true,
        data: {
            value: setting?.value
        },
    });
});

router.put("/default-courier", async (req, res) => {
    const { courier } = req.body;

    await prisma.setting.upsert({
        where: {
            key: "default_courier"
        },
        update: {
            value: courier
        },
        create: {
            key: "default_courier",
            value: courier
        },
    });

    res.json({
        success: true,
        message: `Default courier is now ${courier}.`,
    });
});
export default router
