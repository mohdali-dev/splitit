import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Pencil, Users, Check, Receipt, Sparkles, Building2, Plane, Briefcase, Hash } from 'lucide-react';
import { storage } from '../services/storage';
import { Group, GroupCategory } from '../models/types';
import { motion } from 'framer-motion';

interface Props {
  key?: string;
  onClose: () => void;
  onGroupSwitched: () => void;
}

const CATEGORY_ICONS: Record<GroupCategory, any> = {
  'Home': Building2,
  'Travel': Plane,
  'Office': Briefcase,
  'Other': Hash
};

const THEME_COLORS = [
  '#4A5D4E', // Forest
  '#BC6C25', // Rust
  '#4A6984', // Ocean
  '#844A5C', // Berry
  '#6B705C', // Olive
  '#A67C52', // Earth
];

export default function GroupsScreen({ onClose, onGroupSwitched }: Props) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string>('');
  const [newGroupName, setNewGroupName] = useState('');
  
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<GroupCategory>('Home');
  const [editThemeColor, setEditThemeColor] = useState<string>('#4A5D4E');

  useEffect(() => {
    setGroups(storage.getGroups());
    setActiveGroupId(storage.getActiveGroupId());
  }, []);

  const handleClose = () => {
    onClose();
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    
    const newGroup: Group = {
      id: crypto.randomUUID(),
      name: newGroupName.trim(),
      category: 'Other',
      themeColor: THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)],
      roommates: ['Alice', 'Bob'], // default roommates
      expenses: [],
      settlements: [],
      createdAt: new Date().toISOString()
    };
    
    storage.saveGroup(newGroup);
    storage.setActiveGroupId(newGroup.id);
    setNewGroupName('');
    setGroups(storage.getGroups());
    setActiveGroupId(newGroup.id);
    onGroupSwitched();
    onClose();
  };

  const handleSwitchGroup = (id: string) => {
    if (activeGroupId === id) return;
    storage.setActiveGroupId(id);
    setActiveGroupId(id);
    onGroupSwitched();
    onClose();
  };

  const openEditModal = (e: React.MouseEvent, g: Group) => {
    e.stopPropagation();
    setEditingGroup(g);
    setEditName(g.name);
    setEditCategory(g.category as GroupCategory || 'Other');
    setEditThemeColor(g.themeColor || '#4A5D4E');
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteGroupClick = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteGroup = () => {
    if (!editingGroup) return;
    storage.deleteGroup(editingGroup.id);
    setGroups(storage.getGroups());
    setActiveGroupId(storage.getActiveGroupId());
    onGroupSwitched();
    closeEditModal();
    setShowDeleteConfirm(false);
  };

  const closeEditModal = () => {
    setEditingGroup(null);
    setShowDeleteConfirm(false);
  };

  const handleSaveEdit = () => {
    if (!editingGroup || !editName.trim()) return;
    const updated = { ...editingGroup, name: editName.trim(), category: editCategory, themeColor: editThemeColor };
    storage.saveGroup(updated);
    setGroups(storage.getGroups());
    if (activeGroupId === updated.id) {
       onGroupSwitched(); // refresh app context
    }
    closeEditModal();
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleEditBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeEditModal();
    }
  };

  const handleDeleteBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setShowDeleteConfirm(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-sm" 
      onClick={handleCloseClick}
    >
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="bg-app-bg w-full rounded-t-[32px] flex flex-col max-h-[90dvh] shadow-2xl border-t border-app-border-light"
      >
        {/* Grab Handle */}
        <div className="w-full flex justify-center py-4 pb-2" onClick={handleCloseClick}>
          <div className="pointer-events-none w-12 h-1.5 bg-app-border rounded-full" />
        </div>

        <div className="px-6 pb-4 flex items-center gap-3">
          <button onClick={handleClose} className="p-2 -ml-2 text-app-muted hover:text-app-text transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-3xl font-serif text-app-primary italic tracking-tight">Spaces</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8">
          <div className="flex flex-col gap-4 mb-8">
            {groups.map(g => {
              const isActive = activeGroupId === g.id;
              const CatIcon = CATEGORY_ICONS[g.category as GroupCategory] || Hash;
              return (
                <div 
                  key={g.id} 
                  onClick={() => handleSwitchGroup(g.id)}
                  className={`relative overflow-hidden flex flex-col p-6 rounded-[28px] cursor-pointer transition-all duration-300 ${
                    isActive 
                      ? 'bg-app-primary text-app-panel shadow-lg scale-[1.02] ring-4 ring-app-primary/20' 
                      : 'bg-app-card border border-app-border hover:border-app-primary/50 text-app-text hover:bg-app-panel shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4 pr-16">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isActive ? 'bg-app-panel/20 text-app-panel' : 'bg-app-panel text-app-primary border border-app-border-light'}`}>
                        <CatIcon size={20} />
                      </div>
                      <h3 className={`font-serif italic text-2xl font-bold truncate ${isActive ? 'text-app-panel' : 'text-app-primary'}`}>{g.name}</h3>
                    </div>
                  </div>
                  
                  {isActive && (
                    <div className="absolute top-6 right-16 bg-app-panel/20 p-2 rounded-full backdrop-blur-sm">
                      <Check size={20} className="text-app-panel" />
                    </div>
                  )}
                  
                  <button 
                    onClick={(e) => openEditModal(e, g)}
                    className={`absolute top-5 right-5 p-2 rounded-full transition-colors ${
                      isActive 
                        ? 'text-app-panel/80 hover:text-app-panel hover:bg-app-panel/20' 
                        : 'text-app-muted hover:text-app-primary hover:bg-app-primary/10'
                    }`}
                  >
                    <Pencil size={20} />
                  </button>

                  <div className={`flex items-center gap-5 text-xs font-bold uppercase tracking-wider ${isActive ? 'text-app-panel/80' : 'text-app-muted'}`}>
                    <div className="flex items-center gap-2">
                      <Users size={16} />
                      <span>{g.roommates?.length || 0}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Receipt size={16} />
                      <span>{g.expenses?.length || 0}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-app-panel p-6 rounded-[28px] border-2 border-dashed border-app-border-light relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-app-primary/5 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="flex items-center gap-2 text-app-primary mb-5 relative z-10">
              <Sparkles size={20} />
              <h3 className="font-serif italic text-xl font-bold">New Space</h3>
            </div>
            
            <div className="flex bg-app-bg rounded-2xl border border-app-border focus-within:border-app-primary transition-all pr-2 relative z-10 shadow-sm focus-within:shadow-md">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="E.g., Apartment, Murree Trip..."
                className="flex-1 bg-transparent px-5 py-4 outline-none text-app-text placeholder:text-app-muted font-bold text-base"
                onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
              />
              <button 
                onClick={handleAddGroup}
                disabled={!newGroupName.trim()}
                className="my-2 p-2.5 bg-app-primary text-app-panel rounded-xl disabled:opacity-40 disabled:bg-app-muted hover:brightness-110 transition-colors shadow-sm active:scale-95"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Edit Modal */}
      {editingGroup && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={handleEditBackdropClick}>
          <div className="bg-app-bg w-full max-w-sm rounded-[32px] p-6 shadow-2xl flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <button onClick={closeEditModal} className="p-2 -ml-2 text-app-muted hover:text-app-text transition-colors">
                <ChevronLeft size={24} />
              </button>
              <h3 className="font-serif italic text-2xl font-bold text-app-primary">Edit Space</h3>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold uppercase tracking-wider text-app-muted">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-app-panel border border-app-border rounded-xl px-4 py-3 text-app-text outline-none focus:border-app-primary transition-colors font-bold"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold uppercase tracking-wider text-app-muted">Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Home', 'Travel', 'Office', 'Other'] as GroupCategory[]).map(cat => {
                    const Icon = CATEGORY_ICONS[cat];
                    const isSelected = editCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setEditCategory(cat)}
                        className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                          isSelected 
                            ? 'bg-app-primary/10 border-app-primary text-app-primary' 
                            : 'bg-app-panel border-app-border text-app-muted hover:border-app-primary/50'
                        }`}
                      >
                        <Icon size={18} />
                        <span className="font-bold">{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <label className="text-sm font-bold uppercase tracking-wider text-app-muted">Theme Color</label>
                <div className="flex gap-3">
                  {THEME_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setEditThemeColor(color)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${editThemeColor === color ? 'ring-2 ring-offset-2 ring-offset-app-bg ring-app-primary scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: color }}
                    >
                      {editThemeColor === color && <Check size={16} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <button
                onClick={handleSaveEdit}
                disabled={!editName.trim()}
                className="w-full py-4 bg-app-primary text-app-panel font-bold rounded-xl disabled:opacity-50 hover:brightness-110 transition-colors shadow-sm"
              >
                Save Changes
              </button>
              
              {groups.length > 1 && (
                <button
                  onClick={handleDeleteGroupClick}
                  className="w-full py-4 bg-red-500/10 text-red-500 font-bold rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                >
                  Delete Space
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={handleDeleteBackdropClick}>
          <div className="bg-app-bg w-full max-w-sm rounded-[32px] p-6 shadow-2xl flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <h3 className="font-serif italic text-2xl font-bold text-red-500">Delete Space?</h3>
            <p className="text-app-text font-medium">This will permanently delete all expenses and member data for this group. Are you sure you want to continue?</p>
            <div className="flex gap-3 mt-2">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-4 bg-app-panel text-app-text font-bold rounded-xl transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteGroup}
                className="flex-1 py-4 bg-red-500 text-white font-bold rounded-xl transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
