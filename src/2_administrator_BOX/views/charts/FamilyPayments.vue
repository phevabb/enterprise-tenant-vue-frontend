<template>
  <CRow>
    <CCol :xs="12">
      <CCard class="mb-4">
        <CCardHeader>
          <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <strong>Family Payments</strong>
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <CFormInput
                v-model="searchTerm"
                placeholder="Search by family / term / year..."
                size="sm"
                style="min-width: 260px;"
              />
              <CFormSelect v-model="dateFilter" size="sm" style="min-width: 160px;">
                <option value="">All Dates</option>
                <option value="today">Today</option>
                <option value="7days">Past 7 Days</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </CFormSelect>
              <CButton
                color="danger"
                size="sm"
                :disabled="!selectedIds.length"
                @click="showBulkDeleteModal = true"
              >
                Delete Selected ({{ selectedIds.length }})
              </CButton>
              <CButton class="text-white" color="primary" size="sm" @click="openAddModal">
                Add Payment
              </CButton>
            </div>
          </div>
        </CCardHeader>

        <CCardBody>
          <div v-if="isLoading" class="d-flex align-items-center gap-2 mb-3">
            <CSpinner size="sm" />
            <span class="text-body-secondary small">Loading payments…</span>
          </div>

          <div v-if="isLoading" class="text-center my-5">
            <CSpinner color="primary" class="me-2" />
            <span class="text-primary fw-bold">Loading payments...</span>
          </div>

          <CTable v-else hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell class="text-center" style="width:48px">
                  <CFormCheck
                    :checked="allSelected"
                    :indeterminate="someSelected"
                    @change="toggleSelectAll"
                  />
                </CTableHeaderCell>
                <CTableHeaderCell>#</CTableHeaderCell>
                <CTableHeaderCell>Family Fee Record</CTableHeaderCell>
                <CTableHeaderCell>Date</CTableHeaderCell>
                <CTableHeaderCell class="text-end">Amount (GHS)</CTableHeaderCell>
                <CTableHeaderCell class="text-end">Net Balance (GHS)</CTableHeaderCell>
                <CTableHeaderCell class="text-end">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              <CTableRow v-for="(payment, idx) in displayedPayments" :key="payment.id">
                <CTableDataCell class="text-center">
                  <CFormCheck v-model="selectedIds" :value="payment.id" />
                </CTableDataCell>
                <CTableHeaderCell scope="row">
                  {{ (currentPage - 1) * pageSize + idx + 1 }}
                </CTableHeaderCell>
                <CTableDataCell>
                  {{ payment.family_fee_record?.family?.name || '—' }} —
                  {{ payment.family_fee_record?.term?.name || '—' }} —
                  {{ payment.family_fee_record?.academic_year?.name || '—' }}
                </CTableDataCell>
                <CTableDataCell>{{ formatDateTime(payment.date_created) }}</CTableDataCell>
                <CTableDataCell class="text-end">{{ formatCurrency(payment.amount) }}</CTableDataCell>
                <CTableDataCell class="text-end">
                  {{ formatCurrency(payment.family_fee_record?.balance) }}
                </CTableDataCell>
                <CTableDataCell class="text-end">
                  <CButtonGroup size="sm">
                    <CButton color="danger" variant="outline" @click="openDeleteConfirm(payment)">
                      Delete
                    </CButton>
                  </CButtonGroup>
                </CTableDataCell>
              </CTableRow>

              <CTableRow v-if="!isLoading && !filteredPayments.length">
                <CTableDataCell colspan="7" class="text-center text-body-secondary py-4">
                  No payments found
                  <span v-if="searchTerm"> for “{{ searchTerm }}”</span>
                  <span v-if="dateFilter"> with date filter “{{ dateFilterLabel }}”</span>.
                </CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>

          <div class="d-flex justify-content-between align-items-center mt-3">
            <Pagination
  v-if="totalPages > 1"
  :current-page="currentPage"
  :total-pages="totalPages"
  @page-changed="changePage"
