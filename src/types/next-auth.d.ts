import 'next-auth';
import { Role, Tier } from '@prisma/client';

declare module 'next-auth' {
  interface User {
    id: string;
    role?: Role;
    tier?: Tier;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      tier?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role?: string;
    tier?: string;
  }
}
