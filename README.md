# 💬 ChatterLink - Real-Time Chat Application

ChatterLink is a full-stack real-time chat application built using **React**, **Node.js**, **Express**, **Socket.IO**, and **MongoDB**. It allows users to join public or private chat rooms, participate in typing races, and engage in live conversations instantly.

![ChatterLink Preview](https://your-screenshot-or-demo-image-url.com)

---

## 🚀 Features

✅ Real-time public chat rooms  
✅ Private chat rooms with passcode protection  
✅ Typing indicators (who's typing...)  
✅ Edit & delete messages (with sync to all users)  
✅ Typing race with WPM & accuracy tracking  
✅ Online users count  
✅ Responsive design (mobile + desktop)

---

## 🛠 Tech Stack

- **Frontend:** React, Socket.IO Client, CSS (Custom + Responsive)
- **Backend:** Node.js, Express, Socket.IO, MongoDB (Mongoose)
- **Other:** dotenv, cors

---

## 📂 Project Structure

/client → React frontend app
/server → Express + Socket.IO + MongoDB backend
.gitignore → Ignores node_modules & sensitive files
README.md → This file


---

## ⚡ Setup Instructions

### 1️⃣ Clone the repository
```bash
git clone https://github.com/your-username/ChatterLink---Real-Time-Chat-Application.git
cd ChatterLink---Real-Time-Chat-Application
```

### 2️⃣ Setup the server
```bash
cd server
npm install
```

### 👉 Create a .env file in /server:
```bash
MONGO_URI=your-mongodb-connection-string
PORT=5001

npm start

```

### 3️⃣ Setup the client
```bash
cd ../client
npm install
npm start
```
---

### Run the app
Open your browser and navigate to:
```bash
http://localhost:3000
```

### License
This project is licensed under the MIT License.

## ⭐ Show your support!
If you like this project, give it a ⭐ on GitHub!