/>
            <div style="font-size:14px; color:#7f8c8d;">
              {{ showingRange }}
            </div>
          </div>
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>

  <!-- Add / Edit Modal -->
  <CModal :visible="showFormModal" @close="closeFormModal" :backdrop="!isSubmitting">
    <CModalHeader>
      <CModalTitle>{{ isEdit ? 'Edit Payment' : 'Add Payment' }}</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <CFormSelect
        v-model="form.familyFeeRecordId"
        label="Family Fee Record"
        :disabled="isSubmitting || isLoadingRecords"
      >
        <option value="" disabled selected>Select Family</option>
        <option
          v-for="fr in feeRecordOptions"
          :key="fr.value"
          :value="fr.value"
        >
          {{ fr.label }}
        </option>
      </CFormSelect>

      <CFormInput
        v-model.number="form.amount"
        label="Amount (GHS)"
        type="number"
        step="0.01"
        min="0"
        :disabled="isSubmitting"
        class="mt-3"
      />


      <CAlert color="danger" v-if="formError" class="mt-3">
        {{ formError }}
      </CAlert>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="closeFormModal" :disabled="isSubmitting">
        Cancel
      </CButton>
      <CButton color="primary" class="text-white" @click="savePayment" :disabled="isSubmitting">
        <CSpinner size="sm" v-if="isSubmitting" class="me-1" />
        {{ isEdit ? 'Update' : 'Save' }}
      </CButton>
    </CModalFooter>
  </CModal>

  <!-- Single Delete Confirm -->
  <CModal :visible="showDeleteSingleModal" @close="closeDeleteSingleModal">
    <CModalHeader>
      <CModalTitle>Confirm Delete</CModalTitle>
    </CModalHeader>
    <CModalBody>
      Delete this payment of <strong>{{ formatCurrency(deleteTarget?.amount) }}</strong>?
      <div class="text-danger small mt-2">
        This action cannot be undone.
      </div>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="closeDeleteSingleModal" :disabled="isDeleting">
        Cancel
      </CButton>
      <CButton color="danger" @click="deleteSingle" :disabled="isDeleting">
        <CSpinner size="sm" v-if="isDeleting" class="me-1" />
        Delete
      </CButton>
    </CModalFooter>
  </CModal>

  <!-- Bulk Delete Confirm -->
  <CModal :visible="showBulkDeleteModal" @close="showBulkDeleteModal = false">
    <CModalHeader>
      <CModalTitle>Delete {{ selectedIds.length }} Payments?</CModalTitle>
    </CModalHeader>
    <CModalBody>
      This action cannot be undone.
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="showBulkDeleteModal = false" :disabled="isDeleting">
        Cancel
      </CButton>
      <CButton color="danger" @click="deleteBulk" :disabled="isDeleting">
        <CSpinner size="sm" v-if="isDeleting" class="me-1" />
        Delete Selected
      </CButton>
    </CModalFooter>
  </CModal>
</template>


<script setup>
import { ref, computed, watch, onMounted, reactive } from "vue"
import { useToast } from "vue-toastification"
import Pagination from "@/Pagination.vue"

import {
  family_receipt_pdf,
  get_family_payments_ktor,
  create_family_payment_ktor,
  delete_family_payment_ktor,
  get_raw_family_fee_rec_ktor,
} from "@/services/api"

const schoolName = localStorage.getItem('tenantSchoolName') || 'School'

const toast = useToast()

/* -----------------------------------------
   SETTINGS
----------------------------------------- */
const pageSize = 10

function formatDateTime(value, {
  timeZone = "Africa/Accra",
  locale = "en-GH",
  withSeconds = false,
  hour12 = true,
} = {}) {
  if (value === null || value === undefined || value === "") return "—"

  let date

  // Date object already
  if (value instanceof Date) {
    date = value
  } else {
    const raw = String(value).trim()

    // numeric epoch (seconds or millis)
    if (/^\d+$/.test(raw)) {
      const n = Number(raw)

      // ✅ 13 digits => millis, 10 digits => seconds
      const millis = n < 1e12 ? n * 1000 : n
      date = new Date(millis)
    } else {
      // ISO or other date strings
      date = new Date(raw)
    }
  }

  if (Number.isNaN(date.getTime())) return "—"

  const opts = {
    timeZone,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    ...(withSeconds ? { second: "2-digit" } : {}),
    hour12,
  }

  return new Intl.DateTimeFormat(locale, opts).format(date)
}



const allSelected = computed(() => {
  const idsInView = displayedPayments.value.map(p => p.id)
  return idsInView.length > 0 && idsInView.every(id => selectedIds.value.includes(id))
})

const someSelected = computed(() => {
  const idsInView = displayedPayments.value.map(p => p.id)
  if (idsInView.length === 0) return false
  const selectedCount = idsInView.filter(id => selectedIds.value.includes(id)).length
  return selectedCount > 0 && selectedCount < idsInView.length
})

