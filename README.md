# ProcureHub — Procurement & Inventory Control Panel

A local web application for procurement and inventory control. Next.js (App Router) + Tailwind CSS + Prisma + SQLite. No external database server required.

## Quick Start

```
npm install
npm run dev
```

Open **http://localhost:3000**

`npm run dev` automatically creates the SQLite database (`prisma/dev.db`), applies the schema, and creates the admin login + default categories. The app starts **empty** — add your own data manually, import it from Excel (Suppliers, Products, Leads, Invoices pages all have an *Import Excel* button with a downloadable template), or load the optional sample dataset with `npm run db:demo`.

## Login

| Username | Password |
|----------|----------|
| `admin`  | `admin123` |

The password can be changed in **Settings → Change Password**.

## Features

- **Dashboard** — KPI cards, 12-month spend trend, spend by category, top 5 suppliers, activity feed
- **Suppliers** — full CRUD, ratings, detail page with invoices / products / total spend
- **Customer Agreements** — B2B customer register: contacts, address, Emirates ID, signed agreement / trade license / VAT registration uploads, doc-completeness badge, CSV/Excel export
- **New Leads** — pipeline with table + kanban views, convert lead to supplier
- **Products Sourced** — stock levels, low-stock rows highlighted red
- **Inventory** — stock in/out with running balance, low-stock alerts
- **Purchase Orders** — line-item builder, status flow, printable / PDF-friendly view
- **Vendor Invoices** — auto-overdue flagging, file attachments, summary cards
- **Receipts (GRN)** — receiving stock automatically increases inventory and updates the PO
- **Reports** — date-range filters, monthly spend, supplier performance (on-time %), CSV/Excel export
- **Settings** — change password, manage categories, company name & logo
- Global search, notification bell (low stock + overdue invoices), dark/light mode, AED currency formatting, fully responsive

## Useful commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Ensure DB + essentials (admin user, categories), then start on :3000 |
| `npm run db:demo` | Load the realistic sample dataset (skips if suppliers already exist) |
| `npm run db:clear` | Remove all suppliers/products/POs/invoices/etc. — keeps login, company profile & categories |
| `npm run db:reset` | Delete the database file entirely (fresh empty start on next `npm run dev`) |

## Tech stack

Next.js 14 (App Router) · Tailwind CSS 3 · Prisma 5 + SQLite · Recharts · lucide-react · sonner (toasts) · SheetJS (Excel export) · bcryptjs + signed-cookie sessions
