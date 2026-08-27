<template>
  <div class="admin-complaints-page">
    <section class="complaints-hero">
      <div class="hero-copy">
        <span class="hero-badge">
          <i class="pi pi-shield"></i>
          Phena Administration Center
        </span>

        <h1>Parent Complaints</h1>

        <p>
          Review parent concerns, communicate securely, assign cases,
          add internal notes, and track each complaint to resolution.
        </p>
      </div>

      <div class="hero-summary">
        <article class="hero-stat-card">
          <span class="hero-stat-icon total">
            <i class="pi pi-inbox"></i>
          </span>

          <div>
            <span>Total Complaints</span>
            <strong>{{ complaints.length.toLocaleString() }}</strong>
          </div>
        </article>

        <article class="hero-stat-card">
          <span class="hero-stat-icon attention">
            <i class="pi pi-exclamation-circle"></i>
          </span>

          <div>
            <span>Needs Attention</span>
            <strong>{{ needsAttentionCount.toLocaleString() }}</strong>
          </div>
        </article>

        <article class="hero-stat-card">
          <span class="hero-stat-icon resolved">
            <i class="pi pi-check-circle"></i>
          </span>

          <div>
            <span>Resolved</span>
            <strong>{{ resolvedCount.toLocaleString() }}</strong>
          </div>
        </article>
      </div>
    </section>

    <section class="complaint-toolbar">
      <div class="complaint-search">
        <i class="pi pi-search"></i>

        <input
          v-model.trim="searchTerm"
          type="search"
          autocomplete="off"
          placeholder="Search complaint number, parent, student, or subject..."
          aria-label="Search complaints"
        >

        <button
          v-if="searchTerm"
          type="button"
          class="clear-search-btn"
          title="Clear search"
          aria-label="Clear complaint search"
          @click="searchTerm = ''"
        >
          <i class="pi pi-times"></i>
        </button>
      </div>

      <div class="toolbar-actions">
        <select
          v-model="statusFilter"
          class="status-filter"
          aria-label="Filter complaints by status"
          :disabled="complaintsLoading"
          @change="loadComplaints"
        >
          <option value="">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="AWAITING_PARENT">Awaiting Parent</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
          <option value="REOPENED">Reopened</option>
        </select>

        <select
          v-model="priorityFilter"
          class="priority-filter"
          aria-label="Filter complaints by priority"
        >
          <option value="">All priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="NORMAL">Normal</option>
          <option value="LOW">Low</option>
        </select>

        <button
          type="button"
          class="refresh-btn"
          :disabled="complaintsLoading"
          @click="loadComplaints"
        >
          <i
            class="pi"
            :class="
              complaintsLoading
                ? 'pi-spin pi-spinner'
                : 'pi-refresh'
            "
          ></i>

          <span>
            {{
              complaintsLoading
                ? 'Refreshing...'
                : 'Refresh'
            }}
          </span>
        </button>
      </div>
    </section>

    <section class="complaints-shell">
      <aside class="complaints-sidebar">
        <header class="sidebar-heading">
          <div>
            <span class="section-label">Complaint Queue</span>
            <h2>Cases</h2>
          </div>

          <span class="result-count">
            {{ filteredComplaints.length }}
          </span>
        </header>

        <div
          v-if="complaintsLoading && complaints.length === 0"
          class="sidebar-state"
        >
          <span class="state-icon loading">
            <i class="pi pi-spin pi-spinner"></i>
          </span>

          <strong>Loading complaints</strong>

          <p>
            Retrieving parent complaints for this school...
          </p>
        </div>

        <div
          v-else-if="filteredComplaints.length === 0"
          class="sidebar-state"
        >
          <span class="state-icon">
            <i class="pi pi-inbox"></i>
          </span>

          <strong>No complaints found</strong>

          <p>
            No complaints match the selected filters.
          </p>
        </div>

        <div
          v-else
          class="complaint-list"
        >
          <button
            v-for="complaint in filteredComplaints"
            :key="complaint.id"
            type="button"
            class="complaint-list-item"
            :class="{
              active:
                Number(selectedComplaintId) ===
                Number(complaint.id)
            }"
            @click="openComplaint(complaint)"
          >
            <span
              class="priority-indicator"
              :class="normalizeClassName(complaint.priority)"
            ></span>

            <span class="complaint-list-content">
              <span class="complaint-list-top">
                <strong>
                  {{ complaint.complaintNumber }}
                </strong>

                <small>
                  {{ formatRelativeDate(complaint.updatedAt) }}
                </small>
              </span>

              <span class="complaint-subject">
                {{ complaint.subject }}
              </span>

              <span class="complaint-participant">
                <i class="pi pi-user"></i>

                {{ complaint.studentName }}
              </span>

              <span class="complaint-list-footer">
                <span
                  class="status-pill"
                  :class="normalizeClassName(complaint.status)"
                >
                  {{ formatLabel(complaint.status) }}
                </span>

                <span
                  class="priority-pill"
                  :class="normalizeClassName(complaint.priority)"
                >
                  {{ formatLabel(complaint.priority) }}
                </span>

                <span
                  v-if="Number(complaint.unreadReplyCount) > 0"
                  class="unread-reply-badge"
                >
                  {{ complaint.unreadReplyCount }}
                </span>
              </span>
            </span>
          </button>
        </div>
      </aside>

      <main class="complaint-workspace">
        <div
          v-if="!selectedComplaintId"
          class="workspace-empty"
        >
          <span class="workspace-empty-icon">
            <i class="pi pi-file-edit"></i>
          </span>

          <h2>Select a complaint</h2>

          <p>
            Choose a complaint from the queue to review its details,
            reply to the parent, add internal notes, or update its status.
          </p>

          <div class="workspace-guidance">
            <div>
              <i class="pi pi-comments"></i>
              <span>Send secure replies to parents</span>
            </div>

            <div>
              <i class="pi pi-lock"></i>
              <span>Add notes visible only to administrators</span>
            </div>

            <div>
              <i class="pi pi-check-circle"></i>
              <span>Track cases through resolution and closure</span>
            </div>
          </div>
        </div>

        <div
          v-else-if="complaintDetailsLoading"
          class="workspace-empty"
        >
          <span class="workspace-empty-icon loading">
            <i class="pi pi-spin pi-spinner"></i>
          </span>

          <h2>Loading complaint</h2>

          <p>
            Retrieving the complete complaint history...
          </p>
        </div>

        <template v-else-if="selectedComplaint">
          <header class="complaint-detail-header">
            <div class="complaint-identity">
              <div class="complaint-number-row">
                <span class="complaint-number">
                  {{ selectedComplaint.complaintNumber }}
                </span>

                <span
                  class="status-pill large"
                  :class="normalizeClassName(selectedComplaint.status)"
                >
                  {{ formatLabel(selectedComplaint.status) }}
                </span>
              </div>

              <h2>{{ selectedComplaint.subject }}</h2>

              <div class="complaint-identity-meta">
                <span>
                  <i class="pi pi-user"></i>
                  {{ selectedComplaint.studentName }}
                </span>

                <span>
                  <i class="pi pi-tag"></i>
                  {{ formatLabel(selectedComplaint.category) }}
                </span>

                <span>
                  <i class="pi pi-calendar"></i>
                  {{ formatDateTime(selectedComplaint.createdAt) }}
                </span>
              </div>
            </div>

            <button
              type="button"
              class="detail-refresh-btn"
              title="Refresh complaint details"
              :disabled="complaintDetailsLoading"
              @click="refreshSelectedComplaint"
            >
              <i
                class="pi"
                :class="
                  complaintDetailsLoading
                    ? 'pi-spin pi-spinner'
                    : 'pi-refresh'
                "
              ></i>

              <span>Refresh</span>
            </button>
          </header>

          <div class="complaint-detail-grid">
            <section class="complaint-main-column">
              <article class="original-complaint-card">
                <header>
                  <div>
                    <span class="card-eyebrow">
                      Original Complaint
                    </span>

                    <h3>Parent's concern</h3>
                  </div>

                  <span
                    class="priority-pill large"
                    :class="normalizeClassName(selectedComplaint.priority)"
                  >
                    {{ formatLabel(selectedComplaint.priority) }}
                  </span>
                </header>

                <p>
                  {{ selectedComplaint.description }}
                </p>

                <footer>
                  <span>
                    Submitted
                    {{ formatDateTime(selectedComplaint.createdAt) }}
                  </span>
                </footer>
              </article>

              <section class="conversation-card">
                <header class="conversation-heading">
                 <div>
                    <span class="card-eyebrow">
                      Communication History
                    </span>

                    <h3>Complaint conversation</h3>
                  </div>

                  <span class="reply-count">
                    {{ visibleReplies.length }}
                    {{
                      visibleReplies.length === 1
                        ? 'entry'
                        : 'entries'
                    }}
                  </span>
                </header>

                <div
                  v-if="visibleReplies.length === 0"
                  class="no-replies"
                >
                  <span>
                    <i class="pi pi-comments"></i>
                  </span>

                  <strong>No replies yet</strong>

                  <p>
                    Send the first response to acknowledge this complaint.
                  </p>
                </div>

                <div
                  v-else
                  ref="replyContainer"
                  class="reply-timeline"
                >
                  <article
                    v-for="reply in visibleReplies"
                    :key="reply.id"
                    class="reply-entry"
                    :class="{
                      admin:
                        normalizeRole(reply.senderRole) === 'ADMIN',
                      parent:
                        normalizeRole(reply.senderRole) === 'PARENT',
                      internal: reply.isInternal
                    }"
                  >
                    <!-- <span class="reply-avatar">
                      <i
                        v-if="reply.isInternal"
                        class="pi pi-lock"
                      ></i>

                      <template v-else>
                        {{ getInitials(reply.senderName) }}
                      </template>
                    </span> -->

                    <div class="reply-body">
                      <div class="reply-heading">
                        <div>
                          <!-- <strong>
                            {{
                              reply.isInternal
                                ? 'Internal administrative note'
                                : reply.senderName
                            }}
                          </strong> -->

                          <!-- <span
                            class="reply-role"
                            :class="{
                              internal: reply.isInternal
                            }"
                          >
                            {{
                              reply.isInternal
                                ? 'Private'
                                : formatLabel(reply.senderRole)
                            }}
                          </span> -->
                        </div>

                        <!-- <small>
                          {{ formatDateTime(reply.createdAt) }}
                        </small> -->
                      </div>

                      <p>
                        {{ reply.content }}
                      </p>
                    </div>



                  </article>
                </div>

                <footer
                  v-if="selectedComplaint.status !== 'CLOSED'"
                  class="reply-composer"
                  :class="{
                    internal: replyForm.isInternal
                  }"
                >
                  <div class="composer-mode">
                    <button
                      type="button"
                      :class="{
                        active: !replyForm.isInternal
                      }"
                      :disabled="sendingReply"
                      @click="replyForm.isInternal = false"
                    >
                      <i class="pi pi-send"></i>
                      Reply to Parent
                    </button>

                    <!-- <button
                      type="button"
                      :class="{
                        active: replyForm.isInternal
                      }"
                      :disabled="sendingReply"
                      @click="replyForm.isInternal = true"
                    >
                      <i class="pi pi-lock"></i>
                      Internal Note
                    </button> -->
                  </div>

                  <div
                    v-if="replyForm.isInternal"
                    class="internal-note-warning"
                  >
                    <i class="pi pi-shield"></i>

                    <span>
                      Internal notes are visible only to authorized
                      administrators and will not be shown to the parent.
                    </span>
                  </div>

                  <textarea
                    v-model="replyForm.content"
                    rows="4"
                    maxlength="3000"
                    :placeholder="
                      replyForm.isInternal
                        ? 'Write a private note for administrators...'
                        : 'Write a response to the parent...'
                    "
                    :disabled="sendingReply"
                  ></textarea>

                  <div class="reply-composer-footer">
                    <span>
                      {{ replyForm.content.length }} / 3000
                    </span>

                    <div class="reply-send-actions">
                      <select
                        v-if="!replyForm.isInternal"
                        v-model="replyForm.nextStatus"
                        :disabled="sendingReply"
                        aria-label="Status after sending reply"
                      >
                        <option value="AWAITING_PARENT">
                          Awaiting Parent
                        </option>

                        <option value="IN_REVIEW">
                          Keep In Review
                        </option>

                        <option value="RESOLVED">
                          Mark Resolved
                        </option>
                      </select>

                      <button
                        type="button"
                        class="send-reply-btn"
                        :class="{
                          internal: replyForm.isInternal
                        }"
                        :disabled="!canSendReply"
                        @click="sendReply"
                      >
                        <i
                          class="pi"
                          :class="
                            sendingReply
                              ? 'pi-spin pi-spinner'
                              : replyForm.isInternal
                                ? 'pi-lock'
                                : 'pi-send'
                          "
                        ></i>

                        <span>
                          {{
                            sendingReply
                              ? 'Saving...'
                              : replyForm.isInternal
                                ? 'Add Internal Note'
                                : 'Send Reply'
                          }}
                        </span>
                      </button>
                    </div>
                  </div>
                </footer>

                <div
                  v-else
                  class="closed-complaint-notice"
                >
                  <i class="pi pi-lock"></i>

                  <div>
                    <strong>This complaint is closed</strong>

                    <p>
                      Reopen the complaint before adding another response.
                    </p>
                  </div>
                </div>
              </section>
            </section>

            <aside class="complaint-control-column">
              <section class="control-card">
                <header>
                  <span class="control-icon status">
                    <i class="pi pi-list-check"></i>
                  </span>

                  <div>
                    <span>Case Status</span>
                    <strong>Update progress</strong>
                  </div>
                </header>

                <select
                  v-model="statusUpdateValue"
                  :disabled="updatingStatus"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="AWAITING_PARENT">
                    Awaiting Parent
                  </option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                  <option value="REOPENED">Reopened</option>
                </select>

                <button
                  type="button"
                  class="control-primary-btn"
                  :disabled="!canUpdateStatus"
                  @click="updateStatus"
                >
                  <i
                    class="pi"
                    :class="
                      updatingStatus
                        ? 'pi-spin pi-spinner'
                        : 'pi-check'
                    "
                  ></i>

                  {{
                    updatingStatus
                      ? 'Updating...'
                      : 'Update Status'
                  }}
                </button>
              </section>

              <!-- <section class="control-card">
                <header>
                  <span class="control-icon assignment">
                    <i class="pi pi-user-edit"></i>
                  </span>

                  <div>
                    <span>Assignment</span>
                    <strong>Responsible administrator</strong>
                  </div>
                </header>

                <div
                  v-if="selectedComplaint.assignedAdminName"
                  class="assigned-admin"
                >
                  <span class="assigned-admin-avatar">
                    {{
                      getInitials(
                        selectedComplaint.assignedAdminName
                      )
                    }}
                  </span>

                  <div>
                    <strong>
                      {{ selectedComplaint.assignedAdminName }}
                    </strong>

                    <span>
                      Account
                      {{ selectedComplaint.assignedAdminAccountId }}
                    </span>
                  </div>
                </div>

                <div
                  v-else
                  class="unassigned-admin"
                >
                  <i class="pi pi-user-minus"></i>

                  <span>
                    No administrator assigned
                  </span>
                </div>

                <label for="admin-account-id">
                  Administrator account ID
                </label>

                <input
                  id="admin-account-id"
                  v-model.trim="assignmentAccountId"
                  type="number"
                  min="1"
                  inputmode="numeric"
                  placeholder="Enter account ID"
                  :disabled="assigningComplaint"
                >

                <div class="assignment-actions">
                  <button
                    type="button"
                    class="control-secondary-btn"
                    :disabled="
                      assigningComplaint ||
                      !selectedComplaint.assignedAdminAccountId
                    "
                    @click="removeAssignment"
                  >
                    Unassign
                  </button>

                  <button
                    type="button"
                    class="control-primary-btn"
                    :disabled="!canAssignComplaint"
                    @click="assignComplaint"
                  >
                    <i
                      class="pi"
                      :class="
                        assigningComplaint
                          ? 'pi-spin pi-spinner'
                          : 'pi-user-plus'
                      "
                    ></i>

                    {{
                      assigningComplaint
                        ? 'Assigning...'
                        : 'Assign'
                    }}
                  </button>
                </div>
              </section> -->

              <section class="control-card complaint-information">
                <header>
                  <span class="control-icon information">
                    <i class="pi pi-info-circle"></i>
                  </span>

                  <div>
                    <span>Case Information</span>
                    <strong>Complaint details</strong>
                  </div>
                </header>

                <dl>
                  <div>
                    <dt>Category</dt>
                    <dd>
                      {{ formatLabel(selectedComplaint.category) }}
                    </dd>
                  </div>

                  <div>
                    <dt>Priority</dt>
                    <dd>
                      <span
                        class="priority-pill"
                        :class="
                          normalizeClassName(
                            selectedComplaint.priority
                          )
                        "
                      >
                        {{ formatLabel(selectedComplaint.priority) }}
                      </span>
                    </dd>
                  </div>

                  <div>
                    <dt>Student</dt>
                    <dd>{{ selectedComplaint.studentName }}</dd>
                  </div>

                  <div>
                    <dt>Parent Account</dt>
                    <dd>{{ selectedComplaint.parentAccountId }}</dd>
                  </div>

                  <div>
                    <dt>Last Activity</dt>
                    <dd>
                      {{ formatDateTime(selectedComplaint.updatedAt) }}
                    </dd>
                  </div>

                  <div v-if="selectedComplaint.resolvedAt">
                    <dt>Resolved</dt>
                    <dd>
                      {{ formatDateTime(selectedComplaint.resolvedAt) }}
                    </dd>
                  </div>

                  <div v-if="selectedComplaint.closedAt">
                    <dt>Closed</dt>
                    <dd>
                      {{ formatDateTime(selectedComplaint.closedAt) }}
                    </dd>
                  </div>
                </dl>
              </section>

              <section class="security-notice">
                <i class="pi pi-shield"></i>

                <div>
                  <strong>Confidential case</strong>

                  <p>
                    Complaint information should be shared only with
                    authorized personnel involved in the resolution.
                  </p>
                </div>
              </section>
            </aside>
          </div>
        </template>
      </main>
    </section>
  </div>
