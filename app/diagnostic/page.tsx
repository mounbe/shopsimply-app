'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, ArrowRight, ArrowLeft } from 'lucide-react'
import { DIAGNOSTIC_QUESTIONS } from '@/lib/diagnostic-questions'
import type { DiagnosticAnswer } from '@/types'
import { cn } from '@/lib/utils'

export default function DiagnosticPage() {
  const router = useRouter()
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<DiagnosticAnswer[]>([])
  const [selectedValues, setSelectedValues] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const question = DIAGNOSTIC_QUESTIONS[currentQ]
  const total = DIAGNOSTIC_QUESTIONS.length
  const progress = ((currentQ) / total) * 100

  const handleSelect = (value: string) => {
    if (question.type === 'grid' || question.type === 'single') {
      setSelectedValues([value])
    }
  }

  const handleNext = async () => {
    if (selectedValues.length === 0) return

    const newAnswers = [
      ...answers,
      { questionId: question.id, selectedValues },
    ]
    setAnswers(newAnswers)
    setSelectedValues([])

    if (currentQ < total - 1) {
      setCurrentQ(currentQ + 1)
    } else {
      // Last question — submit to API
      setLoading(true)
      try {
        const response = await fetch('/api/diagnostic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: newAnswers }),
        })
        if (!response.ok) throw new Error('API error')
        const result = await response.json()
        // Store in sessionStorage for results page
        sessionStorage.setItem('diagnostic_result', JSON.stringify(result))
        sessionStorage.setItem('diagnostic_answers', JSON.stringify(newAnswers))
        router.push('/resultats')
      } catch (err) {
        console.error(err)
        alert('Erreur lors de l\'analyse. Réessaie.')
        setLoading(false)
      }
    }
  }

  const handleBack = () => {
    if (currentQ > 0) {
      setCurrentQ(currentQ - 1)
      // Restore previous answer selection
      const prevAnswer = answers[currentQ - 1]
      setSelectedValues(prevAnswer?.selectedValues || [])
      setAnswers(answers.slice(0, -1))
    }
  }

  const handleSkip = () => {
    setAnswers([...answers, { questionId: question.id, selectedValues: [] }])
    setSelectedValues([])
    if (currentQ < total - 1) setCurrentQ(currentQ + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-navy px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-blue-200 text-sm font-semibold">
            Question {currentQ + 1} sur {total}
          </span>
          <button
            onClick={() => router.push('/')}
            className="text-blue-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-blue-200 text-xs">{Math.round(progress)}% complété</span>
          <span className="text-blue-200 text-xs">
            ~{Math.max(1, Math.ceil((total - currentQ) * 0.3))} min restantes
          </span>
        </div>
      </div>

      {/* Question body */}
      <div className="flex-1 px-5 py-6 max-w-2xl mx-auto w-full">
        <div className="text-xs font-bold text-accent uppercase tracking-wide mb-2">
          Question {currentQ + 1}
        </div>
        <h2 className="text-xl font-bold text-navy mb-2 leading-snug">
          {question.text}
        </h2>
        {question.subtext && (
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            {question.subtext}
          </p>
        )}

        {/* Grid choices */}
        {question.type === 'grid' && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {question.options.map(opt => (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  'bg-white border-2 rounded-2xl p-4 text-center cursor-pointer transition-all duration-200',
                  selectedValues.includes(opt.value)
                    ? 'border-accent bg-orange-50'
                    : 'border-gray-100 hover:border-accent/40 hover:bg-orange-50/30'
                )}
              >
                <div className="text-3xl mb-2">{opt.emoji}</div>
                <div className={cn(
                  'text-sm font-bold',
                  selectedValues.includes(opt.value) ? 'text-accent' : 'text-navy'
                )}>
                  {opt.label}
                </div>
                {opt.sublabel && (
                  <div className="text-xs text-gray-400 mt-0.5">{opt.sublabel}</div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Single choices (vertical list) */}
        {question.type === 'single' && (
          <div className="space-y-3 mb-6">
            {question.options.map(opt => (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  'w-full bg-white border-2 rounded-2xl p-4 flex items-center gap-3 text-left cursor-pointer transition-all duration-200',
                  selectedValues.includes(opt.value)
                    ? 'border-accent bg-orange-50'
                    : 'border-gray-100 hover:border-accent/40'
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    selectedValues.includes(opt.value)
                      ? 'border-accent bg-accent'
                      : 'border-gray-200'
                  )}
                >
                  {selectedValues.includes(opt.value) && (
                    <span className="text-white text-xs font-bold">✓</span>
                  )}
                </div>
                <div className="text-2xl">{opt.emoji}</div>
                <div>
                  <div className={cn(
                    'font-semibold text-sm',
                    selectedValues.includes(opt.value) ? 'text-accent' : 'text-navy'
                  )}>
                    {opt.label}
                  </div>
                  {opt.sublabel && (
                    <div className="text-xs text-gray-400 mt-0.5">{opt.sublabel}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 bg-white border-t border-gray-100 max-w-2xl mx-auto w-full">
        <button
          onClick={handleNext}
          disabled={selectedValues.length === 0 || loading}
          className={cn(
            'w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-base transition-all',
            selectedValues.length > 0 && !loading
              ? 'bg-accent text-white hover:opacity-90'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyse en cours...
            </>
          ) : currentQ === total - 1 ? (
            <>Voir mes recommandations 🚀</>
          ) : (
            <>Suivant <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
        <div className="flex justify-between mt-3">
          {currentQ > 0 ? (
            <button onClick={handleBack} className="text-gray-400 text-sm flex items-center gap-1 hover:text-navy">
              <ArrowLeft className="w-3 h-3" /> Précédent
            </button>
          ) : <div />}
          <button onClick={handleSkip} className="text-teal-brand text-sm font-semibold hover:opacity-80">
            Passer →
          </button>
        </div>
      </div>
    </div>
  )
}
