import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
  User, MapPin, Package, Lock, Mail, LogOut, Save, Loader2,
  CheckCircle2, AlertCircle, Clock, Plus, Edit2, Trash2, Star,
  Navigation, Check, X, Phone, ChevronRight, ArrowLeft,
  Home, Briefcase, Sprout, Compass, MessageSquare
} from 'lucide-react';
import { validatePassword, PASSWORD_RULE_TEXT } from '../utils/passwordPolicy';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import PasswordInput from '../components/ui/PasswordInput';
import Input from '../components/ui/Input';
import { fetchCurrentAddress } from '../utils/locationService';
import { lookupPincode, isValidPincodeFormat } from '../utils/pincodeService';
import OrderDetailDrawer from '../components/OrderDetailDrawer';

/**
 * Account settings: a persistent sidebar of account areas beside the active
 * panel. The sidebar is a real <nav> with buttons, so the whole thing is
 * keyboard navigable and the current panel is announced via aria-current.
 */
const SECTIONS = [
  { id: 'profile', label: 'My profile', Icon: User },
  { id: 'orders', label: 'My Orders', Icon: Package },
  { id: 'address', label: 'Delivery address', Icon: MapPin },
  { id: 'email', label: 'Change email', Icon: Mail },
  { id: 'password', label: 'Change password', Icon: Lock },
];

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const Panel = ({ title, description, children, onSubmit, busy, submitLabel = 'Save changes', noSubmitBtn }) => (
  <form onSubmit={onSubmit} className="rounded-[18px] border border-fv-border bg-white p-6">
    <h2 className="font-serif text-[22px] font-semibold text-fv-heading">{title}</h2>
    {description && <p className="mt-1 text-[14px] text-fv-muted">{description}</p>}
    <div className="mt-6 space-y-5">{children}</div>
    {!noSubmitBtn && (
      <button
        type="submit"
        disabled={busy}
        className="mt-6 inline-flex h-12 items-center gap-2 rounded-[50px] bg-fv-primary px-6 text-[15px]
                   font-semibold text-white hover:bg-fv-primary-dark disabled:opacity-60
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary
                   focus-visible:ring-offset-2"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
        {submitLabel}
      </button>
    )}
  </form>
);

/* ─── Real Customer Name Helpers (replaces Customer123 placeholder) ──── */
const isPlaceholderName = (name) => {
  if (!name || typeof name !== 'string') return true;
  const trimmed = name.trim();
  if (trimmed.length < 2) return true;
  return /^customer(\s*\d+)?$/i.test(trimmed);
};

const getRealName = (name) => {
  if (isPlaceholderName(name)) return '';
  return name.trim();
};

