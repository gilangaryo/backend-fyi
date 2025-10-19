export function paymentSuccessTemplate(order, payment) {
  const format = (n) => Number(n).toLocaleString('id-ID')
  console.log("email", order);
  return `
  <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; color:#333;">
    <div style="background:#000; color:#fff; padding:20px; text-align:center;">
      <h1 style="margin:0;">FYI Store</h1>
      <p style="margin:0; font-size:14px;">Payment Confirmation</p>
    </div>

    <div style="padding:20px;">
      <h2>Hi ${order.user.name || 'Customer'},</h2>
      <p>Terima kasih sudah berbelanja di <strong>FYI Store</strong>.</p>
      <p>Pembayaran kamu sebesar <strong>Rp${format(payment.amount)}</strong> 
      untuk pesanan <strong>#${order.id}</strong> telah kami terima.</p>

      <h3 style="margin-top:30px;">Rincian Pesanan</h3>
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr style="background:#f3f3f3;">
            <th align="left" style="padding:8px;">Produk</th>
            <th align="right" style="padding:8px;">Qty</th>
            <th align="right" style="padding:8px;">Harga</th>
          </tr>
        </thead>
        <tbody>
          ${order.items
      .map(
        (item) => `
            <tr>
              <td style="padding:8px; border-bottom:1px solid #eee;">${item.product.title} - Size ${item.variant.size}</td>
              <td style="padding:8px; border-bottom:1px solid #eee;" align="right">${item.quantity}</td>
              <td style="padding:8px; border-bottom:1px solid #eee;" align="right">Rp${format(
          item.priceAtPurchase
        )}</td>
            </tr>
          `
      )
      .join('')}
        </tbody>
      </table>

      <p style="margin-top:20px; font-size:16px;">
        <strong>Total:</strong> Rp${format(order.total)}
      </p>

      <p style="margin-top:20px;">Kami akan segera memproses pesananmu 🚚</p>
      <p style="color:#888; font-size:12px;">FYI Store — Bali, Indonesia</p>
    </div>

    <div style="background:#000; color:#fff; text-align:center; padding:10px;">
      <small>&copy; ${new Date().getFullYear()} FYI Store. All rights reserved.</small>
    </div>
  </div>
  `
}
