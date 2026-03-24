import { NextRequest, NextResponse } from 'next/server'
import { generateNicheRecommendations } from '@/lib/claude'
import type { DiagnosticAnswer } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { answers } = body as { answers: DiagnosticAnswer[] }

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'Answers are required' },
        { status: 400 }
      )
    }

    const recommendation = await generateNicheRecommendations(answers)

    return NextResponse.json(recommendation)
  } catch (error) {
    console.error('Diagnostic API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}
