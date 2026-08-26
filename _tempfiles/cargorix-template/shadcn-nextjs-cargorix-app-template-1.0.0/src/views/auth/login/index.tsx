// Next Imports
import Link from 'next/link'

// Component Imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import LoginForm from './login-form'

// Shared Imports
import BrandLogo from '@/components/shared/brand-logo'

// Config Imports
import themeConfig from '@/configs/themeConfig'

// SVG Imports
import AuthBackgroundShape from '@/assets/svg/auth-background-shape'

const LoginView = () => {
  return (
    <div className='relative flex h-auto min-h-screen items-center justify-center overflow-x-hidden px-4 py-10 sm:px-6 lg:px-8'>
      <div className='absolute'>
        <AuthBackgroundShape />
      </div>

      <Card className='z-1 w-full gap-6 py-6 sm:max-w-lg'>
        <CardHeader className='gap-6 px-6'>
          <Link href={themeConfig.homePageUrl}>
            <BrandLogo className='gap-3' />
          </Link>

          <div>
            <CardTitle className='mb-2 text-2xl font-semibold'>Sign in to {themeConfig.templateName}</CardTitle>
            <CardDescription className='text-base'>Ship Faster and Focus on Growth.</CardDescription>
          </div>
        </CardHeader>

        <CardContent className='px-6'>
          <p className='text-muted-foreground mb-6 text-base'>
            Login with{' '}
            <Link href='#' className='text-card-foreground hover:underline'>
              Magic Link
            </Link>
          </p>

          <div className='mb-6 flex flex-wrap gap-4 sm:gap-6'>
            <Button variant='outline' className='grow'>
              Login as User
            </Button>
            <Button variant='outline' className='grow'>
              Login as Admin
            </Button>
          </div>

          <div className='space-y-4'>
            <LoginForm />

            <p className='text-muted-foreground text-center text-base'>
              New on our platform?{' '}
              <Link href='/register' className='text-card-foreground hover:underline'>
                Create an account
              </Link>
            </p>

            <div className='flex items-center gap-4'>
              <Separator className='flex-1' />
              <p className='text-base'>or</p>
              <Separator className='flex-1' />
            </div>

            <Button variant='ghost' className='w-full' render={<Link href='#' />} nativeButton={false}>
              Sign in with google
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginView
