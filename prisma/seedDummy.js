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
            title: "Animal Spirit",
            description:
                "Animal Spirit is the wild and rebellious heart of Island Couture - a celebration of strength, instinct, and untamed beauty.Each piece merges the raw allure of animal prints with therefined artistry of Lombok woven heritage, ",
            subDescription:
                "creating an intriguing dialogue between tradition and wilderness. Brave yet graceful, this collection embodies freedom that lives within all of us.",
            quote: "Indonesian Ready Couture. We stage Indonesian creativity, craftmanship and elegance to the world.",
            heroImage: "/collection/dummy-collection-hero-1.png",
        },
        {
            title: "Couture Canvas",
            description:
                "The Couture Canvas Collection is the first FYI Couture’s signature, when the brand starts in 2025 It explores simplicity as a translation of elegance: clean lines, refined tailoring, and versatile silhouettes creating a timeless wardrobe designed for every occasion. Just like a blank canvas, each piece invites everyone to express your individuality with quiet confidence and effortless grace.",
            subDescription:
                "Just like a blank canvas, each piece invites everyone to express your individuality with quiet confidence and effortless grace",
            quote: "Indonesian Ready Couture. We stage Indonesian creativity, craftmanship and elegance to the world.",
            heroImage: "/collection/dummy-collection-hero-2.png",
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
    // 3.5️⃣ KAIN (FABRIC)
    // ======================================================
    console.log("🧵 Creating kain...");

    const kainList = [
        { name: "Shibori Cotton" },
        { name: "Kain Bali" },
        { name: "Sumba Fabric" },
        { name: "Lombok Tenun" },
    ];

    const kainRecords = {};

    for (const k of kainList) {
        const slug = slugify(k.name, { lower: true, strict: true });

        const record = await prisma.kain.upsert({
            where: { slug },
            update: {},
            create: {
                name: k.name,
                slug,
            },
        });

        kainRecords[k.name] = record.id;
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
        "Couture Canvas":
            "A bold collection inspired by the sweetness and mystery of temptation. Playful, vibrant, and daring.",
    };

    const products = [
        {
            title: "BOYFRIEND SHIRT – FORBIDDEN FRUIT PAMPLEMOUSSE SHIBORI",
            category: "Tops",
            collection: "Couture Canvas",
            images: [
                "boyfriend-shirt-forbidden-fruit-pamplemousse-shibori-front.jpg",
                "boyfriend-shirt-forbidden-fruit-pamplemousse-shibori-back.jpg",
            ],
        },
        {
            title: "RESORT OUTER – LONG OUTER – ANIMAL SPIRIT",
            category: "Outer",
            collection: "Animal Spirit",
            images: [
                "resort-outer-long-outer-animal-spirit-front.jpg",
                "resort-outer-long-outer-animal-spirit-side.jpg",
            ],
        },
        {
            title: "REVERSIBLE MADAME – FORBIDDEN FRUIT KAIN BALI",
            category: "Outer",
            collection: "Couture Canvas",
            images: [
                "reversible-madame-forbidden-fruit-kain-bali-front.jpg",
                "reversible-madame-forbidden-fruit-kain-bali-back.png",
            ],
        },
        {
            title: "SUMBA SHIBORI COUTURE CANVAS – CAPUCHON DRESS",
            category: "Dresses",
            collection: "Animal Spirit",
            images: [
                "sumba-shibori-couture-canvas-capuchon-dress-front.jpg",
                "sumba-shibori-couture-canvas-capuchon-dress-back.jpg",
            ],
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
                imageUrl: `/uploads/product/${p.images.find((i) =>
                    i.includes("front")
                )}`,

                categoryId: categoryRecords[p.category],
                collectionId: collectionRecords[p.collection],
                kainId: kainRecords["Shibori Cotton"],

                details:
                    "Soft as air, close as a whisper. This fabric clings like a lover, weightless, breathable, and made to move with you.",
                delivery: "Free delivery",
            },
        });

        productRecords[p.title] = product.id;

        // Variants
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

        // Images (dinamis)
        const imageData = p.images.map((filename) => ({
            productId: product.id,
            imageUrl: `/uploads/product/${filename}`,
            isPrimary: filename.toLowerCase().includes("front"),
        }));

        await prisma.productImage.createMany({
            data: imageData,
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
            event: "FYI x Kendra Art Space ",
            title: "The Journey of Becoming",
            description:
                "Through collaborations with artists, performers, and visionaries, FYI celebrates individuality and creative expression. From editorial photo series and visual installations to intimate showcases and performing arts collaborations, we bring together diverse talents to shape experiences that inspire and move.",
            slug: slugify("FYI x Kendra Art Space The Journey of Becoming", {
                lower: true,
                strict: true,
            }),

            heroImage: "/uploads/blog/hero-image.jpg",

            // ✅ FIRST SECTION
            firstHeaderImage: "/uploads/blog/blog-1.png",
            firstHeading: "In summer 2025 instead of this summer",
            firstDescription:
                "FYI collaborates with Tanya Bourgeois Cayer, a dancer from Canada who now calls Bali her creative home. The collection is born from movement, rhythm, and the quiet confidence that comes from being one with your body and the island air.",

            // ✅ SECOND SECTION
            secondHeaderImage: "/uploads/blog/blog-2.png",
            secondHeading:
                "The collaboration celebrates the harmony between dance and design.",
            secondDescription:
                "Tanya’s graceful movement becomes the language that brings the pieces to life, while FYI translates that rhythm into fluid forms that flow naturally with every step and gesture.",

            // ✅ THIRD SECTION (BARU)
            thirdHeaderImage: "/uploads/blog/blog-1762413777311-622681306.jpg",
            thirdHeading:
                "Soft textures, sheer layers, and earthy tones define this summer story.",
            thirdDescription:
                "Each piece moves effortlessly with the wind, carrying the warmth of the sun and the softness of the sea.",
            thirdSubDescription:
                "It is fashion that breathes and follows your motion.",

            // ✅ DIVIDER + QUOTE
            imageDivider: "/uploads/blog/blog-1762413770029-808058037.jpg",
            quote: "Through Tanya’s artistry, every garment becomes more than clothing.  It becomes an expression of freedom, presence, and feminine grace. FYI captures this spirit through craftsmanship that celebrates natural beauty and authenticity.",

            // ✅ FOOTER IMAGES
            firstFooterImage: "/uploads/blog/blog-1762413773926-328733532.jpg",
            secondFooterImage: "/uploads/blog/blog-1762413775292-667414092.jpg",
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
