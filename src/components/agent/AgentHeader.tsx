'use client';

import { useSession } from 'next-auth/react';
import Image from 'next/image';

interface AgentHeaderProps {
  title: string;
  subtitle?: string;
}

export default function AgentHeader({ title, subtitle }: AgentHeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="bg-dark-900/50 backdrop-blur-xl border-b border-white/5 px-8 py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">{title}</h1>
          {subtitle && <p className="text-white/50 text-sm mt-1">{subtitle}</p>}
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-all">
            <i className="fas fa-bell"></i>
          </button>

          {/* User */}
          <div className="flex items-center space-x-3 pl-4 border-l border-white/10">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || ''}
                width={40}
                height={40}
                className="rounded-xl"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center text-white font-semibold">
                {session?.user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
            )}
            <div className="hidden md:block">
              <p className="text-white font-medium text-sm">{session?.user?.name || 'Agent'}</p>
              <p className="text-white/40 text-xs capitalize">{session?.user?.tier?.toLowerCase() || 'Agent'}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
