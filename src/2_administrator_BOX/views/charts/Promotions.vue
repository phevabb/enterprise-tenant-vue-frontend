
<template>
  <div class="promotion-page">

    <!-- Sea-blue header -->
    <div class="header-grad shadow-sm rounded p-3 mb-3 text-white">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">

        <!-- Left title -->
        <div>
          <h5 class="mb-1">Promotion Paths</h5>
          <small class="opacity-75">
            Create, update, and visualize how learners move to the next class.
          </small>
        </div>

        <!-- Right controls -->
        <div class="d-flex gap-2 align-items-center flex-wrap w-100 w-md-auto justify-content-end">

          <CInputGroup
            size="sm"
            class="flex-grow-1 flex-md-grow-0"
            style="max-width: 360px; width: 100%;"
          >
            <CInputGroupText class="bg-white border-0">
              <CIcon :icon="cilSearch" class="text-primary" />
            </CInputGroupText>

            <CFormInput
              v-model="search"
              placeholder="Search class (e.g. kg 1, class 4)..."
              class="border-0"
              style="background: rgba(255,255,255,.92);"
            />
          </CInputGroup>

          <CButton style="background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.25);" color="yellow" size="sm" :disabled="loading" @click="refreshAll">
            <CIcon :icon="cilReload" class="me-1" />
            {{ loading ? 'Loading...' : 'Refresh' }}
          </CButton>

          <CButton
            size="sm"
            class="text-white"
            style="background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.25);"
            @click="toggleView"
          >
            <CIcon :icon="cilSwapHorizontal" class="me-1" />
            {{ viewMode === 'flow' ? 'Card View' : 'Flow View' }}
          </CButton>

          <CButton color="dark" size="sm" @click="openCreate">
            <CIcon :icon="cilPlus" class="me-1" />
            Add Path
          </CButton>

        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="py-5 d-flex align-items-center justify-content-center gap-2">
      <CSpinner size="sm" />
      <span class="text-medium-emphasis">Fetching promotion paths...</span>
    </div>

    <!-- Empty -->
    <div v-else-if="!filtered.length" class="py-5 text-center text-medium-emphasis">
      <div class="mb-2">
        <CIcon :icon="cilSearch" class="me-1" />
        No promotion paths found.
      </div>
      <small>Try a different keyword or create a new promotion rule.</small>
    </div>

    <!-- FLOW VIEW -->
    <div v-else-if="viewMode === 'flow'">
      <div class="mb-2 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div class="small text-medium-emphasis">
          Showing <b>{{ filtered.length }}</b> rules • Chains: <b>{{ chains.length }}</b>
        </div>

        <div class="legend d-flex flex-wrap gap-2">
          <span class="legend-pill creche">Creche</span>
          <span class="legend-pill nursery">Nursery</span>
          <span class="legend-pill kg">KG</span>
          <span class="legend-pill primary">Primary</span>
          <span class="legend-pill jhs">JHS</span>
          <span class="legend-pill other">Other</span>
        </div>
      </div>

      <div class="flow-wrap">
        <div v-for="(chain, idx) in chains" :key="idx" class="flow-chain shadow-sm">
          <div class="chain-header">
            <div class="fw-semibold">Chain {{ idx + 1 }}</div>
            <div class="small text-medium-emphasis">
              {{ chain.length }} stage{{ chain.length === 1 ? '' : 's' }}
            </div>
          </div>

          <div class="chain-row">
            <div
              v-for="(node, nIdx) in chain"
              :key="node.id + '-' + nIdx"
              class="node"
              :class="levelClass(node.name)"
              :title="node.name"
            >
              <div class="node-top">
                <div class="node-name text-capitalize">{{ node.name }}</div>
                <div class="node-id">#{{ node.id }}</div>
              </div>

              <div v-if="nIdx !== chain.length - 1" class="arrow" aria-hidden="true">
                <span class="arrow-line"></span>
                <span class="arrow-head"></span>
              </div>
            </div>
          </div>

          <div class="chain-footer">
            <span class="small text-medium-emphasis">Path:</span>
            <span class="ms-2 fw-semibold text-capitalize">
              {{ chain.map(s => s.name).join(' → ') }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- CARD VIEW (CRUD) -->
    <div v-else class="row g-3">
      <div class="col-md-6" v-for="p in filtered" :key="p.id">
        <CCard class="shadow-sm border-0 h-100">
          <CCardHeader class="bg-light d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <span class="badge-soft" :class="levelClass(p.currentStage.name)">
                {{ p.currentStage.name }}
              </span>
              <span class="text-muted">→</span>
              <span class="badge-soft" :class="levelClass(p.nextStage.name)">
                {{ p.nextStage.name }}
              </span>
            </div>

            <div class="d-flex gap-2">
              <CButton size="sm" color="primary" variant="outline" @click="openEdit(p)">
                <CIcon :icon="cilPencil" class="me-1" />
                Edit
              </CButton>

              <CButton size="sm" color="danger" variant="outline" @click="openDelete(p)">
                <CIcon :icon="cilTrash" class="me-1" />
                Delete
              </CButton>
            </div>
          </CCardHeader>

          <CCardBody>
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div>
                <div class="text-muted small mb-1">Promotion Path</div>
                <div class="fw-semibold text-capitalize">
                  {{ p.promotionPath }}
                </div>
              </div>

              <div class="pill">
                <CIcon :icon="cilArrowRight" class="me-1" />
                Rule #{{ p.id }}
              </div>
            </div>
          </CCardBody>
        </CCard>
      </div>
    </div>

    <!-- ✅ Create/Edit Modal -->
    <CModal v-model:visible="showForm" alignment="center" backdrop="static" :keyboard="false" size="lg">
      <CModalHeader :close-button="false" class="text-white border-0 header-grad">
        <div class="d-flex align-items-center gap-2">
          <div class="icon-bubble">
            <CIcon :icon="isEdit ? cilPencil : cilPlus" class="text-white" />
          </div>
          <div>
            <CModalTitle class="mb-0">{{ isEdit ? 'Edit Promotion Path' : 'Create Promotion Path' }}</CModalTitle>
            <small class="opacity-75">Choose current stage and next stage</small>
          </div>
        </div>
      </CModalHeader>

      <CModalBody class="pt-4">
        <div class="p-3 rounded form-surface">
          <div class="row g-3">
            <div class="col-12 col-md-6">
              <CFormLabel class="fw-semibold">Current Stage</CFormLabel>
              <CFormSelect v-model="form.currentStageId" :invalid="!!errors.currentStageId">
                <option disabled value="" selected>Select current class</option>
                <option v-for="g in gradeClasses" :key="g.id" :value="String(g.id)">
                  {{ g.name }}
                </option>
              </CFormSelect>
              <div v-if="errors.currentStageId" class="small text-danger mt-1">{{ errors.currentStageId }}</div>
            </div>

            <div class="col-12 col-md-6">
              <CFormLabel class="fw-semibold">Next Stage</CFormLabel>
              <CFormSelect v-model="form.nextStageId" :invalid="!!errors.nextStageId">
                <option disabled value="" selected>Select next class</option>
                <option v-for="g in gradeClasses" :key="g.id" :value="String(g.id)">
                  {{ g.name }}
                </option>
              </CFormSelect>
              <div v-if="errors.nextStageId" class="small text-danger mt-1">{{ errors.nextStageId }}</div>
            </div>
          </div>

          <div class="mt-3">
            <div class="small text-uppercase text-muted fw-semibold mb-2">Preview</div>
            <div class="d-flex align-items-center flex-wrap gap-2">
              <span class="badge-soft" :class="levelClass(currentStageName || '')">
                {{ currentStageName || 'Current' }}
              </span>
              <span class="text-muted">→</span>
              <span class="badge-soft" :class="levelClass(nextStageName || '')">
                {{ nextStageName || 'Next' }}
              </span>
            </div>

            <div v-if="errors.duplicate" class="alert alert-warning small mt-3 mb-0">
              {{ errors.duplicate }}
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
              {{ isEdit ? 'Update' : 'Create' }}
            </template>
          </CButton>
        </div>
      </CModalFooter>
    </CModal>

    <!-- ✅ Delete Modal -->
    <CModal v-model:visible="showDelete" alignment="center" backdrop="static" :keyboard="false">
      <CModalHeader :close-button="false" class="text-white border-0 header-grad">
        <div class="d-flex align-items-center gap-2">
          <div class="icon-bubble">
            <CIcon :icon="cilTrash" class="text-white" />
          </div>
          <div>
            <CModalTitle class="mb-0">Delete Promotion Path</CModalTitle>
            <small class="opacity-75">This action cannot be undone</small>
          </div>
        </div>
      </CModalHeader>

      <CModalBody class="pt-4">
        <div class="p-3 rounded form-surface">
          <div class="fw-semibold mb-1">
            Delete: <span class="text-capitalize">“{{ toDelete?.promotionPath }}”</span>?
          </div>
          <div class="small text-muted">
            This will permanently remove the promotion path.
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
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { get_promotions_ktor, get_classes_ktor, post_promotions_ktor, patch_promotions_ktor, delete_promotions_ktor } from '@/services/api.js'

import {
  cilReload,
  cilSearch,
  cilArrowRight,
  cilSwapHorizontal,
  cilPlus,
  cilPencil,
  cilTrash,
  cilSave
} from '@coreui/icons'

const toast = useToast()

const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)

