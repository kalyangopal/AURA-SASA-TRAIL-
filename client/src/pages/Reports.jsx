import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import api from "../services/api";

export default function Reports() {
  const [d, setD] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function fetchReports() {
      try {
        const response = await api.get("/reports/dashboard");
        if (mounted) setD(response.data);
      } catch (err) {
        console.error("Failed to load reports:", err);
        if (mounted) setError(err.response?.data?.message || "Unable to load reports.");
      }
    }

    fetchReports();
    return () => {
      mounted = false;
    };
  }, []);

  const downloadReport = () => {
    if (!d) return;

    const summary = [
      { Report: "Total Members", Value: d.total },
      { Report: "Active Members", Value: d.active },
      { Report: "Inactive Members", Value: d.total - d.active },
      { Report: "Today's Attendance", Value: d.todayAttendance },
      { Report: "Total Collected", Value: Number(d.collected || 0) },
      { Report: "Pending Balance", Value: Number(d.pending || 0) },
      { Report: "Transactions", Value: d.payments?.length || 0 },
    ];

    const payments = (d.payments || []).map((p) => ({
      Date: p.date,
      Member: p.memberId?.name || "Member",
      Phone: p.memberId?.phone || "",
      Amount: Number(p.amount || 0),
      Method: p.method || "",
      Note: p.note || "",
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summary), "Summary");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(payments), "Payments");
    XLSX.writeFile(workbook, `AURA-Gym-Reports-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (error) return <section><article className="card"><h2>Unable to load reports</h2><p>{error}</p></article></section>;
  if (!d) return <div>Loading reports…</div>;

  return (
    <section>
      <div className="head">
        <div><h1>Reports</h1><p>Simple summaries from your entered data.</p></div>
        <button className="secondary" onClick={downloadReport}>↓ Download Excel</button>
      </div>

      <div className="reportgrid">
        {[
          ["Member Summary", [["Total", d.total], ["Active", d.active], ["Inactive", d.total - d.active]]],
          ["Payment Summary", [["Collected", "₹" + Number(d.collected || 0).toLocaleString("en-IN")], ["Pending", "₹" + Number(d.pending || 0).toLocaleString("en-IN")], ["Transactions", d.payments.length]]],
          ["Attendance Summary", [["Today", d.todayAttendance], ["Transactions", d.payments.length], ["Active Members", d.active]]],
        ].map(([title, rows]) => (
          <article className="card" key={title}>
            <h2>{title}</h2>
            {rows.map(([label, value]) => <div className="row" key={label}><span>{label}</span><b>{value}</b></div>)}
          </article>
        ))}
      </div>
    </section>
  );
}
