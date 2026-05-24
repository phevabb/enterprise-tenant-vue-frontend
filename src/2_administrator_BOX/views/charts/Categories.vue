
<template>
  <div class="category-crud">

    <!-- ✅ Sea-blue Premium Header -->
    <div
      class="p-3 mb-3 rounded text-white shadow-sm"
      style="background: linear-gradient(90deg, #0ea5e9, #0369a1);"
    >
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 class="mb-1">Categories Overview</h5>
          <small class="opacity-75">Classes and Subjects grouped together</small>
        </div>

        <div class="d-flex gap-2">


          <CButton class="text-white" color="dark" size="sm" @click="openCreate">
            <CIcon :icon="cilPlus" class="me-1" />
            Add Category
          </CButton>
        </div>
      </div>
    </div>

    <!-- ✅ Search -->
    <div class="mb-3">
      <CFormInput v-model="search" placeholder="Search category, class, or subject..." />
    </div>

    <!-- ✅ Loading state -->
    <div v-if="loading" class="py-5 d-flex align-items-center justify-content-center gap-2">
      <CSpinner size="sm" />
      <span class="text-medium-emphasis">Loading categories...</span>
    </div>

    <!-- ✅ Content -->
    <template v-else>

      <!-- ✅ Empty state -->
      <div v-if="!filtered.length" class="py-5 text-center text-medium-emphasis">
        <div class="mb-2">
          <CIcon :icon="cilSearch" class="me-1" />
          No categories found.
        </div>
        <small>Try a different keyword or create a new category.</small>
      </div>

      <!-- ✅ Cards -->
      <div v-else class="row g-3">
        <div class="col-md-6" v-for="cat in paginated" :key="cat.id">
          <CCard class="shadow-sm border-0 h-100">

            <!-- Card Header -->
            <CCardHeader class="bg-light d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center gap-2">
                <span class="fw-semibold text-capitalize">{{ cat.name }}</span>
                <CBadge color="info" class="text-white">
                  {{ (cat.specific_classes || []).length }} classes
                </CBadge>
                <CBadge color="success">
                  {{ (cat.subjects || []).length }} subjects
                </CBadge>
              </div>

              <div class="d-flex gap-2">
                <CButton size="sm" color="primary" variant="outline" @click="openEdit(cat)">
                  <CIcon :icon="cilPencil" class="me-1" />
                  Edit
                </CButton>

                <CButton size="sm" color="danger" variant="outline" @click="openDeleteModal(cat)">
                  <CIcon :icon="cilTrash" class="me-1" />
                  Delete
                </CButton>
              </div>
            </CCardHeader>

            <CCardBody>

              <!-- Classes -->
              <div class="mb-3">
                <div class="fw-semibold small text-muted mb-1">CLASSES</div>

                <div v-if="(cat.specific_classes || []).length" class="d-flex flex-wrap gap-1">
                  <CBadge
                    v-for="cls in cat.specific_classes"
                    :key="cls.id"
                    color="primary"
                    class="text-white"
                  >
                    {{ cls.name }}
                  </CBadge>
                </div>

                <div v-else class="text-muted small">No classes</div>
              </div>

              <!-- Subjects -->
              <div>
                <div class="fw-semibold small text-muted mb-1">SUBJECTS</div>

                <div v-if="(cat.subjects || []).length" class="d-flex flex-wrap gap-1">
                  <CBadge
                    v-for="sub in cat.subjects"
                    :key="sub.id"
                    color="success"
                  >
                    {{ sub.name }}
                  </CBadge>
                </div>

                <div v-else class="text-muted small">No subjects</div>
              </div>

            </CCardBody>
          </CCard>
        </div>
      </div>

      <!-- ✅ Pagination -->
      <div v-if="filtered.length" class="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
        <div class="small text-medium-emphasis">
          Page <b>{{ page }}</b> / <b>{{ totalPages }}</b>
          &nbsp;•&nbsp; Total: <b>{{ filtered.length }}</b>
        </div>

        <div class="d-flex gap-2">
          <CButton size="sm" color="secondary" variant="outline" :disabled="page <= 1" @click="page--">
            Prev
          </CButton>
          <CButton size="sm" color="secondary" variant="outline" :disabled="page >= totalPages" @click="page++">
            Next
          </CButton>
        </div>
      </div>

    </template>

    <!-- ===================== -->
    <!-- ✅ Create/Edit Modal -->
    <!-- ===================== -->
    <CModal
      v-model:visible="showForm"
      alignment="center"
      backdrop="static"
      :keyboard="false"
      size="lg"
    >
      <CModalHeader
      :close-button="false"
        class="text-white border-0"
        style="background: linear-gradient(90deg, #0ea5e9, #0369a1);"
      >
        <div class="d-flex align-items-center gap-2">
          <div
            class="d-inline-flex align-items-center justify-content-center rounded-circle"
            style="width: 36px; height: 36px; background: rgba(255,255,255,0.18);"
          >
            <CIcon :icon="isEdit ? cilPencil : cilPlus" class="text-white" />
          </div>

          <div class="d-flex flex-column">
            <CModalTitle class="mb-0">
              {{ isEdit ? 'Edit Category' : 'Create Category' }}
            </CModalTitle>
            <small class="opacity-75">
              {{ isEdit ? 'Update category name' : 'Add a new category for classes & subjects' }}
            </small>
          </div>
        </div>

        <CButton
          color="light"
          variant="ghost"
          class="text-white"
          :disabled="saving"
          style="opacity: .9;"

          @click="closeForm"
        >

        </CButton>
      </CModalHeader>

      <CModalBody class="pt-4">
        <div class="p-3 rounded" style="background:#f7fbff; border: 1px solid rgba(3,105,161,.15);">
          <div class="mb-3">
            <CFormLabel class="fw-semibold">Category Name</CFormLabel>

            <CInputGroup>
              <CInputGroupText style="background: #ffffff;">
                <CIcon icon="cil-tag" class="text-primary" />
              </CInputGroupText>

              <CFormInput
                v-model="form.name"
                placeholder="e.g. Primary, KG, Nursery"
                :invalid="!!errors.name"
                @keyup.enter="save"
                autocomplete="off"
                style="background:#ffffff;"
              />
            </CInputGroup>

            <div v-if="errors.name" class="small text-danger mt-1">
              {{ errors.name }}
            </div>

            <div class="small text-medium-emphasis mt-1">
              Tip: keep names short and consistent (e.g. <b>primary</b>, <b>kg</b>, <b>jhs</b>).
            </div>
          </div>

          <div class="mt-3">
            <div class="small text-uppercase text-muted fw-semibold mb-2">Preview</div>

            <div class="d-flex flex-wrap align-items-center gap-2">
              <CBadge
                class="text-white px-3 py-2"
                style="background: linear-gradient(90deg, #0ea5e9, #0369a1); border: none;"
              >
                <CIcon icon="cil-layers" class="me-1" />
                {{ form.name && form.name.trim() ? form.name.trim() : 'Category Name' }}
              </CBadge>

              <span class="small text-muted">
                This category will group <b>classes</b> and <b>subjects</b>.
              </span>
            </div>
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
            @click="save"
            style="background: linear-gradient(90deg, #0ea5e9, #0369a1); border: none;"
          >
            <template v-if="saving">
              <CSpinner size="sm" class="me-2" />
              Saving...
            </template>
            <template v-else>
              <CIcon :icon="isEdit ? cilSave : cilCheck" class="me-2" />
              {{ isEdit ? 'Save Changes' : 'Create Category' }}
            </template>
          </CButton>
        </div>
      </CModalFooter>
    </CModal>

    <!-- ===================== -->
    <!-- ✅ Delete Modal -->
    <!-- ===================== -->
    <CModal
      v-model:visible="showDeleteModal"
      alignment="center"
      backdrop="static"
      :keyboard="false"
    >
      <CModalHeader
      :close-button="false"
        class="text-white border-0"
        style="background: linear-gradient(90deg, #0ea5e9, #0369a1);"
      >
        <div class="d-flex align-items-center gap-2">
          <div
            class="d-inline-flex align-items-center justify-content-center rounded-circle"
            style="width: 36px; height: 36px; background: rgba(255,255,255,0.18);"
          >

          </div>

          <div>
            <CModalTitle class="mb-0">Delete Category</CModalTitle>
            <small class="opacity-75">This action cannot be undone</small>
          </div>
        </div>


      </CModalHeader>

      <CModalBody class="pt-4">
        <div class="p-3 rounded" style="background:#f7fbff; border: 1px solid rgba(3,105,161,.15);">
          <div class="d-flex gap-3 align-items-start">
            <div
              class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
              style="width: 44px; height: 44px; background: rgba(220, 53, 69, 0.12);"
            >
              <CIcon :icon="cilWarning" class="text-danger" />
            </div>

            <div class="flex-grow-1">
              <div class="fw-semibold mb-1">
                Are you sure you want to delete
                <span class="text-capitalize">“{{ categoryToDelete?.name }}”</span>?
              </div>
            </div>
          </div>

          <!-- ✅ Only show warning/lock if it has children -->
