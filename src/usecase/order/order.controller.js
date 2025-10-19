import * as OrderService from "./order.service.js";

export const createOrder = async (req, res) => {
    try {
        console.log("infoo");
        console.log(req.body);

        const order = await OrderService.createOrder(req.body);
        res.status(201).json({
            success: true,
            message: "Order created successfully",
            data: order,
        });
    } catch (err) {
        console.error("❌ Create Order Error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Failed to create order",
        });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const order = await OrderService.getOrderById(req.params.id);
        if (!order)
            return res.status(404).json({ success: false, message: "Order not found" });

        res.json({ success: true, data: order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getAllOrders = async (req, res) => {
    try {
        const { page, limit, search, status } = req.query;

        const result = await OrderService.getAllOrders({
            page: Number(page) || 1,
            limit: Number(limit) || 10,
            search: search || "",
            status: status || "",
        });

        res.json({
            success: true,
            message: "Orders fetched successfully",
            ...result,
        });
    } catch (err) {
        console.error("❌ GetAllOrders Error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Failed to get orders",
        });
    }
};
