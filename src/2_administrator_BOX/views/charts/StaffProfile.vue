<template>
  <CRow>
    <CCol :xs="12">
      <CCard class="mb-4">
        <CCardHeader>
          <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
            <strong>Staff Members</strong>

            <div class="d-flex align-items-center gap-2 flex-wrap">
              <CFormInput
                v-model="searchTerm"
                placeholder="Search by name..."
                aria-label="Search by name"
                size="sm"
                style="min-width: 260px;"
              />

              <CButton class="text-white" color="primary" size="sm" @click="openAddModal">
                Add Staff
              </CButton>
            </div>
          </div>
        </CCardHeader>

        <CCardBody>
          <div v-if="loading" class="text-center my-4">
            <CSpinner color="primary" class="me-2" /> Loading data ...
          </div>

          <CTable v-else hover responsive bordered class="shadow-sm">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>#</CTableHeaderCell>
                <CTableHeaderCell>Name</CTableHeaderCell>
                <CTableHeaderCell>Class</CTableHeaderCell>
                <CTableHeaderCell>ID</CTableHeaderCell>
                <CTableHeaderCell>Pin</CTableHeaderCell>
                <CTableHeaderCell>Gender</CTableHeaderCell>
                <CTableHeaderCell>Contact</CTableHeaderCell>

                <CTableHeaderCell class="text-end">Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>

            <CTableBody>
              <CTableRow
                v-for="(row, idx) in filteredStaff"
                :key="row.id"
              >
                <CTableHeaderCell>{{ idx + 1 }}</CTableHeaderCell>
                <CTableDataCell>{{ row.user.fullName }}</CTableDataCell>
                <CTableDataCell>{{ row.assignedClass?.name || '—' }}</CTableDataCell>
                <CTableDataCell>{{ row.user.userId }}</CTableDataCell>
                <CTableDataCell>{{ row.user.pin }}</CTableDataCell>
                <CTableDataCell>{{ row.user.gender }}</CTableDataCell>
                <CTableDataCell>{{ row.tel }}</CTableDataCell>



                <CTableDataCell class="text-end">
                  <CButtonGroup size="sm">
                    <CButton color="secondary" variant="outline" @click="openEditModal(row)">Edit</CButton>
                    <CButton color="danger" variant="outline" @click="prepareDelete(row)">Delete</CButton>
                  </CButtonGroup>
                </CTableDataCell>
              </CTableRow>

              <CTableRow v-if="!loading && filteredStaff.length === 0">
                <CTableDataCell colspan="9" class="text-center text-body-secondary">
                  No staff found <span v-if="searchTerm">for “{{ searchTerm }}”.</span>
                </CTableDataCell>
              </CTableRow>
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>

  <!-- DELETE MODAL -->
  <CModal :visible="showDeleteModal" @close="cancelDelete" size="md">
    <CModalHeader class="bg-danger text-white">
      <CModalTitle>Confirm Deletion</CModalTitle>
    </CModalHeader>

    <CModalBody>
      Are you sure you want to delete
      <strong>{{ staffToDelete?.user?.fullName }}</strong>? This action cannot be reversed.
    </CModalBody>

    <CModalFooter>
      <CButton color="secondary" variant="outline" @click="cancelDelete">Cancel</CButton>
      <CButton color="danger" @click="confirmDelete">Delete</CButton>
    </CModalFooter>
  </CModal>

  <!-- CREATE/EDIT MODAL -->
  <CModal :visible="showFormModal" @close="closeFormModal">
    <CModalHeader>
      <CModalTitle>{{ isEdit ? 'Edit Staff' : 'Add Staff' }}</CModalTitle>
    </CModalHeader>

    <CModalBody>
      <div class="mb-3">
        <CFormLabel>Full Name</CFormLabel>
        <CFormInput v-model="form.user.fullName" />
      </div>

      <div class="mb-3">
        <CFormLabel>Contact</CFormLabel>
        <CFormInput v-model="form.tel" />
      </div>

      <div class="mb-3">
        <CFormLabel>Gender</CFormLabel>
        <CFormSelect v-model="form.user.gender">
          <option disabled value="" selected>Select Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </CFormSelect>
      </div>

      <div class="mb-3">
        <CFormLabel>Class</CFormLabel>
        <CFormSelect v-model="form.assignedClass">
          <option disabled value="" selected >Select Class</option>
          <option v-for="c in classes" :key="c.id" :value="c.id">
            {{ c.name }}
          </option>
        </CFormSelect>
      </div>

      <CButton color="primary" class="text-white" style="color: white !important;" @click="submitForm">
        {{ isEdit ? 'Update' : 'Create' }}
      </CButton>

    </CModalBody>
  </CModal>


