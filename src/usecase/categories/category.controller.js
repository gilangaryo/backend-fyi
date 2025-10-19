import {
    getAllCategories,
    getCategory,
    getCategorySlug,
    createCategory,
    updateCategory,
    removeCategory,
} from './category.service.js';

// get all
export async function handleGetCategories(req, res) {
    try {
        const categories = await getAllCategories();
        res.status(200).json({
            success: true,
            status: 200,
            message: 'Category list retrieved successfully',
            data: categories,
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

// get by id
export async function handleGetCategoryById(req, res) {
    try {
        const category = await getCategory(req.params.id);
        res.status(200).json({
            success: true,
            status: 200,
            message: 'Category retrieved successfully',
            data: category,
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

// get by slug
export async function handleGetCategoryBySlug(req, res) {
    try {
        const category = await getCategorySlug(req.params.slug);
        res.status(200).json({
            success: true,
            status: 200,
            message: 'Category retrieved successfully',
            data: category,
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

// create
export async function handleCreateCategory(req, res) {
    try {
        const created = await createCategory(req.body);
        res.status(201).json({
            success: true,
            status: 201,
            message: 'Category created successfully',
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

// update
export async function handleUpdateCategory(req, res) {
    try {
        const updated = await updateCategory(req.params.id, req.body);
        res.status(200).json({
            success: true,
            status: 200,
            message: 'Category updated successfully',
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

// delete
export async function handleDeleteCategory(req, res) {
    try {
        await removeCategory(req.params.id);
        res.status(200).json({
            success: true,
            status: 200,
            message: 'Category deleted successfully',
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
