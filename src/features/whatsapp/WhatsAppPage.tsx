import { useEffect, useState } from "react";
import {
  Filter,
  RotateCcw,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { api, errorMessage } from "../../lib/api";
import { Section } from "../../components/UI";

type Participant = {
  _id: string;
  name: string;
  mobile?: string | null;
  location?: string;
  organizationName?: string;
  organizationType?: string;
  sector?: string;

  whatsappAvailable: boolean;
  whatsappStatus?: string;

  participantStatus?: string;
  preferredLanguage?: string;

  postEventStep?: string;

  assessmentStatus?: string;
  implementationStatus?: string;

  supportSolutions?: string[];
};

type ParticipantFilters = {
  search: string;
  whatsappStatus: string;
  postEventStep: string;
  organizationType: string;
  sector: string;
  assessmentStatus: string;
  implementationStatus: string;
  solution: string;
};

const emptyFilters: ParticipantFilters = {
  search: "",
  whatsappStatus: "",
  postEventStep: "",
  organizationType: "",
  sector: "",
  assessmentStatus: "",
  implementationStatus: "",
  solution: "",
};

const solutionLabels: Record<string, string> = {
  TECHNOLOGY_MACHINERY: "Technology / Machinery",
  SOLAR_ENERGY: "Solar / Energy",
  PRODUCT_DEVELOPMENT: "Product Development",
  BRANDING_MARKETING: "Branding & Marketing",
  PACKAGING: "Packaging",
  FINANCING: "Financing",
  TRAINING: "Training",
  MARKET_LINKAGE: "Market Linkage",
  OTHER: "Other",
};

function statusLabel(value?: string) {
  return String(value || "—").replaceAll("_", " ");
}

export function WhatsAppPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);

  const [filters, setFilters] =
    useState<ParticipantFilters>(emptyFilters);

  const [selected, setSelected] = useState<string[]>([]);

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [interactions, setInteractions] = useState<any[]>([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /*
   * -------------------------------------------------------
   * LOAD PARTICIPANTS
   * -------------------------------------------------------
   */

  async function loadParticipants(
    nextPage = 1,
    customFilters: ParticipantFilters = filters
  ) {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const params: Record<string, any> = {
        page: nextPage,
        limit: 50,
      };

      /*
       * Search
       *
       * Backend search should handle:
       * name, mobile, location, organisation
       */
      if (customFilters.search.trim()) {
        params.search = customFilters.search.trim();
      }

      /*
       * WhatsApp status
       */
      if (customFilters.whatsappStatus) {
        params.whatsappStatus =
          customFilters.whatsappStatus;
      }

      /*
       * Post-event conversation
       */
      if (customFilters.postEventStep) {
        params.postEventStep =
          customFilters.postEventStep;
      }

      /*
       * Organisation
       */
      if (customFilters.organizationType) {
        params.organizationType =
          customFilters.organizationType;
      }

      /*
       * Sector
       */
      if (customFilters.sector) {
        params.sector = customFilters.sector;
      }

      /*
       * Assessment
       */
      if (customFilters.assessmentStatus) {
        params.assessmentStatus =
          customFilters.assessmentStatus;
      }

      /*
       * Implementation
       */
      if (customFilters.implementationStatus) {
        params.implementationStatus =
          customFilters.implementationStatus;
      }

      /*
       * Demand / Support Solution
       */
      if (customFilters.solution) {
        params.solution =
          customFilters.solution;
      }

      const response = await api.get(
        "/participants",
        {
          params,
        }
      );

      const data =
        response.data?.data || {};

      setParticipants(
        data.participants || []
      );

      setPage(
        data.page || nextPage
      );

      setTotalPages(
        Math.max(
          data.totalPages || 1,
          1
        )
      );

      /*
       * Selection belongs to the currently
       * loaded page.
       */
      setSelected([]);
    } catch (loadError) {
      setError(
        errorMessage(loadError)
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * Initial load
   */
  useEffect(() => {
    void loadParticipants(1);
    // Search/filter is intentionally applied
    // using the Apply Filters button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * -------------------------------------------------------
   * FILTERS
   * -------------------------------------------------------
   */

  function updateFilter(
    key: keyof ParticipantFilters,
    value: string
  ) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function applyFilters() {
    setSelected([]);
    void loadParticipants(
      1,
      filters
    );
  }

  function resetFilters() {
    const nextFilters: ParticipantFilters = {
      ...emptyFilters,
    };

    setFilters(nextFilters);
    setSelected([]);

    void loadParticipants(
      1,
      nextFilters
    );
  }

  /*
   * -------------------------------------------------------
   * SELECTION
   * -------------------------------------------------------
   */

  const eligibleParticipants =
    participants.filter(
      (participant) =>
        Boolean(
          participant.mobile &&
            participant.whatsappAvailable
        )
    );

  const allVisibleSelected =
    eligibleParticipants.length > 0 &&
    eligibleParticipants.every(
      (participant) =>
        selected.includes(
          participant._id
        )
    );

  const someVisibleSelected =
    eligibleParticipants.some(
      (participant) =>
        selected.includes(
          participant._id
        )
    );

  function toggleParticipant(
    id: string
  ) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter(
            (item) => item !== id
          )
        : [...current, id]
    );
  }

  function toggleSelectAll() {
    const visibleIds =
      eligibleParticipants.map(
        (participant) =>
          participant._id
      );

    if (allVisibleSelected) {
      setSelected((current) =>
        current.filter(
          (id) =>
            !visibleIds.includes(id)
        )
      );

      return;
    }

    setSelected((current) => [
      ...new Set([
        ...current,
        ...visibleIds,
      ]),
    ]);
  }

  /*
   * -------------------------------------------------------
   * SEND WHATSAPP MESSAGE
   * -------------------------------------------------------
   */

  async function send() {
    if (!selected.length) {
      window.alert(
        "Select at least one participant."
      );
      return;
    }

    if (!message.trim()) {
      window.alert(
        "Enter a message."
      );
      return;
    }

    setSending(true);
    setError("");
    setSuccess("");

    try {
      if (selected.length === 1) {
        await api.post(
          `/whatsapp/participants/${selected[0]}/message`,
          {
            message:
              message.trim(),
          }
        );
      } else {
        await api.post(
          "/whatsapp/bulk-send",
          {
            participantIds:
              selected,
            message:
              message.trim(),
          }
        );
      }

      setSuccess(
        "WhatsApp message request completed."
      );

      setMessage("");
      setSelected([]);

      /*
       * Reload current page so WhatsApp
       * statuses are refreshed.
       */
      await loadParticipants(
        page,
        filters
      );
    } catch (sendError) {
      const text =
        errorMessage(
          sendError
        );

      setError(text);
      window.alert(text);
    } finally {
      setSending(false);
    }
  }

  /*
   * -------------------------------------------------------
   * WHATSAPP HISTORY
   * -------------------------------------------------------
   */

  async function loadInteractions(
    participantId: string
  ) {
    try {
      const response =
        await api.get(
          `/whatsapp/participants/${participantId}/interactions`
        );

      setInteractions(
        response.data?.data || []
      );
    } catch (loadError) {
      const text =
        errorMessage(
          loadError
        );

      setError(text);
      window.alert(text);
    }
  }

  /*
   * -------------------------------------------------------
   * PAGINATION
   * -------------------------------------------------------
   */

  function goToPage(
    nextPage: number
  ) {
    if (
      nextPage < 1 ||
      nextPage > totalPages ||
      loading
    ) {
      return;
    }

    setSelected([]);

    void loadParticipants(
      nextPage,
      filters
    );
  }

  return (
    <div className="participants-page">
      <div className="title">
        <div>
          <h1>
            WhatsApp Communication
          </h1>

          <p>
            Monitor participant WhatsApp
            status and send operational
            messages.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------ */}
      {/* FILTERS                                         */}
      {/* ------------------------------------------------ */}

      <Section
        title="Find participants"
        action={
          <span className="section-note">
            Filter participants before
            sending WhatsApp messages.
          </span>
        }
      >
        <div className="filter-panel">
          {/* SEARCH */}

          <div className="search-field">
            <Search size={17} />

            <input
              placeholder="Search name, mobile, location or organisation..."
              value={
                filters.search
              }
              onChange={(event) =>
                updateFilter(
                  "search",
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  applyFilters();
                }
              }}
            />
          </div>

          <div className="filter-grid">
            {/* WHATSAPP STATUS */}

            <select
              value={
                filters.whatsappStatus
              }
              onChange={(event) =>
                updateFilter(
                  "whatsappStatus",
                  event.target.value
                )
              }
            >
              <option value="">
                All WhatsApp statuses
              </option>

              <option value="PENDING">
                Pending
              </option>

              <option value="SENT">
                Sent
              </option>

              <option value="DELIVERED">
                Delivered
              </option>

              <option value="READ">
                Read
              </option>

              <option value="FAILED">
                Failed
              </option>
            </select>

            {/* POST EVENT */}

            <select
              value={
                filters.postEventStep
              }
              onChange={(event) =>
                updateFilter(
                  "postEventStep",
                  event.target.value
                )
              }
            >
              <option value="">
                All post-event conversations
              </option>

              <option value="NONE">
                None
              </option>

              <option value="IN_PROGRESS">
                In Progress
              </option>

              <option value="COMPLETED">
                Completed
              </option>
            </select>

            {/* ORGANISATION TYPE */}

            <select
              value={
                filters.organizationType
              }
              onChange={(event) =>
                updateFilter(
                  "organizationType",
                  event.target.value
                )
              }
            >
              <option value="">
                All organisation types
              </option>

              <option value="INDIVIDUAL_ENTREPRENEUR">
                Individual entrepreneur
              </option>

              <option value="SHG">
                SHG
              </option>

              <option value="FPO_FPC">
                FPO/FPC
              </option>

              <option value="COOPERATIVE">
                Cooperative
              </option>

              <option value="NGO">
                NGO
              </option>

              <option value="GOVERNMENT">
                Government
              </option>

              <option value="PRIVATE_COMPANY">
                Private company
              </option>

              <option value="OTHER">
                Other
              </option>
            </select>

            {/* SECTOR */}

            <select
              value={
                filters.sector
              }
              onChange={(event) =>
                updateFilter(
                  "sector",
                  event.target.value
                )
              }
            >
              <option value="">
                All sectors
              </option>

              <option value="FOOD_PROCESSING">
                Food processing
              </option>

              <option value="AGRICULTURE">
                Agriculture
              </option>

              <option value="LIVESTOCK">
                Livestock
              </option>

              <option value="RETAIL_SERVICES">
                Retail & Services
              </option>

              <option value="MANUFACTURING">
                Manufacturing
              </option>

              <option value="OTHER">
                Other
              </option>
            </select>

            {/* ASSESSMENT */}

            <select
              value={
                filters.assessmentStatus
              }
              onChange={(event) =>
                updateFilter(
                  "assessmentStatus",
                  event.target.value
                )
              }
            >
              <option value="">
                All assessments
              </option>

              <option value="NOT_STARTED">
                Not started
              </option>

              <option value="IN_PROGRESS">
                In progress
              </option>

              <option value="COMPLETED">
                Completed
              </option>
            </select>

            {/* IMPLEMENTATION */}

            <select
              value={
                filters.implementationStatus
              }
              onChange={(event) =>
                updateFilter(
                  "implementationStatus",
                  event.target.value
                )
              }
            >
              <option value="">
                All implementation
              </option>

              <option value="NOT_STARTED">
                Not started
              </option>

              <option value="PLANNED">
                Planned
              </option>

              <option value="APPROVED">
                Approved
              </option>

              <option value="IN_PROGRESS">
                In progress
              </option>

              <option value="IMPLEMENTED">
                Implemented
              </option>

              <option value="DEFERRED">
                Deferred
              </option>

              <option value="REJECTED">
                Rejected
              </option>
            </select>

            {/* DEMAND */}

            <select
              value={
                filters.solution
              }
              onChange={(event) =>
                updateFilter(
                  "solution",
                  event.target.value
                )
              }
            >
              <option value="">
                All demands
              </option>

              <option value="TECHNOLOGY_MACHINERY">
                Technology / Machinery
              </option>

              <option value="SOLAR_ENERGY">
                Solar / Energy
              </option>

              <option value="PRODUCT_DEVELOPMENT">
                Product Development
              </option>

              <option value="BRANDING_MARKETING">
                Branding & Marketing
              </option>

              <option value="PACKAGING">
                Packaging
              </option>

              <option value="FINANCING">
                Financing
              </option>

              <option value="TRAINING">
                Training
              </option>

              <option value="MARKET_LINKAGE">
                Market Linkage
              </option>

              <option value="OTHER">
                Other
              </option>
            </select>
          </div>

          <div className="filter-actions">
            <button
              className="button-primary"
              type="button"
              onClick={
                applyFilters
              }
            >
              <Filter size={15} />
              Apply filters
            </button>

            <button
              type="button"
              onClick={
                resetFilters
              }
            >
              <RotateCcw
                size={15}
              />
              Reset
            </button>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------ */}
      {/* ERROR / SUCCESS                                */}
      {/* ------------------------------------------------ */}

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {success && (
        <div className="success">
          {success}
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* PARTICIPANTS                                    */}
      {/* ------------------------------------------------ */}

      <Section
        title="Participants"
        action={
          <span className="section-note">
            {loading
              ? "Loading..."
              : `${participants.length} shown · Page ${page} of ${totalPages}`}
          </span>
        }
      >
        {loading ? (
          <div className="empty">
            Loading participants...
          </div>
        ) : participants.length ===
          0 ? (
          <div className="empty">
            No participants match the
            selected filters.
          </div>
        ) : (
          <>
            <div className="table-wrap participant-table">
              <table>
                <thead>
                  <tr>
                    <th>
                      <div
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: "10px",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={
                            allVisibleSelected
                          }
                          ref={(
                            element
                          ) => {
                            if (
                              element
                            ) {
                              element.indeterminate =
                                someVisibleSelected &&
                                !allVisibleSelected;
                            }
                          }}
                          onChange={
                            toggleSelectAll
                          }
                          aria-label="Select all eligible participants"
                        />

                        <span>
                          Select
                        </span>
                      </div>
                    </th>

                    <th>
                      Participant
                    </th>

                    <th>
                      Mobile
                    </th>

                    <th>
                      WhatsApp
                    </th>

                    <th>
                      Journey
                    </th>

                    <th>
                      Conversation
                    </th>

                    <th>
                      Demand
                    </th>

                    <th>
                      Language
                    </th>

                    <th>
                      History
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {participants.map(
                    (
                      participant
                    ) => {
                      const canMessage =
                        Boolean(
                          participant.mobile &&
                            participant.whatsappAvailable
                        );

                      const isSelected =
                        selected.includes(
                          participant._id
                        );

                      return (
                        <tr
                          key={
                            participant._id
                          }
                        >
                          {/* SELECT */}

                          <td>
                            <input
                              type="checkbox"
                              disabled={
                                !canMessage
                              }
                              checked={
                                isSelected
                              }
                              onChange={() =>
                                toggleParticipant(
                                  participant._id
                                )
                              }
                              aria-label={`Select ${
                                participant.name ||
                                "participant"
                              }`}
                            />
                          </td>

                          {/* PARTICIPANT */}

                          <td>
                            <strong>
                              {
                                participant.name
                              }
                            </strong>

                            <small
                              style={{
                                display:
                                  "block",
                              }}
                            >
                              {participant.location ||
                                "—"}
                            </small>

                            {participant.organizationName && (
                              <small
                                style={{
                                  display:
                                    "block",
                                }}
                              >
                                {
                                  participant.organizationName
                                }
                              </small>
                            )}
                          </td>

                          {/* MOBILE */}

                          <td>
                            {participant.mobile ||
                              "—"}
                          </td>

                          {/* WHATSAPP */}

                          <td>
                            <div>
                              <strong>
                                {participant.whatsappStatus ||
                                  (canMessage
                                    ? "PENDING"
                                    : "NOT_AVAILABLE")}
                              </strong>

                              {!canMessage && (
                                <small
                                  style={{
                                    display:
                                      "block",
                                  }}
                                >
                                  WhatsApp
                                  unavailable
                                </small>
                              )}
                            </div>
                          </td>

                          {/* JOURNEY */}

                          <td>
                            <div className="journey-status">
                              <span>
                                Assessment:{" "}
                                {statusLabel(
                                  participant.assessmentStatus
                                )}
                              </span>

                              <span>
                                Implementation:{" "}
                                {statusLabel(
                                  participant.implementationStatus
                                )}
                              </span>
                            </div>
                          </td>

                          {/* POST EVENT */}

                          <td>
                            {statusLabel(
                              participant.postEventStep ||
                                "NONE"
                            )}
                          </td>

                          {/* DEMAND */}

                          <td>
                            <div className="table-chips">
                              {(
                                participant.supportSolutions ||
                                []
                              )
                                .slice(
                                  0,
                                  2
                                )
                                .map(
                                  (
                                    solution
                                  ) => (
                                    <span
                                      key={
                                        solution
                                      }
                                    >
                                      {solutionLabels[
                                        solution
                                      ] ||
                                        solution}
                                    </span>
                                  )
                                )}

                              {(
                                participant.supportSolutions ||
                                []
                              ).length >
                                2 && (
                                <span>
                                  +
                                  {(
                                    participant.supportSolutions ||
                                    []
                                  ).length -
                                    2}
                                </span>
                              )}

                              {!(
                                participant.supportSolutions ||
                                []
                              ).length && (
                                <small>
                                  Not captured
                                </small>
                              )}
                            </div>
                          </td>

                          {/* LANGUAGE */}

                          <td>
                            <span className="lang-badge">
                              {String(
                                participant.preferredLanguage ||
                                  "mr"
                              ).toUpperCase()}
                            </span>
                          </td>

                          {/* HISTORY */}

                          <td>
                            <button
                              type="button"
                              onClick={() =>
                                void loadInteractions(
                                  participant._id
                                )
                              }
                            >
                              History
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}

            <div className="pager">
              <span>
                Page{" "}
                <strong>
                  {page}
                </strong>{" "}
                of{" "}
                <strong>
                  {totalPages}
                </strong>
              </span>

              <div>
                <button
                  type="button"
                  disabled={
                    page <= 1 ||
                    loading ||
                    sending
                  }
                  onClick={() =>
                    goToPage(
                      page - 1
                    )
                  }
                >
                  <ChevronLeft
                    size={15}
                  />
                  Previous
                </button>

                <button
                  type="button"
                  disabled={
                    page >=
                      totalPages ||
                    loading ||
                    sending
                  }
                  onClick={() =>
                    goToPage(
                      page + 1
                    )
                  }
                >
                  Next
                  <ChevronRight
                    size={15}
                  />
                </button>
              </div>
            </div>
          </>
        )}
      </Section>

      {/* ------------------------------------------------ */}
      {/* SEND MESSAGE                                    */}
      {/* ------------------------------------------------ */}

      <Section title="Send WhatsApp message">
        <textarea
          rows={5}
          placeholder="Write the message..."
          value={message}
          onChange={(event) =>
            setMessage(
              event.target.value
            )
          }
        />

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            marginTop: 10,
            gap: 12,
          }}
        >
          <span>
            {selected.length}{" "}
            participant
            {selected.length !== 1
              ? "s"
              : ""}{" "}
            selected
          </span>

          <button
            className="primary"
            type="button"
            disabled={
              sending ||
              !selected.length
            }
            onClick={() =>
              void send()
            }
          >
            {sending
              ? "Sending..."
              : "Send message"}
          </button>
        </div>
      </Section>

      {/* ------------------------------------------------ */}
      {/* HISTORY                                         */}
      {/* ------------------------------------------------ */}

      <Section title="Selected participant WhatsApp history">
        {interactions.length ===
        0 ? (
          <div className="empty">
            Select History on a
            participant to view
            WhatsApp interactions.
          </div>
        ) : (
          interactions.map(
            (item) => (
              <div
                className="answer"
                key={item._id}
              >
                <b>
                  {item.direction} ·{" "}
                  {item.status}
                </b>

                <p>
                  {item.message ||
                    "—"}
                </p>

                <small>
                  {item.createdAt
                    ? new Date(
                        item.createdAt
                      ).toLocaleString(
                        "en-IN"
                      )
                    : "—"}
                </small>
              </div>
            )
          )
        )}
      </Section>
    </div>
  );
}