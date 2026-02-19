
// student_nav.js
import { cilCreditCard, cilLibrary, cilSchool, cilCalendar, cilAddressBook, cilPeople, cilList, cilSpreadsheet, cilCalculator, cilMoney } from '@coreui/icons'


export default [

  {
  component: 'CNavItem',
  name: 'Dashboard',
  to: '#',                // no real link
  disabled: true,         // disable click
  icon: null,
  badge: { color: 'primary', text: 'STUDENT' },
},




  { component: 'CNavTitle', name: 'Student Fees' },

  {
    component: 'CNavItem',
    name: 'Payment History',
    to: { name: 'StudentDashboard' },
    icon: cilList,
  },
  {
    component: 'CNavItem',
    name: 'Fee Breakdown',
    to: { name: 'StudentDashboard' },
    icon: cilCreditCard,
  },
  {
    component: 'CNavItem',
    name: 'Online Payment',
    to: { name: 'StudentDashboard' }, // removed trailing space
    icon: cilSpreadsheet,
  },

  { component: 'CNavTitle', name: 'Academic Records' },

  {
    component: 'CNavItem',
    name: 'Subjects & Exams Scores',
    to: { name: 'StudentDashboard' },
    icon: cilPeople,
  },
  {
    component: 'CNavItem',
    name: 'Academic Calendar',
    to: { name: 'StudentDashboard' },
    icon: cilCalculator,
  },


  { component: 'CNavTitle', name: 'Performance Analysis' },

  {
    component: 'CNavItem',
    name: 'Staff Profiles',
    to: { name: 'StudentDashboard' },
    icon: cilAddressBook,
  },
  {
    component: 'CNavItem',
    name: 'Student Profiles',
    to: { name: 'StudentDashboard' },
    icon: 'cil-user',
  },






  // Deactivation Section

  {
    component: 'CNavTitle',
    name: 'ANALYTICS',
  },
    {
    component: 'CNavItem',
    name: 'Performance Trend Analysis',
    to: { name: 'StudentDashboard' },
    icon: 'cil-chart-pie',
  },
    {
      component: 'CNavItem',
      name: 'Class Ranking',
      to: { name: 'StudentDashboard' },
      icon: 'cil-chart-pie',
    },





    // others section
  { component: 'CNavTitle', name: 'COMMUNICATION' },

  {
    component: 'CNavItem',
    name: 'Messages',
    to: { name: 'StudentDashboard' },
    icon: cilCalendar,
  },
  {
    component: 'CNavItem',
    name: 'Announcements',
    to: { name: 'StudentDashboard' },
    icon: cilSchool,
  },


]
