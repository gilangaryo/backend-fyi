export function acceptOrderTrackingTemplate(order, tracking) {
    const format = (n) => Number(n).toLocaleString("en-US");

    const safeItems = Array.isArray(order.items) ? order.items : [];

    return `
  <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; color:#333;">
    <div style="background:#705A4F; color:#fff; padding:20px; text-align:center;">
      <h1 style="margin:0;">FYI Store</h1>
      <p style="margin:0; font-size:14px;">Your Order is Being Prepared</p>
    </div>

    <div style="padding:20px;">
      <h2>Hi ${order.user?.name || "Customer"},</h2>
      <p>Your order <strong>#${
          order.id
      }</strong> has been packed and is getting ready for shipment.</p>
      <p>Below are your tracking details:</p>

      <div style="background:#f9f9f9; padding:15px; border-radius:8px; margin-top:15px;">
        <p style="margin:6px 0;"><strong>Courier:</strong> ${
            tracking.courier || "N/A"
        }</p>
        <p style="margin:6px 0;"><strong>Tracking ID:</strong> ${
            tracking.trackingId || "-"
        }</p>
        <p style="margin:6px 0;"><strong>Waybill ID:</strong> ${
            tracking.waybillId || "-"
        }</p>

        ${
            tracking.trackingLink
                ? `
            <div style="margin-top:20px; text-align:center;">
              <a href="${tracking.trackingLink}"
                style="
                  background:#705A4F;
                  padding:12px 20px;
                  display:inline-block;
                  color:#fff;
                  text-decoration:none;
                  font-size:16px;
                  border-radius:6px;
                  font-weight:bold;
                ">
                Track Your Package →
              </a>
            </div>
        `
                : ""
        }

        ${
            tracking.estimatedDelivery
                ? `<p style="margin:10px 0; margin-top:18px;">
                     <strong>Estimated Delivery:</strong>
                     ${new Date(tracking.estimatedDelivery).toLocaleString(
                         "en-US"
                     )}
                   </p>`
                : ""
        }
      </div>

      <h3 style="margin-top:30px;">Order Summary</h3>
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="background:#f3f3f3;">
            <th align="left" style="padding:8px;">Product</th>
            <th align="right" style="padding:8px;">Qty</th>
            <th align="right" style="padding:8px;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${safeItems
              .map((item) => {
                  const productTitle = item.product?.title || "Unknown Product";
                  const sizeLabel =
                      item.variant?.size ??
                      item.variant?.label ??
                      item.size ??
                      "-";

                  return `
            <tr>
              <td style="padding:8px; border-bottom:1px solid #eee;">
                ${productTitle} - Size ${sizeLabel}
              </td>
              <td style="padding:8px; border-bottom:1px solid #eee;" align="right">
                ${item.quantity}
              </td>
              <td style="padding:8px; border-bottom:1px solid #eee;" align="right">
                Rp${format(item.priceAtPurchase)}
              </td>
            </tr>
          `;
              })
              .join("")}
        </tbody>
      </table>

      <p style="margin-top:20px; font-size:16px;">
        <strong>Total:</strong> Rp${format(order.total)}
      </p>

      <p style="margin-top:25px;">
        Thank you for shopping with us! Your package is on the way 💛
      </p>
      <p style="color:#888; font-size:12px;">FYI Store — Bali, Indonesia</p>
    </div>

    <div style="background:#705A4F; color:#fff; text-align:center; padding:10px;">
      <small>&copy; ${new Date().getFullYear()} FYI Store. All rights reserved.</small>
    </div>
  </div>
  `;
}
