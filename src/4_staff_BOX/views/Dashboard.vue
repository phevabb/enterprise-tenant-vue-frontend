

<template>
  <v-container fluid class="pa-4 premium-bg">
    <!-- Header -->
    <v-card class="pa-4 mb-4 premium-hero" elevation="10">
      <div class="d-flex align-center justify-space-between flex-wrap">
        <div class="d-flex align-center">
          <v-avatar size="64" class="mr-4 premium-avatar">
            <v-icon size="36" color="white">mdi-file-table-box-multiple</v-icon>
          </v-avatar>
          <div>
            <div class="text-h6 text-white font-weight-bold">Teachers’ Academic Records</div>
            <div class="text-body-2 text-white opacity-80">
              Enter class & exam scores per subject — totals, grades & interpretations compute automatically
            </div>
          </div>
        </div>

        <div class="d-flex align-center mt-3 mt-sm-0">
          <v-chip
            color="white"
            text-color="white"
            class="mr-2"
            size="small"
            prepend-icon="mdi-cloud-check-outline"
          >
            Auto‑save: {{ autoSave ? 'On' : 'Off' }}
          </v-chip>
        </div>
      </div>
    </v-card>

    <v-row>
      <v-col cols="12">
        <v-card class="pa-3 premium-card" elevation="6">

          <!-- TOP BAR: Context + Controls -->
          <div class="d-flex flex-wrap align-center justify-space-between mb-2">
            <div class="d-flex flex-wrap align-center">
              <v-chip size="x-small" color="primary" class="mr-1 mb-1">
                {{ ctx.year || '—' }}
              </v-chip>
              <v-chip size="x-small" color="primary" class="mr-1 mb-1">
                {{ ctx.term || '—' }}
              </v-chip>
              <v-chip size="x-small" color="primary" class="mr-2 mb-1">
                {{ ctx.gradeclassName || ctx.gradeclassId || '—' }}
              </v-chip>

              <v-chip size="x-small" color="secondary" class="mr-1 mb-1">
                {{ subjectLabel(subject) }}
              </v-chip>
            </div>

            <div class="d-flex flex-wrap align-center">
              <v-select
                v-model="subject"
                :items="SUBJECTS"
                density="compact"
                variant="solo-filled"
                hide-details
                style="max-width: 150px"
                class="mr-2 mb-1"
                :disabled="booting"
              />

              <v-text-field
                v-model="search"
                density="compact"
                variant="solo-filled"
                hide-details
                prepend-inner-icon="mdi-magnify"
                style="max-width: 180px"
                class="mr-2 mb-1"
                :disabled="booting"
              />
            </div>
          </div>

          <!-- Scheme Info -->
          <div class="d-flex flex-wrap align-center mb-2">
            <v-chip size="x-small" class="mr-1">C: {{ scheme[subject].classMax }}</v-chip>
            <v-chip size="x-small" class="mr-1">E: {{ scheme[subject].examMax }}</v-chip>
            <v-chip size="x-small" color="info">
              Total: {{ scheme[subject].classMax + scheme[subject].examMax }}
            </v-chip>
          </div>

          <v-progress-linear v-if="booting" indeterminate class="mb-2" />
          <v-divider class="mb-2" />

          <!-- KPIs -->
          <v-row dense class="mb-2">
            <v-col cols="6" md="3">
              <v-card class="pa-2 kpi-card gradient-1" elevation="4">
                <div class="text-caption text-white">Completion</div>
                <div class="text-subtitle-1 text-white">{{ completionRate }}%</div>
              </v-card>
            </v-col>

            <v-col cols="6" md="3">
              <v-card class="pa-2 kpi-card gradient-2" elevation="4">
                <div class="text-caption text-white">Average</div>
                <div class="text-subtitle-1 text-white">{{ subjectAverage.toFixed(1) }}</div>
              </v-card>
            </v-col>

            <v-col cols="6" md="3">
              <v-card class="pa-2 kpi-card gradient-3" elevation="4">
                <div class="text-caption text-white">Highest</div>
                <div class="text-subtitle-1 text-white">{{ subjectMax.score.toFixed(1) }}</div>
              </v-card>
            </v-col>

            <v-col cols="6" md="3">
              <v-card class="pa-2 kpi-card gradient-4" elevation="4">
                <div class="text-caption text-white">Lowest</div>
                <div class="text-subtitle-1 text-white">{{ subjectMin.score.toFixed(1) }}</div>
              </v-card>
            </v-col>
          </v-row>

          <v-divider class="mb-2" />

          <!-- TABLE HEADER ACTIONS -->
          <div class="d-flex flex-wrap justify-space-between align-center mb-2">
            <div class="text-subtitle-2 font-weight-bold">Marks Entry</div>

            <div class="d-flex flex-wrap">
              <v-btn
                size="x-small"
                class="mr-1 mb-1"
                variant="tonal"
                @click="fillBlanks(subject, 40, 50)"
                :disabled="booting"
              >
                Fill
              </v-btn>

              <v-btn
                size="x-small"
                class="mr-1 mb-1"
                variant="tonal"
                color="error"
                @click="clearSubject(subject)"
                :disabled="booting"
              >
                Clear
              </v-btn>
            </div>
          </div>

          <!-- MAIN TABLE -->
          <v-table
            fixed-header
            height="60vh"
            density="compact"
            class="marks-table striped-table beautiful-table"
          >
            <thead>
              <tr>
                <th style="width: 48px;">#</th>
                <th>Student</th>
                <th class="text-left">Class (50)</th>
                <th class="text-left">Exam (50)</th>
                <th class="text-right">Total(100)</th>
                <th class="text-center">Grade</th>
                <th class="text-center">Status</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="(stu, i) in filteredStudents" :key="stu.id">
                <td class="text-medium-emphasis">{{ i + 1 }}</td>

                <td>
                  <div class="d-flex align-center">
                    <v-avatar size="26" class="mr-2" color="indigo">
                      <span class="text-white text-caption">{{ initials(stu.full_name) }}</span>
                    </v-avatar>
                    <div>
                      <div class="text-body-2">{{ stu.full_name }}</div>
                      <div class="text-caption text-disabled">{{ stu.indexNo }}</div>
                    </div>
                  </div>
                </td>

                <td class="text-left">
                  <v-text-field
                    v-model.number="rec(stu.id)[`${subject}_class_score`]"
                    density="compact"
                    variant="plain"
                    type="number"
                    hide-details
                    :min="0"
                    :max="scheme[subject].classMax"
                    :step="1"
                    @change="recalc(stu.id, subject)"
                    @blur="autoSaveDraft"
                    :disabled="booting"
                    class="cell-input"
                  />
                </td>

                <td class="text-left">
                  <v-text-field
                    v-model.number="rec(stu.id)[`${subject}_exam_score`]"
                    density="compact"
                    variant="plain"
                    type="number"
                    hide-details
                    :min="0"
                    :max="scheme[subject].examMax"
                    :step="1"
                    @change="recalc(stu.id, subject)"
                    @blur="autoSaveDraft"
                    :disabled="booting"
                    class="cell-input"
                  />
                </td>

                <td class="text-right">
                  {{
                    rec(stu.id)[`${subject}_total_score`] == null
                      ? '—'
                      : Number(rec(stu.id)[`${subject}_total_score`]).toFixed(0)
                  }}
                </td>

                <td class="text-center">
                  {{ rec(stu.id)[`${subject}_grade`] || '—' }}
                </td>

                <td class="text-center">
                  <v-chip
                    size="x-small"
                    :color="isComplete(stu.id, subject) ? 'success' : 'grey'"
                  >
                    {{ isComplete(stu.id, subject) ? 'Done' : 'Pending' }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>

          <v-divider class="my-2" />

          <!-- FOOTER -->
          <div class="d-flex flex-wrap justify-space-between align-center">
            <div class="text-caption">
              Total = {{ scheme[subject].classMax + scheme[subject].examMax }}
            </div>

            <div class="d-flex">
              <v-btn
                size="small"
                color="success"
                @click="publishDialog = true"
                :disabled="completionRate < 60 || booting"
              >
                Publish ({{ subjectLabel(subject) }})
              </v-btn>
            </div>
          </div>

        </v-card>
      </v-col>
    </v-row>

    <!-- Publish Dialog -->
    <v-dialog v-model="publishDialog" max-width="540">
      <v-card>
        <v-card-title class="font-weight-bold">Publish Results?</v-card-title>
        <v-divider />
        <v-card-text>
          <v-alert type="warning" variant="tonal" border="start" class="mb-3">
            Publishing will mark this subject as published for this class, year & term,
            but entries remain editable.
          </v-alert>
          <ul class="mt-2">
            <li>{{ completedCount }}/{{ filteredStudents.length }} complete</li>
            <li>Subject average: {{ subjectAverage.toFixed(1) }}</li>
            <li>Class: {{ ctx.gradeclassName }}</li>
          </ul>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="tonal" @click="publishDialog = false">Cancel</v-btn>
          <v-btn
            color="success"
            :loading="sending"
            :disabled="sending"
            @click="confirmPublishAndSend"
          >
            <v-icon start>mdi-check-decagram</v-icon>Publish
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snack.show" :timeout="2200" :color="snack.color" rounded="pill">
      <v-icon start>mdi-check-circle</v-icon>{{ snack.text }}
    </v-snackbar>
  </v-container>
</template>




<script setup>
import { useToast } from "vue-toastification"

import {  computed, onMounted, reactive, ref, watch } from "vue"
import { publish_subject, publish_overall, get_terms_with_year, get_teacher_student, create_subject_score } from "@/services/api"

/* ---------------------------------------
   CONSTANTS
--------------------------------------- */
const toast = useToast()

const SUBJECTS = [
  "english", "maths", "science", "rme",
  "ict", "history", "fante", "creativearts"
]

const GRADE_TO_TEXT = {
  A: "Excellent",
  B: "Very Good",
  C: "Good",
  D: "Credit",
  E: "Pass"
}

/* ---------------------------------------
   STATE
--------------------------------------- */
const ctx = reactive({
  year: "",
  yearId: null,
  term: "",
  termId: null,
  gradeclassId: "",
  gradeclassName: "",
})

const subject = ref("english")
const search = ref("")
const staff = ref(null)
const ass_class = ref(null)

const scheme = reactive(
  Object.fromEntries(SUBJECTS.map(s => [s, { classMax: 50, examMax: 50 }]))
)

const published = ref(false)
const autoSave = ref(true)
const saving = ref(false)
const sending = ref(false)
const booting = ref(false)

const schemeDialog = ref(false)
const schemeWorking = ref({ classMax: 50, examMax: 50 })

const recordsByCtx = reactive({})
const classMeta = reactive({
  attendance: 0,
  number_on_roll: 0,
  teacher_remarks: "",
  head_teacher_remarks: "",
  next_term_begins: "",
})

const publishDialog = ref(false)
const snack = reactive({ show: false, text: "", color: "success" })

const importDialog = ref(false)
const csvText = ref("")

const studentsFromApi = ref([])

/* ---------------------------------------
   COMPUTED
--------------------------------------- */
const students = computed(() => studentsFromApi.value || [])

const ctxKey = computed(
  () => `${ctx.yearId}|${ctx.termId}|${ctx.gradeclassId}`
)

function currentRecordsBucket() {
  if (!recordsByCtx[ctxKey.value]) recordsByCtx[ctxKey.value] = {}
  return recordsByCtx[ctxKey.value]
}

const filteredStudents = computed(() => {
  if (!search.value) return students.value
  const q = search.value.toLowerCase()
  return students.value.filter(s =>
    s.full_name.toLowerCase().includes(q) ||
    s.indexNo.toLowerCase().includes(q)
  )
})

/* KPIs */
const completedCount = computed(() =>
  filteredStudents.value.filter(s => isComplete(s.id, subject.value)).length
)

const completionRate = computed(() =>
  filteredStudents.value.length
    ? Math.round((completedCount.value / filteredStudents.value.length) * 100)
    : 0
)

const subjectAverage = computed(() => {
  const vals = filteredStudents.value
    .map(s => rec(s.id)[`${subject.value}_total_score`] ?? NaN)
    .filter(v => !isNaN(v))
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
})

const subjectMax = computed(() => {
  let best = { score: -1, holder: "—" }
  filteredStudents.value.forEach(s => {
    const sc = rec(s.id)[`${subject.value}_total_score`] ?? 0
    if (sc > best.score) best = { score: sc, holder: s.full_name }
  })
  return best
})

const subjectMin = computed(() => {
  let worst = { score: 101, holder: "—" }
  filteredStudents.value.forEach(s => {
    const sc = rec(s.id)[`${subject.value}_total_score`] ?? 0
    if (sc < worst.score) worst = { score: sc, holder: s.full_name }
  })
  return worst
})

/* ---------------------------------------
   HELPERS
--------------------------------------- */
function subjectLabel(key) {
  const map = {
    english: "English", maths: "Maths", science: "Science",
    rme: "RME", ict: "ICT", history: "History",
    fante: "Fante", creativearts: "Creative Arts"
  }
  return map[key] || key
}

function initials(name = "") {
  return name.split(" ").map(n => n[0]).join("").toUpperCase()
}

function rec(studentId) {
  const bucket = currentRecordsBucket()
  bucket[studentId] ||= {
    student: studentId,
    academic_record_id: null,

    term: ctx.termId,
    academic_year: ctx.yearId,
    gradeclass: ctx.gradeclassId,

    attendance: 0,
    number_on_roll: 0,
    attitude: "",
    interest: "",
    teacher_remarks: "",
    head_teacher_remarks: "",
    next_term_begins: "",
    position: "",
    conduct: "",
    interpretation: "",

    ...Object.fromEntries(
      SUBJECTS.flatMap(s => ([
        [`${s}_class_score`, null],
        [`${s}_exam_score`, null],
        [`${s}_total_score`, null],
        [`${s}_grade`, null],
        [`${s}_interpretation`, null],
      ]))
    ),
  }
  return bucket[studentId]
}

function isValidRange(v, min, max) {
  if (v === null || v === "") return true
  const n = Number(v)
  return !isNaN(n) && n >= min && n <= max
}

function computeGrade(total) {
  if (total >= 85) return "A"
  if (total >= 70) return "B"
  if (total >= 50) return "C"
  if (total >= 30) return "D"
  return "E"
}

function isComplete(id, subj) {
  const r = rec(id)
  const c = r[`${subj}_class_score`]
  const e = r[`${subj}_exam_score`]
  return (
    c !== null &&
    e !== null &&
    isValidRange(c, 0, scheme[subj].classMax) &&
    isValidRange(e, 0, scheme[subj].examMax)
  )
}

function recalc(id, subj) {
  const r = rec(id)
  const c = Number(r[`${subj}_class_score`] || 0)
  const e = Number(r[`${subj}_exam_score`] || 0)

  if (r[`${subj}_class_score`] == null && r[`${subj}_exam_score`] == null) {
    r[`${subj}_total_score`] = null
    r[`${subj}_grade`] = null
    r[`${subj}_interpretation`] = null
    return
  }

  const total = c + e
  r[`${subj}_total_score`] = total
  const g = computeGrade(total)
  r[`${subj}_grade`] = g
  r[`${subj}_interpretation`] = GRADE_TO_TEXT[g]
}

function clearSubject(subj) {
  filteredStudents.value.forEach(s => {
    const r = rec(s.id)
    r[`${subj}_class_score`] = null
    r[`${subj}_exam_score`] = null
    r[`${subj}_total_score`] = null
    r[`${subj}_grade`] = null
    r[`${subj}_interpretation`] = null
  })
  toast("Cleared", "warning")
  autoSaveDraft()
}

function fillBlanks(subj, classDefault = 20, examDefault = 40) {
  filteredStudents.value.forEach(s => {
    const r = rec(s.id)
    if (r[`${subj}_class_score`] == null)
      r[`${subj}_class_score`] = classDefault
    if (r[`${subj}_exam_score`] == null)
      r[`${subj}_exam_score`] = examDefault
    recalc(s.id, subj)
  })
  toast("Filled blanks", "success")
  autoSaveDraft()
}

/* ---------------------------------------
   SAVE TO BACKEND
--------------------------------------- */
async function submitScores() {
  sending.value = true

  try {
    let saved = 0
    const subj = subject.value

    for (const stu of filteredStudents.value) {
      const r = rec(stu.id)

      if (
        r[`${subj}_class_score`] == null &&
        r[`${subj}_exam_score`] == null
      ) continue

      const payload = {
        student: stu.id,
        subject: subj,
        class_score: r[`${subj}_class_score`],
        exam_score: r[`${subj}_exam_score`],
      }

      await create_subject_score(payload)
      saved++
    }


    return true

  } catch (err) {
    toast.error("❌ Failed to submit scores")

    return false

  } finally {
    sending.value = false
  }
}

async function confirmPublishAndSend() {
  sending.value = true;

  try {
    // 1. Save Scores
    const ok = await submitScores();
    if (!ok) {
      toast.error("❌ Failed saving student scores");
      return;
    }





    // ✅ DEBUG CHECK


    // 2. Publish subject ranking
    await publish_subject({
      class_level: ass_class.value,  // ← USE ASSIGNED CLASS
      academic_year: ctx.yearId,
      subject: subject.value,
    });

    // ✅ DEBUG CHECK


    // 3. Publish overall ranking
    await publish_overall({
      class_level: ass_class.value,
      academic_year: ctx.yearId,
      term: ctx.termId,
    });

    // 4. Update UI
    toast.success("✅ Subject & Overall Rankings Published!");
    publishDialog.value = false;
    published.value = true;

  } catch (err) {

    toast.error("❌ Failed to publish rankings");
  } finally {
    sending.value = false;
  }
}
/* ---------------------------------------
   LOCAL STORAGE
--------------------------------------- */
const LS_KEY = "acad_records_demo_v1"

function saveDraft() {
  saving.value = true
  localStorage.setItem(
    LS_KEY,
    JSON.stringify({
      ctx,
      recordsByCtx,
      scheme,
      classMeta,
      published: published.value,
    })
  )
  setTimeout(() => (saving.value = false), 300)
}

function autoSaveDraft() {
  if (autoSave.value) saveDraft()
}

function restoreDraft() {
  const raw = localStorage.getItem(LS_KEY)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw)
    published.value = parsed.published
    Object.assign(classMeta, parsed.classMeta)
    for (const s of SUBJECTS)
      if (parsed.scheme[s]) scheme[s] = parsed.scheme[s]
    Object.assign(recordsByCtx, parsed.recordsByCtx)
  } catch {}
}

