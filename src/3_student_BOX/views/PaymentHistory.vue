<template>
  <CContainer fluid class="mt-4">

    <!-- Page Header -->
    <CRow>
      <CCol>
        <h3 class="mb-3">Payment History</h3>
      </CCol>
    </CRow>

    <!-- ========================== -->
    <!-- SECTION 1: PAYMENTS PER TERM -->
    <!-- ========================== -->
    <CRow class="mb-4">
      <CCol>
        <CCard>
          <CCardHeader>
            <strong>Payments Per Term</strong>
          </CCardHeader>

<!-- Payment History -->
<v-card elevation="3" class="pa-4 mt-4">

  <v-table density="comfortable">
    <thead>
      <tr>
        <th>#</th>
        <th>Term</th>
        <th>Academic Year</th>
        <th>Class</th>
        <th class="text-end">Amount Paid (GHS)</th>
        <th class="text-end">Balance (GHS)</th>
        <th>Fully Paid</th>
      </tr>
    </thead>

    <tbody>
      <tr v-for="(rec, i) in perTermRecords" :key="rec.id">
        <td>{{ i + 1 }}</td>
        <td>{{ rec.term }}</td>
        <td>{{ rec.academicyear }}</td>
        <td>{{ rec.gradeclass }}</td>

        <!-- Right-aligned currency formatting -->
        <td class="text-end">{{ formatMoney(rec.amount) }}</td>
        <td class="text-end">{{ formatMoney(rec.balance) }}</td>

        <!-- Status chip with icon (same logic) -->
        <td>
          <v-chip
            :color="rec.fullypaid ? 'success' : 'error'"
            variant="flat"
            size="small"
            class="text-white"
          >
            <v-icon size="16" class="mr-1">
              {{ rec.fullypaid ? 'mdi-check-circle' : 'mdi-alert-circle' }}
            </v-icon>
            {{ rec.fullypaid ? 'Fully Paid' : 'Not Paid' }}
          </v-chip>
        </td>
      </tr>
    </tbody>
  </v-table>
</v-card>


 <!-- Loading / Error -->
        <div v-if="loading" class="mt-4 text-grey">Loading student…</div>
        <div v-if="errorMsg" class="mt-2" style="color:#d32f2f;">{{ errorMsg }}</div>

        </CCard>
      </CCol>
    </CRow>

    <!-- ========================== -->
    <!-- SECTION 2: PAYMENT RECORDS -->
    <!-- ========================== -->

    <!-- Filters -->
    <CRow class="mb-4 g-3">
      <CCol md="3">
        <CFormInput
          type="text"
          placeholder="Search by Student or SFR ID"
          v-model="search"
        />
      </CCol>

      <CCol md="3">
        <CFormSelect v-model="paymentMethod">
          <option value="">All Payment Methods</option>
          <option value="Cash">Cash</option>
          <option value="Momo">Mobile Money</option>
          <option value="Bank">Bank Transfer</option>
        </CFormSelect>
      </CCol>

      <CCol md="3">
        <CFormInput type="date" v-model="dateFrom" />
      </CCol>

      <CCol md="3">
        <CFormInput type="date" v-model="dateTo" />
      </CCol>
    </CRow>

    <!-- Payment Table -->
    <CCard>
      <CCardHeader>
        <strong>Payments</strong>
      </CCardHeader>

      <CCardBody class="p-0">
        <CTable hover responsive>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>#</CTableHeaderCell>
              <CTableHeaderCell>Class</CTableHeaderCell>
              <CTableHeaderCell>Term</CTableHeaderCell>

              <CTableHeaderCell>Date</CTableHeaderCell>
              <CTableHeaderCell>Amount</CTableHeaderCell>
              <CTableHeaderCell>Method</CTableHeaderCell>
            </CTableRow>
          </CTableHead>

          <CTableBody>
<CTableRow v-for="(p, index) in payments" :key="p.id">
  <CTableDataCell>{{ index + 1 + (page-1)*perPage }}</CTableDataCell>

  <CTableDataCell>{{ p.class }}</CTableDataCell>

  <CTableDataCell>{{ p.term }}</CTableDataCell>


  <CTableDataCell>{{ p.date }}</CTableDataCell>
  <CTableDataCell>{{ formatAmount(p.amount) }}</CTableDataCell>
  <CTableDataCell>{{ p.payment_method || 'Cash' }}</CTableDataCell>
</CTableRow>
          </CTableBody>
        </CTable>
      </CCardBody>

    </CCard>


  </CContainer>
</template>

<script setup>
import {
  CContainer, CRow, CCol, CCard, CCardHeader, CCardBody,
  CFormInput, CFormSelect, CTable, CTableBody, CTableHead,
  CTableRow, CTableDataCell, CTableHeaderCell,
  CPagination, CPaginationItem, CBadge
} from '@coreui/vue'
import { ref, computed, onMounted } from 'vue'

import {  get_student_payment_list_per_term, get_regular_payments } from "@/services/api"
import { id } from 'vuetify/locale'

/* ---------------------------------------------
   SECTION 1: Dummy per-term fee summary
--------------------------------------------- */

const loading = ref(false)
const errorMsg = ref("")

const perTermRecords = ref([])


onMounted(async () => {
  try {
    loading.value = true

    const userString = localStorage.getItem("user")
    const userLocal = JSON.parse(userString)

    const uid = userLocal.user_id

    const paymentsRes = await get_student_payment_list_per_term(uid)
    const regular = await get_regular_payments(uid)



    perTermRecords.value = paymentsRes.data.map(item => ({
      term: item.fee_structure.term.name,
      academicyear: item.fee_structure.academic_year.name,
      balance: item.balance,
      gradeclass: item.fee_structure.grade_class.name,
      fullypaid: item.is_fully_paid,
      date: new Date(item.date_created).toLocaleDateString(),
      amount: Number(item.amount_paid)
    }))

payments.value = regular.data.map(item => ({
  id: item.id,
  date: item.date,
  amount: Number(item.amount),
  payment_method: item.payment_method,
  term: item.term,
  year:item.academic_year,
  class:item.grade_class
}))

  } catch (err) {
    errorMsg.value = "Failed to load student profile."
  } finally {
    loading.value = false
  }
})

/* ---------------------------------------------
   SECTION 2: Payment list (your original data)
--------------------------------------------- */
const payments = ref([])

const search = ref("")
const paymentMethod = ref("")
const dateFrom = ref("")
const dateTo = ref("")

const filtered = computed(() => {
  return payments.value.filter(p => {
    const matchSearch =
      p.student_fee_record.student.full_name.toLowerCase().includes(search.value.toLowerCase()) ||
      p.student_fee_record.id.toString().includes(search.value)

    const matchMethod =
      paymentMethod.value ? p.payment_method === paymentMethod.value : true

    const matchDateFrom = dateFrom.value ? p.date >= dateFrom.value : true
    const matchDateTo = dateTo.value ? p.date <= dateTo.value : true

    return matchSearch && matchMethod && matchDateFrom && matchDateTo
  })
})

const page = ref(1)
const perPage = 10

const totalPages = computed(() =>
  Math.ceil(filtered.value.length / perPage)
)

const paginatedData = computed(() => {
  const start = (page.value - 1) * perPage
  return filtered.value.slice(start, start + perPage)
})

const formatAmount = (a) => `${Number(a).toFixed(2)} GHS`


function formatMoney(value) {
  const num = typeof value === 'string' ? Number(value) : value
  if (Number.isNaN(num)) return value // fallback if it's not numeric
  return new Intl.NumberFormat('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num)
}

</script>