const promotions = ref([])
const gradeClasses = ref([])

const search = ref('')
const viewMode = ref('flow') // flow | cards

const showForm = ref(false)
const isEdit = ref(false)

const showDelete = ref(false)
const toDelete = ref(null)

const form = ref({
  id: null,
  currentStageId: '',
  nextStageId: ''
})

const errors = ref({
  currentStageId: '',
  nextStageId: '',
  duplicate: ''
})

function toggleView() {
  viewMode.value = viewMode.value === 'flow' ? 'cards' : 'flow'
}

function levelClass(name) {
  const n = (name || '').toLowerCase()
  if (n.includes('creche')) return 'creche'
  if (n.includes('nursery')) return 'nursery'
  if (n.includes('kg')) return 'kg'
  if (n.includes('jhs')) return 'jhs'
  if (n.includes('class')) return 'primary'
  return 'other'
}

async function fetchPromotions() {
  const { data } = await get_promotions_ktor()
  promotions.value = Array.isArray(data) ? data : []
}

async function fetchClasses() {
  // try raw endpoint first, fallback
  try {
    const { data } = await get_classes_ktor()
    gradeClasses.value = Array.isArray(data) ? data : []
  } catch {
    const { data } = await api.get('/grade-class')
    gradeClasses.value = Array.isArray(data) ? data : []
  }
}

