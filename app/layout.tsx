import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: 'ShopSimply — Lance ton e-commerce au Maroc en 48h',
  description:
    "L'IA qui configure ta boutique, choisit tes produits et t'accompagne jusqu'à la 1ère vente. Youcan, Shopify, COD natif.",
  keywords: 'ecommerce maroc, boutique en ligne maroc, youcan, shopify maroc, dropshipping maroc',
  manifest: '/manifest.json',
  themeColor: '#1E2761',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ShopSimply',
  },
  openGraph: {
    title: "ShopSimply — E-commerce Maroc simplifié par l'IA",
    description: "Lance ta boutique en ligne en 48h avec l'IA. Pour les débutants marocains.",
    locale: 'fr_MA',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
