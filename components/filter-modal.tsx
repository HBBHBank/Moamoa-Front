"use client"

import { useState, useRef, useEffect } from "react"
import { X, Calendar, Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import ModalPortal from "./modal-portal"
import type { TransactionType, DateRangeType, FilterOptions } from "@/types"

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (filters: FilterOptions) => void
  initialFilters: FilterOptions
}

export default function FilterModal({ isOpen, onClose, onApply, initialFilters }: FilterModalProps) {
  const [dateRangeType, setDateRangeType] = useState<DateRangeType>(initialFilters.dateRangeType)
  const [startDate, setStartDate] = useState(initialFilters.startDate)
  const [endDate, setEndDate] = useState(initialFilters.endDate)
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)
  const [transactionType, setTransactionType] = useState<TransactionType>(initialFilters.transactionType)
  const [isTransactionTypeDropdownOpen, setIsTransactionTypeDropdownOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth())
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())
  const [isAnimating, setIsAnimating] = useState(false)

  const modalRef = useRef<HTMLDivElement>(null)
  const today = new Date().toISOString().split("T")[0]
  const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"]

  // 모달 애니메이션 처리
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // 모달 외부 클릭 시 닫기 처리
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    // 모달이 열려있을 때만 이벤트 리스너 추가
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  // 모든 드롭다운 닫기 함수
  const closeAllDropdowns = () => {
    setShowStartDatePicker(false)
    setShowEndDatePicker(false)
    setIsTransactionTypeDropdownOpen(false)
  }

  const toggleTransactionTypeDropdown = () => {
    setShowStartDatePicker(false)
    setShowEndDatePicker(false)
    setIsTransactionTypeDropdownOpen(!isTransactionTypeDropdownOpen)
  }

  const selectTransactionType = (type: TransactionType) => {
    setTransactionType(type)
    setIsTransactionTypeDropdownOpen(false)
  }

  // 날짜 포맷팅 함수
  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // 날짜 선택기 열기 함수
  const openDatePicker = (isStart: boolean) => {
    closeAllDropdowns()
    if (isStart) {
      setShowStartDatePicker(true)
      setShowEndDatePicker(false)
    } else {
      setShowEndDatePicker(true)
      setShowStartDatePicker(false)
    }
  }

  // 캘린더 날짜 생성 함수
  const generateCalendarDays = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay() // 0 = Sunday, 1 = Monday, etc.
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const today = new Date()

    // Initialize array with empty slots for days before the 1st of the month
    const days = Array(firstDay).fill(null)

    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i)
      days.push({
        day: i,
        date: date.toISOString().split("T")[0],
        isToday:
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear(),
        isPast: date <= today,
      })
    }

    return days
  }

  const calendarDays = generateCalendarDays(calendarYear, calendarMonth)

  // 이전 달로 이동 함수
  const goToPreviousMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11)
      setCalendarYear(calendarYear - 1)
    } else {
      setCalendarMonth(calendarMonth - 1)
    }
  }

  // 다음 달로 이동 함수
  const goToNextMonth = () => {
    const today = new Date()
    const nextMonth = calendarMonth === 11 ? 0 : calendarMonth + 1
    const nextYear = calendarMonth === 11 ? calendarYear + 1 : calendarYear

    // Only allow going to next month if it's not in the future
    if (nextYear < today.getFullYear() || (nextYear === today.getFullYear() && nextMonth <= today.getMonth())) {
      setCalendarMonth(nextMonth)
      setCalendarYear(nextYear)
    }
  }

  // 날짜 선택 함수
  const selectDate = (date: string | null, isStart: boolean) => {
    if (!date) return

    if (isStart) {
      // 시작 날짜 선택 시
      setStartDate(date)
      setShowStartDatePicker(false)

      // 만약 선택한 시작 날짜가 현재 종료 날짜보다 이후라면 종료 날짜를 시작 날짜와 동일하게 설정
      if (new Date(date) > new Date(endDate)) {
        setEndDate(date)
      }
    } else {
      // 종료 날짜 선택 시
      setEndDate(date)
      setShowEndDatePicker(false)
    }
  }

  // 거래 유형 텍스트 가져오기 함수
  const getTransactionTypeText = (type: TransactionType) => {
    const typeTexts: Record<TransactionType, string> = {
      transfer: "송금",
      charge: "충전",
      all: "전체",
    }
    return typeTexts[type]
  }

  // 캘린더 컴포넌트 렌더링 함수
  const renderCalendar = (isStart: boolean) => {
    return (
      <div className="absolute left-0 right-0 top-16 z-20 mt-1 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={goToPreviousMonth} className="p-1 text-gray-500 hover:text-gray-700">
            <ChevronLeft size={20} />
          </button>
          <div className="font-medium">
            {calendarYear}년 {monthNames[calendarMonth]}
          </div>
          <button onClick={goToNextMonth} className="p-1 text-gray-500 hover:text-gray-700">
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500">
          <div>일</div>
          <div>월</div>
          <div>화</div>
          <div>수</div>
          <div>목</div>
          <div>금</div>
          <div>토</div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            // 현재 날짜가 시작일인지 종료일인지 확인
            const isSelectedStartDate = day?.date === startDate
            const isSelectedEndDate = day?.date === endDate

            // 날짜가 선택 가능한지 확인
            const isSelectable =
              day &&
              day.isPast &&
              (isStart
                ? new Date(day.date) <= new Date(endDate) // 시작일 선택 시: 종료일 이전 날짜만 선택 가능
                : new Date(day.date) >= new Date(startDate)) // 종료일 선택 시: 시작일 이후 날짜만 선택 가능

            // 시작일 선택 화면에서는 시작일이 파란색 배경, 종료일이 파란색 테두리
            // 종료일 선택 화면에서는 종료일이 파란색 배경, 시작일은 표시하지 않음
            const isHighlighted = isStart ? isSelectedStartDate : isSelectedEndDate
            const isOutlined = isStart ? isSelectedEndDate : false

            return (
              <button
                key={index}
                onClick={() => isSelectable && selectDate(day?.date || null, isStart)}
                disabled={!isSelectable}
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  !day
                    ? "cursor-default"
                    : isHighlighted
                      ? "bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] text-white"
                      : isOutlined
                        ? "border border-[#4DA9FF] bg-blue-50 text-[#4DA9FF]"
                        : day.isToday
                          ? "border border-[#4DA9FF] bg-blue-50 text-[#4DA9FF]"
                          : isSelectable
                            ? "text-gray-800 hover:bg-gray-100"
                            : "cursor-not-allowed text-gray-300"
                }`}
              >
                {day?.day}
              </button>
            )
          })}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => (isStart ? setShowStartDatePicker(false) : setShowEndDatePicker(false))}
            className="rounded-lg px-4 py-2 text-[#4DA9FF] hover:bg-blue-50"
          >
            닫기
          </button>
        </div>
      </div>
    )
  }

  const handleApply = () => {
    onApply({
      dateRangeType,
      startDate,
      endDate,
      transactionType,
    })
  }

  if (!isOpen) return null

  return (
    <ModalPortal>
      <style jsx global>{`
        body {
          overflow: hidden;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
      <div
        className="fixed inset-0 z-50"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(2px)",
          animation: "fadeIn 0.3s ease-out",
        }}
        onClick={onClose}
      >
        <div
          className="fixed bottom-0 left-0 right-0 z-50 rounded-t-xl bg-white p-6 shadow-xl"
          ref={modalRef}
          style={{
            animation: "slideUp 0.3s ease-out",
            maxHeight: "90vh",
            overflowY: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-medium">필터</h2>
            <button onClick={onClose} className="rounded-full p-1 text-gray-500 hover:bg-gray-100">
              <X size={24} />
            </button>
          </div>

          {/* Date Range Section */}
          <div className="mb-6">
            <h3 className="mb-4 text-lg font-medium">조회기간</h3>
            <div className="mb-4 flex space-x-4">
              <button
                className={`flex-1 rounded-lg border ${
                  dateRangeType === "전체기간"
                    ? "border-[#4DA9FF] bg-blue-50 text-[#4DA9FF]"
                    : "border-gray-300 bg-white text-gray-700"
                } py-3 text-center font-medium transition-all`}
                onClick={() => setDateRangeType("전체기간")}
              >
                전체기간
              </button>
              <button
                className={`flex-1 rounded-lg border ${
                  dateRangeType === "지정기간"
                    ? "border-[#4DA9FF] bg-blue-50 text-[#4DA9FF]"
                    : "border-gray-300 bg-white text-gray-700"
                } py-3 text-center font-medium transition-all`}
                onClick={() => setDateRangeType("지정기간")}
              >
                지정기간
              </button>
            </div>

            {dateRangeType === "지정기간" && (
              <div className="relative rounded-lg border border-gray-300 p-4">
                <div className="flex items-center justify-between">
                  <div className="relative w-[45%]">
                    <button
                      onClick={() => openDatePicker(true)}
                      className={`flex w-full items-center justify-between rounded-lg border ${
                        showStartDatePicker ? "border-[#4DA9FF]" : "border-gray-200"
                      } bg-white px-3 py-2 text-left`}
                    >
                      <span>{formatDateForDisplay(startDate)}</span>
                      <Calendar size={16} className="text-gray-500" />
                    </button>
                  </div>
                  <span className="text-gray-500">-</span>
                  <div className="relative w-[45%]">
                    <button
                      onClick={() => openDatePicker(false)}
                      className={`flex w-full items-center justify-between rounded-lg border ${
                        showEndDatePicker ? "border-[#4DA9FF]" : "border-gray-200"
                      } bg-white px-3 py-2 text-left`}
                    >
                      <span>{formatDateForDisplay(endDate)}</span>
                      <Calendar size={16} className="text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* 날짜 선택기 */}
                {showStartDatePicker && renderCalendar(true)}
                {showEndDatePicker && renderCalendar(false)}
              </div>
            )}
          </div>

          {/* Transaction Type Section */}
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-medium">거래구분</h3>
            <div className="relative">
              <button
                onClick={toggleTransactionTypeDropdown}
                className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-left"
              >
                <span>{getTransactionTypeText(transactionType)}</span>
                <ChevronDown
                  size={20}
                  className={`transition-transform ${isTransactionTypeDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isTransactionTypeDropdownOpen && (
                <div className="absolute left-0 right-0 z-30 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  <ul>
                    {[
                      { value: "all", label: "전체" },
                      { value: "transfer", label: "송금" },
                      { value: "charge", label: "충전" },
                    ].map((type) => (
                      <li key={type.value}>
                        <button
                          onClick={() => selectTransactionType(type.value as TransactionType)}
                          className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                        >
                          <span>{type.label}</span>
                          {transactionType === type.value && <Check size={16} className="text-[#4DA9FF]" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Apply Button */}
          <button
            onClick={handleApply}
            className="w-full rounded-lg bg-gradient-to-b from-[#4DA9FF] to-[#3B9EFF] py-4 text-center text-lg font-medium text-white shadow-[0_4px_6px_-1px_rgba(77,169,255,0.3),0_2px_4px_-2px_rgba(77,169,255,0.2)]"
          >
            적용
          </button>
        </div>
      </div>
    </ModalPortal>
  )
}
