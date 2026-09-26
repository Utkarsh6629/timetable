# Life Planner

A modern, responsive, and interactive personal productivity dashboard designed to help you build your ideal weekly routine and track your consistency over time. Blending the concepts of Google Calendar, Notion, and GitHub's contribution heatmaps, Life Planner acts as your personal day-to-day productivity assistant.

## 🚀 Live Demo & Repository
* **GitHub Repository:** [https://github.com/Utkarsh6629/timetable](https://github.com/Utkarsh6629/timetable)

---

## ✨ Key Features

### 📅 1. Day View (Default Dashboard)
* **Real-time Timeline:** Displays a live clock and progress bar tracking completion percentage.
* **Smart Assistant:** Automatically detects your current active task, the previous task, and the upcoming task, along with a real-time countdown to the next scheduled block.
* **Daily Tasks:** Automatically populates tasks based on your ideal weekly timetable. Checkboxes update completion metrics instantly.
* **Daily Journal:** Maintain notes, track daily wins/accomplishments, and write down improvements for tomorrow. All journal fields autosave immediately.

### 🗓️ 2. Weekly Timetable Grid
* **Visual Routine Builder:** A clean Mon-Sun calendar grid showing your ideal weekly routine.
* **Drag & Drop / Resize:** Drag-to-move tiles to different hours (snaps to 30-minute intervals) and vertically resize tiles to span multiple hours.
* **Flexible Day Range:** Configure when your personal day starts and ends (via the settings icon). Supports overnight scheduling (e.g., 8:00 AM to 1:00 AM the next day), where late-night tasks still count for the same calendar day.
* **Bulk Tasks & Customizations:** Select multiple days when creating or editing tasks to duplicate them instantly across the week. Pick from a curated palette of 12 colors.

### 📊 3. Month View Heatmap
* **GitHub-style Heatmap:** A full monthly calendar grid displaying your productivity color-coded by daily completion rate (Red for 0% completed to Dark Green for 100% completed).
* **Detailed Cells:** Each cell shows the completion percentage, total tasks completed, and a notes indicator.
* **Quick Navigation:** Click any calendar day to jump directly to that date's day view for detailed logs, notes, or edits.

### ⚡ 4. Productivity Insights & Streaks
* **Streak Tracking:** Displays current and longest streaks of 100% completed days.
* **Weekly Metrics:** Shows your completion percentage across the current week.
* **Smart Insights:** Automatically analyzes your task history to surface completion statistics for recurring tasks.

### 🎯 5. High-Level Goals & North Star Objective
* **Dedicated High-Level Goals Page:** Establish and track long-term transformations beyond weekly routines.
* **North Star Hero Focus:** Designate and highlight your #1 primary high-level objective with deadline countdowns, progress metrics, and intrinsic motivation ("The Deep Why").
* **Milestone Checkpoints & Metrics:** Break big goals into concrete checkpoints with progress tracking and quantitative goals (e.g. revenue, mileage, books).
* **Main Dashboard Integration:** Prominent North Star banner embedded right above your weekly goals.
* **On-time Android Background Alarms:** Scheduled via `RTC_WAKEUP` and Android's native `USAGE_ALARM` stream to ring reliably on time even when the app is closed.

---

## 📜 Changelog
See [CHANGELOG.md](CHANGELOG.md) for full release notes and version history.

## 🛠️ Tech Stack
* **Framework:** React 18 + TypeScript + Vite
* **State Management & Persistence:** Zustand with custom localStorage persistence middleware
* **Styling:** Tailwind CSS v3 (Utility classes and custom theme tokens)
* **Icons:** Lucide React
* **Date Utilities:** date-fns

---

## 💻 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18 or higher recommended).

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Utkarsh6629/timetable.git
   cd timetable
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development servers:
   - **Start the backend server (runs on port 3001):**
     ```bash
     npm run server
     ```
   - **Start the frontend Vite server (runs on port 5173):**
     ```bash
     npm run dev
     ```
   Open [http://localhost:5173](http://localhost:5173) in your browser. Vite automatically proxies `/api` and `/auth` calls to `http://localhost:3001`.

### Production Build
To create an optimized production build, run:
```bash
npm run build
```
The output will be generated inside the `dist/` directory.

---

## 📝 License
This project is open-source and available under the MIT License.
