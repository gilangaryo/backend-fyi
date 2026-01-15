export const getPaymentStatus = async (req, res) => {
    const { referenceId } = req.params;

    const payment = await prisma.payment.findUnique({
        where: { referenceId },
        include: {
            order: {
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    title: true,
                                    imageUrl: true,
                                    price: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
    }

    return res.json({
        provider: payment.provider,
        payment_status: payment.status,
        order_status: payment.order.status,
        order: payment.order,
    });
};
