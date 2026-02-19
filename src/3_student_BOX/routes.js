
import DefaultLayout from '@/layouts/DefaultLayout.vue'

export const studentRoutes = {
  path: '/student',
  component: DefaultLayout,
  meta: { requiresAuth: true, roles: ['student'] },
  redirect: { name: 'StudentDashboard' },
  children: [

    {
      path: 'dashboard',
      name: 'StudentDashboard',
      component: () =>
        import('@/3_student_BOX/views/Dashboard.vue'),
      meta: { roles: ['student'] },
    },


    {
      path: 'fees/family-fee-records',
      name: 'family_fee_records',
      component: () =>
        import('@/3_student_BOX/views/Dashboard.vue'),
      meta: { roles: ['student'] },
    },
    {
      path: 'fees/family-fee-payments',
      name: 'family_fee_payments',
      component: () =>
        import('@/3_student_BOX/views/Dashboard.vue'),
      meta: { roles: ['student'] },
    },
    {
      path: 'staff',
      name: 'staffProfile',
      component: () =>
        import('@/3_student_BOX/views/Dashboard.vue'),
      meta: { roles: ['student'] },
    },




    // Deactivated Families Route
    {
      path: 'deactivatedFamilies',
      name: 'deactivatedFamilies',
      component: () =>
       import('@/3_student_BOX/views/Dashboard.vue'),
      meta: { roles: ['student'] },
    },




  ],
}
