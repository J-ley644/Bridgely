
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { auth } from "../firebase";

import {
  loginUser,
  loginFirebaseUser,
} from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const value = identifier.trim();

    try {
      /*
       * Firebase accounts use email.
       *
       * Legacy accounts continue using username.
       */
      if (value.includes("@")) {
        const firebaseCredential =
          await signInWithEmailAndPassword(
            auth,
            value,
            password
          );

        const firebaseUser =
          firebaseCredential.user;

        if (!firebaseUser.emailVerified) {
          setError(
            "Please verify your email address before logging in."
          );

          await signOut(auth);

          return;
        }

        const idToken =
          await firebaseUser.getIdToken(true);

        const result =
          await loginFirebaseUser(
            idToken
          );

        sessionStorage.setItem(
          "bridgelyToken",
          result.token
        );

        sessionStorage.setItem(
          "bridgelyUser",
          JSON.stringify(result.user)
        );

        navigate("/home");

        return;
      }

      /*
       * Legacy username/password login.
       */
      const result = await loginUser(
        value,
        password
      );

      sessionStorage.setItem(
        "bridgelyToken",
        result.token
      );

      sessionStorage.setItem(
        "bridgelyUser",
        JSON.stringify(result.user)
      );

      navigate("/home");
    } catch (err) {
      console.error(
        "Login error:",
        err
      );

      let message =
        err.message || "Login failed";

      /*
       * Firebase-specific errors.
       */
      if (
        err.code ===
        "auth/invalid-credential"
      ) {
        message =
          "Invalid email or password.";
      } else if (
        err.code ===
        "auth/user-not-found"
      ) {
        message =
          "No Firebase account was found with this email.";
      } else if (
        err.code ===
        "auth/wrong-password"
      ) {
        message =
          "Invalid email or password.";
      } else if (
        err.code ===
        "auth/too-many-requests"
      ) {
        message =
          "Too many login attempts. Please try again later.";
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-brand">
          <Link
            to="/"
            className="brand"
          >
            <span className="brand-mark">
              B
            </span>

            <span>Bridgely</span>
          </Link>
        </div>

        <div className="auth-card">
          <div className="auth-heading">
            <span className="section-label">
              WELCOME BACK
            </span>

            <h1>
              Log in to Bridgely
            </h1>

            <p>
              Continue your conversations
              without sharing your phone
              number.
            </p>
          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >
            <div className="form-group">
              <label htmlFor="identifier">
                Username or email
              </label>

              <div className="input-wrap">
                <span className="input-prefix">
                  @
                </span>

                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  placeholder="yourusername or email@example.com"
                  value={identifier}
                  onChange={(event) =>
                    setIdentifier(
                      event.target.value
                    )
                  }
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? "Logging in..."
                : "Log in"}

              {!loading && (
                <span>→</span>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>
              New to Bridgely?
            </span>
          </div>

          <Link
            to="/register"
            className="auth-secondary"
          >
            Create an account
          </Link>
        </div>

        <p className="auth-footer">
          Your phone number stays private.
          Your username is how people find
          you on Bridgely.
        </p>
      </div>
    </div>
  );
}

export default Login;

