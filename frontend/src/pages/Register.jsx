import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";

import { auth } from "../firebase";
import { registerFirebaseUser } from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    email: "",
    phoneNumber: "",
    password: "",
    verificationMethod: "EMAIL",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (formData.verificationMethod !== "EMAIL") {
      setError(
        "SMS verification is coming soon. Please select Email verification."
      );
      return;
    }

    if (formData.password.length < 8) {
      setError(
        "Password must be at least 8 characters long."
      );
      return;
    }

    setLoading(true);

    try {
      const credential =
        await createUserWithEmailAndPassword(
          auth,
          formData.email.trim(),
          formData.password
        );

      const firebaseUser = credential.user;

      await updateProfile(firebaseUser, {
        displayName: formData.displayName.trim(),
      });

      try {
  await sendEmailVerification(firebaseUser);

  console.log(
    "✅ Firebase verification email sent successfully"
  );
} catch (verificationError) {
  console.error(
    "❌ Firebase verification email failed:",
    verificationError
  );

  throw verificationError;
}

      const idToken =
        await firebaseUser.getIdToken(true);

      const result =
        await registerFirebaseUser({
          idToken,
          username: formData.username,
          displayName: formData.displayName,
          phoneNumber: formData.phoneNumber,
        });

      sessionStorage.setItem(
        "bridgelyVerificationUsername",
        result.user.username
      );

      sessionStorage.setItem(
        "bridgelyVerificationMethod",
        "EMAIL"
      );

      sessionStorage.setItem(
        "bridgelyFirebaseEmail",
        firebaseUser.email || formData.email
      );

      navigate("/verify");
    } catch (err) {
      console.error(
        "Firebase registration error:",
        err
      );

      let message =
        err.message || "Registration failed.";

      if (
        err.code ===
        "auth/email-already-in-use"
      ) {
        message =
          "This email is already registered. Please log in instead.";
      }

      if (
        err.code ===
        "auth/invalid-email"
      ) {
        message =
          "Please enter a valid email address.";
      }

      if (
        err.code ===
        "auth/weak-password"
      ) {
        message =
          "Your password is too weak. Please use at least 8 characters.";
      }

      if (
        err.code ===
        "auth/network-request-failed"
      ) {
        message =
          "Network error. Please check your internet connection and try again.";
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
          <Link to="/" className="brand">
            <span className="brand-mark">B</span>
            <span>Bridgely</span>
          </Link>
        </div>

        <div className="auth-card">
          <div className="auth-heading">
            <span className="section-label">
              GET STARTED
            </span>

            <h1>Create your account</h1>

            <p>
              Join Bridgely and connect with people
              without sharing your phone number.
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
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="username">
                  Username
                </label>

                <div className="input-wrap">
                  <span className="input-prefix">
                    @
                  </span>

                  <input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="yourusername"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="displayName">
                  Display name
                </label>

                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  placeholder="Your name"
                  value={formData.displayName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="email"
              />

              <small>
                We'll send your verification link
                here.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">
                Phone number
              </label>

              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                placeholder="+254 7XX XXX XXX"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="tel"
              />

              <small>
                Your phone number stays private and
                is not shown to other users.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={handleChange}
                minLength={8}
                required
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <div className="verification-choice">
              <div className="verification-title">
                <strong>
                  Verify your account
                </strong>

                <span>
                  Choose where you'd like to
                  receive your verification.
                </span>
              </div>

              <div className="verification-options">
                <label className="verification-option">
                  <input
                    type="radio"
                    name="verificationMethod"
                    value="EMAIL"
                    checked={
                      formData.verificationMethod ===
                      "EMAIL"
                    }
                    onChange={handleChange}
                    disabled={loading}
                  />

                  <span className="radio-custom"></span>

                  <span className="verification-info">
                    <strong>Email</strong>
                    <small>
                      Verification link
                    </small>
                  </span>
                </label>

                <label
                  className="verification-option"
                  style={{
                    opacity: 0.55,
                    cursor: "not-allowed",
                  }}
                >
                  <input
                    type="radio"
                    name="verificationMethod"
                    value="SMS"
                    checked={
                      formData.verificationMethod ===
                      "SMS"
                    }
                    onChange={handleChange}
                    disabled={true}
                  />

                  <span className="radio-custom"></span>

                  <span className="verification-info">
                    <strong>
                      SMS
                      <small
                        style={{
                          display: "inline",
                          marginLeft: "6px",
                        }}
                      >
                        Coming soon
                      </small>
                    </strong>

                    <small>
                      Phone verification
                    </small>
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading
                ? "Creating account..."
                : "Create account"}

              {!loading && (
                <span>→</span>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>
              Already have an account?
            </span>
          </div>

          <Link
            to="/login"
            className="auth-secondary"
          >
            Log in to Bridgely
          </Link>
        </div>

        <p className="auth-footer">
          By creating an account, you agree to
          use Bridgely responsibly and
          respectfully.
        </p>
      </div>
    </div>
  );
}

export default Register;