import Navbar from "./Navbar"
import Footer from "./Footer"
import { useLocation } from "react-router-dom"

function PageLayout({ children }) {
  const { pathname } = useLocation()
  if (pathname.startsWith("/workspace")) {
    return <div className="cv-app-shell text-[var(--cv-text)]">{children}</div>
  }

  return (
    <div className="cv-app-shell text-[var(--cv-text)]">
      <Navbar />
      <main className="cv-main">{children}</main>
      <Footer />
    </div>
  )
}

export default PageLayout