async function deleteBulk() {
  if (!selectedIds.value.length) {
    toast.warning("No payments selected.")
    return
  }

  isDeleting.value = true

  // copy IDs because we'll mutate selectedIds later
  const ids = [...selectedIds.value]

  try {
    // ✅ delete all (don’t stop if one fails)
    const results = await Promise.allSettled(
      ids.map((id) => delete_family_payment_ktor(id))
    )

    const successIds = []
    const failedIds = []

    results.forEach((r, idx) => {
      const id = ids[idx]
      if (r.status === "fulfilled") successIds.push(id)
      else failedIds.push(id)
    })

    // ✅ remove only successfully deleted ones from UI
    if (successIds.length) {
      const set = new Set(successIds)
      allPayments.value = allPayments.value.filter((p) => !set.has(p.id))
    }

    // ✅ clear selections for those that are deleted
    selectedIds.value = selectedIds.value.filter((id) => failedIds.includes(id))

    // ✅ keep pagination valid after list shrink
    ensureValidPage()

    // ✅ close modal
    showBulkDeleteModal.value = false

    // ✅ toast result
    if (failedIds.length === 0) {
      toast.success(`Deleted ${successIds.length} payment(s) ✅`)
    } else {
      toast.warning(
        `Deleted ${successIds.length} payment(s), failed ${failedIds.length}.`
      )

    }

  } catch (err) {

    toast.error("Bulk delete failed.")
  } finally {
    isDeleting.value = false
  }
}


function toggleSelectAll(e) {
  const idsInView = displayedPayments.value.map(p => p.id)
  if (idsInView.length === 0) return

  // CoreUI change event usually provides e.target.checked
  const checked = e?.target?.checked ?? !allSelected.value

  if (checked) {
    // ✅ Add all ids on this page
    const set = new Set(selectedIds.value)
    idsInView.forEach(id => set.add(id))
    selectedIds.value = Array.from(set)
  } else {
    // ✅ Remove all ids on this page
    selectedIds.value = selectedIds.value.filter(id => !idsInView.includes(id))
  }
}


/* -----------------------------------------
   STATE
----------------------------------------- */
const isLoading = ref(false)
const isLoadingRecords = ref(false)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const errorMessage = ref("")

const allPayments = ref([])
const familyFeeRecords = ref([])

const searchTerm = ref("")
const dateFilter = ref("") // '', 'today', '7days', 'month', 'year'
const currentPage = ref(1)

const selectedIds = ref([])

const showFormModal = ref(false)
const isEdit = ref(false)

const form = reactive({
  familyFeeRecordId: "",
  amount: 0,
  date: new Date().toISOString().split("T")[0],
})

const formError = ref("")

const showDeleteSingleModal = ref(false)
const deleteTarget = ref(null)
const showBulkDeleteModal = ref(false)

/* -----------------------------------------
   HELPERS (PDF DOWNLOAD)
----------------------------------------- */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.style.display = "none"
  document.body.appendChild(a)

  setTimeout(() => {
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 0)
}

/**
 * ✅ THIS is where `family_receipt_pdf` is used.
 * It downloads the PDF by receiptId (not pdfUrl).
 */
async function downloadFamilyReceiptPdfById(receiptId, receiptNo) {
  if (!receiptId) {
    toast.warning("Receipt ID missing. Cannot download.")
    return
  }

  try {
 const receiptSchoolName =
  localStorage.getItem("tenantSchoolName") ||
  localStorage.getItem("schoolName") ||
  "School"

const res = await family_receipt_pdf(receiptId, receiptSchoolName)
    const blob = res.data

    if (!blob || blob.size < 50) {
      toast.error("Receipt PDF is empty or invalid.")
      return
    }

    const name = `${receiptNo || `FAMILY-RECEIPT-${receiptId}`}.pdf`
    downloadBlob(blob, name)
  } catch (e) {

  }
}

/* -----------------------------------------
   HELPERS (UI + FILTERING)
----------------------------------------- */
const formatCurrency = (val) => {
  const num = Number(val)
  return Number.isNaN(num)
    ? "—"
    : num.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const dateFilterLabel = computed(() => {
  switch (dateFilter.value) {
    case "today": return "Today"
    case "7days": return "Past 7 Days"
    case "month": return "This Month"
    case "year": return "This Year"
    default: return "All Dates"
  }
})

function getDateRange(preset) {
  if (!preset) return [null, null]
  const now = new Date()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  let start
  switch (preset) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
      break
    case "7days": {
      const s = new Date(now)
      s.setDate(s.getDate() - 6)
      start = new Date(s.getFullYear(), s.getMonth(), s.getDate(), 0, 0, 0, 0)
      break
    }
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      break
    case "year":
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
      break
    default:
      return [null, null]
  }
  return [start, end]
}

