
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
      path: 'academicrecords',
      name: 'AcademicRecords',
      component: () =>
        import('@/3_student_BOX/views/AcademicRecords.vue'),
      meta: { roles: ['student'] },
    },
    {
      path: 'paymenthistory',
      name: 'StudentPaymentHistory',
      component: () =>
        import('@/3_student_BOX/views/PaymentHistory.vue'),
      meta: { roles: ['student'] },
    },

    {
      path: 'onlinepayment',
      name: 'StudentOnlinePayment',
      component: () =>
        import('@/3_student_BOX/views/PaymentOnline.vue'),
      meta: { roles: ['student'] },
    },

  ],
}
