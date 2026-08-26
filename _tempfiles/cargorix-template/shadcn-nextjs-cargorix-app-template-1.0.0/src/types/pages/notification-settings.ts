export type NotificationChannel = 'inApp' | 'email' | 'sms'

export type AlertPriority = 'high' | 'medium' | 'low'

export type DigestFrequency = 'daily' | 'weekly' | 'monthly'

export interface AlertCategory {
  id: string
  label: string
  description: string
  icon: string
  inApp: boolean
  email: boolean
  sms: boolean
  priority: AlertPriority
  frequency?: DigestFrequency
  sendAt?: string
}

export interface NotificationQuietHours {
  from: string
  to: string
  allowHighPriority: boolean
}

export interface NotificationDigest {
  frequency: DigestFrequency
  sendAt: string
  include: string
}

export interface NotificationSettings {
  channels: Record<NotificationChannel, boolean>
  categories: AlertCategory[]
  quietHours: NotificationQuietHours
  digest: NotificationDigest
}

export const ALERT_PRIORITY_OPTIONS: { label: string; value: AlertPriority }[] = [
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' }
]

export const DIGEST_FREQUENCY_OPTIONS: { label: string; value: DigestFrequency }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' }
]

export const DIGEST_INCLUDE_OPTIONS: { label: string; value: string }[] = [
  { label: 'All non-critical alerts', value: 'all' },
  { label: 'Unread only', value: 'unread' },
  { label: 'Summary only', value: 'summary' }
]
