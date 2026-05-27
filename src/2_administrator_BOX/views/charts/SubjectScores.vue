
<template>
  <div class="scores-page">

    <!-- ✅ Sea-blue header (CRUD controls live here) -->
    <div class="header-grad shadow-sm rounded p-3 mb-3 text-white">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">

        <div>
          <h5 class="mb-1">Subject Scores</h5>
          <small class="opacity-75">
            View, add, edit and delete subject scores with full academic record details.
          </small>
        </div>

        <div class="d-flex gap-2 align-items-center flex-wrap w-100 w-md-auto justify-content-end">
          <CInputGroup size="sm" style="max-width: 360px; width: 100%;">
            <CInputGroupText class="bg-white border-0">
              <CIcon :icon="cilSearch" class="text-primary" />
            </CInputGroupText>
            <CFormInput
              v-model="search"
              placeholder="Search student, subject, class..."
              class="border-0"
              style="background: rgba(255,255,255,.92);"
            />
          </CInputGroup>


          <CButton style="background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.25); color: white;" color="light" size="sm" :disabled="loading" @click="fetchScores">
            <CIcon :icon="cilReload" class="me-1" />
            {{ loading ? 'Loading...' : 'Refresh' }}
          </CButton>

          <CButton
          color="danger"
          size="sm"
          :disabled="!selectedIds.length || deleting"
          @click="confirmDeleteSelected"
        >
          <CIcon :icon="cilTrash" class="me-1" />
          Delete Selected ({{ selectedIds.length }})
        </CButton>

          <CButton
            size="sm"
            class="text-white"
            style="background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.25);"
            @click="toggleGroupMode"
          >
            <CIcon :icon="cilSwapHorizontal" class="me-1" />
            {{ groupMode === 'student' ? 'Group: Student' : 'Group: Subject' }}
          </CButton>

          <!-- ✅ CREATE -->
          <CButton color="dark" size="sm" @click="openCreate">
            <CIcon :icon="cilPlus" class="me-1" />
            Add Score
          </CButton>
        </div>

      </div>
    </div>

    <!-- ✅ Stats -->
    <div class="row g-3 mb-3" v-if="!loading && filtered.length">
      <div class="col-md-3">
        <div class="stat-card shadow-sm">
          <div class="stat-label">Total Entries</div>
          <div class="stat-value">{{ filtered.length }}</div>
        </div>
      </div>

      <div class="col-md-3">
        <div class="stat-card shadow-sm">
          <div class="stat-label">Unique Students</div>
          <div class="stat-value">{{ uniqueStudents }}</div>
        </div>
      </div>

      <div class="col-md-3">
        <div class="stat-card shadow-sm">
          <div class="stat-label">Average Total</div>
          <div class="stat-value">{{ avgTotal }}</div>
        </div>
      </div>

      <div class="col-md-3">
        <div class="stat-card shadow-sm">
          <div class="stat-label">Top Grade</div>
          <div class="stat-value">{{ topGrade }}</div>
        </div>
      </div>
    </div>

    <!-- ✅ Filters -->
    <CCard class="shadow-sm border-0 mb-3">
      <CCardBody>
        <div class="row g-2 align-items-center">
          <div class="col-12 col-md-3">
            <CFormSelect v-model="filters.className">
              <option value="">All Classes</option>
              <option v-for="c in classOptions" :key="c" :value="c">{{ c }}</option>
            </CFormSelect>
          </div>

          <div class="col-12 col-md-3">
            <CFormSelect v-model="filters.subjectName">
              <option value="">All Subjects</option>
              <option v-for="s in subjectOptions" :key="s" :value="s">{{ s }}</option>
            </CFormSelect>
          </div>

          <div class="col-12 col-md-2">
            <CFormSelect v-model="filters.termName">
              <option value="">All Terms</option>
              <option v-for="t in termOptions" :key="t" :value="t">{{ t }}</option>
            </CFormSelect>
          </div>

          <div class="col-12 col-md-2">
            <CFormSelect v-model="filters.yearName">
              <option value="">All Years</option>
              <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
            </CFormSelect>
          </div>

          <div class="col-12 col-md-2">
            <CFormSelect v-model="filters.gradeCode">
              <option value="">All Grades</option>
              <option v-for="g in gradeOptions" :key="g" :value="g">{{ g }}</option>
            </CFormSelect>
          </div>
        </div>

        <div class="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2">
          <div class="small text-medium-emphasis">
            Showing <b>{{ paginated.length }}</b> of <b>{{ filtered.length }}</b> results
          </div>

          <div class="d-flex gap-2 align-items-center">
            <span class="small text-medium-emphasis">Rows:</span>
            <CFormSelect v-model.number="pageSize" size="sm" style="width: 90px;">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </CFormSelect>

            <CButton size="sm" color="secondary" variant="outline" @click="resetFilters">
              Reset
            </CButton>
          </div>
        </div>
      </CCardBody>
    </CCard>

    <!-- ✅ Loading -->
    <div v-if="loading" class="py-5 d-flex align-items-center justify-content-center gap-2">
      <CSpinner size="sm" />
      <span class="text-medium-emphasis">Loading subject scores... (this may take a moment)</span>
    </div>

    <!-- ✅ Empty -->
    <div v-else-if="!filtered.length" class="py-5 text-center text-medium-emphasis">
      <div class="mb-2">
        <CIcon :icon="cilSearch" class="me-1" />
        No subject scores found.
      </div>
      <small>Adjust filters or refresh.</small>
    </div>

    <!-- ✅ Table -->
    <div v-else class="table-wrap shadow-sm">
      <CTable hover responsive class="mb-0">
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell style="width: 40px;">
              <input
                type="checkbox"
                :checked="allSelected"
                @change="toggleSelectAll"
              />
            </CTableHeaderCell>
            <CTableHeaderCell>#</CTableHeaderCell>
            <CTableHeaderCell>Student</CTableHeaderCell>
            <CTableHeaderCell>Class</CTableHeaderCell>
            <CTableHeaderCell>Subject</CTableHeaderCell>
            <CTableHeaderCell>Term / Year</CTableHeaderCell>
            <CTableHeaderCell class="text-end">Class</CTableHeaderCell>
            <CTableHeaderCell class="text-end">Exam</CTableHeaderCell>
            <CTableHeaderCell class="text-end">Total</CTableHeaderCell>
            <CTableHeaderCell>Grade</CTableHeaderCell>
            <CTableHeaderCell style="width: 220px;" class="text-end">Actions</CTableHeaderCell>
          </CTableRow>
        </CTableHead>

        <CTableBody>

          <CTableRow v-for="row in paginated" :key="row.id">
            <CTableDataCell>
          <input
            type="checkbox"
            :value="row.id"
            v-model="selectedIds"
          />
        </CTableDataCell>
            <CTableDataCell>{{ row.id }}</CTableDataCell>

            <CTableDataCell>
              <div class="fw-semibold">{{ row.academicRecord.student.name }}</div>
              <div class="small text-medium-emphasis">Student ID: {{ row.academicRecord.student.id }}</div>
            </CTableDataCell>

            <CTableDataCell class="text-capitalize">
              <span class="pill-class">{{ row.academicRecord.classLevel.name }}</span>
            </CTableDataCell>

            <CTableDataCell>
              <span class="pill-subject">{{ row.subjectName }}</span>
            </CTableDataCell>

            <CTableDataCell>
              <div class="small">
                <b>{{ row.academicRecord.term.name }}</b>
                <span class="text-muted"> / </span>
                <b>{{ row.academicRecord.academicYear.name }}</b>
              </div>
            </CTableDataCell>

            <CTableDataCell class="text-end">{{ row.classScore ?? '—' }}</CTableDataCell>
            <CTableDataCell class="text-end">{{ row.examScore ?? '—' }}</CTableDataCell>

            <CTableDataCell class="text-end">
              <span class="total-badge" :style="totalStyle(row.totalScore)">
                {{ row.totalScore ?? '—' }}
              </span>
            </CTableDataCell>

            <CTableDataCell>
              <span class="grade-chip" :style="gradeStyle(row.gradeCode)">
                {{ row.gradeCode ?? '—' }}
              </span>
              <span class="small text-medium-emphasis ms-2">{{ row.interpretation ?? '' }}</span>
            </CTableDataCell>

            <!-- ✅ CRUD actions -->
            <CTableDataCell class="text-end">
              <div class="d-inline-flex gap-2">
                <CButton size="sm" color="primary" variant="outline" @click="openDetail(row)">
                  <CIcon :icon="cilInfo" class="me-1" />
                  Details
                </CButton>

                <CButton size="sm" color="warning" variant="outline" @click="openEdit(row)">
                  <CIcon :icon="cilPencil" class="me-1" />
                  Edit
                </CButton>

                <CButton size="sm" color="danger" variant="outline" @click="openDelete(row)">
                  <CIcon :icon="cilTrash" class="me-1" />
                  Delete
                </CButton>
              </div>
            </CTableDataCell>
          </CTableRow>
        </CTableBody>
      </CTable>

      <!-- Pagination -->
      <div class="d-flex justify-content-between align-items-center p-2 border-top flex-wrap gap-2">
        <div class="small text-medium-emphasis">
          Page <b>{{ page }}</b> / <b>{{ totalPages }}</b>
        </div>
        <div class="d-flex gap-2">
          <CButton size="sm" color="secondary" variant="outline" :disabled="page <= 1" @click="page--">Prev</CButton>
          <CButton size="sm" color="secondary" variant="outline" :disabled="page >= totalPages" @click="page++">Next</CButton>
        </div>
      </div>
    </div>

    <!-- ✅ Modals (CRUD) -->
    <!-- Create/Edit Modal -->
    <CModal v-model:visible="showForm" alignment="center" backdrop="static" :keyboard="false" size="lg">
      <CModalHeader :close-button="false" class="text-white border-0 header-grad">
        <div class="d-flex align-items-center gap-2">
          <div class="icon-bubble">
            <CIcon :icon="isEdit ? cilPencil : cilPlus" class="text-white" />
          </div>
          <div>
            <CModalTitle class="mb-0">{{ isEdit ? 'Edit Score' : 'Add Score' }}</CModalTitle>
            <small class="opacity-75">
              {{ isEdit ? 'Update class/exam scores' : 'Select record + subject, then enter scores' }}
            </small>
          </div>
        </div>
      </CModalHeader>

      <CModalBody class="pt-4">
        <div class="p-3 rounded form-surface">

          <div v-if="!isEdit" class="row g-3 mb-3">
            <div class="col-md-6">
              <CFormLabel class="fw-semibold">Academic Record</CFormLabel>
              <CFormSelect v-model="form.academicRecordId">
                <option disabled value="" selected>Select academic record</option>
                <option v-for="r in recordOptions" :key="r.id" :value="String(r.id)">
                  {{ r.label }}
                </option>
              </CFormSelect>
              <div v-if="formErrors.academicRecordId" class="small text-danger mt-1">
                {{ formErrors.academicRecordId }}
              </div>
            </div>

            <div class="col-md-6">
              <CFormLabel class="fw-semibold">Subject</CFormLabel>
              <CFormSelect v-model="form.subjectId">
                <option disabled value="">Select subject</option>
                <option v-for="s in subjectIdOptions" :key="s.id" :value="String(s.id)">
                  {{ s.name }}
                </option>
              </CFormSelect>
              <div v-if="formErrors.subjectId" class="small text-danger mt-1">
                {{ formErrors.subjectId }}
              </div>
            </div>
          </div>

          <div class="row g-3">
            <div class="col-md-6">
              <CFormLabel class="fw-semibold">Class Score</CFormLabel>
              <CFormInput v-model.number="form.classScore" type="number" min="0" max="100" placeholder="e.g. 50" />
            </div>
            <div class="col-md-6">
              <CFormLabel class="fw-semibold">Exam Score</CFormLabel>
              <CFormInput v-model.number="form.examScore" type="number" min="0" max="100" placeholder="e.g. 45" />
            </div>
          </div>

          <div class="small text-medium-emphasis mt-3">
            Tip: Leave blank if you don’t want to enter a value yet.
          </div>
        </div>
      </CModalBody>

      <CModalFooter class="border-0 pt-0">
        <div class="w-100 d-flex justify-content-end gap-2">
          <CButton color="secondary" variant="outline" :disabled="saving" @click="closeForm">
            Cancel
          </CButton>

          <CButton
            class="text-white"
            :disabled="saving"
            style="background: linear-gradient(90deg, #0ea5e9, #0369a1); border:none;"
            @click="submitForm"
          >
            <template v-if="saving">
              <CSpinner size="sm" class="me-2" />
              Saving...
            </template>
            <template v-else>
              <CIcon :icon="cilSave" class="me-2" />
              {{ isEdit ? 'Update' : 'Create' }}
            </template>
          </CButton>
        </div>
      </CModalFooter>
    </CModal>

    <!-- Delete Modal -->
    <CModal v-model:visible="showDelete" alignment="center" backdrop="static" :keyboard="false">
      <CModalHeader :close-button="false" class="text-white border-0 header-grad">
        <div class="d-flex align-items-center gap-2">
          <div class="icon-bubble">
            <CIcon :icon="cilTrash" class="text-white" />
          </div>
          <div>
            <CModalTitle class="mb-0">Delete Score</CModalTitle>
            <small class="opacity-75">This action cannot be undone</small>
          </div>
        </div>
      </CModalHeader>

      <CModalBody class="pt-4">
        <div class="p-3 rounded form-surface" v-if="toDelete">
          <div class="fw-semibold mb-1">
            Delete score for <b>{{ toDelete.academicRecord.student.name }}</b> — <b>{{ toDelete.subjectName }}</b>?
          </div>
          <div class="small text-medium-emphasis">
            Score ID: <b>#{{ toDelete.id }}</b> • Record: <b>#{{ toDelete.academicRecord.id }}</b>
          </div>
        </div>
      </CModalBody>

      <CModalFooter class="border-0 pt-0">
        <div class="w-100 d-flex justify-content-end gap-2">
          <CButton color="secondary" variant="outline" :disabled="deleting" @click="closeDelete">
            Cancel
          </CButton>

          <CButton color="danger" class="text-white" :disabled="deleting" @click="confirmDelete">
            <template v-if="deleting">
              <CSpinner size="sm" class="me-2" />
              Deleting...
            </template>
            <template v-else>
              <CIcon :icon="cilTrash" class="me-2" />
              Delete
            </template>
          </CButton>
        </div>
      </CModalFooter>
    </CModal>

    <!-- Detail Modal -->
    <CModal v-model:visible="showDetail" alignment="center" backdrop="static" :keyboard="false" size="lg">

  <!-- Header -->
  <CModalHeader :close-button="false" class="text-white border-0 header-grad">
    <div class="d-flex align-items-center gap-2">
      <div class="icon-bubble">
        <CIcon :icon="cilInfo" class="text-white" />
      </div>
      <div>
        <CModalTitle class="mb-0">Academic Record Details</CModalTitle>
        <small class="opacity-75">
          Full student academic performance breakdown
        </small>
      </div>
    </div>
  </CModalHeader>

  <!-- Body -->
  <CModalBody class="pt-4" v-if="selected">
    <div class="p-3 rounded form-surface">

      <!-- ===== Student + Context ===== -->
      <div class="d-flex justify-content-between flex-wrap gap-3 mb-3">
        <div>
          <div class="text-muted small">Student</div>
          <div class="fw-semibold">
            {{ selected.studentName ?? selected.student?.name ?? '—' }}
          </div>
        </div>

        <div>
          <div class="text-muted small">Class</div>
          <div class="fw-semibold text-capitalize">
            {{ selected.classLevelName ?? selected.classLevel?.name ?? '—' }}
          </div>
        </div>

        <div>
          <div class="text-muted small">Term / Year</div>
          <div class="fw-semibold">
            {{ selected.termName ?? selected.term?.name ?? '—' }}
            /
            {{ selected.academicYearName ?? selected.academicYear?.name ?? '—' }}
          </div>
        </div>

        <div>
          <div class="text-muted small">Record ID</div>
          <div class="fw-semibold">#{{ selected.id }}</div>
        </div>
      </div>

      <hr />

      <!-- ===== Scores Table ===== -->
      <div class="mb-4">
        <div class="fw-semibold mb-2">Subject Scores</div>

        <CTable small hover responsive>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Subject</CTableHeaderCell>
              <CTableHeaderCell class="text-end">Class</CTableHeaderCell>
              <CTableHeaderCell class="text-end">Exam</CTableHeaderCell>
              <CTableHeaderCell class="text-end">Total</CTableHeaderCell>
              <CTableHeaderCell>Grade</CTableHeaderCell>
              <CTableHeaderCell>Position</CTableHeaderCell>
            </CTableRow>
          </CTableHead>

          <CTableBody>
            <CTableRow
              v-for="s in selected.subjectScores"
              :key="s.id"
            >
              <CTableDataCell>{{ s.subjectName }}</CTableDataCell>

              <CTableDataCell class="text-end">
                {{ s.classScore ?? '—' }}
              </CTableDataCell>

              <CTableDataCell class="text-end">
                {{ s.examScore ?? '—' }}
              </CTableDataCell>

              <CTableDataCell class="text-end fw-semibold">
                {{ s.totalScore ?? '—' }}
              </CTableDataCell>

              <CTableDataCell>
                <CBadge
                  color="light"
                  class="border"
                >
                  {{ s.gradeCode ?? '—' }}
                </CBadge>
              </CTableDataCell>

              <CTableDataCell>
                {{ s.position ?? '—' }}
              </CTableDataCell>
            </CTableRow>
          </CTableBody>
        </CTable>

        <div v-if="!selected.subjectScores?.length" class="text-muted text-center py-3">
          No subject scores recorded.
        </div>
      </div>

      <hr />

      <!-- ===== Summary ===== -->
      <div class="row g-3 mb-3">
        <div class="col-md-4">
          <div class="mini-card">
            <div class="mini-title">Raw Total</div>
            <div class="fw-semibold">
              {{ selected.rawScoreTotal ?? '—' }}
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="mini-card">
            <div class="mini-title">Overall Position</div>
            <div class="fw-semibold">
              {{ selected.overallPosition ?? '—' }}
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="mini-card">
            <div class="mini-title">On Roll</div>
            <div class="fw-semibold">
              {{ selected.numberOnRoll ?? '—' }}
            </div>
          </div>
        </div>
      </div>

      <hr />

      <!-- ===== Remarks Section ===== -->
      <div class="row g-3">

        <div class="col-md-6">
          <div class="mini-card">
            <div class="mini-title">Conduct</div>
            <div>{{ selected.conduct ?? '—' }}</div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="mini-card">
            <div class="mini-title">Interest</div>
            <div>{{ selected.interest ?? '—' }}</div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="mini-card">
            <div class="mini-title">Attitude</div>
            <div>{{ selected.attitude ?? '—' }}</div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="mini-card">
            <div class="mini-title">Attendance</div>
            <div>{{ selected.attendance ?? '—' }}</div>
          </div>
        </div>

        <div class="col-12">
          <div class="mini-card">
            <div class="mini-title">Teacher Remarks</div>
            <div>{{ selected.teacherRemarks ?? '—' }}</div>
          </div>
        </div>

        <div class="col-12">
          <div class="mini-card">
            <div class="mini-title">Head Teacher Remarks</div>
            <div>{{ selected.headTeacherRemarks ?? '—' }}</div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="mini-card">
            <div class="mini-title">Promoted To</div>
            <div>{{ selected.promotedTo ?? '—' }}</div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="mini-card">
            <div class="mini-title">Next Term Begins</div>
            <div>{{ selected.nextTermBegins ?? '—' }}</div>
          </div>
        </div>

      </div>

    </div>
  </CModalBody>

  <!-- Footer -->
  <CModalFooter class="border-0 pt-0">
    <div class="w-100 d-flex justify-content-end">
      <CButton color="secondary" variant="outline" @click="showDetail = false">
        Close
      </CButton>
    </div>
  </CModalFooter>

