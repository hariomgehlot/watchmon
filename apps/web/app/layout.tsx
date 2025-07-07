import '@repo/ui/styles.css'
import '../index.css'
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SocketProvider } from './socket-provider';
import { StunProvider } from './stun-provider';
// import { UserIdProvider } from './user-id-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'watchmon - Watch Monster',
  description: 'Watch videos together',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <SocketProvider>
          <StunProvider>
            {children}
          </StunProvider>
        </SocketProvider>
      </body>
    </html>
  );
}