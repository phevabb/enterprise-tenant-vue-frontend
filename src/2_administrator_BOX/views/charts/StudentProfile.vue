<template>
  <CRow>
    <CCol :xs="12">
      <CCard class="mb-4 shadow">
        <CCardHeader class="bg-gradient-primary text-white d-flex justify-content-between align-items-center flex-wrap gap-3">
          <strong class="fs-5 text-dark">Student Profiles</strong>

          <div class="d-flex align-items-center gap-2 flex-wrap">
            <CFormInput
              v-model="searchTerm"
              placeholder="Search by name, class, or contacts..."
              size="sm"
              class="shadow-sm border-primary"
              style="min-width: 260px;"
              :disabled="loading"
            />

            <CButton color="light" class="text-primary border-primary" size="sm" @click="openAddModal" :disabled="loading">
              <CIcon icon="cil-user-follow" class="me-1" /> Add Student
            </CButton>

            <CButton
              color="danger"
              size="sm"
              :disabled="!selectedIds.length || loading"
              @click="showDeleteBulkModal = true"
            >
              Delete Selected ({{ selectedIds.length }})
            </CButton>

            <CDropdown variant="btn-group" size="sm">
              <CDropdownToggle color="success" :disabled="loading || !filteredStudents.length">
                Export
              </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem @click="exportToCSV">CSV</CDropdownItem>
                <CDropdownItem @click="exportToPDF">PDF</CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          </div>
        </CCardHeader>

        <CCardBody>
          <div v-if="loading" class="text-center my-5">
            <CSpinner color="primary" class="me-2" />
            <span class="text-primary fw-bold">Loading students...</span>
          </div>

          <CTable v-else hover responsive bordered class="shadow-sm">
            <CTableHead color="light">
              <CTableRow>
                <CTableHeaderCell class="text-center" style="width:48px">
                  <CFormCheck
                    :checked="allSelected"
                    :indeterminate="someSelected"
                    @change="toggleSelectAll"
                    :disabled="loading || !displayedStudents.length"
                  />
                </CTableHeaderCell>
                <CTableHeaderCell>#</CTableHeaderCell>
                <CTableHeaderCell>Name</CTableHeaderCell>
                <CTableHeaderCell>Current Class</CTableHeaderCell>
                <CTableHeaderCell>Dad's Contact</CTableHeaderCell>
                <CTableHeaderCell>Mom's Contact</CTableHeaderCell>
                <CTableHeaderCell>Discounted</CTableHeaderCell>
                <CTableHeaderCell class="text-end">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              <CTableRow v-for="(student, idx) in displayedStudents" :key="student.id">
                <CTableDataCell class="text-center">
                  <CFormCheck v-model="selectedIds" :value="Number(student.id)" />
                </CTableDataCell>
                <CTableHeaderCell scope="row">
                  {{ (currentPage - 1) * pageSize + idx + 1 }}
                </CTableHeaderCell>
                <CTableDataCell>{{ student.user?.full_name || '—' }}</CTableDataCell>
                <CTableDataCell>{{ classValueToLabel(student.current_class) }}</CTableDataCell>
                <CTableDataCell>{{ student.contact_of_father || '—' }}</CTableDataCell>
                <CTableDataCell>{{ student.contact_of_mother || '—' }}</CTableDataCell>
                <CTableDataCell>
                  <CBadge :color="student.is_discounted_student ? 'success' : 'secondary'">
                    {{ student.is_discounted_student ? 'Yes' : 'No' }}
                  </CBadge>
                </CTableDataCell>
                <CTableDataCell class="text-end">
                  <CButtonGroup size="sm">
                    <CButton color="secondary" variant="outline" @click="openEditModal(student)">
                      Edit
                    </CButton>
                    <CButton color="danger" variant="outline" @click="deleteStudent(student)">
                      Delete
                    </CButton>
                  </CButtonGroup>
                </CTableDataCell>
              </CTableRow>

              <CTableRow v-if="!loading && !filteredStudents.length">
                <CTableDataCell colspan="8" class="text-center text-muted py-5">
                  No students found<span v-if="searchTerm"> for “{{ searchTerm }}”</span>.
                </CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>

          <div class="d-flex justify-content-between align-items-center mt-4">
            <Pagination
              :current-page="currentPage"
              :total-pages="totalPages"
              @page-changed="changePage"
              :disabled="loading || !filteredStudents.length"
            />
            <div style="font-size:14px; color:#6c757d;">
              {{ showingRange }}
            </div>
          </div>
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>

  <!-- Single Delete Confirm -->
  <CModal :visible="showDeleteModal" @close="cancelDelete" size="md">
    <CModalHeader class="bg-danger text-white">
      <CModalTitle>Confirm Deletion</CModalTitle>
    </CModalHeader>
    <CModalBody>
      Delete <strong>{{ studentToDelete?.user?.full_name || 'this student' }}</strong>?
      <div class="text-danger small mt-2">This cannot be undone.</div>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="cancelDelete" :disabled="loading">Cancel</CButton>
      <CButton color="danger" @click="confirmDelete" :disabled="loading">
        <CSpinner size="sm" v-if="loading" class="me-1" />
        Delete
      </CButton>
    </CModalFooter>
  </CModal>

  <!-- Bulk Delete Confirm -->
  <CModal :visible="showDeleteBulkModal" @close="showDeleteBulkModal = false">
    <CModalHeader class="bg-danger text-white">
      <CModalTitle>Delete {{ selectedIds.length }} Students?</CModalTitle>
    </CModalHeader>
    <CModalBody>
      This action cannot be undone.
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="showDeleteBulkModal = false" :disabled="isDeleting">
        Cancel
      </CButton>
      <CButton color="danger" @click="confirmDeleteBulk" :disabled="isDeleting">
        <CSpinner size="sm" v-if="isDeleting" class="me-1" />
        Delete Selected
      </CButton>
    </CModalFooter>
  </CModal>

  <!-- Student Form Modal -->
  <CModal :visible="showFormModal" @close="closeFormModal" size="xl" class="student-modal-premium">
    <CModalHeader class="modal-header-premium">
      <CModalTitle class="d-flex align-items-center gap-2">
        <CIcon icon="cil-education" size="lg" />
        {{ isEdit ? 'Edit Student Profile' : 'Add New Student' }}
      </CModalTitle>
    </CModalHeader>

    <CModalBody class="modal-body-premium">
      <CTabs variant="pills" class="premium-tabs" :activeItemKey="'personal-info'">
        <CTab title="Student Info" itemKey="personal-info">
          <div class="card-premium">
            <div class="card-title-premium">
              <CIcon icon="cil-user" /> Student Information
            </div>
            <div class="row g-4">
              <div class="col-md-8">
                <CFormLabel>Full Name <span class="text-danger">*</span></CFormLabel>
                <CFormInput v-model="form.full_name" :invalid="!form.full_name" />
              </div>
              <div class="col-md-4">
                <CFormLabel>Gender <span class="text-danger">*</span></CFormLabel>
                <CFormSelect v-model="form.gender" :invalid="!form.gender">
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </CFormSelect>
              </div>
              <div class="col-md-6">
                <CFormLabel>Current Class <span class="text-danger">*</span></CFormLabel>
                <CFormSelect v-model="form.current_class" :invalid="!form.current_class">
                  <option value="">Select class</option>
                  <option v-for="cls in classOptions" :key="cls.value" :value="cls.value">
                    {{ cls.label }}
                  </option>
                </CFormSelect>
              </div>
              <div class="col-md-6">
                <CFormLabel>Class Seeking Admission</CFormLabel>
                <CFormSelect v-model="form.class_seeking_admission_to">
                  <option value="">Select class</option>
                  <option v-for="cls in classOptions" :key="cls.value" :value="cls.value">
                    {{ cls.label }}
                  </option>
                </CFormSelect>
              </div>
              <div class="col-md-6">
                <CFormLabel>Date of Birth</CFormLabel>
                <CFormInput type="date" v-model="form.date_of_birth" />
              </div>
              <div class="col-md-6">
                <CFormLabel>Nationality</CFormLabel>
                <CFormInput v-model="form.nationality" />
              </div>
            </div>
          </div>
        </CTab>

        <CTab title="Parent Info" itemKey="parental-info">
          <div class="card-premium">
            <div class="card-title-premium">
              <CIcon icon="cil-people" /> Father’s Information
            </div>
            <div class="row g-4 mb-4">
              <div class="col-md-6">
                <CFormLabel>Name</CFormLabel>
                <CFormInput v-model="form.name_of_father" />
              </div>
              <div class="col-md-6">
                <CFormLabel>Contact of Father <span class="text-danger">*</span></CFormLabel>
                <CFormInput v-model="form.contact_of_father" />
              </div>
              <div class="col-md-6">
                <CFormLabel>Occupation</CFormLabel>
                <CFormInput v-model="form.occupation_of_father" />
              </div>
              <div class="col-md-6">
                <CFormLabel>Nationality</CFormLabel>
                <CFormInput v-model="form.nationality_of_father" />
              </div>
            </div>

            <div class="card-title-premium">
              <CIcon icon="cil-people" /> Mother’s Information
            </div>
            <div class="row g-4">
              <div class="col-md-6">
                <CFormLabel>Name</CFormLabel>
                <CFormInput v-model="form.name_of_mother" />
              </div>
              <div class="col-md-6">
                <CFormLabel>Contact of Mother <span class="text-danger">*</span></CFormLabel>
                <CFormInput v-model="form.contact_of_mother" />
              </div>
              <div class="col-md-6">
                <CFormLabel>Occupation</CFormLabel>
                <CFormInput v-model="form.occupation_of_mother" />
              </div>
              <div class="col-md-6">
                <CFormLabel>Nationality</CFormLabel>
                <CFormInput v-model="form.nationality_of_mother" />
              </div>
            </div>

            <div class="mt-4 card-switch-premium">
              <CFormSwitch
                v-model="form.is_discounted_student"
                label="Discounted Student"
                color="primary"
              />
            </div>
          </div>
        </CTab>

        <CTab title="Health Info" itemKey="health-info">
          <div class="card-premium">
            <div class="card-title-premium">
              <CIcon icon="cil-heart" /> Health Information
            </div>
            <div class="row g-4">
              <div class="col-md-4">
                <CFormSwitch v-model="form.is_immunized" label="Immunized" color="success" />
              </div>
              <div class="col-md-4">
                <CFormSwitch v-model="form.has_allergies" label="Has Allergies" color="warning" />
              </div>
              <div class="col-12" v-if="form.has_allergies">
                <CFormLabel>Allergic Foods</CFormLabel>
                <CFormInput v-model="form.allergic_foods" />
              </div>
            </div>
          </div>
        </CTab>

        <CTab title="Other Info" itemKey="other-info">
          <div class="card-premium">
            <div class="card-title-premium">
              <CIcon icon="cil-notes" /> Additional Information
            </div>
            <div class="row g-4">
              <div class="col-md-6">
                <CFormLabel>Last School Attended</CFormLabel>
                <CFormInput v-model="form.lastSchoolAttended" />
              </div>
              <div class="col-md-6">
                <CFormLabel>House Address</CFormLabel>
                <CFormInput v-model="form.houseNumber" />
              </div>
              <div class="col-12">
                <CFormLabel>Additional Info / Health Note</CFormLabel>
                <CFormTextarea v-model="form.otherRelatedInfo" rows="4" />
              </div>
              <div class="col-md-6 mt-3 d-flex gap-4">
                <CFormSwitch v-model="form.active" label="Active Student" />
              </div>
              <div class="col-12" v-if="!form.active">
                <CFormLabel>Reason for Deactivating</CFormLabel>
                <CFormInput v-model="form.deactivation_reason" />
              </div>
            </div>
          </div>
        </CTab>
      </CTabs>
    </CModalBody>

    <CModalFooter class="footer-premium">
      <CButton color="light" class="me-3" @click="closeFormModal" :disabled="loading">Cancel</CButton>
      <CButton color="primary" @click="submitForm" :disabled="loading">
        <CIcon icon="cil-save" class="me-2" />
        {{ isEdit ? 'Update Student' : 'Create Student' }}
      </CButton>
    </CModalFooter>
  </CModal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

