

<template>
  <div class="parent-chat-page">
    <section class="chat-hero">
      <div>
        <span class="hero-badge">
          <i class="pi pi-comments"></i>
          Phena Communication Center
        </span>

        <h1>Messages and Complaints</h1>

        <p>
          Communicate with your ward's class teacher or submit a complaint
          directly to the school administration.
        </p>
      </div>

      <div class="connection-card">
        <span
          class="connection-dot"
          :class="{ online: socketConnected }"
        ></span>

        <div>
          <strong>
            {{
              socketConnected
                ? 'Chat connected'
                : 'Chat disconnected'
            }}
          </strong>

          <small>
            {{
              socketConnected
                ? 'Messages will arrive instantly'
                : 'Attempting to reconnect'
            }}
          </small>
        </div>
      </div>
    </section>

    <div class="section-tabs">
      <button
        type="button"
        class="section-tab"
        :class="{ active: activeSection === 'messages' }"
        @click="activeSection = 'messages'"
      >
        <i class="pi pi-comments"></i>

        <span>Teacher Messages</span>

        <span
          v-if="totalUnreadMessages > 0"
          class="tab-badge"
        >
          {{ totalUnreadMessages }}
        </span>
      </button>

      <button
        type="button"
        class="section-tab"
        :class="{ active: activeSection === 'complaints' }"
        @click="activeSection = 'complaints'"
      >
        <i class="pi pi-megaphone"></i>

        <span>Complaints</span>

        <span
          v-if="openComplaintCount > 0"
          class="tab-badge warning"
        >
          {{ openComplaintCount }}
        </span>
      </button>
    </div>

    <!-- TEACHER CHAT -->
    <section
      v-if="activeSection === 'messages'"
      class="communication-shell"
    >
      <aside class="conversation-sidebar">
        <div class="sidebar-header">
          <div>
            <span class="section-label">
              Conversations
            </span>

            <h2>Class Teachers</h2>
          </div>

          <button
  type="button"
  class="refresh-conversations-btn"
  :disabled="conversationsLoading"
  :aria-label="
    conversationsLoading
      ? 'Refreshing conversations'
      : 'Refresh conversations'
  "
  @click="loadConversations"
>
  <i
    class="pi"
    :class="
      conversationsLoading
        ? 'pi-spin pi-spinner'
        : 'pi-refresh'
    "
  ></i>

  <span>
    {{
      conversationsLoading
        ? 'Refreshing...'
        : 'Refresh'
    }}
  </span>
</button>


        </div>

        <div class="conversation-search">
          <i class="pi pi-search"></i>

          <input
            v-model.trim="conversationSearch"
            type="search"
            placeholder="Search teacher or student..."
          >
        </div>

        <div
          v-if="conversationsLoading"
          class="sidebar-state"
        >
          <i class="pi pi-spin pi-spinner"></i>
          Loading conversations...
        </div>

        <div
          v-else-if="filteredConversations.length === 0"
          class="sidebar-empty"
        >
          <span>
            <i class="pi pi-comments"></i>
          </span>

          <strong>No conversations yet</strong>

          <p>
            Conversations with your ward's class teacher will appear here.
          </p>

          <button
  v-if="currentWard"
  type="button"
  class="small-primary-btn"
  :disabled="creatingConversation"
  @click="openCurrentTeacherConversation"
>
  <i
    class="pi"
    :class="
      creatingConversation
        ? 'pi-spin pi-spinner'
        : 'pi-comments'
    "
  ></i>

  {{
    creatingConversation
      ? 'Opening...'
      : 'Chat with Class Teacher'
  }}
</button>
        </div>

        <div
          v-else
          class="conversation-list"
        >
          <button
            v-for="conversation in filteredConversations"
            :key="conversation.id"
            type="button"
            class="conversation-item"
            :class="{
              active:
                Number(activeConversationId) ===
                Number(conversation.id)
            }"
            @click="selectConversation(conversation)"
          >
            <span class="conversation-avatar">
              {{
                getInitials(
                  conversation.teacherName
                )
              }}

              <span
                v-if="conversation.teacherOnline"
                class="online-indicator"
              ></span>
            </span>

            <span class="conversation-details">
              <span class="conversation-top">
                <strong>
                  {{ conversation.teacherName }}
                </strong>

                <small>
                  {{
                    formatConversationTime(
                      conversation.lastMessageAt
                    )
                  }}
                </small>
              </span>

              <span class="student-reference">
                <i class="pi pi-user"></i>
                {{ conversation.studentName }}
              </span>

              <span class="conversation-preview">
                {{
                  conversation.lastMessage ||
                  'No messages sent yet.'
                }}
              </span>
            </span>

            <span
              v-if="Number(conversation.unreadCount || 0) > 0"
              class="unread-badge"
            >
              {{ conversation.unreadCount }}
            </span>
          </button>
        </div>

        <button
  v-if="currentWard"
  type="button"
  class="new-conversation-btn"
  :disabled="creatingConversation"
  @click="openCurrentTeacherConversation"
>
  <i
    class="pi"
    :class="
      creatingConversation
        ? 'pi-spin pi-spinner'
        : 'pi-comments'
    "
  ></i>

  {{
    creatingConversation
      ? 'Opening Conversation...'
      : 'Chat with Class Teacher'
  }}
</button>
      </aside>













<main class="chat-panel">
  <div
    v-if="!activeConversation"
    class="chat-welcome"
  >
    <span class="welcome-icon">
      <i class="pi pi-comments"></i>
    </span>

    <h2>
      Parent-Teacher Communication
    </h2>

    <p>
      Select a conversation to view messages or start a new
      conversation with your ward's class teacher.
    </p>
  </div>

  <template v-else>
    <header class="chat-header">
      <div class="chat-person">
        <span class="teacher-avatar">
          {{
            getInitials(
              activeConversation.teacherName
            )
          }}
        </span>

        <div>
          <strong>
            {{ activeConversation.teacherName }}
          </strong>

          <span>
            Class teacher for
            {{ activeConversation.studentName }}
          </span>
        </div>
      </div>

      <div class="chat-header-status">
        <span
          class="connection-dot"
          :class="{
            online:
              activeConversation.teacherOnline
          }"
        ></span>

        <span>
          {{
            activeConversation.teacherOnline
              ? 'Online'
              : 'Offline'
          }}
        </span>
      </div>
    </header>

    <div
      ref="messageContainer"
      class="message-container"
      @scroll="handleMessageScroll"
      @click="closeMessageMenu"
    >
      <button
        v-if="hasMoreMessages"
        type="button"
        class="load-older-btn"
        :disabled="olderMessagesLoading"
        @click.stop="loadOlderMessages"
      >
        <i
          class="pi"
          :class="
            olderMessagesLoading
              ? 'pi-spin pi-spinner'
              : 'pi-history'
          "
        ></i>

        <span>
          {{
            olderMessagesLoading
              ? 'Loading...'
              : 'Load older messages'
          }}
        </span>
      </button>

      <div
        v-if="
          messagesLoading &&
          messages.length === 0
        "
        class="messages-loading"
      >
        <i class="pi pi-spin pi-spinner"></i>

        <span>
          Loading messages...
        </span>
      </div>

      <div
        v-else-if="
          !messagesLoading &&
          messages.length === 0
        "
        class="no-messages"
      >
        <i class="pi pi-comment"></i>

        <strong>
          Start the conversation
        </strong>

        <p>
          Send a respectful message to your ward's class teacher.
        </p>
      </div>

      <div
        v-else
        class="messages-list"
      >
        <template
          v-for="(message, index) in messages"
          :key="
            Number(message.id) > 0
              ? `message-${message.id}`
              : `message-${message.senderAccountId}-${message.createdAt}`
          "
        >
          <div
            v-if="
              shouldShowDateSeparator(
                message,
                index
              )
            "
            class="date-separator"
          >
            <span>
              {{
                formatMessageDate(
                  message.createdAt
                )
              }}
            </span>
          </div>

          <div
            class="message-row"
            :class="{
              mine: isMyMessage(message),
              theirs: !isMyMessage(message)
            }"
          >
            <div class="message-content-row">
            <div
  v-if="
    isMyMessage(message) &&
    Number(message.id) > 0
  "
  class="message-actions"
  @click.stop
>
  <button
    type="button"
    class="message-options-btn"
    title="Message options"
    aria-label="Open message options"
    :aria-expanded="
      Number(openMessageMenuId) ===
      Number(message.id)
    "
    :disabled="
      deletingMessageId !== null
    "
    @click.stop="
      toggleMessageMenu(
        message.id
      )
    "
  >
    <i
      class="pi"
      :class="
        Number(deletingMessageId) ===
        Number(message.id)
          ? 'pi-spin pi-spinner'
          : 'pi-ellipsis-v'
      "
    ></i>
  </button>

  <Transition name="message-menu">
    <div
      v-if="
        Number(openMessageMenuId) ===
        Number(message.id)
      "
      class="message-options-menu"
      role="menu"
      aria-label="Message actions"
      @click.stop
    >
      <button
        type="button"
        class="message-option-delete"
        role="menuitem"
        :disabled="
          deletingMessageId !== null
        "
        @click.stop="
          confirmDeleteMessage(
            message
          )
        "
      >
        <span class="message-option-icon">
          <i class="pi pi-trash"></i>
        </span>

        <span class="message-option-text">
          <strong>
            Delete permanently
          </strong>

          <small>
            Remove from the conversation
          </small>
        </span>
      </button>
    </div>
  </Transition>
