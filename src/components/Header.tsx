import './Header.css'

interface HeaderProps {
  onDemoClick?: () => void
  onSurveyClick?: () => void
}

const Header = ({ onDemoClick, onSurveyClick }: HeaderProps) => {
  return (
    <header className="header">
      <div className="logo">
        {/* Laptop with symmetric bone on screen */}
        <svg className="logo-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Laptop base/keyboard */}
          <path
            d="M4 36L6 34H42L44 36V38H4V36Z"
            fill="currentColor"
            opacity="0.8"
          />

          {/* Laptop screen frame */}
          <rect
            x="8"
            y="8"
            width="32"
            height="24"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            opacity="0.9"
          />

          {/* Screen background */}
          <rect
            x="10"
            y="10"
            width="28"
            height="20"
            fill="currentColor"
            opacity="0.1"
          />

          {/* Symmetric bone on screen - tilted */}
          <g transform="rotate(-20 24 20)">
            {/* Top end - symmetric */}
            <ellipse
              cx="24"
              cy="12"
              rx="2.5"
              ry="1.8"
              fill="currentColor"
              opacity="0.9"
            />
            <circle
              cx="22"
              cy="12"
              r="1.5"
              fill="currentColor"
              opacity="0.9"
            />
            <circle
              cx="26"
              cy="12"
              r="1.5"
              fill="currentColor"
              opacity="0.9"
            />

            {/* Shaft */}
            <rect
              x="22.5"
              y="12"
              width="3"
              height="14"
              fill="currentColor"
              opacity="0.9"
              rx="0.5"
            />

            {/* Bottom end - symmetric (identical to top) */}
            <ellipse
              cx="24"
              cy="26"
              rx="2.5"
              ry="1.8"
              fill="currentColor"
              opacity="0.9"
            />
            <circle
              cx="22"
              cy="26"
              r="1.5"
              fill="currentColor"
              opacity="0.9"
            />
            <circle
              cx="26"
              cy="26"
              r="1.5"
              fill="currentColor"
              opacity="0.9"
            />
          </g>
        </svg>
        <div className="logo-content">
          <span className="logo-text">HenVenn</span>
          <span className="logo-subtitle">- Klinisk beslutningsstøtte for henvisningsarbeid</span>
        </div>
      </div>
      <div className="header-buttons">
        <button className="header-demo-button" onClick={onDemoClick}>
          🎯 DEMO
        </button>
        <button className="header-survey-button" onClick={onSurveyClick}>
          📊 Spørreskjema
        </button>
      </div>
    </header>
  )
}

export default Header
