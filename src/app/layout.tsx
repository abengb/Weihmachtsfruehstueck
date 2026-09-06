import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  display: 'swap',
  axes: ['SOFT', 'WONK'],
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Weihnachtsfrühstück Schrickel',
  description:
    'Ei-Wünsche abgeben, Fragen beantworten, Kochplan erzeugen. Glinde · Weihnachtsfrühstück im September.',
}

export const viewport: Viewport = {
  themeColor: '#1e4d3b',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="de" className={`${fraunces.variable} ${inter.variable} h-full antialiased`}>
      <body className="papier min-h-full">{children}</body>
    </html>
  )
}
