import Navbar from "./Navbar"

function PageLayout({ children }) {
  return (
    <div className="cv-app-shell text-[var(--cv-text)]">
      <Navbar />
      <main className="cv-main">{children}</main>
    </div>
  )
}

export default PageLayout
