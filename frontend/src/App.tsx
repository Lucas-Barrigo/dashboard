import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProjectsPage from './pages/ProjectsPage'
import QualificationPage from './pages/QualificationPage'
import ChecklistPage from './pages/ChecklistPage'
import SummaryPage from './pages/SummaryPage'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<ProjectsPage />} />
          <Route path="/projects/:projectId/qualification" element={<QualificationPage />} />
          <Route path="/projects/:projectId/checklist" element={<ChecklistPage />} />
          <Route path="/projects/:projectId/summary" element={<SummaryPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
