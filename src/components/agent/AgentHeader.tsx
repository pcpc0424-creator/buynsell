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
    <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-8 py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">{title}</h1>
          {subtitle && <p className="text-slate-500 text-sm mt-1">{subtitle}</p>}
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-all">
            <i className="fas fa-bell"></i>
          </button>

          {/* User */}
          <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
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
              <p className="text-slate-800 font-medium text-sm">{session?.user?.name || 'Agent'}</p>
              <p className="text-slate-500 text-xs capitalize">{session?.user?.tier?.toLowerCase() || 'Agent'}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
