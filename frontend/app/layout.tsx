import './globals.css'

export const metadata = {
  title: 'FreeConvert Replica',
  description: 'Convert files online for free',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <nav className="navbar">
          <div className="logo">FreeConvert Replica</div>
          <div className="nav-links">
            <a href="/login">Login</a>
            <a href="/signup" className="btn-primary">Sign Up</a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
