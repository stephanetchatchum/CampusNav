import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Book from './pages/Book'
import Admin from './pages/Admin'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import MyBookings from './pages/MyBookings'
import Nav from './components/Nav'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        {/* Stephane owns this route — map and navigation */}
        <Route path="/" element={<Home />} />

        {/* Dorcase owns these routes */}
        <Route path="/book" element={<ProtectedRoute><Book /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App