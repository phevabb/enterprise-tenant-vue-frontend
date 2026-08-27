


<template>
  <div class="staff-chat-page">
    <section class="staff-chat-hero">
      <div class="hero-content">
        <span class="hero-badge">
          <i class="pi pi-comments"></i>
          Phena Staff Communication Center
        </span>

        <h1>Parent Communication</h1>

        <p>
          Communicate securely with parents and guardians of students in
          your assigned classes.
        </p>
      </div>

      <div class="hero-summary">
        <div class="hero-stat">
          <span>Conversations</span>

          <strong>
            {{ conversations.length.toLocaleString() }}
          </strong>
        </div>

        <div class="hero-stat">
          <span>Unread</span>

          <strong>
            {{ totalUnreadMessages.toLocaleString() }}
          </strong>
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
                  ? 'Messages arrive instantly'
                  : 'Attempting to reconnect'
              }}
            </small>
          </div>
        </div>
      </div>
    </section>

    <section class="staff-overview-grid">
      <article class="overview-card">
        <span class="overview-icon blue">
          <i class="pi pi-sitemap"></i>
        </span>

        <div>
          <span>Assigned Classes</span>

          <strong>
            {{ assignedClasses.length.toLocaleString() }}
          </strong>
        </div>
      </article>

      <article class="overview-card">
        <span class="overview-icon green">
          <i class="pi pi-users"></i>
        </span>

        <div>
          <span>Available Students</span>

          <strong>
            {{ totalAvailableStudents.toLocaleString() }}
          </strong>
        </div>
      </article>

      <article class="overview-card">
        <span class="overview-icon purple">
          <i class="pi pi-comments"></i>
        </span>

        <div>
          <span>Active Conversations</span>

          <strong>
            {{ conversations.length.toLocaleString() }}
          </strong>
        </div>
      </article>

      <article class="overview-card">
        <span class="overview-icon orange">
          <i class="pi pi-envelope"></i>
        </span>

        <div>
          <span>Unread Messages</span>

          <strong>
            {{ totalUnreadMessages.toLocaleString() }}
          </strong>
        </div>
      </article>
    </section>

    <section class="staff-chat-shell">
      <aside class="conversation-sidebar">
        <header class="sidebar-header">
          <div>
            <span class="section-label">
              Parent Conversations
            </span>

            <h2>Messages</h2>
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
        </header>

        <div class="sidebar-controls">
          <div class="conversation-search">
            <i class="pi pi-search"></i>

            <input
              v-model.trim="conversationSearch"
              type="search"
              placeholder="Search parent or student..."
            />
          </div>



        </div>

        <div
          v-if="conversationsLoading"
          class="sidebar-state"
        >
          <i class="pi pi-spin pi-spinner"></i>

          <span>Loading conversations...</span>
        </div>

        <div
          v-else-if="filteredConversations.length === 0"
          class="sidebar-empty"
        >
          <span class="empty-icon">
            <i class="pi pi-comments"></i>
          </span>

          <strong>No conversations found</strong>

          <p>
            Start a conversation with the parent of a student in one of
            your assigned classes.
          </p>

          <button
            type="button"
            class="small-primary-btn"
            @click="openNewConversationModal"
          >
            <i class="pi pi-plus"></i>
            Start Conversation
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
    <span class="parent-avatar">
      {{ getInitials(conversation.parentName) }}
    </span>

    <span class="conversation-content">
      <span class="conversation-top-row">
        <strong>
          {{ conversation.parentName }}
        </strong>

        <small>
          {{
            formatConversationTime(
              conversation.lastMessageAt
            )
          }}
        </small>
      </span>

      <span class="conversation-student">
        Parent of {{ conversation.studentName }}
      </span>

      <span class="conversation-bottom-row">
        <span class="last-message">
          {{
            conversation.lastMessage ||
            'No messages yet'
          }}
        </span>

        <span
          v-if="conversation.unreadCount > 0"
          class="unread-badge"
        >
          {{
            conversation.unreadCount > 99
              ? '99+'
              : conversation.unreadCount
          }}
        </span>
      </span>
    </span>
  </button>
</div>




        <button
          type="button"
          class="new-conversation-btn"
          :disabled="assignedClasses.length === 0"
          @click="openNewConversationModal"
        >
          <i class="pi pi-plus-circle"></i>
          New Parent Conversation
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

          <h2>Parent-Teacher Communication</h2>

          <p>
            Select a parent conversation from the left or start a new
            conversation with the parent of one of your students.
          </p>

          <div class="communication-rules">
            <div>
              <i class="pi pi-shield"></i>

              <span>
                Messages are limited to parents of students in your
                assigned classes.
              </span>
            </div>

            <div>
              <i class="pi pi-check-circle"></i>

              <span>
                Messages are stored securely for communication history.
              </span>
            </div>

            <div>
              <i class="pi pi-clock"></i>

              <span>
                Parents receive new messages immediately when online.
              </span>
            </div>
          </div>

          <button
            v-if="assignedClasses.length"
            type="button"
            class="welcome-action-btn"
            @click="openNewConversationModal"
          >
            <i class="pi pi-plus"></i>
            Start a Conversation
          </button>
        </div>

        <template v-else>
          <header class="chat-header">
            <div class="chat-person">
              <span class="parent-avatar large">
                {{
                  getInitials(
                    activeConversation.parentName
                  )
                }}
              </span>

              <div class="chat-person-details">
                <strong>
                  {{ activeConversation.parentName }}
                </strong>

                <span>
                  Parent of
                  <b>{{ activeConversation.studentName }}</b>

                  <template v-if="activeConversation.className">
                    • {{ activeConversation.className }}
                  </template>
                </span>
              </div>
            </div>

            <div class="chat-header-actions">
              <span class="participant-status">
                <span
                  class="connection-dot"
                  :class="{
                    online:
                      activeConversation.parentOnline
                  }"
                ></span>

                {{
                  activeConversation.parentOnline
                    ? 'Online'
                    : 'Offline'
                }}
              </span>

             <button
  type="button"
  class="refresh-messages-btn"
  :disabled="
    messagesLoading ||
    conversationsLoading
  "
  :aria-label="
    messagesLoading ||
    conversationsLoading
      ? 'Refreshing chat'
      : 'Refresh chat'
  "
  @click="refreshActiveConversation"
>
  <i
    class="pi"
    :class="
      messagesLoading ||
      conversationsLoading
        ? 'pi-spin pi-spinner'
        : 'pi-refresh'
    "
  ></i>

  <span>
    {{
      messagesLoading ||
      conversationsLoading
        ? 'Refreshing...'
        : 'Refresh Chat'
    }}
  </span>
</button>

            </div>
          </header>

          <div class="student-context-bar">
            <div>
              <span class="context-icon">
                <i class="pi pi-graduation-cap"></i>
              </span>

              <div>
                <span>Conversation regarding</span>

                <strong>
                  {{ activeConversation.studentName }}
                </strong>
              </div>
            </div>

            <span class="context-class">
              {{
                activeConversation.className ||
                'Class not available'
              }}
            </span>
          </div>


<!--
|--------------------------------------------------------------------------
| Chat messages
|--------------------------------------------------------------------------
-->

<div
  ref="messageContainer"
  class="messages-container"
  @scroll="handleMessageContainerScroll"
>
  <!-- Earlier-message controls -->
  <div
    v-if="olderMessagesLoading"
    class="older-messages-loader"
  >
    <i class="pi pi-spin pi-spinner"></i>

    <span>Loading earlier messages...</span>
  </div>

  <button
    v-else-if="hasMoreMessages"
    type="button"
    class="load-older-btn"
    @click="loadOlderMessages"
  >
    <i class="pi pi-history"></i>

    <span>Load earlier messages</span>
  </button>

  <!-- Initial message loading -->
  <div
    v-if="messagesLoading && messages.length === 0"
    class="messages-state"
  >
    <i class="pi pi-spin pi-spinner"></i>

    <span>Loading messages...</span>
  </div>

  <!-- Empty conversation -->
  <div
    v-else-if="!messagesLoading && messages.length === 0"
    class="messages-empty"
  >
    <span class="empty-icon">
      <i class="pi pi-comments"></i>
    </span>

    <strong>No messages yet</strong>

    <p>
      Send the first message to begin this parent conversation.
    </p>
  </div>

  <!-- Messages -->
  <div
    v-else
    class="message-list"
  >



<article
  v-for="message in messages"
  :key="
    message.id ||
    message.clientMessageId ||
    `${message.senderAccountId}-${message.createdAt}`
  "
  class="message-row"
  :class="{
    mine: isMyMessage(message),
    theirs: !isMyMessage(message)
  }"
>
  <span
    v-if="!isMyMessage(message)"
    class="message-avatar"
  >
    {{
      getInitials(
        message.senderName ||
        activeConversation?.parentName ||
        'Parent'
      )
    }}
  </span>

  <div class="message-group">
    <div
      class="message-content-row"
      :class="{
        mine: isMyMessage(message)
      }"
    >
      <div
        v-if="
          isMyMessage(message) &&
          !message.isDeleted
        "
        class="message-actions"
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
            Number(deletingMessageId) ===
            Number(message.id)
          "
          @click.stop="
            toggleMessageMenu(message.id)
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
              @click="
                confirmDeleteMessage(message)
              "
            >
              <span class="message-option-icon">
                <i class="pi pi-trash"></i>
              </span>

             <span class="message-option-text">
  <strong>Delete permanently</strong>

  <small>
    delete
  </small>
</span>
            </button>
          </div>
        </Transition>
      </div>

      <div
        class="message-bubble"
        :class="{
          deleted: message.isDeleted
        }"
      >
        <p
          v-if="message.isDeleted"
          class="deleted-message-text"
        >
          <i class="pi pi-ban"></i>

          <span>
            This message was deleted.
          </span>
        </p>

        <p v-else>
          {{ message.content }}
        </p>
      </div>
    </div>

    <div class="message-meta">
      <span>
        {{
          formatMessageTime(
            message.createdAt
          )
        }}
      </span>

      <span
        v-if="
          isMyMessage(message) &&
          !message.isDeleted
        "
        class="message-read-status"
        :class="{
          read: Boolean(message.readAt)
        }"
      >
        <i
          class="pi"
          :class="
            message.readAt
              ? 'pi-check-circle'
              : 'pi-check'
          "
        ></i>

        {{
          message.readAt
            ? 'Read'
            : 'Sent'
        }}
      </span>

      <span
        v-if="message.isDeleted"
        class="message-deleted-status"
      >
        Deleted
      </span>
    </div>
  </div>
</article>



  </div>
</div>

<!--
|--------------------------------------------------------------------------
| Message composer
|--------------------------------------------------------------------------
-->

<footer class="message-composer">
  <div
    v-if="!socketConnected"
    class="socket-warning"
  >
    <i class="pi pi-exclamation-triangle"></i>

    <span>
      The live chat connection is unavailable. Reconnecting...
    </span>
  </div>

  <div class="composer-row">
    <textarea
      v-model="newMessage"
      rows="1"
      maxlength="2000"
      placeholder="Write a message to the parent..."
      aria-label="Message to parent"
      :disabled="
        sendingMessage ||
        !socketConnected ||
        !activeConversation
      "
      @keydown="handleMessageKeydown"
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
  </div>


  <!--
|--------------------------------------------------------------------------
| New parent conversation modal
|--------------------------------------------------------------------------
-->

<!--
|--------------------------------------------------------------------------
| Premium new conversation modal
|--------------------------------------------------------------------------
-->

<Teleport to="body">
  <Transition name="premium-modal">
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
        aria-labelledby="delete-message-title"
        aria-describedby="delete-message-description"
      >
        <button
          type="button"
          class="delete-modal-close"
          title="Close"
          aria-label="Close delete message dialog"
          :disabled="Boolean(deletingMessageId)"
          @click="closeDeleteMessageModal"
        >
          <i class="pi pi-times"></i>
        </button>

        <span class="delete-modal-icon">
          <i class="pi pi-trash"></i>
        </span>

        <div class="delete-modal-content">
          <span class="delete-modal-eyebrow">
            Delete message
          </span>

          <h2 id="delete-message-title">
            Delete this message?
          </h2>

          <p id="delete-message-description">
  This message will be permanently removed from the
  conversation and database for everyone.
</p>

          <blockquote
            v-if="messagePendingDeletion?.content"
            class="delete-message-preview"
          >
            {{
              messagePendingDeletion.content.length > 160
                ? `${messagePendingDeletion.content.slice(0, 160)}...`
                : messagePendingDeletion.content
            }}
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
            :disabled="Boolean(deletingMessageId)"
            @click="closeDeleteMessageModal"
          >
            Keep message
          </button>

          <button
            type="button"
            class="delete-confirm-btn"
            :disabled="Boolean(deletingMessageId)"
            @click="deleteSelectedMessage"
          >
            <i
              class="pi"
              :class="
                deletingMessageId
                  ? 'pi-spin pi-spinner'
                  : 'pi-trash'
              "
            ></i>

            {{
  deletingMessageId
    ? 'Deleting...'
    : 'Delete permanently'
}}
          </button>
        </footer>
      </section>
    </div>
  </Transition>
