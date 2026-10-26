import React from 'react';
import { Printer, X, Store, Phone, MapPin, Calendar } from 'lucide-react';

export const AdminInvoiceModal = ({ isOpen, onClose, order, settings }) => {
  if (!isOpen || !order) return null;

  const storeName = settings?.store?.name || 'Fresh Veggies';
  const storePhone = settings?.store?.phone || '+91 98765 43210';
  const storeEmail = settings?.store?.email || 'support@freshveggies.com';
  const storeAddress = settings?.store?.address || 'Main Market, Wholesale Yard, City - 452001';

  const orderNum = order.orderNumber || order._id?.slice(-6)?.toUpperCase();
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const customerName = order.shippingAddress?.name || order.userId?.name || 'Valued Customer';
  const customerPhone = order.shippingAddress?.phone || order.userId?.phone || 'N/A';
  const street = order.shippingAddress?.addressLine1 || order.shippingAddress?.street || 'N/A';
  const city = order.shippingAddress?.city || '';
  const state = order.shippingAddress?.state || '';
  const pincode = order.shippingAddress?.pincode || '';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      {/* Print-specific style tags so only #printable-invoice prints cleanly */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible !important;
          }
          #printable-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl border border-fv-border overflow-hidden my-6">
        {/* Modal Top Control Bar (Hidden during print) */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 bg-fv-surface dark:bg-gray-700/60 border-b border-fv-border">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-fv-primary" />
            <span className="text-sm font-bold text-fv-heading dark:text-white">
              Tax Invoice & Dispatch Slip
            </span>
            <span className="text-xs text-fv-muted font-mono">#{orderNum}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-fv-primary hover:bg-fv-primary-dark text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-fv-muted hover:text-fv-heading rounded-lg hover:bg-fv-surface dark:hover:bg-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet */}
        <div id="printable-invoice" className="p-6 sm:p-8 bg-white text-gray-900 text-xs">
          {/* Header */}
          <div className="flex justify-between items-start pb-6 border-b-2 border-gray-900">
            <div>
              <div className="flex items-center gap-2">
                <Store className="w-6 h-6 text-emerald-700" />
                <h1 className="text-xl font-black tracking-tight text-gray-900 uppercase">
                  {storeName}
                </h1>
              </div>
              <p className="text-[11px] text-gray-600 mt-1">{storeAddress}</p>
              <p className="text-[11px] text-gray-600">Phone: {storePhone} · Email: {storeEmail}</p>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-1 bg-gray-900 text-white font-bold uppercase tracking-wider text-[11px] rounded-sm">
                TAX INVOICE & DISPATCH SLIP
              </span>
              <p className="font-mono text-sm font-black text-gray-900 mt-2">
                INV-{orderNum}
              </p>
              <p className="text-[11px] text-gray-600 flex items-center justify-end gap-1 mt-0.5">
                <Calendar className="w-3 h-3" /> {orderDate}
              </p>
            </div>
          </div>

          {/* Customer & Order Metadata Grid */}
          <div className="grid grid-cols-2 gap-6 py-5 border-b border-gray-300">
            <div>
              <h3 className="font-bold uppercase tracking-wider text-[10px] text-gray-500 mb-1.5">
                DISPATCH TO (CUSTOMER)
              </h3>
              <p className="font-bold text-sm text-gray-900">{customerName}</p>
              <p className="text-gray-700 text-[11px] mt-0.5 flex items-center gap-1">
                <Phone className="w-3 h-3 text-gray-400" /> {customerPhone}
              </p>
              <p className="text-gray-700 text-[11px] mt-0.5 flex items-start gap-1">
                <MapPin className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                <span>{street}, {city}, {state} - <strong>{pincode}</strong></span>
              </p>
            </div>

            <div className="text-right">
              <h3 className="font-bold uppercase tracking-wider text-[10px] text-gray-500 mb-1.5">
                PAYMENT & FULFILLMENT
              </h3>
              <p className="text-gray-800 text-[11px]">
                Payment Mode: <strong className="uppercase">{order.paymentMode || 'COD'}</strong>
              </p>
              <p className="text-gray-800 text-[11px]">
                Payment Status:{' '}
                <strong className={order.paymentStatus === 'Paid' ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                  {order.paymentStatus || 'Pending'}
                </strong>
              </p>
              <p className="text-gray-800 text-[11px]">
                Fulfillment Status: <strong className="font-bold">{order.orderStatus}</strong>
              </p>
              {order.shipping?.courierName && (
                <p className="text-gray-800 text-[11px]">
                  Courier: <strong>{order.shipping.courierName}</strong> (AWB: {order.shipping.awbNumber || 'Assigned'})
                </p>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mt-5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-900 text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                  <th className="py-2 w-10">#</th>
                  <th className="py-2">Item Description</th>
                  <th className="py-2 text-center w-20">Qty</th>
                  <th className="py-2 text-right w-24">Price (₹)</th>
                  <th className="py-2 text-right w-28">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(order.orderItems || []).map((item, index) => {
                  const qty = item.quantity || 1;
                  const price = item.price || 0;
                  const lineTotal = qty * price;
                  return (
                    <tr key={index} className="text-[11px]">
                      <td className="py-2.5 text-gray-500">{index + 1}</td>
                      <td className="py-2.5">
                        <span className="font-bold text-gray-900">{item.name}</span>
                        {item.weight && (
                          <span className="text-gray-500 text-[10px] block">Unit: {item.weight}</span>
                        )}
                      </td>
                      <td className="py-2.5 text-center font-semibold text-gray-900">{qty}</td>
                      <td className="py-2.5 text-right text-gray-700 font-mono">₹{price.toFixed(2)}</td>
                      <td className="py-2.5 text-right font-bold text-gray-900 font-mono">₹{lineTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Price Breakdown */}
          <div className="mt-5 pt-4 border-t-2 border-gray-900 flex justify-end">
            <div className="w-64 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal:</span>
                <span className="font-mono text-gray-900">₹{(order.itemsPrice || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charge:</span>
                <span className="font-mono text-gray-900">
                  {order.shippingPrice > 0 ? `₹${Number(order.shippingPrice).toFixed(2)}` : 'FREE'}
                </span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Coupon Discount:</span>
                  <span className="font-mono">-₹{Number(order.discountAmount).toFixed(2)}</span>
                </div>
              )}
              {order.codExtraCharge > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>COD Handling Fee:</span>
                  <span className="font-mono">+₹{Number(order.codExtraCharge).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-900">
                <span>Grand Total:</span>
                <span className="font-mono text-emerald-800">₹{(order.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Warehouse / Packing Verification Checklist */}
          <div className="mt-8 pt-5 border-t border-dashed border-gray-400 grid grid-cols-2 gap-4 text-[10px] text-gray-600">
            <div>
              <p className="font-bold uppercase tracking-wider text-gray-700 mb-1">
                Warehouse Fulfillment Quality Check
              </p>
              <div className="space-y-1">
                <label className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border border-gray-400 inline-block rounded-xs" />
                  <span>Item count & fresh quality verified by picker</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 border border-gray-400 inline-block rounded-xs" />
                  <span>Tamper-evident packaging sealed</span>
                </label>
              </div>
            </div>

            <div className="text-right flex flex-col justify-end">
              <div className="border-t border-gray-400 pt-1 inline-block w-40 ml-auto text-center">
                <span>Authorized Signatory / Picker</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6 pt-3 border-t border-gray-200 text-center text-[10px] text-gray-400">
            Thank you for shopping with {storeName}! For queries, please contact {storePhone} or {storeEmail}.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInvoiceModal;