<div v-if="hasChildren" class="alert alert-warning small mt-3 mb-0">
  <CIcon :icon="cilLockLocked" class="me-1" />
  {{ deleteMessage }}
</div>

<!-- ✅ If empty (0/0), show friendly info (no lock) -->
<div v-else class="alert alert-info small mt-3 mb-0">
  <CIcon :icon="cilCheckCircle" class="me-1" />
  {{ deleteMessage }}
</div>



        </div>
      </CModalBody>

      <CModalFooter class="border-0 pt-0">
        <div class="w-100 d-flex justify-content-end gap-2">
          <CButton color="secondary" variant="outline" :disabled="deleting" @click="closeDeleteModal">
            Cancel
          </CButton>

          <CButton color="danger" class="text-white" :disabled="deleting || !categoryToDelete" @click="confirmDeleteCategory">
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




  </div>
</template>




<script setup>


import { cilLockLocked, cilLockUnlocked, cilCheckCircle, cilInfo, cilPencil, cilSave, cilCheck, cilWarning, cilTrash, cilPlus, cilCreditCard, cilSearch, cilLibrary, cilSchool, cilCalendar, cilAddressBook, cilPeople, cilList, cilSpreadsheet, cilCalculator, cilMoney } from '@coreui/icons'


import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'

// ✅ IMPORTANT: import NAMED exports (not default)
import {
  getCategories_ktor,
  createCategory_ktor,
  updateCategory_ktor,
  deleteCategory_ktor
} from '@/services/api.js'



