// Next Imports
import type { Metadata } from 'next'

// Component Imports
import ResetPasswordView from '@/views/auth/reset-password'

export const metadata: Metadata = {
  title: 'Reset Password',
  robots: 'noindex,nofollow',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`
  }
}

const ResetPasswordPage = () => {
  return <ResetPasswordView />
}

export default ResetPasswordPage
