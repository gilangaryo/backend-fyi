export function adminPaymentTemplate(order, payment) {
  const format = (n) => Number(n).toLocaleString('id-ID')

  return `
  <div style="font-family:Arial,sans-serif; max-width:600px; margin:auto; color:#333;">
    <h2>Payment Received</h2>
    <p>Payment from <strong>${order.user.email}</strong> has been received.</p>

    <ul>
      <li><strong>Order ID:</strong> ${order.id}</li>
      <li><strong>User:</strong> ${order.user.name || '-'}</li>
      <li><strong>Total:</strong> IDR ${format(order.total)}</li>
      <li><strong>Status:</strong> PAID</li>
    </ul>

    <h4>Items:</h4>
    <ul>
      ${order.items
      .map(
        (item) =>
          `<li>${item.product.title} (${item.quantity} × IDR ${format(item.priceAtPurchase)})</li>`
      )
      .join('')}
    </ul>

    <p style="margin-top:20px;">Check the order in the <strong>Admin Dashboard</strong>.</p>
  </div>
  `
}
