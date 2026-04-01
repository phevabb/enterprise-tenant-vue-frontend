

<template>
  <v-container fluid class="pa-4 premium-bg">

    <!-- HEADER -->
    <v-card class="pa-4 mb-4 premium-hero">
      <div class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-avatar size="56" class="mr-3">
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
    <v-card class="pa-3 mb-3">
      <div class="d-flex align-center flex-wrap gap-3">
        <v-chip size="small" color="primary">{{ ctx.gradeclassName }}</v-chip>

        <v-select
          v-model="subject"
          :items="SUBJECTS"
          label="Subject"
          density="compact"
          style="max-width:160px"
          :disabled="booting"
        />

        <v-btn
          size="small"
          variant="tonal"
          @click="fillBlanks(subject)"
          :disabled="booting"
        >
          Fill
        </v-btn>

        <v-btn
          size="small"
          variant="tonal"
          color="error"
          @click="clearSubject(subject)"
          :disabled="booting"
        >
          Clear
        </v-btn>
      </div>
    </v-card>

    <!-- TABLE -->
    <v-card class="pa-2">
      <v-table fixed-header height="60vh" density="compact">
        <thead>
          <tr>
            <th>#</th>
            <th>Student</th>
            <th>Class</th>
            <th>Exam</th>
            <th>Total</th>
            <th>Grade</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(stu, i) in students" :key="stu.id">
            <td>{{ i + 1 }}</td>

            <td>
              <strong>{{ stu.full_name }}</strong>
              <div class="text-caption">{{ stu.indexNo }}</div>
            </td>

            <td>
              <v-text-field
                v-model.number="rec(stu.id)[`${subject}_class_score`]"
                type="number"
                density="compact"
                variant="plain"
                @change="recalc(stu.id, subject)"
              />
            </td>

            <td>
              <v-text-field
                v-model.number="rec(stu.id)[`${subject}_exam_score`]"
                type="number"
                density="compact"
                variant="plain"
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

    <!-- PUBLISH FOOTER -->
    <v-card class="pa-3 mt-4">
      <div class="d-flex justify-space-between">
        <div>
          Completed: {{ completedCount }}/{{ students.length }}
        </div>

        <v-btn
          color="success"
          :loading="sending"
          :disabled="sending || completedCount < students.length"
          @click="confirmPublishAndSend"
        >
          Publish ({{ subjectLabel(subject) }})
        </v-btn>
      </div>
    </v-card>

  </v-container>
</template>


<script setup>
import { ref, reactive, computed, onMounted } from "vue"
import { useToast } from "vue-toastification"

import {
  getCategories,
  get_teacher_student,
  publish_subject,
  publish_overall,
  create_subject_score,
  get_terms_with_year
} from "@/services/api"

const toast = useToast()

/* ------------------------------------
   STATE
------------------------------------ */
const SUBJECTS = reactive([])
const subject = ref(null)

const students = ref([])
const staff = ref(null)
const ass_class = ref(null)

const records = reactive({})

const ctx = reactive({
  gradeclassName: "",
  gradeclassId: null,
  termId: null,
  yearId: null
})

const booting = ref(false)
const sending = ref(false)

/* ------------------------------------
   HELPERS
------------------------------------ */
function subjectLabel(key) {
  if (!key) return "—"
  return key.replace(/(^\w|\s\w)/g, m => m.toUpperCase())
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
  const r = rec(id)
  const c = Number(r[`${subj}_class_score`] || 0)
  const e = Number(r[`${subj}_exam_score`] || 0)

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
  const r = rec(id)
  return r[`${subj}_class_score`] != null && r[`${subj}_exam_score`] != null
}

/* ------------------------------------
   FILL & CLEAR
------------------------------------ */
function fillBlanks(subj, classMax = 40, examMax = 50) {
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
  students.value.forEach(s => {
    const r = rec(s.id)
    r[`${subj}_class_score`] = null
    r[`${subj}_exam_score`] = null
    r[`${subj}_total_score`] = null
    r[`${subj}_grade`] = null
  })

  toast.warning("Cleared")
}

/* ------------------------------------
   COMPUTED
------------------------------------ */
const completedCount = computed(() =>
  students.value.filter(s => isComplete(s.id, subject.value)).length
)

/* ------------------------------------
   SUBJECT RESOLUTION
------------------------------------ */
function resolveSubjectsForClass(categories, className) {
  const cls = className.toLowerCase().trim()

  for (const cat of categories) {
    const match = cat.specific_classes.some(
      c => c.name.toLowerCase() === cls
    )
    if (match) {
      return cat.subject_groups.flatMap(g =>
        g.subjects.map(s => s.name)
      )
    }
  }

  return []
}

/* ------------------------------------
   PUBLISH
------------------------------------ */
async function confirmPublishAndSend() {
  sending.value = true
  try {
    const subj = subject.value

    for (const s of students.value) {
      const r = rec(s.id)
      if (!isComplete(s.id, subj)) continue

      await create_subject_score({
        student: s.id,
        subject: subj,
        class_score: r[`${subj}_class_score`],
        exam_score: r[`${subj}_exam_score`]
      })
    }

    await publish_subject({
      class_level: ass_class.value,
      academic_year: ctx.yearId,
      subject: subject.value
    })

    await publish_overall({
      class_level: ass_class.value,
      academic_year: ctx.yearId,
      term: ctx.termId
    })

    toast.success("✅ Published successfully")
  } catch {
    toast.error("❌ Failed to publish")
  } finally {
    sending.value = false
  }
}

/* ------------------------------------
   INIT
------------------------------------ */
onMounted(async () => {
  booting.value = true
  try {
    // Load categories + subjects
    const { data: categories } = await getCategories()


    staff.value = JSON.parse(localStorage.getItem("staff"))
    ass_class.value = staff.value?.assigned_class

    ctx.gradeclassName = ass_class.value

    const subs = resolveSubjectsForClass(categories, ass_class.value)
    SUBJECTS.splice(0, SUBJECTS.length, ...subs)
    subject.value = SUBJECTS[0]

    // Load term + year
    const { data: t } = await get_terms_with_year()
    ctx.termId = t.id
    ctx.yearId = t.academic_year_id

    // Load students
    const ans = await get_teacher_student()
    students.value = ans.data

  } catch (err) {

    toast.error("Could not load data")
  } finally {
    booting.value = false
  }
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


.premium-bg { background: #f5f7fb; min-height: 100vh; }
.premium-hero { background: linear-gradient(135deg, #673ab7, #3f51b5); }
.opacity-80 { opacity: 0.8; }

</style>
