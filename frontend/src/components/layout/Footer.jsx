import { Link } from "react-router-dom"
import { LinkedIn, GitHub, WhatsApp, Telegram } from "lucide-react"

function Footer() {
  const year = new Date().getFullYear()

  const contactLinks = [
    ["Phone", "+91 80 1234 5678"],
    ["Email", "contact@srhcodeverse.edu"],
    ["Location", "Bangalore, India"],
  ]

  const socialLinks = [
    ["LinkedIn", "/"],
    ["GitHub", "/"],
    ["WhatsApp", "/"],
    ["Telegram", "/"],
  ]

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

        <div className="cv-footer-column cv-footer-platform">
          <h3>Platform</h3>
          {platformLinks.map(([label, path]) => (
            <Link key={path} to={path}>{label}</Link>
          ))}
        </div>

        <div className="cv-footer-column">
          <h3>Contact</h3>
          {contactLinks.map(([label, value]) => (
            <div key={label} className="cv-footer-contact-item">
              <span className="cv-footer-icon">
                {label === "Phone"
                  ? <img
                      src="/icons/phone.svg"
                      alt="Phone"
                      width={16}
                      height={16}
                    />
                  : label === "Email"
                  ? <img
                      src="/icons/email.svg"
                      alt="Email"
                      width={16}
                      height={16}
                    />
                  : label === "Location"
                  ? <img
                      src="/icons/location.svg"
                      alt="Location"
                      width={16}
                      height={16}
                    />
                  : null}
              </span>
              <span className="cv-footer-text">{value}</span>
            </div>
          ))}
          {socialLinks.map(([label, path]) => (
            <a
              key={path}
              href={path}
              target="_blank"
              rel="noopener noreferrer"
              className="cv-footer-social-link"
            >
              <LinkedIn
                title="LinkedIn"
                className="cv-footer-social-icon"
                width={16}
                height={16}
              />
              <GitHub
                title="GitHub"
                className="cv-footer-social-icon"
                width={16}
                height={16}
              />
              <WhatsApp
                title="WhatsApp"
                className="cv-footer-social-icon"
                width={16}
                height={16}
              />
              <Telegram
                title="Telegram"
                className="cv-footer-social-icon"
                width={16}
                height={16}
              />
            </a>
          ))}
        </div>
      </div>

      <div className="cv-footer-bottom">
        <p>© {year} SRH CodeVerse. All rights reserved.</p>
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault()
            window.scrollTo({ top: 0, behavior: "smooth" })
          }}
        >
          Back to top ↑
        </a>
      </div>
    </footer>
  )
}

export default Footer