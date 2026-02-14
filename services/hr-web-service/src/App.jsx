import { Routes, Route } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import UploadPage from './pages/UploadPage'
import MatchesPage from './pages/MatchesPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/upload" element={<UploadPage />} />
      <Route path="/matches" element={<MatchesPage />} />
    </Routes>
  )
}

export default App


