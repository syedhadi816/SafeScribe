import { useState, useEffect, useCallback } from 'react';
import { api, type MeetingFromApi } from './api';
import { HomeScreen } from './components/HomeScreen';
import { SetupWelcome } from './components/SetupWelcome';
import { SetupWifi } from './components/SetupWifi';
import { SetupEmail } from './components/SetupEmail';
import { RecordingScreen } from './components/RecordingScreen';
import { ProcessingScreen } from './components/ProcessingScreen';
import { PastMeetingsList } from './components/PastMeetingsList';
import { MeetingDetails } from './components/MeetingDetails';
import { SettingsScreen } from './components/SettingsScreen';
import { ExportProgress } from './components/ExportProgress';
import { EmailWhenReadyScreen } from './components/EmailWhenReadyScreen';
import { ErrorModal } from './components/ErrorModal';
import { ConfirmModal } from './components/ConfirmModal';

export type Screen = 
  | 'setup-welcome'
  | 'setup-wifi'
  | 'setup-email'
  | 'home'
  | 'recording'
  | 'processing'
  | 'email-when-ready'
  | 'past-meetings'
  | 'meeting-details'
  | 'settings'
  | 'email-progress';

export interface Meeting {
  id: string;
  createdAt: string;
  duration: number;
  title?: string;
  notes?: string;
  transcript?: string;
  summary?: string;
  actionItems?: string[];
  decisions?: string[];
  topics?: string[];
  exportedUsb?: boolean;
  emailed: boolean;
  emailedAt?: string | null;
  status?: 'processing';
  participants?: string;
  audioSize: number;
  transcriptSize: number;
  pdfSize: number;
}

export interface Settings {
  setupComplete: boolean;
  wifiSsid?: string;
  wifiConnected: boolean;
  exportEmail?: string;
  emailVerified: boolean;
}

export interface AppState {
  currentScreen: Screen;
  settings: Settings;
  meetings: Meeting[];
  currentMeetingId?: string;
  currentRecordingStart?: number;
  recordingPaused: boolean;
  storageUsedMB: number;
  storageTotalMB: number;
  error?: string;
  confirmAction?: {
    message: string;
    onConfirm: () => void;
  };
}

const STORAGE_TOTAL = 32000; // 32GB in MB

function apiMeetingToMeeting(m: MeetingFromApi): Meeting {
  return {
    ...m,
    audioSize: m.audioSize ?? 0,
    transcriptSize: m.transcriptSize ?? 0,
    pdfSize: m.pdfSize ?? 0,
    emailedAt: m.emailedAt ?? undefined,
    status: m.status,
  };
}

