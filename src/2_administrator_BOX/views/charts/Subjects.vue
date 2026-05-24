<template>
  <CRow>
    <CCol :xs="12">
      <CCard class="mb-4">





       <CCardHeader
  class="border-bottom py-3 text-white"
  style="background: linear-gradient(90deg, #0ea5e9, #0369a1);"
>

  <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">

    <!-- ✅ LEFT -->
    <div class="d-flex align-items-center gap-2">
      <span class="fw-semibold fs-5">Subjects</span>

      <span class="badge bg-white text-primary border ms-2">
        Manage
      </span>
    </div>

    <!-- ✅ RIGHT -->
    <div class="d-flex align-items-center gap-2 flex-wrap">

      <CFormInput
        v-model="searchTerm"
        placeholder="Search subject..."
        size="sm"
        class="border-0 shadow-sm"
        style="
          min-width: 240px;
          background: rgba(255,255,255,0.9);
        "
      />

      <CButton
        size="sm"
        class="px-3 fw-semibold"
        style="background: #ffffff; color: #0369a1; border: none;"
        @click="openAddModal"
      >
        <CIcon icon="cil-plus" />
        Add Subject
      </CButton>

    </div>

  </div>
</CCardHeader>












<CCardBody>


  <CTable hover responsive bordered>
    <CTableHead color="light">
      <CTableRow>
        <CTableHeaderCell>#</CTableHeaderCell>
        <CTableHeaderCell>Subject Name</CTableHeaderCell>
        <CTableHeaderCell>Category</CTableHeaderCell>

        <CTableHeaderCell class="text-end">Actions</CTableHeaderCell>
      </CTableRow>
    </CTableHead>

    <CTableBody>
      <!-- Loading state -->
      <CTableRow v-if="loading">
        <CTableDataCell colspan="4" class="text-center py-4">
          <CSpinner color="primary" class="me-2" /> Loading data ...
        </CTableDataCell>
      </CTableRow>

      <!-- Empty state -->
      <CTableRow v-else-if="filteredClasses.length === 0">
        <CTableDataCell colspan="4" class="text-center text-muted py-4">
          No subjects found<span v-if="searchTerm"> for “{{ searchTerm }}”.</span>
        </CTableDataCell>
      </CTableRow>

      <!-- Data rows -->
      <CTableRow v-else v-for="(cls, idx) in filteredClasses" :key="cls.id">
        <CTableHeaderCell>{{ idx + 1 }}</CTableHeaderCell>
        <CTableDataCell>{{ cls.name }}</CTableDataCell>
        <CTableDataCell>{{ cls.categoryName || 'N/A' }}</CTableDataCell>
        <CTableDataCell class="text-end">
          <CButtonGroup size="sm">
            <CButton color="secondary" variant="outline" @click="openEditModal(cls)">Edit</CButton>
            <CButton color="danger" variant="outline" @click="deleteClass(cls)">Delete</CButton>
          </CButtonGroup>
        </CTableDataCell>
      </CTableRow>
    </CTableBody>
  </CTable>
</CCardBody>

      </CCard>
    </CCol>
  </CRow>

  <CModal :visible="showDeleteModal" @close="cancelDelete" size="md">
  <CModalHeader class="bg-danger text-white">
    <CModalTitle>Confirm Deletion</CModalTitle>
  </CModalHeader>
  <CModalBody>
    Are you sure you want to delete <strong>{{ classToDelete?.name }}</strong>? This action cannot be reversed.
  </CModalBody>
  <CModalFooter>
    <CButton color="secondary" variant="outline" @click="cancelDelete">Cancel</CButton>
    <CButton color="danger" @click="confirmDelete">Delete</CButton>
  </CModalFooter>
</CModal>


  <!-- Modal -->
<CModal :visible="showFormModal" @close="closeFormModal">
  <CModalHeader>
    <CModalTitle>
      {{ isEdit ? 'Edit Subject' : 'Add Subject' }}
    </CModalTitle>
  </CModalHeader>

  <CModalBody>

  <!-- ✅ SUBJECT NAME -->
  <CFormLabel>Subject Name</CFormLabel>
  <CFormInput
    v-model="form.name"
    placeholder="Enter subject name e.g Mathematics"
  />

  <!-- ✅ CATEGORY DROPDOWN (NEW) -->
  <div class="mt-3">
    <CFormLabel>Category</CFormLabel>
    <CFormSelect v-model="form.categoryId">
      <option disabled value="" selected>Select category</option>

      <option
        v-for="cat in categories"
        :key="cat.id"
        :value="cat.id"
      >
        {{ cat.name }}
      </option>
    </CFormSelect>
  </div>

  <div class="text-end mt-4">
    <CButton
      color="primary"
      class="px-4 text-white"
      :disabled="loading"
      @click="submitForm"
    >
      <CIcon icon="cil-save" class="me-2 text-white" />
      <span v-if="loading">Processing...</span>
      <span v-else>{{ isEdit ? 'Update' : 'Create' }}</span>
    </CButton>
  </div>

