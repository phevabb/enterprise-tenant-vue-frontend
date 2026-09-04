<script setup>
import { ref } from 'vue'

import {
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
} from '@coreui/vue'

import TeacherAttendance from './TeacherAttendance.vue'
import AttendanceHistory from './AttendanceHistory.vue'

const activeView = ref('TAKE_ATTENDANCE')

function openTakeAttendance() {
  activeView.value = 'TAKE_ATTENDANCE'
}

function openAttendanceHistory() {
  activeView.value = 'ATTENDANCE_HISTORY'
}
</script>

<template>
  <div class="attendance-management">
    <CCard class="attendance-navigation-card mb-4">
      <CCardBody>
        <CButtonGroup>
          <CButton
            :color="
              activeView === 'TAKE_ATTENDANCE'
                ? 'primary'
                : 'light'
            "
            @click="openTakeAttendance"
          >
            Take attendance
          </CButton>

          <CButton
            :color="
              activeView === 'ATTENDANCE_HISTORY'
                ? 'primary'
                : 'light'
            "
            @click="openAttendanceHistory"
          >
            Attendance history
          </CButton>
        </CButtonGroup>
      </CCardBody>
    </CCard>

    <TeacherAttendance
      v-if="activeView === 'TAKE_ATTENDANCE'"
      @attendance-submitted="openAttendanceHistory"
    />

    <AttendanceHistory
      v-else
      @take-attendance="openTakeAttendance"
    />
  </div>
</template>

<style scoped>
.attendance-management {
  width: 100%;
}

.attendance-navigation-card {
  border: 1px solid #e5e9f2;
  border-radius: 1rem;
  box-shadow: 0 8px 25px rgba(31, 46, 86, 0.055);
}

.attendance-navigation-card :deep(.card-body) {
  display: flex;
  justify-content: center;
  padding: 0.75rem;
}

.attendance-navigation-card :deep(.btn-group) {
  display: flex;
  width: 100%;
  max-width: 520px;
  padding: 0.3rem;
  border-radius: 0.8rem;
  background: #f3f5fa;
}

.attendance-navigation-card :deep(.btn) {
  flex: 1;
  min-height: 42px;
  border: 0;
  border-radius: 0.65rem;
  font-size: 0.82rem;
  font-weight: 750;
}

@media (max-width: 575.98px) {
  .attendance-navigation-card :deep(.btn-group) {
    flex-direction: column;
  }
}
</style>