import { useToast } from 'vue-toastification'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import autoTable from 'jspdf-autotable'

import Pagination from '@/Pagination.vue'
import { st, create_student, update_student, delete_student } from '@/services/api'

const toast = useToast()

// ── UI and API page sizes ─────────────────────────────────
const pageSize = 10                 // UI page size (client pagination)
const API_PAGE_SIZE = 100           // API fetch size (bigger = fewer requests)


function normalizeCurrentClass(val) {
  // Convert label or numeric-string to number value for consistency
  if (val == null || val === '') return ''
  if (typeof val === 'number') return val
  const s = String(val).trim()
  if (/^\d+$/.test(s)) return Number(s)
  const match = classOptions.find(c => c.label.toLowerCase() === s.toLowerCase())
  return match ? match.value : '' // fallback to '' if unknown
}

function normalizeStudent(student) {
  if (!student) return student
  const normalized = { ...student }
  normalized.current_class = normalizeCurrentClass(student.current_class)
  normalized.class_seeking_admission_to = normalizeCurrentClass(student.class_seeking_admission_to)
  // You can normalize other fields here if backend returns varied shapes
  return normalized
}



// ── State ────────────────────────────────────────────────
const loading = ref(false)
const errorMessage = ref('')

const allStudents = ref([])         // full dataset loaded from backend (no server search)
const searchTerm = ref('')          // client-only filter
const currentPage = ref(1)