</CModal>


  </div>
</template>


<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import api from '@/services/api.js'

import {
  cilReload,
  cilSearch,
  cilSwapHorizontal,
  cilInfo,
  cilPlus,
  cilPencil,
  cilTrash,
  cilSave
} from '@coreui/icons'


const selectedIds = ref([])
const toast = useToast()




const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)

const data = ref([])

const search = ref('')
const page = ref(1)
const pageSize = ref(20)

const groupMode = ref('student') // (kept for UI toggle)

const showDetail = ref(false)
const selected = ref(null)

const showForm = ref(false)
const isEdit = ref(false)

const showDelete = ref(false)
const toDelete = ref(null)

const filters = reactive({
  className: '',
  subjectName: '',
  termName: '',
  yearName: '',
  gradeCode: ''
})


const allSelected = computed(() => {
  return paginated.value.length > 0 &&
         paginated.value.every(r => selectedIds.value.includes(r.id))
})



const form = reactive({
  // create mode
  academicRecordId: '',
  subjectId: '',
  // both modes
  classScore: null,
  examScore: null,
  // edit mode
  scoreId: null
})

function toggleSelectAll(e) {
  if (e.target.checked) {
    selectedIds.value = paginated.value.map(r => r.id)
  } else {
    selectedIds.value = []
  }
}



