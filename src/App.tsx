/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Home, List, Calculator, Plus, Users, Settings, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import HomeScreen from './screens/HomeScreen';
import AddExpenseScreen from './screens/AddExpenseScreen';
import ExpenseListScreen from './screens/ExpenseListScreen';
import SplitScreen from './screens/SplitScreen';
import RoommatesScreen from './screens/RoommatesScreen';
import SettingsScreen from './screens/SettingsScreen';
import GroupsScreen from './screens/GroupsScreen';
import LockScreen from './screens/LockScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import { Expense } from './models/types';
import { storage } from './services/storage';
import { useAppStore } from './store';

type Screen = 'home' | 'add' | 'list' | 'split' | 'roommates' | 'settings' | 'groups';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [settings, setSettings] = useState(storage.getSettings());
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>(undefined);
  const [activeGroupName, setActiveGroupName] = useState('');
  const [activeGroupId, setActiveGroupId] = useState('');
  const [isSwitchingSpace, setIsSwitchingSpace] = useState(false);
  const { security, isFirstLaunch } = useAppStore();

  useEffect(() => {
    let isDark = false;
    if (settings.theme === 'dark') {
      isDark = true;
    } else if (settings.theme === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const sizeMap = {
      compact: '12.5px',
      small: '14px',
      default: '16px',
      large: '18px',
      xl: '20px'
    };
    const size = settings.textSize || 'default';
    document.documentElement.style.setProperty('--base-font-size', sizeMap[size]);
    document.documentElement.style.fontSize = `var(--base-font-size)`;
  }, [settings.theme, settings.textSize]);

  useEffect(() => {
    const groups = storage.getGroups();
    const id = storage.getActiveGroupId();
    const active = groups.find(g => g.id === id);
    
    if (active) {
      setActiveGroupName(active.name);
      if (active.themeColor) {
        document.documentElement.style.setProperty('--app-primary', active.themeColor);
      } else {
        document.documentElement.style.removeProperty('--app-primary');
      }
    }

    if (activeGroupId && id !== activeGroupId) {
      setIsSwitchingSpace(true);
      setTimeout(() => {
        setIsSwitchingSpace(false);
        setActiveGroupId(id);
      }, 150);
    } else {
      setActiveGroupId(id);
    }
  }, [refreshTrigger]);

  const navigateTo = (screen: Screen) => {
    if (screen === 'add') setEditingExpense(undefined);
    setCurrentScreen(screen);
  };
  
  const onExpenseAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    setCurrentScreen('home');
    setEditingExpense(undefined);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setCurrentScreen('add');
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-app-bg text-app-text font-sans overflow-hidden relative shadow-2xl md:border-x border-app-border transition-colors duration-300">
      <AnimatePresence>
        {isFirstLaunch && <OnboardingScreen />}
      </AnimatePresence>
      {security.isLocked && !isFirstLaunch && <LockScreen />}
      {/* Header */}
      <header className="bg-app-bg px-5 py-6 z-10 flex-shrink-0 flex items-end justify-between border-b border-app-border transition-colors duration-300">
        <div className="flex flex-col group cursor-pointer" onClick={() => navigateTo('groups')}>
          <h1 className="text-[32.25px] font-sans font-bold italic tracking-tighter text-app-text transition-colors">Split<span className="text-app-primary">it</span><span className="text-app-accent">.</span></h1>
          <div className="flex items-center gap-1 mt-1 text-app-muted group-hover:text-app-text transition-colors">
            <p className="text-[10px] tracking-widest uppercase font-bold italic">{activeGroupName || 'Loading...'}</p>
            <ChevronDown size={12} />
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => navigateTo('roommates')} 
            className="w-10 h-10 rounded-full bg-app-primary/10 text-app-primary hover:bg-app-primary hover:text-app-text-inv flex items-center justify-center border border-app-primary/25 hover:border-transparent transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 cursor-pointer"
            title="Manage Members"
          >
            <Users size={18} strokeWidth={2.2} />
          </button>
          <button onClick={() => navigateTo('settings')} className="w-10 h-10 rounded-full border-2 border-app-bg bg-app-panel flex items-center justify-center text-app-primary hover:bg-app-border transition-colors">
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-app-bg transition-colors duration-300">
        <AnimatePresence mode="wait">
          {isSwitchingSpace ? (
            <motion.div 
              key="loading-shimmer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col p-6 gap-6"
            >
               <div className="h-32 w-full bg-app-panel animate-pulse rounded-[32px] opacity-70" />
               <div className="h-16 w-full bg-app-panel animate-pulse rounded-[24px] opacity-70" />
               <div className="h-48 w-full bg-app-panel animate-pulse rounded-[32px] opacity-70" />
            </motion.div>
          ) : (
            <motion.div
              key={activeGroupId + (['home', 'list', 'split'].includes(currentScreen) ? currentScreen : 'home')}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="min-h-full"
            >
              {['home', 'list', 'split'].includes(currentScreen) ? (
                <>
                  {currentScreen === 'home' && <HomeScreen refreshTrigger={refreshTrigger} onEditExpense={handleEditExpense} />}
                  {currentScreen === 'list' && <ExpenseListScreen refreshTrigger={refreshTrigger} onEditExpense={handleEditExpense} />}
                  {currentScreen === 'split' && <SplitScreen refreshTrigger={refreshTrigger} />}
                </>
              ) : (
                <HomeScreen refreshTrigger={refreshTrigger} onEditExpense={handleEditExpense} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlays */}
        <AnimatePresence>
          {currentScreen === 'add' && <AddExpenseScreen key="add" onSaved={onExpenseAdded} onCancel={() => navigateTo('home')} expenseToEdit={editingExpense} />}
          {currentScreen === 'roommates' && <RoommatesScreen key="rm" onClose={() => { setRefreshTrigger(prev => prev + 1); navigateTo('home'); }} />}
          {currentScreen === 'groups' && <GroupsScreen key="gr" onClose={() => navigateTo('home')} onGroupSwitched={() => { setRefreshTrigger(prev => prev + 1); }} />}
          {currentScreen === 'settings' && <SettingsScreen key="se" onClose={() => navigateTo('home')} onDataImported={() => { setRefreshTrigger(prev => prev + 1); navigateTo('home'); }} onSettingsChanged={() => { setSettings(storage.getSettings()); setRefreshTrigger(prev => prev + 1); }} onOpenRoommates={() => navigateTo('roommates')} />}
        </AnimatePresence>
      </main>

      {/* Floating Action Button */}
      {(currentScreen === 'home' || currentScreen === 'list' || currentScreen === 'split') && (
        <div className="absolute right-6 bottom-24 z-30">
            <button 
              onClick={() => navigateTo('add')}
              className="bg-app-primary hover:brightness-110 text-app-text-inv p-4 rounded-full shadow-lg shadow-app-primary/30 transition-all active:scale-95 flex items-center justify-center">
              <Plus size={24} strokeWidth={2.5} />
            </button>
        </div>
      )}

      {/* Bottom Navigation */}
      {(currentScreen !== 'add' && currentScreen !== 'roommates' && currentScreen !== 'settings' && currentScreen !== 'groups') && (
        <nav className="bg-app-card border border-app-border-light rounded-[32px] flex justify-around items-center py-2 px-3 z-20 pb-[max(env(safe-area-inset-bottom),0.5rem)] shadow-[0_-4px_12px_rgba(0,0,0,0.03)] transition-colors duration-300 flex-shrink-0 m-3 mt-0">
          <button 
            onClick={() => navigateTo('home')} 
            className={`relative flex flex-col items-center justify-center w-full py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
              currentScreen === 'home' 
                ? 'text-app-primary font-extrabold' 
                : 'text-app-muted hover:text-app-primary'
            }`}
          >
            <div className="relative flex flex-col items-center pt-0.5">
              <Home size={22} strokeWidth={currentScreen === 'home' ? 2.5 : 2} className="transition-all duration-200" />
              <span className="text-[10px] tracking-wider uppercase mt-1.5 font-bold">Home</span>
              {currentScreen === 'home' && (
                <motion.div 
                  layoutId="activeTabIndicator" 
                  className="absolute -bottom-1.5 w-6 h-0.5 bg-app-primary rounded-full" 
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </div>
          </button>
          
          <button 
            onClick={() => navigateTo('list')} 
            className={`relative flex flex-col items-center justify-center w-full py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
              currentScreen === 'list' 
                ? 'text-app-primary font-extrabold' 
                : 'text-app-muted hover:text-app-primary'
            }`}
          >
            <div className="relative flex flex-col items-center pt-0.5">
              <List size={22} strokeWidth={currentScreen === 'list' ? 2.5 : 2} className="transition-all duration-200" />
              <span className="text-[10px] tracking-wider uppercase mt-1.5 font-bold">Log</span>
              {currentScreen === 'list' && (
                <motion.div 
                  layoutId="activeTabIndicator" 
                  className="absolute -bottom-1.5 w-6 h-0.5 bg-app-primary rounded-full" 
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </div>
          </button>
          
          <button 
            onClick={() => navigateTo('split')} 
            className={`relative flex flex-col items-center justify-center w-full py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
              currentScreen === 'split' 
                ? 'text-app-primary font-extrabold' 
                : 'text-app-muted hover:text-app-primary'
            }`}
          >
            <div className="relative flex flex-col items-center pt-0.5">
              <Calculator size={22} strokeWidth={currentScreen === 'split' ? 2.5 : 2} className="transition-all duration-200" />
              <span className="text-[10px] tracking-wider uppercase mt-1.5 font-bold">Split</span>
              {currentScreen === 'split' && (
                <motion.div 
                  layoutId="activeTabIndicator" 
                  className="absolute -bottom-1.5 w-6 h-0.5 bg-app-primary rounded-full" 
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </div>
          </button>
        </nav>
      )}
    </div>
  );
}
