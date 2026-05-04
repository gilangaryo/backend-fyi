import {
    getAllProducts,
    getProduct,
    getProductSlug,
    createProduct,
    updateProduct,
    removeProduct,
    getSuggestedProducts,
    getSaleProducts,
} from "./product.service.js";

// get all
export async function handleGetProducts(req, res) {
    try {
        const {
            search,
            page = 1,
            limit = 12,
            status,
            all,
            sortBy,
            sortOrder,
            collectionSlug,
            categorySlug,
            kain,
        } = req.query;

        const statusFilter =
            status === "false" ? false : status === "true" ? true : undefined;

        const collectionSlugs = collectionSlug
            ? collectionSlug.split(",").filter(Boolean)
            : [];
        const categorySlugs = categorySlug
            ? categorySlug.split(",").filter(Boolean)
            : [];
        const kainNames = kain ? kain.split(",").filter(Boolean) : [];

        if (all === "true") {
            const { products, total } = await getAllProducts({
                statusFilter,
                search,
                skip: 0,
                limit: 10000,
                sortBy,
                sortOrder,
                collectionSlugs,
                categorySlugs,
                kainNames,
            });

            return res.status(200).json({
                success: true,
                status: 200,
                message: "All products retrieved successfully",
                data: products,
                total,
            });
        }

        const pageNum = Math.max(Number(page), 1);
        const limitNum = Math.max(Number(limit), 1);
        const skip = (pageNum - 1) * limitNum;

        const { products, total } = await getAllProducts({
            statusFilter,
            search,
            skip,
            limit: limitNum,
            sortBy,
            sortOrder,
            collectionSlugs,
            categorySlugs,
            kainNames,
        });

        const totalPages = Math.ceil(total / limitNum);

        res.status(200).json({
            success: true,
            status: 200,
            message: "Product list retrieved successfully",
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages,
            },
            data: products,
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

// suggested
export async function handleGetSuggestedProducts(req, res) {
    try {
        const { status, limit } = req.query;

        const statusFilter =
            status === "false" ? false : status === "true" ? true : undefined;

        const productLimit = Number(limit) || 4;

        const products = await getSuggestedProducts(statusFilter, productLimit);

        res.status(200).json({
            success: true,
            status: 200,
            message: "Suggested products retrieved successfully",
            data: products,
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({
            success: false,
            status: 400,
            message: err.message || "Failed to fetch suggested products",
            data: null,
        });
    }
}

// sale
export async function handleGetSaleProducts(req, res) {
    try {
        const { page = 1, limit = 12 } = req.query;
        const pageNum = Math.max(Number(page), 1);
        const limitNum = Math.max(Number(limit), 1);
        const skip = (pageNum - 1) * limitNum;

        const { products, total } = await getSaleProducts({ skip, limit: limitNum });
        const totalPages = Math.ceil(total / limitNum);

        res.status(200).json({
            success: true,
            status: 200,
            message: "Sale products retrieved successfully",
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages,
            },
            data: products,
        });
    } catch (err) {
        console.error(err);
        res.status(400).json({
            success: false,
            status: 400,
            message: err.message || "Failed to fetch sale products",
            data: null,
        });
    }
}

// get by id
export async function handleGetProductById(req, res) {
    try {
        const product = await getProduct(req.params.id);
        res.status(200).json({
            success: true,
            status: 200,
            message: "Product retrieved successfully",
            data: product,
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
export async function handleGetProductBySlug(req, res) {
    try {
        const product = await getProductSlug(req.params.slug);
        res.status(200).json({
            success: true,
            status: 200,
            message: "Product retrieved successfully",
            data: product,
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
export async function handleCreateProduct(req, res) {
    try {
        const created = await createProduct(req.body);
        res.status(201).json({
            success: true,
            status: 201,
            message: "Product created successfully",
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
export async function handleUpdateProduct(req, res) {
    try {
        const updated = await updateProduct(req.params.id, req.body);
        res.status(200).json({
            success: true,
            status: 200,
            message: "Product updated successfully",
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
export async function handleDeleteProduct(req, res) {
    try {
        await removeProduct(req.params.id);
        res.status(200).json({
            success: true,
            status: 200,
            message: "Product deleted successfully",
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

//  toggle status
export async function handleToggleStatus(req, res) {
    try {
        const updated = await updateProduct(req.params.id, {
            status: req.body.status,
        });
        res.status(200).json({
            success: true,
            status: 200,
            message: "Product status updated successfully",
            data: updated,
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            status: 400,
            message: err.message,
        });
    }
}
