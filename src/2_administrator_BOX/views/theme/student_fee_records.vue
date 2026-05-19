<template>
  <CRow>
    <CCol :xs="12">
      <CCard class="mb-4">
        <CCardHeader class="d-flex flex-column flex-lg-row justify-content-lg-between align-items-lg-center gap-3">
          <strong>Student Fee Records</strong>

          <div class="d-flex flex-wrap gap-2 align-items-center">
            <!-- Fee Structure Filter -->
            <CFormSelect
              v-model="selectedFeeStructureId"
              size="sm"
              style="max-width: 380px; min-width: 240px;"
            >
              <option :value="null">All Fee Structures</option>
              <option v-for="fs in feeStructures" :key="fs.id" :value="fs.id">
                {{ fs.academic_year?.name }} – {{ fs.term?.name }} – {{ fs.grade_class?.name }}
                (GH₵ {{ formatAmount(fs.amount) }})
              </option>
            </CFormSelect>

            <!-- Search Field Selector -->
            <CFormSelect v-model="searchField" size="sm" style="width: 200px;">
              <option value="student">Student Name</option>
              <option value="class">Current Class</option>
              <option value="fully_paid">Fully Paid</option>
            </CFormSelect>

            <!-- Conditional Input / Select -->
            <div v-if="searchField === 'fully_paid'">
              <CFormSelect v-model="fullyPaidFilter" size="sm" style="width: 170px;">
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </CFormSelect>
            </div>
            <CFormInput
              v-else
              v-model="searchTerm"
              :placeholder="searchPlaceholder"
              size="sm"
              style="width: 260px;"
            />

            <!-- Actions -->
            <CButton class="text-white" color="primary" size="sm" @click="openAddModal">
              Add Record
            </CButton>
            <CButton
              color="danger"
              size="sm"
              :disabled="selectedIds.length === 0"
              @click="openBulkDeleteConfirm"
            >
              Delete ({{ selectedIds.length }})
            </CButton>

            <!-- Export buttons -->
            <CButton
              color="success"
              variant="outline"
              size="sm"
              :disabled="isLoading || isExporting || totalCount === 0"
              @click="exportToExcel"
            >
              <CSpinner size="sm" v-if="isExporting" class="me-2" />
              Export Excel
            </CButton>
            <CButton
              color="secondary"
              variant="outline"
              size="sm"
              :disabled="isLoading || isExporting || totalCount === 0"
              @click="exportToPDF"
            >
              <CSpinner size="sm" v-if="isExporting" class="me-2" />
              Export PDF
            </CButton>
          </div>
        </CCardHeader>

        <CCardBody>
          <p class="text-body-secondary small mb-3">
            Track student balances, payment status, and fee records per structure.
          </p>

          <CAlert color="danger" v-if="errorMessage" class="py-2 mb-3">
            {{ errorMessage }}
          </CAlert>

          <div v-if="isLoading" class="d-flex align-items-center gap-2 mb-3">
            <CSpinner size="sm" />
            <span class="text-body-secondary small">Loading records…</span>
          </div>

          <div v-if="isLoading" class="text-center my-5">
            <CSpinner color="primary" class="me-2" />
            <span class="text-primary fw-bold">Loading records...</span>
          </div>

          <CTable v-else hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell class="text-center" style="width:48px;">
                  <CFormCheck
                    :checked="allSelected"
                    :indeterminate="someSelected"
                    @change="toggleSelectAll"
                  />
                </CTableHeaderCell>
                <CTableHeaderCell style="width:60px;">#</CTableHeaderCell>
                <CTableHeaderCell>Student</CTableHeaderCell>
                <CTableHeaderCell>Class</CTableHeaderCell>
                <CTableHeaderCell>Term</CTableHeaderCell>
                <CTableHeaderCell>Academic Year</CTableHeaderCell>
                <CTableHeaderCell class="text-end">Amount Paid</CTableHeaderCell>
                <CTableHeaderCell class="text-end">Balance</CTableHeaderCell>
                <CTableHeaderCell>Fully Paid</CTableHeaderCell>

                <CTableHeaderCell class="text-end" style="width:140px;">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              <CTableRow v-for="(row, idx) in records" :key="row.id">
                <CTableDataCell class="text-center">
                  <CFormCheck v-model="selectedIds" :value="row.id" />
                </CTableDataCell>
                <CTableHeaderCell scope="row">
                  {{ (currentPage - 1) * pageSize + idx + 1 }}
                </CTableHeaderCell>
                <CTableDataCell>{{ row.student?.user?.fullName || '—' }}</CTableDataCell>
                <CTableDataCell>{{ row.feeStructure?.grade_class?.name || '—' }}</CTableDataCell>
                <CTableDataCell>{{ row.feeStructure?.term?.name || '—' }}</CTableDataCell>
                <CTableDataCell>{{ row.feeStructure?.academic_year?.name || '—' }}</CTableDataCell>
                <CTableDataCell class="text-end">{{ formatAmount(row.amountPaid) }}</CTableDataCell>
                <CTableDataCell class="text-end">{{ formatAmount(row.balance) }}</CTableDataCell>
                <CTableDataCell>
                  <CBadge :color="Number(row.balance) === 0 ? 'success' : 'warning'">
                    {{ Number(row.balance) === 0 ? 'Yes' : 'No' }}
                  </CBadge>
                </CTableDataCell>

                <CTableDataCell class="text-end">
                  <CButtonGroup size="sm">
                    <CButton color="danger" variant="outline" @click="openSingleDeleteConfirm(row)">
                      Delete
                    </CButton>
                  </CButtonGroup>
                </CTableDataCell>
              </CTableRow>

              <CTableRow v-if="!isLoading && records.length === 0">
                <CTableDataCell colspan="11" class="text-center text-body-secondary py-4">
                  No fee records found.
                  <div v-if="selectedFeeStructureId || searchTerm || fullyPaidFilter !== ''" class="mt-1 small">
                    Try adjusting the filters above.
                  </div>
                </CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>

          <div class="d-flex justify-content-between align-items-center mt-3">
            <Pagination
              :current-page="currentPage"
              :total-pages="totalPages"
              @page-changed="onPageChanged"
            />
            <div class="text-muted small">
              {{ showingRange }}
            </div>
          </div>
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>

  <!-- Add Record Modal -->
  <CModal :visible="showFormModal" @close="closeFormModal" size="lg">
    <CModalHeader>
      <CModalTitle>Add Fee Record</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <div class="mb-3 position-relative">
        <CFormLabel>Student</CFormLabel>
        <CFormInput
  v-model="studentSearch"
  placeholder="Search student by name..."
  @input="filterStudents"
