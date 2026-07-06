<template>
  <section class="billing-page">
    <!-- HERO -->
    <section class="hero">
      <div class="hero-content">
        <p class="eyebrow">Billing Control Center</p>

        <h1>Student Bills</h1>

        <p>
          Create bill templates, add bill items, generate student bills with arrears,
          download PDF bills for printing, and record payments.
        </p>

        <div class="hero-metrics">
          <span>{{ templates.length }} templates</span>
          <span>{{ studentBills.length }} bills</span>
          <!-- <span>GH₵{{ formatMoney(totalOutstanding) }} outstanding</span> -->
        </div>
      </div>

      <div class="hero-actions">
        <button class="hero-btn light" type="button" @click="reloadEverything">
          Refresh
        </button>

        <button class="hero-btn primary" type="button" @click="startNewTemplate">
          New Template
        </button>
      </div>
    </section>

    <!-- ALERTS -->
    <div v-if="errorMessage" class="alert error-alert">
      {{ errorMessage }}
    </div>

    <div v-if="successMessage" class="alert success-alert">
      {{ successMessage }}
    </div>

    <!-- QUICK STATS -->
    <section class="stats-grid">
      <!-- <article class="stat-card blue">
        <span>Templates</span>
        <strong>{{ templates.length }}</strong>
        <small>{{ activeTemplatesCount }} active</small>
      </article> -->

      <!-- <article class="stat-card green">
        <span>Generated Bills</span>
        <strong>{{ studentBills.length }}</strong>
        <small>{{ paidBillsCount }} paid</small>
      </article> -->

      <!-- <article class="stat-card amber">
        <span>Pending / Partial</span>
        <strong>{{ pendingBillsCount }}</strong>
        <small>Needs payment</small>
      </article> -->

      <!-- <article class="stat-card purple">
        <span>Outstanding</span>
        <strong>GH₵{{ formatMoney(totalOutstanding) }}</strong>
        <small>Total unpaid balance</small>
      </article> -->
    </section>

    <!-- MAIN WORKFLOW -->
    <section class="workflow-card">
      <div class="workflow-tabs">
        <button
          type="button"
          :class="['workflow-tab', { active: activeTab === 'templates' }]"
          @click="activeTab = 'templates'"
        >
          1. Templates
        </button>

        <button
          type="button"
          :class="['workflow-tab', { active: activeTab === 'items' }]"
          :disabled="!selectedTemplate"
          @click="activeTab = 'items'"
        >
          2. Items
        </button>

        <button
          type="button"
          :class="['workflow-tab', { active: activeTab === 'generate' }]"
          :disabled="!selectedTemplate"
          @click="activeTab = 'generate'"
        >
          3. Generate Bills
        </button>

        <button
          type="button"
          :class="['workflow-tab', { active: activeTab === 'bills' }]"
          @click="activeTab = 'bills'"
        >
          4. Bills & Payments
        </button>
      </div>

      <!-- TEMPLATE TAB -->
      <section v-if="activeTab === 'templates'" class="tab-body">
        <div class="two-column">
          <!-- TEMPLATE FORM -->
          <div class="panel">
            <div class="panel-header">
              <div>
                <h2>{{ isEditingTemplate ? 'Edit Template' : 'Create Template' }}</h2>
                <p>
                  A template controls the category, academic year, term, and bill items.
                </p>
              </div>

              <span class="badge">
                {{ isEditingTemplate ? 'Editing' : 'New Template' }}
              </span>
            </div>

            <form class="template-form" @submit.prevent="saveTemplate">
              <label class="full">
                <span>Template Name</span>
                <input
                  v-model.trim="templateForm.name"
                  type="text"
                  placeholder="Primary First Term Bill"
                  required
                />
              </label>

              <label>
                <span>Category </span>
                <select v-model.number="templateForm.categoryId" required>
                  <option :value="null" disabled>Select category</option>
                  <option
                    v-for="category in billingLookups.categories"
                    :key="category.id"
                    :value="category.id"
                  >
                    {{ category.name }}
                  </option>
                </select>
                <small>Example: Primary, KG, JHS category ID.</small>
              </label>

              <label>
                <span>Academic Year</span>
                <select v-model.number="templateForm.academicYearId" required>
                <option :value="null" disabled>Select academic year</option>
                <option
                  v-for="year in billingLookups.academicYears"
                  :key="year.id"
                  :value="year.id"
                >
                  {{ year.name }}
                  <span v-if="year.isCurrent">(Current)</span>
                </option>
              </select>
              </label>

              <label>
                <span>Academic Term </span>
                <select v-model.number="templateForm.academicTermId" required>
                  <option :value="null" disabled>Select term</option>
                  <option
                    v-for="term in filteredAcademicTerms"
                    :key="term.id"
                    :value="term.id"
                  >
                    {{ term.name }}
                    <span v-if="term.isCurrent">(Current)</span>
                  </option>
                </select>
              </label>

              <label class="full">
                <span>Description</span>
                <textarea
                  v-model.trim="templateForm.description"
                  rows="3"
                  placeholder="Optional note about this bill template"
                ></textarea>
              </label>

              <div class="form-actions full">
                <button class="btn primary" type="submit" :disabled="savingTemplate">
                  {{ savingTemplate ? 'Saving...' : isEditingTemplate ? 'Update Template' : 'Create Template' }}
                </button>

                <button class="btn ghost" type="button" @click="resetTemplateForm">
                  Clear
                </button>
              </div>
            </form>
          </div>

          <!-- TEMPLATE LIST -->
          <div class="panel">
            <div class="panel-header">
              <div>
                <h2>Bill Templates</h2>
                <p>Select a template before adding items or generating bills.</p>
              </div>

              <button class="small-btn" type="button" @click="fetchTemplates">
                Reload
              </button>
            </div>

            <div v-if="loadingTemplates" class="empty-state">
              Loading templates...
            </div>

            <div v-else-if="templates.length === 0" class="empty-state">
              No bill templates created yet.
            </div>

            <div v-else class="template-list">
              <article
                v-for="template in templates"
                :key="template.id"
                :class="['template-card', { selected: selectedTemplate?.id === template.id }]"
                @click="selectTemplate(template)"
              >
                <div class="template-main">
                  <div>
                    <h3>{{ template.name }}</h3>
                   <p>
  {{ template.categoryName || `Category ${template.categoryId}` }}
  ·
  {{ template.academicYearName || `Year ${template.academicYearId}` }}
  ·
  {{ template.academicTermName || `Term ${template.academicTermId}` }}
