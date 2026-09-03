import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import api from '../../utils/api';
import PageLoader from '../../components/PageLoader';

const PHRASE = 'DELETE ALL DATA';

/**
 * Production preparation: clear seeded/test content before going live.
 *
 * The UI mirrors the four gates the API enforces — it never assumes the server
 * will accept, and it shows exactly what will be removed first so the decision
 * is made on real numbers rather than a guess.
 */
const AdminDangerZone = () => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [password, setPassword] = useState('');
  const [phrase, setPhrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/purge-data/preview');
      setPreview(res.data.data);
      setDenied(false);
    } catch (err) {
      if (err.response?.status === 403) setDenied(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    // Final confirmation, on top of the password and the typed phrase.
    if (!window.confirm('This permanently removes all products, orders, reviews and customers. Continue?')) return;

    setBusy(true);
    setMessage(null);
    try {
      const res = await api.post('/admin/purge-data', { password, confirmation: phrase });
      setMessage({ type: 'success', text: res.data.message, removed: res.data.data?.removed });
      setPassword('');
      setPhrase('');
      load();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not complete the request.' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <PageLoader fullHeight text="Checking permissions…" />;

  if (denied) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-16 text-center">
        <ShieldAlert className="mx-auto h-12 w-12 text-fv-muted" aria-hidden="true" />
        <h1 className="mt-4 font-serif text-[26px] font-semibold text-fv-heading">Restricted</h1>
        <p className="mt-2 text-[15px] text-fv-muted">
          This tool is limited to the super admin account configured in <code>SUPER_ADMIN_EMAIL</code>.
        </p>
      </div>
    );
  }

  const counts = preview?.counts || {};
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const ready = phrase === PHRASE && password.length > 0 && !busy;

  return (
    <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-6">
      <h1 className="font-serif text-[28px] font-semibold text-fv-heading">Production preparation</h1>
      <p className="mt-1 text-[15px] text-fv-muted">
        Remove seeded and test content before opening the store to customers.
      </p>

      <div className="mt-6 rounded-[18px] border border-fv-danger/30 bg-white p-6">
        <p className="flex items-start gap-2 text-[14px] text-fv-danger">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          This permanently deletes the records below. It cannot be undone.
        </p>

        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(counts).map(([name, n]) => (
            <li key={name} className="rounded-[12px] bg-fv-page p-3 text-center">
              <span className="block text-[20px] font-semibold text-fv-heading">{n}</span>
              <span className="block text-[13px] capitalize text-fv-muted">{name}</span>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-[13px] text-fv-muted">
          Your own account ({preview?.preserved?.email}) is never removed, so you keep access afterwards.
        </p>

        {message && (
          <p
            role="alert"
            className={`mt-5 rounded-[10px] px-4 py-3 text-[14px] ${
              message.type === 'success' ? 'bg-fv-cream text-fv-success' : 'bg-red-50 text-fv-danger'
            }`}
          >
            {message.text}
            {message.removed && (
              <span className="mt-1 block text-[13px]">
                {Object.entries(message.removed).map(([k, v]) => `${k}: ${v}`).join(' · ')}
              </span>
            )}
          </p>
        )}

        <form onSubmit={submit} className="mt-6 space-y-4">
          <p>
            <label htmlFor="purge-password" className="block text-[13px] font-medium text-fv-muted">
              Confirm your admin password
            </label>
            <input
              id="purge-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 h-12 w-full rounded-[10px] border border-fv-border px-3 text-[15px]
                         focus:border-fv-primary focus:outline-none focus:ring-2 focus:ring-fv-primary"
            />
          </p>

          <p>
            <label htmlFor="purge-phrase" className="block text-[13px] font-medium text-fv-muted">
              Type <strong className="text-fv-heading">{PHRASE}</strong> to confirm
            </label>
            <input
              id="purge-phrase"
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              aria-describedby="purge-phrase-help"
              className="mt-1 h-12 w-full rounded-[10px] border border-fv-border px-3 text-[15px]
                         focus:border-fv-primary focus:outline-none focus:ring-2 focus:ring-fv-primary"
            />
            <span id="purge-phrase-help" className="mt-1 block text-[12px] text-fv-muted">
              Case-sensitive.
            </span>
          </p>

          <button
            type="submit"
            disabled={!ready || total === 0}
            className="inline-flex h-12 items-center gap-2 rounded-[50px] bg-fv-danger px-6 text-[15px]
                       font-semibold text-white hover:brightness-90 disabled:cursor-not-allowed
                       disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-fv-danger focus-visible:ring-offset-2"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {total === 0 ? 'Nothing to remove' : `Remove all data (${total} records)`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminDangerZone;
