
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getStaff } from "../../lib/auth";
import * as XLSX from "xlsx";
import { generateParticipantPdf } from "../../utils/participantPdf";

import {
  Filter,
  RotateCcw,
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Download,
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

const FILTER_STORAGE_KEY = "participant-list-filters";

export function ParticipantsPage() {
  getStaff();

  const [downloadingPdf, setDownloadingPdf] = useState(false);

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
    useState<ParticipantFilters>(() => {
      try {
        const saved =
          sessionStorage.getItem(FILTER_STORAGE_KEY);

        if (saved) {
          return {
            ...emptyFilters,
            ...JSON.parse(saved),
          };
        }
      } catch {
        // Ignore invalid saved filters
      }

      return emptyFilters;
    });

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
    setFilters((prev) => {
      const nextFilters = {
        ...prev,
        [key]: value,
      };

      sessionStorage.setItem(
        FILTER_STORAGE_KEY,
        JSON.stringify(nextFilters)
      );

      return nextFilters;
    });
  };

  const resetFilters = () => {
    const nextFilters: ParticipantFilters = {
      ...emptyFilters,
    };

    sessionStorage.removeItem(
      FILTER_STORAGE_KEY
    );

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
   * UI is temporarily disabled.
   * Function is kept so existing functionality/API logic
   * is not removed.
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

      const alreadyInProgress =
        selectedRows.filter(
          (participant) =>
            String(
              participant.postEventStep || ""
            ).toUpperCase() ===
            "IN_PROGRESS"
        );

      const whatsappUnavailable =
        selectedRows.filter(
          (participant) =>
            participant.whatsappAvailable !== true
        );

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

      setSendResult(
        `Post-event WhatsApp completed: ${sent} sent, ${alreadyInProgress.length} already in progress, ${whatsappUnavailable.length} without WhatsApp, ${failed} failed.`
      );

      setSelectedParticipants([]);

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
   *
   * UI is temporarily disabled.
   * Function is kept so existing functionality is not
   * removed from the page.
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
   * EXCEL EXPORT
   * -------------------------------------------------------
   */

  const exportToExcel = async () => {
    setExporting(true);
    setError("");

    try {
      const limit = 50;

      const buildParams = (
        pageNumber: number
      ) => {
        const params: Record<string, any> = {
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
        await api.get("/participants", {
          params: buildParams(1),
        });

      const firstData =
        firstResponse.data?.data || {};

      let allParticipants =
        firstData.participants || [];

      const totalPages =
        Math.max(
          firstData.totalPages || 1,
          1
        );

      for (
        let page = 2;
        page <= totalPages;
        page++
      ) {
        const response =
          await api.get("/participants", {
            params: buildParams(page),
          });

        const data =
          response.data?.data || {};

        if (
          Array.isArray(
            data.participants
          )
        ) {
          allParticipants = [
            ...allParticipants,
            ...data.participants,
          ];
        }
      }

      if (!allParticipants.length) {
        setError(
          "No participants available for the selected filters."
        );
        return;
      }

      // --------------------------------------------------
      // SHEET 1 - PARTICIPANTS
      // --------------------------------------------------

      const participantsSheet =
        allParticipants.map(
          (participant: any) => ({
            "Participant ID":
              participant._id || "",

            "Registration Request ID":
              participant.registrationRequestId || "",

            Name: participant.name || "",
            Mobile: participant.mobile || "",

            "Country Code":
              participant.countryCode || "",

            "Mobile Verified":
              participant.mobileVerified
                ? "Yes"
                : "No",

            "Mobile Verification Method":
              participant.mobileVerificationMethod || "",

            "Preferred Language":
              participant.preferredLanguage || "",

            Gender: participant.gender || "",
            Age: participant.age || "",
            Location:
              participant.location || "",

            "Organization Type":
              participant.organizationType || "",

            "Organization Name":
              participant.organizationName || "",

            Sector:
              participant.sector || "",

            Occupation:
              participant.occupation || "",

            "Registration Method":
              participant.registrationMethod || "",

            "Participant Status":
              participant.participantStatus || "",

            "WhatsApp Available":
              participant.whatsappAvailable
                ? "Yes"
                : "No",

            "Post Event Step":
              participant.postEventStep || "",

            "Follow Up Required":
              participant.followUpRequired
                ? "Yes"
                : "No",

            "Selected Requirement ID":
              participant.selectedRequirement || "",

            "Livelihood Categories":
              Array.isArray(
                participant.livelihoodCategories
              )
                ? participant.livelihoodCategories.join(
                    ", "
                  )
                : "",

            "Value Chains":
              Array.isArray(
                participant.valueChains
              )
                ? participant.valueChains.join(
                    ", "
                  )
                : "",

            "Support Solutions":
              Array.isArray(
                participant.supportSolutions
              )
                ? participant.supportSolutions.join(
                    ", "
                  )
                : "",

            "Specific Solution Provider Interested":
              participant.specificSolutionProviderInterested
                ? "Yes"
                : "No",

            "Specific Solution Provider Interest":
              participant.specificSolutionProviderInterest ||
              "",

            "Next Actions":
              Array.isArray(
                participant.nextActions
              )
                ? participant.nextActions.join(
                    ", "
                  )
                : "",

            "Useful At Mela":
              Array.isArray(
                participant.usefulAtMela
              )
                ? participant.usefulAtMela.join(
                    ", "
                  )
                : "",

            "What Could Be Better":
              participant.whatCouldBeBetter || "",

            "Assessment Status":
              participant.assessmentStatus || "",

            "Implementation Status":
              participant.implementationStatus || "",

            "Recommended Solutions":
              Array.isArray(
                participant.recommendedSolutions
              )
                ? participant.recommendedSolutions.join(
                    ", "
                  )
                : "",

            "Implementation Notes":
              participant.implementationNotes || "",

            "Matched Vendor IDs":
              Array.isArray(
                participant.matchedVendorIds
              )
                ? participant.matchedVendorIds.join(
                    ", "
                  )
                : "",

            "Created At":
              participant.createdAt || "",

            "Updated At":
              participant.updatedAt || "",
          })
        );

      // --------------------------------------------------
      // SHEET 2 - ASSESSMENTS
      // --------------------------------------------------

      const assessmentsSheet =
        allParticipants.map(
          (participant: any) => {
            const assessment =
              participant.detailedAssessment ||
              {};

            const geo =
              assessment.geolocation ||
              {};

            return {
              "Participant ID":
                participant._id || "",

              "Participant Name":
                participant.name || "",

              "Assessment Status":
                participant.assessmentStatus || "",

              "Q1 - Livelihood & Process":
                assessment.livelihoodAndProcess ||
                "",

              "Q2 - Difficult Activity":
                assessment.difficultActivity ||
                "",

              "Q3 - Production Capacity & Seasonality":
                assessment.productionCapacityAndSeasonality ||
                "",

              "Q4 - Machines & Manual Activities":
                assessment.machinesAndManualActivities ||
                "",

              "Q5 - Monthly Financials":
                assessment.monthlyFinancials ||
                "",

              "Q6 - Operating Costs":
                assessment.operatingCosts ||
                "",

              "Q7 - Power Source & Issues":
                assessment.powerSourceAndIssues ||
                "",

              "Q8 - Required Improvement / Solution":
                assessment.requiredImprovementOrSolution ||
                "",

              "Q9 - Loans & Space Details":
                assessment.loansAndSpaceDetails ||
                "",

              "Q10 - Future Scale & Support":
                assessment.futureScaleAndSupport ||
                "",

              "Expected Solution":
                assessment.expectedSolution ||
                "",

              "Identified Solution":
                assessment.identifiedSolution ||
                "",

              Latitude: geo.latitude ?? "",
              Longitude: geo.longitude ?? "",

              "Location Captured At":
                geo.capturedAt || "",

              "Assessment Last Updated At":
                assessment.lastUpdatedAt || "",
            };
          }
        );

      // --------------------------------------------------
      // SHEET 3 - ASSESSMENT DOCUMENTS
      // --------------------------------------------------

      const assessmentDocumentsSheet: any[] =
        [];

      allParticipants.forEach(
        (participant: any) => {
          const documents =
            participant.detailedAssessment
              ?.documents || {};

          const addDocuments = (
            type: string,
            files: any
          ) => {
            if (!Array.isArray(files))
              return;

            files.forEach((file: any) => {
              assessmentDocumentsSheet.push(
                {
                  "Participant ID":
                    participant._id || "",

                  "Participant Name":
                    participant.name || "",

                  "Document Type": type,

                  "File Name":
                    file?.fileName || "",

                  "File Key":
                    file?.fileKey || "",

                  "File Type":
                    file?.fileType || "",

                  "File Size":
                    file?.fileSize || "",

                  "Uploaded At":
                    file?.uploadedAt || "",
                }
              );
            });
          };

          addDocuments(
            "Site Photos",
            documents.sitePhotos
          );

          addDocuments(
            "Machinery Photos",
            documents.machineryPhotos
          );

          addDocuments(
            "Product Photos",
            documents.productPhotos
          );

          addDocuments(
            "Other Documents",
            documents.otherDocuments
          );

          if (
            documents.electricityBill
          ) {
            assessmentDocumentsSheet.push(
              {
                "Participant ID":
                  participant._id || "",

                "Participant Name":
                  participant.name || "",

                "Document Type":
                  "Electricity Bill",

                "File Name":
                  documents.electricityBill
                    .fileName || "",

                "File Key":
                  documents.electricityBill
                    .fileKey || "",

                "File Type":
                  documents.electricityBill
                    .fileType || "",

                "File Size":
                  documents.electricityBill
                    .fileSize || "",

                "Uploaded At":
                  documents.electricityBill
                    .uploadedAt || "",
              }
            );
          }
        }
      );

      // --------------------------------------------------
      // SHEET 4 - SOLUTION DESIGN
      // --------------------------------------------------

      const solutionDesignSheet: any[] =
        [];

      allParticipants.forEach(
        (participant: any) => {
          const solutionDesign =
            participant.solutionDesign ||
            {};

          const gaps =
            solutionDesign.gaps || [];

          const interventions =
            solutionDesign.interventions ||
            [];

          if (!interventions.length) {
            solutionDesignSheet.push({
              "Participant ID":
                participant._id || "",

              "Participant Name":
                participant.name || "",

              Gap: gaps
                .map(
                  (gap: any) =>
                    `${gap?.name || ""}: ${
                      gap?.description || ""
                    }`
                )
                .join(" | "),

              "Intervention Type": "",
              Title: "",
              Specification: "",
              Why: "",
              Source: "",
              Priority: "",
              "Estimated Cost": "",
              "End User %": "",
              "SELCO %": "",
              "Team Decision": "",
              "Decision Rationale": "",
              "Add To Intervention Plan": "",
              Status: "",

              "Solution Design Last Updated At":
                solutionDesign.lastUpdatedAt ||
                "",
            });

            return;
          }

          interventions.forEach(
            (intervention: any) => {
              solutionDesignSheet.push({
                "Participant ID":
                  participant._id || "",

                "Participant Name":
                  participant.name || "",

                Gap: gaps
                  .map(
                    (gap: any) =>
                      `${gap?.name || ""}: ${
                        gap?.description || ""
                      }`
                  )
                  .join(" | "),

                "Intervention Type":
                  intervention?.interventionType ||
                  "",

                Title:
                  intervention?.title || "",

                Specification:
                  intervention?.specification ||
                  "",

                Why:
                  intervention?.why || "",

                Source:
                  intervention?.source || "",

                Priority:
                  intervention?.priority || "",

                "Estimated Cost":
                  intervention?.estimatedCost ??
                  "",

                "End User %":
                  intervention?.leverageEndUserPercent ??
                  "",

                "SELCO %":
                  intervention?.leverageSelcoPercent ??
                  "",

                "Team Decision":
                  intervention?.teamDecision ||
                  "",

                "Decision Rationale":
                  intervention?.decisionRationale ||
                  "",

                "Add To Intervention Plan":
                  intervention?.addToInterventionPlan
                    ? "Yes"
                    : "No",

                Status:
                  intervention?.status || "",

                "Solution Design Last Updated At":
                  solutionDesign.lastUpdatedAt ||
                  "",
              });
            }
          );
        }
      );

      // --------------------------------------------------
      // SHEET 5 - INDICATORS
      // --------------------------------------------------

      const indicatorsSheet: any[] = [];

      allParticipants.forEach(
        (participant: any) => {
          const indicators =
            participant.solutionDesign
              ?.indicators || [];

          indicators.forEach(
            (indicator: any) => {
              indicatorsSheet.push({
                "Participant ID":
                  participant._id || "",

                "Participant Name":
                  participant.name || "",

                Indicator:
                  indicator?.name || "",

                Baseline:
                  indicator?.baseline || "",

                Target:
                  indicator?.target || "",

                Current:
                  indicator?.current || "",

                "Date Measured":
                  indicator?.dateMeasured || "",
              });
            }
          );
        }
      );

      // --------------------------------------------------
      // SHEET 6 - IMPLEMENTATION
      // --------------------------------------------------

      const implementationSheet: any[] =
        [];

      allParticipants.forEach(
        (participant: any) => {
          const implementation =
            participant.implementation ||
            {};

          const interventions =
            implementation.interventions ||
            [];

          if (!interventions.length) {
            implementationSheet.push({
              "Participant ID":
                participant._id || "",

              "Participant Name":
                participant.name || "",

              "Implementation Status":
                participant.implementationStatus ||
                "",

              "Planned Intervention ID": "",
              "Actual Cost": "",
              "End User Contribution": "",
              "SELCO Contribution": "",
              "Vendor Name": "",
              "Procurement Date": "",
              "Installation Date": "",
              "Operational Date": "",
              "Current Status": "",
              "GPS Site Confirmed": "",
              Latitude: "",
              Longitude: "",
              "Reason For Change": "",

              "Implementation Last Updated At":
                implementation.lastUpdatedAt ||
                "",
            });

            return;
          }

          interventions.forEach(
            (intervention: any) => {
              implementationSheet.push({
                "Participant ID":
                  participant._id || "",

                "Participant Name":
                  participant.name || "",

                "Implementation Status":
                  participant.implementationStatus ||
                  "",

                "Planned Intervention ID":
                  intervention?.plannedInterventionId ||
                  "",

                "Actual Cost":
                  intervention?.actualCost ?? "",

                "End User Contribution":
                  intervention?.endUserContribution ??
                  "",

                "SELCO Contribution":
                  intervention?.selcoContribution ??
                  "",

                "Vendor Name":
                  intervention?.vendorName || "",

                "Procurement Date":
                  intervention?.procurementDate || "",

                "Installation Date":
                  intervention?.installationDate || "",

                "Operational Date":
                  intervention?.operationalDate || "",

                "Current Status":
                  intervention?.currentStatus || "",

                "GPS Site Confirmed":
                  intervention?.gpsSiteConfirmed
                    ? "Yes"
                    : "No",

                Latitude:
                  intervention?.latitude ?? "",

                Longitude:
                  intervention?.longitude ?? "",

                "Reason For Change":
                  intervention?.reasonForChange ||
                  "",

                "Implementation Last Updated At":
                  intervention?.lastUpdatedAt ||
                  "",
              });
            }
          );
        }
      );

      // --------------------------------------------------
      // SHEET 7 - SOLUTION TRACKS
      // --------------------------------------------------

      const solutionTracksSheet: any[] =
        [];

      allParticipants.forEach(
        (participant: any) => {
          const tracks =
            participant.solutionTracks || [];

          tracks.forEach(
            (track: any) => {
              solutionTracksSheet.push({
                "Participant ID":
                  participant._id || "",

                "Participant Name":
                  participant.name || "",

                Solution:
                  track?.solution || "",

                Requirement:
                  track?.requirement || "",

                "Value Chain":
                  track?.valueChain || "",

                "Provider ID":
                  track?.providerId || "",

                Status:
                  track?.status || "",

                "Next Action":
                  track?.nextAction || "",

                Notes:
                  track?.notes || "",

                "Updated At":
                  track?.updatedAt || "",
              });
            }
          );
        }
      );

      // --------------------------------------------------
      // CREATE ONE EXCEL FILE
      // --------------------------------------------------

      const workbook =
        XLSX.utils.book_new();

      const addSheet = (
        data: any[],
        sheetName: string
      ) => {
        const worksheet =
          XLSX.utils.json_to_sheet(
            data.length ? data : [{}]
          );

        XLSX.utils.book_append_sheet(
          workbook,
          worksheet,
          sheetName
        );

        const keys = data.length
          ? Object.keys(data[0])
          : [];

        worksheet["!cols"] =
          keys.map((key) => ({
            wch: Math.min(
              Math.max(key.length + 2, 15),
              40
            ),
          }));
      };

      addSheet(
        participantsSheet,
        "Participants"
      );

      addSheet(
        assessmentsSheet,
        "Assessments"
      );

      addSheet(
        assessmentDocumentsSheet,
        "Assessment Documents"
      );

      addSheet(
        solutionDesignSheet,
        "Solution Design"
      );

      addSheet(
        indicatorsSheet,
        "Indicators"
      );

      addSheet(
        implementationSheet,
        "Implementation"
      );

      addSheet(
        solutionTracksSheet,
        "Solution Tracks"
      );

      const date = new Date()
        .toISOString()
        .slice(0, 10);

      XLSX.writeFile(
        workbook,
        `nandurbar-participants-complete-${date}.xlsx`
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

  /*
   * -------------------------------------------------------
   * INDIVIDUAL PARTICIPANT PDF
   * -------------------------------------------------------
   */

  const downloadParticipantPdfForParticipant =
    async (participantId: string) => {
      try {
        setDownloadingPdf(true);
        setError("");
        setSendResult("");

        const [
          participantRes,
          questionsRes,
          assessmentRes,
          solutionRes,
          implementationRes,
          whatsappRes,
        ] = await Promise.all([
          api.get(
            `/participants/${participantId}`
          ),

          api.get(
            "/participant-questions"
          ),

          api.get(
            `/participant-journey/${participantId}/assessment`
          ),

          api.get(
            `/participant-journey/${participantId}/solution-design`
          ),

          api.get(
            `/participant-journey/${participantId}/implementation`
          ),

          api.get(
            `/whatsapp/participants/${participantId}/interactions`
          ),
        ]);

        const participant =
          participantRes.data?.data || {};

        const questions =
          questionsRes.data?.data || [];

        const assessment =
          assessmentRes.data?.data?.assessment ||
          {};

        const solutionDesign =
          solutionRes.data?.data?.solutionDesign ||
          {
            gaps: [],
            interventions: [],
            indicators: [],
          };

        const implementation =
          implementationRes.data?.data?.implementation ||
          {
            interventions: [],
          };

        const whatsapp =
          whatsappRes.data?.data || [];

        await generateParticipantPdf({
          participant,
          questions,
          assessment,
          solutionDesign,
          implementation,
          whatsapp,
        });
      } catch (e) {
        console.error(
          "Participant PDF export failed:",
          e
        );

        setError(
          errorMessage(e) ||
            "Failed to generate participant PDF."
        );
      } finally {
        setDownloadingPdf(false);
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
              stats.mobileProvided || 0
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
                (item: any) =>
                  item._id === "IN_PROGRESS"
              )?.count || 0
            )}
            hint="participants"
          />

          <Stat
            label="Assessment - Completed"
            value={String(
              stats.byAssessment?.find(
                (item: any) =>
                  item._id === "COMPLETED"
              )?.count || 0
            )}
            hint="participants"
          />

          <Stat
            label="Assessment - Not Started"
            value={String(
              stats.byAssessment?.find(
                (item: any) =>
                  item._id === "NOT_STARTED"
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
                  filters.solution === item._id
                    ? "active"
                    : ""
                }`}
                key={item._id}
                onClick={() => {
                  const nextFilters = {
                    ...filters,
                    solution: item._id,
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
                  ] || item._id}
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
              value={filters.search}
              onChange={(event) =>
                updateFilter(
                  "search",
                  event.target.value
                )
              }
            />
          </div>

          <div
            className="filter-grid"
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(210px, 1fr))",
              gap: "12px",
              padding: "16px",
              background: "#f8fafc",
              border:
                "1px solid #e2e8f0",
              borderRadius: "12px",
              marginBottom: "12px",
            }}
          >
            {/* Organisation Type */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#475569",
                }}
              >
                Organisation Type
              </label>

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
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "0 12px",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius: "8px",
                  background: "#fff",
                  color: "#0f172a",
                  fontSize: "14px",
                  outline: "none",
                  cursor: "pointer",
                }}
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
            </div>

            {/* Sector */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#475569",
                }}
              >
                Sector
              </label>

              <select
                value={filters.sector}
                onChange={(event) =>
                  updateFilter(
                    "sector",
                    event.target.value
                  )
                }
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "0 12px",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius: "8px",
                  background: "#fff",
                  color: "#0f172a",
                  fontSize: "14px",
                  outline: "none",
                  cursor: "pointer",
                }}
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
            </div>

            {/* Solution Status - TEMPORARILY DISABLED */}
            {/*
            <div>
              ...
            </div>
            */}

            {/* Assessment Status */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#475569",
                }}
              >
                Participant Post Event Survey Status
              </label>

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
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "0 12px",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius: "8px",
                  background: "#fff",
                  color: "#0f172a",
                  fontSize: "14px",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="">
                  All survey statuses
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
            </div>

            {/* Implementation Status */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#475569",
                }}
              >
                Assessment & Implementation Status
              </label>

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
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "0 12px",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius: "8px",
                  background: "#fff",
                  color: "#0f172a",
                  fontSize: "14px",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="">
                  All Assessment & Implementation statuses
                </option>

                {[
                  "NOT_STARTED",
                  "ASSESSMENT_PENDING",
                  "ASSESSMENT_COMPLETED",
                  "RE_ASSESSMENT_REQUIRED",
                  "SOLUTION_PROPOSED",
                  "SOLUTION_APPROVED",
                  "PROCUREMENT",
                  "VENDOR_UPDATE",
                  "IMPLEMENTATION_COMPLETED",
                  "REJECTED",
                ].map((value) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {statusLabel(value)}
                  </option>
                ))}
              </select>
            </div>

            {/* Preferred Language */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
              }}
            >
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#475569",
                }}
              >
                Preferred Language
              </label>

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
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "0 12px",
                  border:
                    "1px solid #cbd5e1",
                  borderRadius: "8px",
                  background: "#fff",
                  color: "#0f172a",
                  fontSize: "14px",
                  outline: "none",
                  cursor: "pointer",
                }}
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
          </div>

          {/* Filter Actions */}
          <div
            className="filter-actions"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "10px",
              padding: "0 4px 4px",
            }}
          >
            <button
              className="button-primary"
              onClick={() =>
                void load(1)
              }
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                minHeight: "40px",
                padding: "0 16px",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Filter size={15} />
              Apply filters
            </button>

            <button
              onClick={resetFilters}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                minHeight: "40px",
                padding: "0 16px",
                border:
                  "1px solid #cbd5e1",
                borderRadius: "8px",
                background: "#fff",
                color: "#334155",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <RotateCcw size={15} />
              Reset
            </button>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------ */}
      {/* BULK POST EVENT ACTION - TEMPORARILY DISABLED  */}
      {/* ------------------------------------------------ */}

      {/*
      {selectedParticipants.length > 0 && (
        <div className="bulk-post-event-bar">
          ...
        </div>
      )}
      */}

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
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <span className="section-note">
              {loading
                ? "Loading…"
                : `${rows.length} shown`}
            </span>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              {/* Excel Export - UNCHANGED */}
              <button
                className="button-primary"
                type="button"
                onClick={() =>
                  void exportToExcel()
                }
                disabled={
                  loading ||
                  exporting ||
                  rows.length === 0
                }
              >
                <Download size={15} />

                {exporting
                  ? "Exporting..."
                  : "Export Excel"}
              </button>

              {/* Bulk PDF temporarily disabled */}
              {/*
              <button
                className="button-primary"
                type="button"
                onClick={() =>
                  void downloadParticipantPdf()
                }
                disabled={downloadingPdf}
              >
                <Download size={15} />
                Download PDF
              </button>
              */}
            </div>
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
            <div
              className="table-wrap participant-table"
              style={{
                width: "100%",
                overflowX: "auto",
                border:
                  "1px solid #e2e8f0",
                borderRadius: "14px",
                background: "#ffffff",
                boxShadow:
                  "0 2px 8px rgba(15, 23, 42, 0.04)",
              }}
            >
              <table
                style={{
                  width: "100%",
                  minWidth: "1100px",
                  borderCollapse:
                    "separate",
                  borderSpacing: "0",
                }}
              >
                <thead>
                  <tr>
                    {[
                      "Participant",
                      "Organisation",
                      "Sector",
                      "Demand / Solutions",
                      "Participant Journey",
                      "Language",
                      "Registered",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        style={{
                          padding:
                            "14px 16px",
                          background:
                            "#f8fafc",
                          borderBottom:
                            "1px solid #e2e8f0",
                          color:
                            "#475569",
                          fontSize:
                            "12px",
                          fontWeight: 700,
                          textTransform:
                            "uppercase",
                          letterSpacing:
                            "0.04em",
                          textAlign:
                            "left",
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {heading ===
                        "Participant" ? (
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
                                toggleSelectAllVisible
                              }
                              aria-label="Select all visible participants"
                            />

                            <span>
                              Participant
                            </span>
                          </div>
                        ) : (
                          heading
                        )}
                      </th>
                    ))}
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

                      const assessmentStatus =
                        String(
                          participant.assessmentStatus ||
                            "NOT_STARTED"
                        ).toUpperCase();

                      const implementationStatus =
                        String(
                          participant.implementationStatus ||
                            "NOT_STARTED"
                        ).toUpperCase();

                      return (
                        <tr
                          key={
                            participant._id
                          }
                          style={{
                            background:
                              selected
                                ? "#f8fafc"
                                : "#ffffff",
                            transition:
                              "background 0.15s ease",
                          }}
                        >
                          {/* Participant */}
                          <td
                            style={{
                              padding:
                                "16px",
                              borderBottom:
                                "1px solid #f1f5f9",
                              verticalAlign:
                                "top",
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",
                                alignItems:
                                  "flex-start",
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
                                style={{
                                  marginTop:
                                    "5px",
                                  width:
                                    "16px",
                                  height:
                                    "16px",
                                  cursor:
                                    "pointer",
                                }}
                              />

                              <Link
                                className="participant-name"
                                to={`/admin/participants/${participant._id}`}
                                style={{
                                  display:
                                    "flex",
                                  alignItems:
                                    "flex-start",
                                  gap: "11px",
                                  textDecoration:
                                    "none",
                                  color:
                                    "inherit",
                                  minWidth:
                                    "210px",
                                }}
                              >
                                <span
                                  className="table-avatar"
                                  style={{
                                    width:
                                      "42px",
                                    height:
                                      "42px",
                                    minWidth:
                                      "42px",
                                    borderRadius:
                                      "11px",
                                    display:
                                      "flex",
                                    alignItems:
                                      "center",
                                    justifyContent:
                                      "center",
                                    background:
                                      "#eef2ff",
                                    color:
                                      "#4338ca",
                                    fontSize:
                                      "15px",
                                    fontWeight:
                                      700,
                                  }}
                                >
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

                                <span
                                  style={{
                                    display:
                                      "flex",
                                    flexDirection:
                                      "column",
                                    gap:
                                      "4px",
                                  }}
                                >
                                  <strong
                                    style={{
                                      fontSize:
                                        "14px",
                                      color:
                                        "#0f172a",
                                      lineHeight:
                                        "20px",
                                    }}
                                  >
                                    {participant.name ||
                                      "Unnamed"}
                                  </strong>

                                  <small
                                    style={{
                                      color:
                                        "#64748b",
                                      fontSize:
                                        "12px",
                                      lineHeight:
                                        "17px",
                                    }}
                                  >
                                    {participant.mobile ||
                                      "Mobile not captured"}
                                  </small>

                                  <small
                                    style={{
                                      color:
                                        "#64748b",
                                      fontSize:
                                        "12px",
                                      lineHeight:
                                        "17px",
                                    }}
                                  >
                                    📍{" "}
                                    {participant.location ||
                                      "Location not captured"}
                                  </small>

                                  {inProgress && (
                                    <span
                                      style={{
                                        display:
                                          "inline-flex",
                                        width:
                                          "fit-content",
                                        marginTop:
                                          "3px",
                                        padding:
                                          "3px 7px",
                                        borderRadius:
                                          "999px",
                                        background:
                                          "#fff7ed",
                                        color:
                                          "#c2410c",
                                        fontSize:
                                          "10px",
                                        fontWeight:
                                          700,
                                      }}
                                    >
                                      Post-event in progress
                                    </span>
                                  )}

                                  {!inProgress &&
                                    noWhatsApp && (
                                      <span
                                        style={{
                                          display:
                                            "inline-flex",
                                          width:
                                            "fit-content",
                                          marginTop:
                                            "3px",
                                          padding:
                                            "3px 7px",
                                          borderRadius:
                                            "999px",
                                          background:
                                            "#fef2f2",
                                          color:
                                            "#b91c1c",
                                          fontSize:
                                            "10px",
                                          fontWeight:
                                            700,
                                        }}
                                      >
                                        WhatsApp unavailable
                                      </span>
                                    )}
                                </span>
                              </Link>
                            </div>
                          </td>

                          {/* Organisation */}
                          <td
                            style={{
                              padding:
                                "16px",
                              borderBottom:
                                "1px solid #f1f5f9",
                              verticalAlign:
                                "top",
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",
                                flexDirection:
                                  "column",
                                gap:
                                  "5px",
                                minWidth:
                                  "150px",
                              }}
                            >
                              <strong
                                style={{
                                  color:
                                    "#0f172a",
                                  fontSize:
                                    "13px",
                                }}
                              >
                                {participant.organizationName ||
                                  "Not captured"}
                              </strong>

                              <span
                                style={{
                                  display:
                                    "inline-flex",
                                  width:
                                    "fit-content",
                                  padding:
                                    "4px 8px",
                                  borderRadius:
                                    "6px",
                                  background:
                                    "#f1f5f9",
                                  color:
                                    "#475569",
                                  fontSize:
                                    "11px",
                                  fontWeight:
                                    600,
                                }}
                              >
                                {statusLabel(
                                  participant.organizationType
                                )}
                              </span>
                            </div>
                          </td>

                          {/* Sector */}
                          <td
                            style={{
                              padding:
                                "16px",
                              borderBottom:
                                "1px solid #f1f5f9",
                              verticalAlign:
                                "top",
                            }}
                          >
                            <span
                              style={{
                                display:
                                  "inline-flex",
                                padding:
                                  "6px 9px",
                                borderRadius:
                                  "7px",
                                background:
                                  "#f8fafc",
                                border:
                                  "1px solid #e2e8f0",
                                color:
                                  "#334155",
                                fontSize:
                                  "12px",
                                fontWeight:
                                  600,
                                whiteSpace:
                                  "nowrap",
                              }}
                            >
                              {statusLabel(
                                participant.sector
                              )}
                            </span>
                          </td>

                          {/* Demand / Solutions */}
                          <td
                            style={{
                              padding:
                                "16px",
                              borderBottom:
                                "1px solid #f1f5f9",
                              verticalAlign:
                                "top",
                            }}
                          >
                            <div
                              className="table-chips"
                              style={{
                                display:
                                  "flex",
                                flexWrap:
                                  "wrap",
                                gap:
                                  "6px",
                                minWidth:
                                  "170px",
                                maxWidth:
                                  "230px",
                              }}
                            >
                              {(
                                participant.supportSolutions ||
                                []
                              )
                                .slice(
                                  0,
                                  3
                                )
                                .map(
                                  (
                                    solution: string
                                  ) => (
                                    <span
                                      key={
                                        solution
                                      }
                                      style={{
                                        padding:
                                          "5px 8px",
                                        borderRadius:
                                          "6px",
                                        background:
                                          "#f0fdf4",
                                        border:
                                          "1px solid #dcfce7",
                                        color:
                                          "#166534",
                                        fontSize:
                                          "11px",
                                        fontWeight:
                                          600,
                                      }}
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
                                3 && (
                                <span
                                  style={{
                                    padding:
                                      "5px 8px",
                                    borderRadius:
                                      "6px",
                                    background:
                                      "#f1f5f9",
                                    color:
                                      "#475569",
                                    fontSize:
                                      "11px",
                                    fontWeight:
                                      700,
                                  }}
                                >
                                  +
                                  {participant
                                    .supportSolutions
                                    .length -
                                    3}
                                </span>
                              )}

                              {!(
                                participant.supportSolutions ||
                                []
                              ).length && (
                                <span
                                  style={{
                                    color:
                                      "#94a3b8",
                                    fontSize:
                                      "12px",
                                    fontStyle:
                                      "italic",
                                  }}
                                >
                                  No demand captured
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Journey */}
                          <td
                            style={{
                              padding:
                                "16px",
                              borderBottom:
                                "1px solid #f1f5f9",
                              verticalAlign:
                                "top",
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",
                                flexDirection:
                                  "column",
                                gap:
                                  "7px",
                                minWidth:
                                  "145px",
                              }}
                            >
                              {/* Assessment */}
                              <div
                                style={{
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "space-between",
                                  gap:
                                    "8px",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize:
                                      "11px",
                                    color:
                                      "#64748b",
                                    fontWeight:
                                      600,
                                  }}
                                >
                                  Assessment
                                </span>

                                <span
                                  style={{
                                    padding:
                                      "4px 7px",
                                    borderRadius:
                                      "999px",
                                    background:
                                      assessmentStatus ===
                                      "COMPLETED"
                                        ? "#dcfce7"
                                        : assessmentStatus ===
                                            "IN_PROGRESS"
                                          ? "#fef3c7"
                                          : "#f1f5f9",
                                    color:
                                      assessmentStatus ===
                                      "COMPLETED"
                                        ? "#166534"
                                        : assessmentStatus ===
                                            "IN_PROGRESS"
                                          ? "#92400e"
                                          : "#64748b",
                                    fontSize:
                                      "10px",
                                    fontWeight:
                                      700,
                                  }}
                                >
                                  {statusLabel(
                                    assessmentStatus
                                  )}
                                </span>
                              </div>

                              {/* Implementation */}
                              <div
                                style={{
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "space-between",
                                  gap:
                                    "8px",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize:
                                      "11px",
                                    color:
                                      "#64748b",
                                    fontWeight:
                                      600,
                                  }}
                                >
                                  Implementation
                                </span>

                                <span
                                  style={{
                                    padding:
                                      "4px 7px",
                                    borderRadius:
                                      "999px",

                                    background:
                                      implementationStatus ===
                                      "IMPLEMENTATION_COMPLETED"
                                        ? "#dcfce7"
                                        : implementationStatus ===
                                            "ASSESSMENT_COMPLETED"
                                          ? "#dcfce7"
                                          : implementationStatus ===
                                              "ASSESSMENT_PENDING"
                                            ? "#fef3c7"
                                            : implementationStatus ===
                                                "RE_ASSESSMENT_REQUIRED"
                                              ? "#fee2e2"
                                              : implementationStatus ===
                                                  "SOLUTION_PROPOSED"
                                                ? "#dbeafe"
                                                : implementationStatus ===
                                                    "SOLUTION_APPROVED"
                                                  ? "#dbeafe"
                                                  : implementationStatus ===
                                                      "PROCUREMENT"
                                                    ? "#fef3c7"
                                                    : implementationStatus ===
                                                        "VENDOR_UPDATE"
                                                      ? "#e0e7ff"
                                                      : implementationStatus ===
                                                          "REJECTED"
                                                        ? "#fee2e2"
                                                        : "#f1f5f9",

                                    color:
                                      implementationStatus ===
                                      "IMPLEMENTATION_COMPLETED"
                                        ? "#166534"
                                        : implementationStatus ===
                                            "ASSESSMENT_COMPLETED"
                                          ? "#166534"
                                          : implementationStatus ===
                                              "ASSESSMENT_PENDING"
                                            ? "#92400e"
                                            : implementationStatus ===
                                                "RE_ASSESSMENT_REQUIRED"
                                              ? "#991b1b"
                                              : implementationStatus ===
                                                  "SOLUTION_PROPOSED"
                                                ? "#1d4ed8"
                                                : implementationStatus ===
                                                    "SOLUTION_APPROVED"
                                                  ? "#1d4ed8"
                                                  : implementationStatus ===
                                                      "PROCUREMENT"
                                                    ? "#92400e"
                                                    : implementationStatus ===
                                                        "VENDOR_UPDATE"
                                                      ? "#3730a3"
                                                      : implementationStatus ===
                                                          "REJECTED"
                                                        ? "#991b1b"
                                                        : "#64748b",

                                    fontSize:
                                      "10px",
                                    fontWeight:
                                      700,
                                  }}
                                >
                                  {statusLabel(
                                    implementationStatus
                                  )}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Language */}
                          <td
                            style={{
                              padding:
                                "16px",
                              borderBottom:
                                "1px solid #f1f5f9",
                              verticalAlign:
                                "top",
                            }}
                          >
                            <span
                              className="lang-badge"
                              style={{
                                display:
                                  "inline-flex",
                                alignItems:
                                  "center",
                                justifyContent:
                                  "center",
                                minWidth:
                                  "42px",
                                height:
                                  "28px",
                                padding:
                                  "0 9px",
                                borderRadius:
                                  "7px",
                                background:
                                  "#eff6ff",
                                border:
                                  "1px solid #dbeafe",
                                color:
                                  "#1d4ed8",
                                fontSize:
                                  "11px",
                                fontWeight:
                                  800,
                                letterSpacing:
                                  "0.04em",
                              }}
                            >
                              {String(
                                participant.preferredLanguage ||
                                  "mr"
                              ).toUpperCase()}
                            </span>
                          </td>

                          {/* Registered */}
                          <td
                            style={{
                              padding:
                                "16px",
                              borderBottom:
                                "1px solid #f1f5f9",
                              verticalAlign:
                                "top",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",
                                flexDirection:
                                  "column",
                                gap:
                                  "3px",
                              }}
                            >
                              <strong
                                style={{
                                  fontSize:
                                    "12px",
                                  color:
                                    "#334155",
                                }}
                              >
                                {formatDate(
                                  participant.createdAt
                                )}
                              </strong>

                              <span
                                style={{
                                  fontSize:
                                    "10px",
                                  color:
                                    "#94a3b8",
                                }}
                              >
                                Registration date
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td
                            style={{
                              padding:
                                "16px",
                              borderBottom:
                                "1px solid #f1f5f9",
                              verticalAlign:
                                "top",
                            }}
                          >
                            <div
                              style={{
                                display:
                                  "flex",
                                flexDirection:
                                  "column",
                                gap:
                                  "7px",
                                minWidth:
                                  "115px",
                              }}
                            >
                              {/* View Profile */}
                              <Link
                                to={`/admin/participants/${participant._id}`}
                                style={{
                                  display:
                                    "inline-flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                  padding:
                                    "7px 10px",
                                  borderRadius:
                                    "7px",
                                  background:
                                    "#f8fafc",
                                  border:
                                    "1px solid #cbd5e1",
                                  color:
                                    "#334155",
                                  fontSize:
                                    "11px",
                                  fontWeight:
                                    700,
                                  textDecoration:
                                    "none",
                                  whiteSpace:
                                    "nowrap",
                                }}
                              >
                                View profile
                              </Link>

                              {/* Download PDF */}
                              <button
                                type="button"
                                onClick={() =>
                                  void downloadParticipantPdfForParticipant(
                                    String(
                                      participant._id
                                    )
                                  )
                                }
                                disabled={
                                  downloadingPdf
                                }
                                style={{
                                  display:
                                    "inline-flex",
                                  alignItems:
                                    "center",
                                  justifyContent:
                                    "center",
                                  gap:
                                    "5px",
                                  padding:
                                    "7px 10px",
                                  borderRadius:
                                    "7px",
                                  border:
                                    "1px solid #cbd5e1",
                                  background:
                                    "#ffffff",
                                  color:
                                    "#334155",
                                  fontSize:
                                    "11px",
                                  fontWeight:
                                    700,
                                  cursor:
                                    downloadingPdf
                                      ? "not-allowed"
                                      : "pointer",
                                  opacity:
                                    downloadingPdf
                                      ? 0.6
                                      : 1,
                                  whiteSpace:
                                    "nowrap",
                                }}
                              >
                                <Download
                                  size={13}
                                />

                                {downloadingPdf
                                  ? "Generating..."
                                  : "Download PDF"}
                              </button>

                              {/* Delete temporarily disabled */}
                              {/*
                              {isSuperAdmin && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void removeParticipant(
                                      participant._id,
                                      participant.name
                                    )
                                  }
                                >
                                  Delete
                                </button>
                              )}
                              */}
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div
              className="pager"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent:
                  "space-between",
                gap: "16px",
                padding:
                  "16px 4px 4px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  color: "#64748b",
                  fontWeight: 500,
                }}
              >
                Page{" "}
                <strong
                  style={{
                    color: "#0f172a",
                    fontWeight: 700,
                  }}
                >
                  {page}
                </strong>{" "}
                of{" "}
                <strong
                  style={{
                    color: "#0f172a",
                    fontWeight: 700,
                  }}
                >
                  {totalPages}
                </strong>
              </span>

              <div
                style={{
                  display: "flex",
                  alignItems:
                    "center",
                  gap: "5px",
                }}
              >
                {/* Previous */}
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
                  style={{
                    display:
                      "inline-flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    minWidth:
                      "38px",
                    height: "36px",
                    padding:
                      "0 10px",
                    border:
                      "1px solid #cbd5e1",
                    borderRadius:
                      "8px",
                    background:
                      "#ffffff",
                    color:
                      page <= 1
                        ? "#cbd5e1"
                        : "#334155",
                    cursor:
                      page <= 1 ||
                      loading ||
                      sendingPostEvent
                        ? "not-allowed"
                        : "pointer",
                  }}
                  aria-label="Previous page"
                >
                  <ChevronLeft
                    size={15}
                  />
                </button>

                {/* Page Numbers */}
                {Array.from(
                  {
                    length:
                      totalPages,
                  },
                  (_, index) =>
                    index + 1
                )
                  .filter(
                    (pageNumber) => {
                      if (
                        totalPages <=
                        7
                      ) {
                        return true;
                      }

                      if (
                        pageNumber ===
                          1 ||
                        pageNumber ===
                          totalPages
                      ) {
                        return true;
                      }

                      return (
                        pageNumber >=
                          page - 1 &&
                        pageNumber <=
                          page + 1
                      );
                    }
                  )
                  .reduce(
                    (
                      items: React.ReactNode[],
                      pageNumber,
                      index,
                      pages
                    ) => {
                      if (
                        index > 0 &&
                        pageNumber -
                          pages[
                            index - 1
                          ] >
                          1
                      ) {
                        items.push(
                          <span
                            key={`dots-${pageNumber}`}
                            style={{
                              display:
                                "inline-flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              width:
                                "28px",
                              height:
                                "36px",
                              color:
                                "#94a3b8",
                            }}
                          >
                            ...
                          </span>
                        );
                      }

                      items.push(
                        <button
                          key={
                            pageNumber
                          }
                          disabled={
                            loading ||
                            sendingPostEvent
                          }
                          onClick={() =>
                            void load(
                              pageNumber
                            )
                          }
                          style={{
                            display:
                              "inline-flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "center",
                            width:
                              "36px",
                            height:
                              "36px",
                            padding: 0,
                            border:
                              page ===
                              pageNumber
                                ? "1px solid #0f172a"
                                : "1px solid #cbd5e1",
                            borderRadius:
                              "8px",
                            background:
                              page ===
                              pageNumber
                                ? "#0f172a"
                                : "#ffffff",
                            color:
                              page ===
                              pageNumber
                                ? "#ffffff"
                                : "#334155",
                            fontSize:
                              "13px",
                            fontWeight:
                              page ===
                              pageNumber
                                ? 700
                                : 600,
                            cursor:
                              loading ||
                              sendingPostEvent
                                ? "not-allowed"
                                : "pointer",
                          }}
                          aria-label={`Go to page ${pageNumber}`}
                          aria-current={
                            page ===
                            pageNumber
                              ? "page"
                              : undefined
                          }
                        >
                          {pageNumber}
                        </button>
                      );

                      return items;
                    },
                    []
                  )}

                {/* Next */}
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
                  style={{
                    display:
                      "inline-flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    minWidth:
                      "38px",
                    height:
                      "36px",
                    padding:
                      "0 10px",
                    border:
                      "1px solid #cbd5e1",
                    borderRadius:
                      "8px",
                    background:
                      "#ffffff",
                    color:
                      page >=
                      totalPages
                        ? "#cbd5e1"
                        : "#334155",
                    cursor:
                      page >=
                        totalPages ||
                      loading ||
                      sendingPostEvent
                        ? "not-allowed"
                        : "pointer",
                  }}
                  aria-label="Next page"
                >
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

