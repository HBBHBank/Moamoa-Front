import { NextResponse } from 'next/server'

export async function GET() {
  // Chrome DevTools 관련 요청에 대해 빈 응답 반환
  return NextResponse.json({}, { status: 204 })
}

export async function POST() {
  return NextResponse.json({}, { status: 204 })
}

export async function PUT() {
  return NextResponse.json({}, { status: 204 })
}

export async function DELETE() {
  return NextResponse.json({}, { status: 204 })
} 