import { BrowserRouter, useLocation } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { ToastProvider } from "./context/ToastContext"
import { ThemeProvider } from "./context/ThemeContext"
import AppRoutes from "./routes/AppRoutes"
// WorkspaceProvider removed.
import ErrorBoundary from "./components/common/ErrorBoundary.jsx"
import "./App.css"


/**
 * Inner boundary: a failure while rendering one route is recovered from as soon
 * as the user navigates elsewhere, without a full page reload.
 */
function RoutesBoundary() {
  const location = useLocation()

  return (
    <ErrorBoundary resetKeys={[location.pathname]} title="This page could not be displayed">
      <AppRoutes />
    </ErrorBoundary>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <RoutesBoundary />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
