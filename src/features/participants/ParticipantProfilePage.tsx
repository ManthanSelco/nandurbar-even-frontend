import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  UserRound,
  ClipboardList,
  Route,
  Languages,
  Trash2,
  Pencil,
  X,
  MapPin,
  Upload,
  Plus,
  Save,
  ChevronRight,
   Mic,
} from "lucide-react";
import { api, errorMessage } from "../../lib/api";
import { PageHeader, Section } from "../../components/UI";

const solutions = [
  "TECHNOLOGY_MACHINERY",
  "SOLAR_ENERGY",
  "PRODUCT_DEVELOPMENT",
  "BRANDING_MARKETING",
  "PACKAGING",
  "FINANCING",
  "TRAINING",
  "MARKET_LINKAGE",
  "OTHER",
];

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

const status = (v: any) =>
  String(v || "—").replaceAll("_", " ");

const date = (v: any) =>
  v
    ? new Date(v).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

const selectValues = (e: any) =>
  Array.from(e.target.selectedOptions).map((o: any) => o.value);

const assessmentQuestions = [
  {
    key: "livelihoodAndProcess",
    question:
      "What is your main livelihood, and what are the major activities/steps involved from raw material to final product?",
  },
  {
    key: "difficultActivity",
    question:
      "Which activity is currently the most difficult, time-consuming, labour-intensive, or causing the highest loss?",
  },
  {
    key: "productionCapacityAndSeasonality",
    question:
      "What is your current production capacity, working time, and seasonal variation (peak/off-season)?",
  },
  {
    key: "machinesAndManualActivities",
    question:
      "What machines or tools are currently used for each activity, and which activities are still done manually?",
  },
  {
    key: "monthlyFinancials",
    question:
      "What are your current monthly sales, expenses, and approximate net profit?",
  },
  {
    key: "operatingCosts",
    question:
      "What are your major operating costs—raw material, labour, electricity, fuel, transport, maintenance, etc.?",
  },
  {
    key: "powerSourceAndIssues",
    question:
      "What is your current power source, how much do you spend on electricity/fuel, and how do power cuts or voltage issues affect your work?",
  },
  {
    key: "requiredImprovementOrSolution",
    question:
      "What improvement or solution do you need most to increase production, reduce cost/labour, improve quality, or increase income?",
  },
  {
    key: "loansAndSpaceDetails",
    question:
      "Is there any existing loan? If yes, how much EMI? Is the enterprise in own space or rental space?",
  },
  {
    key: "futureScaleAndSupport",
    question:
      "What is your expected future scale—production, income, products or market—and what support/technology would help you achieve it?",
  },

  { key: "expectedSolution", 
    question: 
    "What solution do you expect to address the identified challenges or improve your enterprise?",
   }, 
   {
     key: "identifiedSolution", 
     question:
      "What solution was identified on the field based on the participant's needs and assessment?",
     },
];

const implementationStatuses = [
  "Proposed",
  "Approved",
  "Procurement",
  "Installation",
  "Operational",
  "Delayed",
  "Cancelled",
  "Modified",
  "Closed",
];

const priorities = ["High", "Medium", "Low"];

const teamDecisions = [
  "DECIDE",
  "ACCEPT",
  "MODIFY",
  "REJECT",
  "DEFER",
];

const emptyAssessment = {
  livelihoodAndProcess: "",
  difficultActivity: "",
  productionCapacityAndSeasonality: "",
  machinesAndManualActivities: "",
  monthlyFinancials: "",
  operatingCosts: "",
  powerSourceAndIssues: "",
  requiredImprovementOrSolution: "",
  loansAndSpaceDetails: "",
  futureScaleAndSupport: "",
  documents: {
    sitePhotos: [],
    machineryPhotos: [],
    productPhotos: [],
    electricityBill: null,
  },
  geolocation: null,
};

const indicatorOptions = [
  "Production (kg/cycle)",
  "Monthly income (₹)",
  "Energy consumption (kWh)",
  "Energy expenditure (₹/month)",
  "Diesel consumption (L/month)",
  "Processing volume (kg)",
  "Productivity (yield/acre)",
  "Working hours (hrs/day)",
  "Cost savings (₹/month)",
  "Post-harvest loss (%)",
  "Capacity utilisation (%)",
];

type TabKey =
  | "profile"
  | "assessment"
  | "solution"
  | "implementation"
  | "champion"
  | "whatsapp";

const tabs: {
  key: TabKey;
  label: string;
  description: string;
  icon: any;
}[] = [
  {
    key: "profile",
    label: "Profile",
    description: "Participant information",
    icon: UserRound,
  },
  {
    key: "assessment",
    label: "Detailed Assessment",
    description: "Enterprise assessment",
    icon: ClipboardList,
  },
  {
    key: "solution",
    label: "Solution & Design",
    description: "Gaps and interventions",
    icon: Route,
  },
  {
    key: "implementation",
    label: "Implementation",
    description: "Track actual progress",
    icon: CheckCircle2,
  },
  {
    key: "champion",
    label: "Champion",
    description: "Champion workflow",
    icon: UserRound,
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    description: "Conversation history",
    icon: MessageCircle,
  },
];

