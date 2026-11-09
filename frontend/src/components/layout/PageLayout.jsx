import Navbar from "./Navbar"
import Footer from "./Footer"

function PageLayout({ children }) {
  return (
    <div className="cv-app-shell text-[var(--cv-text)]">
      <Navbar />
      <main className="cv-main">{children}</main>
      <Footer />
    </div>
  )
}

export default PageLayout