</template>

<script setup>
import {
  computed,
  nextTick,
  onMounted,
  reactive,
  ref,
} from 'vue'

import {
  useToast,
} from 'vue-toastification'

import {
  assignAdminComplaint,
  getAdminComplaint,
  getAdminComplaints,
  replyToComplaintAsAdmin,
  updateAdminComplaintStatus,
} from '@/services/api.js'

const toast =
  useToast()

const complaints =
  ref([])

const selectedComplaintId =
  ref(null)

const selectedComplaint =
  ref(null)

const searchTerm =
  ref('')

const statusFilter =
  ref('')

const priorityFilter =
  ref('')

const complaintsLoading =
  ref(false)

const complaintDetailsLoading =
  ref(false)

const sendingReply =
  ref(false)

const updatingStatus =
  ref(false)

const assigningComplaint =
  ref(false)

const statusUpdateValue =
  ref('')

const assignmentAccountId =
  ref('')

const replyContainer =
  ref(null)

const replyForm =
  reactive({
    content: '',
    isInternal: false,
    nextStatus: 'AWAITING_PARENT',
  })

const filteredComplaints =
  computed(() => {
    const normalizedSearch =
      searchTerm.value
        .trim()
        .toLowerCase()

    const normalizedPriority =
      priorityFilter.value
        .trim()
        .toUpperCase()

    return complaints.value.filter(
      (complaint) => {
        const matchesPriority =
          !normalizedPriority ||
          String(
            complaint.priority || ''
          )
            .trim()
            .toUpperCase() ===
            normalizedPriority

        if (!matchesPriority) {
          return false
        }

        if (!normalizedSearch) {
          return true
        }

        return [
          complaint.complaintNumber,
          complaint.studentName,
          complaint.parentName,
          complaint.subject,
          complaint.description,
          complaint.category,
          complaint.status,
        ]
          .filter(Boolean)
          .some((value) => {
            return String(value)
              .toLowerCase()
              .includes(normalizedSearch)
          })
      }
    )
  })