</div>

              <div class="message-bubble">
                <p>
                  {{ message.content }}
                </p>

                <span class="message-meta">
                  {{
                    formatMessageTime(
                      message.createdAt
                    )
                  }}

                  <i
                    v-if="isMyMessage(message)"
                    class="pi"
                    :class="
                      message.readAt
                        ? 'pi-check-circle message-read'
                        : 'pi-check'
                    "
                  ></i>
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <footer class="message-composer">
      <div
        v-if="!socketConnected"
        class="socket-warning"
      >
        <i class="pi pi-exclamation-circle"></i>

        <span>
          Reconnecting to chat server...
        </span>
      </div>

      <div class="composer-row">
        <textarea
          v-model="newMessage"
          rows="1"
          maxlength="2000"
          placeholder="Write a message to the class teacher..."
          aria-label="Message to class teacher"
          :disabled="
            sendingMessage ||
            !socketConnected
          "
          @keydown.enter.exact.prevent="sendMessage"
          @keydown.enter.shift.exact.stop
        ></textarea>

        <button
          type="button"
          class="send-message-btn"
          title="Send message"
          aria-label="Send message"
          :disabled="!canSendMessage"
          @click="sendMessage"
        >
          <i
            class="pi"
            :class="
              sendingMessage
                ? 'pi-spin pi-spinner'
                : 'pi-send'
            "
          ></i>
        </button>
      </div>

      <div class="composer-help">
        <span>
          Press Enter to send. Use Shift + Enter for a new line.
        </span>

        <span>
          {{ newMessage.length }} / 2000
        </span>
      </div>
    </footer>
  </template>
</main>



    </section>

    <!-- COMPLAINTS -->
    <section
      v-else
      class="complaints-layout"
    >
      <div class="complaint-form-card">
        <div class="card-heading">
          <span class="heading-icon complaint">
            <i class="pi pi-megaphone"></i>
          </span>

          <div>
            <span class="section-label">
              Contact Administration
            </span>

            <h2>Submit a Complaint</h2>

            <p>
              Provide clear details so the administration can investigate
              and respond appropriately.
            </p>
          </div>
        </div>

        <div class="complaint-notice">
          <i class="pi pi-shield"></i>

          <div>
            <strong>Your complaint will be handled privately</strong>

            <p>
              Only authorized administrators will be able to review and
              respond to this complaint.
            </p>
          </div>
        </div>

        <div class="form-grid">
          <div class="field">
  <label>
    Related Student
  </label>

  <div class="selected-student-card">


    <div class="selected-student-details">
      <strong>
        {{
          currentWard?.fullName ||
          'Student information unavailable'
        }}
      </strong>

      <span v-if="currentWard?.className">
        <i class="pi pi-graduation-cap"></i>

        {{ currentWard.className }}
      </span>
    </div>

    <span
      v-if="currentWard"
      class="selected-student-confirmed"
    >
      <i class="pi pi-check-circle"></i>
      student
    </span>
  </div>
</div>

          <div class="field">
            <label for="complaint-category">
              Complaint Category
            </label>

            <select
              id="complaint-category"
              v-model="complaintForm.category"
            >
              <option value="" disabled>
                Select a category
              </option>

              <option value="ACADEMIC">
                Academic
              </option>

              <option value="FEES">
                Fees and Billing
              </option>

              <option value="TRANSPORT">
                Transport
              </option>

              <option value="DISCIPLINE">
                Discipline
              </option>

              <option value="HEALTH">
                Health and Safety
              </option>

              <option value="TEACHER_CONDUCT">
                Staff Conduct
              </option>

              <option value="FACILITY">
                School Facility
              </option>

              <option value="TECHNICAL">
                Portal or Technical Issue
              </option>

              <option value="OTHER">
                Other
              </option>
            </select>
          </div>
        </div>

        <div class="field">
          <label for="complaint-subject">
            Subject
          </label>

          <input
            id="complaint-subject"
            v-model.trim="complaintForm.subject"
            type="text"
            maxlength="150"
            placeholder="Briefly describe the complaint"
          >

          <small>
            {{ complaintForm.subject.length }} / 150
          </small>
        </div>

        <div class="field">
          <label for="complaint-description">
            Complaint Details
          </label>

          <textarea
            id="complaint-description"
            v-model.trim="complaintForm.description"
            rows="7"
            maxlength="3000"
            placeholder="Explain what happened, when it happened, and any action already taken..."
          ></textarea>

          <small>
            {{ complaintForm.description.length }} / 3000
          </small>
        </div>

        <div class="field">
          <label for="complaint-priority">
            Priority
          </label>

          <div class="priority-options">
            <button
              v-for="priority in complaintPriorities"
              :key="priority.value"
              type="button"
              class="priority-option"
              :class="[
                priority.className,
                {
                  selected:
                    complaintForm.priority ===
                    priority.value
                }
              ]"
              @click="
                complaintForm.priority =
                  priority.value
              "
            >
              <i :class="priority.icon"></i>

              <span>
                <strong>{{ priority.label }}</strong>
                <small>{{ priority.description }}</small>
              </span>
            </button>
          </div>
        </div>

        <div class="complaint-actions">
          <button
            type="button"
            class="secondary-btn"
            :disabled="submittingComplaint"
            @click="resetComplaintForm"
          >
            Clear
          </button>

          <button
            type="button"
            class="submit-complaint-btn"
            :disabled="!canSubmitComplaint"
            @click="submitComplaint"
          >
            <i
              class="pi"
              :class="
                submittingComplaint
                  ? 'pi-spin pi-spinner'
                  : 'pi-send'
              "
            ></i>

            {{
              submittingComplaint
                ? 'Submitting...'
                : 'Submit Complaint'
            }}
          </button>
        </div>
      </div>

      <div class="complaint-history-card">
        <div class="sidebar-header">
          <div>
            <span class="section-label">
              Complaint History
            </span>

            <h2>My Complaints</h2>
          </div>

          <button
            type="button"
            class="icon-btn"
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
          </button>
        </div>

        <div
          v-if="complaintsLoading"
          class="sidebar-state"
        >
          <i class="pi pi-spin pi-spinner"></i>
          Loading complaints...
        </div>

        <div
          v-else-if="complaints.length === 0"
          class="complaints-empty"
        >
          <i class="pi pi-inbox"></i>

          <strong>No complaints submitted</strong>

          <p>
            Complaints submitted to administrators will appear here.
          </p>
        </div>

        <div
          v-else
          class="complaint-list"
        >
          <article
            v-for="complaint in complaints"
            :key="complaint.id"
            class="complaint-item"
            :class="{
              active:
                Number(selectedComplaintId) ===
                Number(complaint.id)
            }"
            @click="selectedComplaintId = complaint.id"
          >
            <div class="complaint-item-top">
              <span class="complaint-number">
                {{ complaint.complaintNumber }}
              </span>

              <span
                class="status-pill"
                :class="normalizeStatus(complaint.status)"
              >
                {{ formatStatus(complaint.status) }}
              </span>
            </div>

            <h3>
              {{ complaint.subject }}
            </h3>

            <p>
              {{ complaint.description }}
            </p>

            <div class="complaint-meta">
              <span>
                <i class="pi pi-user"></i>
                {{ complaint.studentName }}
              </span>

              <span>
                <i class="pi pi-calendar"></i>
                {{ formatDateTime(complaint.createdAt) }}
              </span>
            </div>

            <div
              v-if="complaint.latestReply"
              class="latest-response"
            >
              <strong>Latest response</strong>

              <p>
                {{ complaint.latestReply }}
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- NEW CONVERSATION MODAL -->




    </div>

  <Teleport to="body">
    <Transition name="delete-modal">
      <div
        v-if="deleteMessageVisible"
        class="delete-message-backdrop"
        role="presentation"
        @click.self="closeDeleteMessageModal"
      >
        <section
          class="delete-message-modal"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="parent-delete-message-title"
          aria-describedby="parent-delete-message-description"
          @click.stop
        >
          <button
            type="button"
            class="delete-modal-close"
            title="Close"
            aria-label="Close delete message dialog"
            :disabled="deletingMessageId !== null"
            @click="closeDeleteMessageModal"
          >
            <i class="pi pi-times"></i>
          </button>

          <span class="delete-modal-icon">
            <i class="pi pi-trash"></i>
          </span>

          <div class="delete-modal-content">
            <span class="delete-modal-eyebrow">
              Permanent deletion
            </span>

            <h2 id="parent-delete-message-title">
              Delete this message?
            </h2>

            <p id="parent-delete-message-description">
              This message will be permanently removed from the
              conversation for everyone.
            </p>

            <blockquote
              v-if="messagePendingDeletion?.content"
              class="delete-message-preview"
            >
              {{ messagePendingDeletion.content }}
            </blockquote>
          </div>

          <div class="delete-modal-notice">
            <i class="pi pi-exclamation-triangle"></i>

            <span>
              This action is permanent and cannot be undone.
            </span>
          </div>

          <footer class="delete-modal-actions">
            <button
              type="button"
              class="delete-cancel-btn"
              :disabled="deletingMessageId !== null"
              @click="closeDeleteMessageModal"
            >
              Keep message
            </button>

            <button
              type="button"
              class="delete-confirm-btn"
              :disabled="deletingMessageId !== null"
              @click="deleteSelectedMessage"
            >
              <i
                class="pi"
                :class="
                  deletingMessageId !== null
                    ? 'pi-spin pi-spinner'
                    : 'pi-trash'
                "
              ></i>

              <span>
                {{
                  deletingMessageId !== null
                    ? 'Deleting...'
                    : 'Delete permanently'
                }}
              </span>
            </button>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>




</template>




<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
} from 'vue'

import {
  useToast,
} from 'vue-toastification'

import {
  getStaffOfStudent,
  deleteChatMessage,

  createParentComplaint,
  createParentTeacherConversation,
  getParentComplaints,
  getParentConversations,
  getConversationMessages,
  markConversationAsRead,
} from '@/services/api.js'

const toast =
  useToast()

const activeSection =
  ref('messages')

const conversations =
  ref([])

const availableWards =
  ref([])

const currentTeacher =
  ref(null)

const studentTeacherDetails =
  ref(null)

const messages =
  ref([])

const complaints =
  ref([])

const activeConversationId =
  ref(null)

const selectedComplaintId =
  ref(null)

const conversationSearch =
  ref('')

const newMessage =
  ref('')

const socket =
  ref(null)

const socketConnected =
  ref(false)

const conversationsLoading =
  ref(false)

const messagesLoading =
  ref(false)

const olderMessagesLoading =
  ref(false)

const complaintsLoading =
  ref(false)

const teacherLoading =
  ref(false)

const sendingMessage =
  ref(false)

const submittingComplaint =
  ref(false)

