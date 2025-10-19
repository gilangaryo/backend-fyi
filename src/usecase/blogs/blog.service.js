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

// get all blogs
export async function getAllBlogs() {
    return await findAllBlogs();
}

// get by id
export async function getBlog(id) {
    const blog = await findBlogById(id);
    if (!blog || blog.length === 0) throw new Error("Blog not found");
    return blog;
}

// get by slug
export async function getBlogSlug(slug) {
    const blog = await findBlogBySlug(slug);
    if (!blog) throw new Error("Blog not found");
    return blog;
}

// create blog
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

// update blog
export async function updateBlog(id, data) {
    const { title } = data;
    const updateData = { ...data };

    if (title) {
        updateData.slug = slugify(title, { lower: true, strict: true });
    }

    return updateBlogData(id, updateData);
}

// delete blog
export async function removeBlog(id) {
    return deleteBlogData(id);
}
