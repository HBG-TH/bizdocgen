import type { GristRecord } from '../types/document-schema'
import type { DocumentViewModel, DisplayItem, PaymentInfo, BankInfo, ReferenceInfo } from '../types/view-model'
import { calculateSubtotal, sortItems } from './document'
import { aggregateVat, aggregateWht } from './tax'

const viewModelCache = new WeakMap<GristRecord, DocumentViewModel>()

export function getViewModel(record: GristRecord): DocumentViewModel {
  if (viewModelCache.has(record)) {
    return viewModelCache.get(record)!
  }

  const sortedItems = sortItems(record.Record.Items)
  const items: DisplayItem[] = sortedItems.map((item) => ({
    id: item.id.toString(),
    description: item.Description,
    quantity: item.Quantity,
    unitPrice: item.Unit_Price,
    discount: item.Discount,
    amtBVat: item.AMT_B_Vat,
    vatType: item.Vat_Type,
    vatAmount: item.Vat_Amount,
    whtAmount: item.Wht_amount,
    total: item.Total,
    sortOrder: item.Manual_Sort ?? 0,
  }))

  const subtotal = calculateSubtotal(record.Record.Items)
  const vatTotal = aggregateVat(record.Record.Items)
  const whtTotal = aggregateWht(record.Record.Items)
  const total = record.Record.Items.reduce((sum, item) => sum + item.Total, 0)

  const paymentMethod = record.Record.Payment_Method
  const bankDetails: BankInfo | null = paymentMethod
    ? {
        accountHolder: paymentMethod.Account_Holder ?? null,
        accountNumber: paymentMethod.Account_Number ?? null,
        bank: paymentMethod.Bank ?? null,
        branch: paymentMethod.Branch ?? null,
      }
    : null

  const paymentInfo: PaymentInfo = {
    promptPayId: paymentMethod?.PromptPay ?? null,
    bankDetails,
  }

  const reference: ReferenceInfo = {
    number: record.Record.Reference?.Number ?? null,
  }

  const viewModel: DocumentViewModel = {
    items,
    subtotal,
    vatTotal,
    whtTotal,
    total,
    paymentInfo,
    reference,
    creditTerm: record.Record.Credit_Term ?? null,
    remarks: record.Record.Remarks ?? null,
  }

  viewModelCache.set(record, viewModel)
  return viewModel
}
