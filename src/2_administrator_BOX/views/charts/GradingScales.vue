<template>
  <div class="grades-page">

    <!-- ✅ Sea-blue Premium Header -->
    <div class="header-grad shadow-sm rounded p-3 mb-3 text-white">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 class="mb-1">Grading System</h5>
          <small class="opacity-75">
            Create grade bands (A, B, C...) and score ranges used in reports.
          </small>
        </div>

        <div class="d-flex gap-2 align-items-center flex-wrap w-100 w-md-auto justify-content-end">
          <CInputGroup size="sm" style="max-width: 340px; width: 100%;">
            <CInputGroupText class="bg-white border-0">
              <CIcon :icon="cilSearch" class="text-primary" />
            </CInputGroupText>
            <CFormInput
              v-model="search"
              placeholder="Search grade (e.g. A, Excellent)..."
              class="border-0"
              style="background: rgba(255,255,255,.92);"
            />
          </CInputGroup>

          <CButton
            style="background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.25); color: white;"
            size="sm"
            :disabled="loading"
            @click="fetchAll"
          >    <CIcon :icon="cilReload" class="me-1" />
            {{ loading ? 'Loading...' : 'Refresh' }}
          </CButton>

          <CButton color="dark" size="sm" @click="openCreate">
            <CIcon :icon="cilPlus" class="me-1" />
            Add Grade
          </CButton>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="py-5 d-flex align-items-center justify-content-center gap-2">
      <CSpinner size="sm" />
      <span class="text-medium-emphasis">Loading grades...</span>
    </div>

    <!-- Empty -->
    <div v-else-if="!filtered.length" class="py-5 text-center text-medium-emphasis">
      <div class="mb-2">
        <CIcon :icon="cilSearch" class="me-1" />
        No grades found.
      </div>
      <small>Create your first grade band (e.g. A: 80–100).</small>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Summary strip -->
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
        <div class="small text-medium-emphasis">
          Showing <b>{{ filtered.length }}</b> grade band(s)
        </div>

        <div class="small text-medium-emphasis">
          Sorted by <b>order</b> (ascending)
        </div>
      </div>

      <!-- Premium cards -->
      <div class="row g-3">
        <div class="col-md-6" v-for="g in paginated" :key="g.id">
          <CCard class="shadow-sm border-0 h-100">
            <CCardHeader class="bg-light d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <span class="grade-chip" :style="chipStyle(g.code)">
                  {{ g.code }}
                </span>
                <div class="d-flex flex-column">
                  <span class="fw-semibold">{{ g.label }}</span>
                  <small class="text-medium-emphasis">
                    Range: <b>{{ g.minScore }}</b> – <b>{{ g.maxScore }}</b> • Order: <b>{{ g.order }}</b>
                  </small>
                </div>
              </div>

              <div class="d-flex gap-2">
                <CButton size="sm" color="primary" variant="outline" @click="openEdit(g)">
                  <CIcon :icon="cilPencil" class="me-1" />
                  Edit
                </CButton>

                <CButton size="sm" color="danger" variant="outline" @click="openDelete(g)">
                  <CIcon :icon="cilTrash" class="me-1" />
                  Delete
                </CButton>
              </div>
            </CCardHeader>

            <CCardBody>
              <!-- Range Bar -->
              <div class="mb-2 small text-medium-emphasis">
                Score band visual (0–100)
              </div>

              <div class="range-track">
                <div
                  class="range-fill"
                  :style="rangeStyle(g.minScore, g.maxScore, g.code)"
                ></div>
              </div>

              <div class="d-flex justify-content-between small text-medium-emphasis mt-2">
                <span>0</span>
                <span>100</span>
              </div>
            </CCardBody>
          </CCard>
        </div>
      </div>

      <!-- Pagination -->
      <div class="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
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

    <!-- ===================== -->
    <!-- ✅ Create/Edit Modal -->
    <!-- ===================== -->
    <CModal v-model:visible="showForm" alignment="center" backdrop="static" :keyboard="false" size="lg">
      <CModalHeader :close-button="false" class="text-white border-0 header-grad">
        <div class="d-flex align-items-center gap-2">
          <div class="icon-bubble">
            <CIcon :icon="isEdit ? cilPencil : cilPlus" class="text-white" />
          </div>
          <div>
            <CModalTitle class="mb-0">{{ isEdit ? 'Edit Grade Band' : 'Create Grade Band' }}</CModalTitle>
            <small class="opacity-75">Define code, meaning, and score range</small>
          </div>
        </div>
      </CModalHeader>

      <CModalBody class="pt-4">
        <div class="p-3 rounded form-surface">
          <div class="row g-3">
            <div class="col-12 col-md-3">
              <CFormLabel class="fw-semibold">Code</CFormLabel>
              <CFormInput
                v-model="form.code"
                maxlength="1"
                placeholder="A"
                :invalid="!!errors.code"
              />
              <div v-if="errors.code" class="small text-danger mt-1">{{ errors.code }}</div>
              <small class="text-medium-emphasis">Single letter (A–E)</small>
            </div>

            <div class="col-12 col-md-5">
              <CFormLabel class="fw-semibold">Label</CFormLabel>
              <CFormInput
                v-model="form.label"
                placeholder="Excellent"
                :invalid="!!errors.label"
              />
              <div v-if="errors.label" class="small text-danger mt-1">{{ errors.label }}</div>
              <small class="text-medium-emphasis">Meaning shown on reports</small>
            </div>

            <div class="col-12 col-md-4">
              <CFormLabel class="fw-semibold">Order</CFormLabel>
              <CFormInput
                v-model="form.order"
                type="number"
                min="1"
                placeholder="1"
                :invalid="!!errors.order"
              />
              <div v-if="errors.order" class="small text-danger mt-1">{{ errors.order }}</div>
              <small class="text-medium-emphasis">Used for ranking (1 = highest)</small>
            </div>

            <div class="col-12 col-md-6">
              <CFormLabel class="fw-semibold">Min Score</CFormLabel>
              <CFormInput
                v-model="form.minScore"
                type="number"
                min="0"
                max="100"
                placeholder="80"
                :invalid="!!errors.minScore"
              />
              <div v-if="errors.minScore" class="small text-danger mt-1">{{ errors.minScore }}</div>
            </div>

            <div class="col-12 col-md-6">
              <CFormLabel class="fw-semibold">Max Score</CFormLabel>
              <CFormInput
                v-model="form.maxScore"
                type="number"
                min="0"
                max="100"
                placeholder="100"
                :invalid="!!errors.maxScore"
              />
              <div v-if="errors.maxScore" class="small text-danger mt-1">{{ errors.maxScore }}</div>
            </div>
          </div>

          <!-- Preview -->
          <div class="mt-3">
            <div class="small text-uppercase text-muted fw-semibold mb-2">Preview</div>
            <div class="d-flex align-items-center flex-wrap gap-2">
              <span class="grade-chip" :style="chipStyle(form.code || '?')">
                {{ (form.code || '?').toUpperCase() }}
              </span>
              <span class="fw-semibold">{{ form.label || 'Grade Label' }}</span>
              <span class="text-muted">•</span>
              <span class="text-medium-emphasis">
                {{ safeNum(form.minScore) }} – {{ safeNum(form.maxScore) }}
              </span>
            </div>

            <div v-if="errors.range" class="alert alert-warning small mt-3 mb-0">
              {{ errors.range }}
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
            style="background: linear-gradient(90deg, #0ea5e9, #0369a1); border:none;"
            @click="submitForm"
          >
            <template v-if="saving">
              <CSpinner size="sm" class="me-2" />
              Saving...
            </template>
            <template v-else>
              <CIcon :icon="cilSave" class="me-2" />
              {{ isEdit ? 'Update Grade' : 'Create Grade' }}
            </template>
          </CButton>
        </div>
      </CModalFooter>
    </CModal>

    <!-- ===================== -->
    <!-- ✅ Delete Modal -->
    <!-- ===================== -->
    <CModal v-model:visible="showDelete" alignment="center" backdrop="static" :keyboard="false">
      <CModalHeader :close-button="false" class="text-white border-0 header-grad">
        <div class="d-flex align-items-center gap-2">
          <div class="icon-bubble">
            <CIcon :icon="cilTrash" class="text-white" />
          </div>
          <div>
            <CModalTitle class="mb-0">Delete Grade</CModalTitle>
            <small class="opacity-75">This action cannot be undone</small>
          </div>
        </div>
      </CModalHeader>

      <CModalBody class="pt-4">
        <div class="p-3 rounded form-surface">
          <div class="fw-semibold mb-1">
            Delete grade:
            <span class="grade-chip me-2" :style="chipStyle(toDelete?.code || '?')">
              {{ (toDelete?.code || '?').toUpperCase() }}
            </span>
            <span>“{{ toDelete?.label }}”</span> ?
          </div>
          <div class="small text-medium-emphasis">
            Range: <b>{{ toDelete?.minScore }}</b> – <b>{{ toDelete?.maxScore }}</b> • Order: <b>{{ toDelete?.order }}</b>
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

  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import {get_grading_system_ktor, create_grading_system_ktor, update_grading_system_ktor, delete_grading_system_ktor} from '@/services/api.js'