const classCount = computed(() => (categoryToDelete.value?.specific_classes || []).length)
const subjectCount = computed(() => (categoryToDelete.value?.subjects || []).length)
const hasChildren = computed(() => classCount.value > 0 || subjectCount.value > 0)

const deleteMessage = computed(() => {
  if (!categoryToDelete.value) return ''

  if (hasChildren.value) {
    const parts = []
    if (classCount.value) parts.push(`${classCount.value} class${classCount.value === 1 ? '' : 'es'}`)
    if (subjectCount.value) parts.push(`${subjectCount.value} subject${subjectCount.value === 1 ? '' : 's'}`)
    return `This category can’t be deleted because it still has ${parts.join(' and ')}. Move them to another category first.`
  }

  return 'This category is empty. You can delete it safely.'
})

const toast = useToast()

/** UI State */
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)

const categories = ref([])

const search = ref('')
const page = ref(1)
const pageSize = ref(10)

/** Create/Edit Modal */
const showForm = ref(false)
const isEdit = ref(false)

const form = reactive({
  id: null,
  name: ''
})

const errors = reactive({
  name: null
})

/** Delete Modal */
const showDeleteModal = ref(false)
const categoryToDelete = ref(null)

/** ---------- Fetch ---------- */
async function fetchAll() {
  loading.value = true
  try {
    const { data } = await getCategories_ktor()
    categories.value = Array.isArray(data) ? data : []
  } catch (e) {
    toast.error(e?.response?.data?.error || 'Failed to load categories', { position: 'top-right' })
  } finally {
    loading.value = false
  }
}

/** ---------- Helpers ---------- */
function resetForm() {
  form.id = null
  form.name = ''
  errors.name = null
}

function validate() {
  errors.name = null

  if (!form.name || !form.name.trim()) {
    errors.name = 'Name is required'
    return false
  }
  if (form.name.trim().length < 2) {
    errors.name = 'Name is too short'
    return false
  }
  return true
}

/** ---------- Create / Edit ---------- */
function openCreate() {
  isEdit.value = false
  resetForm()
  showForm.value = true
}

