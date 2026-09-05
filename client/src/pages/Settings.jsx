import { useEffect, useState } from "react";
import api from "../services/api";

export default function Settings() {
  const [s, setS] = useState({
    gymName: "",
    ownerName: "",
    phone: "",
    email: "",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function fetchSettings() {
      try {
        const response = await api.get("/settings");
        if (mounted) setS((prev) => ({ ...prev, ...(response.data || {}) }));
      } catch (err) {
        console.error("Failed to load settings:", err);
        if (mounted) setError(err.response?.data?.message || "Unable to load settings.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchSettings();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setS((prev) => ({ ...prev, [name]: value }));
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      const response = await api.put("/settings", s);
      setS((prev) => ({ ...prev, ...(response.data || {}) }));
      alert("Settings saved successfully!");
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError(err.response?.data?.message || "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <section><article className="card"><p>Loading settings...</p></article></section>;

  return (
    <section>
      <div className="head">
        <div><h1>Settings</h1><p>Configure your gym information.</p></div>
        <button className="primary" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Settings"}</button>
      </div>

      {error && <div className="error" style={{ marginBottom: 14 }}>{error}</div>}

      <article className="card settings">
        <h2>Gym Information</h2>
        <div className="formgrid">
          <label>Gym Name<input name="gymName" value={s.gymName} onChange={handleChange} /></label>
          <label>Owner Name<input name="ownerName" value={s.ownerName} onChange={handleChange} /></label>
          <label>Phone<input name="phone" type="tel" value={s.phone} onChange={handleChange} /></label>
          <label>Email<input name="email" type="email" value={s.email} onChange={handleChange} /></label>
          <label className="full">Address<textarea name="address" rows="3" value={s.address} onChange={handleChange} /></label>
        </div>
      </article>
    </section>
  );
}
