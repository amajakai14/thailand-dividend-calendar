import { Routes, Route, Navigate } from 'react-router-dom';
import type { ReactElement } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import { isLoggedIn } from './services/api';

function PrivateRoute({ element }: { element: ReactElement }) {
  return isLoggedIn() ? element : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<PrivateRoute element={<Home />} />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
