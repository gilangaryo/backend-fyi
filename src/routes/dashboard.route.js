// src/routes/dashboard.route.js
import express from "express";
import { getDashboardSummary } from "../usecase/dashboard/dashboard.controller.js";
const router = express.Router();

router.get("/summary", getDashboardSummary);
export default router;
