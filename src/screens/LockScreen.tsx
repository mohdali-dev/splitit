import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Fingerprint, Delete } from 'lucide-react';

export default function LockScreen() {
  const [pinInput, setPinInput] = useState('');
  const { security, unlockApp } = useAppStore();
  const [error, setError] = useState(false);

  const triggerBiometric = async () => {
    if (window.PublicKeyCredential) {
      try {
        // Mocking WebAuthn for simplicity assuming client-only constraints
        const mockAuth = window.confirm('Authenticate with Biometrics?');
        if (mockAuth) {
          unlockApp();
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      alert('Biometrics not supported on this device.');
    }
  };

  useEffect(() => {
    if (security.biometricEnabled) {
      // Auto trigger on mount
      // We wrap it in a microtask to avoid immediate render blocking issues
      setTimeout(triggerBiometric, 100);
    }
  }, [security.biometricEnabled]);

  const handleKeyClick = (num: string) => {
    if (pinInput.length < 4) {
      const newPin = pinInput + num;
      setPinInput(newPin);
      if (newPin.length === 4) {
        if (newPin === security.pinCode) {
          unlockApp();
        } else {
          setError(true);
          setTimeout(() => {
            setPinInput('');
            setError(false);
          }, 400);
        }
      }
    }
  };

  const handleDelete = () => {
    setPinInput(prev => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-app-bg text-app-text">
      <div className="mb-12 flex flex-col items-center">
        <h1 className="text-[32.25px] font-sans font-bold italic tracking-tighter text-app-text transition-colors">Split<span className="text-app-primary">it</span><span className="text-app-accent">.</span></h1>
        <p className="text-sm font-medium tracking-widest uppercase text-app-muted mt-2">Enter PIN</p>
      </div>

      <div className={`flex gap-4 mb-20 ${error ? 'animate-pulse' : ''}`}>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-colors duration-200 ${
              i < pinInput.length ? 'bg-app-primary' : 'bg-app-border'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-x-8 gap-y-6 w-full max-w-[280px] mb-8">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleKeyClick(num.toString())}
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-medium bg-app-card shadow-sm border border-app-border text-app-text hover:bg-app-primary hover:text-app-text-inv transition-colors active:scale-95 place-self-center"
          >
            {num}
          </button>
        ))}
        
        <div className="flex items-center justify-center pointer-events-none"></div>

        <button
          onClick={() => handleKeyClick('0')}
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-medium bg-app-card shadow-sm border border-app-border text-app-text hover:bg-app-primary hover:text-app-text-inv transition-colors active:scale-95 place-self-center"
        >
          0
        </button>

        <div className="flex items-center justify-center">
          <button
            onClick={handleDelete}
            className="w-16 h-16 rounded-full flex items-center justify-center text-app-text hover:bg-app-border transition-colors active:scale-95"
          >
            <Delete size={28} />
          </button>
        </div>
      </div>

      {security.biometricEnabled && (
        <button
          onClick={triggerBiometric}
          className="mt-6 p-4 rounded-full text-app-primary hover:bg-app-primary/10 transition-colors active:scale-95 flex flex-col items-center gap-2"
        >
          <Fingerprint size={42} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
