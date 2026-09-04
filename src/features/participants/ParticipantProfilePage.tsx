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
  expectedSolution: "",
  identifiedSolution: "",


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



const [gapModalOpen, setGapModalOpen] = useState(false);
const [editingGapIndex, setEditingGapIndex] = useState<number | null>(null);
const [gapDraft, setGapDraft] = useState({
  name: "",
  description: "",
});

const [interventionModalOpen, setInterventionModalOpen] = useState(false);
const [editingInterventionId, setEditingInterventionId] = useState<string | null>(null);
const [interventionDraft, setInterventionDraft] = useState<any>(null);


const [implementationModalOpen, setImplementationModalOpen] =
  useState(false);

const [editingImplementation, setEditingImplementation] =
  useState<any>(null);


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
     assessment?.geolocation?.latitude == null ||
     assessment?.geolocation?.longitude == null
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

      return {
        ...prev,
        documents: {
          ...currentDocuments,
          [type]: [
            ...(Array.isArray(currentDocuments[type])
              ? currentDocuments[type]
              : currentDocuments[type]
                ? [currentDocuments[type]]
                : []),
            ...uploadedDocuments,
          ],
        },
      };
    });

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

const addGap = () => {
  const gap = {
    name: "",
    description: "",
  };

  setSolutionDesign((prev: any) => ({
    ...prev,
    gaps: [...(prev.gaps || []), gap],
  }));
};


const openAddGapModal = () => {
  setEditingGapIndex(null);
  setGapDraft({
    name: "",
    description: "",
  });
  setGapModalOpen(true);
};

const openEditGapModal = (index: number) => {
  const gap = solutionDesign.gaps?.[index];

  if (!gap) return;

  setEditingGapIndex(index);
  setGapDraft({
    name: gap.name || "",
    description: gap.description || "",
  });
  setGapModalOpen(true);
};

const saveGapFromModal = async () => {
  const gaps = [...(solutionDesign.gaps || [])];

  if (editingGapIndex === null) {
    gaps.push({
      name: gapDraft.name.trim(),
      description: gapDraft.description.trim(),
    });
  } else {
    gaps[editingGapIndex] = {
      ...gaps[editingGapIndex],
      name: gapDraft.name.trim(),
      description: gapDraft.description.trim(),
    };
  }

  await saveSolutionDesign({
    gaps,
    interventions: solutionDesign.interventions || [],
    indicators: solutionDesign.indicators || [],
  });

  setGapModalOpen(false);
};

