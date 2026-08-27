


<template>
  <div class="announcement-page">

    <section class="announcement-hero">
      <div>
        <span class="hero-badge">
          Phena SMS Center
        </span>

        <h1>Parent Announcements</h1>

        <p>
          Send school-wide announcements or target parents from selected
          classes using your approved sender ID.
        </p>
      </div>

      <div class="hero-balance">
        <span>Available SMS Credits</span>

        <strong>
          {{ smsBalance.toLocaleString() }}
        </strong>

        <small>
          1 credit per SMS segment
        </small>
      </div>
    </section>

    <section class="summary-grid">

      <div class="summary-card">
        <span>Sender ID</span>

        <strong>
          {{ senderId || 'Not available' }}
        </strong>

        <small :class="senderIdStatusClass">
          {{ senderIdStatus }}
        </small>
      </div>

      <div class="summary-card">
        <span>Recipients</span>

        <strong>
          {{ recipientCount.toLocaleString() }}
        </strong>

        <small>Unique parent contacts</small>
      </div>

      <div class="summary-card">
        <span>Segments</span>

        <strong>
          {{ segmentCount }}
        </strong>

        <small>Per recipient</small>
      </div>

      <div class="summary-card">
        <span>Estimated Cost</span>

        <strong>
          {{ estimatedCreditCost.toLocaleString() }}
        </strong>

        <small>SMS credits</small>
      </div>

    </section>

    <section class="announcement-layout">

      <div class="announcement-card">

        <div class="card-header">
          <div>
            <span class="section-label">
              Compose
            </span>

            <h2>Create Announcement</h2>

            <p>
              Select the parent audience, enter the message, and review the
              estimated SMS credit cost before sending.
            </p>
          </div>
        </div>




          <div class="field audience-field">
            <label>
              Send SMS To
            </label>

            <div class="audience-options">
              <button
                type="button"
                class="audience-option"
                :class="{
                  selected:
                    form.audienceType ===
                    'all_parents'
                }"
                @click="
                  selectAudience(
                    'all_parents'
                  )
                "
              >
                <span class="audience-icon">
                  <i class="pi pi-users"></i>
                </span>

                <span class="audience-content">
                  <strong>
                    All Parents
                  </strong>

                  <small>
                    Send to every active parent contact.
                  </small>
                </span>
              </button>

              <button
                type="button"
                class="audience-option"
                :class="{
                  selected:
                    form.audienceType ===
                    'specific_classes'
                }"
                @click="
                  selectAudience(
                    'specific_classes'
                  )
                "
              >
                <span class="audience-icon">
                  <i class="pi pi-sitemap"></i>
                </span>

                <span class="audience-content">
                  <strong>
                    Specific Classes
                  </strong>

                  <small>
                    Send to parents in selected classes.
                  </small>
                </span>
              </button>

              <button
                type="button"
                class="audience-option"
                :class="{
                  selected:
                    form.audienceType ===
                    'specific_students'
                }"
                @click="
                  selectAudience(
                    'specific_students'
                  )
                "
              >
                <span class="audience-icon">
                  <i class="pi pi-user"></i>
                </span>

                <span class="audience-content">
                  <strong>
                    Specific Students
                  </strong>

                  <small>
                    Send to parents of selected students.
                  </small>
                </span>
              </button>

              <button
                type="button"
                class="audience-option"
                :class="{
                  selected:
                    form.audienceType ===
                    'all_staff'
                }"
                @click="
                  selectAudience(
                    'all_staff'
                  )
                "
              >
                <span class="audience-icon staff">
                  <i class="pi pi-briefcase"></i>
                </span>

                <span class="audience-content">
                  <strong>
                    All Staff
                  </strong>

                  <small>
                    Send to every active staff contact.
                  </small>
                </span>
              </button>

              <button
                type="button"
                class="audience-option"
                :class="{
                  selected:
                    form.audienceType ===
                    'specific_staff'
                }"
                @click="
                  selectAudience(
                    'specific_staff'
                  )
                "
              >
                <span class="audience-icon staff">
                  <i class="pi pi-user-plus"></i>
                </span>

                <span class="audience-content">
                  <strong>
                    Specific Staff
                  </strong>

                  <small>
                    Select individual staff recipients.
                  </small>
                </span>
              </button>

              <button
                type="button"
                class="audience-option"
                :class="{
                  selected:
                    form.audienceType ===
                    'custom_numbers'
                }"
                @click="
                  selectAudience(
                    'custom_numbers'
                  )
                "
              >
                <span class="audience-icon custom">
                  <i class="pi pi-phone"></i>
                </span>

                <span class="audience-content">
                  <strong>
                    Custom Number
                  </strong>

                  <small>
                    Enter one or more recipient numbers.
                  </small>
                </span>
              </button>
            </div>
          </div>


        <div
          v-if="form.audienceType === 'specific_classes'"
          class="field"
        >
          <div class="field-heading">
            <label>Select Classes</label>

            <button
              v-if="classes.length"
              type="button"
              class="text-btn"
              @click="toggleAllClasses"
            >
              {{
                allClassesSelected
                  ? 'Clear All'
                  : 'Select All'
              }}
            </button>
          </div>

          <div
            v-if="classesLoading"
            class="small-state"
          >
            Loading classes...
          </div>

          <div
            v-else-if="classes.length === 0"
            class="small-state"
          >
            No classes found.
          </div>

          <div
            v-else
            class="class-grid"
          >
            <label
              v-for="classItem in classes"
              :key="classItem.id"
              class="class-option"
              :class="{
                selected: form.classIds.includes(classItem.id)
              }"
            >
              <input
                v-model="form.classIds"
                type="checkbox"
                :value="classItem.id"
                @change="handleClassSelection"
              >

              <span class="checkbox-box">
                <i
                  v-if="form.classIds.includes(classItem.id)"
                  class="pi pi-check"
                ></i>
              </span>

              <span>
                <strong>
                  {{ classItem.name }}
                </strong>

                <small>
                  {{ Number(classItem.studentCount || 0).toLocaleString() }}
                  students
                </small>
              </span>
            </label>
          </div>

          <small
            v-if="
              form.audienceType === 'specific_classes' &&
              form.classIds.length === 0
            "
            class="field-help"
          >
            Select at least one class.
          </small>
        </div>


        <div
  v-if="form.audienceType === 'specific_students'"
  class="field"
>
  <label for="student-class">
    Select Class
  </label>

  <select
    id="student-class"
    v-model="form.studentClassId"
    :disabled="classesLoading || studentsLoading"
    @change="handleStudentClassChange"
  >
    <option :value="null">
      Select a class
    </option>

    <option
      v-for="classItem in classes"
      :key="classItem.id"
      :value="Number(classItem.id)"
    >
      {{ classItem.name }}
    </option>
  </select>

  <small class="field-help">
    Select a class to display its students.
  </small>
        </div>




<div
  v-if="form.audienceType === 'specific_students'"
  class="field student-class-field"
>
  <div class="student-class-header">
    <span class="student-class-icon">
      <i class="pi pi-sitemap"></i>
    </span>

    <div>
      <label for="student-class">
        Choose a Class First
      </label>

      <small>
        Select a class to load and display its students.
      </small>
    </div>
  </div>

  <div class="student-class-select-wrapper">
    <i class="pi pi-building select-leading-icon"></i>

    <select
      id="student-class"
      v-model="form.studentClassId"
      class="student-class-select"
      :disabled="classesLoading || studentsLoading"
      @change="handleStudentClassChange"
    >
      <option :value="null" disabled>
        Select a class
      </option>

      <option
        v-for="classItem in classes"
        :key="classItem.id"
        :value="Number(classItem.id)"
      >
        {{ classItem.name }}
        ({{ Number(classItem.studentCount || 0).toLocaleString() }} students)
      </option>
    </select>

    <i class="pi pi-chevron-down select-arrow"></i>
  </div>

  <div
    v-if="classesLoading"
    class="class-select-status"
  >
    <i class="pi pi-spin pi-spinner"></i>

    Loading available classes...
  </div>

  <div
    v-else-if="!form.studentClassId"
    class="class-select-notice"
  >
    <i class="pi pi-info-circle"></i>

    <span>
      Choose a class above before selecting students.
    </span>
  </div>
</div>

<div
  v-if="
    form.audienceType === 'specific_students' &&
    form.studentClassId
  "
  class="field student-list-field"
>
  <div class="field-heading">
    <div>
      <label>Select Students</label>

      <small class="field-help">
        Tick one or more students whose parents should receive the announcement.
      </small>
    </div>

    <button
      v-if="students.length"
      type="button"
      class="text-btn"
      @click="toggleAllStudents"
    >
      {{
        allStudentsSelected
          ? 'Clear All'
          : 'Select All'
      }}
    </button>
  </div>

  <div
    v-if="studentsLoading"
    class="small-state"
  >
    <i class="pi pi-spin pi-spinner"></i>
    Loading students...
  </div>

  <div
    v-else-if="students.length === 0"
    class="small-state"
  >
    No active students were found in this class.
  </div>

  <div
    v-else
    class="student-selection-list"
  >
    <label
      v-for="student in students"
      :key="student.id"
      class="class-option"
      :class="{
        selected: form.studentIds.includes(
          Number(student.id)
        )
      }"
    >
      <input
        v-model="form.studentIds"
        type="checkbox"
        :value="Number(student.id)"
        @change="normalizeSelectedStudentIds"
      >

      <span class="checkbox-box">
        <i
          v-if="
            form.studentIds.includes(
              Number(student.id)
            )
          "
          class="pi pi-check"
        ></i>
      </span>

      <span>
        <strong>
          {{ student.fullName }}
        </strong>

        <small>
          {{
            student.admissionNumber
              ? `Admission No: ${student.admissionNumber}`
              : 'Student'
          }}
        </small>
      </span>
    </label>
  </div>

  <small
    v-if="
      !studentsLoading &&
      students.length > 0 &&
      form.studentIds.length === 0
    "
    class="field-help student-selection-help"
  >
    <i class="pi pi-info-circle"></i>
    Select at least one student.
  </small>
