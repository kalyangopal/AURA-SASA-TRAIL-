import Attendance from "../models/Attendance.js";
import Member from "../models/Member.js";

export async function list(req, res) {
  const rows = await Attendance.find({ tenantId: req.tenantId }).sort({ date: -1 });
  res.json(rows);
}

export async function get(req, res) {
  const x = await Attendance.findOne({
    tenantId: req.tenantId,
    date: req.params.date,
  });

  if (!x) {
    return res.json({});
  }

  const records = x.records instanceof Map
    ? Object.fromEntries(x.records)
    : x.records || {};

  res.json(records);
}

export async function save(req, res) {
  const ids = await Member.find({ tenantId: req.tenantId }).select("_id");
  const allowed = new Set(ids.map((x) => x._id.toString()));
  const clean = {};

  for (const [id, status] of Object.entries(req.body.records || {})) {
    if (allowed.has(id) && ["Present", "Absent"].includes(status)) {
      clean[id] = status;
    }
  }

  const x = await Attendance.findOneAndUpdate(
    {
      tenantId: req.tenantId,
      date: req.params.date,
    },
    {
      tenantId: req.tenantId,
      date: req.params.date,
      records: clean,
    },
    {
      upsert: true,
      new: true,
    }
  );

  res.json(
    x.records instanceof Map ? Object.fromEntries(x.records) : x.records || {}
  );
}
