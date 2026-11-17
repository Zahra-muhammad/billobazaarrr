import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Archivo, Inter_Tight } from 'next/font/google';
import './globals.css';
import { site } from '@/data/site';
import LogoSymbol from '@/components/LogoSymbol';
import PencilFilters from '@/components/PencilFilters';
import PageTransition from '@/components/PageTransition';
import Loader from '@/components/Loader';
import Menu from '@/components/Menu';
import Footer from '@/components/Footer';
import SmoothScroll from '@/components/SmoothScroll';

// Two fonts across the whole site (the "Your sketch, made real." pairing):
// Archivo for headings: heavy, condensed (the width axis, set to 62 in globals.css), in capitals
const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' });
// Inter Tight for everything else, as the full variable font (every weight from 100 to 900, so
// the home headline's letters can swell from 300 to 700 near the cursor)
const interTight = Inter_Tight({ subsets: ['latin'], variable: '--font-intertight', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(`https://${site.domain}`),
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.description,
  openGraph: { title: site.name, description: site.description, url: '/', siteName: site.name, type: 'website' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#3B0A0A',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  // suppressHydrationWarning: browser extensions (Grammarly and others) add attributes to
  // <html>/<body> before React loads, which would otherwise be reported as a mismatch
  return (
    <html lang="en" className={`${archivo.variable} ${interTight.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <LogoSymbol />
        <PencilFilters />
        {/* without JavaScript there is no intro, just the page */}
        <noscript dangerouslySetInnerHTML={{ __html: '<style>#loader{display:none}</style>' }} />
        <PageTransition>
          <SmoothScroll />
          <Loader />
          <Menu />
          <main>{children}</main>
          <Footer />
        </PageTransition>
      </body>
    </html>
  );
}
