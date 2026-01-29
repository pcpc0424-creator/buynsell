import { Header, Footer, Services } from '@/components/layout';
import { PropertyCategories } from '@/components/property';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <PropertyCategories />
      {children}
      <Services />
      <Footer />
    </>
  );
}
