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

router.get("/export/csv", async (req, res) => {
    try {
        const subscribers = await prisma.subscriber.findMany({
            orderBy: { subscribedAt: "desc" },
        });

        const csvHeader =
            "Email,Name,Source,Subscribed At,Status,Verified,Unsubscribed At\n";

        const csvRows = subscribers
            .map((sub) => {
                const subscribedAt = new Date(sub.subscribedAt).toLocaleString(
                    "id-ID",
                );
                const unsubscribedAt = sub.unsubscribedAt
                    ? new Date(sub.unsubscribedAt).toLocaleString("id-ID")
                    : "";

                return [
                    sub.email,
                    sub.name || "",
                    sub.source,
                    subscribedAt,
                    sub.status,
                    sub.isVerified ? "Yes" : "No",
                    unsubscribedAt,
                ]
                    .map((field) => {
                        const stringField = String(field);
                        if (
                            stringField.includes(",") ||
                            stringField.includes('"') ||
                            stringField.includes("\n")
                        ) {
                            return `"${stringField.replace(/"/g, '""')}"`;
                        }
                        return stringField;
                    })
                    .join(",");
            })
            .join("\n");

        const csv = csvHeader + csvRows;

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename=subscribers-${new Date().toISOString().split("T")[0]}.csv`,
        );

        res.write("\uFEFF");
        res.write(csv);
        res.end();
    } catch (err) {
        console.error("❌ Error exporting CSV:", err);
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
