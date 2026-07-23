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
import MyBookings from './pages/MyBookings'
import Nav from './components/Nav'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>

        <Route path="/" element={<Home />}/>

        <Route path="/book" element={<Book />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App