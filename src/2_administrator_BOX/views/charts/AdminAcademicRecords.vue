<template>
  <div class="page">

    <!-- Header -->
    <div class="hero shadow-sm">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h5 class="mb-1">Academic Records (Admin)</h5>
          <div class="small opacity-75">
            Manage records only (attendance, roll, remarks, promotion). Subject scores are hidden.
          </div>
        </div>

        <div class="d-flex gap-2 align-items-center flex-wrap">
          <CInputGroup size="sm" style="max-width: 360px;">
            <CInputGroupText class="bg-white border-0">
              <CIcon :icon="cilSearch" class="text-primary" />
            </CInputGroupText>
            <CFormInput
              v-model="search"
              placeholder="Search student, class, year, term..."
              class="border-0"
            />
          </CInputGroup>

          <CButton style="background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.25); color: white;" color="light" size="sm" :disabled="loading" @click="fetchRecords">
            <CIcon :icon="cilReload" class="me-1" />
            {{ loading ? 'Loading...' : 'Refresh' }}
          </CButton>

          <CButton
            color="danger"
            size="sm"
            variant="outline"
            :disabled="!selectedIds.length || deleting"
            @click="bulkDelete"
          >
            <CIcon :icon="cilTrash" class="me-1" />
            Delete Selected ({{ selectedIds.length }})
          </CButton>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="row g-3 my-3" v-if="!loading && filtered.length">
      <div class="col-md-3">
        <div class="stat">
          <div class="label">Records</div>
          <div class="value">{{ filtered.length }}</div>
        </div>
      </div>

      <div class="col-md-3">
        <div class="stat">
          <div class="label">With Remarks</div>
          <div class="value">{{ withRemarks }}</div>
        </div>
      </div>

      <div class="col-md-3">
        <div class="stat">
          <div class="label">Avg Raw Total</div>
          <div class="value">{{ avgRaw }}</div>
        </div>
      </div>

      <div class="col-md-3">
        <div class="stat">
          <div class="label">Top Position</div>
          <div class="value">{{ topPosition }}</div>
        </div>
      </div>
    </div>

    <!-- Loading / Empty -->
    <div v-if="loading" class="py-5 text-center text-muted">
      <CSpinner size="sm" class="me-2" /> Loading academic records…
    </div>

    <div v-else-if="!filtered.length" class="py-5 text-center text-muted">
      No academic records found.
    </div>

    <!-- Table -->
    <div v-else class="table-wrap shadow-sm">
      <CTable hover responsive class="mb-0">
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell style="width:40px;">
              <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" />
            </CTableHeaderCell>
            <CTableHeaderCell>ID</CTableHeaderCell>
            <CTableHeaderCell>Student</CTableHeaderCell>
            <CTableHeaderCell>Term / Year</CTableHeaderCell>
            <CTableHeaderCell>Class</CTableHeaderCell>
            <CTableHeaderCell class="text-end">Overall</CTableHeaderCell>
            <CTableHeaderCell class="text-end">Raw</CTableHeaderCell>
            <CTableHeaderCell>Attendance</CTableHeaderCell>
            <CTableHeaderCell>Promoted</CTableHeaderCell>
            <CTableHeaderCell style="width:240px;" class="text-end">Actions</CTableHeaderCell>
          </CTableRow>
        </CTableHead>

        <CTableBody>
          <CTableRow v-for="r in paginated" :key="r.id">
            <CTableDataCell>
              <input type="checkbox" :value="r.id" v-model="selectedIds" />
            </CTableDataCell>

            <CTableDataCell>#{{ r.id }}</CTableDataCell>

            <CTableDataCell>
              <div class="fw-semibold">{{ r.student?.name ?? '—' }}</div>
              <div class="small text-muted">UserId: {{ r.student?.userId ?? '—' }}</div>
              <div class="small text-muted">StudentID: {{ r.student?.id ?? '—' }}</div>
            </CTableDataCell>

            <CTableDataCell>
              <div class="small">
                <b>{{ r.term?.name ?? '—' }}</b> / <b>{{ r.academicYear?.name ?? '—' }}</b>
              </div>
            </CTableDataCell>

            <CTableDataCell>
              <span class="pill">{{ r.gradeClass?.name ?? '—' }}</span>
            </CTableDataCell>

            <CTableDataCell class="text-end">{{ r.overallPosition ?? '—' }}</CTableDataCell>
            <CTableDataCell class="text-end">{{ r.rawScoreTotal ?? '—' }}</CTableDataCell>

            <CTableDataCell>{{ r.attendance ?? '—' }}</CTableDataCell>
            <CTableDataCell>{{ r.promotedTo ?? '—' }}</CTableDataCell>

            <CTableDataCell class="text-end">
              <div class="d-inline-flex gap-2">
                <CButton size="sm" color="primary" variant="outline" @click="openEdit(r)">
                  <CIcon :icon="cilPencil" class="me-1" /> Edit
                </CButton>

                <CButton size="sm" color="danger" variant="outline" @click="openDelete(r)">
                  <CIcon :icon="cilTrash" class="me-1" /> Delete
                </CButton>
              </div>
            </CTableDataCell>
          </CTableRow>
        </CTableBody>
      </CTable>

      <!-- Pagination -->
      <div class="d-flex justify-content-between align-items-center p-2 border-top">
        <div class="small text-muted">
          Page <b>{{ page }}</b> / <b>{{ totalPages }}</b>
        </div>
        <div class="d-flex gap-2">
          <CButton size="sm" color="secondary" variant="outline" :disabled="page<=1" @click="page--">Prev</CButton>
          <CButton size="sm" color="secondary" variant="outline" :disabled="page>=totalPages" @click="page++">Next</CButton>
        </div>
      </div>
    </div>

    <!-- ✅ Bulk Delete confirm modal -->