function isWithinRange(value, start, end) {
  if (!start || !end) return true
  if (!value) return false
  const d = typeof value === "number" ? new Date(value) : new Date(value)
  return d >= start && d <= end
}

/* Dropdown options */
const feeRecordOptions = computed(() =>
  familyFeeRecords.value.map((r) => ({
    value: r.id,
    label: `${r.family?.name || "—"} - ${r.term?.name || "—"} - ${r.academic_year?.name || "—"} - ${r.balance ?? "—"}`,
  }))
)

/* Load fee records for dropdown */
async function loadFamilyFeeRecords() {
  try {
    isLoadingRecords.value = true
    const res = await get_raw_family_fee_rec_ktor()
    familyFeeRecords.value = res.data || []
  } catch (e) {

    toast.error("Failed to load family fee records for selection")
  } finally {
    isLoadingRecords.value = false
  }
}

/* Filter + paginate */
const filteredPayments = computed(() => {
  const q = (searchTerm.value || "").trim().toLowerCase()
  const [start, end] = getDateRange(dateFilter.value)

  return allPayments.value.filter((p) => {
    const family = (p.family_fee_record?.family?.name || "").toLowerCase()
    const term = (p.family_fee_record?.term?.name || "").toLowerCase()
    const ay = (p.family_fee_record?.academic_year?.name || "").toLowerCase()

    const textOK = !q || family.includes(q) || term.includes(q) || ay.includes(q)
    const dateOK = isWithinRange(p.date_created, start, end)
    return textOK && dateOK
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredPayments.value.length / pageSize)))

const displayedPayments = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredPayments.value.slice(start, start + pageSize)
})

function ensureValidPage() {
  if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
  if (currentPage.value < 1) currentPage.value = 1
}
function changePage(page) {
  // Pagination component may emit string; force number
  const n = Number(page)
  currentPage.value = Number.isFinite(n) && n > 0 ? n : 1
  ensureValidPage()
}


watch([searchTerm, dateFilter], () => {
  currentPage.value = 1
})
watch(totalPages, () => {
  ensureValidPage()
})

/* Load all payments */
async function loadAllPayments() {
  isLoading.value = true
  errorMessage.value = ""
  try {
    const res = await get_family_payments_ktor()

    allPayments.value = Array.isArray(res.data) ? res.data : (res.data?.data || [])
    ensureValidPage()
    selectedIds.value = []
  } catch (e) {

    errorMessage.value = e?.response?.data?.detail || "Failed to load payments"
    toast.error(errorMessage.value)
  } finally {
    isLoading.value = false
  }
}

/* UI actions */
function openAddModal() {
  isEdit.value = false
  Object.assign(form, {
    familyFeeRecordId: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
  })
  formError.value = ""
  showFormModal.value = true
}

function closeFormModal() {
  if (isSubmitting.value) return
  showFormModal.value = false
}

async function savePayment() {
  if (!form.familyFeeRecordId) {
    formError.value = "Please select a family fee record"
    toast.error(formError.value)
    return
  }

  if (!form.amount || Number(form.amount) <= 0) {
    formError.value = "Amount must be greater than 0"
    toast.error(formError.value)
    return
  }

  isSubmitting.value = true
  formError.value = ""

 const payload = {
  family_fee_record: Number(form.familyFeeRecordId),
  amount: Number(form.amount),

  // ✅ Send school name to backend for receipt PDF
  schoolName: localStorage.getItem('tenantSchoolName') || 'School',


}



  try {
    const res = await create_family_payment_ktor(payload)

    // add to UI
    allPayments.value.unshift(res.data)
    ensureValidPage()

    // ✅ HERE is where you use family_receipt_pdf:
    const receipt = res?.data?.receipt
    if (receipt?.id) {
      await downloadFamilyReceiptPdfById(receipt.id, receipt.receiptNo)
      toast.success(`Payment recorded ✅ Receipt downloaded: ${receipt.receiptNo}`)
    } else {
      toast.success("Payment recorded ✅ (No receipt returned)")
    }

    showFormModal.value = false
  } catch (err) {


    const data = err?.response?.data
    let message = "Failed to save payment"
    if (typeof data === "string") message = data
    else if (data?.message) message = data.message
    else if (data?.detail) message = data.detail
    formError.value = message
    toast.error(message)
  } finally {
    isSubmitting.value = false
  }
}

/* Init */
onMounted(async () => {
  await loadFamilyFeeRecords()
  await loadAllPayments()
})
</script>


<style scoped>
@media (max-width: 576px) {
  .gap-2 { row-gap: 0.5rem; }
}
</style>
