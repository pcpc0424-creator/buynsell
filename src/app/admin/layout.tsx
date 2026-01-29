import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdminSidebar } from '@/components/admin';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login?callbackUrl=/admin');
  }

  // Check if user is admin
  if ((session.user as { role?: string })?.role !== 'ADMIN') {
    redirect('/');
  }

  // Fetch pending counts
  const [pendingListings, pendingInquiries] = await Promise.all([
    prisma.listing.count({ where: { status: 'PENDING' } }),
    prisma.inquiry.count({ where: { status: 'PENDING' } }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar pendingListings={pendingListings} pendingInquiries={pendingInquiries} />
      <main className="ml-64">
        {children}
      </main>
    </div>
  );
}
