// src/usecase/blog/blog.service.js
import slugify from "slugify";
import {
    findAllBlogs,
    findBlogById,
    findBlogBySlug,
    insertBlog,
    updateBlogData,
    deleteBlogData,
} from "./blog.repository.js";
import { deleteFileFromServer } from "../../lib/uploader.js"; // ✅ helper hapus file lokal


export async function getAllBlogs() {
    return await findAllBlogs();
}

export async function getBlog(id) {
    const blog = await findBlogById(id);
    if (!blog || blog.length === 0) throw new Error("Blog not found");
    return blog;
}

export async function getBlogSlug(slug) {
    const blog = await findBlogBySlug(slug);
    if (!blog) throw new Error("Blog not found");
    return blog;
}

export async function createBlog(data) {
    const { title, event, description, heroImage } = data;

    if (!title || !event || !description || !heroImage) {
        throw new Error("Title, event, description, and heroImage are required");
    }

    const slug = slugify(title, { lower: true, strict: true });

    const existing = await findBlogBySlug(slug);
    if (existing) {
        throw new Error("Blog with this title already exists");
    }

    return insertBlog({
        ...data,
        slug,
    });
}

export async function updateBlog(id, data) {
    const { title } = data;
    const updateData = { ...data };

    if (title) {
        updateData.slug = slugify(title, { lower: true, strict: true });
    }

    return updateBlogData(id, updateData);
}


export async function removeBlog(id) {
    const blog = await findBlogById(id);
    if (!blog) throw new Error("Blog not found");

    const allImages = [
        blog.heroImage,
        blog.firstHeaderImage,
        blog.secondHeaderImage,
        blog.thirdHeaderImage,
        blog.fourthHeaderImage,
        blog.firstFooterImage,
        blog.secondFooterImage,
        blog.imageDivider,
    ].filter(Boolean);

    for (const url of allImages) {
        try {
            await deleteFileFromServer(url);
        } catch (err) {
            console.warn("⚠️ Failed to delete image:", url, err.message);
        }
    }

    await deleteBlogData(id);

    console.log(`🗑️ Blog ${id} and all related images deleted`);
    return { success: true };
}