<CModal v-model:visible="showBulkDelete" alignment="center" backdrop="static" :keyboard="false">
  <CModalHeader :close-button="false" class="text-white border-0 hero">
    <CModalTitle class="mb-0">Delete Selected Academic Records</CModalTitle>
  </CModalHeader>

  <CModalBody>
    <div class="p-3 rounded form-surface">
      <div class="fw-semibold mb-2">
        You are about to delete <b>{{ selectedIds.length }}</b> record(s).
      </div>

      <div class="small text-muted">
        This will also delete subject scores under each record. This action cannot be undone.
      </div>

      <hr />

      <!-- Preview first 5 -->
      <div class="small fw-semibold mb-2">Preview</div>
      <ul class="small mb-0">
        <li v-for="r in bulkPreview" :key="r.id">
          #{{ r.id }} — {{ r.student?.name ?? '—' }} ({{ r.gradeClass?.name ?? '—' }})
        </li>
      </ul>

      <div v-if="selectedIds.length > bulkPreview.length" class="small text-muted mt-2">
        +{{ selectedIds.length - bulkPreview.length }} more...
      </div>
    </div>
  </CModalBody>

  <CModalFooter class="border-0">
    <CButton
      color="secondary"
      variant="outline"
      :disabled="deleting"
      @click="showBulkDelete = false"
    >
      Cancel
    </CButton>

    <CButton
      color="danger"
      :disabled="deleting"
      @click="confirmBulkDelete"
    >
      <CSpinner v-if="deleting" size="sm" class="me-2" />
      Delete {{ selectedIds.length }}
    </CButton>
  </CModalFooter>
