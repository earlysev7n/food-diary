import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AuthPage } from './features/auth/AuthPage'
import { useAuth } from './features/auth/useAuth'
import { AddPage } from './pages/AddPage'
import { DiaryPage } from './pages/DiaryPage'
import { MapPage } from './pages/MapPage'
import { ProfilePage } from './pages/ProfilePage'
import { StatsPage } from './pages/StatsPage'
import { WishlistPage } from './pages/WishlistPage'

function App() {
  const { loading, session } = useAuth()

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffaf5] text-sm text-[#806f64]">
        Loading your food diary…
      </main>
    )
  }

  if (!session) {
    return <AuthPage />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<MapPage />} />
          <Route path="diary" element={<DiaryPage />} />
          <Route path="add" element={<AddPage />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="stats" element={<StatsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
