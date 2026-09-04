<script setup>
import {
  computed,
  onMounted,
  ref,
  watch,
  nextTick,
} from 'vue'

import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'

import { useToast } from 'vue-toastification'
const toast = useToast()

import {
  DatePicker as VDatePicker,
} from 'v-calendar'

import 'v-calendar/style.css'

import {
  CAlert,
  CAvatar,
  CBadge,
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
} from '@coreui/vue'

import CIcon from '@coreui/icons-vue'

import {
  cilCalendar,
  cilCheckAlt,
  cilClock,
  cilHistory,
  cilList,
  cilMagnifyingGlass,
  cilPencil,
  cilPeople,
  cilReload,
  cilSave,
  cilTrash,
  cilUserFollow,
  cilUserUnfollow,
  cilWarning,
  cilX,
} from '@coreui/icons'

import {
  delete_class_attendance,
  get_teacher_attendance_history,
  get_teacher_student,
  update_student_attendance,
} from '@/services/api'

const emit = defineEmits([
  'take-attendance',
  'edit-register',
])

const props = defineProps({
  schoolId: {
    type: [Number, String],
    default: null,
  },

  teacherId: {
    type: [Number, String],
    default: null,
  },

  classId: {
    type: [Number, String],
    default: null,
  },

  teacherName: {
    type: String,
    default: 'Class Teacher',
  },

  className: {
    type: String,
    default: 'Assigned Class',
  },

  academicYearId: {
    type: [Number, String],
    default: null,
  },

  termId: {
    type: [Number, String],
    default: null,
  },
})




const currentUser = ref(null)

const attendanceRecords = ref([])
const teacherStudents = ref([])

const loadingHistory = ref(false)
const updatingRecord = ref(false)
const deletingRegister = ref(false)

const errorMessage = ref('')
const successMessage = ref('')

const activeView = ref('TABLE')
const searchText = ref('')
const statusFilter = ref('ALL')
const sessionFilter = ref('ALL')

const startDate = ref(getFirstDayOfCurrentMonth())
const endDate = ref(new Date())

const showStartDatePicker = ref(false)
const showEndDatePicker = ref(false)

const selectedCalendarGroup = ref(null)
const selectedEditRecord = ref(null)
const selectedDeleteGroup = ref(null)

const showRegisterModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)


function getCurrentUser() {
  const storedUser =
    localStorage.getItem('user')

  if (!storedUser) {
    return null
  }

  try {
    const user =
      JSON.parse(storedUser)

    if (
      !user ||
      typeof user !== 'object'
    ) {
      return null
    }

    return user
  } catch (error) {


    return null
  }
}


const editForm = ref({
  status: 'PRESENT',
  arrivalTime: '',
  remarks: '',
  generalRemarks: '',
})

const attendanceStatuses = [
  {
    value: 'PRESENT',
    label: 'Present',
    color: 'success',
    className: 'status-present',
    icon: cilCheckAlt,
  },
  {
    value: 'ABSENT',
    label: 'Absent',
    color: 'danger',
    className: 'status-absent',
    icon: cilUserUnfollow,
  },
  {
    value: 'LATE',
    label: 'Late',
    color: 'warning',
    className: 'status-late',
    icon: cilClock,
  },
  {
    value: 'EXCUSED',
    label: 'Excused',
    color: 'info',
    className: 'status-excused',
    icon: cilWarning,
  },
  {
    value: 'SICK',
    label: 'Sick',
    color: 'secondary',
    className: 'status-sick',
    icon: cilWarning,
  },
]

const sessionOptions = [
  {
    value: 'ALL',
    label: 'All sessions',
  },
  {
    value: 'MORNING',
    label: 'Morning attendance',
  },
  {
    value: 'AFTERNOON',
    label: 'Afternoon attendance',
  },
  {
    value: 'FULL_DAY',
    label: 'Full day attendance',
  },
]

const statusOptions = computed(() => {
  const options = [
    {
      value: 'ALL',
      label: `All statuses (${attendanceRecords.value.length})`,
    },
  ]

  attendanceStatuses.forEach((status) => {
    options.push({
      value: status.value,
      label:
        `${status.label} (${getStatusCount(status.value)})`,
    })
  })

  return options
})

const filteredRecords = computed(() => {
  const query = searchText.value
    .trim()
    .toLowerCase()

  return attendanceRecords.value.filter((record) => {
    const studentName = String(
      record.studentName || '',
    ).toLowerCase()

    const indexNumber = String(
      record.indexNo || '',
    ).toLowerCase()

    const matchesSearch =
      !query ||
      studentName.includes(query) ||
      indexNumber.includes(query)

    const matchesStatus =
      statusFilter.value === 'ALL' ||
      record.status === statusFilter.value

    const matchesSession =
      sessionFilter.value === 'ALL' ||
      record.session === sessionFilter.value

    return (
      matchesSearch &&
      matchesStatus &&
      matchesSession
    )
  })
})

const groupedRegisters = computed(() => {
  const groups = new Map()

  filteredRecords.value.forEach((record) => {
    const key =
      `${record.attendanceDate}_${record.session}_${record.classId}`

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        attendanceDate: record.attendanceDate,
        session: record.session,
        classId: record.classId,
        className: props.className,
        teacherId: record.teacherId,
        generalRemarks: record.generalRemarks || '',
        records: [],
      })
    }

    groups.get(key).records.push(record)
  })

  return Array.from(groups.values())
    .map((group) => {
      return {
        ...group,
        totalStudents: group.records.length,
        present: countGroupStatus(
          group.records,
          'PRESENT',
        ),
        absent: countGroupStatus(
          group.records,
          'ABSENT',
        ),
        late: countGroupStatus(
          group.records,
          'LATE',
        ),
        excused: countGroupStatus(
          group.records,
          'EXCUSED',
        ),
        sick: countGroupStatus(
          group.records,
          'SICK',
        ),
      }
    })
    .sort((firstGroup, secondGroup) => {
      const firstDate = new Date(
        `${firstGroup.attendanceDate}T00:00:00`,
      )

      const secondDate = new Date(
        `${secondGroup.attendanceDate}T00:00:00`,
      )

      return secondDate.getTime() - firstDate.getTime()
    })
})

const totalRegisters = computed(() => {
  return groupedRegisters.value.length
})

const totalRecords = computed(() => {
  return attendanceRecords.value.length
})

const presentCount = computed(() => {
  return getStatusCount('PRESENT')
})