async function refreshAll() {
  loading.value = true
  try {
    await Promise.all([fetchPromotions(), fetchClasses()])
  } catch (e) {
    toast.error(e?.response?.data?.error || 'Failed to load data', { position: 'top-right' })
  } finally {
    loading.value = false
  }
}

const filtered = computed(() => {
  const q = (search.value || '').trim().toLowerCase()
  if (!q) return promotions.value
  return promotions.value.filter(p => {
    const a = (p.currentStage?.name || '').toLowerCase()
    const b = (p.nextStage?.name || '').toLowerCase()
    const c = (p.promotionPath || '').toLowerCase()
    return a.includes(q) || b.includes(q) || c.includes(q)
  })
})

const currentStageName = computed(() => {
  const id = Number(form.value.currentStageId)
  const found = gradeClasses.value.find(x => x.id === id)
  return found ? found.name : ''
})

const nextStageName = computed(() => {
  const id = Number(form.value.nextStageId)
  const found = gradeClasses.value.find(x => x.id === id)
  return found ? found.name : ''
})

function openCreate() {
  isEdit.value = false
  errors.value = { currentStageId: '', nextStageId: '', duplicate: '' }
  form.value = { id: null, currentStageId: '', nextStageId: '' }
  showForm.value = true
}

function openEdit(p) {
  isEdit.value = true
  errors.value = { currentStageId: '', nextStageId: '', duplicate: '' }
  form.value = {
    id: p.id,
    currentStageId: String(p.currentStage.id),
    nextStageId: String(p.nextStage.id)
  }
  showForm.value = true
}