const needsAttentionCount =
  computed(() => {
    const attentionStatuses = [
      'OPEN',
      'IN_REVIEW',
      'ASSIGNED',
      'REOPENED',
    ]

    return complaints.value.filter(
      (complaint) => {
        return attentionStatuses.includes(
          String(
            complaint.status || ''
          )
            .trim()
            .toUpperCase()
        )
      }
    ).length
  })

const resolvedCount =
  computed(() => {
    return complaints.value.filter(
      (complaint) => {
        return [
          'RESOLVED',
          'CLOSED',
        ].includes(
          String(
            complaint.status || ''
          )
            .trim()
            .toUpperCase()
        )
      }
    ).length
  })

const visibleReplies =
  computed(() => {
    const replies =
      selectedComplaint.value
        ?.replies

    return Array.isArray(replies)
      ? replies
      : []
  })

const canSendReply =
  computed(() => {
    return (
      Number(selectedComplaint.value?.id) > 0 &&
      replyForm.content.trim().length > 0 &&
      replyForm.content.trim().length <= 3000 &&
      selectedComplaint.value?.status !== 'CLOSED' &&
      !sendingReply.value
    )
  })

const canUpdateStatus =
  computed(() => {
    const currentStatus =
      String(
        selectedComplaint.value?.status ||
        ''
      )
        .trim()
        .toUpperCase()

    return (
      Number(selectedComplaint.value?.id) > 0 &&
      statusUpdateValue.value.length > 0 &&
      statusUpdateValue.value !== currentStatus &&
      !updatingStatus.value
    )
  })

