import { Router } from 'express';
import {
    handleGetCollections,
    handleGetCollectionById,
    handleGetCollectionBySlug,
    handleCreateCollection,
    handleUpdateCollection,
    handleDeleteCollection,
    handleUpdateCollectionStatus,
    handleReorderCollections
} from '../usecase/collections/collection.controller.js';

import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { createUploader } from '../middleware/upload.middleware.js'

const uploadHero = createUploader('collection-hero', 'uploads/collection')
const router = Router();

// 👤 Public
router.get('/', handleGetCollections);
router.get('/:id', handleGetCollectionById);
router.get('/slug/:slug', handleGetCollectionBySlug);

// 🔒 Admin Only
router.post('/', requireAuth, requireAdmin, uploadHero.single('hero'), handleCreateCollection);
router.put("/reorder", requireAuth, requireAdmin, handleReorderCollections);
router.put('/:id', requireAuth, requireAdmin, uploadHero.single('hero'), handleUpdateCollection);
router.patch('/status/:id', requireAuth, requireAdmin, handleUpdateCollectionStatus);
router.delete('/:id', requireAuth, requireAdmin, handleDeleteCollection);

export default router;
