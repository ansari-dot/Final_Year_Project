# ReWearX — Admin Console

Standalone React app for managing the ReWearX platform.
Lives in its own folder, separate from the `client` app, so admins log in via a different host.

## Stack
- **React 19** + **TypeScript**
- **Vite 6** + **Tailwind CSS v4**
- **wouter** (lightweight routing)
- **motion** (animation)
- **recharts** (analytics charts)
- **lucide-react** (icons)

## Pages
| Route          | Purpose                                              |
|----------------|------------------------------------------------------|
| `/`            | Dashboard — KPIs, recent reports, recent users       |
| `/users`       | User management — search, filter, block/unblock      |
| `/reports`     | Trust & safety — review, resolve, resolve + block    |
| `/analytics`   | Growth charts — users, listings, funnel, breakdown   |

## Run

```bash
cd admin
npm install
npm run dev      # http://localhost:3001
```

The client app runs on port `3000`, the admin on `3001`, so both can run side-by-side.

## Notes
- All data is in `src/lib/mockData.ts`. Swap with real API calls when the backend is ready.
- Color tokens & fonts match the main ReWearX landing page (`bg-background`, `text-primary`, `bg-accent`, `font-headings`, `font-body`) for a consistent brand.
