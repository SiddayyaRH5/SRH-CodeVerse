import { Link } from "react-router-dom"

function Footer() {
  const year = new Date().getFullYear()

  const exploreLinks = [
    ["Courses", "/courses"],
    ["Practice", "/problems"],
    ["Learning Path", "/learning-path"],
    ["Leaderboard", "/leaderboard"],
  ]

  const contactLinks = [
    ["Bangalore, India", "https://maps.google.com/?q=Bangalore+India"],
    ["+91 8088285205", "tel:+918088285205"],
    ["siddusrh@gmail.com", "mailto:siddusrh@gmail.com"],
  ]

  const socialLinks = [
    ["LinkedIn", "https://www.linkedin.com/in/siddayyahiremath/"],
    ["GitHub", "https://github.com/SiddayyaRH5"],
    ["WhatsApp", "https://wa.me/918088285205"],
    ["Telegram", "https://t.me/siddusrh"],
  ]

  return (
    <footer className="cv-footer cv-footer-compact" id="footer">
      <div className="cv-footer-inner">
        {/* Brand */}
        <div className="cv-footer-main">
          <Link to="/" className="cv-footer-brand" aria-label="SRH CodeVerse home">
            <img
              src="/srh-codeverse-logo.png"
              alt="SRH CodeVerse"
              className="cv-footer-logo"
            />
          </Link>

          <p className="cv-footer-description">
            Your space to learn, practice, and grow as a developer.
          </p>

          <p className="cv-footer-tagline">
            EDUCATE. <span>SOLVE.</span> SUBMIT.
          </p>

          {/* Text-only social links */}
          <div className="cv-footer-socials">
            {socialLinks.map(([label, url]) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Explore */}
        <div className="cv-footer-column">
          <h3>Explore</h3>
          {exploreLinks.map(([label, path]) => (
            <Link key={path} to={path}>
              {label}
            </Link>
          ))}
        </div>

        {/* Contact */}
        <div className="cv-footer-column cv-footer-contact">
          <h3>Contact</h3>
          {contactLinks.map(([label, url]) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* Slim bottom bar */}
      <div className="cv-footer-bottom">
        <p>© {year} SRH CodeVerse. All rights reserved.</p>
        <a
          href="#top"
          onClick={(event) => {
            event.preventDefault()
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
