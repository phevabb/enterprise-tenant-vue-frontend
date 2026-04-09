

<template>
  <CRow>
    <CCol :xs="12">
      <CCard class="mb-4">
        <CCardHeader>
          <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <strong>Deactivated Students</strong>

            <div class="d-flex align-items-center gap-2 flex-wrap">
              <CFormInput
                v-model="searchTerm"
                placeholder="Search by name..."
                aria-label="Search by name"
                size="sm"
                style="min-width: 260px;"
              />
            </div>
          </div>
        </CCardHeader>

        <CCardBody>
          <div v-if="loading" class="text-center my-4">
            <CSpinner color="primary" class="me-2" /> Loading data ...
          </div>

          <CTable v-else hover responsive bordered class="shadow-sm">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>#</CTableHeaderCell>
                <CTableHeaderCell>Name</CTableHeaderCell>
                <CTableHeaderCell>Reason</CTableHeaderCell>
                <CTableHeaderCell>Date</CTableHeaderCell>
                <CTableHeaderCell class="text-end">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              <CTableRow v-for="(row, idx) in filteredStaff" :key="row.id">
                <CTableHeaderCell>{{ idx + 1 }}</CTableHeaderCell>

                <!-- ✅ SAFE USER DISPLAY -->
                <CTableDataCell>{{ row.user?.full_name || '—' }}</CTableDataCell>

                <CTableDataCell>{{ row.deactivation_reason || '—' }}</CTableDataCell>
                <CTableDataCell>{{ row.date_deactivated || '—' }}</CTableDataCell>

                <CTableDataCell class="text-end">
                  <CButtonGroup size="sm">
                    <CButton color="primary" variant="outline" @click="activateStudent(row)">
                      Activate
                    </CButton>

                    <CButton color="secondary" variant="outline" @click="openEditModal(row)">
                      Edit
                    </CButton>

                    <CButton color="danger" variant="outline" @click="deleteStaff(row)">
                      Delete
                    </CButton>
                  </CButtonGroup>
                </CTableDataCell>
              </CTableRow>

              <CTableRow v-if="!loading && filteredStaff.length === 0">
                <CTableDataCell colspan="5" class="text-center text-body-secondary">
                  No student found<span v-if="searchTerm"> for “{{ searchTerm }}”.</span>
                </CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>

  <!-- Delete Modal -->
  <CModal :visible="showDeleteModal" @close="cancelDelete" size="md">
    <CModalHeader class="bg-danger text-white">
      <CModalTitle>Confirm Deletion</CModalTitle>
    </CModalHeader>
    <CModalBody>
      Are you sure you want to delete
      <strong>{{ staffToDelete?.user?.full_name || 'this student' }}</strong>?
      This action cannot be reversed.
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="cancelDelete">Cancel</CButton>
      <CButton color="danger" @click="confirmDelete">Delete</CButton>
    </CModalFooter>
  </CModal>

  <!-- Activate Modal -->
  <CModal :visible="showActivateModal" @close="cancelActivate" size="md">
    <CModalHeader class="bg-success text-white">
      <CModalTitle>Confirm Activation</CModalTitle>
    </CModalHeader>
    <CModalBody>
      Are you sure you want to activate
      <strong>{{ studentToDelete?.user?.full_name || 'this student' }}</strong>?
      This action will restore student history.
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="cancelActivate">Cancel</CButton>
      <CButton color="success" @click="confirmActivate">Activate</CButton>
    </CModalFooter>
  </CModal>

  <!-- Edit Reason Modal -->
  <CModal :visible="showFormModal" @close="closeFormModal">
    <CModalHeader>
      <CModalTitle>Edit Reason</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <div class="mb-3">
        <CFormLabel>Edit Reason</CFormLabel>
        <CFormInput v-model="form.deactivation_reason" />
      </div>

      <CButton color="primary" @click="submitForm">
        {{ isEdit ? 'Update' : 'Create' }}
      </CButton>
    </CModalBody>
  </CModal>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  get_deactivated_students,
  activate_deactivated_student,
  update_deactivated_student,
  delete_deactivated_student,
} from '@/services/api'
import { useToast } from 'vue-toastification'

const toast = useToast()

const loading = ref(false)
const errorMessage = ref('')
const staff = ref([])

const showDeleteModal = ref(false)
const showActivateModal = ref(false)
const showFormModal = ref(false)

