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
    <div style={styles.page}>
      {/* Background decoration */}
      <div style={styles.backgroundCircleOne} />
      <div style={styles.backgroundCircleTwo} />

      <div style={styles.container}>
        {/* Left branding section */}
        <div style={styles.brandSection}>
          <div style={styles.logo}>
            PJ
          </div>

          <div style={styles.brandName}>
            Participant Journey
          </div>

          <div style={styles.brandSubtitle}>
            Admin Portal
          </div>

          <div style={styles.description}>
            Manage participants, events and engagement
            through a secure administration portal.
          </div>

          <div style={styles.features}>
            <div style={styles.feature}>
              <span style={styles.check}>✓</span>
              Secure admin access
            </div>

            <div style={styles.feature}>
              <span style={styles.check}>✓</span>
              Participant management
            </div>

            <div style={styles.feature}>
              <span style={styles.check}>✓</span>
              Event management
            </div>
          </div>
        </div>

        {/* Login card */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h1 style={styles.title}>Welcome back</h1>

            <p style={styles.subtitle}>
              Sign in to your Super Admin account
            </p>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span style={styles.errorIcon}>!</span>

              <span>{error}</span>
            </div>
          )}

          <form onSubmit={submit}>
            {/* Email */}
            <div style={styles.field}>
              <label htmlFor="email" style={styles.label}>
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
                  if (error) setError("");
                }}
                placeholder="Enter your email"
                disabled={loading}
                style={{
                  ...styles.input,
                  opacity: loading ? 0.7 : 1,
                }}
              />
            </div>

            {/* Password */}
            <div style={styles.field}>
              <label htmlFor="password" style={styles.label}>
                Password
              </label>

              <div style={styles.passwordWrapper}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  minLength={6}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Enter your password"
                  disabled={loading}
                  style={{
                    ...styles.passwordInput,
                    opacity: loading ? 0.7 : 1,
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  disabled={loading}
                  style={styles.passwordButton}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.loginButton,
                opacity: loading ? 0.75 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <span style={styles.loadingContent}>
                  <span style={styles.spinner} />
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div style={styles.security}>
            <span>🔒</span>
            <span>Authorized personnel only</span>
          </div>

          <div style={styles.footer}>
            Participant Journey Admin Portal
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INLINE STYLES
   ========================================================= */

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #f4f8f6 0%, #eef5f1 50%, #e6f0eb 100%)",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    position: "relative",
    overflow: "hidden",
    padding: "30px 20px",
    boxSizing: "border-box",
  },

  backgroundCircleOne: {
    position: "absolute",
    width: "450px",
    height: "450px",
    borderRadius: "50%",
    background: "rgba(20, 92, 67, 0.07)",
    top: "-220px",
    right: "-150px",
  },

  backgroundCircleTwo: {
    position: "absolute",
    width: "350px",
    height: "350px",
    borderRadius: "50%",
    background: "rgba(52, 168, 83, 0.06)",
    bottom: "-180px",
    left: "-120px",
  },

  container: {
    width: "100%",
    maxWidth: "1050px",
    display: "grid",
    gridTemplateColumns: "1fr 430px",
    gap: "70px",
    alignItems: "center",
    position: "relative",
    zIndex: 2,
  },

  brandSection: {
    padding: "30px",
  },

  logo: {
    width: "58px",
    height: "58px",
    borderRadius: "15px",
    background: "#0b4935",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    fontWeight: 800,
    marginBottom: "22px",
    boxShadow: "0 10px 25px rgba(11, 73, 53, 0.20)",
  },

  brandName: {
    fontSize: "38px",
    fontWeight: 800,
    color: "#092d23",
    letterSpacing: "-1.2px",
    lineHeight: 1.15,
  },

  brandSubtitle: {
    fontSize: "20px",
    fontWeight: 600,
    color: "#16805b",
    marginTop: "8px",
  },

  description: {
    maxWidth: "500px",
    marginTop: "25px",
    color: "#60736c",
    fontSize: "16px",
    lineHeight: 1.7,
  },

  features: {
    marginTop: "30px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  feature: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    color: "#334e44",
    fontSize: "14px",
    fontWeight: 500,
  },

  check: {
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "#dff4e9",
    color: "#0b7a52",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 800,
  },

  card: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "38px",
    boxShadow: "0 20px 60px rgba(20, 55, 44, 0.12)",
    border: "1px solid rgba(20, 80, 60, 0.08)",
  },

  cardHeader: {
    marginBottom: "28px",
  },

  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 750,
    color: "#092d23",
    letterSpacing: "-0.5px",
  },

  subtitle: {
    margin: "8px 0 0",
    fontSize: "14px",
    color: "#75847e",
  },

  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#fff1f1",
    border: "1px solid #ffd1d1",
    color: "#b42318",
    padding: "12px 14px",
    borderRadius: "9px",
    fontSize: "13px",
    marginBottom: "20px",
    lineHeight: 1.4,
  },

  errorIcon: {
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    background: "#d92d20",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 700,
    flexShrink: 0,
  },

  field: {
    marginBottom: "20px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    color: "#243c33",
    fontSize: "13px",
    fontWeight: 650,
  },

  input: {
    width: "100%",
    height: "48px",
    boxSizing: "border-box",
    border: "1px solid #d5dfda",
    borderRadius: "9px",
    padding: "0 14px",
    outline: "none",
    fontSize: "14px",
    color: "#18352c",
    background: "#ffffff",
  },

  passwordWrapper: {
    position: "relative",
    width: "100%",
  },

  passwordInput: {
    width: "100%",
    height: "48px",
    boxSizing: "border-box",
    border: "1px solid #d5dfda",
    borderRadius: "9px",
    padding: "0 70px 0 14px",
    outline: "none",
    fontSize: "14px",
    color: "#18352c",
    background: "#ffffff",
  },

  passwordButton: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    color: "#0b6b4b",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    padding: "6px",
  },

  loginButton: {
    width: "100%",
    height: "50px",
    marginTop: "8px",
    border: "none",
    borderRadius: "9px",
    background: "#0b4935",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 700,
    transition: "all 0.2s ease",
    boxShadow: "0 7px 18px rgba(11, 73, 53, 0.18)",
  },

  loadingContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
  },

  spinner: {
    width: "15px",
    height: "15px",
    border: "2px solid rgba(255,255,255,0.4)",
    borderTop: "2px solid #ffffff",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.8s linear infinite",
  },

  security: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "7px",
    marginTop: "22px",
    color: "#788a82",
    fontSize: "12px",
  },

  footer: {
    textAlign: "center",
    marginTop: "24px",
    paddingTop: "20px",
    borderTop: "1px solid #edf1ef",
    color: "#a0aaa6",
    fontSize: "11px",
  },
};