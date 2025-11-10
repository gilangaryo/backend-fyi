import slugify from "slugify";
import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Start seeding PRODUCTS only...");

    // Ambil data referensi dari DB yang sudah ada
    const categories = await prisma.category.findMany();
    const collections = await prisma.collection.findMany();
    const kainList = await prisma.kain.findMany();

    const kainId = kainList.find((k) => k.name === "Shibori Cotton")?.id || kainList[0]?.id;
    const categoryIds = categories.map((c) => c.id);
    const collectionIds = collections.map((c) => c.id);

    // Template produk
    const baseProducts = [
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

    const descriptions = {
        "Animal Spirit": "Animal print isn’t just a look — it’s a statement.",
        "Couture Canvas": "A bold collection inspired by elegance and simplicity.",
    };

    const products = [];
    for (let i = 0; i < 15; i++) {
        for (const base of baseProducts) {
            products.push({
                ...base,
                title: `${base.title} #${i + 1}`,
            });
        }
    }

    console.log(`🧩 Creating ${products.length} products...`);

    for (const p of products) {
        const slug = slugify(p.title, { lower: true, strict: true });
        const cat = categories.find((c) => c.title === p.category);
        const col = collections.find((c) => c.title === p.collection);

        const product = await prisma.product.upsert({
            where: { slug },
            update: {},
            create: {
                title: p.title,
                slug,
                price: 1000000,
                description: descriptions[p.collection],
                stock: 20,
                imageUrl: `/uploads/product/${p.images.find((i) => i.includes("front"))}`,
                categoryId: cat?.id || categoryIds[0],
                collectionId: col?.id || collectionIds[0],
                kainId,
                details:
                    "Soft as air, close as a whisper. This fabric clings like a lover, weightless, breathable, and made to move with you.",
                delivery: "Free delivery",
            },
        });

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

        // Images
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

    console.log("✅ Done seeding 28 duplicated products!");
}

main()
    .catch((err) => {
        console.error("❌ Seeding failed:", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
