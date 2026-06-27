import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Book from './pages/Book'
import Admin from './pages/Admin'
import Profile from './pages/Profile'
import Home from './pages/Home'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Stephane owns this route — map and navigation */}
        <Route path="/" element={<Home />} />

        {/* Dorcase owns these routes */}
        <Route path="/book" element={<Book />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App