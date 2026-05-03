import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Inter } from 'next/font/google'
import './globals.css'
import ConditionalNavbar from '../components/ConditionalNavbar'
import ConditionalFooter from '../components/ConditionalFooter'
import { AuthProvider } from '../contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PrismConvert - File Converter',
  description: 'Convert images, videos, audio, documents and more. Fast, private, secure.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Suspense fallback={null}>
            <ConditionalNavbar />
          </Suspense>
          {children}
          <Suspense fallback={null}>
            <ConditionalFooter />
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  )
}