const staffToDelete = ref(null)
const studentToDelete = ref(null)

const searchTerm = ref('')
const selectedIds = ref([])
const isEdit = ref(false)
const currentStaff = ref(null)
const idToActivate = ref(null)

const form = ref({
  user: {
    full_name: '',
    id: '',
    role: 'staff'
  },
  deactivation_reason: ''
})

async function fetchStaff() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await get_deactivated_students()

    staff.value = response.data
  } catch (err) {


    if (err.code === 'ERR_NETWORK') {
      toast.error('Network error. Please check your internet connection.', {
        position: 'top-right'
      })
    } else if (err.response) {
      toast.error(
        err.response.data?.message || 'Failed to fetch deactivated students.',
        { position: 'top-right' }
      )
    } else {
      toast.error(
        'An unexpected error occurred while fetching deactivated students.',
        { position: 'top-right' }
      )
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStaff()
})

const filteredStaff = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()

  const result = !term
    ? staff.value
    : staff.value.filter(s =>
        s.user?.full_name?.toLowerCase().includes(term)
      )

  return result
})

const allSelected = computed(() =>
  selectedIds.value.length === filteredStaff.value.length &&
  filteredStaff.value.length > 0
)

const someSelected = computed(() =>
  selectedIds.value.length > 0 &&
  selectedIds.value.length < filteredStaff.value.length
)

function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = filteredStaff.value.map(s => s.id)
  }
}

function deleteStaff(item) {
  staffToDelete.value = item
  showDeleteModal.value = true
}

function activateStudent(item) {
  studentToDelete.value = item
  idToActivate.value = item.user?.id || null
  showActivateModal.value = true
}

function cancelDelete() {
  showDeleteModal.value = false
  staffToDelete.value = null
}

function cancelActivate() {
  showActivateModal.value = false
  studentToDelete.value = null
}

async function confirmDelete() {
  if (!staffToDelete.value) return

  loading.value = true
  showDeleteModal.value = false

  try {
    const idToDelete = staffToDelete.value.id
    const theName = staffToDelete.value.user?.full_name || 'Student'

    await delete_deactivated_student(idToDelete)

    staff.value = staff.value.filter(s => s.id !== idToDelete)

    toast.success(`${theName} deleted successfully!`, {
      position: 'top-right'
    })
  } catch (error) {
    toast.error('Failed to delete student. Please try again.', {
      position: 'top-right'
    })
  } finally {
    loading.value = false
    staffToDelete.value = null
  }
}

async function confirmActivate() {
  if (!studentToDelete.value) return

  loading.value = true
  showActivateModal.value = false

  try {
    const idToActivateRow = studentToDelete.value.id
    const theName = studentToDelete.value.user?.full_name || 'Student'

    await activate_deactivated_student(idToActivateRow)

    staff.value = staff.value.filter(s => s.id !== idToActivateRow)

    toast.success(`${theName} activated successfully!`, {
      position: 'top-right'
    })
  } catch (error) {
    toast.error('Failed to activate student. Please try again.', {
      position: 'top-right'
    })
  } finally {
    loading.value = false
    studentToDelete.value = null
  }
}

function openEditModal(staffMember) {
  isEdit.value = true
  currentStaff.value = staffMember

  const user = staffMember.user || {}

  form.value = {
    user: {
      full_name: user.full_name || '',
      id: user.id || '',
      role: user.role || 'staff'
    },
    deactivation_reason: staffMember.deactivation_reason || ''
  }

  showFormModal.value = true
}

function closeFormModal() {
  showFormModal.value = false
  currentStaff.value = null
}

async function submitForm() {
  loading.value = true

  try {
    const cleaned = {
      user: {
        full_name: form.value.user?.full_name?.trim() || null,
        id: form.value.user?.id || null,
        role: form.value.user?.role || 'staff'
      },
      deactivation_reason: form.value.deactivation_reason?.trim() || null
    }

    if (isEdit.value && currentStaff.value) {
      await update_deactivated_student(currentStaff.value.id, cleaned)
      toast.success("Reason updated!")
    }

    closeFormModal()
    fetchStaff()
  } catch (error) {

    toast.error("Failed to save changes.")
  } finally {
    loading.value = false
  }
}
</script>



<style scoped>
/* Ensure header actions wrap well on smaller screens */
@media (max-width: 576px) {
  .gap-2 { row-gap: 0.5rem; }
}
</style>

