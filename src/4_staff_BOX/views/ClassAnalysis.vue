<template>
  <CContainer fluid class="py-4 premium-bg">

    <!-- ✅ HEADER -->
    <CCard class="mb-4 premium-hero shadow-lg border-0">
      <CCardBody>
        <div class="d-flex justify-content-between align-items-center flex-wrap">

          <div class="d-flex align-items-center mb-3 mb-sm-0">
            <CAvatar size="lg" class="me-3 hero-avatar">
              <i class="cil-school text-white fs-3"></i>
            </CAvatar>

            <div>
              <h3 class="text-white fw-bold mb-1">
                Class Academic Performance Dashboard
              </h3>
              <div class="text-white-50">
                Insights • Top Students • Subject Analytics • Reports
              </div>
            </div>
          </div>

          <div class="d-flex gap-2">
            <CFormSelect v-model="selectedYear" @change="fetchData" class="premium-select">
              <option v-for="y in years" :key="y">{{ y }}</option>
            </CFormSelect>

            <CFormSelect v-model="selectedTerm" @change="fetchData" class="premium-select">
              <option v-for="t in terms" :key="t">{{ t }}</option>
            </CFormSelect>
          </div>

        </div>
      </CCardBody>
    </CCard>



    <!-- ✅ KPI SECTION -->
    <CRow class="mb-4">
      <CCol sm="6" md="3" v-for="k in kpis" :key="k.label">
        <CCard class="p-3 text-white border-0 shadow kpi-card" :class="k.bg">
          <div class="small">{{ k.label }}</div>
          <div class="fs-3 fw-bold">{{ k.value }}</div>
        </CCard>
      </CCol>
    </CRow>



    <!-- ✅ SUBJECT ANALYTICS -->
    <CCard class="premium-card shadow mb-4">
      <CCardBody>
        <h5 class="fw-bold mb-3">Subject Analytics</h5>

        <CRow>
          <CCol md="3" v-for="s in subjects" :key="s.subject">
            <CCard class="subject-card shadow-sm mb-3 border-0">
              <CCardBody>
                <h6 class="fw-bold">{{ s.subject }}</h6>

                <div class="small mt-1">Best Student: <b>{{ s.best_student || '---' }}</b></div>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>

      </CCardBody>
    </CCard>



    <!-- ✅ SUBJECT ANALYTICS PER STUDENT -->
    <CCard class="premium-card shadow mb-4">
      <CCardBody>
        <h5 class="fw-bold mb-3">Subject Analytics — Per Student</h5>

        <div class="table-responsive">
          <table class="table table-striped premium-table">
            <thead>
              <tr>
                <th>Student</th>
                <th v-for="sub in subjectHeaders" :key="sub" class="text-center">
                  {{ sub }}
                </th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="stu in perStudentFlat" :key="stu.student">
                <td class="fw-bold">{{ stu.student }}</td>

                <td v-for="s in subjectHeaders" :key="s">
                  <div class="fw-bold text-center">{{ stu.subjects[s]?.score ?? '--' }}%</div>
                  <div class="text-muted small text-center">Pos: #{{ stu.subjects[s]?.position ?? '--' }}</div>
                  <span class="badge bg-info small d-block text-center">
                    {{ stu.subjects[s]?.grade ?? '-' }}
                  </span>
                </td>
              </tr>
            </tbody>

          </table>
        </div>

      </CCardBody>
    </CCard>



    <!-- ✅ STUDENT RANKING -->
    <CCard class="premium-card shadow">
      <CCardBody>

        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="fw-bold">Student Ranking</h5>

          <CFormInput v-model="search" placeholder="Search student" style="max-width:200px" />
        </div>

        <div class="table-responsive">
          <table class="table table-striped premium-table align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Raw Score</th>
                <th>Rank</th>
                <th>Comment Status</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="stu in filteredStudents" :key="stu.student_id">
                <td>{{ stu.student }}</td>
                <td>{{ stu.average }}</td>
                <td>#{{ stu.rank }}</td>

                <td>
                  <span v-if="stu.comment_status" class="badge bg-success">Comment Added</span>
                  <span v-else class="badge bg-secondary">No Comment</span>
                </td>

                <td class="text-center">
                  <CButton size="sm" color="primary" variant="outline" @click="openStudent(stu)">
                    Add Comment
                  </CButton>
                </td>
              </tr>
            </tbody>

          </table>
        </div>

      </CCardBody>
    </CCard>



    <!-- ✅ OFFCANVAS FOR COMMENTS -->
    <COffcanvas placement="end" :visible="drawer" @hide="drawer = false" class="premium-offcanvas shadow-lg">

      <CCardBody v-if="ready" class="p-4">

        <div class="d-flex justify-content-between mb-3">
          <h4 class="fw-bold">{{ activeStudent.student }}</h4>

          <CButton color="light" class="rounded-circle" @click="drawer=false">
            <i class="cil-x fs-4"></i>
          </CButton>
        </div>

        <CFormTextarea v-model="studentNotes[activeStudent.student_id].attitude" rows="2" class="mb-3"
          placeholder="Attitude..."></CFormTextarea>

        <CFormTextarea v-model="studentNotes[activeStudent.student_id].interest" rows="2" class="mb-3"
          placeholder="Interest..."></CFormTextarea>

        <CFormTextarea v-model="studentNotes[activeStudent.student_id].remarks" rows="3" class="mb-3"
          placeholder="Teacher Remarks..."></CFormTextarea>

        <CButton color="success" class="w-100" @click="saveRemark">
          Save Remark
        </CButton>

      </CCardBody>

    </COffcanvas>

  </CContainer>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { getClassAnalysis } from "@/services/api";