const creatingConversation =
  ref(false)

const hasMoreMessages =
  ref(false)

const messagePage =
  ref(1)

const reconnectAttempt =
  ref(0)

const reconnectTimer =
  ref(null)

const messageContainer =
  ref(null)

const openMessageMenuId =
  ref(null)

const deletingMessageId =
  ref(null)

const deleteMessageVisible =
  ref(false)

const messagePendingDeletion =
  ref(null)

const complaintForm =
  reactive({
    studentId: null,
    category: '',
    subject: '',
    description: '',
    priority: 'NORMAL',
  })

const complaintPriorities = [
  {
    value: 'LOW',
    label: 'Low',
    description: 'General concern',
    className: 'low',
    icon: 'pi pi-info-circle',
  },
  {
    value: 'NORMAL',
    label: 'Normal',
    description: 'Requires attention',
    className: 'normal',
    icon: 'pi pi-flag',
  },
  {
    value: 'HIGH',
    label: 'High',
    description: 'Important concern',
    className: 'high',
    icon: 'pi pi-exclamation-circle',
  },
  {
    value: 'URGENT',
    label: 'Urgent',
    description: 'Immediate attention',
    className: 'urgent',
    icon: 'pi pi-bell',
  },
]

const currentWard =
  computed(() => {
    return availableWards.value[0] || null
  })

const activeConversation =
  computed(() => {
    return conversations.value.find(
      (conversation) => {
        return (
          Number(conversation.id) ===
          Number(activeConversationId.value)
        )
      }
    ) || null
  })

const filteredConversations =
  computed(() => {
    const searchTerm =
      conversationSearch.value
        .trim()
        .toLowerCase()

    if (!searchTerm) {
      return conversations.value
    }

    return conversations.value.filter(
      (conversation) => {
        return [
          conversation.teacherName,
          conversation.studentName,
          conversation.lastMessage,
        ]
          .filter(Boolean)
          .some((value) => {
            return String(value)
              .toLowerCase()
              .includes(searchTerm)
          })
      }
    )
  })

const totalUnreadMessages =
  computed(() => {
    return conversations.value.reduce(
      (total, conversation) => {
        return total +
          Number(
            conversation.unreadCount || 0
          )
      },
      0
    )
  })

const openComplaintCount =
  computed(() => {
    const openStatuses = [
      'OPEN',
      'IN_REVIEW',
      'ASSIGNED',
      'REOPENED',
    ]

    return complaints.value.filter(
      (complaint) => {
        return openStatuses.includes(
          String(
            complaint.status || ''
          ).toUpperCase()
        )
      }
    ).length
  })

const canSendMessage =
  computed(() => {
    return (
      socketConnected.value &&
      socket.value?.readyState ===
        WebSocket.OPEN &&
      Number(activeConversationId.value) > 0 &&
      newMessage.value.trim().length > 0 &&
      !sendingMessage.value
    )
  })

const canSubmitComplaint =
  computed(() => {
    return (
      Number(
        complaintForm.studentId
      ) > 0 &&
      complaintForm.category.length > 0 &&
      complaintForm.subject
        .trim()
        .length > 0 &&
      complaintForm.description
        .trim()
        .length > 0 &&
      !submittingComplaint.value
    )
  })

function getTenantCode() {
  return localStorage.getItem(
    'tenantCode'
  ) || ''
}

function getAccessToken() {
  return (
    localStorage.getItem(
      'accessToken'
    ) ||
    localStorage.getItem(
      'token'
    ) ||
    ''
  )
}

function getStoredUser() {
  const storedUser =
    localStorage.getItem('user')



  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(
      storedUser
    )
  } catch (error) {


    return null
  }
}

function getStudentUserId() {
  const user =
    getStoredUser()

  return String(
    user?.userId || ''
  ).trim()
}

function getAuthenticatedAccountId() {
  const token = getAccessToken()

  if (token) {
    try {
      const encodedPayload =
        token.split('.')[1]

      if (encodedPayload) {
        const normalizedPayload =
          encodedPayload
            .replace(/-/g, '+')
            .replace(/_/g, '/')

        const paddedPayload =
          normalizedPayload.padEnd(
            normalizedPayload.length +
              (
                (
                  4 -
                  (
                    normalizedPayload.length %
                    4
                  )
                ) %
                4
              ),
            '='
          )

        const payload =
          JSON.parse(
            decodeURIComponent(
              atob(paddedPayload)
                .split('')
                .map((character) => {
                  return `%${character
                    .charCodeAt(0)
                    .toString(16)
                    .padStart(2, '0')}`
                })
                .join('')
            )
          )

        const accountId =
          Number(
            payload.userId ||
            payload.accountId ||
            payload.id ||
            0
          )

        if (accountId > 0) {
          return accountId
        }
      }
    } catch (error) {

    }
  }

  const storedUser = getStoredUser()

  const storedAccountId =
    Number(
      storedUser?.accountId ||
      0
    )

  if (storedAccountId > 0) {
    return storedAccountId
  }

  return null
}

function normalizeMessage(message) {
  const authenticatedAccountId =
    Number(
      getAuthenticatedAccountId()
    )

  const senderAccountId =
    Number(
      message.senderAccountId ||
      message.senderId ||
      message.accountId ||
      0
    )

  const calculatedIsMine =
    authenticatedAccountId > 0 &&
    senderAccountId > 0 &&
    authenticatedAccountId ===
      senderAccountId

  return {
    ...message,

    id: Number(
      message.id ||
      message.messageId ||
      0
    ),

    conversationId: Number(
      message.conversationId ||
      activeConversationId.value ||
      0
    ),

    senderAccountId,

    senderName:
      message.senderName ||
      message.senderFullName ||
      'User',

    content: String(
      message.content ||
      message.message ||
      message.text ||
      ''
    ),

    createdAt:
      message.createdAt ||
      message.sentAt ||
      new Date().toISOString(),

    readAt:
      message.readAt ||
      null,

    isMine:
      calculatedIsMine,
  }
}

function isMyMessage(message) {
  if (!message) {
    return false
  }

  const authenticatedAccountId =
    Number(
      getAuthenticatedAccountId()
    )

  const senderAccountId =
    Number(
      message.senderAccountId ||
      0
    )

  return (
    authenticatedAccountId > 0 &&
    senderAccountId > 0 &&
    authenticatedAccountId ===
      senderAccountId
  )
}

async function loadCurrentStudentAndTeacher() {
  const studentUserId =
    getStudentUserId()

  if (!studentUserId) {
    availableWards.value = []
    currentTeacher.value = null

    toast.error(
      'Student user ID was not found. Please sign in again.'
    )

    return
  }

  try {
    teacherLoading.value = true

    const response =
      await getStaffOfStudent(
        studentUserId
      )



    const data =
      response.data

    studentTeacherDetails.value =
      data

    availableWards.value = [
      {
        id:
          Number(data.studentId),

        accountId:
          Number(
            data.studentAccountId
          ),

        userId:
          String(
            data.studentUserId || ''
          ),

        fullName:
          String(
            data.studentName || ''
          ),

        classId:
          Number(data.classId),

        className:
          String(
            data.className || ''
          ),
      },
    ]

    complaintForm.studentId =
      Number(data.studentId)

    currentTeacher.value =
      Array.isArray(data.teachers)
        ? data.teachers.find(
            (teacher) => {
              return (
                teacher.isActive === true
              )
            }
          ) || null
        : null

    if (!currentTeacher.value) {
      toast.warning(
        `No active class teacher is assigned to ${
          data.className || 'this class'
        }.`
      )
    }
  } catch (error) {


    availableWards.value = []
    currentTeacher.value = null

    toast.error(
      error?.response?.data
        ?.message ||
      'Unable to retrieve the class teacher.'
    )
  } finally {
    teacherLoading.value = false
  }
}




async function openCurrentTeacherConversation() {
  if (!currentWard.value) {
    toast.error(
      'Student information is unavailable.'
    )

    return
  }

  if (!currentTeacher.value) {
    toast.error(
      'No active class teacher is assigned to the current class.'
    )

    return
  }

  try {
    creatingConversation.value = true

    const response =
      await createParentTeacherConversation({
        studentId:
          Number(
            currentWard.value.id
          ),
      })


    if (!response?.data) {
      throw new Error(
        'The conversation API returned no data.'
      )
    }

    const conversation =
      normalizeConversation(
        response.data
      )

    if (
      !Number.isInteger(
        Number(conversation.id)
      ) ||
      Number(conversation.id) <= 0
    ) {
      throw new Error(
        'The conversation API returned an invalid conversation ID.'
      )
    }

    const existingIndex =
      conversations.value.findIndex(
        (item) => {
          return (
            Number(item.id) ===
            Number(conversation.id)
          )
        }
      )

    if (existingIndex < 0) {
      conversations.value.unshift(
        conversation
      )
    } else {
      conversations.value[
        existingIndex
      ] = {
        ...conversations.value[
          existingIndex
        ],
        ...conversation,
      }
    }

    sortConversations()

    await selectConversation(
      conversation
    )
  } catch (error) {


    toast.error(
      error?.response?.data?.message ||
      error?.message ||
      'Unable to start the conversation with the class teacher.'
    )
  } finally {
    creatingConversation.value = false
  }
}


function normalizeConversation(
  conversation
) {
  return {
    ...conversation,

    id:
      Number(
        conversation.id
      ),

    studentId:
      Number(
        conversation.studentId ||
        currentWard.value?.id ||
        0
      ),

    studentName:
      conversation.studentName ||
      currentWard.value?.fullName ||
      '',

    classId:
      Number(
        conversation.classId ||
        currentWard.value?.classId ||
        0
      ),

    className:
      conversation.className ||
      currentWard.value?.className ||
      '',

    teacherAccountId:
      Number(
        conversation.teacherAccountId ||
        currentTeacher.value?.accountId ||
        0
      ),

    teacherName:
      conversation.teacherName ||
      currentTeacher.value?.fullName ||
      'Class Teacher',

    teacherOnline:
      Boolean(
        conversation.teacherOnline
      ),

    unreadCount:
      Number(
        conversation.unreadCount ||
        0
      ),
  }
}

