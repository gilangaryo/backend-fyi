import prisma from "../../prisma/client.js";

export const createOrder = async (data) => {
    return await prisma.order.create({ data });
};

export const createOrderItem = async (data) => {
    return await prisma.orderItem.create({ data });
};

export const createPayment = async (data) => {
    return await prisma.payment.create({ data });
};

export const findOrderById = async (id) => {
    return await prisma.order.findUnique({
        where: { id },
        include: {
            items: {
                include: { product: true, variant: true },
            },
            payments: true,
            user: {
                select: {
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            shippingAddress: true,
            discount: {
                select: {
                    id: true,
                    code: true,
                    type: true,
                    value: true,
                },
            },
            tracking: true,
        },
    });
};

export const updateOrder = async (id, data) => {
    return await prisma.order.update({
        where: { id },
        data,
    });
};

export const findAllOrdersPaginated = async (where, skip, limit) => {
    return await prisma.order.findMany({
        where,
        include: {
            user: true,
            items: { include: { product: true } },
            payments: { select: { status: true } },
            shippingAddress: true,
            tracking: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
    });
};

export const countOrders = async (where) => {
    return await prisma.order.count({ where });
};

export const updateAcceptOrder = async (id, data) => {
    return await prisma.order.update({
        where: { id },
        data,
    });
};
