await prisma.setting.upsert({
    where: { key: "store_status" },
    update: {},
    create: { key: "store_status", value: "open" },
});