/>

<!-- Suggestions -->
<div v-if="filteredStudents.length" class="border rounded mt-1 bg-white shadow-sm">
  <div
    v-for="s in filteredStudents"
    :key="s.id"
    class="px-3 py-2 d-flex justify-content-between align-items-center"
    style="cursor: pointer"
    @click="selectStudent(s)"
  >
    <div>
      <div class="fw-semibold">{{ s.user?.fullName || '—' }}</div>
      <div class="text-muted small">
        Class: {{ s.currentNewGradeClass?.name || '—' }}
      </div>
    </div>

    <!-- optional badge -->
    <CBadge color="info">
      {{ s.currentNewGradeClass?.name || '—' }}
    </CBadge>
  </div>
</div>



      </div>

      <div class="mb-3">
        <CFormLabel>Fee Structure</CFormLabel>
        <CFormSelect v-model="formRecord.feeStructureId">
          <option value="" disabled selected>Select Fee Structure</option>
          <option v-for="fs in feeStructures" :key="fs.id" :value="fs.id">
            {{ fs.grade_class?.name }} / {{ fs.term?.name }} / {{ fs.academic_year?.name }}
            – GH₵ {{ formatAmount(fs.amount) }}
          </option>
        </CFormSelect>
      </div>

      <div class="text-danger small mt-2" v-if="formValidationMessage">
        {{ formValidationMessage }}
      </div>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="closeFormModal" :disabled="isSubmitting">
        Cancel
      </CButton>
      <CButton class="text-white" color="primary" @click="submitForm" :disabled="isSubmitting">
        <CSpinner size="sm" v-if="isSubmitting" class="me-2" />
        Save Record
      </CButton>
    </CModalFooter>
  </CModal>

  <!-- Delete Confirmation Modals -->
  <CModal :visible="showDeleteSingleModal" @close="closeDeleteSingleModal">
    <CModalHeader><CModalTitle>Delete Fee Record</CModalTitle></CModalHeader>
    <CModalBody>
      Delete record for
      <strong>{{ deleteTarget?.student?.user?.fullName || '—' }}</strong> →
      <strong>{{ deleteTarget?.feeStructure?.grade_class?.name || '—' }}</strong> /
      {{ deleteTarget?.feeStructure?.term?.name || '—' }} /
      {{ deleteTarget?.feeStructure?.academic_year?.name || '—' }} ?
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="closeDeleteSingleModal" :disabled="isDeleting">
        Cancel
      </CButton>
      <CButton color="danger" @click="confirmDeleteSingle" :disabled="isDeleting">
        <CSpinner size="sm" v-if="isDeleting" class="me-2" />
        Delete
      </CButton>
    </CModalFooter>
  </CModal>

  <CModal :visible="showDeleteBulkModal" @close="closeBulkDeleteConfirm">
    <CModalHeader><CModalTitle>Delete Selected Records</CModalTitle></CModalHeader>
    <CModalBody>
      Delete <strong>{{ selectedIds.length }}</strong> record(s)? This cannot be undone.
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="closeBulkDeleteConfirm" :disabled="isDeleting">
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
import Pagination from "@/Pagination.vue";

