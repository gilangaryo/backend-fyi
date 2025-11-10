import express from "express";
import { SuggestedController } from "../usecase/suggested/suggested.controller.js";

const router = express.Router();

router.get("/", SuggestedController.getAll);
router.post("/", SuggestedController.create);
router.post("/reorder", SuggestedController.reorder); // ✅ pindah ke controller
router.delete("/:id", SuggestedController.remove);

export default router;