async function loadConversations() {
  try {
    conversationsLoading.value = true

    const response =
      await getParentConversations()

    conversations.value =
      Array.isArray(response.data)
        ? response.data.map(
            normalizeConversation
          )
        : []

    sortConversations()

    if (
      conversations.value.length === 0 &&
      currentTeacher.value
    ) {
      await openCurrentTeacherConversation()

      return
    }

    if (
      conversations.value.length > 0 &&
      !activeConversationId.value
    ) {
      await selectConversation(
        conversations.value[0]
      )
    }
  } catch (error) {


    conversations.value = []

    toast.error(
      error?.response?.data
        ?.message ||
      'Unable to load conversations.'
    )
  } finally {
    conversationsLoading.value = false
  }
}

async function selectConversation(
  conversation
) {
  closeMessageMenu()

  activeConversationId.value =
    Number(conversation.id)

  conversation.unreadCount = 0

  messagePage.value = 1
  messages.value = []

  await loadMessages()
  await markConversationRead()



}

async function loadMessages() {
  if (!activeConversationId.value) {
    return
  }

  try {
    messagesLoading.value = true

    const response =
      await getConversationMessages(
        activeConversationId.value,
        {
          page: 1,
          limit: 50,
        }
      )

    const data =
      response.data

    const receivedMessages =
  Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.messages)
        ? data.messages
        : []

messages.value =
  receivedMessages.map(
    normalizeMessage
  )

    hasMoreMessages.value =
      Boolean(data?.hasMore)

    await scrollMessagesToBottom()
  } catch (error) {


    messages.value = []

    toast.error(
      error?.response?.data
        ?.message ||
      'Unable to load chat messages.'
    )
  } finally {
    messagesLoading.value = false
  }
}

async function loadOlderMessages() {
  if (
    olderMessagesLoading.value ||
    !hasMoreMessages.value ||
    !activeConversationId.value
  ) {
    return
  }

  try {
    olderMessagesLoading.value = true
    messagePage.value += 1

    const response =
      await getConversationMessages(
        activeConversationId.value,
        {
          page:
            messagePage.value,
          limit: 50,
        }
      )

    const data =
      response.data

    const olderMessages =
      Array.isArray(data)
        ? data
        : Array.isArray(
            data?.items
          )
          ? data.items
          : []

    const normalizedOlderMessages =
  olderMessages.map(
    normalizeMessage
  )

const existingMessageIds =
  new Set(
    messages.value
      .map((message) => {
        return Number(message.id)
      })
      .filter((messageId) => {
        return messageId > 0
      })
  )

const uniqueOlderMessages =
  normalizedOlderMessages.filter(
    (message) => {
      return (
        Number(message.id) <= 0 ||
        !existingMessageIds.has(
          Number(message.id)
        )
      )
    }
  )

messages.value = [
  ...uniqueOlderMessages,
  ...messages.value,
]

    hasMoreMessages.value =
      Boolean(data?.hasMore)
  } catch (error) {
    messagePage.value -= 1

    toast.error(
      error?.response?.data
        ?.message ||
      'Unable to load older messages.'
    )
  } finally {
    olderMessagesLoading.value = false
  }
}

async function markConversationRead() {
  if (!activeConversationId.value) {
    return
  }

  try {
    await markConversationAsRead(
      activeConversationId.value
    )
  } catch (error) {

  }
}

function getWebSocketUrl() {
  const configuredWebSocketUrl =
    String(
      import.meta.env
        .VITE_WEBSOCKET_URL ||
      'ws://localhost:9001/chat/ws'
    )
      .trim()
      .replace(
        /\/+$/,
        ''
      )

  const accessToken =
    getAccessToken()

  const tenantCode =
    getTenantCode()

  if (!accessToken) {
    throw new Error(
      'The authentication token is missing.'
    )
  }

  if (!tenantCode) {
    throw new Error(
      'The tenant code is missing.'
    )
  }

  const queryParameters =
    new URLSearchParams({
      token:
        accessToken,

      tenantCode:
        tenantCode,
    })

  return (
    `${configuredWebSocketUrl}` +
    `?${queryParameters.toString()}`
  )
}


function connectSocket() {
  const token =
    getAccessToken()

  const tenantCode =
    getTenantCode()

  if (!token || !tenantCode) {
    socketConnected.value = false

    return
  }

  if (
    socket.value &&
    (
      socket.value.readyState ===
        WebSocket.OPEN ||
      socket.value.readyState ===
        WebSocket.CONNECTING
    )
  ) {
    return
  }

  const websocket =
    new WebSocket(
      getWebSocketUrl()
    )

  socket.value =
    websocket

  websocket.onopen = () => {
    socketConnected.value = true
    reconnectAttempt.value = 0
  }

  websocket.onmessage = (
    socketMessage
  ) => {
    try {
      const event =
        JSON.parse(
          socketMessage.data
        )

      handleSocketEvent(event)
    } catch (error) {

    }
  }

  websocket.onerror = (
    error
  ) => {

  }

  websocket.onclose = () => {
    socketConnected.value = false

    scheduleReconnect()
  }
}

function scheduleReconnect() {
  if (reconnectTimer.value) {
    clearTimeout(
      reconnectTimer.value
    )
  }

  const delay =
    Math.min(
      1000 *
        Math.pow(
          2,
          reconnectAttempt.value
        ),
      15000
    )

  reconnectAttempt.value += 1

  reconnectTimer.value =
    setTimeout(() => {
      connectSocket()
    }, delay)
}

function handleSocketEvent(event) {
  const eventType =
    String(
      event?.type ||
      event?.eventType ||
      event?.event ||
      ''
    )
      .trim()
      .toUpperCase()

  switch (eventType) {
    case 'CONNECTED':
      socketConnected.value = true
      break

    case 'NEW_MESSAGE':
      handleNewMessage(event)
      break

    case 'MESSAGE_READ':
      handleMessagesRead(event)
      break

    case 'MESSAGE_DELETED':
      applyDeletedMessage(event)
      break

    case 'USER_ONLINE':
      updateTeacherPresence(
        event.accountId,
        true
      )
      break

    case 'USER_OFFLINE':
      updateTeacherPresence(
        event.accountId,
        false
      )
      break

    case 'ERROR':
      sendingMessage.value = false

      toast.error(
        event.errorMessage ||
        event.message ||
        'Unable to process the chat request.'
      )
      break

    default:
     }

  }
function updateTeacherPresence(
  accountId,
  isOnline
) {
  conversations.value.forEach(
    (conversation) => {
      if (
        Number(
          conversation.teacherAccountId
        ) ===
        Number(accountId)
      ) {
        conversation.teacherOnline =
          isOnline
      }
    }
  )
}

function handleNewMessage(event) {
  sendingMessage.value = false

  const authenticatedAccountId =
    Number(
      getAuthenticatedAccountId()
    )

  const conversation =
    conversations.value.find(
      (item) => {
        return (
          Number(item.id) ===
          Number(
            event.conversationId
          )
        )
      }
    )

  if (conversation) {
    conversation.lastMessage =
      event.content

    conversation.lastMessageAt =
      event.sentAt

    if (
      Number(
        activeConversationId.value
      ) !==
        Number(
          event.conversationId
        ) &&
      Number(
        event.senderAccountId
      ) !==
        authenticatedAccountId
    ) {
      conversation.unreadCount =
        Number(
          conversation.unreadCount ||
          0
        ) + 1
    }
  }

  if (
    Number(
      activeConversationId.value
    ) ===
    Number(
      event.conversationId
    )
  ) {
    const messageExists =
      messages.value.some(
        (message) => {
          return (
            Number(message.id) ===
            Number(event.messageId)
          )
        }
      )

    if (!messageExists) {


      messages.value.push(
  normalizeMessage({
    id:
      Number(event.messageId),

    conversationId:
      Number(
        event.conversationId
      ),

    senderAccountId:
      Number(
        event.senderAccountId
      ),

    senderName:
      event.senderName,

    content:
      event.content,

    createdAt:
      event.sentAt,

    readAt:
      event.readAt ||
      null,

    isMine:
      Number(
        event.senderAccountId
      ) ===
      authenticatedAccountId,
  })
)
    }

    scrollMessagesToBottom()

    if (
      Number(
        event.senderAccountId
      ) !==
      authenticatedAccountId
    ) {
      sendReadReceipt(
        event.conversationId
      )
    }
  }

  sortConversations()
}

function handleMessagesRead(event) {
  if (
    Number(
      activeConversationId.value
    ) !==
    Number(
      event.conversationId
    )
  ) {
    return
  }

  messages.value =
    messages.value.map(
      (message) => {
        if (
          message.isMine &&
          !message.readAt
        ) {
          return {
            ...message,

            readAt:
              event.readAt ||
              new Date()
                .toISOString(),
          }
        }

        return message
      }
    )
}

function sendMessage() {
  const content =
    newMessage.value.trim()

  if (
    !canSendMessage.value ||
    !content
  ) {
    return
  }

  sendingMessage.value = true

  socket.value.send(
    JSON.stringify({
      type:
        'SEND_MESSAGE',

      conversationId:
        Number(
          activeConversationId.value
        ),

      content,
    })
  )

  newMessage.value = ''
}









function toggleMessageMenu(
  messageId
) {
  const normalizedMessageId =
    Number(messageId)

  if (
    !Number.isInteger(
      normalizedMessageId
    ) ||
    normalizedMessageId <= 0 ||
    deletingMessageId.value !== null
  ) {
    return
  }

  const menuIsAlreadyOpen =
    Number(
      openMessageMenuId.value
    ) ===
    normalizedMessageId

  openMessageMenuId.value =
    menuIsAlreadyOpen
      ? null
      : normalizedMessageId
}

function closeMessageMenu() {
  openMessageMenuId.value =
    null
}

function confirmDeleteMessage(
  message
) {
  if (
    !message ||
    deletingMessageId.value !== null
  ) {
    return
  }

  const messageId =
    Number(message.id)

  if (
    !Number.isInteger(messageId) ||
    messageId <= 0
  ) {
    toast.error(
      'This message does not have a valid ID.'
    )

    return
  }

  if (!isMyMessage(message)) {
    toast.error(
      'You can only delete messages that you sent.'
    )

    return
  }

  closeMessageMenu()

  messagePendingDeletion.value = {
    ...message,
  }

  deleteMessageVisible.value =
    true
}

