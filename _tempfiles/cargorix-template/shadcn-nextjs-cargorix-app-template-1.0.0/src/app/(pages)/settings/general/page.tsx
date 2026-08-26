// Component Imports
import GeneralSettingsView from '@/views/settings/general'

// Server Action Imports
import { getGeneralSettingsData, getWarehousesData } from '@/app/server/actions'

const GeneralSettingsPage = async () => {
  const [settings, warehouses] = await Promise.all([getGeneralSettingsData(), getWarehousesData()])

  return <GeneralSettingsView settings={settings} warehouses={warehouses} />
}

export default GeneralSettingsPage
