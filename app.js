import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const els = {
  logoutBtns: document.querySelectorAll("[data-logout]"),
  messageBar: document.getElementById("messageBar"),
  themeToggle: document.getElementById("themeToggle"),
  menuToggle: document.getElementById("menuToggle"),
  sidebar: document.getElementById("sidebar"),
  sidebarOverlay: document.getElementById("sidebarOverlay"),
  userName: document.getElementById("userName"),
  sidebarUserName: document.getElementById("sidebarUserName"),
  roommateForm: document.getElementById("roommateForm"),
  roommateName: document.getElementById("roommateName"),
  roommateList: document.getElementById("roommateList"),
  roommateCount: document.getElementById("roommateCount"),
  expenseForm: document.getElementById("expenseForm"),
  formTitle: document.getElementById("formTitle"),
  submitBtn: document.getElementById("submitBtn"),
  cancelBtn: document.getElementById("cancelBtn"),
  expenseAmount: document.getElementById("expenseAmount"),
  expenseDate: document.getElementById("expenseDate"),
  expenseCategory: document.getElementById("expenseCategory"),
  expenseMembersList: document.getElementById("expenseMembersList"),
  monthFilter: document.getElementById("monthFilter"),
  totalExpenseValue: document.getElementById("totalExpenseValue"),
  entryCountValue: document.getElementById("entryCountValue"),
  exportExcelBtn: document.getElementById("exportExcelBtn"),
  expenseTableBody: document.getElementById("expenseTableBody"),
  recentExpenseTableBody: document.getElementById("recentExpenseTableBody"),
  dashboardTotalValue: document.getElementById("dashboardTotalValue"),
  dashboardRoommatesValue: document.getElementById("dashboardRoommatesValue"),
  dashboardEntriesValue: document.getElementById("dashboardEntriesValue"),
  dashboardAverageValue: document.getElementById("dashboardAverageValue"),
  summaryTableBody: document.getElementById("summaryTableBody"),
  settlementList: document.getElementById("settlementList"),
  filterType: document.getElementById("filterType"),
  fromDate: document.getElementById("fromDate"),
  toDate: document.getElementById("toDate"),
  customDateWrap: document.getElementById("customDateWrap"),
};

const pageName = document.body.dataset.page || "";
const currentMonthKey = getMonthKey(new Date());

const state = {
  user: null,
  roommates: [],
  expenses: [],
  unsubs: [],
  editingId: null,
};

if (els.monthFilter) els.monthFilter.value = currentMonthKey;
if (els.expenseDate) els.expenseDate.value = todayISO();

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function getMonthKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMoney(v) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(v || 0));
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function showMessage(text, type = "info") {
  if (!els.messageBar) return;
  els.messageBar.className = `message-bar ${type}`;
  els.messageBar.textContent = text;
  els.messageBar.classList.remove("hidden");
  clearTimeout(showMessage._t);
  showMessage._t = setTimeout(
    () => els.messageBar.classList.add("hidden"),
    3500,
  );
}

function getUserPath(uid, col) {
  return collection(db, "users", uid, col);
}

function stopListeners() {
  state.unsubs.forEach((u) => {
    try {
      u();
    } catch (_) {}
  });
  state.unsubs = [];
}

function currentUid() {
  return state.user?.uid || null;
}

function currentUserPayer() {
  const uid = currentUid();
  if (!uid) return null;
  const label = state.user?.email?.split("@")?.[0] || "You";
  return {
    id: `auth:${uid}`,
    name: label.charAt(0).toUpperCase() + label.slice(1),
  };
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("expenseTheme", theme);
  if (els.themeToggle) {
    const icon = els.themeToggle.querySelector(".theme-icon");
    if (icon) icon.textContent = theme === "dark" ? "🌙" : "☀️";
  }
}

function initTheme() {
  const stored = localStorage.getItem("expenseTheme") || "dark";
  applyTheme(stored);
}

function toggleTheme() {
  const next =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  if (els.themeToggle) {
    els.themeToggle.classList.remove("spin");
    void els.themeToggle.offsetWidth;
    els.themeToggle.classList.add("spin");
    setTimeout(() => els.themeToggle.classList.remove("spin"), 380);
  }
}

function openSidebar() {
  if (els.sidebar) els.sidebar.classList.add("is-open");
  if (els.sidebarOverlay) els.sidebarOverlay.classList.add("show");
  document.body.classList.add("sidebar-open");
}

function closeSidebar() {
  if (els.sidebar) els.sidebar.classList.remove("is-open");
  if (els.sidebarOverlay) els.sidebarOverlay.classList.remove("show");
  document.body.classList.remove("sidebar-open");
}

