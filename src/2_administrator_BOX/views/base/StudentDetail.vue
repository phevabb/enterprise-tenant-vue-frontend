<template>
  <v-container fluid class="pa-4">

    <!-- TOP SECTION -->
    <v-row>
      <!-- LEFT COLUMN -->
      <v-col cols="12" md="4">
        <!-- Profile Card -->
        <v-card class="pa-4" elevation="3">
          <div class="d-flex flex-column align-center">
            <v-avatar size="100" color="primary" class="mb-3">
              <span class="text-h5">{{ initials }}</span>
            </v-avatar>

            <h2 class="text-h6 font-weight-bold mb-1">{{ student.full_name }}</h2>
            <v-chip
              :color="student.active ? 'success' : 'grey'"
              size="small"
              class="mb-3"
            >
              {{ student.active ? 'Active Student' : 'Inactive' }}
            </v-chip>
          </div>

          <v-divider class="my-3"></v-divider>

          <v-list density="compact">
            <v-list-item>
              <v-list-item-title>
                <strong>Gender:</strong> {{ student.gender }}
              </v-list-item-title>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>
                <strong>Class:</strong> {{ student.current_class }}
              </v-list-item-title>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>
                <strong>Nationality:</strong> {{ student.nationality }}
              </v-list-item-title>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>
                <strong>Date of Birth:</strong> {{ student.date_of_birth }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>

        <!-- Parent Info -->
        <v-card class="pa-4 mt-4" elevation="3">
          <h3 class="text-subtitle-1 font-weight-bold mb-2">Parent Contacts</h3>

          <v-list density="compact">
            <v-list-item>
              <v-list-item-title>
                <strong>Father:</strong> {{ student.name_of_father || '—' }}
                <div class="text-grey">{{ student.contact_of_father || '—' }}</div>
              </v-list-item-title>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>
                <strong>Mother:</strong> {{ student.name_of_mother || '—' }}
                <div class="text-grey">{{ student.contact_of_mother || '—' }}</div>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>

        <!-- Health Info -->
        <v-card class="pa-4 mt-4" elevation="3">
          <h3 class="text-subtitle-1 font-weight-bold mb-2">Health Info</h3>

          <v-list density="compact">
            <v-list-item>
              <v-icon color="green" class="me-2">mdi-shield-check</v-icon>
              <v-list-item-title>Immunized: <strong>{{ student.is_immunized ? 'Yes' : 'No' }}</strong></v-list-item-title>
            </v-list-item>

            <v-list-item>
              <v-icon color="red" class="me-2">mdi-alert-circle</v-icon>
              <v-list-item-title>
                Allergies: <strong>{{ student.has_allergies ? student.allergic_foods : 'None' }}</strong>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- RIGHT COLUMN -->
      <v-col cols="12" md="8">

        <!-- Stats Cards -->
        <v-row>
          <v-col cols="12" sm="4">
            <v-card elevation="3" class="pa-4 text-center">
              <h4 class="text-body-2 text-grey">Attendance</h4>
              <h2>{{ stats.attendance }}%</h2>
            </v-card>
          </v-col>

          <v-col cols="12" sm="4">
            <v-card elevation="3" class="pa-4 text-center">
              <h4 class="text-body-2 text-grey">Total Payments</h4>
              <h2>GHS {{ stats.total_payments }}</h2>
            </v-card>
          </v-col>

          <v-col cols="12" sm="4">
            <v-card elevation="3" class="pa-4 text-center">
              <h4 class="text-body-2 text-grey">Balance</h4>
              <h2>GHS {{ stats.balance }}</h2>
            </v-card>
          </v-col>
        </v-row>

        <!-- Academic Info -->
        <v-card elevation="3" class="pa-4 mt-4">
          <h3 class="text-subtitle-1 font-weight-bold mb-2">Academic Info</h3>

          <v-list density="compact">
            <v-list-item>
              <v-list-item-title>
                <strong>Current Class:</strong> {{ student.current_class }}
              </v-list-item-title>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>
                <strong>Admission Seeking:</strong> {{ student.class_seeking_admission_to || '—' }}
              </v-list-item-title>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>
                <strong>Last School Attended:</strong> {{ student.lastSchoolAttended || '—' }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>

        <!-- Additional Notes -->
        <v-card elevation="3" class="pa-4 mt-4">
          <h3 class="text-subtitle-1 font-weight-bold mb-2">Additional Info</h3>
          <p>{{ student.otherRelatedInfo || 'No additional information.' }}</p>
        </v-card>

        <!-- Payments History -->
        <v-card elevation="3" class="pa-4 mt-4">
          <h3 class="text-subtitle-1 font-weight-bold mb-4">Payment History</h3>

          <v-table density="comfortable">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th class="text-end">Amount (GHS)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(p, i) in payments" :key="i">
                <td>{{ i + 1 }}</td>
                <td>{{ p.date }}</td>
                <td class="text-end">{{ p.amount }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>

      </v-col>
    </v-row>

  </v-container>
</template>

<script setup>
import { ref, computed } from "vue"

// MOCK DATA — replace with API
const student = ref({
  full_name: "Kojo Mensah",
  gender: "Male",
  nationality: "Ghanaian",
  date_of_birth: "2014-06-17",
  current_class: "Class 3",
  class_seeking_admission_to: "Class 4",
  name_of_father: "Kwame Mensah",
  contact_of_father: "0244000000",
  name_of_mother: "Abena Mensah",
  contact_of_mother: "0244555544",
  is_immunized: true,
  has_allergies: true,
  allergic_foods: "Groundnuts",
  lastSchoolAttended: "Happy Kids Montessori",
  otherRelatedInfo: "Very punctual and excellent behavior.",
  active: true,
})

const stats = ref({
  attendance: 95,
  total_payments: 1580,
  balance: 220,
})

const payments = ref([
  { date: "2025-01-10", amount: 500 },
  { date: "2025-02-05", amount: 450 },
  { date: "2025-03-14", amount: 630 },
])

const initials = computed(() => {
  if (!student.value.full_name) return "S"
  return student.value.full_name
    .split(" ")
    .map(n => n[0])
    .join("")
})
</script>

<style scoped>
.text-grey {
  color: #6c757d;
}
</style>
