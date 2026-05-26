<template>
  <v-container fluid class="pa-4 premium-bg">

    <!-- HEADER -->
    <v-card class="pa-4 mb-4 premium-hero">
      <div class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-avatar size="56" class="mr-3 premium-avatar">
            <v-icon size="32" color="white">mdi-book-education</v-icon>
          </v-avatar>
          <div>
            <div class="text-h6 text-white font-weight-bold">
              Teachers’ Academic Records
            </div>
            <div class="text-caption text-white opacity-80">
              Dynamic subjects based on teacher class category
            </div>
          </div>
        </div>
      </div>
    </v-card>

    <!-- TOP CONTROLS -->
    <v-card class="pa-3 mb-3 premium-card">
      <div class="d-flex align-center flex-wrap gap-3">
        <v-chip size="small" color="primary">{{ ctx.gradeclassName || '—' }}</v-chip>
        <v-chip size="small" color="primary">{{ currentTerm || '—' }}</v-chip>
        <v-chip size="small" color="primary">{{ currentYear || '—' }}</v-chip>

        <v-select
          v-model="subject"
          :items="SUBJECTS"
          label="Subject"
          density="compact"
          style="max-width: 220px"
          :disabled="booting || !SUBJECTS.length"
        />

        <v-btn
          size="small"
          variant="tonal"
          @click="fillBlanks(subject)"
          :disabled="booting || !subject"
        >
          Fill
        </v-btn>

        <v-btn
          size="small"
          variant="tonal"
          color="error"
          @click="clearSubject(subject)"
          :disabled="booting || !subject"
        >
          Clear
        </v-btn>

        <!-- ✅ Publish -->
        <v-btn
          color="success"
          :loading="sending"
          :disabled="sending || !subject || completedCount < students.length || students.length === 0"
          @click="confirmPublishAndSend"
        >
          Publish ({{ subjectLabel(subject) }})
        </v-btn>
      </div>

      <!-- ✅ Preload hint -->
      <div class="text-caption text-muted mt-2">
        Tip: Selecting a subject automatically loads existing saved scores for:
        <b>{{ ctx.gradeclassName || 'your class' }}</b> • <b>{{ currentTerm || 'term' }}</b> • <b>{{ currentYear || 'year' }}</b>
      </div>
    </v-card>

    <!-- TABLE -->
    <v-card class="pa-2 premium-card beautiful-table">
      <v-table fixed-header height="60vh" density="compact" class="marks-table striped-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Student</th>
            <th class="text-no-wrap">Class</th>
            <th class="text-no-wrap">Exam</th>
            <th class="text-right text-no-wrap">Total</th>
            <th class="text-center text-no-wrap">Grade</th>
            <th class="text-center text-no-wrap">Status</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="booting">
            <td colspan="7" class="text-center text-muted py-6">Loading...</td>
          </tr>

          <tr v-else-if="!students.length">
            <td colspan="7" class="text-center text-muted py-6">
              No students found for this teacher/class.
            </td>
          </tr>

          <tr v-else v-for="(stu, i) in students" :key="stu.id">
            <td>{{ i + 1 }}</td>

            <td>
              <strong>{{ stu.full_name }}</strong>
              <div class="text-caption">{{ stu.indexNo }}</div>
            </td>

            <td class="cell-input">
              <v-text-field
                v-model.number="rec(stu.id)[`${subject}_class_score`]"
                type="number"
                density="compact"
                variant="plain"
                :disabled="!subject"
                @change="recalc(stu.id, subject)"
              />
            </td>

            <td class="cell-input">
              <v-text-field
                v-model.number="rec(stu.id)[`${subject}_exam_score`]"
                type="number"
                density="compact"
                variant="plain"
                :disabled="!subject"
                @change="recalc(stu.id, subject)"
              />
            </td>

            <td class="text-right">
              {{ rec(stu.id)[`${subject}_total_score`] ?? "—" }}
            </td>

            <td class="text-center">
              {{ rec(stu.id)[`${subject}_grade`] ?? "—" }}
            </td>

            <td class="text-center">
              <v-chip
                size="x-small"
                :color="isComplete(stu.id, subject) ? 'success' : 'grey'"
              >
                {{ isComplete(stu.id, subject) ? "Done" : "Pending" }}
              </v-chip>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- FOOTER -->
    <v-card class="pa-3 mt-4 premium-card">
      <div class="d-flex justify-space-between align-center flex-wrap gap-2">
        <div>
          Completed: <b>{{ completedCount }}</b>/<b>{{ students.length }}</b>
        </div>

        <v-btn
          color="success"
          :loading="sending"
          :disabled="sending || !subject || completedCount < students.length || students.length === 0"
          @click="confirmPublishAndSend"
        >
          Publish ({{ subjectLabel(subject) }})
        </v-btn>
      </div>
    </v-card>

  </v-container>
</template>

<script setup>
/* ===========================
   (A) IMPORTS - TOP OF FILE
   ✅ FIX: include watch
   =========================== */
import { ref, reactive, computed, onMounted, watch } from "vue"
import { useToast } from "vue-toastification"

