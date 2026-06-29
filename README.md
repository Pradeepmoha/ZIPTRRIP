# TODO Tasks - Multi-Page Todo Application

A modern, high-fidelity Full-Stack Todo Application featuring a React client frontend designed as a true Multi-Page Application (MPA), backed by a lightweight Node.js/Express REST API utilizing a local JSON database file.

---

## Technical Stack

- **Frontend**: React (v19) powered by Vite configured for Multi-Page Application routing, customized vanilla CSS design system, and Lucide React icons.
- **Backend**: Node.js & Express.js server providing REST APIs for CRUD operations.
- **Database**: Local JSON storage (`todos.json`) for data persistence.

---

## Features & Functionality

This application implements the following key features:

### 1. True Multi-Page Routing (MPA)
To strictly satisfy requirements, the frontend is structured with separate HTML entry points instead of single-page application (SPA) client-side routing:
- **Dashboard Page (`index.html`)**: Located at `/`, displays the tasks list, metrics dashboard, search/filter controls, and task creation form.
- **Details Page (`todo.html`)**: Located at `/todo.html?id=<task_id>`, displays detailed notes, checklist subtasks, and action controls for a specific todo item.
- Clicking on a task title or the external action link performs a browser-level page redirect, loading the second entry point from the backend.

### 2. Comprehensive Dashboard Analytics
- **Live Statistics Panel**: Calculates and updates task completion metrics, including Total Tasks, Completed, Pending, and Overdue.
- **Visual Progress Bar**: Displays overall progress percentage using an interactive slider.

### 3. Task Management & Custom Attributes
Each task contains the following structured attributes:
- **Title & Description**: Detailed summary of the goal.
- **Category Badge**: Classified under color-coded categories: *Work*, *Personal*, *Shopping*, *Health*, *Finance*, and *Other*.
- **Priority Level**: Styled badges indicating *Low* (Green), *Medium* (Yellow), and *High* (Red) priority levels.
- **Due Date Alerts**: Due dates dynamically update with relative indicators like **Overdue** (marked in Red), **Today** (marked in Yellow), or **Upcoming** (marked in Blue).
- **Subtasks Checklist**: Integrated subtask tracker displaying completion counts (`completed/total`) and a mini progress bar directly in the list.
- **Markdown Notes**: Textarea notes field for long-form checklist requirements or context.

### 4. Advanced Search & Filtering
- **Fuzzy Search**: Instantly filter tasks by typing into the search bar (matches title, description, and notes case-insensitively).
- **Category/Priority/Status Filters**: Segment list cards to locate target items quickly.
- **Custom Sorting**: Sort tasks by **Created Date**, **Due Date**, or **Priority Level** in both **ASC** and **DESC** ordering.

### 5. Interactive Checklist (Subtasks)
- Inline subtasks addition, removal, and checkbox toggling on the detail page, recalculating progress instantly.
- Option to add initial checklist items during task creation.

### 6. Full REST API CRUD Backend
- `GET /api/todos`: Fetch todos with full support for search queries, categories, priorities, statuses, and sorting keys.
- `GET /api/todos/:id`: Fetch details of a single task. Returns a `404` status if the task ID does not exist.
- `POST /api/todos`: Create a new task. Handles automatic schema population (`id`, `createdAt`, `updatedAt`, `status`, default tags).
- `PUT /api/todos/:id`: Modify a task's parameters or toggle/update subtask states.
- `DELETE /api/todos/:id`: Permanently remove a task.

---

## Backend API Specification

| Endpoint | Method | Description | URL Parameters / Body |
|---|---|---|---|
| `/api/todos` | `GET` | Get all tasks | Supports `q`, `category`, `priority`, `status`, `sortBy`, `order` |
| `/api/todos/:id` | `GET` | Get single task | `:id` (UUID string) |
| `/api/todos` | `POST` | Create task | JSON body: `{ title, description, category, priority, dueDate, subtasks, notes }` |
| `/api/todos/:id` | `PUT` | Update task | JSON body containing fields to update |
| `/api/todos/:id` | `DELETE` | Delete task | `:id` (UUID string) |

---

## Installation & Getting Started

### Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18+) installed.

### Setup and Running (All-in-One script)
For your convenience, we have provided an automated startup script `run.sh` in the project root:

1. Give execution permission to the script:
   ```bash
   chmod +x run.sh
   ```
2. Run the startup script:
   ```bash
   ./run.sh
   ```
This script will automatically install all node modules for the root, backend, and frontend, run the Vite asset compilation, and boot up the Express server on port `3000`.

Open your browser and navigate to: **`http://localhost:3000`**

### Manual Commands
If you prefer running commands manually:

1. **Install root, backend, and frontend dependencies**:
   ```bash
   npm run install-all
   ```
2. **Build frontend assets**:
   ```bash
   npm run build
   ```
3. **Start production server**:
   ```bash
   npm run start
   ```
4. **Start concurrent development servers**:
   ```bash
   npm run dev
   ```
   *(Runs backend server on port `3000` and Vite dev server on port `5173` with api requests proxied).*
