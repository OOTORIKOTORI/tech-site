import { config } from '@vue/test-utils'

config.global.stubs = {
  NuxtPage: { template: '<div />' },
  NuxtLayout: { template: '<div />' },
}
