'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bell } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

interface NotifSetting {
  id: string
  label: string
  desc: string
  icon: string
  enabled: boolean
}

const DEFAULT_SETTINGS: NotifSetting[] = [
  { id: 'new_order', label: 'Nouvelle commande', desc: 'Alerte dès qu\'une commande est reçue', icon: '📦', enabled: true },
  { id: 'daily_recap', label: 'Récap quotidien', desc: 'Résumé de tes ventes chaque soir à 20h', icon: '📊', enabled: true },
  { id: 'task_reminder', label: 'Rappel tâches', desc: 'Rappel des tâches du plan 30j non faites', icon: '✅', enabled: false },
  { id: 'ai_tips', label: 'Conseils IA', desc: 'Astuces personnalisées selon tes performances', icon: '🤖', enabled: true },
  { id: 'cod_followup', label: 'Suivi COD', desc: 'Rappel pour relancer les commandes en attente', icon: '💬', enabled: true },
  { id: 'promo_alerts', label: 'Alertes promo', desc: 'Annonces ShopSimply et nouvelles fonctionnalités', icon: '🎁', enabled: false },
]

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={cn(
        'relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0',
        enabled ? 'bg-accent' : 'bg-gray-200'
      )}
    >
      <div
        className={cn(
          'absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200',
          enabled ? 'translate-x-7' : 'translate-x-1'
        )}
      />
    </button>
  )
}

export default function NotificationsPage() {
  const router = useRouter()
  const { success } = useToast()
  const [settings, setSettings] = useState<NotifSetting[]>(DEFAULT_SETTINGS)
  const [saving, setSaving] = useState(false)

  const toggle = (id: string, value: boolean) => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, enabled: value } : s))
  }

  const handleSave = async () => {
    setSaving(true)
    // In production: save to Supabase profiles table (notification_preferences JSONB)
    await new Promise(r => setTimeout(r, 600))
    success('Préférences de notification sauvegardées !')
    setSaving(false)
  }

  const enabledCount = settings.filter(s => s.enabled).length

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      <div className="bg-navy px-5 py-5 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-blue-200 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
          <Bell className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-white font-black">Notifications</h1>
          <p className="text-blue-200 text-xs">{enabledCount} activée{enabledCount > 1 ? 's' : ''} sur {settings.length}</p>
        </div>
      </div>

      <div className="flex-1 px-4 py-5 space-y-3">
        <div className="card divide-y divide-gray-50">
          {settings.map(setting => (
            <div key={setting.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                {setting.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-navy text-sm">{setting.label}</div>
                <div className="text-xs text-gray-400 mt-0.5 leading-snug">{setting.desc}</div>
              </div>
              <Toggle enabled={setting.enabled} onChange={v => toggle(setting.id, v)} />
            </div>
          ))}
        </div>

        {/* All off / all on shortcuts */}
        <div className="flex gap-2">
          <button
            onClick={() => setSettings(prev => prev.map(s => ({ ...s, enabled: true })))}
            className="flex-1 bg-white border border-gray-200 text-navy text-sm font-semibold py-2.5 rounded-xl hover:border-accent transition-colors"
          >
            Tout activer
          </button>
          <button
            onClick={() => setSettings(prev => prev.map(s => ({ ...s, enabled: false })))}
            className="flex-1 bg-white border border-gray-200 text-gray-500 text-sm font-semibold py-2.5 rounded-xl hover:border-gray-300 transition-colors"
          >
            Tout désactiver
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={cn('btn-primary', saving && 'opacity-60')}
        >
          {saving ? 'Sauvegarde...' : 'Enregistrer mes préférences'}
        </button>
      </div>
    </div>
  )
}
