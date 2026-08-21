import { useEffect, useMemo, useState } from "react";
import { api, errorMessage } from "../../lib/api";
import { Section } from "../../components/UI";
import "./QuestionsPage.css";

type Question = {
  _id: string;
  question: string;
  type: "TEXT" | "TEXTAREA" | "SELECT" | "MULTI_SELECT";
  required: boolean;
  minWords: number;
  maxWords: number;
  displayOrder: number;
  options: string[];
  isActive: boolean;
};

type QuestionForm = {
  question: string;
  type: "TEXT" | "TEXTAREA" | "SELECT" | "MULTI_SELECT";
  required: boolean;
  minWords: number;
  maxWords: number;
  options: string[];
};

const emptyForm: QuestionForm = {
  question: "",
  type: "TEXTAREA",
  required: true,
  minWords: 0,
  maxWords: 500,
  options: [],
};

export function QuestionsPage() {
  const [rows, setRows] = useState<Question[]>([]);
  const [form, setForm] = useState<QuestionForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [statusLoadingId, setStatusLoadingId] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");

  const [typeFilter, setTypeFilter] = useState<
    "ALL" | "TEXT" | "TEXTAREA" | "SELECT" | "MULTI_SELECT"
  >("ALL");

  const setField = (
    key: keyof QuestionForm,
    value: string | boolean | number
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  async function loadQuestions() {
    try {
      setLoadingList(true);
      setError("");

      const response = await api.get("/participant-questions");

      const questions: Question[] = response.data?.data || [];

      setRows(
        [...questions].sort(
          (a, b) => a.displayOrder - b.displayOrder
        )
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    loadQuestions();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function edit(question: Question) {
    setEditingId(question._id);

    setForm({
      question: question.question,
      type: question.type,
      required: question.required,
      minWords: question.minWords,
      maxWords: question.maxWords,
      options: question.options || [],
    });

    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function save(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    const questionText = form.question.trim();
    const minWords = Number(form.minWords);
    const maxWords = Number(form.maxWords);

    if (!questionText) {
      setError("Question text is required.");
      setLoading(false);
      return;
    }

    if (minWords < 0) {
      setError("Minimum words cannot be negative.");
      setLoading(false);
      return;
    }

    if (maxWords < 1) {
      setError("Maximum words must be at least 1.");
      setLoading(false);
      return;
    }

    if (minWords > maxWords) {
      setError(
        "Minimum words cannot be greater than maximum words."
      );
      setLoading(false);
      return;
    }

    const payload = {
      question: questionText,
      type: form.type,
      required: Boolean(form.required),
      minWords,
      maxWords,
      options: form.options.map((x) => x.trim()).filter(Boolean),
    };

    try {
      if (editingId) {
        await api.patch(
          `/participant-questions/${editingId}`,
          payload
        );

        setMessage("Question updated successfully.");
      } else {
        await api.post(
          "/participant-questions",
          payload
        );

        setMessage("Question created successfully.");
      }

      resetForm();
      await loadQuestions();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(question: Question) {
    const nextStatus = !question.isActive;

    const action = nextStatus
      ? "activate"
      : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this question?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");
      setStatusLoadingId(question._id);

      await api.patch(
        `/participant-questions/${question._id}/status`,
        {
          isActive: nextStatus,
        }
      );

      setMessage(
        `Question ${
          nextStatus ? "activated" : "deactivated"
        } successfully.`
      );

      await loadQuestions();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setStatusLoadingId(null);
    }
  }

  const filteredQuestions = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return rows.filter((question) => {
      const matchesSearch =
        !searchText ||
        question.question
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" &&
          question.isActive) ||
        (statusFilter === "INACTIVE" &&
          !question.isActive);

      const matchesType =
        typeFilter === "ALL" ||
        question.type === typeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType
      );
    });
  }, [
    rows,
    search,
    statusFilter,
    typeFilter,
  ]);

  const totalQuestions = rows.length;

  const activeQuestions = rows.filter(
    (q) => q.isActive
  ).length;

  const inactiveQuestions =
    totalQuestions - activeQuestions;

  return (
    <>
      <div className="title">
        <div>
          <h1>Participant Questions</h1>

          <p>
            Manage the questions asked during participant
            registration.
          </p>
        </div>
      </div>

      {(error || message) && (
        <div className={error ? "error" : "success"}>
          {error || message}
        </div>
      )}

      {/* Statistics */}
      <div className="question-stats">
        <div className="question-stat-card">
          <div className="question-stat-icon">
            Q
          </div>

          <div>
            <span>Total Questions</span>
            <strong>{totalQuestions}</strong>
          </div>
        </div>

        <div className="question-stat-card">
          <div className="question-stat-icon active">
            ✓
          </div>

          <div>
            <span>Active</span>
            <strong>{activeQuestions}</strong>
          </div>
        </div>

        <div className="question-stat-card">
          <div className="question-stat-icon inactive">
            —
          </div>

          <div>
            <span>Inactive</span>
            <strong>{inactiveQuestions}</strong>
          </div>
        </div>
      </div>

      {/* Form */}
      <Section
        title={
          editingId
            ? "Edit question"
            : "Add new question"
        }
      >
        <form
          className="question-form"
          onSubmit={save}
        >
          <div className="question-form-field full">
            <label htmlFor="question">
              Question
              <span>*</span>
            </label>

            <textarea
              id="question"
              required
              rows={4}
              placeholder="Enter the question that participants will see..."
              value={form.question}
              onChange={(e) =>
                setField(
                  "question",
                  e.target.value
                )
              }
            />

            <small>
              Write a clear question that is easy for
              participants to understand.
            </small>
          </div>

          <div className="question-form-field">
            <label htmlFor="question-type">
              Answer type
            </label>

            <select
              id="question-type"
              value={form.type}
              onChange={(e) =>
                setField(
                  "type",
                  e.target.value as
                    | "TEXT"
                    | "TEXTAREA"
                    | "SELECT"
                    | "MULTI_SELECT"
                )
              }
            >
              <option value="TEXT">
                Short text
              </option>

              <option value="TEXTAREA">Long text</option>
              <option value="SELECT">Single choice</option>
              <option value="MULTI_SELECT">Multiple choice</option>
            </select>
          </div>

          {(form.type === "SELECT" || form.type === "MULTI_SELECT") && <div className="question-form-field" style={{gridColumn:"1 / -1"}}>
            <label>Options (one per line)</label>
            <textarea rows={6} value={form.options.join("\n")} onChange={(e)=>setForm((current)=>({...current,options:e.target.value.split(/\n/)}))} placeholder="Agriculture\nAnimal Husbandry\nMicro-business / small business\nOther" />
            <small>Options are stored as stable English values and translated automatically for the participant's selected language.</small>
          </div>}

          <div className="question-form-field">
            <label htmlFor="min-words">
              Minimum words
            </label>

            <input
              id="min-words"
              type="number"
              min="0"
              value={form.minWords}
              onChange={(e) =>
                setField(
                  "minWords",
                  Number(e.target.value)
                )
              }
            />
          </div>

          <div className="question-form-field">
            <label htmlFor="max-words">
              Maximum words
            </label>

            <input
              id="max-words"
              type="number"
              min="1"
              value={form.maxWords}
              onChange={(e) =>
                setField(
                  "maxWords",
                  Number(e.target.value)
                )
              }
            />
          </div>

          <div className="question-required">
            <label className="question-checkbox">
              <input
                type="checkbox"
                checked={form.required}
                onChange={(e) =>
                  setField(
                    "required",
                    e.target.checked
                  )
                }
              />

              <span>
                <strong>Required question</strong>
                <small>
                  Participants must answer this
                  question.
                </small>
              </span>
            </label>
          </div>

          <div className="question-form-actions full">
            <button
              type="submit"
              className="primary question-save-btn"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : editingId
                ? "Update question"
                : "Add question"}
            </button>

            {editingId && (
              <button
                type="button"
                className="secondary-btn"
                onClick={resetForm}
                disabled={loading}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </Section>

      {/* Question list */}
      <Section title="Question list">
        <div className="question-toolbar">
          <div className="question-search">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search questions..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearch("")}
              >
                ×
              </button>
            )}
          </div>

          <div className="question-filters">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as
                    | "ALL"
                    | "ACTIVE"
                    | "INACTIVE"
                )
              }
            >
              <option value="ALL">
                All statuses
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="INACTIVE">
                Inactive
              </option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(
                  e.target.value as
                    | "ALL"
                    | "TEXT"
                    | "TEXTAREA"
                    | "SELECT"
                    | "MULTI_SELECT"
                )
              }
            >
              <option value="ALL">
                All types
              </option>

              <option value="TEXT">
                Short text
              </option>

              <option value="TEXTAREA">Long text</option>
              <option value="SELECT">Single choice</option>
              <option value="MULTI_SELECT">Multiple choice</option>
            </select>
          </div>

          {(form.type === "SELECT" || form.type === "MULTI_SELECT") && <div className="question-form-field" style={{gridColumn:"1 / -1"}}>
            <label>Options (one per line)</label>
            <textarea rows={6} value={form.options.join("\n")} onChange={(e)=>setForm((current)=>({...current,options:e.target.value.split(/\n/)}))} placeholder="Agriculture\nAnimal Husbandry\nMicro-business / small business\nOther" />
            <small>Options are stored as stable English values and translated automatically for the participant's selected language.</small>
          </div>}
        </div>

        <div className="question-list-summary">
          Showing{" "}
          <strong>
            {filteredQuestions.length}
          </strong>{" "}
          of{" "}
          <strong>{totalQuestions}</strong>{" "}
          questions
        </div>

        {loadingList ? (
          <div className="empty">
            Loading questions...
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="question-empty">
            <div className="question-empty-icon">
              ?
            </div>

            <h3>
              {rows.length === 0
                ? "No questions configured"
                : "No questions found"}
            </h3>

            <p>
              {rows.length === 0
                ? "Add your first participant registration question above."
                : "Try changing your search or filters."}
            </p>

            {rows.length > 0 && (
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                  setTypeFilter("ALL");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="questions-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Question</th>
                  <th>Type</th>
                  <th>Required</th>
                  <th>Words</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredQuestions.map(
                  (q, index) => (
                    <tr key={q._id}>
                      <td>
                        <span className="question-number">
                          {index + 1}
                        </span>
                      </td>

                      <td>
                        <div className="question-cell">
                          <strong>
                            {q.question}
                          </strong>

                          <small>
                            Question {index + 1}
                          </small>
                        </div>
                      </td>

                      <td>
                        <span className="type-badge">
                          {q.type === "TEXT"
                            ? "Short text"
                            : "Long text"}
                        </span>
                      </td>

                      <td>
                        {q.required ? (
                          <span className="required-badge">
                            Required
                          </span>
                        ) : (
                          <span className="optional-badge">
                            Optional
                          </span>
                        )}
                      </td>

                      <td>
                        <span className="word-range">
                          {q.minWords}–{q.maxWords}
                        </span>
                      </td>

                      <td>
                        {q.isActive ? (
                          <span className="status-badge active">
                            <i />
                            Active
                          </span>
                        ) : (
                          <span className="status-badge inactive">
                            <i />
                            Inactive
                          </span>
                        )}
                      </td>

                      <td>
                        <div className="question-actions">
                          <button
                            type="button"
                            className="edit-btn"
                            onClick={() =>
                              edit(q)
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className={
                              q.isActive
                                ? "deactivate-btn"
                                : "activate-btn"
                            }
                            disabled={
                              statusLoadingId ===
                              q._id
                            }
                            onClick={() =>
                              changeStatus(q)
                            }
                          >
                            {statusLoadingId ===
                            q._id
                              ? "Updating..."
                              : q.isActive
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </>
  );
}