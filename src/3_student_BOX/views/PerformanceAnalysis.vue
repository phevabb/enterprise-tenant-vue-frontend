<template>
  <CContainer fluid class="py-4 parent-bg">

    <!-- ✅ HEADER -->
    <CCard class="parent-hero shadow-lg border-0 mb-4">
      <CCardBody>
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">

          <div class="d-flex align-items-center">
            <CAvatar size="lg" class="me-3 parent-avatar">
              <i class="cil-user text-white fs-3"></i>
            </CAvatar>

            <div>
              <h2 class="fw-bold text-white mb-0">{{ student.name || "—" }}</h2>
              <div class="text-white-50">
                Performance Overview For
                <b class="text-white">{{ headerTermLabel }}</b>
                <span class="text-white-50"> / </span>
                <b class="text-white">{{ headerYearLabel }}</b>
              </div>
            </div>
          </div>

          <!-- ✅ FILTERS (Year + Term dropdowns) -->
          <div class="d-flex gap-2 align-items-center flex-wrap">
            <CFormSelect
              v-model="selectedYear"
              class="filter-select"
              :disabled="loadingMeta || loadingChart"
            >
              <option value="" disabled>Select Year</option>
              <option v-for="y in years" :key="y.id" :value="String(y.id)">
                {{ y.name }}
              </option>
            </CFormSelect>

            <CFormSelect
              v-model="selectedTerm"
              class="filter-select"
              :disabled="!selectedYear || loadingMeta || loadingChart"
            >
              <option value="" disabled>Select Term</option>
              <option v-for="t in filteredTerms" :key="t.id" :value="String(t.id)">
                {{ t.name }}
              </option>
            </CFormSelect>

            <CButton
              color="light"
              class="ms-1"
              :disabled="loadingChart || !selectedYear || !selectedTerm"
              @click="loadChartData"
            >
              {{ loadingChart ? "Loading..." : "Load" }}
            </CButton>
          </div>

        </div>
      </CCardBody>
    </CCard>

    <!-- ✅ INFO CARDS -->
    <CRow class="mb-4">
      <CCol md="4">
        <CCard class="shadow-sm info-card">
          <CCardBody>
            <div class="small text-muted">Class</div>
            <div class="fs-4 fw-bold">{{ student.class || "—" }}</div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md="4">
        <CCard class="shadow-sm info-card">
          <CCardBody>
            <div class="small text-muted">Overall Position</div>
            <div class="fs-4 fw-bold">{{ student.position ?? "—" }}</div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md="4">
        <CCard class="shadow-sm info-card">
          <CCardBody>
            <div class="small text-muted">Raw Total</div>
            <div class="fs-4 fw-bold">{{ classAvg }}</div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>

    <!-- ✅ PERFORMANCE CHART -->
    <CCard class="shadow parent-card mb-4">
      <CCardBody>
        <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
          <h4 class="fw-bold mb-0 text-primary">Performance Chart</h4>
          <small class="text-muted">
            Click any point to view subject details
          </small>
        </div>

        <div v-if="loadingChart" class="text-center text-muted py-5">
          Loading chart...
        </div>

        <div v-else-if="!subjects.length" class="text-center text-muted py-5">
          No subject scores found for the selected year/term.
        </div>

        <div v-else style="height: 360px;">
          <canvas ref="chartCanvas"></canvas>
        </div>
      </CCardBody>
    </CCard>

    <!-- ✅ SUBJECT DETAILS DRAWER -->
    <COffcanvas
      placement="end"
      :visible="drawer"
      @hide="drawer=false"
      class="subject-offcanvas shadow-lg"
    >
      <CCardBody v-if="activeSubject">

        <div class="d-flex justify-content-between mb-3">
          <h4 class="fw-bold mb-0">{{ activeSubject.name }}</h4>

          <CButton color="light" class="rounded-circle" @click="drawer=false">
            <i class="cil-x fs-4"></i>
          </CButton>
        </div>

        <CCard class="shadow-sm border-0 p-3 mt-2 info-mini">
          <div class="d-flex justify-content-between">
            <span>Score</span>
            <b>{{ activeSubject.score }}%</b>
          </div>

          <div class="d-flex justify-content-between">
            <span>Best</span>
            <b>{{ activeSubject.best }}%</b>
          </div>

          <div class="d-flex justify-content-between">
            <span>Average</span>
            <b>{{ activeSubject.average }}%</b>
          </div>

          <div class="d-flex justify-content-between">
            <span>Worst</span>
            <b>{{ activeSubject.worst }}%</b>
          </div>
        </CCard>

      </CCardBody>
    </COffcanvas>

  </CContainer>