</div>



<div
  v-if="
    form.audienceType ===
    'specific_staff'
  "
  class="field staff-selection-field"
>
  <div class="field-heading">
    <div>
      <label for="staff-search">
        Select Staff
      </label>

      <small class="field-help">
        Choose one or more staff members to receive the SMS.
      </small>
    </div>

    <button
      v-if="filteredStaffMembers.length"
      type="button"
      class="text-btn"
      @click="toggleAllStaff"
    >
      {{
        allFilteredStaffSelected
          ? 'Clear All'
          : 'Select All'
      }}
    </button>
  </div>

  <div class="staff-search">
    <i class="pi pi-search"></i>

    <input
      id="staff-search"
      v-model.trim="staffSearch"
      type="search"
      autocomplete="off"
      placeholder="Search by staff name, position, or phone number"
    >
  </div>

  <div
    v-if="staffLoading"
    class="small-state"
  >
    <i class="pi pi-spin pi-spinner"></i>

    Loading staff members...
  </div>

  <div
    v-else-if="
      filteredStaffMembers.length === 0
    "
    class="small-state"
  >
    No matching active staff members were found.
  </div>




<div
  v-else
  class="staff-selection-list"
>
  <label
    v-for="
      staffMember in
      filteredStaffMembers
    "
    :key="staffMember.id"
    class="staff-option"
    :class="{
      selected:
        form.staffIds.includes(
          Number(staffMember.id)
        ),
      unavailable:
        !staffMember.phoneNumber
    }"
  >
    <input
      v-model="form.staffIds"
      type="checkbox"
      :value="
        Number(
          staffMember.id
        )
      "
      :disabled="
        !staffMember.phoneNumber
      "
      @change="
        normalizeSelectedStaffIds
      "
    >

    <span
      class="checkbox-box"
      :class="{
        checked:
          form.staffIds.includes(
            Number(staffMember.id)
          )
      }"
      aria-hidden="true"
    >
      <i
        v-if="
          form.staffIds.includes(
            Number(staffMember.id)
          )
        "
        class="pi pi-check"
      ></i>
    </span>

    <span class="staff-avatar">
      {{
        getInitials(
          staffMember.fullName
        )
      }}
    </span>

    <span class="staff-option-details">
      <strong>
        {{ staffMember.fullName }}
      </strong>

      <small>
        {{
          staffMember.position ||
          staffMember.role ||
          'Staff'
        }}
      </small>

      <span>
        <i class="pi pi-phone"></i>

        {{
          staffMember.phoneNumber ||
          'No phone number'
        }}
      </span>
    </span>

    <span
      v-if="
        !staffMember.phoneNumber
      "
      class="missing-phone-badge"
    >
      No number
    </span>
  </label>
</div>


  <small
    v-if="
      !staffLoading &&
      filteredStaffMembers.length > 0 &&
      form.staffIds.length === 0
    "
    class="field-help selection-warning"
  >
    <i class="pi pi-info-circle"></i>

    Select at least one staff member.
  </small>
</div>



<div
  v-if="
    form.audienceType ===
    'custom_numbers'
  "
  class="field custom-number-field"
>
  <div class="custom-number-heading">
    <span class="custom-number-icon">
      <i class="pi pi-phone"></i>
    </span>

    <div>
      <label for="custom-numbers">
        Recipient Phone Numbers
      </label>

      <small>
        Enter one phone number per line or separate numbers with commas.
      </small>
    </div>
  </div>

  <textarea
    id="custom-numbers"
    v-model="form.customNumbers"
    rows="5"
    maxlength="2000"
    placeholder="Example:
0241234567
0557654321"
    @input="scheduleEstimate"
  ></textarea>

  <div class="custom-number-summary">
    <span>
      <i class="pi pi-mobile"></i>

      {{ validCustomNumbers.length }}
      valid
      {{
        validCustomNumbers.length === 1
          ? 'number'
          : 'numbers'
      }}
    </span>

    <span
      v-if="
        invalidCustomNumbers.length > 0
      "
      class="invalid-number-count"
    >
      <i class="pi pi-exclamation-triangle"></i>

      {{ invalidCustomNumbers.length }}
      invalid
    </span>
  </div>

  <div
    v-if="
      invalidCustomNumbers.length > 0
    "
    class="invalid-number-list"
  >
    <strong>
      Check these numbers:
    </strong>

    <span>
      {{
        invalidCustomNumbers.join(
          ', '
        )
      }}
    </span>
  </div>

  <small class="field-help">
    Ghana numbers such as 0241234567 and 233241234567 are accepted.
  </small>
</div>





        <div class="field">
          <div class="field-heading">
            <label>Announcement Message</label>

            <span
              class="character-count"
              :class="{ danger: messageLength > 480 }"
            >
              {{ messageLength }} / 480
            </span>
          </div>

          <textarea
            v-model="form.message"
            rows="7"
            maxlength="480"
            placeholder="Enter the announcement you want to send to parents..."
            @input="scheduleEstimate"
          ></textarea>

          <div class="message-information">
            <span>
              {{ isUnicodeMessage ? 'Unicode message' : 'Standard GSM message' }}
            </span>

            <span>
              {{ segmentCount }}
              {{ segmentCount === 1 ? 'segment' : 'segments' }}
              per recipient
            </span>
          </div>
        </div>

        <div class="field">
          <label>Internal Description</label>

          <input
            v-model.trim="form.description"
            type="text"
            maxlength="150"
            placeholder="Example: First-term reopening announcement"
          >

          <small class="field-help">
            This description is for your activity history and is not sent to parents.
          </small>
        </div>

        <div
          v-if="previewLoading"
          class="preview-loading"
        >
          <i class="pi pi-spin pi-spinner"></i>
          Calculating recipients and SMS cost...
        </div>

        <div
          v-else
          class="send-summary"
        >
          <div>
            <span>Audience</span>

            <strong>
              {{ audienceLabel }}
            </strong>
          </div>

          <div>
            <span>Unique Recipients</span>

            <strong>
              {{ recipientCount.toLocaleString() }}
            </strong>
          </div>

          <div>
            <span>Message Segments</span>

            <strong>
              {{ segmentCount }}
            </strong>
          </div>

          <div>
            <span>Total Credit Cost</span>

            <strong>
              {{ estimatedCreditCost.toLocaleString() }}
            </strong>
          </div>
        </div>

        <div
          v-if="hasInsufficientBalance"
          class="warning-box"
        >
          <i class="pi pi-exclamation-triangle"></i>

          <div>
            <strong>Insufficient SMS balance</strong>

            <p>
              This announcement requires
              {{ estimatedCreditCost.toLocaleString() }} credits, but the
              wallet has {{ smsBalance.toLocaleString() }} credits.
            </p>
          </div>
        </div>

        <div
          v-if="!hasApprovedSenderId"
          class="warning-box"
        >
          <i class="pi pi-ban"></i>

          <div>
            <strong>Approved sender ID required</strong>

            <p>
              SMS announcements cannot be sent until the school's sender ID
              is approved.
            </p>
          </div>
        </div>

        <div class="form-actions">

          <button
            type="button"
            class="secondary-btn"
            :disabled="sending"
            @click="resetForm"
          >
            Clear
          </button>

          <button
            type="button"
            class="primary-btn"
            :disabled="!canOpenConfirmation"
            @click="openSendConfirmation"
          >
            <i
              v-if="sending"
              class="pi pi-spin pi-spinner"
            ></i>

            <i
              v-else
              class="pi pi-send"
            ></i>

            {{
              sending
                ? 'Sending...'
                : 'Review and Send'
            }}
          </button>


      </div></div>

       <div
  v-if="!canOpenConfirmation"
  class="send-requirements"
>
  <small v-if="sending">
    Please wait while the announcement is being sent.
  </small>

  <small v-else-if="previewLoading">
    Please wait while recipients and SMS cost are calculated.
  </small>

  <small v-else-if="!hasApprovedSenderId">
    An approved sender ID is required.
  </small>

  <small v-else-if="!hasValidAudience">
  {{
    form.audienceType === 'specific_students'
      ? 'Select a class and at least one student.'
      : 'Select at least one class.'
  }}
</small>

  <small v-else-if="form.message.trim().length === 0">
    Enter an announcement message.
  </small>

  <small v-else-if="recipientCount <= 0">
    No parent recipients were found for the selected audience.
  </small>

  <small v-else-if="segmentCount <= 0">
    The message segment count could not be calculated.
  </small>

  <small v-else-if="estimatedCreditCost <= 0">
    The SMS credit cost could not be calculated.
  </small>

  <small v-else-if="hasInsufficientBalance">
    Your SMS balance is insufficient for this announcement.
  </small>


        </div>

      <aside class="side-column">

        <div class="side-card">
          <span class="section-label">
            Delivery Rules
          </span>

          <h3>Before sending</h3>

          <ul class="rules-list">
            <li>
              <i class="pi pi-check-circle"></i>

              <span>
                Only an approved sender ID can be used.
              </span>
            </li>

            <li>
              <i class="pi pi-check-circle"></i>

              <span>
                Duplicate parent phone numbers are counted once.
              </span>
            </li>

            <li>
              <i class="pi pi-check-circle"></i>

              <span>
                Invalid or blank phone numbers are excluded.
              </span>
            </li>

            <li>
              <i class="pi pi-check-circle"></i>

              <span>
                SMS credits are deducted only after a successful provider response.
              </span>
            </li>
          </ul>
        </div>

        <div class="side-card">
          <span class="section-label">
            Message Estimate
          </span>

          <div class="estimate-list">
            <div>
              <span>Characters</span>
              <strong>{{ messageLength }}</strong>
            </div>

            <div>
              <span>Message Type</span>
              <strong>
                {{ isUnicodeMessage ? 'Unicode' : 'Standard Text' }}
              </strong>
            </div>

            <div>
              <span>Segments</span>
              <strong>{{ segmentCount }}</strong>
            </div>

            <div>
              <span>Recipients</span>
              <strong>{{ recipientCount.toLocaleString() }}</strong>
            </div>

            <div>
              <span>Required Credits</span>
              <strong>{{ estimatedCreditCost.toLocaleString() }}</strong>
            </div>

            <div>
              <span>Balance After</span>
              <strong>
                {{ projectedSmsBalance.toLocaleString() }}
              </strong>
            </div>
          </div>
        </div>

      </aside>

    </section>




<section class="announcement-card history-card">

  <div class="compact-history-header">
    <div>
      <span class="section-label">
        History
      </span>

      <h2>Recent Announcements</h2>

      <p>
        Review recently sent parent announcement campaigns.
      </p>
    </div>

    <button
      type="button"
      class="refresh-btn compact-refresh-btn"
      :disabled="historyLoading"
      @click="loadAnnouncementHistory"
    >
      <i
        class="pi"
        :class="
          historyLoading
            ? 'pi-spin pi-spinner'
            : 'pi-refresh'
        "
      ></i>

      Refresh
    </button>
  </div>

  <div
    v-if="historyLoading"
    class="empty-state compact-empty-state"
  >
    Loading announcement history...
  </div>

  <div
    v-else-if="announcements.length === 0"
    class="empty-state compact-empty-state"
  >
    No announcements have been sent yet.
  </div>

<div class="compact-table-wrapper">
  <table class="compact-history-table">
    <thead>
      <tr>
        <th>Date</th>
        <th>Recipients</th>
        <th>Status</th>
        <th>Audience</th>
        <th>Classes</th>
        <th>Description</th>
        <th>Message</th>
        <th class="copy-header">
          Copy
        </th>
      </tr>
    </thead>

    <tbody>
      <tr
        v-for="announcement in announcements"
        :key="announcement.id"
      >
        <td class="date-column" style=" text-align: left;">
          {{
            formatDateOnly(
              announcement.createdAt
            )
          }}
        </td>

        <td class="recipient-column" style=" text-align: left;" >
          <span class="recipient-badge">
            <i class="pi pi-users"></i>

            {{
              Number(
                announcement.recipientCount ||
                0
              ).toLocaleString()
            }}
          </span>
        </td>

        <td class="status-column" style=" text-align: left;">
          <span
            class="status-pill compact-status-pill"
            :class="
              normalizeStatus(
                announcement.status
              )
            "
          >
            {{ announcement.status }}
          </span>
        </td>






       <td class="audience-column" style="text-align: left;">
  <span
    class="audience-badge"
    style="display: inline-block; text-align: left;"
    :class="normalizeAudienceType(announcement.audienceType)"
  >
    {{
      formatAnnouncementAudience(announcement)
    }}
  </span>
</td>








        <td  style=" text-align: left;" class="classes-column">
          <span
            class="compact-cell-text"
            :title="
              formatSelectedClasses(
                announcement
              )
            "
          >
            {{
              formatSelectedClasses(
                announcement
              )
            }}
          </span>
        </td>

        <td class="description-column">
          <span
            class="compact-cell-text"
            :title="
              announcement.description ||
              '-'
            "
          >
            {{
              announcement.description ||
              '-'
            }}
          </span>
        </td>

        <td class="message-column">
          <span
            class="compact-message-text"
            :title="
              announcement.message ||
              ''
            "
          >
            {{
              announcement.message ||
              '-'
            }}
          </span>
        </td>

        <td class="copy-column">
          <button
            type="button"
            class="copy-message-btn"
            :class="{
              copied:
                Number(
                  copiedAnnouncementId
                ) ===
                Number(
                  announcement.id
                )
            }"
            :disabled="
              !announcement.message ||
              Number(
                copyingAnnouncementId
              ) ===
              Number(
                announcement.id
              )
            "
            :title="
              Number(
                copiedAnnouncementId
              ) ===
              Number(
                announcement.id
              )
                ? 'Copied'
                : 'Copy message'
            "
            :aria-label="
              Number(
                copiedAnnouncementId
              ) ===
              Number(
                announcement.id
              )
                ? 'Announcement message copied'
                : 'Copy announcement message'
            "
            @click="
              copyAnnouncementMessage(
                announcement
              )
            "
          >
            <i
              class="pi"
              :class="
                Number(
                  copyingAnnouncementId
                ) ===
                Number(
                  announcement.id
                )
                  ? 'pi-spin pi-spinner'
                  : Number(
                      copiedAnnouncementId
                    ) ===
                    Number(
                      announcement.id
                    )
                    ? 'pi-check'
                    : 'pi-copy'
              "
            ></i>

            <span>
              {{
                Number(
                  copiedAnnouncementId
                ) ===
                Number(
                  announcement.id
                )
                  ? 'Copied'
                  : 'Copy'
              }}
            </span>
          </button>
        </td>
      </tr>

      <tr v-if="announcements.length === 0">
        <td
          colspan="8"
          class="empty-announcements-cell"
        >
          No announcement history is available.
        </td>
      </tr>
    </tbody>
  </table>
</div>



</section>







    <div
      v-if="confirmationVisible"
      class="modal-backdrop"
      @click.self="closeSendConfirmation"
    >
      <div class="confirmation-modal">

        <div class="confirmation-icon">
          <i class="pi pi-send"></i>
        </div>

        <h3>Send Announcement?</h3>

        <p>
          Confirm the audience and SMS credit cost before sending this message.
        </p>

        <div class="confirmation-details">
          <div>
            <span>Sender ID</span>
            <strong>{{ senderId }}</strong>
          </div>

          <div>
            <span>Audience</span>
            <strong>{{ audienceLabel }}</strong>
          </div>

          <div>
            <span>Recipients</span>
            <strong>{{ recipientCount.toLocaleString() }}</strong>
          </div>

          <div>
            <span>SMS Credits</span>
            <strong>{{ estimatedCreditCost.toLocaleString() }}</strong>
          </div>
        </div>

        <div class="confirmation-message">
          <span>Message</span>

          <p>
            {{ form.message }}
          </p>
        </div>

        <div class="modal-actions">

          <button
            type="button"
            class="secondary-btn"
            :disabled="sending"
            @click="closeSendConfirmation"
          >
            Cancel
          </button>

          <button
            type="button"
            class="confirm-send-btn"
            :disabled="sending"
            @click="sendAnnouncement"
          >
            <i
              v-if="sending"
              class="pi pi-spin pi-spinner"
            ></i>

            {{
              sending
                ? 'Sending...'
                : 'Yes, Send Now'
            }}
          </button>

        </div>

      </div>
    </div>

  </div>
</template>



<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
} from 'vue'

import {
  useToast,
} from 'vue-toastification'

import {
  get_classes_with_student_count,
  getAnnouncementHistory,
  getClientSmsWallet,
  getLatestSenderId,
  sendParentAnnouncement,
  getStudentsByClass,

  get_staff_ktor,
} from '@/services/api.js'

const toast =
  useToast()

  function formatDateOnly(value) {

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
    return String(value).slice(
      0,
      10
    )
  }

  return date.toLocaleDateString(
    'en-GB',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  )
}




function normalizeAudienceType(
  value
) {
  return String(
    value ||
    ''
  )
    .trim()
    .toLowerCase()
    .replace(
      /_/g,
      '-'
    )
}

function formatAnnouncementAudience(
  announcement
) {
  const savedAudienceLabel =
    String(
      announcement?.audienceLabel ||
      ''
    ).trim()

  const audienceType =
    String(
      announcement?.audienceType ||
      ''
    )
      .trim()
      .toLowerCase()

  if (
    savedAudienceLabel &&
    !(
      savedAudienceLabel ===
        'Selected Classes' &&
      audienceType !==
        'specific_classes'
    )
  ) {
    return savedAudienceLabel
  }

  const recipientCount =
    Number(
      announcement?.recipientCount ||
      0
    )

  switch (audienceType) {
    case 'all_parents':
      return 'All Parents'

    case 'specific_classes':
      return 'Specific Classes'

    case 'specific_students':
      return 'Specific Students'

    case 'all_staff':
      return 'All Staff'

    case 'specific_staff':
      return 'Specific Staff'

    case 'custom_numbers':
      return recipientCount === 1
        ? '1 Custom Number'
        : `${recipientCount} Custom Numbers`

    default:
      return 'SMS'
  }}