</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useToast } from "vue-toastification";
import {
  get_classes_ktor,
  get_staff_ktor,
  create_staff_ktor,
  update_staff_ktor,
  delete_staff_ktor,
} from "@/services/api";

const toast = useToast();

// =========================
// STATE
// =========================
const loading = ref(false);
const staff = ref([]);
const classes = ref([]);
const searchTerm = ref("");

const showDeleteModal = ref(false);
const staffToDelete = ref(null);

const showFormModal = ref(false);
const isEdit = ref(false);
const currentStaff = ref(null);


async function fetchClasses() {
  try {
    const response = await get_classes_ktor();
    classes.value = response.data;

  } catch (err) {
    toast.error("Failed to load classes.");
  }
}

// Form State
const form = ref({
  user: {
    fullName: "",
    gender: "",
    dateOfBirth: "",
    role: "staff",
    nationality: "Ghanaian",
      isActive: true,
      isStaff: true
  },
  assignedClass: "",
  tel: "",
});

// CLASS OPTIONS


// =========================
// LOAD STAFF
// =========================
async function fetchStaff() {
  loading.value = true;

  try {
    const response = await get_staff_ktor();

    staff.value = response.data;
  } catch (err) {

    toast.error("Failed to fetch staff.");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchStaff()
  fetchClasses()
})
// =========================
// FILTERING
// =========================
const filteredStaff = computed(() => {
  const t = searchTerm.value.toLowerCase().trim();
  if (!t) return staff.value;

  return staff.value.filter((s) =>
    s.user.fullName.toLowerCase().includes(t)
  );
});

// =========================
// DELETE STAFF
// =========================
const prepareDelete = (row) => {
  staffToDelete.value = row;
  showDeleteModal.value = true;
};

const cancelDelete = () => {
  showDeleteModal.value = false;
  staffToDelete.value = null;
};

const confirmDelete = async () => {
  if (!staffToDelete.value) return;

  try {

    await delete_staff_ktor(staffToDelete.value.id);

    staff.value = staff.value.filter(
      (s) => s.id !== staffToDelete.value.id
    );

    toast.success("Staff deleted");
  } catch {
    toast.error("Failed to delete staff.");
  }

  cancelDelete();
};

// =========================
// ADD / EDIT STAFF
// =========================
const openAddModal = () => {
  isEdit.value = false;
  currentStaff.value = null;

  form.value = {
    user: {
      fullName: "",
      gender: "",
      dateOfBirth: "2002-02-02",
      role: "staff",
      nationality: "Ghanaian",
      isActive: true,
      isStaff: true
    },
    assignedClass: "",
    tel: "",
  };

  showFormModal.value = true;
};

const openEditModal = (row) => {



  isEdit.value = true;
  currentStaff.value = row;

  form.value = {
    user: {
      fullName: row.user.fullName,
      gender: row.user.gender,
      dateOfBirth: row.user.dateOfBirth,
      role: row.user.role,
    },

    tel: row.tel ?? "",

    // ✅ MATCH BACKEND FIELD NAME
    assignedClass: row.assignedClass?.id ?? null
  };

  showFormModal.value = true;
};


const closeFormModal = () => {
  showFormModal.value = false;
};

// =========================
// SUBMIT FORM
// =========================
const submitForm = async () => {

  loading.value = true;

  const payload = JSON.parse(JSON.stringify(form.value));

  if (!payload.user.fullName) {
    toast.error("Full name is required.");
    loading.value = false;
    return;
  }

  if (!payload.user.gender) {
    toast.error("Gender is required.");
    loading.value = false;
    return;
  }

  // ✅ Ensure assignedClass is never null BEFORE sending
  if (!payload.assignedClass) {

    toast.error("Assigned class is required.");
    loading.value = false;
    return;

  } else {

    payload.assignedClassId = payload.assignedClass;

  }

  // ❌ NEVER SEND assignedClass
  delete payload.assignedClass;

  try {

    if (isEdit.value) {
      await update_staff_ktor(currentStaff.value.id, payload);
      toast.success("Staff updated!");
    } else {

      await create_staff_ktor(payload);
      toast.success("Staff created!");
    }

    closeFormModal();
    fetchStaff();

  } catch (error) {


    toast.error("Failed to save staff.");

  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
@media (max-width: 576px) {
  .gap-2 {
    row-gap: 0.5rem;
  }
}
</style>
