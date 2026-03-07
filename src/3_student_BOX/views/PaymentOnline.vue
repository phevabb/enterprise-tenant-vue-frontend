<template>
  <CContainer class="py-5">

    <!-- =========================== -->
    <!-- SECTION TITLE -->
    <!-- =========================== -->
    <CRow>
      <CCol>
        <h3 class="fw-bold mb-4">Online Payments</h3>
      </CCol>
    </CRow>


    <!-- =========================== -->
    <!-- PREMIUM SIDE-BY-SIDE TILES -->
    <!-- =========================== -->
    <CRow class="g-4">

      <!-- =========================== -->
      <!-- LEFT TILE – PAYMENT PREVIEW -->
      <!-- =========================== -->
      <CCol md="6">
        <CCard class="border-0 shadow-lg h-100 premium-card">
          <CCardBody class="d-flex flex-column p-4">

            <!-- Header -->
            <div
              class="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom"
            >
              <h6 class="fw-bold mb-0 text-dark">Transaction Preview</h6>
              <CBadge color="success" class="px-3 py-2 rounded-pill shadow-sm">
                Success
              </CBadge>
            </div>

            <!-- Amount -->
            <div class="mb-4">
              <small class="text-muted text-uppercase">Amount</small>
              <p class="fw-bold text-primary fs-3 mt-1 mb-0">GHS 0.00</p>
            </div>

            <!-- Date -->
            <div class="mt-auto pt-2">
              <small class="text-muted text-uppercase d-block">Date</small>
              <h6 class="fw-semibold mt-1 mb-0">-- / -- / ----</h6>
            </div>

          </CCardBody>
        </CCard>
      </CCol>


      <!-- =========================== -->
      <!-- RIGHT TILE – PAY ONLINE -->
      <!-- =========================== -->
      <CCol md="6">
        <CCard class="shadow-lg border-0 h-100 premium-card">

          <!-- HEADER -->
          <CCardHeader
            class="bg-gradient-primary text-white py-3 text-center"
            style="border-radius: 14px 14px 0 0;"
          >
            <h5 class="mb-0 fw-bold letter-spacing-1">Pay Online</h5>
          </CCardHeader>

          <!-- BODY -->
          <CCardBody class="p-4 d-flex flex-column">

            <!-- Student Info -->
            <div class="text-center mb-4">
              <h5 class="fw-bold mb-1">ken</h5>
              <small class="text-muted">class 2 • 2023</small>
            </div>

            <!-- Outstanding Panel -->
            <div class="premium-panel shadow-sm mb-4 text-center mx-auto">
              <small class="text-muted text-uppercase">Outstanding Balance</small>
              <h2 class="fw-bold text-danger mt-2 mb-0">
                788.00 GHS
              </h2>
            </div>

            <!-- Amount Field -->
            <div class="mb-4">
              <label class="fw-semibold small mb-1">Amount to Pay</label>
              <CFormInput
                type="number"
                min="1"
                v-model="amount"
                placeholder="Eg: 200"
                class="py-2"
              />
            </div>

            <!-- Submit Button -->
            <div class="mt-auto">
              <CButton
                color="primary"
                class="w-100 py-3 fw-bold shadow-sm"
                size="lg"
                style="border-radius: 10px;"
                :disabled="!isValidAmount"
                @click="payWithPaystack"
              >
                <CIcon :icon="cilCreditCard" class="me-2" />
                Pay Securely
              </CButton>

              <div class="text-center mt-2">
                <small class="text-muted">Secure • Powered by Paystack</small>
              </div>
            </div>

          </CCardBody>
        </CCard>
      </CCol>

    </CRow>





    <!-- =================================================== -->
    <!--  ALL PAYMENTS — PREMIUM TABLE PANEL                -->
    <!-- =================================================== -->
    <CRow class="mt-5">
      <CCol>
        <h3 class="fw-bold mb-3">All Payments</h3>
      </CCol>
    </CRow>

    <CCard class="border-0 shadow-lg premium-card">
      <CCardBody class="p-0">

        <CTable hover responsive borderless class="mb-0">

          <CTableHead class="bg-light">
            <CTableRow>
              <CTableHeaderCell>#</CTableHeaderCell>
              <CTableHeaderCell>Payment Method</CTableHeaderCell>
              <CTableHeaderCell>Date</CTableHeaderCell>
              <CTableHeaderCell class="text-end">Amount (GHS)</CTableHeaderCell>
            </CTableRow>
          </CTableHead>

          <CTableBody>
            <CTableRow v-for="(rec, i) in allPayments" :key="rec.id">
              <CTableDataCell>{{ i + 1 }}</CTableDataCell>
              <CTableDataCell class="fw-semibold">{{ rec.payment_method }}</CTableDataCell>
              <CTableDataCell>{{ rec.date }}</CTableDataCell>
              <CTableDataCell class="text-end text-primary fw-bold">
                {{ rec.amount }}
              </CTableDataCell>
            </CTableRow>
          </CTableBody>

        </CTable>

      </CCardBody>
    </CCard>

  </CContainer>
