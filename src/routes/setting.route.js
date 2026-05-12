import express from "express";
import { settingController } from "../usecase/setting/setting.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import prisma from "../prisma/client.js";
const router = express.Router();

router.get("/announcement", settingController.getAll);
router.get("/announcement/:key", settingController.getByKey);

router.put(
    "/announcement/:key",
    requireAuth,
    requireAdmin,
    settingController.updateByKey,
);
router.delete(
    "/announcement/:key",
    requireAuth,
    requireAdmin,
    settingController.delete,
);

router.get("/store-status", async (req, res) => {
    try {
        const [statusSetting, closedMessageSetting] = await Promise.all([
            prisma.setting.findUnique({
                where: { key: "store_status" },
            }),
            prisma.setting.findUnique({
                where: { key: "store_closed_message" },
            }),
        ]);

        res.json({
            success: true,
            data: {
                isOpen: statusSetting?.value === "open",
                closedMessage:
                    closedMessageSetting?.value ||
                    "Our store is currently closed — orders are temporarily unavailable.",
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

router.put("/store-status", requireAuth, requireAdmin, async (req, res) => {
    try {
        const { isOpen, closedMessage } = req.body;

        await prisma.setting.upsert({
            where: { key: "store_status" },
            update: {
                value: isOpen ? "open" : "closed",
                isActive: isOpen ? true : false,
            },
            create: {
                key: "store_status",
                value: isOpen ? "open" : "closed",
                isActive: isOpen ? true : false,
            },
        });

        if (closedMessage !== undefined && !isOpen) {
            await prisma.setting.upsert({
                where: { key: "store_closed_message" },
                update: {
                    value: closedMessage,
                    isActive: true,
                },
                create: {
                    key: "store_closed_message",
                    value: closedMessage,
                    isActive: true,
                },
            });
        }

        res.json({
            success: true,
            message: `Store is now ${isOpen ? "OPEN" : "CLOSED"}.`,
            data: {
                isOpen,
                closedMessage: !isOpen ? closedMessage : null,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// setting default courier
router.get("/default-courier", async (req, res) => {
    const setting = await prisma.setting.findUnique({
        where: { key: "default_courier" },
    });
    res.json({
        success: true,
        data: {
            value: setting?.value,
        },
    });
});

router.put("/default-courier", requireAuth, requireAdmin, async (req, res) => {
    const { courier } = req.body;

    await prisma.setting.upsert({
        where: {
            key: "default_courier",
        },
        update: {
            value: courier,
        },
        create: {
            key: "default_courier",
            value: courier,
        },
    });

    res.json({
        success: true,
        message: `Default courier is now ${courier}.`,
    });
});

// Generic setting GET/PUT by key (for origin_address, origin_note, origin_postal_code, etc.)
const ALLOWED_GENERIC_KEYS = new Set([
    "origin_address",
    "origin_note",
    "origin_postal_code",
]);

router.get("/:key", async (req, res) => {
    const { key } = req.params;
    if (!ALLOWED_GENERIC_KEYS.has(key)) {
        return res
            .status(404)
            .json({ success: false, message: "Setting not found" });
    }
    try {
        const setting = await prisma.setting.findUnique({ where: { key } });
        res.json({
            success: true,
            data: { value: setting?.value ?? null },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put("/:key", requireAuth, requireAdmin, async (req, res) => {
    const { key } = req.params;
    if (!ALLOWED_GENERIC_KEYS.has(key)) {
        return res
            .status(404)
            .json({ success: false, message: "Setting not found" });
    }
    const { value } = req.body;
    if (value === undefined || value === null) {
        return res
            .status(400)
            .json({ success: false, message: "value is required" });
    }
    try {
        const setting = await prisma.setting.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) },
        });
        res.json({
            success: true,
            data: { key: setting.key, value: setting.value },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