const absentCount = computed(() => {
  return getStatusCount('ABSENT')
})

const lateCount = computed(() => {
  return getStatusCount('LATE')
})

const presentPercentage = computed(() => {
  if (!totalRecords.value) {
    return 0
  }

  return Math.round(
    presentCount.value / (totalRecords.value / 100),
  )
})

const selectedStartDateLabel = computed(() => {
  return formatDisplayDate(startDate.value)
})

const selectedEndDateLabel = computed(() => {
  return formatDisplayDate(endDate.value)
})

const selectedRegisterRecords = computed(() => {
  return selectedCalendarGroup.value?.records || []
})

const calendarEvents = computed(() => {
  return groupedRegisters.value.map((group) => {
    return {
      id: group.key,
      title:
        `${getSessionShortLabel(group.session)} ` +
        `${group.present}P ${group.absent}A ${group.late}L`,
      date: group.attendanceDate,
      allDay: true,
      backgroundColor: getCalendarEventColor(group),
      borderColor: getCalendarEventColor(group),
      textColor: '#ffffff',
      extendedProps: {
        group,
      },
    }
  })
})

const calendarOptions = computed(() => {
  return {
    plugins: [
      dayGridPlugin,
      interactionPlugin,
    ],
    initialView: 'dayGridMonth',
    initialDate: startDate.value,
    height: 'auto',
    firstDay: 1,
    fixedWeekCount: false,
    showNonCurrentDates: true,
    dayMaxEvents: 3,
    events: calendarEvents.value,
    eventClick: handleCalendarEventClick,
    dateClick: handleCalendarDateClick,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: '',
    },
    buttonText: {
      today: 'Today',
    },
  }
})

watch(
  [
    startDate,
    endDate,
    sessionFilter,
  ],
  () => {
    loadAttendanceHistory()
  },
)

watch(
  () => editForm.value.status,
  (newStatus) => {
    if (newStatus !== 'LATE') {
      editForm.value.arrivalTime = ''
    }
  },
)

function getFirstDayOfCurrentMonth() {
  const currentDate = new Date()

  return new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  )
}

