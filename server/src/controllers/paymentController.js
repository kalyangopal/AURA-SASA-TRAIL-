import Payment from "../models/Payment.js";
import Member from "../models/Member.js";

export async function list(req, res) {
  res.json(
    await Payment.find({ tenantId: req.tenantId })
      .populate("memberId", "name phone amount paid")
      .sort({ date: -1, createdAt: -1 })
  );
}

export async function create(req, res) {
  const member = await Member.findOne({
    _id: req.body.memberId,
    tenantId: req.tenantId,
  });

  if (!member) {
    return res.status(404).json({ message: "Member not found" });
  }

  const amount = Number(req.body.amount || 0);

  if (amount <= 0) {
    return res.status(400).json({ message: "Payment amount must be greater than 0" });
  }

  const currentPaid = Number(member.paid || 0);
  const membershipAmount = Number(member.amount || 0);

  if (currentPaid + amount > membershipAmount) {
    return res.status(400).json({
      message: `Payment exceeds the remaining balance of ₹${Math.max(
        0,
        membershipAmount - currentPaid
      ).toLocaleString("en-IN")}`,
    });
  }

  const p = await Payment.create({
    ...req.body,
    amount,
    tenantId: req.tenantId,
  });

  // Keep Member.paid as the current total paid amount.
  member.paid = currentPaid + amount;
  await member.save();

  res.status(201).json(await p.populate("memberId", "name phone amount paid"));
}
