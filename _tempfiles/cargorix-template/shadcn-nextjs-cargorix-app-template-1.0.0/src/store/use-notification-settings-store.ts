// Third-party Imports
import { create } from 'zustand'

// Type Imports
import type {
  AlertCategory,
  AlertPriority,
  DigestFrequency,
  NotificationChannel,
  NotificationDigest,
  NotificationQuietHours,
  NotificationSettings
} from '@/types/pages/notification-settings'

const patchCategory = (
  settings: NotificationSettings,
  id: string,
  patch: Partial<AlertCategory>
): NotificationSettings => ({
  ...settings,
  categories: settings.categories.map(category => (category.id === id ? { ...category, ...patch } : category))
})

interface NotificationSettingsState {
  settings: NotificationSettings | null

  initialize: (settings: NotificationSettings) => void
  setChannel: (channel: NotificationChannel, value: boolean) => void
  setCategoryChannel: (id: string, channel: NotificationChannel, value: boolean) => void
  setCategoryPriority: (id: string, priority: AlertPriority) => void
  setCategoryFrequency: (id: string, frequency: DigestFrequency) => void
  setCategorySendAt: (id: string, value: string) => void
  setQuietHours: (patch: Partial<NotificationQuietHours>) => void
  setDigest: (patch: Partial<NotificationDigest>) => void
  saveSettings: () => NotificationSettings | null
}

export const useNotificationSettingsStore = create<NotificationSettingsState>()((set, get) => ({
  settings: null,

  initialize: settings => {
    if (get().settings) return
    set({ settings })
  },

  setChannel: (channel, value) =>
    set(state =>
      state.settings
        ? { settings: { ...state.settings, channels: { ...state.settings.channels, [channel]: value } } }
        : state
    ),

  setCategoryChannel: (id, channel, value) =>
    set(state => (state.settings ? { settings: patchCategory(state.settings, id, { [channel]: value }) } : state)),

  setCategoryPriority: (id, priority) =>
    set(state => (state.settings ? { settings: patchCategory(state.settings, id, { priority }) } : state)),

  setCategoryFrequency: (id, frequency) =>
    set(state => (state.settings ? { settings: patchCategory(state.settings, id, { frequency }) } : state)),

  setCategorySendAt: (id, value) =>
    set(state => (state.settings ? { settings: patchCategory(state.settings, id, { sendAt: value }) } : state)),

  setQuietHours: patch =>
    set(state =>
      state.settings
        ? { settings: { ...state.settings, quietHours: { ...state.settings.quietHours, ...patch } } }
        : state
    ),

  setDigest: patch =>
    set(state =>
      state.settings ? { settings: { ...state.settings, digest: { ...state.settings.digest, ...patch } } } : state
    ),

  saveSettings: () => get().settings
}))
