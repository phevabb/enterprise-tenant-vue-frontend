<script setup>


import { RouterLink } from 'vue-router'

import { logo } from '@/assets/brand/logo'
import { sygnet } from '@/assets/brand/sygnet'
import { AppSidebarNav } from '@/components/AppSidebarNav.js'
import { useSidebarStore } from '@/stores/sidebar.js'
import {  get_current_tenant} from '@/services/api'
import { ref } from 'vue'
import { onMounted } from 'vue'

const tenant = ref(null)


onMounted(async () => {
  try {
    const response = await get_current_tenant()
    tenant.value = response.data
  } catch (err) {
    tenant.value = null
  }
})


const sidebar = useSidebarStore()
</script>

<template>
  <CSidebar
    class="border-end"
    colorScheme="dark"
    position="fixed"
    :unfoldable="sidebar.unfoldable"
    :visible="sidebar.visible"
    @visible-change="(value) => sidebar.toggleVisible(value)"
  >
    <CSidebarHeader class="border-bottom">
      <span class="text-xl font-bold tracking-wide select-none">
  {{ tenant?.schoolName || 'School Name' }}
</span>

      <CCloseButton class="d-lg-none" dark @click="sidebar.toggleVisible()" />
    </CSidebarHeader>
    <AppSidebarNav />
    <CSidebarFooter class="border-top d-none d-lg-flex">
      <CSidebarToggler @click="sidebar.toggleUnfoldable()" />
    </CSidebarFooter>
  </CSidebar>
</template>
