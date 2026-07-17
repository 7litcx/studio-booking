import React from 'react'
import '@/index.css'
import Providers from '@/components/Providers'
import ClientLayout from '@/components/ClientLayout'

export const metadata = {
  title: 'Lumiere Studios - Premium Creative Spaces',
  description: 'Reserve photography, videography, podcast, and production studios with a seamless luxury booking experience.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Outfit:wght@200;300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <Providers>
          <ClientLayout>
            {children}
          </ClientLayout>
        </Providers>
      </body>
    </html>
  )
}
