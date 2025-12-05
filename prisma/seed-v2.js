// file: prisma/seed-v2.js
import { PrismaClient } from "../src/generated/prisma/index.js";
import slugify from "slugify";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

function createSlug(title) {
    return slugify(title, { lower: true, strict: true });
}

// ===============================
// Helper: Copy images by product id
// ===============================
async function copyProductImages(productId, productSlug) {
    const sourceDir = path.join(__dirname, "./inject-2", productId.toString());
    const targetDir = path.join(__dirname, "../uploads/product", productSlug);

    if (!fs.existsSync(sourceDir)) {
        console.log(`  ⚠️  No images folder for product ${productId}`);
        return [];
    }

    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const files = fs
        .readdirSync(sourceDir)
        .filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file))
        .sort();

    const imagePaths = [];

    files.forEach((file, index) => {
        const sourcePath = path.join(sourceDir, file);
        const ext = path.extname(file);
        const targetFileName = `${index + 1}${ext}`;
        const targetPath = path.join(targetDir, targetFileName);

        fs.copyFileSync(sourcePath, targetPath);
        const imageUrl = `/uploads/product/${productSlug}/${targetFileName}`;
        imagePaths.push(imageUrl);
        console.log(`    ✓ Copied: ${file} → ${targetFileName}`);
    });

    return imagePaths;
}

// ===============================
// Mapping master (id → name)
// ===============================
const categoryNames = {
    1: "Long Skirt",
    2: "Short Skirt",
    3: "Mini Skirt",
    4: "Bustier",
    5: "Bralette",
    6: "Short",
    7: "Dress",
    8: "Pants",
    9: "Long Sleeve Shirt",
    10: "Reversible Madame",
    11: "Boyfriend Shirt",
    12: "Summer Suit",
    13: "Mini Dress",
    14: "Dress Tier Skirt",
    15: "Bra",
    16: "Big Skirt",
    17: "Wrap Skirt",
    18: "Long Jumpsuit",
    19: "Outer",
    20: "Girlfriend Shirt",
    21: "Top",
    22: "Tube Bralette",
    23: "Bustier Boneless",
    24: "Short Jumpsuit",
    25: "Reversible Monsieur",
    26: "Long Flare Skirt",
    27: "culotte",
    28: "pajamas",
    29: "reversible kimono",
    30: "cheongsam slit dress",
    31: "skimpy",
    32: "unipants",
    33: "corset",
    34: "set",
    35: "bustier",
};

const kainNames = {
    1: "Sumba Couture Canvas",
    2: "Shibori Couture Canvas",
    3: "Kain Bali",
    4: "Lombok",
    5: "Silk Shibori",
};

const collectionInfos = {
    1: {
        title: "Couture Canvas",
        description:
            "The Couture Canvas Collection explores simplicity as a translation of elegance: clean lines, refined tailoring, and versatile silhouettes creating a timeless wardrobe designed for every occasion.",
        subDescription:
            "Just like a blank canvas, each piece invites you to express individuality with quiet confidence and effortless grace.",
    },
    2: {
        title: "Island Couture Forbidden Fruit",
        description:
            "Forbidden Fruit is the bright and daring spirit of Island Couture, blending bold, sensuous design with the artistry of traditional Kain Bali.",
        subDescription:
            "A collection that tempts with creativity and innovation, while honoring the heritage of Bali.",
    },
    3: {
        title: "Island Couture Animal Spirit",
        description:
            "Animal Spirit is the wild and rebellious heart of Island Couture – a celebration of strength, instinct, and untamed beauty.",
        subDescription:
            "Each piece merges the raw allure of animal prints with the refined artistry of traditional weaving.",
    },
    4: {
        title: "Island couture",
        description:
            "Island Couture main line inspired by island life, easy silhouettes, and relaxed tailoring.",
        subDescription:
            "Versatile resort pieces designed to move from coastside days to warm nights.",
    },
    5: {
        title: "Festive Couture",
        description:
            "Festive Couture is playful celebration wear with rich textures, bold cuts, and statement detailing.",
        subDescription:
            "Designed for special moments, combining Indonesian craftsmanship with modern glamour.",
    },
};

