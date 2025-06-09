// Create a shared types file

// Shared transaction types
export type TransactionType =
  | "all"
  | "QR_PAYMENT"
  | "TRANSFER_OUT"
  | "TRANSFER_IN"
  | "SETTLEMENT_SEND"
  | "SETTLEMENT_RECEIVE"
  | "CHARGE"
  | "WITHDRAWAL"

export type DateRangeType = "전체기간" | "지정기간"

export interface Transaction {
  id: string
  date: string
  type: TransactionType
  fromCurrency?: string
  toCurrency?: string
  fromAmount?: string
  toAmount?: string
  currency?: string
  amount?: string
  isPositive: boolean
  description: string
  flagSrc: string
}

export interface WalletInfo {
  country: string
  code: string
  flagSrc: string
  amount: number
}

export interface FilterOptions {
  dateRangeType: DateRangeType
  startDate: string
  endDate: string
  transactionType: TransactionType
}
