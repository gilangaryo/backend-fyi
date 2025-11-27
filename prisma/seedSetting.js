import { PrismaClient } from "../src/generated/prisma/index.js";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
async function main() {
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
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