</template>


<script setup>
import { useToast } from 'vue-toastification'

import { create_online_transaction, verify_payment } from "@/services/api"

import { ref, computed, onMounted } from 'vue'
import { cilCreditCard } from '@coreui/icons'
import { CIcon } from '@coreui/icons-vue'

const toast = useToast()

// =====================
// STATE
// =====================

const amount = ref(null)
const outstandingBalance = ref(788)

const studentName = ref("Ken")
const studentClass = ref("Class 2")
const academicYear = ref("2023")

const allPayments = ref([
  { id: 1, payment_method: "Paystack", date: "01/02/2024", amount: 200 },
  { id: 2, payment_method: "Paystack", date: "10/03/2024", amount: 150 }
])

// =====================
// VALIDATION
// =====================

const isValidAmount = computed(() => {
  return (
    amount.value &&
    amount.value > 0 &&
    amount.value <= outstandingBalance.value
  )
})

// =====================
// PAYSTACK
// =====================

const payWithPaystack = async () => {
  if (!isValidAmount.value) return;

  const reference = await createTransaction();
  if (!reference) return; // stop if creation failed

  const handler = window.PaystackPop.setup({
    key: "pk_test_a5628172fea1fc91e2744361548513a3a3598252",
    // pk_live_c928f270c0cfe8fc1da8403d43b56194b659eaeb
    // pk_test_a5628172fea1fc91e2744361548513a3a3598252
    email: "phevan1@gmail.com",
    amount: Number(amount.value) * 100,
    currency: "GHS",
    ref: reference,
    callback: function(response) {

       verify_payment(response.reference);
    },
    onClose: function() {

    }
  });

  handler.openIframe();
};
// =====================
// VERIFY WITH DJANGO
// =====================

const verifyPayment = async (reference) => {
  try {
    const res = await fetch(`/api/payments/verify/${reference}/`)
    const data = await res.json()

    if (data.status) {
      alert("Payment successful!")

      allPayments.value.unshift({
        id: Date.now(),
        payment_method: "Paystack",
        date: new Date().toLocaleDateString(),
        amount: amount.value
      })

      outstandingBalance.value -= Number(amount.value)
      amount.value = null
    } else {
      alert("Verification failed")
    }
  } catch (err) {
    alert("Verification failed")
  }
}

const createTransaction = async () => {
  try {
    const payload = {
      amount: amount.value,
      student: 35171792,
      email: "phevan1@gmail.com"
    }

    const res = await create_online_transaction(payload)


    if (res.data.status) {
      toast.success("Transaction created successfully");
      return res.data.reference;  // ✅ RETURN — do NOT call payWithPaystack
    } else {
      toast.error("Transaction creation failed", res.data)

      return null
    }

  } catch (err) {
    toast.error(err)

    return null
  }
}
// =====================
// LOAD PAYSTACK SCRIPT
// =====================

onMounted(() => {
  if (!document.getElementById("paystack-script")) {
    const script = document.createElement("script")
    script.id = "paystack-script"
    script.src = "https://js.paystack.co/v1/inline.js"
    script.async = true
    document.body.appendChild(script)
  }
})
</script>




<style scoped>
.premium-card {
  border-radius: 18px !important;
}

.premium-panel {
  border: 1px solid #efefef;
  padding: 24px 20px;
  width: 85%;
  border-radius: 14px;
  background: #ffffff;
}

.letter-spacing-1 {
  letter-spacing: 0.5px;
}
</style>
