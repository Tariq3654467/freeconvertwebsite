import Navbar from '../components/Navbar'
import { AuthProvider } from '../contexts/AuthContext'
import './globals.css'

export const metadata = {
  title: 'FreeConvert | File Converter',
  description: 'Easily convert files from one format to another online.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="bg-blobs">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
        </div>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
