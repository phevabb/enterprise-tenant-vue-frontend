

<script setup>
/* =========================
   1) IMPORTS (TOP OF FILE)
   ========================= */
import { ref, reactive, onMounted } from 'vue'
import { useToast } from 'vue-toastification'

/**
 * ✅ API functions used in THIS component (remarks CRUD)
 * These must exist in: @/services/api
 */
import {
  assigned_class_ktor,
  get_academic_records_by_class_ktor,
  patch_academic_remarks
} from '@/services/api'

/* =========================
   2) TOAST + STATE
   ========================= */
const toast = useToast()

const records = ref([])          // list of academic records for teacher's class
const selected = ref(null)       // current selected record object
const selectedId = ref(null)     // selected record id (for highlighting)
const loading = ref(false)
const saving = ref(false)

/** Assigned class context */
const ctx = reactive({
  gradeclassId: null,
  gradeclassName: ''
})

/* =========================
   3) HELPERS
   ========================= */

/** Safely parse JSON */
function safeJSONParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** Keep attendance format digits + slash only */
function sanitizeAttendance() {
  if (!selected.value?.attendance) return
  selected.value.attendance = selected.value.attendance.replace(/[^\d/]/g, '')
}

/** Select record */
function selectRecord(record) {
  selected.value = record
  selectedId.value = record?.id ?? null
}

/* =========================
   4) FETCH RECORDS FOR TEACHER CLASS
   ========================= */
async function fetchRecords() {
  loading.value = true

  try {
    /**
     * ✅ STEP A: Get logged in user from localStorage
     * Must exist: localStorage.setItem("user", JSON.stringify({ userId: "43227969", ... }))
     */
    const user = safeJSONParse(localStorage.getItem('user'))
    const userId = user?.userId

    if (!userId) {
      toast.error('No userId found in localStorage')
      return
    }

    /**
     * ✅ STEP B: Get assigned class using userId string
     * Expected response:
     * { userId: "43227969", assignedClass: { id: 17, name: "class 1" } }
     */
    const classRes = await assigned_class_ktor(userId)
    const assigned = classRes?.data?.assignedClass ?? null

    if (!assigned?.id) {
      toast.error('No assigned class found for this staff account')
      return
    }

    ctx.gradeclassId = assigned.id
    ctx.gradeclassName = assigned.name

    /**
     * ✅ STEP C: Fetch academic records ONLY for that class
     * Endpoint should be something like:
     * GET /api/academic-records/class/{classId}
     */
    const res = await get_academic_records_by_class_ktor(ctx.gradeclassId)
    records.value = res?.data ?? []

    // Auto select first record
    if (records.value.length) {
      selectRecord(records.value[0])
    } else {
      selected.value = null
      selectedId.value = null
    }

  } catch (e) {


    toast.error('Failed to load class academic records')
  } finally {
    loading.value = false
  }
}

/* =========================
   5) SAVE (PATCH) REMARKS
   ========================= */
async function save() {
  if (!selected.value?.id) return

  saving.value = true
  try {
    /**
     * ✅ IMPORTANT:
     * Payload keys MUST match your backend PatchAcademicRecordRemarksRequest
     * (camelCase keys shown here)
     */
    const payload = {
      attendance: selected.value.attendance,
      numberOnRoll: selected.value.numberOnRoll,
      promotedTo: selected.value.promotedTo,

      conduct: selected.value.conduct,
      interest: selected.value.interest,
      attitude: selected.value.attitude,

      teacherRemarks: selected.value.teacherRemarks,
      headTeacherRemarks: selected.value.headTeacherRemarks,
      nextTermBegins: selected.value.nextTermBegins
    }

    const res = await patch_academic_remarks(selected.value.id, payload)

    // Update selected record + list
    const updated = res?.data
    if (updated?.id) {
      selected.value = updated

      const idx = records.value.findIndex(r => r.id === updated.id)
      if (idx !== -1) records.value[idx] = updated
    }

    toast.success('Remarks saved ✅')

  } catch (e) {

    toast.error(e?.response?.data?.error || 'Save failed')
  } finally {
    saving.value = false
  }
}

/* =========================
   6) INIT
   ========================= */
onMounted(fetchRecords)

/**
 * Expose functions used by template
 * (script setup auto-exposes, so no export needed)
 */
</script>


<template>
  <div class="page">

    <!-- HEADER -->
    <div class="header">
      <h4>Remarks</h4>
      <span class="muted">Manage teacher remarks & student behaviour</span>
    </div>

    <div class="grid">

      <!-- LEFT: STUDENTS -->
      <div class="panel list">
        <div class="panel-title">Students</div>

        <div v-if="loading" class="p-3 text-muted">Loading...</div>

        <div
          v-for="r in records"
          :key="r.id"
          @click="selected = r"
          :class="['student', selected?.id === r.id && 'active']"
        >
          <div>
            <div class="name">{{ r.student.name }}</div>
            <div class="meta">{{ r.gradeClass.name }}</div>
          </div>

          <div class="badge">
            #{{ r.overallPosition ?? '-' }}
          </div>
        </div>
      </div>

      <!-- RIGHT: FORM -->
      <div class="panel form" v-if="selected">

        <div class="panel-title">
          {{ selected.student.name }}
          <span class="muted small">
            • {{ selected.term.name }}
          </span>
        </div>

        <!-- Behaviour -->
        <div class="section">
          <h6>Behaviour</h6>

          <div class="row">
            <input v-model="selected.conduct" placeholder="Conduct" />
            <input v-model="selected.attitude" placeholder="Attitude" />
            <input v-model="selected.interest" placeholder="Interest" />
          </div>
        </div>

        <!-- Class Info -->
        <div class="section">
          <h6>Class Info -     ( Attendance / Number on roll / Promoted to )</h6>

          <div class="row">
            <input v-model="selected.attendance" placeholder="Attendance (e.g 20/30)" />
            <input type="number" v-model="selected.numberOnRoll" placeholder="Number on roll" />
            <input v-model="selected.promotedTo" placeholder="Promoted to" />
          </div>
        </div>

        <!-- Remarks -->
        <div class="section">
          <h6>Teacher Remarks</h6>
          <textarea v-model="selected.teacherRemarks" rows="2"></textarea>

          <h6 class="mt">Head Remarks</h6>
          <textarea v-model="selected.headTeacherRemarks" rows="2"></textarea>
        </div>

        <div class="section">
          <h6>Next Term</h6>
          <input v-model="selected.nextTermBegins" />
        </div>

        <div class="actions">
          <button :disabled="saving" @click="save">
            {{ saving ? 'Saving...' : 'Save Remarks' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>



<style scoped>
.page { padding: 1rem }
.header { margin-bottom: 1rem }
.muted { color: #64748b }

.grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 12px;
}

.panel {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.panel-title {
  padding: 12px;
  font-weight: 700;
  border-bottom: 1px solid #e2e8f0;
}

.list {
  max-height: 80vh;
  overflow-y: auto;
}

.student {
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
}

.student:hover { background: #f8fafc }
.student.active { background: #e0f2fe }

.name { font-weight: 600 }
.meta { font-size: 12px; color: #64748b }

.badge {
  background: #0ea5e9;
  color: white;
  padding: 3px 8px;
  border-radius: 8px;
}

.form { padding: 12px }

.row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
}

.section { margin-bottom: 16px }

textarea, input {
  width: 100%;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #cbd5f5;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

button {
  background: linear-gradient(90deg,#0ea5e9,#0369a1);
  color: white;
  padding: 10px 18px;
  border-radius: 999px;
  border: none;
}
</style>
