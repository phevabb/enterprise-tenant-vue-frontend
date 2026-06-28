// src/navigation/admin_nav.js

import {
  cilAddressBook,
  cilCalculator,
  cilCalendar,
  cilCreditCard,
  cilEducation,
  cilGroup,
  cilLibrary,
  cilList,
  cilMoney,
  cilPeople,
  cilSchool,
  cilSpreadsheet,
  cilUser,
} from '@coreui/icons'

export default [
  // ================================
  // Administrator
  // ================================
  {
    component: 'CNavItem',
    name: 'Administrator',
    to: '#',
    disabled: true,
    icon: cilUser,
    badge: {
      color: 'primary',
      text: 'ADMIN',
    },
  },

  // ================================
  // Student Fees
  // ================================
  {
    component: 'CNavTitle',
    name: 'Student Fees',
  },
  {
    component: 'CNavItem',
    name: 'Fee Structure',
    to: { name: 'student_fee_structure' },
    icon: cilList,
  },
  {
    component: 'CNavItem',
    name: 'Student Payments',
    to: { name: 'student_fee_payments' },
    icon: cilCreditCard,
  },
  {
    component: 'CNavItem',
    name: 'Student Fee Records',
    to: { name: 'student_fee_records_admin' },
    icon: cilSpreadsheet,
  },

  // ================================
  // Family Fees
  // ================================
  {
    component: 'CNavTitle',
    name: 'Family Fees',
  },
  {
    component: 'CNavItem',
    name: 'Families',
    to: { name: 'families' },
    icon: cilGroup,
  },
  {
    component: 'CNavItem',
    name: 'Family Payments',
    to: { name: 'family_fee_payments' },
    icon: cilMoney,
  },
  {
    component: 'CNavItem',
    name: 'Family Fee Records',
    to: { name: 'family_fee_records' },
    icon: cilCalculator,
  },

  // ================================
  // Profiles
  // ================================
  {
    component: 'CNavTitle',
    name: 'Profiles',
  },
  {
    component: 'CNavItem',
    name: 'Staff Profiles',
    to: { name: 'staffProfile' },
    icon: cilAddressBook,
  },
  {
    component: 'CNavItem',
    name: 'Student Profiles',
    to: { name: 'studentProfile' },
    icon: cilPeople,
  },

  // ================================
  // Academic Setup
  // ================================
  {
    component: 'CNavTitle',
    name: 'Academic Setup',
  },
  {
    component: 'CNavItem',
    name: 'Academic Years',
    to: { name: 'academicYears' },
    icon: cilCalendar,
  },
  {
    component: 'CNavItem',
    name: 'Terms',
    to: { name: 'terms' },
    icon: cilCalendar,
  },
  {
    component: 'CNavItem',
    name: 'Classes',
    to: { name: 'classes' },
    icon: cilSchool,
  },
  {
    component: 'CNavItem',
    name: 'Subjects',
    to: { name: 'subjects' },
    icon: cilLibrary,
  },
  {
    component: 'CNavItem',
    name: 'Categories',
    to: { name: 'categories' },
    icon: cilList,
  },

  // ================================
  // Academic Records
  // ================================
  {
    component: 'CNavTitle',
    name: 'Academic Records',
  },
  {
    component: 'CNavItem',
    name: 'Promotions',
    to: { name: 'promotions' },
    icon: cilEducation,
  },
  {
    component: 'CNavItem',
    name: 'Grading Scale',
    to: { name: 'grading_scales' },
    icon: cilCalculator,
  },
  {
    component: 'CNavItem',
    name: 'Subject Scores',
    to: { name: 'subject_scores' },
    icon: cilSpreadsheet,
  },
  {
    component: 'CNavItem',
    name: 'Academic Records',
    to: { name: 'academic_records' },
    icon: cilLibrary,
  },
]