</CModalBody>


</CModal>





</template>

<script setup>

import { useToast } from 'vue-toastification'
import { ref, computed, reactive, onMounted } from 'vue'
import {getCategories_ktor, ktor_postSubjects, ktor_patchSubjects, ktor_deleteSubjects, ktor_getSubjects} from '../../../services/api.js'
import { ca } from 'vuetify/locale'

const toast = useToast()

const loading = ref(false)

const showDeleteModal = ref(false)
const classToDelete = ref(null)


async function fetchClasses() {
  loading.value = true;
  try {
    const response = await ktor_getSubjects();
    console.log('Fetched subjectss: print', response.data); // Debug log


    gradeClasses.value = response.data;
  } catch (err) {



    if (err.code === 'ERR_NETWORK') {
      toast.error('Network error. Please check your internet connection.', { position: 'top-right' });
    } else if (err.response) {
      // API returned an error response
      toast.error(err.response.data?.message || 'Failed to fetch classes.', { position: 'top-right' });
    } else {
      // Unknown error
      toast.error('An unexpected error occurred while fetching classes.', { position: 'top-right' });
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchClasses();
  fetchCategories();
});


const gradeClasses = ref([])





const searchTerm = ref('')
const showFormModal = ref(false)
const isEdit = ref(false)
const currentClass = ref(null)
const categories = ref([])



const form = reactive({ name: '', categoryId: '' })

const fetchCategories = async () => {
  try {
    const { data } = await getCategories_ktor()

    categories.value = data

  } catch (err) {

  }
}

function resetForm() {
  form.name = ''
  form.categoryId = ''
}


const filteredClasses = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  return term
    ? gradeClasses.value.filter(c => c.name.toLowerCase().includes(term))
    : gradeClasses.value
})

const openAddModal = () => {
  isEdit.value = false
  currentClass.value = ""
  resetForm()

  showFormModal.value = true
}

const openEditModal = (cls) => {
  isEdit.value = true
  currentClass.value = cls
  form.name = cls.name     // ✅ prefill
  form.categoryId = cls.categoryId || '' // ✅ prefill category if exists
  showFormModal.value = true
}

const closeFormModal = () => {
  showFormModal.value = false
  currentClass.value = null
}

const submitForm = async () => {
  loading.value = true;

  try {
    // ✅ Validate class name only
    if (!form.name || form.name.trim() === '') {
      toast.error('Class Name is required', { position: 'top-right' });
      return;
    }

    const cleanedForm = {
      name: form.name.trim(),
      categoryId: form.categoryId || null // Send null if no category selected
    };

    let response;

    // ✅ EDIT MODE
    if (isEdit.value && currentClass.value?.id) {

      const idToEdit = currentClass.value.id;
      const className = currentClass.value.name;

      response = await ktor_patchSubjects(idToEdit, cleanedForm);


      const index = gradeClasses.value.findIndex(c => c.id === idToEdit);
      if (index !== -1) {
        gradeClasses.value[index] = response.data;
      }

      toast.success(`${className} updated successfully!`, { position: 'top-right' });

    } else {

      // ✅ CREATE MODE
      response = await ktor_postSubjects(cleanedForm);
      gradeClasses.value.push(response.data);
      toast.success('Class created successfully!', { position: 'top-right' });

    }

    closeFormModal();

  } catch (err) {

    const backendMessage = err.response?.data?.message || 'Failed to submit form.';
    toast.error(backendMessage, { position: 'top-right' });

  } finally {

    loading.value = false;

  }
};

const deleteClass = (cs) => {
  classToDelete.value = cs
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!classToDelete.value) return
  loading.value = true
  showDeleteModal.value = false

  const theid = classToDelete.value.id;
  const thename = classToDelete.value.name;

  try {
 await ktor_deleteSubjects(classToDelete.value.id)


    gradeClasses.value = gradeClasses.value.filter(s => s.id !== theid)
    toast.success(`${thename} deleted successfully!`, { position: 'top-right' })
  } catch (error) {

    toast.error('Failed to delete class. Please try again.', { position: 'top-right' })
  } finally {
    loading.value = false
    classToDelete.value = null
  }
}

const cancelDelete = () => {
  showDeleteModal.value = false
  classToDelete.value = null
}

</script>

<style scoped>
/* Ensure header actions wrap well on smaller screens */
@media (max-width: 576px) {
  .gap-2 { row-gap: 0.5rem; }
}
</style>
