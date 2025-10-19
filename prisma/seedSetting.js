import { PrismaClient } from "../src/generated/prisma/index.js";
const prisma = new PrismaClient();
async function main() {
    await prisma.setting.upsert({
        where: { key: 'announcement' },
        update: {
            value: 'Free shipping all over Indonesia',
            isActive: true,
        },
        create: {
            key: 'announcement',
            value: 'Free shipping all over Indonesia',
            isActive: true,
        },
    })

    console.log('✅ Announcement setting created/updated')
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
