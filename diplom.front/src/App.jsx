import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import ruRU from "antd/locale/ru_RU";
import { useSelector } from "react-redux";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Upload from "./pages/Upload";
import History from "./pages/History";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  return (
    <ConfigProvider locale={ruRU}>
      <BrowserRouter>
        <Routes>
          {/* Публичные роуты */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/upload" /> : <Login />}
          />
          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to="/upload" /> : <Register />}
          />

          {/* Защищённые роуты */}
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <Layout>
                  <Upload />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <Layout>
                  <History />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Редирект по умолчанию */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
