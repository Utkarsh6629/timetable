# Changelog

All notable changes to the **Life Planner** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-09-26

### 🌟 Added
- **Dedicated High-Level Goals & North Star Objective Page (`/goals`)**:
  - **North Star Hero Focus**: Visually prominent showcase for the #1 overarching transformation or long-term objective the user wants to achieve.
  - **Intrinsic Motivation Callout**: Highlight the deep "Why" behind the goal to maintain emotional drive when motivation dips.
  - **Interactive Checkpoints & Milestones**: Add, check off, and delete milestones with instant progress updates.
  - **Quantitative Metrics & Target Tracking**: Optional numeric targets (e.g. `$1,000 MRR`, `21 km`, `24 books`) with quick decrement/increment controls.
  - **Supporting Daily & Weekly Habits**: Tag recurring routines that directly feed into goal achievement.
  - **Curated Goal Blueprints**: 1-click starter templates across Career, Learning, Health & Fitness, Finance, Personal, and Side Project domains.
  - **Multi-Domain Filters**: Instant filtering by domain and status (Active, Conquered, On Hold).
- **Dashboard North Star Widget (`NorthStarBanner`)**:
  - Seamlessly embedded right above `WeeklyGoals` on the main dashboard (`/`), keeping your primary long-term vision in focus alongside daily tasks.
- **On-Time Android Background Alarms & Delivery (Swiggy/Alarm-Clock Style)**:
  - **`allowWhileIdle: true` with `RTC_WAKEUP`**: Ensures Android's `AlarmManager` wakes up the device from deep sleep/Doze mode at the exact scheduled second.
  - **Dedicated Native Alarm Stream (`USAGE_ALARM`)**: Created high-priority notification channel `life-planner-task-alarms-v2` with `AudioAttributes.USAGE_ALARM` so background alarms ring on the device's **Alarm Volume** slider (bypassing silent mode and media volume).
  - **Native Alarm Audio Asset**: Added high-penetration multi-pulse alarm tone `alarm.wav` to `res/raw/` and `public/sounds/`.
  - **Android Battery Optimization Exemption Bridge**: Added `AlarmHelperPlugin` to detect Doze mode throttling and provide a 1-click exemption button in `AlarmSettingsModal`.

### 🔧 Fixed
- **In-App APK Update Failure ("App not installed")**: Added persistent repository signing keystore (`signing.keystore`) and configured `signingConfigs` in `android/app/build.gradle` to ensure every GitHub Actions build is signed with the identical cryptographic key. Future APK updates now install seamlessly over existing installations without having to uninstall the app.

### 🔄 Changed
- Migrated server SQLite schema in `user_data` to automatically include and synchronize `high_level_goals` and `weekly_goals`.
- Added `/goals` navigation item with `Target` icon to desktop `Sidebar` and mobile `BottomNav`.
- Updated Vite development proxy to `http://127.0.0.1:3001` to eliminate Node.js IPv6 `ECONNREFUSED` issues on Windows.
- Added root convenience script `"server": "npm --prefix server run dev"`.

---

## [1.0.1] - 2026-09-15

### 🌟 Added
- **Exact Time Picker**: Integration of MUI time picker with hour and minute selection.
- **Background Alarms**: Initial background alarm tone options (Radar, Digital, Chime, Retro, Siren) and volume controls.
- **Per-Task Alarm Toggle**: Ability to mute or enable alarms on individual timetable tasks.

---

## [1.0.0] - 2026-09-01

### 🚀 Initial Release
- Mon-Sun drag-and-drop weekly timetable routine builder.
- Day View with timeline, completion statistics, task list, and daily journal.
- Month View productivity heatmap.
- Streak counter and completion metrics.
- Cross-device cloud sync with SQLite backend and Google OAuth.
- Android Capacitor packaging with in-app update check.