// ===============================
// Helper: resolve IDs from DB
// ===============================
const categoryCache = {};
const kainCache = {};
const collectionCache = {};

async function getCategoryId(categoryId) {
    if (!categoryId) return null;

    const name = categoryNames[categoryId];
    if (!name) {
        console.warn(`  ⚠️  Unknown categoryId: ${categoryId}`);
        return null;
    }

    const slug = createSlug(name);

    if (categoryCache[slug]) return categoryCache[slug];

    // 🔁 upsert: kalau sudah ada pakai, kalau belum bikin baru
    const record = await prisma.category.upsert({
        where: { slug },
        update: {}, // tidak mengubah apa-apa kalau sudah ada
        create: {
            title: name,
            slug,
        },
    });

    categoryCache[slug] = record.id;
    return record.id;
}

async function getKainId(kainId) {
    if (!kainId) return null;
    const name = kainNames[kainId];
    if (!name) {
        console.warn(`  ⚠️  Unknown kainId: ${kainId}`);
        return null;
    }
    const slug = createSlug(name);
    if (kainCache[slug]) return kainCache[slug];

    const record = await prisma.kain.upsert({
        where: { slug },
        update: {},
        create: {
            name,
            slug,
        },
    });
    kainCache[slug] = record.id;
    return record.id;
}

async function getCollectionId(collectionId) {
    if (!collectionId) return null;
    const info = collectionInfos[collectionId];
    if (!info) {
        console.warn(`  ⚠️  Unknown collectionId: ${collectionId}`);
        return null;
    }
    const slug = createSlug(info.title);
    if (collectionCache[slug]) return collectionCache[slug];

    const record = await prisma.collection.upsert({
        where: { slug },
        update: {},
        create: {
            title: info.title,
            slug,
            description: info.description || "",
            subDescription: info.subDescription || null,
            quote: "Indonesian Ready Couture. We stage Indonesian creativity, craftmanship and elegance to the world.",
            heroImage: null,
            status: true,
            position: collectionId,
        },
    });

    collectionCache[slug] = record.id;
    return record.id;
}

