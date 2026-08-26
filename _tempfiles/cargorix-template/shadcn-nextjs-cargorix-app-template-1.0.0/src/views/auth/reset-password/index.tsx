// Next Imports
import Link from 'next/link'

// Third-party Imports
import { ChevronLeftIcon } from 'lucide-react'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ResetPasswordForm from './reset-password-form'

// Shared Imports
import BrandLogo from '@/components/shared/brand-logo'

// Config Imports
import themeConfig from '@/configs/themeConfig'

// SVG Imports
import AuthBackgroundShape from '@/assets/svg/auth-background-shape'

const ResetPasswordView = () => {
  return (
    <div className='relative flex h-auto min-h-screen items-center justify-center overflow-x-hidden px-4 py-10 sm:px-6 lg:px-8'>
      <div className='absolute'>
        <AuthBackgroundShape />
      </div>

      <Card className='z-1 w-full gap-6 py-6 sm:max-w-md'>
        <CardHeader className='gap-6 px-6'>
          <Link href={themeConfig.homePageUrl}>
            <BrandLogo className='gap-3' />
          </Link>

          <div>
            <CardTitle className='mb-2 text-2xl font-semibold'>Reset Password</CardTitle>
            <CardDescription className='text-base'>
              Please enter your current password and choose a new password to update your account security.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className='space-y-4 px-6'>
          <ResetPasswordForm />

          <Button variant='ghost' className='group w-full' render={<Link href='/login' />} nativeButton={false}>
            <ChevronLeftIcon className='size-5 transition-transform duration-200 group-hover:-translate-x-0.5' />
            Back to login
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default ResetPasswordView
