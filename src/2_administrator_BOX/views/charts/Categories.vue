<template>
  <div class="category-crud">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div>
        <h4 class="mb-1">Categories</h4>
        <div class="text-medium-emphasis small">
          Manage categories and assign grade classes.
        </div>
      </div>

      <div class="d-flex gap-2">
        <CButton color="secondary" variant="outline" :disabled="loading" @click="fetchAll">
          <template v-if="loading">
            <CSpinner size="sm" class="me-2" />
            Refreshing...
          </template>
          <template v-else>
            Refresh
          </template>
        </CButton>

        <CButton class="text-white" color="primary" @click="openCreate">
          + New Category
        </CButton>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="card mb-3">
      <div class="card-body">
        <div class="row g-2 align-items-center">
          <div class="col-12 col-md-5">
            <CFormInput
              v-model="search"
              placeholder="Search category name or class name..."
            />
          </div>

          <div class="col-12 col-md-3">
            <CFormSelect v-model.number="pageSize">
              <option :value="5">5 per page</option>
              <option :value="10">10 per page</option>
              <option :value="20">20 per page</option>
              <option :value="50">50 per page</option>
            </CFormSelect>
          </div>

          <div class="col-12 col-md-4 text-md-end">
            <div class="small text-medium-emphasis">
              Showing <b>{{ paginated.length }}</b> of <b>{{ filtered.length }}</b> results
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="card">
      <div class="card-body">
        <div v-if="loading" class="py-4 d-flex align-items-center justify-content-center">
          <CSpinner class="me-2" />
          Loading categories...
        </div>

        <template v-else>
          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell style="width: 70px;">#</CTableHeaderCell>
                <CTableHeaderCell>Name</CTableHeaderCell>
                <CTableHeaderCell>Classes</CTableHeaderCell>
                <CTableHeaderCell style="width: 220px;" class="text-end">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              <CTableRow v-for="(row) in paginated" :key="row.id">
                <CTableDataCell>{{ row.id }}</CTableDataCell>

                <CTableDataCell class="fw-semibold text-capitalize">
                  {{ row.name }}
                </CTableDataCell>

                <CTableDataCell>
                  <div v-if="row.specific_classes?.length" class="d-flex flex-wrap gap-1">
                    <CBadge
                      v-for="c in row.specific_classes"
                      :key="c.id"
                      color="info"
                      class="text-white"
                    >
                      {{ c.name }}
                    </CBadge>
                  </div>
                  <div v-else class="text-medium-emphasis small">No classes assigned</div>
                </CTableDataCell>

                <CTableDataCell class="text-end">
                  <div class="d-inline-flex gap-2">
                    <CButton size="sm" color="primary" variant="outline" @click="openEdit(row)">
                      Edit
                    </CButton>

                    <CButton
                      size="sm"
                      color="danger"
                      variant="outline"
                      :disabled="deletingId === row.id"
                      @click="openDelete(row)"
                    >
                      <template v-if="deletingId === row.id">
                        <CSpinner size="sm" class="me-2" />
                        Deleting
                      </template>
                      <template v-else>Delete</template>
                    </CButton>
                  </div>
                </CTableDataCell>
              </CTableRow>

              <CTableRow v-if="!paginated.length">
                <CTableDataCell colspan="4" class="text-center py-4 text-medium-emphasis">
                  No categories found.
                </CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>

          <!-- Pagination -->
          <div class="d-flex justify-content-between align-items-center mt-3">
            <div class="small text-medium-emphasis">
              Page <b>{{ page }}</b> / <b>{{ totalPages }}</b>
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
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <CModal :visible="showForm" @close="closeForm" alignment="center">
      <CModalHeader>
        <CModalTitle>{{ isEdit ? "Edit Category" : "New Category" }}</CModalTitle>
      </CModalHeader>

      <CModalBody>
        <div class="mb-3">
          <label class="form-label">Category Name</label>
          <CFormInput v-model="form.name" placeholder="e.g. Primary" />
          <div class="small text-danger mt-1" v-if="errors.name">{{ errors.name }}</div>
        </div>


        <div v-if="classesLoading" class="py-3 d-flex align-items-center">
          <CSpinner size="sm" class="me-2" /> Loading classes...
        </div>


        <!-- note about update endpoint -->
        <div v-if="isEdit && !supportsCategoryRename" class="alert alert-warning mt-3 mb-0">
          Rename is disabled because your backend does not expose <b>PATCH /api/categories/{id}</b>.
          You can still reassign classes.
        </div>
      </CModalBody>

      <CModalFooter>
        <CButton color="secondary" variant="outline" :disabled="saving" @click="closeForm">
          Cancel
        </CButton>

        <CButton class="text-white" color="primary" :disabled="saving || (!supportsCategoryRename && isEdit)" @click="save">
          <template v-if="saving">
            <CSpinner size="sm" class="me-2" />
            Saving...
          </template>
          <template v-else>
            {{ isEdit ? "Save Changes" : "Create" }}
          </template>
        </CButton>
      </CModalFooter>
    </CModal>

    <!-- Delete Confirm Modal -->
    <CModal :visible="showDelete" @close="closeDelete" alignment="center">
      <CModalHeader>
        <CModalTitle>Delete Category</CModalTitle>
      </CModalHeader>

      <CModalBody>
        <div class="mb-2">
          Are you sure you want to delete:
          <b class="text-capitalize">{{ selected?.name }}</b>?
        </div>

        <div class="small text-medium-emphasis">
          If this category is assigned to classes, backend may block deletion.
        </div>
      </CModalBody>

      <CModalFooter>
        <CButton color="secondary" variant="outline" :disabled="deleting" @click="closeDelete">
          Cancel
        </CButton>
        <CButton color="danger" :disabled="deleting" @click="confirmDelete">
          <template v-if="deleting">
            <CSpinner size="sm" class="me-2" />
            Deleting...
          </template>
          <template v-else>Delete</template>
        </CButton>
      </CModalFooter>
    </CModal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'

