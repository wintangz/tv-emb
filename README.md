# Tuong Vinh Embroidery — Commercial Embroidery & Production ERP

Full-stack `pnpm` monorepo built for **Tuong Vinh Embroidery (Xưởng Thêu Vi Tính Tường Vinh)** to manage day-to-day commercial embroidery operations:
- **Work Orders & Production Pipeline**: Full CRUD, size breakdown (`S`/`M`/`L`/`XL`/`2XL`), stage tracking, payment/deposit tracking, and CSV export.
- **Printable Production Job Sheets & Client Invoices**: One-click printable shop-floor worksheet (with needle colorway setup & QC sign-off checklist) and commercial invoice/delivery receipt.
- **Digitizing & Stitch File Catalog**: Manage `.DST` / `.EMB` / `.PES` files with live SVG hoop & stitch preview, dimensions (`mm`), hoop specs, and dynamic needle colorway sequence builder.
- **Multi-Head Machine Telemetry & Batch Logging**: Live status (`RUNNING`, `SETUP`, `IDLE`, `MAINTENANCE`), SPM speed control, thread break counter, and one-click batch completion logging (`+12 pcs`) synced to active work orders.
- **Madeira Thread & Stabilizer Inventory**: Track cones, backing rolls, and bobbins with low-stock alerts, one-click restock, and total inventory valuation.
- **Stitch & Quote Calculator**: Estimate volume stitch rates, digitizing fees, blank garment markups, 3D puff surcharges, and rush fees—and convert quotes directly into live work orders.
- **Clients CRM**: Track corporate accounts, repeat orders, lifetime spend, and Pantone-to-Madeira thread notes.

## Workspace Structure

- **`apps/frontend` (`@tv-emb/frontend`)**: Next.js 16 (App Router + Turbopack), React 19, Tailwind CSS v4 (`http://localhost:3000`).
- **`apps/backend` (`@tv-emb/backend`)**: NestJS 12 REST API with persistent JSON file storage (`apps/backend/data/embroidery-db.json`) (`http://localhost:3001/api`).

## Running the App

```bash
pnpm install
pnpm dev
```