</CModal>



    <!-- Edit Modal -->
    <CModal v-model:visible="showEdit" alignment="center" backdrop="static" :keyboard="false" size="lg">
      <CModalHeader :close-button="false" class="text-white border-0 hero">
        <CModalTitle class="mb-0">Edit Academic Record</CModalTitle>
      </CModalHeader>

      <CModalBody v-if="form">
        <div class="form-surface p-3 rounded">
          <div class="mb-3">
            <div class="small text-muted">Student</div>
            <div class="fw-semibold">{{ form.studentName }}</div>
          </div>

          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label">Attendance</label>
              <CFormInput v-model="form.attendance" placeholder="e.g. 40/45" @input="sanitizeAttendance" />
            </div>

            <div class="col-md-4">
              <label class="form-label">Number on Roll</label>
              <CFormInput type="number" v-model.number="form.numberOnRoll" min="0" />
            </div>

            <div class="col-md-4">
              <label class="form-label">Promoted To</label>
              <CFormInput v-model="form.promotedTo" placeholder="e.g. class 2" />
            </div>

            <div class="col-md-4">
              <label class="form-label">Conduct</label>
              <CFormInput v-model="form.conduct" />
            </div>

            <div class="col-md-4">
              <label class="form-label">Interest</label>
              <CFormInput v-model="form.interest" />
            </div>

            <div class="col-md-4">
              <label class="form-label">Attitude</label>
              <CFormInput v-model="form.attitude" />
            </div>

            <div class="col-12">
              <label class="form-label">Teacher Remarks</label>
              <CFormTextarea rows="2" v-model="form.teacherRemarks" />
            </div>

            <div class="col-12">
              <label class="form-label">Head Teacher Remarks</label>
              <CFormTextarea rows="2" v-model="form.headTeacherRemarks" />
            </div>

            <div class="col-md-6">
              <label class="form-label">Next Term Begins</label>
              <CFormInput v-model="form.nextTermBegins" placeholder="e.g. 10th Sept" />
            </div>
          </div>
        </div>
      </CModalBody>

      <CModalFooter class="border-0">
        <CButton color="secondary" variant="outline" :disabled="saving" @click="showEdit=false">Cancel</CButton>
        <CButton class="text-white" color="primary" :disabled="saving" @click="saveRemarks">
          <CSpinner v-if="saving" size="sm" class="me-2" /> Save
        </CButton>
      </CModalFooter>
    </CModal>

    <!-- Delete confirm modal -->
    <CModal v-model:visible="showDelete" alignment="center" backdrop="static" :keyboard="false">
      <CModalHeader :close-button="false" class="text-white border-0 hero">
        <CModalTitle class="mb-0">Delete Academic Record</CModalTitle>
      </CModalHeader>

      <CModalBody>
        <div v-if="toDelete" class="p-3 rounded form-surface">
          Delete record <b>#{{ toDelete.id }}</b> for <b>{{ toDelete.student?.name }}</b>?
          <div class="small text-muted mt-1">This also deletes subject scores under this record.</div>
        </div>
      </CModalBody>

      <CModalFooter class="border-0">
        <CButton color="secondary" variant="outline" :disabled="deleting" @click="showDelete=false">Cancel</CButton>
        <CButton color="danger" :disabled="deleting" @click="confirmDelete">
          <CSpinner v-if="deleting" size="sm" class="me-2" /> Delete
        </CButton>
      </CModalFooter>
    </CModal>

  </div>
</template>

<script setup>


/* ========= EXACT LOCATION: imports (top) ========= */
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { cilReload, cilSearch, cilPlus, cilPencil, cilTrash } from '@coreui/icons'

/* ========= EXACT LOCATION: API imports ========= */

import { get_all_academic_records_ktor, patch_academic_remarks, delete_academic_record_ktor } from '@/services/api'

const toast = useToast()

/* ========= STATE ========= */
const records = ref([])
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const showBulkDelete = ref(false)

const search = ref('')
const page = ref(1)
const pageSize = ref(20)
const selectedIds = ref([])

const showEdit = ref(false)
const showDelete = ref(false)
const toDelete = ref(null)
const form = ref(null)

const bulkPreview = computed(() => {
  const set = new Set(selectedIds.value)
  return records.value.filter(r => set.has(r.id)).slice(0, 5)
})

