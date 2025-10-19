// src/routes/blog.route.js
import { Router } from "express";
import {
    handleGetBlogs,
    handleGetBlogById,
    handleGetBlogBySlug,
    handleCreateBlog,
    handleUpdateBlog,
    handleDeleteBlog,
} from "../usecase/blogs/blog.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

// 👤 Public
router.get("/", handleGetBlogs);
router.get("/slug/:slug", handleGetBlogBySlug);
router.get("/:id", handleGetBlogById);

// 🔒 Admin Only
router.post("/", requireAuth, requireAdmin, handleCreateBlog);
router.put("/:id", requireAuth, requireAdmin, handleUpdateBlog);
router.delete("/:id", requireAuth, requireAdmin, handleDeleteBlog);

export default router;
