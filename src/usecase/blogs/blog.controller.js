// src/usecase/blog/blog.controller.js
import {
    getAllBlogs,
    getBlog,
    getBlogSlug,
    createBlog,
    updateBlog,
    removeBlog,
} from "./blog.service.js";

// GET all
export async function handleGetBlogs(req, res) {
    try {
        const blogs = await getAllBlogs();
        res.status(200).json({
            success: true,
            status: 200,
            message: "Blog list retrieved successfully",
            data: blogs,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            status: 500,
            message: err.message,
            data: [],
        });
    }
}

// GET by id
export async function handleGetBlogById(req, res) {
    try {
        const blog = await getBlog(req.params.id);
        res.status(200).json({
            success: true,
            status: 200,
            message: "Blog retrieved successfully",
            data: blog,
        });
    } catch (err) {
        res.status(404).json({
            success: false,
            status: 404,
            message: err.message,
            data: null,
        });
    }
}

// GET by slug
export async function handleGetBlogBySlug(req, res) {
    try {
        const blog = await getBlogSlug(req.params.slug);
        res.status(200).json({
            success: true,
            status: 200,
            message: "Blog retrieved successfully",
            data: blog,
        });
    } catch (err) {
        res.status(404).json({
            success: false,
            status: 404,
            message: err.message,
            data: null,
        });
    }
}

// CREATE
export async function handleCreateBlog(req, res) {
    try {
        const created = await createBlog(req.body);
        res.status(201).json({
            success: true,
            status: 201,
            message: "Blog created successfully",
            data: created,
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            status: 400,
            message: err.message,
            data: null,
        });
    }
}

// UPDATE
export async function handleUpdateBlog(req, res) {
    try {
        const updated = await updateBlog(req.params.id, req.body);
        res.status(200).json({
            success: true,
            status: 200,
            message: "Blog updated successfully",
            data: updated,
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            status: 400,
            message: err.message,
            data: null,
        });
    }
}

// DELETE
export async function handleDeleteBlog(req, res) {
    try {
        await removeBlog(req.params.id);
        res.status(200).json({
            success: true,
            status: 200,
            message: "Blog deleted successfully",
            data: null,
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            status: 400,
            message: err.message,
            data: null,
        });
    }
}