import {
  rawst_ktor,
  get_student_fee_records_ktor_paginated,
  create_student_fee_record_ktor,
  delete_student_fee_record_ktor,
  get_raw_fee_structures_ktor,
} from "@/services/api";

// Export libs
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const toast = useToast();
const pageSize = 10;

/* -------------------------------------------------------
   STATE
------------------------------------------------------- */
const isLoading = ref(false);
const isSubmitting = ref(false);
const isDeleting = ref(false);
const isExporting = ref(false);
const errorMessage = ref("");

const records = ref([]);
const feeStructures = ref([]);
const students = ref([]);

const currentPage = ref(1);
const totalPages = ref(1);
const totalCount = ref(0);

const searchField = ref("student"); // UI only (optional backend support)
const searchTerm = ref("");
const fullyPaidFilter = ref(""); // UI may be "", "true", "false", "paid", "unpaid", "yes", "no"
const selectedFeeStructureId = ref(null);

const selectedIds = ref([]);

/* Cache + sequencing to prevent stale responses */
const pageCache = reactive(new Map());
const makeKey = (page, search, fullyPaid, fsId) =>
  `${page}__${search || ""}__${fullyPaid || ""}__${fsId || ""}`;
const clearCache = () => pageCache.clear();
let loadSeq = 0;

/* -------------------------------------------------------
   FORM
------------------------------------------------------- */
const showFormModal = ref(false);
const formRecord = reactive({
  studentId: "",
  feeStructureId: "",
});
const studentSearch = ref("");
const filteredStudents = ref([]);
const formValidationMessage = ref("");

/* -------------------------------------------------------
   DELETE MODALS
------------------------------------------------------- */
const showDeleteSingleModal = ref(false);
const deleteTarget = ref(null);
const showDeleteBulkModal = ref(false);

/* -------------------------------------------------------
   COMPUTED
------------------------------------------------------- */
const rows = computed(() => records.value);

const searchPlaceholder = computed(() => {
  if (searchField.value === "student") return "Search student name...";
  if (searchField.value === "class") return "Search class name...";
  return "Filter records...";
});