</p>
                    <small>{{ template.items?.length || 0 }} item(s)</small>
                  </div>

                  <span :class="['status-pill', template.isActive ? 'success' : 'muted']">
                    {{ template.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>

                <div class="template-actions" @click.stop>
                  <!-- <button class="mini-action" type="button" @click="editTemplate(template)">
                    Edit
                  </button> -->

                  <!-- <button class="mini-action" type="button" @click="toggleTemplate(template)">
                    {{ template.isActive ? 'Disable' : 'Enable' }}
                  </button> -->

                  <button class="mini-action danger" type="button" @click="deleteTemplate(template)">
                    Delete
                  </button>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <!-- ITEMS TAB -->
      <section v-if="activeTab === 'items'" class="tab-body">
        <div v-if="!selectedTemplate" class="empty-state">
          Select a template first.
        </div>

        <div v-else class="two-column wide-left">
          <div class="panel">
            <div class="panel-header">
              <div>
                <h2>Template Items</h2>
                <p>
                  Add charges like Tuition, Utility, PTA Levy, Toiletries, Exam Fee, etc.
                </p>
              </div>

              <span class="badge">{{ selectedTemplate.name }}</span>
            </div>

            <form class="item-form" @submit.prevent="saveItem">
              <label>
                <span>Item Name</span>
                <input
                  v-model.trim="itemForm.itemName"
                  type="text"
                  placeholder="Tuition"
                  required
                />
              </label>

              <label>
                <span>Amount</span>
                <input
                  v-model.number="itemForm.amountCedis"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="500"
                />
              </label>

              <label>
                <span>Item Type</span>
                <select v-model="itemForm.itemType">
                  <option value="fixed">fixed</option>
                  <option value="optional">optional</option>
                  <option value="discount">discount</option>
                  <option value="arrears">arrears</option>
                </select>
              </label>

              <label>
                <span>Sort Order</span>
                <input v-model.number="itemForm.sortOrder" type="number" min="0" />
              </label>

              <label class="full">
                <span>Description</span>
                <input
                  v-model.trim="itemForm.description"
                  type="text"
                  placeholder="Optional description"
                />
              </label>

              <div class="form-actions full">
                <button class="btn primary" type="submit" :disabled="savingItem">
                  {{ savingItem ? 'Saving...' : editingItemId ? 'Update Item' : 'Add Item' }}
                </button>

                <button class="btn ghost" type="button" @click="resetItemForm">
                  Clear
                </button>
              </div>
            </form>
          </div>

          <div class="panel">
            <div class="panel-header">
              <div>
                <h2>Items in Template</h2>
                <p>These items will be copied to each generated student bill.</p>
              </div>
            </div>

            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Item</th>
                    <th>Amount</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Sort</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  <tr v-for="(item, index) in selectedTemplateItems" :key="item.id">
                    <td>{{ index + 1 }}</td>

                    <td>
                      <strong>{{ item.itemName }}</strong>
                      <small>{{ item.description || 'No description' }}</small>
                    </td>

                    <td>
                      <span v-if="item.amountCedis !== null && item.amountCedis !== undefined">
                        GH₵{{ formatMoney(item.amountCedis) }}
                      </span>
                      <span v-else class="muted-text">Not set</span>
                    </td>

                    <td>{{ item.itemType }}</td>

                    <td>
                      <span :class="['status-pill', item.isActive ? 'success' : 'muted']">
                        {{ item.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </td>

                    <td>{{ item.sortOrder }}</td>

                    <td>
                      <div class="row-actions">
                        <button class="tiny-btn" type="button" @click="editItem(item)">
                          Edit
                        </button>

                        <button class="tiny-btn" type="button" @click="toggleItem(item)">
                          {{ item.isActive ? 'Disable' : 'Enable' }}
                        </button>

                        <button class="tiny-btn danger" type="button" @click="deleteItem(item)">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>

                  <tr v-if="selectedTemplateItems.length === 0">
                    <td colspan="7" class="empty-cell">
                      No items added yet.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <!-- GENERATE TAB -->
      <section v-if="activeTab === 'generate'" class="tab-body">
        <div v-if="!selectedTemplate" class="empty-state">
          Select a template first.
        </div>

        <div v-else class="generate-layout">
          <div class="panel generate-summary-panel">
            <div class="panel-header">
              <div>
                <h2>Generate Individual Bills</h2>
                <p>
                  Bills will be generated for students whose current class belongs to this template’s category.
                  Arrears will be pulled automatically from student fee records.
                </p>
              </div>
            </div>

            <div class="selected-template-box">
              <span>Selected Template</span>
              <strong>{{ selectedTemplate.name }}</strong>
              <small>
  {{ selectedTemplate.categoryName || `Category ${selectedTemplate.categoryId}` }}
  ·
  {{ selectedTemplate.academicYearName || `Year ${selectedTemplate.academicYearId}` }}
  ·
  {{ selectedTemplate.academicTermName || `Term ${selectedTemplate.academicTermId}` }}
</small>
            </div>

            <div class="generate-stats">
              <div>
                <span>Template Items</span>
                <strong>{{ selectedTemplateItems.length }}</strong>
              </div>

              <div>
                <span>Fixed Total</span>
                <strong>GH₵{{ formatMoney(selectedTemplateTotal) }}</strong>
              </div>
            </div>

            <label class="due-date-field">
              <span>Due Date</span>
              <input v-model="dueDate" type="date" />
            </label>

            <button
              class="btn generate"
              type="button"
              :disabled="generatingBills || selectedTemplateItems.length === 0"
              @click="generateIndividualBills"
            >
              {{ generatingBills ? 'Generating...' : 'Generate Student Bills' }}
            </button>
          </div>

          <div v-if="generationResult" class="panel generation-panel">
            <div class="panel-header">
              <div>
                <h2>Generation Result</h2>
                <p>Summary of the most recent bill generation.</p>
              </div>
            </div>

            <div class="result-grid">
              <div>
                <span>Generated</span>
                <strong>{{ generationResult.generatedCount }}</strong>
              </div>

              <div>
                <span>Skipped</span>
                <strong>{{ generationResult.skippedCount }}</strong>
              </div>
            </div>

            <div v-if="generationResult.skippedStudents?.length" class="skipped-box">
              <h3>Skipped Students</h3>

              <div
                v-for="student in generationResult.skippedStudents"
                :key="student.studentId"
                class="skipped-line"
              >
                {{ student.studentName || `Student ID ${student.studentId}` }} — {{ student.reason }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- BILLS TAB -->
      <section v-if="activeTab === 'bills'" class="tab-body">
        <div class="panel">
          <div class="panel-header">
            <div>
              <h2>Generated Student Bills</h2>
              <p>View, print/download PDF, update status, and record payments.</p>
            </div>

            <button class="small-btn" type="button" @click="fetchStudentBills">
              Reload Bills
            </button>
          </div>

          <section class="bill-toolbar">
            <input
              v-model="billSearch"
              type="text"
              placeholder="Search student name, bill number, class, year, term, category..."
            />

            <select v-model="billStatusFilter">
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <input
              v-model.number="studentIdFilter"
              type="number"
              min="1"
              placeholder="Student ID"
            />

            <button class="btn ghost" type="button" @click="fetchBillsByStudent">
              Student Bills
            </button>

            <button
              class="btn ghost"
              type="button"
              :disabled="!selectedTemplate"
              @click="fetchBillsBySelectedTemplate"
            >
              Template Bills
            </button>

            <button class="btn ghost" type="button" @click="fetchStudentBills">
              All Bills
            </button>
          </section>

          <div v-if="loadingBills" class="empty-state">
            Loading bills...
          </div>

          <div v-else class="table-wrap bills-table-wrap">
            <table>

              <thead>
  <tr>
    <th>#</th>
    <th>Bill</th>
    <th>Student</th>
    <th>Class</th>
    <th>Period</th>
    <th>Total</th>

    <th>Balance</th>

    <th>Actions</th>
  </tr>
</thead>

<tbody>
  <tr v-for="(bill, index) in paginatedBills" :key="bill.id">
    <td>{{ billStartIndex + index + 1 }}</td>

    <td>
      <strong>{{ bill.billNumber }}</strong>
      <small>{{ bill.billTemplateName || `Template ${bill.billTemplateId}` }}</small>
      <!-- <small>Bill ID: {{ bill.id }}</small> -->
    </td>

    <td>
      <strong>{{ bill.studentName || `Student ${bill.studentId}` }}</strong>
      <!-- <small>ID: {{ bill.studentId }}</small> -->
    </td>

    <td>{{ bill.classNameSnapshot || '-' }}</td>

    <td>
      <strong>{{ bill.academicYearName || `Year ${bill.academicYearId}` }}</strong>
      <small>{{ bill.academicTermName || `Term ${bill.academicTermId}` }}</small>
      <small>{{ bill.categoryName || `Category ${bill.categoryId}` }}</small>
    </td>

    <td>
      <strong>GH₵{{ formatMoney(bill.totalAmountCedis) }}</strong>
      <small>Arrears: GH₵{{ formatMoney(bill.arrearsCedis) }}</small>
    </td>



    <td>
      <strong>GH₵{{ formatMoney(bill.balanceCedis) }}</strong>
    </td>





    <td>
      <div class="row-actions">
        <!-- <button class="tiny-btn" type="button" @click="viewBill(bill)">
          View
        </button> -->

        <button class="tiny-btn" type="button" @click="downloadBillPdf(bill)">
          PDF
        </button>




      </div>
    </td>
  </tr>

  <tr v-if="filteredBills.length === 0">
    <td colspan="11" class="empty-cell">
      No student bills found.
    </td>
  </tr>
</tbody>

            </table>
          </div>

          <div v-if="filteredBills.length > 0" class="pagination-bar">
            <div>
              Showing
              <strong>{{ billShowingFrom }}</strong>
              -
              <strong>{{ billShowingTo }}</strong>
              of
              <strong>{{ filteredBills.length }}</strong>
              bills
            </div>

            <div class="pagination-controls">
              <button type="button" :disabled="billPage === 1" @click="goToBillPage(1)">
                First
              </button>

              <button type="button" :disabled="billPage === 1" @click="goToBillPage(billPage - 1)">
                Prev
              </button>

              <button
                v-for="page in billVisiblePages"
                :key="page"
                type="button"
                :class="{ active: page === billPage }"
                @click="goToBillPage(page)"
              >
                {{ page }}
              </button>

              <button
                type="button"
                :disabled="billPage === billTotalPages"
                @click="goToBillPage(billPage + 1)"
              >
                Next
              </button>

              <button
                type="button"
                :disabled="billPage === billTotalPages"
                @click="goToBillPage(billTotalPages)"
              >
                Last
              </button>

              <select v-model.number="billPageSize">
                <option :value="5">5 / page</option>
                <option :value="10">10 / page</option>
                <option :value="20">20 / page</option>
                <option :value="50">50 / page</option>
              </select>
            </div>
          </div>
        </div>
      </section>
    </section>

    <!-- BILL DETAIL MODAL -->
    <div v-if="billDetailVisible" class="modal-backdrop" @click.self="closeBillDetail">
      <div class="modal-card wide">
        <div class="modal-header">
          <div>
            <h2>Bill Details</h2>
            <p>{{ selectedBillDetail?.billNumber }}</p>
          </div>

          <button class="modal-close" type="button" @click="closeBillDetail">
            ×
          </button>
        </div>

        <div v-if="loadingBillDetail" class="empty-state">
          Loading bill details...
        </div>

        <div v-else-if="selectedBillDetail" class="bill-detail">
          <div class="detail-grid">
            <div>
              <span>Student ID</span>
              <div>
  <span>Student</span>
  <strong>
    {{ selectedBillDetail.studentName || `Student ${selectedBillDetail.studentId}` }}
  </strong>
</div>
            </div>

            <div>
              <span>Class</span>
              <strong>{{ selectedBillDetail.classNameSnapshot || '-' }}</strong>
            </div>

            <div>
  <span>Category</span>
  <strong>
    {{ selectedBillDetail.categoryName || `Category ${selectedBillDetail.categoryId}` }}
  </strong>
</div>

<div>
  <span>Academic Year</span>
  <strong>
    {{ selectedBillDetail.academicYearName || `Year ${selectedBillDetail.academicYearId}` }}
  </strong>
</div>

<div>
  <span>Term</span>
  <strong>
    {{ selectedBillDetail.academicTermName || `Term ${selectedBillDetail.academicTermId}` }}
  </strong>
</div>

            <div>
              <span>Total</span>
              <strong>GH₵{{ formatMoney(selectedBillDetail.totalAmountCedis) }}</strong>
            </div>

            <div>
              <span>Balance</span>
              <strong>GH₵{{ formatMoney(selectedBillDetail.balanceCedis) }}</strong>
            </div>
          </div>

          <div class="table-wrap modal-table">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="(item, index) in selectedBillDetail.items" :key="item.id">
                  <td>{{ index + 1 }}</td>
                  <td>{{ item.itemName }}</td>
                  <td>{{ item.description || '-' }}</td>
                  <td>{{ item.itemType }}</td>
                  <td>GH₵{{ formatMoney(item.amountCedis) }}</td>
                </tr>

                <tr v-if="selectedBillDetail.items.length === 0">
                  <td colspan="5" class="empty-cell">
                    No bill items found.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="modal-actions">
            <button class="btn primary" type="button" @click="downloadBillPdf(selectedBillDetail)">
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- STATUS MODAL -->
    <div v-if="statusModalVisible" class="modal-backdrop" @click.self="closeStatusModal">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <h2>Update Status</h2>
            <p>{{ activeBillForAction?.billNumber }}</p>
          </div>

          <button class="modal-close" type="button" @click="closeStatusModal">
            ×
          </button>
        </div>

        <label class="modal-field">
          <span>Status</span>
          <select v-model="statusForm.status">
            <option value="pending">pending</option>
            <option value="partial">partial</option>
            <option value="paid">paid</option>
            <option value="cancelled">cancelled</option>
          </select>
        </label>

        <button
          class="btn primary full-width"
          type="button"
          :disabled="savingStatus"
          @click="updateBillStatus"
        >
          {{ savingStatus ? 'Updating...' : 'Update Status' }}
        </button>
      </div>
    </div>

    <!-- PAYMENT MODAL -->
    <div v-if="paymentModalVisible" class="modal-backdrop" @click.self="closePaymentModal">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <h2>Record Payment</h2>
            <p>{{ activeBillForAction?.billNumber }}</p>
          </div>

          <button class="modal-close" type="button" @click="closePaymentModal">
            ×
          </button>
        </div>

        <div class="payment-summary">
          <span>Current Balance</span>
          <strong>GH₵{{ formatMoney(activeBillForAction?.balanceCedis || 0) }}</strong>
        </div>

        <label class="modal-field">
          <span>Amount Paid</span>
          <input
            v-model.number="paymentForm.amountPaidCedis"
            type="number"
            min="1"
            step="0.01"
            placeholder="Enter amount"
          />
        </label>

        <button
          class="btn primary full-width"
          type="button"
          :disabled="savingPayment"
          @click="recordPayment"
        >
          {{ savingPayment ? 'Recording...' : 'Record Payment' }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import axios from 'axios'
import { computed, onMounted, ref, watch } from 'vue'

const api = axios.create({
  baseURL: import.meta.env.VITE_TENANT_API_BASE_URL || 'http://127.0.0.1:9001',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  const tenantSlug = localStorage.getItem('tenantSlug')
  const tenantCode = localStorage.getItem('tenantCode')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (tenantSlug) {
    config.headers['X-Tenant-Slug'] = tenantSlug
  }

  if (tenantCode) {
    config.headers['X-Tenant-Code'] = tenantCode
  }

  return config
})

const activeTab = ref('templates')

const loadingTemplates = ref(false)
const loadingBills = ref(false)
const savingTemplate = ref(false)
const savingItem = ref(false)
const generatingBills = ref(false)
const loadingBillDetail = ref(false)
const savingStatus = ref(false)
const savingPayment = ref(false)

const errorMessage = ref('')
const successMessage = ref('')

const templates = ref([])
const selectedTemplate = ref(null)
const studentBills = ref([])

const isEditingTemplate = ref(false)
const editingTemplateId = ref(null)

const templateForm = ref({
  name: '',
  categoryId: null,
  academicYearId: null,
  academicTermId: null,
  description: '',
})

const itemForm = ref({
  itemName: '',
  description: '',
  amountCedis: null,
  itemType: 'fixed',
  sortOrder: 0,
  isActive: true,
})

const editingItemId = ref(null)

const dueDate = ref('')
const generationResult = ref(null)

const billSearch = ref('')
const billStatusFilter = ref('all')
const studentIdFilter = ref(null)

const billPage = ref(1)
const billPageSize = ref(10)

const billDetailVisible = ref(false)
const selectedBillDetail = ref(null)

const statusModalVisible = ref(false)
const paymentModalVisible = ref(false)
const activeBillForAction = ref(null)

const statusForm = ref({
  status: 'pending',
})

const billingLookups = ref({
  categories: [],
  academicYears: [],
  academicTerms: [],
  currentAcademicYear: null,
  currentAcademicTerm: null,
})

const filteredAcademicTerms = computed(() => {
  if (!templateForm.value.academicYearId) {
    return billingLookups.value.academicTerms
  }

  return billingLookups.value.academicTerms.filter((term) => {
    return Number(term.academicYearId) === Number(templateForm.value.academicYearId)
  })
})

const paymentForm = ref({
  amountPaidCedis: null,
})

async function fetchBillingLookups() {
  try {
    const response = await api.get('billing/lookups')

    billingLookups.value = {
      categories: response.data?.categories || [],
      academicYears: response.data?.academicYears || [],
      academicTerms: response.data?.academicTerms || [],
      currentAcademicYear: response.data?.currentAcademicYear || null,
      currentAcademicTerm: response.data?.currentAcademicTerm || null,
    }

    if (!templateForm.value.academicYearId && billingLookups.value.currentAcademicYear) {
      templateForm.value.academicYearId = billingLookups.value.currentAcademicYear.id
    }

    if (!templateForm.value.academicTermId && billingLookups.value.currentAcademicTerm) {
      templateForm.value.academicTermId = billingLookups.value.currentAcademicTerm.id
    }
  } catch (error) {
    setError(error, 'Unable to load billing lookup data.')
  }
}
const selectedTemplateItems = computed(() => {
  return selectedTemplate.value?.items || []
})

const selectedTemplateTotal = computed(() => {
  return selectedTemplateItems.value
    .filter((item) => item.isActive)
    .reduce((sum, item) => sum + Number(item.amountCedis || 0), 0)
})

const activeTemplatesCount = computed(() => {
  return templates.value.filter((template) => template.isActive).length
})

const paidBillsCount = computed(() => {
  return studentBills.value.filter((bill) => String(bill.status).toLowerCase() === 'paid').length
})

const pendingBillsCount = computed(() => {
  return studentBills.value.filter((bill) => {
    return ['pending', 'partial'].includes(String(bill.status || '').toLowerCase())
  }).length
})

const totalOutstanding = computed(() => {
  return studentBills.value.reduce((sum, bill) => {
    return sum + Number(bill.balanceCedis || 0)
  }, 0)
})

const normalizedBillSearch = computed(() => {
  return billSearch.value.trim().toLowerCase()
})

const filteredBills = computed(() => {
  let list = [...studentBills.value]

  if (billStatusFilter.value !== 'all') {
    list = list.filter((bill) => {
      return String(bill.status || '').toLowerCase() === billStatusFilter.value
    })
  }

  if (studentIdFilter.value) {
    list = list.filter((bill) => Number(bill.studentId) === Number(studentIdFilter.value))
  }

if (normalizedBillSearch.value) {
  list = list.filter((bill) => {
    return [
      bill.billNumber,
      bill.studentId,
      bill.studentName,
      bill.billTemplateName,
      bill.categoryName,
      bill.academicYearName,
      bill.academicTermName,
      bill.classNameSnapshot,
      bill.status,
      bill.totalAmountCedis,
      bill.balanceCedis,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(normalizedBillSearch.value)
  })
}
  return list
})

const billTotalPages = computed(() => {
  const total = Math.ceil(filteredBills.value.length / billPageSize.value)
  return total > 0 ? total : 1
})

const billStartIndex = computed(() => {
  return (billPage.value - 1) * billPageSize.value
})

const paginatedBills = computed(() => {
  return filteredBills.value.slice(
    billStartIndex.value,
    billStartIndex.value + billPageSize.value
  )
})

const billShowingFrom = computed(() => {
  if (!filteredBills.value.length) return 0
  return billStartIndex.value + 1
})

const billShowingTo = computed(() => {
  return Math.min(
    billPage.value * billPageSize.value,
    filteredBills.value.length
  )
})

const billVisiblePages = computed(() => {
  const pages = []
  const maxVisible = 5

  let start = Math.max(1, billPage.value - Math.floor(maxVisible / 2))
  let end = start + maxVisible - 1

  if (end > billTotalPages.value) {
    end = billTotalPages.value
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let page = start; page <= end; page++) {
    pages.push(page)
  }

  return pages
})

async function reloadEverything() {
  clearMessages()

  await Promise.all([
    fetchBillingLookups(),
    fetchTemplates(),
    fetchStudentBills(),
  ])
}

async function fetchTemplates() {
  loadingTemplates.value = true

  try {
    const response = await api.get('billing/templates')


    templates.value = Array.isArray(response.data) ? response.data : []

    if (selectedTemplate.value) {
      const refreshed = templates.value.find((item) => item.id === selectedTemplate.value.id)
      selectedTemplate.value = refreshed || null
    }
  } catch (error) {
    setError(error, 'Unable to load bill templates.')
  } finally {
    loadingTemplates.value = false
  }
}

async function fetchStudentBills() {
  loadingBills.value = true
  clearMessages()

  try {
    const response = await api.get('billing/student-bills')



    studentBills.value = Array.isArray(response.data) ? response.data : []
  } catch (error) {
    setError(error, 'Unable to load student bills.')
  } finally {
    loadingBills.value = false
  }
}

function startNewTemplate() {
  resetTemplateForm()
  selectedTemplate.value = null
  activeTab.value = 'templates'
}

function selectTemplate(template) {
  selectedTemplate.value = template
  generationResult.value = null
}

function editTemplate(template) {
  selectedTemplate.value = template
  isEditingTemplate.value = true
  editingTemplateId.value = template.id

  templateForm.value = {
    name: template.name || '',
    categoryId: template.categoryId || null,
    academicYearId: template.academicYearId || null,
    academicTermId: template.academicTermId || null,
    description: template.description || '',
  }
}

function resetTemplateForm() {
  isEditingTemplate.value = false
  editingTemplateId.value = null

  templateForm.value = {
    name: '',
    categoryId: null,
    academicYearId: null,
    academicTermId: null,
    description: '',
  }
}

async function saveTemplate() {
  clearMessages()

  if (!templateForm.value.name) {
    errorMessage.value = 'Template name is required.'
    return
  }

  savingTemplate.value = true

  try {
    if (isEditingTemplate.value && editingTemplateId.value) {
      const response = await api.put(
        `billing/templates/${editingTemplateId.value}`,
        {
          name: templateForm.value.name,
          description: templateForm.value.description,
        }
      )

      successMessage.value = 'Template updated.'
      selectedTemplate.value = response.data
    } else {
      const response = await api.post('billing/templates', {
        name: templateForm.value.name,
        categoryId: Number(templateForm.value.categoryId),
        academicYearId: Number(templateForm.value.academicYearId),
        academicTermId: Number(templateForm.value.academicTermId),
        description: templateForm.value.description || null,
        items: [],
      })

      successMessage.value = 'Template created.'
      selectedTemplate.value = response.data
      resetTemplateForm()
      activeTab.value = 'items'
    }

    await fetchTemplates()
  } catch (error) {
    setError(error, 'Unable to save template.')
  } finally {
    savingTemplate.value = false
  }
}

async function toggleTemplate(template) {
  clearMessages()

  try {
    const response = await api.patch(`billing/templates/${template.id}/active`, {
      isActive: !template.isActive,
    })

    selectedTemplate.value = response.data
    successMessage.value = 'Template status updated.'

    await fetchTemplates()
  } catch (error) {
    setError(error, 'Unable to update template status.')
  }
}

async function deleteTemplate(template) {
  const confirmed = window.confirm(`Delete template "${template.name}"?`)

  if (!confirmed) return

  clearMessages()

  try {
    await api.delete(`billing/templates/${template.id}`)

    successMessage.value = 'Template deleted.'

    if (selectedTemplate.value?.id === template.id) {
      selectedTemplate.value = null
    }

    await fetchTemplates()
  } catch (error) {
    setError(error, 'Unable to delete template.')
  }
}

function resetItemForm() {
  editingItemId.value = null

  itemForm.value = {
    itemName: '',
    description: '',
    amountCedis: null,
    itemType: 'fixed',
    sortOrder: 0,
    isActive: true,
  }
}

function editItem(item) {
  editingItemId.value = item.id

  itemForm.value = {
    itemName: item.itemName || '',
    description: item.description || '',
    amountCedis: item.amountCedis,
    itemType: item.itemType || 'fixed',
    sortOrder: item.sortOrder || 0,
    isActive: item.isActive,
  }
}

async function saveItem() {
  clearMessages()

  if (!selectedTemplate.value) {
    errorMessage.value = 'Select a template first.'
    return
  }

  if (!itemForm.value.itemName) {
    errorMessage.value = 'Item name is required.'
    return
  }

  savingItem.value = true

  try {
    const payload = {
      itemName: itemForm.value.itemName,
      description: itemForm.value.description || null,
      amountCedis: itemForm.value.amountCedis === null ? null : Number(itemForm.value.amountCedis),
      itemType: itemForm.value.itemType,
      sortOrder: Number(itemForm.value.sortOrder || 0),
      isActive: itemForm.value.isActive,
    }

    if (editingItemId.value) {
      await api.put(
        `billing/templates/${selectedTemplate.value.id}/items/${editingItemId.value}`,
        payload
      )

      successMessage.value = 'Item updated.'
    } else {
      await api.post(
        `billing/templates/${selectedTemplate.value.id}/items`,
        payload
      )

      successMessage.value = 'Item added.'
    }

    resetItemForm()
    await fetchTemplates()
  } catch (error) {
    setError(error, 'Unable to save item.')
  } finally {
    savingItem.value = false
  }
}

async function toggleItem(item) {
  if (!selectedTemplate.value) return

  clearMessages()

  try {
    await api.patch(
      `billing/templates/${selectedTemplate.value.id}/items/${item.id}/active`,
      {
        isActive: !item.isActive,
      }
    )

    successMessage.value = 'Item status updated.'
    await fetchTemplates()
  } catch (error) {
    setError(error, 'Unable to update item.')
  }
}

async function deleteItem(item) {
  if (!selectedTemplate.value) return

  const confirmed = window.confirm(`Delete item "${item.itemName}"?`)

  if (!confirmed) return

  clearMessages()

  try {
    await api.delete(
      `billing/templates/${selectedTemplate.value.id}/items/${item.id}`
    )

    successMessage.value = 'Item deleted.'
    await fetchTemplates()
  } catch (error) {
    setError(error, 'Unable to delete item.')
  }
}

async function generateIndividualBills() {
  clearMessages()

  if (!selectedTemplate.value) {
    errorMessage.value = 'Select a template first.'
    return
  }

  generatingBills.value = true

  try {
    const dueDateEpochMillis = dueDate.value
      ? new Date(dueDate.value).getTime()
      : null

    const response = await api.post(
      `billing/templates/${selectedTemplate.value.id}/generate-individual-bills`,
      {
        dueDateEpochMillis,
      }
    )

    generationResult.value = response.data
    successMessage.value = 'Bills generated.'

    await fetchStudentBills()
    activeTab.value = 'bills'
  } catch (error) {
    setError(error, 'Unable to generate bills.')
  } finally {
    generatingBills.value = false
  }
}

async function fetchBillsBySelectedTemplate() {
  if (!selectedTemplate.value) return

  loadingBills.value = true
  clearMessages()

  try {
    const response = await api.get(
      `billing/templates/${selectedTemplate.value.id}/student-bills`
    )

    studentBills.value = Array.isArray(response.data) ? response.data : []
  } catch (error) {
    setError(error, 'Unable to load template bills.')
  } finally {
    loadingBills.value = false
  }
}

async function fetchBillsByStudent() {
  if (!studentIdFilter.value) {
    errorMessage.value = 'Enter a student ID first.'
    return
  }

  loadingBills.value = true
  clearMessages()

  try {
    const response = await api.get(
      `billing/students/${studentIdFilter.value}/bills`
    )

    studentBills.value = Array.isArray(response.data) ? response.data : []
  } catch (error) {
    setError(error, 'Unable to load student bills.')
  } finally {
    loadingBills.value = false
  }
}

async function viewBill(bill) {
  billDetailVisible.value = true
  loadingBillDetail.value = true
  selectedBillDetail.value = null

  try {
    const response = await api.get(`billing/student-bills/${bill.id}`)

    selectedBillDetail.value = response.data
  } catch (error) {
    setError(error, 'Unable to load bill details.')
  } finally {
    loadingBillDetail.value = false
  }
}

function closeBillDetail() {
  billDetailVisible.value = false
  selectedBillDetail.value = null
}

async function downloadBillPdf(bill) {
  clearMessages()

  try {
    const response = await api.get(
      `billing/student-bills/${bill.id}/pdf`,
      {
        responseType: 'blob',
      }
    )

    const blob = new Blob([response.data], {
      type: 'application/pdf',
    })

    const url = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `${bill.billNumber || 'student-bill'}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()

    window.URL.revokeObjectURL(url)
  } catch (error) {
    setError(error, 'Unable to download bill PDF.')
  }
}

function openStatusModal(bill) {
  activeBillForAction.value = bill
  statusForm.value.status = bill.status || 'pending'
  statusModalVisible.value = true
}

function closeStatusModal() {
  statusModalVisible.value = false
  activeBillForAction.value = null
}

async function updateBillStatus() {
  if (!activeBillForAction.value) return

  savingStatus.value = true
  clearMessages()

  try {
    await api.patch(
      `billing/student-bills/${activeBillForAction.value.id}/status`,
      {
        status: statusForm.value.status,
      }
    )

    successMessage.value = 'Bill status updated.'
    closeStatusModal()
    await fetchStudentBills()
  } catch (error) {
    setError(error, 'Unable to update status.')
  } finally {
    savingStatus.value = false
  }
}

function openPaymentModal(bill) {
  activeBillForAction.value = bill
  paymentForm.value.amountPaidCedis = null
  paymentModalVisible.value = true
}

function closePaymentModal() {
  paymentModalVisible.value = false
  activeBillForAction.value = null
}

async function recordPayment() {
  if (!activeBillForAction.value) return

  if (!paymentForm.value.amountPaidCedis || paymentForm.value.amountPaidCedis <= 0) {
    errorMessage.value = 'Enter a valid payment amount.'
    return
  }

  savingPayment.value = true
  clearMessages()

  try {
    await api.post(
      `billing/student-bills/${activeBillForAction.value.id}/payments`,
      {
        amountPaidCedis: Number(paymentForm.value.amountPaidCedis),
      }
    )

    successMessage.value = 'Payment recorded.'
    closePaymentModal()
    await fetchStudentBills()
  } catch (error) {
    setError(error, 'Unable to record payment.')
  } finally {
    savingPayment.value = false
  }
}

function goToBillPage(page) {
  if (page < 1) {
    billPage.value = 1
    return
  }

  if (page > billTotalPages.value) {
    billPage.value = billTotalPages.value
    return
  }

  billPage.value = page
}

function billStatusClass(status) {
  const value = String(status || '').toLowerCase()

  if (value === 'paid') return 'success'
  if (value === 'partial') return 'warning'
  if (value === 'pending') return 'warning'
  if (value === 'cancelled') return 'danger'

  return 'muted'
}

function formatMoney(value) {
  const numberValue = Number(value || 0)

  if (Number.isNaN(numberValue)) return '0.00'

  return numberValue.toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatDate(epochMillis) {
  if (!epochMillis) return '—'

  return new Date(Number(epochMillis)).toLocaleDateString('en-GH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function clearMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

function setError(error, fallback) {


  errorMessage.value =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data ||
    error?.message ||
    fallback
}

watch(
  [billSearch, billStatusFilter, studentIdFilter, billPageSize],
  () => {
    billPage.value = 1
  }
)

watch(billTotalPages, () => {
  if (billPage.value > billTotalPages.value) {
    billPage.value = billTotalPages.value
  }
})

onMounted(() => {
  reloadEverything()
})
</script>



<style scoped>
.billing-page {
  min-height: 100vh;
  padding: 24px;
  display: grid;
  gap: 24px;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.08), transparent 34%),
    radial-gradient(circle at top right, rgba(124, 58, 237, 0.08), transparent 30%),
    linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
  animation: pageFadeIn 0.45s ease both;
}

/* =========================
   HERO
========================= */
.hero {
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 28px;
  padding: 36px;
  border-radius: 34px;
  color: #ffffff;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.55), transparent 34%),
    radial-gradient(circle at bottom right, rgba(168, 85, 247, 0.35), transparent 35%),
    linear-gradient(135deg, #020617 0%, #111827 55%, #1e293b 100%);
  box-shadow:
    0 34px 80px rgba(15, 23, 42, 0.36),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.hero::before {
  content: "";
  position: absolute;
  width: 420px;
  height: 420px;
  top: -220px;
  right: -140px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
}

.hero::after {
  content: "";
  position: absolute;
  inset: 1px;
  border-radius: 33px;
  border: 1px solid rgba(255, 255, 255, 0.13);
  pointer-events: none;
}

.hero-content,
.hero-actions {
  position: relative;
  z-index: 2;
}

.hero-content {
  max-width: 860px;
}

.eyebrow {
  margin: 0 0 10px;
  color: #93c5fd;
  font-size: 0.74rem;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: 0.16em;
}

.hero h1 {
  margin: 0 0 10px;
  color: #fff7ed;
  font-size: 2.45rem;
  font-weight: 950;
  letter-spacing: -0.055em;
}

.hero p {
  margin: 0;
  color: #cbd5e1;
  line-height: 1.75;
  max-width: 850px;
}

.hero-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.hero-metrics span {
  display: inline-flex;
  align-items: center;
  padding: 9px 13px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  color: #e2e8f0;
  font-weight: 900;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-btn,
.btn,
.small-btn,
.mini-action,
.tiny-btn {
  border: 0;
  cursor: pointer;
  font-weight: 900;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

.hero-btn:hover,
.btn:hover,
.small-btn:hover,
.mini-action:hover,
.tiny-btn:hover {
  transform: translateY(-2px);
}

.hero-btn {
  border-radius: 999px;
  padding: 0.88rem 1.18rem;
  white-space: nowrap;
}

.hero-btn.light {
  background: rgba(255, 255, 255, 0.96);
  color: #0f172a;
  box-shadow: 0 14px 30px rgba(255, 255, 255, 0.14);
}

.hero-btn.primary,
.btn.primary,
.btn.generate {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  box-shadow: 0 16px 35px rgba(37, 99, 235, 0.34);
}

.hero-btn.primary:hover,
.btn.primary:hover,
.btn.generate:hover {
  background: linear-gradient(135deg, #1d4ed8, #1e40af);
  box-shadow: 0 20px 42px rgba(37, 99, 235, 0.42);
}

/* =========================
   ALERTS
========================= */
.alert {
  padding: 15px 18px;
  border-radius: 18px;
  font-weight: 850;
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
}

.error-alert {
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.success-alert {
  color: #166534;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

/* =========================
   STATS
========================= */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.stat-card {
  position: relative;
  overflow: hidden;
  min-height: 132px;
  padding: 22px;
  border-radius: 28px;
  background:
    linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(226, 232, 240, 0.92);
  box-shadow:
    0 22px 56px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
  animation: cardRise 0.55s ease both;
}

.stat-card::before {
  content: "";
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 32px 76px rgba(15, 23, 42, 0.13),
    0 8px 20px rgba(37, 99, 235, 0.07);
}

.stat-card.blue {
  border-top: 4px solid #2563eb;
}

.stat-card.green {
  border-top: 4px solid #16a34a;
}

.stat-card.amber {
  border-top: 4px solid #d97706;
}

.stat-card.purple {
  border-top: 4px solid #7c3aed;
}

.stat-card.blue::before {
  background: radial-gradient(circle at top right, rgba(37, 99, 235, 0.16), transparent 40%);
}

.stat-card.green::before {
  background: radial-gradient(circle at top right, rgba(34, 197, 94, 0.16), transparent 40%);
}

.stat-card.amber::before {
  background: radial-gradient(circle at top right, rgba(249, 115, 22, 0.16), transparent 40%);
}

.stat-card.purple::before {
  background: radial-gradient(circle at top right, rgba(126, 34, 206, 0.16), transparent 40%);
}

.stat-card span,
.stat-card strong,
.stat-card small {
  position: relative;
  z-index: 2;
}

.stat-card span {
  display: block;
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.stat-card strong {
  display: block;
  margin-top: 9px;
  color: #0f172a;
  font-size: 1.82rem;
  font-weight: 950;
  letter-spacing: -0.045em;

}

.stat-card small {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-weight: 750;
}

/* =========================
   WORKFLOW CARD / TABS
========================= */
.workflow-card {
  overflow: hidden;
  border-radius: 32px;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.95);
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.09);
}

.workflow-tabs {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding: 18px;
  border-bottom: 1px solid #e5e7eb;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.06), transparent 28%),
    #ffffff;
}

.workflow-tab {
  border: 1px solid #dbe4ef;
  border-radius: 999px;
  padding: 0.82rem 1.05rem;
  background: #ffffff;
  color: #334155;
  cursor: pointer;
  font-weight: 950;
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;
}

.workflow-tab:hover:not(:disabled) {
  transform: translateY(-2px);
  color: #1d4ed8;
  background: #eff6ff;
  border-color: rgba(37, 99, 235, 0.32);
}

.workflow-tab.active {
  color: #ffffff;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  border-color: #2563eb;
  box-shadow: 0 12px 26px rgba(37, 99, 235, 0.28);
}

.workflow-tab:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.tab-body {
  padding: 24px;
}

/* =========================
   PANELS / LAYOUT
========================= */
.two-column {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 430px;
  gap: 24px;
  align-items: start;
}

.two-column.wide-left {
  grid-template-columns: 430px minmax(0, 1fr);
}

.generate-layout {
  display: grid;
  grid-template-columns: 450px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.panel {
  overflow: hidden;
  border-radius: 28px;
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.95);
  box-shadow:
    0 22px 56px rgba(15, 23, 42, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 22px 24px;
  border-bottom: 1px solid #e5e7eb;
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.05), transparent 32%),
    #ffffff;
}

.panel-header h2 {
  margin: 0;
  color: #0f172a;
  font-weight: 950;
  letter-spacing: -0.03em;
}

.panel-header p {
  margin: 5px 0 0;
  color: #64748b;
  line-height: 1.6;
}

.badge {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  max-width: 260px;
  padding: 7px 11px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.8rem;
  font-weight: 950;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* =========================
   FORMS
========================= */
.template-form,
.item-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  padding: 24px;
}

.template-form .full,
.item-form .full {
  grid-column: 1 / -1;
}

label {
  display: grid;
  gap: 7px;
}

label span,
.modal-field span,
.due-date-field span {
  color: #475569;
  font-size: 0.76rem;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

label small {
  color: #94a3b8;
  font-size: 0.78rem;
  font-weight: 700;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 15px;
  padding: 0.82rem 0.95rem;
  outline: none;
  background: #ffffff;
  color: #0f172a;
  font-weight: 780;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}

textarea {
  resize: vertical;
  min-height: 96px;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

input:disabled,
select:disabled {
  cursor: not-allowed;
  background: #f8fafc;
  color: #94a3b8;
}

.form-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  border-radius: 999px;
  padding: 0.84rem 1.1rem;
  border: none;
  cursor: pointer;
  font-weight: 950;
}

.btn.ghost {
  background: #f1f5f9;
  color: #334155;
}

.btn.ghost:hover {
  background: #e2e8f0;
}

.btn:disabled,
.small-btn:disabled,
.tiny-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.full-width {
  width: 100%;
}

/* =========================
   TEMPLATE LIST
========================= */
.template-list {
  display: grid;
  gap: 14px;
  padding: 20px;
  max-height: 690px;
  overflow: auto;
}

.template-card {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 22px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.template-card:hover {
  transform: translateY(-2px);
  border-color: rgba(37, 99, 235, 0.3);
  background: #eff6ff;
  box-shadow: 0 14px 30px rgba(37, 99, 235, 0.08);
}

.template-card.selected {
  border-color: #2563eb;
  background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
  box-shadow:
    0 0 0 4px rgba(37, 99, 235, 0.08),
    0 18px 38px rgba(37, 99, 235, 0.12);
}

.template-main {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.template-card h3 {
  margin: 0;
  color: #0f172a;
  font-weight: 950;
}

.template-card p {
  margin: 5px 0;
  color: #64748b;
  line-height: 1.5;
}

.template-card small {
  color: #475569;
  font-weight: 800;
}

.template-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.small-btn,
.mini-action,
.tiny-btn {
  border: none;
  border-radius: 999px;
  background: #f1f5f9;
  color: #334155;
  font-weight: 900;
  cursor: pointer;
}

.small-btn {
  padding: 0.66rem 0.95rem;
}

.mini-action,
.tiny-btn {
  padding: 0.48rem 0.75rem;
  font-size: 0.78rem;
}

.mini-action:hover,
.tiny-btn:hover,
.small-btn:hover {
  background: #e2e8f0;
}

.mini-action.danger,
.tiny-btn.danger {
  color: #991b1b;
  background: #fee2e2;
}

.tiny-btn.success {
  color: #166534;
  background: #dcfce7;
}

/* =========================
   TABLES
========================= */
.table-wrap {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 900px;
  border-collapse: collapse;
}

.bills-table-wrap table {
  min-width: 1120px;
}

th {
  padding: 15px 16px;
  text-align: left;
  background: #f8fafc;
  color: #475569;
  font-size: 0.76rem;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

td {
  padding: 16px;
  border-top: 1px solid #f1f5f9;
  color: #0f172a;
  vertical-align: top;
}

td strong {
  font-weight: 950;
}

td small {
  display: block;
  margin-top: 3px;
  color: #64748b;
  font-weight: 700;
}

.empty-state,
.empty-cell {
  padding: 42px;
  text-align: center;
  color: #64748b;
  font-weight: 850;
}

.muted-text {
  color: #94a3b8;
}

.row-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* =========================
   GENERATE
========================= */
.generate-summary-panel {
  position: sticky;
  top: 20px;
}

.selected-template-box {
  margin: 24px;
  padding: 18px;
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.1), transparent 34%),
    #f8fafc;
  border: 1px solid #e5e7eb;
}

.selected-template-box span {
  display: block;
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.selected-template-box strong {
  display: block;
  margin-top: 8px;
  color: #0f172a;
  font-size: 1.1rem;
  font-weight: 950;
}

.selected-template-box small {
  display: block;
  margin-top: 5px;
  color: #64748b;
  font-weight: 750;
}

.generate-stats,
.result-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 0 24px 20px;
}

.generate-stats div,
.result-grid div,
.payment-summary,
.detail-grid div {
  padding: 14px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
}

.generate-stats span,
.result-grid span,
.payment-summary span,
.detail-grid span {
  display: block;
  color: #64748b;
  font-size: 0.74rem;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.generate-stats strong,
.result-grid strong,
.payment-summary strong,
.detail-grid strong {
  display: block;
  margin-top: 5px;
  color: #0f172a;
  font-weight: 950;
}

.due-date-field {
  margin: 0 24px 18px;
}

.btn.generate {
  margin: 0 24px 24px;
  width: calc(100% - 48px);
}

.generation-panel {
  overflow: hidden;
}

.skipped-box {
  margin: 0 24px 24px;
  padding: 18px;
  border-radius: 22px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
}

.skipped-box h3 {
  margin: 0 0 10px;
  color: #9a3412;
  font-weight: 950;
}

.skipped-line {
  padding: 8px 0;
  color: #7c2d12;
  font-weight: 800;
  border-top: 1px solid #fed7aa;
}

/* =========================
   BILLS TOOLBAR
========================= */
.bill-toolbar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding: 18px 24px;
  border-bottom: 1px solid #e5e7eb;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.04), transparent 30%),
    #ffffff;
}

.bill-toolbar input,
.bill-toolbar select {
  width: auto;
  min-width: 170px;
}

.bill-toolbar input:first-child {
  flex: 1 1 320px;
}

/* =========================
   STATUS
========================= */
.status-pill {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 950;
  text-transform: capitalize;
}

.status-pill.success {
  background: #dcfce7;
  color: #166534;
}

.status-pill.warning {
  background: #fef3c7;
  color: #92400e;
}

.status-pill.danger {
  background: #fee2e2;
  color: #991b1b;
}

.status-pill.muted {
  background: #f1f5f9;
  color: #475569;
}

/* =========================
   PAGINATION
========================= */
.pagination-bar {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  flex-wrap: wrap;
  padding: 18px 22px;
  border-top: 1px solid #e5e7eb;
  background: #ffffff;
  color: #64748b;
  font-weight: 800;
}

.pagination-bar strong {
  color: #0f172a;
  font-weight: 950;
}

.pagination-controls {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.pagination-controls button {
  min-width: 38px;
  height: 38px;
  padding: 0 12px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  background: #ffffff;
  color: #334155;
  font-weight: 850;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease;
}

.pagination-controls button:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: #2563eb;
  color: #2563eb;
  background: #eff6ff;
}

.pagination-controls button.active {
  color: #ffffff;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  border-color: #2563eb;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.28);
}

.pagination-controls button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.pagination-controls select {
  height: 38px;
  padding: 0 10px;
  border-radius: 12px;
}

/* =========================
   MODALS
========================= */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.58);
  backdrop-filter: blur(10px);
}

.modal-card {
  width: min(480px, 100%);
  max-height: 92vh;
  overflow: auto;
  padding: 24px;
  border-radius: 30px;
  background: #ffffff;
  box-shadow:
    0 40px 100px rgba(15, 23, 42, 0.38),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
  animation: modalPop 0.22s ease both;
}

.modal-card.wide {
  width: min(920px, 100%);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 20px;
}

.modal-header h2 {
  margin: 0;
  color: #0f172a;
  font-weight: 950;
}

.modal-header p {
  margin: 5px 0 0;
  color: #64748b;
  font-weight: 760;
}

.modal-close {
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 999px;
  background: #f1f5f9;
  color: #0f172a;
  font-size: 1.35rem;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background 0.18s ease;
}

.modal-close:hover {
  transform: rotate(90deg);
  background: #e2e8f0;
}

.modal-field {
  display: grid;
  gap: 8px;
  margin-bottom: 18px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.modal-table {
  border-radius: 20px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 18px;
}

.payment-summary {
  margin-bottom: 18px;
}

/* =========================
   RESPONSIVE
========================= */
.stats-grid {
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

/* Large screens */
.stats-grid {
  grid-template-columns: repeat(12, minmax(0, 1fr));
}

@media (max-width: 1600px) {
  .stats-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

@media (max-width: 1250px) {
  .stats-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }

  .two-column,
  .two-column.wide-left,
  .generate-layout {
    grid-template-columns: 1fr;
  }

  .generate-summary-panel {
    position: static;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .billing-page {
    padding: 14px;
  }

  .hero {
    flex-direction: column;
    align-items: flex-start;
    padding: 26px;
    border-radius: 26px;
  }

  .hero h1 {
    font-size: 1.75rem;
  }

  .hero-actions,
  .hero-btn {
    width: 100%;
  }

  .hero-btn {
    justify-content: center;
  }

  .stats-grid,
  .template-form,
  .item-form,
  .generate-stats,
  .result-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .workflow-tabs {
    display: grid;
    grid-template-columns: 1fr;
  }

  .tab-body {
    padding: 16px;
  }

  .panel-header {
    flex-direction: column;
  }

  .bill-toolbar input,
  .bill-toolbar select,
  .bill-toolbar .btn {
    width: 100%;
  }

  .pagination-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .pagination-controls {
    justify-content: center;
  }

  .pagination-controls select {
    width: 100%;
  }
}

/* =========================
   ANIMATIONS
========================= */
@keyframes pageFadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes cardRise {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes modalPop {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.97);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
