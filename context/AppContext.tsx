import React, { createContext, useContext, useState, useEffect, ReactNode, PropsWithChildren } from 'react';
import { UserProfile, JournalEntry, AppSettings, AppTheme } from '../types';

interface AppContextType {
  user: UserProfile | null;
  entries: JournalEntry[];
  settings: AppSettings;
  login: (username: string, email: string) => void;
  logout: () => void;
  completeOnboarding: (analysis: string, statement: string) => void;
  addEntry: (entry: JournalEntry) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_USER = 'perma_user';
const STORAGE_KEY_ENTRIES = 'perma_entries';
const STORAGE_KEY_SETTINGS = 'perma_settings';

export const AppProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    theme: AppTheme.LIGHT,
    fontSize: 'medium',
  });

  // Load from local storage
  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEY_USER);
    const storedEntries = localStorage.getItem(STORAGE_KEY_ENTRIES);
    const storedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);

    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedEntries) setEntries(JSON.parse(storedEntries));
    if (storedSettings) setSettings(JSON.parse(storedSettings));
  }, []);

  // Sync Theme
  useEffect(() => {
    if (settings.theme === AppTheme.DARK) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const login = (username: string, email: string) => {
    const newUser: UserProfile = {
      username,
      email,
      onboardingComplete: false,
    };
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY_USER);
  };

  const completeOnboarding = (analysis: string, statement: string) => {
    if (!user) return;
    const updatedUser = { ...user, onboardingComplete: true, purposeAnalysis: analysis, purposeStatement: statement };
    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
  };

  const addEntry = (entry: JournalEntry) => {
    const newEntries = [entry, ...entries];
    setEntries(newEntries);
    localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(newEntries));
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
  };

  return (
    <AppContext.Provider value={{ user, entries, settings, login, logout, completeOnboarding, addEntry, updateSettings }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};