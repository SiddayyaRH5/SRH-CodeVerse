
import { Link } from "react-router-dom";

const Icon = ({ name, size = 18 }) => {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const icons = {
    location: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    phone: (
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.14 1.03.4 2.03.78 2.98a2 2 0 0 1-.45 2.11L8.17 10.1a16 16 0 0 0 5.73 5.73l1.29-1.29a2 2 0 0 1 2.11-.45c.95.38 1.95.64 2.98.78A2 2 0 0 1 22 16.92Z" />
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    linkedin: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M8 10v7M8 7h.01M12 17v-4a3 3 0 0 1 6 0v4M12 10v7" />
      </>
    ),
    github: (
      <>
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.75c0 5.42 3.3 6.62 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
      </>
    ),
    whatsapp: (
      <>
        <path d="M20.5 11.5a8.5 8.5 0 0 1-12.1 7.7L3 21l1.8-5.2A8.5 8.5 0 1 1 20.5 11.5Z" />
        <path d="M8 7.5c.3-.6.6-.6 1-.6h.6c.2 0 .4.2.5.5l.8 1.8c.1.3.1.5-.1.7l-.6.8c-.2.2-.2.4 0 .6a8 8 0 0 0 2.8 2.8c.3.2.4.2.6 0l.8-1c.2-.2.4-.2.7-.1l1.8.8c.3.1.5.3.5.5v.6c0 .4-.1.7-.6 1a3 3 0 0 1-2 .5 9 9 0 0 1-4.1-1.9 10 10 0 0 1-3.2-3.7 4 4 0 0 1 .5-3.3Z" />
      </>
    ),
    telegram: (
      <>
        <path d="m22 3-7.5 18-4.2-5.1L22 3Z" />
        <path d="m22 3-17 7.5 9.3 3.4" />
        <path d="m4.5 10.5 1.2 6 4.3-4.6" />
      </>
    ),
  };

  return <svg {...common}>{icons[name]}</svg>;
};

function Footer() {
  const year = new Date().getFullYear();

  const exploreLinks = [
    ["Courses", "/courses"],
    ["Practice", "/problems"],
    ["Learning Path", "/learning-path"],
    ["Leaderboard", "/leaderboard"],
  ];

  const platformLinks = [
    ["Live Arena", "/live-coding"],
    ["Interview Arena", "/interview-arena"],
    ["Analytics", "/analytics"],
    ["Certificates", "/certificates"],
  ];

  const socialLinks = [
    {
      label: "LinkedIn",
      url: "https://www.linkedin.com/in/siddayyahiremath/",
      icon: "linkedin",
    },
    {
      label: "GitHub",
      url: "https://github.com/SiddayyaRH5",
      icon: "github",
    },
    {
      label: "WhatsApp",
      url: "https://wa.me/918088285205",
      icon: "whatsapp",
    },
    {
      label: "Telegram",
      url: "https://t.me/siddusrh",
      icon: "telegram",
    },
  ];

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

          <div className="cv-footer-socials">
            {socialLinks.map(({ label, url, icon }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="cv-footer-social-link"
              >
                <Icon name={icon} size={18} />
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
        <div className="cv-footer-column cv-footer-platform">
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
            <Icon name="location" size={16} />
            <span>Bangalore, India</span>
          </a>

          <a href="tel:+918088285205">
            <Icon name="phone" size={16} />
            <span>+91 8088285205</span>
          </a>

          <a href="mailto:siddusrh@gmail.com">
            <Icon name="mail" size={16} />
            <span>siddusrh@gmail.com</span>
          </a>
        </div>
      </div>

      <div className="cv-footer-bottom">
        <p>© {year} SRH CodeVerse. All rights reserved.</p>

        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}

export default Footer;
