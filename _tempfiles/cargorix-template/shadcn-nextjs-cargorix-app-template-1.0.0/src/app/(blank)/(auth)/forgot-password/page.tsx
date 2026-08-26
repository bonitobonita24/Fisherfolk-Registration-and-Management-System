// Next Imports
import type { Metadata } from 'next'

// Component Imports
import ForgotPasswordView from '@/views/auth/forgot-password'

export const metadata: Metadata = {
  title: 'Forgot Password',
  robots: 'noindex,nofollow',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL}/forgot-password`
  }
}

const ForgotPasswordPage = () => {
  return <ForgotPasswordView />
}

export default ForgotPasswordPage
