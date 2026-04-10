import {
    findAllCoupons,
    findCouponById,
    findCouponByCode,
} from "./coupon.repository.js";
import { discountService } from "../discount/discount.service.js";

// get all
export async function getAllCoupons() {
    return findAllCoupons();
}

// get by id
export async function getCoupon(id) {
    const coupon = await findCouponById(id);
    if (!coupon) throw new Error("Coupon not found");
    return coupon;
}

// get by code (user apply)
export async function getCouponByCode(code) {
    const coupon = await findCouponByCode(code);
    if (!coupon) throw new Error("Coupon not found");

    if (!coupon.status) throw new Error("Coupon inactive");
    if (coupon.expiresAt < new Date()) throw new Error("Coupon expired");

    return coupon;
}

// create
export async function createCoupon(data) {
    return discountService.createDiscount({
        kind: data.kind || "MINIMUM_PURCHASE_DISCOUNT",
        ...data,
    });
}

// update
export async function updateCoupon(id, data) {
    return discountService.updateDiscount(id, data);
}

// delete
export async function removeCoupon(id) {
    return discountService.deleteDiscount(id);
}