/* ========= FETCH ALL RECORDS (ADMIN) ========= */
async function fetchRecords() {
  loading.value = true
  try {
    const res = await get_all_academic_records_ktor()
    records.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {

    toast.error('Failed to load academic records')
  } finally {
    loading.value = false
  }
}

/* ========= SEARCH + PAGINATION ========= */
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return records.value
  return records.value.filter(r => {
    const s = (r.student?.name || '').toLowerCase()
    const cls = (r.gradeClass?.name || '').toLowerCase()
    const term = (r.term?.name || '').toLowerCase()
    const yr = (r.academicYear?.name || '').toLowerCase()
    return s.includes(q) || cls.includes(q) || term.includes(q) || yr.includes(q)
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))
const paginated = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

watch([search, pageSize], () => { page.value = 1 })
watch(totalPages, () => { if (page.value > totalPages.value) page.value = totalPages.value })

/* ========= BULK SELECTION ========= */
const allSelected = computed(() =>
  paginated.value.length > 0 && paginated.value.every(r => selectedIds.value.includes(r.id))
)

function toggleSelectAll(e) {
  if (e.target.checked) selectedIds.value = paginated.value.map(r => r.id)
  else selectedIds.value = []
}

/* ========= STATS ========= */
const withRemarks = computed(() => filtered.value.filter(r => (r.teacherRemarks || r.headTeacherRemarks)).length)
const avgRaw = computed(() => {
  const vals = filtered.value.map(r => r.rawScoreTotal).filter(v => typeof v === 'number')
  if (!vals.length) return '—'
  return (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1)
})
const topPosition = computed(() => {
  const vals = filtered.value.map(r => r.overallPosition).filter(v => typeof v === 'number')
  if (!vals.length) return '—'
  return Math.min(...vals)
})

/* ========= EDIT ========= */
function openEdit(r) {
  form.value = {
    id: r.id,
    studentName: r.student?.name || '—',
    attendance: r.attendance,
    numberOnRoll: r.numberOnRoll,
    promotedTo: r.promotedTo,
    conduct: r.conduct,
    interest: r.interest,
    attitude: r.attitude,
    teacherRemarks: r.teacherRemarks,
    headTeacherRemarks: r.headTeacherRemarks,
    nextTermBegins: r.nextTermBegins
  }
  showEdit.value = true
}

function sanitizeAttendance() {
  if (!form.value?.attendance) return
  form.value.attendance = String(form.value.attendance).replace(/[^\d/]/g, '')
}

async function saveRemarks() {
  if (!form.value?.id) return
  saving.value = true
  try {
    const payload = {
      attendance: form.value.attendance,
      numberOnRoll: form.value.numberOnRoll,
      promotedTo: form.value.promotedTo,
      conduct: form.value.conduct,
      interest: form.value.interest,
      attitude: form.value.attitude,
      teacherRemarks: form.value.teacherRemarks,
      headTeacherRemarks: form.value.headTeacherRemarks,
      nextTermBegins: form.value.nextTermBegins
    }

    const res = await patch_academic_remarks(form.value.id, payload)
    const updated = res.data

    const idx = records.value.findIndex(x => x.id === updated.id)
    if (idx !== -1) records.value[idx] = updated

    toast.success('Saved ✅')
    showEdit.value = false
  } catch (e) {

    toast.error('Save failed')
  } finally {
    saving.value = false
  }
}

/* ========= DELETE ========= */
function openDelete(r) {
  toDelete.value = r
  showDelete.value = true
}

async function confirmBulkDelete() {
  if (!selectedIds.value.length) return

  deleting.value = true
  try {
    for (const id of selectedIds.value) {
      await delete_academic_record_ktor(id)
    }

    const set = new Set(selectedIds.value)
    records.value = records.value.filter(r => !set.has(r.id))
    selectedIds.value = []

    toast.success('Bulk delete done ✅')
    showBulkDelete.value = false

  } catch (e) {

    toast.error('Bulk delete failed')
  } finally {
    deleting.value = false
  }
}

async function confirmDelete() {
  if (!toDelete.value?.id) return
  deleting.value = true
  try {
    await delete_academic_record_ktor(toDelete.value.id)
    records.value = records.value.filter(x => x.id !== toDelete.value.id)
    selectedIds.value = selectedIds.value.filter(id => id !== toDelete.value.id)
    toast.success('Deleted ✅')
    showDelete.value = false
  } catch (e) {


    toast.error('Delete failed')
  } finally {
    deleting.value = false
  }
}

function bulkDelete() {
  if (!selectedIds.value.length) return
  showBulkDelete.value = true
}

/* Optional create button */
function openCreate() {
  toast.info('Create is optional. Enable POST /api/academic-records to use this.')
}

/* ========= INIT ========= */
onMounted(fetchRecords)
</script>

<style scoped>
.page { padding: 16px; }
.hero {
  background: linear-gradient(90deg, #0ea5e9, #0369a1);
  color: white;
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 12px;
}
.pill {
  display:inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.24);
  font-weight: 700;
  font-size: 12px;
}
.stat {
  background:#fff;
  border:1px solid rgba(2,132,199,0.12);
  border-radius: 12px;
  padding: 12px;
}
.stat .label { color:#64748b; font-size: 12px; font-weight: 800; text-transform: uppercase; }
.stat .value { font-size: 22px; font-weight: 900; color:#0f172a; }
.table-wrap {
  background:#fff;
  border:1px solid rgba(2,132,199,0.12);
  border-radius: 12px;
  overflow: hidden;
}
.form-surface{
  background:#f7fbff;
  border: 1px solid rgba(3,105,161,.15);
}
</style>
