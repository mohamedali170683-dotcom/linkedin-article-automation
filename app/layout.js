import './globals.css'

export const metadata = {
  title: 'LinkedIn Article Agent',
  description: 'Automated evidence-based content for Human Psychology & Marketing',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  )
}