const deleteBlockMessage = computed(() => {
  const c = (categoryToDelete.value?.specific_classes || []).length
  const s = (categoryToDelete.value?.subjects || []).length

  // If it has children, explain clearly with counts
  if (c > 0 || s > 0) {
    const parts = []
    if (c > 0) parts.push(`${c} class${c === 1 ? '' : 'es'}`)
    if (s > 0) parts.push(`${s} subject${s === 1 ? '' : 's'}`)

    return `This category can’t be deleted because it still has ${parts.join(' and ')}. Move them to another category, then try again.`
  }

  // If it shows 0/0 but deletion is blocked (409), show neutral message
  return ` `
})

function openEdit(row) {
  isEdit.value = true
  resetForm()
  form.id = row.id
  form.name = row.name || ''
  showForm.value = true
}

function closeForm() {
  if (saving.value) return
  showForm.value = false
}

/** Save (Create or Update) */
async function save() {
  if (!validate()) return

  saving.value = true
  try {
    const payload = { name: form.name.trim() }

    if (!isEdit.value) {
      await createCategory_ktor(payload)
      toast.success('Category created successfully!', { position: 'top-right' })
    } else {
      await updateCategory_ktor(form.id, payload)
      toast.success('Category updated successfully!', { position: 'top-right' })
    }

    showForm.value = false
    await fetchAll()

  } catch (e) {
    toast.error(e?.response?.data?.error || 'Save failed', { position: 'top-right' })
  } finally {
    saving.value = false
  }
}

/** ---------- Delete ---------- */
function openDeleteModal(row) {
  categoryToDelete.value = row
  showDeleteModal.value = true
}

function closeDeleteModal(force = false) {
  if (deleting.value && !force) return
  showDeleteModal.value = false
  categoryToDelete.value = null
}

async function confirmDeleteCategory() {
  if (!categoryToDelete.value) return

  deleting.value = true

  try {
    const { id, name } = categoryToDelete.value

    await deleteCategory_ktor(id)

    toast.success(`Deleted "${name}" successfully!`, { position: 'top-right' })

    // ✅ ensure UI unlocks before closing
    deleting.value = false
    closeDeleteModal(true)

    await fetchAll()

  } catch (e) {
    const status = e?.response?.status

    if (status === 409) {
      // ✅ Premium: explain exactly why
      toast.warning(
        `Cannot delete "${categoryToDelete.value?.name}". It is linked to classes or subjects. Remove/move them first.`,
        { position: 'top-right' }
      )
    } else {
      toast.error(e?.response?.data?.error || 'Delete failed', { position: 'top-right' })
    }

  } finally {
    deleting.value = false
  }
}

/** ---------- Filtering & Pagination ---------- */
const filtered = computed(() => {
  const q = (search.value || '').trim().toLowerCase()
  if (!q) return categories.value

  return categories.value.filter(cat => {
    const nameHit = (cat.name || '').toLowerCase().includes(q)

    const classHit = (cat.specific_classes || []).some(c =>
      (c.name || '').toLowerCase().includes(q)
    )

    const subjectHit = (cat.subjects || []).some(s =>
      (s.name || '').toLowerCase().includes(q)
    )

    return nameHit || classHit || subjectHit
  })
})

const totalPages = computed(() => {
  const total = filtered.value.length
  return Math.max(1, Math.ceil(total / pageSize.value))
})

const paginated = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

watch([search, pageSize], () => {
  page.value = 1
})

watch(totalPages, () => {
  if (page.value > totalPages.value) page.value = totalPages.value
})

/** ---------- Init ---------- */
onMounted(async () => {
  await fetchAll()
})

/** Expose to template */
defineExpose({
  // modal controls
  openCreate,
  openEdit,
  closeForm,
  save,

  openDeleteModal,
  closeDeleteModal,
  confirmDeleteCategory,

  // lists
  fetchAll,
  categories,
  filtered,
  paginated,
  totalPages,

  // ui state
  loading,
  saving,
  deleting,
  showForm,
  showDeleteModal,

  // forms
  form,
  errors,

  search,
  page,
  pageSize,
  isEdit,
  categoryToDelete
})
</script>


<style scoped>
.category-crud :deep(.table) {
  margin-bottom: 0;
}
</style>
