import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Book from './pages/Book'
import Admin from './pages/Admin'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import MyBookings from './pages/MyBookings'

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
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/my-bookings" element={<MyBookings />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App