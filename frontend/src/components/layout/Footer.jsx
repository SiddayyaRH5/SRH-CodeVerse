
import { Link } from "react-router-dom"

function Footer() {
  const year = new Date().getFullYear()

  const exploreLinks = [
    ["Courses", "/courses"],
    ["Practice", "/problems"],
    ["Learning Path", "/learning-path"],
    ["Leaderboard", "/leaderboard"],
  ]

  const platformLinks = [
    ["Live Arena", "/live-coding"],
    ["Interview Arena", "/interview-arena"],
    ["Analytics", "/analytics"],
    ["Certificates", "/certificates"],
  ]

  return (
    <footer className="cv-footer">
      <div className="cv-footer-inner">
        <div className="cv-footer-main">
          <Link to="/" className="cv-footer-brand">
            <img
              src="/srh-codeverse-logo.png"
              alt="SRH CodeVerse"
              className="cv-footer-logo"
            />
          </Link>

          <p className="cv-footer-description">
            Your space to learn, practice, and grow as a developer.
            Build skills, solve challenges, and turn knowledge into code.
          </p>

          <p className="cv-footer-tagline">
            EDUCATE. <span>SOLVE.</span> SUBMIT.
          </p>
        </div>

        <div className="cv-footer-column">
          <h3>Explore</h3>
          {exploreLinks.map(([label, path]) => (
            <Link key={path} to={path}>{label}</Link>
          ))}
        </div>

        <div className="cv-footer-column">
          <h3>Platform</h3>
          {platformLinks.map(([label, path]) => (
            <Link key={path} to={path}>{label}</Link>
          ))}
        </div>

        <div className="cv-footer-column">
          <h3>Quick Links</h3>
          <Link to="/">Home</Link>
          <Link to="/profile">My Profile</Link>
          <Link to="/settings">Settings</Link>
          <Link to="/roadmap">Roadmap</Link>
        </div>
      </div>

      <div className="cv-footer-bottom">
        <p>© {year} SRH CodeVerse. All rights reserved.</p>
        <a href="#top" onClick={(e) => {
          e.preventDefault()
          window.scrollTo({ top: 0, behavior: "smooth" })
        }}>
          Back to top ↑
        </a>
      </div>
    </footer>
  )
}

export default Footer