import { getCategories_ktor, createCategory_ktor } from '@/services/api' // <-- your axios instance (with Bearer interceptor)

// CoreUI components assumed available globally or imported in main.
// If not globally registered, import them here.

const toast = useToast()

// ---- Feature toggle ----
// If your backend does NOT yet support renaming a category, set false.
const supportsCategoryRename = true

const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const deletingId = ref(null)

const categories = ref([])
const gradeClasses = ref([])
const classesLoading = ref(false)

const search = ref('')
const page = ref(1)
const pageSize = ref(10)

const showForm = ref(false)
const showDelete = ref(false)
const isEdit = ref(false)
const selected = ref(null)

const form = reactive({
  id: null,
  name: '',
  classIds: [],
})

const errors = reactive({
  name: null,
})

// ---------- API helpers ----------
async function fetchAll() {
  loading.value = true
  try {
    const { data } = await getCategories_ktor()

    categories.value = Array.isArray(data) ? data : []
  } catch (e) {
    toast.error(e?.response?.data?.error || 'Failed to load categories')
  } finally {
    loading.value = false
  }
}



async function createCategory(payload) {
  return createCategory_ktor(payload)
}

async function updateCategoryName(id, payload) {
  // Backend must support this (PATCH). Adjust to PUT if you used PUT.
  return api.patch(`/api/categories/${id}`, payload)
}

async function assignClassesToCategory(id, classIds) {
  return api.put(`/api/categories/${id}/classes`, { classIds })
}

async function deleteCategory(id) {
  return api.delete(`/api/categories/${id}`)
}

// ---------- UI handlers ----------
function resetForm() {
  form.id = null
  form.name = ''
  form.classIds = []
  errors.name = null
}

function openCreate() {
  isEdit.value = false
  selected.value = null
  resetForm()
  showForm.value = true

}

function openEdit(row) {
  isEdit.value = true
  selected.value = row
  resetForm()

  form.id = row.id
  form.name = row.name || ''
  form.classIds = (row.specific_classes || []).map(c => c.id)

  showForm.value = true

}

function closeForm() {
  if (saving.value) return
  showForm.value = false
}

function openDelete(row) {
  selected.value = row
  showDelete.value = true
}

function closeDelete() {
  if (deleting.value) return
  showDelete.value = false
}

function validate() {
  errors.name = null

  if (!form.name || !form.name.trim()) {
    errors.name = 'Name is required'
    return false
  }
  return true
}

// ---------- Save (Create / Edit) ----------
async function save() {
  if (!validate()) return

  saving.value = true
  try {
    if (!isEdit.value) {
      // 1) Create category
      const { data } = await createCategory_ktor({ name: form.name.trim() })

      // 2) Assign classes (optional)
      if (form.classIds.length) {
        await assignClassesToCategory(data.id, form.classIds)
      }

      toast.success('Category created')
    } else {
      // Edit
      const id = form.id

      // 1) Rename category if supported
      if (supportsCategoryRename) {
        await updateCategoryName(id, { name: form.name.trim() })
      }

      // 2) Assign classes (always)
      await assignClassesToCategory(id, form.classIds)

      toast.success('Category updated')
    }

    showForm.value = false
    await fetchAll()
  } catch (e) {
    toast.error(e?.response?.data?.error || 'Save failed')
  } finally {
    saving.value = false
  }
}

// ---------- Delete ----------
async function confirmDelete() {
  if (!selected.value) return
  const id = selected.value.id

  deleting.value = true
  deletingId.value = id

  try {
    await deleteCategory(id)
    toast.success('Category deleted')
    showDelete.value = false
    await fetchAll()
  } catch (e) {
    // backend may protect delete if classes are assigned
    toast.error(e?.response?.data?.error || 'Delete failed (maybe category is in use)')
  } finally {
    deleting.value = false
    deletingId.value = null
  }
}

// ---------- Filtering + pagination ----------
const filtered = computed(() => {
  const q = (search.value || '').trim().toLowerCase()
  if (!q) return categories.value

  return categories.value.filter(cat => {
    const nameHit = (cat.name || '').toLowerCase().includes(q)
    const classHit = (cat.specific_classes || []).some(c => (c.name || '').toLowerCase().includes(q))
    return nameHit || classHit
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

onMounted(async () => {
  await fetchAll()
  // preload classes for the modal

})
</script>

<style scoped>
.category-crud :deep(.table) {
  margin-bottom: 0;
}
</style>
