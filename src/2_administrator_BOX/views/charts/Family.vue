

<template>
  <CRow>
    <CCol :xs="12">
      <CCard class="mb-4">

        <!-- HEADER -->
        <CCardHeader>
          <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <strong>Families</strong>

            <div class="d-flex align-items-center gap-2 flex-wrap">
              <CFormInput
                v-model="searchTerm"
                placeholder="Search by family name..."
                size="sm"
                style="min-width: 260px;"
              />

              <CButton
                color="danger"
                size="sm"
                :disabled="selectedIds.length === 0"
                @click="showDeleteBulkModal = true"
              >
                Delete Selected ({{ selectedIds.length }})
              </CButton>

              <CButton color="primary" class="text-white"  size="sm" @click="openAddModal">
                Add Family
              </CButton>
            </div>
          </div>
        </CCardHeader>

        <!-- BODY -->
        <CCardBody>

          <!-- LOADER -->
          <div v-if="isLoading" class="d-flex align-items-center gap-2 mb-3">
            <CSpinner size="sm" />
            <span class="text-body-secondary small">Loading families…</span>
          </div>

          <!-- TABLE -->
          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell class="text-center" style="width:48px">
                  <CFormCheck
                    :checked="allSelected"
                    :indeterminate="someSelected"
                    @change="toggleSelectAll"
                  />
                </CTableHeaderCell>

                <CTableHeaderCell>#</CTableHeaderCell>
                <CTableHeaderCell>Name</CTableHeaderCell>
                <CTableHeaderCell>Members</CTableHeaderCell>
                <CTableHeaderCell class="text-end">Count</CTableHeaderCell>
                <CTableHeaderCell class="text-end">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              <CTableRow v-for="(family, idx) in families" :key="family.id">

                <CTableDataCell class="text-center">
                  <CFormCheck v-model="selectedIds" :value="family.id" />
                </CTableDataCell>

                <CTableDataCell>
                  {{ (currentPage - 1) * pageSize + idx + 1 }}
                </CTableDataCell>

                <CTableDataCell>{{ family.name }}</CTableDataCell>

                <CTableDataCell>
                  <span v-if="!family.members?.length">No members</span>
                  <span v-else>{{ previewMembers(family.members) }}</span>
                </CTableDataCell>

                <CTableDataCell class="text-end">
                  <CBadge color="info">
                    {{ family.members?.length || 0 }}
                  </CBadge>
                </CTableDataCell>

                <CTableDataCell class="text-end">
                  <CButtonGroup size="sm">
                    <CButton color="info" variant="outline" @click="openEditModal(family)">
                      Edit
                    </CButton>
                    <CButton color="danger" variant="outline" @click="openDeleteConfirm(family)">
                      Delete
                    </CButton>
                  </CButtonGroup>
                </CTableDataCell>

              </CTableRow>

              <!-- EMPTY -->
              <CTableRow v-if="!isLoading && families.length === 0">
                <CTableDataCell colspan="6" class="text-center">
                  No families found
                </CTableDataCell>
              </CTableRow>

            </CTableBody>
          </CTable>

          <!-- PAGINATION -->
          <div class="d-flex justify-content-between mt-3">
            <Pagination
              :current-page="currentPage"
              :total-pages="totalPages"
              @page-changed="changePage"
            />
            <div>{{ showingRange }}</div>
          </div>

        </CCardBody>
      </CCard>
    </CCol>
  </CRow>

  <!-- FORM MODAL -->
  <CModal :visible="showFormModal" @close="closeFormModal">
    <CModalHeader>
      <CModalTitle>{{ isEdit ? 'Edit Family' : 'Add Family' }}</CModalTitle>
    </CModalHeader>

    <CModalBody>
      <CFormInput
        v-model="form.name"
        label="Family Name"
        placeholder="Enter family name"
      />

      <div v-if="formValidationMessage" class="text-danger mt-2">
        {{ formValidationMessage }}
      </div>
    </CModalBody>

    <CModalFooter>
      <CButton @click="closeFormModal">Cancel</CButton>

      <CButton class="text-white" color="primary" @click="saveFamily">
        <CSpinner size="sm" v-if="isSubmitting" />
        {{ isEdit ? 'Update' : 'Create' }}
      </CButton>
    </CModalFooter>
  </CModal>

  <!-- DELETE -->
  <CModal :visible="showDeleteSingleModal" @close="closeDeleteSingleModal">
    <CModalHeader>
      <CModalTitle>Confirm Delete</CModalTitle>
    </CModalHeader>

    <CModalBody>
      Delete <strong>{{ deleteTarget?.name }}</strong>?
    </CModalBody>

    <CModalFooter>
      <CButton @click="closeDeleteSingleModal">Cancel</CButton>
      <CButton color="danger" @click="deleteSingle">Delete</CButton>
    </CModalFooter>
  </CModal>

  <!-- BULK DELETE -->
<CModal :visible="showDeleteBulkModal" @close="showDeleteBulkModal = false">
  <CModalHeader>
    <CModalTitle>
      Delete {{ selectedIds.length }} Families?
    </CModalTitle>
  </CModalHeader>

  <CModalBody>
    This action cannot be undone.
  </CModalBody>

  <CModalFooter>
    <CButton @click="showDeleteBulkModal = false" :disabled="isDeleting">
      Cancel
    </CButton>

    <CButton color="danger" @click="deleteBulk" :disabled="isDeleting">
      <CSpinner size="sm" v-if="isDeleting" />
      Delete All
    </CButton>
  </CModalFooter>
