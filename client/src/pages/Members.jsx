import { useEffect, useState } from "react";
import api from "../services/api";

const today = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const balance = (m) =>
  Math.max(0, Number(m.amount || 0) - Number(m.paid || 0));

const empty = {
  name: "",
  phone: "",
  gender: "",
  dob: "",
  plan: "Monthly",
  amount: 0,
  paid: 0,
  method: "Cash",
  startDate: today(),
  endDate: today(),
  address: "",
};

export default function Members() {
  const [members, setMembers] = useState([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [q, setQ] = useState("");
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadMembers() {
      try {
        const response = await api.get("/members");
        if (mounted) setMembers(response.data || []);
      } catch (err) {
        console.error("Failed to load members:", err);
        if (mounted) setError(err.response?.data?.message || "Unable to load members.");
      }
    }

    loadMembers();
    return () => {
      mounted = false;
    };
  }, []);

  const load = async () => {
    const response = await api.get("/members");
    setMembers(response.data || []);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      setError("");
      const data = { ...form, amount: Number(form.amount), paid: Number(form.paid) };

      if (data.paid > data.amount) {
        setError("Amount paid cannot be greater than the membership amount.");
        return;
      }

      if (edit) await api.put(`/members/${edit._id}`, data);
      else await api.post("/members", data);

      setOpen(false);
      setEdit(null);
      setForm(empty);
      await load();
    } catch (err) {
      console.error("Failed to save member:", err);
      setError(err.response?.data?.message || "Unable to save member.");
    }
  };

  const del = async (id) => {
    if (!confirm("Delete this member?")) return;
    try {
      await api.delete(`/members/${id}`);
      await load();
    } catch (err) {
      console.error("Failed to delete member:", err);
      setError(err.response?.data?.message || "Unable to delete member.");
    }
  };

  const filtered = members.filter((m) =>
    `${m.name} ${m.phone}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <section>
      <div className="head">
        <div>
          <h1>Members</h1>
          <p>Add and manage your gym members.</p>
        </div>
        <button
          className="primary"
          onClick={() => {
            setError("");
            setEdit(null);
            setForm(empty);
            setOpen(true);
          }}
        >
          + Add Member
        </button>
      </div>

      {error && <div className="error" style={{ marginBottom: 14 }}>{error}</div>}

      <div className="toolbar">
        <input
          placeholder="Search name or phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <article className="card">
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Phone</th>
                <th>Plan</th>
                <th>Start</th>
                <th>Expiry</th>
                <th>Payment</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const bal = balance(m);
                return (
                  <tr key={m._id}>
                    <td>
                      <div className="person">
                        <i>{m.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}</i>
                        <div><b>{m.name}</b><small>{m.gender || ""}</small></div>
                      </div>
                    </td>
                    <td>{m.phone}</td>
                    <td>{m.plan}</td>
                    <td>{m.startDate}</td>
                    <td>{m.endDate}</td>
                    <td>
                      <span className={`badge ${bal ? "pending" : "paid"}`}>
                        {bal ? "Pending" : "Paid"}
                      </span>
                      <br />
                      <small>
                        Paid: ₹{Number(m.paid || 0).toLocaleString("en-IN")}
                      </small>
                      <br />
                      <b>
                        Balance: ₹{bal.toLocaleString("en-IN")}
                      </b>
                    </td>
                    <td>
                      <button
                        className="text"
                        onClick={() => {
                          setError("");
                          setEdit(m);
                          setForm({ ...empty, ...m });
                          setOpen(true);
                        }}
                      >Edit</button>{" "}
                      <button className="text dangertext" onClick={() => del(m._id)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!filtered.length && (
          <div className="empty">No members found.<br /><span>Add your first member to begin.</span></div>
        )}
      </article>

      {open && (
        <div className="modalback">
          <div className="modal">
            <div className="modalhead">
              <div>
                <h2>{edit ? "Edit Member" : "Add Member"}</h2>
                <p>Enter the member's real details.</p>
              </div>
              <button className="close" onClick={() => setOpen(false)}>×</button>
            </div>

            <form onSubmit={save}>
              <div className="formgrid">
                {[
                  ["name", "Full Name *"],
                  ["phone", "Phone Number *"],
                  ["gender", "Gender"],
                  ["dob", "Date of Birth"],
                  ["plan", "Membership Plan *"],
                  ["amount", "Membership Amount *"],
                  ["paid", "Amount Paid *"],
                  ["method", "Payment Method"],
                  ["startDate", "Start Date *"],
                  ["endDate", "Expiry Date *"],
                  ["address", "Address"],
                ].map(([k, l]) => (
                  <label className={k === "address" ? "full" : ""} key={k}>
                    {l}
                    <input
                      required={["name", "phone", "plan", "amount", "paid", "startDate", "endDate"].includes(k)}
                      type={["amount", "paid"].includes(k) ? "number" : k === "dob" || k === "startDate" || k === "endDate" ? "date" : "text"}
                      min={["amount", "paid"].includes(k) ? "0" : undefined}
                      value={form[k] ?? ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, [k]: e.target.value }))}
                    />
                  </label>
                ))}
              </div>

              <div className="modalactions">
                <button type="button" className="secondary" onClick={() => setOpen(false)}>Cancel</button>
                <button className="primary">Save Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
