import React, { useState } from 'react';
import { Printer, X, Store, Phone, MapPin, Calendar, Truck, FileText, CheckSquare } from 'lucide-react';
import BarcodeSvg from '../../common/BarcodeSvg';

export const AdminInvoiceModal = ({ isOpen, onClose, order, settings }) => {
  const [docFormat, setDocFormat] = useState('invoice'); // 'invoice' | 'thermal'

  if (!isOpen || !order) return null;

  const storeName = settings?.store?.name || 'Fresh Veggies';
  const storePhone = settings?.store?.phone || '+91 98765 43210';
  const storeEmail = settings?.store?.email || 'support@freshveggies.com';
  const storeAddress = settings?.store?.address || 'Main Market, Wholesale Yard, City - 452001';

  const orderNum = order.orderNumber || order._id?.slice(-8)?.toUpperCase();
  const awbNumber = order.shipping?.awbNumber || order.dtdc?.consignmentNumber || `DTDC-${orderNum}`;
  const courierPartner = order.shipping?.courierName || order.dtdc?.courier || 'DTDC Express Courier';

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

  const isPrepaid = order.paymentMode === 'Online' || order.paymentStatus === 'Paid';

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
            padding: ${docFormat === 'thermal' ? '12px' : '20px'} !important;
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
        <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-fv-surface dark:bg-gray-700/60 border-b border-fv-border">
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Printer className="w-4 h-4 text-fv-primary" />
            <span className="text-sm font-bold text-fv-heading dark:text-white">
              {docFormat === 'thermal' ? '4x6 Thermal Packing Slip & Courier Label' : 'Tax Invoice & Dispatch Slip'}
            </span>
            <span className="text-xs text-fv-muted font-mono">#{orderNum}</span>
          </div>

          {/* Format Switcher */}
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-fv-border">
            <button
              type="button"
              onClick={() => setDocFormat('invoice')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                docFormat === 'invoice'
                  ? 'bg-white dark:bg-gray-700 text-fv-primary shadow-xs'
                  : 'text-fv-muted hover:text-fv-heading'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>A4 Invoice</span>
            </button>
            <button
              type="button"
              onClick={() => setDocFormat('thermal')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                docFormat === 'thermal'
                  ? 'bg-white dark:bg-gray-700 text-fv-primary shadow-xs'
                  : 'text-fv-muted hover:text-fv-heading'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Thermal Slip (4x6)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handlePrint}
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-fv-primary hover:bg-fv-primary-dark text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print {docFormat === 'thermal' ? 'Label' : 'Invoice'}</span>
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
          {docFormat === 'thermal' ? (
            /* ─────────────────────────────────────────────────────────────────
               4x6 Thermal Courier Packing Slip & Shipping Label (Shiprocket / DTDC Benchmark)
               ───────────────────────────────────────────────────────────────── */
            <div className="max-w-[420px] mx-auto border-2 border-black p-4 space-y-3 font-sans bg-white text-black">
              {/* Carrier Header & Service */}
              <div className="flex justify-between items-center border-b-2 border-black pb-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-black" />
                  <div>
                    <h2 className="text-base font-black tracking-tight leading-tight uppercase">
                      {courierPartner}
                    </h2>
                    <p className="text-[10px] font-bold tracking-wider uppercase text-gray-800">
                      Standard Express Surface & Air Delivery
                    </p>
                  </div>
                </div>
                <div className="border-2 border-black px-2.5 py-1 text-center bg-gray-100">
                  <span className="text-[9px] font-black uppercase block">Routing Code</span>
                  <span className="text-sm font-black tracking-wider font-mono">
                    {city?.slice(0, 3)?.toUpperCase() || 'IND'}-{pincode?.slice(-3) || '001'}
                  </span>
                </div>
              </div>

              {/* Barcode Strip */}
              <div className="py-2 border-b-2 border-black text-center flex flex-col items-center justify-center">
                <BarcodeSvg value={awbNumber} height={52} />
                <p className="text-[11px] font-bold font-mono tracking-wider mt-1 text-black">
                  AWB: {awbNumber}
                </p>
              </div>

              {/* Destination PIN & Consignee */}
              <div className="border-b-2 border-black pb-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-700">
                    SHIP TO / RECIPIENT
                  </span>
                  <span className="text-xs font-black bg-black text-white px-2 py-0.5 rounded-xs font-mono">
                    PIN: {pincode}
                  </span>
                </div>
                <p className="font-black text-sm uppercase mt-1 text-black">{customerName}</p>
                <p className="text-xs font-bold text-gray-900 mt-0.5">{customerPhone}</p>
                <p className="text-xs text-gray-800 mt-0.5 leading-snug">
                  {street}, {city}, {state} - <strong>{pincode}</strong>
                </p>
              </div>

              {/* Items Summary Checklist */}
              <div className="border-b-2 border-black pb-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase border-b border-black pb-1 mb-1">
                  <span>Ordered Items ({order.orderItems?.length || 0})</span>
                  <span>Qty / Size</span>
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {(order.orderItems || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-[11px] leading-tight">
                      <div className="flex items-center gap-1.5">
                        <CheckSquare className="w-3 h-3 text-black shrink-0" />
                        <span className="font-semibold text-black">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold shrink-0 text-black">
                        {item.quantity} {item.weight ? `(${item.weight})` : 'pcs'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Box */}
              <div className="grid grid-cols-2 gap-2 border-b-2 border-black pb-2">
                <div className="border border-black p-1.5 text-center">
                  <span className="text-[9px] font-bold uppercase block text-gray-700">Payment Type</span>
                  <span className="text-xs font-black uppercase text-black">
                    {order.paymentMode === 'COD' ? 'Cash on Delivery (COD)' : 'Prepaid Online'}
                  </span>
                </div>
                <div className={`border-2 border-black p-1.5 text-center ${isPrepaid ? 'bg-gray-100' : 'bg-yellow-100'}`}>
                  <span className="text-[9px] font-black uppercase block">
                    {isPrepaid ? 'Amount Collected' : 'Collect Cash on Delivery'}
                  </span>
                  <span className="text-sm font-black font-mono text-black">
                    ₹{order.totalAmount}
                  </span>
                </div>
              </div>

              {/* Shipper Details / Return Address */}
              <div className="pt-1 text-[9px] text-gray-700 leading-tight">
                <p className="font-bold text-black uppercase">If undelivered, please return to:</p>
                <p>{storeName} Fulfillment Center · {storeAddress}</p>
                <p>Support: {storePhone} · {storeEmail}</p>
              </div>
            </div>
          ) : (
            /* ─────────────────────────────────────────────────────────────────
               Standard A4 Tax Invoice & Dispatch Slip
               ───────────────────────────────────────────────────────────────── */
            <div>
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
                  <p className="text-[10px] text-gray-500">GSTIN: 23AABCF1234F1Z0 | FSSAI: 12345678901234</p>
                </div>

                <div className="text-right flex flex-col items-end">
                  <span className="inline-block px-2.5 py-1 bg-gray-900 text-white font-bold uppercase tracking-wider text-[11px] rounded-sm">
                    TAX INVOICE & DISPATCH SLIP
                  </span>
                  <p className="font-mono text-sm font-black text-gray-900 mt-2">
                    INV-{orderNum}
                  </p>
                  <p className="text-[11px] text-gray-600 flex items-center justify-end gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" /> {orderDate}
                  </p>
                  <div className="mt-2">
                    <BarcodeSvg value={orderNum} height={36} showText={false} />
                  </div>
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
                    LOGISTICS & FULFILLMENT
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
                  <p className="text-gray-800 text-[11px]">
                    Courier Partner: <strong>{courierPartner}</strong>
                  </p>
                  {awbNumber && (
                    <p className="text-gray-800 text-[11px] font-mono">
                      AWB / Tracking: <strong>{awbNumber}</strong>
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
                      <span>Item count & seed packet quality verified by picker</span>
                    </label>
                    <label className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 border border-gray-400 inline-block rounded-xs" />
                      <span>Tamper-evident DTDC courier pouch sealed</span>
                    </label>
                  </div>
                </div>

                <div className="text-right flex flex-col justify-end">
                  <div className="border-t border-gray-400 pt-1 inline-block w-40 ml-auto text-center">
                    <span>Authorized Warehouse Signatory</span>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="mt-6 pt-3 border-t border-gray-200 text-center text-[10px] text-gray-400">
                Thank you for shopping with {storeName}! For queries, please contact {storePhone} or {storeEmail}.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminInvoiceModal;
