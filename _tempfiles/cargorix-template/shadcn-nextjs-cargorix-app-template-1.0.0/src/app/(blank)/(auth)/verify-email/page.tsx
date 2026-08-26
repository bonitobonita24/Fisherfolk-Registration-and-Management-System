// Next Imports
import type { Metadata } from 'next'

// Component Imports
import VerifyEmailView from '@/views/auth/verify-email'

export const metadata: Metadata = {
  title: 'Verify Email',
  robots: 'noindex,nofollow',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email`
  }
}

const VerifyEmailPage = () => {
  return <VerifyEmailView />
}

export default VerifyEmailPage
