"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ChevronLeft, X, Delete } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function SignupFormPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
  })
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [showPasswordInput, setShowPasswordInput] = useState(false)
  const [showPasswordConfirmInput, setShowPasswordConfirmInput] = useState(false)
  const [termsAgreement, setTermsAgreement] = useState<{
    serviceTermsAgreed: boolean
    privacyPolicyAgreed: boolean
    marketingAgreed: boolean
  } | null>(null)

  useEffect(() => {
    // Retrieve terms agreement data from localStorage
    const storedTerms = localStorage.getItem("termsAgreement")
    if (storedTerms) {
      setTermsAgreement(JSON.parse(storedTerms))
    } else {
      // If no terms agreement data, redirect back to terms page
      router.push("/signup/terms")
    }
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const validateEmail = (email: string) => {
    const regex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
    return regex.test(email)
  }

  const validatePhoneNumber = (phone: string) => {
    const regex = /^01([0|1|6|7|8|9])\d{3,4}\d{4}$/
    return regex.test(phone)
  }

  const handleNumpadClick = (digit: string, isPassword: boolean) => {
    if (isPassword) {
      if (password.length < 6) {
        setPassword(password + digit)
      }
    } else {
      if (passwordConfirm.length < 6) {
        setPasswordConfirm(passwordConfirm + digit)
      }
    }
  }

  const handleBackspace = (isPassword: boolean) => {
    if (isPassword) {
      setPassword(password.slice(0, -1))
    } else {
      setPasswordConfirm(passwordConfirm.slice(0, -1))
    }
  }

  const handleNextStep = () => {
    // Validate form data
    if (!formData.name) {
      alert("이름은 필수로 입력해야 합니다.")
      return
    }

    if (!validateEmail(formData.email)) {
      alert("유효한 이메일 형식이 아닙니다.")
      return
    }

    if (!validatePhoneNumber(formData.phoneNumber)) {
      alert("전화번호 형식에 맞게 입력해야 합니다.")
      return
    }

    // Show password input
    setShowPasswordInput(true)
  }

  const handlePasswordNext = () => {
    if (password.length !== 6) {
      alert("비밀번호는 6자리 숫자여야 합니다.")
      return
    }

    setShowPasswordConfirmInput(true)
  }

  const handleSubmit = () => {
    if (password !== passwordConfirm) {
      alert("비밀번호와 비밀번호 확인이 일치하지 않습니다.")
      setPasswordConfirm("")
      return
    }

    // Combine form data with terms agreement data
    const signupData = {
      ...formData,
      password,
      ...termsAgreement,
      profileImage: null, // Optional field
    }

    // Here you would typically send the data to your backend API
    console.log("Signup data:", signupData)

    // Set login state
    localStorage.setItem("isLoggedIn", "true")
    localStorage.setItem("userEmail", formData.email)

    // Redirect to home page
    router.push("/home")
  }

  // Render password dots
  const renderPasswordDots = (value: string) => {
    return (
      <div className="flex justify-center space-x-3 py-4">
        {Array(6)
          .fill(0)
          .map((_, index) => (
            <div
              key={index}
              className={`h-4 w-4 rounded-full ${index < value.length ? "bg-[#0DAEFF]" : "bg-gray-200"}`}
            ></div>
          ))}
      </div>
    )
  }

  // Render numpad
  const renderNumpad = (isPassword: boolean) => {
    const numbers = [
      ["1", "2", "3"],
      ["4", "5", "6"],
      ["7", "8", "9"],
      ["", "0", "backspace"],
    ]

    return (
      <div className="mt-8">
        {numbers.map((row, rowIndex) => (
          <div key={rowIndex} className="mb-6 flex justify-center space-x-12">
            {row.map((num, colIndex) => {
              if (num === "") {
                return <div key={colIndex} className="h-12 w-12"></div>
              }
              if (num === "backspace") {
                return (
                  <button
                    key={colIndex}
                    type="button"
                    className="flex h-12 w-12 items-center justify-center rounded-full text-gray-600"
                    onClick={() => handleBackspace(isPassword)}
                  >
                    <Delete size={24} />
                  </button>
                )
              }
              return (
                <button
                  key={colIndex}
                  type="button"
                  className="flex h-12 w-12 items-center justify-center rounded-full text-2xl font-medium text-gray-800"
                  onClick={() => handleNumpadClick(num, isPassword)}
                >
                  {num}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  if (showPasswordConfirmInput) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <header className="flex items-center justify-between border-b border-gray-200 p-4">
          <button onClick={() => setShowPasswordConfirmInput(false)} className="text-gray-700">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-medium">암호 확인</h1>
          <Link href="/" className="text-gray-700">
            <X size={24} />
          </Link>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <div className="w-full max-w-md">
            <h2 className="mb-6 text-center text-xl font-medium">확인을 위해 한 번 더 입력해 주세요.</h2>
            {renderPasswordDots(passwordConfirm)}
            {renderNumpad(false)}
          </div>
        </div>

        {passwordConfirm.length === 6 && (
          <div className="p-4">
            <button
              type="button"
              onClick={handleSubmit}
              className="h-[60px] w-full rounded-[30px] bg-[#0DAEFF] text-center text-lg font-medium text-white shadow-[7px_7px_10px_0px_#D9D9D9] transition-all hover:bg-[#0A9EE8]"
            >
              가입하기
            </button>
          </div>
        )}
      </div>
    )
  }

  if (showPasswordInput) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <header className="flex items-center justify-between border-b border-gray-200 p-4">
          <button onClick={() => setShowPasswordInput(false)} className="text-gray-700">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-medium">암호 입력</h1>
          <Link href="/" className="text-gray-700">
            <X size={24} />
          </Link>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <div className="w-full max-w-md">
            <h2 className="mb-6 text-center text-xl font-medium">모아모아 암호를 입력해 주세요.</h2>
            {renderPasswordDots(password)}
            {renderNumpad(true)}
          </div>
        </div>

        {password.length === 6 && (
          <div className="p-4">
            <button
              type="button"
              onClick={handlePasswordNext}
              className="h-[60px] w-full rounded-[30px] bg-[#0DAEFF] text-center text-lg font-medium text-white shadow-[7px_7px_10px_0px_#D9D9D9] transition-all hover:bg-[#0A9EE8]"
            >
              다음
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 p-4">
        <Link href="/signup/terms" className="text-gray-700">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-medium">회원가입</h1>
        <Link href="/" className="text-gray-700">
          <X size={24} />
        </Link>
      </header>

      <div className="flex-1 p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleNextStep()
          }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              이름
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-3 focus:border-[#0DAEFF] focus:outline-none focus:ring-1 focus:ring-[#0DAEFF]"
              placeholder="이름을 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              이메일
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-3 focus:border-[#0DAEFF] focus:outline-none focus:ring-1 focus:ring-[#0DAEFF]"
              placeholder="example@email.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
              전화번호
            </label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 p-3 focus:border-[#0DAEFF] focus:outline-none focus:ring-1 focus:ring-[#0DAEFF]"
              placeholder="01012345678"
            />
          </div>

          <div className="pt-6">
            <button
              type="submit"
              className="h-[60px] w-full rounded-[30px] bg-[#0DAEFF] text-center text-lg font-medium text-white shadow-[7px_7px_10px_0px_#D9D9D9] transition-all hover:bg-[#0A9EE8]"
            >
              다음
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
