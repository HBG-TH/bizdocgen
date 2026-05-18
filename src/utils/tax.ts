import type { Item } from '../types/document-schema'

export function aggregateVat(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.Vat_Amount, 0)
}

export function aggregateWht(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.Wht_amount, 0)
}
