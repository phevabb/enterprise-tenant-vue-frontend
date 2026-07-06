<template>
  <CContainer fluid class="py-4 report-table-page">
    <div class="page-hero mb-4">
      <div>
        <p class="eyebrow">Academic Reports</p>

        <h2 class="m-0">
          Student Report Cards
        </h2>

        <p class="text-muted mb-0">
          View or download report cards term by term.
        </p>
      </div>

      <div class="hero-actions">
        <button
          style="color: black;"
          class="btn btn-light"
          type="button"
          :disabled="loading"
          @click="fetchReportCards"
        >
          Refresh
        </button>

        <button
          class="btn btn-outline-light"
          type="button"
          :disabled="loadingPdf || reportCards.length === 0"
          @click="downloadAllReportCardsPdf"
        >
          Download All
        </button>
      </div>
    </div>

    <CCard class="border-0 shadow-sm rounded-4 mb-4">
      <CCardBody>
        <div class="student-summary">
          <!-- <div class="avatar-ring">
  studentProfilePicture || dummyAvatar
</div> -->

          <div>
            <h4 class="mb-1">
              {{ studentDisplayName }}
            </h4>

            <div class="text-muted small">
              Student User ID:
              <strong>{{ studentUserId || '—' }}</strong>
            </div>

            <div class="text-muted small">
              School:
              <strong>{{ schoolDisplayName }}</strong>
            </div>

            <div class="text-muted small">
              Tenant Code:
              <strong>{{ tenantCode || '—' }}</strong>
            </div>
          </div>
        </div>
      </CCardBody>
    </CCard>

    <div v-if="errorMessage" class="alert alert-danger">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="alert alert-success">
      {{ successMessage }}
    </div>

    <CCard class="border-0 shadow-sm rounded-4">
      <CCardHeader class="bg-white border-0 py-3">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h5 class="fw-bold m-0">
              Available Report Cards
            </h5>

            <small class="text-muted">
              {{ reportCards.length }} term report(s) found
            </small>
          </div>

          <input
            v-model.trim="searchText"
            class="form-control search-input"
            type="text"
            placeholder="Search year, term, class..."
          />
        </div>
      </CCardHeader>

      <CCardBody class="p-0">
        <div v-if="loading" class="empty-state">
          Loading report cards...
        </div>

        <CTable
          v-else
          responsive
          hover
          class="mb-0 align-middle report-table"
        >
          <CTableHead color="light">
            <CTableRow>
              <CTableHeaderCell>#</CTableHeaderCell>
              <CTableHeaderCell>Academic Year</CTableHeaderCell>
              <CTableHeaderCell>Term</CTableHeaderCell>
              <CTableHeaderCell>Class</CTableHeaderCell>
              <CTableHeaderCell>Total</CTableHeaderCell>
              <CTableHeaderCell>Average</CTableHeaderCell>
              <CTableHeaderCell>Position</CTableHeaderCell>
              <CTableHeaderCell>Subjects</CTableHeaderCell>

              <CTableHeaderCell>Actions</CTableHeaderCell>
            </CTableRow>
          </CTableHead>

          <CTableBody>
            <CTableRow
              v-for="(report, index) in filteredReportCards"
              :key="report.id"
            >
              <CTableDataCell class="text-muted">
                {{ index + 1 }}
              </CTableDataCell>

              <CTableDataCell>
                <strong>{{ report.academicYearName }}</strong>
              </CTableDataCell>

              <CTableDataCell>
                {{ report.termName }}
              </CTableDataCell>

              <CTableDataCell>
                {{ report.className }}
              </CTableDataCell>

              <CTableDataCell>
                <strong>{{ show(report.rawScoreTotal) }}</strong>
              </CTableDataCell>

              <CTableDataCell>
                {{ Number(report.averageScore || 0).toFixed(1) }}
              </CTableDataCell>

              <CTableDataCell>
                {{ report.overallPosition ? ordinal(report.overallPosition) : '—' }}
                <span v-if="report.numberOnRoll">
                  / {{ report.numberOnRoll }}
                </span>
              </CTableDataCell>

              <CTableDataCell>
                {{ report.subjectCount || 0 }}
              </CTableDataCell>

              <!-- <CTableDataCell>
                <span class="badge bg-success">
                  Ready
                </span>
              </CTableDataCell> -->

              <CTableDataCell>
                <div class="d-flex gap-2 flex-wrap">
                  <!-- <button
                    class="btn btn-sm btn-primary"
                    type="button"
                    :disabled="loadingPdf"
                    @click="openTermPdf(report)"
                  >
                    View
                  </button> -->

                  <button
                    class="btn btn-sm btn-outline-primary"
                    type="button"
                    :disabled="loadingPdf"
                    @click="downloadTermPdf(report)"
                  >
                    Download
                  </button>
                </div>
              </CTableDataCell>
            </CTableRow>

            <CTableRow v-if="filteredReportCards.length === 0">
              <CTableDataCell colspan="10" class="empty-state">
                No report cards found.
              </CTableDataCell>
            </CTableRow>
          </CTableBody>
        </CTable>
      </CCardBody>
    </CCard>
  </CContainer>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  getReportCardsByUser_ktor,
  getReportCardPdfPackByUser_ktor,
  getReportCardTermPdfByUser_ktor,
} from '@/services/api'

const loading = ref(false)
const loadingPdf = ref(false)

const errorMessage = ref('')
const successMessage = ref('')
const studentProfilePictureUrl = ref('')
const student = ref(null)
const reportCards = ref([])
const searchText = ref('')