const deleteGap = async (index: number) => {
  if (!id) return;

  const gap = solutionDesign.gaps?.[index];

  if (!gap) return;

  const confirmed = window.confirm(
    `Delete "${gap.name || "this identified gap"}"?`
  );

  if (!confirmed) return;

  const nextGaps = (solutionDesign.gaps || []).filter(
    (_: any, gapIndex: number) => gapIndex !== index
  );

  await saveSolutionDesign({
    gaps: nextGaps,
    interventions: solutionDesign.interventions || [],
    indicators: solutionDesign.indicators || [],
  });
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



const openEditInterventionModal = (intervention: any) => {
  setEditingInterventionId(intervention._id);

  setInterventionDraft({
    interventionType: intervention.interventionType || "hard",
    title: intervention.title || "",
    specification: intervention.specification || "",
    why: intervention.why || "",
    source: intervention.source || "",
    priority: intervention.priority || "Medium",
    estimatedCost: intervention.estimatedCost ?? null,
    leverageEndUserPercent:
      intervention.leverageEndUserPercent ?? 30,
    leverageSelcoPercent:
      intervention.leverageSelcoPercent ?? 70,
    teamDecision: intervention.teamDecision || "DECIDE",
    decisionRationale:
      intervention.decisionRationale || "",
    addToInterventionPlan:
      Boolean(intervention.addToInterventionPlan),
    status: intervention.status || "Proposed",
  });

  setInterventionModalOpen(true);
};

const closeInterventionModal = () => {
  if (solutionSaving) return;

  setInterventionModalOpen(false);
  setEditingInterventionId(null);
  setInterventionDraft(null);
};

const saveInterventionFromModal = async () => {
  if (!editingInterventionId || !interventionDraft) return;

  await updateIntervention(
    editingInterventionId,
    {
      interventionType:
        interventionDraft.interventionType,
      title: interventionDraft.title,
      specification:
        interventionDraft.specification,
      why: interventionDraft.why,
      source: interventionDraft.source,
      priority: interventionDraft.priority,
      estimatedCost:
        interventionDraft.estimatedCost,
      leverageEndUserPercent:
        interventionDraft.leverageEndUserPercent,
      leverageSelcoPercent:
        interventionDraft.leverageSelcoPercent,
      teamDecision:
        interventionDraft.teamDecision,
      decisionRationale:
        interventionDraft.decisionRationale,
      addToInterventionPlan:
        interventionDraft.addToInterventionPlan,
      status: interventionDraft.status,
    }
  );

  setInterventionModalOpen(false);
  setEditingInterventionId(null);
  setInterventionDraft(null);
};

const handleDocumentView = (file: any) => {
  if (!file?.fileUrl) return;

  if (file.fileType === "application/pdf") {
    window.open(file.fileUrl, "_blank", "noopener,noreferrer");
    return;
  }

  setPreviewImage(file.fileUrl);
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

  const deleteIntervention = async (
  interventionId: string
) => {
  if (!id || !interventionId) return;

  const intervention =
    solutionDesign.interventions?.find(
      (item: any) =>
        String(item._id) === String(interventionId)
    );

  if (!intervention) return;

  const confirmed = window.confirm(
    `Delete "${
      intervention.title || "this intervention"
    }"?`
  );

  if (!confirmed) return;

  setSolutionSaving(true);
  setError("");

  try {
    const nextInterventions =
      (solutionDesign.interventions || []).filter(
        (item: any) =>
          String(item._id) !==
          String(interventionId)
      );

    await saveSolutionDesign({
      gaps: solutionDesign.gaps || [],
      interventions: nextInterventions,
      indicators: solutionDesign.indicators || [],
    });

    setSolutionDesign((prev: any) => ({
      ...prev,
      interventions: nextInterventions,
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

  const deleteIndicator = async (index: number) => {
  if (!id) return;

  const indicator = solutionDesign.indicators?.[index];

  if (!indicator) return;

  const confirmed = window.confirm(
    `Delete "${indicator.name || "this indicator"}"?`
  );

  if (!confirmed) return;

  const nextIndicators = (
    solutionDesign.indicators || []
  ).filter(
    (_: any, indicatorIndex: number) =>
      indicatorIndex !== index
  );

  await saveSolutionDesign({
    gaps: solutionDesign.gaps || [],
    interventions:
      solutionDesign.interventions || [],
    indicators: nextIndicators,
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
  if (!id || !implementationId) return false;

  setImplementationSaving(true);
  setError("");

  try {
    const payload = {
      actualCost: patch.actualCost ?? null,
      endUserContribution: patch.endUserContribution ?? null,
      selcoContribution: patch.selcoContribution ?? null,
      vendorName: patch.vendorName || "",
      procurementDate: patch.procurementDate || null,
      installationDate: patch.installationDate || null,
      operationalDate: patch.operationalDate || null,
      currentStatus: patch.currentStatus || "Proposed",
      gpsSiteConfirmed: Boolean(patch.gpsSiteConfirmed),
      latitude: patch.latitude ?? null,
      longitude: patch.longitude ?? null,
      reasonForChange: patch.reasonForChange || "",
    };

    const response = await api.patch(
      `/participant-journey/${id}/implementation/${implementationId}`,
      payload
    );

    const updated = response.data?.data;

    setImplementation((prev: any) => ({
      ...prev,
      interventions: (prev.interventions || []).map(
        (item: any) =>
          String(item._id) === String(implementationId)
            ? {
                ...item,
                ...(updated || payload),
              }
            : item
      ),
    }));

    // if (payload.currentStatus) {
    //   const map: Record<string, string> = {
    //     Proposed: "PLANNED",
    //     Approved: "APPROVED",
    //     Procurement: "IN_PROGRESS",
    //     Installation: "IN_PROGRESS",
    //     Operational: "IMPLEMENTED",
    //     Delayed: "IN_PROGRESS",
    //     Cancelled: "REJECTED",
    //     Modified: "IN_PROGRESS",
    //     Closed: "IMPLEMENTED",
    //   };

    //   setP((prev: any) =>
    //     prev
    //       ? {
    //           ...prev,
    //           implementationStatus:
    //             map[payload.currentStatus] ||
    //             prev.implementationStatus,
    //         }
    //       : prev
    //   );
    // }

    return true;
  } catch (e) {
    console.error("Implementation update failed:", e);
    setError(errorMessage(e));
    return false;
  } finally {
    setImplementationSaving(false);
  }
};




const openImplementationModal = (actual: any) => {
  setEditingImplementation({
    ...actual,
  });

  setImplementationModalOpen(true);
};

const closeImplementationModal = () => {
  if (implementationSaving) return;

  setImplementationModalOpen(false);
  setEditingImplementation(null);
};


const saveImplementationModal = async () => {
  console.log("SAVE CLICKED");
  console.log("editingImplementation:", editingImplementation);
  console.log("participant id:", id);

  if (!id) {
    setError("Participant ID is missing.");
    return;
  }

  if (!editingImplementation) {
    setError("Implementation data is missing.");
    return;
  }

  const implementationId =
    editingImplementation._id ||
    editingImplementation.id;

  if (!implementationId) {
    console.error(
      "Implementation ID missing:",
      editingImplementation
    );

    setError("Implementation record ID is missing.");
    return;
  }

  const patch = {
    actualCost:
      editingImplementation.actualCost ?? null,

    endUserContribution:
      editingImplementation.endUserContribution ?? null,

    selcoContribution:
      editingImplementation.selcoContribution ?? null,

    vendorName:
      editingImplementation.vendorName || "",

    procurementDate:
      editingImplementation.procurementDate || null,

    installationDate:
      editingImplementation.installationDate || null,

    operationalDate:
      editingImplementation.operationalDate || null,

    currentStatus:
      editingImplementation.currentStatus || "Proposed",

    gpsSiteConfirmed:
      Boolean(editingImplementation.gpsSiteConfirmed),

    latitude:
      editingImplementation.latitude ?? null,

    longitude:
      editingImplementation.longitude ?? null,

    reasonForChange:
      editingImplementation.reasonForChange || "",
  };

  console.log("SENDING IMPLEMENTATION UPDATE");
  console.log("URL:", `/participant-journey/${id}/implementation/${implementationId}`);
  console.log("PAYLOAD:", patch);

  setImplementationSaving(true);
  setError("");

  try {
    const response = await api.patch(
      `/participant-journey/${id}/implementation/${implementationId}`,
      patch
    );

    console.log("IMPLEMENTATION SAVED:", response.data);

    const updated =
      response.data?.data || editingImplementation;

    setImplementation((prev: any) => ({
      ...prev,
      interventions: (prev.interventions || []).map(
        (item: any) =>
          String(item._id) === String(implementationId)
            ? {
                ...item,
                ...updated,
              }
            : item
      ),
    }));

    setImplementationModalOpen(false);
    setEditingImplementation(null);

  } catch (e) {
    console.error("IMPLEMENTATION SAVE ERROR:", e);
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
  /* ============================================================
     PARTICIPANT PROFILE — CLEAN UI SYSTEM
     ============================================================ */

  .participant-profile-page {
    --pp-bg: #f7f8fa;
    --pp-card: #ffffff;
    --pp-border: #eaecf0;
    --pp-border-dark: #d9dde5;
    --pp-text: #101828;
    --pp-text-soft: #344054;
    --pp-muted: #667085;
    --pp-light: #98a2b3;

    --pp-primary: #2563eb;
    --pp-primary-dark: #1d4ed8;
    --pp-primary-bg: #eff6ff;

    --pp-green: #12b76a;
    --pp-green-bg: #ecfdf3;

    --pp-red: #d92d20;
    --pp-red-bg: #fef3f2;

    --pp-radius: 12px;
    --pp-radius-sm: 9px;

    font-family:
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Inter,
      Roboto,
      Helvetica,
      Arial,
      sans-serif;

    color: var(--pp-text);
    background: var(--pp-bg);

    padding: 20px 24px 60px;
    max-width: 1180px;
    margin: 0 auto;
  }

  .participant-profile-page *,
  .participant-profile-page *::before,
  .participant-profile-page *::after {
    box-sizing: border-box;
  }


  /* ============================================================
     BACK / BREADCRUMB
     ============================================================ */

  .participant-profile-page .profile-back {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    min-height: 38px;
    margin-bottom: 16px;
  }

  .participant-profile-page .profile-back a {
    display: inline-flex;
    align-items: center;
    gap: 7px;

    padding: 7px 10px;

    color: #475467;
    background: #fff;

    border: 1px solid var(--pp-border);
    border-radius: 8px;

    text-decoration: none;
    font-size: 12px;
    font-weight: 600;

    transition:
      background .15s ease,
      border-color .15s ease,
      color .15s ease;
  }

  .participant-profile-page .profile-back a:hover {
    background: #f9fafb;
    border-color: var(--pp-border-dark);
    color: var(--pp-primary);
  }

  .participant-profile-page .profile-back a svg {
    flex-shrink: 0;
  }

  .participant-profile-page .profile-id {
    display: inline-flex;
    align-items: center;
    gap: 6px;

    padding: 6px 9px;

    color: #667085;
    background: #fff;

    border: 1px solid var(--pp-border);
    border-radius: 8px;

    font-size: 10.5px;
    font-weight: 500;

    white-space: nowrap;
  }


  /* ============================================================
     ERROR / EMPTY
     ============================================================ */

  .participant-profile-page .error {
    margin: 12px 0;
    padding: 10px 13px;

    color: var(--pp-red);
    background: var(--pp-red-bg);

    border: 1px solid #fecdca;
    border-radius: 9px;

    font-size: 12.5px;
  }

  .participant-profile-page .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;

    padding: 28px 16px;

    color: var(--pp-muted);
    text-align: center;
    font-size: 12px;
  }

  .participant-profile-page .empty svg {
    margin-bottom: 3px;
    color: #cbd0d9;
  }

  .participant-profile-page .empty h3 {
    margin: 0;
    color: var(--pp-text-soft);
    font-size: 14px;
  }


  /* ============================================================
     BUTTONS
     ============================================================ */

  .participant-profile-page button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    min-height: 34px;
    padding: 7px 11px;

    color: var(--pp-text-soft);
    background: #fff;

    border: 1px solid var(--pp-border-dark);
    border-radius: 8px;

    font-size: 12px;
    font-weight: 600;

    cursor: pointer;

    transition:
      background .15s ease,
      border-color .15s ease,
      color .15s ease,
      box-shadow .15s ease;
  }

  .participant-profile-page button:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #b8c0cc;
  }

  .participant-profile-page button:disabled {
    opacity: .55;
    cursor: not-allowed;
  }

  .participant-profile-page button.button-primary {
    color: #fff;
    background: var(--pp-primary);
    border-color: var(--pp-primary);
  }

  .participant-profile-page button.button-primary:hover:not(:disabled) {
    color: #fff;
    background: var(--pp-primary-dark);
    border-color: var(--pp-primary-dark);
  }

  .participant-profile-page .save-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;

    margin-right: 5px;

    color: var(--pp-muted);
    font-size: 11.5px;
  }

  .participant-profile-page .saving-dot {
    width: 6px;
    height: 6px;

    display: inline-block;

    border-radius: 50%;
    background: var(--pp-primary);

    animation: pp-pulse 1s infinite ease-in-out;
  }

  @keyframes pp-pulse {
    0%, 100% {
      opacity: .3;
    }

    50% {
      opacity: 1;
    }
  }


  /* ============================================================
     PROFILE SUMMARY
     ============================================================ */

  .participant-profile-page .profile-summary {
    display: grid;
    grid-template-columns:
      minmax(270px, 1.7fr)
      repeat(3, minmax(145px, 1fr));

    margin: 0 0 18px;

    background: var(--pp-card);

    border: 1px solid var(--pp-border);
    border-radius: 14px;

    overflow: hidden;

    box-shadow:
      0 1px 2px rgba(16, 24, 40, .03);
  }

  .participant-profile-page .profile-identity {
    display: flex;
    align-items: center;
    gap: 13px;

    min-width: 0;
    padding: 18px;
  }

  .participant-profile-page .profile-avatar {
    width: 50px;
    height: 50px;

    display: flex;
    align-items: center;
    justify-content: center;

    flex-shrink: 0;

    color: #fff;

    background: linear-gradient(
      135deg,
      #2563eb,
      #6366f1
    );

    border-radius: 12px;

    box-shadow:
      0 4px 10px rgba(37, 99, 235, .14);
  }

  .participant-profile-page .profile-identity > div:last-child {
    min-width: 0;
  }

  .participant-profile-page .profile-identity strong {
    display: block;

    color: var(--pp-text);
    font-size: 16px;
    line-height: 21px;
    font-weight: 700;

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .participant-profile-page .profile-identity > div > span {
    display: block;

    margin-top: 2px;

    color: var(--pp-muted);
    font-size: 12px;
    line-height: 17px;
  }

  .participant-profile-page .tag-row {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-wrap: wrap;

    margin-top: 7px;
  }

  .participant-profile-page .tag {
    display: inline-flex;
    align-items: center;

    min-height: 22px;
    padding: 2px 8px;

    color: #475467;
    background: #f2f4f7;

    border: 1px solid #eaecf0;
    border-radius: 999px;

    font-size: 9.5px;
    font-weight: 700;

    white-space: nowrap;
  }

  .participant-profile-page .tag.green {
    color: #087443;
    background: #ecfdf3;
    border-color: #abefc6;
  }

  .participant-profile-page .summary-metric {
    position: relative;

    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;

    min-width: 0;
    padding: 15px 16px;

    background: #fff;
    border-left: 1px solid var(--pp-border);
  }

  .participant-profile-page .summary-metric::before {
    content: "";

    position: absolute;
    left: 0;
    top: 16px;
    bottom: 16px;

    width: 2px;

    background: #e4e7ec;
    border-radius: 0 3px 3px 0;
  }

  .participant-profile-page .summary-metric small {
    color: var(--pp-light);

    font-size: 9px;
    font-weight: 700;

    text-transform: uppercase;
    letter-spacing: .07em;
  }

  .participant-profile-page .summary-metric strong {
    color: var(--pp-text-soft);

    font-size: 12.5px;
    line-height: 17px;
    font-weight: 700;

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }


  /* ============================================================
     PARTICIPANT JOURNEY STATUS
     ============================================================ */

  .participant-profile-page .profile-status-card {
    margin: 0 0 18px;

    background: #fff;

    border: 1px solid var(--pp-border);
    border-radius: 13px;

    overflow: hidden;

    box-shadow:
      0 1px 2px rgba(16, 24, 40, .03);
  }

  .participant-profile-page .profile-status-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 12px;

    padding: 13px 16px;

    border-bottom: 1px solid #f0f1f3;
  }

  .participant-profile-page .status-eyebrow {
    display: block;

    margin-bottom: 2px;

    color: var(--pp-light);

    font-size: 9px;
    font-weight: 700;

    text-transform: uppercase;
    letter-spacing: .08em;
  }

  .participant-profile-page .profile-status-header h3 {
    margin: 0;

    color: var(--pp-text);
    font-size: 14px;
    line-height: 19px;
    font-weight: 700;
  }

  .participant-profile-page .status-live {
    display: inline-flex;
    align-items: center;
    gap: 6px;

    padding: 4px 8px;

    color: #475467;
    background: #f9fafb;

    border: 1px solid #eaecf0;
    border-radius: 999px;

    font-size: 9.5px;
    font-weight: 600;
  }

  .participant-profile-page .status-live-dot {
    width: 5px;
    height: 5px;

    border-radius: 50%;
    background: #12b76a;

    box-shadow:
      0 0 0 3px #ecfdf3;
  }

  .participant-profile-page .profile-status-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
  }

  .participant-profile-page .profile-status-item {
    position: relative;

    display: flex;
    align-items: center;
    gap: 10px;

    min-width: 0;

    padding: 14px 16px;

    border-right: 1px solid #f0f1f3;
  }

  .participant-profile-page .profile-status-item:last-child {
    border-right: 0;
  }

  .participant-profile-page .status-icon {
    width: 34px;
    height: 34px;

    display: flex;
    align-items: center;
    justify-content: center;

    flex-shrink: 0;

    border-radius: 9px;
  }

  .participant-profile-page .status-blue {
    color: #2563eb;
    background: #eff6ff;
  }

  .participant-profile-page .status-purple {
    color: #7c3aed;
    background: #f5f3ff;
  }

  .participant-profile-page .status-green {
    color: #12b76a;
    background: #ecfdf3;
  }

  .participant-profile-page .status-orange {
    color: #f79009;
    background: #fff7ed;
  }

  .participant-profile-page .status-content {
    min-width: 0;
  }

  .participant-profile-page .status-content small {
    display: block;

    margin-bottom: 2px;

    color: var(--pp-light);

    font-size: 8.5px;
    line-height: 12px;
    font-weight: 700;

    text-transform: uppercase;
    letter-spacing: .06em;
  }

  .participant-profile-page .status-content strong {
    display: block;

    color: var(--pp-text-soft);

    font-size: 11.5px;
    line-height: 16px;
    font-weight: 700;

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }


  /* ============================================================
     TABS
     ============================================================ */

  .participant-profile-page .participant-profile-tabs {
    margin-bottom: 18px;

    background: #fff;

    border: 1px solid var(--pp-border);
    border-radius: 13px;

    overflow: hidden;

    box-shadow:
      0 1px 2px rgba(16, 24, 40, .03);
  }

  .participant-profile-page .participant-profile-tabs-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    padding: 12px 16px;

    border-bottom: 1px solid #f0f1f3;
  }

  .participant-profile-page .tabs-eyebrow {
    display: block;

    margin-bottom: 2px;

    color: var(--pp-light);

    font-size: 9px;
    font-weight: 700;

    text-transform: uppercase;
    letter-spacing: .08em;
  }

  .participant-profile-page .participant-profile-tabs-header strong {
    display: block;

    color: var(--pp-text);
    font-size: 13px;
    font-weight: 700;
  }

  .participant-profile-page .tabs-current-step {
    padding: 4px 8px;

    color: #667085;
    background: #f9fafb;

    border: 1px solid #eaecf0;
    border-radius: 999px;

    font-size: 9.5px;
    font-weight: 600;
  }

  .participant-profile-page .participant-profile-tabs-scroll {
    width: 100%;
    overflow: hidden;
  }

  .participant-profile-page .participant-profile-tabs-inner {
    display: grid;
    grid-template-columns: repeat(6, 1fr);

    width: 100%;
  }

  .participant-profile-page .participant-profile-tab {
    position: relative;

    display: flex;
    align-items: center;
    justify-content: center;

    gap: 7px;

    min-width: 0;
    min-height: 50px;

    padding: 9px 7px;

    color: #667085;
    background: #fff;

    border: 0;
    border-right: 1px solid #f0f1f3;
    border-radius: 0;

    font-size: 11px;

    white-space: nowrap;
  }

  .participant-profile-page .participant-profile-tab:last-child {
    border-right: 0;
  }

  .participant-profile-page .participant-profile-tab:hover:not(.active) {
    color: #344054;
    background: #fafbfc;
  }

  .participant-profile-page .participant-profile-tab.active {
    color: var(--pp-primary);
    background: #f8fbff;
  }

  .participant-profile-page .participant-profile-tab.active::after {
    content: "";

    position: absolute;

    left: 16px;
    right: 16px;
    bottom: 0;

    height: 2px;

    background: var(--pp-primary);
    border-radius: 2px 2px 0 0;
  }

  .participant-profile-page .participant-tab-number {
    width: 21px;
    height: 21px;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    flex-shrink: 0;

    color: #667085;
    background: #f2f4f7;

    border-radius: 50%;

    font-size: 9px;
    font-weight: 700;
  }

  .participant-profile-page
  .participant-profile-tab.active
  .participant-tab-number {
    color: #fff;
    background: var(--pp-primary);
  }

  .participant-profile-page .participant-tab-icon {
    display: inline-flex;
    align-items: center;

    color: #98a2b3;
  }

  .participant-profile-page
  .participant-profile-tab.active
  .participant-tab-icon {
    color: var(--pp-primary);
  }

  .participant-profile-page .participant-tab-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    min-width: 0;

    text-align: left;
    line-height: 1.2;
  }

  .participant-profile-page .participant-tab-content strong {
    color: inherit;

    font-size: 10.5px;
    font-weight: 700;

    overflow: hidden;
    text-overflow: ellipsis;
  }

  .participant-profile-page .participant-tab-content small,
  .participant-profile-page .participant-tab-arrow {
    display: none;
  }


  /* ============================================================
     SECTION CARDS
     ============================================================ */

  .participant-profile-page .section {
    background: #fff;
    border: 1px solid var(--pp-border);
    border-radius: 12px;
  }

  .participant-profile-page .section-header {
    padding: 13px 16px;
    border-bottom: 1px solid #f0f1f3;
  }


  /* ============================================================
     PROFILE FIELDS
     ============================================================ */

  .participant-profile-page .profile-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;

    border: 1px solid var(--pp-border);
    border-radius: 10px;

    overflow: hidden;
  }

  .participant-profile-page .profile-field {
    min-width: 0;
    padding: 12px 14px;

    background: #fff;
    border-right: 1px solid #f0f1f3;
    border-bottom: 1px solid #f0f1f3;
  }

  .participant-profile-page .profile-field:nth-child(3n) {
    border-right: 0;
  }

  .participant-profile-page .profile-field small {
    display: block;

    margin-bottom: 4px;

    color: #98a2b3;

    font-size: 9px;
    font-weight: 700;

    text-transform: uppercase;
    letter-spacing: .05em;
  }

  .participant-profile-page .profile-field b {
    display: block;

    color: #344054;

    font-size: 12px;
    line-height: 17px;
    font-weight: 600;

    overflow-wrap: anywhere;
  }


  /* ============================================================
     EDITABLE FIELDS
     ============================================================ */

  .participant-profile-page .profile-edit-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .participant-profile-page .profile-edit-grid label {
    display: flex;
    flex-direction: column;
    gap: 6px;

    min-width: 0;
  }

  .participant-profile-page .profile-edit-grid label > small {
    color: #475467;

    font-size: 10.5px;
    line-height: 14px;
    font-weight: 600;
  }

  .participant-profile-page .field-full {
    grid-column: 1 / -1;
  }

  .participant-profile-page input,
  .participant-profile-page select,
  .participant-profile-page textarea {
    width: 100%;

    color: #344054;
    background: #fff;

    border: 1px solid #dfe3e8;
    border-radius: 8px;

    outline: none;

    font-family: inherit;
    font-size: 12px;

    transition:
      border-color .15s ease,
      box-shadow .15s ease;
  }

  .participant-profile-page input,
  .participant-profile-page select {
    min-height: 36px;
    padding: 7px 10px;
  }

  .participant-profile-page textarea {
    min-height: 90px;
    padding: 9px 10px;
    resize: vertical;
    line-height: 1.5;
  }

  .participant-profile-page select[multiple] {
    min-height: 92px;
    padding: 5px;
  }

  .participant-profile-page input:focus,
  .participant-profile-page select:focus,
  .participant-profile-page textarea:focus {
    border-color: #84adff;

    box-shadow:
      0 0 0 3px rgba(37, 99, 235, .08);
  }

  .participant-profile-page input::placeholder,
  .participant-profile-page textarea::placeholder {
    color: #98a2b3;
  }


  /* ============================================================
     SOLUTION TRACKS
     ============================================================ */

  .participant-profile-page .solution-tracks {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .participant-profile-page .solution-track {
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr) 165px;
    align-items: center;

    gap: 11px;

    min-height: 58px;
    padding: 9px 11px;

    background: #fff;

    border: 1px solid var(--pp-border);
    border-radius: 10px;

    transition:
      background .15s ease,
      border-color .15s ease;
  }

  .participant-profile-page .solution-track:hover {
    background: #fcfcfd;
    border-color: #dfe3e8;
  }

  .participant-profile-page .track-icon {
    width: 36px;
    height: 36px;

    display: flex;
    align-items: center;
    justify-content: center;

    color: var(--pp-primary);
    background: #eff4ff;

    border-radius: 9px;
  }

  .participant-profile-page .track-main {
    display: flex;
    flex-direction: column;
    gap: 2px;

    min-width: 0;
  }

  .participant-profile-page .track-main strong {
    color: #344054;

    font-size: 12px;
    line-height: 16px;
    font-weight: 700;

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .participant-profile-page .track-main span {
    color: #98a2b3;

    font-size: 10.5px;
    line-height: 15px;

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .participant-profile-page .solution-track select {
    min-height: 34px;
  }


  /* ============================================================
     REGISTRATION ANSWERS
     ============================================================ */

  .participant-profile-page .answers-list {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .participant-profile-page .answer-row {
    padding: 11px 13px;

    background: #fff;

    border: 1px solid var(--pp-border);
    border-radius: 9px;
  }

  .participant-profile-page .answer-row > div {
    display: flex;
    align-items: center;
    justify-content: space-between;

    gap: 12px;
  }

  .participant-profile-page .answer-row small {
    color: #344054;

    font-size: 11.5px;
    line-height: 16px;
    font-weight: 700;
  }

  .participant-profile-page .answer-row > div > span {
    flex-shrink: 0;

    padding: 3px 7px;

    color: #667085;
    background: #f2f4f7;

    border-radius: 999px;

    font-size: 8.5px;
    font-weight: 700;
  }

  .participant-profile-page .answer-row p {
    margin: 6px 0 0;
    padding-top: 6px;

    color: #667085;

    border-top: 1px solid #f2f4f7;

    font-size: 11.5px;
    line-height: 18px;
  }


  /* ============================================================
     ASSESSMENT
     ============================================================ */

  .participant-profile-page .assessment-intro p {
    margin: 0;

    color: var(--pp-muted);

    font-size: 12px;
    line-height: 18px;
  }

  .participant-profile-page .assessment-list {
    display: flex;
    flex-direction: column;
    gap: 10px;

    margin-top: 14px;
  }

  .participant-profile-page .assessment-question {
    padding: 12px 14px;

    background: #fafbfc;

    border: 1px solid var(--pp-border);
    border-radius: 10px;
  }

  .participant-profile-page .assessment-question-header {
    display: flex;
    align-items: flex-start;

    gap: 9px;

    margin-bottom: 8px;
  }

  .participant-profile-page .assessment-question-header strong {
    color: #344054;

    font-size: 12px;
    line-height: 17px;
  }

  .participant-profile-page .assessment-number {
    width: 22px;
    height: 22px;

    display: flex;
    align-items: center;
    justify-content: center;

    flex-shrink: 0;

    color: #475467;
    background: #eaecf0;

    border-radius: 50%;

    font-size: 9.5px;
    font-weight: 700;
  }

  .participant-profile-page .assessment-question textarea {
    background: #fff;
  }

  .participant-profile-page .assessment-actions {
    display: flex;
    align-items: center;
    gap: 8px;

    margin-top: 14px;
  }


  /* ============================================================
     DOCUMENT UPLOAD
     ============================================================ */

  .participant-profile-page .document-upload-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 9px;

    margin-top: 10px;
  }

  .participant-profile-page .document-upload {
    position: relative;

    display: flex;
    flex-direction: column;
    align-items: center;

    gap: 4px;

    padding: 14px 12px;

    color: var(--pp-muted);
    background: #fafbfc;

    border: 1.5px dashed #d9dde5;
    border-radius: 10px;

    text-align: center;

    cursor: pointer;

    transition:
      border-color .15s ease,
      background .15s ease,
      color .15s ease;
  }

  .participant-profile-page .document-upload:hover {
    color: var(--pp-primary);
    background: #f8fbff;
    border-color: #84adff;
  }

  .participant-profile-page .document-upload strong {
    display: flex;
    align-items: center;
    gap: 5px;

    color: #344054;

    font-size: 11.5px;
  }

  .participant-profile-page .document-upload span {
    font-size: 9.5px;
  }

  .participant-profile-page .document-upload input[type="file"] {
    position: absolute;
    inset: 0;

    width: 100%;
    height: 100%;

    opacity: 0;
    cursor: pointer;
  }

  .participant-profile-page .assessment-document-preview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    gap: 9px;

    margin-top: 12px;
  }

  .participant-profile-page .document-list {
    display: flex;
    flex-direction: column;
    gap: 3px;

    padding: 9px 11px;

    border: 1px solid var(--pp-border);
    border-radius: 9px;

    font-size: 10.5px;
  }

  .participant-profile-page .document-list strong {
    color: #344054;
    font-size: 11px;
  }

  .participant-profile-page .document-list span {
    color: var(--pp-muted);
  }


  /* ============================================================
     GEOLOCATION
     ============================================================ */

  .participant-profile-page .geolocation-box {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;

    padding: 12px 14px;

    background: #fafbfc;

    border: 1px solid var(--pp-border);
    border-radius: 10px;
  }

  .participant-profile-page .geolocation-box > div small {
    display: block;

    margin-bottom: 2px;

    color: var(--pp-light);

    font-size: 9.5px;
  }

  .participant-profile-page .geolocation-box > div strong {
    color: #344054;
    font-size: 12px;
  }


 

  /* ============================================================
   SOLUTION & DESIGN — CLEAN UI
   ============================================================ */

.participant-profile-page .solution-gap-area,
.participant-profile-page .intervention-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ------------------------------------------------------------
   GAP CARDS
   ------------------------------------------------------------ */

.participant-profile-page .solution-gap-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.participant-profile-page .solution-gap-card {
  position: relative;
  padding: 16px;
  background: #fff;
  border: 1px solid var(--pp-border);
  border-radius: 14px;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.participant-profile-page .solution-gap-card:hover {
  border-color: #cfd5df;
  box-shadow: 0 8px 24px rgba(16, 24, 40, 0.06);
  transform: translateY(-1px);
}

.participant-profile-page .solution-gap-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.participant-profile-page .solution-card-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: #eff6ff;
  color: var(--pp-primary);
  font-size: 11px;
  font-weight: 800;
}

.participant-profile-page .solution-gap-card-actions {
  display: flex;
  align-items: center;
  gap: 5px;
}

.participant-profile-page .solution-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #667085;
  cursor: pointer;
}

.participant-profile-page .solution-icon-button:hover {
  background: #f8fafc;
  color: var(--pp-primary);
  border-color: #dbe2ea;
}

.participant-profile-page .solution-icon-button.danger:hover {
  background: var(--pp-red-bg);
  color: var(--pp-red);
  border-color: #fecaca;
}

.participant-profile-page .solution-gap-content {
  margin-top: 15px;
}

.participant-profile-page .solution-card-label {
  display: block;
  margin-bottom: 5px;
  color: #98a2b3;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.participant-profile-page .solution-gap-content h3 {
  margin: 0;
  color: #1f2937;
  font-size: 14px;
  line-height: 20px;
}

.participant-profile-page .solution-gap-content p {
  display: -webkit-box;
  overflow: hidden;
  margin: 7px 0 0;
  color: #667085;
  font-size: 12px;
  line-height: 18px;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.participant-profile-page .solution-card-edit {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--pp-primary);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.participant-profile-page .solution-card-edit:hover {
  color: var(--pp-primary-dark);
}

.participant-profile-page .solution-add-card-button {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 12px;
  padding: 13px 15px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  background: #fafbfc;
  color: #344054;
  text-align: left;
  cursor: pointer;
  transition: 0.18s ease;
}

.participant-profile-page .solution-add-card-button:hover {
  background: #f8fbff;
  border-color: #93c5fd;
}

.participant-profile-page .solution-add-card-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.participant-profile-page .solution-add-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 9px;
  background: #eff6ff;
  color: var(--pp-primary);
}

.participant-profile-page .solution-add-card-button strong {
  display: block;
  font-size: 12px;
  line-height: 17px;
}

.participant-profile-page .solution-add-card-button small {
  display: block;
  margin-top: 2px;
  color: #98a2b3;
  font-size: 10.5px;
}

/* ------------------------------------------------------------
   EMPTY STATE
   ------------------------------------------------------------ */

.participant-profile-page .solution-empty-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--pp-border);
  border-radius: 12px;
  background: #fafbfc;
}

.participant-profile-page .solution-empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 10px;
  background: #f1f5f9;
  color: #64748b;
}

