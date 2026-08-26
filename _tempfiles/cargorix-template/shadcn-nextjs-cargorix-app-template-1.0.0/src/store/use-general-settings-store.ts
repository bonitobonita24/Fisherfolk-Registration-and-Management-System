// Third-party Imports
import { create } from 'zustand'

// Type Imports
import type { GeneralSettings } from '@/types/pages/general-settings'

interface GeneralSettingsState {
  settings: GeneralSettings | null

  initialize: (settings: GeneralSettings) => void
  saveSettings: (next: GeneralSettings) => void
}

export const useGeneralSettingsStore = create<GeneralSettingsState>()((set, get) => ({
  settings: null,

  initialize: settings => {
    if (get().settings !== null) return
    set({ settings })
  },

  saveSettings: next => set({ settings: next })
}))