const canAssignComplaint =
  computed(() => {
    const accountId =
      Number(assignmentAccountId.value)

    return (
      Number(selectedComplaint.value?.id) > 0 &&
      Number.isInteger(accountId) &&
      accountId > 0 &&
      !assigningComplaint.value
    )
  })

function normalizeComplaint(
  complaint
) {
  return {
    ...complaint,

    id:
      Number(
        complaint.id ||
        0
      ),

    studentId:
      Number(
        complaint.studentId ||
        0
      ),

    parentAccountId:
      Number(
        complaint.parentAccountId ||
        0
      ),

    assignedAdminAccountId:
      Number(
        complaint.assignedAdminAccountId ||
        0
      ) || null,

    complaintNumber:
      String(
        complaint.complaintNumber ||
        ''
      ),

    studentName:
      String(
        complaint.studentName ||
        'Unknown student'
      ),

    subject:
      String(
        complaint.subject ||
        ''
      ),

    description:
      String(
        complaint.description ||
        ''
      ),

    category:
      String(
        complaint.category ||
        'OTHER'
      )
        .trim()
        .toUpperCase(),

    priority:
      String(
        complaint.priority ||
        'NORMAL'
      )
        .trim()
        .toUpperCase(),

    status:
      String(
        complaint.status ||
        'OPEN'
      )
        .trim()
        .toUpperCase(),

    unreadReplyCount:
      Number(
        complaint.unreadReplyCount ||
        0
      ),

    replies:
      Array.isArray(
        complaint.replies
      )
        ? complaint.replies.map(
            normalizeReply
          )
        : [],
  }
}

function normalizeReply(
  reply
) {
  return {
    ...reply,

    id:
      Number(
        reply.id ||
        0
      ),

    complaintId:
      Number(
        reply.complaintId ||
        0
      ),

    senderAccountId:
      Number(
        reply.senderAccountId ||
        0
      ),

    senderName:
      String(
        reply.senderName ||
        'Administrator'
      ),

    senderRole:
      String(
        reply.senderRole ||
        ''
      )
        .trim()
        .toUpperCase(),

    content:
      String(
        reply.content ||
        ''
      ),

    isInternal:
      reply.isInternal === true,
  }
}

async function loadComplaints() {
  try {
    complaintsLoading.value =
      true

    const response =
      await getAdminComplaints(
        statusFilter.value
      )

    const responseData =
      response?.data

    const complaintItems =
      Array.isArray(responseData)
        ? responseData
        : Array.isArray(
            responseData?.items
          )
          ? responseData.items
          : Array.isArray(
              responseData?.complaints
            )
            ? responseData.complaints
            : []

    complaints.value =
      complaintItems.map(
        normalizeComplaint
      )

    if (!selectedComplaintId.value) {
      return
    }

    const complaintStillExists =
      complaints.value.some(
        (complaint) => {
          return (
            Number(complaint.id) ===
            Number(
              selectedComplaintId.value
            )
          )
        }
      )

    if (!complaintStillExists) {
      selectedComplaintId.value =
        null

      selectedComplaint.value =
        null
    }
  } catch (error) {


    complaints.value = []

    toast.error(
      getErrorMessage(
        error,
        'Unable to load complaints.'
      )
    )
  } finally {
    complaintsLoading.value =
      false
  }
}

async function openComplaint(
  complaint
) {
  const complaintId =
    Number(complaint?.id)

  if (complaintId <= 0) {
    toast.error(
      'The selected complaint is invalid.'
    )

    return
  }

  selectedComplaintId.value =
    complaintId

  selectedComplaint.value =
    null

  replyForm.content =
    ''

  replyForm.isInternal =
    false

  replyForm.nextStatus =
    'AWAITING_PARENT'

  try {
    complaintDetailsLoading.value =
      true

    const response =
      await getAdminComplaint(
        complaintId
      )

    const complaintData =
      response?.data?.complaint ||
      response?.data

    if (!complaintData) {
      throw new Error(
        'The complaint API returned no data.'
      )
    }

    selectedComplaint.value =
      normalizeComplaint(
        complaintData
      )

    statusUpdateValue.value =
      selectedComplaint.value.status

    assignmentAccountId.value =
      selectedComplaint.value
        .assignedAdminAccountId
        ? String(
            selectedComplaint.value
              .assignedAdminAccountId
          )
        : ''

    updateComplaintInList(
      selectedComplaint.value
    )

    await scrollRepliesToBottom()
  } catch (error) {


    selectedComplaint.value =
      null

    toast.error(
      getErrorMessage(
        error,
        'Unable to load complaint details.'
      )
    )
  } finally {
    complaintDetailsLoading.value =
      false
  }
}

async function refreshSelectedComplaint() {
  if (!selectedComplaintId.value) {
    return
  }

  await openComplaint({
    id:
      selectedComplaintId.value,
  })
}

