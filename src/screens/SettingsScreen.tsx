import React, { useRef, useState, useEffect } from 'react';
import { Delete, Download, Upload, Moon, Sun, Monitor, Bell, Users, AlertTriangle, ChevronRight, ChevronLeft, Home, Shield, Github, Linkedin, Mail, Info, KeyRound, Fingerprint, Database } from 'lucide-react';
import { storage } from '../services/storage';
import { useAppStore } from '../store';

export default function SettingsScreen({ onClose, onDataImported, onSettingsChanged, onOpenRoommates }: { key?: string, onClose: () => void, onDataImported: () => void, onSettingsChanged: () => void, onOpenRoommates: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [pendingImportData, setPendingImportData] = useState<any>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showManageData, setShowManageData] = useState(false);
  const [settings, setSettings] = useState(storage.getSettings());
  const { security, setPin, toggleBiometric } = useAppStore();
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pinTemp, setPinTemp] = useState('');

  const updateSetting = (key: keyof typeof settings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    storage.saveSettings(newSettings);
    onSettingsChanged();
  };

  const handleExport = () => {
    const data = {
      version: 2,
      groups: storage.getGroups(),
      expenses: [], // legacy placeholder
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'splitit_data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.groups || (data.expenses && data.roommates)) {
          setPendingImportData(data);
        } else {
          setErrorMsg('Invalid data file format. Missing groups or expenses data.');
        }
      } catch (err) {
        setErrorMsg('Failed to parse the file. Ensure it is a valid JSON.');
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (pendingImportData) {
      storage.importData(pendingImportData);
      onDataImported();
      setPendingImportData(null);
      onClose();
    }
  };

  return (
    <div className="absolute inset-0 bg-app-bg z-30 flex flex-col animate-in slide-in-from-right duration-200">
      <div className="px-5 py-6 flex items-center border-b border-app-border bg-app-bg shadow-sm gap-3">
        <button onClick={onClose} className="p-2 -ml-2 text-app-muted hover:text-app-text transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-serif italic text-app-primary">Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-8">
        
        {/* Appearance */}
        <h3 className="font-bold uppercase tracking-wider text-[10px] text-app-muted px-2 mb-3">Appearance</h3>
        <div className="bg-app-card rounded-[24px] border border-app-border-light overflow-hidden shadow-sm flex flex-col p-2">
          <div className="flex gap-2">
            <button onClick={() => updateSetting('theme', 'light')} className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl transition-colors ${settings.theme === 'light' ? 'bg-app-primary/10 text-app-primary' : 'hover:bg-app-hover text-app-muted'}`}>
              <Sun size={20} className="mb-2" />
              <span className="text-xs font-bold">Light</span>
            </button>
            <button onClick={() => updateSetting('theme', 'dark')} className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl transition-colors ${settings.theme === 'dark' ? 'bg-app-primary/10 text-app-primary' : 'hover:bg-app-hover text-app-muted'}`}>
              <Moon size={20} className="mb-2" />
              <span className="text-xs font-bold">Dark</span>
            </button>
            <button onClick={() => updateSetting('theme', 'system')} className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl transition-colors ${settings.theme === 'system' ? 'bg-app-primary/10 text-app-primary' : 'hover:bg-app-hover text-app-muted'}`}>
              <Monitor size={20} className="mb-2" />
              <span className="text-xs font-bold">System</span>
            </button>
          </div>
        </div>

        {/* Preferences */}
        <h3 className="font-bold uppercase tracking-wider text-[10px] text-app-muted px-2 mb-3 mt-6">Preferences</h3>
        <div className="bg-app-card rounded-[24px] border border-app-border-light overflow-hidden shadow-sm flex flex-col">
          <div className="p-4 border-b border-app-border-light flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-app-text">Text Size</span>
              <span className="text-xs text-app-muted capitalize opacity-70">
                {(settings.textSize || 'default') === 'xl' ? 'Extra Large' : (settings.textSize || 'default') === 'compact' ? 'Compact' : (settings.textSize || 'default')}
              </span>
            </div>
            <div className="flex items-center gap-4 px-1 py-2">
              <span className="text-xs font-serif italic text-app-muted">A</span>
              <div className="flex-1 flex justify-between relative">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-app-border-light -translate-y-1/2 z-0" />
                {['compact', 'small', 'default', 'large', 'xl'].map((s) => (
                  <button
                    key={s}
                    onClick={() => updateSetting('textSize', s)}
                    className={`w-5 h-5 rounded-full flex items-center justify-center z-10 transition-all ${(settings.textSize || 'default') === s ? 'bg-app-primary scale-125 shadow-md ring-4 ring-app-primary/20' : 'bg-app-panel border-2 border-app-border-light drop-shadow-sm hover:scale-110'}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${(settings.textSize || 'default') === s ? 'bg-white' : 'bg-app-muted/30'}`} />
                  </button>
                ))}
              </div>
              <span className="text-xl font-serif italic text-app-muted">A</span>
            </div>
          </div>
          <div className="p-4 border-b border-app-border-light flex items-center justify-between">
            <span className="font-bold text-app-text">Currency</span>
            <div className="flex gap-2">
              {['PKR', 'USD', 'INR', 'EUR'].map(cur => (
                <button 
                  key={cur}
                  onClick={() => updateSetting('currency', cur)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${settings.currency === cur ? 'bg-app-primary text-app-panel' : 'bg-app-panel text-app-muted hover:text-app-text'}`}
                >
                  {cur}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-bold text-app-text flex items-center gap-2">
                <Bell size={16} className="text-app-primary" /> Notifications
              </span>
              <span className="text-xs text-app-muted mt-1">Push alerts for new expenses</span>
            </div>
            <button 
              onClick={() => updateSetting('notificationsEnabled', !settings.notificationsEnabled)}
              className={`w-12 h-6 rounded-full relative transition-colors ${settings.notificationsEnabled ? 'bg-app-primary' : 'bg-app-border'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.notificationsEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>

        {/* Security & Privacy */}
        <h3 className="font-bold uppercase tracking-wider text-[10px] text-app-muted px-2 mb-3 mt-6">Security & Privacy</h3>
        <div className="bg-app-card rounded-[24px] border border-app-border-light overflow-hidden shadow-sm flex flex-col">
          <div className="p-4 border-b border-app-border-light flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-bold text-app-text flex items-center gap-2">
                <KeyRound size={16} className="text-app-primary" /> Enable PIN Lock
              </span>
              <span className="text-xs text-app-muted mt-1">Require 4-digit PIN to open app</span>
            </div>
            <button 
              onClick={() => {
                if (security.pinCode) {
                  setPin(null);
                  toggleBiometric(false); // Disable biometric if no pin
                } else {
                  setShowPinSetup(true);
                }
              }}
              className={`w-12 h-6 rounded-full relative transition-colors ${security.pinCode !== null ? 'bg-app-primary' : 'bg-app-border'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${security.pinCode !== null ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className={`p-4 flex items-center justify-between transition-opacity ${security.pinCode === null ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex flex-col">
              <span className="font-bold text-app-text flex items-center gap-2">
                <Fingerprint size={16} className="text-app-primary" /> Fingerprint / FaceID
              </span>
              <span className="text-xs text-app-muted mt-1">Unlock using biometrics</span>
            </div>
            <button 
              onClick={() => toggleBiometric(!security.biometricEnabled)}
              className={`w-12 h-6 rounded-full relative transition-colors ${security.biometricEnabled ? 'bg-app-primary' : 'bg-app-border'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${security.biometricEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>

        {/* Roommates */}
        <h3 className="font-bold uppercase tracking-wider text-[10px] text-app-muted px-2 mb-3 mt-6">Members</h3>
        <div className="bg-app-card rounded-[24px] border border-app-border-light overflow-hidden shadow-sm">
          <button
            onClick={() => { onClose(); onOpenRoommates(); }}
            className="w-full p-4 flex items-center justify-between hover:bg-app-hover transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-app-panel rounded-xl text-app-primary">
                <Users size={18} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-app-text">Manage Members</span>
                <span className="text-xs text-app-muted mt-1">Add, edit, or remove</span>
              </div>
            </div>
            <ChevronRight size={20} className="text-app-muted" />
          </button>
        </div>

        {/* Data Manage */}
        <h3 className="font-bold uppercase tracking-wider text-[10px] text-app-muted px-2 mb-3 mt-6">Data Manage</h3>
        <div className="bg-app-card rounded-[24px] border border-app-border-light overflow-hidden shadow-sm">
          <button
            onClick={() => setShowManageData(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-app-hover transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-app-panel rounded-xl text-app-primary">
                <Database size={18} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-app-text">Manage Data</span>
                <span className="text-xs text-app-muted mt-1">Export, import, or clear</span>
              </div>
            </div>
            <ChevronRight size={20} className="text-app-muted" />
          </button>
        </div>

        {/* Support & About */}
        <h3 className="font-bold uppercase tracking-wider text-[10px] text-app-muted px-2 mb-3 mt-6">Support & About</h3>
        <div className="bg-app-card rounded-[24px] border border-app-border-light overflow-hidden shadow-sm">
          <button
            onClick={() => setShowAbout(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-app-hover transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-app-panel rounded-xl text-app-primary">
                <Info size={18} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-app-text">About splitit.</span>
                <span className="text-xs text-app-muted mt-1">Version, privacy, and credits</span>
              </div>
            </div>
            <ChevronRight size={20} className="text-app-muted" />
          </button>
        </div>
      </div>
      
      {/* About RoomSplit Screen */}
      {showAbout && (
        <div className="absolute inset-0 bg-app-bg z-40 flex flex-col animate-in slide-in-from-right duration-200 overflow-y-auto max-h-screen">
          <div className="px-5 py-6 flex items-center border-b border-app-border bg-app-bg shadow-sm gap-3 sticky top-0 z-50">
            <button onClick={() => setShowAbout(false)} className="p-2 -ml-2 text-app-muted hover:text-app-text transition-colors">
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-2xl font-serif italic text-app-primary">About</h2>
          </div>
          <div className="p-5 flex flex-col gap-4 mb-4">
            <div className="bg-app-card rounded-[24px] border border-app-border-light overflow-hidden shadow-sm flex flex-col p-6 items-center text-center">
               <div className="w-16 h-16 rounded-2xl bg-app-panel flex items-center justify-center text-app-primary mb-4 shadow-sm">
                  <Home size={32} />
               </div>
               <h4 className="text-[32.25px] font-sans font-bold italic tracking-tighter text-app-text transition-colors">Split<span className="text-app-primary">it</span><span className="text-app-accent">.</span></h4>
               <span className="text-xs text-app-muted mt-1 font-medium">Version 1.0.0 (Stable)</span>
               
               <p className="text-sm border-t border-app-border-light pt-4 mt-4 text-app-text leading-relaxed">
                 splitit. is a privacy-first utility designed for fair shared living. Built for members who value elegance and data security.
               </p>
            </div>

            <div className="bg-app-card rounded-[24px] border border-app-border-light overflow-hidden shadow-sm flex flex-col p-5">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-app-primary/10 rounded-xl text-app-primary shrink-0">
                  <Shield size={24} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-app-text mb-1">100% Offline Architecture</span>
                  <p className="text-xs text-app-muted leading-relaxed">
                    Your financial data never leaves this device. No cloud, no trackers, no compromises.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-app-card rounded-[24px] border border-app-border-light overflow-hidden shadow-sm flex flex-col p-5">
              <span className="font-bold text-app-text mb-1">Designed & Engineered by</span>
              <span className="font-serif italic text-lg text-app-primary mb-4">Muhammad Ali</span>

              <div className="flex gap-2 mb-4">
                <a href="https://github.com/mohd-ali10" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 flex-1 py-2.5 bg-app-panel text-app-text hover:text-app-primary rounded-xl transition-colors border border-app-border-light">
                  <Github size={18} />
                  <span className="text-xs font-bold">GitHub</span>
                </a>
                <a href="https://linkedin.com/in/mohdali1" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 flex-1 py-2.5 bg-app-panel text-app-text hover:text-app-primary rounded-xl transition-colors border border-app-border-light">
                  <Linkedin size={18} />
                  <span className="text-xs font-bold">LinkedIn</span>
                </a>
              </div>

              <div className="pt-4 border-t border-app-border-light flex flex-wrap gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-app-muted block w-full mb-1">Tech Stack</span>
                <p className="text-xs text-app-primary font-medium bg-app-panel px-2 py-1.5 rounded-lg border border-app-border-light">React</p>
                <p className="text-xs text-app-primary font-medium bg-app-panel px-2 py-1.5 rounded-lg border border-app-border-light">TypeScript</p>
                <p className="text-xs text-app-primary font-medium bg-app-panel px-2 py-1.5 rounded-lg border border-app-border-light">Tailwind</p>
                <p className="text-xs text-app-primary font-medium bg-app-panel px-2 py-1.5 rounded-lg border border-app-border-light">Framer Motion</p>
              </div>
            </div>

            <a href="mailto:m.aleejee.007@gmail.com?subject=splitit. Feedback - v1.0.0" className="w-full bg-app-card rounded-[24px] border border-app-border-light shadow-sm flex items-center justify-center gap-2 p-5 text-app-primary hover:brightness-95 transition-colors font-bold group mb-10">
              <Mail size={18} className="group-hover:scale-110 transition-transform" />
              Send Feedback
            </a>
          </div>
        </div>
      )}

      {/* Manage Data Screen */}
      {showManageData && (
        <div className="absolute inset-0 bg-app-bg z-40 flex flex-col animate-in slide-in-from-right duration-200 overflow-y-auto max-h-screen">
          <div className="px-5 py-6 flex items-center border-b border-app-border bg-app-bg shadow-sm gap-3 sticky top-0 z-50">
            <button onClick={() => setShowManageData(false)} className="p-2 -ml-2 text-app-muted hover:text-app-text transition-colors">
              <ChevronLeft size={24} />
            </button>
            <h2 className="text-2xl font-serif italic text-app-primary">Manage Data</h2>
          </div>

          <div className="p-5 flex flex-col gap-4 mb-4">
            <div className="bg-app-card rounded-[24px] border border-app-border-light overflow-hidden shadow-sm flex flex-col p-5">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-app-primary/10 rounded-xl text-app-primary shrink-0">
                  <Shield size={24} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-app-text mb-1">Local Privacy Guard</span>
                  <p className="text-xs text-app-muted leading-relaxed">
                    All your expenses and member records are stored securely on this device. We do not use any servers or external databases. Use the tools below to export, import, or clear your local records.
                  </p>
                </div>
              </div>
            </div>

            <h3 className="font-bold uppercase tracking-wider text-[10px] text-app-muted px-2 mt-2">Data Operations</h3>
            <div className="bg-app-card rounded-[24px] border border-app-border-light overflow-hidden shadow-sm flex flex-col">
              <button
                onClick={handleExport}
                className="w-full p-5 flex items-center justify-between border-b border-app-border-light hover:bg-app-hover transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Download size={20} className="text-app-primary" />
                  <div className="flex flex-col">
                    <span className="font-bold text-app-text">Export Data</span>
                    <span className="text-xs text-app-muted mt-1">Download backup file to JSON</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-app-muted/50" />
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-5 flex items-center justify-between border-b border-app-border-light hover:bg-app-hover transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Upload size={20} className="text-app-primary" />
                  <div className="flex flex-col">
                    <span className="font-bold text-app-text">Import Data</span>
                    <span className="text-xs text-app-muted mt-1">Restore your app from a JSON backup</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-app-muted/50" />
              </button>

              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-full p-5 flex items-center justify-between border-b border-app-border-light hover:bg-red-500/5 transition-colors text-left group"
              >
                <div className="flex items-center gap-3 text-red-500">
                  <AlertTriangle size={20} />
                  <div className="flex flex-col">
                    <span className="font-bold">Clear All Data</span>
                    <span className="text-xs opacity-70 mt-1 line-clamp-1">Permanently reset and delete everything</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-red-500/50" />
              </button>

              <button
                onClick={() => {
                  useAppStore.getState().resetOnboarding();
                  setShowManageData(false);
                  onClose();
                }}
                className="w-full p-5 flex items-center justify-between hover:bg-app-hover transition-colors text-left group"
              >
                <div className="flex items-center gap-3 text-app-primary">
                  <Home size={20} />
                  <div className="flex flex-col">
                    <span className="font-bold text-app-text">Reset Onboarding</span>
                    <span className="text-xs text-app-muted mt-1 line-clamp-1">Show the welcome screen onboarding flow</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-app-primary/50" />
              </button>
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>
      )}
      
      {/* PIN Setup Modal */}
      {showPinSetup && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-app-bg w-full max-w-sm rounded-[32px] p-6 shadow-2xl flex flex-col gap-6 animate-in zoom-in-95 duration-200 text-center items-center">
            <div className="w-16 h-16 rounded-full bg-app-panel text-app-primary flex items-center justify-center shadow-inner">
              <KeyRound size={32} />
            </div>
            <h3 className="font-serif italic text-2xl font-bold text-app-primary">Set 4-Digit PIN</h3>
            <p className="text-app-text font-medium text-sm">Please enter a new PIN for app protection.</p>
            
            <div className={`flex gap-3 mb-2`}>
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full transition-colors duration-200 ${
                    i < pinTemp.length ? 'bg-app-primary' : 'bg-app-border'
                  }`}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 w-full">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  onClick={() => {
                    const newPin = pinTemp + num;
                    if (newPin.length <= 4) {
                      setPinTemp(newPin);
                      if (newPin.length === 4) {
                        setTimeout(() => {
                          setPin(newPin);
                          setPinTemp('');
                          setShowPinSetup(false);
                        }, 300);
                      }
                    }
                  }}
                  className="h-14 rounded-2xl bg-app-card border border-app-border-light text-xl font-bold hover:bg-app-primary/10 transition-colors"
                >
                  {num}
                </button>
              ))}
              <button onClick={() => setShowPinSetup(false)} className="h-14 rounded-2xl bg-app-card border border-app-border-light text-app-muted hover:text-red-500 font-bold transition-colors">
                Cancel
              </button>
              <button
                onClick={() => {
                  const newPin = pinTemp + '0';
                  if (newPin.length <= 4) {
                    setPinTemp(newPin);
                    if (newPin.length === 4) {
                      setTimeout(() => {
                        setPin(newPin);
                        setPinTemp('');
                        setShowPinSetup(false);
                      }, 300);
                    }
                  }
                }}
                className="h-14 rounded-2xl bg-app-card border border-app-border-light text-xl font-bold hover:bg-app-primary/10 transition-colors"
              >
                0
              </button>
              <button onClick={() => setPinTemp(prev => prev.slice(0, -1))} className="h-14 rounded-2xl bg-app-card border border-app-border-light text-app-muted hover:text-app-text transition-colors flex items-center justify-center">
                <Delete size={24} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Confirmation Modal */}
      {pendingImportData && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setPendingImportData(null); }}>
          <div className="bg-app-bg w-full max-w-sm rounded-[32px] p-6 shadow-2xl flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <h3 className="font-serif italic text-2xl font-bold text-app-primary">Overwrite Data?</h3>
            <p className="text-app-text font-medium">This will overwrite all your current groups, expenses, and members. Are you sure you want to continue?</p>
            <div className="flex gap-3 mt-2">
              <button 
                onClick={() => setPendingImportData(null)}
                className="flex-1 py-4 bg-app-panel text-app-text font-bold rounded-xl transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={confirmImport}
                className="flex-1 py-4 bg-app-primary text-app-panel font-bold rounded-xl transition-colors shadow-sm"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowClearConfirm(false); }}>
          <div className="bg-app-bg w-full max-w-sm rounded-[32px] p-6 shadow-2xl flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <h3 className="font-serif italic text-2xl font-bold text-red-500 flex items-center gap-2">
              <AlertTriangle size={24} /> 
              Clear Data?
            </h3>
            <p className="text-app-text font-medium">This will permanently delete ALL groups, expenses, and settings across your entire app. You cannot undo this action.</p>
            <div className="flex gap-3 mt-2">
              <button 
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-4 bg-app-panel text-app-text font-bold rounded-xl transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  storage.clearAllData();
                  onDataImported(); // triggers a reset across app
                  onClose();
                }}
                className="flex-1 py-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-sm"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast/Modal */}
      {errorMsg && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-center" onClick={(e) => { if (e.target === e.currentTarget) setErrorMsg(''); }}>
          <div className="bg-app-bg w-full max-w-sm rounded-[32px] p-6 shadow-2xl flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <h3 className="font-serif italic text-2xl font-bold text-red-500">Error</h3>
            <p className="text-app-text font-medium">{errorMsg}</p>
            <button 
              onClick={() => setErrorMsg('')}
              className="mt-2 py-4 bg-app-panel text-app-text font-bold rounded-xl transition-colors shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
