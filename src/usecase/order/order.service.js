import { v4 as uuid } from "uuid";
import fetch from "node-fetch";
import * as OrderRepository from "./order.repository.js";
import prisma from "../../prisma/client.js";
import bcrypt from "bcryptjs";
import getDefaultCourierType from "../../lib/courier.js";
import { sendEmail } from "../../lib/mailer.js";
import { acceptOrderTrackingTemplate } from "../../lib/templates/acceptOrder.js";
export const createOrder = async (payload) => {
    const {
        email,
        name,
        phone,
        address,
        items,
        shipping,
        giftNote,
        discountId,
    } = payload;

    if (!email || !items?.length) {
        throw new Error("email dan items wajib diisi");
    }

    // Cari / buat user
    const user = await getOrCreateUserByEmail(email, name, phone);

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

    if (dbVariants.length !== items.length)
        throw new Error("Beberapa produk tidak ditemukan");

    const basket = items.map((item) => {
        const variant = dbVariants.find((v) => v.id === item.variantId);
        if (!variant)
            throw new Error(`Variant ${item.variantId} tidak ditemukan`);

        if (variant.stock < item.quantity) {
            throw new Error(
                `${variant.product.title} (${variant.size}) stok habis`
            );
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

    let discount = null;
    let discountAmount = 0;

    if (discountId) {
        discount = await prisma.discount.findUnique({
            where: { id: discountId },
        });

        if (!discount) {
            throw new Error("Discount code not found");
        }

        if (new Date(discount.expiresAt) < new Date()) {
            throw new Error("Discount code has expired");
        }

        if (
            discount.minimumOrderAmount &&
            total < discount.minimumOrderAmount
        ) {
            throw new Error(
                `Minimum order amount is IDR ${Number(
                    discount.minimumOrderAmount
                ).toLocaleString("id-ID")}`
            );
        }

        if (discount.type === "PERCENT") {
            discountAmount = Math.floor((total * Number(discount.value)) / 100);
        } else if (discount.type === "VALUE") {
            discountAmount = Number(discount.value);
        }

        if (discountAmount > total) {
            discountAmount = total;
        }

        console.log("💰 Discount applied:", {
            code: discount.code,
            type: discount.type,
            value: discount.value,
            discountAmount,
        });
    }

    const grandTotal = total - discountAmount;

    const defaultCourierSetting = await prisma.setting.findUnique({
        where: { key: "default_courier" },
    });
    const defaultCourier = defaultCourierSetting.value;
    const courierType = getDefaultCourierType(defaultCourier);

    // const now = new Date()
    // const currentHour = now.getHours()
    // let deliveryDate = now
    // let deliveryTime = "16:00" // jam pengiriman tetap
    // if (currentHour >= 15) {
    //     // lewat dari jam 3 → kirim besok jam 4
    //     deliveryDate.setDate(deliveryDate.getDate() + 1)
    // }
    // const deliveryDateStr = deliveryDate.toISOString().split("T")[0]

    // Buat draft order ke Biteship (pengiriman)
    const biteshipPayload = {
        origin_contact_name: "FYI Store",
        origin_contact_phone: "082391231082",
        origin_address: "FYI Plaza Senayan, Jalan Asia Afrika...",
        origin_note: "Dekat pintu masuk FYI",
        origin_postal_code: 80351,
        destination_contact_name: name,
        destination_contact_phone: phone,
        destination_contact_email: email,
        destination_address: address.address,
        destination_postal_code: address.postalCode,
        destination_note: "Auto from system",
        courier_company: defaultCourier,
        courier_type: courierType,
        // delivery_type: "scheduled",
        // delivery_date: deliveryDateStr,
        // delivery_time: deliveryTime,
        delivery_type: "now",

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
    // console.log("shipdataaaaa ", shipData);
    if (!shipRes.ok)
        throw new Error(shipData.message || "Gagal buat draft pengiriman");

    const shippingCost = Number(shipData.price || 0);
    const subTotal = total + shippingCost;

    let shippingAddress = null;

    //  Simpan alamat pengiriman
    if (address) {
        shippingAddress = await prisma.shippingAddress.create({
            data: {
                id: uuid(),
                userId: user.id,
                firstName: address.firstName || name || "Guest",
                lastName: address.lastName || "",

                country: address.country,
                address: address.address,
                addressDetails: address.apartment || "",

                province: address.province,
                city: address.city,
                district: address.district,
                village: address.village,

                postalCode: address.postalCode,
                phone,
            },
        });
    }

    //  Buat order di DB
    const order = await OrderRepository.createOrder({
        userId: user.id,
        subTotal: subTotal,
        shippingCost,
        shippingAddressId: shippingAddress.id,
        giftNote: giftNote || null,
        discountId: discountId || null,
        total: grandTotal, // Total yang dibayar user (sudah include discount, shipping FREE)
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

    // INCREMENT DISCOUNT USAGE COUNT
    if (discountId) {
        await prisma.discount.update({
            where: { id: discountId },
            data: {
                usedCount: {
                    increment: 1,
                },
            },
        });
        console.log("✅ Discount usage count incremented");
    }

    // Buat payment link Xendit
    const paymentRef = `order_${order.id}`;

    // ✅ Items HANYA produk saja
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

    if (discountAmount > 0 && discount) {
        xenditItems.push({
            type: "FEE",
            reference_id: `discount_${discount.id}`,
            category: "fees",
            name: `Discount - ${discount.code}`,
            net_unit_amount: -discountAmount,
            quantity: 1,
            description: `${
                discount.type === "PERCENT"
                    ? `${discount.value}% OFF`
                    : `IDR ${Number(discount.value).toLocaleString(
                          "id-ID"
                      )} OFF`
            }`,
            metadata: {
                discount_id: discount.id,
                discount_code: discount.code,
                discount_type: discount.type,
            },
        });
    }

    const paymentPayload = {
        reference_id: paymentRef,
        session_type: "PAY",
        mode: "PAYMENT_LINK",
        amount: Number(grandTotal),
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
        metadata: {
            order_id: order.id,
            subtotal_before_discount: String(total),
            ...(discountAmount > 0 && {
                discount_code: discount.code,
                discount_amount: String(discountAmount),
                discount_id: discount.id,
                discount_type: discount.type,
                discount_value: String(discount.value),
            }),
            shipping_cost: String(shippingCost),
            shipping_note: "FREE SHIPPING",
            grand_total: String(grandTotal),
        },
    };

    const payRes = await fetch("https://api.xendit.co/sessions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization:
                "Basic " +
                Buffer.from(process.env.XENDIT_SECRET_KEY + ":").toString(
                    "base64"
                ),
        },
        body: JSON.stringify(paymentPayload),
    });

    const payData = await payRes.json();
    console.log(paymentRef);

    if (!payRes.ok)
        throw new Error(payData.message || "Failed to create Xendit session");

    //  Simpan Payment & update Order
    await OrderRepository.createPayment({
        userId: user.id,
        orderId: order.id,
        referenceId: paymentRef,
        paymentRequestId: payData.payment_session_id,
        paymentLinkUrl: payData.payment_link_url,
        amount: grandTotal, // Amount yang dibayar
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
        discount_applied:
            discountAmount > 0
                ? {
                      code: discount.code,
                      amount: discountAmount,
                  }
                : null,
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

export const getAllOrders = async ({
    page = 1,
    limit = 10,
    search = "",
    status = "",
}) => {
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

const confirmBiteshipOrder = async (draftOrderId) => {
    try {
        console.log("🚚 Confirming Biteship draft order:", draftOrderId);

        const confirmRes = await fetch(
            `https://api.biteship.com/v1/draft_orders/${draftOrderId}/confirm`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.BITESHIP_API_KEY}`,
                },
            }
        );

        const confirmData = await confirmRes.json();

        if (!confirmRes.ok) {
            console.error("❌ Biteship confirm error:", confirmData);
            throw new Error(
                confirmData.message ||
                    confirmData.error ||
                    "Failed to confirm Biteship order"
            );
        }

        return confirmData;
    } catch (error) {
        console.error("❌ Biteship confirm error:", error);
        throw error;
    }
};

export const acceptOrder = async (id) => {
    const order = await OrderRepository.findOrderById(id);
    if (!order) {
        throw new Error("Order not found");
    }

    if (order.status !== "NEW") {
        throw new Error(
            `Cannot accept order with status: ${order.status}. Order must be in NEW status.`
        );
    }

    if (!order.bytestepShipmentId) {
        throw new Error("No Biteship draft order ID found for this order");
    }

    let confirmedShipment;
    try {
        confirmedShipment = await confirmBiteshipOrder(
            order.bytestepShipmentId
        );
    } catch (biteshipError) {
        console.error("❌ Failed to confirm Biteship order:", biteshipError);
        throw new Error(`Failed to confirm shipping: ${biteshipError.message}`);
    }

    try {
        await prisma.shipmentTracking.create({
            data: {
                id: uuid(),
                orderId: order.id,
                courier: confirmedShipment.courier.company,
                trackingId: confirmedShipment.courier.tracking_id,
                waybillId: confirmedShipment.courier.waybill_id || null,
                trackingLink: confirmedShipment.courier.link || null,
                estimatedDelivery: confirmedShipment.delivery?.datetime
                    ? new Date(confirmedShipment.delivery.datetime)
                    : null,
            },
        });

        // console.log("✅ Tracking info saved:", {
        //     trackingId: confirmedShipment.courier.tracking_id,
        //     waybillId: confirmedShipment.courier.waybill_id,
        //     trackingLink: confirmedShipment.courier.link,
        // });
    } catch (dbError) {
        console.error("❌ Failed to save tracking info:", dbError);
    }

    const updatedOrder = await OrderRepository.updateAcceptOrder(order.id, {
        status: "PACKED",
    });

    await prisma.orderStatusLog.create({
        data: {
            id: uuid(),
            orderId: order.id,
            status: "PACKED",
        },
    });

    // console.log("✅ Order accepted and packed:", {
    //     orderId: order.id,
    //     status: "PACKED",
    //     trackingId: confirmedShipment.courier.tracking_id,
    // });

    // send email to user tracking info

    await sendEmail({
        to: order.user.email,
        subject: `Your Order Has Been Packed — Tracking Information`,
        html: acceptOrderTrackingTemplate(order, {
            trackingId: confirmedShipment.courier.tracking_id,
            waybillId: confirmedShipment.courier.waybill_id,
            trackingLink: confirmedShipment.courier.link,
            courier: confirmedShipment.courier.company,
            estimatedDelivery: confirmedShipment.delivery?.datetime || null,
        }),
    });

    return {
        ...updatedOrder,
        tracking: {
            trackingId: confirmedShipment.courier.tracking_id,
            waybillId: confirmedShipment.courier.waybill_id,
            trackingLink: confirmedShipment.courier.link,
            courier: confirmedShipment.courier.company,
        },
    };
};