function closeForm() {
  if (saving.value) return
  showForm.value = false
}

function validateForm() {
  errors.value = { currentStageId: '', nextStageId: '', duplicate: '' }

  if (!form.value.currentStageId) errors.value.currentStageId = 'Select the current stage'
  if (!form.value.nextStageId) errors.value.nextStageId = 'Select the next stage'

  if (form.value.currentStageId && form.value.nextStageId) {
    if (form.value.currentStageId === form.value.nextStageId) {
      errors.value.nextStageId = 'Next stage cannot be the same as current stage'
    }

    // UI duplicate check
    const cur = Number(form.value.currentStageId)
    const nxt = Number(form.value.nextStageId)
    const dup = promotions.value.some(x =>
      x.currentStage?.id === cur &&
      x.nextStage?.id === nxt &&
      (!isEdit.value || x.id !== form.value.id)
    )
    if (dup) errors.value.duplicate = 'This promotion path already exists.'
  }

  return !errors.value.currentStageId && !errors.value.nextStageId && !errors.value.duplicate
}

async function submitForm() {
  if (!validateForm()) return

  saving.value = true
  try {
    const payload = {
      currentStageId: Number(form.value.currentStageId),
      nextStageId: Number(form.value.nextStageId)
    }

    if (!isEdit.value) {
      // POST /promotion
      const { data } = await post_promotions_ktor(payload)
      // Update list quickly
      promotions.value.unshift(data)
      toast.success('Promotion path created!', { position: 'top-right' })
    } else {
      // PUT /promotion/{id}
      const { data } = await patch_promotions_ktor(form.value.id, payload)
      const idx = promotions.value.findIndex(x => x.id === form.value.id)
      if (idx !== -1) promotions.value[idx] = data
      toast.success('Promotion path updated!', { position: 'top-right' })
    }

    showForm.value = false

  } catch (e) {
    // backend may return 409 for duplicates
    if (e?.response?.status === 409) {
      errors.value.duplicate = e?.response?.data?.error || 'This promotion path already exists.'
      toast.warning(errors.value.duplicate, { position: 'top-right' })
    } else {
      toast.error(e?.response?.data?.error || 'Save failed', { position: 'top-right' })
    }
  } finally {
    saving.value = false
  }
}

function openDelete(p) {
  toDelete.value = p
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
    await delete_promotions_ktor(toDelete.value.id)

    promotions.value = promotions.value.filter(x => x.id !== toDelete.value.id)
    showDelete.value = false

    toast.success('Promotion path deleted!', { position: 'top-right' })

  } catch (e) {
    toast.error(e?.response?.data?.error || 'Delete failed', { position: 'top-right' })
  } finally {
    deleting.value = false
  }
}

/**
 * Build chains from promotion rules (current -> next)
 */
