import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type AnyObject = Record<string, any>;

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const safe = (value: any) => {
  if (value === null || value === undefined || value === "") return "—";

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "—";
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "—";
    }
  }

  return String(value);
};

const formatDate = (value: any) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return safe(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value: any) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return safe(value);
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusLabel = (value: any) => {
  if (!value) return "—";

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const solutionLabel = (value: any) => {
  const labels: Record<string, string> = {
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

  return labels[value] || statusLabel(value);
};

const ensurePageSpace = (doc: jsPDF, requiredHeight = 20) => {
  const pageHeight = doc.internal.pageSize.getHeight();

  if (cursorY + requiredHeight > pageHeight - MARGIN) {
    doc.addPage();
    cursorY = MARGIN;
    addPageHeader(doc);
  }
};

let cursorY = MARGIN;

const addPageHeader = (doc: jsPDF) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 110);

  doc.text(
    "SELCO Foundation × KVK | Nandurbar Mela 2026",
    MARGIN,
    8
  );

  doc.setTextColor(0, 0, 0);
};

const addSectionTitle = (doc: jsPDF, title: string) => {
  ensurePageSpace(doc, 15);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);

  doc.text(title, MARGIN, cursorY);

  cursorY += 7;

  doc.setDrawColor(190, 190, 190);
  doc.line(MARGIN, cursorY, PAGE_WIDTH - MARGIN, cursorY);

  cursorY += 6;
};

const addField = (
  doc: jsPDF,
  label: string,
  value: any,
  labelWidth = 55
) => {
  const text = safe(value);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(70, 70, 70);

  doc.text(label, MARGIN, cursorY);

  const valueX = MARGIN + labelWidth;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(25, 25, 25);

  const lines = doc.splitTextToSize(
    text,
    PAGE_WIDTH - MARGIN - valueX
  );

  ensurePageSpace(doc, Math.max(8, lines.length * 4.5));

  doc.text(lines, valueX, cursorY);

  cursorY += Math.max(6, lines.length * 4.5);
};

const addParagraph = (doc: jsPDF, text: any) => {
  const value = safe(text);

  const lines = doc.splitTextToSize(
    value,
    CONTENT_WIDTH
  );

  ensurePageSpace(doc, lines.length * 4.5 + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(35, 35, 35);

  doc.text(lines, MARGIN, cursorY);

  cursorY += lines.length * 4.5 + 4;
};

const addTable = (
  doc: jsPDF,
  headers: string[],
  rows: any[][]
) => {
  ensurePageSpace(doc, 30);

  autoTable(doc, {
    startY: cursorY,
    head: [headers],
    body: rows.map((row) => row.map(safe)),
    margin: {
      left: MARGIN,
      right: MARGIN,
    },
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak",
      valign: "top",
    },
    headStyles: {
      fontStyle: "bold",
    },
    bodyStyles: {
      textColor: [35, 35, 35],
    },
    didDrawPage: () => {
      addPageHeader(doc);
    },
  });

  cursorY =
    (doc as any).lastAutoTable?.finalY ||
    cursorY + 20;

  cursorY += 7;
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;

    reader.readAsDataURL(blob);
  });

const getImageDimensions = (
  dataUrl: string
): Promise<{ width: number; height: number }> =>
  new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.naturalWidth || 1,
        height: img.naturalHeight || 1,
      });
    };

    img.onerror = () => {
      resolve({
        width: 1,
        height: 1,
      });
    };

    img.src = dataUrl;
  });

const fetchImageAsDataUrl = async (
  url: string
): Promise<string | null> => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();

    if (!blob.type.startsWith("image/")) {
      return null;
    }

    return await blobToDataUrl(blob);
  } catch {
    return null;
  }
};