const formErrors = reactive({
  academicRecordId: '',
  subjectId: ''
})

function toggleGroupMode() {
  groupMode.value = groupMode.value === 'student' ? 'subject' : 'student'
}


async function confirmDeleteSelected() {
  // ✅ 👇 PUT IT RIGHT HERE
  if (!selectedIds.value.length) return
  if (!confirm("Are you sure you want to delete the selected scores?")) return

  deleting.value = true

  try {
    for (const id of selectedIds.value) {
      await api.delete(`/subject-scores/${id}`)
    }

    data.value = data.value.filter(
      x => !selectedIds.value.includes(x.id)
    )

    toast.success(`${selectedIds.value.length} scores deleted`)
    selectedIds.value = []

  } catch (e) {
    toast.error(e?.response?.data?.error || 'Bulk delete failed')
  } finally {
    deleting.value = false
  }
}


function openDetail(row) {
  selected.value = row
  showDetail.value = true
}

function resetFilters() {
  filters.className = ''
  filters.subjectName = ''
  filters.termName = ''
  filters.yearName = ''
  filters.gradeCode = ''
  search.value = ''
}

/** -----------------------
 * API
 * ---------------------- */
async function fetchScores() {
  loading.value = true
  try {
    const res = await api.get('/subject-scores')
    data.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    toast.error(e?.response?.data?.error || 'Failed to load subject scores')
  } finally {
    loading.value = false
  }
}