async function sendReply() {
  if (!canSendReply.value) {
    return
  }

  const complaintId =
    Number(
      selectedComplaint.value.id
    )

  const payload = {
    content:
      replyForm.content.trim(),

    isInternal:
      replyForm.isInternal,

    nextStatus:
      replyForm.isInternal
        ? null
        : replyForm.nextStatus,
  }

  try {
    sendingReply.value =
      true

    const response =
      await replyToComplaintAsAdmin(
        complaintId,
        payload
      )

    const responseData =
      response?.data || {}

    const createdReply =
      responseData.reply

    if (createdReply) {
      selectedComplaint.value.replies = [
        ...selectedComplaint.value.replies,
        normalizeReply(
          createdReply
        ),
      ]
    }

    if (!payload.isInternal) {
      selectedComplaint.value.status =
        payload.nextStatus ||
        'AWAITING_PARENT'

      statusUpdateValue.value =
        selectedComplaint.value.status
    }

    selectedComplaint.value.updatedAt =
      createdReply?.createdAt ||
      new Date().toISOString()

    selectedComplaint.value.latestReply =
      payload.isInternal
        ? selectedComplaint.value.latestReply
        : payload.content

    selectedComplaint.value.latestReplyAt =
      payload.isInternal
        ? selectedComplaint.value.latestReplyAt
        : createdReply?.createdAt ||
          new Date().toISOString()

    updateComplaintInList(
      selectedComplaint.value
    )

    replyForm.content = ''

    toast.success(
      responseData.message ||
      (
        payload.isInternal
          ? 'Internal note added successfully.'
          : 'Reply sent successfully.'
      )
    )

    await scrollRepliesToBottom()

    await loadComplaints()
  } catch (error) {


    toast.error(
      getErrorMessage(
        error,
        payload.isInternal
          ? 'Unable to add the internal note.'
          : 'Unable to send the reply.'
      )
    )
  } finally {
    sendingReply.value =
      false
  }
}

async function updateStatus() {
  const complaintId =
    Number(
      selectedComplaint.value?.id
    )

  const status =
    String(
      statusUpdateValue.value ||
      ''
    )
      .trim()
      .toUpperCase()

  if (
    complaintId <= 0 ||
    !status ||
    updatingStatus.value
  ) {
    return
  }

  try {
    updatingStatus.value =
      true

    const response =
      await updateAdminComplaintStatus(
        complaintId,
        status
      )

    const responseData =
      response?.data || {}

    const updatedComplaint =
      responseData.complaint

    if (updatedComplaint) {
      selectedComplaint.value =
        normalizeComplaint(
          updatedComplaint
        )
    } else {
      selectedComplaint.value.status =
        status

      selectedComplaint.value.updatedAt =
        new Date().toISOString()
    }

    statusUpdateValue.value =
      selectedComplaint.value.status

    updateComplaintInList(
      selectedComplaint.value
    )

    toast.success(
      responseData.message ||
      'Complaint status updated.'
    )

    await loadComplaints()
  } catch (error) {


    statusUpdateValue.value =
      selectedComplaint.value.status

    toast.error(
      getErrorMessage(
        error,
        'Unable to update complaint status.'
      )
    )
  } finally {
    updatingStatus.value =
      false
  }
}

async function assignComplaint() {
  const complaintId =
    Number(
      selectedComplaint.value?.id
    )

  const adminAccountId =
    Number(
      assignmentAccountId.value
    )

  if (
    complaintId <= 0 ||
    !Number.isInteger(adminAccountId) ||
    adminAccountId <= 0 ||
    assigningComplaint.value
  ) {
    toast.warning(
      'Enter a valid administrator account ID.'
    )

    return
  }

  await saveAssignment(
    complaintId,
    adminAccountId
  )
}

async function removeAssignment() {
  const complaintId =
    Number(
      selectedComplaint.value?.id
    )

  if (
    complaintId <= 0 ||
    assigningComplaint.value
  ) {
    return
  }

  await saveAssignment(
    complaintId,
    null
  )
}

async function saveAssignment(
  complaintId,
  adminAccountId
) {
  try {
    assigningComplaint.value =
      true

    const response =
      await assignAdminComplaint(
        complaintId,
        adminAccountId
      )

    const responseData =
      response?.data || {}

    const updatedComplaint =
      responseData.complaint

    if (updatedComplaint) {
      selectedComplaint.value =
        normalizeComplaint(
          updatedComplaint
        )
    } else {
      selectedComplaint.value
        .assignedAdminAccountId =
          adminAccountId

      selectedComplaint.value.status =
        adminAccountId
          ? 'ASSIGNED'
          : 'IN_REVIEW'
    }

    statusUpdateValue.value =
      selectedComplaint.value.status

    assignmentAccountId.value =
      selectedComplaint.value
        .assignedAdminAccountId
        ? String(
            selectedComplaint.value
              .assignedAdminAccountId
          )
        : ''

    updateComplaintInList(
      selectedComplaint.value
    )

    toast.success(
      responseData.message ||
      (
        adminAccountId
          ? 'Complaint assigned successfully.'
          : 'Complaint assignment removed.'
      )
    )

    await loadComplaints()
  } catch (error) {


    toast.error(
      getErrorMessage(
        error,
        'Unable to update complaint assignment.'
      )
    )
  } finally {
    assigningComplaint.value =
      false
  }
}

function updateComplaintInList(
  updatedComplaint
) {
  const complaintId =
    Number(
      updatedComplaint?.id
    )

  if (complaintId <= 0) {
    return
  }

  const complaintIndex =
    complaints.value.findIndex(
      (complaint) => {
        return (
          Number(complaint.id) ===
          complaintId
        )
      }
    )

  if (complaintIndex < 0) {
    complaints.value.unshift(
      normalizeComplaint(
        updatedComplaint
      )
    )

    return
  }

  complaints.value[
    complaintIndex
  ] = {
    ...complaints.value[
      complaintIndex
    ],

    ...normalizeComplaint(
      updatedComplaint
    ),
  }
}

async function scrollRepliesToBottom() {
  await nextTick()

  const container =
    replyContainer.value

  if (!container) {
    return
  }

  container.scrollTo({
    top:
      container.scrollHeight,

    behavior:
      'smooth',
  })
}

function getErrorMessage(
  error,
  fallbackMessage
) {
  const responseData =
    error?.response?.data

  if (
    typeof responseData ===
    'string'
  ) {
    return responseData
  }

  return (
    responseData?.message ||
    responseData?.errorMessage ||
    responseData?.error ||
    error?.message ||
    fallbackMessage
  )
}

function normalizeRole(
  role
) {
  return String(role || '')
    .trim()
    .toUpperCase()
}

function normalizeClassName(
  value
) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(
      /_/g,
      '-'
    )
}

function formatLabel(
  value
) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(
      /_/g,
      ' '
    )
    .replace(
      /\b\w/g,
      (letter) => {
        return letter.toUpperCase()
      }
    )
}

function formatDateTime(
  value
) {
  if (!value) {
    return '-'
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value)
  }

  return new Intl.DateTimeFormat(
    'en-GB',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  ).format(date)
}

