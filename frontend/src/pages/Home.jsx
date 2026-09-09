
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem("bridgelyToken");
    const storedUser = sessionStorage.getItem("bridgelyUser");

    if (!token || !storedUser) {
      navigate("/login");
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch {
      sessionStorage.removeItem("bridgelyToken");
      sessionStorage.removeItem("bridgelyUser");
      navigate("/login");
    }
  }, [navigate]);

  function handleLogout() {
    sessionStorage.removeItem("bridgelyToken");
    sessionStorage.removeItem("bridgelyUser");

    navigate("/login");
  }

  if (!user) {
    return null;
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-logo">
          <span className="brand-mark">B</span>
          <span>Bridgely</span>
        </div>

        <div className="home-profile">
          <div className="home-avatar">
            {user.displayName?.charAt(0).toUpperCase()}
          </div>

          <div className="home-user-info">
            <strong>{user.displayName}</strong>
            <span>@{user.username}</span>
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </header>

      <main className="home-main">
        <section className="welcome-section">
          <span className="section-label">YOUR SPACE</span>

          <h1>
            Welcome back,{" "}
            <span>{user.displayName}</span>.
          </h1>

          <p>
            Find people, start conversations, and connect
            without sharing your phone number.
          </p>
        </section>

        <section className="home-grid">
          <div className="home-panel search-panel">
            <div className="panel-icon">⌕</div>

            <div>
              <span className="panel-label">DISCOVER</span>

              <h2>Find someone</h2>

              <p>
                Search for people using their unique
                Bridgely username.
              </p>
            </div>

            <button
              className="panel-action"
              onClick={() => navigate("/search")}
            >
              Search users
              <span>→</span>
            </button>
          </div>

          <div className="home-panel conversations-panel">
            <div className="panel-icon">◌</div>

            <div>
              <span className="panel-label">
                MESSAGES
              </span>

              <h2>Your conversations</h2>

              <p>
                Your private conversations will appear
                here.
              </p>
            </div>

            <div className="empty-conversations">
              <div className="empty-circle">+</div>

              <span>
                No conversations yet
              </span>
            </div>
          </div>
        </section>

        <section className="privacy-banner">
          <div className="privacy-mark">✓</div>

          <div>
            <strong>Your number stays private.</strong>

            <p>
              People connect with you through your
              Bridgely username, not your phone number.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;

