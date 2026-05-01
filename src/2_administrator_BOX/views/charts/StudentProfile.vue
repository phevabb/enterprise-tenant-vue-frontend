<template>
  <CRow>
    <CCol :xs="12">
      <CCard class="mb-4 shadow">
        <CCardHeader
          class="bg-gradient-primary text-white d-flex justify-content-between align-items-center flex-wrap gap-3"
        >
          <strong class="fs-5 text-dark">Student Profiles</strong>

          <div class="d-flex align-items-center gap-2 flex-wrap">
            <CFormInput
              v-model="searchTerm"
              placeholder="Search by name, class, or contacts..."
              size="sm"
              class="shadow-sm border-primary"
              style="min-width: 260px"
              :disabled="loading"
            />

            <CButton
              color="light"
              class="text-primary border-primary"
              size="sm"
              @click="openAddModal"
              :disabled="loading"
            >
              <CIcon icon="cil-user-follow" class="me-1" />
              Add Student
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
                <CTableHeaderCell class="text-center" style="width: 48px">
                  <CFormCheck
                    :checked="allSelected"
                    :indeterminate="!allSelected && displayedStudents.some(s => selectedIds.includes(Number(s.id)))"
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

                <CTableDataCell>
                  {{ student.user?.fullName || '—' }}
                </CTableDataCell>

                <CTableDataCell>
                  {{ student.currentNewGradeClass?.name || '—' }}
                </CTableDataCell>

                <CTableDataCell>
                  {{ student.contactOfFather || '—' }}
                </CTableDataCell>

                <CTableDataCell>
                  {{ student.contactOfMother || '—' }}
                </CTableDataCell>

                <CTableDataCell>
                  <CBadge :color="student.isDiscountedStudent ? 'success' : 'secondary'">
                    {{ student.isDiscountedStudent ? 'Yes' : 'No' }}
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
            <div style="font-size: 14px; color: #6c757d">
              Showing {{ displayedStudents.length }} of {{ filteredStudents.length }}
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
      Delete <strong>{{ studentToDelete?.user?.fullName || 'this student' }}</strong>?
      <div class="text-danger small mt-2">This cannot be undone.</div>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="cancelDelete" :disabled="loading">
        Cancel
      </CButton>
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
    <CModalBody>This action cannot be undone.</CModalBody>
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
      <CTabs variant="pills" class="premium-tabs" :activeItemKey="'student-info'">
        <!-- Student Info -->
        <CTab title="Student Info" itemKey="student-info">
          <div class="card-premium">
            <div class="card-title-premium">
              <CIcon icon="cil-user" /> Student Information
            </div>

            <div class="row g-4">
              <div class="col-md-8">
                <CFormLabel>Full Name <span class="text-danger">*</span></CFormLabel>
                <CFormInput v-model="form.fullName" :invalid="!form.fullName" />
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
                <CFormSelect v-model="form.currentNewGradeClassId" :invalid="!form.currentNewGradeClassId">
                  <option :value="null">Select class</option>
                  <option v-for="cls in classOptions" :key="cls.value" :value="cls.value">
                    {{ cls.label }}
                  </option>
                </CFormSelect>
              </div>

              <div class="col-md-6">
                <CFormLabel>Family (Optional)</CFormLabel>
                <CFormSelect v-model="form.family">
                  <option :value="null">Select Family</option>
                  <option v-for="cls in familyOptions" :key="cls.value" :value="cls.value">
                    {{ cls.label }}
                  </option>
                </CFormSelect>
              </div>

              <div class="col-md-6">
                <CFormLabel>Date of Birth</CFormLabel>
                <CFormInput type="date" v-model="form.dateOfBirth" />
              </div>

              <div class="col-md-6">
                <CFormLabel>Nationality</CFormLabel>
                <CFormInput v-model="form.nationality" />
              </div>

              <div class="col-md-6">
                <CFormLabel>Class Seeking Admission To</CFormLabel>
                <CFormInput v-model="form.classSeekingAdmissionTo" placeholder="Optional" />
              </div>
            </div>
          </div>
        </CTab>

        <!-- Parent Info -->
        <CTab title="Parent Info" itemKey="parent-info">
          <div class="card-premium">
            <div class="card-title-premium">
              <CIcon icon="cil-people" /> Father’s Information
            </div>

            <div class="row g-4 mb-4">
              <div class="col-md-6">
                <CFormLabel>Name</CFormLabel>
                <CFormInput v-model="form.nameOfFather" />
              </div>
              <div class="col-md-6">
                <CFormLabel>Contact of Father <span class="text-danger">*</span></CFormLabel>
                <CFormInput v-model="form.contactOfFather" />
              </div>
              <div class="col-md-6">
                <CFormLabel>Occupation</CFormLabel>
                <CFormInput v-model="form.occupationOfFather" />
              </div>
              <div class="col-md-6">
                <CFormLabel>Nationality</CFormLabel>
                <CFormInput v-model="form.nationalityOfFather" />
              </div>
            </div>

            <div class="card-title-premium">
              <CIcon icon="cil-people" /> Mother’s Information
            </div>

            <div class="row g-4">
              <div class="col-md-6">
                <CFormLabel>Name</CFormLabel>
                <CFormInput v-model="form.nameOfMother" />
              </div>
              <div class="col-md-6">
                <CFormLabel>Contact of Mother <span class="text-danger">*</span></CFormLabel>
                <CFormInput v-model="form.contactOfMother" />
              </div>
              <div class="col-md-6">
                <CFormLabel>Occupation</CFormLabel>
                <CFormInput v-model="form.occupationOfMother" />
              </div>
              <div class="col-md-6">
                <CFormLabel>Nationality</CFormLabel>
                <CFormInput v-model="form.nationalityOfMother" />
              </div>
            </div>

            <div class="mt-4 card-switch-premium">
              <CFormSwitch
                v-model="form.isDiscountedStudent"
                label="Discounted Student"
                color="primary"
              />
            </div>
          </div>
        </CTab>

        <!-- Health Info -->
        <CTab title="Health Info" itemKey="health-info">
          <div class="card-premium">
            <div class="card-title-premium">
              <CIcon icon="cil-heart" /> Health Information
            </div>

            <div class="row g-4">
              <div class="col-md-4">
                <CFormSwitch v-model="form.isImmunized" label="Immunized" color="success" />
              </div>

              <div class="col-md-4">
                <CFormSwitch v-model="form.hasAllergies" label="Has Allergies" color="warning" />
              </div>

              <div class="col-12" v-if="form.hasAllergies">
                <CFormLabel>Allergic Foods</CFormLabel>
                <CFormInput v-model="form.allergicFoods" />
              </div>
            </div>
          </div>
        </CTab>

        <!-- Other Info -->
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
                <CFormInput v-model="form.deactivationReason" />
              </div>
            </div>
          </div>
        </CTab>
      </CTabs>
    </CModalBody>

    <CModalFooter class="footer-premium">
      <CButton color="light" class="me-3" @click="closeFormModal" :disabled="loading">Cancel</CButton>
      <CButton color="primary" class="text-white" @click="submitForm" :disabled="loading">
        <CIcon icon="cil-save" class="me-2 text-white" />
        {{ isEdit ? 'Update Student' : 'Create Student' }}
      </CButton>
    </CModalFooter>
  </CModal>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useToast } from 'vue-toastification'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

