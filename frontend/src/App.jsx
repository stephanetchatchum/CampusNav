import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Book from './pages/Book'
import BookRoom from './pages/BookRoom'
import Admin from './pages/Admin'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import MyBookings from './pages/MyBookings'
import Nav from './components/Nav'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
<<<<<<< HEAD
        {/* Stephane owns this route - map and navigation */}
        <Route path="/" element={<Home />} />
        {/* Dorcase owns these routes */}
        <Route path="/book" element={<ProtectedRoute tier="student"><Book /></ProtectedRoute>} />
        <Route path="/book/:code" element={<ProtectedRoute tier="student"><BookRoom /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute tier="admin"><Admin /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/my-bookings" element={<ProtectedRoute tier="student"><MyBookings /></ProtectedRoute>} />
=======

        <Route path="/" element={<Home />}/>

        <Route path="/book" element={<Book />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/profile" element={<Profile />} />
>>>>>>> origin/main
      </Routes>
    </BrowserRouter>
  )
}

export default App