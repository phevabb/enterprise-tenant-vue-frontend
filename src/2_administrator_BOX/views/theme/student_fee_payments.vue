<template>
  <CRow>
    <CCol :xs="12">
      <CCard class="mb-4">
        <CCardHeader>
          <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <strong>Payments</strong>

            <div class="d-flex align-items-center gap-2 flex-wrap">
              <CFormInput
                v-model="searchTerm"
                placeholder="Search by student, receipt..."
                aria-label="Search payments"
                size="sm"
                style="min-width: 220px"
              />

              <CFormSelect v-model="dateFilter" size="sm" style="min-width: 160px">
                <option value="">All Dates</option>
                <option value="today">Today</option>
                <option value="7days">Past 7 Days</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </CFormSelect>

              <CButton
                color="danger"
                size="sm"
                :disabled="selectedIds.length === 0"
                @click="openBulkDeleteConfirm"
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
          <p class="text-body-secondary small">Record and manage payments.</p>

          <CAlert color="danger" v-if="errorMessage" class="py-2">
            {{ errorMessage }}
          </CAlert>

          <!-- Loading -->
          <div v-if="isLoading" class="text-center my-5">
            <CSpinner color="primary" class="me-2" />
            <span class="text-primary fw-bold">Loading payments...</span>
          </div>

          <!-- Table -->
          <CTable v-else hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell scope="col" class="text-center" style="width: 48px">
                  <CFormCheck
                    :checked="allSelected"
                    :indeterminate="someSelected"
                    @change="toggleSelectAll"
                    aria-label="Select all in current view"
                  />
                </CTableHeaderCell>

                <CTableHeaderCell scope="col" style="width: 60px">#</CTableHeaderCell>
                <CTableHeaderCell scope="col">Student</CTableHeaderCell>
                <CTableHeaderCell scope="col">Class</CTableHeaderCell>
                <CTableHeaderCell scope="col">Term</CTableHeaderCell>
                <CTableHeaderCell scope="col">Academic Year</CTableHeaderCell>
                <CTableHeaderCell scope="col">Date</CTableHeaderCell>
                <CTableHeaderCell scope="col" class="text-end">Amount (GHS)</CTableHeaderCell>
                <CTableHeaderCell scope="col" class="text-end">Balance (GHS)</CTableHeaderCell>
                <CTableHeaderCell scope="col" class="text-end" style="width: 160px">
                  Actions
                </CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              <CTableRow v-for="(row, idx) in rows" :key="row.id">
                <CTableDataCell class="text-center">
                  <CFormCheck v-model="selectedIds" :value="row.id" aria-label="Select row" />
                </CTableDataCell>

                <CTableHeaderCell scope="row">
                  {{ (currentPage - 1) * pageSize + idx + 1 }}
                </CTableHeaderCell>

                <!-- Safely resolve nested dto naming differences -->
                <CTableDataCell>
                  {{
                    (
                      (row.student_fee_record || row.studentFeeRecord)?.student?.user?.full_name ||
                      (row.student_fee_record || row.studentFeeRecord)?.student?.user?.fullName ||
                      (row.student_fee_record || row.studentFeeRecord)?.student?.user?.name ||
                      "—"
                    )
                  }}
                </CTableDataCell>

                <CTableDataCell>
                  {{
                    (
                      (row.student_fee_record || row.studentFeeRecord)?.feeStructure ||
                      (row.student_fee_record || row.studentFeeRecord)?.fee_structure
                    )?.grade_class?.name || "—"
                  }}
                </CTableDataCell>

                <CTableDataCell>
                  {{
                    (
                      (row.student_fee_record || row.studentFeeRecord)?.feeStructure ||
                      (row.student_fee_record || row.studentFeeRecord)?.fee_structure
                    )?.term?.name || "—"
                  }}
                </CTableDataCell>

                <CTableDataCell>
                  {{
                    (
                      (row.student_fee_record || row.studentFeeRecord)?.feeStructure ||
                      (row.student_fee_record || row.studentFeeRecord)?.fee_structure
                    )?.academic_year?.name || "—"
                  }}
                </CTableDataCell>

                <CTableDataCell>
                  {{ formatDate(row.date_created || row.dateCreated || row.created_at || row.createdAt) }}
                </CTableDataCell>

                <CTableDataCell class="text-end">
                  {{ formatAmount(row.amount) }}
                </CTableDataCell>

                <CTableDataCell class="text-end">
                  {{ formatAmount(row.balance) }}
                </CTableDataCell>

                <CTableDataCell class="text-end">
                  <CButtonGroup size="sm">
                    <CButton
                      color="danger"
                      variant="outline"
                      @click="openSingleDeleteConfirm(row)"
                    >
                      Delete
                    </CButton>
                  </CButtonGroup>
                </CTableDataCell>
              </CTableRow>

              <CTableRow v-if="rows.length === 0">
                <CTableDataCell colspan="10" class="text-center text-body-secondary">
                  No payments found<span v-if="searchTerm"> for “{{ searchTerm }}”</span>.
                </CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>

          <!-- Pagination + Range -->
          <div class="d-flex justify-content-between align-items-center mt-3">
            <div>
              <Pagination
                v-if="totalPages > 1"
                :current-page="currentPage"
                :total-pages="totalPages"
                :disabled="isLoading"
                @page-changed="onPageChanged"
              />
            </div>

            <div style="font-size: 14px; color: #7f8c8d">
              {{ showingRange }}
            </div>
          </div>
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>

  <!-- Add Payment Modal -->
  <CModal :visible="showFormModal" @close="closeFormModal" size="lg">
    <CModalHeader>
      <CModalTitle>Add Payment</CModalTitle>
    </CModalHeader>

    <CModalBody>
      <div class="mb-3 position-relative">
        <CFormLabel for="sfr">Student / Class / Term / AY</CFormLabel>
        <CFormInput
          id="sfr"
          v-model="recordSearch"
          placeholder="Search fee record..."
          autocomplete="off"
        />

        <div
          v-if="filteredStudentFeeRecords.length > 0 && recordSearch"
          class="dropdown-menu show w-100 shadow"
          style="max-height: 240px; overflow-y: auto; z-index: 1050"
        >
          <button
            v-for="rec in filteredStudentFeeRecords"
            :key="rec.id"
            class="dropdown-item text-truncate"
            @click="selectRecord(rec)"
            type="button"
          >
            {{
              (rec.student?.user?.full_name || rec.student?.user?.fullName || "—")
            }}
            /
            {{ rec.feeStructure?.grade_class?.name || rec.fee_structure?.grade_class?.name || "—" }}
            /
            {{ rec.feeStructure?.term?.name || rec.fee_structure?.term?.name || "—" }}
            /
            {{ rec.feeStructure?.academic_year?.name || rec.fee_structure?.academic_year?.name || "—" }}
            /
            {{ rec.balance ?? "—" }}
          </button>
        </div>
      </div>

      <div class="mb-3">
        <CFormLabel for="date">Date</CFormLabel>
        <CFormInput id="date" v-model="formPayment.date" type="date" />
        <div class="text-body-secondary small mt-1" v-if="!formPayment.date">
          Defaults to today if left blank.
        </div>
      </div>

      <div class="mb-3">
        <CFormLabel for="amount">Amount (GHS)</CFormLabel>
        <CFormInput
          id="amount"
          v-model="formPayment.amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="e.g., 150.00"
        />
      </div>

      <div class="text-danger small mt-2" v-if="formValidationMessage">
        {{ formValidationMessage }}
      </div>
    </CModalBody>

    <CModalFooter>
      <CButton
        color="secondary"
        variant="outline"
        @click="closeFormModal"
        :disabled="isSubmitting"
      >
        Cancel
      </CButton>

      <CButton
        class="text-white"
        color="primary"
        @click="submitForm"
        :disabled="isSubmitting"
      >
        <CSpinner size="sm" v-if="isSubmitting" class="me-2" />
        Save Payment
      </CButton>
    </CModalFooter>
  </CModal>

  <!-- Delete Confirmations -->
  <CModal :visible="showDeleteSingleModal" @close="closeDeleteSingleModal">
    <CModalHeader>
      <CModalTitle>Delete Payment</CModalTitle>
    </CModalHeader>
    <CModalBody>
      Delete payment of <strong>GHS {{ formatAmount(deleteTarget?.amount) }}</strong>
      for
      <strong>
        {{
          (deleteTarget?.student_fee_record || deleteTarget?.studentFeeRecord)?.student?.user?.full_name ||
          (deleteTarget?.student_fee_record || deleteTarget?.studentFeeRecord)?.student?.user?.fullName ||
          "—"
        }}
      </strong>
      ? This action cannot be undone.
    </CModalBody>
    <CModalFooter>
      <CButton
        color="secondary"
        variant="outline"
        @click="closeDeleteSingleModal"
        :disabled="isDeleting"
      >
        Cancel
      </CButton>
      <CButton color="danger" @click="confirmDeleteSingle" :disabled="isDeleting">
        <CSpinner size="sm" v-if="isDeleting" class="me-2" />
        Delete
      </CButton>
    </CModalFooter>
  </CModal>

  <CModal :visible="showDeleteBulkModal" @close="closeBulkDeleteConfirm">
    <CModalHeader>
      <CModalTitle>Delete Selected Payments</CModalTitle>
    </CModalHeader>
    <CModalBody>
      Delete <strong>{{ selectedIds.length }}</strong> payment(s)? This cannot be undone.
    </CModalBody>
    <CModalFooter>
      <CButton
        color="secondary"
        variant="outline"
        @click="closeBulkDeleteConfirm"
        :disabled="isDeleting"
      >
        Cancel
      </CButton>
      <CButton color="danger" @click="confirmDeleteBulk" :disabled="isDeleting">
        <CSpinner size="sm" v-if="isDeleting" class="me-2" />
        Delete Selected
      </CButton>
    </CModalFooter>
  </CModal>
