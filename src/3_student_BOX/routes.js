
import DefaultLayout from '@/layouts/DefaultLayout.vue'

export const studentRoutes = {
  path: '/student',
  component: DefaultLayout,
  meta: { requiresAuth: true, roles: ['student'] },
  redirect: { name: 'Dashboard' },
  children: [
    {
      path: 'dashboard',
      name: 'Dashboard',
      component: () =>
        import('@/3_student_BOX/views/Dashboard.vue'),
      meta: { roles: ['student'] },
    },


    {
      path: 'student/student-details',
      name: 'student_details',
      component: () =>
        import('@/3_student_BOX/views/base/StudentDetail.vue'),
      meta: { roles: ['student'] },
    },



    {
      path: 'fees/student-fee-payments',
      name: 'student_fee_payments',
      component: () =>
        import('@/3_student_BOX/views/theme/student_fee_payments.vue'),
      meta: { roles: ['student'] },
    },
    {
      path: 'fees/student-fee-records',
      name: 'student_fee_records_admin',
      component: () =>
        import('@/3_student_BOX/views/theme/student_fee_records.vue'),
      meta: { roles: ['student'] },
    },
    {
      path: 'fees/family',
      name: 'families',
      component: () => import('@/3_student_BOX/views/charts/Family.vue'),
      meta: { roles: ['student'] },
    },
    {
      path: 'fees/family-fee-records',
      name: 'family_fee_records',
      component: () =>
        import('@/3_student_BOX/views/charts/FamilyRecords.vue'),
      meta: { roles: ['student'] },
    },
    {
      path: 'fees/family-fee-payments',
      name: 'family_fee_payments',
      component: () =>
        import('@/3_student_BOX/views/charts/FamilyPayments.vue'),
      meta: { roles: ['student'] },
    },
    {
      path: 'staff',
      name: 'staffProfile',
      component: () =>
        import('@/3_student_BOX/views/charts/StaffProfile.vue'),
      meta: { roles: ['student'] },
    },



    // Deactivated Students Route
    {
      path: 'deactivatedStudents',
      name: 'deactivatedStudents',
      component: () =>
        import('@/3_student_BOX/views/charts/DeactivatedStudents.vue'),
      meta: { roles: ['student'] },
    },

    // Deactivated Families Route
    {
      path: 'deactivatedFamilies',
      name: 'deactivatedFamilies',
      component: () =>
        import('@/3_student_BOX/views/charts/DeactivatedFamilies.vue'),
      meta: { roles: ['student'] },
    },


    {
      path: 'student',
      name: 'studentProfile',
      component: () =>
        import('@/3_student_BOX/views/charts/StudentProfile.vue'),
      meta: { roles: ['student'] },
    },
    {
      path: 'academic-years',
      name: 'academicYears',
      component: () =>
        import('@/3_student_BOX/views/charts/AcademicYear.vue'),
      meta: { roles: ['student'] },
    },

    {
      path: 'deactivated-families',
      name: 'deactivatedFamilies',
      component: () =>
        import('@/3_student_BOX/views/charts/DeactivatedFamilies.vue'),
      meta: { roles: ['student'] },
    },

    {
      path: 'admin_change_password',
      name: 'admin_change_password',
      component: () =>
        import('@/registration/AdminPasswordChange.vue'),
      meta: { roles: ['administrator'] },
    },


    {
      path: 'classes',
      name: 'classes',
      component: () => import('@/3_student_BOX/views/charts/Classes.vue'),
      meta: { roles: ['student'] },
    },
    {
      path: 'terms',
      name: 'terms',
      component: () => import('@/3_student_BOX/views/charts/Terms.vue'),
      meta: { roles: ['student'] },
    },
    {
      path: 'widgets',
      name: 'widgets',
      component: () => import('@/3_student_BOX/views/widgets/Widgets.vue'),
      meta: { roles: ['student'] },
    },


  ],
}
