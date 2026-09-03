import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User, MapPin, Package, Lock, Mail, LogOut, Save, Loader2, CheckCircle2, AlertCircle, Clock,
} from 'lucide-react';
import { validatePassword, PASSWORD_RULE_TEXT } from '../utils/passwordPolicy';
import { useAuth } from '../context/AuthContext';
import { cachedGet } from '../utils/api';
import PasswordInput from '../components/ui/PasswordInput';
import Input from '../components/ui/Input';

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

const Panel = ({ title, description, children, onSubmit, busy, submitLabel = 'Save changes' }) => (
  <form onSubmit={onSubmit} className="rounded-[18px] border border-fv-border bg-white p-6">
    <h2 className="font-serif text-[22px] font-semibold text-fv-heading">{title}</h2>
    {description && <p className="mt-1 text-[14px] text-fv-muted">{description}</p>}
    <div className="mt-6 space-y-5">{children}</div>
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
  </form>
);

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
    setProfileData((p) => ({ ...p, address: { ...p.address, [field]: value } }));

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading((l) => ({ ...l, profile: true }));
    const result = await updateProfile(profileData);
    showMessage(result.success ? 'success' : 'error', result.success ? 'Profile updated.' : result.message);
    setLoading((l) => ({ ...l, profile: false }));
  };

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setLoading((l) => ({ ...l, email: true }));
    const result = await changeEmail(emailData.newEmail, emailData.password);
    if (result.success) setEmailData({ newEmail: '', password: '' });
    showMessage(result.success ? 'success' : 'error', result.message);
    setLoading((l) => ({ ...l, email: false }));
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const next = {};
    const check = validatePassword(passwordData.newPassword);
    if (!check.valid) next.newPassword = check.message;
    if (passwordData.newPassword !== passwordData.confirmPassword) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading((l) => ({ ...l, password: true }));
    const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);
    if (result.success) setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    showMessage(result.success ? 'success' : 'error', result.message);
    setLoading((l) => ({ ...l, password: false }));
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
              message.type === 'success'
                ? 'bg-fv-cream text-fv-success'
                : 'bg-red-50 text-fv-danger'
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
                       onChange={(e) => setProfileData((p) => ({ ...p, name: e.target.value }))} />
                <Input label="Contact number" type="tel" inputMode="numeric" value={profileData.phone}
                       onChange={(e) => setProfileData((p) => ({ ...p, phone: e.target.value }))} />
                <p className="text-[13px] text-fv-muted">
                  Your email is {user?.email}. Change it from the “Change email” section.
                </p>
              </Panel>
            )}

            {active === 'address' && (
              <Panel title="Delivery address" description="Where your orders are sent." onSubmit={handleProfileUpdate} busy={loading.profile}>
                <Input label="Street address" value={profileData.address.street} onChange={(e) => setAddress('street', e.target.value)} />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input label="City" value={profileData.address.city} onChange={(e) => setAddress('city', e.target.value)} />
                  <Input label="State" value={profileData.address.state} onChange={(e) => setAddress('state', e.target.value)} />
                </div>
                <Input label="PIN code" inputMode="numeric" maxLength={6} value={profileData.address.pincode}
                       onChange={(e) => setAddress('pincode', e.target.value.replace(/\D/g, ''))} />
              </Panel>
            )}

            {active === 'email' && (
              <Panel title="Change email" description="You will need to confirm the new address." onSubmit={handleEmailChange} busy={loading.email} submitLabel="Update email">
                <Input label="New email address" type="email" required value={emailData.newEmail}
                       onChange={(e) => setEmailData((d) => ({ ...d, newEmail: e.target.value }))} />
                <PasswordInput label="Current password" required value={emailData.password}
                               onChange={(e) => setEmailData((d) => ({ ...d, password: e.target.value }))} />
              </Panel>
            )}

            {active === 'password' && (
              <Panel title="Change password" onSubmit={handlePasswordChange} busy={loading.password} submitLabel="Update password">
                <PasswordInput label="Current password" required value={passwordData.currentPassword}
                               onChange={(e) => setPasswordData((d) => ({ ...d, currentPassword: e.target.value }))} />
                <div>
                  <PasswordInput label="New password" required showStrengthIndicator value={passwordData.newPassword}
                                 error={errors.newPassword}
                                 onChange={(e) => setPasswordData((d) => ({ ...d, newPassword: e.target.value }))} />
                  {!errors.newPassword && <p className="mt-1.5 text-xs text-fv-muted">{PASSWORD_RULE_TEXT}</p>}
                </div>
                <PasswordInput label="Confirm new password" required value={passwordData.confirmPassword}
                               error={errors.confirmPassword}
                               onChange={(e) => setPasswordData((d) => ({ ...d, confirmPassword: e.target.value }))} />
              </Panel>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