const addImage = async (
  doc: jsPDF,
  url: string,
  fileName?: string
) => {
  if (!url) return;

  const dataUrl = await fetchImageAsDataUrl(url);

  if (!dataUrl) {
    return;
  }

  const dimensions = await getImageDimensions(dataUrl);

  const maxWidth = CONTENT_WIDTH;
  const maxHeight = 90;

  let width = maxWidth;
  let height =
    (dimensions.height / dimensions.width) * width;

  if (height > maxHeight) {
    height = maxHeight;
    width =
      (dimensions.width / dimensions.height) * height;
  }

  ensurePageSpace(doc, height + 20);

  doc.addImage(
    dataUrl,
    "JPEG",
    MARGIN,
    cursorY,
    width,
    height
  );

  cursorY += height + 5;

  if (fileName) {
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);

    doc.text(fileName, MARGIN, cursorY);

    cursorY += 5;
  }
};

const addDocuments = async (
  doc: jsPDF,
  title: string,
  files: any[]
) => {
  if (!files?.length) return;

  addSectionTitle(doc, title);

  for (const file of files) {
    if (!file?.fileUrl) continue;

    const fileType = String(
      file.fileType || ""
    ).toLowerCase();

    if (fileType.includes("image")) {
      await addImage(
        doc,
        file.fileUrl,
        file.fileName
      );
    } else {
      ensurePageSpace(doc, 10);

      addField(
        doc,
        "Document",
        file.fileName || "Document"
      );

      addField(
        doc,
        "Type",
        file.fileType || "Document"
      );
    }
  }
};

const getAssessmentDocuments = (
  assessment: AnyObject
) => {
  const documents = assessment?.documents || {};

  return {
    sitePhotos: documents.sitePhotos || [],
    machineryPhotos: documents.machineryPhotos || [],
    productPhotos: documents.productPhotos || [],
    electricityBill: documents.electricityBill
      ? [documents.electricityBill]
      : [],
    otherDocuments: documents.otherDocuments || [],
  };
};

const addRegistrationSection = (
  doc: jsPDF,
  participant: AnyObject
) => {
  addSectionTitle(doc, "Participant Profile");

  addField(doc, "Name", participant.name);
  addField(doc, "Mobile", participant.mobile);
  addField(doc, "Email", participant.email);
  addField(doc, "Location", participant.location);
  addField(
    doc,
    "Organisation",
    participant.organizationName
  );
  addField(
    doc,
    "Organisation Type",
    statusLabel(participant.organizationType)
  );
  addField(
    doc,
    "Sector",
    statusLabel(participant.sector)
  );
  addField(
    doc,
    "Livelihood Category",
    participant.livelihoodCategory
  );
  addField(
    doc,
    "Preferred Language",
    participant.preferredLanguage
  );
  addField(
    doc,
    "Registration Method",
    statusLabel(participant.registrationMethod)
  );
  addField(
    doc,
    "Registration Date",
    formatDateTime(participant.createdAt)
  );

  addField(
    doc,
    "Assessment Status",
    statusLabel(participant.assessmentStatus)
  );

  addField(
    doc,
    "Implementation Status",
    statusLabel(participant.implementationStatus)
  );

  if (participant.supportSolutions?.length) {
    addField(
      doc,
      "Required Solutions",
      participant.supportSolutions
        .map(solutionLabel)
        .join(", ")
    );
  }

  if (participant.requirements?.length) {
    addSectionTitle(doc, "Post-event Requirements");

    addTable(
      doc,
      ["Requirement", "Details"],
      participant.requirements.map((item: any) => [
        item.title ||
          item.name ||
          item.requirement ||
          "Requirement",
        item.description ||
          item.details ||
          item.value ||
          "—",
      ])
    );
  }
};

const addRegistrationAnswers = (
  doc: jsPDF,
  participant: AnyObject,
  questions: AnyObject[]
) => {
  if (!questions?.length && !participant?.answers?.length) {
    return;
  }

  addSectionTitle(doc, "Original Registration Answers");

  const answerMap = new Map(
    (participant.answers || []).map((answer: any) => [
      String(answer.questionId),
      answer.answer,
    ])
  );

  const rows = questions.map((question: any, index) => [
    index + 1,
    question.question ||
      question.text ||
      question.title ||
      "Question",
    answerMap.get(String(question._id)) ??
      answerMap.get(String(question.id)) ??
      "—",
  ]);

  if (rows.length) {
    addTable(
      doc,
      ["#", "Question", "Answer"],
      rows
    );
  }
};

