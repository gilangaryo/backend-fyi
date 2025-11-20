import { Router } from "express";

const router = Router();

router.post("/", (req, res) => {
    console.log("⚠️ Received webhook");
    console.log(req.body);

    res.status(200).json({ success: true, message: "Webhook received" });
});

export default router;
