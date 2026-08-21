import { useEffect, useState } from "react";
import { api, errorMessage } from "../../lib/api";

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
    .sort(
      (a, b) => a.displayOrder - b.displayOrder
    )
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

export function QRPage() {
  const [url, setUrl] = useState("");
  const [questions, setQuestions] = useState<
    Question[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function buildRegistrationUrl() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          "/participant-questions"
        );

        const loadedQuestions =
          response.data?.data || [];

        setQuestions(loadedQuestions);

        const encoded =
          encodeQuestions(loadedQuestions);

        /*
         * Direct participant registration URL.
         *
         * No volunteer token.
         * No method selection.
         * No OTP flow.
         */
        const registrationUrl =
          `${window.location.origin}/register` +
          `?questions=${encoded}`;

        setUrl(registrationUrl);
      } catch (error) {
        setError(errorMessage(error));
      } finally {
        setLoading(false);
      }
    }

    buildRegistrationUrl();
  }, []);

  const qrImageUrl = url
    ? `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(
        url
      )}`
    : "";

  async function copyLink() {
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      setError(
        "Unable to copy the link automatically."
      );
    }
  }

  function printQr() {
    window.print();
  }

  return (
    <>
      <div className="title">
        <div>
          <h1>
            Participant Self-Registration QR
          </h1>

          <p>
            Participants scan this QR code and
            complete the registration form directly.
          </p>
        </div>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="empty">
          Preparing registration QR...
        </div>
      ) : (
        <div className="qr-wrap">
          {qrImageUrl && (
            <img
              src={qrImageUrl}
              alt="Participant self-registration QR code"
              width={360}
              height={360}
            />
          )}

          <h3>
            Scan to register
          </h3>

          <p>
            Scan the QR code to open the participant
            registration form directly.
          </p>

          <code
            style={{
              display: "block",
              maxWidth: 600,
              wordBreak: "break-all",
              margin: "12px auto",
            }}
          >
            {url}
          </code>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={copyLink}
            >
              Copy registration link
            </button>

            <button
              type="button"
              className="primary"
              onClick={printQr}
            >
              Print QR
            </button>

            <a
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              <button type="button">
                Test registration
              </button>
            </a>
          </div>

          <p>
            Active registration questions included:{" "}
            <b>
              {
                questions.filter(
                  (q) => q.isActive
                ).length
              }
            </b>
          </p>

          <div className="qr-info">
            <strong>
              Registration information
            </strong>

            <span>
              The participant will enter their
              mobile number directly on the
              registration form.
            </span>

            <span>
              Mobile number is required and must
              contain exactly 10 digits.
            </span>

            <span>
              No OTP verification is required.
            </span>
          </div>
        </div>
      )}
    </>
  );
}