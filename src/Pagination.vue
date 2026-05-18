<script setup>
import { computed } from "vue";

// ============================
// Props
// ============================
const props = defineProps({
  totalPages: {
    type: Number,
    required: true,
  },
  currentPage: {
    type: Number,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

// ============================
// Emits
// ============================
const emit = defineEmits(["page-changed"]);

// ============================
// Methods
// ============================
function changePage(page) {
  if (
    !props.disabled &&
    page >= 1 &&
    page <= props.totalPages &&
    page !== props.currentPage
  ) {
    emit("page-changed", page);
  }
}

// ============================
// Computed: Smart Pagination
// ============================
const pages = computed(() => {
  const total = props.totalPages;
  const current = props.currentPage;
  const delta = 2;
  const range = [];

  // ✅ handle small pages
  if (total <= 1) {
    return [1];
  }

  // Always show first
  range.push(1);

  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  // Left dots
  if (left > 2) {
    range.push("...");
  }

  // Middle pages
  for (let i = left; i <= right; i++) {
    if (i !== 1 && i !== total) {
      range.push(i);
    }
  }

  // Right dots
  if (right < total - 1) {
    range.push("...");
  }

  // Last page
  if (total > 1) {
    range.push(total);
  }

  return range;
});
</script>

<template>
  <!-- ✅ hide when only 1 page -->
  <div v-if="totalPages > 1" class="pagination">

    <!-- First -->
    <button
      class="pagination-btn"
      :disabled="currentPage === 1 || disabled"
      @click="changePage(1)"
    >
      First
    </button>

    <!-- Prev -->
    <button
      class="pagination-btn"
      :disabled="currentPage === 1 || disabled"
      @click="changePage(currentPage - 1)"
    >
      Prev
    </button>

    <!-- Pages -->
    <div
      v-for="(page, index) in pages"
      :key="index"
      @click="!disabled && page !== '...' && changePage(page)"
      :class="[
        'pagination-page',
        {
          active: page === currentPage,
          dots: page === '...'
        }
      ]"
    >
      {{ page }}
    </div>

    <!-- Next -->
    <button
      class="pagination-btn"
      :disabled="currentPage === totalPages || disabled"
      @click="changePage(currentPage + 1)"
    >
      Next
    </button>

    <!-- Last -->
    <button
      class="pagination-btn"
      :disabled="currentPage === totalPages || disabled"
      @click="changePage(totalPages)"
    >
      Last
    </button>
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.pagination-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: #f8f8f8;
  cursor: pointer;
  border-radius: 6px;
  transition: 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #007bff;
  color: white;
}

.pagination-btn:disabled {
  background: #eee;
  cursor: not-allowed;
}

.pagination-page {
  padding: 6px 12px;
  border: 1px solid #ddd;
  cursor: pointer;
  border-radius: 6px;
  min-width: 32px;
  text-align: center;
  transition: 0.2s;
}

.pagination-page:hover:not(.dots):not(.active) {
  background: #007bff;
  color: white;
}

.pagination-page.active {
  background: #007bff;
  color: white;
  font-weight: bold;
}

.pagination-page.dots {
  cursor: default;
  background: transparent;
  border: none;
}
</style>
