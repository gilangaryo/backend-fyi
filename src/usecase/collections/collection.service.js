import slugify from 'slugify';
import {
    findAllCollections,
    findCollectionById,
    findCollectionBySlug,
    insertCollection,
    updateCollectionData,
    deleteCollectionData,
    updateCollectionStatusData,
    reorderCollections as reorderCollectionsRepo

} from './collection.repository.js';

// get all
export async function getAllCollections(status) {

    let parsedStatus;

    if (typeof status === "string") {
        if (status.toLowerCase() === "true") parsedStatus = true;
        else if (status.toLowerCase() === "false") parsedStatus = false;
    }

    const collections = await findAllCollections(parsedStatus);
    return collections;
}

// get by id
export async function getCollection(id) {
    const collection = await findCollectionById(id);
    if (!collection) throw new Error('Collection not found');
    return collection;
}

// get by slug
export async function getCollectionSlug(slug) {
    const collection = await findCollectionBySlug(slug);
    if (!collection) throw new Error('Collection not found');
    return collection;
}

// create
export async function createCollection(data) {
    const { title, description, subDescription, quote, heroImage } = data;

    if (!title || title.trim().length < 3) {
        throw new Error('Title is required and must be at least 3 characters');
    }

    const slug = slugify(title, { lower: true, strict: true });

    const existing = await findCollectionBySlug(slug);
    if (existing) {
        throw new Error('Collection with this title already exists');
    }

    if (!heroImage) {
        throw new Error('Hero image is required');
    }
    if (!description) {
        throw new Error('Description is required');
    }
    if (!subDescription) {
        throw new Error('Sub description is required');
    }
    if (!quote) {
        throw new Error('Quote is required');
    }

    return insertCollection({
        title: title.trim(),
        description: description,
        subDescription: subDescription,
        quote: quote,
        slug,
        heroImage
    });
}

// update
export async function updateCollection(id, data) {
    const { title, description, subDescription, quote, heroImage } = data;
    let updateData = {};

    if (title) {
        if (title.trim().length < 3) {
            throw new Error('Title must be at least 3 characters');
        }
        updateData.title = title.trim();
        updateData.slug = slugify(title, { lower: true, strict: true });
    }

    if (description !== undefined) updateData.description = description;
    if (subDescription !== undefined) updateData.subDescription = subDescription;
    if (quote !== undefined) updateData.quote = quote;
    if (heroImage !== undefined) updateData.heroImage = heroImage;

    return updateCollectionData(id, updateData);
}


// delete
export async function removeCollection(id) {
    return deleteCollectionData(id);
}


export async function updateCollectionStatus(id, status) {
    const collection = await findCollectionById(id);
    if (!collection) throw new Error('Collection not found');

    return updateCollectionStatusData(id, status);
}




export async function reorderCollections(orderedIds) {
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
        throw new Error("orderedIds must be a non-empty array");
    }

    await reorderCollectionsRepo(orderedIds);
    return { success: true };
}
