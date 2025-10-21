// server/utils/generateLink.js
import { randomBytes } from "crypto";

export const generateMeetingLink = () => {
  return randomBytes(8).toString("hex"); // unique 16-char link
};