</Teleport>


<Teleport to="body">
  <Transition name="premium-modal">
    <div
      v-if="newConversationVisible"
      class="premium-modal-backdrop"
      role="presentation"
      @click.self="closeNewConversationModal"
    >
      <section
        class="premium-conversation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-conversation-title"
        aria-describedby="new-conversation-description"
      >
        <!-- Decorative background -->
        <div
          class="premium-modal-decoration"
          aria-hidden="true"
        >
          <span class="decoration-orb orb-one"></span>
          <span class="decoration-orb orb-two"></span>
          <span class="decoration-grid"></span>
        </div>

        <!-- Modal header -->
        <header class="premium-modal-header">
          <div class="premium-header-identity">
            <span class="premium-modal-icon">
              <i class="pi pi-comments"></i>
            </span>

            <div class="premium-heading-content">
              <span class="premium-eyebrow">
                <i class="pi pi-shield"></i>
                Secure Parent Communication
              </span>

              <h2 id="new-conversation-title">
                Start a new conversation
              </h2>

              <p id="new-conversation-description">
                Select a student to communicate with their registered
                parent or guardian.
              </p>
            </div>
          </div>

          <button
            type="button"
            class="premium-modal-close"
            title="Close"
            aria-label="Close new conversation modal"
            :disabled="creatingConversation"
            @click="closeNewConversationModal"
          >
            <i class="pi pi-times"></i>
          </button>
        </header>

        <!-- Modal content -->
        <div class="premium-modal-body">
          <!-- Assigned class -->
          <section class="premium-class-card">
            <div class="premium-class-icon">
              <i class="pi pi-sitemap"></i>
            </div>

            <div class="premium-class-information">
              <span>Assigned class</span>

              <strong>
                {{
                  assignedClass?.name ||
                  'No class assigned'
                }}
              </strong>

              <small v-if="assignedClass">
                Select a student from this class
              </small>

              <small v-else>
                Contact an administrator to assign a class
              </small>
            </div>

            <div class="premium-student-count">
              <strong>
                {{
                  availableStudents.length.toLocaleString()
                }}
              </strong>

              <span>
                {{
                  availableStudents.length === 1
                    ? 'Student'
                    : 'Students'
                }}
              </span>
            </div>
          </section>

          <!-- Search section -->
          <section class="premium-selection-section">
            <div class="premium-section-heading">
              <div>
                <span class="premium-step-number">
                  01
                </span>

                <div>
                  <h3>Select a student</h3>

                  <p>
                    Search by student name or portal user ID.
                  </p>
                </div>
              </div>

              <span
                v-if="selectedConversationStudent"
                class="premium-selection-status"
              >
                <i class="pi pi-check-circle"></i>
                Selected
              </span>
            </div>

            <div class="premium-search-box">
              <span class="premium-search-icon">
                <i class="pi pi-search"></i>
              </span>

              <input
                v-model.trim="studentSearch"
                type="search"
                autocomplete="off"
                placeholder="Search students..."
                aria-label="Search students"
                :disabled="
                  creatingConversation ||
                  classesLoading ||
                  studentsLoading
                "
              />

              <button
                v-if="studentSearch"
                type="button"
                class="premium-clear-search"
                title="Clear search"
                aria-label="Clear student search"
                :disabled="creatingConversation"
                @click="studentSearch = ''"
              >
                <i class="pi pi-times"></i>
              </button>
            </div>

            <!-- Loading -->
            <div
              v-if="classesLoading || studentsLoading"
              class="premium-modal-state"
            >
              <span class="premium-state-loader">
                <i class="pi pi-spin pi-spinner"></i>
              </span>

              <div>
                <strong>Loading your class</strong>

                <p>
                  Retrieving the students assigned to you...
                </p>
              </div>
            </div>

            <!-- No class -->
            <div
              v-else-if="!assignedClass"
              class="premium-modal-state premium-state-warning"
            >
              <span class="premium-state-icon">
                <i class="pi pi-exclamation-triangle"></i>
              </span>

              <div>
                <strong>No assigned class found</strong>

                <p>
                  You must be assigned to a class before you can start
                  a parent conversation.
                </p>
              </div>
            </div>

            <!-- No students -->
            <div
              v-else-if="
                filteredAvailableStudents.length === 0
              "
              class="premium-modal-state"
            >
              <span class="premium-state-icon">
                <i class="pi pi-users"></i>
              </span>

              <div>
                <strong>
                  {{
                    studentSearch
                      ? 'No matching students'
                      : 'No students available'
                  }}
                </strong>

                <p>
                  {{
                    studentSearch
                      ? 'Try searching with another name or student ID.'
                      : 'No active students were found in your assigned class.'
                  }}
                </p>

                <button
                  v-if="studentSearch"
                  type="button"
                  class="premium-text-button"
                  :disabled="creatingConversation"
                  @click="studentSearch = ''"
                >
                  Clear search
                </button>
              </div>
            </div>

            <!-- Student cards -->
            <div
              v-else
              class="premium-student-list"
              role="radiogroup"
              aria-label="Select a student"
            >
              <label
                v-for="student in filteredAvailableStudents"
                :key="student.studentId"
                class="premium-student-card"
                :class="{
                  selected:
                    Number(
                      newConversationForm.studentId
                    ) ===
                    Number(student.studentId),

                  disabled:
                    creatingConversation ||
                    !student.isActive
                }"
              >
                <input
                  v-model="newConversationForm.studentId"
                  type="radio"
                  name="conversationStudent"
                  class="premium-radio-input"
                  :value="student.studentId"
                  :disabled="
                    creatingConversation ||
                    !student.isActive
                  "
                />

                <span class="premium-student-avatar">
                  {{ getInitials(student.fullName) }}

                  <span
                    v-if="student.isActive"
                    class="premium-active-indicator"
                    title="Active student"
                  ></span>
                </span>

                <span class="premium-student-details">
                  <span class="premium-student-name">
                    {{ student.fullName }}
                  </span>

                  <span class="premium-student-metadata">
                    <span>
                      <i class="pi pi-id-card"></i>

                      {{
                        student.userId ||
                        'No portal ID'
                      }}
                    </span>

                    <span v-if="student.className">
                      <i class="pi pi-book"></i>

                      {{ student.className }}
                    </span>
                  </span>

                  <span
                    v-if="!student.isActive"
                    class="premium-inactive-label"
                  >
                    Student account is inactive
                  </span>
                </span>

                <span class="premium-radio-mark">
                  <i
                    v-if="
                      Number(
                        newConversationForm.studentId
                      ) ===
                      Number(student.studentId)
                    "
                    class="pi pi-check"
                  ></i>
                </span>
              </label>
            </div>
          </section>

          <!-- Selection confirmation -->
          <Transition name="selection-slide">
            <section
              v-if="selectedConversationStudent"
              class="premium-selected-summary"
            >
              <span class="premium-summary-icon">
                <i class="pi pi-check"></i>
              </span>

              <div>
                <span>Selected student</span>

                <strong>
                  {{
                    selectedConversationStudent.fullName
                  }}
                </strong>

                <small>
                  A conversation will be opened with the
                  student's registered parent or guardian.
                </small>
              </div>

              <button
                type="button"
                class="premium-change-selection"
                :disabled="creatingConversation"
                @click="
                  newConversationForm.studentId = null
                "
              >
                Change
              </button>
            </section>
          </Transition>

          <!-- Privacy notice -->
          <div class="premium-privacy-notice">
            <i class="pi pi-lock"></i>

            <span>
              Messages are securely stored as part of the student's
              official communication history.
            </span>
          </div>
        </div>

        <!-- Modal footer -->
        <footer class="premium-modal-actions">
          <button
            type="button"
            class="premium-cancel-button"
            :disabled="creatingConversation"
            @click="closeNewConversationModal"
          >
            Cancel
          </button>

          <button
            type="button"
            class="premium-primary-button"
            :disabled="
              !canCreateConversation ||
              classesLoading ||
              studentsLoading ||
              !assignedClass
            "
            @click="createConversation"
          >
            <span class="premium-button-icon">
              <i
                class="pi"
                :class="
                  creatingConversation
                    ? 'pi-spin pi-spinner'
                    : 'pi-send'
                "
              ></i>
            </span>

            <span class="premium-button-content">
              <strong>
                {{
                  creatingConversation
                    ? 'Opening conversation'
                    : 'Start conversation'
                }}
              </strong>

              <small>
                {{
                  creatingConversation
                    ? 'Please wait...'
                    : selectedConversationStudent
                      ? `Contact ${selectedConversationStudent.fullName}'s parent`
                      : 'Select a student to continue'
                }}
              </small>
            </span>

            <i
              v-if="!creatingConversation"
              class="pi pi-arrow-right premium-button-arrow"
            ></i>
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

import { useToast } from 'vue-toastification'

import {
  createStaffParentConversation,
  getConversationMessages,
  getStaffAssignedClass,
  getStaffConversations,
  markConversationAsRead,
  deleteChatMessage
} from '@/services/api.js'

const toast = useToast()

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const SOCKET_RECONNECT_BASE_DELAY = 2000
const SOCKET_RECONNECT_MAX_DELAY = 30000
const MESSAGE_PAGE_SIZE = 50

/*
 * Production WebSocket URL:
 * VITE_WEBSOCKET_URL=wss://api.yourdomain.com/ws/chat
 *
 * Localhost/testing WebSocket URL:
 * VITE_WEBSOCKET_URL=ws://localhost:9001/ws/chat
 */
const websocketBaseUrl =
  import.meta.env.VITE_WEBSOCKET_URL ||
  'ws://localhost:9001/chat/ws'

/*
|--------------------------------------------------------------------------
| State
|--------------------------------------------------------------------------
*/

const conversations = ref([])
const assignedClasses = ref([])
const availableStudents = ref([])
const messages = ref([])

const activeConversationId = ref(null)

const conversationSearch = ref('')
const studentSearch = ref('')
const newMessage = ref('')



const socket = ref(null)
const socketConnected = ref(false)
const reconnectAttempt = ref(0)
const reconnectTimer = ref(null)

const conversationsLoading = ref(false)
const classesLoading = ref(false)
const studentsLoading = ref(false)
const messagesLoading = ref(false)
const olderMessagesLoading = ref(false)
const sendingMessage = ref(false)
const creatingConversation = ref(false)


const lastReadReceipt =
  ref({
    conversationId: null,
    sentAt: 0,
  })

const newConversationVisible = ref(false)

const hasMoreMessages = ref(false)
const messagePage = ref(1)

const messageContainer = ref(null)

const selectedClassFilter = ref('')

const componentMounted = ref(false)
const shouldReconnectSocket = ref(true)


async function refreshActiveConversation() {
  if (
    messagesLoading.value ||
    conversationsLoading.value
  ) {
    return
  }

  await Promise.all([
    loadMessages(),
    loadConversations(),
  ])
}



const newConversationForm = reactive({
  studentId: null,
  classId: null,
})

/*
|--------------------------------------------------------------------------
| Computed values
|--------------------------------------------------------------------------
*/

const assignedClass = computed(() => {
  return assignedClasses.value[0] || null
})



const activeConversation = computed(() => {
  return (
    conversations.value.find((conversation) => {
      return (
        Number(conversation.id) ===
        Number(activeConversationId.value)
      )
    }) || null
  )
})


const deletingMessageId =
  ref(null)

const deleteMessageVisible =
  ref(false)

const messagePendingDeletion = ref(null)
const openMessageMenuId = ref(null)




const filteredConversations = computed(() => {
  const searchTerm = conversationSearch.value
    .trim()
    .toLowerCase()

  if (!searchTerm) {
    return conversations.value
  }

  return conversations.value.filter((conversation) => {
    return [
      conversation.parentName,
      conversation.studentName,
      conversation.className,
      conversation.lastMessage,
    ]
      .filter(Boolean)
      .some((value) => {
        return String(value)
          .toLowerCase()
          .includes(searchTerm)
      })
  })
})

const filteredAvailableStudents = computed(() => {
  const searchTerm = studentSearch.value
    .trim()
    .toLowerCase()

  if (!searchTerm) {
    return availableStudents.value
  }

  return availableStudents.value.filter((student) => {
    return [
      student.fullName,
      student.userId,
    ]
      .filter(Boolean)
      .some((value) => {
        return String(value)
          .toLowerCase()
          .includes(searchTerm)
      })
  })
})