.participant-profile-page .solution-empty-card strong {
  display: block;
  color: #344054;
  font-size: 12px;
}

.participant-profile-page .solution-empty-card span {
  display: block;
  margin-top: 3px;
  color: #98a2b3;
  font-size: 11px;
}

/* ------------------------------------------------------------
   INTERVENTION CARD
   ------------------------------------------------------------ */

.participant-profile-page .solution-intervention-card {
  padding: 18px;
  border: 1px solid var(--pp-border);
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.03);
}

.participant-profile-page .solution-intervention-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.participant-profile-page .solution-intervention-title {
  min-width: 0;
}

.participant-profile-page .solution-intervention-badges {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 7px;
}

.participant-profile-page .solution-type-badge,
.participant-profile-page .solution-priority-badge {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.participant-profile-page .solution-type-badge.hard {
  background: #ecfdf3;
  color: #15803d;
}

.participant-profile-page .solution-type-badge.soft {
  background: #f5f3ff;
  color: #7c3aed;
}

.participant-profile-page .solution-priority-badge {
  background: #f8fafc;
  color: #667085;
  border: 1px solid #e5e7eb;
}

.participant-profile-page .solution-intervention-title h3 {
  margin: 0;
  color: #1f2937;
  font-size: 15px;
  line-height: 21px;
}

.participant-profile-page .solution-intervention-status {
  display: inline-block;
  margin-top: 6px;
  color: #667085;
  font-size: 10px;
  font-weight: 600;
}

.participant-profile-page .solution-intervention-actions {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
}

.participant-profile-page .solution-secondary-button,
.participant-profile-page .solution-danger-button,
.participant-profile-page .solution-implementation-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 34px;
  padding: 7px 11px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.participant-profile-page .solution-secondary-button {
  border: 1px solid #dfe3e8;
  background: #fff;
  color: #475467;
}

.participant-profile-page .solution-secondary-button:hover {
  background: #f8fafc;
  color: var(--pp-primary);
}

.participant-profile-page .solution-danger-button {
  border: 1px solid #fee2e2;
  background: #fff;
  color: #dc2626;
}

.participant-profile-page .solution-danger-button:hover {
  background: #fef2f2;
}

.participant-profile-page .solution-intervention-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 17px;
  border: 1px solid #edf0f3;
  border-radius: 10px;
  overflow: hidden;
}

