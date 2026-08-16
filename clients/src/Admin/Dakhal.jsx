import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "../../node_modules/react-i18next";
import { toast } from "react-toastify";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useApi } from "../context/ApiContext";

const PRESETS = [
  { key: "today", tKey: "Today" },
  { key: "week", tKey: "ThisWeek" },
  { key: "month", tKey: "ThisMonth" },
  { key: "year", tKey: "ThisYear" },
  { key: "custom", tKey: "CustomDateRange" },
];

const TYPES = [
  { key: "all", tKey: "AllTransactions" },
  { key: "revenue", tKey: "Revenue" },
  { key: "salary", tKey: "Salary" },
  { key: "expense", tKey: "Expense" },
  { key: "loss", tKey: "Loss" },
];

const toMoney = (n) => `$${Number(n || 0).toLocaleString()}`;

const downloadCsv = (rows, filename) => {
  try {
    if (!rows || rows.length === 0) {
      console.warn("No data to export");
      return;
    }

    const escape = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    const header = ["date", "type", "description", "amount"].map(escape).join(",");
    const body = rows
      .map((r) =>
        [
          new Date(r.date).toISOString(),
          r.referenceType,
          r.description,
          Number(r.totalDebit || r.totalCredit || 0),
        ]
          .map(escape)
          .join(",")
      )
      .join("\n");
    const csv = `${header}\n${body}`;
    
    // Add UTF-8 BOM for better compatibility with Excel
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    
    // Append to body, click, and remove
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up the URL object after a short delay
    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (error) {
    console.error("Download failed:", error);
  }
};

export default function Dakhal() {
  const { t, i18n } = useTranslation("common");
  const { get } = useApi();

  const [preset, setPreset] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState("all");
  const [q, setQ] = useState("");

  const [summary, setSummary] = useState(null);
  const [tx, setTx] = useState({ rows: [], page: 1, totalPages: 1, total: 0, limit: 20 });
  const [loading, setLoading] = useState(false);

  const fetchAll = async (page = 1) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (preset !== "custom") qs.set("preset", preset);
      if (preset === "custom") {
        if (startDate) qs.set("startDate", startDate);
        if (endDate) qs.set("endDate", endDate);
      }
      if (type) qs.set("type", type);
      if (q.trim()) qs.set("q", q.trim());
      qs.set("page", String(page));
      qs.set("limit", String(tx.limit));

      const [sRes, tRes] = await Promise.all([
        get(`/api/v1/dakhal/summary?${qs.toString()}`),
        get(`/api/v1/dakhal/transactions?${qs.toString()}`),
      ]);

      setSummary(sRes.data.data || null);
      setTx(tRes.data.data || { rows: [] });
    } catch (err) {
      console.error(err);
      toast.error(t("FailedToLoadData", { defaultValue: "Failed to load data" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, startDate, endDate, type]);

  const chartData = useMemo(() => {
    // simple day aggregation from current page for now
    const map = new Map();
    (tx.rows || []).forEach((r) => {
      const day = new Date(r.date).toLocaleDateString(i18n.language);
      const amount = Number(r.totalDebit || r.totalCredit || 0);
      const prev = map.get(day) || { day, revenue: 0, expense: 0, salary: 0, loss: 0 };
      if (r.referenceType === "revenue") prev.revenue += amount;
      else if (r.referenceType === "expense") prev.expense += amount;
      else if (r.referenceType === "salary") prev.salary += amount;
      else if (r.referenceType === "loss") prev.loss += amount;
      map.set(day, prev);
    });
    return Array.from(map.values()).reverse();
  }, [tx.rows, i18n.language]);

  const cards = summary
    ? [
        { key: "CurrentBalance", value: toMoney(summary.currentBalance), color: "text-blue-700" },
        { key: "TotalRevenue", value: toMoney(summary.totalRevenue), color: "text-green-600" },
        { key: "TotalSalaries", value: toMoney(summary.totalSalaries), color: "text-red-600" },
        { key: "TotalExpenses", value: toMoney(summary.totalExpenses), color: "text-red-600" },
        { key: "TotalLosses", value: toMoney(summary.totalLosses), color: "text-red-600" },
      ]
    : [];

  return (
    <div className="space-y-4">
      {summary && (
        <div className="erp-stat-grid">
          {cards.map((c) => (
            <div key={c.key} className="erp-stat-card">
              <div className="erp-stat-label">{t(c.key, { defaultValue: c.key })}</div>
              <div className={`erp-stat-value ${c.color || ""}`}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="erp-panel p-4">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4 justify-between">
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="erp-label">{t("DateRange", { defaultValue: "Date Range" })}</label>
              <select className="erp-select w-48" value={preset} onChange={(e) => setPreset(e.target.value)}>
                {PRESETS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {t(p.tKey, { defaultValue: p.tKey })}
                  </option>
                ))}
              </select>
            </div>

            {preset === "custom" && (
              <>
                <div>
                  <label className="erp-label">{t("StartDate", { defaultValue: "Start Date" })}</label>
                  <input className="erp-input w-44" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="erp-label">{t("EndDate", { defaultValue: "End Date" })}</label>
                  <input className="erp-input w-44" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </>
            )}

            <div>
              <label className="erp-label">{t("TransactionType", { defaultValue: "Transaction Type" })}</label>
              <select className="erp-select w-48" value={type} onChange={(e) => setType(e.target.value)}>
                {TYPES.map((tt) => (
                  <option key={tt.key} value={tt.key}>
                    {t(tt.tKey, { defaultValue: tt.tKey })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="erp-label">{t("Search", { defaultValue: "Search" })}</label>
              <input className="erp-input w-64" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search", { defaultValue: "Search" })} />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={() => fetchAll(1)} disabled={loading}>
              {t("Refresh", { defaultValue: "Refresh" })}
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                downloadCsv(tx.rows || [], `dakhal-${preset}-${type}.csv`);
                if ((tx.rows || []).length > 0) {
                  toast.success(t("ExportedSuccessfully", { defaultValue: "File exported successfully" }));
                }
              }}
              disabled={(tx.rows || []).length === 0}
            >
              {t("Export", { defaultValue: "Export" })}
            </button>
          </div>
        </div>
      </div>

      <div className="erp-panel p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wide">
          {t("FinancialCharts", { defaultValue: "Financial Charts" })}
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#16a34a" name={t("Revenue")} />
            <Line type="monotone" dataKey="expense" stroke="#dc2626" name={t("Expense")} />
            <Line type="monotone" dataKey="salary" stroke="#f59e0b" name={t("Salary")} />
            <Line type="monotone" dataKey="loss" stroke="#7c3aed" name={t("Loss")} />
          </LineChart>
        </ResponsiveContainer>
        <div className="text-xs text-slate-500 mt-2">
          {t("ChartNote", { defaultValue: "Charts update with filters (current page aggregation)." })}
        </div>
      </div>

      <div className="erp-table-wrap">
        <table className="erp-table">
          <thead>
            <tr>
              <th>{t("Date")}</th>
              <th>{t("TransactionType", { defaultValue: "Transaction Type" })}</th>
              <th>{t("Description")}</th>
              <th>{t("Amount")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8 text-slate-500">{t("Loading")}</td></tr>
            ) : (tx.rows || []).length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-slate-500">{t("NoTransactions", { defaultValue: "No transactions" })}</td></tr>
            ) : (
              (tx.rows || []).map((r) => (
                <tr key={r._id}>
                  <td>{new Date(r.date).toLocaleDateString(i18n.language)}</td>
                  <td><span className="erp-badge erp-badge-neutral">{r.referenceType}</span></td>
                  <td className="font-medium">{r.description}</td>
                  <td className={r.referenceType === "revenue" ? "text-green-700 font-semibold" : "text-red-600 font-semibold"}>
                    {toMoney(Number(r.totalDebit || r.totalCredit || 0))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="erp-panel p-4 flex items-center justify-between gap-3">
        <div className="text-sm text-slate-600">
          {t("TotalRecords")}: <span className="font-semibold">{tx.total || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-secondary" onClick={() => fetchAll(Math.max(1, (tx.page || 1) - 1))} disabled={(tx.page || 1) <= 1 || loading}>
            {t("Previous")}
          </button>
          <span className="text-sm font-medium">{tx.page || 1} / {tx.totalPages || 1}</span>
          <button type="button" className="btn-secondary" onClick={() => fetchAll(Math.min(tx.totalPages || 1, (tx.page || 1) + 1))} disabled={(tx.page || 1) >= (tx.totalPages || 1) || loading}>
            {t("Next")}
          </button>
        </div>
      </div>
    </div>
  );
}

