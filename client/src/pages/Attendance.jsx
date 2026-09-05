import { useEffect, useState } from "react";
import api from "../services/api";

const today = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
};

export default function Attendance() {
  const [members, setMembers] = useState([]);
  const [date, setDate] = useState(today());
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadMembers() {
      try {
        const response = await api.get("/members");
        if (mounted) setMembers(response.data || []);
      } catch (err) {
        if (mounted) setError(err.response?.data?.message || "Unable to load members.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadMembers();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadAttendance() {
      try {
        const response = await api.get(`/attendance/${date}`);
        if (mounted) setRecords(response.data || {});
      } catch (err) {
        if (mounted) setError(err.response?.data?.message || "Unable to load attendance.");
      }
    }

    loadAttendance();
    return () => {
      mounted = false;
    };
  }, [date]);

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      await api.put(`/attendance/${date}`, { records });
      alert("Attendance saved successfully!");
    } catch (err) {
      console.error("Failed to save attendance:", err);
      setError(err.response?.data?.message || "Unable to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <section><article className="card"><p>Loading attendance...</p></article></section>;

  return (
    <section>
      <div className="head">
        <div>
          <h1>Attendance</h1>
          <p>Mark daily member attendance.</p>
        </div>
        <div className="actions">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <button className="secondary" onClick={() => setRecords(Object.fromEntries(members.map((m) => [m._id, "Present"]))) }>
            Mark All Present
          </button>
          <button className="primary" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>

      {error && <div className="error" style={{ marginBottom: 14 }}>{error}</div>}

      <article className="card">
        <div className="tablewrap">
          <table>
            <thead><tr><th>Member</th><th>Phone</th><th>Membership</th><th>Attendance</th></tr></thead>
            <tbody>
              {members.map((m) => (
                <tr key={m._id}>
                  <td><div className="person"><i>{m.name[0]}</i><b>{m.name}</b></div></td>
                  <td>{m.phone}</td>
                  <td><span className={`badge ${m.endDate >= today() ? "paid" : "overdue"}`}>{m.endDate >= today() ? "Active" : "Inactive"}</span></td>
                  <td>
                    <select value={records[m._id] || "Absent"} onChange={(e) => setRecords((prev) => ({ ...prev, [m._id]: e.target.value }))}>
                      <option>Present</option>
                      <option>Absent</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!members.length && <div className="empty">No members available.<br /><span>Add members first.</span></div>}
      </article>
    </section>
  );
}