function toggleSidebar() {
  if (!els.sidebar) return;
  if (els.sidebar.classList.contains("is-open")) closeSidebar();
  else openSidebar();
}

function setActiveNavLink() {
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = a.getAttribute("href") || "";
    a.classList.toggle(
      "active",
      href.includes(`${pageName}.html`) ||
        (pageName === "auth" && href.includes("index.html")),
    );
  });
}

function showUserLabel(user) {
  const label = user?.email ? user.email.split("@")[0] : "User";
  if (els.userName) els.userName.textContent = label;
  if (els.sidebarUserName) els.sidebarUserName.textContent = label;
  document.querySelectorAll("[data-user-name]").forEach((el) => {
    el.textContent = label;
  });
}

if (els.themeToggle) els.themeToggle.addEventListener("click", toggleTheme);
if (els.menuToggle) els.menuToggle.addEventListener("click", toggleSidebar);
if (els.sidebarOverlay)
  els.sidebarOverlay.addEventListener("click", closeSidebar);

document.addEventListener("click", (e) => {
  if (!els.sidebar || !els.sidebar.classList.contains("is-open")) return;
  const clickedInside = els.sidebar.contains(e.target);
  const clickedMenu = els.menuToggle && els.menuToggle.contains(e.target);
  if (!clickedInside && !clickedMenu) closeSidebar();
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 900) closeSidebar();
});

onAuthStateChanged(auth, async (user) => {
  state.user = user || null;

  if (!user) {
    stopListeners();
    state.roommates = [];
    state.expenses = [];
    if (pageName !== "auth") window.location.href = "index.html";
    return;
  }

  if (pageName === "auth") {
    window.location.href = "dashboard.html";
    return;
  }

  showUserLabel(user);
  setActiveNavLink();
  await startUserListeners(user.uid);
});

async function startUserListeners(uid) {
  stopListeners();

  state.unsubs.push(
    onSnapshot(
      query(getUserPath(uid, "roommates"), orderBy("name")),
      (snap) => {
        state.roommates = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        renderAll();
      },
    ),
  );

  state.unsubs.push(
    onSnapshot(
      query(getUserPath(uid, "expenses"), orderBy("date", "desc")),
      (snap) => {
        state.expenses = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        renderAll();
      },
    ),
  );
}

async function handleAddRoommate(e) {
  e.preventDefault();

  const uid = currentUid();
  if (!uid) return;

  const name = els.roommateName?.value.trim();
  if (!name) return showMessage("Name required.", "error");

  try {
    await addDoc(getUserPath(uid, "roommates"), {
      name,
      createdAt: serverTimestamp(),
    });
    if (els.roommateName) els.roommateName.value = "";
    showMessage("Roommate added.", "success");
  } catch (err) {
    showMessage(err.message || "Failed to add roommate.", "error");
  }
}

async function handleDeleteRoommate(id) {
  if (!confirm("Delete this roommate?")) return;
  try {
    await deleteDoc(doc(db, "users", currentUid(), "roommates", id));
    showMessage("Roommate deleted.", "success");
  } catch (err) {
    showMessage(err.message || "Failed to delete roommate.", "error");
  }
}

async function handleAddExpense(e) {
  e.preventDefault();

  const uid = currentUid();
  if (!uid) return;

  const amount = Number(els.expenseAmount?.value);
  const date = els.expenseDate?.value || todayISO();
  const category = els.expenseCategory?.value.trim();
  const memberIds = Array.from(
    els.expenseMembersList?.querySelectorAll("input:checked") || [],
  ).map((i) => i.value);

  if (!amount || amount <= 0) return showMessage("Invalid amount.", "error");
  if (!category) return showMessage("Category is required.", "error");
  if (!memberIds.length)
    return showMessage("Select at least one member.", "error");

  const payer = currentUserPayer();
  const map = new Map(state.roommates.map((r) => [r.id, r.name]));
  if (payer) map.set(payer.id, payer.name);

  const data = {
    amount: round2(amount),
    date,
    monthKey: getMonthKey(date),
    category,
    memberIds,
    memberNames: memberIds.map((id) => map.get(id) || id),
    paidById: payer?.id || "",
    paidByName: payer?.name || "You",
    splitAmountPerPerson: round2(amount / memberIds.length),
    updatedAt: serverTimestamp(),
  };

  try {
    if (state.editingId) {
      await updateDoc(doc(db, "users", uid, "expenses", state.editingId), data);
      showMessage("Expense updated.", "success");
      resetExpenseForm();
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(getUserPath(uid, "expenses"), data);
      showMessage("Expense added.", "success");
      if (els.expenseAmount) els.expenseAmount.value = "";
      if (els.expenseCategory) els.expenseCategory.value = "";
      if (els.expenseMembersList) {
        els.expenseMembersList
          .querySelectorAll("input")
          .forEach((i) => (i.checked = false));
      }
      autoSelectDefaultMembers();
    }
  } catch (err) {
    showMessage(err.message || "Failed to save expense.", "error");
  }
}

