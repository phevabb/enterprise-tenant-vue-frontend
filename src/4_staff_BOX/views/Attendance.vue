<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { DatePicker as VDatePicker } from 'v-calendar'
import 'v-calendar/style.css'




import CIcon from '@coreui/icons-vue'

import {
  cilCalendar,
  cilCheckAlt,
  cilClock,
  cilCloudUpload,
  cilFilter,
  cilGroup,
  cilList,
  cilMagnifyingGlass,
  cilPeople,
  cilReload,
  cilSave,
  cilSearch,
  cilUserFollow,
  cilUserUnfollow,
  cilWarning,
  cilX,
} from '@coreui/icons'

import { useToast } from 'vue-toastification'
const toast = useToast()

import {
  save_teacher_attendance,
  get_teacher_student,
  assigned_class_ktor,
  get_terms_with_year_ktor,
} from '@/services/api'

const emit = defineEmits([
  'attendance-submitted',
])

const assignedClass = ref(null)

const displayedClassName = computed(() => {
  return (
    assignedClass.value?.name ||
    props.className ||
    'Assigned Class'
  )
})

const loadingAssignedClass = ref(false)

const currentUser = ref(null)

const displayedTeacherName = computed(() => {
  const storedUser =
    currentUser.value ??
    getCurrentUser()

  const fullName =
    String(
      storedUser?.fullName || '',
    ).trim()

  return (
    fullName ||
    props.teacherName ||
    'Class Teacher'
  )
})


const selectedTerm = ref(null)
const loadingTerm = ref(false)


const tenantCode = ref(
  localStorage.getItem('tenantCode') || '',
)


function getCurrentUser() {
  const storedUser =
    localStorage.getItem('user')

  if (
    storedUser === null ||
    storedUser.trim().length === 0
  ) {
    return null
  }

  try {
    const parsedUser =
      JSON.parse(storedUser)

    if (
      parsedUser === null ||
      typeof parsedUser !== 'object'
    ) {
      return null
    }

    return parsedUser
  } catch (error) {

    toast.error(
      'Unable to read logged-in user information. Please sign in again.',
    )


    return null
  }
}



async function loadAssignedClass() {
  loadingAssignedClass.value = true
  loadError.value = ''

  try {
    currentUser.value =
      getCurrentUser()

    if (currentUser.value === null) {
      assignedClass.value = null

      loadError.value =
        'The logged-in user information is missing. Please sign in again.'

      return
    }

    const userId =
      String(
        currentUser.value.userId || '',
      ).trim()

    if (userId.length === 0) {
      assignedClass.value = null

      loadError.value =
        'The logged-in user account number is missing.'

      return
    }

    const response =
      await assigned_class_ktor(userId)



    const classData =
      response?.data?.assignedClass ??
      response?.data?.data?.assignedClass ??
      response?.assignedClass ??
      null



    const classId =
      Number(classData?.id)

    if (
      classData === null ||
      Number.isFinite(classId) === false ||
      classId <= 0
    ) {
      assignedClass.value = null

      loadError.value =
        'No class has been assigned to this teacher.'

      return
    }

    const className =
      String(
        classData.name || '',
      ).trim()

    assignedClass.value = {
      id: classId,
      name:
        className.length > 0
          ? className
          : 'Assigned class',
    }


  } catch (error) {


    assignedClass.value = null

    const message =
      error?.response?.data?.message ??
      error?.message ??
      'Unable to load the teacher’s assigned class. Please try again.'

    loadError.value = message

    toast.error(message)
  } finally {
    loadingAssignedClass.value = false
  }
}


const currentAcademicYearId = computed(() => {
  return Number(
    selectedTerm.value?.academicYear?.id,
  )
})

const currentTermId = computed(() => {
  return Number(
    selectedTerm.value?.id,
  )
})

const currentAcademicYearName = computed(() => {
  return (
    selectedTerm.value?.academicYear?.name ||
    props.academicYear ||
    ''
  )
})

const currentTermName = computed(() => {
  return (
    selectedTerm.value?.name ||
    props.termName ||
    ''
  )
})


async function loadCurrentTerm() {
  loadingTerm.value = true
  loadError.value = ''

  try {
    const response =
      await get_terms_with_year_ktor()

    const responseData =
      response?.data ?? response

    let termData = null

    if (Array.isArray(responseData)) {
      termData =
        responseData[0] ?? null
    } else if (
      Array.isArray(responseData?.data)
    ) {
      termData =
        responseData.data[0] ?? null
    } else if (
      Array.isArray(responseData?.terms)
    ) {
      termData =
        responseData.terms[0] ?? null
    } else if (
      responseData?.term &&
      typeof responseData.term === 'object'
    ) {
      termData =
        responseData.term
    } else if (
      responseData?.data &&
      typeof responseData.data === 'object'
    ) {
      termData =
        responseData.data
    } else if (
      responseData &&
      typeof responseData === 'object'
    ) {
      termData =
        responseData
    }

    const termId =
      Number(termData?.id)

    const academicYearId =
      Number(
        termData?.academic_year?.id ??
        termData?.academicYear?.id ??
        termData?.academic_year_id ??
        termData?.academicYearId,
      )

    if (
      Number.isFinite(termId) === false ||
      termId <= 0 ||
      Number.isFinite(academicYearId) === false ||
      academicYearId <= 0
    ) {
      selectedTerm.value = null

      loadError.value =
        'The current academic term and academic year could not be found.'

      return
    }

    selectedTerm.value = {
      id: termId,

      name:
        termData?.name ??
        'Current term',

      academicYear: {
        id: academicYearId,

        name:
          termData?.academic_year?.name ??
          termData?.academicYear?.name ??
          '',
      },
    }
  } catch (error) {

    toast.error(
      'Unable to load the current academic term. Please try again.',
    )

    selectedTerm.value = null

    loadError.value =
      error?.response?.data?.message ??
      error?.message ??
      'Unable to load the current academic term.'
  } finally {
    loadingTerm.value = false
  }
}


