'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Phone, MapPin, Tag, Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

const CITIES = ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Meknès', 'Oujda', 'Kénitra', 'Tétouan', 'Autre']

const PRESET_TAGS = ['VIP', 'Fidèle', 'Nouveau', 'À relancer', 'Beauté', 'Mode', 'Maison', 'Sport']

export default function NouveauClientPage() {
  const router = useRouter()
  const supabase = createClient()
  const { success, error: toastError } = useToast()

  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    city: '',
    email: '',
    notes: '',
  })
  const [tags, setTags] = useState<string[]>(['Nouveau'])
  const [customTag, setCustomTag] = useState('')

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const toggleTag = (tag: string) => {
    setTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const addCustomTag = () => {
    const t = customTag.trim()
    if (t && !tags.includes(t)) {
      setTags(prev => [...prev, t])
      setCustomTag('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toastError('Le nom est obligatoire'); return }

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('clients').insert({
      user_id: user.id,
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      city: form.city || null,
      email: form.email.trim() || null,
      notes: form.notes.trim() || null,
      tags,
      total_orders: 0,
      total_spent: 0,
      created_at: new Date().toISOString(),
    })

    setSaving(false)

    if (error) {
      toastError('Erreur lors de la création. Réessaie.')
    } else {
      success('Client ajouté avec succès !')
      router.push('/crm')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-navy px-5 py-5 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-blue-200 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-white font-black">Nouveau client</h1>
          <p className="text-blue-200 text-xs">Ajouter manuellement</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 px-4 py-5 space-y-4">
        {/* Infos principales */}
        <div className="card space-y-4">
          <h2 className="font-bold text-navy flex items-center gap-2">
            <User className="w-4 h-4 text-accent" /> Informations
          </h2>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Nom complet <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Fatima Zahra El Amrani"
              required
              autoFocus
              className="input"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Numéro WhatsApp / Téléphone
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 font-semibold flex-shrink-0">🇲🇦 +212</span>
              <input
                type="tel"
                value={form.phone}
                onChange={e => {
                  let v = e.target.value.replace(/\D/g, '')
                  if (v.startsWith('212')) v = v.slice(3)
                  if (v.startsWith('0')) v = v.slice(1)
                  set('phone', v ? `+212 ${v}` : '')
                }}
                placeholder="6 12 34 56 78"
                className="input flex-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Ville
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CITIES.map(city => (
                <button
                  key={city}
                  type="button"
                  onClick={() => set('city', form.city === city ? '' : city)}
                  className={cn(
                    'py-2 px-2 rounded-xl text-xs font-semibold border-2 transition-all',
                    form.city === city
                      ? 'border-accent bg-orange-50 text-accent'
                      : 'border-gray-100 text-gray-500 hover:border-gray-200'
                  )}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Email <span className="text-gray-400 normal-case font-normal">(optionnel)</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="client@exemple.com"
              className="input"
            />
          </div>
        </div>

        {/* Tags */}
        <div className="card space-y-3">
          <h2 className="font-bold text-navy flex items-center gap-2">
            <Tag className="w-4 h-4 text-accent" /> Tags
          </h2>
          <div className="flex flex-wrap gap-2">
            {PRESET_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all',
                  tags.includes(tag)
                    ? 'bg-navy text-white border-navy'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                )}
              >
                {tags.includes(tag) ? '✓ ' : ''}{tag}
              </button>
            ))}
          </div>
          {/* Custom tag */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customTag}
              onChange={e => setCustomTag(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag() } }}
              placeholder="Tag personnalisé..."
              className="input flex-1 text-sm py-2"
            />
            <button
              type="button"
              onClick={addCustomTag}
              className="w-9 h-9 bg-navy rounded-xl flex items-center justify-center text-white hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {/* Tags sélectionnés */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 bg-navy/10 text-navy text-xs font-bold px-2.5 py-1 rounded-full">
                  {tag}
                  <button type="button" onClick={() => toggleTag(tag)} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="card space-y-2">
          <label className="font-bold text-navy text-sm">
            Notes <span className="text-gray-400 font-normal text-xs">(optionnel)</span>
          </label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Préférences, historique, informations utiles..."
            rows={3}
            className="w-full text-sm text-gray-700 leading-relaxed resize-none focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving || !form.name.trim()}
          className={cn('btn-primary', (saving || !form.name.trim()) && 'opacity-60')}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              Enregistrement...
            </span>
          ) : '+ Ajouter le client'}
        </button>
      </form>
    </div>
  )
}