import { useToast } from "vue-toastification"

const toast = useToast()

/* ✅ State */
const years = ["2024/2025", "2025/2026"];
const terms = ["1st Term", "2nd Term", "3rd Term"];

const selectedYear = ref("");
const selectedTerm = ref("");

/* ✅ Extract from localStorage */
const storage = JSON.parse(localStorage.getItem("acad_records_demo_v1"));
const staff = JSON.parse(localStorage.getItem("staff"));

const gradeclass_id = staff?.assigned_class
selectedYear.value = storage?.cbx?.year ?? "2024/2025";
selectedTerm.value = storage?.cbx?.term ?? "1st Term";

/* ✅ API Data */
const kpis = ref([]);
const subjects = ref([]);
const perStudentFlat = ref([]);
const studentsRanking = ref([]);

/* ✅ Notes */
const studentNotes = ref({});
const drawer = ref(false);
const activeStudent = ref(null);

const search = ref("");

const subjectHeaders = ref([]);

/* ✅ FETCH DATA */
async function fetchData() {
  try {




    const res = await getClassAnalysis(
      selectedYear.value,
      selectedTerm.value,
      staff.assigned_class        // ✅ ALWAYS USE CLASS NAME
    );


    const data = res.data;

    // ✅ KPIs
    kpis.value = [
      { label: "Total Students", value: data.summary.total_students, bg: "bg-success" },
      { label: "Class Average", value: data.summary.class_average, bg: "bg-primary" },
      { label: "Best Student", value: data.summary.best_student, bg: "bg-info" },
      { label: "Lowest Student", value: data.summary.lowest_student, bg: "bg-danger" },
    ];

    // ✅ Subject Analytics
    subjects.value = data.subject_analytics;

    // ✅ PER STUDENT SUBJECT TABLE FIX
    perStudentFlat.value = data.per_student_subjects.map(stu => {
      const normalizedSubjects = {};

      // Convert lowercase → Capitalized labels
      Object.keys(stu.subjects).forEach(sub => {
        const niceName = sub.charAt(0).toUpperCase() + sub.slice(1);
        normalizedSubjects[niceName] = stu.subjects[sub];
      });

      return {
        ...stu,
        subjects: normalizedSubjects
      };
    });

    // ✅ Build subject headers dynamically
    subjectHeaders.value = Object.keys(perStudentFlat.value[0].subjects);

    // ✅ Ranking table
    studentsRanking.value = data.students_ranking;

    // ✅ Initialize notes for each student
    data.students_ranking.forEach(s => {
      if (!studentNotes.value[s.student_id]) {
        studentNotes.value[s.student_id] = {
          attitude: "",
          interest: "",
          remarks: ""
        };
      }
    });

  } catch (err) {
    toast.error("Could not load class analysis data");


  }
}

onMounted(fetchData);

/* ✅ Filters */
const filteredStudents = computed(() => {
  if (!search.value) return studentsRanking.value;
  return studentsRanking.value.filter(s =>
    s.student.toLowerCase().includes(search.value.toLowerCase())
  );
});

/* ✅ Offcanvas */
function openStudent(stu) {
  activeStudent.value = stu;
  drawer.value = true;
}

const ready = computed(() =>
  activeStudent.value && studentNotes.value[activeStudent.value.student_id]
);

/* ✅ Save remarks */
function saveRemark() {
  alert("✅ Saved!");
  drawer.value = false;
}
</script>







<style scoped>
.premium-bg {
  background: #f2f4f8;
  min-height: 100vh;
}

.premium-hero {
  background: linear-gradient(135deg, #673ab7, #3f51b5);
  border-radius: 20px;
}

.hero-avatar {
  background: rgba(255, 255, 255, 0.2);
}

.kpi-card {
  border-radius: 14px;
}

.premium-card {
  border-radius: 18px;
  background: white;
}

.subject-card {
  border-radius: 16px;
  background: #fafbff;
}

.premium-table thead {
  background: #eef1f6;
  font-weight: bold;
}

.premium-table tbody tr:hover {
  background: #f7f9ff;
}

.premium-offcanvas {
  width: 420px !important;
  background: #f8f9fc;
  border-left: 1px solid #e3e6ef;
}

.stat-card {
  background: white;
  border-radius: 14px;
}

.subject-grade-card {
  background: white;
  border-radius: 14px;
  transition: 0.2s;
}

.subject-grade-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.08);
}
</style>