</CModal>


</template>


<script setup>
import { ref, computed, watch, onMounted, reactive } from 'vue'
import { useToast } from 'vue-toastification'
import Pagination from '@/Pagination.vue'

import {
  rawst_ktor,
  get_families_paginated,
  create_family_ktor,
  update_family_ktor,
  delete_family_ktor
} from '@/services/api'

const toast = useToast()
const pageSize = 10

// ── STATE ─────────────────────────────
const isLoading = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const errorMessage = ref('')
const showDeleteBulkModal = ref(false)
const families = ref([])
const students = ref([])

const searchTerm = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const totalCount = ref(0)

const selectedIds = ref([])

const showFormModal = ref(false)
const isEdit = ref(false)
const editingId = ref(null)

const form = reactive({
  name: ''
})


const previewMembers = (members = []) => {
  if (!members || members.length === 0) return ''

  const names = members
    .slice(0, 3)
    .map(m => m.name || '—')

  return names.join(', ') +
    (members.length > 3 ? ` +${members.length - 3} more` : '')
}

function changePage(page) {
  if (page < 1 || page > totalPages.value) return

  loadFamilies(page)


}


const formValidationMessage = ref('')

const showDeleteSingleModal = ref(false)
const deleteTarget = ref(null)

// ── CACHE ─────────────────────────────
const pageCache = reactive(new Map())

// ── COMPUTED ─────────────────────────
const showingRange = computed(() => {
  if (!totalCount.value) return 'Showing 0–0 of 0'
  const start = (currentPage.value - 1) * pageSize + 1
  const end = Math.min(start + families.value.length - 1, totalCount.value)
  return `Showing ${start}–${end} of ${totalCount.value}`
})

const allSelected = computed(() =>
  families.value.length > 0 &&
  families.value.every(f => selectedIds.value.includes(f.id))
)

// ── SEARCH ───────────────────────────
let timer = null
watch(searchTerm, () => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    currentPage.value = 1
    pageCache.clear()
    loadFamilies()
  }, 300)
})

// ── LOAD ─────────────────────────────
async function loadFamilies(page = currentPage.value, force = false) {
  const search = searchTerm.value.trim()
  const key = `${page}|${search}`

  if (!force && pageCache.has(key)) {
    const cached = pageCache.get(key)

    families.value = cached.data
    totalCount.value = cached.total
    totalPages.value = cached.totalPages
    currentPage.value = page   // ✅ important

    return
  }

  isLoading.value = true

  try {
    const res = await get_families_paginated(page, pageSize, search)
    const body = res.data || {}

    families.value = body.data || []
    totalCount.value = body.meta?.total || 0
    totalPages.value = body.meta?.totalPages || 1
    currentPage.value = page   // ✅ critical

    pageCache.set(key, {
      data: families.value,
      total: totalCount.value,
      totalPages: totalPages.value
    })

  } catch (err) {

    toast.error('Failed to load families')
  } finally {
    isLoading.value = false
  }
}


async function deleteBulk() {
  if (!selectedIds.value.length) return

  isDeleting.value = true

  try {
    await Promise.all(
      selectedIds.value.map(id => delete_family_ktor(id))
    )

    selectedIds.value = []

    pageCache.clear()
    await loadFamilies(currentPage.value, true)

    toast.success('Selected families deleted')

  } catch (err) {

    toast.error('Some deletions failed')
  } finally {
    isDeleting.value = false
    showDeleteBulkModal.value = false
  }
}

// ── FORM ─────────────────────────────
function openAddModal() {
  isEdit.value = false
  editingId.value = null
  form.name = ''
  showFormModal.value = true
}

function openEditModal(f) {
  isEdit.value = true
  editingId.value = f.id
  form.name = f.name
  showFormModal.value = true
}

function closeFormModal() {
  showFormModal.value = false
  form.name = ''
}

// ── SAVE ─────────────────────────────
async function saveFamily() {
  if (!form.name.trim()) {
    formValidationMessage.value = 'Name required'
    return
  }

  isSubmitting.value = true

  try {
    if (isEdit.value) {
      const res = await update_family_ktor(editingId.value, {
        name: form.name.trim()
      })

      const updated = res.data

      families.value = families.value.map(f =>
        f.id === updated.id ? updated : f
      )

      toast.success('Updated')
    } else {
      const res = await create_family_ktor({
        name: form.name.trim()
      })

      families.value.unshift(res.data)
      totalCount.value++

      toast.success('Created')
    }

    pageCache.clear()
    closeFormModal()   // ✅ ALWAYS CLOSE

  } catch (err) {

    toast.error('Save failed')
  } finally {
    isSubmitting.value = false
  }
}

// ── DELETE ───────────────────────────
function openDeleteConfirm(f) {
  deleteTarget.value = f
  showDeleteSingleModal.value = true
}

async function deleteSingle() {
  try {
    await delete_family_ktor(deleteTarget.value.id)

    pageCache.clear()   // ✅ IMPORTANT

    await loadFamilies(currentPage.value, true)

    toast.success('Deleted')

  } catch {
    toast.error('Delete failed')
  } finally {
    showDeleteSingleModal.value = false
  }
}

// ── SELECT ALL ───────────────────────
function toggleSelectAll() {
  selectedIds.value = allSelected.value ? [] : families.value.map(f => f.id)
}

// ── INIT ─────────────────────────────
onMounted(async () => {
  await loadFamilies()
})
</script>


<style scoped>
@media (max-width: 576px) {
  .gap-2 { row-gap: 0.5rem; }
}
</style>
