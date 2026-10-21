# 🎮 Gaming Cafe Management System & Live Station Board

A full-stack Gaming Cafe & Esports Zone Management System built with React, Vite, Express, Tailwind CSS, and Supabase.

---

## 🚀 How to Run the Project Zip in VS Code (Step-by-Step)

Follow these simple steps to run this project on your computer using Visual Studio Code:

### 1. Prerequisites
Make sure you have **Node.js** (v18 or higher) installed on your computer.
- Download Node.js from [nodejs.org](https://nodejs.org/) if you don't have it installed.

---

### 2. Extract the Zip File & Open in VS Code
1. Extract (unzip) the downloaded `.zip` file into a folder on your computer.
2. Open **VS Code**.
3. Click **File ➔ Open Folder...** and select the unzipped project folder.

---

### 3. Open Terminal in VS Code
- Press `Ctrl + ~` (or `Cmd + ~` on Mac) OR go to **Terminal ➔ New Terminal** at the top menu.

---

### 4. Install Dependencies
In the VS Code terminal, run:
```bash
npm install
```
This will download and install all necessary dependencies into `node_modules`.

---

### 5. Setup Environment Variables (Optional)
Copy `.env.example` to create `.env`:
```bash
cp .env.example .env
```
*(On Windows PowerShell, use `copy .env.example .env`)*

---

### 6. Start the Local Development Server
Run the following command in the terminal:
```bash
npm run dev
```

You will see output in the terminal:
```
🎮 Gaming Cafe Backend running on http://0.0.0.0:3000
```

Open your browser and navigate to:
👉 **`http://localhost:3000`**

---

## 🛠️ Project Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts Express backend server with Vite live HMR on port 3000 |
| `npm run build` | Builds frontend assets and bundles `server.ts` into `dist/server.cjs` |
| `npm start` | Runs the compiled production server (`node dist/server.cjs`) |
| `npm run lint` | Runs TypeScript type checking |

---

## 📡 Live Multi-Device Sync & Live Station Board

- **Live Station Monitor**: Open `http://localhost:3000?view=live` on any mobile phone, tablet, or secondary display.
- **Auto-Sync**: Automatically syncs station statuses (Free vs Busy), active gamers, timer ends, and incoming bookings every 3 seconds.
- **Supabase Cloud Sync**: Real-time cloud sync for advance bookings and customer history.