async function prepareSubmission() {
  submitError.value = ''
  submitSuccess.value = ''

  tenantCode.value =
    localStorage.getItem('tenantCode') || ''

  currentUser.value =
    getCurrentUser()

  const cleanTenantCode =
    String(tenantCode.value).trim()

  if (cleanTenantCode.length === 0) {
    submitError.value =
      'The tenant information is missing. Please sign in again.'

    return
  }

  if (currentUser.value === null) {
    submitError.value =
      'The logged-in user information is missing. Please sign in again.'

    return
  }

  const teacherId =
    Number(currentUser.value.id)

  if (
    Number.isFinite(teacherId) === false ||
    teacherId <= 0
  ) {
    submitError.value =
      'The logged-in teacher ID is invalid.'

    return
  }

  const teacherUserId =
    String(
      currentUser.value.userId || '',
    ).trim()

  if (teacherUserId.length === 0) {
    submitError.value =
      'The logged-in teacher account number is missing.'

    return
  }

  if (
    currentUser.value.isActive !== true
  ) {
    submitError.value =
      'The logged-in user account is not active.'

    return
  }

  if (
    currentUser.value.isStaff !== true
  ) {
    submitError.value =
      'Only a staff account can submit attendance.'

    return
  }

  if (
    assignedClass.value === null ||
    Number(assignedClass.value.id) <= 0
  ) {
    await loadAssignedClass()
  }

  if (
    assignedClass.value === null ||
    Number(assignedClass.value.id) <= 0
  ) {
    submitError.value =
      'No class has been assigned to this teacher.'

    return
  }

  if (
    attendanceDate.value === null ||
    attendanceDate.value === undefined
  ) {
    submitError.value =
      'Please select the attendance date.'

    return
  }



if (selectedTerm.value === null) {
  await loadCurrentTerm()
}

const academicYearId =
  currentAcademicYearId.value

if (
  Number.isFinite(academicYearId) === false ||
  academicYearId <= 0
) {
  submitError.value =
    'The academic year information is missing.'

  return
}

const termId =
  currentTermId.value

if (
  Number.isFinite(termId) === false ||
  termId <= 0
) {
  submitError.value =
    'The term information is missing.'

  return
}




  const validSessions = [
    'MORNING',
    'AFTERNOON',
    'FULL_DAY',
  ]

  const sessionIsValid =
    validSessions.includes(
      attendanceSession.value,
    )

  if (sessionIsValid === false) {
    submitError.value =
      'Please select a valid attendance session.'

    return
  }

  if (students.value.length === 0) {
    submitError.value =
      'There are no students to submit.'

    return
  }

  const studentWithoutId =
    students.value.find((student) => {
      const studentId =
        Number(student.id)

      return (
        Number.isFinite(studentId) === false ||
        studentId <= 0
      )
    })

  if (studentWithoutId !== undefined) {
    const studentName =
      studentWithoutId.full_name ||
      'A student'

    submitError.value =
      `${studentName} has an invalid student ID.`

    return
  }

  if (notMarkedStudentsCount.value > 0) {
    submitError.value =
      `${notMarkedStudentsCount.value} student(s) have not been marked.`

    return
  }

  const validStatuses = [
    'PRESENT',
    'ABSENT',
    'LATE',
    'EXCUSED',
    'SICK',
  ]

  const studentWithInvalidStatus =
    students.value.find((student) => {
      return (
        validStatuses.includes(
          student.attendanceStatus,
        ) === false
      )
    })

  if (
    studentWithInvalidStatus !== undefined
  ) {
    const studentName =
      studentWithInvalidStatus.full_name ||
      'A student'

    submitError.value =
      `${studentName} has an invalid attendance status.`

    return
  }

  const lateStudentWithoutArrivalTime =
    students.value.find((student) => {
      if (
        student.attendanceStatus !== 'LATE'
      ) {
        return false
      }

      const arrivalTime =
        String(
          student.arrivalTime || '',
        ).trim()

      return arrivalTime.length === 0
    })

  if (
    lateStudentWithoutArrivalTime !==
    undefined
  ) {
    const studentName =
      lateStudentWithoutArrivalTime
        .full_name ||
      'the selected student'

    submitError.value =
      `Enter the arrival time for ${studentName}.`

    return
  }

  const arrivalTimePattern =
    /^([01][0-9]|2[0-3]):[0-5][0-9]$/

  const lateStudentWithInvalidArrivalTime =
    students.value.find((student) => {
      if (
        student.attendanceStatus !== 'LATE'
      ) {
        return false
      }

      const arrivalTime =
        String(
          student.arrivalTime || '',
        ).trim()

      return (
        arrivalTimePattern.test(
          arrivalTime,
        ) === false
      )
    })

  if (
    lateStudentWithInvalidArrivalTime !==
    undefined
  ) {
    const studentName =
      lateStudentWithInvalidArrivalTime
        .full_name ||
      'the selected student'

    submitError.value =
      `The arrival time for ${studentName} is invalid.`

    return
  }

  const studentWithLongRemark =
    students.value.find((student) => {
      return (
        String(
          student.remarks || '',
        ).trim().length > 500
      )
    })

  if (
    studentWithLongRemark !== undefined
  ) {
    const studentName =
      studentWithLongRemark.full_name ||
      'A student'

    submitError.value =
      `The remark for ${studentName} cannot exceed 500 characters.`

    return
  }

  const cleanedGeneralRemarks =
    String(
      generalRemarks.value || '',
    ).trim()

  if (
    cleanedGeneralRemarks.length > 500
  ) {
    submitError.value =
      'The general attendance note cannot exceed 500 characters.'

    return
  }

  tenantCode.value =
    cleanTenantCode

  generalRemarks.value =
    cleanedGeneralRemarks

  showSubmissionModal.value = true
}





const props = defineProps({
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

  academicYear: {
    type: String,
    default: '',
  },

  termName: {
    type: String,
    default: '',
  },
})

const students = ref([])
const loadingStudents = ref(false)
const submittingAttendance = ref(false)

const loadError = ref('')
const submitError = ref('')
const submitSuccess = ref('')

const searchText = ref('')
const statusFilter = ref('ALL')
const selectedStudentIds = ref([])

const attendanceDate = ref(new Date())
const attendanceSession = ref('MORNING')
const generalRemarks = ref('')

const showDatePicker = ref(false)
const showSubmissionModal = ref(false)
const showResetModal = ref(false)

const attendanceStatuses = [
  {
    value: 'PRESENT',
    label: 'Present',
    shortLabel: 'P',
    color: 'success',
    className: 'status-present',
    icon: cilCheckAlt,
  },
  {
    value: 'ABSENT',
    label: 'Absent',
    shortLabel: 'A',
    color: 'danger',
    className: 'status-absent',
    icon: cilUserUnfollow,
  },
  {
    value: 'LATE',
    label: 'Late',
    shortLabel: 'L',
    color: 'warning',
    className: 'status-late',
    icon: cilClock,
  },
  {
    value: 'EXCUSED',
    label: 'Excused',
    shortLabel: 'E',
    color: 'info',
    className: 'status-excused',
    icon: cilWarning,
  },
  {
    value: 'SICK',
    label: 'Sick',
    shortLabel: 'S',
    color: 'secondary',
    className: 'status-sick',
    icon: cilWarning,
  },
  {
    value: 'NOT_MARKED',
    label: 'Not marked',
    shortLabel: 'N',
    color: 'dark',
    className: 'status-not-marked',
    icon: cilX,
  },
]

const selectableStatuses = computed(() => {
  return attendanceStatuses.filter((status) => {
    return status.value !== 'NOT_MARKED'
  })
})