function formatRelativeDate(
  value
) {
  if (!value) {
    return ''
  }

  const date =
    new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return ''
  }

  const difference =
    Date.now() -
    date.getTime()

  const minute =
    60 * 1000

  const hour =
    60 * minute

  const day =
    24 * hour

  if (difference < minute) {
    return 'Now'
  }

  if (difference < hour) {
    const minutes =
      Math.floor(
        difference / minute
      )

    return `${minutes}m`
  }

  if (difference < day) {
    const hours =
      Math.floor(
        difference / hour
      )

    return `${hours}h`
  }

  return new Intl.DateTimeFormat(
    'en-GB',
    {
      day: '2-digit',
      month: 'short',
    }
  ).format(date)
}

function getInitials(
  value
) {
  const normalizedValue =
    String(value || '')
      .trim()

  if (!normalizedValue) {
    return 'AD'
  }

  return normalizedValue
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => {
      return part
        .charAt(0)
        .toUpperCase()
    })
    .join('')
}

onMounted(async () => {
  await loadComplaints()
})
</script>

<style scoped>
.admin-complaints-page {
  min-height: 100vh;
  padding: 1.5rem;
  background:
    radial-gradient(
      circle at top right,
      rgb(37 99 235 / 10%),
      transparent 28rem
    ),
    #f5f7fb;
  color: #172033;
}

.complaints-hero {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2rem;
  padding: 2rem;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 70%);
  border-radius: 1.75rem;
  background:
    linear-gradient(
      135deg,
      #172554,
      #1d4ed8 58%,
      #2563eb
    );
  color: #ffffff;
  box-shadow:
    0 24px 60px rgb(30 64 175 / 22%);
}

.complaints-hero::after {
  position: absolute;
  width: 19rem;
  height: 19rem;
  right: -5rem;
  top: -8rem;
  border-radius: 50%;
  background: rgb(255 255 255 / 10%);
  content: '';
}

.hero-copy,
.hero-summary {
  position: relative;
  z-index: 1;
}

.hero-copy {
  max-width: 45rem;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.7rem;
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 999px;
  background: rgb(255 255 255 / 12%);
  color: #dbeafe;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.hero-copy h1 {
  margin: 0.9rem 0 0.5rem;
  font-size: clamp(2rem, 5vw, 3.2rem);
  letter-spacing: -0.05em;
}

.hero-copy p {
  max-width: 43rem;
  margin: 0;
  color: #dbeafe;
  line-height: 1.65;
}

.hero-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(8.5rem, 1fr));
  gap: 0.75rem;
}

.hero-stat-card {
  min-width: 9.5rem;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.85rem;
  border: 1px solid rgb(255 255 255 / 16%);
  border-radius: 1rem;
  background: rgb(255 255 255 / 12%);
}

.hero-stat-card > div {
  display: flex;
  flex-direction: column;
}

.hero-stat-card span {
  color: #dbeafe;
  font-size: 0.68rem;
}

.hero-stat-card strong {
  margin-top: 0.15rem;
  font-size: 1.25rem;
}

.hero-stat-icon {
  width: 2.45rem;
  height: 2.45rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 2.45rem;
  border-radius: 0.75rem;
}

.hero-stat-icon.total {
  background: rgb(219 234 254 / 18%);
}

.hero-stat-icon.attention {
  background: rgb(254 215 170 / 20%);
  color: #fed7aa;
}

.hero-stat-icon.resolved {
  background: rgb(187 247 208 / 18%);
  color: #bbf7d0;
}

.complaint-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: 1.25rem 0;
  padding: 0.9rem;
  border: 1px solid #e5eaf1;
  border-radius: 1.15rem;
  background: #ffffff;
  box-shadow: 0 8px 24px rgb(15 23 42 / 5%);
}

.complaint-search {
  position: relative;
  min-width: 16rem;
  flex: 1;
}

.complaint-search > .pi {
  position: absolute;
  left: 0.9rem;
  top: 50%;
  color: #98a2b3;
  transform: translateY(-50%);
}

.complaint-search input {
  width: 100%;
  min-height: 2.75rem;
  padding: 0.65rem 2.8rem;
  border: 1px solid #d8dfeb;
  border-radius: 0.85rem;
  outline: none;
  color: #172033;
}

.complaint-search input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgb(37 99 235 / 12%);
}

.clear-search-btn {
  position: absolute;
  right: 0.55rem;
  top: 50%;
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 0.55rem;
  background: transparent;
  color: #667085;
  cursor: pointer;
  transform: translateY(-50%);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.toolbar-actions select {
  min-height: 2.75rem;
  padding: 0.6rem 2rem 0.6rem 0.75rem;
  border: 1px solid #d8dfeb;
  border-radius: 0.85rem;
  background: #ffffff;
  color: #475467;
  font-weight: 650;
}

.refresh-btn,
.detail-refresh-btn {
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.65rem 0.9rem;
  border: 1px solid #d8dfeb;
  border-radius: 0.85rem;
  background: #ffffff;
  color: #475467;
  font-weight: 750;
  cursor: pointer;
}

.refresh-btn:hover:not(:disabled),
.detail-refresh-btn:hover:not(:disabled) {
  border-color: #2563eb;
  color: #2563eb;
}

.complaints-shell {
  min-height: 45rem;
  display: grid;
  grid-template-columns: 22rem minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid #e5eaf1;
  border-radius: 1.5rem;
  background: #ffffff;
  box-shadow: 0 18px 50px rgb(15 23 42 / 7%);
}

.complaints-sidebar {
  min-width: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e8edf5;
  background: #fbfcfe;
}

.sidebar-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.2rem;
  border-bottom: 1px solid #e8edf5;
}