/* ---------------------------------------
   STUDENTS / CTX LOAD
--------------------------------------- */
function normalizeStudent(raw) {
  return {
    id: raw.id,
    indexNo: String(raw.indexNo ?? ""),
    full_name: raw.full_name,
  }
}

async function hydrateCtxFromApi() {
  // ✅ Fetch class from staff local storage
  const staffString = localStorage.getItem('staff')
  if (staffString) {
    const s = JSON.parse(staffString)
    staff.value = s

    // ✅ Correct: use staff assigned class
    ctx.gradeclassId = s.assigned_class_id
    ctx.gradeclassName = s.assigned_class


  } else {

  }

  // ✅ Load current term + year
  const trm = await get_terms_with_year()
  const t = trm?.data ?? trm

  ctx.termId = t.id
  ctx.term = t.name
  ctx.yearId = t.academic_year_id
  ctx.year = t.academic_year
}


async function loadTeacherStudents() {
  const ans = await get_teacher_student()
  const list = ans.data.map(normalizeStudent)
  studentsFromApi.value = list

  // ✅ Detect the class from first student
  if (list.length > 0) {
    ctx.gradeclassId = list[0].class_level_id   // ← ADD THIS
    ctx.gradeclassName = list[0].class_level_name
  }
}

function initStudentsState() {
  studentsFromApi.value.forEach(s => rec(s.id))
}

