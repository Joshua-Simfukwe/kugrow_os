# Kugrow OS

Kugrow OS is a multi-tenant operational system for African businesses and schools.  
This repository now contains the first production-quality foundation for:

- organization-scoped authentication
- branch-aware retail operations
- school fee operations
- finance visibility
- reusable frontend onboarding and workspace routing

The current codebase is designed for real operational use, not a demo flow.

## Current Product Scope

### Shared foundation

- email-based custom user model
- token-authenticated API
- one user can belong to multiple organizations
- organization type support:
  - `retail`
  - `education`
- active organization and active branch tracking per user
- organization-scoped data access patterns

### Retail foundation

- product catalog
- branch stock tracking
- inventory movement history
- point-of-sale sales recording
- paid, partial, and unpaid sale support
- receipt numbering
- dashboard sales and stock visibility

### Education foundation

- school classes
- guardians
- student registration
- fee invoices
- fee payments
- school dashboard metrics

### Finance foundation

- expense categories
- expense recording
- dashboard summary API for retail and school organizations

## Architecture Notes

### Backend

- Framework: Django + Django REST Framework
- Auth: DRF token authentication
- Data isolation: active organization + active branch on user profile
- Apps:
  - [backend/users](/C:/Users/CHALI/Desktop/kugrow_os/backend/users)
  - [backend/inventory](/C:/Users/CHALI/Desktop/kugrow_os/backend/inventory)
  - [backend/sales](/C:/Users/CHALI/Desktop/kugrow_os/backend/sales)
  - [backend/finance](/C:/Users/CHALI/Desktop/kugrow_os/backend/finance)
  - [backend/education](/C:/Users/CHALI/Desktop/kugrow_os/backend/education)
  - [backend/common](/C:/Users/CHALI/Desktop/kugrow_os/backend/common)

Key design decisions:

- legacy inventory and sales data is backfilled into organization and branch scope through migrations
- branch stock is tracked separately from aggregate product stock
- financial and school records are modeled as append-friendly records rather than casually deletable state
- dashboard summaries are organization-type aware, so the UI can adapt without branching all over the frontend

### Frontend

- Framework: React + Vite
- Routing: React Router
- API client: Axios wrapper in [frontend/src/lib/api.js](/C:/Users/CHALI/Desktop/kugrow_os/frontend/src/lib/api.js)
- Auth/session state: [frontend/src/features/auth/context/AuthProvider.jsx](/C:/Users/CHALI/Desktop/kugrow_os/frontend/src/features/auth/context/AuthProvider.jsx)

Current workspace pages:

- onboarding flow
- organization selection and joining
- dashboard summary page
- branch-aware POS page

## Local Development

### Backend

From [backend](/C:/Users/CHALI/Desktop/kugrow_os/backend):

```powershell
venv\Scripts\python.exe manage.py migrate
venv\Scripts\python.exe manage.py runserver
```

### Frontend

From [frontend](/C:/Users/CHALI/Desktop/kugrow_os/frontend):

```powershell
npm install
npm run dev
```

The frontend expects the backend API at:

- `http://127.0.0.1:8000/api`

Override with:

- `VITE_API_BASE_URL`

## Important Operational Notes

- Admin login uses the custom user model email, not a username.
- Existing legacy retail data is now branch-scoped through migrations.
- The current default local database is SQLite at [backend/db.sqlite3](/C:/Users/CHALI/Desktop/kugrow_os/backend/db.sqlite3).
- For production deployment, move to PostgreSQL and environment-based secrets before go-live.

## Verification Commands

These checks currently pass:

```powershell
backend\venv\Scripts\python.exe backend\manage.py migrate
backend\venv\Scripts\python.exe backend\manage.py test users finance education inventory sales
cd frontend
npm run lint
npm run build
```

## Next Recommended Milestones

1. Add branch management UI and branch switching.
2. Add quotation, invoice, and delivery note workflows.
3. Add expense management UI.
4. Add printable receipt and document templates with A4 and thermal support.
5. Tighten role-based permissions beyond owner/member defaults.
