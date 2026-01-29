# BuyNSell Philippines - Real Estate Platform

## Project Overview
Philippines real estate listing platform built with Next.js 14 App Router.

## Tech Stack
- **Framework**: Next.js 14.2.35 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js v4 with credentials provider
- **Styling**: Tailwind CSS
- **State**: Zustand, React Query
- **Maps**: Leaflet with OpenStreetMap (Nominatim API for geocoding)
- **Image Upload**: Cloudinary

## Database Setup
```bash
# PostgreSQL credentials
DATABASE_URL="postgresql://buynsell_user:buynsell123@localhost:5432/buynsell?schema=public"

# Commands
npx prisma db push    # Sync schema
npx prisma db seed    # Create test accounts
```

## Test Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@buynsell.ph | admin123 |
| Agent | agent@buynsell.ph | agent123 |
| User | user@buynsell.ph | user123 |

## Key Routes
- `/` - Main homepage with property listings
- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/admin` - Admin dashboard (ADMIN role required)
- `/agent` - Agent dashboard (AGENT role required)
- `/properties` - Property listings
- `/properties/[id]` - Property detail page

## Project Structure
```
src/
├── app/
│   ├── api/           # API routes
│   │   ├── auth/      # NextAuth endpoints
│   │   ├── properties/# Property CRUD
│   │   ├── users/     # User management
│   │   └── admin/     # Admin APIs
│   ├── admin/         # Admin dashboard pages
│   ├── agent/         # Agent dashboard pages
│   ├── auth/          # Auth pages (login/register)
│   └── properties/    # Property pages
├── components/        # Reusable components
│   ├── admin/         # Admin-specific components
│   ├── agent/         # Agent-specific components
│   ├── auth/          # Auth forms
│   ├── layout/        # Layout components (Header, Footer, etc.)
│   ├── properties/    # Property cards, forms
│   └── ui/            # Base UI components
├── lib/               # Utilities
│   ├── auth.ts        # NextAuth configuration
│   ├── prisma.ts      # Prisma client
│   ├── cloudinary.ts  # Image upload
│   └── geocoding.ts   # Map/location utilities
└── types/             # TypeScript types
```

## User Roles & Tiers
### Roles
- `USER` - Regular user (browse, save favorites)
- `AGENT` - Real estate agent (list properties, manage clients)
- `ADMIN` - Administrator (full access)

### Tiers
- `GREEN` - Free tier
- `GOLD` - Mid tier
- `PREMIUM` - Top tier (most features/listings)

## Development Commands
```bash
npm run dev      # Start dev server (default port 3000)
npm run build    # Production build
npm run lint     # ESLint check
```

## Common Issues & Solutions
### "Missing bootstrap script" Error
Clear `.next` folder and restart:
```bash
rm -rf .next
npm run dev
```

### Port 3000 in use
Server auto-switches to 3001. Access via `http://localhost:3001`

## Completed Features
- [x] Main homepage with property listings
- [x] User authentication (login/register)
- [x] Admin dashboard with stats, user management, property management
- [x] Agent dashboard with listings, leads, profile management
- [x] Property CRUD operations
- [x] Image upload to Cloudinary
- [x] Map integration with Leaflet
- [x] Responsive design

## Production Deployment (basePath: /buynsell)

### Server Configuration
- **URL**: `http://115.68.223.124/buynsell/`
- **Port**: 3008 (PM2 managed)
- **Process**: `pm2 start npm --name "buynsell" -- start -- -p 3008`

### basePath Configuration
The app is deployed with basePath `/buynsell`. Important files:

1. **next.config.mjs**
```javascript
const nextConfig = {
  basePath: '/buynsell',
  assetPrefix: '/buynsell',
  // ...
};
```

2. **.env**
```
NEXTAUTH_URL="http://115.68.223.124/buynsell"
NEXT_PUBLIC_BASE_PATH="/buynsell"
```

3. **src/lib/config.ts** - API URL helper
```typescript
export const config = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
};

export function apiUrl(path: string): string {
  return `${config.basePath}${path}`;
}
```

4. **src/components/providers/SessionProvider.tsx**
```typescript
<NextAuthSessionProvider basePath="/buynsell/api/auth">
```

### basePath Usage Rules
- **API calls**: Use `apiUrl('/api/...')` from `@/lib/config`
- **Static images**: Use `${config.basePath}/images/...`
- **NextAuth**: basePath is set in SessionProvider

### Nginx Configuration
```nginx
location /buynsell {
    proxy_pass http://localhost:3008;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### PM2 Commands
```bash
pm2 restart buynsell    # Restart after build
pm2 logs buynsell       # View logs
pm2 save                # Save process list
```

## Network Access
- **Production**: `http://115.68.223.124/buynsell/`
- **Local**: `http://localhost:3008/buynsell/`
