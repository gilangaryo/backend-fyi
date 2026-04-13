import prisma from "../../prisma/client.js";

// ambil semua coupon
export async function findAllCoupons() {
    return prisma.discount.findMany({
        where: { deletedAt: null },
        orderBy: { expiresAt: "asc" },
    });
}

// ambil coupon by id
export async function findCouponById(id) {
    return prisma.discount.findFirst({ where: { id, deletedAt: null } });
}

// ambil coupon by code
export async function findCouponByCode(code) {
    return prisma.discount.findFirst({
        where: { code: code.toUpperCase(), deletedAt: null },
    });
}

// buat coupon baru
export async function insertCoupon(data) {
    return prisma.discount.create({ data });
}

// update coupon
export async function updateCouponData(id, data) {
    return prisma.discount.update({
        where: { id },
        data,
    });
}

// hapus coupon
export async function deleteCouponData(id) {
    return prisma.discount.update({
        where: { id },
        data: {
            deletedAt: new Date(),
            status: false,
        },
    });
}