const totalUnreadMessages = computed(() => {
  return conversations.value.reduce(
    (total, conversation) => {
      return total + Number(conversation.unreadCount || 0)
    },
    0
  )
})

const totalAvailableStudents = computed(() => {
  return availableStudents.value.length
})

const canSendMessage = computed(() => {
  return (
    socketConnected.value &&
    socket.value?.readyState === WebSocket.OPEN &&
    Number(activeConversationId.value) > 0 &&
    newMessage.value.trim().length > 0 &&
    !sendingMessage.value
  )
})


const selectedConversationStudent =
  computed(() => {
    const selectedStudentId =
      Number(
        newConversationForm.studentId
      )

    if (selectedStudentId <= 0) {
      return null
    }

    return (
      availableStudents.value.find(
        (student) => {
          return (
            Number(student.studentId) ===
            selectedStudentId
          )
        }
      ) || null
    )
  })


const canCreateConversation =
  computed(() => {
    const studentId =
      Number(
        newConversationForm.studentId
      )

    const studentExists =
      availableStudents.value.some(
        (student) => {
          return (
            Number(student.studentId) ===
              studentId &&
            student.isActive !== false
          )
        }
      )

    return (
      Number.isInteger(studentId) &&
      studentId > 0 &&
      studentExists &&
      !creatingConversation.value
    )
  })
/*
|--------------------------------------------------------------------------
| Authentication helpers
|--------------------------------------------------------------------------
*/

function getTenantCode() {
  return localStorage.getItem('tenantCode') || ''
}

function getAccessToken() {
  return (
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    ''
  )
}

function getStoredUser() {
  const storedUser = localStorage.getItem('user')

  if (!storedUser) {
    return null
  }

  try {
    return JSON.parse(storedUser)
  } catch (error) {


    return null
  }
}

function getStoredStaffUserId() {
  const user = getStoredUser()

  return String(
    user?.userId ||
    user?.staffUserId ||
    ''
  ).trim()
}

function getAuthenticatedAccountId() {
  const user = getStoredUser()

  if (Number(user?.id) > 0) {
    return Number(user.id)
  }

  if (Number(user?.accountId) > 0) {
    return Number(user.accountId)
  }

  const token = getAccessToken()

  if (!token) {
    return null
  }

  try {
    const encodedPayload = token.split('.')[1]

    if (!encodedPayload) {
      return null
    }

    const normalizedPayload = encodedPayload
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length +
        ((4 - (normalizedPayload.length % 4)) % 4),
      '='
    )

    const payload = JSON.parse(
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

    return Number(
      payload.accountId ||
      payload.userId ||
      payload.id ||
      payload.sub ||
      0
    ) || null
  } catch (error) {


    return null
  }
}

function isMyMessage(message) {
  if (!message) {
    return false
  }

  /*
   * Prefer the value calculated by the backend.
   */
  if (typeof message.isMine === 'boolean') {
    return message.isMine
  }

  const authenticatedAccountId =
    Number(getAuthenticatedAccountId())

  const senderAccountId =
    Number(message.senderAccountId)

  return (
    authenticatedAccountId > 0 &&
    senderAccountId > 0 &&
    authenticatedAccountId ===
      senderAccountId
  )
}

/*
|--------------------------------------------------------------------------
| Normalization helpers
|--------------------------------------------------------------------------
*/

function normalizeConversation(conversation) {
  return {
    ...conversation,

    id: Number(conversation.id),

    studentId: Number(
      conversation.studentId || 0
    ),

    classId: Number(
      conversation.classId ||
      assignedClass.value?.id ||
      0
    ),

    className:
      conversation.className ||
      assignedClass.value?.name ||
      '',

    parentAccountId: Number(
      conversation.parentAccountId || 0
    ),

    parentName:
      conversation.parentName ||
      conversation.parentFullName ||
      'Parent',

    studentName:
      conversation.studentName ||
      conversation.studentFullName ||
      'Student',

    parentOnline:
  conversation.parentOnline === true,

    unreadCount: Number(
      conversation.unreadCount || 0
    ),

    lastMessage:
      conversation.lastMessage || '',

    lastMessageAt:
      conversation.lastMessageAt ||
      conversation.updatedAt ||
      conversation.createdAt ||
      null,
  }
}

function normalizeMessage(message) {
  const authenticatedAccountId =
    getAuthenticatedAccountId()

  const senderAccountId = Number(
    message.senderAccountId ||
    message.senderId ||
    message.accountId ||
    0
  )

  const deletedAt =
    message.deletedAt || null

  const isDeleted =
    Boolean(
      message.isDeleted ||
      deletedAt
    )

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

    content:
      isDeleted
        ? ''
        : String(
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
      message.readAt || null,

   deletedAt,

deletedByAccountId:
  Number(
    message.deletedByAccountId ||
    0
  ) || null,

isDeleted,

    isMine:
      typeof message.isMine === 'boolean'
        ? message.isMine
        : senderAccountId > 0 &&
          senderAccountId ===
            Number(authenticatedAccountId),
  }
}




function sortConversations() {
  conversations.value.sort((first, second) => {
    const firstTime = first.lastMessageAt
      ? new Date(first.lastMessageAt).getTime()
      : 0

    const secondTime = second.lastMessageAt
      ? new Date(second.lastMessageAt).getTime()
      : 0

    return secondTime - firstTime
  })
}

function sortMessages() {
  messages.value.sort((first, second) => {
    const firstTime = first.createdAt
      ? new Date(first.createdAt).getTime()
      : 0

    const secondTime = second.createdAt
      ? new Date(second.createdAt).getTime()
      : 0

    return firstTime - secondTime
  })
}

function findConversation(conversationId) {
  return conversations.value.find((conversation) => {
    return (
      Number(conversation.id) ===
      Number(conversationId)
    )
  })
}

/*
|--------------------------------------------------------------------------
| Assigned-class and student loading
|--------------------------------------------------------------------------
*/

