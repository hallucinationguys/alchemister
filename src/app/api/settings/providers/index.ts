// Export provider API handlers
// Using named exports to avoid ambiguity
import { GET as getProviders } from './route'
import { GET as getProviderSettings, POST as updateProviderSettings } from './settings'

export { getProviders, getProviderSettings, updateProviderSettings }