// ===============================
// Data product 44–112
// ===============================
const productsData = [
    {
        id: 44,
        title: "MOVE ON COUTURE - SUMMER SUIT",
        price: 1999000,
        categoryId: 12,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 45,
        title: "MOVE ON COUTURE - BALI CULOTTE",
        price: 1999000,
        categoryId: 27,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 46,
        title: "MOVE ON COUTURE - SUMMER SUIT",
        price: 1999000,
        categoryId: 12,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 47,
        title: "MOVE ON COUTURE - SUMMER SUIT",
        price: 1999000,
        categoryId: 12,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 48,
        title: "MOVE ON COUTURE - SUMMER SUIT",
        price: 1999000,
        categoryId: 12,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 49,
        title: "MOVE ON COUTURE - SUMMER SUIT",
        price: 1999000,
        categoryId: 12,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 50,
        title: "FESTIVE COUTURE - CORSET",
        price: 1500000,
        categoryId: 33,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 51,
        title: "MOVE ON COUTURE - SUMMER SUIT",
        price: 1999000,
        categoryId: 12,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 52,
        title: "ISLAND COUTURE - SUMMER SUIT",
        price: 1999000,
        categoryId: 12,
        collectionId: 4,
        kainId: null,
    },
    {
        id: 53,
        title: "ISLAND COUTURE - BRALETTE",
        price: 999000,
        categoryId: 5,
        collectionId: 4,
        kainId: null,
    },
    {
        id: 54,
        title: "ISLAND COUTURE - PICK POCKET SHORT",
        price: 999000,
        categoryId: 6,
        collectionId: 4,
        kainId: null,
    },
    {
        id: 55,
        title: "MOVE ON COUTURE - BALI CULOTTE",
        price: 1999000,
        categoryId: 27,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 56,
        title: "MOVE ON COUTURE - BALI CULOTTE",
        price: 1999000,
        categoryId: 27,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 57,
        title: "MOVE ON COUTURE - BALI CULOTTE",
        price: 1999000,
        categoryId: 27,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 58,
        title: "MOVE ON COUTURE - BALI CULOTTE",
        price: 1999000,
        categoryId: 27,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 59,
        title: "MOVE ON COUTURE - BALI CULOTTE",
        price: 1999000,
        categoryId: 27,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 60,
        title: "ISLAND COUTURE - PICK POCKET SHORT",
        price: 999000,
        categoryId: 6,
        collectionId: 4,
        kainId: null,
    },
    {
        id: 61,
        title: "MOVE ON COUTURE - MINI PAJAMAS SET - TOP",
        price: 1699000,
        categoryId: 28,
        collectionId: 5,
        kainId: null,
    },
    // 62: categoryId asli 38 → diasumsikan 28 (pajamas)
    {
        id: 62,
        title: "MOVE ON COUTURE - MINI PAJAMAS SET - SHORT",
        price: 999000,
        categoryId: 28,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 63,
        title: "FESTIVE COUTURE - REVERSIBLE KIMONO",
        price: 3500000,
        categoryId: 29,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 64,
        title: "FESTIVE COUTURE - REVERSIBLE KIMONO",
        price: 3500000,
        categoryId: 29,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 65,
        title: "FESTIVE COUTURE - CHEONGSAM SLIT DRESS",
        price: 2999000,
        categoryId: 30,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 66,
        title: "FESTIVE COUTURE - CHEONGSAM SLIT DRESS",
        price: 2999000,
        categoryId: 30,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 67,
        title: "FESTIVE COUTURE - CORSET",
        price: 1500000,
        categoryId: 33,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 68,
        title: "FESTIVE COUTURE - SKIMPY",
        price: 1999000,
        categoryId: 31,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 69,
        title: "FESTIVE COUTURE - LOW WAIST MINI SKIRT",
        price: 1999000,
        categoryId: 3,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 70,
        title: "FESTIVE COUTURE - WRAP BUSTIER",
        price: 1999000,
        categoryId: 4,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 71,
        title: "FESTIVE COUTURE - LOW WAIST MINI SKIRT",
        price: 1999000,
        categoryId: 3,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 72,
        title: "ISLAND COUTURE - SHEER OUTER WHITE WITH KAIN BALI",
        price: 3500000,
        categoryId: 19,
        collectionId: 4,
        kainId: 3,
    },
    {
        id: 73,
        title: "FESTIVE COUTURE - REVERSIBLE KIMONO",
        price: 3500000,
        categoryId: 29,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 74,
        title: "FESTIVE COUTURE - SHEER OUTER ANIMAL PRINT WITH SARONG",
        price: 3500000,
        categoryId: 19,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 75,
        title: "FESTIVE COUTURE - REVERSIBLE KIMONO",
        price: 3500000,
        categoryId: 29,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 76,
        title: "FESTIVE COUTURE - REVERSIBLE KIMONO",
        price: 3500000,
        categoryId: 29,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 77,
        title: "FESTIVE COUTURE - A LINE SKIRT",
        price: 1699000,
        categoryId: 3,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 78,
        title: "FESTIVE COUTURE - SKIMPY PINK OUTER",
        price: 1999000,
        categoryId: 31,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 79,
        title: "FESTIVAL OUTER IN SILK SHIBORI - MADE TO ORDER ",
        price: 9999000,
        categoryId: 19,
        collectionId: 5,
        kainId: 5,
    },
    {
        id: 80,
        title: "FESTIVAL OUTER IN SILK SHIBORI - MADE TO ORDER",
        price: 9999000,
        categoryId: 19,
        collectionId: 5,
        kainId: 5,
    },
    {
        id: 81,
        title: "FESTIVAL OUTER IN SILK SHIBORI - MADE TO ORDER ",
        price: 9999000,
        categoryId: 19,
        collectionId: 5,
        kainId: 5,
    },
    {
        id: 82,
        title: "MOVE ON COUTURE - UNIPANTS",
        price: 1999000,
        categoryId: 32,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 83,
        title: "FESTIVAL OUTER IN SILK SHIBORI - MADE TO ORDER ",
        price: 9999000,
        categoryId: 19,
        collectionId: 5,
        kainId: 5,
    },
    {
        id: 84,
        title: "FESTIVE COUTURE - REVERSIBLE KIMONO",
        price: 3500000,
        categoryId: 29,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 85,
        title: "MOVE ON COUTURE - UNIPANTS ",
        price: 1999000,
        categoryId: 32,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 86,
        title: "FESTIVE COUTURE - MINI U DRESS",
        price: 1999000,
        categoryId: 7,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 87,
        title: "FESTIVE COUTURE - MINI PAJAMAS SET - TOP",
        price: 1699000,
        categoryId: 28,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 88,
        title: "FESTIVE COUTURE - MINI PAJAMAS SET - SHORT",
        price: 999000,
        categoryId: 28,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 89,
        title: "MOVE ON COUTURE - HALTER NECK AND MIDI PANTS SET - TOP",
        price: 1500000,
        categoryId: 34,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 90,
        title: "MOVE ON COUTURE - HALTER NECK AND MIDI PANTS SET - PANTS",
        price: 1500000,
        categoryId: 34,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 91,
        title: "PLAIN WHITE (COTTON) - LONG SLEEVE WHITE",
        price: 1500000,
        categoryId: 9,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 92,
        title: "FESTIVE COUTURE - A LINE SKIRT",
        price: 1699000,
        categoryId: 2,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 93,
        title: "FESTIVE COUTURE - CORSET",
        price: 1500000,
        categoryId: 33,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 94,
        title: "FESTIVE COUTURE - BRALETTE SONGKET",
        price: 999000,
        categoryId: 5,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 95,
        title: "FESTIVE COUTURE - TIER SHEER SKIRT",
        price: 1999000,
        categoryId: null,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 96,
        title: "FESTIVE COUTURE - BRALETTE SONGKET",
        price: 999000,
        categoryId: 5,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 97,
        title: "FESTIVE COUTURE - WRAP BUSTIER",
        price: 999000,
        categoryId: 35,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 98,
        title: "ISLAND COUTURE - SHORT",
        price: 999000,
        categoryId: 6,
        collectionId: 4,
        kainId: null,
    },
    {
        id: 99,
        title: "ISLAND COUTURE - LONG PANTS",
        price: 1999000,
        categoryId: 8,
        collectionId: 4,
        kainId: null,
    },
    {
        id: 100,
        title: "ISLAND COUTURE - SHEER OUTER WHITE WITH KAIN BALI",
        price: 3500000,
        categoryId: 19,
        collectionId: 4,
        kainId: null,
    },
    {
        id: 101,
        title: "FESTIVE COUTURE - REVERSIBLE KIMONO",
        price: 3500000,
        categoryId: 29,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 102,
        title: "ISLAND COUTURE - REVERSIBLE MADAME ",
        price: 3500000,
        categoryId: 29,
        collectionId: 4,
        kainId: null,
    },
    {
        id: 103,
        title: "ISLAND COUTURE - REVERSIBLE MONSIEUR",
        price: 3500000,
        categoryId: 29,
        collectionId: 4,
        kainId: null,
    },
    {
        id: 104,
        title: "MOVE ON COUTURE - UNIPANTS",
        price: 1999000,
        categoryId: 32,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 105,
        title: "ISLAND COUTURE - SUMMER SUIT",
        price: 1999000,
        categoryId: 12,
        collectionId: 4,
        kainId: null,
    },
    {
        id: 106,
        title: "MOVE ON COUTURE - SUMMER SUIT",
        price: 1999000,
        categoryId: 12,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 107,
        title: "ISLAND COUTURE - ANIMAL SPIRIT - SUMMER SUIT",
        price: 1999000,
        categoryId: 12,
        collectionId: 3,
        kainId: null,
    },
    {
        id: 108,
        title: "ISLAND COUTURE - FORBIDDEN FRUIT - BOYFRIEND SHIRT PAMPLEMOUSSE SHIBORI",
        price: 1699000,
        categoryId: 11,
        collectionId: 4,
        kainId: 2,
    },
    {
        id: 109,
        title: "FESTIVE COUTURE - CORSET green",
        price: 1500000,
        categoryId: 33,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 110,
        title: "FYI SCARF - LION HAIR AND SONGKET BALI",
        price: 99000,
        categoryId: null,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 111,
        title: "PLAIN WHITE (SILK) - LONG SLEEVE SHIRT",
        price: 1999000,
        categoryId: 9,
        collectionId: 5,
        kainId: null,
    },
    {
        id: 112,
        title: "ISLAND COUTURE - BIG SKIRT SARONG",
        price: 2500000,
        categoryId: 16,
        collectionId: 4,
        kainId: null,
    },
];