const selectedIds = ref([])
const showDeleteModal = ref(false)
const studentToDelete = ref(null)
const showDeleteBulkModal = ref(false)
const isDeleting = ref(false)

const showFormModal = ref(false)
const isEdit = ref(false)
const currentStudent = ref(null)

const form = ref({
  id: '',
  full_name: '',
  gender: '',
  nationality: '',
  date_of_birth: '',
  current_class: '',
  class_seeking_admission_to: '',
  is_discounted_student: false,
  deactivation_reason: '',
  is_immunized: false,
  has_allergies: false,
  allergic_foods: '',
  name_of_father: '',
  occupation_of_father: '',
  contact_of_father: '',
  nationality_of_father: '',
  name_of_mother: '',
  occupation_of_mother: '',
  contact_of_mother: '',
  nationality_of_mother: '',
  lastSchoolAttended: '',
  houseNumber: '',
  otherRelatedInfo: '',
  active: true,
})

// ── Helpers ──────────────────────────────────────────────
const classOptions = [
  { label: 'Creche', value: 1 },
  { label: 'Nursery 1', value: 2 },
  { label: 'Nursery 2', value: 3 },
  { label: 'KG 1', value: 4 },
  { label: 'KG 2', value: 5 },
  { label: 'Class 1', value: 6 },
  { label: 'Class 2', value: 7 },
  { label: 'Class 3', value: 8 },
  { label: 'Class 4', value: 9 },
  { label: 'Class 5', value: 10 },
  { label: 'Class 6', value: 11 },
  { label: 'JHS 1', value: 12 },
  { label: 'JHS 2', value: 13 },
  { label: 'JHS 3', value: 14 },
]

