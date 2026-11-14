import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import AstroLauncher from './components/AstroLauncher'
import Footer from './components/Footer'
import LoadingScreen from './components/LoadingScreen'
import Navbar from './components/Navbar'
import { AstroProvider } from './context/AstroProvider'
import About from './pages/About'
import ArtifactDetail from './pages/ArtifactDetail'
import AstroAI from './pages/AstroAI'
import DeepSpaceArchive from './pages/DeepSpaceArchive'
import MarsArchive from './pages/MarsArchive'
import MissionTimeline from './pages/MissionTimeline'
import MoonArchive from './pages/MoonArchive'
import NotFound from './pages/NotFound'
import ScienceLab from './pages/ScienceLab'

import Home from './pages/Home'

// The explorer page is the heaviest; it loads only when visited.
const UniverseExplorer = lazy(() => import('./pages/UniverseExplorer'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AstroProvider>
        <ScrollToTop />
        <div className="starfield" aria-hidden="true" />
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-cyan focus:px-4 focus:py-2 focus:text-space-950">
          Skip to content
        </a>
        <div className="relative z-10 flex min-h-screen flex-col">
          <Navbar />
          <main id="main" className="flex-1">
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<UniverseExplorer />} />
                <Route path="/moon" element={<MoonArchive />} />
                <Route path="/mars" element={<MarsArchive />} />
                <Route path="/deep-space" element={<DeepSpaceArchive />} />
                <Route path="/artifact/:id" element={<ArtifactDetail />} />
                <Route path="/timeline" element={<MissionTimeline />} />
                <Route path="/science-lab" element={<ScienceLab />} />
                <Route path="/ask-astro" element={<AstroAI />} />
                <Route path="/about" element={<About />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
        <AstroLauncher />
      </AstroProvider>
    </BrowserRouter>
  )
}