import Pagination from '@/Pagination.vue'
import {
  rawst_ktor,
  get_raw_families_ktor,
  create_student_ktor,
  update_student_ktor,
  delete_student_ktor,
  get_classes_ktor
} from '@/services/api'

const toast = useToast()

// ─────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────
const loading = ref(false)
const errorMessage = ref('')

const allStudents = ref([])
const searchTerm = ref('')
const currentPage = ref(1)
const pageSize = 10

const classOptions = ref([]) // [{ label, value }]
const familyOptions = ref([])

const selectedIds = ref([])
const showDeleteModal = ref(false)
const studentToDelete = ref(null)
const showDeleteBulkModal = ref(false)
const isDeleting = ref(false)

const showFormModal = ref(false)
const isEdit = ref(false)
const currentStudent = ref(null)

// ─────────────────────────────────────────────────────────────
// Form (reactive) — keep internal names consistent
// ─────────────────────────────────────────────────────────────
const form = reactive({
  id: null, // user.id
  fullName: '',
  gender: '',
  nationality: 'Ghanaian',
  dateOfBirth: '',

  // IMPORTANT: store class ID here (number or null)
  currentNewGradeClassId: null,

  family:null,

  classSeekingAdmissionTo: '',
  isDiscountedStudent: false,
  isImmunized: false,

  allergicFoods: '',
  lastSchoolAttended: '',
  houseNumber: '',
  otherRelatedInfo: '',

  nameOfFather: '',
  occupationOfFather: '',
  contactOfFather: '',
  nationalityOfFather: '',

  nameOfMother: '',
  occupationOfMother: '',
  contactOfMother: '',
  nationalityOfMother: '',

  active: true,
  deactivationReason: ''
})

