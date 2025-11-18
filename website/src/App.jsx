import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import HMS from './pages/HMS'
import RMS from './pages/RMS'
import PMS from './pages/PMS'
import Pricing from './pages/Pricing'
import Contact from './pages/Contact'

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/hms" element={<HMS />} />
          <Route path="/rms" element={<RMS />} />
          <Route path="/pms" element={<PMS />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  )
}

export default App