function closeDeleteMessageModal(
  forceClose = false
) {
  if (
    deletingMessageId.value !== null &&
    !forceClose
  ) {
    return
  }

  deleteMessageVisible.value =
    false

  messagePendingDeletion.value =
    null

  closeMessageMenu()
}

function applyDeletedMessage(
  data
) {
  const messageId =
    Number(
      data?.messageId ||
      data?.id ||
      0
    )

  if (
    !Number.isInteger(messageId) ||
    messageId <= 0
  ) {


    return
  }

  const deletedMessage =
    messages.value.find(
      (message) => {
        return (
          Number(message.id) ===
          messageId
        )
      }
    )

  messages.value =
    messages.value.filter(
      (message) => {
        return (
          Number(message.id) !==
          messageId
        )
      }
    )

  closeMessageMenu()

  const conversationId =
    Number(
      data?.conversationId ||
      deletedMessage?.conversationId ||
      activeConversationId.value ||
      0
    )

  if (
    !Number.isInteger(
      conversationId
    ) ||
    conversationId <= 0
  ) {
    return
  }

  const conversation =
    conversations.value.find(
      (item) => {
        return (
          Number(item.id) ===
          conversationId
        )
      }
    )

  if (!conversation) {
    return
  }

  const remainingMessages =
    messages.value
      .filter(
        (message) => {
          return (
            Number(
              message.conversationId
            ) ===
            conversationId
          )
        }
      )
      .slice()
      .sort(
        (first, second) => {
          const firstTime =
            new Date(
              first.createdAt
            ).getTime()

          const secondTime =
            new Date(
              second.createdAt
            ).getTime()

          return (
            secondTime -
            firstTime
          )
        }
      )

  const latestMessage =
    remainingMessages.length > 0
      ? remainingMessages[0]
      : null

  conversation.lastMessage =
    latestMessage?.content ||
    ''

  conversation.lastMessageAt =
    latestMessage?.createdAt ||
    null

  sortConversations()
}

async function deleteSelectedMessage() {
  const message =
    messagePendingDeletion.value

  if (!message) {
    toast.error(
      'No message was selected for deletion.'
    )

    return
  }

  const messageId =
    Number(message.id)

  if (
    !Number.isInteger(messageId) ||
    messageId <= 0
  ) {
    toast.error(
      'The selected message has an invalid ID.'
    )

    return
  }

  if (
    deletingMessageId.value !== null
  ) {
    return
  }

  try {
    deletingMessageId.value =
      messageId

    const response =
      await deleteChatMessage(
        messageId
      )

    const responseData =
      response?.data ||
      {}

    const deletedMessageId =
      Number(
        responseData.messageId ||
        responseData.id ||
        messageId
      )

    const deletedConversationId =
      Number(
        responseData.conversationId ||
        message.conversationId ||
        activeConversationId.value ||
        0
      )

    applyDeletedMessage({
      messageId:
        deletedMessageId,

      conversationId:
        deletedConversationId,
    })

    closeDeleteMessageModal(
      true
    )

    toast.success(
      responseData.message ||
      'Message permanently deleted.'
    )
  } catch (error) {
    const responseData =
      error?.response?.data

    const backendMessage =
      typeof responseData ===
      'string'
        ? responseData
        : responseData?.message ||
          responseData?.errorMessage ||
          responseData?.error


    toast.error(
      backendMessage ||
      error?.message ||
      'Unable to delete the message.'
    )
  } finally {
    deletingMessageId.value =
      null
  }
}











function sendReadReceipt(
  conversationId
) {
  if (
    !socketConnected.value ||
    socket.value?.readyState !==
      WebSocket.OPEN
  ) {
    return
  }

  socket.value.send(
    JSON.stringify({
      type:
        'MESSAGE_READ',

      conversationId:
        Number(conversationId),
    })
  )
}

async function loadComplaints() {
  try {
    complaintsLoading.value = true

    const response =
      await getParentComplaints()


    complaints.value =
      Array.isArray(response.data)
        ? response.data
        : []
  } catch (error) {
    complaints.value = []

    toast.error(
      error?.response?.data
        ?.message ||
      'Unable to load complaints.'
    )
  } finally {
    complaintsLoading.value = false
  }
}

async function submitComplaint() {
  if (!canSubmitComplaint.value) {
    return
  }

  try {
    submittingComplaint.value = true

    const response =
      await createParentComplaint({
        studentId:
          Number(
            complaintForm.studentId
          ),

        category:
          complaintForm.category,

        subject:
          complaintForm.subject
            .trim(),

        description:
          complaintForm.description
            .trim(),

        priority:
          complaintForm.priority,
      })

    toast.success(
      response.data?.message ||
      'Complaint submitted successfully.'
    )

    resetComplaintForm()

    await loadComplaints()
  } catch (error) {
    toast.error(
      error?.response?.data
        ?.message ||
      'Unable to submit the complaint.'
    )
  } finally {
    submittingComplaint.value = false
  }
}

function resetComplaintForm() {
  complaintForm.studentId =
    currentWard.value
      ? Number(
          currentWard.value.id
        )
      : null

  complaintForm.category = ''
  complaintForm.subject = ''
  complaintForm.description = ''
  complaintForm.priority =
    'NORMAL'
}

function sortConversations() {
  conversations.value.sort(
    (first, second) => {
      const firstDate =
        new Date(
          first.lastMessageAt ||
          first.createdAt ||
          0
        ).getTime()

      const secondDate =
        new Date(
          second.lastMessageAt ||
          second.createdAt ||
          0
        ).getTime()

      return secondDate - firstDate
    }
  )
}

async function scrollMessagesToBottom() {
  await nextTick()

  if (messageContainer.value) {
    messageContainer.value.scrollTop =
      messageContainer.value
        .scrollHeight
  }
}

function handleMessageScroll() {
  // Reserved for scroll-based pagination.
}

function getInitials(value) {
  return String(
    value || 'Teacher'
  )
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => {
      return part.charAt(0)
    })
    .join('')
    .toUpperCase()
}

function formatConversationTime(
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

  const today =
    new Date()

  if (
    date.toDateString() ===
    today.toDateString()
  ) {
    return date.toLocaleTimeString(
      [],
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    )
  }

  return date.toLocaleDateString(
    [],
    {
      day: '2-digit',
      month: 'short',
    }
  )
}

function formatMessageTime(value) {
  if (!value) {
    return ''
  }

  return new Date(value)
    .toLocaleTimeString(
      [],
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    )
}