import {
  cilReload,
  cilSearch,
  cilPlus,
  cilPencil,
  cilTrash,
  cilSave
} from '@coreui/icons'

const toast = useToast()

const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)

const grades = ref([])
const search = ref('')
const page = ref(1)
const pageSize = ref(10)

const showForm = ref(false)
const isEdit = ref(false)

const showDelete = ref(false)
const toDelete = ref(null)

const form = ref({
  id: null,
  code: '',
  label: '',
  minScore: '',
  maxScore: '',
  order: ''
})

const errors = ref({
  code: '',
  label: '',
  minScore: '',
  maxScore: '',
  order: '',
  range: ''
})

function safeNum(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function chipStyle(code) {
  const c = String(code || '').toUpperCase()

  const map = {
    A: 'linear-gradient(90deg,#22c55e,#16a34a)', // green
    B: 'linear-gradient(90deg,#0ea5e9,#0369a1)', // sea blue
    C: 'linear-gradient(90deg,#f59e0b,#b45309)', // amber
    D: 'linear-gradient(90deg,#a78bfa,#6d28d9)', // purple
    E: 'linear-gradient(90deg,#f43f5e,#be123c)'  // rose
  }

  return {
    background: map[c] || 'linear-gradient(90deg,#94a3b8,#475569)',
    color: '#fff'
  }
}

function rangeStyle(minScore, maxScore, code) {
  const min = Math.max(0, Math.min(100, Number(minScore)))
  const max = Math.max(0, Math.min(100, Number(maxScore)))
  const left = Math.min(min, max)
  const width = Math.abs(max - min)

  const bg = chipStyle(code).background

  return {
    left: `${left}%`,
    width: `${width}%`,
    background: bg
  }
}

async function fetchAll() {
  loading.value = true
  try {
    const { data } = await get_grading_system_ktor()
    grades.value = Array.isArray(data) ? data : []
  } catch (e) {
    toast.error(e?.response?.data?.error || 'Failed to load grades', { position: 'top-right' })
  } finally {
    loading.value = false
  }
}

const filtered = computed(() => {
  const q = (search.value || '').trim().toLowerCase()
  const list = grades.value.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  if (!q) return list

  return list.filter(g => {
    const a = (g.code || '').toLowerCase()
    const b = (g.label || '').toLowerCase()
    return a.includes(q) || b.includes(q)
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))

const paginated = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

watch([search, pageSize], () => { page.value = 1 })
watch(totalPages, () => { if (page.value > totalPages.value) page.value = totalPages.value })

function resetForm() {
  form.value = { id: null, code: '', label: '', minScore: '', maxScore: '', order: '' }
  errors.value = { code: '', label: '', minScore: '', maxScore: '', order: '', range: '' }
}

function openCreate() {
  isEdit.value = false
  resetForm()
  showForm.value = true
}

function openEdit(g) {
  isEdit.value = true
  errors.value = { code: '', label: '', minScore: '', maxScore: '', order: '', range: '' }
  form.value = {
    id: g.id,
    code: g.code || '',
    label: g.label || '',
    minScore: String(g.minScore ?? ''),
    maxScore: String(g.maxScore ?? ''),
    order: String(g.order ?? '')
  }
  showForm.value = true
}

function closeForm() {
  if (saving.value) return
  showForm.value = false
}

function validateForm() {
  errors.value = { code: '', label: '', minScore: '', maxScore: '', order: '', range: '' }

  const code = (form.value.code || '').trim().toUpperCase()
  const label = (form.value.label || '').trim()

  const min = Number(form.value.minScore)
  const max = Number(form.value.maxScore)
  const order = Number(form.value.order)

  if (!code) errors.value.code = 'Code is required'
  else if (code.length !== 1) errors.value.code = 'Code must be a single character'
  form.value.code = code

  if (!label) errors.value.label = 'Label is required'

  if (!Number.isFinite(order) || order < 1) errors.value.order = 'Order must be 1 or higher'

  if (!Number.isFinite(min) || min < 0 || min > 100) errors.value.minScore = 'Min score must be between 0 and 100'
  if (!Number.isFinite(max) || max < 0 || max > 100) errors.value.maxScore = 'Max score must be between 0 and 100'

  if (Number.isFinite(min) && Number.isFinite(max) && min > max) {
    errors.value.range = 'Min score cannot be greater than Max score'
  }

  // Optional local overlap warning (doesn't block)
  // (You can enforce overlap rules in backend if needed.)

  return !errors.value.code && !errors.value.label && !errors.value.minScore &&
         !errors.value.maxScore && !errors.value.order && !errors.value.range
}

async function submitForm() {
  if (!validateForm()) return

  saving.value = true
  try {
    const payload = {
      code: form.value.code.trim().toUpperCase(),
      label: form.value.label.trim(),
      minScore: Number(form.value.minScore),
      maxScore: Number(form.value.maxScore),
      order: Number(form.value.order)
    }

    if (!isEdit.value) {
      const { data } = await create_grading_system_ktor(payload)
      grades.value.unshift(data)
      toast.success('Grade created!', { position: 'top-right' })
    } else {
      const { data } = await update_grading_system_ktor(form.value.id, payload)
      const idx = grades.value.findIndex(x => x.id === form.value.id)
      if (idx !== -1) grades.value[idx] = data
      toast.success('Grade updated!', { position: 'top-right' })
    }

    showForm.value = false
  } catch (e) {
    toast.error(e?.response?.data?.error || 'Save failed', { position: 'top-right' })
  } finally {
    saving.value = false
  }
}

function openDelete(g) {
  toDelete.value = g
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
    await delete_grading_system_ktor(toDelete.value.id)
    grades.value = grades.value.filter(x => x.id !== toDelete.value.id)
    toast.success('Grade deleted!', { position: 'top-right' })
    showForm.value = false
  } catch (e) {
    toast.error(e?.response?.data?.error || 'Delete failed', { position: 'top-right' })
  } finally {
    deleting.value = false
  }
}

onMounted(fetchAll)
</script>

<style scoped>
.grades-page { padding-bottom: 1rem; }

.header-grad {
  background: linear-gradient(90deg, #0ea5e9, #0369a1);
  border: 1px solid rgba(255,255,255,0.18);
}

.icon-bubble{
  width: 36px; height: 36px;
  border-radius: 999px;
  display:flex; align-items:center; justify-content:center;
  background: rgba(255,255,255,0.18);
}

.form-surface{
  background:#f7fbff;
  border: 1px solid rgba(3,105,161,.15);
}

.grade-chip{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  width: 42px;
  height: 32px;
  border-radius: 10px;
  font-weight: 900;
  letter-spacing: .5px;
  box-shadow: 0 6px 14px rgba(0,0,0,0.06);
}

.range-track{
  width: 100%;
  height: 12px;
  border-radius: 999px;
  background: #eaf2ff;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(2,132,199,0.15);
}

.range-fill{
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 999px;
}
</style>