function formatApiDate(dateValue) {
  if (!dateValue) {
    return null
  }

  const selectedDate = new Date(dateValue)

  const year = selectedDate.getFullYear()

  const month = String(
    selectedDate.getMonth() + 1,
  ).padStart(2, '0')

  const day = String(
    selectedDate.getDate(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDisplayDate(dateValue) {
  if (!dateValue) {
    return 'Select date'
  }

  const selectedDate =
    typeof dateValue === 'string'
      ? new Date(`${dateValue}T00:00:00`)
      : new Date(dateValue)

  return new Intl.DateTimeFormat('en-GH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(selectedDate)
}

function formatFullDate(dateValue) {
  if (!dateValue) {
    return ''
  }

  const selectedDate =
    typeof dateValue === 'string'
      ? new Date(`${dateValue}T00:00:00`)
      : new Date(dateValue)

  return new Intl.DateTimeFormat('en-GH', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(selectedDate)
}

function getStudentInitials(fullName) {
  if (!fullName) {
    return 'ST'
  }

  const names = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!names.length) {
    return 'ST'
  }

  if (names.length === 1) {
    return names[0]
      .substring(0, 2)
      .toUpperCase()
  }

  const firstInitial = names[0][0]
  const lastInitial = names[names.length - 1][0]

  return `${firstInitial}${lastInitial}`.toUpperCase()
}

function getStatusDefinition(statusValue) {
  return attendanceStatuses.find((status) => {
    return status.value === statusValue
  })
}

function getStatusCount(statusValue) {
  return attendanceRecords.value.filter((record) => {
    return record.status === statusValue
  }).length
}

function countGroupStatus(records, statusValue) {
  return records.filter((record) => {
    return record.status === statusValue
  }).length
}

function getSessionLabel(sessionValue) {
  const session = sessionOptions.find((item) => {
    return item.value === sessionValue
  })

  return session
    ? session.label
    : sessionValue
}

function getSessionShortLabel(sessionValue) {
  if (sessionValue === 'MORNING') {
    return 'AM'
  }

  if (sessionValue === 'AFTERNOON') {
    return 'PM'
  }

  if (sessionValue === 'FULL_DAY') {
    return 'Full'
  }

  return sessionValue
}

function getCalendarEventColor(group) {
  if (group.absent > 0) {
    return '#dc4c64'
  }

  if (group.late > 0) {
    return '#e79a18'
  }

  if (group.present === group.totalStudents) {
    return '#16a06d'
  }

  return '#3159d9'
}

function findStudent(studentId) {
  return teacherStudents.value.find((student) => {
    return String(student.id) === String(studentId)
  })
}

function normalizeStudents(response) {
  const responseData = response?.data ?? response

  let records = []

  if (Array.isArray(responseData)) {
    records = responseData
  } else if (Array.isArray(responseData?.data)) {
    records = responseData.data
  } else if (Array.isArray(responseData?.students)) {
    records = responseData.students
  } else if (Array.isArray(responseData?.result)) {
    records = responseData.result
  }

  return records.map((student) => {
    return {
      id: student.id,
      full_name:
        student.full_name ??
        student.fullName ??
        student.name ??
        'Unknown student',
      indexNo:
        student.indexNo ??
        student.index_no ??
        student.studentId ??
        '',
    }
  })
}

function normalizeAttendanceRecords(response) {
  const responseData = response?.data ?? response

  let records = []

  if (Array.isArray(responseData)) {
    records = responseData
  } else if (Array.isArray(responseData?.records)) {
    records = responseData.records
  } else if (Array.isArray(responseData?.data)) {
    records = responseData.data
  } else if (Array.isArray(responseData?.data?.records)) {
    records = responseData.data.records
  } else if (Array.isArray(responseData?.result)) {
    records = responseData.result
  }

  return records.map((record) => {
    const student = findStudent(record.studentId)

    return {
      id: record.id,
      schoolId: record.schoolId,
      academicYearId: record.academicYearId,
      termId: record.termId,
      classId: record.classId,
      teacherId: record.teacherId,
      studentId: record.studentId,
      studentName:
        record.studentName ??
        record.full_name ??
        record.fullName ??
        student?.full_name ??
        `Student ${record.studentId}`,
      indexNo:
        record.indexNo ??
        record.index_no ??
        student?.indexNo ??
        '',
      attendanceDate: record.attendanceDate,
      session: record.session,
      status: record.status,
      arrivalTime: record.arrivalTime ?? '',
      remarks: record.remarks ?? '',
      generalRemarks: record.generalRemarks ?? '',
      markedBy: record.markedBy,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  })
}

async function loadTeacherStudents() {
  try {
    const response = await get_teacher_student()

    teacherStudents.value =
      normalizeStudents(response)
  } catch (error) {


    teacherStudents.value = []
  }
}

async function loadAttendanceHistory() {
  loadingHistory.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    currentUser.value =
      getCurrentUser()

    if (!currentUser.value) {

      toast.error(
        'Logged-in user information is missing. Please sign in again.',
      )
      throw new Error(
        'Logged-in user information is missing. Please sign in again.',
      )
    }

    const teacherId =
      Number(currentUser.value.id)

    if (
      !Number.isFinite(teacherId) ||
      teacherId <= 0
    ) {
      throw new Error(
        'The logged-in teacher ID is invalid.',
      )
    }

    if (
      currentUser.value.isActive !== true ||
      currentUser.value.isStaff !== true
    ) {
      throw new Error(
        'Only an active staff account can view attendance history.',
      )
    }

    const params = {
      teacherId,
      classId:
        props.classId || undefined,

      academicYearId:
        props.academicYearId || undefined,

      termId:
        props.termId || undefined,

      from:
        formatApiDate(startDate.value),

      to:
        formatApiDate(endDate.value),

      session:
        sessionFilter.value === 'ALL'
          ? undefined
          : sessionFilter.value,
    }

    const response =
      await get_teacher_attendance_history(
        params,
      )

    attendanceRecords.value =
      normalizeAttendanceRecords(response)
  } catch (error) {


    attendanceRecords.value = []



    errorMessage.value =
      error?.response?.data?.message ??
      error?.message ??
      'Unable to load attendance history.'

      toast.error(
        errorMessage.value ||
          'Unable to load attendance history. Please try again.',
      )
  } finally {
    loadingHistory.value = false
  }
}

async function reloadHistory() {
  await loadTeacherStudents()
  await loadAttendanceHistory()
}

function clearFilters() {
  searchText.value = ''
  statusFilter.value = 'ALL'
  sessionFilter.value = 'ALL'
  startDate.value = getFirstDayOfCurrentMonth()
  endDate.value = new Date()
}

function closeStartDatePicker() {
  showStartDatePicker.value = false
}

function closeEndDatePicker() {
  showEndDatePicker.value = false
}

function openCalendarView() {
  activeView.value = 'CALENDAR'
}

function openTableView() {
  activeView.value = 'TABLE'
}

function handleCalendarEventClick(info) {
  selectedCalendarGroup.value =
    info.event.extendedProps.group

  showRegisterModal.value = true
}

function handleCalendarDateClick(info) {
  const groups = groupedRegisters.value.filter((group) => {
    return group.attendanceDate === info.dateStr
  })

  if (!groups.length) {
    return
  }

  selectedCalendarGroup.value = groups[0]
  showRegisterModal.value = true
}

function openRegister(group) {
  selectedCalendarGroup.value = group
  showRegisterModal.value = true
}

function openEditRecord(record) {
  selectedEditRecord.value = record

  editForm.value = {
    status: record.status,
    arrivalTime: record.arrivalTime || '',
    remarks: record.remarks || '',
    generalRemarks: record.generalRemarks || '',
  }

  showEditModal.value = true
}

async function saveRecordChanges() {
  if (!selectedEditRecord.value) {
    return
  }

  updatingRecord.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const payload = {
      status: editForm.value.status,
      arrivalTime:
        editForm.value.status === 'LATE'
          ? editForm.value.arrivalTime || null
          : null,
      remarks:
        editForm.value.remarks.trim() || '',
      generalRemarks:
        editForm.value.generalRemarks.trim() || '',
    }

    const response =
      await update_student_attendance(
        selectedEditRecord.value.id,
        payload,
      )

    const responseData = response?.data ?? response
    const updatedRecord = responseData?.record

    const recordIndex =
      attendanceRecords.value.findIndex((record) => {
        return (
          record.id === selectedEditRecord.value.id
        )
      })

    if (recordIndex >= 0) {
      attendanceRecords.value[recordIndex] = {
        ...attendanceRecords.value[recordIndex],
        status: updatedRecord?.status ?? payload.status,
        arrivalTime:
          updatedRecord?.arrivalTime ??
          payload.arrivalTime ??
          '',
        remarks:
          updatedRecord?.remarks ??
          payload.remarks,
        generalRemarks:
          updatedRecord?.generalRemarks ??
          payload.generalRemarks,
        updatedAt:
          updatedRecord?.updatedAt ??
          new Date().toISOString(),
      }
    }

    if (selectedCalendarGroup.value) {
      selectedCalendarGroup.value =
        groupedRegisters.value.find((group) => {
          return (
            group.key ===
            selectedCalendarGroup.value.key
          )
        }) ?? null
    }

    showEditModal.value = false

    toast.success(
      'Student attendance updated successfully.',
    )

    successMessage.value =
      'Student attendance updated successfully.'
  } catch (error) {


    errorMessage.value =
      error?.response?.data?.message ??
      error?.message ??
      'Unable to update student attendance.'


      toast.error(
        errorMessage.value ||
          'Unable to update student attendance. Please try again.',
      )

  } finally {
    updatingRecord.value = false
  }
}

function requestRegisterDeletion(group) {
  selectedDeleteGroup.value = group
  showDeleteModal.value = true
}

async function confirmRegisterDeletion() {
  if (!selectedDeleteGroup.value) {
    return
  }

  deletingRegister.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const group = selectedDeleteGroup.value

    await delete_class_attendance(
      group.classId,
      {
        schoolId: props.schoolId,
        date: group.attendanceDate,
        session: group.session,
      },
    )

    attendanceRecords.value =
      attendanceRecords.value.filter((record) => {
        return !(
          String(record.classId) ===
            String(group.classId) &&
          record.attendanceDate ===
            group.attendanceDate &&
          record.session === group.session
        )
      })

    showDeleteModal.value = false
    showRegisterModal.value = false
    selectedDeleteGroup.value = null
    selectedCalendarGroup.value = null

    successMessage.value =
      'Attendance register deleted successfully.'
    toast.success(
      'Attendance register deleted successfully.'
    )
  } catch (error) {
    toast.error(
      'Unable to delete attendance register. Please try again.',
    )


    errorMessage.value =
      error?.response?.data?.message ??
      error?.message ??
      'Unable to delete attendance register.'

      toast.error(
        errorMessage.value ||
          'Unable to delete attendance register. Please try again.',
      )
  } finally {
    deletingRegister.value = false
  }
}

function editFullRegister(group) {
  emit('edit-register', {
    schoolId: props.schoolId,
    teacherId: group.teacherId,
    classId: group.classId,
    attendanceDate: group.attendanceDate,
    session: group.session,
    records: group.records,
  })

  showRegisterModal.value = false
}



onMounted(async () => {
  currentUser.value =
    getCurrentUser()

  await loadTeacherStudents()
  await loadAttendanceHistory()
})
</script>

<template>
  <div class="attendance-history-page">
    <section class="attendance-history-hero">
      <div class="history-hero-content">
        <div class="history-hero-icon">
          <CIcon
            :icon="cilHistory"
            size="xl"
          />
        </div>

        <div>
          <div class="history-hero-eyebrow">
            Attendance management
          </div>

          <h1 class="history-hero-title">
            Attendance history
          </h1>

          <div class="history-hero-meta">


            <span class="history-separator">

            </span>


          </div>
        </div>
      </div>

      <div class="history-hero-actions">
        <CButton
          color="light"
          variant="outline"
          class="history-refresh-button"
          :disabled="loadingHistory"
          @click="reloadHistory"
        >
          <CSpinner
            v-if="loadingHistory"
            size="sm"
            class="me-2"
          />

          <CIcon
            v-else
            :icon="cilReload"
            class="me-2"
          />

          Refresh
        </CButton>


      </div>
    </section>

    <CAlert
      v-if="errorMessage"
      color="danger"
      dismissible
      class="history-alert"
      @close="errorMessage = ''"
    >
      <CIcon
        :icon="cilWarning"
        class="me-2"
      />

      {{ errorMessage }}
    </CAlert>

    <CAlert
      v-if="successMessage"
      color="success"
      dismissible
      class="history-alert"
      @close="successMessage = ''"
    >
      <CIcon
        :icon="cilCheckAlt"
        class="me-2"
      />

      {{ successMessage }}
    </CAlert>

    <CRow class="g-3 mb-4">
      <CCol
        :xs="12"
        :sm="6"
        :xl="3"
      >
        <CCard class="summary-card summary-registers h-100">
          <CCardBody>
            <div class="summary-card-header">
              <div class="summary-card-icon">
                <CIcon
                  :icon="cilCalendar"
                  size="xl"
                />
              </div>

              <CBadge
                color="primary"
                shape="rounded-pill"
              >
                Registers
              </CBadge>
            </div>

            <div class="summary-card-value">
              {{ totalRegisters }}
            </div>

            <div class="summary-card-label">
              Attendance registers
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol
        :xs="12"
        :sm="6"
        :xl="3"
      >
        <CCard class="summary-card summary-present h-100">
          <CCardBody>
            <div class="summary-card-header">
              <div class="summary-card-icon">
                <CIcon
                  :icon="cilUserFollow"
                  size="xl"
                />
              </div>

              <CBadge
                color="success"
                shape="rounded-pill"
              >
                {{ presentPercentage }}%
              </CBadge>
            </div>

            <div class="summary-card-value">
              {{ presentCount }}
            </div>

            <div class="summary-card-label">
              Present records
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol
        :xs="12"
        :sm="6"
        :xl="3"
      >
        <CCard class="summary-card summary-absent h-100">
          <CCardBody>
            <div class="summary-card-header">
              <div class="summary-card-icon">
                <CIcon
                  :icon="cilUserUnfollow"
                  size="xl"
                />
              </div>

              <CBadge
                color="danger"
                shape="rounded-pill"
              >
                Attention
              </CBadge>
            </div>

            <div class="summary-card-value">
              {{ absentCount }}
            </div>

            <div class="summary-card-label">
              Absent records
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol
        :xs="12"
        :sm="6"
        :xl="3"
      >
        <CCard class="summary-card summary-late h-100">
          <CCardBody>
            <div class="summary-card-header">
              <div class="summary-card-icon">
                <CIcon
                  :icon="cilClock"
                  size="xl"
                />
              </div>

              <CBadge
                color="warning"
                shape="rounded-pill"
              >
                Late
              </CBadge>
            </div>

            <div class="summary-card-value">
              {{ lateCount }}
            </div>

            <div class="summary-card-label">
              Late records
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>

    <CCard class="premium-card mb-4">
      <CCardHeader class="filter-card-header">
        <div>
          <h2>History filters</h2>

          <p>
            Select a date range, session, status, or student.
          </p>
        </div>

        <CButton
          color="secondary"
          variant="ghost"
          size="sm"
          @click="clearFilters"
        >
          Clear filters
        </CButton>
      </CCardHeader>

      <CCardBody>
        <CRow class="g-3">
          <CCol
            :xs="12"
            :md="6"
            :xl="3"
          >
            <label class="history-label">
              From date
            </label>

            <div class="filter-date-wrapper">
              <button
                type="button"
                class="filter-date-button"
                @click="
                  showStartDatePicker =
                    !showStartDatePicker
                "
              >
                <CIcon
                  :icon="cilCalendar"
                  class="me-2"
                />

                {{ selectedStartDateLabel }}
              </button>

              <div
                v-if="showStartDatePicker"
                class="filter-date-popover"
              >
                <VDatePicker
                  v-model="startDate"
                  mode="date"
                  is-required
                  expanded
                  color="blue"
                  :max-date="endDate"
                  @dayclick="closeStartDatePicker"
                />
              </div>
            </div>
          </CCol>

          <CCol
            :xs="12"
            :md="6"
            :xl="3"
          >
            <label class="history-label">
              To date
            </label>

            <div class="filter-date-wrapper">
              <button
                type="button"
                class="filter-date-button"
                @click="
                  showEndDatePicker =
                    !showEndDatePicker
                "
              >
                <CIcon
                  :icon="cilCalendar"
                  class="me-2"
                />

                {{ selectedEndDateLabel }}
              </button>

              <div
                v-if="showEndDatePicker"
                class="filter-date-popover"
              >
                <VDatePicker
                  v-model="endDate"
                  mode="date"
                  is-required
                  expanded
                  color="blue"
                  :min-date="startDate"
                  :max-date="new Date()"
                  @dayclick="closeEndDatePicker"
                />
              </div>
            </div>
          </CCol>

          <CCol
            :xs="12"
            :md="6"
            :xl="3"
          >
            <label class="history-label">
              Session
            </label>

            <CFormSelect
              v-model="sessionFilter"
              class="history-control"
            >
              <option
                v-for="session in sessionOptions"
                :key="session.value"
                :value="session.value"
              >
                {{ session.label }}
              </option>
            </CFormSelect>
          </CCol>

          <CCol
            :xs="12"
            :md="6"
            :xl="3"
          >
            <label class="history-label">
              Status
            </label>

            <CFormSelect
              v-model="statusFilter"
              class="history-control"
            >
              <option
                v-for="status in statusOptions"
                :key="status.value"
                :value="status.value"
              >
                {{ status.label }}
              </option>
            </CFormSelect>
          </CCol>

          <CCol :xs="12">
            <label class="history-label">
              Search student
            </label>

            <div class="history-search">
              <CIcon
                :icon="cilMagnifyingGlass"
                class="history-search-icon"
              />

              <CFormInput
                v-model="searchText"
                type="search"
                class="history-search-input"
                placeholder="Search by student name or index number"
              />

              <button
                v-if="searchText"
                type="button"
                class="history-search-clear"
                @click="searchText = ''"
              >
                <CIcon :icon="cilX" />
              </button>
            </div>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>

    <CCard class="premium-card history-content-card">
      <CCardHeader class="history-content-header">
        <div>
          <h2>Attendance records</h2>

          <p>
            {{ groupedRegisters.length }} registers and
            {{ filteredRecords.length }} student records found.
          </p>
        </div>

        <CButtonGroup class="view-switcher">
          <CButton
  :color="
    activeView === 'TABLE'
      ? 'primary'
      : 'light'
  "
  :class="{ 'text-white': activeView === 'TABLE' }"
  @click="openTableView"
>
  <CIcon
    :icon="cilList"
    class="me-2"
  />

  Table
</CButton>


        </CButtonGroup>
      </CCardHeader>

      <CCardBody class="p-0">
        <div
          v-if="loadingHistory"
          class="history-loading"
        >
          <CSpinner color="primary" />

          <h3>Loading attendance history</h3>

          <p>
            Please wait while the attendance records are loaded.
          </p>
        </div>

        <div
          v-else-if="!groupedRegisters.length"
          class="history-empty"
        >
          <div class="history-empty-icon">
            <CIcon
              :icon="cilHistory"
              size="3xl"
            />
          </div>

          <h3>No attendance history found</h3>

          <p>
            No attendance records match the selected filters.
          </p>

          <CButton
            color="primary"
            variant="outline"
            @click="clearFilters"
          >
            Clear filters
          </CButton>
        </div>

        <div
          v-else-if="activeView === 'CALENDAR'"
          class="calendar-container"
        >
          <FullCalendar
            :options="calendarOptions"
          />
        </div>

        <div
          v-else
          class="history-table-wrapper"
        >
          <table class="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Session</th>
                <th>Total</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Late</th>
                <th>Excused</th>
                <th>Sick</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="group in groupedRegisters"
                :key="group.key"
              >
                <td>
                  <div class="register-date">
                    <div class="register-date-icon">
                      <CIcon :icon="cilCalendar" />
                    </div>

                    <div>
                      <strong>
                        {{
                          formatDisplayDate(
                            group.attendanceDate,
                          )
                        }}
                      </strong>

                      <span>
                        {{ group.attendanceDate }}
                      </span>
                    </div>
                  </div>
                </td>

                <td>
                  <CBadge
                    color="primary"
                    shape="rounded-pill"
                  >
                    {{ getSessionLabel(group.session) }}
                  </CBadge>
                </td>

                <td>
                  <strong>
                    {{ group.totalStudents }}
                  </strong>
                </td>

                <td>
                  <span class="count-badge count-present">
                    {{ group.present }}
                  </span>
                </td>

                <td>
                  <span class="count-badge count-absent">
                    {{ group.absent }}
                  </span>
                </td>

                <td>
                  <span class="count-badge count-late">
                    {{ group.late }}
                  </span>
                </td>

                <td>
                  <span class="count-badge count-excused">
                    {{ group.excused }}
                  </span>
                </td>

                <td>
                  <span class="count-badge count-sick">
                    {{ group.sick }}
                  </span>
                </td>

                <td>
                  <div class="register-actions">
                    <CButton
                      color="primary"
                      variant="outline"
                      size="sm"
                      @click="openRegister(group)"
                    >
                      View
                    </CButton>

                    <CButton
                      color="danger"
                      variant="ghost"
                      size="sm"
                      @click="
                        requestRegisterDeletion(group)
                      "
                    >
                      <CIcon :icon="cilTrash" />
                    </CButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CCardBody>
    </CCard>

    <CModal
      size="xl"
      :visible="showRegisterModal"
      alignment="center"
      scrollable
      @close="showRegisterModal = false"
    >
      <CModalHeader>
        <CModalTitle>
          Attendance register
        </CModalTitle>
      </CModalHeader>

      <CModalBody>
        <div
          v-if="selectedCalendarGroup"
          class="register-modal-content"
        >
          <div class="register-modal-summary">
            <div>
              <span>Date</span>

              <strong>
                {{
                  formatFullDate(
                    selectedCalendarGroup.attendanceDate,
                  )
                }}
              </strong>
            </div>

            <div>
              <span>Session</span>

              <strong>
                {{
                  getSessionLabel(
                    selectedCalendarGroup.session,
                  )
                }}
              </strong>
            </div>

            <div>
              <span>Total students</span>

              <strong>
                {{
                  selectedCalendarGroup.totalStudents
                }}
              </strong>
            </div>
          </div>

          <div class="register-student-table-wrapper">
            <table class="register-student-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Index number</th>
                  <th>Status</th>
                  <th>Arrival</th>
                  <th>Remark</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="record in selectedRegisterRecords"
                  :key="record.id"
                >
                  <td>
                    <div class="student-profile">
                      <CAvatar
                        color="primary"
                        text-color="white"
                        size="md"
                      >
                        {{
                          getStudentInitials(
                            record.studentName,
                          )
                        }}
                      </CAvatar>

                      <div>
                        <strong>
                          {{ record.studentName }}
                        </strong>

                        <span>
                          Student ID:
                          {{ record.studentId }}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>
                    {{ record.indexNo || 'Not assigned' }}
                  </td>

                  <td>
                    <CBadge
                      :color="
                        getStatusDefinition(
                          record.status,
                        )?.color || 'dark'
                      "
                      shape="rounded-pill"
                    >
                      {{ record.status }}
                    </CBadge>
                  </td>

                  <td>
                    {{ record.arrivalTime || 'Not applicable' }}
                  </td>

                  <td>
                    {{ record.remarks || 'No remark' }}
                  </td>

                  <td>
                    <CButton
                      color="primary"
                      variant="outline"
                      size="sm"
                      @click="openEditRecord(record)"
                    >
                      <CIcon
                        :icon="cilPencil"
                        class="me-2"
                      />

                      Edit
                    </CButton>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CModalBody>

      <CModalFooter>
        <CButton
          color="danger"
          variant="outline"
          @click="
            requestRegisterDeletion(
              selectedCalendarGroup,
            )
          "
        >
          <CIcon
            :icon="cilTrash"
            class="me-2"
          />

          Delete register
        </CButton>

        <CButton
          color="secondary"
          variant="ghost"
          @click="showRegisterModal = false"
        >
          Close
        </CButton>


      </CModalFooter>
    </CModal>

    <CModal
      :visible="showEditModal"
      alignment="center"
      backdrop="static"
      @close="showEditModal = false"
    >
      <CModalHeader>
        <CModalTitle>
          Edit student attendance
        </CModalTitle>
      </CModalHeader>

      <CModalBody>
        <div
          v-if="selectedEditRecord"
          class="edit-student-heading"
        >
          <CAvatar
            color="primary"
            text-color="white"
            size="lg"
          >
            {{
              getStudentInitials(
                selectedEditRecord.studentName,
              )
            }}
          </CAvatar>

          <div>
            <strong>
              {{ selectedEditRecord.studentName }}
            </strong>

            <span>
              {{ selectedEditRecord.indexNo }}
            </span>
          </div>
        </div>

        <div class="mb-3">
          <label class="history-label">
            Attendance status
          </label>

          <CFormSelect
            v-model="editForm.status"
            class="history-control"
          >
            <option
              v-for="status in attendanceStatuses"
              :key="status.value"
              :value="status.value"
            >
              {{ status.label }}
            </option>
          </CFormSelect>
        </div>

        <div
          v-if="editForm.status === 'LATE'"
          class="mb-3"
        >
          <label class="history-label">
            Arrival time
          </label>

          <CFormInput
            v-model="editForm.arrivalTime"
            type="time"
            class="history-control"
          />
        </div>

        <div class="mb-3">
          <label class="history-label">
            Student remark
          </label>

          <CFormTextarea
            v-model="editForm.remarks"
            rows="3"
            maxlength="500"
            class="history-control"
            placeholder="Optional attendance remark"
          />
        </div>

        <div>
          <label class="history-label">
            General register note
          </label>

          <CFormTextarea
            v-model="editForm.generalRemarks"
            rows="3"
            maxlength="500"
            class="history-control"
            placeholder="Optional general register note"
          />
        </div>
      </CModalBody>

      <CModalFooter>
        <CButton
          color="secondary"
          variant="ghost"
          :disabled="updatingRecord"
          @click="showEditModal = false"
        >
          Cancel
        </CButton>

        <CButton
          color="primary"
          :disabled="updatingRecord"
          @click="saveRecordChanges"
        >
          <CSpinner
            v-if="updatingRecord"
            size="sm"
            class="me-2"
          />

          <CIcon
            v-else
            :icon="cilSave"
            class="me-2"
          />

          {{
            updatingRecord
              ? 'Saving...'
              : 'Save changes'
          }}
        </CButton>
      </CModalFooter>
    </CModal>

    <CModal
      :visible="showDeleteModal"
      alignment="center"
      backdrop="static"
      @close="showDeleteModal = false"
    >
      <CModalHeader>
        <CModalTitle>
          Delete attendance register
        </CModalTitle>
      </CModalHeader>

      <CModalBody>
        <div class="delete-warning">
          <div class="delete-warning-icon">
            <CIcon
              :icon="cilTrash"
              size="xl"
            />
          </div>

          <h4>
            Permanently delete this register?
          </h4>

          <p v-if="selectedDeleteGroup">
            The
            {{
              getSessionLabel(
                selectedDeleteGroup.session,
              )
            }}
            register for
            {{
              formatFullDate(
                selectedDeleteGroup.attendanceDate,
              )
            }}
            will be deleted.
          </p>

          <CAlert color="warning">
            This action deletes all student attendance records
            in the selected register.
          </CAlert>
        </div>
      </CModalBody>

      <CModalFooter>
        <CButton
          color="secondary"
          variant="ghost"
          :disabled="deletingRegister"
          @click="showDeleteModal = false"
        >
          Cancel
        </CButton>

        <CButton
          color="danger"
          :disabled="deletingRegister"
          @click="confirmRegisterDeletion"
        >
          <CSpinner
            v-if="deletingRegister"
            size="sm"
            class="me-2"
          />

          <CIcon
            v-else
            :icon="cilTrash"
            class="me-2"
          />

          {{
            deletingRegister
              ? 'Deleting...'
              : 'Delete register'
          }}
        </CButton>
      </CModalFooter>
    </CModal>
  </div>
</template>

<style scoped>
.attendance-history-page {
  --history-primary: #3159d9;
  --history-primary-dark: #2444ad;
  --history-primary-soft: #eef3ff;
  --history-success: #16a06d;
  --history-success-soft: #eafaf3;
  --history-danger: #dc4c64;
  --history-danger-soft: #fff0f2;
  --history-warning: #e79a18;
  --history-warning-soft: #fff8e8;
  --history-info: #2589c7;
  --history-info-soft: #eaf7ff;
  --history-sick: #7567d9;
  --history-sick-soft: #f1efff;
  --history-text: #20263a;
  --history-heading: #161b2c;
  --history-muted: #6e778c;
  --history-border: #e5e9f2;

  width: 100%;
  padding-bottom: 2rem;
  color: var(--history-text);
}

.attendance-history-hero {
  position: relative;
  display: flex;
  min-height: 145px;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  overflow: hidden;
  margin-bottom: 1.5rem;
  padding: 1.75rem 2rem;
  border-radius: 1.25rem;
  color: #ffffff;
  background:
    radial-gradient(
      circle at 90% 10%,
      rgba(255, 255, 255, 0.2),
      transparent 32%
    ),
    linear-gradient(
      135deg,
      #2444ad 0%,
      #3159d9 48%,
      #5f7ce5 100%
    );
  box-shadow:
    0 18px 45px rgba(49, 89, 217, 0.22);
}

.attendance-history-hero::after {
  position: absolute;
  right: -60px;
  bottom: -90px;
  width: 230px;
  height: 230px;
  border: 35px solid rgba(255, 255, 255, 0.07);
  border-radius: 50%;
  content: '';
}

.history-hero-content,
.history-hero-actions {
  position: relative;
  z-index: 2;
}

.history-hero-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.history-hero-icon {
  display: grid;
  flex: 0 0 auto;
  width: 60px;
  height: 60px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(12px);
}

.history-hero-eyebrow {
  margin-bottom: 0.25rem;
  color: rgba(255, 255, 255, 0.74);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.history-hero-title {
  margin: 0 0 0.4rem;
  color: #ffffff;
  font-size: 2rem;
  font-weight: 800;
}

.history-hero-meta {
  display: flex;
  flex-wrap: wrap;
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.9rem;
}

.history-separator {
  margin: 0 0.55rem;
  opacity: 0.5;
}

.history-hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.history-refresh-button,
.take-attendance-button {
  min-height: 44px;
  padding-right: 1.1rem;
  padding-left: 1.1rem;
  border-radius: 0.75rem;
  font-weight: 750;
}

.history-refresh-button {
  border-color: rgba(255, 255, 255, 0.5);
  color: #ffffff;
}

.history-refresh-button:hover {
  color: var(--history-primary);
  background: #ffffff;
}

.take-attendance-button {
  color: var(--history-primary);
  background: #ffffff;
}

.history-alert {
  border: 0;
  border-radius: 1rem;
  box-shadow:
    0 8px 25px rgba(25, 37, 68, 0.08);
}

.premium-card,
.summary-card {
  border: 1px solid var(--history-border);
  border-radius: 1.1rem;
  background: #ffffff;
  box-shadow:
    0 10px 32px rgba(31, 46, 86, 0.065);
}

.summary-card {
  overflow: hidden;
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.summary-card:hover {
  box-shadow:
    0 14px 32px rgba(31, 46, 86, 0.1);
  transform: translateY(-2px);
}

.summary-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.summary-card-icon {
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  border-radius: 14px;
}

.summary-card-value {
  margin-top: 1.1rem;
  color: var(--history-heading);
  font-size: 1.85rem;
  font-weight: 800;
  line-height: 1;
}

.summary-card-label {
  margin-top: 0.45rem;
  color: var(--history-muted);
  font-size: 0.86rem;
  font-weight: 600;
}

.summary-registers .summary-card-icon {
  color: var(--history-primary);
  background: var(--history-primary-soft);
}

.summary-present .summary-card-icon {
  color: var(--history-success);
  background: var(--history-success-soft);
}

.summary-absent .summary-card-icon {
  color: var(--history-danger);
  background: var(--history-danger-soft);
}

.summary-late .summary-card-icon {
  color: var(--history-warning);
  background: var(--history-warning-soft);
}

.filter-card-header,
.history-content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.2rem 1.4rem;
  border-bottom: 1px solid var(--history-border);
  background: #ffffff;
}

.filter-card-header h2,
.history-content-header h2 {
  margin: 0;
  color: var(--history-heading);
  font-size: 1.02rem;
  font-weight: 800;
}

.filter-card-header p,
.history-content-header p {
  margin: 0.25rem 0 0;
  color: var(--history-muted);
  font-size: 0.8rem;
}

.history-label {
  display: block;
  margin-bottom: 0.45rem;
  color: #4c566f;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.history-control {
  min-height: 44px;
  border-color: var(--history-border);
  border-radius: 0.75rem;
}

.history-control:focus {
  border-color: var(--history-primary);
  box-shadow:
    0 0 0 0.2rem rgba(49, 89, 217, 0.11);
}

.filter-date-wrapper {
  position: relative;
}

.filter-date-button {
  display: flex;
  width: 100%;
  min-height: 44px;
  align-items: center;
  padding: 0.65rem 0.8rem;
  border: 1px solid var(--history-border);
  border-radius: 0.75rem;
  color: var(--history-text);
  background: #ffffff;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  text-align: left;
}

.filter-date-button:hover {
  border-color: var(--history-primary);
}

.filter-date-popover {
  position: absolute;
  z-index: 1100;
  top: calc(100% + 8px);
  left: 0;
  width: 330px;
  padding: 0.6rem;
  border: 1px solid var(--history-border);
  border-radius: 1rem;
  background: #ffffff;
  box-shadow:
    0 20px 55px rgba(28, 42, 80, 0.18);
}

.filter-date-popover :deep(.vc-container) {
  width: 100%;
  border: 0;
  font-family: inherit;
}

.history-search {
  position: relative;
}

.history-search-icon {
  position: absolute;
  z-index: 2;
  top: 50%;
  left: 0.9rem;
  color: #8b94a8;
  transform: translateY(-50%);
}

.history-search-input {
  min-height: 44px;
  padding-right: 2.7rem;
  padding-left: 2.6rem;
  border-color: var(--history-border);
  border-radius: 0.75rem;
}

.history-search-input:focus {
  border-color: var(--history-primary);
  box-shadow:
    0 0 0 0.2rem rgba(49, 89, 217, 0.11);
}

.history-search-clear {
  position: absolute;
  top: 50%;
  right: 0.65rem;
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: var(--history-muted);
  background: transparent;
  transform: translateY(-50%);
}

.history-search-clear:hover {
  color: var(--history-danger);
  background: var(--history-danger-soft);
}

.history-content-card {
  overflow: hidden;
}

.view-switcher {
  padding: 0.25rem;
  border-radius: 0.75rem;
  background: #f1f3f8;
}

.view-switcher .btn {
  min-height: 38px;
  border: 0;
  border-radius: 0.6rem;
  font-size: 0.76rem;
  font-weight: 750;
}

.history-loading,
.history-empty {
  display: flex;
  min-height: 360px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 3rem 1.5rem;
  text-align: center;
}

.history-loading h3,
.history-empty h3 {
  margin: 1rem 0 0.3rem;
  color: var(--history-heading);
  font-size: 1.05rem;
  font-weight: 800;
}

.history-loading p,
.history-empty p {
  margin-bottom: 1rem;
  color: var(--history-muted);
  font-size: 0.84rem;
}

.history-empty-icon {
  display: grid;
  width: 88px;
  height: 88px;
  place-items: center;
  border-radius: 28px;
  color: var(--history-primary);
  background: var(--history-primary-soft);
}

.calendar-container {
  padding: 1.25rem;
}

.calendar-container :deep(.fc) {
  color: var(--history-text);
  font-family: inherit;
}

.calendar-container :deep(.fc-toolbar-title) {
  color: var(--history-heading);
  font-size: 1.25rem;
  font-weight: 800;
}

.calendar-container :deep(.fc-button) {
  border-color: var(--history-primary);
  border-radius: 0.55rem;
  background: var(--history-primary);
  box-shadow: none;
  font-size: 0.75rem;
  font-weight: 750;
}

.calendar-container :deep(.fc-daygrid-day) {
  background: #ffffff;
}

.calendar-container :deep(.fc-day-today) {
  background: var(--history-primary-soft);
}

.calendar-container :deep(.fc-event) {
  padding: 0.2rem 0.35rem;
  border-radius: 0.45rem;
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: 750;
}

.history-table-wrapper,
.register-student-table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.history-table,
.register-student-table {
  width: 100%;
  min-width: 900px;
  border-collapse: collapse;
}

.history-table th,
.register-student-table th {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--history-border);
  color: #778096;
  background: #fbfcff;
  font-size: 0.67rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}

.history-table td,
.register-student-table td {
  padding: 0.9rem 1rem;
  border-bottom: 1px solid #edf0f6;
  vertical-align: middle;
}

.history-table tbody tr:hover,
.register-student-table tbody tr:hover {
  background: #fafbff;
}

.register-date {
  display: flex;
  min-width: 170px;
  align-items: center;
  gap: 0.7rem;
}

.register-date-icon {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 11px;
  color: var(--history-primary);
  background: var(--history-primary-soft);
}

.register-date strong {
  display: block;
  color: var(--history-heading);
  font-size: 0.8rem;
}

.register-date span {
  display: block;
  margin-top: 0.1rem;
  color: var(--history-muted);
  font-size: 0.68rem;
}

.count-badge {
  display: inline-grid;
  min-width: 32px;
  height: 28px;
  place-items: center;
  border-radius: 0.5rem;
  font-size: 0.72rem;
  font-weight: 800;
}

.count-present {
  color: var(--history-success);
  background: var(--history-success-soft);
}

.count-absent {
  color: var(--history-danger);
  background: var(--history-danger-soft);
}

.count-late {
  color: #ad6d05;
  background: var(--history-warning-soft);
}

.count-excused {
  color: var(--history-info);
  background: var(--history-info-soft);
}

.count-sick {
  color: var(--history-sick);
  background: var(--history-sick-soft);
}

.register-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.register-actions .btn {
  border-radius: 0.6rem;
  font-size: 0.72rem;
  font-weight: 750;
}

.register-modal-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.8rem;
  margin-bottom: 1.25rem;
}

.register-modal-summary > div {
  display: flex;
  min-height: 78px;
  justify-content: center;
  flex-direction: column;
  padding: 0.8rem 1rem;
  border: 1px solid var(--history-border);
  border-radius: 0.8rem;
  background: #f9faff;
}

.register-modal-summary span {
  color: var(--history-muted);
  font-size: 0.67rem;
  font-weight: 750;
  text-transform: uppercase;
}

.register-modal-summary strong {
  margin-top: 0.25rem;
  color: var(--history-heading);
  font-size: 0.84rem;
}

.student-profile {
  display: flex;
  min-width: 220px;
  align-items: center;
  gap: 0.75rem;
}

.student-profile strong {
  display: block;
  color: var(--history-heading);
  font-size: 0.82rem;
  text-transform: capitalize;
}

.student-profile span {
  display: block;
  margin-top: 0.12rem;
  color: var(--history-muted);
  font-size: 0.68rem;
}

.edit-student-heading {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1.25rem;
  padding: 0.85rem;
  border-radius: 0.8rem;
  background: var(--history-primary-soft);
}

.edit-student-heading strong {
  display: block;
  color: var(--history-heading);
  text-transform: capitalize;
}

.edit-student-heading span {
  display: block;
  margin-top: 0.15rem;
  color: var(--history-muted);
  font-size: 0.74rem;
}

.delete-warning {
  text-align: center;
}

.delete-warning-icon {
  display: grid;
  width: 70px;
  height: 70px;
  margin: 0 auto 1rem;
  place-items: center;
  border-radius: 21px;
  color: var(--history-danger);
  background: var(--history-danger-soft);
}

.delete-warning h4 {
  color: var(--history-heading);
  font-weight: 800;
}

.delete-warning p {
  color: var(--history-muted);
  font-size: 0.84rem;
  line-height: 1.6;
}

.attendance-history-page :deep(.modal-content) {
  overflow: hidden;
  border: 0;
  border-radius: 1.1rem;
  box-shadow:
    0 25px 70px rgba(26, 37, 71, 0.23);
}

.attendance-history-page :deep(.modal-title) {
  color: var(--history-heading);
  font-size: 1rem;
  font-weight: 800;
}

.attendance-history-page :deep(.modal-footer .btn) {
  min-height: 40px;
  border-radius: 0.7rem;
  font-size: 0.76rem;
  font-weight: 750;
}

@media (max-width: 991.98px) {
  .attendance-history-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .history-hero-actions {
    width: 100%;
  }

  .register-modal-summary {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767.98px) {
  .attendance-history-hero {
    padding: 1.3rem;
    border-radius: 1rem;
  }

  .history-hero-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
  }

  .history-hero-title {
    font-size: 1.45rem;
  }

  .history-hero-actions {
    flex-direction: column;
  }

  .history-hero-actions .btn {
    width: 100%;
  }

  .filter-card-header,
  .history-content-header {
    align-items: flex-start;
    flex-direction: column;
    padding: 1rem;
  }

  .view-switcher {
    width: 100%;
  }

  .view-switcher .btn {
    flex: 1;
  }

  .filter-date-popover {
    right: 0;
    left: auto;
    width: min(330px, calc(100vw - 3rem));
  }

  .calendar-container {
    padding: 0.75rem;
  }

  .calendar-container :deep(.fc-toolbar) {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.7rem;
  }

  .calendar-container :deep(.fc-toolbar-title) {
    font-size: 1rem;
  }
}

@media (max-width: 575.98px) {
  .history-hero-meta {
    align-items: flex-start;
    flex-direction: column;
  }

  .history-separator {
    display: none;
  }

  .register-modal-summary {
    gap: 0.5rem;
  }
}
</style>
