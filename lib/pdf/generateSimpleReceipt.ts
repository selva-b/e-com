import { jsPDF } from 'jspdf';

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  products: {
    name: string;
    image_url: string;
  };
}

interface Order {
  id: string;
  user_id: string;
  status: string;
  total: number;
  created_at: string;
  payment_id?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  order_items: OrderItem[];
}

interface Profile {
  first_name: string;
  last_name: string;
  email: string;
}

export function generateSimpleReceipt(order: Order, profile: Profile) {
  try {
    const doc = new jsPDF();
    
    // Add logo or header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('E-com Store', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.text('RECEIPT', 105, 30, { align: 'center' });
    
    // Add order information
    doc.setFontSize(10);
    doc.text(`Order ID: ${order.id}`, 14, 45);
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 14, 50);
    if (order.payment_id) {
      doc.text(`Payment ID: ${order.payment_id}`, 14, 55);
    }
    
    // Add customer information
    doc.text(`Customer: ${profile.first_name} ${profile.last_name}`, 14, 65);
    doc.text(`Email: ${profile.email}`, 14, 70);
    
    // Add shipping address if available
    let yPos = 80;
    if (order.address) {
      doc.text('Shipping Address:', 14, yPos);
      yPos += 5;
      doc.text(`${order.address}`, 14, yPos);
      yPos += 5;
      doc.text(`${order.city}, ${order.state} ${order.postal_code}`, 14, yPos);
      yPos += 5;
      doc.text(`${order.country}`, 14, yPos);
      yPos += 15;
    }
    
    // Add order items
    doc.setFontSize(12);
    doc.text('Order Items', 14, yPos);
    yPos += 10;
    
    // Draw header
    doc.setFillColor(240, 240, 240);
    doc.rect(14, yPos - 5, 180, 8, 'F');
    doc.text('Item', 16, yPos);
    doc.text('Qty', 120, yPos);
    doc.text('Price', 140, yPos);
    doc.text('Total', 170, yPos);
    yPos += 10;
    
    // Draw items
    order.order_items.forEach((item) => {
      doc.text(item.products.name.substring(0, 50), 16, yPos);
      doc.text(item.quantity.toString(), 120, yPos);
      doc.text(`$${item.price.toFixed(2)}`, 140, yPos);
      doc.text(`$${(item.price * item.quantity).toFixed(2)}`, 170, yPos);
      yPos += 8;
    });
    
    // Draw line
    yPos += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, yPos, 194, yPos);
    yPos += 10;
    
    // Add totals
    doc.text('Subtotal:', 140, yPos);
    doc.text(`$${(order.total * 0.9).toFixed(2)}`, 170, yPos);
    yPos += 5;
    
    doc.text('Tax (10%):', 140, yPos);
    doc.text(`$${(order.total * 0.1).toFixed(2)}`, 170, yPos);
    yPos += 5;
    
    doc.setFontSize(12);
    doc.text('Total:', 140, yPos);
    doc.text(`$${order.total.toFixed(2)}`, 170, yPos);
    
    // Add footer
    doc.setFontSize(8);
    doc.text('Thank you for your purchase!', 105, 270, { align: 'center' });
    doc.text('For any questions, please contact support@ecom-store.com', 105, 275, { align: 'center' });
    
    // Save the PDF
    doc.save(`order-receipt-${order.id}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