function formatMessageDate(value) {
  if (!value) {
    return ''
  }

  return new Date(value)
    .toLocaleDateString(
      'en-GB',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
}

function shouldShowDateSeparator(
  message,
  index
) {
  if (index === 0) {
    return true
  }

  const previousMessage =
    messages.value[
      index - 1
    ]

  return (
    new Date(
      message.createdAt
    ).toDateString() !==
    new Date(
      previousMessage.createdAt
    ).toDateString()
  )
}

function formatDateTime(value) {
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

  return date.toLocaleString(
    'en-GB',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  )
}

function normalizeStatus(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
}

function formatStatus(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(
      /\b\w/g,
      (letter) => {
        return letter.toUpperCase()
      }
    )
}


function handleDocumentClick() {
  closeMessageMenu()
}


onMounted(async () => {
  document.addEventListener(
    'click',
    handleDocumentClick
  )

  await loadCurrentStudentAndTeacher()

  await Promise.all([
    loadConversations(),
    loadComplaints(),
  ])

  connectSocket()
})


onBeforeUnmount(() => {
  document.removeEventListener(
    'click',
    handleDocumentClick
  )

  if (reconnectTimer.value) {
    clearTimeout(
      reconnectTimer.value
    )
  }

  if (socket.value) {
    socket.value.onclose = null
    socket.value.close()
  }
})


</script>






<style scoped>

.selected-student-card {
  min-height: 3.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem;
  border: 1px solid #dbeafe;
  border-radius: 0.9rem;
  background: linear-gradient(
    135deg,
    #f8fbff,
    #eff6ff
  );
}

.selected-student-avatar {
  width: 2.5rem;
  height: 2.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 2.5rem;
  border-radius: 0.75rem;
  background: #2563eb;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 800;
  box-shadow:
    0 6px 14px rgb(37 99 235 / 18%);
}

.selected-student-details {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.selected-student-details strong {
  overflow: hidden;
  color: #1e293b;
  font-size: 0.8rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-student-details span {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.2rem;
  color: #64748b;
  font-size: 0.68rem;
}

.selected-student-details i {
  color: #2563eb;
  font-size: 0.68rem;
}

.selected-student-confirmed {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  flex: 0 0 auto;
  padding: 0.35rem 0.55rem;
  border-radius: 999px;
  background: #dcfce7;
  color: #15803d;
  font-size: 0.62rem;
  font-weight: 800;
}

@media (max-width: 520px) {
  .selected-student-card {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .selected-student-confirmed {
    margin-left: 3.25rem;
  }
}



/* =========================================================
   COMPLAINT HISTORY
   ========================================================= */

.complaint-history-card {
  background: #ffffff;
  border: 1px solid #e8ebf0;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);
}

/* ---------------------------------------------------------
   Header
   --------------------------------------------------------- */

.complaint-history-card .sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 24px;
  background: linear-gradient(
    180deg,
    #ffffff 0%,
    #fafbfc 100%
  );
  border-bottom: 1px solid #edf0f3;
}

.complaint-history-card .section-label {
  display: block;
  margin-bottom: 5px;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.complaint-history-card h2 {
  margin: 0;
  color: #172033;
  font-size: 21px;
  font-weight: 750;
  letter-spacing: -0.025em;
}

/* ---------------------------------------------------------
   Refresh Button
   --------------------------------------------------------- */

.complaint-history-card .icon-btn {
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  border: 1px solid #e2e6eb;
  border-radius: 10px;
  background: #ffffff;
  color: #64748b;

  font-size: 15px;
  cursor: pointer;

  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.complaint-history-card .icon-btn:hover:not(:disabled) {
  background: #f5f7fa;
  border-color: #d5dae1;
  color: #1f2937;
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.08);
}

.complaint-history-card .icon-btn:active:not(:disabled) {
  transform: translateY(0);
}

.complaint-history-card .icon-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* ---------------------------------------------------------
   Loading State
   --------------------------------------------------------- */

.complaint-history-card .sidebar-state {
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  padding: 30px;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}

.complaint-history-card .sidebar-state i {
  color: #475569;
  font-size: 16px;
}

/* ---------------------------------------------------------
   Empty State
   --------------------------------------------------------- */

.complaint-history-card .complaints-empty {
  min-height: 280px;
  padding: 45px 30px;

  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
}

.complaint-history-card .complaints-empty > i {
  width: 58px;
  height: 58px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-bottom: 16px;

  border-radius: 16px;
  background: #f4f6f8;
  color: #94a3b8;

  font-size: 23px;
}

.complaint-history-card .complaints-empty strong {
  display: block;
  margin-bottom: 7px;

  color: #1e293b;
  font-size: 15px;
  font-weight: 700;
}

.complaint-history-card .complaints-empty p {
  max-width: 360px;
  margin: 0;

  color: #7b8798;
  font-size: 13px;
  line-height: 1.65;
}

/* ---------------------------------------------------------
   Complaint List
   --------------------------------------------------------- */

.complaint-history-card .complaint-list {
  display: flex;
  flex-direction: column;
  gap: 10px;

  max-height: 620px;
  padding: 14px;

  overflow-y: auto;
}

/* Custom scrollbar */

.complaint-history-card .complaint-list::-webkit-scrollbar {
  width: 6px;
}

.complaint-history-card .complaint-list::-webkit-scrollbar-track {
  background: transparent;
}

.complaint-history-card .complaint-list::-webkit-scrollbar-thumb {
  background: #d7dce3;
  border-radius: 20px;
}

.complaint-history-card .complaint-list::-webkit-scrollbar-thumb:hover {
  background: #c4cad3;
}

/* ---------------------------------------------------------
   Complaint Item
   --------------------------------------------------------- */

.complaint-history-card .complaint-item {
  position: relative;

  padding: 17px 18px;

  background: #ffffff;
  border: 1px solid #e7eaf0;
  border-radius: 14px;

  cursor: pointer;

  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.complaint-history-card .complaint-item:hover {
  border-color: #d5dbe4;
  background: #fcfdff;
  box-shadow: 0 5px 16px rgba(15, 23, 42, 0.06);
  transform: translateY(-1px);
}

/* Selected complaint */

.complaint-history-card .complaint-item.active {
  background: #f8fafc;
  border-color: #94a3b8;
  box-shadow:
    0 5px 18px rgba(15, 23, 42, 0.07),
    inset 3px 0 0 #334155;
}

.complaint-history-card .complaint-item.active:hover {
  transform: none;
}

/* ---------------------------------------------------------
   Top Row
   --------------------------------------------------------- */

.complaint-history-card .complaint-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  margin-bottom: 11px;
}

.complaint-history-card .complaint-number {
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

/* ---------------------------------------------------------
   Status Pill
   --------------------------------------------------------- */

.complaint-history-card .status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  min-height: 24px;
  padding: 3px 9px;

  border: 1px solid transparent;
  border-radius: 999px;

  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

/* Pending */

.complaint-history-card .status-pill.pending {
  background: #fff7ed;
  border-color: #fed7aa;
  color: #c2410c;
}

/* Open */

.complaint-history-card .status-pill.open {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}

/* Resolved */

.complaint-history-card .status-pill.resolved {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #15803d;
}

/* Closed */

.complaint-history-card .status-pill.closed {
  background: #f1f5f9;
  border-color: #e2e8f0;
  color: #475569;
}

/* ---------------------------------------------------------
   Subject
   --------------------------------------------------------- */

.complaint-history-card .complaint-item h3 {
  margin: 0 0 7px;

  color: #1e293b;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: -0.01em;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---------------------------------------------------------
   Description
   --------------------------------------------------------- */

.complaint-history-card .complaint-item > p {
  display: block;
  margin: 0 0 14px;
  overflow: visible;
  color: #697586;
  font-size: 12.5px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: normal;
}

/* ---------------------------------------------------------
   Meta
   --------------------------------------------------------- */

.complaint-history-card .complaint-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 18px;

  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
}

.complaint-history-card .complaint-meta span {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  color: #7a8595;
  font-size: 11px;
  font-weight: 500;
}

.complaint-history-card .complaint-meta i {
  color: #9aa4b2;
  font-size: 11px;
}










/* ---------------------------------------------------------
   Latest Response
   --------------------------------------------------------- */

.complaint-history-card .latest-response {
  margin-top: 13px;
  padding: 11px 12px;
  border: 1px solid #edf0f3;
  border-radius: 9px;
  background: #f8fafc;
}

.complaint-history-card .latest-response strong {
  display: block;
  margin-bottom: 5px;
  color: #475569;
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.complaint-history-card .latest-response p {
  display: block;
  margin: 0;
  overflow: visible;
  color: #64748b;
  font-size: 11.5px;
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: normal;
}














/* ---------------------------------------------------------
   Mobile
   --------------------------------------------------------- */

@media (max-width: 640px) {
  .complaint-history-card {
    border-radius: 14px;
  }

  .complaint-history-card .sidebar-header {
    padding: 18px;
  }

  .complaint-history-card h2 {
    font-size: 18px;
  }

  .complaint-history-card .complaint-list {
    max-height: none;
    padding: 10px;
  }

  .complaint-history-card .complaint-item {
    padding: 15px;
  }

  .complaint-history-card .complaint-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 7px;
  }
}



.messages-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  overflow: visible;
}

.message-row {
  position: relative;
  display: flex;
  justify-content: flex-start;
  overflow: visible;
}

.message-row.mine {
  justify-content: flex-end;
}

.message-content-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  max-width: min(78%, 42rem);
  overflow: visible;
}

.message-row.mine .message-content-row {
  justify-content: flex-end;
}

.message-actions {
  position: relative;
  z-index: 30;
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  opacity: 1;
  visibility: visible;
  overflow: visible;
}

.message-options-btn {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 2rem;
  padding: 0;
  border: 1px solid #dbe2ea;
  border-radius: 50%;
  background: #ffffff;
  color: #64748b;
  box-shadow: 0 2px 8px rgb(15 23 42 / 10%);
  cursor: pointer;
  opacity: 1;
  visibility: visible;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    transform 0.15s ease;
}

.message-options-btn:hover:not(:disabled),
.message-options-btn[aria-expanded='true'] {
  border-color: #b8c4d4;
  background: #f1f5f9;
  color: #172033;
  transform: scale(1.05);
}

.message-options-btn:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.message-options-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.message-options-btn .pi {
  color: inherit;
  font-size: 0.9rem;
  line-height: 1;
}

.message-options-menu {
  position: absolute;
  z-index: 500;
  right: calc(100% + 0.45rem);
  top: 50%;
  width: 13rem;
  padding: 0.4rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.9rem;
  background: #ffffff;
  box-shadow:
    0 16px 38px rgb(15 23 42 / 18%),
    0 4px 12px rgb(15 23 42 / 8%);
  transform: translateY(-50%);
}

.message-option-delete {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.7rem;
  border: 0;
  border-radius: 0.65rem;
  background: transparent;
  color: #b42318;
  text-align: left;
  cursor: pointer;
}

.message-option-delete:hover {
  background: #fff1f1;
}

.message-option-icon {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 2rem;
  border-radius: 0.6rem;
  background: #fee4e2;
  color: #d92d20;
}

.message-option-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.message-option-text strong {
  color: #b42318;
  font-size: 0.78rem;
  line-height: 1.3;
}

.message-option-text small {
  margin-top: 0.1rem;
  color: #8f4a45;
  font-size: 0.67rem;
  line-height: 1.3;
}

.message-menu-enter-active,
.message-menu-leave-active {
  transition:
    opacity 0.14s ease,
    transform 0.14s ease;
}

.message-menu-enter-from,
.message-menu-leave-to {
  opacity: 0;
  transform:
    translateY(-50%)
    translateX(0.35rem)
    scale(0.97);
}


.parent-chat-page {
  min-height: 100vh;
  padding: 24px;
  background: #f4f7fb;
  color: #172033;
}



.parent-chat-page *,
.parent-chat-page *::before,
.parent-chat-page *::after {
  box-sizing: border-box;
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.chat-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px;
  border-radius: 22px;
  background:
    linear-gradient(
      135deg,
      #172554 0%,
      #1d4ed8 55%,
      #2563eb 100%
    );
  color: #ffffff;
  box-shadow:
    0 20px 45px rgba(30, 64, 175, 0.2);
}

.chat-hero h1 {
  margin: 12px 0 8px;
  font-size: 30px;
  line-height: 1.2;
}

.chat-hero p {
  max-width: 680px;
  margin: 0;
  color: #dbeafe;
  line-height: 1.65;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 11px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  font-size: 12px;
  font-weight: 700;
}

.connection-card {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 220px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
}

.connection-card strong,
.connection-card small {
  display: block;
}

.connection-card small {
  margin-top: 3px;
  color: #dbeafe;
}

.connection-dot {
  flex: 0 0 10px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #94a3b8;
}

.connection-dot.online {
  background: #22c55e;
  box-shadow:
    0 0 0 5px rgba(34, 197, 94, 0.18);
}


.delete-message-backdrop {
  position: fixed;
  z-index: 10050;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  overflow-y: auto;
  background: rgb(15 23 42 / 72%);
}

.delete-message-modal {
  position: relative;
  width: min(100%, 29rem);
  max-height: calc(100vh - 2rem);
  padding: 1.5rem;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 1.5rem;
  background: #ffffff;
  box-shadow:
    0 24px 60px rgb(2 6 23 / 28%),
    0 6px 18px rgb(15 23 42 / 10%);
}

.delete-modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 2.3rem;
  height: 2.3rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid #e5eaf1;
  border-radius: 0.75rem;
  background: #ffffff;
  color: #667085;
  cursor: pointer;
}

.delete-modal-icon {
  width: 3.4rem;
  height: 3.4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  background: linear-gradient(
    145deg,
    #ef4444,
    #dc2626
  );
  color: #ffffff;
  box-shadow: 0 8px 18px rgb(220 38 38 / 20%);
  font-size: 1.2rem;
}

.delete-modal-content {
  margin-top: 1rem;
  padding-right: 2rem;
}

.delete-modal-eyebrow {
  color: #dc2626;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.delete-modal-content h2 {
  margin: 0.3rem 0 0.45rem;
  color: #172033;
  font-size: 1.35rem;
}

.delete-modal-content p {
  margin: 0;
  color: #667085;
  line-height: 1.55;
}

.delete-message-preview {
  max-height: 6rem;
  margin: 1rem 0 0;
  padding: 0.85rem 1rem;
  overflow: hidden;
  border-left: 3px solid #fca5a5;
  border-radius: 0 0.75rem 0.75rem 0;
  background: #fff7f7;
  color: #475467;
  font-size: 0.85rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.delete-modal-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 0.75rem;
  background: #fff7ed;
  color: #9a3412;
  font-size: 0.75rem;
  line-height: 1.45;
}

.delete-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid #e8edf5;
}

.delete-cancel-btn,
.delete-confirm-btn {
  min-height: 2.65rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.65rem 1rem;
  border-radius: 0.8rem;
  font-weight: 700;
  cursor: pointer;
}

.delete-cancel-btn {
  border: 1px solid #d8dfeb;
  background: #ffffff;
  color: #475467;
}

.delete-confirm-btn {
  border: 1px solid #dc2626;
  background: linear-gradient(
    135deg,
    #ef4444,
    #dc2626
  );
  color: #ffffff;
  box-shadow: 0 6px 14px rgb(220 38 38 / 16%);
}

.delete-cancel-btn:disabled,
.delete-confirm-btn:disabled,
.delete-modal-close:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.delete-modal-enter-active,
.delete-modal-leave-active {
  transition: opacity 0.18s ease;
}

.delete-modal-enter-from,
.delete-modal-leave-to {
  opacity: 0;
}


@media (max-width: 720px) {
  .message-content-row {
    max-width: 88%;
  }

  .message-options-btn {
    width: 2.15rem;
    height: 2.15rem;
    flex-basis: 2.15rem;
  }

  .message-options-menu {
    position: fixed;
    z-index: 10060;
    top: auto;
    right: 1rem;
    bottom: 1rem;
    left: 1rem;
    width: auto;
    transform: none;
  }

  .message-option-delete {
    min-height: 3.4rem;
  }
}

@media (max-width: 520px) {
  .delete-message-backdrop {
    place-items: end center;
    padding: 0;
  }

  .delete-message-modal {
    width: 100%;
    max-height: 92vh;
    padding: 1.25rem;
    border-right: 0;
    border-bottom: 0;
    border-left: 0;
    border-radius: 1.5rem 1.5rem 0 0;
  }

  .delete-modal-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .delete-cancel-btn,
  .delete-confirm-btn {
    width: 100%;
  }
}



.section-tabs {
  display: inline-flex;
  gap: 6px;
  margin: 24px 0 16px;
  padding: 6px;
  border: 1px solid #e2e8f0;
  border-radius: 15px;
  background: #ffffff;
}

.section-tab {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px 18px;
  border: 0;
  border-radius: 11px;
  background: transparent;
  color: #64748b;
  font-weight: 700;
  cursor: pointer;
}

.section-tab:hover:not(.active) {
  background: #f1f5f9;
  color: #1d4ed8;
}

.section-tab.active {
  background: #1d4ed8;
  color: #ffffff;
  box-shadow:
    0 6px 15px rgba(29, 78, 216, 0.2);
}

.section-tab:focus-visible,
.icon-btn:focus-visible,
.conversation-item:focus-visible,
.new-conversation-btn:focus-visible,
.send-message-btn:focus-visible,
.secondary-btn:focus-visible,
.submit-complaint-btn:focus-visible,
.small-primary-btn:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.25);
  outline-offset: 2px;
}

