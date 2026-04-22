import React, { useState, useEffect, useRef } from 'react';

const LogoHeader = ({ subtitle }) => {
  const [displayText, setDisplayText] = useState('Đồi Gió Hú');
  const [fade, setFade] = useState(true);
  const [clickCount, setClickCount] = useState(0);
  const resetTimerRef = useRef(null);

  const phrases = [
    'Đồi Gió Hú',
    'Tận hưởng khoảnh khắc yên tĩnh'
  ];

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        i = (i + 1) % phrases.length;
        setDisplayText(phrases[i]);
        setFade(true);
      }, 600);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    if (newCount >= 6) {
      window.location.href = 'https://doigiohu-staff.onrender.com/login';
      setClickCount(0);
      return;
    }
    resetTimerRef.current = setTimeout(() => {
      setClickCount(0);
    }, 2000);
  };

  return (
    <div className="header-container animate-up">
      <style>{`
        .header-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 50px 20px 40px;
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(50px) saturate(210%);
          -webkit-backdrop-filter: blur(50px) saturate(210%);
          border-bottom-left-radius: 50px;
          border-bottom-right-radius: 50px;
          box-shadow: 0 15px 50px rgba(0, 0, 0, 0.05);
          border-bottom: 1px solid rgba(255, 255, 255, 0.5);
          position: relative;
          overflow: hidden;
          text-align: center;
        }

        /* Decorative background elements */
        .header-decor {
          position: absolute;
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(52, 199, 89, 0.15) 0%, transparent 70%);
          z-index: 1;
          filter: blur(40px);
          animation: pulseDecor 8s infinite alternate;
        }

        @keyframes pulseDecor {
          0% { transform: scale(1) translate(-20%, -20%); opacity: 0.5; }
          100% { transform: scale(1.3) translate(20%, 20%); opacity: 0.8; }
        }

        .logo-box {
          position: relative;
          width: 92px;
          height: 92px;
          border-radius: 28px;
          overflow: hidden;
          background: white;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0,0,0,0.05);
          cursor: pointer;
          margin-bottom: 25px;
          transition: all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
          z-index: 10;
          user-select: none;
        }

        .logo-box::after {
          content: '';
          position: absolute;
          inset: 0;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.8);
          border-radius: 28px;
        }

        .logo-box:active { transform: scale(0.9); filter: brightness(0.9); }
        .logo-box img { width: 100%; height: 100%; object-fit: cover; }

        .text-box {
          width: 100%;
          min-height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 10;
        }

        .premium-title {
          margin: 0;
          font-weight: 900;
          letter-spacing: -0.04em;
          background: linear-gradient(135deg, #ffffff 0%, #00d2ff 50%, #0071e3 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shineText 5s linear infinite;
          transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: ${fade ? 1 : 0};
          transform: translateY(${fade ? '0' : '15px'}) scale(${fade ? 1 : 0.95});
          filter: blur(${fade ? '0px' : '10px'}) drop-shadow(0 4px 15px rgba(0,0,0,0.4));
          line-height: 1.2;
          width: 100%;
        }

        @keyframes shineText {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }

        .subtitle-text {
          margin-top: 12px;
          font-size: 0.95rem;
          color: #424245;
          font-weight: 700;
          letter-spacing: -0.01em;
          position: relative;
          z-index: 10;
          background: rgba(0,0,0,0.03);
          padding: 6px 16px;
          border-radius: 20px;
          display: inline-block;
          backdrop-filter: blur(10px);
        }

        .header-bg-glow {
          position: absolute;
          top: 0; left: 0; right: 0; height: 100%;
          background: radial-gradient(circle at 50% 50%, rgba(255,255,255,0.8) 0%, transparent 80%);
          z-index: 2;
          pointer-events: none;
        }
      `}</style>

      <div className="header-decor"></div>
      <div className="header-decor" style={{ top: '20%', right: '-10%', animationDelay: '-4s', background: 'radial-gradient(circle, rgba(0, 113, 227, 0.1) 0%, transparent 70%)' }}></div>
      <div className="header-bg-glow"></div>

      <div className="logo-box" onClick={handleLogoClick}>
        <img src="/logo_new.png" alt="Logo" />
      </div>

      <div className="text-box">
        <h1 className="premium-title" style={{ fontSize: displayText.length > 20 ? '1.2rem' : '2.2rem' }}>
          {displayText}
        </h1>
      </div>

      <div className="subtitle-text">
        {subtitle} <span style={{ marginLeft: '4px' }}>🌿</span>
      </div>
    </div>
  );
};


export default LogoHeader;
