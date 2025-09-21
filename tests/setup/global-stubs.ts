import { config } from '@vue/test-utils'

config.global.stubs = {
  NuxtPage: { template: '<div><slot /></div>' },
  NuxtLayout: { template: '<div><slot /></div>' },
}