async function handleDeleteExpense(id) {
  if (!confirm("Delete this expense?")) return;
  try {
    await deleteDoc(doc(db, "users", currentUid(), "expenses", id));
    showMessage("Expense deleted.", "success");
  } catch (err) {
    showMessage(err.message || "Failed to delete expense.", "error");
  }
}

function enterEditMode() {
  if (els.formTitle) els.formTitle.textContent = "Edit Expense";
  if (els.submitBtn) els.submitBtn.textContent = "Update Expense";
  if (els.cancelBtn) els.cancelBtn.style.display = "inline-flex";
}

function exitEditMode() {
  if (els.formTitle) els.formTitle.textContent = "Add Expense";
  if (els.submitBtn) els.submitBtn.textContent = "Save Expense";
  if (els.cancelBtn) els.cancelBtn.style.display = "none";
}

function handleEditExpense(id) {
  const exp = state.expenses.find((e) => e.id === id);
  if (!exp) return;

  state.editingId = id;
  if (els.expenseAmount) els.expenseAmount.value = exp.amount ?? "";
  if (els.expenseDate) els.expenseDate.value = exp.date ?? todayISO();
  if (els.expenseCategory) els.expenseCategory.value = exp.category ?? "";

  if (els.expenseMembersList) {
    els.expenseMembersList.querySelectorAll("input").forEach((cb) => {
      cb.checked = (exp.memberIds || []).includes(cb.value);
    });
  }

  enterEditMode();
  document
    .querySelector(".expense-form-card")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetExpenseForm() {
  state.editingId = null;
  if (els.expenseForm) els.expenseForm.reset();
  if (els.expenseDate) els.expenseDate.value = todayISO();
  autoSelectDefaultMembers();
  exitEditMode();
}

function filteredExpenses() {
  const filterType = els.filterType?.value || "month";

  if (filterType === "custom") {
    const from = els.fromDate?.value || "";
    const to = els.toDate?.value || "";

    return state.expenses
      .filter((e) => {
        if (!e.date) return false;
        if (from && e.date < from) return false;
        if (to && e.date > to) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  const m = els.monthFilter?.value || currentMonthKey;
  return state.expenses
    .filter((e) => e.monthKey === m)
    .sort((a, b) => b.date.localeCompare(a.date));
}
function updateFilterUI() {
  const type = els.filterType?.value || "month";

  if (els.monthFilter) {
    els.monthFilter.style.display = type === "month" ? "inline-block" : "none";
  }

  if (els.customDateWrap) {
    els.customDateWrap.style.display = type === "custom" ? "flex" : "none";
  }

  renderExpenses();
}
if (els.filterType) els.filterType.addEventListener("change", updateFilterUI);
if (els.monthFilter) els.monthFilter.addEventListener("change", renderExpenses);
if (els.fromDate) els.fromDate.addEventListener("change", renderExpenses);
if (els.toDate) els.toDate.addEventListener("change", renderExpenses);
if (els.filterType) els.filterType.value = "month";
if (els.monthFilter) els.monthFilter.value = currentMonthKey;

function getAllMembersForUI() {
  const me = currentUserPayer();
  return me
    ? [{ id: me.id, name: me.name, isYou: true }, ...state.roommates]
    : state.roommates;
}

function autoSelectDefaultMembers() {
  if (!els.expenseMembersList) return;
  const me = currentUserPayer();
  if (!me) return;
  const checkboxes = [...els.expenseMembersList.querySelectorAll("input")];
  const myCb = checkboxes.find((cb) => cb.value === me.id);
  if (myCb) myCb.checked = true;
}

function renderAll() {
  renderDashboard();
  renderRoommates();
  renderExpenses();
}

function renderDashboard() {
  const exp = state.expenses.filter((e) => e.monthKey === currentMonthKey);
  const total = exp.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  if (els.dashboardTotalValue)
    els.dashboardTotalValue.textContent = formatMoney(total);
  if (els.dashboardRoommatesValue)
    els.dashboardRoommatesValue.textContent = getAllMembersForUI().length;
  if (els.dashboardEntriesValue)
    els.dashboardEntriesValue.textContent = exp.length;
  if (els.dashboardAverageValue) {
    els.dashboardAverageValue.textContent = formatMoney(
      exp.length ? total / exp.length : 0,
    );
  }

  if (els.recentExpenseTableBody) {
    els.recentExpenseTableBody.innerHTML = exp
      .slice(0, 6)
      .map(
        (e) => `
      <tr>
        <td>${e.date || "-"}</td>
        <td>${e.category || "-"}</td>
        <td>${formatMoney(e.amount)}</td>
        <td>${(e.memberNames || []).join(", ") || "-"}</td>
      </tr>
    `,
      )
      .join("");

    if (!exp.length) {
      els.recentExpenseTableBody.innerHTML =
        '<tr><td colspan="4" class="empty-state">No recent expenses</td></tr>';
    }
  }

  const summary = computeSummary(exp);
  if (els.summaryTableBody) {
    els.summaryTableBody.innerHTML = summary
      .map(
        (r) => `
      <tr>
        <td>${r.name}</td>
        <td>${formatMoney(r.paid)}</td>
        <td>${formatMoney(r.share)}</td>
        <td class="${r.net >= 0 ? "text-green" : "text-red"}">${formatMoney(r.net)}</td>
      </tr>
    `,
      )
      .join("");

    if (!summary.length) {
      els.summaryTableBody.innerHTML =
        '<tr><td colspan="4" class="empty-state">No data</td></tr>';
    }
  }

  if (els.settlementList) {
    const settle = computeSettlements(summary);
    els.settlementList.innerHTML = settle.length
      ? settle
          .map(
            (s) => `
      <div class="settlement-card">
        <span>${s.from} → <strong>${s.to}</strong></span>
        <span class="pill pill-success">${formatMoney(s.amount)}</span>
      </div>
    `,
          )
          .join("")
      : '<p class="empty-note">All settled up! 🎉</p>';
  }
}

function renderRoommates() {
  if (els.roommateCount)
    els.roommateCount.textContent = getAllMembersForUI().length;

  if (els.roommateList) {
    const members = getAllMembersForUI();

    els.roommateList.innerHTML = members
      .map(
        (r) => `
      <div class="roommate-card">
        <div class="roommate-info">
          <div class="avatar">${(r.name || "?").slice(0, 1).toUpperCase()}</div>
          <div>
            <div class="roommate-name">${r.name}${r.isYou ? " (You)" : ""}</div>
            <div class="roommate-sub">${r.isYou ? "Default user" : "Shared member"}</div>
          </div>
        </div>
        ${r.isYou ? '<span class="pill">Primary</span>' : `<button class="btn btn-danger btn-sm" data-delete-roommate="${r.id}">Delete</button>`}
      </div>
    `,
      )
      .join("");

    if (!members.length) {
      els.roommateList.innerHTML =
        '<div class="empty-state">No roommates added yet</div>';
    }
  }

  if (els.expenseMembersList) {
    const members = getAllMembersForUI();
    els.expenseMembersList.innerHTML = members
      .map(
        (r) => `
      <label class="member-chip">
        <input type="checkbox" value="${r.id}" ${r.isYou ? "checked" : ""}>
        <span>${r.name}${r.isYou ? " (You)" : ""}</span>
      </label>
    `,
      )
      .join("");

    if (!members.length) {
      els.expenseMembersList.innerHTML =
        '<span class="empty-note">Add roommates first</span>';
    } else {
      autoSelectDefaultMembers();
    }
  }
}

function renderExpenses() {
  const exp = filteredExpenses();

  if (els.totalExpenseValue) {
    els.totalExpenseValue.textContent = formatMoney(
      exp.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    );
  }

  if (els.entryCountValue) els.entryCountValue.textContent = exp.length;

  if (els.expenseTableBody) {
    els.expenseTableBody.innerHTML = exp
      .map(
        (e) => `
      <tr>
        <td>${e.date || "-"}</td>
        <td>${e.category || "-"}</td>
        <td>${(e.memberNames || []).join(", ") || "-"}</td>
        <td>${formatMoney(e.amount)}</td>
        <td>${formatMoney(e.splitAmountPerPerson)}</td>
        <td class="action-cell">
          <button class="btn btn-outline btn-sm" data-edit-expense="${e.id}">Edit</button>
          <button class="btn btn-danger btn-sm" data-delete-expense="${e.id}">Delete</button>
        </td>
      </tr>
    `,
      )
      .join("");

    if (!exp.length) {
      els.expenseTableBody.innerHTML =
        '<tr><td colspan="6" class="empty-state">No expenses found for this month</td></tr>';
    }
  }
}

function computeSummary(expenses) {
  const paid = {};
  const share = {};
  const ids = new Set();

  expenses.forEach((e) => {
    const amt = Number(e.amount || 0);
    const split = round2(amt / (e.memberIds?.length || 1));

    if (!paid[e.paidById]) paid[e.paidById] = 0;
    paid[e.paidById] += amt;

    (e.memberIds || []).forEach((id) => {
      if (!share[id]) share[id] = 0;
      share[id] += split;
    });

    ids.add(e.paidById);
    (e.memberIds || []).forEach((id) => ids.add(id));
  });

  const map = new Map(state.roommates.map((r) => [r.id, r.name]));
  const me = currentUserPayer();
  if (me) map.set(me.id, me.name);

  return Array.from(ids)
    .filter(Boolean)
    .map((id) => ({
      id,
      name: map.get(id) || "Unknown",
      paid: round2(paid[id] || 0),
      share: round2(share[id] || 0),
      net: round2((paid[id] || 0) - (share[id] || 0)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function computeSettlements(sum) {
  const debtors = sum
    .filter((r) => r.net < 0)
    .map((r) => ({ name: r.name, amt: Math.abs(r.net) }))
    .sort((a, b) => b.amt - a.amt);

  const creditors = sum
    .filter((r) => r.net > 0)
    .map((r) => ({ name: r.name, amt: r.net }))
    .sort((a, b) => b.amt - a.amt);

  const out = [];
  while (debtors.length && creditors.length) {
    const d = debtors[0];
    const c = creditors[0];
    const v = round2(Math.min(d.amt, c.amt));
    out.push({ from: d.name, to: c.name, amount: v });
    d.amt = round2(d.amt - v);
    c.amt = round2(c.amt - v);
    if (d.amt <= 0.01) debtors.shift();
    if (c.amt <= 0.01) creditors.shift();
  }
  return out;
}

function exportExcel() {
  if (typeof XLSX === "undefined") {
    showMessage("Excel library not loaded.", "error");
    return;
  }

  const rows = filteredExpenses().sort((a, b) =>
    (a.date || "").localeCompare(b.date || ""),
  );
  const members = getAllMembersForUI();
  const header = ["Date", "Category", "Amount", ...members.map((m) => m.name)];
  const data = [header];

  const totals = {
    amount: 0,
    memberTotals: {},
  };

  members.forEach((m) => {
    totals.memberTotals[m.name] = 0;
  });

  rows.forEach((e) => {
    const row = [e.date || "", e.category || "", Number(e.amount || 0)];
    const amount = Number(e.amount || 0);
    const memberSet = new Set(e.memberIds || []);
    const split = round2(amount / (e.memberIds?.length || 1));

    members.forEach((m) => {
      if (memberSet.has(m.id)) {
        row.push(split);
        totals.memberTotals[m.name] += split;
      } else {
        row.push("");
      }
    });

    totals.amount += amount;
    data.push(row);
  });

  const totalRow = [
    "",
    "Total",
    round2(totals.amount),
    ...members.map((m) => round2(totals.memberTotals[m.name] || 0)),
  ];
  data.push(totalRow);

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Expenses");
  XLSX.writeFile(
    wb,
    `expenses-${els.monthFilter?.value || currentMonthKey}.xlsx`,
  );
  showMessage("Excel exported.", "success");
}

if (els.roommateForm)
  els.roommateForm.addEventListener("submit", handleAddRoommate);

if (els.roommateList) {
  els.roommateList.addEventListener("click", (e) => {
    const id = e.target?.dataset?.deleteRoommate;
    if (id) handleDeleteRoommate(id);
  });
}

if (els.expenseForm)
  els.expenseForm.addEventListener("submit", handleAddExpense);

if (els.expenseTableBody) {
  els.expenseTableBody.addEventListener("click", (e) => {
    const del = e.target?.dataset?.deleteExpense;
    const edit = e.target?.dataset?.editExpense;
    if (del) handleDeleteExpense(del);
    if (edit) handleEditExpense(edit);
  });
}

if (els.exportExcelBtn)
  els.exportExcelBtn.addEventListener("click", exportExcel);
if (els.monthFilter) els.monthFilter.addEventListener("change", renderExpenses);
if (els.cancelBtn) els.cancelBtn.addEventListener("click", resetExpenseForm);

els.logoutBtns.forEach((btn) => {
  btn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.href = "index.html";
    } catch (err) {
      showMessage(err.message || "Logout failed.", "error");
    }
  });
});

initTheme();
setTimeout(() => {
  updateFilterUI();
  renderAll();
  if (pageName === "expenses") exitEditMode();
}, 0);
