import fs from "fs/promises";
import path from "path";
import prisma from "../src/prisma/client.js";

const DEFAULT_FIELDS = [
    { key: "bust", displayName: "Bust", position: 0 },
    { key: "waist", displayName: "Waist", position: 1 },
    { key: "length", displayName: "Length", position: 2 },
    { key: "sleeve", displayName: "Sleeve", position: 3 },
    { key: "height", displayName: "Hip", position: 4 },
];

function parseArgs() {
    const args = process.argv.slice(2);
    const fileArg = args.find((arg) => arg.startsWith("--file="));

    if (fileArg) {
        return fileArg.slice("--file=".length).trim();
    }

    if (args[0] && !args[0].startsWith("--")) {
        return args[0].trim();
    }

    return null;
}

function splitSqlList(input) {
    const parts = [];
    let current = "";
    let inString = false;

    for (let i = 0; i < input.length; i++) {
        const char = input[i];
        const next = input[i + 1];

        if (char === "'" && inString && next === "'") {
            current += "''";
            i++;
            continue;
        }

        if (char === "'") {
            inString = !inString;
            current += char;
            continue;
        }

        if (char === "," && !inString) {
            parts.push(current.trim());
            current = "";
            continue;
        }

        current += char;
    }

    if (current.trim().length > 0) {
        parts.push(current.trim());
    }

    return parts;
}

function parseSqlValue(rawValue) {
    const value = rawValue.trim();

    if (/^NULL$/i.test(value)) {
        return null;
    }

    if (value.startsWith("'") && value.endsWith("'")) {
        return value.slice(1, -1).replace(/''/g, "'");
    }

    return value;
}

function extractTupleBodies(valuesSql) {
    const tuples = [];
    let inString = false;
    let depth = 0;
    let buffer = "";

    for (let i = 0; i < valuesSql.length; i++) {
        const char = valuesSql[i];
        const next = valuesSql[i + 1];

        if (char === "'" && inString && next === "'") {
            if (depth > 0) buffer += "''";
            i++;
            continue;
        }

        if (char === "'") {
            inString = !inString;
            if (depth > 0) buffer += char;
            continue;
        }

        if (!inString && char === "(") {
            if (depth === 0) {
                buffer = "";
            } else {
                buffer += char;
            }
            depth++;
            continue;
        }

        if (!inString && char === ")") {
            depth--;
            if (depth === 0) {
                tuples.push(buffer);
                buffer = "";
            } else if (depth > 0) {
                buffer += char;
            }
            continue;
        }

        if (depth > 0) {
            buffer += char;
        }
    }

    return tuples;
}

function parseProductVariantRows(sqlText) {
    const insertRegex =
        /INSERT\s+INTO\s+`productvariant`\s*\(([^)]+)\)\s*VALUES\s*([\s\S]*?);/gi;

    const rows = [];
    let match = insertRegex.exec(sqlText);

    while (match) {
        const columns = splitSqlList(match[1]).map((column) =>
            column.replace(/`/g, "").trim(),
        );
        const tupleBodies = extractTupleBodies(match[2]);

        for (const tupleBody of tupleBodies) {
            const values = splitSqlList(tupleBody).map(parseSqlValue);
            const row = {};

            columns.forEach((column, index) => {
                row[column] = values[index] ?? null;
            });

            rows.push(row);
        }

        match = insertRegex.exec(sqlText);
    }

    return rows;
}

function normalizeValue(value) {
    if (typeof value !== "string") return null;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
}

async function importRows(rows) {
    const rowsByProduct = new Map();

    for (const row of rows) {
        const productId = row.productId;
        if (!productId) continue;

        if (!rowsByProduct.has(productId)) {
            rowsByProduct.set(productId, []);
        }

        rowsByProduct.get(productId).push(row);
    }

    let productCount = 0;
    let measurementValueCount = 0;
    let skippedMissingVariantCount = 0;

    for (const [productId, productRows] of rowsByProduct.entries()) {
        await prisma.$transaction(async (tx) => {
            const fieldMap = new Map();

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
                        unit: null,
                    },
                    create: {
                        productId,
                        name: field.key,
                        displayName: field.displayName,
                        position: field.position,
                        unit: null,
                    },
                });

                fieldMap.set(field.key, savedField.id);
            }

            for (const row of productRows) {
                if (!row.id) continue;

                const variant = await tx.productVariant.findUnique({
                    where: { id: row.id },
                    select: { id: true },
                });

                if (!variant) {
                    skippedMissingVariantCount += 1;
                    continue;
                }

                for (const field of DEFAULT_FIELDS) {
                    const value = normalizeValue(row[field.key]);
                    if (!value) continue;

                    await tx.productVariantMeasurement.upsert({
                        where: {
                            variantId_fieldId: {
                                variantId: row.id,
                                fieldId: fieldMap.get(field.key),
                            },
                        },
                        update: { value },
                        create: {
                            variantId: row.id,
                            fieldId: fieldMap.get(field.key),
                            value,
                        },
                    });

                    measurementValueCount += 1;
                }
            }
        });

        productCount += 1;
    }

    return {
        productCount,
        measurementValueCount,
        skippedMissingVariantCount,
    };
}

async function main() {
    const rawFilePath = parseArgs();

    if (!rawFilePath) {
        throw new Error(
            "Missing SQL file path. Use: node prisma/import-productvariant-sql-to-measurements.js --file=<path>",
        );
    }

    const absolutePath = path.resolve(rawFilePath);
    const sqlText = await fs.readFile(absolutePath, "utf8");
    const rows = parseProductVariantRows(sqlText);

    if (rows.length === 0) {
        throw new Error(
            "No INSERT INTO `productvariant` rows found in SQL file",
        );
    }

    const result = await importRows(rows);

    console.log(
        `Imported legacy rows from SQL: ${rows.length} variants, ${result.productCount} products, ${result.measurementValueCount} measurement upserts, ${result.skippedMissingVariantCount} missing variants skipped.`,
    );
}

main()
    .catch((error) => {
        console.error("Import from SQL failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
