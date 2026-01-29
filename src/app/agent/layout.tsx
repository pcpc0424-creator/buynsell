import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AgentSidebar } from '@/components/agent';

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/login?callbackUrl=/agent');
  }

  // Check if user is agent or admin
  const userRole = (session.user as { role?: string })?.role;
  if (userRole !== 'AGENT' && userRole !== 'ADMIN') {
    redirect('/');
  }

  // Fetch counts for sidebar
  const [listingsCount, inquiriesCount] = await Promise.all([
    prisma.listing.count({
      where: {
        agentId: session.user.id,
        status: 'PENDING',
      },
    }),
    prisma.inquiry.count({
      where: {
        listing: { agentId: session.user.id },
        status: 'FORWARDED',
      },
    }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <AgentSidebar listingsCount={listingsCount} inquiriesCount={inquiriesCount} />
      <main className="ml-64">
        {children}
      </main>
    </div>
  );
}
