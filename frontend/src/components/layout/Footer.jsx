import { Link } from "react-router-dom"
import {
  MapPin,
  Phone,
  Mail,
  Linkedin,
  Github,
  MessageCircle,
  Send,
} from "lucide-react"

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

  const socialLinks = [
    {
      label: "LinkedIn",
      url: "https://www.linkedin.com/in/siddayyahiremath/",
      icon: Linkedin,
    },
    {
      label: "GitHub",
      url: "https://github.com/SiddayyaRH5",
      icon: Github,
    },
    {
      label: "WhatsApp",
      url: "https://wa.me/918088285205",
      icon: MessageCircle,
    },
    {
      label: "Telegram",
      url: "https://t.me/siddusrh",
      icon: Send,
    },
  ]

  return (
    <footer className="cv-footer" id="footer">
      <div className="cv-footer-inner">

        {/* Brand */}
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

          {/* Social Icons */}
          <div className="cv-footer-socials">
            {socialLinks.map(({ label, url, icon: Icon }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
              >
                <Icon size={17} strokeWidth={2} />
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

        {/* Platform */}
        <div className="cv-footer-column">
          <h3>Platform</h3>
          {platformLinks.map(([label, path]) => (
            <Link key={path} to={path}>
              {label}
            </Link>
          ))}
        </div>

        {/* Contact */}
        <div className="cv-footer-column cv-footer-contact">
          <h3>Contact</h3>

          <a
            href="https://maps.google.com/?q=Bangalore+India"
            target="_blank"
            rel="noopener noreferrer"
          >
            <MapPin size={16} />
            <span>Bangalore, India</span>
          </a>

          <a href="tel:+918088285205">
            <Phone size={16} />
            <span>+91 8088285205</span>
          </a>

          <a href="mailto:siddusrh@gmail.com">
            <Mail size={16} />
            <span>siddusrh@gmail.com</span>
          </a>
        </div>

      </div>

      {/* Bottom */}
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