/** -----------------------
 * CRUD: CREATE / EDIT / DELETE
 * ---------------------- */
function clearForm() {
  form.academicRecordId = ''
  form.subjectId = ''
  form.classScore = null
  form.examScore = null
  form.scoreId = null
  formErrors.academicRecordId = ''
  formErrors.subjectId = ''
}

function openCreate() {
  isEdit.value = false
  clearForm()
  showForm.value = true
}

function openEdit(row) {
  isEdit.value = true
  clearForm()
  form.scoreId = row.id
  // edit mode does not change record/subject (we patch only scores)
  form.classScore = row.classScore
  form.examScore = row.examScore
  showForm.value = true
}

function closeForm() {
  if (saving.value) return
  showForm.value = false
}

function validateCreate() {
  formErrors.academicRecordId = ''
  formErrors.subjectId = ''
  if (!form.academicRecordId) formErrors.academicRecordId = 'Select an academic record'
  if (!form.subjectId) formErrors.subjectId = 'Select a subject'
  return !formErrors.academicRecordId && !formErrors.subjectId
}

async function submitForm() {
  saving.value = true
  try {
    if (!isEdit.value) {
      // CREATE/UPSERT via POST
      if (!validateCreate()) {
        saving.value = false
        return
      }

      const payload = {
        academicRecordId: Number(form.academicRecordId),
        subjectId: Number(form.subjectId),
        classScore: form.classScore,
        examScore: form.examScore
      }

      const res = await api.post('/subject-scores', payload)

      toast.success('Score saved')
      showForm.value = false

      // update local list
      const saved = res.data
      const idx = data.value.findIndex(x => x.id === saved.id)
      if (idx !== -1) data.value[idx] = saved
      else data.value.unshift(saved)

    } else {
      // PATCH by scoreId
      const payload = {
        classScore: form.classScore,
        examScore: form.examScore
      }

      const res = await api.patch(`/subject-scores/${form.scoreId}`, payload)

      toast.success('Score updated')
      showForm.value = false

      const updated = res.data
      const idx = data.value.findIndex(x => x.id === updated.id)
      if (idx !== -1) data.value[idx] = updated
      else data.value.unshift(updated)
    }

  } catch (e) {
    toast.error(e?.response?.data?.error || 'Save failed')
  } finally {
    saving.value = false
  }
}

