/**
 * CSV Export utility for Admin Orders and Inventory Catalog.
 * Exports well-formatted CSVs matching industry standards (Amazon / Shopify).
 */

const escapeCsvField = (val) => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

/**
 * Download a CSV string with a specific filename
 */
export const downloadCsv = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export Orders array to CSV
 */
export const exportOrdersToCsv = (orders = [], filenamePrefix = 'orders') => {
  if (!orders || orders.length === 0) {
    throw new Error('No orders available to export.');
  }

  const headers = [
    'Order Number',
    'Order Date',
    'Order Status',
    'Payment Mode',
    'Payment Status',
    'Customer Name',
    'Customer Phone',
    'Delivery Street',
    'City',
    'State',
    'Pincode',
    'Items Count',
    'Items Summary',
    'Subtotal (INR)',
    'Delivery Charge (INR)',
    'Discount (INR)',
    'Total Amount (INR)',
    'Courier Partner',
    'AWB Tracking Number'
  ];

  const rows = orders.map((order) => {
    const orderNum = order.orderNumber || order._id?.slice(-6)?.toUpperCase() || 'N/A';
    const dateStr = order.createdAt ? new Date(order.createdAt).toISOString().replace('T', ' ').slice(0, 19) : '';
    const customerName = order.shippingAddress?.name || order.userId?.name || 'Customer';
    const customerPhone = order.shippingAddress?.phone || order.userId?.phone || '';
    const street = order.shippingAddress?.addressLine1 || order.shippingAddress?.street || '';
    const city = order.shippingAddress?.city || '';
    const state = order.shippingAddress?.state || '';
    const pin = order.shippingAddress?.pincode || '';
    const itemsCount = order.orderItems?.length || 0;
    const itemsSummary = (order.orderItems || [])
      .map(i => `${i.name || 'Item'} (x${i.quantity || 1})`)
      .join(' | ');

    return [
      escapeCsvField(orderNum),
      escapeCsvField(dateStr),
      escapeCsvField(order.orderStatus || 'Pending'),
      escapeCsvField(order.paymentMode || 'COD'),
      escapeCsvField(order.paymentStatus || 'Pending'),
      escapeCsvField(customerName),
      escapeCsvField(customerPhone),
      escapeCsvField(street),
      escapeCsvField(city),
      escapeCsvField(state),
      escapeCsvField(pin),
      escapeCsvField(itemsCount),
      escapeCsvField(itemsSummary),
      escapeCsvField(order.itemsPrice || 0),
      escapeCsvField(order.shippingPrice || 0),
      escapeCsvField(order.discountAmount || 0),
      escapeCsvField(order.totalAmount || 0),
      escapeCsvField(order.shipping?.courierName || ''),
      escapeCsvField(order.shipping?.awbNumber || '')
    ].join(',');
  });

  const csvString = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const dateTag = new Date().toISOString().slice(0, 10);
  downloadCsv(csvString, `${filenamePrefix}_${dateTag}.csv`);
};

/**
 * Export Products catalog array to CSV
 */
export const exportProductsToCsv = (products = [], filenamePrefix = 'products_inventory') => {
  if (!products || products.length === 0) {
    throw new Error('No products available to export.');
  }

  const headers = [
    'Product ID',
    'Product Name',
    'Category',
    'Price (INR)',
    'Original Price (INR)',
    'Current Stock',
    'Stock Status',
    'Selling Unit / Weight',
    'Has Package Variants',
    'Season',
    'Is Featured',
    'Is Trending'
  ];

  const rows = products.map((product) => {
    const categoryName = typeof product.categoryId === 'object' && product.categoryId !== null
      ? product.categoryId.name
      : (product.category || 'General');

    const stock = product.stock || 0;
    const stockStatus = stock <= 0 ? 'Out of Stock' : stock <= 10 ? 'Low Stock' : 'In Stock';
    const hasPackages = product.packages && product.packages.length > 0;

    return [
      escapeCsvField(product._id || ''),
      escapeCsvField(product.name || ''),
      escapeCsvField(categoryName),
      escapeCsvField(product.price || 0),
      escapeCsvField(product.originalPrice || ''),
      escapeCsvField(stock),
      escapeCsvField(stockStatus),
      escapeCsvField(product.weight || (hasPackages ? 'Multi-Pack' : '')),
      escapeCsvField(hasPackages ? 'Yes' : 'No'),
      escapeCsvField(product.season || 'All Season'),
      escapeCsvField(product.featured ? 'Yes' : 'No'),
      escapeCsvField(product.trending ? 'Yes' : 'No')
    ].join(',');
  });

  const csvString = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const dateTag = new Date().toISOString().slice(0, 10);
  downloadCsv(csvString, `${filenamePrefix}_${dateTag}.csv`);
};