async function copyAnnouncementMessage(
  announcement
) {
  const announcementId =
    Number(announcement?.id)

  const message =
    String(
      announcement?.message ||
      ''
    ).trim()

  if (!message) {
    toast.warning(
      'There is no message to copy.'
    )

    return
  }

  if (
    copyingAnnouncementId.value !==
    null
  ) {
    return
  }

  try {
    copyingAnnouncementId.value =
      announcementId

    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(
        message
      )
    } else {
      copyTextWithFallback(
        message
      )
    }

    copiedAnnouncementId.value =
      announcementId

    toast.success(
      'Copied'
    )

    if (copiedResetTimer.value) {
      clearTimeout(
        copiedResetTimer.value
      )
    }

    copiedResetTimer.value =
      setTimeout(() => {
        copiedAnnouncementId.value =
          null

        copiedResetTimer.value =
          null
      }, 2000)
  } catch (error) {


    toast.error(
      'Unable to copy the message.'
    )
  } finally {
    copyingAnnouncementId.value =
      null
  }
}



function copyTextWithFallback(
  value
) {
  const temporaryTextArea =
    document.createElement(
      'textarea'
    )

  temporaryTextArea.value =
    value

  temporaryTextArea.setAttribute(
    'readonly',
    ''
  )

  temporaryTextArea.style.position =
    'fixed'

  temporaryTextArea.style.top =
    '-9999px'

  temporaryTextArea.style.left =
    '-9999px'

  temporaryTextArea.style.opacity =
    '0'

  document.body.appendChild(
    temporaryTextArea
  )

  temporaryTextArea.focus()
  temporaryTextArea.select()

  const copied =
    document.execCommand(
      'copy'
    )

  document.body.removeChild(
    temporaryTextArea
  )

  if (!copied) {
    throw new Error(
      'The browser rejected the copy operation.'
    )
  }
}


onBeforeUnmount(() => {
  if (copiedResetTimer.value) {
    clearTimeout(
      copiedResetTimer.value
    )

    copiedResetTimer.value =
      null
  }
})



const staffMembers =
  ref([])

const staffLoading =
  ref(false)

const staffSearch =
  ref('')


function formatSelectedClasses(
  announcement
) {
  const audienceType =
    String(
      announcement?.audienceType ||
      ''
    )
      .trim()
      .toLowerCase()

  if (
    audienceType ===
    'all_parents'
  ) {
    return 'All Classes'
  }

  if (
    audienceType ===
    'specific_classes'
  ) {
    if (
      Array.isArray(
        announcement
          ?.selectedClassNames
      ) &&
      announcement
        .selectedClassNames
        .length > 0
    ) {
      return announcement
        .selectedClassNames
        .join(', ')
    }

    return 'Selected Classes'
  }

  if (
    audienceType ===
    'specific_students'
  ) {
    return 'Selected Students'
  }

  if (
    audienceType ===
    'all_staff'
  ) {
    return 'Not applicable'
  }

  if (
    audienceType ===
    'specific_staff'
  ) {
    return 'Not applicable'
  }

  if (
    audienceType ===
    'custom_numbers'
  ) {
    return 'Not applicable'
  }

  return '-'
}


const classes =
  ref([])


  const students =
  ref([])

const studentsLoading =
  ref(false)

const announcements =
  ref([])

const classesLoading =
  ref(false)

const historyLoading =
  ref(false)

const sending =
  ref(false)

const confirmationVisible =
  ref(false)

const senderId =
  ref('')

const senderIdStatus =
  ref('Not requested')

const smsBalance =
  ref(0)


  const copyingAnnouncementId =
  ref(null)

const copiedAnnouncementId =
  ref(null)

const copiedResetTimer =
  ref(null)




const form =
  reactive({
    audienceType:
      'all_parents',

    classIds:
      [],

    studentClassId:
      null,

    studentIds:
      [],

    staffIds:
      [],

    customNumbers:
      '',

    message:
      '',

    description:
      '',
  })






  const loadStudentsByClass =
  async (classId) => {

    const normalizedClassId =
      Number(classId)

    if (
      !Number.isInteger(normalizedClassId) ||
      normalizedClassId <= 0
    ) {
      students.value = []
      form.studentIds = []

      return
    }

    try {
      studentsLoading.value = true

      students.value = []
      form.studentIds = []

      const response =
        await getStudentsByClass(
          normalizedClassId
        )

      students.value =
        Array.isArray(response.data)
          ? response.data
              .map((student) => {
                return {
                  ...student,

                  id:
                    Number(student.id),

                  fullName:
                    student.fullName ||
                    student.name ||
                    student.user?.fullName ||
                    'Unnamed student',
                }
              })
              .filter((student) => {
                return (
                  Number.isInteger(student.id) &&
                  student.id > 0
                )
              })
          : []

    } catch (error) {


      students.value = []
      form.studentIds = []

      toast.error(
        error?.response?.data?.message ||
        'Failed to load students.'
      )
    } finally {
      studentsLoading
.value = false
    }
  }


  async function handleStudentClassChange() {
  form.studentIds = []

  await loadStudentsByClass(
    form.studentClassId
  )
}



const filteredStaffMembers =
  computed(() => {
    const searchValue =
      staffSearch.value
        .trim()
        .toLowerCase()

    if (!searchValue) {
      return staffMembers.value
    }

    return staffMembers.value.filter(
      (staffMember) => {
        return [
          staffMember.fullName,
          staffMember.position,
          staffMember.role,
          staffMember.phoneNumber,
        ]
          .filter(Boolean)
          .some((value) => {
            return String(value)
              .toLowerCase()
              .includes(searchValue)
          })
      }
    )
  })

const selectableStaffMembers =
  computed(() => {
    return filteredStaffMembers.value
      .filter((staffMember) => {
        return Boolean(
          String(
            staffMember.phoneNumber ||
            ''
          ).trim()
        )
      })
  })

const allFilteredStaffSelected =
  computed(() => {
    const selectableIds =
      selectableStaffMembers.value
        .map((staffMember) => {
          return Number(
            staffMember.id
          )
        })

    if (
      selectableIds.length === 0
    ) {
      return false
    }

    return selectableIds.every(
      (staffId) => {
        return form.staffIds.includes(
          staffId
        )
      }
    )
  })



  const enteredCustomNumbers =
  computed(() => {
    return String(
      form.customNumbers ||
      ''
    )
      .split(
        /[\n,;]+/
      )
      .map((phoneNumber) => {
        return phoneNumber.trim()
      })
      .filter(Boolean)
  })

const validCustomNumbers =
  computed(() => {
    const normalizedNumbers =
      enteredCustomNumbers.value
        .map((phoneNumber) => {
          return normalizePhoneNumber(
            phoneNumber
          )
        })
        .filter(Boolean)

    return [
      ...new Set(
        normalizedNumbers
      ),
    ]
  })

const invalidCustomNumbers =
  computed(() => {
    return enteredCustomNumbers.value
      .filter((phoneNumber) => {
        return !normalizePhoneNumber(
          phoneNumber
        )
      })
  })

function normalizePhoneNumber(value) {
  let phoneNumber = String(value || '')
    .trim()
    .replace(/[\s()-]/g, '');

  // Remove leading +
  if (phoneNumber.startsWith('+')) {
    phoneNumber = phoneNumber.slice(1);
  }

  // Convert 00XXXXXXXXX to XXXXXXXXX
  if (phoneNumber.startsWith('00')) {
    phoneNumber = phoneNumber.slice(2);
  }

  // Convert Ghana local format:
  // 0246875311 -> 233246875311
  if (
    phoneNumber.startsWith('0') &&
    phoneNumber.length === 10 &&
    /^0[0-9]{9}$/.test(phoneNumber)
  ) {
    phoneNumber = `233${phoneNumber.slice(1)}`;
  }

  // Validate Ghana international format
  if (!/^233[0-9]{9}$/.test(phoneNumber)) {
    return null;
  }

  return phoneNumber;
}

function normalizeSelectedStaffIds() {
  form.staffIds = [
    ...new Set(
      form.staffIds
        .map(Number)
        .filter((staffId) => {
          return (
            Number.isInteger(
              staffId
            ) &&
            staffId > 0
          )
        })
    ),
  ]
}

function toggleAllStaff() {
  const selectableIds =
    selectableStaffMembers.value
      .map((staffMember) => {
        return Number(
          staffMember.id
        )
      })

  if (
    allFilteredStaffSelected.value
  ) {
    form.staffIds =
      form.staffIds.filter(
        (staffId) => {
          return !selectableIds.includes(
            Number(staffId)
          )
        }
      )

    return
  }

  form.staffIds = [
    ...new Set([
      ...form.staffIds.map(
        Number
      ),

      ...selectableIds,
    ]),
  ]
}

function getInitials(
  value
) {
  return String(
    value ||
    'Staff'
  )
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => {
      return part
        .charAt(0)
        .toUpperCase()
    })
    .join('')
}




