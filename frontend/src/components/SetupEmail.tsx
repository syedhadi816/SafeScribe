import { useState } from 'react';
import { Mail, ArrowLeft } from 'lucide-react';
import { api } from '../api';
import { OnScreenKeyboard } from './OnScreenKeyboard';

interface SetupEmailProps {
  onComplete: (email: string) => void | Promise<void>;
  onSkip?: () => void;
  onBack?: () => void;
  showSkip?: boolean;
}

type Step = 'enter-email' | 'enter-code';

export function SetupEmail({ onComplete, onSkip, onBack, showSkip = true }: SetupEmailProps) {
  const [step, setStep] = useState<Step>('enter-email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async () => {
    const e = email.trim().toLowerCase();
    if (!e || !e.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    setSending(true);
    setError('');
    try {
      await api.sendOtp(e);
      setEmail(e);
      setStep('enter-code');
      setCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code.');
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    const c = code.trim();
    if (!c || c.length !== 4) {
      setError('Enter the 4-digit code.');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      const res = await api.verifyOtp(email, c);
      await onComplete(res.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  const backToEmail = () => {
    setStep('enter-email');
    setCode('');
    setError('');
  };

  return (
    <div className="screen-container bg-gray-100 flex flex-col">
      <div className="p-4 border-b border-gray-300 bg-white flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="touch-target p-2 -ml-2">
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
              {step === 'enter-email' ? 'Enter your email' : 'Enter verification code'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-4 gap-3">
        <p className="text-sm text-gray-700 text-center shrink-0">
          SafeScribe sends meeting notes to <strong>your inbox</strong>. Enter your email and we&apos;ll send a 4-digit code to verify it.
        </p>

        {step === 'enter-email' && (
          <div className="flex-1 min-h-0 flex flex-col gap-3">
            <OnScreenKeyboard
              value={email}
              onChange={(v) => { setEmail(v); setError(''); }}
              type="text"
              onSubmit={handleSendCode}
              submitLabel={sending ? 'Sending...' : 'Send Code'}
              submitDisabled={sending || !email.trim().includes('@')}
            />
            {showSkip && onSkip && (
              <button onClick={onSkip} className="w-full h-12 text-gray-600 touch-target text-sm shrink-0">
                Skip for Now
              </button>
            )}
          </div>
        )}

        {step === 'enter-code' && (
          <div className="flex-1 min-h-0 flex flex-col gap-3">
            <p className="text-sm text-gray-600 shrink-0">We sent a 4-digit code to <strong>{email}</strong></p>
            <p className="text-xs text-gray-500 shrink-0">Check spam or quarantine folders if you don&apos;t see it.</p>
            <OnScreenKeyboard
              value={code}
              onChange={(v) => { setCode(v.replace(/\D/g, '').slice(0, 4)); setError(''); }}
              type="text"
              mode="numeric"
              maxLength={4}
              onSubmit={handleVerify}
              submitLabel={verifying ? 'Verifying...' : 'Verify'}
              submitDisabled={verifying || code.length !== 4}
            />
            <div className="flex flex-col gap-1 shrink-0">
              <button onClick={handleSendCode} disabled={sending} className="w-full text-gray-600 touch-target text-sm">
                Resend code
              </button>
              <button onClick={backToEmail} className="w-full text-gray-500 touch-target text-sm">
                ← Use a different email
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3 shrink-0">{error}</p>
        )}
      </div>

      <div className="p-4 border-t border-gray-300 bg-white">
        <p className="text-xs text-center text-gray-500">
          Your email stays on this device. Notes are only sent to your inbox.
        </p>
      </div>
    </div>
  );
}
