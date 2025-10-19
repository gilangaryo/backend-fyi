import prisma from '../../prisma/client.js';

// ambil semua coupon
export async function findAllCoupons() {
    return prisma.discount.findMany({
        orderBy: { expiresAt: 'asc' },
    });
}

// ambil coupon by id
export async function findCouponById(id) {
    return prisma.discount.findUnique({ where: { id } });
}

// ambil coupon by code
export async function findCouponByCode(code) {
    return prisma.discount.findUnique({ where: { code } });
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
    return prisma.discount.delete({ where: { id } });
}