.tab-badge,
.unread-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: #ef4444;
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
}

.tab-badge.warning {
  background: #f59e0b;
}

.communication-shell {
  display: grid;
  grid-template-columns: 350px minmax(0, 1fr);
  min-height: 680px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 22px;
  background: #ffffff;
  box-shadow:
    0 15px 40px rgba(15, 23, 42, 0.08);
}

.conversation-sidebar {
  display: flex;
  min-height: 0;
  flex-direction: column;
  border-right: 1px solid #e2e8f0;
  background: #ffffff;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 20px;
}

.sidebar-header h2 {
  margin: 4px 0 0;
  font-size: 19px;
}

.section-label {
  color: #2563eb;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 39px;
  width: 39px;
  height: 39px;
  padding: 0;
  border: 1px solid #dbe3ef;
  border-radius: 11px;
  background: #ffffff;
  color: #2563eb;
  cursor: pointer;
}

.icon-btn:hover:not(:disabled) {
  border-color: #93c5fd;
  background: #eff6ff;
  transform: translateY(-1px);
}

.conversation-search {
  position: relative;
  margin: 0 16px 14px;
}

.conversation-search i {
  position: absolute;
  top: 50%;
  left: 14px;
  z-index: 2;
  color: #94a3b8;
  transform: translateY(-50%);
  pointer-events: none;
}

.conversation-search input {
  width: 100%;
  height: 44px;
  padding: 0 14px 0 40px;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  outline: none;
  background: #f8fafc;
  color: #172033;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.conversation-search input::placeholder {
  color: #94a3b8;
}

.conversation-search input:focus {
  border-color: #2563eb;
  background: #ffffff;
  box-shadow:
    0 0 0 4px rgba(37, 99, 235, 0.1);
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 10px 16px;
  scrollbar-color: #cbd5e1 transparent;
  scrollbar-width: thin;
}

.conversation-list::-webkit-scrollbar,
.message-container::-webkit-scrollbar,
.complaint-list::-webkit-scrollbar {
  width: 7px;
}

.conversation-list::-webkit-scrollbar-thumb,
.message-container::-webkit-scrollbar-thumb,
.complaint-list::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: #cbd5e1;
}

.conversation-list::-webkit-scrollbar-track,
.message-container::-webkit-scrollbar-track,
.complaint-list::-webkit-scrollbar-track {
  background: transparent;
}

.conversation-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 11px;
  width: 100%;
  margin-bottom: 5px;
  padding: 13px;
  border: 1px solid transparent;
  border-radius: 14px;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.conversation-item:hover {
  border-color: #e2e8f0;
  background: #f8fafc;
}

.conversation-item.active {
  border-color: #bfdbfe;
  background: #eff6ff;
  box-shadow:
    inset 3px 0 0 #2563eb;
}

.conversation-avatar,
.teacher-avatar {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background:
    linear-gradient(
      135deg,
      #dbeafe,
      #bfdbfe
    );
  color: #1d4ed8;
  font-size: 14px;
  font-weight: 800;
}

.teacher-avatar {
  flex-basis: 46px;
  width: 46px;
  height: 46px;
}

.online-indicator {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 11px;
  height: 11px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  background: #22c55e;
}

.conversation-details {
  min-width: 0;
  flex: 1;
}

.conversation-top {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.conversation-top strong {
  overflow: hidden;
  color: #1e293b;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-top small {
  flex: 0 0 auto;
  color: #94a3b8;
  font-size: 10px;
}

.student-reference,
.conversation-preview {
  display: block;
  overflow: hidden;
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.student-reference {
  color: #2563eb;
  font-size: 11px;
  font-weight: 600;
}

.student-reference i {
  margin-right: 3px;
  font-size: 10px;
}

.unread-badge {
  position: absolute;
  right: 12px;
  bottom: 10px;
  min-width: 20px;
  height: 20px;
  font-size: 10px;
}

.new-conversation-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 12px 16px 16px;
  padding: 12px;
  border: 1px dashed #60a5fa;
  border-radius: 12px;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 700;
  cursor: pointer;
}

.new-conversation-btn:hover {
  border-style: solid;
  border-color: #2563eb;
  background: #dbeafe;
  transform: translateY(-1px);
}

.sidebar-state,
.sidebar-empty,
.complaints-empty {
  display: flex;
  min-height: 260px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 30px;
  color: #64748b;
  text-align: center;
}

.sidebar-state {
  gap: 8px;
}

.sidebar-empty span,
.welcome-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 66px;
  height: 66px;
  border-radius: 20px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 26px;
}

.sidebar-empty strong,
.complaints-empty strong {
  margin-top: 15px;
  color: #1e293b;
}

.sidebar-empty p,
.complaints-empty p {
  max-width: 250px;
  margin: 8px 0 16px;
  line-height: 1.5;
}

.chat-panel {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  background: #ffffff;
}

.chat-welcome {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 40px;
  text-align: center;
}

.chat-welcome h2 {
  margin: 18px 0 8px;
  color: #1e293b;
}

.chat-welcome p {
  max-width: 470px;
  margin: 0;
  color: #64748b;
  line-height: 1.65;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  background: rgba(255, 255, 255, 0.96);
}

.chat-person {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.chat-person > div {
  min-width: 0;
}

.chat-person strong,
.chat-person span {
  display: block;
}

.chat-person strong {
  overflow: hidden;
  color: #1e293b;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-person span {
  overflow: hidden;
  margin-top: 3px;
  color: #64748b;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.refresh-conversations-btn {
  min-height: 2.4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.55rem 0.8rem;
  border: 1px solid #dbe3ee;
  border-radius: 0.75rem;
  background: #ffffff;
  color: #475467;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 8px rgb(15 23 42 / 6%);
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    transform 0.15s ease;
}

.refresh-conversations-btn:hover:not(:disabled) {
  border-color: #b8c5d6;
  background: #f8fafc;
  color: #2563eb;
  transform: translateY(-1px);
}

.refresh-conversations-btn:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.refresh-conversations-btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
  transform: none;
}