async function loadStaffMembers() {
  try {
    staffLoading.value =
      true

    const response =
      await get_staff_ktor()



    const responseData =
      response?.data

    const records =
      Array.isArray(responseData)
        ? responseData
        : Array.isArray(
            responseData?.items
          )
          ? responseData.items
          : Array.isArray(
              responseData?.staff
            )
            ? responseData.staff
            : Array.isArray(
                responseData?.data
              )
              ? responseData.data
              : []

    staffMembers.value =
      records
        .map((staffMember) => {
          const user =
            staffMember?.user ||
            {}

          const assignedClass =
            staffMember?.assignedClass ||
            null

          const staffId =
            Number(
              staffMember?.id ||
              staffMember?.staffId ||
              0
            )

          const accountId =
            Number(
              user?.id ||
              staffMember?.accountId ||
              0
            )

          const fullName =
            String(
              user?.fullName ||
              staffMember?.fullName ||
              staffMember?.name ||
              'Unnamed staff'
            ).trim()

          const phoneNumber =
            String(
              staffMember?.tel ||
              staffMember?.phoneNumber ||
              staffMember?.phone ||
              staffMember?.contact ||
              ''
            ).trim()

          const role =
            String(
              user?.role ||
              staffMember?.role ||
              'staff'
            )
              .trim()
              .toLowerCase()

          const isActive =
            user?.isActive !== false

          return {
            ...staffMember,

            id:
              staffId,

            staffId:
              staffId,

            accountId:
              accountId,

            userId:
              String(
                user?.userId ||
                ''
              ).trim(),

            fullName:
              fullName,

            phoneNumber:
              phoneNumber,

            tel:
              phoneNumber,

            role:
              role,

            isActive:
              isActive,

            gender:
              String(
                user?.gender ||
                ''
              ).trim(),

            dateOfBirth:
              user?.dateOfBirth ||
              null,

            profilePictureUrl:
              user?.profilePictureUrl ||
              null,

            profilePicturePublicId:
              user?.profilePicturePublicId ||
              null,

            assignedClassId:
              Number(
                assignedClass?.id ||
                staffMember?.assignedClassId ||
                0
              ) || null,

            assignedClassName:
              String(
                assignedClass?.name ||
                staffMember?.assignedClassName ||
                ''
              ).trim(),

            position:
              String(
                staffMember?.position ||
                staffMember?.jobTitle ||
                role ||
                'Staff'
              ).trim(),
          }
        })
        .filter((staffMember) => {
          return (
            Number.isInteger(
              staffMember.id
            ) &&
            staffMember.id > 0 &&
            staffMember.isActive === true &&
            staffMember.role ===
              'staff'
          )
        })
        .sort((first, second) => {
          return first.fullName
            .localeCompare(
              second.fullName
            )
        })




  } catch (error) {
    staffMembers.value = []


    toast.error(
      error?.response?.data
        ?.message ||
      error?.message ||
      'Failed to load staff members.'
    )
  } finally {
    staffLoading.value =
      false
  }
}


const allStudentsSelected =
  computed(() => {

    return (
      students.value.length > 0 &&
      form.studentIds.length ===
        students.value.length
    )
  })

function toggleAllStudents() {
  if (allStudentsSelected.value) {
    form.studentIds = []

    return
  }

  form.studentIds =
    students.value.map((student) => {
      return Number(student.id)
    })
}

function normalizeSelectedStudentIds() {
  form.studentIds =
    [...new Set(form.studentIds)]
      .map(Number)
      .filter((id) => {
        return (
          Number.isInteger(id) &&
          id > 0
        )
      })
}

const totalStudentCount =
  computed(() => {

    return classes.value.reduce(
      (total, classItem) => {

        return total +
          Number(
            classItem.studentCount || 0
          )
      },
      0
    )
  })

const selectedClassStudentCount =
  computed(() => {

    if (
      form.audienceType !==
      'specific_classes'
    ) {
      return 0
    }

    const selectedIds =
      form.classIds.map(Number)

    return classes.value
      .filter((classItem) => {

        return selectedIds.includes(
          Number(classItem.id)
        )
      })
      .reduce(
        (total, classItem) => {

          return total +
            Number(
              classItem.studentCount || 0
            )
        },
        0
      )
  })

const recipientCount =
  computed(() => {
    if (
      form.audienceType ===
      'all_parents'
    ) {
      return totalStudentCount.value
    }

    if (
      form.audienceType ===
      'specific_classes'
    ) {
      return selectedClassStudentCount.value
    }

    if (
      form.audienceType ===
      'specific_students'
    ) {
      return form.studentIds.length
    }

    if (
      form.audienceType ===
      'all_staff'
    ) {
      return staffMembers.value.filter(
        (staffMember) => {
          return Boolean(
            normalizePhoneNumber(
              staffMember.phoneNumber
            )
          )
        }
      ).length
    }

    if (
      form.audienceType ===
      'specific_staff'
    ) {
      const selectedIds =
        form.staffIds.map(
          Number
        )

      return staffMembers.value.filter(
        (staffMember) => {
          return (
            selectedIds.includes(
              Number(
                staffMember.id
              )
            ) &&
            Boolean(
              normalizePhoneNumber(
                staffMember.phoneNumber
              )
            )
          )
        }
      ).length
    }

    if (
      form.audienceType ===
      'custom_numbers'
    ) {
      return validCustomNumbers.value
        .length
    }

    return 0
  })






const messageLength =
  computed(() => {

    return form.message.length
  })

const isUnicodeMessage =
  computed(() => {

    if (!form.message) {
      return false
    }

    return !isGsmMessage(
      form.message
    )
  })

const segmentCount =
  computed(() => {

    return countMessageSegments(
      form.message
    )
  })

const estimatedCreditCost =
  computed(() => {

    return recipientCount.value *
      segmentCount.value
  })

const hasApprovedSenderId =
  computed(() => {

    const status =
      String(
        senderIdStatus.value || ''
      )
        .trim()
        .toLowerCase()

    const approvedSenderId =
      String(
        senderId.value || ''
      )
        .trim()

    return (
      status === 'approved' &&
      approvedSenderId.length > 0
    )
  })

const senderIdStatusClass =
  computed(() => {

    return normalizeStatus(
      senderIdStatus.value
    )
  })





const hasValidAudience =
  computed(() => {
    if (
      form.audienceType ===
      'all_parents'
    ) {
      return true
    }

    if (
      form.audienceType ===
      'specific_classes'
    ) {
      return (
        form.classIds.length > 0
      )
    }

    if (
      form.audienceType ===
      'specific_students'
    ) {
      return (
        Number(
          form.studentClassId
        ) > 0 &&
        form.studentIds.length > 0
      )
    }

    if (
      form.audienceType ===
      'all_staff'
    ) {
      return (
        recipientCount.value > 0
      )
    }

    if (
      form.audienceType ===
      'specific_staff'
    ) {
      return (
        form.staffIds.length > 0 &&
        recipientCount.value > 0
      )
    }

    if (
      form.audienceType ===
      'custom_numbers'
    ) {
      return (
        validCustomNumbers.value
          .length > 0 &&
        invalidCustomNumbers.value
          .length === 0
      )
    }

    return false
  })

const hasInsufficientBalance =
  computed(() => {

    return estimatedCreditCost.value >
      smsBalance.value
  })

const projectedSmsBalance =
  computed(() => {

    return Math.max(
      0,
      smsBalance.value -
        estimatedCreditCost.value
    )
  })

const allClassesSelected =
  computed(() => {

    return (
      classes.value.length > 0 &&
      form.classIds.length ===
        classes.value.length
    )
  })


const audienceLabel =
  computed(() => {
    if (
      form.audienceType ===
      'all_parents'
    ) {
      return 'All Parents'
    }

    if (
      form.audienceType ===
      'specific_classes'
    ) {
      return `${
        form.classIds.length
      } selected classes`
    }

    if (
      form.audienceType ===
      'specific_students'
    ) {
      return `${
        form.studentIds.length
      } selected students`
    }

    if (
      form.audienceType ===
      'all_staff'
    ) {
      return 'All Staff'
    }

    if (
      form.audienceType ===
      'specific_staff'
    ) {
      return `${
        form.staffIds.length
      } selected staff`
    }

    if (
      form.audienceType ===
      'custom_numbers'
    ) {
      return `${
        validCustomNumbers.value
          .length
      } custom numbers`
    }

    return `${names.slice(0, 2).join(', ')} and ${names.length - 2} more`
  })








const canOpenConfirmation =
  computed(() => {

    return (
      !sending.value &&
      hasApprovedSenderId.value &&
      hasValidAudience.value &&
      form.message.trim().length > 0 &&
      recipientCount.value > 0 &&
      segmentCount.value > 0 &&
      estimatedCreditCost.value > 0 &&
      smsBalance.value >=
        estimatedCreditCost.value
    )
  })

function getTenantCode() {

  return localStorage.getItem(
    'tenantCode'
  ) || ''
}

function normalizeStatus(value) {

  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\s+/g, '-')
}

function isGsmMessage(message) {

  if (!message) {
    return true
  }

  return [...message].every(
    (character) => {

      return character
        .codePointAt(0) <= 127
    }
  )
}

function countMessageSegments(message) {

  const normalizedMessage =
    String(message || '')

  if (!normalizedMessage.trim()) {
    return 0
  }

  const unicode =
    !isGsmMessage(
      normalizedMessage
    )

  if (unicode) {

    if (
      normalizedMessage.length <= 70
    ) {
      return 1
    }

    return Math.ceil(
      normalizedMessage.length / 67
    )
  }

  if (
    normalizedMessage.length <= 160
  ) {
    return 1
  }

  return Math.ceil(
    normalizedMessage.length / 153
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
    return value
  }

  return date.toLocaleString()
}

function selectAudience(
  type
) {
  form.audienceType =
    type

  form.classIds = []
  form.studentClassId = null
  form.studentIds = []
  form.staffIds = []
  form.customNumbers = ''

  students.value = []
  staffSearch.value = ''
}
function toggleAllClasses() {

  if (allClassesSelected.value) {

    form.classIds = []

    return
  }

  form.classIds =
    classes.value.map(
      (classItem) => {

        return Number(
          classItem.id
        )
      }
    )
}

function normalizeSelectedClassIds() {

  form.classIds =
    [...new Set(form.classIds)]
      .map(Number)
      .filter((id) => {

        return (
          Number.isInteger(id) &&
          id > 0
        )
      })
}

function openSendConfirmation() {

  if (!canOpenConfirmation.value) {
    return
  }

  confirmationVisible.value =
    true
}

function closeSendConfirmation() {

  if (sending.value) {
    return
  }

  confirmationVisible.value =
    false
}

