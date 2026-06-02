import { computed, nextTick, ref, watch } from 'vue'
import type { GristRecord, Action } from '../types/document-schema'
import { GristRecordSchema } from '../types/document-schema'
import { grist, isGristMocked, resolveProviderLogoUrl } from '../utils/grist'

// App state
const record = ref<GristRecord | null>(null)
const rawGristData = ref<unknown>(null)
const error = ref<string | null>(null)
const isLoading = ref(true)

// Action state
const isExecutingAction = ref(false)

export function useAppState() {
  // Derive actions data from the record
  const actionsData = computed(() => {
    return record.value?.Record?.Actions_Data ?? null
  })

  // Execute an action (create records from Actions_Data)
  async function executeAction(action: Action): Promise<void> {
    if (isExecutingAction.value) return
    isExecutingAction.value = true
    try {
      const tbl = grist.getTable(action.table)
      const result = await tbl.create({ fields: action.record })
      const newId = result.id

      if (action.items?.records.length) {
        const itemTbl = grist.getTable(action.items.table)
        for (const item of action.items.records) {
          await itemTbl.create({ fields: { ...item, Document: newId } })
        }
      }

      const created = await grist.fetchSelectedRecord(newId)
      const docNumber = (created as Record<string, unknown>).Number ?? `#${newId}`
      alert(`✅ "${action.title}" completed: ${docNumber}`)
    } catch (err) {
      console.error('Failed to execute action:', err)
      alert(`❌ ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      isExecutingAction.value = false
    }
  }

  // Module-scoped flag to prevent duplicate initialization
  let gristInitialized = false

  // Initialize Grist integration (idempotent)
  const initializeGrist = async () => {
    if (gristInitialized) return
    gristInitialized = true

    grist.ready({ requiredAccess: 'full' })

    // Handle record data
    grist.onRecord(async function (recordData: unknown) {
      window.__bizdocgenReady = false
      try {
        rawGristData.value = recordData
        const validatedRecord = GristRecordSchema.parse(recordData)

        // Resolve provider logo from Grist attachment (widget mode only).
        // In headless mode the bot pre-resolves and injects Logo_Url, so we skip this.
        const attachmentId = validatedRecord.Record.Provider.Logo_Attachment_Id
        if (!isGristMocked && attachmentId) {
          const logoUrl = await resolveProviderLogoUrl(attachmentId)
          if (logoUrl) validatedRecord.Record.Provider.Logo_Url = logoUrl
        }

        record.value = validatedRecord
        error.value = null
        await nextTick()
        window.__bizdocgenReady = true
      } catch (err) {
        console.error('Invalid record data:', err)
        error.value = 'ข้อมูลไม่ถูกต้อง: ' + (err instanceof Error ? err.message : String(err))
        record.value = null
        rawGristData.value = null
      } finally {
        isLoading.value = false
      }
    })
  }

  // Watch for record changes to update document title
  watch(record, (r) => {
    if (r?.Record?.Number) {
      document.title = r.Record.Number
    }
  })

  return {
    // State
    record,
    rawGristData,
    error,
    isLoading,

    // Action state
    isExecutingAction,
    actionsData,

    // Actions
    initializeGrist,
    executeAction,
  }
}
