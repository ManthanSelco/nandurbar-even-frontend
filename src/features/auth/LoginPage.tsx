import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, errorMessage } from "../../lib/api";

export function LoginPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();

  const [email, setEmail] = useState("admin@selcofoundation.org");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // If admin is already logged in, don't show login again
  useEffect(() => {
    const token = sessionStorage.getItem("pj_token");

    if (token) {
      nav("/admin/dashboard", { replace: true });
    }
  }, [nav]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      const data = response.data?.data;

      if (!data?.token || !data?.staff) {
        throw new Error("Invalid login response from server.");
      }

      sessionStorage.setItem("pj_token", data.token);
      sessionStorage.setItem("pj_staff", JSON.stringify(data.staff));

      const redirect = params.get("redirect");

      nav(redirect || "/admin/dashboard", {
        replace: true,
      });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        /* =========================================
           GLOBAL LOGIN PAGE
        ========================================= */

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        .login-page {
          width: 100%;
          height: 100dvh;
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            linear-gradient(
              135deg,
              #f4f8f6 0%,
              #eef5f1 50%,
              #e6f0eb 100%
            );
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          position: relative;
          overflow: hidden;
          padding: 30px 20px;
          box-sizing: border-box;
        }

        /* =========================================
           BACKGROUND CIRCLES
        ========================================= */

        .login-background-one {
          position: absolute;
          width: 450px;
          height: 450px;
          border-radius: 50%;
          background: rgba(20, 92, 67, 0.07);
          top: -220px;
          right: -150px;
          pointer-events: none;
        }

        .login-background-two {
          position: absolute;
          width: 350px;
          height: 350px;
          border-radius: 50%;
          background: rgba(52, 168, 83, 0.06);
          bottom: -180px;
          left: -120px;
          pointer-events: none;
        }

        /* =========================================
           MAIN CONTAINER
        ========================================= */

        .login-container {
          width: 100%;
          max-width: 1050px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 430px;
          gap: 70px;
          align-items: center;
          position: relative;
          z-index: 2;
        }

        /* =========================================
           BRANDING
        ========================================= */

        .login-brand {
          padding: 30px;
        }

        .login-logo {
          width: 58px;
          height: 58px;
          border-radius: 15px;
          background: #0b4935;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 800;
          margin-bottom: 22px;
          box-shadow:
            0 10px 25px rgba(11, 73, 53, 0.20);
        }

        .login-brand-name {
          font-size: 38px;
          font-weight: 800;
          color: #092d23;
          letter-spacing: -1.2px;
          line-height: 1.15;
        }

        .login-brand-subtitle {
          font-size: 20px;
          font-weight: 600;
          color: #16805b;
          margin-top: 8px;
        }

        .login-description {
          max-width: 500px;
          margin-top: 25px;
          color: #60736c;
          font-size: 16px;
          line-height: 1.7;
        }

        .login-features {
          margin-top: 30px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .login-feature {
          display: flex;
          align-items: center;
          gap: 11px;
          color: #334e44;
          font-size: 14px;
          font-weight: 500;
        }

        .login-check {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #dff4e9;
          color: #0b7a52;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          flex-shrink: 0;
        }

        /* =========================================
           LOGIN CARD
        ========================================= */

        .login-card {
          width: 100%;
          background: #ffffff;
          border-radius: 18px;
          padding: 38px;
          box-sizing: border-box;
          box-shadow:
            0 20px 60px rgba(20, 55, 44, 0.12);
          border:
            1px solid rgba(20, 80, 60, 0.08);
        }

        .login-card-header {
          margin-bottom: 28px;
        }

        .login-title {
          margin: 0;
          font-size: 28px;
          font-weight: 750;
          color: #092d23;
          letter-spacing: -0.5px;
        }

        .login-subtitle {
          margin: 8px 0 0;
          font-size: 14px;
          color: #75847e;
        }

        /* =========================================
           ERROR
        ========================================= */

        .login-error {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fff1f1;
          border: 1px solid #ffd1d1;
          color: #b42318;
          padding: 12px 14px;
          border-radius: 9px;
          font-size: 13px;
          margin-bottom: 20px;
          line-height: 1.4;
        }

        .login-error-icon {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #d92d20;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }

        /* =========================================
           FORM
        ========================================= */

        .login-field {
          margin-bottom: 20px;
        }

        .login-label {
          display: block;
          margin-bottom: 8px;
          color: #243c33;
          font-size: 13px;
          font-weight: 650;
        }

        .login-input {
          width: 100%;
          height: 48px;
          box-sizing: border-box;
          border: 1px solid #d5dfda;
          border-radius: 9px;
          padding: 0 14px;
          outline: none;
          font-size: 14px;
          color: #18352c;
          background: #ffffff;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .login-input:focus {
          border-color: #16805b;
          box-shadow:
            0 0 0 3px rgba(22, 128, 91, 0.10);
        }

        /* =========================================
           PASSWORD
        ========================================= */

        .login-password-wrapper {
          position: relative;
          width: 100%;
        }

        .login-password-input {
          width: 100%;
          height: 48px;
          box-sizing: border-box;
          border: 1px solid #d5dfda;
          border-radius: 9px;
          padding: 0 70px 0 14px;
          outline: none;
          font-size: 14px;
          color: #18352c;
          background: #ffffff;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .login-password-input:focus {
          border-color: #16805b;
          box-shadow:
            0 0 0 3px rgba(22, 128, 91, 0.10);
        }

        .login-password-button {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          border: none;
          background: transparent;
          color: #0b6b4b;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          padding: 6px;
        }

        .login-password-button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        /* =========================================
           LOGIN BUTTON
        ========================================= */

        .login-button {
          width: 100%;
          height: 50px;
          margin-top: 8px;
          border: none;
          border-radius: 9px;
          background: #0b4935;
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          transition:
            background 0.2s ease,
            transform 0.1s ease;
          box-shadow:
            0 7px 18px rgba(11, 73, 53, 0.18);
        }

        .login-button:hover:not(:disabled) {
          background: #083d2d;
        }

        .login-button:active:not(:disabled) {
          transform: translateY(1px);
        }

        .login-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
        }

        .login-spinner {
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-top: 2px solid #ffffff;
          border-radius: 50%;
          display: inline-block;
          animation: spin 0.8s linear infinite;
        }

        /* =========================================
           FOOTER / SECURITY
        ========================================= */

        .login-security {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 7px;
          margin-top: 22px;
          color: #788a82;
          font-size: 12px;
          text-align: center;
        }

        .login-footer {
          text-align: center;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #edf1ef;
          color: #a0aaa6;
          font-size: 11px;
        }

        /* =========================================
           TABLET
        ========================================= */

        @media (max-width: 900px) {
          .login-page {
            padding: 25px 20px;
          }

          .login-container {
            grid-template-columns: 1fr;
            gap: 24px;
            max-width: 600px;
          }

          .login-brand {
            padding: 10px 20px;
            text-align: center;
          }

          .login-logo {
            margin-left: auto;
            margin-right: auto;
            margin-bottom: 16px;
          }

          .login-description {
            margin-left: auto;
            margin-right: auto;
          }

          .login-features {
            align-items: center;
            margin-top: 20px;
          }
        }

        /* =========================================
           MOBILE
        ========================================= */

        @media (max-width: 600px) {
          .login-page {
            width: 100%;
            height: 100dvh;
            min-height: 100dvh;
            padding: 14px;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }

          .login-container {
            width: 100%;
            max-width: 430px;
            margin: 0 auto;
            gap: 14px;
          }

          .login-brand {
            padding: 0 8px;
          }

          .login-logo {
            width: 48px;
            height: 48px;
            font-size: 17px;
            border-radius: 13px;
            margin-bottom: 12px;
          }

          .login-brand-name {
            font-size: 28px;
            letter-spacing: -0.8px;
            line-height: 1.1;
          }

          .login-brand-subtitle {
            font-size: 16px;
            margin-top: 5px;
          }

          .login-description {
            margin-top: 10px;
            font-size: 13px;
            line-height: 1.45;
          }

          .login-features {
            margin-top: 13px;
            gap: 7px;
          }

          .login-feature {
            font-size: 12px;
            gap: 8px;
          }

          .login-check {
            width: 19px;
            height: 19px;
            font-size: 10px;
          }

          .login-card {
            width: 100%;
            padding: 22px 18px;
            border-radius: 15px;
          }

          .login-card-header {
            margin-bottom: 20px;
          }

          .login-title {
            font-size: 23px;
          }

          .login-subtitle {
            margin-top: 6px;
            font-size: 12px;
            line-height: 1.4;
          }

          .login-error {
            padding: 10px 12px;
            margin-bottom: 16px;
            font-size: 12px;
          }

          .login-field {
            margin-bottom: 16px;
          }

          .login-label {
            margin-bottom: 6px;
            font-size: 12px;
          }

          .login-input,
          .login-password-input {
            height: 45px;
            font-size: 13px;
          }

          .login-button {
            height: 47px;
            margin-top: 5px;
            font-size: 13px;
          }

          .login-security {
            margin-top: 15px;
            font-size: 11px;
          }

          .login-footer {
            margin-top: 16px;
            padding-top: 14px;
            font-size: 10px;
          }

          .login-background-one {
            width: 260px;
            height: 260px;
            top: -150px;
            right: -120px;
          }

          .login-background-two {
            width: 210px;
            height: 210px;
            bottom: -120px;
            left: -100px;
          }
        }

        /* =========================================
           SMALL MOBILE
        ========================================= */

        @media (max-width: 380px) {
          .login-page {
            padding: 10px;
          }

          .login-container {
            gap: 10px;
          }

          .login-logo {
            width: 44px;
            height: 44px;
            font-size: 16px;
            margin-bottom: 9px;
          }

          .login-brand-name {
            font-size: 24px;
          }

          .login-brand-subtitle {
            font-size: 14px;
          }

          .login-description {
            margin-top: 8px;
            font-size: 12px;
            line-height: 1.35;
          }

          .login-features {
            margin-top: 10px;
            gap: 5px;
          }

          .login-feature {
            font-size: 11px;
          }

          .login-card {
            padding: 18px 15px;
          }

          .login-title {
            font-size: 21px;
          }

          .login-subtitle {
            font-size: 11px;
          }

          .login-input,
          .login-password-input {
            height: 43px;
          }

          .login-button {
            height: 45px;
          }

          .login-security {
            margin-top: 12px;
            font-size: 10px;
          }

          .login-footer {
            margin-top: 12px;
            padding-top: 11px;
            font-size: 9px;
          }
        }

        /* =========================================
           VERY SHORT MOBILE SCREENS
        ========================================= */

        @media (max-height: 650px) and (max-width: 600px) {
          .login-page {
            padding: 8px 12px;
          }

          .login-container {
            gap: 8px;
          }

          .login-brand-name {
            font-size: 23px;
          }

          .login-brand-subtitle {
            font-size: 14px;
          }

          .login-description {
            display: none;
          }

          .login-features {
            display: none;
          }

          .login-logo {
            width: 40px;
            height: 40px;
            margin-bottom: 7px;
            font-size: 15px;
          }

          .login-card {
            padding: 17px 15px;
          }

          .login-card-header {
            margin-bottom: 14px;
          }

          .login-field {
            margin-bottom: 12px;
          }

          .login-security {
            margin-top: 10px;
          }

          .login-footer {
            margin-top: 10px;
            padding-top: 9px;
          }
        }
      `}</style>

      <div className="login-page">
        {/* Background decoration */}
        <div className="login-background-one" />
        <div className="login-background-two" />

        <div className="login-container">
          {/* =========================================
              BRANDING
          ========================================= */}

          <div className="login-brand">
            <div className="login-logo">
              PJ
            </div>

            <div className="login-brand-name">
              Participant Journey
            </div>

            <div className="login-brand-subtitle">
              Admin Portal
            </div>

            <div className="login-description">
              Manage participants, events and engagement
              through a secure administration portal.
            </div>

            <div className="login-features">
              <div className="login-feature">
                <span className="login-check">
                  ✓
                </span>

                <span>
                  Secure admin access
                </span>
              </div>

              <div className="login-feature">
                <span className="login-check">
                  ✓
                </span>

                <span>
                  Participant management
                </span>
              </div>

              <div className="login-feature">
                <span className="login-check">
                  ✓
                </span>

                <span>
                  Event management
                </span>
              </div>
            </div>
          </div>

          {/* =========================================
              LOGIN CARD
          ========================================= */}

          <div className="login-card">
            <div className="login-card-header">
              <h1 className="login-title">
                Welcome back
              </h1>

              <p className="login-subtitle">
                Sign in to your Super Admin account
              </p>
            </div>

            {error && (
              <div className="login-error">
                <span className="login-error-icon">
                  !
                </span>

                <span>
                  {error}
                </span>
              </div>
            )}

            <form onSubmit={submit}>
              {/* Email */}
              <div className="login-field">
                <label
                  htmlFor="email"
                  className="login-label"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);

                    if (error) {
                      setError("");
                    }
                  }}
                  placeholder="Enter your email"
                  disabled={loading}
                  className="login-input"
                  style={{
                    opacity: loading ? 0.7 : 1,
                  }}
                />
              </div>

              {/* Password */}
              <div className="login-field">
                <label
                  htmlFor="password"
                  className="login-label"
                >
                  Password
                </label>

                <div className="login-password-wrapper">
                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    minLength={6}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);

                      if (error) {
                        setError("");
                      }
                    }}
                    placeholder="Enter your password"
                    disabled={loading}
                    className="login-password-input"
                    style={{
                      opacity: loading ? 0.7 : 1,
                    }}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                    disabled={loading}
                    className="login-password-button"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="login-button"
                style={{
                  opacity: loading ? 0.75 : 1,
                  cursor: loading
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {loading ? (
                  <span className="login-loading">
                    <span className="login-spinner" />
                    Signing in...
                  </span>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            {/* Security */}
            <div className="login-security">
              <span>🔒</span>

              <span>
                Authorized personnel only
              </span>
            </div>

            {/* Footer */}
            <div className="login-footer">
              Participant Journey Admin Portal
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

