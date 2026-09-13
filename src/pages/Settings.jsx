import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User, MapPin, Package, Lock, Mail, LogOut, Save, Loader2,
  CheckCircle2, AlertCircle, Clock, Plus, Edit2, Trash2, Star,
  Navigation, Check, X,
} from 'lucide-react';
import { validatePassword, PASSWORD_RULE_TEXT } from '../utils/passwordPolicy';
import { useAuth } from '../context/AuthContext';
import { cachedGet } from '../utils/api';
import PasswordInput from '../components/ui/PasswordInput';
import Input from '../components/ui/Input';
import { fetchCurrentAddress } from '../utils/locationService';

/**
 * Account settings: a persistent sidebar of account areas beside the active
 * panel. The sidebar is a real <nav> with buttons, so the whole thing is
 * keyboard navigable and the current panel is announced via aria-current.
 */
const SECTIONS = [
  { id: 'profile', label: 'My profile', Icon: User },
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

/* ─── Small address form ──────────────────────────────────────────────── */
const EMPTY_ADDR = { name: '', phone: '', street: '', city: '', state: '', pincode: '', country: 'India' };

const AddressForm = ({ initial, onSave, onCancel, busy, title = 'Add New Address' }) => {
  const [form, setForm] = useState(initial || EMPTY_ADDR);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

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
    } catch (err) {
      setGpsError(err.message);
    } finally {
      setGpsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const inputCls = 'w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg ' +
    'bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-[14px] ' +
    'focus:ring-2 focus:ring-fv-primary focus:border-transparent';
  const labelCls = 'block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <form onSubmit={handleSubmit} className="bg-fv-cream dark:bg-gray-800 rounded-[14px] border border-fv-border p-5 space-y-4">
      <p className="font-semibold text-fv-heading text-[15px]">{title}</p>

      {/* GPS Button */}
      <button
        type="button"
        onClick={handleGPS}
        disabled={gpsLoading}
        className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg
                   border-2 border-dashed border-fv-primary/50 hover:border-fv-primary
                   text-fv-primary text-[13px] font-semibold hover:bg-white
                   transition-all disabled:opacity-60"
      >
        {gpsLoading
          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Detecting location…</>
          : <><Navigation className="w-3.5 h-3.5" /> Use Current Location</>}
      </button>

      {gpsError && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2.5 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{gpsError}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Full Name</label>
          <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className={inputCls} placeholder="Name" />
        </div>
        <div>
          <label className={labelCls}>Phone</label>
          <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={inputCls} placeholder="Phone" />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>Street / Area *</label>
          <input type="text" required value={form.street} onChange={e => set('street', e.target.value)}
            className={inputCls} placeholder="House no., Building, Street, Area" />
        </div>
        <div>
          <label className={labelCls}>City *</label>
          <input type="text" required value={form.city} onChange={e => set('city', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>State *</label>
          <input type="text" required value={form.state} onChange={e => set('state', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Pincode *</label>
          <input type="text" required value={form.pincode} maxLength={6}
            onChange={e => set('pincode', e.target.value.replace(/\D/g, ''))} className={inputCls} />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-fv-primary text-white rounded-lg
                     text-[13px] font-semibold hover:bg-fv-primary-dark disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Save address
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-gray-300 rounded-lg
                       text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
        )}
      </div>
    </form>
  );
};

/* ─── Delivery Address Panel ─────────────────────────────────────────── */
const AddressPanel = () => {
  const { user, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
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
    if (res.success) { setShowForm(false); flash('success', 'Address saved!'); }
    else flash('error', res.message);
    setBusy(false);
  };

  const handleEdit = async (form) => {
    setBusy(true);
    const res = await updateAddress(editingId, form);
    if (res.success) { setEditingId(null); flash('success', 'Address updated!'); }
    else flash('error', res.message);
    setBusy(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this address?')) return;
    setBusy(true);
    const res = await deleteAddress(id);
    if (!res.success) flash('error', res.message);
    setBusy(false);
  };

  const handleSetDefault = async (id) => {
    setBusy(true);
    const res = await setDefaultAddress(id);
    if (!res.success) flash('error', res.message);
    setBusy(false);
  };

  return (
    <div className="rounded-[18px] border border-fv-border bg-white p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-serif text-[22px] font-semibold text-fv-heading">Delivery Addresses</h2>
          <p className="mt-1 text-[14px] text-fv-muted">Manage where your orders are sent.</p>
        </div>
        {!showForm && !editingId && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-fv-primary text-white
                       rounded-lg text-[13px] font-semibold hover:bg-fv-primary-dark"
          >
            <Plus className="w-3.5 h-3.5" /> Add new
          </button>
        )}
      </div>

      {msg.text && (
        <p className={`flex items-center gap-2 rounded-[10px] px-4 py-3 text-[13px] mb-4
          ${msg.type === 'success' ? 'bg-fv-cream text-fv-success' : 'bg-red-50 text-fv-danger'}`}>
          {msg.type === 'success'
            ? <CheckCircle2 className="h-4 w-4 shrink-0" />
            : <AlertCircle className="h-4 w-4 shrink-0" />}
          {msg.text}
        </p>
      )}

      {/* Add form */}
      {showForm && (
        <div className="mb-5">
          <AddressForm
            initial={{ name: user?.name, phone: user?.phone, street: '', city: '', state: '', pincode: '', country: 'India' }}
            onSave={handleAdd}
            onCancel={() => setShowForm(false)}
            busy={busy}
          />
        </div>
      )}

      {/* Address list */}
      {addresses.length === 0 && !showForm && (
        <div className="text-center py-10 text-fv-muted">
          <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-[14px]">No saved addresses yet.</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-3 text-fv-primary text-[13px] font-semibold hover:underline"
          >
            Add your first address →
          </button>
        </div>
      )}

      <div className="space-y-3">
        {addresses.map(addr => (
          <div key={addr._id}>
            {editingId === addr._id ? (
              <AddressForm
                title="Edit Address"
                initial={addr}
                onSave={handleEdit}
                onCancel={() => setEditingId(null)}
                busy={busy}
              />
            ) : (
              <div className={`border-2 rounded-xl p-4 transition-all
                ${addr.isDefault ? 'border-fv-primary bg-fv-cream dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-[14px] text-gray-900 dark:text-white">
                        {addr.name || user?.name}
                      </span>
                      {addr.isDefault && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold
                                         bg-fv-primary/15 text-fv-primary rounded-full">
                          <Star className="w-2.5 h-2.5" fill="currentColor" /> Default
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed">
                      {addr.street}, {addr.city}, {addr.state} — {addr.pincode}
                    </p>
                    {addr.phone && (
                      <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1">📞 {addr.phone}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!addr.isDefault && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleSetDefault(addr._id)}
                        title="Set as default"
                        className="px-2 py-1.5 text-[11px] border border-fv-primary text-fv-primary
                                   rounded-lg hover:bg-fv-cream font-semibold disabled:opacity-50"
                      >
                        Set default
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setEditingId(addr._id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-fv-primary hover:bg-gray-100
                                 dark:hover:bg-gray-700 disabled:opacity-50"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(addr._id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50
                                 dark:hover:bg-red-900/20 disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Main Settings page ─────────────────────────────────────────────── */
const Settings = () => {
  const { user, logout, updateProfile, changeEmail, changePassword } = useAuth();
  const [active, setActive] = useState('profile');
  const [now, setNow] = useState(() => new Date());
  const [orderCount, setOrderCount] = useState(null);

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
        const res = await cachedGet('/orders/myorders', { params: { limit: 1 } });
        if (alive) setOrderCount(res?.data?.total ?? (res?.data?.data || []).length);
      } catch { /* leave the badge off */ }
    })();
    return () => { alive = false; };
  }, []);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
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
      name: p.name || user.name || '',
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

  const setAddress = (field, value) =>
    setProfileData(p => ({ ...p, address: { ...p.address, [field]: value } }));

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
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
        <h1 className="text-center font-serif text-[30px] font-semibold text-fv-heading sm:text-[38px]">
          {greeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
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
              {SECTIONS.map(({ id, label, Icon }) => (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => setActive(id)}
                    aria-current={active === id ? 'true' : undefined}
                    className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-3 text-left text-[15px]
                                transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2
                                focus-visible:ring-fv-yellow motion-reduce:transition-none ${
                      active === id ? 'bg-white/15 font-semibold' : 'hover:bg-white/10'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {label}
                  </button>
                </li>
              ))}
              <li>
                <Link
                  to="/orders"
                  className="flex w-full items-center gap-3 rounded-[10px] px-3 py-3 text-[15px] hover:bg-white/10
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-yellow"
                >
                  <Package className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Order history
                  {orderCount !== null && (
                    <span className="ml-auto rounded-[6px] bg-white/20 px-2 py-0.5 text-[12px] font-semibold">
                      {orderCount}
                    </span>
                  )}
                </Link>
              </li>
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
                  Your email is {user?.email}. Change it from the "Change email" section.
                </p>
              </Panel>
            )}

            {active === 'address' && <AddressPanel />}

            {active === 'email' && (
              <Panel title="Change email" description="You will need to confirm the new address." onSubmit={handleEmailChange} busy={loading.email} submitLabel="Update email">
                <Input label="New email address" type="email" required value={emailData.newEmail}
                       onChange={e => setEmailData(d => ({ ...d, newEmail: e.target.value }))} />
                <PasswordInput label="Current password" required value={emailData.password}
                               onChange={e => setEmailData(d => ({ ...d, password: e.target.value }))} />
              </Panel>
            )}

            {active === 'password' && (
              <Panel title="Change password" onSubmit={handlePasswordChange} busy={loading.password} submitLabel="Update password">
                <PasswordInput label="Current password" required value={passwordData.currentPassword}
                               onChange={e => setPasswordData(d => ({ ...d, currentPassword: e.target.value }))} />
                <div>
                  <PasswordInput label="New password" required showStrengthIndicator value={passwordData.newPassword}
                                 error={errors.newPassword}
                                 onChange={e => setPasswordData(d => ({ ...d, newPassword: e.target.value }))} />
                  {!errors.newPassword && <p className="mt-1.5 text-xs text-fv-muted">{PASSWORD_RULE_TEXT}</p>}
                </div>
                <PasswordInput label="Confirm new password" required value={passwordData.confirmPassword}
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
