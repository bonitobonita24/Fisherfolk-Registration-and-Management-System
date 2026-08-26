// Next Imports
import type { Metadata } from 'next'

// Component Imports
import LoginView from '@/views/auth/login'

export const metadata: Metadata = {
  title: 'Login',
  robots: 'noindex,nofollow',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL}/login`
  }
}

const LoginPage = () => {
  return <LoginView />
}

export default LoginPage
