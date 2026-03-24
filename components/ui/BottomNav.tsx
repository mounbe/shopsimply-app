'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', icon: '🏠', label: 'Accueil' },
  { href: '/plan', icon: '📋', label: 'Plan' },
  { href: '/assistant', icon: '🤖', label: 'IA' },
  { href: '/crm', icon: '👥', label: 'CRM' },
  { href: '/profil', icon: '⚙️', label: 'Profil' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="flex border-t border-gray-100 bg-white py-2 sticky bottom-0 z-10">
      {NAV_ITEMS.map(item => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.label}
            href={item.href}
            className="flex-1 flex flex-col items-center gap-0.5 py-1"
          >
            <span className="text-xl">{item.icon}</span>
            <span className={cn('text-[10px] font-bold', isActive ? 'text-accent' : 'text-gray-400')}>
              {item.label}
            </span>
            {isActive && <div className="w-1 h-1 rounded-full bg-accent" />}
          </Link>
        )
      })}
    </nav>
  )
}
