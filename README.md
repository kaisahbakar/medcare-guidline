# MedCare Guideline System

A modern, platform for managing and reading medical guidelines. This system provides a streamlined experience for both medical professionals reading guidelines and administrators managing them.

##  Features

### Public Portal
- **Guideline Reader:** Intuitive interface for reading medical manuals with a structured sidebar for easy navigation.
- **Categorization:** Browse guidelines by Guide Type (e.g., Clinical, Administrative) and Category.
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
- **Icons:** [Lucide React](https://lucide.dev/)
- **Routing:** [React Router 7](https://reactrouter.com/)
- **Drag & Drop:** [dnd-kit](https://dndkit.com/)

## 🏁 Getting Started

### Prerequisites
- Node.js (Latest LTS recommended)
- npm or yarn
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
    Create a `.env` file in the root directory and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Database Setup:**
    Use the provided `supabase/seed.sql` to initialize your database schema and seed it with initial data.

5.  **Run the development server:**
    ```bash
    npm run dev
    ```

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
