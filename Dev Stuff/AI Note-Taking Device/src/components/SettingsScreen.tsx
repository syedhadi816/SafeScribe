import { useState, useEffect } from 'react';
import { ArrowLeft, Wifi, Mail, RefreshCw, ChevronRight, Check, Settings2, Lock } from 'lucide-react';
import { OnScreenKeyboard } from './OnScreenKeyboard';
import { Settings } from '../App';
import { SetupEmail } from './SetupEmail';
import { api } from '../api';

interface NetworkItem {
  ssid: string;
  signal: number;
  secure: boolean;
}

interface SettingsScreenProps {
  settings: Settings;
  onBack: () => void;
  onUpdateWifi: (ssid: string) => void;
  onUpdateEmail: (email: string) => void | Promise<void>;
  onFactoryReset: () => void;
  onRunSetupAgain?: () => void;
}

type SettingsView = 'main' | 'wifi' | 'email';
type WifiStep = 'list' | 'password';

export function SettingsScreen({ settings, onBack, onUpdateWifi, onUpdateEmail, onFactoryReset, onRunSetupAgain }: SettingsScreenProps) {
  const [view, setView] = useState<SettingsView>('main');
  const [networks, setNetworks] = useState<NetworkItem[]>([]);
  const [scanning, setScanning] = useState(true);
  const [connected, setConnected] = useState(false);
  const [connectedSsid, setConnectedSsid] = useState<string | null>(null);
  const [selectedSsid, setSelectedSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [wifiStep, setWifiStep] = useState<WifiStep>('list');

  const doScan = async () => {
    setScanning(true);
    try {
      const res = await api.wifiScan();
      setNetworks(res.networks || []);
    } catch {
      setNetworks([]);
    } finally {
      setScanning(false);
    }
  };

  const checkStatus = async () => {
    try {
      const res = await api.wifiStatus();
      setConnected(res.connected ?? false);
      setConnectedSsid(res.ssid ?? null);
    } catch {
      setConnected(false);
      setConnectedSsid(null);
    }
  };

  useEffect(() => {
    if (view === 'wifi') {
      setWifiStep('list');
      checkStatus().then(doScan);
    }
  }, [view]);

  const handleWifiConnect = async () => {
    const ssid = selectedSsid.trim();
    if (!ssid) return;
    setConnecting(true);
    setConnectError('');
    try {
      await api.wifiConnect(ssid, wifiPassword);
      onUpdateWifi(ssid);
      setView('main');
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : 'Connection failed.');
    } finally {
      setConnecting(false);
    }
  };

  const handleSelectNetwork = (ssid: string) => {
    setSelectedSsid(ssid);
    setConnectError('');
    setWifiPassword('');
    setWifiStep('password');
  };

  const handleBackToList = () => {
    setWifiStep('list');
    setConnectError('');
  };

  if (view === 'wifi') {
    if (wifiStep === 'password') {
      return (
        <div className="screen-container bg-gray-100 flex flex-col">
          <div className="p-3 border-b border-gray-300 bg-white flex items-center gap-3 shrink-0">
            <button onClick={handleBackToList} className="touch-target p-2 -ml-2">
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg text-black truncate">Password for {selectedSsid}</h1>
            </div>
          </div>
          <div className="flex-1 overflow-hidden flex flex-col p-3 gap-2">
            <OnScreenKeyboard
              value={wifiPassword}
              onChange={setWifiPassword}
              type="text"
              maskValue={false}
              onSubmit={handleWifiConnect}
              submitLabel={connecting ? 'Connecting...' : 'Connect'}
              submitDisabled={connecting}
            />
            {connectError && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-2">{connectError}</p>}
          </div>
        </div>
      );
    }

    return (
      <div className="screen-container bg-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-300 bg-white flex items-center gap-3 shrink-0">
          <button onClick={() => setView('main')} className="touch-target p-2 -ml-2">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-black">WiFi Settings</h1>
        </div>

        <div className="flex-1 min-h-0 flex flex-col p-4">
          {connected && connectedSsid && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 shrink-0 mb-4">
              <div className="flex items-center gap-2 text-green-800 font-medium">
                <Check className="w-4 h-4" />
                Connected to {connectedSsid}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between shrink-0 mb-2">
            <label className="text-sm font-medium text-gray-800">Select a network</label>
            <button
              onClick={() => { checkStatus(); doScan(); }}
              disabled={scanning}
              className="flex items-center gap-2 text-sm text-gray-700 touch-target disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Scanning...' : 'Refresh'}
            </button>
          </div>

          <div className="flex-1 min-h-0 touch-scroll">
            {!scanning && networks.length > 0 && (
              <div className="space-y-2 pb-4">
                {networks.map((net) => (
                  <button
                    key={net.ssid}
                    onClick={() => handleSelectNetwork(net.ssid)}
                    className="w-full h-14 px-4 rounded-xl border-2 border-gray-300 bg-white active:bg-gray-200 transition-all touch-target flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {net.secure ? <Lock className="w-5 h-5 text-gray-600 shrink-0" /> : <Wifi className="w-5 h-5 text-gray-600 shrink-0" />}
                      <span className="truncate text-left">{net.ssid}</span>
                      {net.signal >= 0 && <span className="text-xs text-gray-500 shrink-0">{net.signal}%</span>}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                  </button>
                ))}
              </div>
            )}
            {connectError && <p className="text-sm text-red-600 bg-red-50 rounded-xl p-3 mt-2">{connectError}</p>}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'email') {
    return (
      <SetupEmail
        onComplete={async (email) => {
          await onUpdateEmail(email);
          setView('main');
        }}
        onBack={() => setView('main')}
        showSkip={false}
      />
    );
  }

  return (
    <div className="screen-container bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-300 bg-white flex items-center gap-3">
        <button onClick={onBack} className="touch-target p-2 -ml-2" aria-label="Back">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-black">Settings</h1>
      </div>

      {/* Settings List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-200 bg-white">
        {/* WiFi Settings */}
        <button
          onClick={() => setView('wifi')}
          className="w-full p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-target flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
              <Wifi className="w-5 h-5 text-gray-700" />
            </div>
            <div className="text-left">
              <h3 className="text-black">WiFi Settings</h3>
              <p className="text-sm text-gray-600">
                {settings.wifiConnected ? settings.wifiSsid : 'Not connected'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        {/* Email Settings */}
        <button
          onClick={() => setView('email')}
          className="w-full p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-target flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-gray-700" />
            </div>
            <div className="text-left">
              <h3 className="text-black">Email Settings</h3>
              <p className="text-sm text-gray-600">
                {settings.emailVerified ? settings.exportEmail : 'Log in to receive notes via email'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        {/* Run setup again - WiFi & email onboarding */}
        {onRunSetupAgain && (
          <button
            onClick={onRunSetupAgain}
            className="w-full p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-target flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                <Settings2 className="w-5 h-5 text-gray-700" />
              </div>
              <div className="text-left">
                <h3 className="text-black">Run setup again</h3>
                <p className="text-sm text-gray-600">WiFi and email onboarding</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        )}

        {/* Factory Reset */}
        <button
          onClick={onFactoryReset}
          className="w-full p-4 hover:bg-red-50 active:bg-red-100 transition-colors touch-target flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-left">
              <h3 className="text-red-800">Factory Reset</h3>
              <p className="text-sm text-red-600">Delete all data and settings</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-300 bg-white">
        <div className="space-y-1 text-center text-xs text-gray-600">
          <p>AI Note Taker v1.0</p>
          <p>All data processed locally on device</p>
        </div>
      </div>
    </div>
  );
}