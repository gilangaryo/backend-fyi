import express from "express";
import prisma from "../prisma/client.js";

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const subscribers = await prisma.subscriber.findMany({
            orderBy: { subscribedAt: "desc" },
        });

        res.json({
            success: true,
            data: subscribers,
        });
    } catch (err) {
        console.error("❌ Error fetching subscribers:", err);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
});

router.post("/", async (req, res) => {
    try {
        const { email, source } = req.body;

        // Email validation
        if (!email || !email.includes("@")) {
            return res.status(400).json({
                success: false,
                error: "Invalid email address",
            });
        }

        // Check existing
        const existing = await prisma.subscriber.findUnique({
            where: { email },
        });

        if (existing) {
            return res.json({
                success: true,
                message: "You're already subscribed!",
            });
        }

        // Create new subscriber
        const subscriber = await prisma.subscriber.create({
            data: {
                email,
                source: source || "homepage",
            },
        });

        res.json({
            success: true,
            message: "Thank you for subscribing!",
            data: subscriber,
        });
    } catch (err) {
        console.error("❌ Error saving subscriber:", err);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
});

export default router;