.section-label,
.card-eyebrow {
  color: #2563eb;
  font-size: 0.67rem;
  font-weight: 850;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.sidebar-heading h2,
.conversation-heading h3 {
  margin: 0.25rem 0 0;
}

.result-count,
.reply-count {
  min-width: 2rem;
  min-height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.3rem 0.55rem;
  border-radius: 999px;
  background: #eaf2ff;
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 800;
}

.complaint-list {
  flex: 1;
  padding: 0.6rem;
  overflow-y: auto;
}

.complaint-list-item {
  position: relative;
  width: 100%;
  display: flex;
  gap: 0.65rem;
  margin-bottom: 0.4rem;
  padding: 0.9rem;
  border: 1px solid transparent;
  border-radius: 1rem;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.complaint-list-item:hover {
  border-color: #e0e7f0;
  background: #ffffff;
}

.complaint-list-item.active {
  border-color: #bfdbfe;
  background: #eff6ff;
  box-shadow: 0 6px 16px rgb(37 99 235 / 8%);
}

.priority-indicator {
  width: 0.3rem;
  align-self: stretch;
  flex: 0 0 0.3rem;
  border-radius: 999px;
  background: #94a3b8;
}

.priority-indicator.urgent {
  background: #dc2626;
}

.priority-indicator.high {
  background: #f97316;
}

.priority-indicator.normal {
  background: #2563eb;
}

.priority-indicator.low {
  background: #16a34a;
}

.complaint-list-content {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.complaint-list-top,
.complaint-list-footer {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.complaint-list-top {
  justify-content: space-between;
}

.complaint-list-top strong {
  color: #344054;
  font-size: 0.72rem;
}

.complaint-list-top small {
  color: #98a2b3;
}

.complaint-subject {
  margin-top: 0.4rem;
  overflow: hidden;
  color: #172033;
  font-size: 0.87rem;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.complaint-participant {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.35rem;
  color: #667085;
  font-size: 0.72rem;
}

.complaint-list-footer {
  margin-top: 0.65rem;
}

.status-pill,
.priority-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.3rem 0.5rem;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475467;
  font-size: 0.62rem;
  font-weight: 800;
}

.status-pill.large,
.priority-pill.large {
  padding: 0.4rem 0.65rem;
  font-size: 0.68rem;
}

.status-pill.open,
.status-pill.reopened {
  background: #fff7ed;
  color: #c2410c;
}

.status-pill.in-review,
.status-pill.assigned {
  background: #eff6ff;
  color: #1d4ed8;
}

.status-pill.awaiting-parent {
  background: #faf5ff;
  color: #7e22ce;
}

.status-pill.resolved {
  background: #f0fdf4;
  color: #15803d;
}

.status-pill.closed {
  background: #f1f5f9;
  color: #475569;
}

.priority-pill.urgent {
  background: #fef2f2;
  color: #dc2626;
}

.priority-pill.high {
  background: #fff7ed;
  color: #ea580c;
}

.priority-pill.normal {
  background: #eff6ff;
  color: #2563eb;
}

.priority-pill.low {
  background: #f0fdf4;
  color: #16a34a;
}

.unread-reply-badge {
  min-width: 1.4rem;
  height: 1.4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  border-radius: 999px;
  background: #dc2626;
  color: #ffffff;
  font-size: 0.65rem;
  font-weight: 850;
}

.sidebar-state,
.workspace-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 2rem;
  text-align: center;
}

.sidebar-state {
  flex: 1;
}

.sidebar-state p,
.workspace-empty p {
  max-width: 31rem;
  margin: 0.45rem 0 0;
  color: #667085;
  line-height: 1.55;
}

.state-icon,
.workspace-empty-icon {
  width: 4rem;
  height: 4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  border-radius: 1.2rem;
  background: #eaf2ff;
  color: #2563eb;
  font-size: 1.35rem;
}

.complaint-workspace {
  min-width: 0;
  background: #ffffff;
}

.workspace-empty {
  min-height: 45rem;
}

.workspace-guidance {
  display: grid;
  gap: 0.65rem;
  margin-top: 1.25rem;
  text-align: left;
}

.workspace-guidance div {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  color: #475467;
  font-size: 0.82rem;
}

.workspace-guidance i {
  color: #2563eb;
}

.complaint-detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem;
  border-bottom: 1px solid #e8edf5;
}

.complaint-number-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.complaint-number {
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 850;
  letter-spacing: 0.04em;
}

.complaint-identity h2 {
  margin: 0.5rem 0;
  font-size: 1.45rem;
}

.complaint-identity-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  color: #667085;
  font-size: 0.75rem;
}

.complaint-identity-meta span {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.complaint-detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 20rem;
  align-items: start;
  gap: 1rem;
  padding: 1rem;
}

.complaint-main-column,
.complaint-control-column {
  min-width: 0;
  display: grid;
  gap: 1rem;
}

.original-complaint-card,
.conversation-card,
.control-card {
  border: 1px solid #e5eaf1;
  border-radius: 1.15rem;
  background: #ffffff;
}

.original-complaint-card {
  padding: 1.15rem;
  background:
    linear-gradient(
      145deg,
      #ffffff,
      #fbfdff
    );
}

.original-complaint-card header,
.conversation-heading,
.control-card header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.original-complaint-card h3 {
  margin: 0.25rem 0 0;
}

.original-complaint-card > p {
  margin: 1rem 0;
  color: #475467;
  line-height: 1.7;
  white-space: pre-wrap;
}

.original-complaint-card footer {
  padding-top: 0.8rem;
  border-top: 1px solid #edf0f5;
  color: #98a2b3;
  font-size: 0.72rem;
}

.conversation-card {
  overflow: hidden;
}

.conversation-heading {
  padding: 1rem;
  border-bottom: 1px solid #e8edf5;
}

.reply-timeline {
  max-height: 32rem;
  padding: 1rem;
  overflow-y: auto;
}

.reply-entry {
  display: flex;
  gap: 0.7rem;
  margin-bottom: 1rem;
}

.reply-entry:last-child {
  margin-bottom: 0;
}

.reply-avatar {
  width: 2.45rem;
  height: 2.45rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 2.45rem;
  border-radius: 0.8rem;
  background: #eaf2ff;
  color: #2563eb;
  font-size: 0.72rem;
  font-weight: 850;
}

.reply-entry.parent .reply-avatar {
  background: #f3e8ff;
  color: #7e22ce;
}

.reply-entry.internal .reply-avatar {
  background: #fff7ed;
  color: #c2410c;
}

.reply-body {
  min-width: 0;
  flex: 1;
  padding: 0.85rem;
  border: 1px solid #e8edf5;
  border-radius: 0.9rem;
  background: #fbfcfe;
}

.reply-entry.internal .reply-body {
  border-color: #fed7aa;
  background: #fffaf2;
}

.reply-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.reply-heading > div {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.reply-heading small {
  flex: 0 0 auto;
  color: #98a2b3;
  font-size: 0.68rem;
}

.reply-role {
  padding: 0.2rem 0.4rem;
  border-radius: 999px;
  background: #eaf2ff;
  color: #2563eb;
  font-size: 0.58rem;
  font-weight: 850;
  text-transform: uppercase;
}

.reply-role.internal {
  background: #ffedd5;
  color: #c2410c;
}

.reply-body p {
  margin: 0.55rem 0 0;
  color: #475467;
  line-height: 1.6;
  white-space: pre-wrap;
}

.no-replies {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 2rem;
  text-align: center;
}

.no-replies > span {
  width: 3rem;
  height: 3rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.7rem;
  border-radius: 0.9rem;
  background: #eaf2ff;
  color: #2563eb;
}

.no-replies p {
  margin: 0.3rem 0 0;
  color: #667085;
  font-size: 0.8rem;
}

.reply-composer {
  padding: 1rem;
  border-top: 1px solid #e8edf5;
  background: #fbfcfe;
}

.reply-composer.internal {
  background: #fffaf2;
}

.composer-mode {
  display: inline-flex;
  gap: 0.3rem;
  padding: 0.25rem;
  border-radius: 0.8rem;
  background: #edf1f7;
}

.composer-mode button {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.7rem;
  border: 0;
  border-radius: 0.6rem;
  background: transparent;
  color: #667085;
  font-size: 0.72rem;
  font-weight: 750;
  cursor: pointer;
}

.composer-mode button.active {
  background: #ffffff;
  color: #2563eb;
  box-shadow: 0 2px 7px rgb(15 23 42 / 8%);
}

.internal-note-warning {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: 0.8rem;
  padding: 0.65rem;
  border-radius: 0.7rem;
  background: #ffedd5;
  color: #9a3412;
  font-size: 0.7rem;
  line-height: 1.45;
}

.reply-composer textarea {
  width: 100%;
  margin-top: 0.8rem;
  padding: 0.8rem;
  resize: vertical;
  border: 1px solid #d8dfeb;
  border-radius: 0.8rem;
  outline: none;
  color: #172033;
  font: inherit;
  line-height: 1.5;
}

.reply-composer textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgb(37 99 235 / 10%);
}

.reply-composer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  margin-top: 0.7rem;
}

