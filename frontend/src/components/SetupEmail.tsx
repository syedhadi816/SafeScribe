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
      <div className="p-4 border-b border-gray-300 bg-white flex items-center gap-3">
        {onBack && step === 'enter-email' && (
          <button onClick={onBack} className="touch-target p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
        )}
        {step === 'enter-password' && (
          <button onClick={backToEmail} className="touch-target p-2 -ml-2" aria-label="Back">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
            <Mail className="w-6 h-6 text-gray-700" />
          </div>
          <div>
            <h1 className="text-black">Email Setup</h1>
            <p className="text-sm text-gray-600">
              {step === 'enter-email' ? 'Enter your email' : 'Enter 16-character app password'}
            </p>
          </div>
        </div>
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
              onSubmit={handleEmailNext}
              submitLabel="Next"
              submitDisabled={!email.trim().includes('@')}
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
          <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3 shrink-0">{error}</p>
        )}
      </div>

      <div className="p-4 border-t border-gray-300 bg-white">
        <p className="text-xs text-center text-gray-500">
          Your email and app password stay on this device. Notes are only sent to your inbox.
        </p>
      </div>
    </div>
  );
}
