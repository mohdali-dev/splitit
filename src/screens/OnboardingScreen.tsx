import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store';

const AVATARS = ['😎', '🦄', '🐱', '🐶', '🦊', '👽'];

export default function OnboardingScreen() {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const { completeOnboarding } = useAppStore();

  const handleStart = () => {
    if (name.trim()) {
      completeOnboarding({ name: name.trim(), avatar: selectedAvatar });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute inset-0 bg-app-bg text-app-text overflow-hidden z-[200] flex flex-col"
    >
      <div className="flex flex-col justify-center items-center flex-1 p-8">
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.6, ease: "easeOut" }}
           className="text-center mb-12"
        >
          <h1 className="text-[32.25px] font-sans font-bold italic tracking-tighter text-app-text transition-colors">
            Split<span className="text-app-primary">it</span><span className="text-app-accent">.</span>
          </h1>
          <p className="text-app-muted tracking-widest uppercase text-[10px] font-bold mt-4">
            The way to share expenses
          </p>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
           className="w-full flex flex-col gap-8"
        >
          <div className="flex flex-col gap-2">
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-app-card border border-app-border rounded-2xl p-4 text-center text-xl font-bold shadow-sm focus:outline-none focus:border-app-primary text-app-text transition-colors"
            />
          </div>

          <div className="flex flex-col gap-4 items-center">
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide w-full justify-center">
              {AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setSelectedAvatar(emoji)}
                  className={`flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-3xl transition-all duration-200 ${
                    selectedAvatar === emoji ? 'bg-app-primary/10 ring-2 ring-app-primary scale-110' : 'bg-app-border opacity-50 hover:opacity-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <button 
             onClick={handleStart}
             disabled={!name.trim()}
             className={`w-full py-4 rounded-full font-bold text-lg text-white shadow-lg transition-all ${
               name.trim() ? 'bg-app-primary hover:bg-app-primary-hover active:scale-95' : 'bg-app-border text-app-muted pointer-events-none'
             }`}
          >
            Get Started
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
