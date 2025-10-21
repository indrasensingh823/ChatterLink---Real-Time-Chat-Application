// server/meetings/meetingRoutes.js
import express from "express";
import Meeting from "../models/Meeting.js";
import { generateMeetingLink } from "../utils/generateLink.js";

const router = express.Router();

// ➕ Create new meeting
router.post("/create", async (req, res) => {
  try {
    const { title, description, date, hostName } = req.body;
    const link = generateMeetingLink();
    const newMeeting = await Meeting.create({ title, description, date, hostName, link });
    res.json({ success: true, meeting: newMeeting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 🔗 Get meeting by link
router.get("/:link", async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ link: req.params.link });
    if (!meeting) return res.status(404).json({ success: false, message: "Meeting not found" });
    res.json({ success: true, meeting });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