const dummyAvatar =
  'data:image/svg+xml;base64,' +
  btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="140" height="140">
      <rect width="140" height="140" fill="#d1d5db"/>
      <circle cx="70" cy="56" r="26" fill="white"/>
      <rect x="22" y="90" width="96" height="34" rx="17" fill="white"/>
    </svg>
  `)

const tenantCode = computed(() => {
  return localStorage.getItem('tenantCode') || ''
})

const schoolDisplayName = computed(() => {
  return (
    localStorage.getItem('tenantSchoolName') ||
    localStorage.getItem('xSchoolName') ||
    localStorage.getItem('schoolName') ||
    'School Name'
  )
})

const studentUserId = computed(() => {
  return (
    student.value?.userId ||
    student.value?.user_id ||
    student.value?.id ||
    null
  )
})

const studentDisplayName = computed(() => {
  return (
    reportCards.value?.[0]?.studentName ||
    student.value?.fullName ||
    student.value?.full_name ||
    student.value?.name ||
    'Student'
  )
})

const studentProfilePicture = computed(() => {
  return studentProfilePictureUrl.value || dummyAvatar
})

const filteredReportCards = computed(() => {
  const search = searchText.value.toLowerCase()

  if (!search) {
    return reportCards.value
  }

  return reportCards.value.filter((report) => {
    return [
      report.academicYearName,
      report.termName,
      report.className,
      report.studentName,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(search)
  })
})

function loadStudentFromLocalStorage() {
  try {
    const stored = localStorage.getItem('user')
    student.value = stored ? JSON.parse(stored) : null
  } catch {
    student.value = null
  }
}

function validateBeforeRequest() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!studentUserId.value) {
    errorMessage.value = 'Student user ID not found.'
    return false
  }

  const code = localStorage.getItem('tenantCode')
  const slug = localStorage.getItem('tenantSlug')

  if (!code && !slug) {
    errorMessage.value =
      'Tenant information is missing. Please login again.'
    return false
  }

  return true
}

async function fetchReportCards() {
  if (!validateBeforeRequest()) return

  loading.value = true

  try {
    const response = await getReportCardsByUser_ktor(studentUserId.value)



    reportCards.value = Array.isArray(response.data)
      ? response.data
      : []

    studentProfilePictureUrl.value =
      reportCards.value?.[0]?.profilePictureUrl || ''
  } catch (error) {


    reportCards.value = []
    studentProfilePictureUrl.value = ''

    errorMessage.value =
      error?.response?.data?.message ||
      error?.response?.data ||
      'Unable to load report cards.'
  } finally {
    loading.value = false
  }
}
async function fetchPdfBlob(requestFn) {
  loadingPdf.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await requestFn()

    return new Blob([response.data], {
      type: 'application/pdf',
    })
  } catch (error) {

    // return null
  } finally {
    loadingPdf.value = false
  }
}

async function openTermPdf(report) {
  const blob = await fetchPdfBlob(() =>
    getReportCardTermPdfByUser_ktor(studentUserId.value, report.id)
  )

  if (!blob) return

  const url = window.URL.createObjectURL(blob)
  const pdfWindow = window.open(url, '_blank')

  if (!pdfWindow) {
    errorMessage.value = 'Popup blocked. Please allow popups to view the PDF.'
  }
}

async function downloadTermPdf(report) {
  const blob = await fetchPdfBlob(() =>
    getReportCardTermPdfByUser_ktor(studentUserId.value, report.id)
  )

  if (!blob) return

  const url = window.URL.createObjectURL(blob)

  const fileName = `report-card-${studentUserId.value}-${slugify(report.academicYearName)}-${slugify(report.termName)}.pdf`

  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()

  window.URL.revokeObjectURL(url)

  successMessage.value = 'Report card PDF downloaded.'
}

async function downloadAllReportCardsPdf() {
  const blob = await fetchPdfBlob(() =>
    getReportCardPdfPackByUser_ktor(studentUserId.value)
  )

  if (!blob) return

  const url = window.URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `report-card-pack-${studentUserId.value}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()

  window.URL.revokeObjectURL(url)

  successMessage.value = 'Report card pack downloaded.'
}

function show(value) {
  return value === null || value === undefined || value === ''
    ? '—'
    : value
}

function ordinal(value) {
  const numberValue = Number(value)

  if (!numberValue) {
    return '—'
  }

  const suffixes = ['th', 'st', 'nd', 'rd']
  const v = numberValue % 100

  return numberValue + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0])
}

function slugify(value) {
  return String(value || 'report')
    .toLowerCase()
    .replace(/[^\w]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function onImgError(event) {
  if (event?.target) {
    event.target.src = dummyAvatar
  }
}

onMounted(() => {
  loadStudentFromLocalStorage()
  fetchReportCards()
})
</script>

<style scoped>
.report-table-page {
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.07), transparent 32%),
    linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
  min-height: 100vh;
}

.page-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1.5rem;
  border-radius: 24px;
  color: #ffffff;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.5), transparent 34%),
    linear-gradient(135deg, #020617, #1e293b);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.24);
}

.page-hero h2 {
  color: #ffffff;
  font-weight: 900;
}

.page-hero .text-muted {
  color: #cbd5e1 !important;
}

.eyebrow {
  margin: 0 0 0.35rem;
  color: #93c5fd;
  font-size: 0.75rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.hero-actions {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.student-summary {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar-ring {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  padding: 2px;
  background: linear-gradient(135deg, #60a5fa, #22c55e);
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: block;
  object-fit: cover;
  background: #ffffff;
}

.search-input {
  max-width: 320px;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: #64748b;
  font-weight: 700;
}

.report-table th {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #475569;
}

.report-table td {
  vertical-align: middle;
}

@media (max-width: 768px) {
  .page-hero {
    align-items: flex-start;
  }

  .hero-actions,
  .hero-actions .btn {
    width: 100%;
  }

  .search-input {
    max-width: 100%;
  }

  .student-summary {
    align-items: flex-start;
  }
}
</style>