function resetForm() {
  form.audienceType =
    'all_parents'

  form.classIds = []
  form.studentClassId = null
  form.studentIds = []
  form.staffIds = []
  form.customNumbers = ''
  form.message = ''
  form.description = ''

  students.value = []
  staffSearch.value = ''

  confirmationVisible.value =
    false
}





const loadClasses =
  async () => {

    const tenantCode =
      getTenantCode()

    if (!tenantCode) {

      classes.value = []

      return
    }

    try {

      classesLoading.value =
        true

      const response =
        await get_classes_with_student_count()



      classes.value =
        Array.isArray(response.data)
          ? response.data
              .filter((classItem) => {

                return (
                  classItem.is_active ===
                  true
                )
              })
              .map((classItem) => {

                return {
                  ...classItem,

                  id:
                    Number(
                      classItem.id
                    ),

                  studentCount:
                    Number(
                      classItem
                        .studentCount || 0
                    ),
                }
              })
          : []

    } catch (error) {



      classes.value = []

      toast.error(
        error?.response?.data
          ?.message ||
          'Failed to load classes.'
      )

    } finally {

      classesLoading.value =
        false
    }
  }

const loadWallet =
  async () => {

    const tenantCode =
      getTenantCode()

    if (!tenantCode) {

      smsBalance.value = 0

      return
    }

    try {

      const response =
        await getClientSmsWallet(
          tenantCode
        )



      smsBalance.value =
        Number(
          response.data
            ?.smsBalance || 0
        )

    } catch (error) {



      smsBalance.value = 0

      toast.error(
        error?.response?.data
          ?.message ||
          'Failed to load SMS balance.'
      )
    }
  }

const loadSenderId =
  async () => {

    const tenantCode =
      getTenantCode()

    if (!tenantCode) {

      senderId.value = ''

      senderIdStatus.value =
        'Not requested'

      return
    }

    try {

      const response =
        await getLatestSenderId(
          tenantCode
        )



      const data =
        response.data

      if (
        !data?.available ||
        !data?.senderId
      ) {

        senderId.value = ''

        senderIdStatus.value =
          'Not requested'

        return
      }

      senderId.value =
        String(
          data.senderId || ''
        )

      senderIdStatus.value =
        String(
          data.status || 'Pending'
        )

    } catch (error) {


      senderId.value = ''

      senderIdStatus.value =
        'Not requested'

      toast.error(
        error?.response?.data
          ?.message ||
          'Failed to load sender ID.'
      )
    }
  }

const loadAnnouncementHistory =
  async () => {

    const tenantCode =
      getTenantCode()

    if (!tenantCode) {
      return
    }

    try {

      historyLoading.value =
        true

      const response =
        await getAnnouncementHistory(
          tenantCode
        )

      announcements.value =
        Array.isArray(response.data)
          ? response.data
          : []

    } catch (error) {



      announcements.value = []

      toast.error(
        error?.response?.data
          ?.message ||
          'Failed to load announcement history.'
      )

    } finally {

      historyLoading.value =
        false
    }
  }

const sendAnnouncement =
  async () => {

    const tenantCode =
      getTenantCode()

    if (!tenantCode) {

      toast.error(
        'Tenant code not found.'
      )

      return
    }

    if (!canOpenConfirmation.value) {
      return
    }

    try {

      sending.value = true

     const response =
  await sendParentAnnouncement({
    tenantCode:
      tenantCode,

    audienceType:
      form.audienceType,

    classIds:
      form.audienceType ===
      'specific_classes'
        ? form.classIds.map(
            Number
          )
        : [],

    studentIds:
      form.audienceType ===
      'specific_students'
        ? form.studentIds.map(
            Number
          )
        : [],

    staffIds:
      form.audienceType ===
      'specific_staff'
        ? form.staffIds.map(
            Number
          )
        : [],

    customNumbers:
      form.audienceType ===
      'custom_numbers'
        ? validCustomNumbers.value
        : [],

    message:
      form.message.trim(),

    description:
      form.description.trim() ||
      null,
  })


      if (!response.data?.success) {

        toast.error(
          response.data?.message ||
            'Unable to send announcement.'
        )

        return
      }

      toast.success(
        response.data?.message ||
          'Parent announcement sent successfully.'
      )

      resetForm()

      await Promise.all([
        loadWallet(),
        loadAnnouncementHistory(),
      ])

    } catch (error) {



      toast.error(
        error?.response?.data
          ?.message ||
          'Unable to send parent announcement.'
      )

    } finally {

      sending.value = false
    }
  }

onMounted(
  async () => {

    const tenantCode =
      getTenantCode()

    if (!tenantCode) {

      toast.error(
        'Tenant code not found.'
      )

      return
    }

    await Promise.all([
      loadClasses(),
      loadWallet(),
      loadSenderId(),
      loadAnnouncementHistory(),
      loadStaffMembers(),
    ])
  }
)
</script>






<style scoped>


.staff-option {
  position: relative;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.85rem;
  background: #ffffff;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

.staff-option:hover:not(.unavailable) {
  border-color: #93c5fd;
  background: #f8fbff;
  transform: translateY(-1px);
}

.staff-option.selected {
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow:
    0 0 0 2px rgb(37 99 235 / 8%);
}

.staff-option.unavailable {
  cursor: not-allowed;
  opacity: 0.58;
  background: #f8fafc;
}

.staff-option input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: 0;
  padding: 0;
  overflow: hidden;
  border: 0;
  opacity: 0;
  pointer-events: none;
}

.checkbox-box {
  width: 1.35rem;
  height: 1.35rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 1.35rem;
  border: 1.5px solid #cbd5e1;
  border-radius: 0.4rem;
  background: #ffffff;
  color: transparent;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

.checkbox-box.checked,
.staff-option.selected .checkbox-box {
  border-color: #2563eb;
  background: #2563eb;
  color: #ffffff;
  box-shadow:
    0 0 0 3px rgb(37 99 235 / 12%);
  transform: scale(1.03);
}

.checkbox-box .pi {
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 800;
  line-height: 1;
}

.staff-option.unavailable .checkbox-box {
  border-color: #dbe3ef;
  background: #e2e8f0;
  color: #94a3b8;
}

.staff-option:focus-within {
  outline: 3px solid rgb(37 99 235 / 18%);
  outline-offset: 2px;
}



.compact-history-table th.audience-column,
.compact-history-table td.audience-column,
.audience-column {
  text-align: left;
}

.audience-column .audience-badge {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  text-align: left;
}





.audience-icon.staff {
  background: #f3e8ff;
  color: #7c3aed;
}

.audience-icon.custom {
  background: #ecfdf3;
  color: #15803d;
}

.staff-selection-field,
.custom-number-field {
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  background: #fbfcfe;
}

.staff-search {
  position: relative;
  margin-top: 0.8rem;
}

.staff-search > i {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  color: #94a3b8;
  transform: translateY(-50%);
}

.staff-search input {
  width: 100%;
  min-height: 2.8rem;
  padding: 0.7rem 0.85rem 0.7rem 2.5rem;
  border: 1px solid #dbe3ef;
  border-radius: 0.8rem;
  outline: none;
  background: #ffffff;
}

.staff-search input:focus {
  border-color: #2563eb;
  box-shadow:
    0 0 0 3px rgb(37 99 235 / 10%);
}

.staff-selection-list {
  max-height: 24rem;
  display: grid;
  grid-template-columns:
    repeat(
      2,
      minmax(0, 1fr)
    );
  gap: 0.65rem;
  margin-top: 0.8rem;
  overflow-y: auto;
}

.staff-option {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.85rem;
  background: #ffffff;
  cursor: pointer;
}

.staff-option.selected {
  border-color: #2563eb;
  background: #eff6ff;
}

.staff-option input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.staff-avatar {
  width: 2.4rem;
  height: 2.4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 2.4rem;
  border-radius: 0.75rem;
  background: #ede9fe;
  color: #7c3aed;
  font-size: 0.72rem;
  font-weight: 800;
}

.staff-option-details {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.staff-option-details strong {
  overflow: hidden;
  color: #1e293b;
  font-size: 0.78rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.staff-option-details small {
  margin-top: 0.12rem;
  color: #64748b;
  font-size: 0.65rem;
}

.staff-option-details > span {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.25rem;
  color: #64748b;
  font-size: 0.65rem;
}

.missing-phone-badge {
  padding: 0.3rem 0.45rem;
  border-radius: 999px;
  background: #fef2f2;
  color: #dc2626;
  font-size: 0.56rem;
  font-weight: 800;
}

.custom-number-heading {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  margin-bottom: 0.8rem;
}

.custom-number-icon {
  width: 2.4rem;
  height: 2.4rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 2.4rem;
  border-radius: 0.75rem;
  background: #dcfce7;
  color: #15803d;
}

.custom-number-heading > div {
  display: flex;
  flex-direction: column;
}

.custom-number-heading label {
  margin: 0;
}

.custom-number-heading small {
  margin-top: 0.15rem;
  color: #64748b;
  font-size: 0.68rem;
}

.custom-number-field textarea {
  width: 100%;
  padding: 0.8rem;
  resize: vertical;
  border: 1px solid #dbe3ef;
  border-radius: 0.85rem;
  outline: none;
  background: #ffffff;
  line-height: 1.55;
}

.custom-number-field textarea:focus {
  border-color: #2563eb;
  box-shadow:
    0 0 0 3px rgb(37 99 235 / 10%);
}

.custom-number-summary {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-top: 0.6rem;
  color: #15803d;
  font-size: 0.7rem;
  font-weight: 700;
}

.invalid-number-count {
  color: #dc2626;
}

.invalid-number-list {
  margin-top: 0.65rem;
  padding: 0.7rem;
  border: 1px solid #fecaca;
  border-radius: 0.75rem;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 0.68rem;
  line-height: 1.5;
}

.invalid-number-list strong {
  display: block;
  margin-bottom: 0.2rem;
}

.selection-warning {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-top: 0.65rem;
  color: #d97706;
}

@media (max-width: 900px) {
  .audience-options {
    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );
  }

  .staff-selection-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .audience-options {
    grid-template-columns: 1fr;
  }
}



.copy-header,
.copy-column {
  width: 7rem;
  text-align: center;
  white-space: nowrap;
}

.copy-message-btn {
  min-width: 5.5rem;
  min-height: 2.3rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.45rem 0.7rem;
  border: 1px solid #dbe3ef;
  border-radius: 0.7rem;
  background: #ffffff;
  color: #2563eb;
  font-size: 0.72rem;
  font-weight: 750;
  cursor: pointer;
  box-shadow:
    0 2px 7px rgb(15 23 42 / 6%);
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    color 0.15s ease,
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.copy-message-btn:hover:not(:disabled) {
  border-color: #2563eb;
  background: #eff6ff;
  color: #1d4ed8;
  transform: translateY(-1px);
  box-shadow:
    0 5px 12px rgb(37 99 235 / 12%);
}

.copy-message-btn.copied {
  border-color: #86efac;
  background: #f0fdf4;
  color: #15803d;
  box-shadow:
    0 4px 10px rgb(22 163 74 / 10%);
}

.copy-message-btn:focus-visible {
  outline: 3px solid rgb(37 99 235 / 18%);
  outline-offset: 2px;
}

.copy-message-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  transform: none;
  box-shadow: none;
}

.copy-message-btn .pi {
  font-size: 0.78rem;
}



.student-class-field {
  padding: 20px;
  border: 2px solid #3b82f6;
  border-radius: 16px;
  background:
    linear-gradient(
      135deg,
      #eff6ff 0%,
      #ffffff 100%
    );
  box-shadow:
    0 8px 24px rgba(59, 130, 246, 0.1);
}

.student-class-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.student-class-header label {
  display: block;
  margin-bottom: 4px;
  color: #172554;
  font-size: 16px;
  font-weight: 700;
}

.student-class-header small {
  display: block;
  color: #64748b;
  font-size: 13px;
  line-height: 1.45;
}

.student-class-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 46px;
  width: 46px;
  height: 46px;
  border-radius: 13px;
  background: #2563eb;
  color: #ffffff;
  font-size: 19px;
  box-shadow:
    0 6px 14px rgba(37, 99, 235, 0.25);
}

.student-class-select-wrapper {
  position: relative;
  width: 100%;
}

.student-class-select {
  width: 100%;
  min-height: 56px;
  padding:
    0 48px
    0 48px;
  border: 2px solid #bfdbfe;
  border-radius: 13px;
  outline: none;
  appearance: none;
  background: #ffffff;
  color: #172554;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.student-class-select:hover:not(:disabled) {
  border-color: #60a5fa;
}

.student-class-select:focus {
  border-color: #2563eb;
  box-shadow:
    0 0 0 4px rgba(37, 99, 235, 0.14);
}

.student-class-select:disabled {
  cursor: not-allowed;
  background: #f1f5f9;
  color: #94a3b8;
}

.select-leading-icon {
  position: absolute;
  top: 50%;
  left: 17px;
  z-index: 2;
  color: #2563eb;
  font-size: 18px;
  pointer-events: none;
  transform: translateY(-50%);
}

.select-arrow {
  position: absolute;
  top: 50%;
  right: 17px;
  z-index: 2;
  color: #2563eb;
  font-size: 14px;
  pointer-events: none;
  transform: translateY(-50%);
}

.class-select-notice,
.class-select-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 13px;
}

