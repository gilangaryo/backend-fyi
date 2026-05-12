import prisma from "../src/prisma/client.js";

const DEFAULT_FIELDS = [
    { key: "bust", displayName: "Bust", position: 0 },
    { key: "waist", displayName: "Waist", position: 1 },
    { key: "length", displayName: "Length", position: 2 },
    { key: "sleeve", displayName: "Sleeve", position: 3 },
    { key: "height", displayName: "Hip", position: 4 },
];

function getLegacyValue(variant, fieldKey) {
    const value = variant[fieldKey];
    if (typeof value !== "string") {
        return null;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
}

async function backfillProduct(productId) {
    await prisma.$transaction(async (tx) => {
        const product = await tx.product.findUnique({
            where: { id: productId },
            include: { variants: true },
        });

        if (!product) {
            return;
        }

        const fields = new Map();

        for (const field of DEFAULT_FIELDS) {
            const savedField = await tx.measurementField.upsert({
                where: {
                    productId_name: {
                        productId,
                        name: field.key,
                    },
                },
                update: {
                    displayName: field.displayName,
                    position: field.position,
                },
                create: {
                    productId,
                    name: field.key,
                    displayName: field.displayName,
                    position: field.position,
                },
            });

            fields.set(field.key, savedField.id);
        }

        for (const variant of product.variants) {
            for (const field of DEFAULT_FIELDS) {
                const value = getLegacyValue(variant, field.key);

                if (!value) {
                    continue;
                }

                await tx.productVariantMeasurement.upsert({
                    where: {
                        variantId_fieldId: {
                            variantId: variant.id,
                            fieldId: fields.get(field.key),
                        },
                    },
                    update: { value },
                    create: {
                        variantId: variant.id,
                        fieldId: fields.get(field.key),
                        value,
                    },
                });
            }
        }
    });
}

async function main() {
    const products = await prisma.product.findMany({
        select: { id: true },
    });

    for (const product of products) {
        await backfillProduct(product.id);
    }

    console.log(`Backfill complete for ${products.length} products.`);
}

main()
    .catch((error) => {
        console.error("Backfill failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
