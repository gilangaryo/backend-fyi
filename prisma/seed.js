import { PrismaClient } from "../src/generated/prisma/index.js";
import bcrypt from "bcrypt";
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

// Helper untuk copy images dari folder source ke target
async function copyProductImages(productId, productSlug) {
    const sourceDir = path.join(
        __dirname,
        "../uploads/product/COUTURE CANVAS",
        productId.toString()
    );
    const targetDir = path.join(__dirname, "../uploads/product", productSlug);

    if (!fs.existsSync(sourceDir)) {
        console.log(`  ⚠️  No images found for product ${productId}`);
        return [];
    }

    // Create target directory
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    // Get all image files and sort them
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

async function main() {
    console.log("🌱 Start seeding FYI Couture...");

    // ======================================================
    // 1️⃣ USERS
    // ======================================================
    console.log("👤 Creating users...");
    const passwordHash = await bcrypt.hash("password123", 10);

    const admin = await prisma.user.upsert({
        where: { email: "admin@fyi.com" },
        update: {},
        create: {
            name: "Admin FYI",
            email: "admin@fyi.com",
            password: passwordHash,
            role: "ADMIN",
        },
    });

    const user = await prisma.user.upsert({
        where: { email: "user@fyi.com" },
        update: {},
        create: {
            name: "Axlarik Rizki H",
            email: "user@fyi.com",
            password: passwordHash,
            role: "USER",
        },
    });

    console.log("✓ Users created");

    // ======================================================
    // 2️⃣ KAIN (FABRIC)
    // ======================================================
    console.log("🧵 Creating kain/fabric types...");

    const kainData = [
        { id: 1, name: "Sumba Couture Canvas" },
        { id: 2, name: "Shibori Couture Canvas" },
        { id: 3, name: "Kain Bali" },
        { id: 4, name: "Lombok" },
    ];

    const kainRecords = {};

    for (const kain of kainData) {
        const slug = createSlug(kain.name);
        const record = await prisma.kain.upsert({
            where: { slug },
            update: {},
            create: {
                name: kain.name,
                slug: slug,
            },
        });
        kainRecords[kain.id] = record.id;
        console.log(`✓ Created kain: ${kain.name}`);
    }

    // ======================================================
    // 3️⃣ CATEGORIES
    // ======================================================
    console.log("📂 Creating categories...");

    const categoriesData = [
        { id: 1, title: "Long Skirt" },
        { id: 2, title: "Short Skirt" },
        { id: 3, title: "Mini Skirt" },
        { id: 4, title: "Bustier" },
        { id: 5, title: "Bralette" },
        { id: 6, title: "Short" },
        { id: 7, title: "Dress" },
        { id: 8, title: "Pants" },
        { id: 9, title: "Long Sleeve Sh" },
        { id: 10, title: "Reversible Madame" },
        { id: 11, title: "Boyfriend Shirt" },
        { id: 12, title: "Summer Suit" },
        { id: 13, title: "Mini Dress" },
        { id: 14, title: "Dress Tier Skirt" },
        { id: 15, title: "Bra" },
        { id: 16, title: "Big Skirt" },
        { id: 17, title: "Wrap Skirt" },
        { id: 18, title: "Long Jumpsuit" },
        { id: 19, title: "Outer" },
        { id: 20, title: "Girlfriend Shirt" },
        { id: 21, title: "Top" },
        { id: 22, title: "Tube Bralette" },
        { id: 23, title: "Bustier Boneless" },
        { id: 24, title: "Short Jumpsuit" },
        { id: 25, title: "Reversible Monsieur" },
        { id: 26, title: "Long Flare Skirt" },
        { id: 27, title: "Long Slip Dress" },
        { id: 28, title: "Mermaid Skirt" },
    ];

    const categoryRecords = {};

    for (const category of categoriesData) {
        const slug = createSlug(category.title);
        const record = await prisma.category.upsert({
            where: { slug },
            update: {},
            create: {
                title: category.title,
                slug: slug,
            },
        });
        categoryRecords[category.id] = record.id;
        console.log(`✓ Created category: ${category.title}`);
    }

    // ======================================================
    // 4️⃣ COLLECTIONS
    // ======================================================
    console.log("🎨 Creating collections...");

    const collectionsData = [
        {
            id: 1,
            title: "Couture Canvas",
            description:
                "The Couture Canvas Collection is the first FYI Couture's signature, when the brand starts in 2025 It explores simplicity as a translation of elegance: clean lines, refined tailoring, and versatile silhouettes creating a timeless wardrobe designed for every occasion.",
            subDescription:
                "Just like a blank canvas, each piece invites everyone to express your individuality with quiet confidence and effortless grace.",
        },
        {
            id: 2,
            title: "Island Couture Forbidden Fruit",
            description:
                "Forbidden Fruit is the bright and daring spirit of Island Couture, reimagined with the soul of Bali. Each piece blends bold, sensuous design with the artistry of traditional Kain Bali — a fabric rich in culture, symbolism, and timeless beauty.",
            subDescription:
                "The result is a collection that tempts with creativity and innovation, while honoring the heritage of Bali a tradition rich and artistic island.",
        },
        {
            id: 3,
            title: "Island Couture Animal Spirit",
            description:
                "Animal Spirit is the wild and rebellious heart of Island Couture - a celebration of strength, instinct, and untamed beauty. Each piece merges the raw allure of animal prints with the refined artistry of Lombok woven heritage, creating an intriguing dialogue between tradition and wilderness.",
            subDescription:
                "Brave yet graceful, this collection embodies freedom that lives within all of us.",
        },
    ];

    const collectionRecords = {};

    for (const collection of collectionsData) {
        const slug = createSlug(collection.title);
        const record = await prisma.collection.upsert({
            where: { slug },
            update: {},
            create: {
                title: collection.title,
                slug: slug,
                description: collection.description,
                subDescription: collection.subDescription,
                quote: "Indonesian Ready Couture. We stage Indonesian creativity, craftmanship and elegance to the world.",
                heroImage: null,
                status: true,
                position: collection.id,
            },
        });
        collectionRecords[collection.id] = record.id;
        console.log(`✓ Created collection: ${collection.title}`);
    }

    // ======================================================
    // 5️⃣ PRODUCTS
    // ======================================================
    console.log("🛍️ Creating products...");

   const productsData = [
       // COUTURE CANVAS (1-11)
       {
           id: 1,
           title: "FLIRT BRA - BRALETTE - FORBIDDEN FRUIT",
           price: 499000,
           categoryId: 5,
           collectionId: 1,
           kainId: null,
       },
       {
           id: 2,
           title: "SUMBA COUTURE CANVAS - MINI SKIRT",
           price: 1599000,
           categoryId: 3,
           collectionId: 1,
           kainId: 1,
       },
       {
           id: 3,
           title: "SUMBA COUTURE CANVAS - LONG SKIRT",
           price: 1999000,
           categoryId: 1,
           collectionId: 1,
           kainId: 1,
       },
       {
           id: 4,
           title: "SHIBORI COUTURE CANVAS - LACE AND SHIBORI BUSTIER PURPLE",
           price: 1999000,
           categoryId: 4,
           collectionId: 1,
           kainId: 2,
       },
       {
           id: 5,
           title: "SUMBA COUTURE CANVAS - LONG SKIRT",
           price: 1999000,
           categoryId: 1,
           collectionId: 1,
           kainId: 1,
       },
       {
           id: 6,
           title: "SHIBORI COUTURE CANVAS - LACE AND SHIBORI BUSTIER ORANGE",
           price: 1999000,
           categoryId: 4,
           collectionId: 1,
           kainId: 2,
       },
       {
           id: 7,
           title: "SHIBORI COUTURE CANVAS - BONE TUBE DRESS",
           price: 2500000,
           categoryId: 7,
           collectionId: 1,
           kainId: 2,
       },
       {
           id: 8,
           title: "SHIBORI COUTURE CANVAS - CULOTTE PANTS",
           price: 1999000,
           categoryId: 8,
           collectionId: 1,
           kainId: 2,
       },
       {
           id: 9,
           title: "SHIBORI COUTURE CANVAS - SHORT PANTS",
           price: 1499000,
           categoryId: 8,
           collectionId: 1,
           kainId: 2,
       },
       {
           id: 10,
           title: "WHITE COUTURE CANVAS - SHIRT DRESS",
           price: 1999000,
           categoryId: 7,
           collectionId: 1,
           kainId: 1,
       },
       {
           id: 11,
           title: "SUMBA SHIBORI COUTURE CANVAS - CAPUCHON DRESS",
           price: 3699000,
           categoryId: 7,
           collectionId: 1,
           kainId: 2,
       },

       // FORBIDDEN FRUIT (12-22, skip 15, 20, 21)
       {
           id: 12,
           title: "REVERSIBLE MADAME - FORBIDDEN FRUIT - KAIN BALI GREEN",
           price: 3500000,
           categoryId: 10,
           collectionId: 2,
           kainId: 3,
       },
       {
           id: 13,
           title: "REVERSIBLE MADAME - FORBIDDEN FRUIT - KAIN BALI WHITE",
           price: 3500000,
           categoryId: 10,
           collectionId: 2,
           kainId: 3,
       },
       {
           id: 14,
           title: "BOYFRIEND SHIRT - FORBIDDEN FRUIT PAMPLEMOUSSE SHIBORI",
           price: 1699000,
           categoryId: 11,
           collectionId: 2,
           kainId: 2,
       },
       // SKIP 15 - NO PHOTO
       {
           id: 16,
           title: "COCKTAIL DRESS - TUBE MINI DRESS - FORBIDDEN FRUIT - LOMBOK",
           price: 2500000,
           categoryId: 7,
           collectionId: 2,
           kainId: 4,
       },
       {
           id: 17,
           title: "CAKE DRESS - DRESS TIER SKIRT - FORBIDDEN FRUIT - KAIN BALI",
           price: 2500000,
           categoryId: 7,
           collectionId: 2,
           kainId: 3,
       },
       {
           id: 19,
           title: "FORBIDDEN FRUIT - BIG SKIRT",
           price: 2500000,
           categoryId: 16,
           collectionId: 2,
           kainId: 2,
       },
       // SKIP 20 - NO PHOTO
       // SKIP 21 - NO PHOTO
       {
           id: 22,
           title: "CANDY SHORT - FORBIDDEN FRUIT",
           price: 499000,
           categoryId: 6,
           collectionId: 2,
           kainId: 2,
       },

       // ANIMAL SPIRIT (23-43, skip 40)
       {
           id: 23,
           title: "TWIRL DRESS - MINI V DRESS - ANIMAL SPIRIT",
           price: 1499000,
           categoryId: 13,
           collectionId: 3,
           kainId: 3,
       },
       {
           id: 24,
           title: "FLIRTY HIP - LONG JUMPSUIT - ANIMAL SPIRIT",
           price: 2499000,
           categoryId: 18,
           collectionId: 3,
           kainId: 3,
       },
       {
           id: 25,
           title: "REVERSIBLE MADAME - ANIMAL SPIRIT",
           price: 3500000,
           categoryId: 10,
           collectionId: 3,
           kainId: 3,
       },
       {
           id: 26,
           title: "RESORT OUTER - LONG OUTER - ANIMAL SPIRIT",
           price: 3500000,
           categoryId: 19,
           collectionId: 3,
           kainId: 3,
       },
       {
           id: 27,
           title: "GIRLFRIEND SHIRT - CHEONGSAM TOP ANIMAL SPIRIT",
           price: 1099000,
           categoryId: 20,
           collectionId: 3,
           kainId: 3,
       },
       {
           id: 28,
           title: "MAXY CANDY - LONG FLARE SKIRT - ANIMAL SPIRIT",
           price: 2999000,
           categoryId: 26,
           collectionId: 3,
           kainId: 3,
       },
       {
           id: 29,
           title: "BANDEO - TUBE BRALETTE - FORBIDDEN FRUIT - KAIN BALI",
           price: 499000,
           categoryId: 22, // ← Fix: ganti dari 12 ke 22 (Tube Bralette)
           collectionId: 2,
           kainId: 3,
       },
       {
           id: 30,
           title: "PICK POCKET SHORT - LOMBOK",
           price: 999000,
           categoryId: 6,
           collectionId: 3,
           kainId: 4,
       },
       {
           id: 31,
           title: "SUMMER SUIT - ANIMAL SPIRIT",
           price: 1999000,
           categoryId: 12,
           collectionId: 3,
           kainId: 3,
       },
       {
           id: 32,
           title: "BANDEO - TUBE BRALETTE - ANIMAL SPIRIT",
           price: 499000,
           categoryId: 22,
           collectionId: 3,
           kainId: 3,
       },
       {
           id: 33,
           title: "CANDY SHORT - SHORT WITH RUFFLE - ANIMAL SPIRIT",
           price: 499000,
           categoryId: 6,
           collectionId: 3,
           kainId: 3,
       },
       {
           id: 34,
           title: "FLIRT BRA - BRALETTE ANIMAL SPIRIT",
           price: 499000,
           categoryId: 15,
           collectionId: 3,
           kainId: 3,
       },
       {
           id: 35,
           title: "CANDY SHORT - ANIMAL SPIRIT",
           price: 499000,
           categoryId: 6,
           collectionId: 3,
           kainId: 3,
       },
       {
           id: 36,
           title: "CAKE DRESS - DRESS TIER SKIRT - ANIMAL SPIRIT",
           price: 2500000,
           categoryId: 7,
           collectionId: 3,
           kainId: 3,
       },
       {
           id: 37,
           title: "FLIRT DRESS - LONG SLIP DRESS - ANIMAL SPIRIT",
           price: 1999000,
           categoryId: 27,
           collectionId: 3,
           kainId: 3,
       },
       {
           id: 38,
           title: "FLIRT SKIRT - MERMAID SKIRT - ANIMAL SPIRIT",
           price: 1999000,
           categoryId: 28, // ← Fix: ganti dari 27 ke 28 (Mermaid Skirt)
           collectionId: 3,
           kainId: 3,
       },
       {
           id: 39,
           title: "GIRLFRIEND SHIRT - CHEONGSAM TOP - ANIMAL SPIRIT - RED",
           price: 1099000,
           categoryId: 21,
           collectionId: 3,
           kainId: 3,
       },
       // SKIP 40 - NO PHOTO (duplicate title dengan 38)
       {
           id: 41,
           title: "REVERSIBLE MADAME - OUTER - ANIMAL SPIRIT",
           price: 3500000,
           categoryId: 10,
           collectionId: 3,
           kainId: 3,
       },
       {
           id: 42,
           title: "PICK POCKET SHORT - ANIMAL SPIRIT",
           price: 999000,
           categoryId: 6,
           collectionId: 3,
           kainId: 3,
       },
       {
           id: 43,
           title: "WCAMI - BUSTIER BONELESS - ANIMAL SPIRIT",
           price: 1999000,
           categoryId: 23,
           collectionId: 3,
           kainId: 3,
       },
   ];

    const productRecords = {};

    for (const product of productsData) {
        const slug = createSlug(product.title);
        const sku = `FYI-${product.id.toString().padStart(3, "0")}`;

        console.log(`\n📦 Processing: ${product.title}`);

        // Copy images
        const imagePaths = await copyProductImages(product.id, slug);
        const mainImage = imagePaths.length > 0 ? imagePaths[0] : null;

        const record = await prisma.product.upsert({
            where: { slug },
            update: {},
            create: {
                title: product.title,
                slug: slug,
                description: null,
                price: product.price,
                stock: 0,
                sku: sku,
                imageUrl: mainImage,
                details: null,
                delivery: null,
                status: true,
                categoryId: product.categoryId
                    ? categoryRecords[product.categoryId]
                    : null,
                collectionId: product.collectionId
                    ? collectionRecords[product.collectionId]
                    : null,
                kainId: product.kainId ? kainRecords[product.kainId] : null,
            },
        });

        // Create ProductImages for all images
        if (imagePaths.length > 0) {
            for (let i = 0; i < imagePaths.length; i++) {
                await prisma.productImage.create({
                    data: {
                        productId: record.id,
                        imageUrl: imagePaths[i],
                        isPrimary: i === 0,
                    },
                });
                console.log(`    ✓ Added to DB: ${imagePaths[i]}`);
            }
        }

        productRecords[product.id] = record.id;
        console.log(`  ✓ Created product: ${product.title}`);
    }

    // ======================================================
    // 6️⃣ SETTINGS
    // ======================================================
    console.log("\n⚙️ Creating default settings...");

    await prisma.setting.upsert({
        where: { key: "announcement" },
        update: { value: "Free shipping all over Indonesia", isActive: true },
        create: {
            key: "announcement",
            value: "Free shipping all over Indonesia",
            isActive: true,
        },
    });

    await prisma.setting.upsert({
        where: { key: "store_status" },
        update: {},
        create: { key: "store_status", value: "open" },
    });

    await prisma.setting.upsert({
        where: { key: "default_courier" },
        update: {},
        create: { key: "default_courier", value: "sicepat" },
    });

    console.log("✓ Settings created");

    console.log("\n✅ Seeding completed successfully!");
    console.log(`
📊 Summary:
- Users: ${Object.keys({ admin, user }).length}
- Kain: ${Object.keys(kainRecords).length}
- Categories: ${Object.keys(categoryRecords).length}
- Collections: ${Object.keys(collectionRecords).length}
- Products: ${Object.keys(productRecords).length}
- Settings: 3
    `);
}

// ======================================================
// RUN
// ======================================================
main()
    .catch((err) => {
        console.error("❌ Seeding failed:", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
