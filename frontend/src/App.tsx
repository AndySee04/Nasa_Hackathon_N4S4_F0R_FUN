import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import AstroDrawer from './components/AstroDrawer'
import ErrorBoundary from './components/ErrorBoundary'
import Footer from './components/Footer'
import LoadingScreen from './components/LoadingScreen'
import Navbar from './components/Navbar'
import { AstroProvider } from './context/AstroProvider'
import About from './pages/About'
import ArtifactDetail from './pages/ArtifactDetail'
import AstroAI from './pages/AstroAI'
import DeepSpaceArchive from './pages/DeepSpaceArchive'
import Home from './pages/Home'
import MarsArchive from './pages/MarsArchive'
import MissionTimeline from './pages/MissionTimeline'
import MoonArchive from './pages/MoonArchive'
import MoonCampaign from './pages/MoonCampaign'
import NotFound from './pages/NotFound'
import ScienceLab from './pages/ScienceLab'

// The explorer page has the most drawing work; it loads only when visited.
const UniverseExplorer = lazy(() => import('./pages/UniverseExplorer'))

/** Resets the error screen when the visitor navigates to another page. */
function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return <ErrorBoundary key={pathname}>{children}</ErrorBoundary>
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

/** The SVG filter that makes .cbtn buttons look coloured in with crayon. */
function CrayonFilter() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <filter id="crayon" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="4" result="warp" />
        <feDisplacementMap in="SourceGraphic" in2="warp" scale="3" xChannelSelector="R" yChannelSelector="G" result="wobbly" />
        <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="1" seed="9" result="grain" />
        <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.2 0 0 0 1.9" result="mask" />
        <feComposite in="wobbly" in2="mask" operator="in" />
      </filter>
    </svg>
  )
}

function Shell() {
  const { pathname } = useLocation()
  const home = pathname === '/'
  return (
    <>
      <ScrollToTop />
      <CrayonFilter />
      {/* The home page draws its own sky on a canvas. */}
      {!home && <div className="crayon-stars" aria-hidden="true" />}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-70 focus:rounded-full focus:bg-yellow focus:px-4 focus:py-2 focus:font-display focus:text-ink"
      >
        Skip to content
      </a>
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />
        <main id="main" className={`flex-1 ${home ? '' : 'pt-24 sm:pt-28'}`}>
          <RoutedErrorBoundary>
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<UniverseExplorer />} />
                <Route path="/moon" element={<MoonArchive />} />
                <Route path="/moon/campaign" element={<MoonCampaign />} />
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
          </RoutedErrorBoundary>
        </main>
        <Footer />
      </div>
      <AstroDrawer />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AstroProvider>
        <Shell />
      </AstroProvider>
    </BrowserRouter>
  )
}