const slugCounts = {};
for (const p of productsData) {
    const base = createSlug(p.title);
    slugCounts[base] = (slugCounts[base] || 0) + 1;
}

// ===============================
// MAIN
// ===============================
async function main() {
    console.log("🌱 Seeding FYI Couture products v2 (44–112)...");

    let createdCount = 0;

    for (const product of productsData) {
        console.log(`\n📦 Processing #${product.id}: ${product.title}`);

        const baseSlug = createSlug(product.title);
        const slug =
            slugCounts[baseSlug] > 1
                ? `${baseSlug}-${product.id}` // kalau title-nya dipakai lebih dari sekali → tambahin -id
                : baseSlug; // kalau unik → pakai slug biasa

        const sku = `FYI-${product.id.toString().padStart(3, "0")}`;

        const categoryDbId = await getCategoryId(product.categoryId);
        const collectionDbId = await getCollectionId(product.collectionId);
        const kainDbId = await getKainId(product.kainId);

        // copy images
        const imagePaths = await copyProductImages(product.id, slug);
        const mainImage = imagePaths.length > 0 ? imagePaths[0] : null;

        // upsert product
        const record = await prisma.product.upsert({
            where: { slug },
            update: {
                price: product.price,
                categoryId: categoryDbId,
                collectionId: collectionDbId,
                kainId: kainDbId,
                imageUrl: mainImage,
            },
            create: {
                title: product.title,
                slug,
                description: null,
                price: product.price,
                stock: 0,
                sku,
                imageUrl: mainImage,
                details: null,
                delivery: null,
                status: true,
                categoryId: categoryDbId,
                collectionId: collectionDbId,
                kainId: kainDbId,
            },
        });

        // refresh product images (idempotent)
        if (imagePaths.length > 0) {
            await prisma.productImage.deleteMany({
                where: { productId: record.id },
            });

            for (let i = 0; i < imagePaths.length; i++) {
                await prisma.productImage.create({
                    data: {
                        productId: record.id,
                        imageUrl: imagePaths[i],
                        isPrimary: i === 0,
                    },
                });
                console.log(`    ✓ Saved to DB: ${imagePaths[i]}`);
            }
        } else {
            console.log(
                "    ⚠️  No images copied, product will have no gallery."
            );
        }

        createdCount++;
        console.log(`  ✓ Product seeded: ${product.title}`);
    }

    console.log(`\n✅ Done! Total products processed: ${createdCount}`);
}

main()
    .catch((err) => {
        console.error("❌ Seeding v2 failed:", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