const chains = computed(() => {
  const list = filtered.value

  const nextByCurrent = new Map()
  const stageById = new Map()
  const allNextIds = new Set()

  list.forEach(p => {
    if (p?.currentStage?.id != null && p?.nextStage?.id != null) {
      nextByCurrent.set(p.currentStage.id, p.nextStage)
      stageById.set(p.currentStage.id, p.currentStage)
      stageById.set(p.nextStage.id, p.nextStage)
      allNextIds.add(p.nextStage.id)
    }
  })

  const startIds = []
  nextByCurrent.forEach((_next, currentId) => {
    if (!allNextIds.has(currentId)) startIds.push(currentId)
  })

  const effectiveStarts = startIds.length ? startIds : Array.from(nextByCurrent.keys())

  const visitedStarts = new Set()
  const result = []

  for (const startId of effectiveStarts) {
    if (visitedStarts.has(startId)) continue
    visitedStarts.add(startId)

    const chain = []
    let cur = startId
    const seen = new Set()

    while (cur != null && !seen.has(cur)) {
      seen.add(cur)
      const stage = stageById.get(cur)
      if (stage) chain.push(stage)
      const next = nextByCurrent.get(cur)
      cur = next ? next.id : null
    }

    if (chain.length) result.push(chain)
  }

  return result
})

onMounted(refreshAll)
</script>

<style scoped>
.promotion-page { padding-bottom: 1rem; }

/* header */
.header-grad {
  background: linear-gradient(90deg, #0ea5e9, #0369a1);
  border: 1px solid rgba(255,255,255,0.18);
}

.search-box { min-width: 320px; }

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

/* legend */
.legend-pill{
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid rgba(0,0,0,0.06);
}
.legend-pill.creche { background:#ffe8f0; color:#a61e4d; }
.legend-pill.nursery{ background:#fff4e6; color:#b45309; }
.legend-pill.kg     { background:#ecfeff; color:#0369a1; }
.legend-pill.primary{ background:#e0f2fe; color:#075985; }
.legend-pill.jhs    { background:#eef2ff; color:#3730a3; }
.legend-pill.other  { background:#f1f5f9; color:#334155; }

/* flow view */
.flow-wrap { display: grid; gap: 14px; }

.flow-chain {
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(2,132,199,0.15);
  overflow: hidden;
}
.chain-header {
  padding: 10px 12px;
  background: linear-gradient(90deg, rgba(14,165,233,0.10), rgba(3,105,161,0.04));
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.chain-row {
  padding: 14px 12px 8px;
  display: flex;
  gap: 18px;
  overflow-x: auto;
}
.node {
  position: relative;
  min-width: 170px;
  border-radius: 14px;
  padding: 10px 12px;
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 6px 14px rgba(0,0,0,0.03);
}
.node-top { display:flex; justify-content:space-between; gap:10px; }
.node-name { font-weight: 800; font-size: 14px; }
.node-id { font-size: 12px; opacity: 0.8; }

.arrow { position:absolute; top:50%; right:-18px; transform:translateY(-50%); width:18px; height:2px; }
.arrow-line { position:absolute; left:0; right:4px; height:2px; background: rgba(15,23,42,0.35); }
.arrow-head { position:absolute; top:-4px; right:-2px; width:0;height:0; border-left:8px solid rgba(15,23,42,0.35); border-top:5px solid transparent; border-bottom:5px solid transparent; }

.chain-footer {
  padding: 10px 12px 12px;
  background: #fbfdff;
  border-top: 1px solid rgba(2,132,199,0.10);
}

/* colour themes */
.node.creche, .badge-soft.creche { background:#ffe8f0; color:#a61e4d; }
.node.nursery,.badge-soft.nursery{ background:#fff4e6; color:#b45309; }
.node.kg,     .badge-soft.kg     { background:#ecfeff; color:#0369a1; }
.node.primary,.badge-soft.primary{ background:#e0f2fe; color:#075985; }
.node.jhs,    .badge-soft.jhs    { background:#eef2ff; color:#3730a3; }
.node.other,  .badge-soft.other  { background:#f1f5f9; color:#334155; }

.badge-soft{
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 12px;
  border: 1px solid rgba(0,0,0,0.06);
}

.pill {
  padding: 8px 12px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(14,165,233,0.14), rgba(3,105,161,0.08));
  border: 1px solid rgba(2,132,199,0.18);
  font-size: 12px;
  font-weight: 700;
  color: #075985;
  display: inline-flex;
  align-items: center;
}
</style>
