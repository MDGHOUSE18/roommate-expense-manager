Roommate Expense Manager - production-ready merged UI + logic

Open through a local server (not file://) because the app uses ES modules and Firebase CDN imports.

Core changes:
- Unified mobile-first navbar
- Animated theme toggle
- Sidebar across all pages
- Expense form now uses Category instead of Paid By
- Current logged-in user is treated as the default payer internally
- Excel export matches a sheet-style format with people as columns and totals row
