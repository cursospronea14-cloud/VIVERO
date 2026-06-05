const printTicket = () => {
  const ticketWindow = window.open('', '_blank')
  if (!ticketWindow) return

  const calcularIVA = (precio: number, cantidad: number) => {
    return (precio * cantidad * 0.12)
  }

  const itemsConIVA = items.map(item => ({
    ...item,
    ivaItem: calcularIVA(item.price, item.quantity),
    subtotalConIVA: (item.price * item.quantity) + calcularIVA(item.price, item.quantity)
  }))

  const subtotalConIVA = itemsConIVA.reduce((sum, item) => sum + item.subtotalConIVA, 0)
  const ivaTotal = itemsConIVA.reduce((sum, item) => sum + item.ivaItem, 0)

  ticketWindow.document.write(`
    <html>
    <head>
      <title>Ticket de Venta - Desierto que Florece</title>
      <style>
        body { font-family: monospace; font-size: 12px; padding: 20px; width: 300px; margin: 0 auto; }
        .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
        .title { font-size: 16px; font-weight: bold; }
        .item { display: flex; justify-content: space-between; margin: 5px 0; }
        .total { border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; }
        .footer { text-align: center; margin-top: 20px; font-size: 10px; }
        .vuelto { font-weight: bold; margin-top: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">🌵 DESIERTO QUE FLORECE</div>
        <div>Plantas Ornamentales, Cactus y Suculentas</div>
        <div>"Dios hace florecer el desierto"</div>
        <div>Isaías 35:1</div>
      </div>
      <div>Fecha: ${new Date().toLocaleString()}</div>
      <div>Atendió: ${employeeName || 'Administrador'}</div>
      <div>--------------------------------</div>
      ${itemsConIVA.map(item => `
        <div class="item">
          <span>${item.name} x${item.quantity}</span>
          <span>Q${(item.price * item.quantity).toFixed(2)}</span>
        </div>
        <div class="item" style="font-size:10px; color:#666; margin-left:10px">
          <span>IVA 12%: Q${item.ivaItem.toFixed(2)}</span>
          <span>Subtotal: Q${item.subtotalConIVA.toFixed(2)}</span>
        </div>
      `).join('')}
      <div>--------------------------------</div>
      <div class="item"><span>Subtotal:</span><span>Q${subtotal.toFixed(2)}</span></div>
      <div class="item"><span>IVA (12%):</span><span>Q${ivaTotal.toFixed(2)}</span></div>
      <div class="total"><div class="item"><strong>TOTAL:</strong><strong>Q${total.toFixed(2)}</strong></div></div>
      ${selectedPaymentMethod === 'cash' && cashAmount > 0 ? `
        <div class="item"><span>Efectivo:</span><span>Q${cashAmount.toFixed(2)}</span></div>
        <div class="item vuelto"><span>VUELTO:</span><span>Q${change.toFixed(2)}</span></div>
      ` : selectedPaymentMethod === 'card' ? `
        <div class="item"><span>Tarjeta:</span><span>Q${total.toFixed(2)}</span></div>
      ` : selectedPaymentMethod === 'transfer' ? `
        <div class="item"><span>Transferencia:</span><span>Q${total.toFixed(2)}</span></div>
      ` : ''}
      <div>--------------------------------</div>
      <div class="footer">
        <p>¡Gracias por su compra!</p>
        <p>🌵 Síguenos en redes sociales 🌵</p>
      </div>
    </body>
    </html>
  `)
  ticketWindow.document.close()
  ticketWindow.print()
}
