# 💸 Roommate Expenses Manager

A lightweight, production-ready web app to track, split, and manage shared expenses between roommates.

Built using **HTML, CSS, Vanilla JavaScript**, and **Firebase (Auth + Firestore)** — no frameworks, no backend server.

---

## 🚀 Live Demo
👉 https://YOUR_USERNAME.github.io/roommate-expense-manager/

---

## 📌 Features

- 🔐 Username-based login (Firebase Authentication)
- 👥 Manage roommates dynamically
- 💰 Add & track shared expenses
- 🧾 Category-based expense tracking (no payer selection required)
- ⚖️ Automatic expense splitting
- 📊 Monthly dashboard with:
  - Total expenses
  - Average spend
  - Entry count
  - Net balance per person
- 🤝 Settlement calculation (who owes whom)
- 📥 Excel export (sheet-style format with totals)
- 🌙 Light / Dark mode toggle with animation
- 📱 Fully responsive (mobile-first UI)
- 🎯 Default user automatically included in splits

---

## 🧱 Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES Modules)
- **Backend:** Firebase Authentication + Firestore
- **Hosting:** GitHub Pages
- **Libraries:**
  - Firebase SDK (v9 modular)
  - SheetJS (XLSX export)

---

## 📂 Project Structure
roommate-expense-manager/
│
├── index.html # Login page
├── dashboard.html # Overview & summary
├── roommates.html # Manage members
├── expenses.html # Add/view expenses
│
├── styles.css # Global UI styles
├── app.js # Core app logic
├── auth.js # Authentication logic
├── firebase.js # Firebase config
│
└── README.md


---

## ⚙️ Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/roommate-expense-manager.git
cd roommate-expense-manager