</template>

<script setup>
/* =========================
   (1) IMPORTS — TOP OF FILE
   ========================= */
import { ref, computed, onMounted, watch, nextTick } from "vue"
import { useRoute } from "vue-router"
import Chart from "chart.js/auto"
import { useToast } from "vue-toastification"

import {
  getPerformanceChart_ktor,
  getCategories_ktor,
  get_terms_with_year_ktor,   // /api/term/current
  get_all_terms_ktor,         // /api/terms
  get_all_years_ktor          // /api/academic-years
} from "@/services/api"

const toast = useToast()
const route = useRoute()

/* =========================
   (2) STATE
   ========================= */
const student = ref({ name: "", class: "", position: null })
const classAvg = ref(0)

const subjects = ref([])

const years = ref([]) // [{id,name}]
const terms = ref([]) // [{id,name, academic_year:{id,name}}]

const selectedYear = ref("") // store as string for CFormSelect
const selectedTerm = ref("")

const categoriesCache = ref([])

const chartCanvas = ref(null)
let chartInstance = null

const activeSubject = ref(null)
const drawer = ref(false)

const loadingMeta = ref(false)
const loadingChart = ref(false)

/* =========================
   (3) HELPERS
   ========================= */
function resolveStudentProfileId() {
  // Prefer query ?student=312 or route param /:studentId
  const qp = route.query.student || route.query.studentId
  const rp = route.params.studentId
  if (qp) return Number(qp)
  if (rp) return Number(rp)

  // Fallbacks (only if you stored it)
  const storedStudentId = localStorage.getItem("studentId")
  if (storedStudentId) return Number(storedStudentId)

  // Last fallback
  const u = JSON.parse(localStorage.getItem("user") || "null")
  return Number(u?.studentId ?? u?.studentProfileId ?? u?.id)
}