.reply-composer-footer > span {
  color: #98a2b3;
  font-size: 0.68rem;
}

.reply-send-actions {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.reply-send-actions select {
  min-height: 2.55rem;
  padding: 0.5rem 1.8rem 0.5rem 0.65rem;
  border: 1px solid #d8dfeb;
  border-radius: 0.7rem;
  background: #ffffff;
  color: #475467;
}

.send-reply-btn,
.control-primary-btn,
.control-secondary-btn {
  min-height: 2.55rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.6rem 0.8rem;
  border-radius: 0.7rem;
  font-weight: 750;
  cursor: pointer;
}

.send-reply-btn,
.control-primary-btn {
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #ffffff;
}

.send-reply-btn.internal {
  border-color: #c2410c;
  background: #c2410c;
}

.control-secondary-btn {
  border: 1px solid #d8dfeb;
  background: #ffffff;
  color: #475467;
}

.send-reply-btn:disabled,
.control-primary-btn:disabled,
.control-secondary-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.closed-complaint-notice {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 1rem;
  border-top: 1px solid #e8edf5;
  background: #f8fafc;
}

.closed-complaint-notice > i {
  color: #64748b;
}

.closed-complaint-notice p {
  margin: 0.2rem 0 0;
  color: #667085;
  font-size: 0.75rem;
}

.control-card {
  padding: 1rem;
}

.control-card header {
  justify-content: flex-start;
  margin-bottom: 0.85rem;
}

.control-card header > div {
  display: flex;
  flex-direction: column;
}

.control-card header span {
  color: #667085;
  font-size: 0.67rem;
}

.control-card header strong {
  margin-top: 0.1rem;
  font-size: 0.85rem;
}

.control-icon {
  width: 2.4rem;
  height: 2.4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 2.4rem;
  border-radius: 0.75rem;
}

.control-icon.status {
  background: #eaf2ff;
  color: #2563eb;
}

.control-icon.assignment {
  background: #f3e8ff;
  color: #7e22ce;
}

.control-icon.information {
  background: #ecfdf3;
  color: #16a34a;
}

.control-card select,
.control-card input {
  width: 100%;
  min-height: 2.65rem;
  padding: 0.6rem 0.7rem;
  border: 1px solid #d8dfeb;
  border-radius: 0.75rem;
  background: #ffffff;
  color: #344054;
  outline: none;
}

.control-card select:focus,
.control-card input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgb(37 99 235 / 10%);
}

.control-card > .control-primary-btn {
  width: 100%;
  margin-top: 0.65rem;
}

.control-card label {
  display: block;
  margin: 0.8rem 0 0.35rem;
  color: #475467;
  font-size: 0.72rem;
  font-weight: 750;
}

.assigned-admin {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.7rem;
  border-radius: 0.8rem;
  background: #f5f3ff;
}

.assigned-admin-avatar {
  width: 2.35rem;
  height: 2.35rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 2.35rem;
  border-radius: 0.75rem;
  background: #7c3aed;
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 850;
}

.assigned-admin > div {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.assigned-admin strong {
  overflow: hidden;
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.assigned-admin span {
  margin-top: 0.1rem;
  color: #7c6ba4;
  font-size: 0.65rem;
}

.unassigned-admin {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem;
  border-radius: 0.8rem;
  background: #f8fafc;
  color: #667085;
  font-size: 0.75rem;
}

.assignment-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  margin-top: 0.65rem;
}

.complaint-information dl {
  margin: 0;
}

.complaint-information dl > div {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.7rem;
  padding: 0.65rem 0;
  border-bottom: 1px solid #edf0f5;
}

.complaint-information dl > div:last-child {
  border-bottom: 0;
}

.complaint-information dt {
  color: #667085;
  font-size: 0.7rem;
}

.complaint-information dd {
  margin: 0;
  color: #344054;
  font-size: 0.72rem;
  font-weight: 700;
  text-align: right;
}

.security-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  padding: 0.9rem;
  border: 1px solid #bfdbfe;
  border-radius: 1rem;
  background: #eff6ff;
  color: #1e40af;
}

.security-notice > i {
  margin-top: 0.1rem;
}

.security-notice p {
  margin: 0.25rem 0 0;
  color: #3b5b9a;
  font-size: 0.7rem;
  line-height: 1.5;
}

@media (max-width: 1180px) {
  .complaints-hero {
    align-items: stretch;
    flex-direction: column;
  }

  .hero-summary {
    width: 100%;
  }

  .complaint-detail-grid {
    grid-template-columns: 1fr;
  }

  .complaint-control-column {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .security-notice {
    grid-column: 1 / -1;
  }
}

@media (max-width: 900px) {
  .admin-complaints-page {
    padding: 0.8rem;
  }

  .complaint-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .toolbar-actions {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
  }

  .complaints-shell {
    grid-template-columns: 1fr;
  }

  .complaints-sidebar {
    max-height: 27rem;
    border-right: 0;
    border-bottom: 1px solid #e8edf5;
  }

  .workspace-empty {
    min-height: 28rem;
  }
}

@media (max-width: 650px) {
  .complaints-hero {
    padding: 1.25rem;
    border-radius: 1.25rem;
  }

  .hero-summary {
    grid-template-columns: 1fr;
  }

  .hero-stat-card {
    min-width: 0;
  }

  .toolbar-actions {
    grid-template-columns: 1fr;
  }

  .toolbar-actions select,
  .refresh-btn {
    width: 100%;
  }

  .complaint-detail-header {
    align-items: stretch;
    flex-direction: column;
  }

  .detail-refresh-btn {
    align-self: flex-start;
  }

  .complaint-identity-meta {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.4rem;
  }

  .complaint-detail-grid {
    padding: 0.65rem;
  }

  .complaint-control-column {
    grid-template-columns: 1fr;
  }

  .reply-heading {
    flex-direction: column;
    gap: 0.25rem;
  }

  .reply-composer-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .reply-send-actions {
    display: grid;
    grid-template-columns: 1fr;
  }

  .reply-send-actions select,
  .send-reply-btn {
    width: 100%;
  }

  .composer-mode {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .composer-mode button {
    justify-content: center;
  }
}
</style>