.refresh-conversations-btn .pi {
  font-size: 0.85rem;
}

@media (max-width: 420px) {
  .refresh-conversations-btn {
    padding: 0.55rem 0.7rem;
  }
}

.chat-header-status {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #64748b;
  font-size: 12px;
  white-space: nowrap;
}

.message-container {
  position: relative;
  flex: 1;
  min-height: 450px;
  overflow-y: auto;
  padding: 22px;
  background:
    radial-gradient(
      circle at 20% 20%,
      rgba(219, 234, 254, 0.45),
      transparent 35%
    ),
    linear-gradient(
      rgba(248, 250, 252, 0.96),
      rgba(248, 250, 252, 0.96)
    );
  scrollbar-color: #cbd5e1 transparent;
  scrollbar-width: thin;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.message-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  animation: messageAppear 0.22s ease;
}

.message-row.mine {
  justify-content: flex-end;
}

@keyframes messageAppear {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-bubble {
  position: relative;
  max-width: min(72%, 620px);
  padding: 11px 13px 8px;
  border: 1px solid #edf2f7;
  border-radius: 6px 17px 17px 17px;
  background: #ffffff;
  color: #1e293b;
  box-shadow:
    0 4px 14px rgba(15, 23, 42, 0.07);
}

.message-row.mine .message-bubble {
  border-color: #2563eb;
  border-radius: 17px 6px 17px 17px;
  background:
    linear-gradient(
      135deg,
      #2563eb,
      #1d4ed8
    );
  color: #ffffff;
  box-shadow:
    0 7px 18px rgba(37, 99, 235, 0.2);
}

.message-bubble p {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
  margin-top: 5px;
  color: #94a3b8;
  font-size: 10px;
}

.message-row.mine .message-meta {
  color: #bfdbfe;
}

.message-read {
  color: #7dd3fc;
}

.date-separator {
  width: 100%;
  margin: 15px 0;
  text-align: center;
}

.date-separator span {
  display: inline-block;
  padding: 5px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  color: #64748b;
  font-size: 10px;
  font-weight: 700;
  box-shadow:
    0 3px 10px rgba(15, 23, 42, 0.05);
}

.no-messages,
.messages-loading {
  display: flex;
  min-height: 420px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: #64748b;
  text-align: center;
}

.no-messages i {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  margin-bottom: 13px;
  border-radius: 18px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 23px;
}
.message-content-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  max-width: min(82%, 42rem);
  overflow: visible;
}

.message-row.mine .message-content-row {
  justify-content: flex-end;
}

.message-actions {
  position: relative;
  z-index: 50;
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  opacity: 1;
  visibility: visible;
  overflow: visible;
}

.message-options-btn {
  width: 2.1rem;
  height: 2.1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 2.1rem;
  padding: 0;
  border: 1px solid #cbd5e1;
  border-radius: 50%;
  background: #ffffff;
  color: #334155;
  box-shadow: 0 3px 10px rgb(15 23 42 / 14%);
  cursor: pointer;
  opacity: 1;
  visibility: visible;
}

.message-options-btn:hover:not(:disabled),
.message-options-btn[aria-expanded='true'] {
  border-color: #94a3b8;
  background: #f1f5f9;
  color: #0f172a;
}

.message-options-btn .pi {
  display: inline-block;
  color: inherit;
  font-size: 0.95rem;
  line-height: 1;
}

.message-options-menu {
  position: absolute;
  z-index: 1000;
  right: calc(100% + 0.5rem);
  top: 50%;
  width: 13rem;
  padding: 0.4rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.9rem;
  background: #ffffff;
  box-shadow:
    0 16px 38px rgb(15 23 42 / 18%),
    0 4px 12px rgb(15 23 42 / 8%);
  transform: translateY(-50%);
}

.message-option-delete {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.7rem;
  border: 0;
  border-radius: 0.65rem;
  background: transparent;
  color: #b42318;
  text-align: left;
  cursor: pointer;
}

.message-option-delete:hover {
  background: #fff1f1;
}

.message-option-icon {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 2rem;
  border-radius: 0.6rem;
  background: #fee4e2;
  color: #d92d20;
}

.message-option-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.message-option-text strong {
  color: #b42318;
  font-size: 0.78rem;
}

.message-option-text small {
  margin-top: 0.1rem;
  color: #8f4a45;
  font-size: 0.67rem;
}

.messages-list,
.message-row,
.message-content-row {
  overflow: visible;
}

@media (max-width: 720px) {
  .message-content-row {
    max-width: 90%;
  }

  .message-options-menu {
    position: fixed;
    z-index: 10060;
    top: auto;
    right: 1rem;
    bottom: 1rem;
    left: 1rem;
    width: auto;
    transform: none;
  }
}
.no-messages strong {
  color: #1e293b;
}

.no-messages p {
  margin: 7px 0 0;
}

.load-older-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  margin: 0 auto 15px;
  padding: 8px 13px;
  border: 1px solid #dbe3ef;
  border-radius: 999px;
  background: #ffffff;
  color: #2563eb;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  box-shadow:
    0 3px 10px rgba(15, 23, 42, 0.05);
}

.load-older-btn:hover:not(:disabled) {
  border-color: #93c5fd;
  background: #eff6ff;
}

.message-composer {
  padding: 14px 18px;
  border-top: 1px solid #e2e8f0;
  background: #ffffff;
}

.socket-warning {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 9px;
  padding: 8px 10px;
  border: 1px solid #fde68a;
  border-radius: 9px;
  background: #fffbeb;
  color: #92400e;
  font-size: 11px;
}

.composer-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.composer-row textarea {
  width: 100%;
  min-height: 48px;
  max-height: 140px;
  flex: 1;
  resize: vertical;
  padding: 13px 15px;
  border: 1px solid #dbe3ef;
  border-radius: 15px;
  outline: none;
  background: #f8fafc;
  color: #172033;
  font: inherit;
  line-height: 1.45;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.composer-row textarea::placeholder {
  color: #94a3b8;
}

.composer-row textarea:focus {
  border-color: #2563eb;
  background: #ffffff;
  box-shadow:
    0 0 0 4px rgba(37, 99, 235, 0.1);
}

.composer-row textarea:disabled {
  cursor: not-allowed;
  background: #f1f5f9;
}

.send-message-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
  padding: 0;
  border: 0;
  border-radius: 15px;
  background:
    linear-gradient(
      135deg,
      #2563eb,
      #1d4ed8
    );
  color: #ffffff;
  cursor: pointer;
  box-shadow:
    0 8px 18px rgba(37, 99, 235, 0.23);
}

.send-message-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow:
    0 11px 22px rgba(37, 99, 235, 0.3);
}

.send-message-btn:active:not(:disabled) {
  transform: translateY(0);
}

.send-message-btn:disabled {
  box-shadow: none;
  cursor: not-allowed;
  opacity: 0.45;
}

.composer-help {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 7px;
  color: #94a3b8;
  font-size: 10px;
}

.complaints-layout {
  display: grid;
  grid-template-columns:
    minmax(0, 1.25fr)
    minmax(330px, 0.75fr);
  gap: 20px;
}

.complaint-form-card,
.complaint-history-card {
  padding: 24px;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: #ffffff;
  box-shadow:
    0 12px 35px rgba(15, 23, 42, 0.06);
}

.complaint-history-card {
  min-width: 0;
}

.card-heading {
  display: flex;
  gap: 14px;
}

.card-heading h2 {
  margin: 5px 0;
  color: #1e293b;
}

.card-heading p {
  margin: 0;
  color: #64748b;
  line-height: 1.55;
}

.heading-icon,
.modal-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #dbeafe;
  color: #2563eb;
  font-size: 20px;
}

.heading-icon.complaint {
  background: #fef3c7;
  color: #d97706;
}

.complaint-notice {
  display: flex;
  gap: 11px;
  margin: 20px 0;
  padding: 14px;
  border: 1px solid #bfdbfe;
  border-radius: 13px;
  background: #eff6ff;
  color: #1e40af;
}

.complaint-notice > i {
  margin-top: 2px;
  font-size: 18px;
}

.complaint-notice strong {
  display: block;
}

.complaint-notice p {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.5;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.field {
  margin-bottom: 17px;
}

.field label {
  display: block;
  margin-bottom: 7px;
  color: #334155;
  font-size: 13px;
  font-weight: 700;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  padding: 12px 13px;
  border: 1px solid #dbe3ef;
  border-radius: 11px;
  outline: none;
  background: #ffffff;
  color: #172033;
  font: inherit;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.field textarea {
  resize: vertical;
  line-height: 1.55;
}

.field input::placeholder,
.field textarea::placeholder {
  color: #94a3b8;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: #2563eb;
  box-shadow:
    0 0 0 4px rgba(37, 99, 235, 0.1);
}

.field small {
  display: block;
  margin-top: 5px;
  color: #94a3b8;
  font-size: 10px;
}

.priority-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 9px;
}

.priority-option {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  min-width: 0;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  color: #475569;
  text-align: left;
  cursor: pointer;
}

.priority-option:hover {
  border-color: #bfdbfe;
  background: #f8fafc;
}

.priority-option > i {
  margin-top: 2px;
}

.priority-option span,
.priority-option strong,
.priority-option small {
  display: block;
}

.priority-option span {
  min-width: 0;
}

.priority-option strong {
  font-size: 12px;
}

.priority-option small {
  margin-top: 2px;
  color: #94a3b8;
  font-size: 9px;
}

.priority-option.selected {
  border-color: #2563eb;
  background: #eff6ff;
  color: #1d4ed8;
  box-shadow:
    0 0 0 2px rgba(37, 99, 235, 0.08);
}

.priority-option.low.selected {
  border-color: #64748b;
  background: #f1f5f9;
  color: #475569;
}

.priority-option.high.selected {
  border-color: #f59e0b;
  background: #fffbeb;
  color: #b45309;
}

.priority-option.urgent.selected {
  border-color: #dc2626;
  background: #fef2f2;
  color: #b91c1c;
}

.complaint-actions,
.modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}



</style>

