import Member from "../models/Member.js";
import Payment from "../models/Payment.js";
import Attendance from "../models/Attendance.js";

const indiaToday = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

export async function dashboard(req, res) {
  const members = await Member.find({ tenantId: req.tenantId });
  const payments = await Payment.find({ tenantId: req.tenantId })
    .populate("memberId", "name phone amount paid")
    .sort({ date: -1, createdAt: -1 });

  const today = indiaToday();
  const attendance = await Attendance.findOne({
    tenantId: req.tenantId,
    date: today,
  });

  const records = attendance?.records
    ? attendance.records instanceof Map
      ? Object.fromEntries(attendance.records)
      : attendance.records
    : {};

  // Member.paid is the total amount paid by that member.
  // Payment documents contain the transaction history, so do not add both.
  const collected = members.reduce(
    (total, member) => total + Number(member.paid || 0),
    0
  );

  const pending = members.reduce(
    (total, member) =>
      total +
      Math.max(
        0,
        Number(member.amount || 0) - Number(member.paid || 0)
      ),
    0
  );

  res.json({
    total: members.length,
    active: members.filter((member) => member.endDate >= today).length,
    todayAttendance: Object.values(records).filter(
      (status) => status === "Present"
    ).length,
    collected,
    pending,
    payments,
  });
}
