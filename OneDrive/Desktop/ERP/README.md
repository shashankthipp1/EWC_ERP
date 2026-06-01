# EWC ERP SYSTEM

Full-stack shop management system for **OUR Watch Shop** (wrist watches, trimmers, Ajanta wall clocks, torch lights, alarm clocks, mobile accessories, and mobile repair services).

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | React + Vite + Tailwind CSS + Recharts |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT (Admin + Staff) |
| Export | jsPDF + SheetJS (xlsx) |

## Quick start

```bash
npm run install:all
npm run dev
```

- **Frontend:** http://localhost:5173  
- **API:** http://localhost:5000  
- Configure MongoDB in `server/.env` (`MONGODB_URI`, `JWT_SECRET`)

## Production (Render)

**Live app:** https://ewc-erp.onrender.com (API + UI monolith when using [render.yaml](./render.yaml))

| Use case | API URL |
|----------|---------|
| Render monolith (default) | Same-origin `/api` (automatic in production builds) |
| Local dev | `client/.env.development` → `VITE_API_URL=http://localhost:5000` |
| Local UI → live API | `client/.env.local` → `VITE_API_URL=https://ewc-erp.onrender.com` |
| Separate frontend host | Set `VITE_API_URL=https://ewc-erp.onrender.com` at build time |

Deploy with [render.yaml](./render.yaml) or **Build:** `npm run install:all && npm run build` · **Start:** `npm run start --prefix server`.

**Required Render env vars:** `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL=https://ewc-erp.onrender.com` (add every extra frontend origin, comma-separated, if not on `*.onrender.com`).

### Deployment checklist

1. Render → **Environment**: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL` (your public site URL(s)).
2. Redeploy after env changes (JWT and CORS are read at startup).
3. Open `https://<your-service>.onrender.com/health` → `{ "status": "ok" }`.
4. Open the app, DevTools → Network → `POST /api/auth/login` must be **same origin** or show `Access-Control-Allow-Origin` matching your site.
5. Sign up, then log in; confirm `erp_token` in localStorage.

### Netlify frontend + Render API

1. Repo includes [`netlify.toml`](./netlify.toml) — base `client`, `VITE_API_URL=https://ewc-erp.onrender.com`.
2. On **Render** (API), set `CLIENT_URL` to your Netlify URL (no trailing slash), e.g.  
   `https://astonishing-kashata-db13f8.netlify.app`  
   Or comma-separate multiple origins. `*.netlify.app` is also allowed automatically after redeploy.
3. Redeploy **both** Netlify and Render after env/code changes.
4. In browser DevTools → Network, login should call  
   `https://ewc-erp.onrender.com/api/auth/login` (not `netlify.app/api/...`).

### Troubleshooting CORS on Render

- **Monolith:** Do not set `VITE_API_URL` to a different host unless intentional.
- **Split UI/API:** Set `VITE_API_URL` to the API host at **build** time; set `CLIENT_URL` on the API to the UI origin.
- Check Render logs for `[CORS] Blocked request from origin:` and add that URL to `CLIENT_URL`.

Create an account via **Sign up** on the login screen (first user can be promoted to `admin` in MongoDB if needed).

> **Note:** Inventory uses a new flat product schema (`productId`, `brand`, `modelNumber`, etc.). If you have old dynamic `data` map records, clear the `inventoryitems` collection or re-import products.

## Implemented modules (phase 1)

### Dashboard
- Today's sales, expenditure, profit/loss
- Low stock alerts
- Recent 5 sales transactions
- Quick actions: Add Sale, Add Stock, New Order List
- Weekly bar chart: sales vs expenditure

### Inventory
- Full CRUD with auto `OWS-00001` product IDs
- Categories: Watches, Trimmers, Wall Clocks, Torch Lights, Alarm Clocks, Batteries, Mobile Accessories, Repair Parts
- **Ajanta wall clock catalog** (168 models): run `npm run seed:ajanta-clocks` in `server/` (see `server/src/data/ajanta-wall-clocks.csv`)
- Search, filter, sort, pagination
- Bulk stock update
- Excel / PDF export (shop header from Settings)

### Also available (foundation)
- **Sales** (`/billing`) — record sales, auto stock deduction
- **Expenditure** (`/finance`)
- **Order lists** (`/orders`)
- **Settings** — shop name, address, phone, JSON backup

## UI

- Deep navy + gold theme
- Sidebar navigation, mobile-responsive
- Toast notifications, confirm dialogs, loading states
- Indian Rupees (₹), DD/MM/YYYY dates

## Project structure

```
ERP/
├── client/          # React frontend
├── server/          # Express API
│   └── src/
│       ├── models/  # InventoryItem, Sale, Expense, Settings, …
│       └── routes/  # dashboard, inventory, sales, …
└── package.json     # npm run dev (both apps)
```

## Next modules (planned)

- Dedicated daily sales list with edit/delete
- Order list PDF + WhatsApp share + receive → stock update
- Profit & loss reports (monthly charts, PDF)
- Mobile repair job cards
- Staff management in Settings
