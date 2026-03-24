'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ArrowRight, ArrowLeft, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────
export interface TooltipStep {
  target: string          // CSS selector of the element to highlight
  title: string
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  emoji?: string
}

interface OnboardingTooltipProps {
  steps: TooltipStep[]
  storageKey: string      // localStorage key to remember if tour was seen
  delay?: number          // ms before showing first tooltip
  onComplete?: () => void
}

// ── Component ────────────────────────────────────────────────
export function OnboardingTooltip({
  steps,
  storageKey,
  delay = 800,
  onComplete,
}: OnboardingTooltipProps) {
  const [active, setActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Ne pas montrer si déjà vu
    const seen = localStorage.getItem(storageKey)
    if (seen) return

    const timer = setTimeout(() => setActive(true), delay)
    return () => clearTimeout(timer)
  }, [storageKey, delay])

  useEffect(() => {
    if (!active) return
    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [active, currentStep])

  const updatePosition = () => {
    const step = steps[currentStep]
    if (!step) return

    const target = document.querySelector(step.target)
    if (!target) return

    const rect = target.getBoundingClientRect()
    setHighlightRect(rect)

    const TOOLTIP_W = 280
    const TOOLTIP_H = 140
    const PADDING = 12

    let top = 0
    let left = 0
    const position = step.position || 'bottom'

    switch (position) {
      case 'bottom':
        top = rect.bottom + PADDING
        left = Math.max(PADDING, Math.min(rect.left + rect.width / 2 - TOOLTIP_W / 2, window.innerWidth - TOOLTIP_W - PADDING))
        break
      case 'top':
        top = rect.top - TOOLTIP_H - PADDING
        left = Math.max(PADDING, Math.min(rect.left + rect.width / 2 - TOOLTIP_W / 2, window.innerWidth - TOOLTIP_W - PADDING))
        break
      case 'right':
        top = rect.top + rect.height / 2 - TOOLTIP_H / 2
        left = rect.right + PADDING
        break
      case 'left':
        top = rect.top + rect.height / 2 - TOOLTIP_H / 2
        left = rect.left - TOOLTIP_W - PADDING
        break
    }

    setTooltipPos({ top, left })

    // Scroll element into view
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1)
  }

  const handleComplete = () => {
    localStorage.setItem(storageKey, 'true')
    setActive(false)
    onComplete?.()
  }

  const handleSkip = () => {
    localStorage.setItem(storageKey, 'true')
    setActive(false)
  }

  if (!active) return null

  const step = steps[currentStep]
  if (!step) return null

  return (
    <>
      {/* Overlay avec découpe sur l'élément ciblé */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9990] pointer-events-none"
        style={{
          background: highlightRect
            ? `radial-gradient(ellipse ${highlightRect.width + 24}px ${highlightRect.height + 24}px at ${highlightRect.left + highlightRect.width / 2}px ${highlightRect.top + highlightRect.height / 2}px, transparent 0%, rgba(0,0,0,0.55) 100%)`
            : 'rgba(0,0,0,0.55)',
        }}
      />

      {/* Highlight border */}
      {highlightRect && (
        <div
          className="fixed z-[9991] pointer-events-none rounded-xl ring-2 ring-accent ring-offset-2 ring-offset-transparent animate-pulse"
          style={{
            top: highlightRect.top - 4,
            left: highlightRect.left - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        className="fixed z-[9992] pointer-events-auto"
        style={{ top: tooltipPos.top, left: tooltipPos.left, width: 280 }}
      >
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-navy px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{step.emoji || '💡'}</span>
              <span className="text-white font-black text-sm">{step.title}</span>
            </div>
            <button
              onClick={handleSkip}
              className="text-blue-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 py-3">
            <p className="text-sm text-gray-600 leading-relaxed">{step.content}</p>
          </div>

          {/* Footer */}
          <div className="px-4 pb-3 flex items-center justify-between">
            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full transition-all',
                    i === currentStep ? 'bg-accent w-3' : 'bg-gray-200'
                  )}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 font-semibold"
                >
                  <ArrowLeft className="w-3 h-3" /> Préc.
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex items-center gap-1.5 bg-accent text-white text-xs font-black px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                {currentStep === steps.length - 1 ? (
                  <>C\'est parti ! ✨</>
                ) : (
                  <>Suiv. <ArrowRight className="w-3 h-3" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Click outside = fermer */}
      <div
        className="fixed inset-0 z-[9989]"
        onClick={handleSkip}
      />
    </>
  )
}


// ── Tours prédéfinis ──────────────────────────────────────────

export const DASHBOARD_TOUR: TooltipStep[] = [
  {
    target: 'h1',
    title: 'Bienvenue sur ton dashboard !',
    content: 'Ici tu retrouves toute ton activité en un coup d\'œil : commandes, CA, progression de ton plan 30 jours.',
    position: 'bottom',
    emoji: '🏠',
  },
  {
    target: '[data-tour="kpis"]',
    title: 'Tes KPIs en temps réel',
    content: 'Chiffre d\'affaires, commandes en attente, visiteurs et taux de clic — mis à jour automatiquement depuis ta boutique.',
    position: 'bottom',
    emoji: '📊',
  },
  {
    target: '[data-tour="plan-progress"]',
    title: 'Ton plan 30 jours',
    content: 'Chaque tâche cochée te rapproche de ta 1ère vente. L\'IA adapte les conseils à ton avancement.',
    position: 'top',
    emoji: '🎯',
  },
  {
    target: '[data-tour="assistant-cta"]',
    title: 'ShopAI — Ton assistant 24/7',
    content: 'Besoin d\'une fiche produit ? Un script de relance ? Une pub Facebook ? ShopAI répond en darija ou en français.',
    position: 'top',
    emoji: '🤖',
  },
]

export const CRM_TOUR: TooltipStep[] = [
  {
    target: '[data-tour="crm-stats"]',
    title: 'Stats clients',
    content: 'CA total, taux de confirmation COD et nombre de commandes — calculés en temps réel depuis tes données.',
    position: 'bottom',
    emoji: '📈',
  },
  {
    target: '[data-tour="crm-search"]',
    title: 'Recherche instantanée',
    content: 'Trouve un client par nom, téléphone ou ville en quelques lettres. Filtre aussi par tags (VIP, Nouveau...)',
    position: 'bottom',
    emoji: '🔍',
  },
  {
    target: '[data-tour="add-client"]',
    title: 'Ajouter un client',
    content: 'Saisis manuellement tes clients COD. Chaque commande met automatiquement à jour leurs totaux.',
    position: 'left',
    emoji: '➕',
  },
]

export const COMMANDES_TOUR: TooltipStep[] = [
  {
    target: '[data-tour="view-toggle"]',
    title: 'Vue Liste ou Kanban',
    content: 'Choisis la vue qui te convient. Le Kanban montre le pipeline COD : En attente → Confirmée → Expédiée → Livrée.',
    position: 'bottom',
    emoji: '🗂️',
  },
  {
    target: '[data-tour="pending-filter"]',
    title: 'Commandes en attente',
    content: 'Les commandes en attente de confirmation sont prioritaires. Confirme-les rapidement pour expédier aujourd\'hui.',
    position: 'bottom',
    emoji: '⏳',
  },
]

export const OUTILS_TOUR: TooltipStep[] = [
  {
    target: '[data-tour="calculateur-card"]',
    title: 'Calculateur COD Amana',
    content: 'Calcule ta vraie marge après frais Amana, retours (25-40%) et pub Facebook. Indispensable avant de lancer un produit.',
    position: 'bottom',
    emoji: '🧮',
  },
  {
    target: '[data-tour="generateur-card"]',
    title: 'Générateur de contenu',
    content: 'Crée des pubs Facebook, posts Instagram et scripts WhatsApp en darija ou français en 1 clic.',
    position: 'bottom',
    emoji: '✨',
  },
]
