// server/models/Message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  roomId: {
    type: String,
    required: true
  },
  edited: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  timestamp: {
    type: String,
    required: true
  }
});

// Create model
const Message = mongoose.model("Message", messageSchema);

// Export model and helper methods
export const findByIdAndUpdate = (id, data, options = {}) => {
  return Message.findByIdAndUpdate(id, data, options);
};

export const findByIdAndDelete = (id) => {
  return Message.findByIdAndDelete(id);
};

export default Message;
