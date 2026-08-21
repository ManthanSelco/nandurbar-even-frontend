import { useEffect, useState } from "react";
import { api, errorMessage } from "../../lib/api";
import { Section } from "../../components/UI";

type Question = {
  _id: string;
  question: string;
  type: "TEXT" | "TEXTAREA";
  required: boolean;
  minWords: number;
  maxWords: number;
  displayOrder: number;
  isActive: boolean;
};

function encodeQuestions(questions: Question[]) {
  const activeQuestions = questions
    .filter((q) => q.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((q) => ({
      _id: q._id,
      question: q.question,
      type: q.type,
      required: q.required,
      minWords: q.minWords,
      maxWords: q.maxWords,
      displayOrder: q.displayOrder,
      isActive: q.isActive,
    }));

  return encodeURIComponent(
    JSON.stringify(activeQuestions)
  );
}

export function VolunteersPage() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");

  const [link, setLink] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const [questions, setQuestions] = useState<Question[]>([]);

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingQuestions, setLoadingQuestions] =
    useState(true);

  useEffect(() => {
    async function loadQuestions() {
      try {
        const response = await api.get(
          "/participant-questions"
        );

        setQuestions(response.data?.data || []);
      } catch (error) {
        setError(errorMessage(error));
      } finally {
        setLoadingQuestions(false);
      }
    }

    loadQuestions();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setLink("");
    setExpiresAt("");

    if (loadingQuestions) {
      setError(
        "Please wait until registration questions are loaded."
      );
      return;
    }

    if (mobile && !/^[0-9]{10}$/.test(mobile)) {
      setError(
        "Volunteer mobile number must contain exactly 10 digits."
      );
      return;
    }

    setBusy(true);

    try {
      const response = await api.post(
        "/participants/volunteer/link",
        {
          volunteerName: name.trim(),
          volunteerMobile: mobile,
        }
      );

      const token =
        response.data?.data?.token;

      if (!token) {
        throw new Error(
          "Volunteer registration link could not be created."
        );
      }

      const encodedQuestions =
        encodeQuestions(questions);

      const url =
        `${window.location.origin}/register` +
        `?volunteerToken=${encodeURIComponent(token)}` +
        `&questions=${encodedQuestions}`;

      setLink(url);

      setExpiresAt(
        response.data?.data?.expiresAt || ""
      );

      sessionStorage.setItem(
        "last_volunteer_link",
        url
      );
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
    } catch {
      setError(
        "Unable to copy automatically. Please copy the link manually."
      );
    }
  }

  function openLink() {
    if (link) {
      window.open(link, "_blank");
    }
  }

  return (
    <>
      <div className="title">
        <div>
          <h1>Volunteers</h1>

          <p>
            Create a temporary registration link
            for each volunteer.
          </p>
        </div>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      <Section title="Create Volunteer Registration Link">
        <form
          className="inline-form"
          onSubmit={create}
        >
          <input
            required
            minLength={2}
            placeholder="Volunteer name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />

          <input
            required
            inputMode="numeric"
            pattern="[0-9]{10}"
            maxLength={10}
            placeholder="Volunteer mobile"
            value={mobile}
            onChange={(e) =>
              setMobile(
                e.target.value.replace(
                  /\D/g,
                  ""
                )
              )
            }
          />

          <button
            type="submit"
            className="primary"
            disabled={
              busy || loadingQuestions
            }
          >
            {loadingQuestions
              ? "Loading questions..."
              : busy
              ? "Creating..."
              : "Create link"}
          </button>
        </form>

        <div className="form-help">
          <span>ⓘ</span>
          <p>
            The volunteer mobile is used only to
            create the registration link. The
            participant will enter their own mobile
            number during registration.
          </p>
        </div>

        {link && (
          <div className="success-box">
            <b>
              Volunteer registration link
            </b>

            <code
              style={{
                display: "block",
                wordBreak: "break-all",
                margin: "10px 0",
              }}
            >
              {link}
            </code>

            {expiresAt && (
              <small>
                Expires:{" "}
                {new Date(
                  expiresAt
                ).toLocaleString()}
              </small>
            )}

            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={copyLink}
              >
                Copy
              </button>

              <button
                type="button"
                onClick={openLink}
              >
                Open registration
              </button>
            </div>
          </div>
        )}
      </Section>

      <Section title="Volunteer Registration">
        <div className="card">
          <div className="card-icon">
            ✓
          </div>

          <div>
            <h3>
              Same participant registration form
            </h3>

            <p>
              The volunteer link now opens directly
              to the participant registration form.
              There is no separate registration-method
              selection screen.
            </p>
          </div>
        </div>

        <div className="cards">
          <div className="card">
            <h3>
              Participant mobile
            </h3>

            <p>
              The participant can provide a mobile
              number during registration.
            </p>
          </div>

          <div className="card">
            <h3>
              10-digit validation
            </h3>

            <p>
              If a mobile number is entered, the
              number must contain exactly 10 digits.
            </p>
          </div>

          <div className="card">
            <h3>
              No OTP
            </h3>

            <p>
              Mobile OTP verification is currently
              disabled. The OTP flow can be added
              again in the future if required.
            </p>
          </div>
        </div>
      </Section>

      <Section title="How it works">
        <ol>
          <li>
            Super Admin creates a volunteer
            registration link.
          </li>

          <li>
            The backend generates a unique
            volunteer token.
          </li>

          <li>
            Volunteer opens the generated link.
          </li>

          <li>
            The link directly opens the participant
            registration form.
          </li>

          <li>
            Participant information is filled in
            without selecting a registration method.
          </li>

          <li>
            Participant mobile is optional, but if
            entered it must contain exactly 10 digits.
          </li>

          <li>
            No OTP verification is performed.
          </li>

          <li>
            Registration is submitted to the existing
            backend registration API.
          </li>

          <li>
            The backend handles the volunteer token
            according to the existing registration
            flow.
          </li>
        </ol>
      </Section>
    </>
  );
}