const sessionOptions = [
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

const statusFilterOptions = computed(() => {
  const options = [
    {
      value: 'ALL',
      label: `All students (${students.value.length})`,
    },
  ]

  attendanceStatuses.forEach((status) => {
    options.push({
      value: status.value,
      label: `${status.label} (${getStatusCount(status.value)})`,
    })
  })

  return options
})

const selectedDateLabel = computed(() => {
  if (!attendanceDate.value) {
    return 'Select attendance date'
  }

  return new Intl.DateTimeFormat('en-GH', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(attendanceDate.value)
})

const selectedDateShortLabel = computed(() => {
  if (!attendanceDate.value) {
    return ''
  }

  return new Intl.DateTimeFormat('en-GH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(attendanceDate.value)
})

const formattedAttendanceDate = computed(() => {
  if (!attendanceDate.value) {
    return null
  }

  const year = attendanceDate.value.getFullYear()

  const month = String(
    attendanceDate.value.getMonth() + 1,
  ).padStart(2, '0')

  const day = String(
    attendanceDate.value.getDate(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
})

const filteredStudents = computed(() => {
  const query = searchText.value
    .trim()
    .toLowerCase()

  return students.value.filter((student) => {
    const studentName = String(
      student.full_name || '',
    ).toLowerCase()

    const studentIndex = String(
      student.indexNo || '',
    ).toLowerCase()

    const matchesSearch =
      !query ||
      studentName.includes(query) ||
      studentIndex.includes(query)

    const matchesStatus =
      statusFilter.value === 'ALL' ||
      student.attendanceStatus === statusFilter.value

    return matchesSearch && matchesStatus
  })
})

const allFilteredStudentsSelected = computed(() => {
  if (!filteredStudents.value.length) {
    return false
  }

  return filteredStudents.value.every((student) => {
    return selectedStudentIds.value.includes(student.id)
  })
})

const selectedStudentsCount = computed(() => {
  return selectedStudentIds.value.length
})

const markedStudentsCount = computed(() => {
  return students.value.filter((student) => {
    return student.attendanceStatus !== 'NOT_MARKED'
  }).length
})

const notMarkedStudentsCount = computed(() => {
  return getStatusCount('NOT_MARKED')
})

const attendanceCompletionPercentage = computed(() => {
  const totalStudents = students.value.length

  if (!totalStudents) {
    return 0
  }

  return Math.round(
    markedStudentsCount.value / (totalStudents / 100),
  )
})

const presentPercentage = computed(() => {
  const totalStudents = students.value.length

  if (!totalStudents) {
    return 0
  }

  return Math.round(
    getStatusCount('PRESENT') / (totalStudents / 100),
  )
})

const selectedSessionLabel = computed(() => {
  const session = sessionOptions.find((item) => {
    return item.value === attendanceSession.value
  })

  return session
    ? session.label
    : attendanceSession.value
})

const canSubmitAttendance = computed(() => {
  return (
    students.value.length > 0 &&
    Boolean(attendanceDate.value) &&
    notMarkedStudentsCount.value === 0 &&
    !submittingAttendance.value
  )
})

watch(attendanceDate, () => {
  submitSuccess.value = ''
  submitError.value = ''
})

watch(attendanceSession, () => {
  submitSuccess.value = ''
  submitError.value = ''
})

function normalizeStudents(response) {
  const responseData = response?.data ?? response

  let studentList = []

  if (Array.isArray(responseData)) {
    studentList = responseData
  } else if (Array.isArray(responseData?.data)) {
    studentList = responseData.data
  } else if (Array.isArray(responseData?.students)) {
    studentList = responseData.students
  } else if (Array.isArray(responseData?.result)) {
    studentList = responseData.result
  }

  return studentList.map((student) => {
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
        student.student_id ??
        '',

      attendanceStatus:
        student.attendanceStatus ??
        'PRESENT',

      arrivalTime:
        student.arrivalTime ??
        '',

      remarks:
        student.remarks ??
        '',
    }
  })
}

async function loadTeacherStudents() {
  loadingStudents.value = true
  loadError.value = ''
  submitError.value = ''
  submitSuccess.value = ''
  selectedStudentIds.value = []

  try {
    const response = await get_teacher_student()

    students.value = normalizeStudents(response)

    if (!students.value.length) {
      loadError.value =
        'No students were found for the teacher’s assigned class.'
    }
  } catch (error) {

    toast.error(
      'Unable to load the student list. Please try again.',
    )

    loadError.value =
      error?.response?.data?.message ??
      error?.message ??
      'Unable to load the student list. Please try again.'
  } finally {
    loadingStudents.value = false
  }
}

function getStatusCount(statusValue) {
  return students.value.filter((student) => {
    return student.attendanceStatus === statusValue
  }).length
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

function setStudentStatus(student, status) {
  student.attendanceStatus = status

  if (status !== 'LATE') {
    student.arrivalTime = ''
  }

  submitSuccess.value = ''
  submitError.value = ''
}

function markAllStudents(status) {
  students.value.forEach((student) => {
    student.attendanceStatus = status

    if (status !== 'LATE') {
      student.arrivalTime = ''
    }
  })

  submitSuccess.value = ''
  submitError.value = ''
}

function markSelectedStudents(status) {
  if (!selectedStudentIds.value.length) {
    return
  }

  students.value.forEach((student) => {
    const isSelected =
      selectedStudentIds.value.includes(student.id)

    if (isSelected) {
      student.attendanceStatus = status

      if (status !== 'LATE') {
        student.arrivalTime = ''
      }
    }
  })

  selectedStudentIds.value = []
  submitSuccess.value = ''
  submitError.value = ''
}

function toggleFilteredStudentsSelection() {
  if (allFilteredStudentsSelected.value) {
    const visibleIds = filteredStudents.value.map((student) => {
      return student.id
    })

    selectedStudentIds.value =
      selectedStudentIds.value.filter((studentId) => {
        return !visibleIds.includes(studentId)
      })

    return
  }

  const selectedIds = new Set(
    selectedStudentIds.value,
  )

  filteredStudents.value.forEach((student) => {
    selectedIds.add(student.id)
  })

  selectedStudentIds.value = Array.from(selectedIds)
}

function clearSelectedStudents() {
  selectedStudentIds.value = []
}

function clearFilters() {
  searchText.value = ''
  statusFilter.value = 'ALL'
}






function buildAttendancePayload() {
  const loggedInUser =
    currentUser.value ??
    getCurrentUser()

  return {
    tenantCode:
      String(
        tenantCode.value,
      ).trim(),

    teacherId:
      Number(loggedInUser.id),

    classId:
      Number(assignedClass.value.id),

    academicYearId:
  currentAcademicYearId.value,

termId:
  currentTermId.value,

    attendanceDate:
      formattedAttendanceDate.value,

    session:
      attendanceSession.value,

    remarks:
      String(
        generalRemarks.value || '',
      ).trim() || null,

    students:
      students.value.map((student) => {
        return {
          studentId:
            Number(student.id),

          indexNo:
            student.indexNo || null,

          status:
            student.attendanceStatus,

          arrivalTime:
            student.attendanceStatus ===
            'LATE'
              ? String(
                  student.arrivalTime || '',
                ).trim() || null
              : null,

          remarks:
            String(
              student.remarks || '',
            ).trim() || null,
        }
      }),
  }
}




async function submitAttendance() {
  submittingAttendance.value = true
  submitError.value = ''
  submitSuccess.value = ''

  try {
    const payload = buildAttendancePayload()

    const response =
      await save_teacher_attendance(payload)

    const responseData =
      response?.data ?? response

    submitSuccess.value =
      responseData?.message ??
      `Attendance for ${selectedDateShortLabel.value} was submitted successfully.`

      toast.success(
        submitSuccess.value,
      )

    showSubmissionModal.value = false

    emit('attendance-submitted', {
      payload,
      response: responseData,
    })
  } catch (error) {

    toast.error(
      'Unable to submit attendance. Please try again.',
    )


    submitError.value =
      error?.response?.data?.message ??
      error?.message ??
      'Unable to submit attendance. Please try again.'
  } finally {
    submittingAttendance.value = false
  }
}
function resetAttendance() {
  students.value.forEach((student) => {
    student.attendanceStatus = 'PRESENT'
    student.arrivalTime = ''
    student.remarks = ''
  })

  selectedStudentIds.value = []
  generalRemarks.value = ''
  searchText.value = ''
  statusFilter.value = 'ALL'
  submitError.value = ''
  submitSuccess.value = ''
  showResetModal.value = false
}

function closeDatePicker() {
  showDatePicker.value = false
}

onMounted(async () => {
  await Promise.all([
    loadTeacherStudents(),
    loadAssignedClass(),
    loadCurrentTerm(),
  ])
})


</script>

<template>
  <div class="teacher-attendance-page">
    <section class="attendance-hero">
      <div class="attendance-hero-content">
        <div class="attendance-hero-icon">
          <CIcon
            :icon="cilPeople"
            size="xl"
          />
        </div>

        <div>
          <div class="attendance-hero-eyebrow">
            Student attendance
          </div>

          <h1 class="attendance-hero-title">
            Take class attendance
          </h1>

          <div class="attendance-hero-meta">
            <span>{{ displayedClassName }}</span>

            <span class="attendance-separator">
              •
            </span>

            <span>{{ displayedTeacherName }}</span>



            <template v-if="currentAcademicYearName">
  <span class="attendance-separator">
    •
  </span>

  <span>
    {{ currentAcademicYearName }}
  </span>
</template>

<template v-if="currentTermName">
  <span class="attendance-separator">
    •
  </span>

  <span>
    {{ currentTermName }}
  </span>
</template>



          </div>
        </div>
      </div>

      <div class="attendance-hero-actions">
        <CButton
          color="light"
          variant="outline"
          class="hero-action-button"
          :disabled="loadingStudents"
          @click="loadTeacherStudents"
        >
          <CSpinner
            v-if="loadingStudents"
            size="sm"
            class="me-2"
          />

          <CIcon
            v-else
            :icon="cilReload"
            class="me-2"
          />

          Refresh students
        </CButton>

        <CButton
          color="light"
          class="hero-submit-button"
          :disabled="!canSubmitAttendance"
          @click="prepareSubmission"
        >
          <CIcon
            :icon="cilCloudUpload"
            class="me-2"
          />

          Submit attendance
        </CButton>
      </div>
    </section>

    <CAlert
      v-if="loadError"
      color="danger"
      dismissible
      class="premium-alert"
      @close="loadError = ''"
    >
      <CIcon
        :icon="cilWarning"
        class="me-2"
      />

      {{ loadError }}
    </CAlert>

    <CAlert
      v-if="submitError"
      color="danger"
      dismissible
      class="premium-alert"
      @close="submitError = ''"
    >
      <CIcon
        :icon="cilWarning"
        class="me-2"
      />

      {{ submitError }}
    </CAlert>

    <CAlert
      v-if="submitSuccess"
      color="success"
      dismissible
      class="premium-alert"
      @close="submitSuccess = ''"
    >
      <CIcon
        :icon="cilCheckAlt"
        class="me-2"
      />

      {{ submitSuccess }}
    </CAlert>

    <CRow class="g-3 mb-4">
      <CCol
        :xs="12"
        :sm="6"
        :xl="3"
      >
        <CCard class="summary-card summary-students h-100">
          <CCardBody>
            <div class="summary-card-top">
              <div class="summary-card-icon">
                <CIcon
                  :icon="cilGroup"
                  size="xl"
                />
              </div>

              <CBadge
                color="primary"
                shape="rounded-pill"
              >
                Class list
              </CBadge>
            </div>

            <div class="summary-card-value">
              {{ students.length }}
            </div>

            <div class="summary-card-label">
              Total students
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
            <div class="summary-card-top">
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
              {{ getStatusCount('PRESENT') }}
            </div>

            <div class="summary-card-label">
              Students present
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
            <div class="summary-card-top">
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
              {{ getStatusCount('ABSENT') }}
            </div>

            <div class="summary-card-label">
              Students absent
            </div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol
        :xs="12"
        :sm="6"
        :xl="3"
      >
        <CCard class="summary-card summary-completion h-100">
          <CCardBody>
            <div class="summary-card-top">
              <div class="summary-card-icon">
                <CIcon
                  :icon="cilList"
                  size="xl"
                />
              </div>

              <CBadge
                :color="
                  attendanceCompletionPercentage === 100
                    ? 'success'
                    : 'warning'
                "
                shape="rounded-pill"
              >
                {{ attendanceCompletionPercentage }}%
              </CBadge>
            </div>

            <div class="summary-card-value">
              {{ markedStudentsCount }}/{{ students.length }}
            </div>

            <div class="summary-card-label">
              Attendance completed
            </div>

            <CProgress
              class="mt-3"
              height="6"
              :color="
                attendanceCompletionPercentage === 100
                  ? 'success'
                  : 'warning'
              "
              :value="attendanceCompletionPercentage"
            />
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>

    <CCard class="premium-card mb-4">
      <CCardBody>
        <CRow class="g-3 align-items-end">
          <CCol
            :xs="12"
            :lg="5"
          >
            <label class="premium-label">
              Attendance date
            </label>

            <div class="date-picker-wrapper">
              <button
                type="button"
                class="premium-date-button"
                @click="showDatePicker = !showDatePicker"
              >
                <span class="premium-date-icon">
                  <CIcon :icon="cilCalendar" />
                </span>

                <span class="premium-date-content">
                  <span class="premium-date-caption">
                    Selected date
                  </span>

                  <span class="premium-date-value">
                    {{ selectedDateLabel }}
                  </span>
                </span>

                <span class="premium-date-change">
                  Change
                </span>
              </button>

              <div
                v-if="showDatePicker"
                class="date-picker-popover"
              >
                <VDatePicker
                  v-model="attendanceDate"
                  mode="date"
                  is-required
                  expanded
                  color="blue"
                  :max-date="new Date()"
                  @dayclick="closeDatePicker"
                />
              </div>
            </div>
          </CCol>

          <CCol
            :xs="12"
            :md="6"
            :lg="3"
          >
            <label
              for="attendance-session"
              class="premium-label"
            >
              Attendance session
            </label>

            <CFormSelect
              id="attendance-session"
              v-model="attendanceSession"
              size="lg"
              class="premium-control"
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
            :lg="4"
          >
            <label class="premium-label">
              Quick actions
            </label>

            <div class="quick-actions">
              <CButton
                color="success"
                variant="outline"
                @click="markAllStudents('PRESENT')"
              >
                <CIcon
                  :icon="cilCheckAlt"
                  class="me-2"
                />

                Mark all present
              </CButton>

              <CButton
                color="secondary"
                variant="outline"
                @click="showResetModal = true"
              >
                Reset
              </CButton>
            </div>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>

    <CCard class="premium-card attendance-register-card">
      <CCardHeader class="attendance-card-header">
        <div>
          <h2 class="attendance-card-title">
            Class register
          </h2>

          <p class="attendance-card-subtitle">
            Mark each student for
            {{ selectedDateShortLabel }}.
          </p>
        </div>

        <div class="attendance-result-count">
          Showing {{ filteredStudents.length }} of
          {{ students.length }} students
        </div>
      </CCardHeader>

      <CCardBody class="p-0">
        <div class="attendance-toolbar">
          <div class="attendance-search">
            <CIcon
              :icon="cilMagnifyingGlass"
              class="attendance-search-icon"
            />

            <CFormInput
              v-model="searchText"
              type="search"
              class="attendance-search-input"
              placeholder="Search name or index number"
            />

            <button
              v-if="searchText"
              type="button"
              class="attendance-search-clear"
              @click="searchText = ''"
            >
              <CIcon :icon="cilX" />
            </button>
          </div>

          <div class="attendance-filter">
            <CIcon
              :icon="cilFilter"
              class="attendance-filter-icon"
            />

            <CFormSelect
              v-model="statusFilter"
              class="attendance-filter-select"
            >
              <option
                v-for="option in statusFilterOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </CFormSelect>
          </div>
        </div>

        <div
          v-if="selectedStudentsCount > 0"
          class="bulk-action-bar"
        >
          <div class="bulk-selection">
            <div class="bulk-count">
              {{ selectedStudentsCount }}
            </div>

            <div>
              <div class="bulk-title">
                Students selected
              </div>

              <div class="bulk-description">
                Apply one attendance status to the selection.
              </div>
            </div>
          </div>

          <div class="bulk-actions">
            <CButton
              v-for="status in selectableStatuses"
              :key="status.value"
              :color="status.color"
              size="sm"
              variant="outline"
              @click="markSelectedStudents(status.value)"
            >
              {{ status.label }}
            </CButton>

            <CButton
              color="secondary"
              size="sm"
              variant="ghost"
              @click="clearSelectedStudents"
            >
              Clear
            </CButton>
          </div>
        </div>

        <div
          v-if="loadingStudents"
          class="attendance-loading"
        >
          <CSpinner color="primary" />

          <div class="loading-title">
            Loading students
          </div>

          <div class="loading-description">
            Preparing the teacher’s class register.
          </div>
        </div>

        <div
          v-else-if="!students.length"
          class="attendance-empty"
        >
          <div class="attendance-empty-icon">
            <CIcon
              :icon="cilPeople"
              size="3xl"
            />
          </div>

          <h3>No students found</h3>

          <p>
            No students are currently assigned to this teacher.
          </p>

          <CButton
            color="primary"
            variant="outline"
            @click="loadTeacherStudents"
          >
            <CIcon
              :icon="cilReload"
              class="me-2"
            />

            Try again
          </CButton>
        </div>

        <div
          v-else-if="!filteredStudents.length"
          class="attendance-empty"
        >
          <div class="attendance-empty-icon">
            <CIcon
              :icon="cilSearch"
              size="3xl"
            />
          </div>

          <h3>No matching students</h3>

          <p>
            Change the search text or attendance filter.
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
          v-else
          class="attendance-table-wrapper"
        >
          <table class="attendance-table">
            <thead>
              <tr>
                <th class="check-column">
                  <CFormCheck
                    :model-value="allFilteredStudentsSelected"
                    @change="toggleFilteredStudentsSelection"
                  />
                </th>

                <th class="number-column">
                  No.
                </th>

                <th>Student</th>

                <th>Index number</th>

                <th>Attendance status</th>

                <th>Details</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(student, index) in filteredStudents"
                :key="student.id"
                :class="{
                  'student-row-selected':
                    selectedStudentIds.includes(student.id),
                }"
              >
                <td class="check-column">
                  <CFormCheck
                    v-model="selectedStudentIds"
                    :value="student.id"
                  />
                </td>

                <td class="number-column">
                  {{ index + 1 }}
                </td>

                <td>
                  <div class="student-profile">
                    <CAvatar
                      color="primary"
                      text-color="white"
                      size="md"
                      class="student-avatar"
                    >
                      {{ getStudentInitials(student.full_name) }}
                    </CAvatar>

                    <div>
                      <div class="student-name">
                        {{ student.full_name }}
                      </div>

                      <div class="student-id">
                        Student ID: {{ student.id }}
                      </div>
                    </div>
                  </div>
                </td>

                <td>
                  <span class="student-index">
                    {{ student.indexNo || 'Not assigned' }}
                  </span>
                </td>

                <td>
                  <div class="status-selector">
                    <button
                      v-for="status in selectableStatuses"
                      :key="status.value"
                      type="button"
                      :class="[
                        'status-button',
                        status.className,
                        {
                          'status-button-active':
                            student.attendanceStatus === status.value,
                        },
                      ]"
                      @click="setStudentStatus(student, status.value)"
                    >
                      <CIcon
                        :icon="status.icon"
                        class="status-button-icon"
                      />

                      <span class="status-button-short">
                        {{ status.shortLabel }}
                      </span>

                      <span class="status-button-label">
                        {{ status.label }}
                      </span>
                    </button>
                  </div>
                </td>

                <td>
                  <div class="student-detail-inputs">
                    <CFormInput
                      v-if="student.attendanceStatus === 'LATE'"
                      v-model="student.arrivalTime"
                      type="time"
                      size="sm"
                      class="arrival-time-input"
                    />

                    <CFormInput
                      v-model="student.remarks"
                      type="text"
                      size="sm"
                      class="student-remark-input"
                      placeholder="Optional remark"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          v-if="students.length && !loadingStudents"
          class="attendance-footer"
        >
          <div class="attendance-legend">
            <div
              v-for="status in attendanceStatuses"
              :key="status.value"
              class="legend-item"
            >
              <span
                :class="[
                  'legend-dot',
                  status.className,
                ]"
              ></span>

              <span>{{ status.label }}</span>

              <strong>
                {{ getStatusCount(status.value) }}
              </strong>
            </div>
          </div>

          <div class="attendance-footer-actions">
            <div
              v-if="notMarkedStudentsCount > 0"
              class="submission-warning"
            >
              <CIcon
                :icon="cilWarning"
                class="me-2"
              />

              {{ notMarkedStudentsCount }} not marked
            </div>

            <CButton
              color="primary"
              size="lg"
              class="attendance-submit-button"
              :disabled="!canSubmitAttendance"
              @click="prepareSubmission"
            >
              <CIcon
                :icon="cilSave"
                class="me-2"
              />

              Review and submit
            </CButton>
          </div>
        </div>
      </CCardBody>
    </CCard>

    <CCard class="premium-card mt-4">
      <CCardHeader class="remarks-header">
        <div>
          <h3 class="remarks-title">
            General attendance note
          </h3>

          <p class="remarks-subtitle">
            Add an optional note about today’s attendance.
          </p>
        </div>
      </CCardHeader>

      <CCardBody>
        <CFormTextarea
          v-model="generalRemarks"
          rows="3"
          maxlength="500"
          class="premium-control"
          placeholder="Example: Attendance was affected by heavy rainfall."
        />

        <div class="character-counter">
          {{ generalRemarks.length }}/500
        </div>
      </CCardBody>
    </CCard>

    <CModal
      :visible="showSubmissionModal"
      alignment="center"
      backdrop="static"
      @close="showSubmissionModal = false"
    >
      <CModalHeader>
        <CModalTitle>
          Confirm attendance
        </CModalTitle>
      </CModalHeader>

      <CModalBody>
        <div class="submission-summary">
          <div class="submission-summary-icon">
            <CIcon
              :icon="cilCloudUpload"
              size="2xl"
            />
          </div>

          <h4>
            Submit this attendance register?
          </h4>

          <p>
            Review the information before continuing.
          </p>

          <div class="submission-details">
            <div class="submission-detail-row">
              <span>Date</span>

              <strong>
                {{ selectedDateLabel }}
              </strong>
            </div>

            <div class="submission-detail-row">
              <span>Class</span>

              <strong>
                {{ displayedClassName }}
              </strong>
            </div>

            <div class="submission-detail-row">
              <span>Session</span>

              <strong>
                {{ selectedSessionLabel }}
              </strong>
            </div>

            <div class="submission-detail-row">
              <span>Total students</span>

              <strong>
                {{ students.length }}
              </strong>
            </div>
          </div>

          <div class="submission-status-grid">
            <div
              v-for="status in selectableStatuses"
              :key="status.value"
              class="submission-status-item"
            >
              <span
                :class="[
                  'submission-status-dot',
                  status.className,
                ]"
              ></span>

              <span>
                {{ status.label }}
              </span>

              <strong>
                {{ getStatusCount(status.value) }}
              </strong>
            </div>
          </div>
        </div>
      </CModalBody>

      <CModalFooter>
        <CButton
          color="secondary"
          variant="ghost"
          :disabled="submittingAttendance"
          @click="showSubmissionModal = false"
        >
          Continue editing
        </CButton>



        <CButton
  color="primary"
  :disabled="submittingAttendance"
  @click="submitAttendance"
  style="color: white;"
>
  <CSpinner
    v-if="submittingAttendance"
    size="sm"
    class="me-2"
  />

  <CIcon
    v-else
    :icon="cilCloudUpload"
    class="me-2"
  />

  {{
    submittingAttendance
      ? 'Submitting...'
      : 'Submit attendance'
  }}
</CButton>


      </CModalFooter>
    </CModal>

    <CModal
      :visible="showResetModal"
      alignment="center"
      @close="showResetModal = false"
    >
      <CModalHeader>
        <CModalTitle>
          Reset attendance
        </CModalTitle>
      </CModalHeader>

      <CModalBody>
        All students will be marked as present. Arrival times,
        individual remarks, filters, and the general note will
        be cleared.
      </CModalBody>

      <CModalFooter>
        <CButton
          color="secondary"
          variant="ghost"
          @click="showResetModal = false"
        >
          Cancel
        </CButton>

        <CButton
          color="danger"
          @click="resetAttendance"
        >
          Reset attendance
        </CButton>
      </CModalFooter>
    </CModal>
  </div>
</template>



<style scoped>
.teacher-attendance-page {
  --attendance-primary: #3159d9;
  --attendance-primary-dark: #2444ad;
  --attendance-primary-light: #5f7ce5;
  --attendance-primary-soft: #eef3ff;
  --attendance-success: #16a06d;
  --attendance-success-dark: #0d8055;
  --attendance-success-soft: #eafaf3;
  --attendance-danger: #dc4c64;
  --attendance-danger-dark: #b9344a;
  --attendance-danger-soft: #fff0f2;
  --attendance-warning: #e79a18;
  --attendance-warning-dark: #ad6d05;
  --attendance-warning-soft: #fff8e8;
  --attendance-info: #2589c7;
  --attendance-info-dark: #176b9d;
  --attendance-info-soft: #eaf7ff;
  --attendance-sick: #7567d9;
  --attendance-sick-dark: #5749bb;
  --attendance-sick-soft: #f1efff;
  --attendance-dark: #596175;
  --attendance-dark-soft: #f0f1f4;
  --attendance-text: #20263a;
  --attendance-heading: #161b2c;
  --attendance-muted: #6e778c;
  --attendance-muted-light: #929bad;
  --attendance-border: #e5e9f2;
  --attendance-border-dark: #d4dae7;
  --attendance-background: #f5f7fb;
  --attendance-card: #ffffff;
  --attendance-shadow:
    0 10px 32px rgba(31, 46, 86, 0.065);
  --attendance-shadow-large:
    0 18px 45px rgba(31, 46, 86, 0.12);

  width: 100%;
  min-height: 100%;
  padding-bottom: 2rem;
  color: var(--attendance-text);
}

.attendance-hero {
  position: relative;
  display: flex;
  min-height: 150px;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  overflow: hidden;
  margin-bottom: 1.5rem;
  padding: 1.75rem 2rem;
  border: 0;
  border-radius: 1.25rem;
  color: #ffffff;
  background:
    radial-gradient(
      circle at 90% 10%,
      rgba(255, 255, 255, 0.2),
      transparent 32%
    ),
    radial-gradient(
      circle at 10% 100%,
      rgba(255, 255, 255, 0.08),
      transparent 38%
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

.attendance-hero::before {
  position: absolute;
  top: -80px;
  right: 160px;
  width: 190px;
  height: 190px;
  border: 28px solid rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  content: '';
  pointer-events: none;
}

.attendance-hero::after {
  position: absolute;
  right: -60px;
  bottom: -90px;
  width: 230px;
  height: 230px;
  border: 35px solid rgba(255, 255, 255, 0.07);
  border-radius: 50%;
  content: '';
  pointer-events: none;
}

.attendance-hero-content {
  position: relative;
  z-index: 2;
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 1rem;
}

.attendance-hero-icon {
  display: grid;
  flex: 0 0 auto;
  width: 60px;
  height: 60px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 18px;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.14);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
}

.attendance-hero-eyebrow {
  margin-bottom: 0.25rem;
  color: rgba(255, 255, 255, 0.74);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.11em;
  line-height: 1.4;
  text-transform: uppercase;
}

.attendance-hero-title {
  margin: 0 0 0.4rem;
  color: #ffffff;
  font-size: clamp(1.45rem, 3vw, 2rem);
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.15;
}

.attendance-hero-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.92rem;
  font-weight: 500;
}

.attendance-separator {
  margin: 0 0.55rem;
  opacity: 0.5;
}

.attendance-hero-actions {
  position: relative;
  z-index: 2;
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}

.hero-action-button,
.hero-submit-button {
  min-height: 44px;
  padding: 0.65rem 1.15rem;
  border-radius: 0.75rem;
  font-size: 0.84rem;
  font-weight: 750;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.hero-action-button {
  border-color: rgba(255, 255, 255, 0.5);
  color: #ffffff;
  background: rgba(255, 255, 255, 0.06);
}

.hero-action-button:hover:not(:disabled) {
  border-color: #ffffff;
  color: var(--attendance-primary);
  background: #ffffff;
  box-shadow:
    0 8px 20px rgba(19, 35, 91, 0.16);
  transform: translateY(-1px);
}

.hero-submit-button {
  border-color: #ffffff;
  color: var(--attendance-primary);
  background: #ffffff;
  box-shadow:
    0 8px 20px rgba(19, 35, 91, 0.14);
}

.hero-submit-button:hover:not(:disabled) {
  border-color: #ffffff;
  color: var(--attendance-primary-dark);
  background: #f5f7ff;
  transform: translateY(-1px);
}

.hero-action-button:disabled,
.hero-submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.premium-alert {
  margin-bottom: 1rem;
  padding: 0.9rem 1rem;
  border: 0;
  border-radius: 1rem;
  box-shadow:
    0 8px 25px rgba(25, 37, 68, 0.08);
}

.premium-card {
  overflow: visible;
  border: 1px solid var(--attendance-border);
  border-radius: 1.15rem;
  background: var(--attendance-card);
  box-shadow: var(--attendance-shadow);
}

.summary-card {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--attendance-border);
  border-radius: 1.1rem;
  background: var(--attendance-card);
  box-shadow:
    0 8px 25px rgba(31, 46, 86, 0.055);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.summary-card:hover {
  border-color: var(--attendance-border-dark);
  box-shadow:
    0 14px 32px rgba(31, 46, 86, 0.095);
  transform: translateY(-2px);
}

.summary-card::after {
  position: absolute;
  top: -40px;
  right: -40px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  content: '';
  opacity: 0.55;
  pointer-events: none;
}

.summary-card .card-body {
  position: relative;
  z-index: 1;
  padding: 1.25rem;
}

.summary-students::after {
  background: var(--attendance-primary-soft);
}

.summary-present::after {
  background: var(--attendance-success-soft);
}

.summary-absent::after {
  background: var(--attendance-danger-soft);
}

.summary-completion::after {
  background: var(--attendance-warning-soft);
}

.summary-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.summary-card-icon {
  display: grid;
  flex: 0 0 auto;
  width: 46px;
  height: 46px;
  place-items: center;
  border-radius: 14px;
}

.summary-card-value {
  margin-top: 1.1rem;
  color: var(--attendance-heading);
  font-size: 1.85rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
}

.summary-card-label {
  margin-top: 0.45rem;
  color: var(--attendance-muted);
  font-size: 0.88rem;
  font-weight: 600;
}

.summary-students .summary-card-icon {
  color: var(--attendance-primary);
  background: var(--attendance-primary-soft);
}

.summary-present .summary-card-icon {
  color: var(--attendance-success);
  background: var(--attendance-success-soft);
}

.summary-absent .summary-card-icon {
  color: var(--attendance-danger);
  background: var(--attendance-danger-soft);
}

.summary-completion .summary-card-icon {
  color: var(--attendance-warning);
  background: var(--attendance-warning-soft);
}

.summary-card :deep(.badge) {
  position: relative;
  z-index: 2;
  padding: 0.43rem 0.65rem;
  font-size: 0.68rem;
  font-weight: 800;
}

.summary-card :deep(.progress) {
  overflow: hidden;
  border-radius: 999px;
  background: #eef0f5;
}

.summary-card :deep(.progress-bar) {
  border-radius: 999px;
  transition: width 0.35s ease;
}

.premium-label {
  display: block;
  margin-bottom: 0.5rem;
  color: #4c566f;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  line-height: 1.4;
  text-transform: uppercase;
}

.premium-control {
  min-height: 44px;
  border: 1px solid var(--attendance-border);
  border-radius: 0.75rem;
  color: var(--attendance-text);
  background-color: #ffffff;
  font-size: 0.88rem;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.premium-control:hover {
  border-color: var(--attendance-border-dark);
}

.premium-control:focus {
  border-color: var(--attendance-primary);
  box-shadow:
    0 0 0 0.2rem rgba(49, 89, 217, 0.12);
}

.date-picker-wrapper {
  position: relative;
}

.premium-date-button {
  display: flex;
  width: 100%;
  min-height: 62px;
  align-items: center;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--attendance-border);
  border-radius: 0.9rem;
  color: var(--attendance-text);
  background: #ffffff;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.premium-date-button:hover {
  border-color: var(--attendance-primary);
  box-shadow:
    0 8px 22px rgba(49, 89, 217, 0.1);
  transform: translateY(-1px);
}

.premium-date-button:focus-visible {
  border-color: var(--attendance-primary);
  outline: 0;
  box-shadow:
    0 0 0 0.2rem rgba(49, 89, 217, 0.12);
}

.premium-date-icon {
  display: grid;
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 12px;
  color: var(--attendance-primary);
  background: var(--attendance-primary-soft);
}

.premium-date-content {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  padding: 0 0.8rem;
}

.premium-date-caption {
  color: var(--attendance-muted);
  font-size: 0.67rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.premium-date-value {
  overflow: hidden;
  margin-top: 0.05rem;
  color: var(--attendance-heading);
  font-size: 0.92rem;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.premium-date-change {
  flex: 0 0 auto;
  color: var(--attendance-primary);
  font-size: 0.75rem;
  font-weight: 800;
}

.date-picker-popover {
  position: absolute;
  z-index: 1050;
  top: calc(100% + 8px);
  left: 0;
  width: 100%;
  min-width: 310px;
  padding: 0.65rem;
  border: 1px solid var(--attendance-border);
  border-radius: 1rem;
  background: #ffffff;
  box-shadow:
    0 20px 55px rgba(28, 42, 80, 0.18);
}

.date-picker-popover :deep(.vc-container) {
  width: 100%;
  border: 0;
  color: var(--attendance-text);
  font-family: inherit;
}

.date-picker-popover :deep(.vc-header) {
  margin-bottom: 0.35rem;
}

.date-picker-popover :deep(.vc-title) {
  color: var(--attendance-heading);
  font-size: 0.92rem;
  font-weight: 800;
}

.date-picker-popover :deep(.vc-weekday) {
  color: var(--attendance-muted);
  font-size: 0.68rem;
  font-weight: 800;
}

.date-picker-popover :deep(.vc-day-content) {
  font-size: 0.78rem;
  font-weight: 650;
}

.date-picker-popover :deep(.vc-highlight) {
  background: var(--attendance-primary);
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem;
}

.quick-actions .btn {
  min-height: 44px;
  padding: 0.65rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.8rem;
  font-weight: 750;
}

.attendance-register-card {
  overflow: hidden;
}

.attendance-card-header,
.remarks-header {
  display: flex;
  min-height: 78px;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.3rem 1.5rem;
  border-bottom: 1px solid var(--attendance-border);
  border-radius: 1.15rem 1.15rem 0 0;
  background: #ffffff;
}

.attendance-card-title,
.remarks-title {
  margin: 0;
  color: var(--attendance-heading);
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.015em;
}

.attendance-card-subtitle,
.remarks-subtitle {
  margin: 0.25rem 0 0;
  color: var(--attendance-muted);
  font-size: 0.82rem;
  line-height: 1.45;
}

.attendance-result-count {
  flex: 0 0 auto;
  padding: 0.45rem 0.75rem;
  border: 1px solid #dce4ff;
  border-radius: 999px;
  color: var(--attendance-primary);
  background: var(--attendance-primary-soft);
  font-size: 0.72rem;
  font-weight: 800;
  white-space: nowrap;
}

.attendance-toolbar {
  display: grid;
  grid-template-columns:
    minmax(300px, 1fr)
    minmax(230px, 300px);
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--attendance-border);
  background: #fbfcff;
}

.attendance-search,
.attendance-filter {
  position: relative;
}

.attendance-search-icon,
.attendance-filter-icon {
  position: absolute;
  z-index: 2;
  top: 50%;
  left: 0.9rem;
  color: #8b94a8;
  pointer-events: none;
  transform: translateY(-50%);
}

.attendance-search-input,
.attendance-filter-select {
  min-height: 44px;
  padding-left: 2.6rem;
  border: 1px solid var(--attendance-border);
  border-radius: 0.75rem;
  color: var(--attendance-text);
  background-color: #ffffff;
  font-size: 0.84rem;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.attendance-search-input {
  padding-right: 2.7rem;
}

.attendance-search-input::placeholder {
  color: #9ba3b4;
}

.attendance-search-input:hover,
.attendance-filter-select:hover {
  border-color: var(--attendance-border-dark);
}

.attendance-search-input:focus,
.attendance-filter-select:focus {
  border-color: var(--attendance-primary);
  box-shadow:
    0 0 0 0.2rem rgba(49, 89, 217, 0.1);
}

.attendance-search-clear {
  position: absolute;
  z-index: 3;
  top: 50%;
  right: 0.65rem;
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  color: var(--attendance-muted);
  background: transparent;
  cursor: pointer;
  transform: translateY(-50%);
  transition:
    color 0.15s ease,
    background-color 0.15s ease;
}

.attendance-search-clear:hover {
  color: var(--attendance-danger);
  background: var(--attendance-danger-soft);
}

.attendance-search-clear:focus-visible {
  outline: 2px solid rgba(49, 89, 217, 0.3);
  outline-offset: 1px;
}

.bulk-action-bar {
  display: flex;
  min-height: 68px;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1.5rem;
  border-bottom: 1px solid #cfd9f7;
  background:
    linear-gradient(
      90deg,
      #eef3ff 0%,
      #f5f7ff 100%
    );
}

.bulk-selection {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.75rem;
}

.bulk-count {
  display: grid;
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 12px;
  color: #ffffff;
  background: var(--attendance-primary);
  box-shadow:
    0 6px 14px rgba(49, 89, 217, 0.22);
  font-size: 0.9rem;
  font-weight: 800;
}

.bulk-title {
  color: var(--attendance-heading);
  font-size: 0.84rem;
  font-weight: 800;
}

.bulk-description {
  margin-top: 0.1rem;
  color: var(--attendance-muted);
  font-size: 0.72rem;
}

.bulk-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.45rem;
}

.bulk-actions .btn {
  min-height: 34px;
  padding: 0.4rem 0.7rem;
  border-radius: 0.65rem;
  font-size: 0.72rem;
  font-weight: 750;
}

.attendance-loading,
.attendance-empty {
  display: flex;
  min-height: 350px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 3rem 1.5rem;
  text-align: center;
}

.attendance-loading :deep(.spinner-border) {
  width: 2.3rem;
  height: 2.3rem;
  border-width: 0.2rem;
}

.loading-title {
  margin-top: 1rem;
  color: var(--attendance-heading);
  font-size: 1rem;
  font-weight: 800;
}

.loading-description {
  margin-top: 0.3rem;
  color: var(--attendance-muted);
  font-size: 0.84rem;
}

.attendance-empty-icon {
  display: grid;
  width: 88px;
  height: 88px;
  margin-bottom: 1.25rem;
  place-items: center;
  border-radius: 28px;
  color: var(--attendance-primary);
  background: var(--attendance-primary-soft);
  box-shadow:
    inset 0 0 0 1px rgba(49, 89, 217, 0.06);
}

.attendance-empty h3 {
  margin: 0 0 0.35rem;
  color: var(--attendance-heading);
  font-size: 1.2rem;
  font-weight: 800;
}

.attendance-empty p {
  max-width: 420px;
  margin: 0 0 1.25rem;
  color: var(--attendance-muted);
  font-size: 0.88rem;
  line-height: 1.6;
}

.attendance-empty .btn {
  min-height: 42px;
  border-radius: 0.7rem;
  font-weight: 750;
}

.attendance-table-wrapper {
  width: 100%;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scrollbar-color:
    #c7cddd
    #f3f5f9;
  scrollbar-width: thin;
}

.attendance-table-wrapper::-webkit-scrollbar {
  height: 9px;
}

.attendance-table-wrapper::-webkit-scrollbar-track {
  background: #f3f5f9;
}

.attendance-table-wrapper::-webkit-scrollbar-thumb {
  border: 2px solid #f3f5f9;
  border-radius: 999px;
  background: #c7cddd;
}

.attendance-table-wrapper::-webkit-scrollbar-thumb:hover {
  background: #aeb6c9;
}

.attendance-table {
  width: 100%;
  min-width: 1120px;
  border-spacing: 0;
  border-collapse: separate;
}

.attendance-table th {
  position: sticky;
  z-index: 4;
  top: 0;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--attendance-border);
  color: #778096;
  background: #fbfcff;
  font-size: 0.67rem;
  font-weight: 800;
  letter-spacing: 0.045em;
  line-height: 1.3;
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}

.attendance-table td {
  padding: 0.9rem 1rem;
  border-bottom: 1px solid #edf0f6;
  color: var(--attendance-text);
  background: #ffffff;
  vertical-align: middle;
}

.attendance-table tbody tr {
  transition:
    background-color 0.16s ease,
    box-shadow 0.16s ease;
}

.attendance-table tbody tr:hover td {
  background: #fafbff;
}

.attendance-table tbody tr:last-child td {
  border-bottom: 0;
}

.attendance-table tbody tr.student-row-selected td {
  background: #f3f6ff;
}

.attendance-table tbody tr.student-row-selected td:first-child {
  box-shadow:
    inset 3px 0 0 var(--attendance-primary);
}

.check-column {
  width: 48px;
  min-width: 48px;
  text-align: center !important;
}

.number-column {
  width: 58px;
  min-width: 58px;
  color: var(--attendance-muted) !important;
  font-size: 0.78rem;
  font-weight: 700;
  text-align: center !important;
}

.attendance-table :deep(.form-check-input) {
  width: 1rem;
  height: 1rem;
  margin-top: 0;
  border-color: #c8cede;
  cursor: pointer;
}

.attendance-table :deep(.form-check-input:checked) {
  border-color: var(--attendance-primary);
  background-color: var(--attendance-primary);
}

.attendance-table :deep(.form-check-input:focus) {
  border-color: var(--attendance-primary);
  box-shadow:
    0 0 0 0.18rem rgba(49, 89, 217, 0.12);
}

.student-profile {
  display: flex;
  min-width: 220px;
  align-items: center;
  gap: 0.8rem;
}

.student-avatar {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  border: 2px solid #ffffff;
  color: #ffffff;
  background:
    linear-gradient(
      135deg,
      var(--attendance-primary),
      #6c86e9
    ) !important;
  box-shadow:
    0 4px 11px rgba(49, 89, 217, 0.2);
  font-size: 0.78rem;
  font-weight: 800;
}

.student-name {
  max-width: 220px;
  overflow: hidden;
  color: var(--attendance-heading);
  font-size: 0.88rem;
  font-weight: 800;
  line-height: 1.35;
  text-overflow: ellipsis;
  text-transform: capitalize;
  white-space: nowrap;
}

.student-id {
  margin-top: 0.15rem;
  color: var(--attendance-muted);
  font-size: 0.7rem;
  font-weight: 500;
}

.student-index {
  display: inline-flex;
  min-height: 29px;
  align-items: center;
  padding: 0.35rem 0.6rem;
  border: 1px solid var(--attendance-border);
  border-radius: 0.5rem;
  color: #505970;
  background: #f9fafc;
  font-size: 0.74rem;
  font-weight: 750;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.status-selector {
  display: flex;
  min-width: 365px;
  align-items: center;
  gap: 0.35rem;
}

.status-button {
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.4rem 0.6rem;
  border: 1px solid var(--attendance-border);
  border-radius: 0.65rem;
  color: #697287;
  background: #ffffff;
  font-family: inherit;
  font-size: 0.7rem;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    background-color 0.15s ease,
    box-shadow 0.15s ease;
}

.status-button:hover {
  transform: translateY(-1px);
}

.status-button:focus-visible {
  outline: 2px solid rgba(49, 89, 217, 0.28);
  outline-offset: 2px;
}

.status-button-icon {
  width: 0.88rem;
  height: 0.88rem;
}

.status-button-short {
  display: none;
}

.status-present:hover,
.status-present.status-button-active {
  border-color: var(--attendance-success);
  color: var(--attendance-success-dark);
  background: var(--attendance-success-soft);
}

.status-absent:hover,
.status-absent.status-button-active {
  border-color: var(--attendance-danger);
  color: var(--attendance-danger-dark);
  background: var(--attendance-danger-soft);
}

.status-late:hover,
.status-late.status-button-active {
  border-color: var(--attendance-warning);
  color: var(--attendance-warning-dark);
  background: var(--attendance-warning-soft);
}

.status-excused:hover,
.status-excused.status-button-active {
  border-color: var(--attendance-info);
  color: var(--attendance-info-dark);
  background: var(--attendance-info-soft);
}

.status-sick:hover,
.status-sick.status-button-active {
  border-color: var(--attendance-sick);
  color: var(--attendance-sick-dark);
  background: var(--attendance-sick-soft);
}

.status-not-marked:hover,
.status-not-marked.status-button-active {
  border-color: var(--attendance-dark);
  color: var(--attendance-dark);
  background: var(--attendance-dark-soft);
}

.status-button-active {
  box-shadow:
    0 5px 14px rgba(30, 44, 80, 0.08);
}

.student-detail-inputs {
  display: flex;
  min-width: 230px;
  align-items: center;
  gap: 0.5rem;
}

.arrival-time-input,
.student-remark-input {
  min-height: 36px;
  border: 1px solid var(--attendance-border);
  border-radius: 0.6rem;
  color: var(--attendance-text);
  background: #ffffff;
  font-size: 0.76rem;
}

.arrival-time-input {
  width: 112px;
  min-width: 112px;
}

.student-remark-input {
  width: 180px;
  min-width: 165px;
}

.arrival-time-input:hover,
.student-remark-input:hover {
  border-color: var(--attendance-border-dark);
}

.arrival-time-input:focus,
.student-remark-input:focus {
  border-color: var(--attendance-primary);
  box-shadow:
    0 0 0 0.17rem rgba(49, 89, 217, 0.1);
}

.student-remark-input::placeholder {
  color: #a1a8b7;
}

.attendance-footer {
  display: flex;
  min-height: 76px;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.1rem 1.5rem;
  border-top: 1px solid var(--attendance-border);
  background: #fbfcff;
}

.attendance-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.9rem;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--attendance-muted);
  font-size: 0.72rem;
  white-space: nowrap;
}

.legend-item strong {
  color: var(--attendance-heading);
  font-weight: 800;
}

.legend-dot,
.submission-status-dot {
  display: inline-block;
  flex: 0 0 auto;
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.legend-dot.status-present,
.submission-status-dot.status-present {
  background: var(--attendance-success);
  box-shadow:
    0 0 0 3px rgba(22, 160, 109, 0.1);
}

.legend-dot.status-absent,
.submission-status-dot.status-absent {
  background: var(--attendance-danger);
  box-shadow:
    0 0 0 3px rgba(220, 76, 100, 0.1);
}

.legend-dot.status-late,
.submission-status-dot.status-late {
  background: var(--attendance-warning);
  box-shadow:
    0 0 0 3px rgba(231, 154, 24, 0.1);
}

.legend-dot.status-excused,
.submission-status-dot.status-excused {
  background: var(--attendance-info);
  box-shadow:
    0 0 0 3px rgba(37, 137, 199, 0.1);
}

.legend-dot.status-sick,
.submission-status-dot.status-sick {
  background: var(--attendance-sick);
  box-shadow:
    0 0 0 3px rgba(117, 103, 217, 0.1);
}

.legend-dot.status-not-marked,
.submission-status-dot.status-not-marked {
  background: var(--attendance-dark);
  box-shadow:
    0 0 0 3px rgba(89, 97, 117, 0.1);
}

.attendance-footer-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
}

.submission-warning {
  display: flex;
  align-items: center;
  color: #9a620a;
  font-size: 0.75rem;
  font-weight: 750;
  white-space: nowrap;
}

.attendance-submit-button {
  min-height: 46px;
  padding-right: 1.25rem;
  padding-left: 1.25rem;
  border-color: var(--attendance-primary);
  border-radius: 0.75rem;
  color: #ffffff;
  background: var(--attendance-primary);
  box-shadow:
    0 7px 17px rgba(49, 89, 217, 0.18);
  font-size: 0.82rem;
  font-weight: 800;
}

.attendance-submit-button:hover:not(:disabled) {
  border-color: var(--attendance-primary-dark);
  background: var(--attendance-primary-dark);
  transform: translateY(-1px);
}

.attendance-submit-button:disabled {
  border-color: #aeb9da;
  background: #aeb9da;
  box-shadow: none;
  cursor: not-allowed;
  opacity: 0.72;
}

.remarks-header {
  min-height: 74px;
}

.remarks-title {
  font-size: 1rem;
}

.remarks-subtitle {
  max-width: 620px;
}

.character-counter {
  margin-top: 0.4rem;
  color: var(--attendance-muted);
  font-size: 0.7rem;
  font-weight: 600;
  text-align: right;
}

.submission-summary {
  padding: 0.3rem 0;
  text-align: center;
}

.submission-summary-icon {
  display: grid;
  width: 72px;
  height: 72px;
  margin: 0 auto 1rem;
  place-items: center;
  border-radius: 22px;
  color: var(--attendance-primary);
  background: var(--attendance-primary-soft);
  box-shadow:
    inset 0 0 0 1px rgba(49, 89, 217, 0.06);
}

.submission-summary h4 {
  margin: 0 0 0.4rem;
  color: var(--attendance-heading);
  font-size: 1.08rem;
  font-weight: 800;
}

.submission-summary p {
  margin: 0;
  color: var(--attendance-muted);
  font-size: 0.84rem;
}

.submission-details {
  overflow: hidden;
  margin-top: 1.25rem;
  border: 1px solid var(--attendance-border);
  border-radius: 0.9rem;
  background: #ffffff;
  text-align: left;
}

.submission-detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0.9rem;
  border-bottom: 1px solid var(--attendance-border);
  font-size: 0.8rem;
}