/* ─── Swiggy / Zomato Precision Address Management ─────────────────── */
const ADDRESS_TAGS = [
  { id: 'Home', label: 'Home', Icon: Home, color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
  { id: 'Work', label: 'Work', Icon: Briefcase, color: 'text-blue-700 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
  { id: 'Farm', label: 'Farm / Nursery', Icon: Sprout, color: 'text-lime-800 bg-lime-50 dark:bg-lime-950/40 border-lime-200 dark:border-lime-800' },
  { id: 'Other', label: 'Other', Icon: MapPin, color: 'text-slate-700 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
];

const EMPTY_ADDR = {
  name: '',
  phone: '',
  tag: 'Home',
  street: '',
  landmark: '',
  instructions: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  isDefault: false
};

const AddressModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-fv-heading dark:text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const AddressForm = ({ initial, onSave, onCancel, busy, title = 'Add New Address' }) => {
  const [form, setForm] = useState(() => ({
    ...EMPTY_ADDR,
    ...(initial || {}),
    name: getRealName(initial?.name) || '',
    tag: initial?.tag || 'Home',
    landmark: initial?.landmark || '',
    instructions: initial?.instructions || '',
    isDefault: initial?.isDefault || false,
  }));
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState({ loading: false, valid: null, message: '' });

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handlePincodeChange = async (e) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 6);
    set('pincode', rawVal);

    if (rawVal.length === 6) {
      setPincodeStatus({ loading: true, valid: null, message: 'Verifying PIN code…' });
      try {
        const res = await lookupPincode(rawVal);
        if (res.valid) {
          setForm(f => ({
            ...f,
            pincode: rawVal,
            state: f.state || res.state || '',
            city: f.city || res.district || res.city || '',
          }));
          setPincodeStatus({
            loading: false,
            valid: true,
            message: res.message ? `Verified: ${res.message}` : 'Valid Indian PIN code',
          });
        } else {
          setPincodeStatus({
            loading: false,
            valid: false,
            message: res.message || 'Invalid PIN code',
          });
        }
      } catch {
        setPincodeStatus({ loading: false, valid: true, message: 'Valid format' });
      }
    } else {
      setPincodeStatus({ loading: false, valid: null, message: '' });
    }
  };

  const handleGPS = async () => {
    setGpsError('');
    setGpsLoading(true);
    try {
      const detected = await fetchCurrentAddress();
      setForm(f => ({
        ...f,
        street: detected.street || f.street,
        city: detected.city || f.city,
        state: detected.state || f.state,
        pincode: detected.pincode || f.pincode,
      }));

      if (detected.pincode && detected.pincode.length === 6) {
        lookupPincode(detected.pincode).then(res => {
          if (res.valid) {
            setPincodeStatus({ loading: false, valid: true, message: `Verified: ${res.message}` });
          }
        }).catch(() => {});
      }
    } catch (err) {
      setGpsError(err.message || 'Location access failed. Please enter address manually.');
    } finally {
      setGpsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name?.trim() || isPlaceholderName(form.name) || form.name.trim().length < 2) {
      setGpsError('Please enter your actual Full Name (e.g. Rahul Sharma).');
      return;
    }
    if (!isValidPincodeFormat(form.pincode)) {
      setGpsError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }
    if (pincodeStatus.valid === false) {
      setGpsError(pincodeStatus.message || 'Invalid PIN code.');
      return;
    }
    onSave(form);
  };

  const inputCls = 'w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl ' +
    'bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm ' +
    'focus:ring-2 focus:ring-fv-primary focus:border-transparent transition-all';
  const labelCls = 'block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Swiggy Address Tag Selector */}
      <div>
        <label className={labelCls}>Save Address As *</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ADDRESS_TAGS.map(({ id, label, Icon }) => {
            const isSelected = (form.tag || 'Home') === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => set('tag', id)}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-fv-primary text-white border-fv-primary shadow-xs ring-2 ring-fv-primary/25'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-fv-primary/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* GPS Button */}
      <button
        type="button"
        onClick={handleGPS}
        disabled={gpsLoading}
        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl
                   border-2 border-dashed border-fv-primary/40 hover:border-fv-primary
                   text-fv-primary text-xs font-bold hover:bg-fv-cream dark:hover:bg-gray-700/50
                   transition-all disabled:opacity-60 cursor-pointer"
      >
        {gpsLoading
          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Detecting GPS location…</>
          : <><Navigation className="w-3.5 h-3.5" /> Use Current GPS Location</>}
      </button>

      {gpsError && (
        <p className="text-xs text-amber-800 bg-amber-50 dark:bg-amber-950/40 rounded-xl p-2.5 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-600" />{gpsError}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Receiver Full Name *</label>
          <input
            type="text"
            required
            value={getRealName(form.name)}
            onChange={e => set('name', e.target.value)}
            className={inputCls}
            placeholder="e.g. Rahul Sharma"
          />
        </div>
        <div>
          <label className={labelCls}>Contact Phone *</label>
          <input
            type="tel"
            required
            value={form.phone || ''}
            onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
            className={inputCls}
            placeholder="10-digit mobile"
            maxLength={10}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>House No., Flat, Street, Area *</label>
        <input
          type="text"
          required
          value={form.street || ''}
          onChange={e => set('street', e.target.value)}
          className={inputCls}
          placeholder="e.g. Flat 402, Green Valley Apartments, MG Road"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Nearby Landmark</label>
          <div className="relative">
            <Compass className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={form.landmark || ''}
              onChange={e => set('landmark', e.target.value)}
              className={`${inputCls} pl-8`}
              placeholder="e.g. Opp. City Mall or Near Water Tank"
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Delivery Instructions / Gate Code</label>
          <div className="relative">
            <MessageSquare className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={form.instructions || ''}
              onChange={e => set('instructions', e.target.value)}
              className={`${inputCls} pl-8`}
              placeholder="e.g. Leave with guard / Ring bell twice"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>PIN Code *</label>
          <input
            type="text"
            required
            value={form.pincode || ''}
            maxLength={6}
            placeholder="6-digit PIN"
            onChange={handlePincodeChange}
            className={`${inputCls} ${
              pincodeStatus.valid === false ? 'border-red-500' : pincodeStatus.valid === true ? 'border-green-500' : ''
            }`}
          />
          {pincodeStatus.message && (
            <p className={`text-[11px] mt-1 ${pincodeStatus.valid === true ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
              {pincodeStatus.message}
            </p>
          )}
        </div>
        <div>
          <label className={labelCls}>City / District *</label>
          <input type="text" required value={form.city || ''} onChange={e => set('city', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>State *</label>
          <input type="text" required value={form.state || ''} onChange={e => set('state', e.target.value)} className={inputCls} />
        </div>
      </div>

      {/* Set as Default toggle */}
      <label className="flex items-center gap-2 cursor-pointer pt-1 select-none">
        <input
          type="checkbox"
          checked={!!form.isDefault}
          onChange={e => set('isDefault', e.target.checked)}
          className="w-4 h-4 rounded text-fv-primary focus:ring-fv-primary border-gray-300 dark:border-gray-600"
        />
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          Make this my primary / default delivery address
        </span>
      </label>

      <div className="flex gap-2.5 pt-2">
        <button
          type="submit"
          disabled={busy}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-fv-primary text-white rounded-xl
                     text-xs sm:text-sm font-bold hover:bg-fv-primary-dark disabled:opacity-60 transition-colors shadow-xs"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save Address
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl
                       text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

/* ─── Delivery Address Panel (Swiggy / Zomato Benchmark) ────────────────── */
const AddressPanel = () => {
  const { user, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const addresses = user?.addresses || [];

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  const handleAdd = async (form) => {
    setBusy(true);
    const res = await addAddress(form);
    if (res.success) {
      setModalOpen(false);
      flash('success', 'New delivery address saved successfully!');
    } else {
      flash('error', res.message);
    }
    setBusy(false);
  };

  const handleEdit = async (form) => {
    if (!editingAddress?._id) return;
    setBusy(true);
    const res = await updateAddress(editingAddress._id, form);
    if (res.success) {
      setEditingAddress(null);
      flash('success', 'Address updated successfully!');
    } else {
      flash('error', res.message);
    }
    setBusy(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this delivery address?')) return;
    setBusy(true);
    const res = await deleteAddress(id);
    if (res.success) {
      flash('success', 'Address removed.');
    } else {
      flash('error', res.message);
    }
    setBusy(false);
  };

  const handleSetDefault = async (id) => {
    setBusy(true);
    const res = await setDefaultAddress(id);
    if (res.success) {
      flash('success', 'Default address updated.');
    } else {
      flash('error', res.message);
    }
    setBusy(false);
  };

  return (
    <div className="rounded-[18px] border border-fv-border bg-white dark:bg-gray-800 p-6 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-serif text-[22px] font-semibold text-fv-heading dark:text-white">
            Saved Delivery Addresses
          </h2>
          <p className="mt-1 text-[13px] text-fv-muted">
            Manage your Home, Work, and Farm delivery locations with delivery instructions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditingAddress(null); setModalOpen(true); }}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-fv-primary text-white
                     rounded-xl text-xs sm:text-sm font-bold hover:bg-fv-primary-dark transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" /> Add New Address
        </button>
      </div>

      {msg.text && (
        <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-xs sm:text-sm mb-5 ${
          msg.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          {msg.type === 'success'
            ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            : <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Address Card Grid */}
      {addresses.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <MapPin className="w-12 h-12 mx-auto mb-3 text-fv-primary/40" />
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">No saved addresses yet</h3>
          <p className="text-xs text-fv-muted mt-1 max-w-sm mx-auto">
            Save your home, office, or farm addresses for swift 1-click checkout and specialized delivery notes.
          </p>
          <button
            type="button"
            onClick={() => { setEditingAddress(null); setModalOpen(true); }}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-fv-primary text-white rounded-xl text-xs font-bold hover:bg-fv-primary-dark"
          >
            <Plus className="w-3.5 h-3.5" /> Add First Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map(addr => {
            const TagInfo = ADDRESS_TAGS.find(t => t.id === addr.tag) || ADDRESS_TAGS[0];
            const TagIcon = TagInfo.Icon;
            return (
              <div
                key={addr._id}
                className={`relative rounded-2xl border-2 p-5 transition-all flex flex-col justify-between ${
                  addr.isDefault
                    ? 'border-fv-primary bg-emerald-50/25 dark:bg-emerald-950/20 shadow-xs ring-1 ring-fv-primary/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                }`}
              >
                <div>
                  {/* Top Bar: Tag pill + Default Badge + Actions */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${TagInfo.color}`}>
                        <TagIcon className="w-3.5 h-3.5" />
                        {addr.tag || 'Home'}
                      </span>
                      {addr.isDefault && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Default
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setEditingAddress(addr)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-fv-primary hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Edit Address"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDelete(addr._id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete Address"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Recipient Details */}
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                    {addr.name || user?.name}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                    {addr.street}, {addr.city}, {addr.state} — <span className="font-bold text-gray-900 dark:text-white">{addr.pincode}</span>
                  </p>

                  {/* Landmark note if available */}
                  {addr.landmark && (
                    <div className="mt-2.5 text-xs text-gray-600 dark:text-gray-300 flex items-start gap-1.5 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                      <Compass className="w-3.5 h-3.5 text-fv-primary shrink-0 mt-0.5" />
                      <span><strong className="text-gray-900 dark:text-white">Landmark:</strong> {addr.landmark}</span>
                    </div>
                  )}

                  {/* Delivery instructions note if available */}
                  {addr.instructions && (
                    <div className="mt-2 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-1.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 p-2 rounded-lg">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span><strong className="text-amber-900 dark:text-amber-200">Delivery Notes:</strong> {addr.instructions}</span>
                    </div>
                  )}

                  {/* Phone */}
                  {addr.phone && (
                    <p className="mt-2.5 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span>+91 {addr.phone}</span>
                    </p>
                  )}
                </div>

                {/* 1-Click Set as Default action */}
                {!addr.isDefault && (
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleSetDefault(addr._id)}
                      className="text-xs font-semibold text-fv-primary hover:text-fv-primary-dark hover:underline flex items-center gap-1"
                    >
                      Set as primary default →
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Address Modal Drawer */}
      <AddressModal
        isOpen={modalOpen || !!editingAddress}
        onClose={() => { setModalOpen(false); setEditingAddress(null); }}
        title={editingAddress ? 'Edit Delivery Address' : 'Add New Delivery Address'}
      >
        <AddressForm
          initial={editingAddress || { name: getRealName(user?.name), phone: user?.phone || '', tag: 'Home' }}
          onSave={editingAddress ? handleEdit : handleAdd}
          onCancel={() => { setModalOpen(false); setEditingAddress(null); }}
          busy={busy}
          title=""
        />
      </AddressModal>
    </div>
  );
};

/* ─── Orders Panel for Account Settings ────────────────────────────────── */
const OrdersPanel = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get('/orders/myorders', { params: { page: 1, limit: 10 } });
        if (alive) {
          setOrders(res.data?.data || []);
        }
      } catch (err) {
        if (alive) {
          console.error('Failed to load orders in Settings:', err);
          setError('Failed to load your orders. Please try refreshing.');
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const getStatusBadge = (status) => {
    const map = {
      Pending: 'bg-amber-50 text-amber-800 border-amber-200',
      Confirmed: 'bg-blue-50 text-blue-800 border-blue-200',
      Packed: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      Shipped: 'bg-purple-50 text-purple-800 border-purple-200',
      Delivered: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      Cancelled: 'bg-rose-50 text-rose-800 border-rose-200',
      CancellationRequested: 'bg-orange-50 text-orange-800 border-orange-200',
    };
    return map[status] || 'bg-gray-50 text-gray-800 border-gray-200';
  };

  return (
    <div className="rounded-[18px] border border-fv-border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-fv-border">
        <div>
          <h2 className="font-serif text-[22px] font-semibold text-fv-heading">My Orders</h2>
          <p className="mt-0.5 text-[13px] text-fv-muted">
            Track and review your recent garden orders and shipments.
          </p>
        </div>
        <Link
          to="/orders"
          className="text-xs font-semibold text-fv-primary hover:underline hidden sm:inline-flex items-center gap-1"
        >
          View Full History →
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-fv-primary mb-2" />
          <p className="text-xs text-fv-muted">Loading your orders...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-sm text-rose-600 mb-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs font-semibold px-4 py-2 bg-fv-primary text-white rounded-lg hover:bg-fv-primary-dark transition-colors"
          >
            Retry
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-fv-muted">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30 text-fv-primary" />
          <p className="text-[15px] font-medium text-fv-heading mb-1">No orders yet</p>
          <p className="text-[13px] text-fv-muted mb-4">You haven't placed any orders with Fresh Veggies yet.</p>
          <Link
            to="/"
            className="inline-block px-5 py-2.5 bg-fv-primary hover:bg-fv-primary-dark text-white text-xs font-bold rounded-full transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order._id}
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelectedOrderId(order._id);
                setIsDrawerOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedOrderId(order._id);
                  setIsDrawerOpen(true);
                }
              }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-fv-border hover:border-fv-primary/40 hover:shadow-xs transition-all cursor-pointer bg-fv-page/30 hover:bg-white group"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-fv-cream text-fv-primary flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Package className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold text-fv-heading font-mono">
                      {order.orderNumber || `#${order._id.slice(-8).toUpperCase()}`}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${getStatusBadge(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                  <p className="text-xs text-fv-muted">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                    {' · '}
                    {order.orderItems?.length || 0} item{(order.orderItems?.length || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                <span className="text-base font-bold text-fv-primary">
                  ₹{order.totalAmount}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-fv-primary group-hover:translate-x-0.5 transition-transform">
                  View Details →
                </span>
              </div>
            </div>
          ))}

          <div className="pt-3 text-center sm:text-right border-t border-fv-border mt-4">
            <Link
              to="/orders"
              className="text-xs font-bold text-fv-primary hover:underline inline-flex items-center gap-1"
            >
              Go to Full Orders Page →
            </Link>
          </div>
        </div>
      )}

      {/* Slide-over Order Detail Drawer */}
      <OrderDetailDrawer
        orderId={selectedOrderId}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedOrderId(null);
        }}
        onOrderUpdated={(updated) => {
          setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
        }}
      />
    </div>
  );
};

/* ─── Main Settings page ─────────────────────────────────────────────── */
const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, updateProfile, changeEmail, changePassword } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'profile';
  const [active, setActive] = useState(initialTab);
  const [now, setNow] = useState(() => new Date());
  const [orderCount, setOrderCount] = useState(null);

  const handleTabChange = (tabId) => {
    setActive(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // The badge shows a real count from the orders API, or nothing at all —
  // never a placeholder zero that might be wrong.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get('/orders/myorders', { params: { limit: 1 } });
        if (alive) setOrderCount(res?.data?.total ?? (res?.data?.data || []).length);
      } catch { /* leave the badge off */ }
    })();
    return () => { alive = false; };
  }, []);

  const [profileData, setProfileData] = useState({
    name: getRealName(user?.name),
    phone: user?.phone || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      pincode: user?.address?.pincode || '',
    },
  });

  /* Sync profile form when async auth completes */
  useEffect(() => {
    if (!user) return;
    setProfileData(p => ({
      name: getRealName(p.name) || getRealName(user.name),
      phone: p.phone || user.phone || '',
      address: {
        street: p.address.street || user.address?.street || '',
        city: p.address.city || user.address?.city || '',
        state: p.address.state || user.address?.state || '',
        pincode: p.address.pincode || user.address?.pincode || '',
      },
    }));
  }, [user]);

  const [emailData, setEmailData] = useState({ newEmail: '', password: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState({ profile: false, email: false, password: false });
  const [message, setMessage] = useState({ type: '', text: '' });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };



  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!profileData.name?.trim() || isPlaceholderName(profileData.name) || profileData.name.trim().length < 2) {
      showMessage('error', 'Please enter your actual Full Name (e.g. Rahul Sharma).');
      return;
    }
    setLoading(l => ({ ...l, profile: true }));
    const result = await updateProfile(profileData);
    showMessage(result.success ? 'success' : 'error', result.success ? 'Profile updated.' : result.message);
    setLoading(l => ({ ...l, profile: false }));
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setLoading(l => ({ ...l, email: true }));
    const result = await changeEmail(emailData.newEmail, emailData.password);
    if (result.success) setEmailData({ newEmail: '', password: '' });
    showMessage(result.success ? 'success' : 'error', result.message);
    setLoading(l => ({ ...l, email: false }));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const next = {};
    const check = validatePassword(passwordData.newPassword);
    if (!check.valid) next.newPassword = check.message;
    if (passwordData.newPassword !== passwordData.confirmPassword) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(l => ({ ...l, password: true }));
    const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
    if (result.success) setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    showMessage(result.success ? 'success' : 'error', result.message);
    setLoading(l => ({ ...l, password: false }));
  };

  return (
    <div className="bg-fv-page">
      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-10">
        {/* Breadcrumbs & Back Navigation */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-xs text-fv-muted">
              <li>
                <Link to="/" className="hover:text-fv-primary hover:underline font-medium">
                  Shop
                </Link>
              </li>
              <li aria-hidden="true"><ChevronRight className="h-3 w-3" /></li>
              <li aria-current="page" className="font-semibold text-fv-heading">
                Account Settings
              </li>
            </ol>
          </nav>
          <button
            type="button"
            onClick={() => {
              if (location.state?.from) {
                navigate(location.state.from);
              } else if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-fv-border bg-white dark:bg-gray-800 hover:bg-fv-surface text-xs font-semibold text-fv-heading transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-fv-primary" />
            <span>Back</span>
          </button>
        </div>

        <h1 className="text-center font-serif text-[30px] font-semibold text-fv-heading sm:text-[38px]">
          {greeting()}{getRealName(user?.name) ? `, ${getRealName(user.name).split(' ')[0]}` : ''}!
        </h1>

        {message.text && (
          <p
            role="alert"
            className={`mx-auto mt-6 flex max-w-xl items-center gap-2 rounded-[10px] px-4 py-3 text-[14px] ${
              message.type === 'success' ? 'bg-fv-cream text-fv-success' : 'bg-red-50 text-fv-danger'
            }`}
          >
            {message.type === 'success'
              ? <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              : <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />}
            {message.text}
          </p>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <nav aria-label="Account sections" className="h-fit rounded-[18px] bg-fv-primary p-4 text-white shadow-[0_18px_40px_rgba(10,76,54,0.18)]">
            <div className="flex items-center gap-3 rounded-[12px] bg-white/10 p-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-[18px] font-semibold">
                {(user?.name || '?').charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-semibold">{user?.name || 'Your account'}</span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-white/70">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  <time dateTime={now.toISOString()}>
                    {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </time>
                </span>
              </span>
            </div>

            <ul className="mt-3 space-y-1">
              {SECTIONS.map(({ id, label, Icon }) => {
                const displayLabel =
                  id === 'email'
                    ? (user?.email ? 'Change email' : 'Add email')
                    : id === 'password'
                    ? (user?.hasPassword ? 'Change password' : 'Set password')
                    : label;

                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => handleTabChange(id)}
                      aria-current={active === id ? 'true' : undefined}
                      className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-3 text-left text-[15px]
                                  transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2
                                  focus-visible:ring-fv-yellow motion-reduce:transition-none ${
                        active === id ? 'bg-white/15 font-semibold' : 'hover:bg-white/10'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {displayLabel}
                      {id === 'orders' && orderCount !== null && (
                        <span className="ml-auto rounded-[6px] bg-white/20 px-2 py-0.5 text-[12px] font-semibold">
                          {orderCount}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
              <li className="pt-2">
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-3 rounded-[10px] px-3 py-3 text-left text-[15px]
                             text-fv-yellow hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2
                             focus-visible:ring-fv-yellow"
                >
                  <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Log out
                </button>
              </li>
            </ul>
          </nav>

          {/* Active panel */}
          <div>
            {active === 'profile' && (
              <Panel title="My profile" description="Your name and contact number." onSubmit={handleProfileUpdate} busy={loading.profile}>
                <Input label="Full name" value={profileData.name} required
                       onChange={e => setProfileData(p => ({ ...p, name: e.target.value }))} />
                <Input label="Contact number" type="tel" inputMode="numeric" value={profileData.phone}
                       onChange={e => setProfileData(p => ({ ...p, phone: e.target.value }))} />
                <p className="text-[13px] text-fv-muted">
                  {user?.email
                    ? `Your email is ${user.email}. Change it from the "Change email" section.`
                    : 'No email address linked yet. Add one from the "Add email" section.'}
                </p>
              </Panel>
            )}

            {active === 'orders' && <OrdersPanel />}

            {active === 'address' && <AddressPanel />}

            {active === 'email' && (
              <Panel
                title={user?.email ? "Change email" : "Add email"}
                description={user?.email ? "Update your account email address." : "Link an email address to your account for invoices & updates."}
                onSubmit={handleEmailChange}
                busy={loading.email}
                submitLabel={user?.email ? "Update email" : "Save email"}
              >
                <Input label="New email address" type="email" required value={emailData.newEmail}
                       onChange={e => setEmailData(d => ({ ...d, newEmail: e.target.value }))} />
                {user?.hasPassword !== false ? (
                  <PasswordInput label="Current password" required value={emailData.password}
                                 onChange={e => setEmailData(d => ({ ...d, password: e.target.value }))} />
                ) : (
                  <p className="text-xs text-fv-muted">You signed in with phone OTP. No current password is required.</p>
                )}
              </Panel>
            )}

            {active === 'password' && (
              <Panel
                title={user?.hasPassword !== false ? "Change password" : "Set password"}
                description={user?.hasPassword !== false ? "Update your account password." : "Create a password for your account."}
                onSubmit={handlePasswordChange}
                busy={loading.password}
                submitLabel={user?.hasPassword !== false ? "Update password" : "Set password"}
              >
                {user?.hasPassword !== false && (
                  <PasswordInput label="Current password" required value={passwordData.currentPassword}
                                 onChange={e => setPasswordData(d => ({ ...d, currentPassword: e.target.value }))} />
                )}
                <div>
                  <PasswordInput label={user?.hasPassword !== false ? "New password" : "Password"} required showStrengthIndicator value={passwordData.newPassword}
                                 error={errors.newPassword}
                                 onChange={e => setPasswordData(d => ({ ...d, newPassword: e.target.value }))} />
                  {!errors.newPassword && <p className="mt-1.5 text-xs text-fv-muted">{PASSWORD_RULE_TEXT}</p>}
                </div>
                <PasswordInput label="Confirm password" required value={passwordData.confirmPassword}
                               error={errors.confirmPassword}
                               onChange={e => setPasswordData(d => ({ ...d, confirmPassword: e.target.value }))} />
              </Panel>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