const showingRange = computed(() => {
  if (!totalCount.value) return "Showing 0–0 of 0";
  const start = (currentPage.value - 1) * pageSize + 1;
  const end = Math.min(start + pageSize - 1, totalCount.value);
  return `Showing ${start}–${end} of ${totalCount.value}`;
});

const allSelected = computed(() => {
  const idsInView = rows.value.map((r) => r.id);
  return idsInView.length > 0 && idsInView.every((id) => selectedIds.value.includes(id));
});

const someSelected = computed(() => {
  const idsInView = rows.value.map((r) => r.id);
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

function formatDateTime(value) {
  if (value == null || value === "") return "—";

  // supports ISO string or epoch millis
  const d =
    typeof value === "number"
      ? new Date(value)
      : /^\d+$/.test(String(value))
        ? new Date(Number(value))
        : new Date(value);

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
  formRecord.studentId = "";
  formRecord.feeStructureId = "";
  studentSearch.value = "";
  filteredStudents.value = [];
  formValidationMessage.value = "";
}

function validateForm() {
  if (!formRecord.studentId) {
    formValidationMessage.value = "Student is required.";
    return false;
  }
  if (!formRecord.feeStructureId) {
    formValidationMessage.value = "Fee Structure is required.";
    return false;
  }
  formValidationMessage.value = "";
  return true;
}

/* Make sure is_fully_paid becomes "true"/"false"/"" (backend uses toBooleanStrictOrNull) */
function normalizeFullyPaid(v) {
  if (v == null) return "";
  const s = String(v).trim().toLowerCase();
  if (!s) return "";
  if (["true", "1", "yes", "y", "paid"].includes(s)) return "true";
  if (["false", "0", "no", "n", "unpaid"].includes(s)) return "false";
  // already "true"/"false"?
  if (s === "true" || s === "false") return s;
  return ""; // unknown -> ignore filter
}

/* Select all (current page only) */
function toggleSelectAll() {
  const idsInView = rows.value.map((r) => r.id);
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
   LOAD LOOKUPS
------------------------------------------------------- */
async function loadLookups() {
  try {
    const [studentsRes, fsRes] = await Promise.all([
      rawst_ktor(),
      get_raw_fee_structures_ktor(),
    ]);

    students.value = studentsRes?.data || [];
    feeStructures.value = fsRes?.data || [];
  } catch (err) {
    toast.error("Failed to load lookups.", { position: "top-right" });
  }
}

/* -------------------------------------------------------
   LOAD RECORDS (Ktor pagination: data/meta)
------------------------------------------------------- */
async function loadRecords(page = 1, force = false) {
  const search = searchTerm.value?.trim() || "";
  const fullyPaid = normalizeFullyPaid(fullyPaidFilter.value);
  const fsId = selectedFeeStructureId.value ? Number(selectedFeeStructureId.value) : null;

  const key = makeKey(page, search, fullyPaid, fsId ?? "");

  if (!force && pageCache.has(key)) {
    const cached = pageCache.get(key);
    records.value = cached.items;
    totalCount.value = cached.total;
    currentPage.value = cached.page;
    totalPages.value = cached.totalPages;
    return;
  }

  isLoading.value = true;
  errorMessage.value = "";
  const mySeq = ++loadSeq;

  try {
    const res = await get_student_fee_records_ktor_paginated(
      page,
      pageSize,
      search,
      fsId,
      fullyPaid
    );



    if (mySeq !== loadSeq) return;

    const body = res?.data || {};
    const items = body.data || [];
    const meta = body.meta || {};

    records.value = Array.isArray(items) ? items : [];
    totalCount.value = Number(meta.total ?? 0);
    currentPage.value = Number(meta.page ?? page);
    totalPages.value = Number(
      meta.totalPages ?? Math.max(1, Math.ceil(totalCount.value / pageSize))
    );

    pageCache.set(key, {
      items: records.value,
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
      "Failed to load fee records.";

    toast.error(errorMessage.value, { position: "top-right" });
  } finally {
    if (mySeq === loadSeq) isLoading.value = false;
  }
}

/* -------------------------------------------------------
   STUDENT SEARCH (modal)
------------------------------------------------------- */
function filterStudents() {
  const q = (studentSearch.value || "").toLowerCase().trim();
  if (!q) {
    filteredStudents.value = [];
    return;
  }

  filteredStudents.value = (students.value || [])
    .filter((s) => {
      const name = (s.user?.full_name || s.user?.fullName || s.user?.name || "").toLowerCase();
      const cls = (s.currentNewGradeClass?.name || s.current_new_grade_class?.name || "").toLowerCase();
      const dad = (s.contactOfFather || s.contact_of_father || "").toLowerCase();
      const mom = (s.contactOfMother || s.contact_of_mother || "").toLowerCase();

      return name.includes(q) || cls.includes(q) || dad.includes(q) || mom.includes(q);
    })
    .slice(0, 20);
}

function selectStudent(student) {
  formRecord.studentId = student.id;

  const name = student.user?.full_name || student.user?.fullName || student.user?.name || "";
  const cls = student.currentNewGradeClass?.name || student.current_new_grade_class?.name || "";
  studentSearch.value = cls ? `${name} (${cls})` : name;

  filteredStudents.value = [];
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
    studentId: Number(formRecord.studentId),
    feeStructureId: Number(formRecord.feeStructureId),
  };

  try {
    await create_student_fee_record_ktor(payload);
    toast.success("Fee record created.", { position: "top-right" });

    showFormModal.value = false;
    resetForm();

    clearCache();
    await loadRecords(currentPage.value, true);
  } catch (err) {
    formValidationMessage.value =
      err?.response?.data?.message ||
      err?.response?.data?.detail ||
      err?.message ||
      "Failed to create record.";

    toast.error(formValidationMessage.value, { position: "top-right" });
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

function openBulkDeleteConfirm() {
  if (!selectedIds.value.length) return;
  showDeleteBulkModal.value = true;
}

function closeBulkDeleteConfirm() {
  if (isDeleting.value) return;
  showDeleteBulkModal.value = false;
}

async function confirmDeleteSingle() {
  if (!deleteTarget.value?.id) return;
  isDeleting.value = true;

  try {
    await delete_student_fee_record_ktor(deleteTarget.value.id);

    toast.success("Record deleted.", { position: "top-right" });
    records.value = records.value.filter((r) => r.id !== deleteTarget.value.id);
    selectedIds.value = selectedIds.value.filter((id) => id !== deleteTarget.value.id);

    clearCache();
    await loadRecords(currentPage.value, true);
  } catch (err) {
    toast.error("Failed to delete record.", { position: "top-right" });
  } finally {
    isDeleting.value = false;
    closeDeleteSingleModal();
  }
}

async function confirmDeleteBulk() {
  if (!selectedIds.value.length) return;
  isDeleting.value = true;
  const ids = [...selectedIds.value];

  try {
    const results = await Promise.allSettled(ids.map((id) => delete_student_fee_record_ktor(id)));

    let success = 0;
    results.forEach((r) => {
      if (r.status === "fulfilled") success++;
    });

    records.value = records.value.filter((r) => !ids.includes(r.id));
    selectedIds.value = [];

    toast.success(`Deleted ${success} record(s).`, { position: "top-right" });

    clearCache();
    await loadRecords(currentPage.value, true);
  } catch (err) {
    toast.error("Some deletions failed.", { position: "top-right" });
  } finally {
    isDeleting.value = false;
    closeBulkDeleteConfirm();
  }
}

/* -------------------------------------------------------
   EXPORT (fetch all pages using Ktor meta.totalPages)
------------------------------------------------------- */
async function fetchAllRecordsForExport() {
  const search = searchTerm.value?.trim() || "";
  const fullyPaid = normalizeFullyPaid(fullyPaidFilter.value);
  const fsId = selectedFeeStructureId.value ? Number(selectedFeeStructureId.value) : null;

  const EXPORT_LIMIT = 500;

  const firstRes = await get_student_fee_records_ktor_paginated(
    1,
    EXPORT_LIMIT,
    search,
    fsId,
    fullyPaid
  );

  const firstBody = firstRes?.data || {};
  const firstItems = firstBody.data || [];
  const firstMeta = firstBody.meta || {};

  const pages = Number(firstMeta.totalPages ?? 1);
  const all = [...firstItems];

  for (let p = 2; p <= pages; p++) {
    const res = await get_student_fee_records_ktor_paginated(p, EXPORT_LIMIT, search, fsId, fullyPaid);
    all.push(...((res?.data?.data) || []));
  }

  return all;
}

function buildExportRows(list) {
  return list.map((r, i) => {
    const fs = r.fee_structure || r.feeStructure || {};
    const student = r.student || {};
    const user = student.user || {};

    const fullName = user.full_name || user.fullName || user.name || "";
    const fullyPaid = Number(r.balance) === 0 ? "Yes" : "No";

    return [
      i + 1,
      fullName,
      fs.grade_class?.name || "",
      fs.term?.name || "",
      fs.academic_year?.name || "",
      formatAmount(r.amountPaid),
      formatAmount(r.balance),
      fullyPaid,
      formatDateTime(r.dateCreated),
    ];
  });
}

async function exportToPDF() {
  if (isExporting.value) return;

  try {
    isExporting.value = true;

    const all = await fetchAllRecordsForExport();
    if (!all.length) {
      toast.info("No data to export", { position: "top-right" });
      return;
    }

    const headers = ["#", "Student", "Class", "Term", "Academic Year", "Amount Paid", "Balance", "Fully Paid", "Created"];
    const bodyRows = buildExportRows(all);

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(16);
    doc.text("Student Fee Records", 40, 40);

    autoTable(doc, {
      head: [headers],
      body: bodyRows,
      startY: 60,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 6, valign: "middle" },
      headStyles: { fillColor: [78, 115, 223], textColor: 255, fontStyle: "bold" },
    });

    doc.save(`fee-records-${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("Exported to PDF", { position: "top-right" });
  } catch (e) {
    toast.error("Failed to export PDF", { position: "top-right" });
  } finally {
    isExporting.value = false;
  }
}

async function exportToExcel() {
  if (isExporting.value) return;

  try {
    isExporting.value = true;

    const all = await fetchAllRecordsForExport();
    if (!all.length) {
      toast.info("No data to export", { position: "top-right" });
      return;
    }

    const headers = ["#", "Student", "Class", "Term", "Academic Year", "Amount Paid", "Balance", "Fully Paid", "Created"];
    const bodyRows = buildExportRows(all);

    const aoa = [headers, ...bodyRows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    ws["!cols"] = headers.map((h, colIdx) => {
      const colVals = aoa.map((r) => String(r[colIdx] ?? ""));
      const maxLen = Math.max(...colVals.map((v) => v.length));
      return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fee Records");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fee-records-${new Date().toISOString().split("T")[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Exported to Excel", { position: "top-right" });
  } catch (e) {
    toast.error("Failed to export Excel", { position: "top-right" });
  } finally {
    isExporting.value = false;
  }
}

/* -------------------------------------------------------
   WATCHERS & EVENTS
------------------------------------------------------- */
function onPageChanged(page) {
  currentPage.value = Number(page);
  loadRecords(currentPage.value);
}

let filterTimer = null;
watch([searchTerm, searchField, fullyPaidFilter, selectedFeeStructureId], () => {
  clearTimeout(filterTimer);
  filterTimer = setTimeout(() => {
    currentPage.value = 1;
    clearCache();
    loadRecords(1);
  }, 350);
});

watch(studentSearch, () => {
  filterStudents();
});

/* -------------------------------------------------------
   INIT
------------------------------------------------------- */
onMounted(async () => {
  try {
    isLoading.value = true;
    await loadLookups();
    await loadRecords(1);
  } finally {
    isLoading.value = false;
  }
});
</script>


<style scoped>
@media (max-width: 576px) {
  .gap-2 { row-gap: 0.5rem; }
}
</style>