const classValueToLabel = (val) => {
  const match = classOptions.find(c => c.value === Number(val))
  return match?.label || '—'
}

const mapClassStringToValue = (input) => {
  if (!input) return ''
  if (typeof input === 'number') return input
  if (typeof input === 'string' && /^\d+$/.test(input.trim())) {
    return Number(input.trim())
  }
  const normalized = input.trim().toLowerCase()
  const match = classOptions.find(cls => cls.label.toLowerCase() === normalized)
  return match ? match.value : ''
}

// ── Client-side filtering & pagination ───────────────────
const filteredStudents = computed(() => {
  const q = (searchTerm.value || '').trim().toLowerCase()
  if (!q) return allStudents.value

  return allStudents.value.filter(s => {
    const name = (s.user?.full_name || '').toLowerCase()
    const classLabel = classValueToLabel(s.current_class).toLowerCase()
    const dad = (s.contact_of_father || '').toLowerCase()
    const mom = (s.contact_of_mother || '').toLowerCase()
    return (
      name.includes(q) ||
      classLabel.includes(q) ||
      dad.includes(q) ||
      mom.includes(q)
    )
  })
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredStudents.value.length / pageSize))
})

const displayedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredStudents.value.slice(start, start + pageSize)
})

const showingRange = computed(() => {
  const total = filteredStudents.value.length
  if (total === 0) return 'Showing 0 students'
  const start = (currentPage.value - 1) * pageSize + 1
  const end = Math.min(start + displayedStudents.value.length - 1, total)
  return `Showing ${start}–${end} of ${total}`
})