const addAssessmentSection = (
  doc: jsPDF,
  assessment: AnyObject,
  questions: AnyObject[]
) => {
  addSectionTitle(doc, "Detailed Assessment");

  const questionKeys = [
    "livelihoodAndProcess",
    "difficultActivity",
    "productionCapacityAndSeasonality",
    "machinesAndManualActivities",
    "monthlyFinancials",
    "operatingCosts",
    "powerSourceAndIssues",
    "requiredImprovementOrSolution",
    "loansAndSpaceDetails",
    "futureScaleAndSupport",
    "expectedSolution",
    "identifiedSolution",
  ];

  const rows = questions?.length
    ? questions.map((question: any, index: number) => [
        index + 1,
        question.question ||
          question.text ||
          question.title ||
          "Question",
        assessment?.[question.key] ||
          assessment?.[questionKeys[index]] ||
          "—",
      ])
    : questionKeys.map((key, index) => [
        index + 1,
        key,
        assessment?.[key] || "—",
      ]);

  addTable(
    doc,
    ["#", "Assessment Question", "Answer"],
    rows
  );

  if (assessment?.geolocation) {
    addSectionTitle(doc, "Assessment Geolocation");

    addField(
      doc,
      "Latitude",
      assessment.geolocation.latitude
    );

    addField(
      doc,
      "Longitude",
      assessment.geolocation.longitude
    );

    addField(
      doc,
      "Captured At",
      formatDateTime(
        assessment.geolocation.capturedAt
      )
    );
  }
};

const addSolutionDesignSection = (
  doc: jsPDF,
  solutionDesign: AnyObject
) => {
  addSectionTitle(doc, "Solution & Design");

  if (solutionDesign?.gaps?.length) {
    addTable(
      doc,
      ["Gap", "Description"],
      solutionDesign.gaps.map((gap: any) => [
        gap.name,
        gap.description,
      ])
    );
  }

  if (solutionDesign?.interventions?.length) {
    addSectionTitle(doc, "Recommended Interventions");

    addTable(
      doc,
      [
        "Type",
        "Title",
        "Specification",
        "Priority",
        "Estimated Cost",
        "Team Decision",
        "Status",
      ],
      solutionDesign.interventions.map(
        (item: any) => [
          item.interventionType,
          item.title,
          item.specification,
          item.priority,
          item.estimatedCost,
          item.teamDecision,
          item.status,
        ]
      )
    );

    addSectionTitle(doc, "Intervention Details");

    for (const intervention of solutionDesign.interventions) {
      addField(
        doc,
        "Intervention",
        intervention.title
      );

      addField(
        doc,
        "Why",
        intervention.why
      );

      addField(
        doc,
        "Source",
        intervention.source
      );

      addField(
        doc,
        "Leverage - End User",
        intervention.leverageEndUserPercent
          ? `${intervention.leverageEndUserPercent}%`
          : "—"
      );

      addField(
        doc,
        "Leverage - SELCO",
        intervention.leverageSelcoPercent
          ? `${intervention.leverageSelcoPercent}%`
          : "—"
      );

      addField(
        doc,
        "Decision Rationale",
        intervention.decisionRationale
      );

      addField(
        doc,
        "Add To Intervention Plan",
        intervention.addToInterventionPlan
      );

      cursorY += 2;
    }
  }

  if (solutionDesign?.indicators?.length) {
    addSectionTitle(doc, "Indicators");

    addTable(
      doc,
      [
        "Indicator",
        "Baseline",
        "Target",
        "Current",
        "Date Measured",
      ],
      solutionDesign.indicators.map(
        (indicator: any) => [
          indicator.name,
          indicator.baseline,
          indicator.target,
          indicator.current,
          formatDate(indicator.dateMeasured),
        ]
      )
    );
  }
};

