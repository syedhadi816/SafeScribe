import { useState, useEffect, useMemo } from 'react';
import { Wifi, ChevronRight, RefreshCw, Lock, ArrowLeft, Check } from 'lucide-react';
import { api } from '../api';
import { OnScreenKeyboard } from './OnScreenKeyboard';

interface NetworkItem {
  ssid: string;
  signal: number;
  secure: boolean;
}

interface SetupWifiProps {
  onNext: (ssid: string) => void;
}

type Step = 'list' | 'password';

export function SetupWifi({ onNext }: SetupWifiProps) {
  const [step, setStep] = useState<Step>('list');
  const [networks, setNetworks] = useState<NetworkItem[]>([]);
  const [scanning, setScanning] = useState(true);
  const [scanError, setScanError] = useState('');
  const [connected, setConnected] = useState(false);
  const [connectedSsid, setConnectedSsid] = useState<string | null>(null);
  const [selectedSsid, setSelectedSsid] = useState('');
  const [password, setPassword] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(true);

  const doScan = async () => {
    setScanning(true);
    setScanError('');
    try {
      const res = await api.wifiScan();
      setNetworks(res.networks || []);
    } catch (e) {
      setScanError(e instanceof Error ? e.message : 'Could not scan for networks.');
      setNetworks([]);
    } finally {
      setScanning(false);
    }
  };

  const checkStatus = async () => {
    setCheckingStatus(true);
    try {
      const res = await api.wifiStatus();
      setConnected(res.connected ?? false);
      setConnectedSsid(res.ssid ?? null);
    } catch {
      setConnected(false);
      setConnectedSsid(null);
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    checkStatus().then(doScan);
  }, []);

  const sortedNetworks = useMemo(() => {
    if (!connectedSsid) return networks;
    const list = [...networks];
    const idx = list.findIndex((n) => n.ssid === connectedSsid);
    if (idx <= 0) return list;
    const [connected] = list.splice(idx, 1);
    return [connected, ...list];
  }, [networks, connectedSsid]);

  const handleNext = () => {
    if (connected && connectedSsid) onNext(connectedSsid);
  };

  const handleSelectNetwork = (ssid: string) => {
    if (connected && connectedSsid && ssid === connectedSsid) {
      onNext(ssid);
      return;
    }
    setSelectedSsid(ssid);
    setConnectError('');
    setPassword('');
    setStep('password');
  };

  const handleBackToList = () => {
    setStep('list');
    setConnectError('');
  };

  const handleConnect = async () => {
    const targetSsid = selectedSsid.trim();
    if (!targetSsid) return;

    setConnecting(true);
    setConnectError('');
    try {
      await api.wifiConnect(targetSsid, password);
      onNext(targetSsid);
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : 'Connection failed.');
    } finally {
      setConnecting(false);
    }
  };

  // Password page - dedicated screen with large input + on-screen keyboard
  if (step === 'password') {
    return (
      <div className="screen-container bg-gray-100 flex flex-col">
        <div className="p-3 border-b border-gray-300 bg-white flex items-center gap-3 shrink-0">
          <button onClick={handleBackToList} className="touch-target p-2 -ml-2" aria-label="Back">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg text-black truncate">Password for {selectedSsid}</h1>
            <p className="text-sm text-gray-600">Enter WiFi password</p>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col p-3 gap-2">
          <OnScreenKeyboard
            value={password}
            onChange={setPassword}
            type="text"
            maskValue={false}
            onSubmit={handleConnect}
            submitLabel={connecting ? 'Connecting...' : 'Connect'}
            submitDisabled={connecting}
          />
          {connectError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl p-2">{connectError}</p>
          )}
          {connecting && (
            <p className="text-sm text-gray-600 text-center">Connecting...</p>
          )}
        </div>
      </div>
    );
  }

  // Network list page - sorted with connected first; Next in header when connected
  return (
    <div className="screen-container bg-gray-100 flex flex-col">
      <div className="p-4 border-b border-gray-300 bg-white flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center shrink-0">
            <Wifi className="w-6 h-6 text-gray-700" />
          </div>
          <div className="min-w-0">
            <h1 className="text-black truncate">WiFi Setup</h1>
            <p className="text-sm text-gray-600 truncate">Swipe to scroll • Tap a network</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleNext}
          disabled={!connected || !connectedSsid}
          className="touch-target shrink-0 h-10 px-4 bg-gray-800 text-white rounded-xl font-medium active:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col p-4">
        <div className="flex items-center justify-between shrink-0 mb-2">
          <label className="text-sm font-medium text-gray-800">Select a network</label>
          <button
            onClick={() => {
              checkStatus();
              doScan();
            }}
            disabled={scanning}
            className="flex items-center gap-2 text-sm text-gray-700 touch-target disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Scanning...' : 'Refresh'}
          </button>
        </div>

        <div className="flex-1 min-h-0 touch-scroll">
          {scanning && sortedNetworks.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-6">Scanning for networks...</p>
          )}

          {!scanning && sortedNetworks.length > 0 && (
            <div className="space-y-2 pb-4">
              {sortedNetworks.map((net) => {
                const isConnected = connected && connectedSsid && net.ssid === connectedSsid;
                return (
                  <button
                    key={net.ssid}
                    onClick={() => handleSelectNetwork(net.ssid)}
                    className={`w-full h-14 px-4 rounded-xl border-2 transition-all touch-target flex items-center justify-between ${
                      isConnected ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white active:bg-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {net.secure ? (
                        <Lock className="w-5 h-5 text-gray-600 shrink-0" />
                      ) : (
                        <Wifi className="w-5 h-5 text-gray-600 shrink-0" />
                      )}
                      <span className="truncate text-left">{net.ssid}</span>
                      {net.signal >= 0 && (
                        <span className="text-xs text-gray-500 shrink-0">{net.signal}%</span>
                      )}
                    </div>
                    {isConnected ? (
                      <span className="flex items-center gap-1.5 text-green-700 font-medium shrink-0">
                        <Check className="w-5 h-5" />
                        Connected
                      </span>
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {!scanning && sortedNetworks.length === 0 && !scanError && (
            <p className="text-sm text-gray-500 text-center py-6">No networks found. Tap Refresh.</p>
          )}

          {scanError && (
            <p className="text-sm text-amber-700 bg-amber-50 rounded-xl p-3 mt-2">{scanError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
