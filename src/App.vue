<script setup lang="ts">
import { onMounted } from 'vue'
import ActionButtons from './components/ActionButtons.vue'
import PrintableDocument from './components/PrintableDocument.vue'
import { useAppState } from './composables/useAppState'

// Import fonts and styles
import '@fontsource/sarabun/400.css'
import '@fontsource/sarabun/500.css'
import '@fontsource/sarabun/600.css'
import '@fontsource/sarabun/700.css'
import '@fontsource/share-tech-mono/400.css'
import './styles/global.css'
import './styles/print.css'
import './styles/variables.css'

const {
  record,
  rawGristData,
  error,
  isLoading,
  isExecutingAction,
  actionsData,
  initializeGrist,
  executeAction,
} = useAppState()

function handleCopyJson() {
  if (rawGristData.value) {
    navigator.clipboard
      .writeText(JSON.stringify(rawGristData.value, null, 2))
      .then(() => {
        alert('JSON ถูกคัดลอกแล้ว')
      })
      .catch((err) => {
        console.error('Failed to copy JSON:', err)
        alert('ไม่สามารถคัดลอก JSON ได้')
      })
  }
}

onMounted(async () => {
  await initializeGrist()
})
</script>

<template>
  <div class="app" data-testid="app">
    <div
      v-if="isLoading"
      class="app__loading"
      data-testid="app-loading"
      role="status"
      aria-live="polite"
    >
      กำลังโหลดข้อมูล...
    </div>

    <div v-else-if="error" class="app__error" data-testid="app-error" role="alert">
      <h2>เกิดข้อผิดพลาด</h2>
      <p>{{ error }}</p>
    </div>

    <div v-else-if="record" class="app__content" data-testid="app-content" role="main">
      <ActionButtons
        :raw-grist-data="rawGristData"
        :disable-print="!!record.Record.Signed_Document_URL"
        :actions="actionsData?.actions ?? []"
        :is-executing="isExecutingAction"
        :on-execute-action="executeAction"
        :on-copy-json="handleCopyJson"
      />
      <div class="app__main-content">
        <template v-if="record.Record.Signed_Document_URL">
          <div
            class="app__signed"
            data-testid="signed-document"
            role="document"
            :data-document-number="record.Record.Number"
          >
            <p class="app__signed-text">เอกสารนี้ได้ถูกลงชื่อเรียบร้อยแล้ว</p>
            <a
              class="app__signed-link"
              :href="record.Record.Signed_Document_URL"
              target="_blank"
              rel="noopener noreferrer"
            >
              🔗 ดาวน์โหลดเอกสารที่ลงชื่อแล้ว
            </a>
          </div>
        </template>
        <template v-else>
          <PrintableDocument :record="record" />
        </template>
      </div>
    </div>

    <div v-else class="app__no-data">ไม่มีข้อมูลให้แสดง</div>
  </div>
</template>

<style>
.app {
  font-family: var(--font-family-system);
}

.app__loading,
.app__error,
.app__no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  text-align: center;
  padding: var(--spacing-xl);
}

.app__signed {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  text-align: center;
  gap: var(--spacing-md);
  background: white;
  border-radius: 8px;
  max-width: var(--document-width);
  margin: 0 auto;
}

.app__signed-text {
  color: var(--text-primary);
  font-size: var(--font-size-lg);
}

.app__signed-link {
  display: inline-block;
  padding: var(--button-padding);
  background-color: var(--primary-blue);
  color: white;
  border-radius: var(--border-radius);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
}

.app__signed-link:hover {
  background-color: var(--primary-blue-dark);
}

.app__loading {
  color: var(--text-secondary);
  font-size: var(--font-size-lg);
}

.app__error {
  color: var(--text-error);
}

.app__error h2 {
  margin: 0 0 var(--spacing-md) 0;
  font-size: var(--font-size-xl);
}

.app__error p {
  margin: 0;
  font-size: var(--font-size-base);
  max-width: 600px;
}

.app__no-data {
  color: var(--text-muted);
  font-size: var(--font-size-lg);
}
</style>
