import { Route, Routes } from 'react-router'
import LandingPage from '@/pages/LandingPage'

function Login() {
  return (
    <div>
      <h1>Login</h1>
    </div>
  )
}

function AuthVerify() {
  return (
    <div>
      <h1>Verifying...</h1>
    </div>
  )
}

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/verify" element={<AuthVerify />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  )
}

export default App
