

<template>
  <CContainer fluid class="py-4 parent-bg">

    <!-- ✅ HEADER -->
    <CCard class="parent-hero shadow-lg border-0 mb-4">
      <CCardBody>
        <div class="d-flex justify-content-between align-items-center flex-wrap">

          <div class="d-flex align-items-center">
            <CAvatar size="lg" class="me-3 parent-avatar">
              <i class="cil-user text-white fs-3"></i>
            </CAvatar>

            <div>
              <h2 class="fw-bold text-white mb-0">{{ student.name }}</h2>
              <div class="text-white-50">
                Performance Overview For Immediate Past Term
              </div>
            </div>
          </div>



        </div>
      </CCardBody>
    </CCard>

    <!-- ✅ INFO CARDS -->
    <CRow class="mb-4">
      <CCol md="6">
        <CCard class="shadow-sm info-card">
          <CCardBody>
            <div class="small text-muted">Class</div>
            <div class="fs-4 fw-bold">{{ student.class }}</div>
          </CCardBody>
        </CCard>
      </CCol>

      <CCol md="6">
        <CCard class="shadow-sm info-card">
          <CCardBody>
            <div class="small text-muted">Overall Position</div>
            <div class="fs-4 fw-bold">{{ student.position }}</div>
          </CCardBody>
        </CCard>
      </CCol>


    </CRow>

    <!-- ✅ PERFORMANCE CHART -->
    <CCard class="shadow parent-card mb-4">
      <CCardBody>
        <h4 class="fw-bold mb-3 text-primary">Performance Chart</h4>

        <div style="height: 360px;">
          <canvas ref="chartCanvas"></canvas>
        </div>
      </CCardBody>
    </CCard>

    <!-- ✅ SUBJECT DETAILS DRAWER -->
    <COffcanvas placement="end" :visible="drawer" @hide="drawer=false" class="subject-offcanvas shadow-lg">
      <CCardBody v-if="activeSubject">

        <div class="d-flex justify-content-between mb-3">
          <h4 class="fw-bold">{{ activeSubject.name }}</h4>

          <CButton color="light" class="rounded-circle" @click="drawer=false">
            <i class="cil-x fs-4"></i>
          </CButton>
        </div>

        <p class="text-muted">{{ activeSubject.description }}</p>

        <CCard class="shadow-sm border-0 p-3 mt-3 info-mini">
          <div class="d-flex justify-content-between">
            <span>Score</span>
            <b>{{ activeSubject.score }}%</b>
          </div>

          <div class="d-flex justify-content-between">
            <span>Position</span>
            <b>#{{ activeSubject.position }}</b>
          </div>

          <div class="d-flex justify-content-between">
            <span>Teacher Remark</span>
            <b>{{ activeSubject.remark }}</b>
          </div>
        </CCard>

      </CCardBody>
    </COffcanvas>

  </CContainer>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import Chart from "chart.js/auto";

import {
  getPerformanceChart,
  getCategories
} from "@/services/api";
import { useToast } from 'vue-toastification'
const toast = useToast();

/* ✅ Student Info */
const student = ref({
  name: "",
  class: "",
  position: "",
});

/* ✅ Filters */
const years = ["2024/2025", "2025/2026"];
const terms = ["1st Term", "2nd Term", "3rd Term"];

const selectedYear = ref("2024/2025");
const selectedTerm = ref("1st Term");

/* ✅ Subjects dynamically loaded based on CLASS CATEGORY */
const subjects = ref([]);

/* ✅ Class Average */
const classAvg = ref(0);

/* ✅ Chart Reference */
const chartCanvas = ref(null);
let chartInstance = null;

/* ✅ Drawer */
const activeSubject = ref(null);
const drawer = ref(false);

/* ✅ Find subjects based on class → category */
async function resolveSubjectsForClass(gradeclassName) {
  const cls = gradeclassName.toLowerCase().trim();

  const { data: categories } = await getCategories();

  for (const cat of categories) {
    const match = cat.specific_classes.some(
      c => c.name.toLowerCase() === cls
    );

    if (match) {
      return cat.subject_groups.flatMap(g =>
        g.subjects.map(s => s.name.toLowerCase())
      );
    }
  }

  return [];
}

/* ✅ Load Chart Data */
async function loadChartData() {
  try {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const studentId = storedUser.id;

    const res = await getPerformanceChart(
      studentId,
      selectedYear.value,
      selectedTerm.value
    );

    const record = res.data[0];
    if (!record) return;

    /* ✅ Populate student info */
    student.value = {
      name: record.student,
      class: record.class,
      position: record.position
    };

    classAvg.value = record.classAvg;

    /* ✅ Get which subjects belong to this class */
    const allowedSubjects = await resolveSubjectsForClass(record.class);

    /* ✅ Filter chart subjects */
    subjects.value = record.subjects.filter(s =>
      allowedSubjects.includes(s.name.toLowerCase())
    );

    renderChart();
  } catch (err) {
    toast.error("Could not load performance data");

  }
}

/* ✅ Render Chart */
function renderChart() {
  if (!chartCanvas.value) return;

  if (chartInstance) chartInstance.destroy();

  const labels = subjects.value.map(s => s.name);
  const studentScores = subjects.value.map(s => s.score);
  const bestScores = subjects.value.map(s => s.best);
  const avgScores = subjects.value.map(s => s.average);
  const worstScores = subjects.value.map(s => s.worst);

  chartInstance = new Chart(chartCanvas.value, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Your Child",
          data: studentScores,
          borderColor: "#FFD000",
          backgroundColor: "#FFD000",
          borderWidth: 4,
          tension: 0.25,
          pointRadius: 7,
        },
        {
          label: "Best Student",
          data: bestScores,
          borderColor: "#004CFF",
          borderWidth: 3,
          borderDash: [6, 4],
          tension: 0.25,
          pointRadius: 7,
        },
        {
          label: "Class Average",
          data: avgScores,
          borderColor: "#8B4513",
          borderWidth: 3,
          borderDash: [6, 4],
          tension: 0.25,
          pointRadius: 7,
        },
        {
          label: "Worst Student",
          data: worstScores,
          borderColor: "#FF1E1E",
          borderWidth: 3,
          tension: 0.25,
          pointRadius: 7,
        }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
      scales: { y: { suggestedMin: 0, suggestedMax: 100 } }
    }
  });
}

/* ✅ Watchers */
watch([selectedYear, selectedTerm], () => loadChartData());

/* ✅ On Mount */
onMounted(() => loadChartData());

/* ✅ Drawer open */
function openSubject(sub) {
  activeSubject.value = sub;
  drawer.value = true;
}
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
</style>