const allSelected = computed(() =>
  displayedStudents.value.length > 0 &&
  displayedStudents.value.every(s => selectedIds.value.includes(Number(s.id)))
)

const someSelected = computed(() =>
  !allSelected.value &&
  displayedStudents.value.some(s => selectedIds.value.includes(Number(s.id)))
)

// Keep the page valid when filters change or after deletes
function ensureValidPage() {
  const pages = totalPages.value
  if (currentPage.value > pages) currentPage.value = pages
  if (currentPage.value < 1) currentPage.value = 1
}

// ── Core Methods ─────────────────────────────────────────
async function loadAllStudents() {
  loading.value = true
  errorMessage.value = ''

  try {
    // 1) First page
    const first = await st({ page: 1, page_size: API_PAGE_SIZE })
    const data = first.data || {}
    const firstResults = data.results || []
    const count = Number(data.count) || firstResults.length
    const pages = Math.max(1, Math.ceil(count / API_PAGE_SIZE))

    const all = [...firstResults]

    // 2) Remaining pages (sequential to avoid hammering)
    for (let p = 2; p <= pages; p++) {
      const res = await st({ page: p, page_size: API_PAGE_SIZE })
      all.push(...(res.data?.results || []))
    }

    allStudents.value = all
    ensureValidPage()
  } catch (err) {
    errorMessage.value = err?.response?.data?.detail || 'Failed to load students'
    toast.error(errorMessage.value, { position: 'top-right' })
  } finally {
    loading.value = false
  }
}

function changePage(page) {
  currentPage.value = page
}

// ── Export (filtered dataset) ─────────────────────────────
function exportToCSV() {
  if (!filteredStudents.value.length) return toast.info('No data to export')

  const headers = ['#', 'Name', 'Current Class', "Dad's Contact", "Mom's Contact", 'Discounted']
  const rows = filteredStudents.value.map((s, i) => [
    i + 1,
    s.user?.full_name || '',
    classValueToLabel(s.current_class),
    s.contact_of_father || '',
    s.contact_of_mother || '',
    s.is_discounted_student ? 'Yes' : 'No',
  ])

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `students-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)

  toast.success('Exported to CSV', { position: 'top-right' })
}

async function exportToPDF() {
  try {
    if (!filteredStudents.value.length) {
      toast.info('No data to export')
      return
    }

    // Create PDF
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })

    // Title
    doc.setFontSize(16)
    doc.text('Student Profiles', 40, 40)

    // Data
    const columns = ['#', 'Name', 'Class', "Dad's Contact", "Mom's Contact", 'Discounted']
    const rows = filteredStudents.value.map((s, i) => [
      i + 1,
      s.user?.full_name || '',
      classValueToLabel(s.current_class),
      s.contact_of_father || '',
      s.contact_of_mother || '',
      s.is_discounted_student ? 'Yes' : 'No',
    ])

    // Table (use the function import)
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 60,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 6,
        valign: 'middle',
      },
      headStyles: {
        fillColor: [78, 115, 223],
        textColor: 255,
        fontStyle: 'bold',
      },
      // Optional: set relative column widths so contacts wrap nicely
      columnStyles: {
        0: { cellWidth: 30 },     // #
        1: { cellWidth: 140 },    // Name
        2: { cellWidth: 70 },     // Class
        3: { cellWidth: 120 },    // Dad
        4: { cellWidth: 120 },    // Mom
        5: { cellWidth: 70 },     // Discounted
      },
      // Add a footer with page numbers
      didDrawPage: (data) => {
        const pageSize = doc.internal.pageSize
        const pageWidth = pageSize.getWidth()
        const pageHeight = pageSize.getHeight()
        doc.setFontSize(9)
        doc.setTextColor(120)
        const str = `Page ${doc.internal.getNumberOfPages()}`
        doc.text(str, pageWidth - 40, pageHeight - 20)
      },
      // Split long rows across pages
      willDrawCell: (data) => {
        // You can customize wrapping if needed
      }
    })

    const filename = `students-${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(filename)
    toast.success('Exported to PDF', { position: 'top-right' })
  } catch (e) {
    // Helpful diagnostics

    if (String(e).includes('autoTable')) {
      toast.error('PDF export failed: autoTable is not available. Check imports.', { position: 'top-right' })
    } else {
      toast.error('Failed to export PDF', { position: 'top-right' })
    }
  }
}

