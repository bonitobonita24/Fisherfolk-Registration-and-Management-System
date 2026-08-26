// Next Imports
import { redirect } from 'next/navigation'

// Config Imports
import themeConfig from '@/configs/themeConfig'

const RootPage = () => {
  redirect(themeConfig.homePageUrl)
}

export default RootPage
