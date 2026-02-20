
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
  ],
}
