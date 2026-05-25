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