function App() {
  const [state, setState] = useState<AppState>({
    currentScreen: 'setup-welcome',
    settings: {
      setupComplete: false,
      wifiConnected: false,
      emailVerified: false,
    },
    meetings: [],
    recordingPaused: false,
    storageUsedMB: 0,
    storageTotalMB: STORAGE_TOTAL,
    error: undefined,
  });
  const [loading, setLoading] = useState(true);

  const fetchMeetings = useCallback(async () => {
    try {
      const res = await api.listMeetings();
      setState(prev => ({
        ...prev,
        meetings: res.meetings.map(apiMeetingToMeeting),
        storageUsedMB: res.storageUsedMB ?? 0,
        storageTotalMB: res.storageTotalMB ?? STORAGE_TOTAL,
      }));
    } catch (e) {
      console.error('Failed to fetch meetings:', e);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.getSettings();
      setState(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          setupComplete: res.setupComplete ?? false,
          emailVerified: res.emailConfigured ?? false,
          exportEmail: res.emailAddress ?? undefined,
        },
        currentScreen: res.setupComplete ? 'home' : prev.currentScreen,
      }));
    } catch (e) {
      console.error('Failed to fetch settings:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings().then(() => fetchMeetings());
  }, [fetchSettings, fetchMeetings]);

  // Poll meetings when on Past Meetings and any are still processing
  useEffect(() => {
    if (state.currentScreen !== 'past-meetings') return;
    const hasProcessing = state.meetings.some(m => m.status === 'processing');
    if (!hasProcessing) return;
    const interval = setInterval(fetchMeetings, 3000);
    return () => clearInterval(interval);
  }, [state.currentScreen, state.meetings, fetchMeetings]);

  const navigateTo = (screen: Screen, data?: any) => {
    setState(prev => ({ ...prev, currentScreen: screen, ...data }));
  };

  const showError = (message: string) => {
    setState(prev => ({ ...prev, error: message }));
  };

  const hideError = () => {
    setState(prev => ({ ...prev, error: undefined }));
  };

  const showConfirm = (message: string, onConfirm: () => void) => {
    setState(prev => ({ ...prev, confirmAction: { message, onConfirm } }));
  };

  const hideConfirm = () => {
    setState(prev => ({ ...prev, confirmAction: undefined }));
  };

  const updateSettings = (updates: Partial<Settings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
    }));
  };

  const startRecording = async () => {
    const availableMB = state.storageTotalMB - state.storageUsedMB;
    if (availableMB < 100) {
      showError('Storage full. Please free up space before recording.');
      return;
    }
    // Navigate first so UI updates immediately (fixes kiosk display lag)
    const startTime = Date.now();
    navigateTo('recording', { currentRecordingStart: startTime, recordingPaused: false });
    try {
      await api.startRecording();
    } catch (e) {
      navigateTo('home');
      showError(e instanceof Error ? e.message : 'Failed to start recording.');
      // Reset backend so user can retry (backend may be in RECORDING state if start partially failed)
      api.abortRecording().catch(() => {});
    }
  };

  const stopRecording = async () => {
    navigateTo('processing');
    try {
      await api.stopRecording(state.currentRecordingStart ?? Date.now());
      await fetchMeetings();
      navigateTo('email-when-ready');
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Failed to process recording.');
      navigateTo('home');
    }
  };

  const pauseRecording = async () => {
    try {
      await api.pauseRecording();
      setState(prev => ({ ...prev, recordingPaused: true }));
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Failed to pause.');
    }
  };

  const resumeRecording = async () => {
    try {
      await api.resumeRecording();
      setState(prev => ({ ...prev, recordingPaused: false }));
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Failed to resume.');
    }
  };

  const deleteMeeting = (meetingId: string) => {
    const meeting = state.meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    showConfirm(
      'Are you sure you want to delete this meeting? This action cannot be undone.',
      async () => {
        try {
          await api.deleteMeeting(meetingId);
          await fetchMeetings();
          navigateTo('past-meetings');
        } catch (e) {
          showError(e instanceof Error ? e.message : 'Failed to delete meeting.');
        }
        hideConfirm();
      }
    );
  };

  const updateMeeting = (meetingId: string, updates: Partial<Meeting>) => {
    setState(prev => ({
      ...prev,
      meetings: prev.meetings.map(m =>
        m.id === meetingId ? { ...m, ...updates } : m
      ),
    }));
  };

  const emailNotes = async (meetingId: string) => {
    if (!state.settings.emailVerified) {
      showError('Email not configured. Please set up your email in Settings.');
      return;
    }

    const meeting = state.meetings.find(m => m.id === meetingId);
    if (!meeting) {
      showError('Meeting not found.');
      return;
    }

    navigateTo('email-progress', { exportingMeetingId: meetingId });
    try {
      await api.emailMeeting(meetingId);
      await fetchMeetings();
      navigateTo('meeting-details', { currentMeetingId: meetingId });
    } catch (e) {
      showError(e instanceof Error ? e.message : 'Failed to send email.');
      navigateTo('meeting-details', { currentMeetingId: meetingId });
    }
  };

  const factoryReset = () => {
    showConfirm(
      'Factory reset will delete ALL meetings and settings. This cannot be undone. Are you absolutely sure?',
      async () => {
        try {
          await api.factoryReset();
          await fetchSettings();
          await fetchMeetings();
          setState(prev => ({
            ...prev,
            currentScreen: 'setup-welcome',
            settings: {
              setupComplete: false,
              wifiConnected: false,
              emailVerified: false,
            },
            meetings: [],
            storageUsedMB: 0,
          }));
        } catch (e) {
          showError(e instanceof Error ? e.message : 'Factory reset failed.');
        }
        hideConfirm();
      }
    );
  };

  const renderScreen = () => {
    switch (state.currentScreen) {
      case 'setup-welcome':
        return <SetupWelcome onNext={() => navigateTo('setup-wifi')} />;
      
      case 'setup-wifi':
        return (
          <SetupWifi
            onNext={(ssid: string) => {
              updateSettings({ wifiSsid: ssid, wifiConnected: true });
              navigateTo('setup-email');
            }}
          />
        );
      
      case 'setup-email':
        return (
          <SetupEmail
            onComplete={async (email: string) => {
              updateSettings({ 
                exportEmail: email, 
                emailVerified: true,
                setupComplete: true 
              });
              navigateTo('home');
            }}
            onSkip={async () => {
              try {
                await api.setSetupComplete(true);
              } catch { /* ignore */ }
              updateSettings({ setupComplete: true });
              navigateTo('home');
            }}
          />
        );
      
      case 'home':
        return (
          <HomeScreen
            storageUsedMB={state.storageUsedMB}
            storageTotalMB={state.storageTotalMB}
            wifiConnected={state.settings.wifiConnected}
            onStartRecording={startRecording}
            onPastMeetings={() => {
              fetchMeetings();
              navigateTo('past-meetings');
            }}
            onSettings={() => navigateTo('settings')}
          />
        );
      
      case 'recording':
        return (
          <RecordingScreen
            startTime={state.currentRecordingStart || Date.now()}
            isPaused={state.recordingPaused}
            onStop={stopRecording}
            onPause={pauseRecording}
            onResume={resumeRecording}
            storageUsedMB={state.storageUsedMB}
            storageTotalMB={state.storageTotalMB}
            onStorageWarning={() => showError('Storage is running low. Recording will stop automatically if storage becomes full.')}
          />
        );
      
      case 'processing':
        return <ProcessingScreen />;

      case 'email-when-ready':
        return (
          <EmailWhenReadyScreen
            onGotIt={() => {
              fetchMeetings();
              navigateTo('home');
            }}
          />
        );
      
      case 'past-meetings':
        return (
          <PastMeetingsList
            meetings={state.meetings}
            emailConfigured={state.settings.emailVerified}
            onBack={() => navigateTo('home')}
          />
        );
      
      case 'meeting-details':
        const meeting = state.meetings.find(m => m.id === state.currentMeetingId);
        return (
          <MeetingDetails
            meeting={meeting}
            onBack={() => navigateTo('past-meetings')}
            onDelete={() => meeting && deleteMeeting(meeting.id)}
            onUpdateMeeting={updateMeeting}
            onEmail={() => meeting && emailNotes(meeting.id)}
          />
        );
      
      case 'settings':
        return (
          <SettingsScreen
            settings={state.settings}
            onBack={() => navigateTo('home')}
            onUpdateWifi={(ssid) => {
              updateSettings({ wifiSsid: ssid, wifiConnected: true });
            }}
            onUpdateEmail={async (email: string) => {
              updateSettings({ exportEmail: email, emailVerified: true });
            }}
            onFactoryReset={factoryReset}
            onRunSetupAgain={async () => {
              try {
                await api.setSetupComplete(false);
                updateSettings({ setupComplete: false });
                navigateTo('setup-welcome');
              } catch (e) {
                showError(e instanceof Error ? e.message : 'Could not reset setup.');
              }
            }}
          />
        );
      
      case 'email-progress':
        return <ExportProgress mode="email" />;
      
      default:
        return <HomeScreen 
          storageUsedMB={state.storageUsedMB}
          storageTotalMB={state.storageTotalMB}
          wifiConnected={state.settings.wifiConnected}
          onStartRecording={startRecording}
          onPastMeetings={() => {
            fetchMeetings();
            navigateTo('past-meetings');
          }}
          onSettings={() => navigateTo('settings')}
        />;
    }
  };

  if (loading) {
    return (
      <div className="device-container flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="device-container">
      {renderScreen()}
      {state.error && <ErrorModal message={state.error} onClose={hideError} />}
      {state.confirmAction && (
        <ConfirmModal
          message={state.confirmAction.message}
          onConfirm={state.confirmAction.onConfirm}
          onCancel={hideConfirm}
        />
      )}
    </div>
  );
}

export default App;