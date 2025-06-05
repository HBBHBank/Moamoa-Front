"use client"

import { useState } from "react"
import { ChevronLeft, X, ChevronRight, Check } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function TermsPage() {
  const router = useRouter()

  // Updated to match the backend DTO structure
  const [agreements, setAgreements] = useState({
    all: false,
    serviceTermsAgreed: false, // 서비스 이용 약관 (필수)
    privacyPolicyAgreed: false, // 개인정보 처리방침 (필수)
    marketingAgreed: false, // 마케팅 수신 동의 (선택)
  })

  // Modal state for showing full terms
  const [openModal, setOpenModal] = useState<null | 'service' | 'privacy' | 'marketing'>(null)

  // State for which service terms tab is selected
  const [serviceTab, setServiceTab] = useState<'송금' | '환전'>('송금')

  const handleAllChange = () => {
    const newValue = !agreements.all
    setAgreements({
      all: newValue,
      serviceTermsAgreed: newValue,
      privacyPolicyAgreed: newValue,
      marketingAgreed: newValue,
    })
  }

  const handleSingleChange = (term: keyof typeof agreements) => {
    if (term === "all") return handleAllChange()

    const newAgreements = {
      ...agreements,
      [term]: !agreements[term],
    }

    // Check if all individual terms are checked
    const allChecked =
      newAgreements.serviceTermsAgreed && newAgreements.privacyPolicyAgreed

    setAgreements({
      ...newAgreements,
      all: allChecked,
    })
  }

  // Check if all required terms are agreed to
  const isAllRequiredChecked = agreements.serviceTermsAgreed && agreements.privacyPolicyAgreed

  const handleConfirm = () => {
    if (!isAllRequiredChecked) {
      alert("필수 약관에 모두 동의해야 합니다.")
      return
    }

    // Store agreement data to be used in the signup process
    localStorage.setItem(
      "termsAgreement",
      JSON.stringify({
        serviceTermsAgreed: agreements.serviceTermsAgreed,
        privacyPolicyAgreed: agreements.privacyPolicyAgreed,
        marketingAgreed: agreements.marketingAgreed,
      }),
    )

    // Navigate to the next step in the signup process
    router.push("/signup/form")
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 p-4">
        <Link href="/" className="text-gray-700">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-medium">약관동의</h1>
        <Link href="/" className="text-gray-700">
          <X size={24} />
        </Link>
      </header>

      <div className="flex-1 overflow-auto p-4">
        {/* More options button */}
        <div className="mb-4 flex justify-center">
          <button className="text-gray-500 cursor-pointer">
            <span className="text-2xl">...</span>
          </button>
        </div>

        {/* Agree to all */}
        <div className="mb-6 rounded-lg border border-gray-200 p-4">
          <label className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                agreements.all ? "bg-[#4DA9FF]" : "bg-gray-200"
              } cursor-pointer`}
              onClick={handleAllChange}
            >
              <Check className="h-5 w-5 text-white cursor-pointer" />
            </div>
            <span className="text-base font-medium">약관 전체 동의</span>
          </label>
        </div>

        {/* Divider */}
        <div className="my-6 h-px w-full bg-gray-200"></div>

        {/* Individual agreements - Updated to match backend structure */}
        <div className="space-y-5">
          {/* Service Terms - Required */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  agreements.serviceTermsAgreed ? "bg-[#4DA9FF]" : "bg-gray-200"
                } cursor-pointer`}
                onClick={() => handleSingleChange("serviceTermsAgreed")}
              >
                <Check className="h-5 w-5 text-white cursor-pointer" />
              </div>
              <span className="text-base">[필수] 서비스 이용 약관 동의</span>
            </label>
            <button onClick={() => setOpenModal('service')}>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Privacy Policy - Required */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  agreements.privacyPolicyAgreed ? "bg-[#4DA9FF]" : "bg-gray-200"
                } cursor-pointer`}
                onClick={() => handleSingleChange("privacyPolicyAgreed")}
              >
                <Check className="h-5 w-5 text-white cursor-pointer" />
              </div>
              <span className="text-base">[필수] 개인정보 처리방침 동의</span>
            </label>
            <button onClick={() => setOpenModal('privacy')}>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Marketing - Optional */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  agreements.marketingAgreed ? "bg-[#4DA9FF]" : "bg-gray-200"
                } cursor-pointer`}
                onClick={() => handleSingleChange("marketingAgreed")}
              >
                <Check className="h-5 w-5 text-white cursor-pointer" />
              </div>
              <span className="text-base">[선택] 마케팅 정보 수신 동의</span>
            </label>
            <button onClick={() => setOpenModal('marketing')}>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirm button */}
      <div className="p-4">
        <button
          className={`h-[60px] w-full rounded-[30px] text-center text-lg font-medium text-white ${
            isAllRequiredChecked ? "bg-[#0DAEFF]" : "bg-gray-300"
          } cursor-pointer`}
          disabled={!isAllRequiredChecked}
          onClick={handleConfirm}
        >
          확인
        </button>
      </div>

      {/* Terms Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6 relative max-h-[80vh] flex flex-col">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" onClick={() => setOpenModal(null)}>
              <X size={24} />
            </button>
            <h2 className="text-lg font-bold mb-4 text-center">
              {openModal === 'service' && '서비스 이용 약관'}
              {openModal === 'privacy' && '개인정보 처리방침'}
              {openModal === 'marketing' && '마케팅 정보 수신 동의'}
            </h2>
            <div className="flex-1 overflow-y-auto text-sm text-gray-700 whitespace-pre-line">
              {openModal === 'service' && (
                <div className="flex flex-col min-h-[300px]">
                  {/* Tab Buttons */}
                  <div className="flex gap-2 mb-4">
                    <button
                      className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all border ${serviceTab === '송금' ? 'bg-[#0DAEFF] text-white border-[#0DAEFF]' : 'bg-white text-gray-700 border-gray-200'}`}
                      onClick={() => setServiceTab('송금')}
                    >
                      소액 해외 송금 서비스 이용약관
                    </button>
                    <button
                      className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all border ${serviceTab === '환전' ? 'bg-[#0DAEFF] text-white border-[#0DAEFF]' : 'bg-white text-gray-700 border-gray-200'}`}
                      onClick={() => setServiceTab('환전')}
                    >
                      온라인 환전 서비스 이용약관
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto text-sm text-gray-800 whitespace-pre-line px-1" style={{ maxHeight: '60vh' }}>
                    {serviceTab === '송금' ? (
                      <div className="space-y-4 text-sm text-gray-800">
                        {/* 소액 해외 송금 서비스 이용약관 - markdown style */}
                        <h3 className="font-bold text-lg mb-2">소액해외송금서비스 이용약관</h3>
                        <div><span className="font-bold">제1조 (적용범위)</span><br/>이 약관은 주식회사 모아모아(이하 &apos;회사&apos;라 함)과 &apos;회사가 제공하는 「소액해외송금서비스」(이하 &apos;서비스&apos;라 함)를 이용하는 고객&apos;(이하 &apos;고객&apos;이라 함) 사이에 적용됩니다.</div>
                        <div><span className="font-bold">제2조 (실명거래)</span><br/>고객은 회사와의 소액해외송금 거래 시 실명으로 거래하여야 하며, 회사가 실명확인을 위해 고객에게 실명확인증표 등 필요한 자료를 요구할 경우 이에 따르기로 합니다.</div>
                        <div><span className="font-bold">제3조 (송금한도)</span><br/>고객이 본 서비스를 통해 송금할 수 있는 한도는 다음 각 호와 같습니다.<br/>① 건당 지급 및 수령 한도는 각각 미화 5천 달러<br/>② 연간 지급 및 수령 누계 한도는 각각 미화 5만 달러<br/>③ 송금 한도는 변경될 수 있으며, 자세한 사항은 회사 홈페이지 및 애플리케이션을 통해 확인 가능합니다.</div>
                        <div><span className="font-bold">제4조 (이용계약의 성립)</span><br/>① 당사의 소액해외송금 서비스를 이용하고자 하는 만 19세 이상의 내국 거주 고객 (이하 &apos;가입신청자&apos;라 함)은 이 약관과 당사의 소액해외송금 서비스의 이용을 위한 오픈뱅킹 서비스 이용약관 내용에 동의하면서 회사가 제시하는 양식에 따라 제반 정보를 정확하게 기재하여 회원가입을 신청해야 합니다.<br/>단, 회사는 회원에 대한 사항을 종합적으로 고려하여 실제 소액해외송금이 가능한 조건 등에 대한 자세한 사항은 별도 회사 홈페이지 및 애플리케이션에 고지합니다.<br/>② 회사가 가입신청자의 신청에 대해서 승낙함으로써 회원가입이 완료되고, 가입 신청자는 고객의 지위에서 회사가 제공하는 서비스를 이용할 수 있습니다.<br/>③ 회사는 가입신청자의 신청을 승낙함을 원칙으로 합니다. 다만 회사는 각 호 중 어느 하나에 해당하는 경우 승낙을 거절할 수 있습니다.<br/>1. 가명 또는 타인의 명의를 도용하여 가입신청을 한 경우<br/>2. 회원가입신청서 내용을 허위로 기재하거나 회원가입신청 요건을 충족하지 못한 경우<br/>3. 부정한 목적으로 서비스를 이용하고자 하는 경우<br/>4. 관련 법령에 위배되거나 사회질서를 위반할 수 있는 목적으로 가입 신청한 경우<br/>5. 그 밖에 각 호에 준하는 사유로서 승낙이 부적절하다고 판단되는 경우</div>
                        <div><span className="font-bold">제5조 (개인정보의 보호 및 처리)</span><br/>① 회사는 개인정보의 수집 및 이용에 관하여 관련 법령 및 회사의 개인정보 처리방침에 따릅니다.<br/>② 회사는 고객의 귀책사유로 개인정보가 유출되어 발생한 피해에 대하여 책임을 지지 않습니다.</div>
                        <div><span className="font-bold">제6조 (서비스의 제공 및 이용)</span><br/>① 고객은 회사가 제공하는 모바일 애플리케이션(이하 &apos;애플리케이션&apos;이라 함)을 통해 서비스를 이용할 수 있으며, 서비스의 세부 사항은 다음 각 호와 같습니다.<br/>1. 고객은 애플리케이션에서 송금 국가 및 송금 유형을 선택한 후, 송금하려는 통화와 금액, 고객(송금인) 및 수취인의 정보(성명, 주소, 계좌번호 등)를 입력하여 계좌 이체를 신청합니다.<br/>2. 고객이 애플리케이션 상 고객의 계좌 정보를 입력하고 계좌이체를 신청하면 해당 계좌로부터 회사의 계좌로 송금할 금액이 이체됩니다.<br/>3. 회사는 고객의 송금 신청 정보를 애플리케이션을 통해 고객에게 제공합니다.<br/>4. 회사는 최대 5영업일 이내로 고객이 요청한 수취인의 계좌에 대하여 송금할 금액을 이체합니다. 다만, 송금 국가의 휴일이나 수취은행의 상황 등에 따라 송금 처리가 지연될 수 있습니다.<br/>② 고객은 서비스를 이용하기 위하여 애플리케이션을 다운로드 하거나 설치하고 인터넷에 연결하는 등의 절차를 완료하여야 합니다.<br/>③ 회사는 본 서비스를 통한 모든 거래와 관련하여 특정금융정보법, 금융실명법 등 관련 법령을 준수하기 위하여 고객에게 추가적인 정보, 신분증 제시, 증빙서류 제출 등을 요구할 수 있습니다.<br/>④ 고객의 착오, 부정확한 정보 입력, 국내 체류자격 상실, 계좌의 이용 제한, 잔액 부족 등의 사유가 있는 경우, 불법재산 수수나 은닉, 자금세탁행위, 공중협박자금조달행위, 강제집행의 면탈, 그 밖에 탈법행위를 목적으로 하는 불법적인 금융거래로 의심되는 경우, 송금 지연, 오류, 반환, 수취 거절 등이 발생할 수 있습니다.</div>
                        <div><span className="font-bold">제7조 (지정계좌)</span><br/>① 회사는 &apos;소액해외송금업무에 사용할 계좌인 것으로 소액해외송금업 등록(변경등록 포함) 당시 지정한 회사명의의 금융회사개설 계좌&apos;(이하 &apos;지정계좌&apos;라 함)를 통해서만 고객에게 자금을 지급하거나 고객으로부터 자금을 수령할 수 있습니다.<br/>② 회사는 제1항의 지정계좌에 관한 내용을 애플리케이션 등에 게시하고 이를 최신 내용으로 관리하여야 합니다.</div>
                        <div><span className="font-bold">제8조 (수수료)</span><br/>① 회사는 고객으로부터 본 서비스 이용신청을 받은 경우 고객이 부담하는 수수료(이하 &apos;수수료&apos;라 함)에 관한 사항을 환전수수료, 송금수수료, 외국 협력업자 지급수수료 등 세부 구성항목별로 구분하여 그 내역을 고객에게 제공하여야 합니다.<br/>② 회사는 수수료에 관한 사항을 회사 홈페이지 및 애플리케이션에 사전 고지 및 게시하고 이를 최신 내용으로 관리하여야 합니다.<br/>③ 수수료는 변경될 수 있으며, 자세한 사항은 회사 홈페이지 및 애플리케이션을 통해 확인 가능합니다.</div>
                        <div><span className="font-bold">제9조 (적용환율)</span><br/>① 회사는 고객으로부터 본 서비스 이용신청을 받은 경우 고객에게 적용할 환율에 관한 사항을 제공하여야 합니다.<br/>② 회사는 고객에게 적용할 환율에 관한 사항을 애플리케이션 등에 게시하고 이를 최신 내용으로 관리하여야 합니다.</div>
                        <div><span className="font-bold">제10조 (지급·수령금액)</span><br/>① 회사는 본 서비스를 신청한 고객이 오픈뱅킹 서비스를 통해 지정계좌에 입금할 경우 수수료를 차감한 금액을 외화로 환전하여 고객이 요청한 수취인에 대하여 송금 처리를 하여야 합니다.<br/>② 회사는 고객으로부터 본 서비스 이용신청을 받은 경우 고객이 지급 또는 수령하는 자금의 원화표시 및 외화표시 금액에 관한 사항을 고객에게 제공하여야 합니다.<br/>③회사에서 고객의 요청에 의해 진행된 소액해외송금 처리를 완료하더라도, 본 서비스와 관련 송금 업체 및 수취은행에서 자체적으로 부가적인 점검 또는 확인을 진행하는 경우, 송금 소요 시간이 지연될 수 있으며, 이로 인해 실제 송금이 완료되는 시간은 당사에서 고지한 소요시간과 상이할 수 있습니다.</div>
                        <div><span className="font-bold">제11조 (소요기간)</span><br/>① 회사는 고객으로부터 본 서비스 이용신청을 받은 경우 고객에게 지급 또는 수령에 소요되는 예상 기간에 관한 사항을 제공하여야 합니다.<br/>② 회사는 본 서비스를 이용할 경우 지급 또는 수령에 소요되는 예상 기간에 관한 사항을 애플리케이션 등에 게시하고 이를 최신 내용으로 관리하여야 합니다.</div>
                        <div><span className="font-bold">제12조 (송금의 변경·취소)</span><br/>① 고객은 본 서비스를 신청하여 현지 국가에서 수취하지 않은 건에 대하여 애플리케이션을 통하여 회사에 변경 또는 취소를 신청할 수 있습니다. 다만, 수취인 계좌에 정상 입금되는 등 송금 처리가 완료된 건에 대해서는 변경 또는 취소를 신청할 수 없습니다.<br/>② 회사는 고객의 요청에 의하여 송금 처리를 변경함에 따라 추가적인 송금수수료나 비용이 발생하는 경우 고객에게 추가적인 송금수수료나 비용을 부과할 수 있습니다.<br/>③ 회사는 고객으로부터 송금 신청 건에 대한 변경 또는 취소를 요청받은 경우 해당 요청사항을 처리하고 그 결과를 고객에게 통보하여야 합니다.<br/>④ 회사는 고객의 요청에 의하여 송금 처리를 취소하는 경우, 고객으로부터 지급받은 금액에서 송금 처리 과정상 지출한 모든 비용(송금수수료, 변경 또는 취소에 따른 위약금 등)을 공제할 수 있으며, 해당 비용을 공제한 나머지 금액을 고객에게 지급합니다.</div>
                        <div><span className="font-bold">제13조 (송금결과의 통보)</span><br/>회사는 현지 국가에서 고객의 수취가 완료된 경우 즉시 그 결과를 애플리케이션 또는 고객이 사전에 등록한 연락처 등을 통하여 고객에게 통지하여야 합니다.</div>
                        <div><span className="font-bold">제14조 (손해배상)</span><br/>회사의 책임 있는 사유로 인하여 고객에게 손해가 발생한 경우 회사의 손해배상 범위는 민법에서 정하고 있는 통상손해를 포함하고, 특별한 사정으로 인한 손해는 회사가 그 사정을 알았거나 알 수 있었을 때에 한하여 배상책임이 있습니다.</div>
                        <div><span className="font-bold">제15조 (환급)</span><br/>① 고객의 귀책사유 없이 고객이 회사에 본 서비스를 신청하여 지정계좌에 입금하였음에도 예정된 일자에 수취인 계좌로 송금 처리가 완료되지 못한 경우에는 회사에 환급을 신청할 수 있습니다.<br/>② 회사는 고객으로부터 제1항의 환급신청을 받은 경우 특별한 사정이 있는 경우를 제외하고는 당초 고객이 지정계좌에 입금한 금액 및 제14조에 따른 손해배상금액 등을 고객에게 지급하여야 합니다.</div>
                        <div><span className="font-bold">제16조 (거래의 제한·거절)</span><br/>① 고객이 요청하는 소액해외송금거래에 관하여 다음 각 호 중 어느 하나의 사유가 발생하는 경우 회사는 해당 거래의 처리를 제한 또는 거절할 수 있습니다.<br/>1. 고객이 접근매체에 의한 본인확인 외에 회사가 제공하는 추가적 보안조치를 이용하지 않는 경우<br/>2. 고객의 압류, 가압류, 가처분 등 법적 지급제한, 외국환거래법 등 관련 법령 위반으로 인하여 거래의 제공이 부적합하다고 인정되는 경우<br/>3. 고객이 제2조, 제3조, 제4조 제3항, 제6조 제3항 및 제4항, 제12조 제2항 등에서 정한 사항을 위반함으로 인하여 거래의 제공이 부적합하다고 인정되는 경우<br/>4. 고객이 신고가 필요한 자본거래임에도 불구하고 소액분할하여 송금하는 등 송금액을 고의적으로 분할하여 반복적으로 송금하는 경우<br/>5. 해당 거래가 자본시장법 등 관련 법령에 의하여 제한되는 경우(예컨대, FX 마진거래를 포함한 파생상품거래, 거주자의 외화증권취득 등)<br/>6. 해당 거래가 특정금융정보법, 금융실명법 등을 위반하여 불법재산 수수나 은닉, 자금세탁행위, 공중협박자금조달행위, 강제집행의 면탈, 그 밖에 탈법행위를 목적으로 하는 불법적인 금융거래에 해당한다고 의심되는 합리적인 근거가 있는 경우<br/>② 회사는 제1항 각 호의 사유에 해당한다고 의심되는 합리적인 사유가 있는 경우 고객에게 그 사실을 통지하고 의심되는 사유가 해소될 때까지 고객의 본 서비스 이용을 일시적으로 제한할 수 있습니다.<br/>③ 회사가 제1항에 따라 고객의 소액해외송금거래를 제한 또는 거절하는 경우 고객에게 지체 없이 거래 제한 또는 거절 사실 및 그 사유 등을 통지하여야 합니다</div>
                        <div><span className="font-bold">제17조 (분쟁처리절차)</span><br/>① 고객은 회사 홈페이지에 게시된 분쟁처리 책임자 및 담당자 또는 아래 연락처를 통하여 소액해외송금거래와 관련한 의견 및 불만 제기, 손해배상 청구 등의 분쟁처리를 요구할 수 있습니다.<br/>- 주소 : 서울 강남구 강남대로 542, 5/6층 (논현동, 영풍빌딩)<br/>- 이메일 : support@travel-wallet.com<br/>- 전화번호 : 02-6949-4885<br/>② 회사는 분쟁사항에 대한 접수방법 (분쟁처리책임자와 담당자 지정내역 및 그 연락처 포함), 분쟁처리절차(단순불만사항과 손해배상요구사항을 구분하여 마련) 및 분쟁처리결과에 대한 고객통보에 관한 사항(처리기한, 고객통보방식 등) 등을 고객에게 제공하여야 합니다.<br/>③ 고객은 소액해외송금거래의 처리에 관하여 이의가 있을 때에는 회사의 분쟁처리기구(분쟁처리책임자 및 담당자 등)에 그 해결을 요구할 수 있으며, 회사는 이를 조사하여 제2항에 따라 안내되는 처리기한 이내에 처리결과를 고객에게 통보하여야 합니다.<br/>④ 회사는 분쟁처리책임자와 담당자 지정내역 및 그 연락처 등을 애플리케이션 등에 게시하고 이를 최신 내용으로 관리하여야 합니다.</div>
                        <div><span className="font-bold">제18조 (거래기록의 보존)</span><br/>회사는 외국환거래법령 등에 따라 고객과의 지급 및 수령거래 기록을 5년간 보관하여야 합니다.</div>
                        <div><span className="font-bold">제19조 (비밀보장의무)</span><br/>ⓛ 회사는 &apos;고객의 인적 사항, 계좌정보, 회사와의 송금거래 내용 및 실적에 관한 자료 등 소액해외송금업무 수행을 통하여 알게 된 일체의 고객정보&apos;(이하 &apos;고객정보&apos;라 함)에 대하여 관계법령에서 정한 경우를 제외하고는 고객 동의 없이 제3자에게 제공하거나 업무 목적 외에 누설하거나 이용하여서는 아니 됩니다.<br/>다만, 법원, 정부 기관, 관련 법령 등에 의하여 공개되어야 하는 경우는 예외로 합니다.<br/>② 회사가 관리소홀 등 회사의 귀책사유로 제1항을 위반하거나 고객정보의 도난 또는 유출이 발생한 경우 회사가 피해고객에게 배상책임이 있습니다. 다만, 고객에게 고의 또는 중과실이 있는 경우에는 회사가 그 책임을 면할 수 있습니다.</div>
                        <div><span className="font-bold">제20조 (약관의 교부·설명)</span><br/>① 회사는 약관을 정하거나 변경한 경우 애플리케이션 등을 통하여 공시하여야 하며, 고객과 소액해외송금업무와 관련한 계약을 체결할 때 약관을 명시하여야 합니다.<br/>② 회사는 고객에게 전자문서의 전송(전자우편을 이용한 전송을 포함합니다.), 모사전송, 우편 또는 직접 교부의 방식으로 약관의 사본을 고객에게 교부하여야 합니다.<br/>③ 회사는 고객이 약관의 내용에 대한 설명을 요청하는 경우 다음의 각 호의 어느 하나의 방법으로 고객에게 약관의 중요 내용을 설명하여야 합니다.<br/>1. 약관의 중요내용을 고객에게 직접 설명<br/>2. 약관의 중요 내용에 대한 설명을 전자적 장치를 통해 고객이 알기 쉽게 표시하고 고객으로부터 해당 내용을 충분히 인지하였다는 의사표시를 전자적 장치를 통해 수령</div>
                        <div><span className="font-bold">제21조 (약관의 변경)</span><br/>① 회사가 이 약관을 변경하는 때에는 변경되는 약관의 시행일 1개월 전에 그 내용을 해당 전자금융거래를 수행하는 전자적 장치(해당 전자적 장치에 게시하기 어려울 경우에는 고객이 접근하기 용이한 전자적 장치)에 게시하고 고객에게 통지하여야 합니다. 다만, 고객이 이의를 제기할 경우 회사는 고객에게 적절한 방법으로 약관 변경내용을 통지하였음을 확인해 주어야 합니다.<br/>② 제1항에도 불구하고 법령의 개정으로 인하여 긴급하게 약관을 변경한 때에는 변경된 약관을 전자적 장치에 최소 1개월 이상 게시하고 고객에게 통지하여야 합니다.<br/>③ 회사가 제1항 및 제2항에 따라 변경된 약관을 게시하거나 통지하는 경우에는 &quot;고객이 약관의 변경내용이 게시되거나 통지된 후부터 변경되는 약관의 시행일 전의 영업일까지 이내에 계약을 해지할 수 있으며, 약관의 변경내용에 이의를 제기하지 아니하는 경우 약관의 변경을 승인한 것으로 봅니다.&quot;라는 취지의 내용을 통지하여야 합니다.<br/>④ 고객은 약관의 변경내용이 게시되거나 통지된 후부터 변경되는 약관의 시행일 전의 영업일까지 전자금융거래의 계약을 해지할 수 있고, 약관의 변경내용에 대하여 이의를 제기하지 아니하는 경우에는 약관의 변경을 승인한 것으로 봅니다.</div>
                        <div><span className="font-bold">제22조 (약관 외 준칙)</span><br/>본 약관에서 정하지 아니한 사항과 본 약관의 해석에 관하여는 외국환거래법, 전자금융거래법, 전자상거래 등에서의 소비자보호에 관한 법률, 약관의 규제 등에 관한 법률, 공정거래위원회가 제정한 전자상거래 등에서의 소비자 보호 지침 및 관련 법령의 규정 등 관련 법규 및 일반관례에 의합니다.</div>
                        <div><span className="font-bold">제23조 (관할법원)</span><br/>이 거래와 관련한 분쟁이 발생할 경우 양 당사자의 합의에 의해 해결함을 원칙으로 합니다. 다만 당사자 간에 합의할 수 없거나 합의가 이루어지지 않아 이 거래와 관련하여 소송이 제기되는 경우 관할법원은 민사소송법에 정하는 바에 따르기로 합니다.</div>
                        <div className="text-xs text-gray-500 mt-4">서비스이용약관 버전번호: Ver 1.3<br/>서비스이용약관 시행일자: 2025. 05. 28.</div>
                      </div>
                    ) : (
                      <div className="space-y-4 text-sm text-gray-800">
                        {/* 온라인 환전 서비스 이용약관 전문 (예시) */}
                        <h3 className="font-bold text-lg mb-2">온라인 환전 서비스 이용약관</h3>
                        <div><span className="font-bold">제1조 (목적)</span><br/>이 약관은 주식회사 모아모아(이하 &apos;회사&apos;라 함)가 제공하는 온라인 환전 서비스(이하 &apos;서비스&apos;라 함)의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</div>
                        <div><span className="font-bold">제2조 (정의)</span><br/>① &apos;서비스&apos;란 회사가 제공하는 외화 환전, 결제, 정산 관련 모든 서비스를 의미합니다.<br/>② &apos;이용자&apos;란 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.<br/>③ &apos;회원&apos;이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며 회사가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.</div>
                        <div><span className="font-bold">제3조 (약관의 게시와 개정)</span><br/>① 회사는 이 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.<br/>② 회사는 필요하다고 인정되는 경우 이 약관을 개정할 수 있습니다.<br/>③ 개정된 약관은 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.</div>
                        <div><span className="font-bold">제4조 (서비스의 제공 및 변경)</span><br/>① 회사는 다음과 같은 업무를 수행합니다:<br/>1. 외화 환전 서비스 제공<br/>2. 결제 및 정산 서비스 제공<br/>3. 환율 정보 제공<br/>4. 기타 회사가 정하는 업무<br/>② 회사는 서비스의 내용을 변경할 경우에는 변경사유 및 변경내용을 명시하여 사전에 통지합니다.</div>
                        <div><span className="font-bold">제5조 (서비스의 중단)</span><br/>① 회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.<br/>② 회사는 국가비상사태, 정전, 서비스 설비의 장애 또는 서비스 이용의 폭주 등으로 정상적인 서비스 이용에 지장이 있는 때에는 서비스의 전부 또는 일부를 제한하거나 정지할 수 있습니다.</div>
                        <div><span className="font-bold">제6조 (회원가입)</span><br/>① 이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.<br/>② 회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각호에 해당하지 않는 한 회원으로 등록합니다:<br/>1. 가입신청자가 이 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우<br/>2. 등록 내용에 허위, 기재누락, 오기가 있는 경우<br/>3. 기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</div>
                        <div><span className="font-bold">제7조 (개인정보보호)</span><br/>회사는 관계법령이 정하는 바에 따라 이용자 등록정보를 포함한 이용자의 개인정보를 보호하기 위해 노력합니다. 이용자의 개인정보보호에 관해서는 관련법령 및 회사의 개인정보취급방침에 정한 바에 의합니다.</div>
                        <div><span className="font-bold">제8조 (회사의 의무)</span><br/>① 회사는 관련법령과 이 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며, 이 약관이 정하는 바에 따라 지속적이고, 안정적으로 서비스를 제공하는데 최선을 다하여야 합니다.<br/>② 회사는 이용자가 안전하게 인터넷 서비스를 이용할 수 있도록 이용자의 개인정보(신용정보 포함) 보호를 위한 보안 시스템을 구축하여야 합니다.</div>
                        <div className="text-xs text-gray-500 mt-4">서비스이용약관 버전번호: Ver 1.0<br/>서비스이용약관 시행일자: 2025. 06. 05.</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {openModal === 'privacy' && (
                <div className="space-y-4 text-sm text-gray-800">
                  <div>모아모아는 서비스 제공을 위해 아래와 같이 개인정보를 수집·이용하고자 합니다. 내용을 자세히 읽으신 후 동의 여부를 결정하여 주십시오.</div>
                  <div className="font-bold">▶ 개인정보 수집·이용 목적 및 항목</div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border text-xs md:text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border px-2 py-1 font-semibold">수집목적</th>
                          <th className="border px-2 py-1 font-semibold">수집항목</th>
                          <th className="border px-2 py-1 font-semibold">보유 및 이용기간</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[{
                          목적: '회원가입 및 본인확인',
                          항목: '- 필수 : 이름, 생년월일, 휴대폰번호, 비밀번호 본인확인정보(CI,DI)',
                          기간: '개인정보 수집 및 이용목적 달성 시 또는 회원탈퇴 까지',
                        }, {
                          목적: '고객확인 및 의심거래보고',
                          항목: '- (필수) 국문명, 영문명, 생년월일, 성별, 국적, 우편번호, 실거주 주소, 국적, 직업 및 업종 (개인사업자인 경우), 이메일 , 휴대폰 번호, 통신사, 본인확인정보(CI,DI), 신분증 사본 이미지 및 고유식별정보를 제외한 신분증 상의 정보\n- (필수) 고유식별정보 (주민등록번호, 운전면허번호, 외국인등록번호), 거래목적, 자금원천 및 관련 소명자료',
                          기간: '개인정보 수집 및 이용 동의일로부터 회원탈퇴 후 5년까지',
                        }, {
                          목적: '오픈뱅킹 출금동의',
                          항목: '- 필수 : 이름, 생년월일, CI, 휴대전화번호',
                          기간: '개인정보 수집 및 이용목적 달성 시 또는 회원탈퇴 까지',
                        }, {
                          목적: '카드발급 및 배송',
                          항목: '- 필수 : 주소, 영문이름, 휴대폰번호, 비밀번호, 직업',
                          기간: '개인정보 수집 및 이용목적 달성 시 또는 회원탈퇴 까지',
                        }, {
                          목적: '송금',
                          항목: '(필수) 송금인 정보: 송금인 영문 성 및 이름, 영문주소, 영문주소 상세, 도시, 송금인 계좌정보\n(필수) 수취인 정보:  영문 성 및 이름, 국가, 영문주소, 영문주소 상세, 도시, State/Province/Region, 계좌주명, 계좌번호',
                          기간: '개인정보 수집 및 이용목적 달성 시 또는 회원탈퇴 까지',
                        }, {
                          목적: '소셜 서비스',
                          항목: '- 필수 : 위치정보, 성별, 연령',
                          기간: '개인정보 수집 및 이용목적 달성 시 또는 회원탈퇴 까지',
                        }, {
                          목적: '은행계좌 등록',
                          항목: '- 필수 : 예금주명, 은행명, 생년월일, 계좌번호, 이메일',
                          기간: '개인정보 수집 및 이용목적 달성 시 또는 회원탈퇴 까지',
                        }, {
                          목적: '고객민원 처리',
                          항목: '- 필수 : 이름, 휴대폰번호 뒤 4자리\n- 선택 : 휴대폰번호',
                          기간: '개인정보 수집 및 이용목적 달성 시 또는 회원탈퇴 까지',
                        }, {
                          목적: '서비스 부정 확인',
                          항목: '- 필수: IP주소, MAC주소, 단말기 식별정보, 단말기 종류, 운영 OS, 휴대폰번호\n * PC의 경우 : HDD Serial Number\n * 모바일기기 : Android ID/UUID 등',
                          기간: '개인정보 수집 및 이용목적 달성 시 또는 회원탈퇴 까지',
                        }].map((row, idx) => (
                          <tr key={idx}>
                            <td className="border px-2 py-1 align-top whitespace-pre-line">{row.목적}</td>
                            <td className="border px-2 py-1 align-top whitespace-pre-line">{row.항목}</td>
                            <td className="border px-2 py-1 align-top whitespace-pre-line">{row.기간}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-xs text-gray-600">- 단, 회사는 관계 법령에서 요구하는 바를 준수하기 위하여 개인정보를 추가 보존할 수 있습니다.</div>
                  <div className="text-xs text-gray-600">세부 내용은 개인정보처리방침에서 확인 가능합니다.</div>
                  <div className="font-bold text-red-500 text-xs md:text-sm mt-2">※  회원은 위의 개인정보 제공에 대한 동의를 거부할 권리가 있습니다. 그러나 이 동의는 필수적 동의사항으로 동의를 거부할 경우 모아모아 서비스를 이용할 수 없습니다.</div>
                </div>
              )}
              {openModal === 'marketing' && (
                <div className="space-y-4 text-sm text-gray-800">
                  <h3 className="font-bold text-lg mb-2">마케팅 정보 수신 동의</h3>
                  <div>회사는 이벤트, 혜택, 신상품 안내 등 다양한 정보를 이메일, 문자, 앱 푸시 등으로 제공할 수 있습니다. 동의하지 않으셔도 서비스 이용에는 제한이 없습니다.</div>
                  <div><span className="font-bold">1. 수집 및 이용 목적</span><br/>마케팅 및 광고에의 활용, 신규 서비스 안내, 이벤트 정보 제공 등</div>
                  <div><span className="font-bold">2. 수집 항목</span><br/>이름, 연락처, 이메일 등</div>
                  <div><span className="font-bold">3. 보유 및 이용기간</span><br/>동의 철회 시 또는 회원 탈퇴 시까지</div>
                  <div className="text-xs text-gray-500 mt-4">시행일자: 2025. 01. 01.</div>
                </div>
              )}
            </div>
            <button className="mt-6 w-full rounded-lg bg-[#0DAEFF] py-3 text-center font-medium text-white" onClick={() => setOpenModal(null)}>
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
