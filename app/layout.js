import { DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata = {
  title: 'Mohamed Ali Mohamed - Career Command Center',
  description: 'VP Marketing / CMO campaign tools and Catchlight newsletter engine',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${jetbrainsMono.variable} font-[var(--font-dm-sans)] bg-slate-950 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