function pruneStaleRecords() {
  const ids = new Set(studentsFromApi.value.map(s => String(s.id)))
  const buck = currentRecordsBucket()
  for (const k of Object.keys(buck))
    if (!ids.has(String(k))) delete buck[k]
}

/* ---------------------------------------
   LIFECYCLE
--------------------------------------- */
onMounted(async () => {


const staffString = localStorage.getItem('staff')

const staff = JSON.parse(staffString)


ass_class.value = staff.assigned_class



  booting.value = true
  try {
    await hydrateCtxFromApi()
    await loadTeacherStudents()
    initStudentsState()
    pruneStaleRecords()
    restoreDraft()
    currentRecordsBucket()
  } catch {
    toast.error("Could not load students")
  } finally {
    booting.value = false
  }
})

watch(ctxKey, () => {
  initStudentsState()
  pruneStaleRecords()
})

watch(studentsFromApi, () => {
  initStudentsState()
  pruneStaleRecords()
})

</script>



<style scoped>
/* Premium theming similar to enterprise dashboards */
.premium-bg { background: linear-gradient(135deg, #eaecf0 0%, #dae4f3 40%, #a0b4c6 100%); min-height: 100vh; }
.premium-hero { background: linear-gradient(135deg, rgba(103,58,183,0.82) 0%, rgba(33,150,243,0.82) 100%); border: 1px solid rgba(255,255,255,0.12); backdrop-filter: blur(4px); }
.premium-avatar { border: 2px solid rgba(255,255,255,0.6); }
.premium-card { border-radius: 18px; border: 1px solid rgba(232, 225, 225, 0.06); background: rgba(255,255,255,0.98); }

/* KPI Cards */
.kpi-card { border-radius: 14px; color: white; }
.gradient-1 { background: linear-gradient(135deg, #1de9b6, #1dc4e9); }
.gradient-2 { background: linear-gradient(135deg, #ff8a65, #ff5252); }
.gradient-3 { background: linear-gradient(135deg, #9ccc65, #43a047); }
.gradient-4 { background: linear-gradient(135deg, #ffd54f, #ffa000); }

/* Table redesign */
.marks-table thead th {
  background: #f5f7fb;
  color: #3b3f5c;
  font-weight: 700;
  position: sticky;
  top: 0;
  z-index: 2;
}
.beautiful-table table {
  border-collapse: separate !important;
  border-spacing: 0;
}
.beautiful-table tbody td, .beautiful-table thead th {
  border-bottom: 1px solid #eef1f6;
}
.beautiful-table tbody tr:hover {
  background: #fafcff;
}

/* Stripes */
.striped-table tbody tr:nth-child(odd) {
  background: #fcfdff;
}

/* Compact cell paddings */
.marks-table :deep(td), .marks-table :deep(th) {
  padding: 10px 12px !important;
}

/* Right/center helpers */
.text-right { text-align: right; }
.text-center { text-align: center; }

/* Input appearance inside cells */
.cell-input :deep(.v-field__input) {
  padding: 0 !important;
}

/* Validity backgrounds (keep blue text) */
.score-error input {
  background-color: #fff6f6;
  box-shadow: inset 0 0 0 1px rgba(239, 225, 225, 0.25);
  border-radius: 6px;
}
.score-ok input {
  background-color: #f6fff6;
  box-shadow: inset 0 0 0 1px rgba(67,160,71,0.25);
  border-radius: 6px;
}

.opacity-80 { opacity: 0.8; }
.text-no-wrap { white-space: nowrap; }
.text-disabled { color: rgba(0,0,0,0.45); }
</style>