const toast = useToast()

/* ===========================
   (B) API IMPORTS - TOP OF FILE
   ✅ FIX: get_subject_scores_context_ktor included and used
   =========================== */
import {
  getCategories_ktor,
  get_teacher_student,
  assigned_class_ktor,
  get_subject_scores_context_ktor,
  create_subject_score_ktor,
  get_terms_with_year_ktor
} from "@/services/api"

/* ===========================
   (C) STATE
   =========================== */
const SUBJECTS = reactive([])
const subject = ref(null)

const currentTerm = ref(null)
const currentYear = ref(null)

const students = ref([])
const staff = ref(null)
const records = reactive({})

const ctx = reactive({
  gradeclassName: "",
  gradeclassId: null,
  termId: null,
  yearId: null
})

const booting = ref(false)
const sending = ref(false)

/* ===========================
   (D) HELPERS
   =========================== */
function subjectLabel(key) {
  if (!key) return "—"
  return String(key).replace(/(^\w|\s\w)/g, m => m.toUpperCase())
}

function rec(id) {
  records[id] ||= {}
  return records[id]
}

function computeGrade(total) {
  if (total >= 85) return "A"
  if (total >= 70) return "B"
  if (total >= 50) return "C"
  if (total >= 30) return "D"
  return "E"
}

function recalc(id, subj) {
  if (!subj) return

  const r = rec(id)
  const c = Number(r[`${subj}_class_score`] ?? 0)
  const e = Number(r[`${subj}_exam_score`] ?? 0)

  if (r[`${subj}_class_score`] == null && r[`${subj}_exam_score`] == null) {
    r[`${subj}_total_score`] = null
    r[`${subj}_grade`] = null
    return
  }

  const total = c + e
  r[`${subj}_total_score`] = total
  r[`${subj}_grade`] = computeGrade(total)
}

function isComplete(id, subj) {
  if (!subj) return false
  const r = rec(id)
  return r[`${subj}_class_score`] != null && r[`${subj}_exam_score`] != null
}

function safeJSONParse(raw) {
  try { return raw ? JSON.parse(raw) : null } catch { return null }
}

function normalizeAssignedClass(assigned) {
  if (typeof assigned === "string") return { name: assigned, id: null }
  if (assigned && typeof assigned === "object") {
    return {
      name: typeof assigned.name === "string" ? assigned.name : "",
      id: typeof assigned.id === "number" ? assigned.id : null
    }
  }
  return { name: "", id: null }
}

/* ===========================
   (E) SUBJECTS FROM CATEGORIES
   =========================== */
function resolveSubjectsForClass(categories, className) {
  let cls = ""
  if (typeof className === "string") cls = className.trim().toLowerCase()

  if (!cls || !Array.isArray(categories)) return []

  for (const cat of categories) {
    const specific = Array.isArray(cat?.specific_classes) ? cat.specific_classes : []

    const match = specific.some(c => {
      const cname =
        typeof c === "string" ? c
          : (c && typeof c === "object" ? c.name : "")
      return (cname || "").trim().toLowerCase() === cls
    })

    if (match) {
      const subs = Array.isArray(cat?.subjects) ? cat.subjects : []
      return subs
        .map(s => (typeof s === "string" ? s : s?.name))
        .filter(Boolean)
    }
  }

  return []
}

/* ===========================
   (F) ✅ PRELOAD EXISTING SCORES
   WHERE: put this function in script setup (after helpers)
   =========================== */
async function preloadSubjectScores(subj) {
  if (!subj) return
  if (!ctx.gradeclassId || !ctx.termId || !ctx.yearId) return
  if (!students.value.length) return

  try {
    const res = await get_subject_scores_context_ktor(
      ctx.gradeclassId,
      ctx.termId,
      ctx.yearId,
      subj
    )

    const list = res?.data ?? []

    // 1) Reset only current subject keys in UI
    students.value.forEach(s => {
      const r = rec(s.id)
      r[`${subj}_class_score`] = null
      r[`${subj}_exam_score`] = null
      r[`${subj}_total_score`] = null
      r[`${subj}_grade`] = null
    })

    // 2) Fill from backend
    for (const score of list) {
      // expected: score.studentId, score.classScore, score.examScore
      const r = rec(score.studentId)
      r[`${subj}_class_score`] = score.classScore
      r[`${subj}_exam_score`] = score.examScore
      recalc(score.studentId, subj)
    }

    toast.info(`Loaded saved scores for ${subjectLabel(subj)}`)

  } catch (e) {

    toast.error("Could not preload existing scores")
  }
}

/* ===========================
   (G) ✅ WATCH SUBJECT CHANGES
   WHERE: put this right after preloadSubjectScores()
   =========================== */
watch(subject, async (newSubj) => {
  await preloadSubjectScores(newSubj)
})

/* ===========================
   (H) FILL / CLEAR
   =========================== */