.participant-profile-page .solution-intervention-summary > div {
  min-width: 0;
  padding: 11px 13px;
  border-right: 1px solid #edf0f3;
  background: #fafbfc;
}

.participant-profile-page .solution-intervention-summary > div:last-child {
  border-right: 0;
}

.participant-profile-page .solution-intervention-summary small {
  display: block;
  margin-bottom: 4px;
  color: #98a2b3;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.participant-profile-page .solution-intervention-summary strong {
  display: block;
  overflow: hidden;
  color: #344054;
  font-size: 12px;
  line-height: 17px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.participant-profile-page .solution-intervention-summary strong.plan-added {
  color: #15803d;
}

.participant-profile-page .solution-intervention-summary strong.plan-not-added {
  color: #98a2b3;
}

.participant-profile-page .solution-intervention-description {
  margin-top: 14px;
  padding: 12px 14px;
  border-left: 3px solid #dbeafe;
  border-radius: 0 8px 8px 0;
  background: #f8fbff;
}

.participant-profile-page .solution-intervention-description small {
  display: block;
  margin-bottom: 4px;
  color: #64748b;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.participant-profile-page .solution-intervention-description p {
  margin: 0;
  color: #475467;
  font-size: 11.5px;
  line-height: 18px;
}

/* ------------------------------------------------------------
   IMPLEMENTATION PLAN CHECKBOX
   ------------------------------------------------------------ */

.participant-profile-page .solution-intervention-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
  padding-top: 15px;
  border-top: 1px solid #edf0f3;
}

.participant-profile-page .implementation-plan-check {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  margin: 0;
  padding: 9px 11px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fafbfc;
  cursor: pointer;
  transition: 0.18s ease;
}

.participant-profile-page .implementation-plan-check:hover {
  border-color: #bfdbfe;
  background: #f8fbff;
}

.participant-profile-page .implementation-plan-check input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.participant-profile-page .custom-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  color: #fff;
}

.participant-profile-page .implementation-plan-check input:checked + .custom-check {
  border-color: var(--pp-primary);
  background: var(--pp-primary);
}

.participant-profile-page .implementation-plan-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.participant-profile-page .implementation-plan-text strong {
  color: #344054;
  font-size: 11px;
  line-height: 15px;
}

.participant-profile-page .implementation-plan-text small {
  margin-top: 2px;
  color: #98a2b3;
  font-size: 9.5px;
  line-height: 13px;
}

.participant-profile-page .solution-implementation-button {
  flex-shrink: 0;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
}

.participant-profile-page .solution-implementation-button:hover {
  background: #dbeafe;
}

/* ------------------------------------------------------------
   MODAL
   ------------------------------------------------------------ */

.participant-profile-page .solution-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.48);
  backdrop-filter: blur(3px);
}

.participant-profile-page .solution-modal {
  width: min(560px, 100%);
  max-height: min(760px, 90vh);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.22);
}

.participant-profile-page .solution-intervention-modal {
  width: min(820px, 100%);
}

.participant-profile-page .solution-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 20px;
  border-bottom: 1px solid #edf0f3;
}

.participant-profile-page .solution-modal-header > div > span {
  color: #98a2b3;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.participant-profile-page .solution-modal-header h3 {
  margin: 3px 0 0;
  color: #1f2937;
  font-size: 16px;
  line-height: 22px;
}

.participant-profile-page .solution-modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #667085;
  cursor: pointer;
}

.participant-profile-page .solution-modal-close:hover {
  background: #f8fafc;
  color: #344054;
}

.participant-profile-page .solution-modal-body {
  overflow-y: auto;
  padding: 20px;
}

.participant-profile-page .solution-modal-body label {
  min-width: 0;
}

.participant-profile-page .solution-modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 9px;
  padding: 14px 20px;
  border-top: 1px solid #edf0f3;
  background: #fafbfc;
}

.participant-profile-page .solution-modal-footer button {
  min-height: 36px;
  padding: 8px 13px;
  border: 1px solid #dfe3e8;
  border-radius: 8px;
  background: #fff;
  color: #475467;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.participant-profile-page .solution-modal-footer .button-primary {
  border-color: var(--pp-primary);
  background: var(--pp-primary);
  color: #fff;
}

.participant-profile-page .solution-modal-footer .button-primary:hover {
  background: var(--pp-primary-dark);
}

.participant-profile-page .solution-modal-footer button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.participant-profile-page .modal-check {
  margin-top: 4px;
}

/* ------------------------------------------------------------
   TABLE IMPROVEMENTS
   ------------------------------------------------------------ */

.participant-profile-page .solution-plan-table {
  min-width: 700px;
}

.participant-profile-page .solution-indicator-table {
  min-width: 820px;
}

.participant-profile-page .solution-plan-table td,
.participant-profile-page .solution-indicator-table td {
  vertical-align: middle;
}

.participant-profile-page .solution-plan-table td strong {
  color: #344054;
  font-size: 11.5px;
}

.participant-profile-page .table-type-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 999px;
  background: #f8fafc;
  color: #475467;
  font-size: 9px;
  font-weight: 700;
  text-transform: capitalize;
}

.participant-profile-page .table-delete-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 31px;
  padding: 6px 9px;
  border: 1px solid #fee2e2;
  border-radius: 7px;
  background: #fff;
  color: #dc2626;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
}

.participant-profile-page .table-delete-button:hover {
  background: #fef2f2;
}

/* ------------------------------------------------------------
   ACTIONS
   ------------------------------------------------------------ */

.participant-profile-page .solution-table-actions {
  margin-top: 14px;
}

