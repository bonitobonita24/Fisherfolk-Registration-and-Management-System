const themeConfig = {
  templateName: 'Cargorix',
  homePageUrl: '/live-map',
  settingsCookieName: 'shadcn-next-admin-settings',
  mode: 'system', // 'system' | 'light' | 'dark'
  themePreset: 'default', // 'default' | 'caffeine' | 'claude' | 'corporate' | 'ghibli-studio' | 'marvel' | 'material-design' | 'modern-minimal' | 'nature' | 'perplexity' | 'slack' | 'pastel-dreams'
  font: 'geist-mono', // 'geist' | 'inter' | 'roboto' | 'nunito-sans' | 'lora' | 'geist-mono' | 'space-grotesk' | 'josefin-sans' | 'poppins' | 'open-sans' | 'montserrat' | 'raleway' | 'ubuntu' | 'noto-sans' | 'archivo' | 'archivo-narrow' | 'archivo-black' | 'archivo-condensed' | 'archivo-expanded' | 'archivo-italic' | 'archivo-light' | 'archivo-medium' | 'archivo-semibold' | 'archivo-bold' | 'archivo-extrabold' | 'archivo-black' | 'archivo-condensed' | 'archivo-expanded' | 'archivo-italic' | 'archivo-light' | 'archivo-medium' | 'archivo-semibold' | 'archivo-bold' | 'archivo-extrabold'
  radius: 'md', // 'none' | 'sm' | 'md' | 'lg'
  scale: 'md', // 'sm' | 'md' | 'lg'
  layout: 'compact', // 'compact' | 'full'
  sidebarVariant: 'floating', // 'default' | 'inset' | 'floating'
  sidebarCollapsible: 'icon', // 'offcanvas' | 'icon' | 'none'
  sidebarOpen: true
} as const

export default themeConfig
