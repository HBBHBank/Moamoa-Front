import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { TransactionType } from '@/types'
import { format, toZonedTime } from 'date-fns-tz'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    KRW: "₩",
    USD: "$",
    EUR: "€",
    JPY: "¥",
    CNY: "¥",
    VND: "₫",
    INR: "₹",
  }
  return symbols[currency] || ""
}

export const getCountryName = (currency: string): string => {
  const countries: Record<string, string> = {
    KRW: "대한민국",
    USD: "미국",
    EUR: "유럽",
    JPY: "일본",
    CNY: "중국",
    VND: "베트남",
    INR: "인도",
  }
  return countries[currency] || ""
}

export const mapCurrencyToFlag = (code: string): string => {
  const map: Record<string, string> = {
    KRW: "korea.png",
    USD: "usa.png",
    EUR: "eu.png",
    JPY: "japan.png",
    CNY: "china.png",
    INR: "india.png",
    VND: "vietnam.png",
  }
  return map[code] || "korea.png"
}

// 날짜를 "YYYY.MM.DD" 형식으로 포맷팅 (서울 타임존)
export const formatDateForDisplay = (dateString: string): string => {
  const seoulDate = toZonedTime(dateString, 'Asia/Seoul')
  return format(seoulDate, 'yyyy.MM.dd')
}

// 시간을 "HH:mm" 형식으로 포맷팅 (서울 타임존)
export const formatTimeForDisplay = (dateString: string): string => {
  const seoulDate = toZonedTime(dateString, 'Asia/Seoul')
  return format(seoulDate, 'HH:mm')
}

// 거래 타입 한글명 매핑
export const getTransactionTypeName = (type: TransactionType): string => {
  switch (type) {
    case "CHARGE": return "충전";
    case "TRANSFER_OUT": return "송금";
    case "TRANSFER_IN": return "입금";
    case "QR_PAYMENT": return "QR 결제";
    case "SETTLEMENT_SEND": return "정산 송금";
    case "SETTLEMENT_RECEIVE": return "정산 입금";
    case "WITHDRAWAL": return "출금";
    default: return "알 수 없음";
  }
}