/* ------------------------------------------------------------
   RESPONSIVE
   ------------------------------------------------------------ */

@media (max-width: 900px) {
  .participant-profile-page .solution-gap-grid {
    grid-template-columns: 1fr;
  }

  .participant-profile-page .solution-intervention-summary {
    grid-template-columns: repeat(2, 1fr);
  }

  .participant-profile-page .solution-intervention-summary > div:nth-child(2) {
    border-right: 0;
  }

  .participant-profile-page .solution-intervention-summary > div:nth-child(-n + 2) {
    border-bottom: 1px solid #edf0f3;
  }
}

@media (max-width: 700px) {
  .participant-profile-page .solution-intervention-top {
    flex-direction: column;
  }

  .participant-profile-page .solution-intervention-actions {
    width: 100%;
  }

  .participant-profile-page .solution-intervention-actions button {
    flex: 1;
  }

  .participant-profile-page .solution-intervention-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .participant-profile-page .implementation-plan-check,
  .participant-profile-page .solution-implementation-button {
    width: 100%;
  }

  .participant-profile-page .solution-modal-backdrop {
    align-items: flex-end;
    padding: 0;
  }

  .participant-profile-page .solution-modal,
  .participant-profile-page .solution-intervention-modal {
    width: 100%;
    max-height: 94vh;
    border-radius: 16px 16px 0 0;
  }

  .participant-profile-page .solution-modal-body {
    padding: 16px;
  }
}

@media (max-width: 520px) {
  .participant-profile-page .solution-intervention-summary {
    grid-template-columns: 1fr;
  }

  .participant-profile-page .solution-intervention-summary > div {
    border-right: 0;
    border-bottom: 1px solid #edf0f3;
  }

  .participant-profile-page .solution-intervention-summary > div:last-child {
    border-bottom: 0;
  }

  .participant-profile-page .solution-gap-card,
  .participant-profile-page .solution-intervention-card {
    padding: 14px;
  }
}

  /* ============================================================
     IMPLEMENTATION
     ============================================================ */
.participant-profile-page .implementation-notice {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin-bottom: 13px;
  padding: 9px 12px;
  color: #1e40af;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 9px;
  font-size: 11.5px;
  line-height: 17px;
}

.participant-profile-page .implementation-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.participant-profile-page .implementation-card {
  padding: 13px 15px;
  background: #fff;
  border: 1px solid var(--pp-border);
  border-radius: 11px;
}

.participant-profile-page .planned-header h3 {
  margin: 6px 0 3px;
  color: #344054;
  font-size: 13px;
  line-height: 18px;
}

.participant-profile-page .planned-header p {
  margin: 0;
  color: var(--pp-muted);
  font-size: 11.5px;
  line-height: 17px;
}

.participant-profile-page .implementation-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.participant-profile-page .implementation-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
  padding-top: 11px;
  border-top: 1px solid #f0f1f3;
}

.participant-profile-page .implementation-summary > div {
  min-width: 0;
  padding: 8px 9px;
  background: #f8f9fb;
  border: 1px solid #eef0f3;
  border-radius: 8px;
}

.participant-profile-page .implementation-summary small {
  display: block;
  margin-bottom: 3px;
  color: var(--pp-muted);
  font-size: 9.5px;
}

.participant-profile-page .implementation-summary strong {
  display: block;
  overflow: hidden;
  color: #344054;
  font-size: 11px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.participant-profile-page .implementation-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 12px;
  padding-top: 11px;
  border-top: 1px solid #f0f1f3;
}

.participant-profile-page .implementation-muted {
  color: var(--pp-muted);
  font-size: 10.5px;
  line-height: 15px;
}

/* MODAL */

.participant-profile-page .pp-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 20px;

  background: rgba(16, 24, 40, 0.42);
}

.participant-profile-page .pp-modal {
  width: min(720px, 100%);
  max-height: calc(100vh - 40px);

  display: flex;
  flex-direction: column;

  background: #fff;
  border: 1px solid var(--pp-border);
  border-radius: 13px;

  box-shadow: 0 18px 50px rgba(16, 24, 40, 0.18);

  overflow: hidden;
}

.participant-profile-page .pp-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 15px;

  padding: 15px 17px;

  border-bottom: 1px solid var(--pp-border);
}

.participant-profile-page .pp-modal-header h3 {
  margin: 0;
  color: #344054;
  font-size: 15px;
  line-height: 20px;
}

.participant-profile-page .pp-modal-header p {
  margin: 3px 0 0;
  color: var(--pp-muted);
  font-size: 10.5px;
  line-height: 15px;
}

.participant-profile-page .pp-modal-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  width: 30px;
  height: 30px;
  padding: 0;

  border: 1px solid var(--pp-border);
  border-radius: 7px;

  background: #fff;
  color: #667085;

  cursor: pointer;
}

.participant-profile-page .pp-modal-close:hover {
  background: #f8f9fb;
}

.participant-profile-page .pp-modal-body {
  padding: 16px 17px;
  overflow-y: auto;
}

.participant-profile-page .pp-modal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.participant-profile-page .pp-modal-grid label {
  min-width: 0;
}

.participant-profile-page .pp-modal-grid .field-full {
  grid-column: 1 / -1;
}

.participant-profile-page .pp-modal-grid label small {
  display: block;
  margin-bottom: 5px;
  color: #667085;
  font-size: 10px;
  font-weight: 600;
}

.participant-profile-page .pp-modal-grid input,
.participant-profile-page .pp-modal-grid select,
.participant-profile-page .pp-modal-grid textarea {
  width: 100%;
}

.participant-profile-page .implementation-check-row {
  display: flex !important;
  align-items: center;
  gap: 8px;

  min-height: 38px;
  padding: 9px 10px;

  background: #f8f9fb;
  border: 1px solid #eef0f3;
  border-radius: 8px;
}

.participant-profile-page .implementation-check-row input {
  width: 15px;
  height: 15px;
  margin: 0;
  flex: 0 0 auto;
}

.participant-profile-page .implementation-check-row span {
  color: #344054;
  font-size: 11px;
  font-weight: 500;
}

.participant-profile-page .pp-modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;

  padding: 12px 17px;

  border-top: 1px solid var(--pp-border);
  background: #fff;
}

@media (max-width: 700px) {
  .participant-profile-page .implementation-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .participant-profile-page .pp-modal-grid {
    grid-template-columns: 1fr;
  }

  .participant-profile-page .pp-modal-grid .field-full {
    grid-column: auto;
  }
}

