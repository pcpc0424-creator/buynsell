import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sell Your Property | Buy & Sell',
  description: 'List your property and reach thousands of potential buyers. Sell your house, condo, lot, or commercial space in the Philippines.',
  openGraph: {
    title: 'Sell Your Property | Buy & Sell',
    description: 'List your property and reach thousands of potential buyers in the Philippines.',
  },
};

export default function SellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
