// Next Imports
import type { Metadata } from 'next'

// Component Imports
import RegisterView from '@/views/auth/register'

export const metadata: Metadata = {
  title: 'Register',
  robots: 'noindex,nofollow',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL}/register`
  }
}

const RegisterPage = () => {
  return <RegisterView />
}

export default RegisterPage