.submission-detail-row:last-child {
  border-bottom: 0;
}

.submission-detail-row span {
  color: var(--attendance-muted);
}

.submission-detail-row strong {
  color: var(--attendance-heading);
  font-weight: 800;
  text-align: right;
}

.submission-status-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.6rem;
  margin-top: 1rem;
}

.submission-status-item {
  display: flex;
  min-height: 42px;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid #edf0f6;
  border-radius: 0.7rem;
  color: var(--attendance-muted);
  background: #f8f9fc;
  font-size: 0.75rem;
}

.submission-status-item strong {
  margin-left: auto;
  color: var(--attendance-heading);
  font-weight: 800;
}

.teacher-attendance-page :deep(.modal-content) {
  overflow: hidden;
  border: 0;
  border-radius: 1.15rem;
  box-shadow:
    0 25px 70px rgba(26, 37, 71, 0.23);
}

.teacher-attendance-page :deep(.modal-header) {
  padding: 1.1rem 1.25rem;
  border-bottom-color: var(--attendance-border);
}

.teacher-attendance-page :deep(.modal-title) {
  color: var(--attendance-heading);
  font-size: 1rem;
  font-weight: 800;
}

.teacher-attendance-page :deep(.modal-body) {
  padding: 1.25rem;
}

.teacher-attendance-page :deep(.modal-footer) {
  padding: 1rem 1.25rem;
  border-top-color: var(--attendance-border);
  background: #fbfcff;
}