function fillBlanks(subj, classMax = 40, examMax = 50) {
  if (!subj) return

  students.value.forEach(s => {
    const r = rec(s.id)

    if (r[`${subj}_class_score`] == null)
      r[`${subj}_class_score`] = Math.floor(Math.random() * (classMax + 1))

    if (r[`${subj}_exam_score`] == null)
      r[`${subj}_exam_score`] = Math.floor(Math.random() * (examMax + 1))

    recalc(s.id, subj)
  })

  toast.success("Random scores filled")
}

function clearSubject(subj) {
  if (!subj) return

  students.value.forEach(s => {
    const r = rec(s.id)
    r[`${subj}_class_score`] = null
    r[`${subj}_exam_score`] = null
    r[`${subj}_total_score`] = null
    r[`${subj}_grade`] = null
  })

  toast.warning("Cleared")
}

/* ===========================
   (I) COMPUTED
   =========================== */
const completedCount = computed(() => {
  if (!subject.value) return 0
  return students.value.filter(s => isComplete(s.id, subject.value)).length
})

/* ===========================
   (J) PUBLISH (CREATE/UPSERT scores)
   WHERE: this uses create_subject_score_ktor (by-staff endpoint)
   =========================== */
async function confirmPublishAndSend() {
  sending.value = true
  try {
    const subj = subject.value
    if (!subj) {
      toast.error("No subject selected")
      return
    }

    if (!ctx.gradeclassId || !ctx.termId || !ctx.yearId) {
      toast.error("Missing context: class/term/year")
      return
    }

    for (const s of students.value) {
      const r = rec(s.id)
      if (!isComplete(s.id, subj)) continue

      // ✅ Send snake_case keys (works with @JsonNames or @SerialName)
      await create_subject_score_ktor({
        student: s.id,
        subject: subj,
        class_score: r[`${subj}_class_score`],
        exam_score: r[`${subj}_exam_score`]
      })
    }

    toast.success("✅ Published successfully")
    // Reload to show server-calculated positions/grades if needed
    await preloadSubjectScores(subj)

  } catch (err) {

    toast.error("❌ Failed to publish")
  } finally {
    sending.value = false
  }
}

/* ===========================
   (K) INIT
   WHERE: called once on mount
   =========================== */
onMounted(async () => {
  booting.value = true
  try {
    // 1) Load students for teacher
    const ans = await get_teacher_student()
    students.value = ans.data ?? []

    // 2) Load categories
    const { data: categories } = await getCategories_ktor()

    // 3) Load staff user from localStorage
    staff.value = safeJSONParse(localStorage.getItem("user"))
    if (!staff.value?.userId) {
      toast.error("No staff userId found in localStorage")
      return
    }

    // 4) Assigned class
    const userId = staff.value.userId
    const { data } = await assigned_class_ktor(userId)
    const assigned = data?.assignedClass ?? null
    const normalized = normalizeAssignedClass(assigned)

    ctx.gradeclassName = normalized.name
    ctx.gradeclassId = normalized.id

    if (!ctx.gradeclassId) {
      toast.error("No assigned class found for this staff account")
      SUBJECTS.splice(0, SUBJECTS.length)
      subject.value = null
      return
    }

    // 5) Resolve subjects list
    const subs = resolveSubjectsForClass(categories, ctx.gradeclassName)
    SUBJECTS.splice(0, SUBJECTS.length, ...subs)
    subject.value = SUBJECTS[0] ?? null

    // 6) Current term + year
    const { data: t } = await get_terms_with_year_ktor()
    ctx.termId = t?.id ?? null
    ctx.yearId = t?.academic_year?.id ?? null

    currentTerm.value = t?.name ?? null
    currentYear.value = t?.academic_year?.name ?? null

    // ✅ 7) PRELOAD scores for initial subject
    if (subject.value) {
      await preloadSubjectScores(subject.value)
    }

  } catch (err) {

    toast.error("Could not load data")
  } finally {
    booting.value = false
  }
})
</script>

<style scoped>
/* Premium theming */
.premium-bg { background: #f5f7fb; min-height: 100vh; }
.premium-hero { background: linear-gradient(135deg, #673ab7, #3f51b5); border-radius: 16px; }
.premium-avatar { border: 2px solid rgba(255,255,255,0.6); }
.premium-card { border-radius: 18px; }

/* Table redesign */
.marks-table thead th {
  background: #f5f7fb;
  color: #3b3f5c;
  font-weight: 700;
  position: sticky;
  top: 0;
  z-index: 2;
}
.beautiful-table table { border-collapse: separate !important; border-spacing: 0; }
.beautiful-table tbody td, .beautiful-table thead th { border-bottom: 1px solid #eef1f6; }
.beautiful-table tbody tr:hover { background: #fafcff; }
.striped-table tbody tr:nth-child(odd) { background: #fcfdff; }

.marks-table :deep(td), .marks-table :deep(th) { padding: 10px 12px !important; }
.text-right { text-align: right; }
.text-center { text-align: center; }
.text-no-wrap { white-space: nowrap; }
.opacity-80 { opacity: 0.8; }

.cell-input :deep(.v-field__input) { padding: 0 !important; }
</style>
