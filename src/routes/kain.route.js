import express from 'express';
import prisma from '../prisma/client.js'

const router = express.Router();
// GET all kain
router.get('/', async (req, res) => {
    try {
        const kain = await prisma.kain.findMany({
            orderBy: {
                name: 'asc'
            },
            select: {
                id: true,
                name: true,
                createdAt: true,
                updatedAt: true
            }
        });

        return res.status(200).json({
            success: true,
            data: kain
        });
    } catch (error) {
        console.error('Error fetching kain:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch kain',
            error: error.message
        });
    }
});

// GET single kain by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const kain = await prisma.kain.findUnique({
            where: { id },
            include: {
                products: {
                    select: {
                        id: true,
                        title: true,
                        price: true
                    }
                }
            }
        });

        if (!kain) {
            return res.status(404).json({
                success: false,
                message: 'Kain not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: kain
        });
    } catch (error) {
        console.error('Error fetching kain:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch kain',
            error: error.message
        });
    }
});

// POST create new kain
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;

        // Validation
        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Kain name is required'
            });
        }

        // Check if kain with same name already exists (case-insensitive with LOWER)
        const existingKain = await prisma.kain.findFirst({
            where: {
                name: name.trim()
            }
        });

        if (existingKain) {
            return res.status(409).json({
                success: false,
                message: 'Kain with this name already exists',
                data: existingKain
            });
        }

        // Generate slug from name
        const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

        // Create new kain
        const newKain = await prisma.kain.create({
            data: {
                name: name.trim(),
                slug: slug
            }
        });

        return res.status(201).json({
            success: true,
            message: 'Kain created successfully',
            data: newKain
        });
    } catch (error) {
        console.error('Error creating kain:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create kain',
            error: error.message
        });
    }
});

// PUT update kain
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        // Check if kain exists
        const existingKain = await prisma.kain.findUnique({
            where: { id }
        });

        if (!existingKain) {
            return res.status(404).json({
                success: false,
                message: 'Kain not found'
            });
        }

        // If name is being changed, check for duplicates
        if (name && name !== existingKain.name) {
            const duplicateKain = await prisma.kain.findFirst({
                where: {
                    name: name.trim(),
                    NOT: { id }
                }
            });

            if (duplicateKain) {
                return res.status(409).json({
                    success: false,
                    message: 'Kain with this name already exists'
                });
            }
        }

        // Generate new slug if name changed
        const newSlug = name
            ? name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
            : existingKain.slug;

        // Update kain
        const updatedKain = await prisma.kain.update({
            where: { id },
            data: {
                name: name?.trim() || existingKain.name,
                slug: newSlug,
                updatedAt: new Date()
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Kain updated successfully',
            data: updatedKain
        });
    } catch (error) {
        console.error('Error updating kain:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update kain',
            error: error.message
        });
    }
});

// DELETE kain
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if kain exists
        const kain = await prisma.kain.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });

        if (!kain) {
            return res.status(404).json({
                success: false,
                message: 'Kain not found'
            });
        }

        // Check if kain is being used by products
        if (kain._count.products > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete kain. It is being used by ${kain._count.products} product(s)`
            });
        }

        // Delete kain
        await prisma.kain.delete({
            where: { id }
        });

        return res.status(200).json({
            success: true,
            message: 'Kain deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting kain:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete kain',
            error: error.message
        });
    }
});

// GET search kain by name
router.get('/search/:query', async (req, res) => {
    try {
        const { query } = req.params;

        const kain = await prisma.kain.findMany({
            where: {
                name: {
                    contains: query
                }
            },
            orderBy: {
                name: 'asc'
            },
            take: 10 // Limit results
        });

        return res.status(200).json({
            success: true,
            data: kain
        });
    } catch (error) {
        console.error('Error searching kain:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to search kain',
            error: error.message
        });
    }
});


export default router;