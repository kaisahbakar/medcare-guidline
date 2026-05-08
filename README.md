# MedCare Guideline System

A modern web app for managing and reading medical guidelines.  
It provides a streamlined experience for both healthcare staff reading manuals and administrators maintaining content.

## Features

### Public Portal
- **Guideline Reader:** Read manuals with a structured sidebar for fast navigation.
- **Categorization:** Browse guidelines by Guide Type and Category.
- **Search & Filter:** Quickly find relevant guidelines.
- **Dark Mode:** Support for both light and dark themes for comfortable reading in any environment.

### Administrative Portal
- **Admin Dashboard:** Centralized view of all manuals, categories, and guide types.
- **Manual Editor:** A powerful rich-text editor (powered by Tiptap) for creating and editing detailed medical manuals.
- **Organization Management:** Create and manage Guide Types and Categories to keep information structured.
- **Status Tracking:** Manage the lifecycle of manuals (Draft, Published, etc.).

## 🛠 Tech Stack

- **Frontend:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Backend/Database:** [Supabase](https://supabase.com/) (PostgreSQL + Authentication)
- **Data Fetching:** [TanStack Query (React Query)](https://tanstack.com/query/latest)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Rich Text Editor:** [Tiptap](https://tiptap.dev/)
- **Icons:** [React Icons](https://react-icons.github.io/react-icons/)
- **Routing:** [React Router 7](https://reactrouter.com/)
- **Drag & Drop:** [dnd-kit](https://dndkit.com/)

## 🏁 Getting Started

### Prerequisites
- Node.js (latest LTS recommended)
- npm
- A Supabase project

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd medcare-guidline-system
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Copy the example file, then provide real Supabase values:
    ```bash
    cp .env.example .env
    ```
    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    VITE_SUPABASE_MANUAL_MEDIA_BUCKET=manual-media
    ```
    Both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are required.  
    The app will fail fast on startup if either value is missing.

4.  **Database Setup:**
    Use `supabase/seed.sql` to initialize schema and seed baseline data.

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

### Build
```bash
npm run build
```

## Deployment Notes

- This is a single-page app (SPA), so route rewrites are required in production.
- For Vercel, `vercel.json` is included and rewrites all routes to `index.html`.

## 📂 Project Structure

- `src/components`: Reusable UI components, layouts, and feature-specific blocks.
  - `ui`: Base UI components (Button, Input, Card, etc.).
  - `admin`: Layouts and components for the admin portal.
  - `public`: Layouts and components for the public portal.
  - `editor`: Specialized components for the manual editor.
  - `reader`: Specialized components for the manual reader.
- `src/lib`: Supabase client and TanStack Query hooks.
- `src/pages`: Main page components for both public and admin routes.
- `src/routes`: Application routing configuration.
- `supabase`: Database scripts and configuration.

## 📄 License

This project is private and intended for internal use.