@media (max-width: 520px) {
  .participant-profile-page .implementation-card-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .participant-profile-page .implementation-card-footer button {
    width: 100%;
    justify-content: center;
  }

  .participant-profile-page .implementation-summary {
    grid-template-columns: 1fr;
  }

  .participant-profile-page .pp-modal-backdrop {
    padding: 10px;
  }

  .participant-profile-page .pp-modal {
    max-height: calc(100vh - 20px);
  }
}


  /* ============================================================
     WHATSAPP
     ============================================================ */

  .participant-profile-page .conversation-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 8px;

    margin-bottom: 13px;
    padding: 10px 12px;

    background: #fafbfc;

    border: 1px solid var(--pp-border);
    border-radius: 10px;
  }

  .participant-profile-page .conversation-summary small {
    display: block;

    margin-bottom: 2px;

    color: var(--pp-light);

    font-size: 9px;
  }

  .participant-profile-page .conversation-summary strong {
    color: #344054;
    font-size: 12px;
  }

  .participant-profile-page .conversation-list {
    display: flex;
    flex-direction: column;
    gap: 8px;

    max-height: 480px;

    overflow-y: auto;

    padding-right: 3px;
  }

  .participant-profile-page .conversation-message {
    max-width: 70%;

    padding: 9px 11px;

    color: #344054;
    background: #f2f4f7;

    border-radius: 10px;

    align-self: flex-start;

    font-size: 11.5px;
    line-height: 17px;
  }

  .participant-profile-page .conversation-message.outbound {
    background: #eff6ff;
    align-self: flex-end;
  }

  .participant-profile-page .conversation-message > div {
    display: flex;
    justify-content: space-between;

    gap: 10px;

    margin-bottom: 3px;
  }

  .participant-profile-page .conversation-message b {
    color: #475467;
    font-size: 10px;
  }

  .participant-profile-page .conversation-message > div span {
    color: var(--pp-light);
    font-size: 9px;
  }

  .participant-profile-page .conversation-message p {
    margin: 0;
    line-height: 1.45;
  }

  .participant-profile-page .conversation-message small {
    display: block;

    margin-top: 5px;

    color: var(--pp-light);
    font-size: 8.5px;
  }


  /* ============================================================
     IMAGE PREVIEW MODAL
     ============================================================ */

  .participant-profile-page .image-preview-modal,
  .image-preview-modal {
    position: fixed;
    inset: 0;
    z-index: 9999;

    display: flex;
    align-items: center;
    justify-content: center;

    padding: 24px;

    background: rgba(15, 23, 42, .76);
  }

  .participant-profile-page .image-preview-content,
  .image-preview-content {
    position: relative;

    display: flex;
    align-items: center;
    justify-content: center;

    max-width: 90vw;
    max-height: 90vh;
  }

  .participant-profile-page .image-preview-content img,
  .image-preview-content img {
    display: block;

    max-width: 90vw;
    max-height: 85vh;

    object-fit: contain;

    background: #fff;
    border-radius: 9px;

    box-shadow:
      0 20px 50px rgba(0, 0, 0, .25);
  }

  .participant-profile-page .image-preview-close,
  .image-preview-close {
    position: absolute;

    top: -13px;
    right: -13px;

    width: 34px;
    height: 34px;
    min-height: 34px;

    display: flex;
    align-items: center;
    justify-content: center;

    padding: 0;

    color: #111827;
    background: #fff;

    border: 0;
    border-radius: 50%;

    font-size: 21px;
    line-height: 1;

    cursor: pointer;

    box-shadow:
      0 4px 12px rgba(0, 0, 0, .18);
  }


  /* ============================================================
     TABLET
     ============================================================ */

  @media (max-width: 1000px) {

    .participant-profile-page .profile-summary {
      grid-template-columns: 1.5fr 1fr 1fr;
    }

    .participant-profile-page .profile-identity {
      grid-column: 1 / -1;

      border-bottom: 1px solid var(--pp-border);
    }

    .participant-profile-page .summary-metric {
      border-left: 0;
    }

    .participant-profile-page .summary-metric + .summary-metric {
      border-left: 1px solid var(--pp-border);
    }

    .participant-profile-page .participant-profile-tabs-inner {
      grid-template-columns: repeat(3, 1fr);
    }

    .participant-profile-page .participant-profile-tab {
      border-bottom: 1px solid #f0f1f3;
    }

    .participant-profile-page
    .participant-profile-tab:nth-child(3),
    .participant-profile-page
    .participant-profile-tab:nth-child(6) {
      border-right: 0;
    }

    .participant-profile-page .profile-status-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .participant-profile-page
    .profile-status-item:nth-child(1),
    .participant-profile-page
    .profile-status-item:nth-child(2) {
      border-bottom: 1px solid #f0f1f3;
    }

    .participant-profile-page
    .profile-status-item:nth-child(2) {
      border-right: 0;
    }

    .participant-profile-page .solution-track {
      grid-template-columns: 36px minmax(0, 1fr) 145px;
    }
  }


  /* ============================================================
     MOBILE
     ============================================================ */

  @media (max-width: 720px) {

    .participant-profile-page {
      padding: 14px 12px 40px;
    }

    .participant-profile-page .profile-back {
      align-items: flex-start;
      flex-direction: column;

      gap: 7px;
      margin-bottom: 12px;
    }

    .participant-profile-page .profile-back a,
    .participant-profile-page .profile-id {
      width: 100%;
    }

    .participant-profile-page .profile-id {
      justify-content: center;
    }

    .participant-profile-page .profile-summary {
      grid-template-columns: 1fr 1fr;
    }

    .participant-profile-page .profile-identity {
      grid-column: 1 / -1;
      padding: 15px;
    }

    .participant-profile-page .summary-metric {
      padding: 12px;

      border-left: 0;
      border-top: 1px solid var(--pp-border);
    }

    .participant-profile-page
    .summary-metric:nth-child(odd) {
      border-left: 1px solid var(--pp-border);
    }

    .participant-profile-page .profile-status-header {
      padding: 12px 14px;
    }

    .participant-profile-page .profile-status-grid {
      grid-template-columns: 1fr;
    }

    .participant-profile-page .profile-status-item {
      padding: 12px 14px;

      border-right: 0;
      border-bottom: 1px solid #f0f1f3;
    }

    .participant-profile-page
    .profile-status-item:last-child {
      border-bottom: 0;
    }

    .participant-profile-page .profile-edit-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .participant-profile-page .field-full {
      grid-column: auto;
    }

    .participant-profile-page .profile-grid {
      grid-template-columns: 1fr 1fr;
    }

    .participant-profile-page .profile-field:nth-child(3n) {
      border-right: 1px solid #f0f1f3;
    }

    .participant-profile-page .profile-field:nth-child(even) {
      border-right: 0;
    }

    .participant-profile-page .solution-track {
      grid-template-columns: 36px minmax(0, 1fr);
    }

    .participant-profile-page .solution-track select {
      grid-column: 1 / -1;
    }

    .participant-profile-page .conversation-message {
      max-width: 86%;
    }

    .participant-profile-page .participant-profile-tabs-header {
      padding: 11px 13px;
    }

    .participant-profile-page .participant-profile-tabs-inner {
      grid-template-columns: repeat(2, 1fr);
    }

    .participant-profile-page .participant-profile-tab {
      justify-content: flex-start;
      min-height: 48px;

      padding: 9px 10px;

      border-right: 1px solid #f0f1f3;
    }

    .participant-profile-page
    .participant-profile-tab:nth-child(even) {
      border-right: 0;
    }

    .participant-profile-page
    .participant-profile-tab.active::after {
      left: 10px;
      right: 10px;
    }

    .participant-profile-page .participant-tab-content strong {
      font-size: 10px;
    }
  }


  /* ============================================================
     SMALL MOBILE
     ============================================================ */

  @media (max-width: 460px) {

    .participant-profile-page {
      padding: 12px 10px 35px;
    }

    .participant-profile-page .profile-summary {
      grid-template-columns: 1fr;
    }

    .participant-profile-page .profile-identity {
      padding: 14px;
    }

    .participant-profile-page .summary-metric,
    .participant-profile-page
    .summary-metric:nth-child(odd) {
      border-left: 0;
      border-top: 1px solid var(--pp-border);
    }

    .participant-profile-page .profile-grid {
      grid-template-columns: 1fr;
    }

    .participant-profile-page .profile-field,
    .participant-profile-page .profile-field:nth-child(even),
    .participant-profile-page .profile-field:nth-child(3n) {
      border-right: 0;
    }

    .participant-profile-page .profile-status-header {
      align-items: flex-start;
      flex-direction: column;
    }

    .participant-profile-page .status-live {
      align-self: flex-start;
    }

    .participant-profile-page .participant-profile-tab {
      gap: 5px;
    }

    .participant-profile-page .participant-tab-number {
      width: 19px;
      height: 19px;
    }

    .participant-profile-page .participant-tab-icon {
      display: none;
    }

    .participant-profile-page .answer-row > div {
      align-items: flex-start;
      flex-direction: column;
      gap: 5px;
    }

    .participant-profile-page .answer-row > div > span {
      align-self: flex-start;
    }
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
          <small>Participant Survey</small>
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
            title="Actions, Implementation & Solutions"
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
                  Participant survey status
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
  <small>Assessment & Implementation status</small>

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
      "ASSESSMENT_PENDING",
      "ASSESSMENT_COMPLETED",
      "RE_ASSESSMENT_REQUIRED",
      "SOLUTION_PROPOSED",
      "SOLUTION_APPROVED",
      "PROCUREMENT",
      "VENDOR_UPDATE",
      "IMPLEMENTATION_COMPLETED",
      "REJECTED",
    ].map((x) => (
      <option key={x} value={x}>
        {x}
      </option>
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
            title="Solution Stages"
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
            title="Other Registration Details"
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
    Electricity bills
    {Boolean(
      assessment?.documents?.electricityBill?.length
    ) && (
      <span className="tag green">
        {assessment.documents.electricityBill.length}
      </span>
    )}
  </strong>

  <span>
    Upload multiple electricity bills
  </span>

  <input
    type="file"
    accept="image/*,.pdf"
    multiple
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
    onView={handleDocumentView}
  />

  <DocumentList
    title="Other documents"
    files={assessment?.documents?.otherDocuments || []}
    onDelete={(file) =>
      deleteAssessmentDocument("otherDocuments", file)
    }
    deletingFileKey={deletingFileKey}
    onView={handleDocumentView}
  />

  <DocumentList
    title="Machinery photos"
    files={assessment?.documents?.machineryPhotos || []}
    onDelete={(file) =>
      deleteAssessmentDocument("machineryPhotos", file)
    }
    deletingFileKey={deletingFileKey}
    onView={handleDocumentView}
  />

  <DocumentList
    title="Product photos"
    files={assessment?.documents?.productPhotos || []}
    onDelete={(file) =>
      deleteAssessmentDocument("productPhotos", file)
    }
    deletingFileKey={deletingFileKey}
    onView={handleDocumentView}
  />

  <DocumentList
    title="Electricity bill"
    files={assessment?.documents?.electricityBill || []}
    onDelete={(file) =>
      deleteAssessmentDocument("electricityBill", file)
    }
    deletingFileKey={deletingFileKey}
    onView={handleDocumentView}
  />
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
    {/* ============================================================
        IDENTIFIED GAPS
        ============================================================ */}

    <Section
      title="Identified gaps"
      action={
        <span className="section-note">
          Problems identified during assessment
        </span>
      }
    >
      <div className="solution-gap-area">
        {(solutionDesign.gaps || []).length > 0 ? (
          <div className="solution-gap-grid">
            {(solutionDesign.gaps || []).map(
              (gap: any, index: number) => (
                <div
                  className="solution-gap-card"
                  key={gap._id || index}
                >
                  <div className="solution-gap-card-top">
                    <span className="solution-card-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="solution-gap-card-actions">
                      <button
                        type="button"
                        className="solution-icon-button"
                        onClick={() =>
                          openEditGapModal(index)
                        }
                        title="Edit gap"
                      >
                        <Pencil size={15} />
                      </button>

                      <button
                        type="button"
                        className="solution-icon-button danger"
                        onClick={() =>
                          void deleteGap(index)
                        }
                        disabled={solutionSaving}
                        title="Delete gap"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="solution-gap-content">
                    <span className="solution-card-label">
                      Identified gap
                    </span>

                    <h3>
                      {gap.name || "Untitled gap"}
                    </h3>

                    <p>
                      {gap.description ||
                        "No description added yet."}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="solution-card-edit"
                    onClick={() =>
                      openEditGapModal(index)
                    }
                  >
                    <Pencil size={14} />
                    Edit gap
                  </button>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="solution-empty-card">
            <div className="solution-empty-icon">
              <ClipboardList size={20} />
            </div>

            <div>
              <strong>No gaps identified yet</strong>
              <span>
                Add the problems identified during the
                assessment.
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          className="solution-add-card-button"
          onClick={openAddGapModal}
        >
          <span className="solution-add-icon">
            <Plus size={18} />
          </span>

          <span>
            <strong>Add identified gap</strong>
            <small>
              Record a problem found during assessment
            </small>
          </span>
        </button>
      </div>
    </Section>

    {/* ============================================================
        RECOMMENDED INTERVENTIONS
        ============================================================ */}

    <Section
      title="Recommended interventions"
      action={
        <span className="section-note">
          Hard and soft interventions
        </span>
      }
    >
      <div className="intervention-list">
        {(solutionDesign.interventions || []).length > 0 ? (
          (solutionDesign.interventions || []).map(
            (intervention: any, index: number) => (
              <div
                className="solution-intervention-card"
                key={
                  intervention._id || index
                }
              >
                <div className="solution-intervention-top">
                  <div className="solution-intervention-title">
                    <div className="solution-intervention-badges">
                      <span
                        className={`solution-type-badge ${
                          intervention.interventionType ===
                          "hard"
                            ? "hard"
                            : "soft"
                        }`}
                      >
                        {intervention.interventionType ===
                        "soft"
                          ? "Soft"
                          : "Hard"}
                      </span>

                      <span className="solution-priority-badge">
                        {intervention.priority ||
                          "Medium"}
                      </span>
                    </div>

                    <h3>
                      {intervention.title ||
                        "Untitled intervention"}
                    </h3>

                    <span className="solution-intervention-status">
                      {intervention.status ||
                        "Proposed"}
                    </span>
                  </div>

                  <div className="solution-intervention-actions">
                    <button
                      type="button"
                      className="solution-secondary-button"
                      onClick={() =>
                        openEditInterventionModal(
                          intervention
                        )
                      }
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      type="button"
                      className="solution-danger-button"
                      disabled={solutionSaving}
                      onClick={() =>
                        void deleteIntervention(
                          intervention._id
                        )
                      }
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="solution-intervention-summary">
                  <div>
                    <small>Estimated cost</small>
                    <strong>
                      {intervention.estimatedCost !==
                      null &&
                      intervention.estimatedCost !==
                        undefined
                        ? `₹${Number(
                            intervention.estimatedCost
                          ).toLocaleString("en-IN")}`
                        : "—"}
                    </strong>
                  </div>

                  <div>
                    <small>Leverage</small>
                    <strong>
                      {intervention.leverageEndUserPercent ??
                        30}
                      {" / "}
                      {intervention.leverageSelcoPercent ??
                        70}
                    </strong>
                  </div>

                  <div>
                    <small>Team decision</small>
                    <strong>
                      {intervention.teamDecision ||
                        "DECIDE"}
                    </strong>
                  </div>

                  <div>
                    <small>Implementation plan</small>

                    <strong
                      className={
                        intervention.addToInterventionPlan
                          ? "plan-added"
                          : "plan-not-added"
                      }
                    >
                      {intervention.addToInterventionPlan
                        ? "Added"
                        : "Not added"}
                    </strong>
                  </div>
                </div>

                {intervention.specification && (
                  <div className="solution-intervention-description">
                    <small>Specification</small>
                    <p>
                      {intervention.specification}
                    </p>
                  </div>
                )}

                <div className="solution-intervention-footer">
                  <label className="implementation-plan-check">
                    <input
                      type="checkbox"
                      checked={Boolean(
                        intervention.addToInterventionPlan
                      )}
                      onChange={(e) =>
                        void updateIntervention(
                          intervention._id,
                          {
                            addToInterventionPlan:
                              e.target.checked,
                          }
                        )
                      }
                    />

                    <span className="custom-check">
                      {intervention.addToInterventionPlan && (
                        <CheckCircle2 size={15} />
                      )}
                    </span>

                    <span className="implementation-plan-text">
                      <strong>
                        Add to intervention plan
                      </strong>

                      <small>
                        Include this intervention in the
                        implementation plan
                      </small>
                    </span>
                  </label>

                  <button
                    type="button"
                    className="solution-implementation-button"
                    disabled={implementationSaving}
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
          )
        ) : (
          <div className="solution-empty-card">
            <div className="solution-empty-icon">
              <Route size={20} />
            </div>

            <div>
              <strong>
                No recommended interventions yet
              </strong>

              <span>
                Add a recommended solution based on the
                identified gaps.
              </span>
            </div>
          </div>
        )}

        <button
          type="button"
          className="solution-add-card-button intervention-add-button"
          disabled={solutionSaving}
          onClick={() =>
            void addIntervention()
          }
        >
          <span className="solution-add-icon">
            <Plus size={18} />
          </span>

          <span>
            <strong>
              Add recommended intervention
            </strong>

            <small>
              Create a hard or soft intervention
            </small>
          </span>
        </button>
      </div>
    </Section>

    {/* ============================================================
        INTERVENTION PLAN
        ============================================================ */}

    <Section
      title="Intervention plan"
      action={
        <span className="section-note">
          Default leverage 30/70
        </span>
      }
    >
      <div className="table-responsive">
        <table className="journey-table solution-plan-table">
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
            {(solutionDesign.interventions || [])
              .filter(
                (item: any) =>
                  item.addToInterventionPlan
              )
              .map(
                (item: any, index: number) => (
                  <tr
                    key={
                      item._id || index
                    }
                  >
                    <td>
                      <strong>
                        {item.title || "Untitled"}
                      </strong>
                    </td>

                    <td>
                      <span className="table-type-pill">
                        {item.interventionType}
                      </span>
                    </td>

                    <td>{item.priority}</td>

                    <td>
                      {item.estimatedCost !==
                        null &&
                      item.estimatedCost !==
                        undefined
                        ? `₹${Number(
                            item.estimatedCost
                          ).toLocaleString("en-IN")}`
                        : "—"}
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

            {!(solutionDesign.interventions || []).some(
              (item: any) =>
                item.addToInterventionPlan
            ) && (
              <tr>
                <td
                  colSpan={6}
                  className="empty"
                >
                  No interventions added to the
                  plan yet.
                </td>
              </tr>
            )}
          </tbody>

          {(solutionDesign.interventions || []).some(
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

    {/* ============================================================
        INDICATORS
        ============================================================ */}

    <Section
      title="Indicators"
      action={
        <span className="section-note">
          Configurable by value chain
        </span>
      }
    >
      <div className="table-responsive">
        <table className="journey-table solution-indicator-table">
          <thead>
            <tr>
              <th>Indicator</th>
              <th>Baseline</th>
              <th>Target</th>
              <th>Current</th>
              <th>Date measured</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {(solutionDesign.indicators || []).map(
              (indicator: any, index: number) => (
                <tr key={index}>
                  <td>
                    <select
                      value={indicator.name || ""}
                      onChange={(e) => {
                        const indicators = [
                          ...(solutionDesign.indicators ||
                            []),
                        ];

                        indicators[index] = {
                          ...indicators[index],
                          name: e.target.value,
                        };

                        setSolutionDesign(
                          (prev: any) => ({
                            ...prev,
                            indicators,
                          })
                        );
                      }}
                    >
                      {indicatorOptions.map(
                        (option) => (
                          <option
                            key={option}
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
                        indicator.baseline || ""
                      }
                      onChange={(e) => {
                        const indicators = [
                          ...(solutionDesign.indicators ||
                            []),
                        ];

                        indicators[index] = {
                          ...indicators[index],
                          baseline:
                            e.target.value,
                        };

                        setSolutionDesign(
                          (prev: any) => ({
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
                        indicator.target || ""
                      }
                      onChange={(e) => {
                        const indicators = [
                          ...(solutionDesign.indicators ||
                            []),
                        ];

                        indicators[index] = {
                          ...indicators[index],
                          target:
                            e.target.value,
                        };

                        setSolutionDesign(
                          (prev: any) => ({
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
                        indicator.current || ""
                      }
                      onChange={(e) => {
                        const indicators = [
                          ...(solutionDesign.indicators ||
                            []),
                        ];

                        indicators[index] = {
                          ...indicators[index],
                          current:
                            e.target.value,
                        };

                        setSolutionDesign(
                          (prev: any) => ({
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
                            ).slice(0, 10)
                          : ""
                      }
                      onChange={(e) => {
                        const indicators = [
                          ...(solutionDesign.indicators ||
                            []),
                        ];

                        indicators[index] = {
                          ...indicators[index],
                          dateMeasured:
                            e.target.value
                              ? new Date(
                                  e.target.value
                                ).toISOString()
                              : null,
                        };

                        setSolutionDesign(
                          (prev: any) => ({
                            ...prev,
                            indicators,
                          })
                        );
                      }}
                    />
                  </td>

                  <td>
                    <button
                      type="button"
                      className="table-delete-button"
                      disabled={solutionSaving}
                      onClick={() =>
                        void deleteIndicator(index)
                      }
                      title="Delete indicator"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <div className="assessment-actions solution-table-actions">
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

    {/* ============================================================
        GAP MODAL
        ============================================================ */}

    {gapModalOpen && (
      <div
        className="solution-modal-backdrop"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) {
            setGapModalOpen(false);
          }
        }}
      >
        <div
          className="solution-modal"
          role="dialog"
          aria-modal="true"
        >
          <div className="solution-modal-header">
            <div>
              <span>Solution & Design</span>
              <h3>
                {editingGapIndex === null
                  ? "Add identified gap"
                  : "Edit identified gap"}
              </h3>
            </div>

            <button
              type="button"
              className="solution-modal-close"
              onClick={() =>
                setGapModalOpen(false)
              }
            >
              <X size={18} />
            </button>
          </div>

          <div className="solution-modal-body">
            <label>
              <small>Gap name</small>

              <input
                autoFocus
                value={gapDraft.name}
                onChange={(e) =>
                  setGapDraft((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Enter identified gap"
              />
            </label>

            <label>
              <small>Description</small>

              <textarea
                rows={5}
                value={gapDraft.description}
                onChange={(e) =>
                  setGapDraft((prev) => ({
                    ...prev,
                    description:
                      e.target.value,
                  }))
                }
                placeholder="Describe the identified gap..."
              />
            </label>
          </div>

          <div className="solution-modal-footer">
            <button
              type="button"
              onClick={() =>
                setGapModalOpen(false)
              }
            >
              Cancel
            </button>

            <button
              type="button"
              className="button-primary"
              disabled={
                solutionSaving ||
                !gapDraft.name.trim()
              }
              onClick={() =>
                void saveGapFromModal()
              }
            >
              <Save size={16} />
              {solutionSaving
                ? "Saving..."
                : "Save Gap"}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ============================================================
        INTERVENTION MODAL
        ============================================================ */}

    {interventionModalOpen &&
      interventionDraft && (
        <div
          className="solution-modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              closeInterventionModal();
            }
          }}
        >
          <div
            className="solution-modal solution-intervention-modal"
            role="dialog"
            aria-modal="true"
          >
            <div className="solution-modal-header">
              <div>
                <span>
                  Solution & Design
                </span>

                <h3>
                  Edit recommended
                  intervention
                </h3>
              </div>

              <button
                type="button"
                className="solution-modal-close"
                onClick={
                  closeInterventionModal
                }
              >
                <X size={18} />
              </button>
            </div>

            <div className="solution-modal-body">
              <div className="profile-edit-grid">
                <label>
                  <small>
                    Intervention type
                  </small>

                  <select
                    value={
                      interventionDraft.interventionType
                    }
                    onChange={(e) =>
                      setInterventionDraft(
                        (prev: any) => ({
                          ...prev,
                          interventionType:
                            e.target.value,
                        })
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
                      interventionDraft.priority
                    }
                    onChange={(e) =>
                      setInterventionDraft(
                        (prev: any) => ({
                          ...prev,
                          priority:
                            e.target.value,
                        })
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
                    Recommended
                    intervention
                  </small>

                  <input
                    value={
                      interventionDraft.title
                    }
                    onChange={(e) =>
                      setInterventionDraft(
                        (prev: any) => ({
                          ...prev,
                          title:
                            e.target.value,
                        })
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
                      interventionDraft.estimatedCost ??
                      ""
                    }
                    onChange={(e) =>
                      setInterventionDraft(
                        (prev: any) => ({
                          ...prev,
                          estimatedCost:
                            e.target.value ===
                            ""
                              ? null
                              : Number(
                                  e.target.value
                                ),
                        })
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
                      interventionDraft.leverageEndUserPercent ??
                      30
                    }
                    onChange={(e) =>
                      setInterventionDraft(
                        (prev: any) => ({
                          ...prev,
                          leverageEndUserPercent:
                            Number(
                              e.target.value
                            ),
                        })
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
                      interventionDraft.leverageSelcoPercent ??
                      70
                    }
                    onChange={(e) =>
                      setInterventionDraft(
                        (prev: any) => ({
                          ...prev,
                          leverageSelcoPercent:
                            Number(
                              e.target.value
                            ),
                        })
                      )
                    }
                  />
                </label>

                <label>
                  <small>
                    Team decision
                  </small>

                  <select
                    value={
                      interventionDraft.teamDecision
                    }
                    onChange={(e) =>
                      setInterventionDraft(
                        (prev: any) => ({
                          ...prev,
                          teamDecision:
                            e.target.value,
                        })
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
                      interventionDraft.status
                    }
                    onChange={(e) =>
                      setInterventionDraft(
                        (prev: any) => ({
                          ...prev,
                          status:
                            e.target.value,
                        })
                      )
                    }
                  >
                    {implementationStatuses.map(
                      (item) => (
                        <option key={item}>
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label className="field-full">
                  <small>
                    Specification
                  </small>

                  <textarea
                    rows={3}
                    value={
                      interventionDraft.specification
                    }
                    onChange={(e) =>
                      setInterventionDraft(
                        (prev: any) => ({
                          ...prev,
                          specification:
                            e.target.value,
                        })
                      )
                    }
                  />
                </label>

                <label className="field-full">
                  <small>Why</small>

                  <textarea
                    rows={3}
                    value={
                      interventionDraft.why
                    }
                    onChange={(e) =>
                      setInterventionDraft(
                        (prev: any) => ({
                          ...prev,
                          why: e.target.value,
                        })
                      )
                    }
                  />
                </label>

                <label className="field-full">
                  <small>Source</small>

                  <input
                    value={
                      interventionDraft.source
                    }
                    onChange={(e) =>
                      setInterventionDraft(
                        (prev: any) => ({
                          ...prev,
                          source:
                            e.target.value,
                        })
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
                      interventionDraft.decisionRationale
                    }
                    onChange={(e) =>
                      setInterventionDraft(
                        (prev: any) => ({
                          ...prev,
                          decisionRationale:
                            e.target.value,
                        })
                      )
                    }
                  />
                </label>

                <label className="implementation-plan-check modal-check">
                  <input
                    type="checkbox"
                    checked={Boolean(
                      interventionDraft.addToInterventionPlan
                    )}
                    onChange={(e) =>
                      setInterventionDraft(
                        (prev: any) => ({
                          ...prev,
                          addToInterventionPlan:
                            e.target.checked,
                        })
                      )
                    }
                  />

                  <span className="custom-check">
                    {interventionDraft.addToInterventionPlan && (
                      <CheckCircle2
                        size={15}
                      />
                    )}
                  </span>

                  <span className="implementation-plan-text">
                    <strong>
                      Add to intervention
                      plan
                    </strong>

                    <small>
                      Include this intervention
                      in the implementation
                      plan
                    </small>
                  </span>
                </label>
              </div>
            </div>

            <div className="solution-modal-footer">
              <button
                type="button"
                onClick={
                  closeInterventionModal
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="button-primary"
                disabled={solutionSaving}
                onClick={() =>
                  void saveInterventionFromModal()
                }
              >
                <Save size={16} />

                {solutionSaving
                  ? "Saving..."
                  : "Save Intervention"}
              </button>
            </div>
          </div>
        </div>
      )}
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
          {(solutionDesign.interventions || []).length} recorded
        </span>
      }
    >
      <div className="implementation-notice">
        <strong>Important:</strong>
        <span>
          Implementation records what actually happened. The original
          Solution & Design plan is never overwritten.
        </span>
      </div>

      <div className="implementation-list">
        {(solutionDesign.interventions || []).map(
          (planned: any, index: number) => {
            const actual = (
              implementation.interventions || []
            ).find(
              (item: any) =>
                String(item.plannedInterventionId) ===
                String(planned._id)
            );

            return (
              <div
                className="implementation-card"
                key={planned._id || index}
              >
                {/* PLANNED HEADER */}
                <div className="planned-header">
                  <div className="implementation-card-top">
                    <span className="tag">Planned</span>

                    {actual ? (
                      <span className="tag green">
                        {actual.currentStatus || "Implemented"}
                      </span>
                    ) : (
                      <span className="tag">
                        Not started
                      </span>
                    )}
                  </div>

                  <h3>
                    {planned.title || "Untitled intervention"}
                  </h3>

                  <p>
                    {planned.interventionType || "hard"} · Est. ₹
                    {planned.estimatedCost ?? "—"} · Leverage{" "}
                    {planned.leverageEndUserPercent ?? 30}/
                    {planned.leverageSelcoPercent ?? 70}
                  </p>
                </div>

                {/* NOT CREATED */}
                {!actual ? (
                  <div className="implementation-card-footer">
                    <span className="implementation-muted">
                      No implementation record created yet.
                    </span>

                    <button
                      type="button"
                      className="button-primary"
                      disabled={implementationSaving}
                      onClick={() =>
                        void createImplementation(planned._id)
                      }
                    >
                      <Plus size={16} />
                      Create implementation
                    </button>
                  </div>
                ) : (
                  <>
                    {/* CREATED SUMMARY */}
                    <div className="implementation-summary">
                      <div>
                        <small>Actual cost</small>
                        <strong>
                          ₹{actual.actualCost ?? "—"}
                        </strong>
                      </div>

                      <div>
                        <small>End-user contribution</small>
                        <strong>
                          ₹{actual.endUserContribution ?? "—"}
                        </strong>
                      </div>

                      <div>
                        <small>SELCO contribution</small>
                        <strong>
                          ₹{actual.selcoContribution ?? "—"}
                        </strong>
                      </div>

                      <div>
                        <small>Vendor</small>
                        <strong>
                          {actual.vendorName || "—"}
                        </strong>
                      </div>
                    </div>

                    <div className="implementation-card-footer">
                      <span className="implementation-muted">
                        {actual.operationalDate
                          ? `Operational: ${String(
                              actual.operationalDate
                            ).slice(0, 10)}`
                          : "Implementation record created"}
                      </span>

                      <button
                        type="button"
                        className="button-primary"
                        disabled={implementationSaving}
                        onClick={() =>
                          openImplementationModal(actual)
                        }
                      >
                        <Pencil size={16} />
                        Edit implementation
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          }
        )}

        {!(solutionDesign.interventions || []).length && (
          <div className="empty">
            No planned interventions yet. Create them from the
            Solution & Design tab.
          </div>
        )}
      </div>
    </Section>

    {/* IMPLEMENTATION MODAL */}
    {implementationModalOpen &&
      editingImplementation && (
        <div
          className="pp-modal-backdrop"
          onMouseDown={closeImplementationModal}
        >
          <div
            className="pp-modal implementation-modal"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="pp-modal-header">
              <div>
                <h3>Implementation</h3>
                <p>
                  Update what actually happened during
                  implementation.
                </p>
              </div>

              <button
                type="button"
                className="pp-modal-close"
                onClick={closeImplementationModal}
                disabled={implementationSaving}
              >
                <X size={18} />
              </button>
            </div>

            <div className="pp-modal-body">
              <div className="pp-modal-grid">
                {/* ACTUAL COST */}
                <label>
                  <small>Actual cost ₹</small>
                  <input
                    type="number"
                    min="0"
                    value={
                      editingImplementation.actualCost ?? ""
                    }
                    onChange={(e) =>
                      setEditingImplementation(
                        (prev: any) => ({
                          ...prev,
                          actualCost:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                        })
                      )
                    }
                  />
                </label>

                {/* END USER */}
                <label>
                  <small>End-user contribution ₹</small>
                  <input
                    type="number"
                    min="0"
                    value={
                      editingImplementation.endUserContribution ??
                      ""
                    }
                    onChange={(e) =>
                      setEditingImplementation(
                        (prev: any) => ({
                          ...prev,
                          endUserContribution:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                        })
                      )
                    }
                  />
                </label>

                {/* SELCO */}
                <label>
                  <small>SELCO contribution ₹</small>
                  <input
                    type="number"
                    min="0"
                    value={
                      editingImplementation.selcoContribution ??
                      ""
                    }
                    onChange={(e) =>
                      setEditingImplementation(
                        (prev: any) => ({
                          ...prev,
                          selcoContribution:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                        })
                      )
                    }
                  />
                </label>

                {/* VENDOR */}
                <label>
                  <small>Vendor</small>
                  <input
                    value={
                      editingImplementation.vendorName || ""
                    }
                    onChange={(e) =>
                      setEditingImplementation(
                        (prev: any) => ({
                          ...prev,
                          vendorName: e.target.value,
                        })
                      )
                    }
                  />
                </label>

                {/* PROCUREMENT */}
                <label>
                  <small>Procurement date</small>
                  <input
                    type="date"
                    value={
                      editingImplementation.procurementDate
                        ? String(
                            editingImplementation.procurementDate
                          ).slice(0, 10)
                        : ""
                    }
                    onChange={(e) =>
                      setEditingImplementation(
                        (prev: any) => ({
                          ...prev,
                          procurementDate: e.target.value
                            ? new Date(
                                e.target.value
                              ).toISOString()
                            : null,
                        })
                      )
                    }
                  />
                </label>

                {/* INSTALLATION */}
                <label>
                  <small>Installation date</small>
                  <input
                    type="date"
                    value={
                      editingImplementation.installationDate
                        ? String(
                            editingImplementation.installationDate
                          ).slice(0, 10)
                        : ""
                    }
                    onChange={(e) =>
                      setEditingImplementation(
                        (prev: any) => ({
                          ...prev,
                          installationDate: e.target.value
                            ? new Date(
                                e.target.value
                              ).toISOString()
                            : null,
                        })
                      )
                    }
                  />
                </label>

                {/* OPERATIONAL */}
                <label>
                  <small>Operational date</small>
                  <input
                    type="date"
                    value={
                      editingImplementation.operationalDate
                        ? String(
                            editingImplementation.operationalDate
                          ).slice(0, 10)
                        : ""
                    }
                    onChange={(e) =>
                      setEditingImplementation(
                        (prev: any) => ({
                          ...prev,
                          operationalDate: e.target.value
                            ? new Date(
                                e.target.value
                              ).toISOString()
                            : null,
                        })
                      )
                    }
                  />
                </label>

                {/* STATUS */}
                <label>
                  <small>Current status</small>
                  <select
                    value={
                      editingImplementation.currentStatus ||
                      "Proposed"
                    }
                    onChange={(e) =>
                      setEditingImplementation(
                        (prev: any) => ({
                          ...prev,
                          currentStatus: e.target.value,
                        })
                      )
                    }
                  >
                    {implementationStatuses.map(
                      (item) => (
                        <option key={item}>
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </label>

                {/* GPS */}
                <label className="implementation-check-row">
                  <input
                    type="checkbox"
                    checked={Boolean(
                      editingImplementation.gpsSiteConfirmed
                    )}
                    onChange={(e) =>
                      setEditingImplementation(
                        (prev: any) => ({
                          ...prev,
                          gpsSiteConfirmed:
                            e.target.checked,
                        })
                      )
                    }
                  />

                  <span>GPS / site confirmed</span>
                </label>

                {/* LATITUDE */}
                <label>
                  <small>Latitude</small>
                  <input
                    type="number"
                    value={
                      editingImplementation.latitude ?? ""
                    }
                    onChange={(e) =>
                      setEditingImplementation(
                        (prev: any) => ({
                          ...prev,
                          latitude:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                        })
                      )
                    }
                  />
                </label>

                {/* LONGITUDE */}
                <label>
                  <small>Longitude</small>
                  <input
                    type="number"
                    value={
                      editingImplementation.longitude ?? ""
                    }
                    onChange={(e) =>
                      setEditingImplementation(
                        (prev: any) => ({
                          ...prev,
                          longitude:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                        })
                      )
                    }
                  />
                </label>

                {/* REASON */}
                <label className="field-full">
                  <small>
                    Reason for change if implementation differs
                    from plan
                  </small>

                  <textarea
                    rows={4}
                    value={
                      editingImplementation.reasonForChange ||
                      ""
                    }
                    onChange={(e) =>
                      setEditingImplementation(
                        (prev: any) => ({
                          ...prev,
                          reasonForChange:
                            e.target.value,
                        })
                      )
                    }
                  />
                </label>
              </div>
            </div>

            <div className="pp-modal-footer">
              <button
                type="button"
                onClick={closeImplementationModal}
                disabled={implementationSaving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="button-primary"
                onClick={() =>
                  void saveImplementationModal()
                }
                disabled={implementationSaving}
              >
                <Save size={16} />
                {implementationSaving
                  ? "Saving..."
                  : "Save implementation"}
              </button>
            </div>
          </div>
        </div>
      )}
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

