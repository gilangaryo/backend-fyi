import {
    findAllCoupons,
    findCouponById,
    findCouponByCode,
    insertCoupon,
    updateCouponData,
    deleteCouponData,
} from './coupon.repository.js';

// get all
export async function getAllCoupons() {
    return findAllCoupons();
}

// get by id
export async function getCoupon(id) {
    const coupon = await findCouponById(id);
    if (!coupon) throw new Error('Coupon not found');
    return coupon;
}

// get by code (user apply)
export async function getCouponByCode(code) {
    const coupon = await findCouponByCode(code);
    if (!coupon) throw new Error('Coupon not found');

    const now = new Date();
    if (coupon.expiresAt < now) {
        throw new Error('Coupon expired');
    }

    return coupon;
}

// create
export async function createCoupon(data) {
    const { title, code, type, value, expiresAt } = data;

    if (!title || !code || !type || !value || !expiresAt) {
        throw new Error('All fields are required');
    }

    const existing = await findCouponByCode(code);
    if (existing) {
        throw new Error('Coupon code already exists');
    }

    return insertCoupon({
        title: title.trim(),
        code: code.trim().toUpperCase(),
        type,
        value,
        expiresAt: new Date(expiresAt),
    });
}

// update
export async function updateCoupon(id, data) {
    return updateCouponData(id, data);
}

// delete
export async function removeCoupon(id) {
    return deleteCouponData(id);
}
