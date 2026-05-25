# EWC ERP SYSTEM — Admin access

Default administrator (created automatically when the API starts, or run `npm run seed:admin` in `server/`):

| Field | Value |
|-------|--------|
| **Email** | `admin@ewc.com` |
| **Password** | `EwcAdmin@2026` |

## Override (recommended for production)

In `server/.env`:

```env
ADMIN_EMAIL=your-admin@company.com
ADMIN_PASSWORD=YourStrongPasswordHere
ADMIN_NAME=Your Name
```

Restart the API after changing these values. If the email already exists, only the role is ensured as `admin` (password is not reset automatically).

## Login

Open http://localhost:5173/login and sign in with the credentials above.
