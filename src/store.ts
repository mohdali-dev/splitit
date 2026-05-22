import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SecurityState {
  isLocked: boolean;
  pinCode: string | null;
  biometricEnabled: boolean;
}

interface AppStore {
  isDiscreteMode: boolean;
  toggleDiscreteMode: () => void;
  security: SecurityState;
  unlockApp: () => void;
  lockApp: () => void;
  setPin: (pin: string | null) => void;
  toggleBiometric: (enabled: boolean) => void;
  isFirstLaunch: boolean;
  currentUser: { name: string; avatar: string } | null;
  completeOnboarding: (user: { name: string; avatar: string }) => void;
  resetOnboarding: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      isDiscreteMode: false,
      toggleDiscreteMode: () => set((state) => ({ isDiscreteMode: !state.isDiscreteMode })),
      security: {
        isLocked: false,
        pinCode: null,
        biometricEnabled: false,
      },
      unlockApp: () => set((state) => ({ security: { ...state.security, isLocked: false } })),
      lockApp: () => set((state) => ({ 
        security: { 
          ...state.security, 
          isLocked: state.security.pinCode !== null 
        } 
      })),
      setPin: (pin) => set((state) => ({
        security: { ...state.security, pinCode: pin, isLocked: pin !== null }
      })),
      toggleBiometric: (enabled) => set((state) => ({
        security: { ...state.security, biometricEnabled: enabled }
      })),
      isFirstLaunch: true,
      currentUser: null,
      completeOnboarding: (user) => set({ isFirstLaunch: false, currentUser: user }),
      resetOnboarding: () => set({ isFirstLaunch: true, currentUser: null }),
    }),
    {
      name: 'roomsplit-store',
      partialize: (state) => ({
        ...state,
        security: {
          ...state.security,
          isLocked: state.security.pinCode !== null // Always lock on startup if pin exists
        }
      })
    }
  )
);
