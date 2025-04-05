'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SpotifyAuthWithPKCE from '@/components/SpotifyAuthWithPKCE';
import './globals.css';

export default function RootLayout({ children }) {
  const pathname = usePathname();
  
  // Helper to check if we're on a specific route type
  const isStatsRoute = pathname?.includes('/stats/');
  const isSettingsRoute = pathname?.includes('/settings/');
  const isIndexRoute = pathname === '/';

  return (
    <html lang="en">
      <head>
        <title>Riffle</title>
      </head>
      <body>
        <header style={{
          backgroundColor: '#1a1a1a',
          alignItems: 'center',
          flexDirection: 'row',
        }}>
          {/* Logo and title on the left */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Image 
              src="/images/riffle_logo.png" 
              alt="Riffle Logo" 
              width={50} 
              height={50}
              style={{ marginLeft: '40px' }}
            />
            <span style={{ 
              padding: '0 10px', 
              fontSize: '25px', 
              fontWeight: 'bold', 
              color: 'white', 
              fontFamily: 'Lato-Bold',
            }}>
              Riffle
            </span>
          </div>
          
          {/* Navigation links or auth button on the right */}
          <div style={{ marginRight: '65px' }}>
            {isIndexRoute && <SpotifyAuthWithPKCE />}
            
            {isStatsRoute && (
              <Link 
                href={pathname?.replace('/stats/', '/settings/')} 
                style={{ 
                  fontSize: '25px', 
                  fontWeight: 'bold', 
                  color: 'white', 
                  fontFamily: 'Lato-Bold, Arial, sans-serif',
                  textDecoration: 'none'
                }}
              >
                Settings
              </Link>
            )}
            
            {isSettingsRoute && (
              <Link 
                href={pathname?.replace('/settings/', '/stats/')} 
                style={{ 
                  fontSize: '25px', 
                  fontWeight: 'bold', 
                  color: 'white', 
                  fontFamily: 'Lato-Bold, Arial, sans-serif',
                  textDecoration: 'none'
                }}
              >
                Stats
              </Link>
            )}
          </div>
        </header>
        
        <main style={{ minHeight: '100vh', paddingTop: '16px' }}>
          {children}
        </main>
      </body>
    </html>
  );
}