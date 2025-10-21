// server/models/Meeting.js
import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: Date,
  hostName: String,
  link: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Meeting", meetingSchema);
