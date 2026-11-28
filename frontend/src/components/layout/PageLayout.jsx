import Navbar from "./Navbar"
import Footer from "./Footer"
import AIMentorDrawer from "../common/AIMentorDrawer"
import { MentorProvider } from "../../context/MentorContext"

function PageLayout({ children }) {
  return (
    <MentorProvider>
      <div className="cv-app-shell text-[var(--cv-text)]">
        <Navbar />
        <main className="cv-main">{children}</main>
        <Footer />
        <AIMentorDrawer />
      </div>
    </MentorProvider>
  )
}

export default PageLayout