function resetForm() {
  form.id = null
  form.fullName = ''
  form.gender = ''
  form.nationality = 'Ghanaian'
  form.dateOfBirth = ''

  form.currentNewGradeClassId = null
  form.family = null

  form.classSeekingAdmissionTo = ''
  form.isDiscountedStudent = false
  form.isImmunized = false

  form.allergicFoods = ''
  form.lastSchoolAttended = ''
  form.houseNumber = ''
  form.otherRelatedInfo = ''

  form.nameOfFather = ''
  form.occupationOfFather = ''
  form.contactOfFather = ''
  form.nationalityOfFather = ''

  form.nameOfMother = ''
  form.occupationOfMother = ''
  form.contactOfMother = ''
  form.nationalityOfMother = ''

  form.active = true
  form.deactivationReason = ''
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function ensureValidPage() {
  const pages = totalPages.value
  if (currentPage.value > pages) currentPage.value = pages
  if (currentPage.value < 1) currentPage.value = 1
}

function normalizeStudent(s) {
  // Normalize common backend differences.
  // Ensure we always have:
  // - user.fullName (fallback from user.full_name)
  // - currentNewGradeClass {id,name} (fallback from current_new_grade_class)
  if (!s) return s

  const user = s.user || {}
  const fullName = user.fullName ?? user.full_name ?? ''
  const dateOfBirth = user.dateOfBirth ?? user.date_of_birth ?? null
  const nationality = user.nationality ?? null
  const gender = user.gender ?? null
  const isActive = user.isActive ?? user.is_active ?? true
  const userId = user.userId ?? user.user_id ?? null

  const cls = s.currentNewGradeClass ?? s.current_new_grade_class ?? null

  return {
    ...s,
    user: {
      ...user,
      fullName,
      dateOfBirth,
      nationality,
      gender,
      isActive,
      userId
    },
    currentNewGradeClass: cls
  }
}

// ─────────────────────────────────────────────────────────────
// Fetch classes
// ─────────────────────────────────────────────────────────────
async function fetchClasses() {
  try {
    const res = await get_classes_ktor()
    classOptions.value = (res.data || []).map(c => ({
      label: c.name,
      value: c.id
    }))
  } catch (e) {
    toast.error('Failed to fetch classes', { position: 'top-right' })
  }
}

async function fetchFamilies() {
  try {
    const res = await get_raw_families_ktor()


    familyOptions.value = (res.data || []).map(c => ({
      label: c.name,
      value: c.id
    }))
  } catch (e) {

    toast.error('Failed to fetch families', { position: 'top-right' })
  }
}





// ─────────────────────────────────────────────────────────────
// Fetch students
// ─────────────────────────────────────────────────────────────
async function loadAllStudents() {
  loading.value = true
  errorMessage.value = ''

  try {
    const res = await rawst_ktor()

    const list = Array.isArray(res.data) ? res.data : []
    allStudents.value = list.map(normalizeStudent)
    ensureValidPage()
  } catch (err) {
    errorMessage.value = 'Failed to load students'
    toast.error(errorMessage.value, { position: 'top-right' })
  } finally {
    loading.value = false
  }
}

// ─────────────────────────────────────────────────────────────
// Filtering + pagination
// ─────────────────────────────────────────────────────────────
const filteredStudents = computed(() => {
  const q = (searchTerm.value || '').trim().toLowerCase()
  if (!q) return allStudents.value

  return allStudents.value.filter(s => {
    const name = (s.user?.fullName || '').toLowerCase()
    const className = (s.currentNewGradeClass?.name || '').toLowerCase()
    const dad = (s.contactOfFather || s.contact_of_father || '').toLowerCase()
    const mom = (s.contactOfMother || s.contact_of_mother || '').toLowerCase()

    return (
      name.includes(q) ||
      className.includes(q) ||
      dad.includes(q) ||
      mom.includes(q)
    )
  })
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredStudents.value.length / pageSize))
)

const displayedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredStudents.value.slice(start, start + pageSize)
})

const allSelected = computed(() =>
  displayedStudents.value.length > 0 &&
  displayedStudents.value.every(s => selectedIds.value.includes(Number(s.id)))
)

function toggleSelectAll() {
  const pageIds = displayedStudents.value.map(s => Number(s.id))
  if (allSelected.value) {
    selectedIds.value = selectedIds.value.filter(id => !pageIds.includes(id))
  } else {
    selectedIds.value = Array.from(new Set([...selectedIds.value, ...pageIds]))
  }
}

// ─────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────
function exportToCSV() {
  if (!filteredStudents.value.length) return toast.info('No data to export')

  const headers = ['#', 'Name', 'Current Class', "Dad's Contact", "Mom's Contact", 'Discounted']
  const rows = filteredStudents.value.map((s, i) => [
    i + 1,
    s.user?.fullName || '',
    s.currentNewGradeClass?.name || '',
    s.contactOfFather || '',
    s.contactOfMother || '',
    s.isDiscountedStudent ? 'Yes' : 'No'
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
  if (!filteredStudents.value.length) {
    toast.info('No data to export')
    return
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
  doc.setFontSize(16)
  doc.text('Student Profiles', 40, 40)

  const head = [['#', 'Name', 'Class', "Dad's Contact", "Mom's Contact", 'Discounted']]
  const body = filteredStudents.value.map((s, i) => [
    i + 1,
    s.user?.fullName || '',
    s.currentNewGradeClass?.name || '',
    s.contactOfFather || '',
    s.contactOfMother || '',
    s.isDiscountedStudent ? 'Yes' : 'No'
  ])

  autoTable(doc, {
    head,
    body,
    startY: 60,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 6, valign: 'middle' },
    headStyles: { fillColor: [78, 115, 223], textColor: 255, fontStyle: 'bold' }
  })

  doc.save(`students-${new Date().toISOString().split('T')[0]}.pdf`)
  toast.success('Exported to PDF', { position: 'top-right' })
}

// ─────────────────────────────────────────────────────────────
// Modal handlers
// ─────────────────────────────────────────────────────────────
function openAddModal() {
  isEdit.value = false
  currentStudent.value = null
  resetForm()
  showFormModal.value = true
}

function openEditModal(student) {
  isEdit.value = true
  currentStudent.value = student
  resetForm()

  // Fill form from normalized student
  form.id = student.user?.id ?? null
  form.fullName = student.user?.fullName ?? ''
  form.gender = student.user?.gender ?? ''
  form.nationality = student.user?.nationality ?? 'Ghanaian'
  form.dateOfBirth = student.user?.dateOfBirth ?? ''

  form.currentNewGradeClassId = student.currentNewGradeClass?.id ?? null
  form.family = student.family?.id ?? null

  form.isDiscountedStudent = !!student.isDiscountedStudent
  form.isImmunized = !!student.isImmunized

  form.allergicFoods = student.allergicFoods ?? ''
  form.lastSchoolAttended = student.lastSchoolAttended ?? ''
  form.houseNumber = student.houseNumber ?? ''
  form.otherRelatedInfo = student.otherRelatedInfo ?? ''

  form.nameOfFather = student.nameOfFather ?? ''
  form.occupationOfFather = student.occupationOfFather ?? ''
  form.contactOfFather = student.contactOfFather ?? ''
  form.nationalityOfFather = student.nationalityOfFather ?? ''

  form.nameOfMother = student.nameOfMother ?? ''
  form.occupationOfMother = student.occupationOfMother ?? ''
  form.contactOfMother = student.contactOfMother ?? ''
  form.nationalityOfMother = student.nationalityOfMother ?? ''

  form.active = !!student.user?.isActive
  form.deactivationReason = student.deactivationReason ?? ''

  showFormModal.value = true
}

function closeFormModal() {
  showFormModal.value = false
  currentStudent.value = null
}

// ─────────────────────────────────────────────────────────────
// Submit (Create / Patch)
// ─────────────────────────────────────────────────────────────
async function submitForm() {
  loading.value = true

  try {
    // Validation
    if (!form.fullName.trim()) {
      toast.error('Full Name is required')
      return
    }
    if (!form.gender) {
      toast.error('Gender is required')
      return
    }
    if (!form.contactOfFather.trim() && !form.contactOfMother.trim()) {
      toast.error('At least one parent contact is required')
      return
    }
    if (!form.currentNewGradeClassId) {
      toast.error('Current class is required')
      return
    }

    // Payload MUST match your backend DTOs (camelCase)
    const payload = {
      user: {
        id: form.id ?? undefined,
        fullName: form.fullName.trim(),
        gender: form.gender,
        nationality: form.nationality.trim() || 'Ghanaian',
        dateOfBirth: form.dateOfBirth || null,
        isActive: form.active,
        role: 'student',
        isStaff: false
      },

      currentNewGradeClassId: Number(form.currentNewGradeClassId) || null,
      family: form.family || null,

      classSeekingAdmissionTo: form.classSeekingAdmissionTo || '',
      isDiscountedStudent: !!form.isDiscountedStudent,
      isImmunized: !!form.isImmunized,

      allergicFoods: form.allergicFoods.trim() || null,
      lastSchoolAttended: form.lastSchoolAttended.trim() || null,
      houseNumber: form.houseNumber.trim() || null,
      otherRelatedInfo: form.otherRelatedInfo.trim() || null,

      nameOfFather: form.nameOfFather.trim() || null,
      occupationOfFather: form.occupationOfFather.trim() || null,
      nationalityOfFather: form.nationalityOfFather.trim() || null,
      contactOfFather: form.contactOfFather.trim() || null,

      nameOfMother: form.nameOfMother.trim() || null,
      occupationOfMother: form.occupationOfMother.trim() || null,
      nationalityOfMother: form.nationalityOfMother.trim() || null,
      contactOfMother: form.contactOfMother.trim() || null,

      deactivationReason: !form.active
        ? (form.deactivationReason.trim() || 'Not specified')
        : null
    }



    let res
    if (isEdit.value && currentStudent.value) {
      res = await update_student_ktor(currentStudent.value.id, payload)
      const normalized = normalizeStudent(res.data)

      const idx = allStudents.value.findIndex(s => s.id === currentStudent.value.id)
      if (idx !== -1) allStudents.value.splice(idx, 1, normalized)

      toast.success('Student updated successfully!')
    } else {
      res = await create_student_ktor(payload)
      const normalized = normalizeStudent(res.data)
      allStudents.value.unshift(normalized)
      currentPage.value = 1
      toast.success('Student created successfully!')
    }

    closeFormModal()
  } catch (err) {
    const serverMsg = err?.response?.data
    toast.error(formatBackendErrors(serverMsg) || 'Failed to save student', { position: 'top-right' })
  } finally {
    loading.value = false
  }
}

// ─────────────────────────────────────────────────────────────
// Delete
// ─────────────────────────────────────────────────────────────
function deleteStudent(student) {
  studentToDelete.value = student
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!studentToDelete.value) return
  loading.value = true
  showDeleteModal.value = false

  const id = Number(studentToDelete.value.id)
  const name = studentToDelete.value.user?.fullName || 'Student'

  try {
    await delete_student_ktor(id)
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
    await Promise.all(ids.map(id => delete_student_ktor(id)))
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

// ─────────────────────────────────────────────────────────────
// Error formatting
// ─────────────────────────────────────────────────────────────
function formatBackendErrors(errData) {
  if (!errData) return null
  const parts = []
  const walk = (obj, prefix = '') => {
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

// ─────────────────────────────────────────────────────────────
// Mount
// ─────────────────────────────────────────────────────────────
onMounted(async () => {
  await fetchClasses()
  await loadAllStudents()
  await fetchFamilies()
})
</script>


<style scoped>
.bg-gradient-primary {
  background: linear-gradient(90deg, #4e73df, #224abe);
}
</style>
