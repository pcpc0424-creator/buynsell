import type { Metadata } from 'next';
import { Header, Footer, Services } from '@/components/layout';
import {
  HeroSection,
  CategoriesSection,
  RecentProperties,
  AgentsSection,
  CTASection,
} from '@/components/home';

export const metadata: Metadata = {
  title: 'Buy & Sell | Premium Real Estate in the Philippines',
  description: 'Find your dream property in the Philippines. Browse houses, condos, lots, and commercial spaces from verified agents.',
  keywords: ['real estate', 'Philippines', 'property', 'house for sale', 'condo for rent', 'Makati', 'BGC', 'Cebu'],
  openGraph: {
    title: 'Buy & Sell | Premium Real Estate in the Philippines',
    description: 'Find your dream property in the Philippines. Browse houses, condos, lots, and commercial spaces from verified agents.',
    type: 'website',
  },
};

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <CategoriesSection />
        <RecentProperties />
        <AgentsSection />
        <CTASection />
        <Services />
      </main>
      <Footer />
    </>
  );
}
