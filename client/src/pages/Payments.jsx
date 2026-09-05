import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import api from "../services/api";

const localToday = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function Payments() {
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    memberId: "",
    amount: 0,
    date: localToday(),
    method: "Cash",
    note: "",
  });

  const load = async () => {
    const [membersResponse, paymentsResponse] = await Promise.all([
      api.get("/members"),
      api.get("/payments"),
    ]);

    setMembers(membersResponse.data || []);
    setPayments(paymentsResponse.data || []);

    try {
      const attendanceResponse = await api.get("/attendance");
      setAttendance(attendanceResponse.data || []);
    } catch {
      setAttendance([]);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");
        await load();
      } catch (err) {
        console.error("Failed to load payment data:", err);
        if (mounted) setError(err.response?.data?.message || "Unable to load payment data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const memberMap = useMemo(
    () => Object.fromEntries(members.map((m) => [m._id, m])),
    [members]
  );

  const paymentDetails = useMemo(() => {
    const running = {};
    const ascending = [...payments].sort((a, b) => {
      const dateCompare = String(a.date).localeCompare(String(b.date));
      if (dateCompare !== 0) return dateCompare;
      return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
    });

    const details = new Map();

    ascending.forEach((payment) => {
      const id = payment.memberId?._id || payment.memberId;
      running[id] = (running[id] || 0) + Number(payment.amount || 0);

      const member = memberMap[id];
      const membershipAmount = Number(member?.amount || payment.memberId?.amount || 0);
      details.set(payment._id, {
        totalPaidAtTransaction: running[id],
        balanceAfterTransaction: Math.max(0, membershipAmount - running[id]),
      });
    });

    return details;
  }, [payments, memberMap]);

  const collected = members.reduce(
    (total, member) => total + Number(member.paid || 0),
    0
  );

  const pending = members.reduce(
    (total, member) =>
      total + Math.max(0, Number(member.amount || 0) - Number(member.paid || 0)),
    0
  );

  const save = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      await api.post("/payments", {
        ...form,
        amount: Number(form.amount),
      });

      setOpen(false);
      setForm({
        memberId: "",
        amount: 0,
        date: localToday(),
        method: "Cash",
        note: "",
      });

      await load();
      alert("Payment recorded successfully!");
    } catch (err) {
      console.error("Failed to save payment:", err);
      setError(err.response?.data?.message || "Unable to record payment.");
    } finally {
      setSaving(false);
    }
  };

  const downloadExcel = () => {
    const paymentRows = payments.map((payment) => {
      const member = memberMap[payment.memberId?._id || payment.memberId] || payment.memberId || {};
      const detail = paymentDetails.get(payment._id) || {};

      return {
        Date: payment.date,
        Member: member.name || "Member",
        Phone: member.phone || "",
        "Membership Amount": Number(member.amount || 0),
        "Payment Amount": Number(payment.amount || 0),
        "Total Paid": Number(detail.totalPaidAtTransaction || 0),
        Balance: Number(detail.balanceAfterTransaction || 0),
        Method: payment.method || "",
        Note: payment.note || "",
      };
    });

    const memberRows = members.map((member) => ({
      Member: member.name,
      Phone: member.phone,
      Plan: member.plan,
      "Membership Amount": Number(member.amount || 0),
      "Amount Paid": Number(member.paid || 0),
      Balance: Math.max(0, Number(member.amount || 0) - Number(member.paid || 0)),
      "Start Date": member.startDate,
      "Expiry Date": member.endDate,
      Status: member.endDate >= localToday() ? "Active" : "Inactive",
    }));

    const attendanceRows = [];
    attendance.forEach((day) => {
      const records = day.records || {};
      Object.entries(records).forEach(([memberId, status]) => {
        const member = memberMap[memberId];
        attendanceRows.push({
          Date: day.date,
          Member: member?.name || "Member",
          Phone: member?.phone || "",
          Status: status,
        });
      });
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(paymentRows), "Payment Details");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(memberRows), "Member Balances");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(attendanceRows), "Attendance");

    XLSX.writeFile(workbook, `AURA-Gym-Report-${localToday()}.xlsx`);
  };

  if (loading) {
    return <section><article className="card"><p>Loading payments...</p></article></section>;
  }

  return (
    <section>
      <div className="head">
        <div>
          <h1>Payments</h1>
          <p>Track membership payments and balances.</p>
        </div>
        <div className="actions">
          <button className="secondary" onClick={downloadExcel}>↓ Download Excel</button>
          <button className="primary" onClick={() => { setError(""); setOpen(true); }}>+ Record Payment</button>
        </div>
      </div>

      {error && <div className="error" style={{ marginBottom: 14 }}>{error}</div>}

      <div className="stats four">
        <div className="stat"><span>Total Collected</span><strong>{money(collected)}</strong></div>
        <div className="stat"><span>Transactions</span><strong>{payments.length}</strong></div>
        <div className="stat"><span>Members</span><strong>{members.length}</strong></div>
        <div className="stat"><span>Pending Balance</span><strong>{money(pending)}</strong></div>
      </div>

      <article className="card">
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Member</th>
                <th>Membership</th>
                <th>Payment</th>
                <th>Total Paid</th>
                <th>Balance</th>
                <th>Method</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: "center" }}>No payments recorded yet.</td></tr>
              ) : payments.map((payment) => {
                const member = memberMap[payment.memberId?._id || payment.memberId] || payment.memberId || {};
                const detail = paymentDetails.get(payment._id) || {};
                const balance = Number(detail.balanceAfterTransaction || 0);

                return (
                  <tr key={payment._id}>
                    <td>{payment.date}</td>
                    <td>{member.name || "Member"}</td>
                    <td>{money(member.amount)}</td>
                    <td><b>{money(payment.amount)}</b></td>
                    <td>{money(detail.totalPaidAtTransaction)}</td>
                    <td><span className={`badge ${balance ? "pending" : "paid"}`}>{money(balance)}</span></td>
                    <td>{payment.method || "-"}</td>
                    <td>{payment.note || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>

      {open && (
        <div className="modalback">
          <div className="modal small">
            <div className="modalhead">
              <h2>Record Payment</h2>
              <button className="close" type="button" onClick={() => setOpen(false)} disabled={saving}>×</button>
            </div>

            <form onSubmit={save}>
              <div className="formgrid">
                <label className="full">
                  Member
                  <select name="memberId" required value={form.memberId} onChange={(e) => setForm((p) => ({ ...p, memberId: e.target.value }))}>
                    <option value="">Select member</option>
                    {members.map((member) => {
                      const balance = Math.max(0, Number(member.amount || 0) - Number(member.paid || 0));
                      return <option key={member._id} value={member._id}>{member.name} — Balance {money(balance)}</option>;
                    })}
                  </select>
                </label>

                <label>
                  Amount
                  <input name="amount" required type="number" min="1" step="0.01" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
                </label>

                <label>
                  Date
                  <input name="date" required type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
                </label>

                <label>
                  Method
                  <select name="method" value={form.method} onChange={(e) => setForm((p) => ({ ...p, method: e.target.value }))}>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </label>

                <label>
                  Note
                  <input name="note" value={form.note} onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))} placeholder="Optional" />
                </label>
              </div>

              <div className="modalactions">
                <button type="button" className="secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
                <button className="primary" disabled={saving}>{saving ? "Saving..." : "Save Payment"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
