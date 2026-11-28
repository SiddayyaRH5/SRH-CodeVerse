import { Link } from "react-router-dom"
import {
  ArrowUp,
  Award,
  BookOpen,
  BriefcaseBusiness,
  Code2,
  GitBranch,
  Library,
  Mail,
  MapPin,
  MessageCircle,
  Mic2,
  Phone,
  Route,
  Send,
  Trophy,
} from "lucide-react"

/**
 * Global footer. All destinations and contact details are preserved from the
 * previous footer; only the presentation and iconography are refined.
 */
function Footer() {
  const year = new Date().getFullYear()

  const exploreLinks = [
    { label: "Courses", to: "/courses", icon: BookOpen },
    { label: "Practice", to: "/problems", icon: Code2 },
    { label: "Learning Path", to: "/learning-path", icon: Route },
    { label: "Leaderboard", to: "/leaderboard", icon: Trophy },
  ]

  const resourceLinks = [
    { label: "Interview Preparation", to: "/interview-arena", icon: Mic2 },
    { label: "Coding Challenges", to: "/live-coding", icon: Code2 },
    { label: "Certificates", to: "/certificates", icon: Award },
    { label: "Study Hub", to: "/study-hub", icon: Library },
  ]

  const socialLinks = [
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/siddayyahiremath/",
      icon: BriefcaseBusiness,
    },
    { label: "GitHub", href: "https://github.com/SiddayyaRH5", icon: GitBranch },
    { label: "WhatsApp", href: "https://wa.me/918088285205", icon: MessageCircle },
    { label: "Telegram", href: "https://t.me/siddusrh", icon: Send },
  ]

  const contactLinks = [
    {
      label: "Bangalore, India",
      href: "https://maps.google.com/?q=Bangalore+India",
      icon: MapPin,
    },
    { label: "+91 8088285205", href: "tel:+918088285205", icon: Phone },
    { label: "siddusrh@gmail.com", href: "mailto:siddusrh@gmail.com", icon: Mail },
  ]

  return (
    <footer className="cv-footer" id="footer">
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

          <div className="cv-footer-socials">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
              >
                <Icon size={16} strokeWidth={1.9} aria-hidden="true" />
                <span>{label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Explore */}
        <div className="cv-footer-column">
          <h3>Explore</h3>
          {exploreLinks.map(({ label, to, icon: Icon }) => (
            <Link key={to} to={to}>
              <Icon size={14} strokeWidth={1.9} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </div>

        {/* Resources / platform */}
        <div className="cv-footer-column">
          <h3>Resources</h3>
          {resourceLinks.map(({ label, to, icon: Icon }) => (
            <Link key={to} to={to}>
              <Icon size={14} strokeWidth={1.9} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </div>

        {/* Contact */}
        <div className="cv-footer-column cv-footer-contact">
          <h3>Contact</h3>
          {contactLinks.map(({ label, href, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              title={label}
            >
              <Icon size={14} strokeWidth={1.9} aria-hidden="true" />
              <span>{label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="cv-footer-bottom">
        <p>© {year} SRH CodeVerse. All rights reserved.</p>

        <button
          type="button"
          className="cv-footer-back-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <ArrowUp size={14} strokeWidth={2} aria-hidden="true" />
          <span>Back to top</span>
        </button>
      </div>
    </footer>
  )
}

export default Footer
