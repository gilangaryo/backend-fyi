import {
    getAllCoupons,
    getCoupon,
    getCouponByCode,
    createCoupon,
    updateCoupon,
    removeCoupon,
} from './coupon.service.js';

// get all
export async function handleGetCoupons(req, res) {
    try {
        const coupons = await getAllCoupons();
        res.status(200).json({
            success: true,
            status: 200,
            message: 'Coupon list retrieved successfully',
            data: coupons,
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            status: 400,
            message: err.message,
            data: null,
        });
    }
}

// get by id
export async function handleGetCouponById(req, res) {
    try {
        const coupon = await getCoupon(req.params.id);
        res.status(200).json({
            success: true,
            status: 200,
            message: 'Coupon retrieved successfully',
            data: coupon,
        });
    } catch (err) {
        res.status(404).json({
            success: false,
            status: 404,
            message: err.message,
            data: null,
        });
    }
}

// apply by code
export async function handleGetCouponByCode(req, res) {
    try {
        const coupon = await getCouponByCode(req.params.code);
        res.status(200).json({
            success: true,
            status: 200,
            message: 'Coupon applied successfully',
            data: coupon,
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            status: 400,
            message: err.message,
            data: null,
        });
    }
}

// create
export async function handleCreateCoupon(req, res) {
    try {
        const created = await createCoupon(req.body);
        res.status(201).json({
            success: true,
            status: 201,
            message: 'Coupon created successfully',
            data: created,
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            status: 400,
            message: err.message,
            data: null,
        });
    }
}

// update
export async function handleUpdateCoupon(req, res) {
    try {
        const updated = await updateCoupon(req.params.id, req.body);
        res.status(200).json({
            success: true,
            status: 200,
            message: 'Coupon updated successfully',
            data: updated,
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            status: 400,
            message: err.message,
            data: null,
        });
    }
}

// delete
export async function handleDeleteCoupon(req, res) {
    try {
        await removeCoupon(req.params.id);
        res.status(200).json({
            success: true,
            status: 200,
            message: 'Coupon deleted successfully',
            data: null,
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            status: 400,
            message: err.message,
            data: null,
        });
    }
}
