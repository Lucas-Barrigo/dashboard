import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProjectsPage from './pages/ProjectsPage'
import ProjectPage from './pages/ProjectPage'
import T0Page from './pages/templates/T0Page'
import T1Page from './pages/templates/T1Page'
import T2Page from './pages/templates/T2Page'
import T3Page from './pages/templates/T3Page'
import T4Page from './pages/templates/T4Page'
import T5Page from './pages/templates/T5Page'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectPage />} />
          <Route path="/projects/:projectId/t0" element={<T0Page />} />
          <Route path="/projects/:projectId/t1" element={<T1Page />} />
          <Route path="/projects/:projectId/t2" element={<T2Page />} />
          <Route path="/projects/:projectId/t3" element={<T3Page />} />
          <Route path="/projects/:projectId/t4" element={<T4Page />} />
          <Route path="/projects/:projectId/t5" element={<T5Page />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