</template>



<script setup>
import { ref, computed, reactive, watch, onMounted } from "vue";
import { useToast } from "vue-toastification";
import {
  get_payments_ktor_paginated,
  get_raw_student_fee_records_ktor,
  create_payment_ktor,
  delete_payment_ktor,
} from "@/services/api";
import Pagination from "@/Pagination.vue";

const toast = useToast();
const pageSize = 10;

/* -------------------------------------------------------
   STATE
------------------------------------------------------- */
const isLoading = ref(false);
const isSubmitting = ref(false);
const isDeleting = ref(false);
const errorMessage = ref("");

const payments = ref([]);
const currentPage = ref(1);
const totalPages = ref(1);
const totalCount = ref(0);

const searchTerm = ref("");
const dateFilter = ref(""); // today|7days|month|year
const selectedIds = ref([]);

/* Cache + request sequencing */
const pageCache = reactive(new Map());
const makeKey = (page, search, dateF) => `${page}__${search || ""}__${dateF || ""}`;
const clearCache = () => pageCache.clear();
let loadSeq = 0;

/* -------------------------------------------------------
   FORM (Create payment)
------------------------------------------------------- */
const showFormModal = ref(false);
const formPayment = reactive({
  studentFeeRecordId: "",
  date: "",
  amount: "",
});

