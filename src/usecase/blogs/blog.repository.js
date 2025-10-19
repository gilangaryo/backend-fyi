// src/usecase/blog/blog.repository.js
import prisma from "../../prisma/client.js";

// 🔹 ambil semua blog
export async function findAllBlogs() {
    return prisma.blog.findMany({
        orderBy: { createdAt: "desc" },
    });
}

// 🔹 ambil blog berdasarkan ID
export async function findBlogById(id) {
    return prisma.blog.findUnique({
        where: { id },
    });
}

// 🔹 ambil blog berdasarkan slug
export async function findBlogBySlug(slug) {
    return prisma.blog.findUnique({
        where: { slug },
    });
}

// 🔹 buat blog baru
export async function insertBlog(data) {
    return prisma.blog.create({ data });
}

// 🔹 update blog
export async function updateBlogData(id, data) {
    return prisma.blog.update({
        where: { id },
        data,
    });
}

// 🔹 hapus blog
export async function deleteBlogData(id) {
    return prisma.blog.delete({
        where: { id },
    });
}
