import { Route, Routes } from 'react-router-dom'

// Public pages
import CategoryPage from '../pages/public/CategoryPage'
import GuideTypePage from '../pages/public/GuideTypePage'
import LandingPage from '../pages/public/LandingPage'
import ManualReaderPage from '../pages/public/ManualReaderPage'
import PublicLayout from '../components/public/PublicLayout'

// Admin layout + pages
import AdminLayout from '../components/admin/AdminLayout'
import AdminDashboard from '../pages/admin/AdminDashboard'
import GuideTypesPage from '../pages/admin/GuideTypesPage'
import CategoriesPage from '../pages/admin/CategoriesPage'
import ManualListPage from '../pages/admin/ManualListPage'
import ManualEditorPage from '../pages/admin/ManualEditorPage'

function AppRoutes() {
  return (
    <Routes>
      {/* Public — nested under PublicLayout */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="guide-type/:id" element={<GuideTypePage />} />
        <Route path="category/:id" element={<CategoryPage />} />
        <Route path="manual/:id" element={<ManualReaderPage />} />
      </Route>

      {/* Admin — nested under AdminLayout */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="guide-types" element={<GuideTypesPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="manuals" element={<ManualListPage />} />
        <Route path="manuals/:id/edit" element={<ManualEditorPage />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
