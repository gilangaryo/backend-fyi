import {
    getAllCollections,
    getCollection,
    getCollectionSlug,
    createCollection,
    updateCollection,
    removeCollection,
    updateCollectionStatus,
} from './collection.service.js';
import fs from 'fs';
import path from 'path';
import prisma from '../../prisma/client.js';


// get all
export async function handleGetCollections(req, res) {
    try {
        const { status } = req.query

        const collections = await getAllCollections(status);
        res.status(200).json({
            success: true,
            status: 200,
            message: 'Collection list retrieved successfully',
            data: collections,
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
export async function handleGetCollectionById(req, res) {
    try {
        const collection = await getCollection(req.params.id);
        res.status(200).json({
            success: true,
            status: 200,
            message: 'Collection retrieved successfully',
            data: collection,
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
export async function handleGetCollectionBySlug(req, res) {
    try {
        const collection = await getCollectionSlug(req.params.slug);
        res.status(200).json({
            success: true,
            status: 200,
            message: 'Collection retrieved successfully',
            data: collection,
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
export async function handleCreateCollection(req, res) {
    try {
        const heroImagePath = req.file ? `/uploads/collection/${req.file.filename}` : null



        const created = await createCollection({
            ...req.body,
            heroImage: heroImagePath,
        })
        console.log(created);


        res.status(201).json({
            success: true,
            status: 201,
            message: 'Collection created successfully',
            data: created,
        })
    } catch (err) {
        res.status(400).json({
            success: false,
            status: 400,
            message: err.message,
            data: null,
        })
    }
}


export async function handleUpdateCollection(req, res) {
    try {
        const { id } = req.params

        const existing = await prisma.collection.findUnique({ where: { id } })
        if (!existing) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: 'Collection not found',
                data: null,
            })
        }

        let heroImagePath
        if (req.file) {
            if (existing.heroImage) {
                const oldFile = path.join(process.cwd(), existing.heroImage)
                if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile)
            }

            heroImagePath = `/uploads/collection/${req.file.filename}`
        }

        const updateData = {
            ...req.body,
            ...(heroImagePath && { heroImage: heroImagePath }),
        }

        const updated = await updateCollection(id, updateData)

        res.status(200).json({
            success: true,
            status: 200,
            message: 'Collection updated successfully',
            data: updated,
        })
    } catch (err) {
        console.error(err)
        res.status(400).json({
            success: false,
            status: 400,
            message: err.message,
            data: null,
        })
    }
}


// delete
export async function handleDeleteCollection(req, res) {
    try {
        await removeCollection(req.params.id);
        res.status(200).json({
            success: true,
            status: 200,
            message: 'Collection deleted successfully',
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


export async function handleUpdateCollectionStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (typeof status !== 'boolean') {
            return res.status(400).json({
                success: false,
                status: 400,
                message: 'Status must be boolean (true/false)',
                data: null,
            });
        }

        const updated = await updateCollectionStatus(id, status);

        res.status(200).json({
            success: true,
            status: 200,
            message: `Collection status updated to ${status ? 'Active' : 'Inactive'}`,
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

export async function handleUploadCollectionHero(req, res) {
    try {
        const { id } = req.params

        if (!req.file) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: 'No file uploaded',
            })
        }

        const heroImagePath = `/uploads/${req.file.filename}`

        const updated = await updateCollection(id, { heroImage: heroImagePath })

        res.status(200).json({
            success: true,
            status: 200,
            message: 'Hero image uploaded successfully',
            data: updated,
        })
    } catch (err) {
        res.status(400).json({
            success: false,
            status: 400,
            message: err.message,
        })
    }
}
