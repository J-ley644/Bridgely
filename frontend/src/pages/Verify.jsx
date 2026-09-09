import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  onAuthStateChanged,
  reload,
  sendEmailVerification,
} from "firebase/auth";

import { auth } from "../firebase";
import { linkFirebaseAccount } from "../services/api";

function Verify() {
  const navigate = useNavigate();

  const username =
    sessionStorage.getItem("bridgelyVerificationUsername") || "";

  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setFirebaseUser(user);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  async function handleCheckVerification() {
    setError("");
    setSuccess("");

    if (!firebaseUser) {
      setError(
        "Your Firebase session was not found. Please register again."
      );
      return;
    }

    setChecking(true);

    try {
      await reload(firebaseUser);

      if (!firebaseUser.emailVerified) {
        setError(
          "Your email has not been verified yet. Please click the verification link in your email first."
        );
        return;
      }

      const idToken =
        await firebaseUser.getIdToken(true);

      const result =
        await linkFirebaseAccount(idToken);

      sessionStorage.removeItem(
        "bridgelyVerificationUsername"
      );

      sessionStorage.removeItem(
        "bridgelyVerificationMethod"
      );

      sessionStorage.setItem(
        "bridgelyUser",
        JSON.stringify(result.user)
      );

      setSuccess(
        "Your email is verified and your Bridgely account is now connected."
      );

      setTimeout(() => {
        navigate("/home");
      }, 1200);
    } catch (err) {
      console.error(
        "Firebase verification check error:",
        err
      );

      setError(
        err.message ||
          "We could not complete verification. Please try again."
      );
    } finally {
      setChecking(false);
    }
  }

  async function handleResend() {
    setError("");
    setSuccess("");

    if (!firebaseUser) {
      setError(
        "Your Firebase session was not found. Please register again."
      );
      return;
    }

    setResending(true);

    try {
      await sendEmailVerification(
        firebaseUser
      );

      setSuccess(
        "A new verification email has been sent. Check your inbox."
      );
    } catch (err) {
      console.error(
        "Firebase verification email error:",
        err
      );

      setError(
        err.message ||
          "Could not resend the verification email."
      );
    } finally {
      setResending(false);
    }
  }

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-shell">
          <div className="auth-brand">
            <Link to="/" className="brand">
              <span className="brand-mark">B</span>
              <span>Bridgely</span>
            </Link>
          </div>

          <div className="auth-card">
            <div className="auth-heading">
              <span className="section-label">
                VERIFY ACCOUNT
              </span>

              <h1>Loading...</h1>

              <p>
                Checking your verification session.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-brand">
          <Link to="/" className="brand">
            <span className="brand-mark">B</span>
            <span>Bridgely</span>
          </Link>
        </div>

        <div className="auth-card">
          <div className="verify-icon">
            ✉
          </div>

          <div className="auth-heading">
            <span className="section-label">
              VERIFY ACCOUNT
            </span>

            <h1>Check your email</h1>

            <p>
              We sent a verification link to your
              email address. Open the email and click
              the verification link to activate your
              Bridgely account.
            </p>
          </div>

          {username && (
            <div className="verify-username">
              <span>Account</span>
              <strong>@{username}</strong>
            </div>
          )}

          {firebaseUser?.email && (
            <div className="verify-username">
              <span>Email</span>
              <strong>
                {firebaseUser.email}
              </strong>
            </div>
          )}

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {success && (
            <div className="auth-success">
              {success}
            </div>
          )}

          <div className="auth-form">
            <button
              type="button"
              className="auth-submit"
              onClick={handleCheckVerification}
              disabled={checking}
            >
              {checking
                ? "Checking..."
                : "I've verified my email"}

              {!checking && <span>→</span>}
            </button>
          </div>

          <div className="verify-resend">
            <span>
              Didn't receive the email?
            </span>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
            >
              {resending
                ? "Sending..."
                : "Resend email"}
            </button>
          </div>

          <div className="auth-divider">
            <span>Wrong account?</span>
          </div>

          <Link
            to="/register"
            className="auth-secondary"
          >
            Create a different account
          </Link>
        </div>

        <p className="auth-footer">
          Your email is used to secure your account.
          Your phone number remains private.
        </p>
      </div>
    </div>
  );
}

export default Verify;