import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OneDollarPoll - Anonymous Polls with Paid Results',
  description: 'Create anonymous polls and charge $1 to view results',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <h1 className="text-2xl font-bold text-gray-900">
                <a href="/" className="hover:text-blue-600">OneDollarPoll</a>
              </h1>
              <p className="text-sm text-gray-600 mt-1">Anonymous polls • $1 to view results</p>
            </div>
          </header>
          <main className="max-w-4xl mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}