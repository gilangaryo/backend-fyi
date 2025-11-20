import { Router } from "express";
import {
    handleGetProducts,
    handleGetProductById,
    handleGetProductBySlug,
    handleCreateProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    handleToggleStatus,
    handleGetSuggestedProducts,
} from "../usecase/products/product.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

// 👤 Public
router.get("/", handleGetProducts);
router.get("/slug/:slug", handleGetProductBySlug);
router.get("/suggested", handleGetSuggestedProducts);
router.get("/:id", handleGetProductById);

// 🔒 Admin Only
router.post("/", requireAuth, handleCreateProduct);
router.put("/:id", requireAuth, handleUpdateProduct);
router.patch("/status/:id", requireAuth, handleToggleStatus); // ✅
router.delete("/:id", requireAuth, handleDeleteProduct);

export default router;
