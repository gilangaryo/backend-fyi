import slugify from "slugify";
import bcrypt from "bcrypt";
import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

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

    // ======================================================
    // 2️⃣ COLLECTIONS
    // ======================================================
    console.log("🪶 Creating collections...");
    const collections = [
        {
            title: "Forbidden Fruit",
            description:
                "A bold collection inspired by the sweetness and mystery of temptation.",
            subDescription: "Playful, vibrant, and daring pieces for confident women.",
            quote: "Taste the temptation.",
            heroImage: "/collection/dummy-collection-hero.jpg",
        },
        {
            title: "Animal Spirit",
            description: "Animal print isn’t just a look — it’s a statement.",
            subDescription: "Each piece is designed to channel your inner power.",
            quote: "Unleash your spirit.",
            heroImage: "/collection/dummy-collection-hero.jpg",
        },
        {
            title: "White Canvas",
            description:
                "Minimal, clean, and versatile — where simplicity meets elegance.",
            subDescription: "The foundation for effortless everyday style.",
            quote: "Style starts from a blank canvas.",
            heroImage: "/collection/dummy-collection-hero.jpg",
        },
    ];

    const collectionRecords = {};
    for (const col of collections) {
        const record = await prisma.collection.upsert({
            where: { slug: slugify(col.title, { lower: true, strict: true }) },
            update: {},
            create: {
                title: col.title,
                description: col.description,
                subDescription: col.subDescription,
                quote: col.quote,
                heroImage: col.heroImage,
                slug: slugify(col.title, { lower: true, strict: true }),
                status: true,
            },
        });
        collectionRecords[col.title] = record.id;
    }

    // ======================================================
    // 3️⃣ CATEGORIES
    // ======================================================
    console.log("📦 Creating categories...");
    const categories = ["Tops", "Bottom", "Dresses", "Accessories", "Outer"];

    const categoryRecords = {};
    for (const cat of categories) {
        const record = await prisma.category.upsert({
            where: { slug: slugify(cat, { lower: true, strict: true }) },
            update: {},
            create: {
                title: cat,
                slug: slugify(cat, { lower: true, strict: true }),
            },
        });
        categoryRecords[cat] = record.id;
    }

    // ======================================================
    // 4️⃣ PRODUCTS
    // ======================================================
    console.log("👗 Creating products...");
    const descriptions = {
        "Animal Spirit":
            "Animal print isn’t just a look — it’s a statement. A reminder that beneath the calm is a roar.",
        "Forbidden Fruit":
            "A bold collection inspired by the sweetness and mystery of temptation. Playful, vibrant, and daring.",
        "White Canvas":
            "Minimal, clean, and versatile — a wardrobe essential where simplicity meets elegance.",
    };

    const products = [
        {
            title: "RESORT OUTER – LONG OUTER – ANIMAL SPIRIT",
            category: "Outer",
            collection: "Animal Spirit",
        },
        {
            title: "BOYFRIEND SHIRT – FORBIDDEN FRUIT PAMPLEMOUSSE SHIBORI",
            category: "Tops",
            collection: "Forbidden Fruit",
        },
        {
            title: "SUMBA SHIBORI COUTURE CANVAS – CAPUCHON DRESS",
            category: "Dresses",
            collection: "Animal Spirit",
        },
    ];

    const productRecords = {};

    for (const p of products) {
        const slug = slugify(p.title, { lower: true, strict: true });
        const product = await prisma.product.upsert({
            where: { slug },
            update: {},
            create: {
                title: p.title,
                slug,
                price: 1000000,
                description: descriptions[p.collection],
                stock: 20,
                imageUrl: "/uploads/product/dummy-product.png",
                categoryId: categoryRecords[p.category],
                collectionId: collectionRecords[p.collection],
            },
        });

        productRecords[p.title] = product.id;

        // Variants (dengan detail ukuran lengkap)
        await prisma.productVariant.createMany({
            data: [
                {
                    productId: product.id,
                    size: "S",
                    color: "Black",
                    stock: 5,
                    sku: `${slug}-S-BLK`,
                    bust: "84 cm",
                    waist: "68 cm",
                    length: "110 cm",
                    sleeve: "56 cm",
                    height: "160–165 cm",
                },
                {
                    productId: product.id,
                    size: "M",
                    color: "Black",
                    stock: 5,
                    sku: `${slug}-M-BLK`,
                    bust: "88 cm",
                    waist: "72 cm",
                    length: "112 cm",
                    sleeve: "57 cm",
                    height: "165–170 cm",
                },
            ],
            skipDuplicates: true,
        });


        // Images
        await prisma.productImage.createMany({
            data: [
                {
                    productId: product.id,
                    imageUrl: "/uploads/product/front.png",
                    isPrimary: true,
                },
                {
                    productId: product.id,
                    imageUrl: "/uploads/product/back.png",
                    isPrimary: false,
                },
            ],
            skipDuplicates: true,
        });
    }

    // ======================================================
    // 5️⃣ SAMPLE ORDER + PAYMENT
    // ======================================================
    console.log("💸 Creating sample order & payment...");

    const subTotal = 3000000;
    const shippingCost = 50000;
    const total = subTotal + shippingCost;

    const order = await prisma.order.create({
        data: {
            userId: user.id,
            status: "NEW",
            subTotal,
            shippingCost,
            total,
            courierCompany: "JNE",
            items: {
                create: [
                    {
                        productId: Object.values(productRecords)[0],
                        quantity: 1,
                        priceAtPurchase: 1000000,
                    },
                    {
                        productId: Object.values(productRecords)[1],
                        quantity: 2,
                        priceAtPurchase: 1000000,
                    },
                ],
            },
            payments: {
                create: {
                    referenceId: "PAY-001",
                    paymentRequestId: "REQ-001",
                    amount: total,
                    status: "PAID",
                    userId: user.id,
                },
            },
        },
        include: { items: true, payments: true },
    });

    await prisma.orderStatusLog.create({
        data: { orderId: order.id, status: "NEW" },
    });

    // ======================================================
    // 6️⃣ BLOGS
    // ======================================================
    console.log("📰 Creating blogs...");

    const blogs = [
        {
            event: "Behind the Scenes",
            title: "The Making of Forbidden Fruit Collection",
            description:
                "Discover the inspiration and craftsmanship behind FYI Couture’s most daring collection yet.",
            slug: slugify("The Making of Forbidden Fruit Collection", {
                lower: true,
                strict: true,
            }),
            heroImage: "/collection/dummy-collection-hero.jpg",
            firstHeaderImage: "/uploads/product/front.png",
            firstHeading: "Inspiration",
            firstDescription:
                "‘Forbidden Fruit’ was born from the idea of temptation and self-expression through bold color palettes and shapes.",
            secondHeaderImage: "/uploads/product/back.png",
            secondHeading: "Process",
            secondDescription:
                "Each piece is hand-dyed and cut with precision, merging contemporary silhouettes with Indonesian craftsmanship.",
            thirdHeading: "Philosophy",
            thirdDescription:
                "At FYI, fashion is not just what you wear—it’s a story of courage, confidence, and creativity.",
        },
        {
            event: "Editorial",
            title: "White Canvas: The Art of Minimal Fashion",
            description:
                "Why less is more—exploring FYI Couture’s timeless minimalist philosophy.",
            slug: slugify("White Canvas: The Art of Minimal Fashion", {
                lower: true,
                strict: true,
            }),
            heroImage: "/collection/dummy-collection-hero.jpg",
            firstHeaderImage: "/uploads/product/front.png",
            firstHeading: "Simplicity Speaks",
            firstDescription:
                "White Canvas embodies purity and openness—each design is a statement of effortless style.",
            secondHeaderImage: "/uploads/product/back.png",
            secondHeading: "Craft",
            secondDescription:
                "Our artisans create silhouettes that allow fabric, form, and texture to breathe in harmony.",
            thirdHeading: "Balance",
            thirdDescription:
                "This collection is a reminder that confidence often comes from subtlety.",
        },
    ];

    for (const blog of blogs) {
        await prisma.blog.upsert({
            where: { slug: blog.slug },
            update: {},
            create: blog,
        });
    }

    // ======================================================
    // 7️⃣ SETTINGS
    // ======================================================
    console.log("⚙️ Creating default settings...");
    await prisma.setting.upsert({
        where: { key: "announcement" },
        update: { value: "Free shipping all over Indonesia", isActive: true },
        create: {
            key: "announcement",
            value: "Free shipping all over Indonesia",
            isActive: true,
        },
    });

    console.log("✅ Seeding completed successfully!");
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
