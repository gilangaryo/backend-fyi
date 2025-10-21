import { v4 as uuid } from "uuid";
import fetch from "node-fetch";
import * as OrderRepository from "./order.repository.js";
import prisma from "../../prisma/client.js";
import bcrypt from "bcryptjs";

export const createOrder = async (payload) => {
    const { email, name, phone, address, items, shipping } = payload;

    if (!email || !items?.length) {
        throw new Error("email dan items wajib diisi");
    }

    // Cari / buat user
    const user = await getOrCreateUserByEmail(email, name, phone);

    //  Ambil harga dari DB (hindari manipulasi dari client)
    const dbVariants = await prisma.productVariant.findMany({
        where: { id: { in: items.map((i) => i.variantId) } },
        include: {
            product: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    imageUrl: true,
                    price: true,
                },
            },
        },
    });




    if (dbVariants.length !== items.length) throw new Error("Beberapa produk tidak ditemukan");

    const basket = items.map((item) => {
        const variant = dbVariants.find((v) => v.id === item.variantId);
        if (!variant) throw new Error(`Variant ${item.variantId} tidak ditemukan`);

        if (variant.stock < item.quantity) {
            throw new Error(`${variant.product.title} (${variant.size}) stok tidak cukup`);
        }

        return {
            variantId: variant.id,
            size: variant.size,
            product: variant.product,
            quantity: item.quantity,
            subtotal: Number(variant.product.price) * item.quantity,
        };
    });



    const total = basket.reduce((s, b) => s + b.subtotal, 0);

    // Buat draft order ke Biteship (pengiriman)
    const biteshipPayload = {
        origin_contact_name: "FYI Store",
        origin_contact_phone: "082391231082",
        origin_address: "FYI Plaza Senayan, Jalan Asia Afrika...",
        origin_note: "Dekat pintu masuk FYI",
        origin_postal_code: 12440,
        destination_contact_name: name,
        destination_contact_phone: phone,
        destination_contact_email: email,
        destination_address: address.address,
        destination_postal_code: address.postalCode,
        destination_note: "Auto from system",
        courier_company: shipping?.courier_company || "sicepat",
        courier_type: shipping?.courier_type || "reg",
        delivery_type: shipping?.delivery_type || "now",
        order_note: shipping?.order_note || "",
        items: basket.map((b) => ({
            name: b.product.title,
            description: b.product.title,
            category: "fashion",
            value: Number(b.product.price),
            quantity: b.quantity,
            height: 10,
            length: 10,
            width: 10,
            weight: 200,
        })),
    };

    const shipRes = await fetch("https://api.biteship.com/v1/draft_orders", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.BITESHIP_API_KEY}`,
        },
        body: JSON.stringify(biteshipPayload),
    });

    const shipData = await shipRes.json();
    if (!shipRes.ok) throw new Error(shipData.message || "Gagal buat draft pengiriman");

    const shippingCost = Number(shipData.price || 0);
    const subTotal = total + shippingCost;

    //  Buat order di DB
    const order = await OrderRepository.createOrder({
        userId: user.id,
        subTotal: subTotal,
        shippingCost,
        total: total,
        status: "DRAFT",
    });

    //  Simpan item
    await Promise.all(
        basket.map((b) =>
            OrderRepository.createOrderItem({
                orderId: order.id,
                productId: b.product.id,
                variantId: b.variantId,
                quantity: b.quantity,
                priceAtPurchase: Number(b.product.price),
            })
        )
    );

    //  Simpan alamat pengiriman
    if (address) {
        await prisma.shippingAddress.create({
            data: {
                userId: user.id,
                country: address.country,
                firstName: address.firstName || name || "Guest",
                lastName: address.lastName || "",
                address: address.address,
                city: address.city,
                province: address.province,
                postalCode: address.postalCode,
                phone,
            },
        });
    }

    // Buat payment link Xendit
    const paymentRef = `order_${order.id}`;

    const xenditItems = basket.map((b) => {
        const sizeLabel = b.size ? ` — Size ${b.size}` : "";
        return {
            type: "PHYSICAL_PRODUCT",
            reference_id: b.variantId || b.product.id,
            category: "fashion",
            name: `${b.product.title}${sizeLabel}`,
            net_unit_amount: Number(b.product.price),
            quantity: Number(b.quantity),
            image_url: b.product.imageUrl || undefined,
            description: `${b.product.title}${sizeLabel}`,
            metadata: {
                product_id: b.product.id,
                variant_id: b.variantId,
                size: b.size,
                order_id: order.id,
            },
        };
    });


    // Tambahkan ongkir ke invoice
    // if (shippingCost > 0) {
    //     xenditItems.push({
    //         type: "FEES",
    //         name: `${shipData.courier.company.toUpperCase()} Shipping`,
    //         net_unit_amount: shippingCost,
    //         quantity: 1,
    //         description: `Delivery via ${shipData.courier.company}`,
    //     });
    // }

    const paymentPayload = {
        reference_id: paymentRef,
        session_type: "PAY",
        mode: "PAYMENT_LINK",
        amount: Number(total),
        currency: "IDR",
        country: "ID",
        items: xenditItems,
        customer: {
            reference_id: uuid(),
            type: "INDIVIDUAL",
            email,
            mobile_number: phone,
            individual_detail: { given_names: name },
        },
        success_return_url: `${process.env.FRONTEND_URL}/success?order_id=${order.id}`,
        cancel_return_url: `${process.env.FRONTEND_URL}/cancel`,
    };

    const payRes = await fetch("https://api.xendit.co/sessions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Basic " + Buffer.from(process.env.XENDIT_SECRET_KEY + ":").toString("base64"),
        },
        body: JSON.stringify(paymentPayload),
    });

    const payData = await payRes.json();
    console.log(paymentRef);

    if (!payRes.ok) throw new Error(payData.message || "Failed to create Xendit session");

    //  Simpan Payment & update Order
    await OrderRepository.createPayment({
        userId: user.id,
        orderId: order.id,
        referenceId: paymentRef,
        paymentRequestId: payData.payment_session_id,
        paymentLinkUrl: payData.payment_link_url,
        amount: total,
        status: "PENDING",
        expiredAt: payData.expires_at,
    });


    const updatedOrder = await OrderRepository.updateOrder(order.id, {
        referenceId: paymentRef,
        xenditPaymentId: payData.payment_session_id,
        status: "DRAFT",
        courierCompany: shipData.courier.company,
        shippingCost: shippingCost,
        bytestepShipmentId: shipData.id,
    });

    return {
        order: updatedOrder,
        payment_link: payData.payment_link_url,
        shipping_draft: shipData,
    };
};

//  Helper
async function getOrCreateUserByEmail(email, name, phone) {
    let user = await prisma.user.findUnique({ where: { email } });
    const hashed = await bcrypt.hash("1234", 10);
    if (!user) {
        user = await prisma.user.create({
            data: {
                name: name || "Guest",
                email,
                password: hashed,
                role: "USER",
                phone: phone || "",
            },
        });
    }
    return user;
}



export const getAllOrders = async ({ page = 1, limit = 10, search = "", status = "" }) => {
    const skip = (page - 1) * limit;

    //  Build filter
    const where = {};

    if (status) where.status = status.toUpperCase();

    if (search) {
        where.OR = [
            { id: { contains: search, mode: "insensitive" } },
            { user: { name: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
        ];
    }

    //  Call repository
    const [orders, total] = await Promise.all([
        OrderRepository.findAllOrdersPaginated(where, skip, Number(limit)),
        OrderRepository.countOrders(where),
    ]);

    return {
        data: orders,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit),
        },
    };
};


export const getOrderById = async (id) => {
    const order = await OrderRepository.findOrderById(id);
    if (!order) throw new Error("Order not found");
    return order;
};

export const acceptOrder = async (id) => {
    const order = await OrderRepository.findOrderById(id);
    if (!order) {
        throw new Error("Order not found");
    }
    console.log(order);

    return await OrderRepository.updateOrder(order.id, { status: "PACKED" });
};