const recordSearch = ref("");
const studentFeeRecords = ref([]);
const filteredStudentFeeRecords = ref([]);
const formValidationMessage = ref("");

/* -------------------------------------------------------
   DELETE MODALS
------------------------------------------------------- */
const showDeleteSingleModal = ref(false);
const deleteTarget = ref(null);
const showDeleteBulkModal = ref(false);

const formatDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-GH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/* -------------------------------------------------------
   COMPUTED
------------------------------------------------------- */
const rows = computed(() => payments.value);

const showingRange = computed(() => {
  if (totalCount.value === 0) return "Showing 0–0 of 0";
  const start = (currentPage.value - 1) * pageSize + 1;
  const end = Math.min(currentPage.value * pageSize, totalCount.value);
  return `Showing ${start}–${end} of ${totalCount.value}`;
});

const allSelected = computed(() => {
  const idsInView = rows.value.map((p) => p.id);
  return idsInView.length > 0 && idsInView.every((id) => selectedIds.value.includes(id));
});

const someSelected = computed(() => {
  const idsInView = rows.value.map((p) => p.id);
  if (idsInView.length === 0) return false;
  const selectedInView = idsInView.filter((id) => selectedIds.value.includes(id)).length;
  return selectedInView > 0 && selectedInView < idsInView.length;
});