.class-select-notice {
  border: 1px solid #fde68a;
  background: #fffbeb;
  color: #92400e;
}

.class-select-status {
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
}

.student-list-field {
  margin-top: 16px;
  padding: 20px;
  border: 1px solid #dbeafe;
  border-radius: 16px;
  background: #ffffff;
}

.student-selection-help {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  color: #b45309;
}


.history-card {
  padding: 20px;
  border-radius: 20px;
}

.compact-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
}

.compact-history-header h2 {
  margin: 7px 0 0;
  color: #111827;
  font-size: 19px;
  font-weight: 950;
}

.compact-history-header p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.4;
}

.compact-refresh-btn {
  min-height: 38px;
  padding: 0 13px;
  border-radius: 10px;
  font-size: 12px;
}

.compact-empty-state {
  padding: 18px;
  font-size: 13px;
}








.compact-history-wrapper {
  width: 100%;
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 13px;
}

.compact-history-table {
  width: 100%;
  min-width: 850px;
  border-collapse: collapse;
  table-layout: fixed;
}

.compact-history-table thead {
  color: #ffffff;
  background: #0f2742;
}

.compact-history-table th {
  padding: 9px 8px;
  border: none;
  font-size: 10px;
  font-weight: 900;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.compact-history-table td {
  padding: 8px;
  border-bottom: 1px solid #eef2f7;
  color: #334155;
  font-size: 11px;
  line-height: 1.3;
  vertical-align: middle;
}

.compact-history-table tbody tr:nth-child(even) {
  background: #f8fafc;
}

.compact-history-table tbody tr:hover {
  background: #fff8e7;
}

.compact-history-table tbody tr:last-child td {
  border-bottom: none;
}

.compact-history-table th:nth-child(1),
.compact-history-table td:nth-child(1) {
  width: 100px;
}

.compact-history-table th:nth-child(2),
.compact-history-table td:nth-child(2) {
  width: 85px;
  text-align: center;
}

.compact-history-table th:nth-child(3),
.compact-history-table td:nth-child(3) {
  width: 80px;
  text-align: center;
}

.compact-history-table th:nth-child(4),
.compact-history-table td:nth-child(4) {
  width: 120px;
}

.compact-history-table th:nth-child(5),
.compact-history-table td:nth-child(5) {
  width: 130px;
}

.compact-history-table th:nth-child(6),
.compact-history-table td:nth-child(6) {
  width: 170px;
}

.compact-history-table th:nth-child(7),
.compact-history-table td:nth-child(7) {
  width: auto;
}

.date-column {
  color: #475569;
  font-weight: 700;
  white-space: nowrap;
}

.recipient-column,
.status-column {
  white-space: nowrap;
}

.recipient-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 7px;
  border-radius: 7px;
  color: #1e40af;
  background: #dbeafe;
  font-size: 10px;
  font-weight: 900;
}

.recipient-badge i {
  font-size: 10px;
}

.audience-badge {
  display: inline-flex;
  padding: 4px 7px;
  border-radius: 7px;
  color: #475569;
  background: #e2e8f0;
  font-size: 10px;
  font-weight: 800;
  white-space: nowrap;
}

.classes-column,
.description-column,
.message-column {
  overflow: hidden;
}

.compact-cell-text,
.compact-message-text {
  display: block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact-status-pill {
  display: inline-flex;
  padding: 4px 7px;
  font-size: 10px;
  white-space: nowrap;
}

.status-pill.sent {
  color: #047857;
  background: #d1fae5;
}

.status-pill.failed {
  color: #b91c1c;
  background: #fee2e2;
}

.status-pill.pending {
  color: #1d4ed8;
  background: #dbeafe;
}

.status-pill.partial {
  color: #b45309;
  background: #fef3c7;
}

@media (max-width: 720px) {
  .compact-history-table {
    min-width: 780px;
  }
}

















  .compact-history-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .compact-refresh-btn {
    width: auto;
  }



.announcement-page {
  display: grid;
  gap: 24px;
}

.send-requirements {
  margin-top: 10px;
  padding: 11px 14px;
  border: 1px solid #fed7aa;
  border-radius: 12px;
  color: #9a3412;
  background: #fff7ed;
}

.send-requirements small {
  display: block;
  font-size: 13px;
  line-height: 1.5;
}

.announcement-hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 34px;
  border-radius: 30px;
  color: #ffffff;
  background:
    radial-gradient(
      circle at top left,
      rgba(245, 213, 140, 0.26),
      transparent 36%
    ),
    linear-gradient(
      135deg,
      #071926,
      #0f2742
    );
  box-shadow:
    0 24px 70px rgba(15, 23, 42, 0.18);
}

.hero-badge,
.section-label {
  display: inline-flex;
  width: fit-content;
  color: #071926;
  background: #f5d58c;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.hero-badge {
  margin-bottom: 14px;
  padding: 8px 14px;
  border-radius: 999px;
}

.section-label {
  margin-bottom: 10px;
  padding: 6px 10px;
  border-radius: 999px;
}

.announcement-hero h1 {
  margin: 0;
  color: papayawhip;
  font-size: 39px;
  font-weight: 950;
  letter-spacing: -0.04em;
}

.announcement-hero p {
  max-width: 700px;
  margin: 12px 0 0;
  color: rgba(255, 255, 255, 0.78);
  line-height: 1.7;
}

.hero-balance {
  min-width: 250px;
  align-self: stretch;
  display: grid;
  align-content: center;
  gap: 8px;
  padding: 24px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.1);
  border:
    1px solid rgba(255, 255, 255, 0.18);
}

.hero-balance span,
.hero-balance small {
  color: rgba(255, 255, 255, 0.76);
}

.hero-balance strong {
  color: #f5d58c;
  font-size: 40px;
  font-weight: 950;
}