export function ParticipantProfilePage() {
  const { id } = useParams();

  const [p, setP] = useState<any>(null);
  const [q, setQ] = useState<any[]>([]);
  const [wa, setWa] = useState<any[]>([]);

  const [assessment, setAssessment] = useState<any>(emptyAssessment);
  const [deletingFileKey, setDeletingFileKey] =
  useState<string | null>(null);

  const [solutionDesign, setSolutionDesign] = useState<any>({
    gaps: [],
    interventions: [],
    indicators: [],
  });

  const [implementation, setImplementation] = useState<any>({
    interventions: [],
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [assessmentSaving, setAssessmentSaving] = useState(false);

  
  const [solutionSaving, setSolutionSaving] = useState(false);
  const [implementationSaving, setImplementationSaving] =
    useState(false);
const [listeningField, setListeningField] = useState<string | null>(null);
const [speechSupported, setSpeechSupported] = useState(true);
  useEffect(() => {
    if (!id) return;

    setBusy(true);
    setError("");

    Promise.all([
      api.get(`/participants/${id}`),
      api.get("/participant-questions"),
      api.get(`/whatsapp/participants/${id}/interactions`),
      api.get(`/participant-journey/${id}/assessment`),
      api.get(`/participant-journey/${id}/solution-design`),
      api.get(`/participant-journey/${id}/implementation`),
    ])
      .then(
        ([
          participantRes,
          questionsRes,
          whatsappRes,
          assessmentRes,
          solutionRes,
          implementationRes,
        ]) => {
          setP(participantRes.data?.data);
          setQ(questionsRes.data?.data || []);
          setWa(whatsappRes.data?.data || []);

          setAssessment(
            assessmentRes.data?.data?.assessment || emptyAssessment
          );

          setSolutionDesign(
            solutionRes.data?.data?.solutionDesign || {
              gaps: [],
              interventions: [],
              indicators: [],
            }
          );

          setImplementation(
            implementationRes.data?.data?.implementation || {
              interventions: [],
            }
          );
        }
      )
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setBusy(false));
  }, [id]);

  const update = (patch: any) => {
    setBusy(true);
    setError("");

    api
      .patch(`/participants/${id}`, patch)
      .then((r) => setP(r.data?.data))
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setBusy(false));
  };

  const removeParticipant = async () => {
    if (
      !id ||
      !window.confirm(
        `Delete participant "${p?.name || "this participant"}"? This will soft-delete the record and remove it from active participant lists.`
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      await api.delete(`/participants/${id}`);
      window.location.href = "/admin/participants";
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  const saveAssessment = async (
    nextAssessment: any,
    nextStatus?: string
  ) => {
    if (!id) return;

    setAssessmentSaving(true);
    setError("");

    try {
      const payload = {
        ...nextAssessment,
        ...(nextStatus ? { status: nextStatus } : {}),
      };

      const response = await api.patch(
        `/participant-journey/${id}/assessment`,
        payload
      );

      setAssessment(
        response.data?.data?.assessment || nextAssessment
      );

      if (response.data?.data?.status) {
        setP((prev: any) =>
          prev
            ? {
                ...prev,
                assessmentStatus: response.data.data.status,
              }
            : prev
        );
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setAssessmentSaving(false);
    }
  };

  const startVoiceToText = (fieldKey: string) => {
  if (
    !("webkitSpeechRecognition" in window) &&
    !("SpeechRecognition" in window)
  ) {
    setSpeechSupported(false);
    setError("Voice to text is not supported in this browser.");
    return;
  }

  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  const recognition = new SpeechRecognition();

  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.lang = "en-IN";

  setListeningField(fieldKey);
  setError("");

  recognition.onresult = (event: any) => {
    const transcript =
      event.results?.[0]?.[0]?.transcript || "";

    if (transcript.trim()) {
      const currentText =
        String(assessment?.[fieldKey] || "").trim();

      const newText = currentText
        ? `${currentText} ${transcript.trim()}`
        : transcript.trim();

      updateAssessmentField(fieldKey, newText);
    }
  };

  recognition.onerror = () => {
    setError("Unable to capture voice. Please try again.");
    setListeningField(null);
  };

  recognition.onend = () => {
    setListeningField(null);
  };

  recognition.start();
};

  const deleteAssessmentDocument = async (
  docType:
    | "sitePhotos"
    | "machineryPhotos"
    | "productPhotos"
    | "otherDocuments"
    | "electricityBill",
  file: any
) => {
  if (!id || !file?.fileKey) return;

  const confirmed = window.confirm(
    `Delete "${file.fileName}"?`
  );

  if (!confirmed) return;

  setDeletingFileKey(file.fileKey);
  setError("");

  try {
    const response = await api.delete(
      `/participant-journey/${id}/assessment/documents`,
      {
        data: {
          docType,
          fileKey: file.fileKey,
        },
      }
    );

    const updatedDocuments =
      response.data?.data?.documents;

    setAssessment((prev: any) => ({
      ...prev,
      documents: updatedDocuments || prev.documents,
    }));
  } catch (e) {
    setError(errorMessage(e));
  } finally {
    setDeletingFileKey(null);
  }
};

  const updateAssessmentField = (
    key: string,
    value: string
  ) => {
    setAssessment((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const completeAssessment = async () => {
    const missingAnswers = assessmentQuestions.filter(
      (item) =>
        !String(assessment?.[item.key] || "").trim()
    );

    if (missingAnswers.length) {
      setError(
        "Please complete all 12 assessment questions before marking the assessment as completed."
      );
      return;
    }

    if (
      !assessment?.geolocation?.latitude ||
      !assessment?.geolocation?.longitude
    ) {
      setError(
        "Please capture participant geolocation before completing the assessment."
      );
      return;
    }

    setError("");

    await saveAssessment(assessment, "COMPLETED");
  };

  const captureAssessmentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          ...assessment,
          geolocation: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            capturedAt: new Date().toISOString(),
          },
        };

        setAssessment(next);
      },
      (geoError) => {
        setError(
          geoError.message ||
            "Unable to capture participant geolocation."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const addLocalDocument = async (
  type:
    | "sitePhotos"
    | "machineryPhotos"
    | "productPhotos"
    | "electricityBill"
    | "otherDocuments",
  files: FileList | null
) => {
  if (!files || !files.length || !id) return;

  setError("");

  try {
    const selectedFiles = Array.from(files);

    // Electricity bill = only one file
    if (type === "electricityBill" && selectedFiles.length > 1) {
      setError("Only one electricity bill can be uploaded.");
      return;
    }

    const formData = new FormData();

    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    formData.append("docType", type);

    const response = await api.post(
      `/participant-journey/${id}/assessment/documents`,
      formData
    );

    const uploadedDocuments =
      response.data?.data?.documents || [];

    setAssessment((prev: any) => {
      const currentDocuments = prev?.documents || {};

      if (type === "electricityBill") {
        return {
          ...prev,
          documents: {
            ...currentDocuments,
            electricityBill:
              uploadedDocuments[0] || null,
          },
        };
      }

      return {
        ...prev,
        documents: {
          ...currentDocuments,
          [type]: [
            ...(currentDocuments[type] || []),
            ...uploadedDocuments,
          ],
        },
      };
    });

    // Keep participant assessment status in sync
    if (response.data?.data?.assessmentStatus) {
      setP((prev: any) =>
        prev
          ? {
              ...prev,
              assessmentStatus:
                response.data.data.assessmentStatus,
            }
          : prev
      );
    }
  } catch (e) {
    setError(errorMessage(e));
  }
};

  const saveSolutionDesign = async (next: any) => {
    if (!id) return;

    setSolutionSaving(true);
    setError("");

    try {
      const response = await api.patch(
        `/participant-journey/${id}/solution-design`,
        next
      );

      setSolutionDesign(response.data?.data || next);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSolutionSaving(false);
    }
  };

  const addIntervention = async () => {
    if (!id) return;

    const intervention = {
      interventionType: "hard",
      title: "New intervention",
      specification: "",
      why: "",
      source: "",
      priority: "Medium",
      estimatedCost: null,
      leverageEndUserPercent: 30,
      leverageSelcoPercent: 70,
      teamDecision: "DECIDE",
      decisionRationale: "",
      addToInterventionPlan: false,
      status: "Proposed",
    };

    setSolutionSaving(true);
    setError("");

    try {
      const response = await api.post(
        `/participant-journey/${id}/solution-design/interventions`,
        {
          interventions: [intervention],
        }
      );

      setSolutionDesign((prev: any) => ({
        ...prev,
        interventions: [
          ...(prev.interventions || []),
          response.data?.data,
        ],
      }));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSolutionSaving(false);
    }
  };

  const updateIntervention = async (
    interventionId: string,
    patch: any
  ) => {
    if (!id) return;

    setSolutionSaving(true);
    setError("");

    try {
      const current =
        solutionDesign.interventions?.find(
          (item: any) =>
            String(item._id) === String(interventionId)
        );

      if (!current) return;

      const next = {
        ...current,
        ...patch,
      };

      await api.patch(
        `/participant-journey/${id}/solution-design/interventions/${interventionId}`,
        {
          interventions: [next],
        }
      );

      setSolutionDesign((prev: any) => ({
        ...prev,
        interventions: (prev.interventions || []).map(
          (item: any) =>
            String(item._id) === String(interventionId)
              ? next
              : item
        ),
      }));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSolutionSaving(false);
    }
  };

  const addIndicator = () => {
    const indicator = {
      name: indicatorOptions[0],
      baseline: "",
      target: "",
      current: "",
      dateMeasured: null,
    };

    const next = {
      ...solutionDesign,
      indicators: [
        ...(solutionDesign.indicators || []),
        indicator,
      ],
    };

    setSolutionDesign(next);
  };

  const saveIndicators = async () => {
    await saveSolutionDesign({
      gaps: solutionDesign.gaps || [],
      interventions: solutionDesign.interventions || [],
      indicators: solutionDesign.indicators || [],
    });
  };

  const createImplementation = async (
    interventionId: string
  ) => {
    if (!id) return;

    setImplementationSaving(true);
    setError("");

    try {
      const response = await api.post(
        `/participant-journey/${id}/implementation/${interventionId}`
      );

      const created = response.data?.data;

      setImplementation((prev: any) => ({
        ...prev,
        interventions: [
          ...(prev.interventions || []).filter(
            (item: any) =>
              String(item._id) !== String(created?._id)
          ),
          created,
        ],
      }));

      setP((prev: any) =>
        prev
          ? {
              ...prev,
              implementationStatus:
                prev.implementationStatus === "NOT_STARTED"
                  ? "PLANNED"
                  : prev.implementationStatus,
            }
          : prev
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setImplementationSaving(false);
    }
  };

  const updateImplementation = async (
    implementationId: string,
    patch: any
  ) => {
    if (!id) return;

    setImplementationSaving(true);
    setError("");

    try {
      await api.patch(
        `/participant-journey/${id}/implementation/${implementationId}`,
        patch
      );

      setImplementation((prev: any) => ({
        ...prev,
        interventions: (prev.interventions || []).map(
          (item: any) =>
            String(item._id) === String(implementationId)
              ? {
                  ...item,
                  ...patch,
                }
              : item
        ),
      }));

      const currentStatus = patch.currentStatus;

      if (currentStatus) {
        const map: Record<string, string> = {
          Proposed: "PLANNED",
          Approved: "APPROVED",
          Procurement: "IN_PROGRESS",
          Installation: "IN_PROGRESS",
          Operational: "IMPLEMENTED",
          Delayed: "IN_PROGRESS",
          Cancelled: "REJECTED",
          Modified: "IN_PROGRESS",
          Closed: "IMPLEMENTED",
        };

        setP((prev: any) =>
          prev
            ? {
                ...prev,
                implementationStatus:
                  map[currentStatus] ||
                  prev.implementationStatus,
              }
            : prev
        );
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setImplementationSaving(false);
    }
  };

  const answerMap = useMemo(
    () =>
      new Map(
        (p?.answers || []).map((a: any) => [
          String(a.questionId),
          a.answer,
        ])
      ),
    [p?.answers]
  );

  const assessmentAnsweredCount = useMemo(
    () =>
      assessmentQuestions.filter((item) =>
        String(assessment?.[item.key] || "").trim()
      ).length,
    [assessment]
  );

  const interventionPlanTotal = useMemo(
    () =>
      (solutionDesign.interventions || [])
        .filter((item: any) => item.addToInterventionPlan)
        .reduce(
          (sum: number, item: any) =>
            sum + (Number(item.estimatedCost) || 0),
          0
        ),
    [solutionDesign.interventions]
  );

  const implementationRecordedCount = useMemo(
    () =>
      (solutionDesign.interventions || []).filter(
        (planned: any) =>
          (implementation.interventions || []).some(
            (item: any) =>
              String(item.plannedInterventionId) ===
              String(planned._id)
          )
      ).length,
    [solutionDesign.interventions, implementation.interventions]
  );

  const activeTabData =
    tabs.find((tab) => tab.key === activeTab) || tabs[0];

  if (error && !p) {
    return <div className="error">{error}</div>;
  }

  if (!p) {
    return <div className="empty">Loading participant...</div>;
  }

  return (
    <div className="participant-profile-page">
      <style>{`
        .participant-profile-page {
          --pp-bg: #f6f7fb;
          --pp-card: #ffffff;
          --pp-border: #e6e8f0;
          --pp-text: #1f2430;
          --pp-muted: #6b7280;
          --pp-primary: #2563eb;
          --pp-primary-dark: #1d4ed8;
          --pp-green: #16a34a;
          --pp-green-bg: #ecfdf3;
          --pp-red: #dc2626;
          --pp-red-bg: #fef2f2;
          --pp-radius: 14px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
          color: var(--pp-text);
          background: var(--pp-bg);
          padding: 20px 24px 60px;
          max-width: 1180px;
          margin: 0 auto;
        }
        .participant-profile-page * { box-sizing: border-box; }

        /* ---- back / breadcrumb ---- */
        .participant-profile-page .profile-back {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 14px; font-size: 13px; color: var(--pp-muted);
        }
        .participant-profile-page .profile-back a {
          display: inline-flex; align-items: center; gap: 6px;
          color: var(--pp-muted); text-decoration: none; font-weight: 500;
        }
        .participant-profile-page .profile-back a:hover { color: var(--pp-primary); }
        .participant-profile-page .profile-id {
          background: var(--pp-card); border: 1px solid var(--pp-border);
          padding: 4px 10px; border-radius: 999px; font-size: 12px;
        }

        /* ---- error / empty ---- */
        .participant-profile-page .error {
          background: var(--pp-red-bg); color: var(--pp-red);
          border: 1px solid #fecaca; border-radius: 10px;
          padding: 10px 14px; margin: 12px 0; font-size: 13.5px;
        }
        .participant-profile-page .empty {
          text-align: center; color: var(--pp-muted);
          padding: 28px 16px; font-size: 13.5px;
          display: flex; flex-direction: column; align-items: center; gap: 6px;
        }
        .participant-profile-page .empty svg { color: #c4c9d4; margin-bottom: 4px; }
        .participant-profile-page .empty h3 { margin: 0; font-size: 15px; color: var(--pp-text); }

        /* ---- page header action row (buttons injected via PageHeader "action") ---- */
        .participant-profile-page .save-status {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 12.5px; color: var(--pp-muted); margin-right: 6px;
        }
        .participant-profile-page .saving-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--pp-primary); display: inline-block;
          animation: pp-pulse 1s infinite ease-in-out;
        }
        @keyframes pp-pulse { 0%,100% { opacity: .3 } 50% { opacity: 1 } }

        .participant-profile-page button {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          border-radius: 9px; border: 1px solid var(--pp-border);
          background: var(--pp-card); color: var(--pp-text);
          padding: 8px 14px; transition: all .15s ease;
        }
        .participant-profile-page button:hover:not(:disabled) {
          border-color: var(--pp-primary); color: var(--pp-primary-dark);
        }
        .participant-profile-page button:disabled { opacity: .55; cursor: not-allowed; }
        .participant-profile-page button.button-primary {
          background: var(--pp-primary); border-color: var(--pp-primary); color: #fff;
        }
        .participant-profile-page button.button-primary:hover:not(:disabled) {
          background: var(--pp-primary-dark); color: #fff;
        }

        /* ---- profile summary card ---- */
        .participant-profile-page .profile-summary {
          display: grid; grid-template-columns: 1.6fr 1fr 1fr 1fr;
          gap: 14px; background: var(--pp-card); border: 1px solid var(--pp-border);
          border-radius: var(--pp-radius); padding: 18px 20px; margin: 16px 0;
          box-shadow: 0 1px 2px rgba(16,24,40,.04);
        }
        .participant-profile-page .profile-identity {
          display: flex; align-items: center; gap: 12px;
        }
        .participant-profile-page .profile-avatar {
          width: 52px; height: 52px; border-radius: 50%;
          background: linear-gradient(135deg,#2563eb,#7c3aed);
          color: #fff; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .participant-profile-page .profile-identity strong { font-size: 16px; display: block; }
        .participant-profile-page .profile-identity > div > span {
          color: var(--pp-muted); font-size: 13px;
        }
        .participant-profile-page .tag-row { display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap; }
        .participant-profile-page .tag {
          font-size: 11.5px; font-weight: 600; padding: 3px 9px;
          border-radius: 999px; background: #eef1f8; color: #475066;
          display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;
        }
        .participant-profile-page .tag.green { background: var(--pp-green-bg); color: var(--pp-green); }
        .participant-profile-page .summary-metric {
          border-left: 1px solid var(--pp-border); padding-left: 14px;
          display: flex; flex-direction: column; justify-content: center; gap: 2px;
        }
        .participant-profile-page .summary-metric small { color: var(--pp-muted); font-size: 11.5px; text-transform: uppercase; letter-spacing: .03em; }
        .participant-profile-page .summary-metric strong { font-size: 14.5px; }

        /* ---- tab bar ---- */
        .participant-profile-page .participant-profile-tabs {
          background: var(--pp-card); border: 1px solid var(--pp-border);
          border-radius: var(--pp-radius); margin-bottom: 18px; overflow: hidden;
          box-shadow: 0 1px 2px rgba(16,24,40,.04);
        }
        .participant-profile-page .participant-profile-tabs-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px; border-bottom: 1px solid var(--pp-border);
        }
        .participant-profile-page .tabs-eyebrow {
          display: block; font-size: 11px; text-transform: uppercase;
          letter-spacing: .05em; color: var(--pp-muted); margin-bottom: 2px;
        }
        .participant-profile-page .participant-profile-tabs-header strong { font-size: 15px; }
        .participant-profile-page .tabs-current-step {
          font-size: 12px; color: var(--pp-muted); background: var(--pp-bg);
          padding: 4px 10px; border-radius: 999px;
        }
        .participant-profile-page .participant-profile-tabs-scroll { overflow-x: auto; }
        .participant-profile-page .participant-profile-tabs-inner {
          display: flex; gap: 4px; padding: 10px;
        }
        .participant-profile-page .participant-profile-tab {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 12px; border-radius: 10px; border: 1px solid transparent;
          background: transparent; white-space: nowrap; flex-shrink: 0;
        }
        .participant-profile-page .participant-profile-tab:hover:not(.active) {
          background: var(--pp-bg); border-color: transparent; color: var(--pp-text);
        }
        .participant-profile-page .participant-profile-tab.active {
          background: #eef2ff; border-color: #c7d2fe; color: var(--pp-primary-dark);
        }
        .participant-profile-page .participant-tab-number {
          width: 20px; height: 20px; border-radius: 50%; background: var(--pp-bg);
          color: var(--pp-muted); font-size: 11px; font-weight: 700;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .participant-profile-page .participant-profile-tab.active .participant-tab-number {
          background: var(--pp-primary); color: #fff;
        }
        .participant-profile-page .participant-tab-icon { display: flex; color: var(--pp-muted); }
        .participant-profile-page .participant-profile-tab.active .participant-tab-icon { color: var(--pp-primary); }
        .participant-profile-page .participant-tab-content { display: flex; flex-direction: column; text-align: left; line-height: 1.25; }
        .participant-profile-page .participant-tab-content strong { font-size: 12.5px; }
        .participant-profile-page .participant-tab-content small { font-size: 10.5px; color: var(--pp-muted); }
        .participant-profile-page .participant-tab-arrow { margin-left: 2px; color: var(--pp-primary); }

        /* ---- generic "Section" content wrappers (grids, fields) ---- */
        .participant-profile-page .section-note {
          font-size: 12.5px; color: var(--pp-muted); display: inline-flex; align-items: center; gap: 5px;
        }
        .participant-profile-page .profile-grid,
        .participant-profile-page .profile-edit-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px 18px;
        }
        .participant-profile-page .profile-field {
          background: var(--pp-bg); border: 1px solid var(--pp-border);
          border-radius: 10px; padding: 10px 12px;
        }
        .participant-profile-page .profile-field small { display: block; color: var(--pp-muted); font-size: 11.5px; margin-bottom: 3px; }
        .participant-profile-page .profile-field b { font-size: 13.5px; font-weight: 600; }
        .participant-profile-page .field-full { grid-column: 1 / -1; }

        .participant-profile-page label { display: flex; flex-direction: column; gap: 5px; font-size: 12.5px; color: var(--pp-muted); }
        .participant-profile-page label.checkbox-field { flex-direction: row; align-items: center; gap: 8px; }
        .participant-profile-page input,
        .participant-profile-page select,
        .participant-profile-page textarea {
          font-family: inherit; font-size: 13.5px; color: var(--pp-text);
          border: 1px solid var(--pp-border); border-radius: 9px;
          padding: 8px 10px; background: #fff; outline: none;
          transition: border-color .15s ease, box-shadow .15s ease;
        }
        .participant-profile-page input:focus,
        .participant-profile-page select:focus,
        .participant-profile-page textarea:focus {
          border-color: var(--pp-primary); box-shadow: 0 0 0 3px rgba(37,99,235,.12);
        }
        .participant-profile-page select[multiple] { min-height: 96px; }
        .participant-profile-page textarea { resize: vertical; }
        .participant-profile-page input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--pp-primary); }

        /* ---- solution tracks ---- */
        .participant-profile-page .solution-tracks { display: flex; flex-direction: column; gap: 10px; }
        .participant-profile-page .solution-track {
          display: flex; align-items: center; gap: 12px;
          border: 1px solid var(--pp-border); border-radius: 12px; padding: 10px 14px;
        }
        .participant-profile-page .track-icon {
          width: 34px; height: 34px; border-radius: 9px; background: #eef2ff;
          color: var(--pp-primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .participant-profile-page .track-main { flex: 1; display: flex; flex-direction: column; }
        .participant-profile-page .track-main span { font-size: 12.5px; color: var(--pp-muted); }

        /* ---- registration answers ---- */
        .participant-profile-page .answers-list { display: flex; flex-direction: column; gap: 10px; }
        .participant-profile-page .answer-row {
          border: 1px solid var(--pp-border); border-radius: 10px; padding: 10px 14px;
        }
        .participant-profile-page .answer-row > div { display: flex; align-items: center; justify-content: space-between; }
        .participant-profile-page .answer-row small { font-weight: 600; color: var(--pp-text); font-size: 13px; }
        .participant-profile-page .answer-row > div > span { font-size: 11px; color: var(--pp-muted); }
        .participant-profile-page .answer-row p { margin: 6px 0 0; color: var(--pp-muted); font-size: 13px; }

        /* ---- assessment ---- */
        .participant-profile-page .assessment-intro p { color: var(--pp-muted); font-size: 13px; margin: 0; }
        .participant-profile-page .assessment-list { display: flex; flex-direction: column; gap: 14px; margin-top: 16px; }
        .participant-profile-page .assessment-question {
          border: 1px solid var(--pp-border); border-radius: 12px; padding: 14px 16px; background: var(--pp-bg);
        }
        .participant-profile-page .assessment-question-header { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
        .participant-profile-page .assessment-question-header strong { font-size: 13.5px; line-height: 1.4; }
        .participant-profile-page .assessment-number {
          width: 22px; height: 22px; border-radius: 50%; background: #dde2ee; color: #475066;
          font-size: 11.5px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .participant-profile-page .assessment-question textarea { width: 100%; background: #fff; }
        .participant-profile-page .assessment-actions { display: flex; gap: 10px; margin-top: 16px; }

        /* ---- documents ---- */
        .participant-profile-page .document-upload-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-top: 12px;
        }
        .participant-profile-page .document-upload {
          border: 1.5px dashed var(--pp-border); border-radius: 12px; padding: 16px 14px;
          display: flex; flex-direction: column; align-items: center; text-align: center; gap: 4px;
          color: var(--pp-muted); cursor: pointer; position: relative; background: var(--pp-bg);
        }
        .participant-profile-page .document-upload:hover { border-color: var(--pp-primary); color: var(--pp-primary-dark); }
        .participant-profile-page .document-upload strong { color: var(--pp-text); font-size: 13px; display: flex; align-items: center; gap: 6px; }
        .participant-profile-page .document-upload span { font-size: 11px; }
        .participant-profile-page .document-upload input[type="file"] {
          position: absolute; inset: 0; opacity: 0; cursor: pointer;
        }
        .participant-profile-page .assessment-document-preview {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-top: 14px;
        }
        .participant-profile-page .document-list {
          border: 1px solid var(--pp-border); border-radius: 10px; padding: 10px 12px;
          display: flex; flex-direction: column; gap: 4px; font-size: 12px;
        }
        .participant-profile-page .document-list strong { font-size: 12.5px; }
        .participant-profile-page .document-list span { color: var(--pp-muted); }

        /* ---- geolocation ---- */
        .participant-profile-page .geolocation-box {
          display: flex; align-items: center; gap: 24px; flex-wrap: wrap;
          border: 1px solid var(--pp-border); border-radius: 12px; padding: 14px 16px; background: var(--pp-bg);
        }
        .participant-profile-page .geolocation-box > div small { display: block; color: var(--pp-muted); font-size: 11px; }
        .participant-profile-page .geolocation-box > div strong { font-size: 13.5px; }

        /* ---- solution & design: gaps / interventions ---- */
        .participant-profile-page .journey-list { display: flex; flex-direction: column; gap: 12px; }
        .participant-profile-page .journey-card { border: 1px solid var(--pp-border); border-radius: 12px; padding: 12px 14px; }
        .participant-profile-page .journey-card-header { margin-bottom: 8px; }
        .participant-profile-page .journey-card textarea { width: 100%; }

        .participant-profile-page .intervention-list { display: flex; flex-direction: column; gap: 16px; }
        .participant-profile-page .intervention-card {
          border: 1px solid var(--pp-border); border-radius: var(--pp-radius); padding: 16px 18px; background: var(--pp-card);
        }
        .participant-profile-page .intervention-header {
          display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;
        }
        .participant-profile-page .intervention-header h3 { margin: 4px 0 0; font-size: 15px; }
        .participant-profile-page .intervention-footer { margin-top: 14px; display: flex; justify-content: flex-end; }

        /* ---- tables ---- */
        .participant-profile-page .table-responsive { overflow-x: auto; border: 1px solid var(--pp-border); border-radius: 12px; }
        .participant-profile-page .journey-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 560px; }
        .participant-profile-page .journey-table th {
          text-align: left; background: var(--pp-bg); color: var(--pp-muted);
          font-size: 11.5px; text-transform: uppercase; letter-spacing: .03em;
          padding: 10px 12px; border-bottom: 1px solid var(--pp-border);
        }
        .participant-profile-page .journey-table td {
          padding: 10px 12px; border-bottom: 1px solid var(--pp-border);
        }
        .participant-profile-page .journey-table tr:last-child td { border-bottom: none; }
        .participant-profile-page .journey-table td input,
        .participant-profile-page .journey-table td select { width: 100%; }
        .participant-profile-page .journey-table tfoot td { background: var(--pp-bg); font-size: 13.5px; }

        /* ---- implementation ---- */
        .participant-profile-page .implementation-notice {
          display: flex; gap: 8px; align-items: flex-start; background: #eff6ff; border: 1px solid #bfdbfe;
          color: #1e40af; border-radius: 10px; padding: 10px 14px; margin-bottom: 16px; font-size: 12.5px;
        }
        .participant-profile-page .implementation-list { display: flex; flex-direction: column; gap: 14px; }
        .participant-profile-page .implementation-card { border: 1px solid var(--pp-border); border-radius: var(--pp-radius); padding: 16px 18px; }
        .participant-profile-page .planned-header h3 { margin: 4px 0; font-size: 15px; }
        .participant-profile-page .planned-header p { margin: 0; font-size: 12.5px; color: var(--pp-muted); }

        /* ---- whatsapp ---- */
        .participant-profile-page .conversation-summary {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(150px,1fr)); gap: 12px;
          background: var(--pp-bg); border: 1px solid var(--pp-border); border-radius: 12px; padding: 12px 16px; margin-bottom: 16px;
        }
        .participant-profile-page .conversation-summary small { display: block; color: var(--pp-muted); font-size: 11px; }
        .participant-profile-page .conversation-summary strong { font-size: 13.5px; }
        .participant-profile-page .conversation-list { display: flex; flex-direction: column; gap: 10px; max-height: 480px; overflow-y: auto; padding-right: 4px; }
        .participant-profile-page .conversation-message {
          max-width: 70%; border-radius: 12px; padding: 10px 14px; font-size: 13px;
          background: #f1f2f6; align-self: flex-start;
        }
        .participant-profile-page .conversation-message.outbound { background: #dbeafe; align-self: flex-end; }
        .participant-profile-page .conversation-message > div { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 4px; }
        .participant-profile-page .conversation-message b { font-size: 11.5px; }
        .participant-profile-page .conversation-message > div span { font-size: 10.5px; color: var(--pp-muted); }
        .participant-profile-page .conversation-message p { margin: 0; line-height: 1.4; }
        .participant-profile-page .conversation-message small { display: block; margin-top: 6px; color: var(--pp-muted); font-size: 10px; }

        @media (max-width: 720px) {
          .participant-profile-page { padding: 14px; }
          .participant-profile-page .profile-summary { grid-template-columns: 1fr 1fr; }
          .participant-profile-page .summary-metric { border-left: none; border-top: 1px solid var(--pp-border); padding-left: 0; padding-top: 10px; }
        }

        .image-preview-modal {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.75);
}

.image-preview-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview-content img {
  display: block;
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 8px;
  background: #fff;
}

.image-preview-close {
  position: absolute;
  top: -14px;
  right: -14px;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
  background: #fff;
  color: #111;
  z-index: 2;
}
      `}</style>

      {/* ================================================================
          BACK / BREADCRUMB
      ================================================================ */}

      <div className="profile-back">
        <Link to="/admin/participants">
          <ArrowLeft size={15} />
          <span>Back to participants</span>
        </Link>

        <span className="profile-id">
          Participant ID · {String(p._id).slice(-8)}
        </span>
      </div>

      {/* ================================================================
          PAGE HEADER
      ================================================================ */}

      <PageHeader
        eyebrow="Participant Profile"
        title={p.name || "Unnamed participant"}
        description={`${status(
          p.participantStatus
        )} · Registered ${date(p.createdAt)}`}
        action={
          <>
            <span className="save-status">
              {busy ? (
                <>
                  <span className="saving-dot" />
                  Saving…
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  Up to date
                </>
              )}
            </span>

            {!editing ? (
              <button
                disabled={busy}
                onClick={() => setEditing(true)}
              >
                <Pencil size={16} />
                Edit Profile
              </button>
            ) : (
              <button
                disabled={busy}
                onClick={() => setEditing(false)}
              >
                <X size={16} />
                Done Editing
              </button>
            )}

            <button
              disabled={busy}
              onClick={() => void removeParticipant()}
            >
              <Trash2 size={16} />
              Delete participant
            </button>

            <button
              className="button-primary"
              disabled={busy}
              onClick={() =>
                api
                  .post(
                    `/whatsapp/participants/${id}/send-post-event`
                  )
                  .then(() =>
                    alert(
                      "Post-event WhatsApp template queued/sent."
                    )
                  )
                  .catch((e) =>
                    setError(errorMessage(e))
                  )
              }
            >
              <MessageCircle size={16} />
              Send post-event WhatsApp
            </button>
          </>
        }
      />

      {error && <div className="error">{error}</div>}

      {/* ================================================================
          PROFILE SUMMARY
      ================================================================ */}

      <div className="profile-summary">
        <div className="profile-identity">
          <div className="profile-avatar">
            <UserRound size={28} />
          </div>

          <div>
            <strong>{p.name || "Unnamed"}</strong>
            <span>{p.mobile || "No mobile"}</span>

            <div className="tag-row">
              <span className="tag green">
                {p.whatsappAvailable
                  ? "WhatsApp available"
                  : "WhatsApp unavailable"}
              </span>

              <span className="tag">
                {String(
                  p.preferredLanguage || "mr"
                ).toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="summary-metric">
          <small>Assessment</small>
          <strong>{status(p.assessmentStatus)}</strong>
        </div>

        <div className="summary-metric">
          <small>Implementation</small>
          <strong>{status(p.implementationStatus)}</strong>
        </div>

        <div className="summary-metric">
          <small>Registration</small>
          <strong>{status(p.registrationMethod)}</strong>
        </div>
      </div>

      {/* ================================================================
          IMPROVED TAB NAVIGATION
      ================================================================ */}

      <div className="participant-profile-tabs">
        <div className="participant-profile-tabs-header">
          <div>
            <span className="tabs-eyebrow">
              Participant journey
            </span>

            <strong>{activeTabData.label}</strong>
          </div>

          <span className="tabs-current-step">
            Step{" "}
            {tabs.findIndex(
              (tab) => tab.key === activeTab
            ) + 1}{" "}
            of {tabs.length}
          </span>
        </div>

        <div className="participant-profile-tabs-scroll">
          <div className="participant-profile-tabs-inner">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;

              return (
                <button
                  type="button"
                  key={tab.key}
                  className={`participant-profile-tab ${
                    active ? "active" : ""
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                  aria-current={
                    active ? "page" : undefined
                  }
                >
                  <span className="participant-tab-number">
                    {index + 1}
                  </span>

                  <span className="participant-tab-icon">
                    <Icon size={17} strokeWidth={2} />
                  </span>

                  <span className="participant-tab-content">
                    <strong>{tab.label}</strong>
                    <small>{tab.description}</small>
                  </span>

                  {active && (
                    <ChevronRight
                      className="participant-tab-arrow"
                      size={15}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================================================================
          TAB 1 — PROFILE
      ================================================================ */}

      {activeTab === "profile" && (
        <>
          <Section
            title="Basic profile"
            action={
              <span className="section-note">
                Captured at registration
              </span>
            }
          >
            <div className="profile-grid">
              {[
                ["Name", p.name],
                ["Mobile", p.mobile],
                ["Gender", status(p.gender)],
                ["Place", p.location],
                [
                  "Organisation type",
                  status(p.organizationType),
                ],
                ["Organisation", p.organizationName],
                ["Sector", status(p.sector)],
                [
                  "Language",
                  String(
                    p.preferredLanguage || "mr"
                  ).toUpperCase(),
                ],
                [
                  "WhatsApp",
                  p.whatsappAvailable
                    ? "Available"
                    : "Not available",
                ],
                ["Registered", date(p.createdAt)],
              ].map(([a, b]) => (
                <div
                  className="profile-field"
                  key={a as string}
                >
                  <small>{a}</small>
                  <b>{b || "—"}</b>
                </div>
              ))}
            </div>
          </Section>

          <Section
            title="Post-event requirements"
            action={
              <span className="section-note">
                Update when participant needs are identified
              </span>
            }
          >
            <div className="profile-edit-grid">
              <label>
                <small>Livelihood category</small>

                <select
                  multiple
                  value={p.livelihoodCategories || []}
                  onChange={(e) =>
                    update({
                      livelihoodCategories:
                        selectValues(e),
                    })
                  }
                >
                  <option value="AGRICULTURE">
                    Agriculture
                  </option>
                  <option value="ANIMAL_HUSBANDRY">
                    Animal Husbandry
                  </option>
                  <option value="MICRO_BUSINESS">
                    Micro-business / small business
                  </option>
                  <option value="OTHER">
                    Other
                  </option>
                </select>
              </label>

              <label>
                <small>Value chains / interests</small>

                <input
                  defaultValue={(
                    p.valueChains || []
                  ).join(", ")}
                  onBlur={(e) =>
                    update({
                      valueChains: e.target.value
                        .split(",")
                        .map((x: string) => x.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </label>

              <label>
                <small>Support / solutions</small>

                <select
                  multiple
                  value={p.supportSolutions || []}
                  onChange={(e) =>
                    update({
                      supportSolutions:
                        selectValues(e),
                    })
                  }
                >
                  {solutions.map((x) => (
                    <option key={x} value={x}>
                      {solutionLabels[x]}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <small>
                  Specific solution / provider
                </small>

                <input
                  defaultValue={
                    p.specificSolutionProviderInterest ||
                    ""
                  }
                  onBlur={(e) =>
                    update({
                      specificSolutionProviderInterest:
                        e.target.value,
                      specificSolutionProviderInterested:
                        Boolean(e.target.value),
                    })
                  }
                />
              </label>

              <label>
                <small>Next actions</small>

                <select
                  multiple
                  value={p.nextActions || []}
                  onChange={(e) =>
                    update({
                      nextActions: selectValues(e),
                    })
                  }
                >
                  {[
                    [
                      "UNDERSTAND_SOLUTION",
                      "Understand solution better",
                    ],
                    [
                      "SPEAK_TO_PROVIDER",
                      "Speak to solution provider",
                    ],
                    [
                      "GET_COST_ESTIMATE",
                      "Get a cost estimate",
                    ],
                    [
                      "EXPLORE_FINANCING",
                      "Explore financing options",
                    ],
                    [
                      "DISCUSS_IMPLEMENTATION",
                      "Discuss implementation",
                    ],
                    ["OTHER", "Other"],
                  ].map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <small>What was useful</small>

                <select
                  multiple
                  value={p.usefulAtMela || []}
                  onChange={(e) =>
                    update({
                      usefulAtMela:
                        selectValues(e),
                    })
                  }
                >
                  {[
                    [
                      "TECHNOLOGIES_MACHINERY",
                      "Technologies / machinery showcased",
                    ],
                    [
                      "SOLAR_ENERGY",
                      "Solar / energy solutions",
                    ],
                    [
                      "SOLUTION_PROVIDERS",
                      "Interaction with solution providers",
                    ],
                    [
                      "SPEAKERS_SESSIONS",
                      "Speakers / sessions",
                    ],
                    [
                      "DEMONSTRATIONS",
                      "Demonstrations",
                    ],
                    [
                      "FINANCING_SUPPORT",
                      "Information on financing / support",
                    ],
                    [
                      "NETWORKING",
                      "Networking with other participants",
                    ],
                    ["OTHER", "Other"],
                  ].map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field-full">
                <small>
                  What could have been better?
                </small>

                <textarea
                  rows={4}
                  defaultValue={
                    p.whatCouldBeBetter || ""
                  }
                  onBlur={(e) =>
                    update({
                      whatCouldBeBetter:
                        e.target.value,
                    })
                  }
                />
              </label>
            </div>
          </Section>

          <Section
            title="Assessment & implementation"
            action={
              <span className="section-note">
                <ClipboardList size={14} />
                Operational tracking
              </span>
            }
          >
            <div className="profile-edit-grid">
              <label>
                <small>
                  Participant assessment status
                </small>

                <select
                  value={
                    p.assessmentStatus ||
                    "NOT_STARTED"
                  }
                  onChange={(e) =>
                    update({
                      assessmentStatus:
                        e.target.value,
                    })
                  }
                >
                  <option>NOT_STARTED</option>
                  <option>IN_PROGRESS</option>
                  <option>COMPLETED</option>
                </select>
              </label>

              <label>
                <small>Implementation status</small>

                <select
                  value={
                    p.implementationStatus ||
                    "NOT_STARTED"
                  }
                  onChange={(e) =>
                    update({
                      implementationStatus:
                        e.target.value,
                    })
                  }
                >
                  {[
                    "NOT_STARTED",
                    "PLANNED",
                    "APPROVED",
                    "IN_PROGRESS",
                    "IMPLEMENTED",
                    "DEFERRED",
                    "REJECTED",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>

              <label className="field-full">
                <small>Provided solutions</small>

                <input
                  defaultValue={(
                    p.recommendedSolutions || []
                  ).join(", ")}
                  onBlur={(e) =>
                    update({
                      recommendedSolutions:
                        e.target.value
                          .split(",")
                          .map(
                            (x: string) =>
                              x.trim()
                          )
                          .filter(Boolean),
                    })
                  }
                />
              </label>

              <label className="field-full">
                <small>Provided solutions notes</small>

                <textarea
                  rows={5}
                  defaultValue={
                    p.implementationNotes || ""
                  }
                  onBlur={(e) =>
                    update({
                      implementationNotes:
                        e.target.value,
                    })
                  }
                />
              </label>
            </div>
          </Section>

          <Section
            title="Solution journey"
            action={
              <span className="section-note">
                <Route size={14} />
                Existing solution tracks
              </span>
            }
          >
            <div className="solution-tracks">
              {(p.solutionTracks || []).map(
                (track: any, index: number) => (
                  <div
                    className="solution-track"
                    key={index}
                  >
                    <div className="track-icon">
                      <Route size={17} />
                    </div>

                    <div className="track-main">
                      <strong>
                        {solutionLabels[
                          track.solution
                        ] || track.solution}
                      </strong>

                      <span>
                        {track.requirement ||
                          track.valueChain ||
                          "Requirement not specified"}
                      </span>
                    </div>

                    <select
                      value={
                        track.status ||
                        "IDENTIFIED"
                      }
                      onChange={(e) => {
                        const next = [
                          ...(p.solutionTracks || []),
                        ];

                        next[index] = {
                          ...next[index],
                          status:
                            e.target.value,
                          updatedAt:
                            new Date().toISOString(),
                        };

                        update({
                          solutionTracks:
                            next,
                        });
                      }}
                    >
                      {[
                        "IDENTIFIED",
                        "RECOMMENDED",
                        "MATCHED",
                        "PLANNED",
                        "IN_PROGRESS",
                        "IMPLEMENTED",
                        "DEFERRED",
                        "REJECTED",
                      ].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </div>
                )
              )}

              {!(p.solutionTracks || []).length && (
                <div className="empty">
                  No existing solution tracks yet.
                </div>
              )}
            </div>
          </Section>

          <Section
            title="Registration answers"
            action={
              <span className="section-note">
                <Languages size={14} />
                Original registration responses
              </span>
            }
          >
            <div className="answers-list">
              {q.map((question: any) => (
                <div
                  className="answer-row"
                  key={question._id}
                >
                  <div>
                    <small>
                      {question.question}
                    </small>

                    <span>
                      {question.required
                        ? "Required"
                        : "Optional"}
                    </span>
                  </div>

                  <p>
                    {answerMap.get(
                      String(question._id)
                    ) || "—"}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}

      {/* ================================================================
          TAB 2 — DETAILED ASSESSMENT
      ================================================================ */}

      {activeTab === "assessment" && (
        <>
          <Section
            title="Detailed participant assessment"
            action={
              <span className="section-note">
                {assessmentAnsweredCount} of{" "}
                {assessmentQuestions.length} answered ·
                Status:{" "}
                <strong>
                  {status(
                    p.assessmentStatus ||
                      "NOT_STARTED"
                  )}
                </strong>
              </span>
            }
          >
            <div className="assessment-intro">
              <p>
                Capture the participant's detailed
                enterprise information. This assessment
                is separate from the original registration
                questionnaire.
              </p>

              <div
                className="assessment-progress-track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={assessmentQuestions.length}
                aria-valuenow={assessmentAnsweredCount}
                style={{
                  width: "100%",
                  height: 8,
                  borderRadius: 999,
                  background: "rgba(0,0,0,0.08)",
                  overflow: "hidden",
                  marginTop: 10,
                }}
              >
                <div
                  className="assessment-progress-fill"
                  style={{
                    width: `${Math.round(
                      (assessmentAnsweredCount /
                        assessmentQuestions.length) *
                        100
                    )}%`,
                    height: "100%",
                    borderRadius: 999,
                    background:
                      assessmentAnsweredCount ===
                      assessmentQuestions.length
                        ? "#16a34a"
                        : "#2563eb",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>

            <div className="assessment-list">
              {assessmentQuestions.map(
                (item, index) => {
                  const answered = Boolean(
                    String(
                      assessment?.[item.key] || ""
                    ).trim()
                  );

                  return (
                  <div
                    className="assessment-question"
                    key={item.key}
                  >
                    <div className="assessment-question-header">
                      <span
                        className="assessment-number"
                        style={
                          answered
                            ? {
                                background: "#16a34a",
                                color: "#fff",
                              }
                            : undefined
                        }
                        title={
                          answered
                            ? "Answered"
                            : "Not answered yet"
                        }
                      >
                        {answered ? (
                          <CheckCircle2 size={13} />
                        ) : (
                          index + 1
                        )}
                      </span>

                      <strong>{item.question}</strong>
                    </div>

                    <textarea
                      rows={5}
                      value={
                        assessment?.[item.key] ||
                        ""
                      }
                      onChange={(e) =>
                        updateAssessmentField(
                          item.key,
                          e.target.value
                        )
                      }
                      placeholder="Enter participant response..."
                    />

                     <button
    type="button"
    onClick={() => startVoiceToText(item.key)}
    disabled={listeningField === item.key}
  >
    {listeningField === item.key
      ? "Listening..."
      : "🎙️ Voice to Text"}
  </button>
                  </div>
                  );
                }
              )}
            </div>

            <div className="assessment-actions">
              <button
                disabled={assessmentSaving}
                onClick={() =>
                  saveAssessment(
                    assessment,
                    "IN_PROGRESS"
                  )
                }
              >
                <Save size={16} />
                {assessmentSaving
                  ? "Saving..."
                  : "Save Assessment"}
              </button>

              <button
                className="button-primary"
                disabled={assessmentSaving}
                onClick={() =>
                  void completeAssessment()
                }
              >
                <CheckCircle2 size={16} />
                Complete Assessment
              </button>
            </div>
          </Section>

          <Section
            title="Mandatory documents"
            action={
              <span className="section-note">
                Multiple photos supported
              </span>
            }
          >
            <div className="document-upload-grid">
              <label className="document-upload">
                <Upload size={20} />
                <strong>
                  Site photos
                  {Boolean(
                    assessment?.documents?.sitePhotos
                      ?.length
                  ) && (
                    <span className="tag green">
                      {
                        assessment.documents.sitePhotos
                          .length
                      }
                    </span>
                  )}
                </strong>
                <span>
                  Upload multiple site photos
                </span>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) =>
                    addLocalDocument(
                      "sitePhotos",
                      e.target.files
                    )
                  }
                />
              </label>

              <label className="document-upload">
                <Upload size={20} />
                <strong>
                  Machinery photos
                  {Boolean(
                    assessment?.documents
                      ?.machineryPhotos?.length
                  ) && (
                    <span className="tag green">
                      {
                        assessment.documents
                          .machineryPhotos.length
                      }
                    </span>
                  )}
                </strong>
                <span>
                  Upload multiple machinery photos
                </span>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) =>
                    addLocalDocument(
                      "machineryPhotos",
                      e.target.files
                    )
                  }
                />
              </label>

              <label className="document-upload">
                <Upload size={20} />
                <strong>
                  Product photos
                  {Boolean(
                    assessment?.documents
                      ?.productPhotos?.length
                  ) && (
                    <span className="tag green">
                      {
                        assessment.documents
                          .productPhotos.length
                      }
                    </span>
                  )}
                </strong>
                <span>
                  Upload multiple product photos
                </span>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) =>
                    addLocalDocument(
                      "productPhotos",
                      e.target.files
                    )
                  }
                />
              </label>

              <label className="document-upload">
                <Upload size={20} />
                <strong>
                  Electricity bill
                  {Boolean(
                    assessment?.documents
                      ?.electricityBill
                  ) && (
                    <span className="tag green">
                      1
                    </span>
                  )}
                </strong>
                <span>
                  Upload electricity bill
                </span>

                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) =>
                    addLocalDocument(
                      "electricityBill",
                      e.target.files
                    )
                  }
                />
              </label>

    <label className="document-upload">
  <Upload size={20} />

  <strong>
    Other documents
    {Boolean(
      assessment?.documents?.otherDocuments?.length
    ) && (
      <span className="tag green">
        {assessment.documents.otherDocuments.length}
      </span>
    )}
  </strong>

  <span>
    Upload multiple supporting documents
  </span>

  <input
    type="file"
    accept="image/*,.pdf"
    multiple
    onChange={(e) =>
      addLocalDocument(
        "otherDocuments",
        e.target.files
      )
    }
  />
</label>
            </div>

            <div className="assessment-document-preview">
             <DocumentList
  title="Site photos"
  files={assessment?.documents?.sitePhotos || []}
  onDelete={(file) =>
    deleteAssessmentDocument("sitePhotos", file)
  }
  deletingFileKey={deletingFileKey}
  onView={(file) =>
    setPreviewImage(file.fileUrl)
  }
/>

<DocumentList
  title="Other documents"
  files={assessment?.documents?.otherDocuments || []}
  onDelete={(file) =>
    deleteAssessmentDocument("otherDocuments", file)
  }
  deletingFileKey={deletingFileKey}
  onView={(file) =>
    setPreviewImage(file.fileUrl)
  }
/>

           <DocumentList
  title="Machinery photos"
  files={assessment?.documents?.machineryPhotos || []}
  onDelete={(file) =>
    deleteAssessmentDocument("machineryPhotos", file)
  }
  deletingFileKey={deletingFileKey}
  onView={(file) =>
    setPreviewImage(file.fileUrl)
  }
/>

        <DocumentList
  title="Product photos"
  files={assessment?.documents?.productPhotos || []}
  onDelete={(file) =>
    deleteAssessmentDocument("productPhotos", file)
  }
  deletingFileKey={deletingFileKey}
  onView={(file) =>
    setPreviewImage(file.fileUrl)
  }
/>

              {assessment?.documents
                ?.electricityBill && (
                <div className="document-list">
                  <strong>
                    Electricity bill
                  </strong>

                  <span>
                    {
                      assessment.documents
                        .electricityBill.fileName
                    }
                  </span>
                </div>
              )}
            </div>
          </Section>

          <Section
            title="Geolocation"
            action={
              <span className="section-note">
                <MapPin size={14} />
                Site location
              </span>
            }
          >
            <div className="geolocation-box">
              {assessment?.geolocation ? (
                <>
                  <div>
                    <small>Latitude</small>
                    <strong>
                      {
                        assessment.geolocation
                          .latitude
                      }
                    </strong>
                  </div>

                  <div>
                    <small>Longitude</small>
                    <strong>
                      {
                        assessment.geolocation
                          .longitude
                      }
                    </strong>
                  </div>

                  <div>
                    <small>Captured</small>
                    <strong>
                      {date(
                        assessment.geolocation
                          .capturedAt
                      )}
                    </strong>
                  </div>
                </>
              ) : (
                <div className="empty">
                  Geolocation has not been captured.
                </div>
              )}

              <button
                onClick={
                  captureAssessmentLocation
                }
              >
                <MapPin size={16} />
                {assessment?.geolocation
                  ? "Recapture Location"
                  : "Capture Location"}
              </button>
            </div>
          </Section>

{previewImage && (
  <div
    className="image-preview-modal"
    onClick={() => setPreviewImage(null)}
  >
    <div
      className="image-preview-content"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="image-preview-close"
        onClick={() => setPreviewImage(null)}
        aria-label="Close image preview"
      >
        ×
      </button>

      <img
        src={previewImage}
        alt="Assessment document preview"
      />
    </div>
  </div>
)}


        </>
      )}

      {/* ================================================================
          TAB 3 — SOLUTION & DESIGN
      ================================================================ */}

      {activeTab === "solution" && (
        <>
          <Section
            title="Identified gaps"
            action={
              <span className="section-note">
                Problems identified during assessment
              </span>
            }
          >
            <div className="journey-list">
              {(solutionDesign.gaps || []).map(
                (gap: any, index: number) => (
                  <div
                    className="journey-card"
                    key={index}
                  >
                    <div className="journey-card-header">
                      <strong>{gap.name}</strong>
                    </div>

                    <textarea
                      rows={3}
                      value={
                        gap.description || ""
                      }
                      onChange={(e) => {
                        const gaps = [
                          ...(solutionDesign.gaps ||
                            []),
                        ];

                        gaps[index] = {
                          ...gaps[index],
                          description:
                            e.target.value,
                        };

                        setSolutionDesign(
                          (prev: any) => ({
                            ...prev,
                            gaps,
                          })
                        );
                      }}
                    />
                  </div>
                )
              )}

              {!(solutionDesign.gaps || []).length && (
                <div className="empty">
                  No gaps identified yet.
                </div>
              )}

              <button
                onClick={() =>
                  setSolutionDesign(
                    (prev: any) => ({
                      ...prev,
                      gaps: [
                        ...(prev.gaps || []),
                        {
                          name: "New identified gap",
                          description: "",
                        },
                      ],
                    })
                  )
                }
              >
                <Plus size={16} />
                Add identified gap
              </button>
            </div>
          </Section>

          <Section
            title="Recommended interventions"
            action={
              <span className="section-note">
                Hard and soft interventions
              </span>
            }
          >
            <div className="intervention-list">
              {(solutionDesign.interventions || []).map(
                (
                  intervention: any,
                  index: number
                ) => (
                  <div
                    className="intervention-card"
                    key={
                      intervention._id ||
                      index
                    }
                  >
                    <div className="intervention-header">
                      <div>
                        <span
                          className={`tag ${
                            intervention.interventionType ===
                            "hard"
                              ? "green"
                              : ""
                          }`}
                        >
                          {intervention.interventionType ||
                            "hard"}{" "}
                          intervention
                        </span>

                        <h3>
                          {intervention.title ||
                            "Untitled intervention"}
                        </h3>
                      </div>

                      <span className="tag">
                        {intervention.status ||
                          "Proposed"}
                      </span>
                    </div>

                    <div className="profile-edit-grid">
                      <label>
                        <small>
                          Intervention type
                        </small>

                        <select
                          value={
                            intervention.interventionType ||
                            "hard"
                          }
                          onChange={(e) =>
                            updateIntervention(
                              intervention._id,
                              {
                                interventionType:
                                  e.target.value,
                              }
                            )
                          }
                        >
                          <option value="hard">
                            Hard
                          </option>
                          <option value="soft">
                            Soft
                          </option>
                        </select>
                      </label>

                      <label>
                        <small>Priority</small>

                        <select
                          value={
                            intervention.priority ||
                            "Medium"
                          }
                          onChange={(e) =>
                            updateIntervention(
                              intervention._id,
                              {
                                priority:
                                  e.target.value,
                              }
                            )
                          }
                        >
                          {priorities.map(
                            (priority) => (
                              <option
                                key={priority}
                              >
                                {priority}
                              </option>
                            )
                          )}
                        </select>
                      </label>

                      <label className="field-full">
                        <small>
                          Recommended intervention
                        </small>

                        <input
                          value={
                            intervention.title ||
                            ""
                          }
                          onChange={(e) =>
                            setSolutionDesign(
                              (prev: any) => ({
                                ...prev,
                                interventions:
                                  prev.interventions.map(
                                    (
                                      item: any,
                                      itemIndex: number
                                    ) =>
                                      itemIndex ===
                                      index
                                        ? {
                                            ...item,
                                            title:
                                              e.target
                                                .value,
                                          }
                                        : item
                                  ),
                              })
                            )
                          }
                          onBlur={() =>
                            updateIntervention(
                              intervention._id,
                              {
                                title:
                                  intervention.title,
                              }
                            )
                          }
                        />
                      </label>

                      <label>
                        <small>
                          Estimated cost ₹
                        </small>

                        <input
                          type="number"
                          min="0"
                          value={
                            intervention.estimatedCost ??
                            ""
                          }
                          onChange={(e) =>
                            setSolutionDesign(
                              (prev: any) => ({
                                ...prev,
                                interventions:
                                  prev.interventions.map(
                                    (
                                      item: any,
                                      itemIndex: number
                                    ) =>
                                      itemIndex ===
                                      index
                                        ? {
                                            ...item,
                                            estimatedCost:
                                              e.target
                                                .value ===
                                              ""
                                                ? null
                                                : Number(
                                                    e.target
                                                      .value
                                                  ),
                                          }
                                        : item
                                  ),
                              })
                            )
                          }
                          onBlur={() =>
                            updateIntervention(
                              intervention._id,
                              {
                                estimatedCost:
                                  intervention.estimatedCost,
                              }
                            )
                          }
                        />
                      </label>

                      <label>
                        <small>
                          End-user leverage %
                        </small>

                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={
                            intervention.leverageEndUserPercent ??
                            30
                          }
                          onChange={(e) =>
                            setSolutionDesign(
                              (prev: any) => ({
                                ...prev,
                                interventions:
                                  prev.interventions.map(
                                    (
                                      item: any,
                                      itemIndex: number
                                    ) =>
                                      itemIndex ===
                                      index
                                        ? {
                                            ...item,
                                            leverageEndUserPercent:
                                              Number(
                                                e.target
                                                  .value
                                              ),
                                          }
                                        : item
                                  ),
                              })
                            )
                          }
                          onBlur={() =>
                            updateIntervention(
                              intervention._id,
                              {
                                leverageEndUserPercent:
                                  intervention.leverageEndUserPercent,
                              }
                            )
                          }
                        />
                      </label>

                      <label>
                        <small>
                          SELCO leverage %
                        </small>

                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={
                            intervention.leverageSelcoPercent ??
                            70
                          }
                          onChange={(e) =>
                            setSolutionDesign(
                              (prev: any) => ({
                                ...prev,
                                interventions:
                                  prev.interventions.map(
                                    (
                                      item: any,
                                      itemIndex: number
                                    ) =>
                                      itemIndex ===
                                      index
                                        ? {
                                            ...item,
                                            leverageSelcoPercent:
                                              Number(
                                                e.target
                                                  .value
                                              ),
                                          }
                                        : item
                                  ),
                              })
                            )
                          }
                          onBlur={() =>
                            updateIntervention(
                              intervention._id,
                              {
                                leverageSelcoPercent:
                                  intervention.leverageSelcoPercent,
                              }
                            )
                          }
                        />
                      </label>

                      <label>
                        <small>Team decision</small>

                        <select
                          value={
                            intervention.teamDecision ||
                            "DECIDE"
                          }
                          onChange={(e) =>
                            updateIntervention(
                              intervention._id,
                              {
                                teamDecision:
                                  e.target.value,
                              }
                            )
                          }
                        >
                          {teamDecisions.map(
                            (decision) => (
                              <option
                                key={decision}
                              >
                                {decision}
                              </option>
                            )
                          )}
                        </select>
                      </label>

                      <label>
                        <small>Status</small>

                        <select
                          value={
                            intervention.status ||
                            "Proposed"
                          }
                          onChange={(e) =>
                            updateIntervention(
                              intervention._id,
                              {
                                status:
                                  e.target.value,
                              }
                            )
                          }
                        >
                          {implementationStatuses.map(
                            (item) => (
                              <option
                                key={item}
                              >
                                {item}
                              </option>
                            )
                          )}
                        </select>
                      </label>

                      <label className="field-full">
                        <small>Specification</small>

                        <textarea
                          rows={3}
                          value={
                            intervention.specification ||
                            ""
                          }
                          onChange={(e) =>
                            setSolutionDesign(
                              (prev: any) => ({
                                ...prev,
                                interventions:
                                  prev.interventions.map(
                                    (
                                      item: any,
                                      itemIndex: number
                                    ) =>
                                      itemIndex ===
                                      index
                                        ? {
                                            ...item,
                                            specification:
                                              e.target
                                                .value,
                                          }
                                        : item
                                  ),
                              })
                            )
                          }
                          onBlur={() =>
                            updateIntervention(
                              intervention._id,
                              {
                                specification:
                                  intervention.specification,
                              }
                            )
                          }
                        />
                      </label>

                      <label className="field-full">
                        <small>Why</small>

                        <textarea
                          rows={3}
                          value={
                            intervention.why ||
                            ""
                          }
                          onChange={(e) =>
                            setSolutionDesign(
                              (prev: any) => ({
                                ...prev,
                                interventions:
                                  prev.interventions.map(
                                    (
                                      item: any,
                                      itemIndex: number
                                    ) =>
                                      itemIndex ===
                                      index
                                        ? {
                                            ...item,
                                            why: e.target
                                              .value,
                                          }
                                        : item
                                  ),
                              })
                            )
                          }
                          onBlur={() =>
                            updateIntervention(
                              intervention._id,
                              {
                                why:
                                  intervention.why,
                              }
                            )
                          }
                        />
                      </label>

                      <label className="field-full">
                        <small>Source</small>

                        <input
                          value={
                            intervention.source ||
                            ""
                          }
                          onChange={(e) =>
                            setSolutionDesign(
                              (prev: any) => ({
                                ...prev,
                                interventions:
                                  prev.interventions.map(
                                    (
                                      item: any,
                                      itemIndex: number
                                    ) =>
                                      itemIndex ===
                                      index
                                        ? {
                                            ...item,
                                            source:
                                              e.target
                                                .value,
                                          }
                                        : item
                                  ),
                              })
                            )
                          }
                          onBlur={() =>
                            updateIntervention(
                              intervention._id,
                              {
                                source:
                                  intervention.source,
                              }
                            )
                          }
                        />
                      </label>

                      <label className="field-full">
                        <small>
                          Decision rationale
                        </small>

                        <textarea
                          rows={4}
                          value={
                            intervention.decisionRationale ||
                            ""
                          }
                          onChange={(e) =>
                            setSolutionDesign(
                              (prev: any) => ({
                                ...prev,
                                interventions:
                                  prev.interventions.map(
                                    (
                                      item: any,
                                      itemIndex: number
                                    ) =>
                                      itemIndex ===
                                      index
                                        ? {
                                            ...item,
                                            decisionRationale:
                                              e.target
                                                .value,
                                          }
                                        : item
                                  ),
                              })
                            )
                          }
                          onBlur={() =>
                            updateIntervention(
                              intervention._id,
                              {
                                decisionRationale:
                                  intervention.decisionRationale,
                              }
                            )
                          }
                        />
                      </label>

                      <label className="checkbox-field">
                        <input
                          type="checkbox"
                          checked={Boolean(
                            intervention.addToInterventionPlan
                          )}
                          onChange={(e) =>
                            updateIntervention(
                              intervention._id,
                              {
                                addToInterventionPlan:
                                  e.target.checked,
                              }
                            )
                          }
                        />

                        <span>
                          Add to intervention plan
                        </span>
                      </label>
                    </div>

                    <div className="intervention-footer">
                      <button
                        className="button-primary"
                        disabled={
                          implementationSaving
                        }
                        onClick={() =>
                          void createImplementation(
                            intervention._id
                          )
                        }
                      >
                        <Route size={16} />
                        Add to Implementation
                      </button>
                    </div>
                  </div>
                )
              )}

              <button
                disabled={solutionSaving}
                onClick={() =>
                  void addIntervention()
                }
              >
                <Plus size={16} />
                Add recommended intervention
              </button>
            </div>
          </Section>

          <Section
            title="Intervention plan"
            action={
              <span className="section-note">
                Default leverage 30/70
              </span>
            }
          >
            <div className="table-responsive">
              <table className="journey-table">
                <thead>
                  <tr>
                    <th>Intervention</th>
                    <th>Type</th>
                    <th>Priority</th>
                    <th>Est. cost ₹</th>
                    <th>Leverage</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {(solutionDesign.interventions ||
                    [])
                    .filter(
                      (item: any) =>
                        item.addToInterventionPlan
                    )
                    .map(
                      (
                        item: any,
                        index: number
                      ) => (
                        <tr
                          key={
                            item._id ||
                            index
                          }
                        >
                          <td>{item.title}</td>
                          <td>
                            {item.interventionType}
                          </td>
                          <td>{item.priority}</td>
                          <td>
                            {item.estimatedCost ??
                              "—"}
                          </td>
                          <td>
                            {item.leverageEndUserPercent ??
                              30}
                            /
                            {item.leverageSelcoPercent ??
                              70}
                          </td>
                          <td>
                            {item.status ||
                              "Proposed"}
                          </td>
                        </tr>
                      )
                    )}

                  {!(solutionDesign.interventions ||
                    []).some(
                    (item: any) =>
                      item.addToInterventionPlan
                  ) && (
                    <tr>
                      <td
                        colSpan={6}
                        className="empty"
                      >
                        No interventions added
                        to the plan yet.
                      </td>
                    </tr>
                  )}
                </tbody>

                {(solutionDesign.interventions ||
                  []).some(
                  (item: any) =>
                    item.addToInterventionPlan
                ) && (
                  <tfoot>
                    <tr>
                      <td colSpan={3}>
                        <strong>Total</strong>
                      </td>
                      <td>
                        <strong>
                          ₹
                          {interventionPlanTotal.toLocaleString(
                            "en-IN"
                          )}
                        </strong>
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Section>

          <Section
            title="Indicators"
            action={
              <span className="section-note">
                Configurable by value chain
              </span>
            }
          >
            <div className="table-responsive">
              <table className="journey-table">
                <thead>
                  <tr>
                    <th>Indicator</th>
                    <th>Baseline</th>
                    <th>Target</th>
                    <th>Current</th>
                    <th>Date measured</th>
                  </tr>
                </thead>

                <tbody>
                  {(solutionDesign.indicators ||
                    []).map(
                      (
                        indicator: any,
                        index: number
                      ) => (
                        <tr key={index}>
                          <td>
                            <select
                              value={
                                indicator.name ||
                                ""
                              }
                              onChange={(e) => {
                                const indicators =
                                  [
                                    ...(solutionDesign.indicators ||
                                      []),
                                  ];

                                indicators[
                                  index
                                ] = {
                                  ...indicators[
                                    index
                                  ],
                                  name:
                                    e.target
                                      .value,
                                };

                                setSolutionDesign(
                                  (
                                    prev: any
                                  ) => ({
                                    ...prev,
                                    indicators,
                                  })
                                );
                              }}
                            >
                              {indicatorOptions.map(
                                (
                                  option
                                ) => (
                                  <option
                                    key={
                                      option
                                    }
                                  >
                                    {option}
                                  </option>
                                )
                              )}
                            </select>
                          </td>

                          <td>
                            <input
                              value={
                                indicator.baseline ||
                                ""
                              }
                              onChange={(e) => {
                                const indicators =
                                  [
                                    ...(solutionDesign.indicators ||
                                      []),
                                  ];

                                indicators[
                                  index
                                ] = {
                                  ...indicators[
                                    index
                                  ],
                                  baseline:
                                    e.target
                                      .value,
                                };

                                setSolutionDesign(
                                  (
                                    prev: any
                                  ) => ({
                                    ...prev,
                                    indicators,
                                  })
                                );
                              }}
                            />
                          </td>

                          <td>
                            <input
                              value={
                                indicator.target ||
                                ""
                              }
                              onChange={(e) => {
                                const indicators =
                                  [
                                    ...(solutionDesign.indicators ||
                                      []),
                                  ];

                                indicators[
                                  index
                                ] = {
                                  ...indicators[
                                    index
                                  ],
                                  target:
                                    e.target
                                      .value,
                                };

                                setSolutionDesign(
                                  (
                                    prev: any
                                  ) => ({
                                    ...prev,
                                    indicators,
                                  })
                                );
                              }}
                            />
                          </td>

                          <td>
                            <input
                              value={
                                indicator.current ||
                                ""
                              }
                              onChange={(e) => {
                                const indicators =
                                  [
                                    ...(solutionDesign.indicators ||
                                      []),
                                  ];

                                indicators[
                                  index
                                ] = {
                                  ...indicators[
                                    index
                                  ],
                                  current:
                                    e.target
                                      .value,
                                };

                                setSolutionDesign(
                                  (
                                    prev: any
                                  ) => ({
                                    ...prev,
                                    indicators,
                                  })
                                );
                              }}
                            />
                          </td>

                          <td>
                            <input
                              type="date"
                              value={
                                indicator.dateMeasured
                                  ? String(
                                      indicator.dateMeasured
                                    ).slice(
                                      0,
                                      10
                                    )
                                  : ""
                              }
                              onChange={(e) => {
                                const indicators =
                                  [
                                    ...(solutionDesign.indicators ||
                                      []),
                                  ];

                                indicators[
                                  index
                                ] = {
                                  ...indicators[
                                    index
                                  ],
                                  dateMeasured:
                                    e.target
                                      .value
                                      ? new Date(
                                          e.target.value
                                        ).toISOString()
                                      : null,
                                };

                                setSolutionDesign(
                                  (
                                    prev: any
                                  ) => ({
                                    ...prev,
                                    indicators,
                                  })
                                );
                              }}
                            />
                          </td>
                        </tr>
                      )
                    )}
                </tbody>
              </table>
            </div>

            <div className="assessment-actions">
              <button onClick={addIndicator}>
                <Plus size={16} />
                Add indicator
              </button>

              <button
                className="button-primary"
                disabled={solutionSaving}
                onClick={() =>
                  void saveIndicators()
                }
              >
                <Save size={16} />
                {solutionSaving
                  ? "Saving..."
                  : "Save indicators"}
              </button>
            </div>
          </Section>
        </>
      )}

      {/* ================================================================
          TAB 4 — IMPLEMENTATION
      ================================================================ */}

      {activeTab === "implementation" && (
        <>
          <Section
            title="Implementation"
            action={
              <span className="section-note">
                {implementationRecordedCount} of{" "}
                {(solutionDesign.interventions || [])
                  .length}{" "}
                recorded · Planned solution remains
                unchanged
              </span>
            }
          >
            <div className="implementation-notice">
              <strong>Important:</strong>

              <span>
                Implementation records what actually
                happened. The original Solution & Design
                plan is never overwritten.
              </span>
            </div>

            <div className="implementation-list">
              {(solutionDesign.interventions ||
                []).map(
                (
                  planned: any,
                  index: number
                ) => {
                  const actual =
                    (
                      implementation.interventions ||
                      []
                    ).find(
                      (item: any) =>
                        String(
                          item.plannedInterventionId
                        ) ===
                        String(planned._id)
                    );

                  return (
                    <div
                      className="implementation-card"
                      key={
                        planned._id ||
                        index
                      }
                    >
                      <div className="planned-header">
                        <span className="tag">
                          Planned
                        </span>

                        <h3>
                          {planned.title ||
                            "Untitled intervention"}
                        </h3>

                        <p>
                          {planned.specification ||
                            "Specification —"}
                          {" · "}
                          Est. ₹
                          {planned.estimatedCost ??
                            "—"}
                          {" · "}
                          Leverage{" "}
                          {planned.leverageEndUserPercent ??
                            30}
                          /
                          {planned.leverageSelcoPercent ??
                            70}
                        </p>
                      </div>

                      {!actual ? (
                        <div className="empty">
                          <p>
                            This planned
                            intervention has not
                            been added to the
                            implementation record.
                          </p>

                          <button
                            className="button-primary"
                            disabled={
                              implementationSaving
                            }
                            onClick={() =>
                              void createImplementation(
                                planned._id
                              )
                            }
                          >
                            <Plus size={16} />
                            Create implementation
                            record
                          </button>
                        </div>
                      ) : (
                        <div className="profile-edit-grid">
                          <div className="field-full">
                            <span className="tag green">
                              Implemented
                            </span>
                          </div>

                          <label>
                            <small>
                              Actual cost ₹
                            </small>

                            <input
                              type="number"
                              min="0"
                              value={
                                actual.actualCost ??
                                ""
                              }
                              onChange={(e) =>
                                setImplementation(
                                  (
                                    prev: any
                                  ) => ({
                                    ...prev,
                                    interventions:
                                      prev.interventions.map(
                                        (
                                          item: any
                                        ) =>
                                          String(
                                            item._id
                                          ) ===
                                          String(
                                            actual._id
                                          )
                                            ? {
                                                ...item,
                                                actualCost:
                                                  e
                                                    .target
                                                    .value ===
                                                  ""
                                                    ? null
                                                    : Number(
                                                        e
                                                          .target
                                                          .value
                                                      ),
                                              }
                                            : item
                                      ),
                                  })
                                )
                              }
                              onBlur={() =>
                                updateImplementation(
                                  actual._id,
                                  {
                                    actualCost:
                                      actual.actualCost,
                                  }
                                )
                              }
                            />
                          </label>

                          <label>
                            <small>
                              End-user contribution ₹
                            </small>

                            <input
                              type="number"
                              min="0"
                              value={
                                actual.endUserContribution ??
                                ""
                              }
                              onChange={(e) =>
                                setImplementation(
                                  (
                                    prev: any
                                  ) => ({
                                    ...prev,
                                    interventions:
                                      prev.interventions.map(
                                        (
                                          item: any
                                        ) =>
                                          String(
                                            item._id
                                          ) ===
                                          String(
                                            actual._id
                                          )
                                            ? {
                                                ...item,
                                                endUserContribution:
                                                  e
                                                    .target
                                                    .value ===
                                                  ""
                                                    ? null
                                                    : Number(
                                                        e
                                                          .target
                                                          .value
                                                      ),
                                              }
                                            : item
                                      ),
                                  })
                                )
                              }
                              onBlur={() =>
                                updateImplementation(
                                  actual._id,
                                  {
                                    endUserContribution:
                                      actual.endUserContribution,
                                  }
                                )
                              }
                            />
                          </label>

                          <label>
                            <small>
                              SELCO contribution ₹
                            </small>

                            <input
                              type="number"
                              min="0"
                              value={
                                actual.selcoContribution ??
                                ""
                              }
                              onChange={(e) =>
                                setImplementation(
                                  (
                                    prev: any
                                  ) => ({
                                    ...prev,
                                    interventions:
                                      prev.interventions.map(
                                        (
                                          item: any
                                        ) =>
                                          String(
                                            item._id
                                          ) ===
                                          String(
                                            actual._id
                                          )
                                            ? {
                                                ...item,
                                                selcoContribution:
                                                  e
                                                    .target
                                                    .value ===
                                                  ""
                                                    ? null
                                                    : Number(
                                                        e
                                                          .target
                                                          .value
                                                      ),
                                              }
                                            : item
                                      ),
                                  })
                                )
                              }
                              onBlur={() =>
                                updateImplementation(
                                  actual._id,
                                  {
                                    selcoContribution:
                                      actual.selcoContribution,
                                  }
                                )
                              }
                            />
                          </label>

                          <label>
                            <small>Vendor</small>

                            <input
                              value={
                                actual.vendorName ||
                                ""
                              }
                              onChange={(e) =>
                                setImplementation(
                                  (
                                    prev: any
                                  ) => ({
                                    ...prev,
                                    interventions:
                                      prev.interventions.map(
                                        (
                                          item: any
                                        ) =>
                                          String(
                                            item._id
                                          ) ===
                                          String(
                                            actual._id
                                          )
                                            ? {
                                                ...item,
                                                vendorName:
                                                  e
                                                    .target
                                                    .value,
                                              }
                                            : item
                                      ),
                                  })
                                )
                              }
                              onBlur={() =>
                                updateImplementation(
                                  actual._id,
                                  {
                                    vendorName:
                                      actual.vendorName,
                                  }
                                )
                              }
                            />
                          </label>

                          <label>
                            <small>
                              Procurement date
                            </small>

                            <input
                              type="date"
                              value={
                                actual.procurementDate
                                  ? String(
                                      actual.procurementDate
                                    ).slice(
                                      0,
                                      10
                                    )
                                  : ""
                              }
                              onChange={(e) =>
                                updateImplementation(
                                  actual._id,
                                  {
                                    procurementDate:
                                      e.target
                                        .value
                                        ? new Date(
                                            e.target.value
                                          ).toISOString()
                                        : null,
                                  }
                                )
                              }
                            />
                          </label>

                          <label>
                            <small>
                              Installation date
                            </small>

                            <input
                              type="date"
                              value={
                                actual.installationDate
                                  ? String(
                                      actual.installationDate
                                    ).slice(
                                      0,
                                      10
                                    )
                                  : ""
                              }
                              onChange={(e) =>
                                updateImplementation(
                                  actual._id,
                                  {
                                    installationDate:
                                      e.target
                                        .value
                                        ? new Date(
                                            e.target.value
                                          ).toISOString()
                                        : null,
                                  }
                                )
                              }
                            />
                          </label>

                          <label>
                            <small>
                              Operational date
                            </small>

                            <input
                              type="date"
                              value={
                                actual.operationalDate
                                  ? String(
                                      actual.operationalDate
                                    ).slice(
                                      0,
                                      10
                                    )
                                  : ""
                              }
                              onChange={(e) =>
                                updateImplementation(
                                  actual._id,
                                  {
                                    operationalDate:
                                      e.target
                                        .value
                                        ? new Date(
                                            e.target.value
                                          ).toISOString()
                                        : null,
                                  }
                                )
                              }
                            />
                          </label>

                          <label>
                            <small>
                              Current status
                            </small>

                            <select
                              value={
                                actual.currentStatus ||
                                "Proposed"
                              }
                              onChange={(e) =>
                                updateImplementation(
                                  actual._id,
                                  {
                                    currentStatus:
                                      e.target
                                        .value,
                                  }
                                )
                              }
                            >
                              {implementationStatuses.map(
                                (item) => (
                                  <option
                                    key={item}
                                  >
                                    {item}
                                  </option>
                                )
                              )}
                            </select>
                          </label>

                          <label className="checkbox-field">
                            <input
                              type="checkbox"
                              checked={Boolean(
                                actual.gpsSiteConfirmed
                              )}
                              onChange={(e) =>
                                updateImplementation(
                                  actual._id,
                                  {
                                    gpsSiteConfirmed:
                                      e.target
                                        .checked,
                                  }
                                )
                              }
                            />

                            <span>
                              GPS / site confirmed
                            </span>
                          </label>

                          <label>
                            <small>Latitude</small>

                            <input
                              type="number"
                              value={
                                actual.latitude ??
                                ""
                              }
                              onChange={(e) =>
                                updateImplementation(
                                  actual._id,
                                  {
                                    latitude:
                                      e.target
                                        .value ===
                                      ""
                                        ? null
                                        : Number(
                                            e.target
                                              .value
                                          ),
                                  }
                                )
                              }
                            />
                          </label>

                          <label>
                            <small>Longitude</small>

                            <input
                              type="number"
                              value={
                                actual.longitude ??
                                ""
                              }
                              onChange={(e) =>
                                updateImplementation(
                                  actual._id,
                                  {
                                    longitude:
                                      e.target
                                        .value ===
                                      ""
                                        ? null
                                        : Number(
                                            e.target
                                              .value
                                          ),
                                  }
                                )
                              }
                            />
                          </label>

                          <label className="field-full">
                            <small>
                              Reason for change
                              if implementation
                              differs from plan
                            </small>

                            <textarea
                              rows={4}
                              value={
                                actual.reasonForChange ||
                                ""
                              }
                              onChange={(e) =>
                                setImplementation(
                                  (
                                    prev: any
                                  ) => ({
                                    ...prev,
                                    interventions:
                                      prev.interventions.map(
                                        (
                                          item: any
                                        ) =>
                                          String(
                                            item._id
                                          ) ===
                                          String(
                                            actual._id
                                          )
                                            ? {
                                                ...item,
                                                reasonForChange:
                                                  e
                                                    .target
                                                    .value,
                                              }
                                            : item
                                      ),
                                  })
                                )
                              }
                              onBlur={() =>
                                updateImplementation(
                                  actual._id,
                                  {
                                    reasonForChange:
                                      actual.reasonForChange,
                                  }
                                )
                              }
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  );
                }
              )}

              {!(solutionDesign.interventions ||
                []).length && (
                <div className="empty">
                  No planned interventions yet.
                  Create them from the Solution &
                  Design tab.
                </div>
              )}
            </div>
          </Section>
        </>
      )}

      {/* ================================================================
          TAB 5 — CHAMPION
      ================================================================ */}

      {activeTab === "champion" && (
        <Section
          title="Champion"
          action={
            <span className="section-note">
              Coming in the next step
            </span>
          }
        >
          <div className="empty">
            <UserRound size={30} />

            <h3>Champion information</h3>

            <p>
              Champion functionality has not been
              implemented yet. This tab is reserved for
              the Champion workflow.
            </p>
          </div>
        </Section>
      )}

      {/* ================================================================
          TAB 6 — WHATSAPP
      ================================================================ */}

      {activeTab === "whatsapp" && (
        <Section
          title="WhatsApp conversation"
          action={
            <span className="section-note">
              <MessageCircle size={14} />{" "}
              {wa.length} interactions
            </span>
          }
        >
          <div className="whatsapp-journey">
            <div className="conversation-summary">
              <div>
                <small>Conversation step</small>

                <strong>
                  {status(
                    p.postEventStep ||
                      "NONE"
                  )}
                </strong>
              </div>

              <div>
                <small>WhatsApp status</small>

                <strong>
                  {status(
                    p.whatsappStatus ||
                      "PENDING"
                  )}
                </strong>
              </div>

              <div>
                <small>Last interaction</small>

                <strong>
                  {date(
                    p.lastWhatsAppInteractionAt
                  )}
                </strong>
              </div>
            </div>

            {wa.length ? (
              <div className="conversation-list">
                {[...wa]
                  .reverse()
                  .map((item: any) => (
                    <div
                      className={`conversation-message ${String(
                        item.direction || ""
                      ).toLowerCase()}`}
                      key={item._id}
                    >
                      <div>
                        <b>
                          {item.direction ===
                          "INBOUND"
                            ? "Participant"
                            : item.method ===
                              "ADMIN"
                            ? "Admin"
                            : "WhatsApp assistant"}
                        </b>

                        <span>
                          {status(
                            item.status
                          )}
                        </span>
                      </div>

                      <p>
                        {item.message ||
                          "—"}
                      </p>

                      <small>
                        {date(
                          item.createdAt
                        )}
                      </small>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="empty">
                No WhatsApp conversation yet.
              </div>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}




function DocumentList({
  title,
  files,
  onDelete,
  deletingFileKey,
  onView,
}: {
  title: string;
  files: any[];
  onDelete: (file: any) => void;
  deletingFileKey: string | null;
  onView: (file: any) => void;
}) {
  return (
    <div className="document-list">
      <strong>{title}</strong>

      {files?.length ? (
        files.map((file: any, index: number) => {
          const isDeleting =
            deletingFileKey === file.fileKey;

          return (
            <div
              key={`${file.fileKey || file.fileName}-${index}`}
              className="document-item"
            >
              <span>{file.fileName}</span>

              <div className="document-item-actions">
                {file.fileUrl && (
                  <button
                    type="button"
                    onClick={() => onView(file)}
                    disabled={isDeleting}
                  >
                    View
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onDelete(file)}
                  disabled={isDeleting}
                  title="Delete document"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          );
        })
      ) : (
        <span>No files selected.</span>
      )}
    </div>
  );
}

