import { Expense, Settlement, Group, AppSettings } from '../models/types';

const GROUPS_KEY = 'roomsplit_groups';
const ACTIVE_GROUP_KEY = 'roomsplit_active_group';
const SETTINGS_KEY = 'roomsplit_settings';

const defaultSettings: AppSettings = {
  theme: 'system',
  currency: 'PKR',
  notificationsEnabled: false,
  textSize: 'default',
};

// Legacy keys for migration
const EXPENSES_KEY = 'roomsplit_expenses';
const ROOMMATES_KEY = 'roomsplit_roommates';
const SETTLEMENTS_KEY = 'roomsplit_settlements';

export const storage = {
  getGroups: (): Group[] => {
    const data = localStorage.getItem(GROUPS_KEY);
    if (!data) {
      // Migrate old data if any
      const dataRoommates = localStorage.getItem(ROOMMATES_KEY);
      const oldRoommates = dataRoommates ? JSON.parse(dataRoommates) : ['Alice', 'Bob', 'Charlie'];
      
      const oldExpensesData = localStorage.getItem(EXPENSES_KEY);
      const oldExpenses = oldExpensesData ? JSON.parse(oldExpensesData) : [];
      
      const oldSettlementsData = localStorage.getItem(SETTLEMENTS_KEY);
      const oldSettlements = oldSettlementsData ? JSON.parse(oldSettlementsData) : [];
      
      const defaultGroup: Group = {
        id: 'default-group-id',
        name: 'My Group',
        roommates: oldRoommates.length > 0 ? oldRoommates : ['Alice', 'Bob', 'Charlie'],
        expenses: oldExpenses,
        settlements: oldSettlements,
        createdAt: new Date().toISOString()
      };
      
      const migratedGroups = [defaultGroup];
      localStorage.setItem(GROUPS_KEY, JSON.stringify(migratedGroups));
      
      return migratedGroups;
    }
    return JSON.parse(data);
  },
  
  saveGroup: (group: Group) => {
    const groups = storage.getGroups();
    const index = groups.findIndex(g => g.id === group.id);
    if (index !== -1) {
      groups[index] = group;
    } else {
      groups.push(group);
    }
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
  },
  
  deleteGroup: (id: string) => {
    const groups = storage.getGroups();
    const filtered = groups.filter(g => g.id !== id);
    localStorage.setItem(GROUPS_KEY, JSON.stringify(filtered));
    
    // Reset active group if needed
    if (storage.getActiveGroupId() === id) {
      if (filtered.length > 0) {
        storage.setActiveGroupId(filtered[0].id);
      } else {
        localStorage.removeItem(ACTIVE_GROUP_KEY);
      }
    }
  },
  
  getActiveGroup: (): Group | undefined => {
    const groups = storage.getGroups();
    const activeId = localStorage.getItem(ACTIVE_GROUP_KEY);
    if (activeId) {
      const active = groups.find(g => g.id === activeId);
      if (active) return active;
    }
    const defaultActive = groups[0];
    if (defaultActive) {
      localStorage.setItem(ACTIVE_GROUP_KEY, defaultActive.id);
    }
    return defaultActive;
  },

  getActiveGroupId: (): string => {
    const active = storage.getActiveGroup();
    return active?.id || '';
  },
  
  setActiveGroupId: (id: string) => {
    localStorage.setItem(ACTIVE_GROUP_KEY, id);
  },

  getExpenses: (): Expense[] => {
    const group = storage.getActiveGroup();
    return group && group.expenses ? group.expenses : [];
  },
  
  saveExpense: (expense: Expense) => {
    const group = storage.getActiveGroup();
    if (group) {
        if ('groupId' in expense) delete (expense as any).groupId;
        if (!group.expenses) group.expenses = [];
        group.expenses.unshift(expense);
        storage.saveGroup(group);
    }
  },
  
  updateExpense: (expense: Expense) => {
    const group = storage.getActiveGroup();
    if (group && group.expenses) {
        const index = group.expenses.findIndex(e => e.id === expense.id);
        if (index !== -1) {
          if ('groupId' in expense) delete (expense as any).groupId;
          group.expenses[index] = expense;
          storage.saveGroup(group);
        }
    }
  },
  
  deleteExpense: (id: string) => {
    const group = storage.getActiveGroup();
    if (group && group.expenses) {
        group.expenses = group.expenses.filter(e => e.id !== id);
        storage.saveGroup(group);
    }
  },

  getRoommates: (): string[] => {
    const group = storage.getActiveGroup();
    return group ? group.roommates : ['Alice', 'Bob', 'Charlie']; 
  },
  
  saveRoommates: (roommates: string[]) => {
    const group = storage.getActiveGroup();
    if (group) {
        group.roommates = roommates;
        storage.saveGroup(group);
    } else {
        localStorage.setItem(ROOMMATES_KEY, JSON.stringify(roommates));
    }
  },

  getSettlements: (): Settlement[] => {
    const group = storage.getActiveGroup();
    return group && group.settlements ? group.settlements : [];
  },
  
  saveSettlement: (settlement: Settlement) => {
    const group = storage.getActiveGroup();
    if (group) {
        if ('groupId' in settlement) delete (settlement as any).groupId;
        if (!group.settlements) group.settlements = [];
        group.settlements.unshift(settlement);
        storage.saveGroup(group);
    }
  },
  
  clearSettlements: () => {
    const group = storage.getActiveGroup();
    if (group) {
        group.settlements = [];
        storage.saveGroup(group);
    }
  },
  
  importData: (data: { groups?: Group[], expenses: Expense[], roommates?: string[], settlements?: Settlement[] }) => {
    if (data.groups) {
      localStorage.setItem(GROUPS_KEY, JSON.stringify(data.groups));
    } else {
      const g: Group = {
          id: 'imported-group-1',
          name: 'Imported Group',
          roommates: data.roommates || ['Alice', 'Bob', 'Charlie'],
          expenses: data.expenses || [],
          settlements: data.settlements || [],
          createdAt: new Date().toISOString()
      };
      localStorage.setItem(GROUPS_KEY, JSON.stringify([g]));
      localStorage.setItem(ACTIVE_GROUP_KEY, g.id);
    }
  },
  
  getSettings: (): AppSettings => {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
  },
  
  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },
  
  clearAllData: () => {
    localStorage.clear();
  }
};
