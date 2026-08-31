import { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";
import { getStaff } from "../../lib/auth";

import {
  Filter,
  RotateCcw,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Trash2,
  Download,
  MessageCircle,
} from "lucide-react";
import { api, errorMessage } from "../../lib/api";
import { PageHeader, Section, Stat } from "../../components/UI";

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

const statusLabel = (value: string) =>
  String(value || "—").replaceAll("_", " ");

const formatDate = (value: any) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

type ParticipantFilters = {
  search: string;
  organizationType: string;
  sector: string;
  solution: string;
  solutionStatus: string;
  implementationStatus: string;
  assessmentStatus: string;
  preferredLanguage: string;
};

const emptyFilters: ParticipantFilters = {
  search: "",
  organizationType: "",
  sector: "",
  solution: "",
  solutionStatus: "",
  implementationStatus: "",
  assessmentStatus: "",
  preferredLanguage: "",
};

export function ParticipantsPage() {


  const staff = getStaff();
const isSuperAdmin = staff?.role === "SUPER_ADMIN";


  const [rows, setRows] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [sendingPostEvent, setSendingPostEvent] =
    useState(false);

  const [error, setError] = useState("");
  const [sendResult, setSendResult] = useState("");

  const [selectedParticipants, setSelectedParticipants] =
    useState<string[]>([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filters, setFilters] =
    useState<ParticipantFilters>(emptyFilters);

  const load = async (
    nextPage = 1,
    customFilters: ParticipantFilters = filters
  ) => {
    setLoading(true);
    setError("");
    setSendResult("");

    try {
      const params: Record<string, any> = {
        page: nextPage,
        limit: 50,
      };

      Object.entries(customFilters).forEach(
        ([key, value]) => {
          if (value) {
            params[key] = value;
          }
        }
      );

      const [
        participantsResponse,
        statsResponse,
      ] = await Promise.all([
        api.get("/participants", {
          params,
        }),
        api.get("/participants/stats"),
      ]);

      const data =
        participantsResponse.data?.data || {};

      setRows(data.participants || []);

      /*
       * Selection belongs to the currently loaded page.
       * When filters/page change, clear old selections.
       */
      setSelectedParticipants([]);

      setPage(data.page || nextPage);

      setTotalPages(
        Math.max(data.totalPages || 1, 1)
      );

      setStats(
        statsResponse.data?.data || null
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1);
  }, []);

  const solutionGroups = useMemo(
    () => stats?.bySolution || [],
    [stats]
  );

  const updateFilter = (
    key: keyof ParticipantFilters,
    value: string
  ) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    const nextFilters: ParticipantFilters = {
      ...emptyFilters,
    };

    setFilters(nextFilters);
    setSelectedParticipants([]);

    void load(1, nextFilters);
  };

  /*
   * -------------------------------------------------------
   * PARTICIPANT SELECTION
   * -------------------------------------------------------
   */

  const toggleParticipantSelection = (
    id: string
  ) => {
    setSelectedParticipants((current) =>
      current.includes(id)
        ? current.filter(
            (item) => item !== id
          )
        : [...current, id]
    );
  };

  const allVisibleSelected =
    rows.length > 0 &&
    rows.every((participant) =>
      selectedParticipants.includes(
        participant._id
      )
    );

  const someVisibleSelected =
    rows.some((participant) =>
      selectedParticipants.includes(
        participant._id
      )
    );

  const toggleSelectAllVisible = () => {
    const visibleIds = rows.map(
      (participant) => participant._id
    );

    if (allVisibleSelected) {
      setSelectedParticipants((current) =>
        current.filter(
          (id) => !visibleIds.includes(id)
        )
      );

      return;
    }

    setSelectedParticipants((current) => [
      ...new Set([
        ...current,
        ...visibleIds,
      ]),
    ]);
  };

  /*
   * -------------------------------------------------------
   * BULK POST-EVENT WHATSAPP
   * -------------------------------------------------------
   *
   * We intentionally process participants in small
   * concurrent batches instead of firing thousands
   * of requests simultaneously.
   */

  const POST_EVENT_BATCH_SIZE = 10;

  const sendPostEventToSelected = async () => {
    if (!selectedParticipants.length) {
      setError(
        "Please select at least one participant."
      );
      return;
    }

    setSendingPostEvent(true);
    setError("");
    setSendResult("");

    try {
      const selectedRows = rows.filter(
        (participant) =>
          selectedParticipants.includes(
            participant._id
          )
      );

      /*
       * Never send another post-event template when
       * the participant is already in progress.
       */
      const alreadyInProgress =
        selectedRows.filter(
          (participant) =>
            String(
              participant.postEventStep || ""
            ).toUpperCase() ===
            "IN_PROGRESS"
        );

      /*
       * WhatsApp must be available.
       */
      const whatsappUnavailable =
        selectedRows.filter(
          (participant) =>
            participant.whatsappAvailable !== true
        );

      /*
       * Only participants who are:
       * 1. Not already IN_PROGRESS
       * 2. Have WhatsApp available
       */
      const eligibleParticipants =
        selectedRows.filter(
          (participant) =>
            String(
              participant.postEventStep || ""
            ).toUpperCase() !==
              "IN_PROGRESS" &&
            participant.whatsappAvailable === true
        );

      let sent = 0;
      let failed = 0;

      /*
       * Process in batches of 10.
       *
       * This prevents the browser/backend from receiving
       * hundreds or thousands of simultaneous requests.
       */
      for (
        let i = 0;
        i < eligibleParticipants.length;
        i += POST_EVENT_BATCH_SIZE
      ) {
        const batch =
          eligibleParticipants.slice(
            i,
            i + POST_EVENT_BATCH_SIZE
          );

        const results =
          await Promise.allSettled(
            batch.map((participant) =>
              api.post(
                `/whatsapp/participants/${participant._id}/send-post-event`
              )
            )
          );

        results.forEach((result) => {
          if (
            result.status === "fulfilled"
          ) {
            sent += 1;
          } else {
            failed += 1;
          }
        });
      }

      const skippedInProgress =
        alreadyInProgress.length;

      const skippedNoWhatsApp =
        whatsappUnavailable.length;

      setSendResult(
        `Post-event WhatsApp completed: ${sent} sent, ${skippedInProgress} already in progress, ${skippedNoWhatsApp} without WhatsApp, ${failed} failed.`
      );

      /*
       * Clear current selection.
       */
      setSelectedParticipants([]);

      /*
       * Reload current page so statuses are refreshed.
       */
      await load(page, filters);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSendingPostEvent(false);
    }
  };

  /*
   * -------------------------------------------------------
   * DELETE PARTICIPANT
   * -------------------------------------------------------
   */

  const removeParticipant = async (
    id: string,
    name: string
  ) => {
    const participantName =
      name || "this participant";

    const confirmed = window.confirm(
      `Delete participant "${participantName}"? This will soft-delete the record and remove it from active participant lists.`
    );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      await api.delete(
        `/participants/${id}`
      );

      const nextPage =
        page > 1 && rows.length === 1
          ? page - 1
          : page;

      await load(
        nextPage,
        filters
      );
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  /*
   * -------------------------------------------------------
   * CSV EXPORT
   * -------------------------------------------------------
   */

  const csvValue = (value: any): string => {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    let text: string;

    if (Array.isArray(value)) {
      text = value.join(", ");
    } else if (
      typeof value === "boolean"
    ) {
      text = value ? "Yes" : "No";
    } else {
      text = String(value);
    }

    return `"${text.replace(
      /"/g,
      '""'
    )}"`;
  };

  const exportToCSV = async () => {
    setExporting(true);
    setError("");

    try {
      const limit = 50;

      const buildParams = (
        pageNumber: number
      ) => {
        const params: Record<
          string,
          any
        > = {
          page: pageNumber,
          limit,
        };

        Object.entries(filters).forEach(
          ([key, value]) => {
            if (value) {
              params[key] = value;
            }
          }
        );

        return params;
      };

      const firstResponse =
        await api.get(
          "/participants",
          {
            params:
              buildParams(1),
          }
        );

      const firstData =
        firstResponse.data?.data ||
        {};

      let allParticipants =
        firstData.participants ||
        [];

      const totalPagesToFetch =
        Math.max(
          firstData.totalPages ||
            1,
          1
        );

      if (
        totalPagesToFetch > 1
      ) {
        for (
          let currentPage = 2;
          currentPage <=
            totalPagesToFetch;
          currentPage += 1
        ) {
          const response =
            await api.get(
              "/participants",
              {
                params:
                  buildParams(
                    currentPage
                  ),
              }
            );

          const data =
            response.data?.data ||
            {};

          if (
            Array.isArray(
              data.participants
            )
          ) {
            allParticipants =
              allParticipants.concat(
                data.participants
              );
          }
        }
      }

      if (
        !allParticipants.length
      ) {
        setError(
          "No participants available for the selected filters."
        );

        return;
      }

      const headers = [
        "Name",
        "Mobile",
        "Country Code",
        "Preferred Language",
        "Gender",
        "Age",
        "Location",
        "Organization Type",
        "Organization Name",
        "Sector",
        "Occupation",
        "WhatsApp Available",
        "Registration Method",
        "Participant Status",
        "WhatsApp Status",
        "Post Event Step",
        "Follow Up Required",
        "Livelihood Categories",
        "Value Chains",
        "Support Solutions",
        "Specific Solution Provider Interested",
        "Specific Solution Provider Interest",
        "Next Actions",
        "Useful At Mela",
        "What Could Be Better",
        "Assessment Status",
        "Implementation Status",
        "Recommended Solutions",
        "Implementation Notes",
        "Created At",
        "Updated At",
      ];

      const csvRows =
        allParticipants.map(
          (participant) => [
            participant.name,
            participant.mobile,
            participant.countryCode,
            participant.preferredLanguage,
            participant.gender,
            participant.age,
            participant.location,
            participant.organizationType,
            participant.organizationName,
            participant.sector,
            participant.occupation,
            participant.whatsappAvailable,
            participant.registrationMethod,
            participant.participantStatus,
            participant.whatsappStatus,
            participant.postEventStep,
            participant.followUpRequired,
            participant.livelihoodCategories,
            participant.valueChains,
            participant.supportSolutions,
            participant.specificSolutionProviderInterested,
            participant.specificSolutionProviderInterest,
            participant.nextActions,
            participant.usefulAtMela,
            participant.whatCouldBeBetter,
            participant.assessmentStatus,
            participant.implementationStatus,
            participant.recommendedSolutions,
            participant.implementationNotes,
            participant.createdAt,
            participant.updatedAt,
          ]
        );

      const csvContent = [
        headers
          .map(csvValue)
          .join(","),
        ...csvRows.map((row) =>
          row
            .map(csvValue)
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob(
        ["\uFEFF" + csvContent],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );

      const downloadUrl =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = downloadUrl;

      const date =
        new Date()
          .toISOString()
          .slice(0, 10);

      link.download =
        `nandurbar-participants-${date}.csv`;

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

      URL.revokeObjectURL(
        downloadUrl
      );
    } catch (e) {
      setError(
        `Failed to export participants: ${errorMessage(
          e
        )}`
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="participants-page">
      <PageHeader
        eyebrow="Participant Management"
        title="Participants"
        description="Search, segment and track every participant from registration to implementation."
        action={
          <Link
            className="button-primary"
            to="/register"
          >
            <Users size={16} />
            Open registration
          </Link>
        }
      />

      {stats && (
        <div className="stats">
          <Stat
            label="Total participants"
            value={String(
              stats.total || 0
            )}
            hint={`${stats.today || 0} registered today`}
          />

          <Stat
            label="Mobile captured"
            value={String(
              stats.mobileProvided ||
                0
            )}
          />

          <Stat
            label="Volunteer assisted"
            value={String(
              stats.volunteer || 0
            )}
          />

          <Stat
            label="Self registrations"
            value={String(
              stats.selfQr || 0
            )}
          />





        </div>
      )}


      {stats && (
  <div className="stats">
    <Stat
      label="Assessment - In Progress"
      value={String(
        stats.byAssessment?.find(
          (item: any) => item._id === "IN_PROGRESS"
        )?.count || 0
      )}
      hint="participants"
    />

    <Stat
      label="Assessment - Completed"
      value={String(
        stats.byAssessment?.find(
          (item: any) => item._id === "COMPLETED"
        )?.count || 0
      )}
      hint="participants"
    />

    <Stat
      label="Assessment - Not Started"
      value={String(
        stats.byAssessment?.find(
          (item: any) => item._id === "NOT_STARTED"
        )?.count || 0
      )}
      hint="participants"
    />
  </div>
)}






      <Section
        title="Demand overview"
        action={
          <span className="section-note">
            Click a solution to filter
            participants
          </span>
        }
      >
        <div className="solution-grid">
          {solutionGroups.map(
            (item: any) => (
              <button
                className={`solution-card ${
                  filters.solution ===
                  item._id
                    ? "active"
                    : ""
                }`}
                key={item._id}
                onClick={() => {
                  const nextFilters = {
                    ...filters,
                    solution:
                      item._id,
                  };

                  setFilters(
                    nextFilters
                  );

                  void load(
                    1,
                    nextFilters
                  );
                }}
              >
                <span>
                  {solutionLabels[
                    item._id
                  ] ||
                    item._id}
                </span>

                <strong>
                  {item.count}
                </strong>

                <small>
                  participants
                </small>
              </button>
            )
          )}

          {!solutionGroups.length && (
            <div className="empty">
              No solution data yet.
              Complete post-event
              tracking to populate
              this view.
            </div>
          )}
        </div>
      </Section>

      <Section
        title="Find participants"
        action={
          <button className="filter-toggle">
            <SlidersHorizontal
              size={15}
            />
            Filters
          </button>
        }
      >
        <div className="filter-panel">
          <div className="search-field">
            <Search size={17} />

            <input
              placeholder="Search name, mobile, place or organisation..."
              value={
                filters.search
              }
              onChange={(event) =>
                updateFilter(
                  "search",
                  event.target.value
                )
              }
            />
          </div>

          <div className="filter-grid">
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

            <select
              value={
                filters.solutionStatus
              }
              onChange={(event) =>
                updateFilter(
                  "solutionStatus",
                  event.target.value
                )
              }
            >
              <option value="">
                All solution statuses
              </option>

              {[
                "IDENTIFIED",
                "RECOMMENDED",
                "MATCHED",
                "PLANNED",
                "IN_PROGRESS",
                "IMPLEMENTED",
                "DEFERRED",
                "REJECTED",
              ].map((value) => (
                <option
                  key={value}
                  value={value}
                >
                  {statusLabel(
                    value
                  )}
                </option>
              ))}
            </select>

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

              {[
                "NOT_STARTED",
                "PLANNED",
                "APPROVED",
                "IN_PROGRESS",
                "IMPLEMENTED",
                "DEFERRED",
                "REJECTED",
              ].map((value) => (
                <option
                  key={value}
                  value={value}
                >
                  {statusLabel(
                    value
                  )}
                </option>
              ))}
            </select>

            <select
              value={
                filters.preferredLanguage
              }
              onChange={(event) =>
                updateFilter(
                  "preferredLanguage",
                  event.target.value
                )
              }
            >
              <option value="">
                All languages
              </option>

              <option value="mr">
                Marathi
              </option>

              <option value="hi">
                Hindi
              </option>

              <option value="en">
                English
              </option>

              <option value="gu">
                Gujarati
              </option>
            </select>
          </div>

          <div className="filter-actions">
            <button
              className="button-primary"
              onClick={() =>
                void load(1)
              }
            >
              <Filter size={15} />
              Apply filters
            </button>

            <button
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
      {/* BULK POST EVENT ACTION                          */}
      {/* ------------------------------------------------ */}

      {  isSuperAdmin && selectedParticipants.length >
        0 && (
        <div className="bulk-post-event-bar">
          <div>
            <strong>
              {
                selectedParticipants.length
              } participant
              {selectedParticipants.length !==
              1
                ? "s"
                : ""}{" "}
              selected
            </strong>

            <span>
              Participants already in
              progress will be skipped.
            </span>
          </div>

          <button
            className="button-primary"
            type="button"
            disabled={
              sendingPostEvent
            }
            onClick={() =>
              void sendPostEventToSelected()
            }
          >
            <MessageCircle
              size={15}
            />

            {sendingPostEvent
              ? "Sending..."
              : "Send Post-Event WhatsApp"}
          </button>
        </div>
      )}

      {sendResult && (
        <div className="success">
          {sendResult}
        </div>
      )}

      <Section
        title="Participant directory"
        action={
          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              gap: "12px",
            }}
          >
            <span className="section-note">
              {loading
                ? "Loading…"
                : `${rows.length} shown`}
            </span>

            <button
              className="button-primary"
              type="button"
              onClick={() =>
                void exportToCSV()
              }
              disabled={
                loading ||
                exporting ||
                rows.length ===
                  0
              }
            >
              <Download
                size={15}
              />

              {exporting
                ? "Exporting..."
                : "Export CSV"}
            </button>
          </div>
        }
      >
        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="empty">
            Loading participants...
          </div>
        ) : !rows.length ? (
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
                          ref={(element) => {
                            if (
                              element
                            ) {
                              element.indeterminate =
                                someVisibleSelected &&
                                !allVisibleSelected;
                            }
                          }}
                          onChange={
                            toggleSelectAllVisible
                          }
                          aria-label="Select all visible participants"
                        />

                        <span>
                          Participant
                        </span>
                      </div>
                    </th>

                    <th>
                      Organisation
                    </th>

                    <th>
                      Sector
                    </th>

                    <th>
                      Demand /
                      solutions
                    </th>

                    <th>
                      Journey
                    </th>

                    <th>
                      Language
                    </th>

                    <th>
                      Registered
                    </th>

                    <th>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map(
                    (
                      participant
                    ) => {
                      const selected =
                        selectedParticipants.includes(
                          participant._id
                        );

                      const inProgress =
                        String(
                          participant.postEventStep ||
                            ""
                        ).toUpperCase() ===
                        "IN_PROGRESS";

                      const noWhatsApp =
                        participant.whatsappAvailable !==
                        true;

                      return (
                        <tr
                          key={
                            participant._id
                          }
                        >
                          <td>
                            <div
                              style={{
                                display:
                                  "flex",
                                alignItems:
                                  "center",
                                gap: "12px",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={
                                  selected
                                }
                                onChange={() =>
                                  toggleParticipantSelection(
                                    participant._id
                                  )
                                }
                                aria-label={`Select ${
                                  participant.name ||
                                  "participant"
                                }`}
                              />

                              <Link
                                className="participant-name"
                                to={`/admin/participants/${participant._id}`}
                              >
                                <span className="table-avatar">
                                  {String(
                                    participant.name ||
                                      "?"
                                  )
                                    .slice(
                                      0,
                                      1
                                    )
                                    .toUpperCase()}
                                </span>

                                <span>
                                  <strong>
                                    {participant.name ||
                                      "Unnamed"}
                                  </strong>

                                  <small>
                                    {participant.mobile ||
                                      "—"}{" "}
                                    ·{" "}
                                    {participant.location ||
                                      "—"}
                                  </small>

                                  {inProgress && (
                                    <small>
                                      Post-event
                                      already
                                      in progress
                                    </small>
                                  )}

                                  {!inProgress &&
                                    noWhatsApp && (
                                      <small>
                                        WhatsApp
                                        unavailable
                                      </small>
                                    )}
                                </span>
                              </Link>
                            </div>
                          </td>

                          <td>
                            <strong>
                              {participant.organizationName ||
                                "—"}
                            </strong>

                            <small>
                              {statusLabel(
                                participant.organizationType
                              )}
                            </small>
                          </td>

                          <td>
                            {statusLabel(
                              participant.sector
                            )}
                          </td>

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
                                    solution: string
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
                                  {participant
                                    .supportSolutions
                                    .length -
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

                          <td>
                            <div className="journey-status">
                              <span>
                                {statusLabel(
                                  participant.assessmentStatus
                                )}
                              </span>

                              <span>
                                {statusLabel(
                                  participant.implementationStatus
                                )}
                              </span>
                            </div>
                          </td>

                          <td>
                            <span className="lang-badge">
                              {String(
                                participant.preferredLanguage ||
                                  "mr"
                              ).toUpperCase()}
                            </span>
                          </td>

                          <td>
                            {formatDate(
                              participant.createdAt
                            )}
                          </td>

                          <td>
                           {isSuperAdmin && (
  <button
    title="Delete participant"
    onClick={() =>
      void removeParticipant(
        participant._id,
        participant.name
      )
    }
  >
    <Trash2 size={14} />
    Delete
  </button>
)}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>

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
                  disabled={
                    page <= 1 ||
                    loading ||
                    sendingPostEvent
                  }
                  onClick={() =>
                    void load(
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
                  disabled={
                    page >=
                      totalPages ||
                    loading ||
                    sendingPostEvent
                  }
                  onClick={() =>
                    void load(
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
    </div>
  );
}