// ── CRUD handlers (sync with allStudents) ─────────────────
function openAddModal() {
  isEdit.value = false
  currentStudent.value = null
  form.value = {
    full_name: '',
    gender: '',
    nationality: 'Ghanaian',
    date_of_birth: '',
    current_class: '',
    class_seeking_admission_to: '',
    is_discounted_student: false,
    is_immunized: false,
    has_allergies: false,
    allergic_foods: '',
    name_of_father: '',
    occupation_of_father: '',
    contact_of_father: '',
    nationality_of_father: '',
    name_of_mother: '',
    occupation_of_mother: '',
    contact_of_mother: '',
    nationality_of_mother: '',
    lastSchoolAttended: '',
    houseNumber: '',
    otherRelatedInfo: '',
    active: true,
    deactivation_reason: '',
  }
  showFormModal.value = true
}

function openEditModal(student) {
  isEdit.value = true
  currentStudent.value = student

  form.value = {
    id: student.user?.id || '',
    full_name: student.user?.full_name || '',
    gender: student.user?.gender || '',
    nationality: student.user?.nationality || 'Ghanaian',
    date_of_birth: student.user?.date_of_birth || '',
    current_class: mapClassStringToValue(student.current_class),
    class_seeking_admission_to: mapClassStringToValue(student.class_seeking_admission_to),
    is_discounted_student: !!student.is_discounted_student,
    is_immunized: !!student.is_immunized,
    has_allergies: !!student.has_allergies,
    allergic_foods: student.allergic_foods || '',
    name_of_father: student.name_of_father || '',
    occupation_of_father: student.occupation_of_father || '',
    contact_of_father: student.contact_of_father || '',
    nationality_of_father: student.nationality_of_father || '',
    name_of_mother: student.name_of_mother || '',
    occupation_of_mother: student.occupation_of_mother || '',
    contact_of_mother: student.contact_of_mother || '',
    nationality_of_mother: student.nationality_of_mother || '',
    lastSchoolAttended: student.last_school_attended || '',
    houseNumber: student.house_number || '',
    otherRelatedInfo: student.other_related_info || '',
    active: !!student.user?.is_active,
    deactivation_reason: student.deactivation_reason || '',
  }
  showFormModal.value = true
}

function closeFormModal() {
  showFormModal.value = false
  currentStudent.value = null
}

