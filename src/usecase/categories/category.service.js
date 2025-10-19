import slugify from 'slugify';
import {
    findAllCategories,
    findCategoryById,
    findCategoryBySlug,
    insertCategory,
    updateCategoryData,
    deleteCategoryData,
} from './category.repository.js';

// get all
export async function getAllCategories() {
    return findAllCategories();
}

// get by id
export async function getCategory(id) {
    const category = await findCategoryById(id);
    if (!category) throw new Error('Category not found');
    return category;
}

// get by slug
export async function getCategorySlug(slug) {
    const category = await findCategoryBySlug(slug);
    if (!category) throw new Error('Category not found');
    return category;
}

// create
export async function createCategory(data) {
    const { title } = data;

    if (!title || title.trim().length < 3) {
        throw new Error('Title is required and must be at least 3 characters');
    }

    const slug = slugify(title, { lower: true, strict: true });

    const existing = await findCategoryBySlug(slug);
    if (existing) {
        throw new Error('Category with this title already exists');
    }

    return insertCategory({
        title: title.trim(),
        slug,
    });
}

// update
export async function updateCategory(id, data) {
    const { title } = data;
    let updateData = {};

    if (title) {
        if (title.trim().length < 3) {
            throw new Error('Title must be at least 3 characters');
        }
        updateData.title = title.trim();
        updateData.slug = slugify(title, { lower: true, strict: true });
    }

    return updateCategoryData(id, updateData);
}

// delete
export async function removeCategory(id) {
    return deleteCategoryData(id);
}
