import Navbar from '../components/Navbar'
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
        <Navbar />
        {children}
      </body>
    </html>
  )
}