async function submitForm() {
  loading.value = true

  try {
    // Basic validation
    if (!form.value.full_name?.trim()) {
      toast.error('Full Name is required')
      return
    }
    if (!form.value.gender) {
      toast.error('Gender is required')
      return
    }
    if (!form.value.current_class) {
      toast.error('Current Class is required')
      return
    }
    if (!form.value.contact_of_father?.trim() && !form.value.contact_of_mother?.trim()) {
      toast.error('At least one parent contact is required')
      return
    }

    const payload = {
      user: {
        id: form.value.id || undefined,
        full_name: form.value.full_name.trim(),
        gender: form.value.gender,
        nationality: form.value.nationality?.trim() || 'Ghanaian',
        date_of_birth: form.value.date_of_birth || undefined,
        is_active: form.value.active,
        role: 'student',
        is_staff: false,
      },
      current_class: Number(form.value.current_class),
      class_seeking_admission_to: form.value.class_seeking_admission_to
        ? classOptions.find(c => c.value === Number(form.value.class_seeking_admission_to))?.label?.toLowerCase() || ''
        : '',
      is_discounted_student: !!form.value.is_discounted_student,
      contact_of_father: form.value.contact_of_father?.trim() || null,
      contact_of_mother: form.value.contact_of_mother?.trim() || null,
      name_of_father: form.value.name_of_father?.trim() || null,
      occupation_of_father: form.value.occupation_of_father?.trim() || null,
      nationality_of_father: form.value.nationality_of_father?.trim() || null,
      name_of_mother: form.value.name_of_mother?.trim() || null,
      occupation_of_mother: form.value.occupation_of_mother?.trim() || null,
      nationality_of_mother: form.value.nationality_of_mother?.trim() || null,
      is_immunized: !!form.value.is_immunized,
      has_allergies: !!form.value.has_allergies,
      allergic_foods: form.value.allergic_foods?.trim() || null,
      last_school_attended: form.value.lastSchoolAttended?.trim() || null,
      house_number: form.value.houseNumber?.trim() || null,
      other_related_info: form.value.otherRelatedInfo?.trim() || null,
      deactivation_reason: !form.value.active ? (form.value.deactivation_reason?.trim() || 'Not specified') : null,
    }

    let response
    if (isEdit.value && currentStudent.value) {
      response = await update_student(currentStudent.value.id, payload)
      const idx = allStudents.value.findIndex(s => s.id === currentStudent.value.id)
      if (idx !== -1) {
        // Merge response into local dataset
        const updated = { ...allStudents.value[idx], ...response.data }
        if (response.data.user) {
          updated.user = { ...allStudents.value[idx].user, ...response.data.user }
        }
        allStudents.value.splice(idx, 1, updated)
      }
      toast.success('Student updated successfully!')
    } else {
      response = await create_student(payload)
      // Normalize what the backend returned so your UI stays consistent
      const normalized = normalizeStudent(response.data)
      allStudents.value.unshift(normalized)
      toast.success('Student created successfully!')
      currentPage.value = 1
    }

    closeFormModal()
  } catch (err) {
    const serverMsg = err.response?.data
    const formatted = formatBackendErrors(serverMsg) || 'Failed to save student'
    toast.error(formatted, { position: 'top-right' })
  } finally {
    loading.value = false
  }
}

function deleteStudent(student) {
  studentToDelete.value = student
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!studentToDelete.value) return
  loading.value = true
  showDeleteModal.value = false

  const id = Number(studentToDelete.value.id)
  const name = studentToDelete.value.user?.full_name || 'Student'

  try {
    await delete_student(id)
    allStudents.value = allStudents.value.filter(s => Number(s.id) !== id)
    selectedIds.value = selectedIds.value.filter(sid => sid !== id)
    toast.success(`${name} deleted successfully!`)
    ensureValidPage()
  } catch (err) {
    toast.error('Failed to delete student')
  } finally {
    loading.value = false
    studentToDelete.value = null
  }
}

function cancelDelete() {
  showDeleteModal.value = false
  studentToDelete.value = null
}

async function confirmDeleteBulk() {
  const ids = selectedIds.value.map(Number)
  if (!ids.length) return

  isDeleting.value = true

  try {
    await Promise.all(ids.map(id => delete_student(id)))
    allStudents.value = allStudents.value.filter(s => !ids.includes(Number(s.id)))
    selectedIds.value = []
    toast.success('Selected students deleted successfully!')
    ensureValidPage()
  } catch (err) {
    toast.error('Failed to delete some students')
  } finally {
    isDeleting.value = false
    showDeleteBulkModal.value = false
  }
}

function toggleSelectAll() {
  if (allSelected.value) {
    // Unselect the ones on the current page
    const pageIds = displayedStudents.value.map(s => Number(s.id))
    selectedIds.value = selectedIds.value.filter(id => !pageIds.includes(id))
  } else {
    // Add all on the current page
    const pageIds = displayedStudents.value.map(s => Number(s.id))
    const set = new Set(selectedIds.value.concat(pageIds))
    selectedIds.value = Array.from(set)
  }
}

function formatBackendErrors(errData) {
  if (!errData) return null
  const parts = []
  function walk(obj, prefix = '') {
    if (Array.isArray(obj)) {
      parts.push(`${prefix}: ${obj.map(m => String(m)).join('; ')}`)
      return
    }
    if (typeof obj === 'string') {
      parts.push(`${prefix}: ${obj}`)
      return
    }
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        walk(obj[key], prefix ? `${prefix}.${key}` : key)
      }
    }
  }
  walk(errData)
  return parts.join(' | ') || null
}

onMounted(() => {
  loadAllStudents()
})
</script>

<style scoped>
.bg-gradient-primary {
  background: linear-gradient(90deg, #4e73df, #224abe);
}
</style>
