import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { searchUser } from "../services/api";

function Search() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(event) {
    event.preventDefault();

    setError("");
    setUser(null);

    const cleanUsername = username
      .trim()
      .replace(/^@/, "");

    if (!cleanUsername) {
      setError("Enter a username to search.");
      return;
    }

    setLoading(true);

    try {
      const result = await searchUser(cleanUsername);

      if (result.user) {
        setUser(result.user);
      } else {
        setError("No Bridgely user found with that username.");
      }
    } catch (err) {
      setError(
        err.message || "Unable to search for this user."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="search-page">
      <header className="home-header">
        <Link to="/home" className="home-logo">
          <span className="brand-mark">B</span>
          <span>Bridgely</span>
        </Link>

        <button
          className="search-back"
          onClick={() => navigate("/home")}
        >
          ← Back
        </button>
      </header>

      <main className="search-main">
        <div className="search-heading">
          <span className="section-label">DISCOVER</span>

          <h1>Find someone</h1>

          <p>
            Search for people by their unique Bridgely
            username.
          </p>
        </div>

        <form
          className="search-form"
          onSubmit={handleSearch}
        >
          <div className="search-input-wrap">
            <span>@</span>

            <input
              type="text"
              placeholder="username"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="search-button"
            disabled={loading}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {error && (
          <div className="auth-error search-message">
            {error}
          </div>
        )}

        {user && (
          <div className="found-user">
            <div className="found-user-avatar">
              {user.displayName
                ?.charAt(0)
                .toUpperCase()}
            </div>

            <div className="found-user-info">
              <h2>{user.displayName}</h2>

              <span>@{user.username}</span>

              {user.bio && <p>{user.bio}</p>}
            </div>

            <button className="start-chat-button">
              Message
              <span>→</span>
            </button>
          </div>
        )}

        <div className="search-privacy">
          <div>✓</div>

          <p>
            <strong>Private by design.</strong>
            <br />
            Phone numbers are never displayed in user
            search.
          </p>
        </div>
      </main>
    </div>
  );
}

export default Search;