async function loadAssignedClassAndStudents() {
  const staffUserId = getStoredStaffUserId()

  if (!staffUserId) {
    assignedClasses.value = []
    availableStudents.value = []

    toast.error(
      'Staff user ID was not found. Please sign in again.'
    )

    return
  }

  try {
    classesLoading.value = true
    studentsLoading.value = true

    const response =
      await getStaffAssignedClass(staffUserId)

    if (!response?.data) {
      throw new Error(
        'The assigned-class API returned no data.'
      )
    }

    const data = response.data

    if (!Number(data.classId)) {
      throw new Error(
        'No class has been assigned to this staff member.'
      )
    }

    const classItem = {
      id: Number(data.classId),

      name: String(
        data.className || ''
      ),

      studentCount: Number(
        data.studentCount || 0
      ),
    }

    assignedClasses.value = [classItem]

    selectedClassFilter.value =
      String(classItem.id)

    newConversationForm.classId =
      Number(classItem.id)

    availableStudents.value =
      Array.isArray(data.students)
        ? data.students
            .map((student) => {
              return {
                id: Number(
                  student.studentId ||
                  student.id ||
                  0
                ),

                studentId: Number(
                  student.studentId ||
                  student.id ||
                  0
                ),

                accountId: Number(
                  student.accountId || 0
                ),

                userId: String(
                  student.userId || ''
                ),

                fullName: String(
                  student.fullName ||
                  student.name ||
                  'Unnamed student'
                ),

                isActive:
                  student.isActive !== false,

                classId: Number(
                  data.classId
                ),

                className: String(
                  data.className || ''
                ),
              }
            })
            .filter((student) => {
              return student.studentId > 0
            })
        : []




  } catch (error) {


    assignedClasses.value = []
    availableStudents.value = []
    selectedClassFilter.value = ''
    newConversationForm.classId = null

    toast.error(
      error?.response?.data?.message ||
      error?.message ||
      'Unable to load the assigned class and students.'
    )
  } finally {
    classesLoading.value = false
    studentsLoading.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Conversation loading
|--------------------------------------------------------------------------
*/

async function loadConversations() {
  try {
    conversationsLoading.value = true

    const response =
      await getStaffConversations()

    if (!response) {
      throw new Error(
        'The conversations API returned no response.'
      )
    }

    const data = response.data

    conversations.value =
      Array.isArray(data)
        ? data.map(normalizeConversation)
        : Array.isArray(data?.items)
          ? data.items.map(
              normalizeConversation
            )
          : []

    sortConversations()

    const currentConversation =
      findConversation(
        activeConversationId.value
      )

    if (currentConversation) {
      return
    }

    if (conversations.value.length > 0) {
      await selectConversation(
        conversations.value[0]
      )
    } else {
      activeConversationId.value = null
      messages.value = []
    }
  } catch (error) {


    conversations.value = []

    toast.error(
      error?.response?.data?.message ||
      error?.message ||
      'Unable to load parent conversations.'
    )
  } finally {
    conversationsLoading.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Create conversation
|--------------------------------------------------------------------------
*/



function openNewConversationModal() {
  newConversationForm.studentId = null

  newConversationForm.classId =
    assignedClass.value?.id || null

  studentSearch.value = ''
  newConversationVisible.value = true
}

function closeNewConversationModal(
  forceClose = false
) {
  if (
    creatingConversation.value &&
    !forceClose
  ) {
    return
  }

  newConversationVisible.value = false
  newConversationForm.studentId = null
  studentSearch.value = ''
}


async function createConversation() {
  const selectedStudentId =
    Number(newConversationForm.studentId)

  if (
    !Number.isInteger(selectedStudentId) ||
    selectedStudentId <= 0
  ) {
    toast.error(
      'Please select a valid student.'
    )

    return
  }

  const selectedStudent =
    availableStudents.value.find(
      (student) => {
        return (
          Number(student.studentId) ===
          selectedStudentId
        )
      }
    )

  if (!selectedStudent) {




    toast.error(
      'The selected student was not found. Please select the student again.'
    )

    return
  }

  const payload = {
    studentId: selectedStudentId,
  }

  try {
    creatingConversation.value = true



    const response =
      await createStaffParentConversation(
        payload
      )

    if (!response?.data) {
      throw new Error(
        'The conversation API returned no data.'
      )
    }

    const conversation =
      normalizeConversation({
        ...response.data,

        studentId: Number(
          response.data.studentId ||
          selectedStudent.studentId
        ),

        studentName:
          response.data.studentName ||
          selectedStudent.fullName,

        classId: Number(
          response.data.classId ||
          selectedStudent.classId ||
          assignedClass.value?.id ||
          0
        ),

        className:
          response.data.className ||
          selectedStudent.className ||
          assignedClass.value?.name ||
          '',
      })

    if (!Number(conversation.id)) {
      throw new Error(
        'The created conversation does not have a valid ID.'
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

    if (existingIndex === -1) {
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

    closeNewConversationModal(true)

    await selectConversation(
      conversation
    )

    toast.success(
      `Conversation opened for ${selectedStudent.fullName}.`
    )
  } catch (error) {


    const backendData =
      error?.response?.data


    const backendMessage =
      typeof backendData === 'string'
        ? backendData
        : backendData?.message ||
          backendData?.errorMessage ||
          backendData?.error

    toast.error(
      backendMessage ||
      error?.message ||
      'Unable to start the parent conversation.'
    )
  } finally {
    creatingConversation.value = false
  }
}
/*
|--------------------------------------------------------------------------
| Conversation selection
|--------------------------------------------------------------------------
*/

async function selectConversation(conversation) {
  const conversationId =
    Number(conversation?.id)

  if (conversationId <= 0) {
    toast.error(
      'The selected conversation is invalid.'
    )

    return
  }

  const isCurrentConversation =
    conversationId ===
    Number(activeConversationId.value)

  if (
    isCurrentConversation &&
    messages.value.length > 0
  ) {
    return
  }

  activeConversationId.value =
    conversationId

  conversation.unreadCount = 0

  messagePage.value = 1
  messages.value = []
  hasMoreMessages.value = false
  newMessage.value = ''

  await loadMessages()

  /*
   * Use the HTTP endpoint when opening a conversation.
   *
   * Do not also send MESSAGE_READ here because that would perform
   * the same database operation twice.
   */
  await markConversationRead()
}



/*
|--------------------------------------------------------------------------
| Message loading
|--------------------------------------------------------------------------
*/

async function loadMessages() {
  if (!activeConversationId.value) {
    return
  }

  const requestedConversationId =
    Number(activeConversationId.value)

  try {
    messagesLoading.value = true

    const response =
      await getConversationMessages(
        requestedConversationId,
        {
          page: 1,
          limit: MESSAGE_PAGE_SIZE,
        }
      )

    if (
      requestedConversationId !==
      Number(activeConversationId.value)
    ) {
      return
    }

    const data = response?.data

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

    sortMessages()

    hasMoreMessages.value =
      typeof data?.hasMore === 'boolean'
        ? data.hasMore
        : receivedMessages.length ===
          MESSAGE_PAGE_SIZE

    await scrollMessagesToBottom()
  } catch (error) {


    if (
      requestedConversationId ===
      Number(activeConversationId.value)
    ) {
      messages.value = []
    }

    toast.error(
      error?.response?.data?.message ||
      error?.message ||
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

  const container =
    messageContainer.value

  const previousScrollHeight =
    container?.scrollHeight || 0

  const previousScrollTop =
    container?.scrollTop || 0

  const nextPage =
    messagePage.value + 1

  try {
    olderMessagesLoading.value = true

    const response =
      await getConversationMessages(
        activeConversationId.value,
        {
          page: nextPage,
          limit: MESSAGE_PAGE_SIZE,
        }
      )

    const data = response?.data

    const olderMessages =
      Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.messages)
            ? data.messages
            : []

    const normalizedOlderMessages =
      olderMessages.map(normalizeMessage)

    const existingMessageIds =
      new Set(
        messages.value
          .map((message) => Number(message.id))
          .filter((id) => id > 0)
      )

    const uniqueOlderMessages =
      normalizedOlderMessages.filter(
        (message) => {
          if (!message.id) {
            return true
          }

          return !existingMessageIds.has(
            Number(message.id)
          )
        }
      )

    messages.value = [
      ...uniqueOlderMessages,
      ...messages.value,
    ]

    sortMessages()

    messagePage.value = nextPage

    hasMoreMessages.value =
      typeof data?.hasMore === 'boolean'
        ? data.hasMore
        : olderMessages.length ===
          MESSAGE_PAGE_SIZE

    await nextTick()

    if (container) {
      const newScrollHeight =
        container.scrollHeight

      container.scrollTop =
        previousScrollTop +
        (newScrollHeight -
          previousScrollHeight)
    }
  } catch (error) {


    toast.error(
      error?.response?.data?.message ||
      error?.message ||
      'Unable to load earlier messages.'
    )
  } finally {
    olderMessagesLoading.value = false
  }
}

/*
|--------------------------------------------------------------------------
| Read status
|--------------------------------------------------------------------------
*/

async function markConversationRead() {
  if (!activeConversationId.value) {
    return
  }

  try {
    await markConversationAsRead(
      activeConversationId.value
    )

    const conversation =
      findConversation(
        activeConversationId.value
      )

    if (conversation) {
      conversation.unreadCount = 0
    }
  } catch (error) {

  }
}

function sendReadReceipt(conversationId) {
  const normalizedConversationId =
    Number(conversationId)

  if (
    normalizedConversationId <= 0 ||
    !socketConnected.value ||
    socket.value?.readyState !==
      WebSocket.OPEN
  ) {
    return false
  }

  const now =
    Date.now()

  const sameConversation =
    Number(
      lastReadReceipt.value.conversationId
    ) === normalizedConversationId

  const recentlySent =
    now -
      Number(
        lastReadReceipt.value.sentAt || 0
      ) <
    1500

  if (
    sameConversation &&
    recentlySent
  ) {
    return false
  }

  const sent =
    sendSocketPayload({
      type: 'MESSAGE_READ',

      conversationId:
        normalizedConversationId,
    })

  if (sent) {
    lastReadReceipt.value = {
      conversationId:
        normalizedConversationId,

      sentAt:
        now,
    }
  }

  return sent
}
/*
|--------------------------------------------------------------------------
| Message sending
|--------------------------------------------------------------------------
*/

function sendMessage() {
  if (!canSendMessage.value) {
    if (!socketConnected.value) {
      toast.warning(
        'Chat is reconnecting. Please wait a moment.'
      )
    }

    return
  }

  const content =
    newMessage.value.trim()

  if (!content) {
    return
  }

  if (content.length > 2000) {
    toast.warning(
      'Message cannot exceed 2,000 characters.'
    )

    return
  }

  try {
    sendingMessage.value = true

    const payload = {
      type: 'SEND_MESSAGE',

      conversationId: Number(
        activeConversationId.value
      ),

      content,
    }

    const sent =
      sendSocketPayload(payload)

    if (!sent) {
      throw new Error(
        'The chat socket is not connected.'
      )
    }

    newMessage.value = ''
  } catch (error) {


    toast.error(
      error?.message ||
      'Unable to send the message.'
    )
  } finally {
    sendingMessage.value = false
  }
}


/*
|--------------------------------------------------------------------------
| Message deletion
|--------------------------------------------------------------------------
*/

function toggleMessageMenu(messageId) {
  const normalizedMessageId =
    Number(messageId)

  if (normalizedMessageId <= 0) {
    return
  }

  const menuIsAlreadyOpen =
    Number(openMessageMenuId.value) ===
    normalizedMessageId

  openMessageMenuId.value =
    menuIsAlreadyOpen
      ? null
      : normalizedMessageId
}

function closeMessageMenu() {
  openMessageMenuId.value = null
}

function confirmDeleteMessage(message) {
  closeMessageMenu()

  if (!message) {
    return
  }

  const messageId =
    Number(message.id)

  if (messageId <= 0) {
    toast.error(
      'This message does not have a valid ID.'
    )

    return
  }

  if (!message.isMine) {
    toast.error(
      'You can only delete messages that you sent.'
    )

    return
  }

  if (message.isDeleted) {
    toast.info(
      'This message has already been deleted.'
    )

    return
  }

  messagePendingDeletion.value = {
    ...message,
  }

  deleteMessageVisible.value = true
}

function closeDeleteMessageModal() {
  if (deletingMessageId.value) {
    return
  }

  deleteMessageVisible.value = false
  messagePendingDeletion.value = null
}

function applyDeletedMessage(data) {
  const messageId =
    Number(
      data?.messageId ||
      data?.id ||
      0
    )

  if (messageId <= 0) {

    return
  }

  const conversationId =
    Number(
      data?.conversationId ||
      activeConversationId.value ||
      0
    )

  const deletedMessage =
    messages.value.find((message) => {
      return (
        Number(message.id) ===
        messageId
      )
    })

  messages.value =
    messages.value.filter((message) => {
      return (
        Number(message.id) !==
        messageId
      )
    })

  openMessageMenuId.value = null

  const conversation =
    findConversation(
      conversationId
    )

  if (!conversation) {
    return
  }

  const messagesForConversation =
    messages.value
      .filter((message) => {
        return (
          Number(message.conversationId) ===
          conversationId
        )
      })
      .sort((first, second) => {
        return (
          new Date(
            second.createdAt
          ).getTime() -
          new Date(
            first.createdAt
          ).getTime()
        )
      })

  const latestRemainingMessage =
    messagesForConversation[0] || null

  const deletedMessageWasLatest =
    deletedMessage &&
    (
      !latestRemainingMessage ||
      new Date(
        deletedMessage.createdAt
      ).getTime() >=
        new Date(
          latestRemainingMessage.createdAt
        ).getTime()
    )

  if (!deletedMessageWasLatest) {
    return
  }

  conversation.lastMessage =
    latestRemainingMessage?.isDeleted
      ? ''
      : latestRemainingMessage?.content ||
        ''

  conversation.lastMessageAt =
    latestRemainingMessage?.createdAt ||
    null
}
async function deleteSelectedMessage() {
  const message =
    messagePendingDeletion.value

  if (!message) {
    return
  }

  const messageId =
    Number(message.id)

  if (
    messageId <= 0 ||
    deletingMessageId.value
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
      response?.data || {}

    applyDeletedMessage({
      messageId:
        Number(
          responseData.messageId ||
          messageId
        ),

      conversationId:
        Number(
          responseData.conversationId ||
          message.conversationId ||
          activeConversationId.value
        ),
    })

    deleteMessageVisible.value =
      false

    messagePendingDeletion.value =
      null

    toast.success(
      'Message permanently deleted.'
    )
  } catch (error) {
    const responseData =
      error?.response?.data

    const backendMessage =
      typeof responseData === 'string'
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
function handleDocumentClick() {
  closeMessageMenu()
}



function handleMessageKeydown(event) {
  if (
    event.key === 'Enter' &&
    !event.shiftKey
  ) {
    event.preventDefault()
    sendMessage()
  }
}

function createClientMessageId() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  return [
    Date.now(),
    Math.random()
      .toString(36)
      .slice(2),
  ].join('-')
}

/*
|--------------------------------------------------------------------------
| WebSocket connection
|--------------------------------------------------------------------------
*/

function buildWebSocketUrl() {
  const token = getAccessToken()
  const tenantCode = getTenantCode()

  const url = new URL(
    websocketBaseUrl,
    window.location.origin
  )

  if (token) {
    url.searchParams.set(
      'access_token',
      token
    )
  }

  if (tenantCode) {
    url.searchParams.set(
      'tenantCode',
      tenantCode
    )
  }

  return url.toString()
}

function connectSocket() {
  if (!componentMounted.value) {
    return
  }

  if (
    socket.value?.readyState ===
      WebSocket.OPEN ||
    socket.value?.readyState ===
      WebSocket.CONNECTING
  ) {
    return
  }

  const token = getAccessToken()

  if (!token) {
    socketConnected.value = false

    toast.error(
      'Your login session was not found. Please sign in again.'
    )

    return
  }

  shouldReconnectSocket.value = true

  try {
    const socketUrl =
      buildWebSocketUrl()



    const webSocket =
      new WebSocket(socketUrl)

    socket.value = webSocket

    webSocket.onopen = () => {
  if (socket.value !== webSocket) {
    webSocket.close()
    return
  }



  socketConnected.value = true
  reconnectAttempt.value = 0

  clearReconnectTimer()

  /*
   * Do not send STAFF_CONNECTED or JOIN_CONVERSATION.
   *
   * The Ktor socket currently supports:
   * SEND_MESSAGE
   * MESSAGE_READ
   */
}

    webSocket.onmessage = (event) => {
      handleSocketMessage(event)
    }

    webSocket.onerror = (event) => {

    }

    webSocket.onclose = (event) => {


      if (socket.value === webSocket) {
        socket.value = null
      }

      socketConnected.value = false

      if (
        componentMounted.value &&
        shouldReconnectSocket.value
      ) {
        scheduleSocketReconnect()
      }
    }
  } catch (error) {


    socketConnected.value = false
    scheduleSocketReconnect()
  }
}

function disconnectSocket() {
  shouldReconnectSocket.value = false

  clearReconnectTimer()

  const currentSocket = socket.value

  socket.value = null
  socketConnected.value = false

  if (
    currentSocket &&
    (
      currentSocket.readyState ===
        WebSocket.OPEN ||
      currentSocket.readyState ===
        WebSocket.CONNECTING
    )
  ) {
    currentSocket.close(
      1000,
      'Staff chat component unmounted'
    )
  }
}

function scheduleSocketReconnect() {
  if (
    !componentMounted.value ||
    !shouldReconnectSocket.value ||
    reconnectTimer.value
  ) {
    return
  }

  reconnectAttempt.value += 1

  const exponentialDelay =
    SOCKET_RECONNECT_BASE_DELAY *
    Math.pow(
      2,
      reconnectAttempt.value - 1
    )

  const reconnectDelay = Math.min(
    exponentialDelay,
    SOCKET_RECONNECT_MAX_DELAY
  )

  reconnectTimer.value =
    window.setTimeout(() => {
      reconnectTimer.value = null
      connectSocket()
    }, reconnectDelay)
}

function clearReconnectTimer() {
  if (!reconnectTimer.value) {
    return
  }

  window.clearTimeout(
    reconnectTimer.value
  )

  reconnectTimer.value = null
}

function sendSocketPayload(payload) {
  if (
    !socket.value ||
    socket.value.readyState !==
      WebSocket.OPEN
  ) {
    return false
  }

  socket.value.send(
    JSON.stringify(payload)
  )

  return true
}

/*
|--------------------------------------------------------------------------
| Incoming WebSocket events
|--------------------------------------------------------------------------
*/

function handleSocketMessage(event) {
  let payload

  try {
    payload = JSON.parse(event.data)
  } catch (error) {


    return
  }

  const eventType = String(
    payload.type ||
    payload.event ||
    payload.eventType ||
    ''
  )
    .trim()
    .toLowerCase()

  /*
   * Your Ktor ChatSocketEvent appears to serialize
   * its fields directly, so use payload as the
   * fallback event data.
   */
  const eventData =
    payload.data ||
    payload.message ||
    payload

  switch (eventType) {
  case 'connected':
  case 'connection_established':
    socketConnected.value = true
    break

  case 'new_message':
  case 'message_created':
  case 'chat_message':
    handleIncomingMessage(
      eventData.message ||
      eventData
    )
    break

  case 'message_deleted':
    applyDeletedMessage(
      eventData.message ||
      eventData
    )
    break

  case 'message_read':
  case 'conversation_read':
  case 'messages_read':
    handleMessagesRead(eventData)
    break

  case 'error':
    toast.error(
      eventData.errorMessage ||
      eventData.message ||
      'A chat server error occurred.'
    )
    break

  default:

}
}

async function handleIncomingMessage(
  incomingMessage
) {
  const message =
    normalizeMessage(incomingMessage)

  if (!message.conversationId) {
    return
  }

  const conversation =
    findConversation(
      message.conversationId
    )

  if (conversation) {
    conversation.lastMessage =
      message.content

    conversation.lastMessageAt =
      message.createdAt

    if (
      Number(message.conversationId) !==
      Number(activeConversationId.value)
    ) {
      conversation.unreadCount =
        Number(
          conversation.unreadCount || 0
        ) + 1
    } else {
      conversation.unreadCount = 0
    }

    sortConversations()
  } else {
    await refreshConversationsSilently()
  }

  if (
    Number(message.conversationId) !==
    Number(activeConversationId.value)
  ) {
    return
  }

  const duplicate =
    messages.value.some(
      (existingMessage) => {
        if (
          message.id > 0 &&
          Number(existingMessage.id) ===
            Number(message.id)
        ) {
          return true
        }

        if (
          message.clientMessageId &&
          existingMessage.clientMessageId ===
            message.clientMessageId
        ) {
          return true
        }

        return false
      }
    )

  if (!duplicate) {
    messages.value.push(message)
    sortMessages()
  }

  await scrollMessagesToBottom()

 if (
  !message.isMine &&
  document.visibilityState === 'visible'
) {
  sendReadReceipt(
    message.conversationId
  )
}
}

function handleConversationUpdate(
  conversationData
) {
  const normalizedConversation =
    normalizeConversation(
      conversationData
    )

  if (!normalizedConversation.id) {
    return
  }

  const existingIndex =
    conversations.value.findIndex(
      (conversation) => {
        return (
          Number(conversation.id) ===
          Number(
            normalizedConversation.id
          )
        )
      }
    )

  if (existingIndex < 0) {
    conversations.value.unshift(
      normalizedConversation
    )
  } else {
    conversations.value[
      existingIndex
    ] = {
      ...conversations.value[
        existingIndex
      ],
      ...normalizedConversation,
    }
  }

  sortConversations()
}

function handleMessagesRead(data) {
  const conversationId =
    Number(data.conversationId || 0)

  if (!conversationId) {
    return
  }

  if (
    conversationId !==
    Number(activeConversationId.value)
  ) {
    return
  }

  const readAt =
    data.readAt ||
    new Date().toISOString()

  const readerAccountId =
    Number(
      data.readerAccountId ||
      data.accountId ||
      0
    )

  messages.value = messages.value.map(
    (message) => {
      if (!message.isMine) {
        return message
      }

      if (
        readerAccountId &&
        Number(message.senderAccountId) ===
          readerAccountId
      ) {
        return message
      }

      return {
        ...message,
        readAt:
          message.readAt ||
          readAt,
      }
    }
  )
}

function updateParentOnlineStatus(
  data,
  online
) {
  const conversationId =
    Number(data.conversationId || 0)

  const parentAccountId =
    Number(
      data.parentAccountId ||
      data.accountId ||
      0
    )

  conversations.value =
    conversations.value.map(
      (conversation) => {
        const matchesConversation =
          conversationId > 0 &&
          Number(conversation.id) ===
            conversationId

        const matchesParent =
          parentAccountId > 0 &&
          Number(
            conversation.parentAccountId
          ) === parentAccountId

        if (
          !matchesConversation &&
          !matchesParent
        ) {
          return conversation
        }

        return {
          ...conversation,
          parentOnline: online,
        }
      }
    )
}

async function refreshConversationsSilently() {
  try {
    const response =
      await getStaffConversations()

    const data = response?.data

    conversations.value =
      Array.isArray(data)
        ? data.map(normalizeConversation)
        : Array.isArray(data?.items)
          ? data.items.map(
              normalizeConversation
            )
          : conversations.value

    sortConversations()
  } catch (error) {

  }
}

/*
|--------------------------------------------------------------------------
| Scrolling
|--------------------------------------------------------------------------
*/

async function scrollMessagesToBottom(
  behavior = 'auto'
) {
  await nextTick()

  const container =
    messageContainer.value

  if (!container) {
    return
  }

  container.scrollTo({
    top: container.scrollHeight,
    behavior,
  })
}

function handleMessageContainerScroll() {
  const container =
    messageContainer.value

  if (!container) {
    return
  }

  if (
    container.scrollTop <= 40 &&
    hasMoreMessages.value &&
    !olderMessagesLoading.value
  ) {
    loadOlderMessages()
  }
}

/*
|--------------------------------------------------------------------------
| Formatting helpers
|--------------------------------------------------------------------------
*/

function formatMessageTime(dateValue) {
  if (!dateValue) {
    return ''
  }

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      hour: '2-digit',
      minute: '2-digit',
    }
  ).format(date)
}

function formatConversationTime(dateValue) {
  if (!dateValue) {
    return ''
  }

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const now = new Date()

  const sameDay =
    date.getFullYear() ===
      now.getFullYear() &&
    date.getMonth() ===
      now.getMonth() &&
    date.getDate() ===
      now.getDate()

  if (sameDay) {
    return new Intl.DateTimeFormat(
      undefined,
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    ).format(date)
  }

  return new Intl.DateTimeFormat(
    undefined,
    {
      month: 'short',
      day: 'numeric',
    }
  ).format(date)
}

function getInitials(name) {
  const normalizedName =
    String(name || '').trim()

  if (!normalizedName) {
    return 'P'
  }

  return normalizedName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => {
      return part.charAt(0).toUpperCase()
    })
    .join('')
}

/*
|--------------------------------------------------------------------------
| Browser event handlers
|--------------------------------------------------------------------------
*/

function handleBrowserOnline() {
  if (!socketConnected.value) {
    reconnectAttempt.value = 0
    connectSocket()
  }
}

function handleBrowserOffline() {
  socketConnected.value = false
}

/*
|--------------------------------------------------------------------------
| Component lifecycle
|--------------------------------------------------------------------------
*/
onMounted(async () => {
  componentMounted.value = true
  shouldReconnectSocket.value = true

  window.addEventListener(
    'online',
    handleBrowserOnline
  )

  window.addEventListener(
    'offline',
    handleBrowserOffline
  )

  document.addEventListener(
    'click',
    handleDocumentClick
  )

  connectSocket()

  await loadAssignedClassAndStudents()
  await loadConversations()
})


onBeforeUnmount(() => {
  componentMounted.value = false

  window.removeEventListener(
    'online',
    handleBrowserOnline
  )

  window.removeEventListener(
    'offline',
    handleBrowserOffline
  )

  document.removeEventListener(
    'click',
    handleDocumentClick
  )

  disconnectSocket()
})

</script>









<style scoped>

.message-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  overflow: visible;
}

.message-row {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 0.55rem;
  overflow: visible;
}

.message-row.mine {
  justify-content: flex-end;
}

.message-row.theirs {
  justify-content: flex-start;
}

.message-group {
  position: relative;
  max-width: min(75%, 42rem);
  display: flex;
  flex-direction: column;
  overflow: visible;
}

.message-content-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  overflow: visible;
}

.message-content-row.mine {
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
  display: inline-block;
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
  transition: background-color 0.15s ease;
}

.message-option-delete:hover {
  background: #fff1f1;
}

.message-option-delete:focus-visible {
  outline: 2px solid #dc2626;
  outline-offset: 1px;
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

.message-bubble {
  min-width: 3rem;
  padding: 0.75rem 0.9rem;
  border-radius: 1rem;
  overflow-wrap: anywhere;
}

.message-bubble p {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.5;
}

.message-row.mine .message-bubble {
  border-bottom-right-radius: 0.25rem;
  background: #2563eb;
  color: #ffffff;
}

.message-row.theirs .message-bubble {
  border-bottom-left-radius: 0.25rem;
  background: #ffffff;
  color: #1f2937;
  box-shadow: 0 1px 4px rgb(15 23 42 / 8%);
}

.message-bubble.deleted {
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  color: #64748b;
  box-shadow: none;
}

.deleted-message-text {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: #7a8497;
  font-size: 0.82rem;
  font-style: italic;
}

.message-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.3rem;
  color: #8a94a6;
  font-size: 0.7rem;
}

.message-row.theirs .message-meta {
  justify-content: flex-start;
}

.message-read-status {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
}

.message-read-status.read {
  color: #2563eb;
}

.message-deleted-status {
  color: #98a2b3;
  font-style: italic;
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

@media (max-width: 720px) {
  .message-group {
    max-width: 85%;
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
    padding: 0.55rem;
    transform: none;
  }

  .message-option-delete {
    min-height: 3.4rem;
  }

  .message-menu-enter-from,
  .message-menu-leave-to {
    opacity: 0;
    transform: translateY(0.5rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .message-options-btn,
  .message-menu-enter-active,
  .message-menu-leave-active {
    transition: none;
  }
}



.message-row {
  position: relative;
}

.message-bubble-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.message-row.mine .message-bubble-wrapper {
  justify-content: flex-end;
}



.message-row:hover .message-actions,
.message-actions:focus-within {
  opacity: 1;
}



.message-options-btn:hover:not(:disabled),
.message-options-btn[aria-expanded='true'] {
  background: #eef2f7;
  color: #344054;
}

.message-options-btn:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.message-options-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
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
  transition: background-color 0.15s ease;
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

.message-menu-enter-active,
.message-menu-leave-active {
  transition:
    opacity 0.14s ease,
    transform 0.14s ease;
}

.message-menu-enter-from,
.message-menu-leave-to {
  opacity: 0;
  transform: translateX(0.35rem) scale(0.97);
}

@media (hover: none) {
  .message-actions {
    opacity: 1;
  }
}

@media (max-width: 520px) {
  .message-options-menu {
    position: fixed;
    right: 1rem;
    bottom: 1rem;
    left: 1rem;
    width: auto;
    padding: 0.55rem;
    border-radius: 1rem;
  }

  .message-option-delete {
    min-height: 3.2rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .message-actions,
  .message-options-btn,
  .message-menu-enter-active,
  .message-menu-leave-active {
    transition: none;
  }
}



.message-bubble.deleted {
  border: 1px dashed #cbd5e1;
  background: #f8fafc !important;
  color: #64748b !important;
  box-shadow: none !important;
}

.deleted-message-text {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  color: #7a8497;
  font-style: italic;
}

.message-deleted-status {
  color: #98a2b3;
  font-style: italic;
}

.message-delete-btn {
  width: 1.65rem;
  height: 1.65rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 0.5rem;
  background: transparent;
  color: #98a2b3;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.message-delete-btn:hover:not(:disabled) {
  background: #fee2e2;
  color: #dc2626;
}

.message-delete-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.delete-message-backdrop {
  position: fixed;
  z-index: 10050;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgb(15 23 42 / 66%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.delete-message-modal {
  position: relative;
  width: min(100%, 29rem);
  padding: 1.5rem;
  border: 1px solid rgb(255 255 255 / 65%);
  border-radius: 1.5rem;
  background: #fff;
  box-shadow:
    0 30px 80px rgb(2 6 23 / 35%),
    0 8px 22px rgb(15 23 42 / 12%);
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
  border: 1px solid #e5eaf1;
  border-radius: 0.75rem;
  background: #fff;
  color: #667085;
  cursor: pointer;
}

.delete-modal-close:hover:not(:disabled) {
  background: #f8fafc;
  color: #172033;
}

.delete-modal-icon {
  width: 3.4rem;
  height: 3.4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  background:
    linear-gradient(
      145deg,
      #ef4444,
      #dc2626
    );
  color: #fff;
  box-shadow: 0 10px 22px rgb(220 38 38 / 24%);
  font-size: 1.2rem;
}

.delete-modal-content {
  margin-top: 1rem;
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
  letter-spacing: -0.025em;
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
  background: #fff;
  color: #475467;
}

.delete-confirm-btn {
  border: 1px solid #dc2626;
  background:
    linear-gradient(
      135deg,
      #ef4444,
      #dc2626
    );
  color: #fff;
  box-shadow: 0 8px 18px rgb(220 38 38 / 18%);
}

.delete-confirm-btn:hover:not(:disabled) {
  background:
    linear-gradient(
      135deg,
      #dc2626,
      #b91c1c
    );
}

.delete-cancel-btn:disabled,
.delete-confirm-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

@media (max-width: 520px) {
  .delete-message-backdrop {
    place-items: end center;
    padding: 0;
  }

  .delete-message-modal {
    width: 100%;
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


/* ==========================================================================
   Premium conversation modal
   ========================================================================== */

.premium-modal-backdrop {
  position: fixed;
  z-index: 9999;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  overflow-y: auto;
  background:
    radial-gradient(
      circle at 15% 10%,
      rgb(59 130 246 / 18%),
      transparent 35%
    ),
    radial-gradient(
      circle at 90% 90%,
      rgb(99 102 241 / 18%),
      transparent 34%
    ),
    rgb(8 15 30 / 76%);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.premium-conversation-modal {
  position: relative;
  isolation: isolate;
  width: min(100%, 48rem);
  max-height: calc(100vh - 3rem);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 66%);
  border-radius: 1.75rem;
  background: rgb(255 255 255 / 98%);
  box-shadow:
    0 40px 100px rgb(2 6 23 / 38%),
    0 8px 30px rgb(15 23 42 / 16%),
    inset 0 1px 0 rgb(255 255 255 / 80%);
}

.premium-modal-decoration {
  position: absolute;
  z-index: -1;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.decoration-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(6px);
}

.orb-one {
  top: -8rem;
  right: -5rem;
  width: 19rem;
  height: 19rem;
  background: rgb(59 130 246 / 12%);
}

.orb-two {
  top: 3rem;
  right: 9rem;
  width: 7rem;
  height: 7rem;
  background: rgb(129 140 248 / 10%);
}

.decoration-grid {
  position: absolute;
  top: 0;
  right: 0;
  width: 17rem;
  height: 11rem;
  opacity: 0.22;
  background-image:
    linear-gradient(
      rgb(59 130 246 / 18%) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      rgb(59 130 246 / 18%) 1px,
      transparent 1px
    );
  background-size: 1.4rem 1.4rem;
  mask-image: linear-gradient(
    to bottom left,
    black,
    transparent 72%
  );
}

.premium-modal-header {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.25rem;
  padding: 1.75rem 1.75rem 1.4rem;
  border-bottom: 1px solid #e8edf5;
}

.premium-header-identity {
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.premium-modal-icon {
  width: 3.6rem;
  height: 3.6rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 3.6rem;
  border: 1px solid rgb(255 255 255 / 65%);
  border-radius: 1.15rem;
  background:
    linear-gradient(
      145deg,
      #2563eb,
      #4f46e5
    );
  color: #fff;
  box-shadow:
    0 12px 28px rgb(37 99 235 / 30%),
    inset 0 1px 0 rgb(255 255 255 / 25%);
  font-size: 1.35rem;
}

.premium-heading-content {
  min-width: 0;
}

.premium-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.35rem;
  color: #2563eb;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.075em;
  text-transform: uppercase;
}

.premium-heading-content h2 {
  margin: 0;
  color: #101828;
  font-size: clamp(1.35rem, 3vw, 1.7rem);
  font-weight: 750;
  letter-spacing: -0.035em;
  line-height: 1.2;
}

.premium-heading-content p {
  max-width: 34rem;
  margin: 0.5rem 0 0;
  color: #667085;
  font-size: 0.9rem;
  line-height: 1.55;
}

.premium-modal-close {
  width: 2.65rem;
  height: 2.65rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 2.65rem;
  border: 1px solid #e4e9f1;
  border-radius: 0.85rem;
  background: rgb(255 255 255 / 72%);
  color: #667085;
  box-shadow: 0 4px 12px rgb(15 23 42 / 5%);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease;
}

.premium-modal-close:hover:not(:disabled) {
  border-color: #cfd7e5;
  background: #f8fafc;
  color: #101828;
  transform: rotate(4deg);
}

.premium-modal-close:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.premium-modal-body {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  padding: 1.35rem 1.75rem;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.premium-class-card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 1rem;
  border: 1px solid #dbe7ff;
  border-radius: 1.15rem;
  background:
    linear-gradient(
      135deg,
      #f8fbff,
      #f1f6ff
    );
  box-shadow:
    inset 0 1px 0 #fff,
    0 6px 20px rgb(37 99 235 / 5%);
}

.premium-class-icon {
  width: 2.8rem;
  height: 2.8rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 2.8rem;
  border-radius: 0.9rem;
  background: #e3edff;
  color: #2563eb;
  font-size: 1.05rem;
}

.premium-class-information {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.premium-class-information > span {
  color: #667085;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.045em;
  text-transform: uppercase;
}

.premium-class-information strong {
  margin-top: 0.15rem;
  overflow: hidden;
  color: #172033;
  font-size: 1rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.premium-class-information small {
  margin-top: 0.15rem;
  color: #8490a3;
}

.premium-student-count {
  min-width: 4.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 0.65rem 0.8rem;
  border: 1px solid #e4eaf5;
  border-radius: 0.9rem;
  background: #fff;
  box-shadow: 0 5px 12px rgb(15 23 42 / 5%);
}

.premium-student-count strong {
  color: #2563eb;
  font-size: 1.1rem;
  line-height: 1;
}

.premium-student-count span {
  margin-top: 0.25rem;
  color: #7a8497;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.premium-selection-section {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.premium-section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.premium-section-heading > div {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.premium-step-number {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 2rem;
  border-radius: 0.65rem;
  background: #172033;
  color: #fff;
  font-size: 0.68rem;
  font-weight: 800;
}

.premium-section-heading h3 {
  margin: 0;
  color: #172033;
  font-size: 0.95rem;
}

.premium-section-heading p {
  margin: 0.15rem 0 0;
  color: #8490a3;
  font-size: 0.78rem;
}

.premium-selection-status {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.55rem;
  border-radius: 999px;
  background: #ecfdf3;
  color: #067647;
  font-size: 0.7rem;
  font-weight: 700;
}

.premium-search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.premium-search-icon {
  position: absolute;
  left: 0.9rem;
  display: inline-flex;
  color: #98a2b3;
  pointer-events: none;
}

.premium-search-box input {
  width: 100%;
  height: 3rem;
  padding: 0 3rem 0 2.7rem;
  border: 1px solid #d8dfeb;
  border-radius: 0.95rem;
  outline: none;
  background: #fff;
  color: #172033;
  font-size: 0.9rem;
  box-shadow: 0 4px 12px rgb(15 23 42 / 3%);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
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

.premium-search-box input::placeholder {
  color: #98a2b3;
}

.premium-search-box input:focus {
  border-color: #4f7ee8;
  box-shadow:
    0 0 0 4px rgb(37 99 235 / 10%),
    0 6px 16px rgb(15 23 42 / 4%);
}

.premium-clear-search {
  position: absolute;
  right: 0.6rem;
  width: 1.9rem;
  height: 1.9rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 0.6rem;
  background: #f1f5f9;
  color: #7a8497;
  cursor: pointer;
}

.premium-clear-search:hover:not(:disabled) {
  background: #e7ecf3;
  color: #344054;
}

.premium-student-list {
  max-height: 18rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.7rem;
  padding: 0.2rem 0.25rem 0.2rem 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: #c5cedc transparent;
}

.premium-student-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  padding: 0.85rem;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  background: #fff;
  box-shadow: 0 3px 12px rgb(15 23 42 / 3%);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.premium-student-card:hover:not(.disabled) {
  border-color: #9eb8ef;
  box-shadow: 0 10px 24px rgb(37 99 235 / 9%);
  transform: translateY(-2px);
}

.premium-student-card.selected {
  border-color: #3b72e5;
  background:
    linear-gradient(
      145deg,
      #f4f8ff,
      #edf4ff
    );
  box-shadow:
    0 0 0 2px rgb(37 99 235 / 9%),
    0 10px 24px rgb(37 99 235 / 10%);
}

.premium-student-card.disabled {
  cursor: not-allowed;
  opacity: 0.52;
}

.premium-radio-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.premium-student-avatar {
  position: relative;
  width: 2.75rem;
  height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 2.75rem;
  border-radius: 0.9rem;
  background:
    linear-gradient(
      145deg,
      #e9effa,
      #dfe8f7
    );
  color: #344054;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.premium-student-card.selected
.premium-student-avatar {
  background:
    linear-gradient(
      145deg,
      #2563eb,
      #4f46e5
    );
  color: #fff;
  box-shadow: 0 7px 16px rgb(37 99 235 / 22%);
}

.premium-active-indicator {
  position: absolute;
  right: -0.15rem;
  bottom: -0.1rem;
  width: 0.7rem;
  height: 0.7rem;
  border: 2px solid #fff;
  border-radius: 50%;
  background: #12b76a;
}

.premium-student-details {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.premium-student-name {
  overflow: hidden;
  color: #172033;
  font-size: 0.85rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.premium-student-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.55rem;
  color: #7a8497;
  font-size: 0.66rem;
}

.premium-student-metadata > span {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
}

.premium-student-metadata i {
  color: #98a2b3;
  font-size: 0.65rem;
}

.premium-inactive-label {
  color: #d92d20;
  font-size: 0.67rem;
  font-weight: 600;
}

.premium-radio-mark {
  width: 1.4rem;
  height: 1.4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 1.4rem;
  border: 1.5px solid #cdd5e1;
  border-radius: 50%;
  background: #fff;
  color: #fff;
  font-size: 0.65rem;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    transform 0.2s ease;
}

.premium-student-card.selected
.premium-radio-mark {
  border-color: #2563eb;
  background: #2563eb;
  box-shadow: 0 0 0 3px rgb(37 99 235 / 10%);
  transform: scale(1.05);
}

.premium-selected-summary {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border: 1px solid #ace9c7;
  border-radius: 1rem;
  background:
    linear-gradient(
      135deg,
      #f2fdf7,
      #ecfdf3
    );
}

.premium-summary-icon {
  width: 2.25rem;
  height: 2.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 2.25rem;
  border-radius: 0.75rem;
  background: #12b76a;
  color: #fff;
  box-shadow: 0 6px 15px rgb(18 183 106 / 20%);
}

.premium-selected-summary > div {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.premium-selected-summary > div > span {
  color: #39805a;
  font-size: 0.67rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.premium-selected-summary strong {
  margin-top: 0.1rem;
  overflow: hidden;
  color: #075e3a;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.premium-selected-summary small {
  margin-top: 0.15rem;
  color: #4c7c64;
  line-height: 1.35;
}

.premium-change-selection {
  padding: 0.4rem 0.65rem;
  border: 1px solid #97dfb8;
  border-radius: 0.65rem;
  background: #fff;
  color: #067647;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
}

.premium-change-selection:hover:not(:disabled) {
  background: #e5f9ee;
}

.premium-privacy-notice {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  color: #7a8497;
  font-size: 0.7rem;
  line-height: 1.45;
}

.premium-privacy-notice i {
  margin-top: 0.08rem;
  color: #667085;
}

.premium-modal-state {
  min-height: 10rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  padding: 1.5rem;
  border: 1px dashed #ccd5e2;
  border-radius: 1rem;
  background: #fafbfc;
  color: #667085;
  text-align: left;
}

.premium-modal-state strong {
  color: #344054;
}

.premium-modal-state p {
  max-width: 27rem;
  margin: 0.2rem 0 0;
  color: #8490a3;
  font-size: 0.8rem;
  line-height: 1.45;
}

.premium-state-icon,
.premium-state-loader {
  width: 2.8rem;
  height: 2.8rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 2.8rem;
  border-radius: 0.85rem;
  background: #edf1f6;
  color: #667085;
}

.premium-state-warning {
  border-color: #f4c7a1;
  background: #fffaf5;
}

.premium-state-warning .premium-state-icon {
  background: #ffead5;
  color: #e04f16;
}

.premium-text-button {
  margin-top: 0.45rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
}

.premium-modal-actions {
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.15rem 1.75rem 1.4rem;
  border-top: 1px solid #e8edf5;
  background: rgb(250 251 253 / 95%);
}

.premium-cancel-button {
  min-width: 6.5rem;
  padding: 0.7rem 1rem;
  border: 1px solid #d8dfeb;
  border-radius: 0.9rem;
  background: #fff;
  color: #475467;
  font-weight: 700;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.premium-cancel-button:hover:not(:disabled) {
  border-color: #bdc7d6;
  background: #f8fafc;
}

.premium-primary-button {
  min-width: 18rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid #2563eb;
  border-radius: 0.95rem;
  background:
    linear-gradient(
      135deg,
      #2563eb,
      #4338ca
    );
  color: #fff;
  box-shadow:
    0 10px 24px rgb(37 99 235 / 24%),
    inset 0 1px 0 rgb(255 255 255 / 20%);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;
}

.premium-primary-button:hover:not(:disabled) {
  box-shadow:
    0 14px 30px rgb(37 99 235 / 30%),
    inset 0 1px 0 rgb(255 255 255 / 24%);
  transform: translateY(-1px);
}

.premium-primary-button:disabled,
.premium-cancel-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  transform: none;
}

.premium-button-icon {
  width: 2.25rem;
  height: 2.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 2.25rem;
  border-radius: 0.7rem;
  background: rgb(255 255 255 / 16%);
}

.premium-button-content {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  text-align: left;
}

.premium-button-content strong {
  font-size: 0.82rem;
}

.premium-button-content small {
  max-width: 13rem;
  margin-top: 0.1rem;
  overflow: hidden;
  color: rgb(255 255 255 / 75%);
  font-size: 0.65rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.premium-button-arrow {
  margin-right: 0.2rem;
  color: rgb(255 255 255 / 85%);
}

/* Modal animation */

.premium-modal-enter-active,
.premium-modal-leave-active {
  transition: opacity 0.24s ease;
}

.premium-modal-enter-active
.premium-conversation-modal,
.premium-modal-leave-active
.premium-conversation-modal {
  transition:
    transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 0.22s ease;
}

.premium-modal-enter-from,
.premium-modal-leave-to {
  opacity: 0;
}

.premium-modal-enter-from
.premium-conversation-modal {
  opacity: 0;
  transform: translateY(1.5rem) scale(0.97);
}

.premium-modal-leave-to
.premium-conversation-modal {
  opacity: 0;
  transform: translateY(0.75rem) scale(0.98);
}

.selection-slide-enter-active,
.selection-slide-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.selection-slide-enter-from,
.selection-slide-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}

/* Responsive modal */

@media (max-width: 720px) {
  .premium-modal-backdrop {
    place-items: end center;
    padding: 0;
  }

  .premium-conversation-modal {
    width: 100%;
    max-height: 94vh;
    border-right: 0;
    border-bottom: 0;
    border-left: 0;
    border-radius: 1.5rem 1.5rem 0 0;
  }

  .premium-modal-header {
    padding: 1.25rem;
  }

  .premium-modal-body {
    padding: 1.1rem 1.25rem;
  }

  .premium-modal-icon {
    width: 3rem;
    height: 3rem;
    flex-basis: 3rem;
    border-radius: 0.95rem;
  }

  .premium-eyebrow {
    font-size: 0.62rem;
  }

  .premium-student-list {
    grid-template-columns: 1fr;
    max-height: 17rem;
  }

  .premium-modal-actions {
    padding: 1rem 1.25rem;
  }
}

@media (max-width: 520px) {
  .premium-modal-header {
    gap: 0.75rem;
  }

  .premium-header-identity {
    gap: 0.7rem;
  }

  .premium-heading-content p {
    font-size: 0.8rem;
  }

  .premium-class-card {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .premium-student-count {
    margin-left: 3.7rem;
  }

  .premium-section-heading {
    align-items: flex-start;
  }

  .premium-selection-status {
    display: none;
  }

  .premium-selected-summary {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .premium-change-selection {
    margin-left: 3rem;
  }

  .premium-modal-actions {
    display: grid;
    grid-template-columns: 0.8fr 1.6fr;
  }

  .premium-cancel-button,
  .premium-primary-button {
    width: 100%;
    min-width: 0;
  }

  .premium-button-content small {
    display: none;
  }

  .premium-button-arrow {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .premium-modal-enter-active,
  .premium-modal-leave-active,
  .premium-modal-enter-active
  .premium-conversation-modal,
  .premium-modal-leave-active
  .premium-conversation-modal,
  .selection-slide-enter-active,
  .selection-slide-leave-active {
    transition: none;
  }
}


.simple-modal-backdrop {
  position: fixed;
  z-index: 9999;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgb(15 23 42 / 55%);
}

.simple-modal {
  width: 100%;
  max-width: 30rem;
  overflow: hidden;
  border-radius: 1rem;
  background: #ffffff;
  box-shadow: 0 1.5rem 4rem rgb(15 23 42 / 25%);
}

.simple-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem;
  border-bottom: 1px solid #e5e7eb;
}

.simple-modal-header h2 {
  margin: 0;
  color: #111827;
  font-size: 1.2rem;
}

.simple-modal-header p {
  margin: 0.35rem 0 0;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
}

.simple-modal-close {
  width: 2.25rem;
  height: 2.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 2.25rem;
  border: 0;
  border-radius: 50%;
  background: #f3f4f6;
  color: #4b5563;
  cursor: pointer;
}

.simple-modal-close:hover:not(:disabled) {
  background: #e5e7eb;
  color: #111827;
}

.simple-modal-close:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.simple-modal-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
}

.simple-class-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 0.65rem;
  background: #f3f6fb;
}

.modal-backdrop {
  position: fixed;
  z-index: 1055;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow-y: auto;
  background: rgb(15 23 42 / 62%);
  backdrop-filter: blur(4px);
}

.new-conversation-modal {
  position: relative;
  width: min(100%, 42rem);
  max-height: calc(100vh - 2rem);
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding: 1.5rem;
  overflow: hidden;
  border: 1px solid rgb(226 232 240 / 90%);
  border-radius: 1.25rem;
  background: #fff;
  box-shadow: 0 24px 70px rgb(15 23 42 / 24%);
}

.modal-close {
  position: absolute;
  z-index: 2;
  top: 1rem;
  right: 1rem;
  width: 2.35rem;
  height: 2.35rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: #f1f5f9;
  color: #475569;
  cursor: pointer;
}

.modal-close:hover:not(:disabled) {
  background: #e2e8f0;
  color: #0f172a;
}

.modal-close:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.modal-heading {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding-right: 2.75rem;
}

.modal-icon {
  width: 3rem;
  height: 3rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 3rem;
  border-radius: 1rem;
  background: #eef4ff
}

.conversation-item {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.9rem;
  border: 0;
  border-radius: 0.85rem;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    transform 0.2s ease;
}

.conversation-item:hover {
  background: #f5f7fb;
}

.conversation-item.active {
  background: #eef4ff;
}

.conversation-content {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.conversation-top-row,
.conversation-bottom-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.conversation-top-row strong,
.last-message {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-top-row strong {
  color: #172033;
}

.conversation-top-row small {
  flex: 0 0 auto;
  color: #7a8497;
  font-size: 0.72rem;
}

.conversation-student {
  color: #667085;
  font-size: 0.8rem;
}

.last-message {
  min-width: 0;
  color: #8a94a6;
  font-size: 0.8rem;
}

.unread-badge {
  min-width: 1.35rem;
  height: 1.35rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: #2563eb;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
}

.messages-container {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
  background: #f7f9fc;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.message-row {
  display: flex;
  align-items: flex-end;
  gap: 0.55rem;
}

.message-row.mine {
  justify-content: flex-end;
}

.message-row.theirs {
  justify-content: flex-start;
}

.message-group {
  max-width: min(75%, 42rem);
}

.message-bubble {
  padding: 0.75rem 0.9rem;
  border-radius: 1rem;
  overflow-wrap: anywhere;
}

.message-bubble p {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.5;
}

.message-row.mine .message-bubble {
  border-bottom-right-radius: 0.25rem;
  background: #2563eb;
  color: white;
}

.message-row.theirs .message-bubble {
  border-bottom-left-radius: 0.25rem;
  background: white;
  color: #1f2937;
  box-shadow: 0 1px 4px rgb(15 23 42 / 8%);
}

.message-meta {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.3rem;
  color: #8a94a6;
  font-size: 0.7rem;
}

.message-row.theirs .message-meta {
  justify-content: flex-start;
}

.message-read-status.read {
  color: #2563eb;
}

.message-avatar {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 2rem;
  border-radius: 50%;
  background: #e9eef8;
  color: #344054;
  font-size: 0.7rem;
  font-weight: 700;
}

.messages-state,
.messages-empty {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 0.7rem;
  color: #667085;
  text-align: center;
}

.messages-empty p {
  max-width: 24rem;
  margin: 0;
}

.older-messages-loader,
.load-older-btn {
  margin: 0 auto 1rem;
}

.load-older-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.8rem;
  border: 1px solid #d8dfeb;
  border-radius: 999px;
  background: white;
  color: #475467;
  cursor: pointer;
}

.student-option {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem;
  border: 1px solid #e1e7ef;
  border-radius: 0.85rem;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.student-option:hover {
  border-color: #9bb8f7;
  background: #f8faff;
}

.student-option.selected {
  border-color: #2563eb;
  background: #eef4ff;
}

.student-radio-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.student-option-details {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.radio-mark {
  width: 1.35rem;
  height: 1.35rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #c6cfdd;
  border-radius: 50%;
  color: white;
}

.student-option.selected .radio-mark {
  border-color: #2563eb;
  background: #2563eb;
}

.composer-row textarea {
  min-height: 2.75rem;
  max-height: 9rem;
  resize: vertical;
}

@media (max-width: 900px) {
  .staff-chat-shell {
    grid-template-columns: 1fr;
  }

  .conversation-sidebar {
    max-height: 25rem;
  }

  .message-group {
    max-width: 85%;
  }
}


.staff-chat-page {
  min-height: 100vh;
  padding: 24px;
  background:
    radial-gradient(
      circle at 10% 0%,
      rgba(219, 234, 254, 0.7),
      transparent 30%
    ),
    #f4f7fb;
  color: #172033;
}

.staff-chat-page *,
.staff-chat-page *::before,
.staff-chat-page *::after {
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

.staff-chat-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 28px;
  padding: 30px;
  overflow: hidden;
  border-radius: 24px;
  background:
    radial-gradient(
      circle at 85% 20%,
      rgba(96, 165, 250, 0.35),
      transparent 35%
    ),
    linear-gradient(
      135deg,
      #0f172a 0%,
      #172554 42%,
      #1d4ed8 100%
    );
  color: #ffffff;
  box-shadow:
    0 22px 50px rgba(30, 64, 175, 0.22);
}

.hero-content {
  min-width: 0;
}

.hero-content h1 {
  margin: 13px 0 8px;
  font-size: 31px;
  line-height: 1.2;
}

.hero-content p {
  max-width: 650px;
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
  background: rgba(255, 255, 255, 0.11);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.03em;
}

.hero-summary {
  display: flex;
  align-items: stretch;
  gap: 10px;
}

.hero-stat,
.connection-card {
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.17);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(9px);
}

.hero-stat {
  min-width: 105px;
  text-align: center;
}

.hero-stat span,
.hero-stat strong {
  display: block;
}

.hero-stat span {
  color: #bfdbfe;
  font-size: 10px;
}

.hero-stat strong {
  margin-top: 5px;
  font-size: 22px;
}

.connection-card {
  display: flex;
  min-width: 200px;
  align-items: center;
  gap: 11px;
}

.connection-card strong,
.connection-card small {
  display: block;
}

.connection-card small {
  margin-top: 3px;
  color: #bfdbfe;
  font-size: 10px;
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

.staff-overview-grid {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin: 20px 0;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 17px;
  border: 1px solid #e2e8f0;
  border-radius: 17px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow:
    0 8px 25px rgba(15, 23, 42, 0.05);
}

.overview-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  border-radius: 13px;
  font-size: 18px;
}

.overview-icon.blue {
  background: #dbeafe;
  color: #2563eb;
}

.overview-icon.green {
  background: #dcfce7;
  color: #15803d;
}

.overview-icon.purple {
  background: #f3e8ff;
  color: #7e22ce;
}

.overview-icon.orange {
  background: #ffedd5;
  color: #c2410c;
}

.overview-card span,
.overview-card strong {
  display: block;
}

.overview-card > div > span {
  color: #64748b;
  font-size: 11px;
}

.overview-card strong {
  margin-top: 4px;
  color: #1e293b;
  font-size: 20px;
}

.staff-chat-shell {
  display: grid;
  grid-template-columns: 365px minmax(0, 1fr);
  min-height: 700px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  border-radius: 22px;
  background: #ffffff;
  box-shadow:
    0 16px 45px rgba(15, 23, 42, 0.08);
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
  color: #1e293b;
  font-size: 19px;
}

.section-label {
  color: #2563eb;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.icon-btn,
.header-icon-btn {
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

.icon-btn:hover:not(:disabled),
.header-icon-btn:hover:not(:disabled) {
  border-color: #93c5fd;
  background: #eff6ff;
  transform: translateY(-1px);
}

.sidebar-controls {
  padding: 0 15px 13px;
}

.conversation-search {
  position: relative;
}

.conversation-search i {
  position: absolute;
  top: 50%;
  left: 14px;
  color: #94a3b8;
  transform: translateY(-50%);
  pointer-events: none;
}

.conversation-search input,
.class-filter {
  width: 100%;
  height: 43px;
  border: 1px solid #dbe3ef;
  border-radius: 11px;
  outline: none;
  background: #f8fafc;
  color: #172033;
}

.conversation-search input {
  padding: 0 13px 0 39px;
}

.class-filter {
  margin-top: 9px;
  padding: 0 12px;
}

.conversation-search input:focus,
.class-filter:focus {
  border-color: #2563eb;
  background: #ffffff;
  box-shadow:
    0 0 0 4px rgba(37, 99, 235, 0.1);
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 10px 14px;
  scrollbar-color: #cbd5e1 transparent;
  scrollbar-width: thin;
}

.conversation-list::-webkit-scrollbar,
.message-container::-webkit-scrollbar,
.student-selector::-webkit-scrollbar {
  width: 7px;
}

.conversation-list::-webkit-scrollbar-thumb,
.message-container::-webkit-scrollbar-thumb,
.student-selector::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: #cbd5e1;
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

.refresh-messages-btn {
  min-height: 2.4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.55rem 0.85rem;
  border: 1px solid #dbe3ee;
  border-radius: 0.75rem;
  background: #ffffff;
  color: #475467;
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: 0 2px 8px rgb(15 23 42 / 6%);
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.refresh-messages-btn:hover:not(:disabled) {
  border-color: #b8c5d6;
  background: #f8fafc;
  color: #2563eb;
  box-shadow: 0 4px 12px rgb(15 23 42 / 9%);
  transform: translateY(-1px);
}

.refresh-messages-btn:active:not(:disabled) {
  transform: translateY(0);
}

.refresh-messages-btn:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.refresh-messages-btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
  transform: none;
}

.refresh-messages-btn .pi {
  font-size: 0.85rem;
}

@media (max-width: 480px) {
  .refresh-messages-btn {
    padding: 0.55rem 0.7rem;
    font-size: 0.74rem;
  }

  .refresh-messages-btn span {
    display: inline;
  }
}

.conversation-item.active {
  border-color: #bfdbfe;
  background: #eff6ff;
  box-shadow:
    inset 3px 0 0 #2563eb;
}

.parent-avatar,
.student-avatar {
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
      #ede9fe,
      #ddd6fe
    );
  color: #6d28d9;
  font-size: 13px;
  font-weight: 800;
}

.parent-avatar.large {
  flex-basis: 48px;
  width: 48px;
  height: 48px;
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
  color: #94a3b8;
  font-size: 10px;
  white-space: nowrap;
}

.student-reference,
.conversation-preview {
  display: block;
  overflow: hidden;
  margin-top: 4px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.student-reference {
  color: #2563eb;
  font-size: 10px;
  font-weight: 700;
}

.conversation-preview {
  color: #64748b;
  font-size: 11px;
}

.unread-badge {
  position: absolute;
  right: 11px;
  bottom: 9px;
  display: inline-flex;
  min-width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  border-radius: 999px;
  background: #ef4444;
  color: #ffffff;
  font-size: 9px;
  font-weight: 800;
}

.new-conversation-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 11px 15px 15px;
  padding: 12px;
  border: 1px dashed #60a5fa;
  border-radius: 12px;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 700;
  cursor: pointer;
}

.new-conversation-btn:hover:not(:disabled) {
  border-style: solid;
  border-color: #2563eb;
  background: #dbeafe;
}

.sidebar-state,
.sidebar-empty {
  display: flex;
  min-height: 260px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 28px;
  color: #64748b;
  text-align: center;
}

.sidebar-state {
  gap: 8px;
}

.empty-icon,
.welcome-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 66px;
  height: 66px;
  border-radius: 20px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 25px;
}

.sidebar-empty strong {
  margin-top: 15px;
  color: #1e293b;
}

.sidebar-empty p {
  max-width: 260px;
  margin: 7px 0 15px;
  line-height: 1.5;
}

.small-primary-btn,
.primary-btn,
.welcome-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  padding: 10px 16px;
  border: 0;
  border-radius: 11px;
  background:
    linear-gradient(
      135deg,
      #2563eb,
      #1d4ed8
    );
  color: #ffffff;
  font-weight: 700;
  cursor: pointer;
  box-shadow:
    0 7px 17px rgba(37, 99, 235, 0.2);
}

.chat-panel {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
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
  margin: 17px 0 7px;
  color: #1e293b;
}

.chat-welcome > p {
  max-width: 520px;
  margin: 0;
  color: #64748b;
  line-height: 1.65;
}

.communication-rules {
  display: grid;
  width: min(100%, 620px);
  gap: 9px;
  margin: 24px 0;
  text-align: left;
}

.communication-rules > div {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 13px;
  border: 1px solid #e2e8f0;
  border-radius: 11px;
  background: #f8fafc;
  color: #475569;
  font-size: 12px;
}

.communication-rules i {
  color: #2563eb;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 17px;
  padding: 14px 19px;
  border-bottom: 1px solid #e2e8f0;
}

.chat-person {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 11px;
}

.chat-person-details {
  min-width: 0;
}

.chat-person-details strong,
.chat-person-details span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-person-details strong {
  color: #1e293b;
}

.chat-person-details span {
  margin-top: 3px;
  color: #64748b;
  font-size: 11px;
}

.chat-header-actions {
  display: flex;
  align-items: center;
  gap: 11px;
}

.participant-status {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #64748b;
  font-size: 11px;
}

.student-context-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 13px;
  padding: 9px 18px;
  border-bottom: 1px solid #dbeafe;
  background: #eff6ff;
}

.student-context-bar > div {
  display: flex;
  align-items: center;
  gap: 9px;
}

.context-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #dbeafe;
  color: #2563eb;
}

.student-context-bar span,
.student-context-bar strong {
  display: block;
}

.student-context-bar > div > div > span {
  color: #64748b;
  font-size: 9px;
  text-transform: uppercase;
}

.student-context-bar strong {
  margin-top: 2px;
  color: #1e3a8a;
  font-size: 12px;
}

.context-class {
  padding: 5px 9px;
  border-radius: 999px;
  background: #ffffff;
  color: #1d4ed8;
  font-size: 10px;
  font-weight: 700;
}

.message-container {
  flex: 1;
  min-height: 450px;
  overflow-y: auto;
  padding: 22px;
  background:
    radial-gradient(
      circle at 15% 10%,
      rgba(219, 234, 254, 0.42),
      transparent 35%
    ),
    #f8fafc;
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
}

.message-row.mine {
  justify-content: flex-end;
}

.message-bubble {
  max-width: min(72%, 620px);
  padding: 10px 13px 8px;
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
}

.message-sender {
  display: block;
  margin-bottom: 4px;
  color: #7c3aed;
  font-size: 9px;
  font-weight: 800;
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
  font-size: 9px;
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
  background: #ffffff;
  color: #64748b;
  font-size: 9px;
  font-weight: 700;
}

.messages-loading,
.no-messages {
  display: flex;
  min-height: 420px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  color: #64748b;
  text-align: center;
}

.no-messages > span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  border-radius: 18px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 22px;
}

.no-messages strong {
  color: #1e293b;
}

.no-messages p {
  max-width: 360px;
  margin: 0;
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
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}

.message-composer {
  padding: 13px 17px;
  border-top: 1px solid #e2e8f0;
  background: #ffffff;
}

.socket-warning {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 8px;
  padding: 8px 10px;
  border: 1px solid #fde68a;
  border-radius: 9px;
  background: #fffbeb;
  color: #92400e;
  font-size: 10px;
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
  padding: 13px 14px;
  border: 1px solid #dbe3ef;
  border-radius: 15px;
  outline: none;
  background: #f8fafc;
  color: #172033;
  line-height: 1.45;
}

.composer-row textarea:focus {
  border-color: #2563eb;
  background: #ffffff;
  box-shadow:
    0 0 0 4px rgba(37, 99, 235, 0.1);
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
}

.composer-help {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 6px;
  color: #94a3b8;
  font-size: 9px;
}

.modal-backdrop {
  position: fixed;
  z-index: 1100;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.68);
  backdrop-filter: blur(6px);
}

.new-conversation-modal {
  position: relative;
  width: min(100%, 650px);
  max-height: 90vh;
  overflow-y: auto;
  padding: 27px;
  border-radius: 21px;
  background: #ffffff;
  box-shadow:
    0 25px 85px rgba(15, 23, 42, 0.3);
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
}

.modal-close:hover:not(:disabled) {
  background: #f1f5f9;
  color: #1e293b;
}

.modal-heading {
  display: flex;
  gap: 13px;
  padding-right: 35px;
}

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
  font-size: 19px;
}

.modal-heading h2 {
  margin: 5px 0;
  color: #1e293b;
}

.modal-heading p {
  margin: 0;
  color: #64748b;
  line-height: 1.55;
}

.modal-step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 21px;
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 29px;
  width: 29px;
  height: 29px;
  border-radius: 9px;
  background: #2563eb;
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
}

.modal-field-content {
  min-width: 0;
  flex: 1;
}

.modal-field-content label {
  display: block;
  margin-bottom: 7px;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
}

.modal-field-content select {
  width: 100%;
  height: 45px;
  padding: 0 12px;
  border: 1px solid #dbe3ef;
  border-radius: 11px;
  outline: none;
  background: #ffffff;
}

.modal-field-content select:focus {
  border-color: #2563eb;
  box-shadow:
    0 0 0 4px rgba(37, 99, 235, 0.1);
}

.modal-field-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-field-heading > span {
  color: #94a3b8;
  font-size: 10px;
}

.student-selector {
  display: grid;
  max-height: 310px;
  overflow-y: auto;
  gap: 7px;
  padding-right: 3px;
}

.student-option {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 11px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  cursor: pointer;
}

.student-option:hover {
  border-color: #bfdbfe;
  background: #f8fbff;
}

.student-option.selected {
  border-color: #2563eb;
  background: #eff6ff;
}

.student-option input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.student-avatar {
  flex-basis: 39px;
  width: 39px;
  height: 39px;
  border-radius: 12px;
}

.student-option-details {
  min-width: 0;
  flex: 1;
}

.student-option-details strong,
.student-option-details small {
  display: block;
}

.student-option-details strong {
  overflow: hidden;
  color: #1e293b;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.student-option-details small {
  margin-top: 3px;
  color: #64748b;
  font-size: 10px;
}

.radio-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 23px;
  width: 23px;
  height: 23px;
  border: 1px solid #cbd5e1;
  border-radius: 50%;
  color: #ffffff;
  font-size: 9px;
}

.student-option.selected .radio-mark {
  border-color: #2563eb;
  background: #2563eb;
}

.modal-state {
  display: flex;
  min-height: 100px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  color: #64748b;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

.secondary-btn {
  min-height: 42px;
  padding: 10px 16px;
  border: 1px solid #dbe3ef;
  border-radius: 11px;
  background: #ffffff;
  color: #475569;
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 1100px) {
  .staff-chat-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .hero-summary {
    width: 100%;
  }

  .connection-card {
    flex: 1;
  }

  .staff-chat-shell {
    grid-template-columns: 320px minmax(0, 1fr);
  }
}

@media (max-width: 850px) {
  .staff-overview-grid {
    grid-template-columns: 1fr 1fr;
  }

  .staff-chat-shell {
    display: block;
  }

  .conversation-sidebar {
    max-height: 440px;
    border-right: 0;
    border-bottom: 1px solid #e2e8f0;
  }

  .chat-panel {
    min-height: 620px;
  }
}

@media (max-width: 650px) {
  .staff-chat-page {
    padding: 11px;
  }

  .staff-chat-hero {
    padding: 20px;
    border-radius: 18px;
  }

  .hero-content h1 {
    font-size: 24px;
  }

  .hero-summary {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .connection-card {
    grid-column: 1 / -1;
  }

  .staff-overview-grid {
    grid-template-columns: 1fr 1fr;
    gap: 9px;
  }

  .overview-card {
    padding: 13px;
  }

  .overview-icon {
    flex-basis: 38px;
    width: 38px;
    height: 38px;
  }

  .staff-chat-shell {
    border-radius: 17px;
  }

  .chat-header {
    padding: 12px;
  }

  .participant-status {
    display: none;
  }

  .student-context-bar {
    padding: 8px 12px;
  }

  .message-container {
    min-height: 430px;
    padding: 14px;
  }

  .message-bubble {
    max-width: 89%;
  }

  .message-composer {
    padding: 11px;
  }

  .composer-help span:first-child {
    display: none;
  }

  .composer-help {
    justify-content: flex-end;
  }

  .new-conversation-modal {
    padding: 20px;
  }

  .modal-heading {
    flex-direction: column;
  }

  .modal-step {
    gap: 8px;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .modal-actions button {
    width: 100%;
  }
}

@media (max-width: 440px) {
  .staff-overview-grid {
    grid-template-columns: 1fr;
  }

  .hero-summary {
    grid-template-columns: 1fr;
  }

  .connection-card {
    grid-column: auto;
  }

  .chat-person-details span {
    max-width: 190px;
  }

  .context-class {
    display: none;
  }

  .message-bubble {
    max-width: 93%;
  }
}
</style>
