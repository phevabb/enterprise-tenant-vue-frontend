<template>
  <v-container fluid class="pa-4">
    <v-row>
      <!-- LEFT COLUMN -->
      <v-col cols="12" md="4">
        <v-card class="pa-4" elevation="3">
          <div class="d-flex flex-column align-center">






<v-avatar size="100" class="mb-3">
  <img
    v-if="!imgError && student.profile_picture"
    :src="student.profile_picture"
    :alt="student.full_name"
    @error="imgError = true"
  />

  <img
    v-else
    :src="dummyAvatar"
    alt="Default Avatar"
  />
</v-avatar>

            <h2 class="text-h6 font-weight-bold mb-1">{{ student.full_name || '—' }}</h2>
            <v-chip :color="student.is_active ? 'success' : 'grey'" size="small" class="mb-3">
              {{ student.is_active ? 'Active Student' : 'Inactive' }}
            </v-chip>
          </div>

          <v-divider class="my-3"></v-divider>

          <v-list density="compact">
            <v-list-item>
              <v-list-item-title>
                <strong>Gender:</strong> {{ student.gender || '—' }}
              </v-list-item-title>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>
                <strong>Class:</strong> {{ student.current_class_display || student.current_class || '—' }}
              </v-list-item-title>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>
                <strong>Nationality:</strong> {{ student.nationality || '—' }}
              </v-list-item-title>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>
                <strong>Date of Birth:</strong> {{ student.date_of_birth || '—' }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>

        <!-- family info -->
        <v-card v-if="family" class="pa-4 mt-4" elevation="3">
          <h3 class="text-subtitle-1 font-weight-bold mb-2">Family Info</h3>

          <v-list dense>
            <v-list-item
              v-for="member in (family.members || [])"
              :key="member?.id ?? member?.user_id ?? Math.random()"
              class="mb-3"
            >
              <v-list-item-content>
                <h4 class="text-subtitle-2 font-weight-medium mb-1">
                  <strong>Name:</strong> {{ member?.full_name || '—' }}
                </h4>
                <h4 class="text-subtitle-2 font-weight-medium mb-1">
                  <strong>Student ID:</strong> {{ member?.user_id ?? '—' }}
                </h4>
                <h4 class="text-subtitle-2 font-weight-medium mb-1">
                  <strong>Class:</strong>
                  {{ member?.current_class_display || member?.current_class || '—' }}
                </h4>
                <hr>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card>

        <!-- Health Info -->
        <v-card class="pa-4 mt-4" elevation="3">
          <h3 class="text-subtitle-1 font-weight-bold mb-2">Health Info</h3>

          <v-list density="compact">
            <v-list-item>
              <v-icon color="green" class="me-2">mdi-shield-check</v-icon>
              <v-list-item-title>
                Immunized: <strong>{{ student.is_immunized ? 'Yes' : 'No' }}</strong>
              </v-list-item-title>
            </v-list-item>

            <v-list-item>
              <v-icon color="red" class="me-2">mdi-alert-circle</v-icon>
              <v-list-item-title>
                Allergies:
                <strong>{{ student.has_allergies ? (student.allergic_foods || 'Yes') : 'None' }}</strong>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>

      </v-col>

      <!-- RIGHT COLUMN -->
      <v-col cols="12" md="8">
        <!-- Stats -->
        <v-row>

          <!-- total payments -->
          <v-col cols="12" sm="6">
            <v-card elevation="3" class="pa-4 text-center">
              <h4 class="text-body-2 text-grey">Total Payments</h4>
              <h2>{{ formatGHS(sumAmounts) }}</h2>
            </v-card>
          </v-col>
          <!-- balance -->
          <v-col cols="12" sm="6">
            <v-card elevation="3" class="pa-4 text-center">
              <h4 class="text-body-2 text-grey">You owe the institution</h4>
              <h2>{{ formatGHS(sumBalances) }}</h2>
            </v-card>
          </v-col>


        </v-row>

        <!-- Academic Info -->
        <v-card elevation="3" class="pa-4 mt-4">
          <h3 class="text-subtitle-1 font-weight-bold mb-2">Academic Info</h3>

          <v-list density="compact">
            <v-list-item>
              <v-list-item-title>
                <strong>Current Class:</strong> {{ student.current_class_display || student.current_class || '—' }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>

        <!-- Payment History (single, filterable) -->
        <v-card elevation="3" class="pa-4 mt-4">
          <div class="d-flex align-center justify-space-between mb-3">
            <h3 class="text-subtitle-1 font-weight-bold">
              Payment History for {{ (family_name || student.full_name).toUpperCase() }}
            </h3>

          </div>

          <v-table density="comfortable">

            <thead>
              <tr>
                <th>#</th>

                <th>Term</th>
                <th>Academic Year</th>
                <th>Class</th>
                <th>Date</th>
                <th class="text-end">Amount Paid (GHS)</th>
                <th class="text-end">Balance (GHS)</th>
                <th>Fully Paid</th>
              </tr>
            </thead>
            <tbody>
              <!-- Loading -->
              <template v-if="loading">
                <tr v-for="i in 5" :key="'skeleton-' + i">
                  <td colspan="9" class="py-4">
                    <v-skeleton-loader type="text" class="mb-2" />
                    <v-skeleton-loader type="text" width="60%" />
                  </td>
                </tr>
              </template>

              <!-- Empty -->
              <template v-else-if="filteredPayments.length === 0">
                <tr>
                  <td colspan="9" class="text-center py-6 text-medium-emphasis">
                    No payment records found.
                  </td>
                </tr>
              </template>

              <!-- Rows -->
              <template v-else>
                <tr v-for="(p, i) in filteredPayments" :key="(p.scope || 'row') + '-' + i">
                  <td>{{ i + 1 }}</td>



                  <td>{{ p.term }}</td>
                  <td>{{ p.academicyear }}</td>
                  <td>{{ (p.gradeclass && p.gradeclass !== '-') ? p.gradeclass : '—' }}</td>
                  <td>{{ p.date || '—' }}</td>

                  <td class="text-end">{{ formatGHS(p.amount) }}</td>
                  <td class="text-end">{{ formatGHS(p.balance) }}</td>

                  <td>
                    <v-chip
                      :color="p.fullypaid ? 'success' : 'error'"
                      variant="flat"
                      size="small"
                      class="text-white"
                    >
                      <v-icon size="16" class="mr-1">
                        {{ p.fullypaid ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                      </v-icon>
                      {{ p.fullypaid ? 'Fully Paid' : 'Not Paid' }}
                    </v-chip>
                  </td>
                </tr>
              </template>
            </tbody>

          </v-table>

          <!-- Totals footer -->
          <div v-if="!loading && filteredPayments.length > 0" class="d-flex justify-end mt-3 text-body-2">
            <div>
              <div><strong>Sum of Amounts:</strong> {{ formatGHS(sumAmounts) }}</div>
              <div><strong>Sum of Balances:</strong> {{ formatGHS(sumBalances) }}</div>
            </div>
          </div>
        </v-card>



        <!-- Academic records (demo) -->
        <v-card elevation="3" class="pa-4 mt-4">
          <h3 class="text-subtitle-1 font-weight-bold mb-4">Academic records</h3>
          <v-table density="comfortable">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th class="text-end">Amount (GHS)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(p, i) in filteredPayments" :key="'ac-' + i">
                <td>{{ i + 1 }}</td>
                <td>{{ p.date || '—' }}</td>
                <td class="text-end">{{ formatGHS(p.amount) }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>

        <!-- Loading / Error -->
        <div v-if="loading" class="mt-4 text-grey">Loading student…</div>
        <div v-if="errorMsg" class="mt-2" style="color:#d32f2f;">{{ errorMsg }}</div>
      </v-col>

    </v-row>
  </v-container>
</template>



<script setup>
import { ref, computed, onMounted } from "vue";
import {
  student_profile,
  get_profile_picture,
  get_student_payment_list_per_term,
  get_family_payment_list_per_term
} from "@/services/api";

// ✅ Base URL so images load correctly (adjust to your backend)
const API_BASE = import.meta.env.VITE_API_URL || "https://your-backend.com";

const loading = ref(false);
const errorMsg = ref("");

const student = ref({
  profile_picture: "",
  full_name: "",
  gender: "",
  nationality: "",
  date_of_birth: "",
  current_class: "",
  current_class_display: "",
  is_active: false,
});

// ✅ Compute initials
const initials = computed(() => {
  if (!student.value.full_name) return "S";
  return student.value.full_name
    .split(" ")
    .map((n) => n[0])
    .join("");
});

// ✅ Helper: Add host if picture is relative
function normalizePictureUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return API_BASE + path;
}

const payments = ref([]);
const payments_individual = ref([]);

const formatGHS = (value) => {
  const num = Number(value ?? 0);
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
  }).format(num);
};

const filteredPayments = computed(() => [
  ...payments.value,
  ...payments_individual.value,
]);

const sumAmounts = computed(() =>
  filteredPayments.value.reduce((acc, p) => acc + Number(p.amount), 0)
);


const dummyAvatar =
  "data:image/svg+xml;base64," +
  btoa(`<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'>
    <rect width='140' height='140' fill='#d1d5db'/>
    <circle cx='70' cy='56' r='26' fill='white'/>
    <rect x='22' y='90' width='96' height='34' rx='17' fill='white'/>
  </svg>`)



const sumBalances = computed(() =>
  filteredPayments.value.reduce((acc, p) => acc + Number(p.balance), 0)
);

const classMap = {
  1: "Creche",
  2: "Nursery 1",
  3: "Nursery 2",
  4: "KG 1",
  5: "KG 2",
  6: "Class 1",
  7: "Class 2",
  8: "Class 3",
  9: "Class 4",
  10: "Class 5",
  11: "Class 6",
  12: "JHS 1",
  13: "JHS 2",
  14: "JHS 3",
};

onMounted(async () => {
  loading.value = true;

  try {
    const userLocal = JSON.parse(localStorage.getItem("user"));
    if (!userLocal?.user_id) throw new Error("Invalid user");

    const uid = userLocal.user_id;
    const id = userLocal.id;

    // ✅ 1. Fetch profile picture FIRST
    const pic = await get_profile_picture(id);
    student.value.profile_picture = normalizePictureUrl(
      pic.data?.profile_picture
    );

    // ✅ 2. Fetch student profile
    const profileRes = await student_profile(uid);

    const user = profileRes.data.user || {};
    const profile = profileRes.data.profile || {};

    const currentClass = profile.current_class;

    // ✅ DO NOT OVERWRITE profile_picture — keep it
    student.value = {
      ...student.value, // ✅ KEEP EXISTING PICTURE
      full_name: user.full_name || "",
      gender: user.gender || "",
      nationality: user.nationality || "",
      date_of_birth: user.date_of_birth || "",
      is_active: !!user.is_active,
      current_class: currentClass ?? "",
      current_class_display:
        classMap[currentClass] ||
        profile.current_class_display ||
        "",
    };

    // ✅ 3. Load individual payments
    const paymentsRes = await get_student_payment_list_per_term(uid);
    payments_individual.value = paymentsRes.data.map((item) => ({
      amount: Number(item.amount_paid),
      balance: Number(item.balance),
      fullypaid: item.is_fully_paid,
      date: new Date(item.date_created).toLocaleDateString(),
      term: item.fee_structure.term.name,
      academicyear: item.fee_structure.academic_year.name,
      gradeclass: item.fee_structure.grade_class.name,
    }));
  } catch (err) {
    errorMsg.value = "Failed to load student profile.";

  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.text-grey { color: #6c757d; }
</style>