const addImplementationSection = (
  doc: jsPDF,
  implementation: AnyObject
) => {
  if (!implementation?.interventions?.length) {
    return;
  }

  addSectionTitle(doc, "Implementation");

  for (const item of implementation.interventions) {
    addField(
      doc,
      "Intervention",
      item.interventionTitle ||
        item.title ||
        item.interventionId
    );

    addField(
      doc,
      "Status",
      statusLabel(
        item.currentStatus ||
          item.status
      )
    );

    addField(
      doc,
      "Actual Cost",
      item.actualCost
    );

    addField(
      doc,
      "End User Contribution",
      item.endUserContribution
    );

    addField(
      doc,
      "SELCO Contribution",
      item.selcoContribution
    );

    addField(
      doc,
      "Vendor",
      item.vendorName
    );

    addField(
      doc,
      "Procurement Date",
      formatDate(item.procurementDate)
    );

    addField(
      doc,
      "Installation Date",
      formatDate(item.installationDate)
    );

    addField(
      doc,
      "Operational Date",
      formatDate(item.operationalDate)
    );

    addField(
      doc,
      "GPS Confirmed",
      item.gpsSiteConfirmed
    );

    if (
      item.latitude !== undefined &&
      item.longitude !== undefined
    ) {
      addField(
        doc,
        "GPS",
        `${safe(item.latitude)}, ${safe(item.longitude)}`
      );
    }

    addField(
      doc,
      "Reason For Change",
      item.reasonForChange
    );

    cursorY += 3;
  }
};

const addWhatsAppSection = (
  doc: jsPDF,
  interactions: AnyObject[]
) => {
  if (!interactions?.length) {
    return;
  }

  addSectionTitle(doc, "WhatsApp Messages");

  addTable(
    doc,
    [
      "Date",
      "Direction",
      "Type",
      "Message",
      "Status",
    ],
    interactions.map((item: any) => [
      formatDateTime(
        item.createdAt ||
          item.updatedAt
      ),
      item.direction ||
        item.type ||
        "—",
      item.messageType ||
        item.templateName ||
        "—",
      item.message ||
        item.text ||
        item.body ||
        "—",
      item.status ||
        "—",
    ])
  );
};

const addFooter = (doc: jsPDF) => {
  const totalPages = doc.getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);

    doc.text(
      `Participant Journey Report • Page ${page} of ${totalPages}`,
      MARGIN,
      PAGE_HEIGHT - 7
    );

    doc.text(
      "SELCO Foundation × KVK | Nandurbar Mela 2026",
      PAGE_WIDTH - MARGIN,
      PAGE_HEIGHT - 7,
      { align: "right" }
    );
  }
};

export const generateParticipantPdf = async ({
  participant,
  questions,
  assessment,
  solutionDesign,
  implementation,
  whatsapp,
}: {
  participant: AnyObject;
  questions: AnyObject[];
  assessment: AnyObject;
  solutionDesign: AnyObject;
  implementation: AnyObject;
  whatsapp: AnyObject[];
}) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  cursorY = MARGIN + 10;

  addPageHeader(doc);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(25, 25, 25);

  doc.text(
    "Participant Journey Report",
    MARGIN,
    cursorY
  );

  cursorY += 8;

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");

  doc.text(
    "Nandurbar Mela 2026",
    MARGIN,
    cursorY
  );

  cursorY += 5;

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);

  doc.text(
    "SELCO Foundation × KVK",
    MARGIN,
    cursorY
  );

  cursorY += 10;

  addRegistrationSection(
    doc,
    participant
  );

  addRegistrationAnswers(
    doc,
    participant,
    questions
  );

  addAssessmentSection(
    doc,
    assessment,
    questions
  );

  const documents =
    getAssessmentDocuments(assessment);

  await addDocuments(
    doc,
    "Site Photos",
    documents.sitePhotos
  );

  await addDocuments(
    doc,
    "Machinery Photos",
    documents.machineryPhotos
  );

  await addDocuments(
    doc,
    "Product Photos",
    documents.productPhotos
  );

  await addDocuments(
    doc,
    "Electricity Bill",
    documents.electricityBill
  );

  await addDocuments(
    doc,
    "Other Documents",
    documents.otherDocuments
  );

  addSolutionDesignSection(
    doc,
    solutionDesign
  );

  addImplementationSection(
    doc,
    implementation
  );

  addWhatsAppSection(
    doc,
    whatsapp
  );

  addFooter(doc);

  const safeName = String(
    participant.name ||
      participant.fullName ||
      "participant"
  )
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-");

  doc.save(
    `participant-journey-${safeName || "participant"}.pdf`
  );
};