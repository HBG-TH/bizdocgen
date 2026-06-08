export interface DisplayItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  discount: number
  amtBVat: number
  vatType: string
  vatAmount: number
  whtAmount: number
  total: number
  sortOrder: number
}

export interface BankInfo {
  accountHolder: string | null
  accountNumber: string | null
  bank: string | null
  branch: string | null
}

export interface PaymentInfo {
  promptPayId: string | null
  bankDetails: BankInfo | null
}

export interface ReferenceInfo {
  number: string | null
}

export interface DocumentViewModel {
  items: DisplayItem[]
  subtotal: number
  vatTotal: number
  whtTotal: number
  total: number
  paymentInfo: PaymentInfo
  reference: ReferenceInfo
  creditTerm: number | null
  dueDate: string | null   // ISO date — "วันหมดอายุ" for Quotation, "วันครบกำหนด" for Invoice
  remarks: string | null
}
