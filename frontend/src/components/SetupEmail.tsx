import { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { OnScreenKeyboard } from './OnScreenKeyboard';

interface SetupEmailProps {
  onComplete: (email: string, appPassword: string) => void | Promise<void>;
  onSkip?: () => void;
  onBack?: () => void;
  showSkip?: boolean;
}

type Step = 'enter-email' | 'enter-password';

export function SetupEmail({ onComplete, onSkip, onBack, showSkip = true }: SetupEmailProps) {
  const [step, setStep] = useState<Step>('enter-email');
  const [email, setEmail] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleEmailNext = () => {
    const e = email.trim().toLowerCase();
    if (!e || !e.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    setEmail(e);
    setError('');
    setStep('enter-password');
    setAppPassword('');
  };

  const handlePasswordSubmit = async () => {
    const p = appPassword.trim();
    if (!p || p.length !== 16) {
      setError('Enter your 16-character app password.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onComplete(email, p);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const backToEmail = () => {
    setStep('enter-email');
    setAppPassword('');
    setError('');
  };

  return (
    <div className="screen-container bg-gray-100 flex flex-col">
      <div className="p-4 border-b border-gray-300 bg-white flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && step === 'enter-email' && (
            <button onClick={onBack} className="touch-target p-2 -ml-2 shrink-0">
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
          )}
          {step === 'enter-password' && (
            <button onClick={backToEmail} className="touch-target p-2 -ml-2 shrink-0" aria-label="Back">
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
          )}
          <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center shrink-0">
            <Mail className="w-6 h-6 text-gray-700" />
          </div>
          <div className="min-w-0">
            <h1 className="text-black truncate">Email Setup</h1>
            <p className="text-sm text-gray-600 truncate">
              {step === 'enter-email' ? 'Enter your email' : 'Enter 16-character app password'}
            </p>
          </div>
        </div>
        {/* Next/Done in top right so it's always visible above keyboard */}
        {step === 'enter-email' && (
          <button
            type="button"
            onClick={handleEmailNext}
            disabled={!email.trim().includes('@')}
            className="touch-target shrink-0 h-10 px-4 bg-gray-800 text-white rounded-xl font-medium active:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        )}
        {step === 'enter-password' && (
          <button
            type="button"
            onClick={handlePasswordSubmit}
            disabled={saving || appPassword.length !== 16}
            className="touch-target shrink-0 h-10 px-4 bg-gray-800 text-white rounded-xl font-medium active:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Done'}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-4 gap-3">
        <p className="text-sm text-gray-700 text-center shrink-0">
          SafeScribe sends meeting notes to <strong>your inbox</strong>.
        </p>

        {step === 'enter-email' && (
          <div className="flex-1 min-h-0 flex flex-col gap-3">
            <OnScreenKeyboard
              value={email}
              onChange={(v) => { setEmail(v); setError(''); }}
              type="text"
            />
            {showSkip && onSkip && (
              <button onClick={onSkip} className="w-full h-12 text-gray-600 touch-target text-sm shrink-0">
                Skip for Now
              </button>
            )}
          </div>
        )}

        {step === 'enter-password' && (
          <div className="flex-1 min-h-0 flex flex-col gap-3">
            <p className="text-sm text-gray-600 shrink-0">
              Use a 16-character <strong>app password</strong> from your email provider (e.g. Gmail → App passwords). Not your normal login password.
            </p>
            <OnScreenKeyboard
              value={appPassword}
              onChange={(v) => { setAppPassword(v.replace(/\s/g, '').slice(0, 16)); setError(''); }}
              type="text"
              maskValue
              onSubmit={handlePasswordSubmit}
              submitLabel={saving ? 'Saving...' : 'Done'}
              submitDisabled={saving || appPassword.length !== 16}
            />
          </div>
        )}

        {error && (
          <div className="shrink-0 space-y-2">
            <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</p>
            {step === 'enter-password' && (
              <>
                <p className="text-sm text-gray-700">Entered email: <strong>{email}</strong></p>
                <button
                  type="button"
                  onClick={backToEmail}
                  className="w-full text-sm text-gray-600 underline touch-target py-2"
                >
                  ← Use a different email
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