.summary-grid {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.summary-card,
.announcement-card,
.side-card {
  border: 1px solid #eef2f7;
  background: #ffffff;
  box-shadow:
    0 15px 45px rgba(15, 23, 42, 0.07);
}

.summary-card {
  padding: 22px;
  border-radius: 22px;
}

.summary-card > span {
  color: #64748b;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.summary-card > strong {
  display: block;
  margin: 8px 0 3px;
  color: #111827;
  font-size: 25px;
  font-weight: 950;
}

.summary-card > small {
  color: #64748b;
  text-transform: capitalize;
}

.summary-card > small.approved {
  color: #047857;
}

.summary-card > small.pending {
  color: #b45309;
}

.summary-card > small.rejected {
  color: #b91c1c;
}

.announcement-layout {
  display: grid;
  grid-template-columns:
    minmax(0, 1.65fr)
    minmax(280px, 0.75fr);
  gap: 24px;
  align-items: start;
}

.announcement-card {
  padding: 27px;
  border-radius: 27px;
}

.side-column {
  display: grid;
  gap: 20px;
}

.side-card {
  padding: 23px;
  border-radius: 23px;
}

.card-header {
  margin-bottom: 24px;
}

.card-header h2,
.side-card h3,
.confirmation-modal h3 {
  margin: 0;
  color: #111827;
  font-weight: 950;
}

.card-header h2 {
  font-size: 22px;
}

.side-card h3 {
  font-size: 18px;
}

.card-header p {
  margin: 7px 0 0;
  color: #64748b;
  line-height: 1.65;
}

.field {
  display: grid;
  gap: 9px;
  margin-bottom: 21px;
}

.field label {
  color: #374151;
  font-size: 13px;
  font-weight: 900;
}

.field input,
.field textarea {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 15px;
  outline: none;
  color: #111827;
  background: #ffffff;
  font-family: inherit;
  transition: 0.2s ease;
}

.field input {
  height: 49px;
  padding: 0 14px;
}

.field textarea {
  min-height: 155px;
  padding: 14px;
  resize: vertical;
  line-height: 1.6;
}

.field input:focus,
.field textarea:focus {
  border-color: #c99635;
  box-shadow:
    0 0 0 4px rgba(201, 150, 53, 0.13);
}

.field-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.character-count,
.field-help,
.message-information {
  color: #64748b;
  font-size: 12px;
}

.character-count.danger {
  color: #b91c1c;
  font-weight: 900;
}

.message-information {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}








.audience-options {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 13px;
}

.audience-option {
  display: flex;
  gap: 13px;
  align-items: center;
  min-height: 92px;
  padding: 15px;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  color: #374151;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
  transition: 0.22s ease;
}

.audience-option:hover {
  transform: translateY(-1px);
  border-color: #d6b66d;
}

.audience-option.selected {
  border-color: #c99635;
  background: #fff8e7;
  box-shadow:
    0 0 0 3px rgba(201, 150, 53, 0.11);
}

.audience-icon {
  width: 43px;
  height: 43px;
  flex: 0 0 43px;
  display: grid;
  place-items: center;
  border-radius: 13px;
  color: #071926;
  background: #f5d58c;
  font-size: 17px;
}

.audience-option strong,
.audience-option small {
  display: block;
}

.audience-option strong {
  color: #111827;
  font-size: 14px;
  font-weight: 950;
}

.audience-option small {
  margin-top: 4px;
  color: #64748b;
  line-height: 1.45;
}

.text-btn {
  border: none;
  color: #9a6b14;
  background: transparent;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
}

.class-grid {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.class-option {
  display: flex;
  gap: 11px;
  align-items: center;
  padding: 13px;
  border: 1px solid #e5e7eb;
  border-radius: 15px;
  cursor: pointer;
  transition: 0.2s ease;
}

.class-option.selected {
  border-color: #c99635;
  background: #fff8e7;
}

.class-option input {
  display: none;
}

.checkbox-box {
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  display: grid;
  place-items: center;
  border: 2px solid #cbd5e1;
  border-radius: 7px;
  color: #071926;
  background: #ffffff;
  font-size: 10px;
}

.class-option.selected .checkbox-box {
  border-color: #c99635;
  background: #f5d58c;
}

.class-option strong,
.class-option small {
  display: block;
}

.class-option strong {
  color: #111827;
  font-size: 13px;
  font-weight: 900;
}

.class-option small {
  margin-top: 3px;
  color: #64748b;
  font-size: 11px;
}

.small-state,
.preview-loading,
.empty-state {
  padding: 22px;
  border-radius: 16px;
  color: #64748b;
  background: #f8fafc;
  text-align: center;
}

.send-summary {
  display: grid;
  grid-template-columns:
    repeat(4, minmax(0, 1fr));
  gap: 11px;
  margin-bottom: 18px;
}

.send-summary > div,
.estimate-list > div,
.confirmation-details > div {
  padding: 13px;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  background: #f8fafc;
}

.send-summary span,
.estimate-list span,
.confirmation-details span,
.confirmation-message span {
  display: block;
  color: #64748b;
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.send-summary strong,
.estimate-list strong,
.confirmation-details strong {
  display: block;
  margin-top: 6px;
  color: #111827;
  font-weight: 950;
}

.warning-box {
  display: flex;
  gap: 13px;
  margin-bottom: 17px;
  padding: 15px;
  border: 1px solid #fed7aa;
  border-radius: 16px;
  color: #9a3412;
  background: #fff7ed;
}

.warning-box i {
  margin-top: 2px;
}

.warning-box strong {
  display: block;
}

.warning-box p {
  margin: 4px 0 0;
  line-height: 1.5;
}

.form-actions,
.modal-actions {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 12px;
  margin-top: 23px;
}

.primary-btn,
.secondary-btn,
.confirm-send-btn,
.refresh-btn {
  min-height: 47px;
  border: none;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 950;
  cursor: pointer;
  transition: 0.22s ease;
}

.primary-btn,
.confirm-send-btn {
  color: #071926;
  background:
    linear-gradient(
      135deg,
      #f5d58c,
      #c99635
    );
}

.secondary-btn {
  color: #374151;
  background: #f1f5f9;
}

.refresh-btn {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 0 16px;
  color: #071926;
  background: #f5d58c;
}

.primary-btn:hover,
.confirm-send-btn:hover,
.secondary-btn:hover,
.refresh-btn:hover {
  transform: translateY(-1px);
}

.primary-btn:disabled,
.confirm-send-btn:disabled,
.secondary-btn:disabled,
.refresh-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.rules-list {
  display: grid;
  gap: 14px;
  margin: 18px 0 0;
  padding: 0;
  list-style: none;
}

.rules-list li {
  display: flex;
  gap: 10px;
  color: #475569;
  line-height: 1.5;
}

.rules-list i {
  margin-top: 3px;
  color: #059669;
}

.estimate-list {
  display: grid;
  gap: 9px;
  margin-top: 17px;
}

.estimate-list > div {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.estimate-list strong {
  margin-top: 0;
}

.history-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
}

.history-wrapper {
  display: grid;
  gap: 8px;
  overflow-x: auto;
}

.history-row {
  min-width: 1350px;
  display: grid;
  grid-template-columns:
    0.8fr
    1fr
    1.4fr
    1.5fr
    2fr
    0.7fr
    0.7fr
    0.7fr;
  gap: 13px;
  align-items: center;
  padding: 14px 15px;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  background: #f8fafc;
}


.history-head {
  color: #ffffff;
  background: #0f2742;
  border-color: #0f2742;
  font-size: 11px;
  font-weight: 950;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.message-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-pill {
  display: inline-flex;
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 950;
  text-transform: capitalize;
}

.status-pill.sent {
  color: #047857;
  background: #d1fae5;
}

.status-pill.failed {
  color: #b91c1c;
  background: #fee2e2;
}

.status-pill.partial {
  color: #b45309;
  background: #fef3c7;
}

.status-pill.pending {
  color: #1d4ed8;
  background: #dbeafe;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.58);
  backdrop-filter: blur(6px);
}

.confirmation-modal {
  width: min(535px, 100%);
  max-height: 92vh;
  overflow-y: auto;
  padding: 29px;
  border-radius: 27px;
  background: #ffffff;
  box-shadow:
    0 35px 100px rgba(15, 23, 42, 0.3);
  text-align: center;
}

.confirmation-icon {
  width: 57px;
  height: 57px;
  margin: 0 auto 15px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #071926;
  background: #f5d58c;
  font-size: 21px;
}

.confirmation-modal > p {
  margin: 10px 0 20px;
  color: #64748b;
  line-height: 1.6;
}

.confirmation-details {
  display: grid;
  grid-template-columns:
    repeat(2, minmax(0, 1fr));
  gap: 10px;
  text-align: left;
}

.confirmation-message {
  margin-top: 12px;
  padding: 15px;
  border: 1px solid #eef2f7;
  border-radius: 15px;
  background: #f8fafc;
  text-align: left;
}

.confirmation-message p {
  margin: 7px 0 0;
  color: #334155;
  line-height: 1.6;
  white-space: pre-wrap;
}

@media (max-width: 1100px) {
  .announcement-hero {
    flex-direction: column;
  }

  .summary-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

  .announcement-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .announcement-hero {
    padding: 24px;
  }

  .announcement-hero h1 {
    font-size: 30px;
  }



  .summary-grid,
  .audience-options,
  .class-grid,
  .send-summary,
  .confirmation-details,
  .form-actions,
  .modal-actions {
    grid-template-columns: 1fr;
  }

  .announcement-card,
  .side-card {
    padding: 21px;
  }

  .history-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .message-information {
    flex-direction: column;
  }
}
</style>
