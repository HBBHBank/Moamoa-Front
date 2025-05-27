"use client"

import type React from "react"
import { useState } from "react"
import { ChevronLeft, X, Delete } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPasswordInput, setShowPasswordInput] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validateEmail = (email: string) => {
    const regex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
    return regex.test(email)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    setErrors((prev) => ({ ...prev, email: undefined }))
  }

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateEmail(email)) {
      setErrors({ email: "유효한 이메일 형식이 아닙니다." })
      return
    }

    setShowPasswordInput(true)
  }

  const handleNumpadClick = (digit: string) => {
    if (password.length < 6) {
      setPassword(password + digit)
      setErrors((prev) => ({ ...prev, password: undefined }))
    }
  }

  const handleBackspace = () => {
    setPassword(password.slice(0, -1))
  }

  const handleLogin = async () => {
    if (password.length !== 6) {
      setErrors({ password: "비밀번호는 6자리 숫자여야 합니다." })
      return
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const errorBody = await res.json()

        if (errorBody.fieldErrors) {
          const fieldErrors = errorBody.fieldErrors.reduce((acc: any, curr: any) => {
            acc[curr.field] = curr.message
            return acc
          }, {})
          setErrors(fieldErrors)
        } else {
          alert(errorBody.message || "로그인에 실패했습니다.")
        }

        return
      }

      const data = await res.json()

      localStorage.setItem("isLoggedIn", "true")
      localStorage.setItem("userEmail", email)
      localStorage.setItem("accessToken", data.accessToken)
      localStorage.setItem("refreshToken", data.refreshToken)

      router.push("/home")
    } catch (error) {
      console.error(error)
      alert("서버 오류가 발생했습니다.")
    }
  }

  const renderPasswordDots = () => (
    <div className="flex justify-center space-x-3 py-4">
      {Array(6)
        .fill(0)
        .map((_, index) => (
          <div
            key={index}
            className={`h-4 w-4 rounded-full ${index < password.length ? "bg-[#0DAEFF]" : "bg-gray-200"}`}
          />
        ))}
    </div>
  )

  const renderNumpad = () => {
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
              if (num === "") return <div key={colIndex} className="h-12 w-12" />
              if (num === "backspace") {
                return (
                  <button
                    key={colIndex}
                    type="button"
                    className="flex h-12 w-12 items-center justify-center rounded-full text-gray-600"
                    onClick={handleBackspace}
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
                  onClick={() => handleNumpadClick(num)}
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
            {renderPasswordDots()}
            {renderNumpad()}
            {errors.password && (
              <p className="mt-4 text-center text-sm text-red-500">{errors.password}</p>
            )}
          </div>
        </div>

        {password.length === 6 && (
          <div className="p-4">
            <button
              type="button"
              onClick={handleLogin}
              className="h-[60px] w-full rounded-[30px] bg-[#0DAEFF] text-lg font-medium text-white shadow-md hover:bg-[#0A9EE8]"
            >
              로그인
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex items-center justify-between border-b border-gray-200 p-4">
        <Link href="/" className="text-gray-700">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-medium">로그인</h1>
        <Link href="/" className="text-gray-700">
          <X size={24} />
        </Link>
      </header>

      <div className="flex-1 p-4">
        <form onSubmit={handleNextStep} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              이메일
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              className="w-full rounded-lg border border-gray-300 p-3 focus:ring-[#0DAEFF]"
              placeholder="example@email.com"
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>

          <div className="pt-6">
            <button
              type="submit"
              className="h-[60px] w-full rounded-[30px] bg-[#0DAEFF] text-lg font-medium text-white shadow-md hover:bg-[#0A9EE8]"
            >
              다음
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