function openDelete(row) {
  toDelete.value = row
  showDelete.value = true
}

function closeDelete() {
  if (deleting.value) return
  showDelete.value = false
  toDelete.value = null
}

async function confirmDelete() {
  if (!toDelete.value) return
  deleting.value = true
  try {
    await api.delete(`/subject-scores/${toDelete.value.id}`)
    data.value = data.value.filter(x => x.id !== toDelete.value.id)
    toast.success('Score deleted')
    showDelete.value = false
  } catch (e) {
    toast.error(e?.response?.data?.error || 'Delete failed')
  } finally {
    deleting.value = false
  }
}

/** -----------------------
 * Options for create modal
 * (built from current loaded data)
 * ---------------------- */
const recordOptions = computed(() => {
  const map = new Map()
  for (const r of data.value) {
    const ar = r.academicRecord
    if (!ar?.id) continue
    if (!map.has(ar.id)) {
      const label = `${ar.student?.name || 'Student'} • ${ar.classLevel?.name || ''} • ${ar.term?.name || ''} / ${ar.academicYear?.name || ''} • Record #${ar.id}`
      map.set(ar.id, { id: ar.id, label })
    }
  }
  return Array.from(map.values()).sort((a,b) => a.id - b.id)
})

const subjectIdOptions = computed(() => {
  const map = new Map()
  for (const r of data.value) {
    if (!r.subjectId) continue
    if (!map.has(r.subjectId)) map.set(r.subjectId, { id: r.subjectId, name: r.subjectName })
  }
  return Array.from(map.values()).sort((a,b) => a.name.localeCompare(b.name))
})

