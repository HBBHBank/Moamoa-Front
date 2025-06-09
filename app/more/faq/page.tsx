"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Search, ChevronDown, ChevronUp } from "lucide-react"

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: 1,
    question: "환전 수수료는 얼마인가요?",
    answer: "환전 수수료는 거래 금액의 0.5%입니다. 최소 수수료는 500원이며, 최대 5,000원을 넘지 않습니다. VIP 회원의 경우 수수료가 50% 할인됩니다.",
    category: "환전"
  },
  {
    id: 2,
    question: "결제 한도는 어떻게 되나요?",
    answer: "일일 결제 한도는 기본 100만원입니다. 신분증 인증 완료 시 300만원, 추가 인증 완료 시 500만원까지 한도가 증가합니다. 한도 증액은 마이페이지에서 신청 가능합니다.",
    category: "결제"
  },
  {
    id: 3,
    question: "정산은 언제 이루어지나요?",
    answer: "정산은 매주 화요일과 금요일에 진행됩니다. 정산 신청 후 영업일 기준 1-2일 내에 등록된 계좌로 입금됩니다. 정산 수수료는 무료입니다.",
    category: "정산"
  },
  {
    id: 4,
    question: "계좌 등록은 어떻게 하나요?",
    answer: "마이페이지 > 계좌/충전 관리에서 본인 명의 계좌를 등록할 수 있습니다. 신한은행, 국민은행, 우리은행 등 주요 은행을 모두 지원합니다. 계좌 인증은 1원 송금으로 진행됩니다.",
    category: "계좌"
  },
  {
    id: 5,
    question: "충전은 어떻게 하나요?",
    answer: "계좌이체, 신용카드, 무통장입금으로 충전 가능합니다. 계좌이체는 즉시 충전되며, 무통장입금은 확인 후 1-2시간 내에 반영됩니다. 충전 수수료는 무료입니다.",
    category: "충전"
  },
  {
    id: 6,
    question: "비밀번호를 잊어버렸어요.",
    answer: "로그인 화면에서 '비밀번호 찾기'를 선택하여 등록된 휴대폰 번호로 인증 후 새로운 비밀번호를 설정할 수 있습니다. 또는 고객센터(1588-1234)로 문의해주세요.",
    category: "계정"
  },
  {
    id: 7,
    question: "환율 정보는 얼마나 자주 업데이트되나요?",
    answer: "환율 정보는 실시간으로 업데이트됩니다. 은행 영업시간(09:00-15:30) 중에는 실시간 환율이 적용되며, 영업시간 외에는 마감 환율이 적용됩니다.",
    category: "환전"
  },
  {
    id: 8,
    question: "해외에서도 사용 가능한가요?",
    answer: "네, 해외에서도 사용 가능합니다. 다만 일부 국가에서는 서비스가 제한될 수 있으며, 로밍 환경에서는 데이터 요금이 발생할 수 있습니다. 해외 사용 전 고객센터로 문의 바랍니다.",
    category: "이용"
  },
  {
    id: 9,
    question: "앱을 삭제했는데 데이터가 사라질까요?",
    answer: "앱 삭제 시 기기에 저장된 데이터는 삭제되지만, 서버에 저장된 거래 내역과 계좌 정보는 안전하게 보관됩니다. 앱 재설치 후 로그인하시면 모든 정보를 다시 확인할 수 있습니다.",
    category: "계정"
  },
  {
    id: 10,
    question: "고객센터 운영시간은 어떻게 되나요?",
    answer: "고객센터는 평일 09:00-18:00, 토요일 09:00-13:00에 운영됩니다. 일요일 및 공휴일은 휴무이며, 긴급한 경우 앱 내 채팅 상담을 이용해주세요.",
    category: "고객지원"
  }
]

const categories = ["전체", "환전", "결제", "정산", "계좌", "충전", "계정", "이용", "고객지원"]

// 카테고리별 스타일 매핑
const getCategoryButtonStyle = (category: string) => {
  const styles = {
    "환전": {
      bg: "bg-green-500",
      icon: "📈"
    },
    "결제": {
      bg: "bg-blue-500", 
      icon: "💳"
    },
    "정산": {
      bg: "bg-purple-500",
      icon: "📊"
    },
    "계좌": {
      bg: "bg-orange-500",
      icon: "💳"
    },
    "충전": {
      bg: "bg-pink-500",
      icon: "📱"
    },
    "계정": {
      bg: "bg-cyan-500",
      icon: "👤"
    },
    "이용": {
      bg: "bg-amber-500",
      icon: "🌐"
    },
    "고객지원": {
      bg: "bg-gray-500",
      icon: "❓"
    }
  };
  
  return styles[category as keyof typeof styles] || {
    bg: "bg-gray-500",
    icon: "❓"
  };
};

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("전체")
  const [expandedItems, setExpandedItems] = useState<number[]>([])

  const filteredFAQs = faqData.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "전체" || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const toggleExpand = (id: number) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between bg-white p-4 shadow-sm">
        <Link href="/more" className="p-2">
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </Link>
        <span className="text-lg font-medium text-gray-800">자주 묻는 질문</span>
        <div className="w-10" />
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-6 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="질문 또는 답변 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4DA9FF] focus:border-transparent shadow-sm"
          />
        </div>

        {/* Category Filter */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map(category => {
            const categoryStyle = getCategoryButtonStyle(category);
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center space-x-1 ${
                  selectedCategory === category
                    ? `${categoryStyle.bg} text-white`
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                {selectedCategory === category && category !== "전체" && (
                  <span className="text-sm">{categoryStyle.icon}</span>
                )}
                <span>{category}</span>
              </button>
            );
          })}
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {filteredFAQs.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">검색 결과가 없습니다.</p>
              <p className="text-sm text-gray-400 mt-1">다른 키워드로 검색해보세요.</p>
            </div>
          ) : (
            filteredFAQs.map(faq => {
              const categoryStyle = getCategoryButtonStyle(faq.category);
              return (
                <div key={faq.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all duration-200">
                  <button
                    onClick={() => toggleExpand(faq.id)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`inline-flex items-center space-x-1 px-3 py-1 ${categoryStyle.bg} text-white text-xs font-medium rounded-full shadow-sm`}>
                          <span className="text-sm">{categoryStyle.icon}</span>
                          <span>{faq.category}</span>
                        </div>
                      </div>
                      <p className="font-medium text-gray-800 leading-relaxed">{faq.question}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {expandedItems.includes(faq.id) ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>
                  
                  {expandedItems.includes(faq.id) && (
                    <div className="px-5 pb-4">
                      <div className="p-4 bg-gray-100 rounded-lg mt-2 shadow-md">
                        <p className="text-gray-800 leading-relaxed">{faq.answer}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-[#4DA9FF] to-[#0DAEFF] rounded-xl p-5 text-white">
          <h3 className="font-semibold text-lg mb-2">문제가 해결되지 않으셨나요?</h3>
          <p className="text-sm text-blue-100 mb-3">
            고객센터에서 더 자세한 도움을 받으실 수 있습니다.
          </p>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm">📞 고객센터:</span>
              <span className="font-medium">1588-1234</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm">🕒 운영시간:</span>
              <span className="font-medium">평일 09:00-18:00, 토요일 09:00-13:00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 