.teacher-attendance-page :deep(.modal-footer .btn) {
  min-height: 40px;
  border-radius: 0.7rem;
  font-size: 0.78rem;
  font-weight: 750;
}

.teacher-attendance-page :deep(.form-select),
.teacher-attendance-page :deep(.form-control) {
  font-family: inherit;
}

.teacher-attendance-page :deep(textarea.form-control) {
  min-height: 95px;
  padding: 0.75rem 0.85rem;
  line-height: 1.55;
  resize: vertical;
}

.teacher-attendance-page :deep(.btn:focus-visible),
.teacher-attendance-page button:focus-visible {
  outline: 2px solid rgba(49, 89, 217, 0.3);
  outline-offset: 2px;
}

@media (max-width: 1399.98px) {
  .status-selector {
    min-width: 330px;
  }

  .status-button {
    padding-right: 0.5rem;
    padding-left: 0.5rem;
  }

  .student-remark-input {
    width: 165px;
  }
}

@media (max-width: 1199.98px) {
  .attendance-hero {
    min-height: auto;
    align-items: flex-start;
    flex-direction: column;
  }

  .attendance-hero-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .attendance-toolbar {
    grid-template-columns: 1fr 260px;
  }

  .attendance-footer {
    align-items: flex-start;
    flex-direction: column;
  }

  .attendance-footer-actions {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 991.98px) {
  .attendance-hero {
    padding: 1.5rem;
  }

  .bulk-action-bar {
    align-items: flex-start;
    flex-direction: column;
  }

  .bulk-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .attendance-toolbar {
    grid-template-columns: 1fr;
  }

  .attendance-result-count {
    white-space: normal;
  }
}

@media (max-width: 767.98px) {
  .teacher-attendance-page {
    padding-bottom: 1rem;
  }

  .attendance-hero {
    gap: 1.25rem;
    padding: 1.3rem;
    border-radius: 1rem;
  }

  .attendance-hero-content {
    align-items: flex-start;
  }

  .attendance-hero-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
  }

  .attendance-hero-title {
    font-size: 1.45rem;
  }

  .attendance-hero-eyebrow {
    font-size: 0.65rem;
  }

  .attendance-hero-meta {
    font-size: 0.8rem;
  }

  .attendance-hero-actions {
    width: 100%;
  }

  .attendance-hero-actions .btn {
    flex: 1;
  }

  .premium-card,
  .summary-card {
    border-radius: 1rem;
  }

  .attendance-toolbar {
    padding: 1rem;
  }

  .attendance-card-header,
  .remarks-header {
    min-height: auto;
    align-items: flex-start;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
  }

  .attendance-result-count {
    align-self: flex-start;
  }

  .bulk-action-bar {
    align-items: flex-start;
    flex-direction: column;
  }
}
  </style>