function titleCase(s) {
  return String(s || "").replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * Categories structure (Ktor):
 * cat.specific_classes: ["class 1"] or [{id,name}]
 * cat.subjects: ["English Language", ...] or [{id,name}]
 */
function resolveAllowedSubjectsForClass(className) {
  const cls = String(className || "").trim().toLowerCase()
  if (!cls) return []

  for (const cat of categoriesCache.value) {
    const specific = Array.isArray(cat?.specific_classes) ? cat.specific_classes : []
    const match = specific.some(c => {
      const cname = typeof c === "string" ? c : (c?.name || "")
      return String(cname).trim().toLowerCase() === cls
    })

    if (match) {
      const subs = Array.isArray(cat?.subjects) ? cat.subjects : []
      return subs
        .map(s => (typeof s === "string" ? s : (s?.name || "")))
        .map(s => String(s).trim().toLowerCase())
        .filter(Boolean)
    }
  }

  return []
}

/* =========================
   (4) COMPUTED — dropdown terms filtered by year
   ========================= */
const filteredTerms = computed(() => {
  if (!selectedYear.value) return []
  const y = Number(selectedYear.value)
  return (terms.value || []).filter(t => Number(t?.academic_year?.id) === y)
})

const headerYearLabel = computed(() => {
  const y = years.value.find(x => String(x.id) === String(selectedYear.value))
  return y?.name || "—"
})

const headerTermLabel = computed(() => {
  const t = terms.value.find(x => String(x.id) === String(selectedTerm.value))
  return t?.name || "—"
})

/* =========================
   (5) LOAD META (years/terms/categories + default current)
   ========================= */
async function loadMeta() {
  loadingMeta.value = true
  try {
    const [yearsRes, termsRes, catsRes] = await Promise.all([
      get_all_years_ktor(),
      get_all_terms_ktor(),
      getCategories_ktor()
    ])

    years.value = Array.isArray(yearsRes.data) ? yearsRes.data : []
    terms.value = Array.isArray(termsRes.data) ? termsRes.data : []
    categoriesCache.value = Array.isArray(catsRes.data) ? catsRes.data : []

    // default: current term/year
    const cur = await get_terms_with_year_ktor()
    const t = cur.data

    selectedYear.value = t?.academic_year?.id ? String(t.academic_year.id) : ""
    selectedTerm.value = t?.id ? String(t.id) : ""

  } catch (e) {

    toast.error("Failed to load years/terms")
  } finally {
    loadingMeta.value = false
  }
}

/* =========================
   (6) LOAD CHART DATA from backend
   ========================= */
async function loadChartData() {
  const studentId = resolveStudentProfileId()
  const yearId = Number(selectedYear.value)
  const termId = Number(selectedTerm.value)

  if (!studentId || !yearId || !termId) return

  loadingChart.value = true

  try {
    const res = await getPerformanceChart_ktor(studentId, yearId, termId)
    const record = res.data
    if (!record) {
      subjects.value = []
      // ✅ if chart exists, destroy it
      if (chartInstance) {
        chartInstance.destroy()
        chartInstance = null
      }
      return
    }

    // ✅ Populate info cards
    student.value = {
      name: record.student,
      class: record.class,
      position: record.position
    }

    classAvg.value = record.classAvg ?? 0

    // ✅ Filter subjects (optional)
    const allowed = resolveAllowedSubjectsForClass(record.class)
    const incoming = Array.isArray(record.subjects) ? record.subjects : []

    subjects.value = allowed.length
      ? incoming.filter(s => allowed.includes(String(s.name).trim().toLowerCase()))
      : incoming

  } catch (err) {

    toast.error(err?.response?.data?.detail || "Could not load performance chart")
    subjects.value = []
  } finally {
    // ✅ IMPORTANT: make canvas visible first
    loadingChart.value = false

    // ✅ Wait for DOM to render the canvas (because of v-if/v-else)
    await nextTick()

    // ✅ Render only if we actually have subjects
    if (subjects.value.length) {
      renderChart()
    } else {
      // ✅ no data: destroy old chart if any
      if (chartInstance) {
        chartInstance.destroy()
        chartInstance = null
      }
    }
  }
}

/* =========================
   (7) RENDER CHART
   ========================= */
function renderChart() {
  if (!chartCanvas.value) return
  if (chartInstance) chartInstance.destroy()

  const labels = subjects.value.map(s => s.name)
  const studentScores = subjects.value.map(s => s.score)
  const bestScores = subjects.value.map(s => s.best)
  const avgScores = subjects.value.map(s => s.average)
  const worstScores = subjects.value.map(s => s.worst)

  chartInstance = new Chart(chartCanvas.value, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Student",
          data: studentScores,
          borderColor: "#FFD000",
          backgroundColor: "#FFD000",
          borderWidth: 4,
          tension: 0.25,
          pointRadius: 6,
        },
        {
          label: "Best",
          data: bestScores,
          borderColor: "#004CFF",
          borderWidth: 3,
          borderDash: [6, 4],
          tension: 0.25,
          pointRadius: 5,
        },
        {
          label: "Average",
          data: avgScores,
          borderColor: "#8B4513",
          borderWidth: 3,
          borderDash: [6, 4],
          tension: 0.25,
          pointRadius: 5,
        },
        {
          label: "Worst",
          data: worstScores,
          borderColor: "#FF1E1E",
          borderWidth: 3,
          tension: 0.25,
          pointRadius: 5,
        },
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
      scales: { y: { suggestedMin: 0, suggestedMax: 100 } },
      // ✅ click a point to open drawer
      onClick: (_, elements) => {
        if (!elements?.length) return
        const idx = elements[0].index
        openSubject(subjects.value[idx])
      }
    }
  })
}

/* =========================
   (8) Drawer
   ========================= */
function openSubject(sub) {
  if (!sub) return
  activeSubject.value = {
    name: titleCase(sub.name),
    score: sub.score,
    best: sub.best,
    average: sub.average,
    worst: sub.worst
  }
  drawer.value = true
}

/* =========================
   (9) WATCHERS
   - when year changes, reset term to first term in that year
   - when term changes, load chart
   ========================= */
watch(selectedYear, (newVal) => {
  if (!newVal) return
  const list = filteredTerms.value
  selectedTerm.value = list.length ? String(list[0].id) : ""
})

watch([selectedYear, selectedTerm], () => {
  if (selectedYear.value && selectedTerm.value) loadChartData()
})

/* =========================
   (10) MOUNT
   ========================= */
onMounted(async () => {
  await loadMeta()
  if (selectedYear.value && selectedTerm.value) {
    await loadChartData()
  }
})
</script>




<style scoped>
.parent-bg {
  background: #eef2f8;
  min-height: 100vh;
}

.parent-hero {
  background: linear-gradient(135deg, #6a4eff, #4b79ff);
  border-radius: 20px;
}

.parent-avatar {
  background: rgba(255,255,255,0.28);
}

.info-card {
  border-radius: 14px;
}

.parent-card {
  border-radius: 18px;
}

.subject-offcanvas {
  width: 380px !important;
  background: #fbfbff;
}

.info-mini {
  border-radius: 12px;
}

.filter-select {
  min-width: 180px;
  border-radius: 12px;
}
</style>
