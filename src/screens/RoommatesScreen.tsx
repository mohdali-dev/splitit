import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { ChevronLeft, Users, UserPlus, Trash2 } from 'lucide-react';

export default function RoommatesScreen({ onClose }: { key?: string, onClose: () => void }) {
  const [roommates, setRoommates] = useState<string[]>([]);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    setRoommates(storage.getRoommates());
  }, []);

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const updated = [...roommates, newName.trim()];
    setRoommates(updated);
    storage.saveRoommates(updated);
    setNewName('');
  };

  const handleAddFromContacts = async () => {
    if ('contacts' in navigator) {
      try {
        // @ts-ignore
        const contacts = await navigator.contacts.select(['name'], { multiple: true });
        if (contacts && contacts.length > 0) {
          const newNames = contacts
            .map((c: any) => {
              if (Array.isArray(c.name) && c.name.length > 0) {
                return c.name[0];
              }
              return c.name;
            })
            .filter((name: any): name is string => typeof name === 'string' && name.trim().length > 0)
            .map((name: string) => name.trim());

          if (newNames.length > 0) {
            const updated = [...new Set([...roommates, ...newNames])];
            setRoommates(updated);
            storage.saveRoommates(updated);
          }
        }
      } catch (err) {
        alert('Could not access contacts. Please add manually.');
      }
    } else {
      alert('Contact Picker API is not supported on this device/browser. Please add manually.');
    }
  };

  const handleRemove = (name: string) => {
    const updated = roommates.filter(r => r !== name);
    setRoommates(updated);
    storage.saveRoommates(updated);
  };

  return (
    <div className="absolute inset-0 bg-app-bg z-30 flex flex-col animate-in slide-in-from-right duration-200">
      <div className="px-5 py-6 flex items-center border-b border-app-border bg-app-bg shadow-sm gap-3">
        <button onClick={onClose} className="p-2 -ml-2 text-app-muted hover:text-app-text transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-serif italic text-app-primary">Members</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-8">
        <div className="mb-6 space-y-3">
          <button
            onClick={handleAddFromContacts}
            className="w-full bg-app-panel text-app-primary hover:bg-app-hover border border-app-border-light rounded-2xl p-4 flex items-center justify-center gap-2 font-bold transition-colors"
          >
            <Users size={20} />
            Import from Contacts
          </button>
          
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-app-border-light"></div>
            <span className="flex-shrink-0 mx-4 text-app-muted text-xs font-bold uppercase tracking-widest">OR</span>
            <div className="flex-grow border-t border-app-border-light"></div>
          </div>

          <form onSubmit={handleAddManual} className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Enter name manually"
              className="flex-1 px-4 py-3 rounded-xl bg-app-card border border-app-border-light focus:outline-none focus:ring-2 focus:ring-app-primary text-sm text-app-text transition-shadow"
            />
            <button type="submit" className="bg-app-primary hover:brightness-110 text-app-text-inv px-4 py-3 rounded-xl transition-colors">
              <UserPlus size={20} />
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold uppercase tracking-wider text-[10px] text-app-muted px-2">Current Members</h3>
          <div className="flex flex-col gap-2">
            {roommates.map(r => (
              <div key={r} className="flex items-center justify-between p-4 bg-app-card rounded-2xl border border-app-border-light">
                <span className="font-bold text-app-text">{r}</span>
                <button onClick={() => handleRemove(r)} className="text-app-muted hover:text-red-500 transition-colors p-2 -mr-2">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {roommates.length === 0 && (
              <div className="text-center p-8 bg-app-card rounded-2xl border border-dashed border-app-border-light">
                <p className="text-app-muted text-sm font-medium">No members added yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