/* -------------------------------------------------------
   HELPERS
------------------------------------------------------- */
function formatAmount(v) {
  const n = Number(v);
  return Number.isNaN(n)
    ? "—"
    : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Handles:
 * - ISO strings
 * - epoch millis (Long)
 */
function formatDateTime(value) {
  if (value == null || value === "") return "—";

  const d =
    typeof value === "number"
      ? new Date(value) // epoch millis
      : /^\d+$/.test(String(value))
        ? new Date(Number(value)) // numeric string millis
        : new Date(value); // ISO string

  if (Number.isNaN(d.getTime())) return "—";

  return d
    .toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(",", "");
}

function resetForm() {
  formPayment.studentFeeRecordId = "";
  formPayment.date = "";
  formPayment.amount = "";
  recordSearch.value = "";
  filteredStudentFeeRecords.value = [];
  formValidationMessage.value = "";
}

function validateForm() {
  if (!formPayment.studentFeeRecordId) {
    formValidationMessage.value = "Please select a student fee record.";
    return false;
  }
  if (formPayment.amount === "" || formPayment.amount == null || Number(formPayment.amount) <= 0) {
    formValidationMessage.value = "Amount must be greater than zero.";
    return false;
  }
  formValidationMessage.value = "";
  return true;
}

/* Select all (only items in current page) */
function toggleSelectAll() {
  const idsInView = rows.value.map((p) => p.id);
  if (idsInView.length === 0) return;

  if (allSelected.value) {
    selectedIds.value = selectedIds.value.filter((id) => !idsInView.includes(id));
  } else {
    const set = new Set(selectedIds.value);
    idsInView.forEach((id) => set.add(id));
    selectedIds.value = [...set];
  }
}

/* -------------------------------------------------------
   DATA LOADING
------------------------------------------------------- */
async function loadStudentFeeRecords() {
  try {
    const res = await get_raw_student_fee_records_ktor();
    studentFeeRecords.value = res?.data || [];
  } catch (err) {
    toast.error("Failed to load student fee records.");
  }
}

async function loadPayments(page = 1, force = false) {
  const search = searchTerm.value?.trim() || "";
  const dateF = dateFilter.value?.trim() || "";
  const key = makeKey(page, search, dateF);

  // Cache hit
  if (!force && pageCache.has(key)) {
    const cached = pageCache.get(key);
    payments.value = cached.items;
    totalCount.value = cached.total;
    currentPage.value = cached.page;
    totalPages.value = cached.totalPages;
    return;
  }

  isLoading.value = true;
  errorMessage.value = "";
  const mySeq = ++loadSeq;

  try {
    // ✅ API: (page, limit, search, date_filter)
    const res = await get_payments_ktor_paginated(page, pageSize, search, dateF);

    if (mySeq !== loadSeq) return;

    // ✅ Ktor shape: { data: [], meta: { page, limit, total, totalPages } }
    const body = res?.data || {};
    const items = body.data || [];
    const meta = body.meta || {};

    payments.value = Array.isArray(items) ? items : [];
    totalCount.value = Number(meta.total ?? 0);
    currentPage.value = Number(meta.page ?? page);
    totalPages.value = Number(meta.totalPages ?? Math.max(1, Math.ceil(totalCount.value / pageSize)));

    pageCache.set(key, {
      items: payments.value,
      total: totalCount.value,
      page: currentPage.value,
      totalPages: totalPages.value,
    });
  } catch (err) {
    if (mySeq !== loadSeq) return;

    errorMessage.value =
      err?.response?.data?.message ||
      err?.response?.data?.detail ||
      err?.message ||
      "Failed to load payments.";

    toast.error(errorMessage.value);
  } finally {
    if (mySeq === loadSeq) isLoading.value = false;
  }
}

/* -------------------------------------------------------
   RECORD SEARCH (client-side)
------------------------------------------------------- */
function filterRecords() {
  const q = (recordSearch.value || "").toLowerCase().trim();
  if (!q) {
    filteredStudentFeeRecords.value = [];
    return;
  }

  const qNum = Number(q);
  const isNum = !Number.isNaN(qNum);

  filteredStudentFeeRecords.value = (studentFeeRecords.value || [])
    .filter((r) => {
      const fullName =
        (r.student?.user?.full_name ||
          r.student?.user?.fullName ||
          r.student?.user?.name ||
          "") + "";

      const name = fullName.toLowerCase();

      const fs = r.feeStructure || r.fee_structure || {};
      const cls = (fs.grade_class?.name || "").toLowerCase();
      const term = (fs.term?.name || "").toLowerCase();
      const year = (fs.academic_year?.name || "").toLowerCase();

      const balanceMatch = isNum ? Number(r.balance) === qNum : false;

      return name.includes(q) || cls.includes(q) || term.includes(q) || year.includes(q) || balanceMatch;
    })
    .slice(0, 15);
}

function selectRecord(record) {
  formPayment.studentFeeRecordId = record.id;

  const fullName =
    record.student?.user?.full_name ||
    record.student?.user?.fullName ||
    record.student?.user?.name ||
    "?";

  const fs = record.feeStructure || record.fee_structure || {};
  recordSearch.value = `${fullName} / ${fs.grade_class?.name || "?"} / ${fs.term?.name || "?"} / ${
    fs.academic_year?.name || "?"
  } / ${record.balance ?? "?"}`;

  filteredStudentFeeRecords.value = [];
}

/* -------------------------------------------------------
   ACTIONS
------------------------------------------------------- */
function openAddModal() {
  resetForm();
  showFormModal.value = true;
}

function closeFormModal() {
  if (isSubmitting.value) return;
  showFormModal.value = false;
  resetForm();
}

async function submitForm() {
  if (!validateForm()) return;
  isSubmitting.value = true;

  const payload = {
    student_fee_record_id: Number(formPayment.studentFeeRecordId),
    amount: Number(formPayment.amount),
    // if backend supports explicit date:
    // date: formPayment.date || new Date().toISOString().split("T")[0],
  };

  try {
    await create_payment_ktor(payload);

    toast.success("Payment recorded successfully.");
    showFormModal.value = false;
    resetForm();

    clearCache();
    await loadPayments(currentPage.value, true);
  } catch (err) {
    formValidationMessage.value =
      err?.response?.data?.message ||
      err?.response?.data?.detail ||
      err?.response?.data ||
      err?.message ||
      "Failed to record payment.";

    toast.error(formValidationMessage.value);
  } finally {
    isSubmitting.value = false;
  }
}

/* -------------------------------------------------------
   DELETE
------------------------------------------------------- */
function openSingleDeleteConfirm(row) {
  deleteTarget.value = row;
  showDeleteSingleModal.value = true;
}

function closeDeleteSingleModal() {
  if (isDeleting.value) return;
  showDeleteSingleModal.value = false;
  deleteTarget.value = null;
}

async function confirmDeleteSingle() {
  if (!deleteTarget.value?.id) return;
  isDeleting.value = true;

  try {
    await delete_payment_ktor(deleteTarget.value.id);

    toast.success("Payment deleted.");
    payments.value = payments.value.filter((p) => p.id !== deleteTarget.value.id);
    selectedIds.value = selectedIds.value.filter((id) => id !== deleteTarget.value.id);

    clearCache();
    await loadPayments(currentPage.value, true);
  } catch (err) {
    toast.error("Failed to delete payment.");
  } finally {
    isDeleting.value = false;
    closeDeleteSingleModal();
  }
}

function openBulkDeleteConfirm() {
  if (selectedIds.value.length === 0) return;
  showDeleteBulkModal.value = true;
}

function closeBulkDeleteConfirm() {
  if (isDeleting.value) return;
  showDeleteBulkModal.value = false;
}

async function confirmDeleteBulk() {
  if (selectedIds.value.length === 0) return;
  isDeleting.value = true;

  const ids = [...selectedIds.value];

  try {
    const results = await Promise.allSettled(ids.map((id) => delete_payment_ktor(id)));

    let successCount = 0;
    results.forEach((r) => {
      if (r.status === "fulfilled") successCount++;
    });

    payments.value = payments.value.filter((p) => !ids.includes(p.id));
    selectedIds.value = [];

    toast.success(`Deleted ${successCount} payment(s).`);

    clearCache();
    await loadPayments(currentPage.value, true);
  } catch (err) {
    toast.error("Some deletions failed.");
  } finally {
    isDeleting.value = false;
    closeBulkDeleteConfirm();
  }
}

/* -------------------------------------------------------
   EVENTS / WATCH
------------------------------------------------------- */
function onPageChanged(page) {
  currentPage.value = Number(page);
  loadPayments(currentPage.value);
}

/* Debounced search/date filter */
let searchTimer = null;
watch([searchTerm, dateFilter], () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentPage.value = 1;
    clearCache();
    loadPayments(1);
  }, 350);
});

/* Record search (client-side) */
watch(recordSearch, () => {
  filterRecords();
});

/* -------------------------------------------------------
   INIT
------------------------------------------------------- */
onMounted(async () => {
  try {
    isLoading.value = true;
    await Promise.all([loadStudentFeeRecords(), loadPayments(1)]);
  } finally {
    isLoading.value = false;
  }
});
</script>


<style scoped>
.dropdown-menu .dropdown-item {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
