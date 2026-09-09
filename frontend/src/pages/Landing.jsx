
import { Link } from "react-router-dom";

function Landing() {
  return (
    <div className="landing-page">
      <header className="landing-nav">
        <Link to="/" className="brand">
          <span className="brand-mark">B</span>
          <span>Bridgely</span>
        </Link>

        <nav className="nav-links">
          <a href="#features">Features</a>
          <a href="#privacy">Privacy</a>
          <Link to="/login" className="nav-login">
            Log in
          </Link>
          <Link to="/register" className="nav-register">
            Get started
          </Link>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              A new way to connect
            </div>

            <h1>
              Connect freely.
              <br />
              <span>Stay private.</span>
            </h1>

            <p className="hero-description">
              Bridgely is a modern social communication platform where you
              connect with people using usernames — without sharing your
              personal phone number.
            </p>

            <div className="hero-actions">
              <Link to="/register" className="primary-button">
                Create your account
                <span>→</span>
              </Link>

              <Link to="/login" className="secondary-button">
                I already have an account
              </Link>
            </div>

            <div className="hero-trust">
              <div className="trust-item">
                <span>✓</span>
                Username-based connections
              </div>

              <div className="trust-item">
                <span>✓</span>
                Your number stays private
              </div>

              <div className="trust-item">
                <span>✓</span>
                Built for real conversations
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="glow glow-one"></div>
            <div className="glow glow-two"></div>

            <div className="phone-card">
              <div className="phone-top">
                <div className="phone-user">
                  <div className="avatar avatar-purple">M</div>

                  <div>
                    <strong>Maya</strong>
                    <span>@maya</span>
                  </div>
                </div>

                <div className="online-dot"></div>
              </div>

              <div className="messages">
                <div className="message received">
                  Hey! 👋 Are you on Bridgely?
                </div>

                <div className="message sent">
                  Yep! Much easier than sharing numbers.
                </div>

                <div className="message received">
                  Exactly! Just search my username 😊
                </div>
              </div>

              <div className="message-input">
                <span>Write a message...</span>
                <div className="send-icon">↑</div>
              </div>
            </div>

            <div className="floating-card privacy-card">
              <div className="floating-icon">🔒</div>
              <div>
                <strong>Number protected</strong>
                <span>Private by design</span>
              </div>
            </div>

            <div className="floating-card connection-card">
              <div className="floating-icon">✦</div>
              <div>
                <strong>@jley</strong>
                <span>New connection</span>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="features-section">
          <div className="section-heading">
            <span className="section-label">WHY BRIDGELY</span>

            <h2>
              Social connection,
              <br />
              <span>without the compromise.</span>
            </h2>

            <p>
              Everything you need to communicate naturally while keeping
              control over your personal information.
            </p>
          </div>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">◎</div>
              <h3>Username first</h3>
              <p>
                Find and connect with people using unique usernames instead
                of exposing phone numbers.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⌁</div>
              <h3>Private conversations</h3>
              <p>
                Start direct conversations with people while keeping your
                personal contact details private.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">♢</div>
              <h3>Rooms</h3>
              <p>
                Join communities around shared interests with public and
                private rooms.
              </p>
            </div>
          </div>
        </section>

        <section id="privacy" className="privacy-section">
          <div className="privacy-content">
            <span className="section-label">PRIVACY BY DESIGN</span>

            <h2>
              Your phone number
              <br />
              <span>is yours.</span>
            </h2>

            <p>
              Bridgely lets people connect through usernames. You can
              communicate without handing out the number attached to your
              personal life.
            </p>

            <Link to="/register" className="primary-button">
              Join Bridgely
              <span>→</span>
            </Link>
          </div>

          <div className="privacy-visual">
            <div className="privacy-circle">
              <div className="lock-symbol">⌑</div>
            </div>

            <div className="privacy-ring ring-one"></div>
            <div className="privacy-ring ring-two"></div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="brand footer-brand">
          <span className="brand-mark">B</span>
          <span>Bridgely</span>
        </div>

        <p>Connect without sharing your number.</p>

        <span>© 2026 Bridgely</span>
      </footer>
    </div>
  );
}

export default Landing;

