import { jsPDF } from 'jspdf';
// Import autoTable type
import 'jspdf-autotable';

// Add the autoTable method to the jsPDF type
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

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

export function generateOrderReceipt(order: Order, profile: Profile) {
  try {
    const doc = new jsPDF();
    
    // Add logo or header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('E-com Store', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
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
    let startY = 80;
    if (order.address) {
      doc.text('Shipping Address:', 14, 80);
      doc.text(`${order.address}`, 14, 85);
      doc.text(`${order.city}, ${order.state} ${order.postal_code}`, 14, 90);
      doc.text(`${order.country}`, 14, 95);
      startY = 105;
    }
    
    // Add order items table
    const tableColumn = ['Item', 'Quantity', 'Price', 'Total'];
    const tableRows = order.order_items.map(item => [
      item.products.name,
      item.quantity.toString(),
      `$${item.price.toFixed(2)}`,
      `$${(item.price * item.quantity).toFixed(2)}`,
    ]);
    
    // Use the autoTable method
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: startY,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
    });
    
    // Add totals
    const finalY = doc.lastAutoTable.finalY + 10;
    
    doc.text(`Subtotal: $${(order.total * 0.9).toFixed(2)}`, 140, finalY);
    doc.text(`Tax (10%): $${(order.total * 0.1).toFixed(2)}`, 140, finalY + 5);
    doc.text(`Total: $${order.total.toFixed(2)}`, 140, finalY + 10);
    
    // Add footer
    doc.setFontSize(8);
    doc.text('Thank you for your purchase!', 105, finalY + 25, { align: 'center' });
    doc.text('For any questions, please contact support@ecom-store.com', 105, finalY + 30, { align: 'center' });
    
    // Save the PDF
    doc.save(`order-receipt-${order.id}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