/** -----------------------
 * Existing filters
 * ---------------------- */
const classOptions = computed(() => {
  const set = new Set(data.value.map(x => x.academicRecord?.classLevel?.name).filter(Boolean))
  return Array.from(set).sort((a,b) => a.localeCompare(b))
})

const subjectOptions = computed(() => {
  const set = new Set(data.value.map(x => x.subjectName).filter(Boolean))
  return Array.from(set).sort((a,b) => a.localeCompare(b))
})

const termOptions = computed(() => {
  const set = new Set(data.value.map(x => x.academicRecord?.term?.name).filter(Boolean))
  return Array.from(set).sort((a,b) => a.localeCompare(b))
})

const yearOptions = computed(() => {
  const set = new Set(data.value.map(x => x.academicRecord?.academicYear?.name).filter(Boolean))
  return Array.from(set).sort((a,b) => a.localeCompare(b))
})

const gradeOptions = computed(() => {
  const set = new Set(data.value.map(x => x.gradeCode).filter(Boolean))
  return Array.from(set).sort((a,b) => a.localeCompare(b))
})

const filtered = computed(() => {
  const q = (search.value || '').trim().toLowerCase()

  return data.value.filter(row => {
    const studentName = (row.academicRecord?.student?.name || '').toLowerCase()
    const subjectName = (row.subjectName || '').toLowerCase()
    const className = (row.academicRecord?.classLevel?.name || '').toLowerCase()
    const termName = (row.academicRecord?.term?.name || '').toLowerCase()
    const yearName = (row.academicRecord?.academicYear?.name || '').toLowerCase()
    const gradeCode = (row.gradeCode || '').toLowerCase()

    const matchesSearch =
      !q ||
      studentName.includes(q) ||
      subjectName.includes(q) ||
      className.includes(q) ||
      termName.includes(q) ||
      yearName.includes(q) ||
      gradeCode.includes(q)

    const matchesFilters =
      (!filters.className || row.academicRecord?.classLevel?.name === filters.className) &&
      (!filters.subjectName || row.subjectName === filters.subjectName) &&
      (!filters.termName || row.academicRecord?.term?.name === filters.termName) &&
      (!filters.yearName || row.academicRecord?.academicYear?.name === filters.yearName) &&
      (!filters.gradeCode || row.gradeCode === filters.gradeCode)

    return matchesSearch && matchesFilters
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))

const paginated = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

watch([search, () => pageSize.value], () => { page.value = 1 })
watch(totalPages, () => { if (page.value > totalPages.value) page.value = totalPages.value })

const uniqueStudents = computed(() => {
  const set = new Set(filtered.value.map(x => x.academicRecord?.student?.id).filter(Boolean))
  return set.size
})

const avgTotal = computed(() => {
  const totals = filtered.value.map(x => x.totalScore).filter(v => typeof v === 'number')
  if (!totals.length) return '—'
  const avg = totals.reduce((a,b) => a + b, 0) / totals.length
  return avg.toFixed(1)
})

const topGrade = computed(() => {
  const freq = {}
  for (const r of filtered.value) {
    const g = r.gradeCode
    if (!g) continue
    freq[g] = (freq[g] || 0) + 1
  }
  const entries = Object.entries(freq)
  if (!entries.length) return '—'
  entries.sort((a,b) => b[1] - a[1])
  return entries[0][0]
})

function gradeStyle(code) {
  const c = String(code || '').toUpperCase()
  const map = {
    A: 'linear-gradient(90deg,#22c55e,#16a34a)',
    B: 'linear-gradient(90deg,#0ea5e9,#0369a1)',
    C: 'linear-gradient(90deg,#f59e0b,#b45309)',
    D: 'linear-gradient(90deg,#a78bfa,#6d28d9)',
    E: 'linear-gradient(90deg,#f43f5e,#be123c)'
  }
  return { background: map[c] || 'linear-gradient(90deg,#94a3b8,#475569)', color: '#fff' }
}

function totalStyle(total) {
  if (typeof total !== 'number') return { background: '#e2e8f0', color: '#0f172a' }
  if (total >= 80) return { background: 'rgba(34,197,94,.15)', color: '#166534' }
  if (total >= 60) return { background: 'rgba(14,165,233,.15)', color: '#075985' }
  if (total >= 50) return { background: 'rgba(245,158,11,.18)', color: '#92400e' }
  return { background: 'rgba(244,63,94,.14)', color: '#9f1239' }
}

onMounted(fetchScores)
</script>

<style scoped>
.scores-page { padding-bottom: 1rem; }
.header-grad { background: linear-gradient(90deg, #0ea5e9, #0369a1); border: 1px solid rgba(255,255,255,0.18); }
.icon-bubble{ width: 36px; height: 36px; border-radius: 999px; display:flex; align-items:center; justify-content:center; background: rgba(255,255,255,0.18); }
.form-surface{ background:#f7fbff; border: 1px solid rgba(3,105,161,.15); }

.stat-card{ background:#fff; border: 1px solid rgba(2,132,199,0.12); border-radius: 12px; padding: 12px; }
.stat-label{ color:#64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; }
.stat-value{ font-size: 22px; font-weight: 900; color:#0f172a; }

.table-wrap{ background:#fff; border: 1px solid rgba(2,132,199,0.12); border-radius: 12px; overflow: hidden; }
.pill-class{ background: rgba(14,165,233,.12); border: 1px solid rgba(14,165,233,.20); color: #075985; padding: 4px 10px; border-radius: 999px; font-weight: 700; font-size: 12px; }
.pill-subject{ background: rgba(34,197,94,.12); border: 1px solid rgba(34,197,94,.20); color: #166534; padding: 4px 10px; border-radius: 999px; font-weight: 700; font-size: 12px; }
.grade-chip{ display:inline-flex; align-items:center; justify-content:center; width: 34px; height: 24px; border-radius: 8px; font-weight: 900; letter-spacing: .4px; }
.total-badge{ display:inline-flex; padding: 3px 10px; border-radius: 999px; font-weight: 800; font-size: 12px; }

.mini-card{ background:#fff; border: 1px solid rgba(2,132,199,0.12); border-radius: 12px; padding: 12px; }
.mini-title{ font-weight: 900; color:#0f172a; margin-bottom: 10px; }
.mini-row{ display:flex; justify-content: space-between; gap: 12px; padding: 6px 0; border-bottom: 1px dashed rgba(2,132,199,0.10); }
.mini-row:last-child{ border-bottom: none; }
</style>
