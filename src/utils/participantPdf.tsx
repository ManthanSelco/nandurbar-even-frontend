import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type AnyObject = Record<string, any>;

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

let cursorY = MARGIN;

/* -------------------------------------------------------------------------- */
/* COLORS                                                                     */
/* -------------------------------------------------------------------------- */

const COLORS = {
  dark: [30, 41, 59] as [number, number, number],
  text: [51, 65, 85] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  light: [241, 245, 249] as [number, number, number],
  border: [203, 213, 225] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  accent: [37, 99, 235] as [number, number, number],
  success: [22, 163, 74] as [number, number, number],
};

/* -------------------------------------------------------------------------- */
/* BASIC HELPERS                                                              */
/* -------------------------------------------------------------------------- */

const isObject = (value: any): value is AnyObject =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value);

const safe = (value: any): string => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    if (!value.length) return "—";

    return (
      value
        .map((item) => safe(item))
        .filter((item) => item !== "—")
        .join(", ") || "—"
    );
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

const cleanText = (value: any): string => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "string") {
    const text = value.trim();

    if (!text) return "—";

    return text;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (Array.isArray(value)) {
    const values = value
      .map((item) => cleanText(item))
      .filter((item) => item !== "—");

    return values.length ? values.join(", ") : "—";
  }

  if (isObject(value)) {
    const nestedKeys = [
      "answer",
      "value",
      "response",
      "text",
      "label",
      "name",
      "description",
    ];

    for (const key of nestedKeys) {
      if (
        value[key] !== undefined &&
        value[key] !== null &&
        value[key] !== ""
      ) {
        const result = cleanText(value[key]);

        if (result !== "—") {
          return result;
        }
      }
    }

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

const humanizeKey = (value: string) =>
  String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

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

/* -------------------------------------------------------------------------- */
/* PARTICIPANT RESOLVERS                                                      */
/* -------------------------------------------------------------------------- */

const getParticipantName = (participant: AnyObject) =>
  participant?.name ||
  participant?.fullName ||
  participant?.participantName ||
  participant?.personalDetails?.name ||
  participant?.profile?.name ||
  "Participant";

const getParticipantMobile = (participant: AnyObject) => {
  const mobile =
    participant?.mobile ||
    participant?.phone ||
    participant?.mobileNumber ||
    participant?.contactNumber ||
    participant?.contact?.mobile ||
    participant?.contact?.mobileNumber;

  if (!mobile) return "—";

  const countryCode =
    participant?.countryCode ||
    participant?.contact?.countryCode;

  if (
    countryCode &&
    !String(mobile).startsWith(String(countryCode))
  ) {
    return `${countryCode} ${mobile}`;
  }

  return String(mobile);
};

const getParticipantEmail = (participant: AnyObject) =>
  participant?.email ||
  participant?.contact?.email ||
  participant?.profile?.email ||
  "—";

const getParticipantLocation = (participant: AnyObject) => {
  const address = participant?.address;

  if (typeof address === "string") {
    return address;
  }

  return (
    participant?.location ||
    participant?.village ||
    participant?.locationName ||
    address?.village ||
    address?.location ||
    address?.city ||
    address?.district ||
    "—"
  );
};

const getOrganizationName = (participant: AnyObject) =>
  participant?.organizationName ||
  participant?.organisationName ||
  participant?.organization ||
  participant?.organisation ||
  participant?.businessName ||
  "—";

const getOrganizationType = (participant: AnyObject) =>
  participant?.organizationType ||
  participant?.organisationType ||
  participant?.organization?.type ||
  "—";

const getSector = (participant: AnyObject) =>
  participant?.sector ||
  participant?.profile?.sector ||
  participant?.business?.sector ||
  "—";

const getLivelihood = (participant: AnyObject) =>
  participant?.livelihoodCategory ||
  participant?.livelihood?.category ||
  participant?.profile?.livelihoodCategory ||
  "—";

const getLanguage = (participant: AnyObject) =>
  participant?.preferredLanguage ||
  participant?.language ||
  participant?.profile?.preferredLanguage ||
  "—";

/* -------------------------------------------------------------------------- */
/* PAGE MANAGEMENT                                                            */
/* -------------------------------------------------------------------------- */

const addPageHeader = (doc: jsPDF) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.muted);

  doc.text(
    "SELCO Foundation × KVK",
    MARGIN,
    8
  );

  doc.text(
    "NANDURBAR MELA 2026",
    PAGE_WIDTH - MARGIN,
    8,
    { align: "right" }
  );
};

const ensurePageSpace = (
  doc: jsPDF,
  requiredHeight = 20
) => {
  const pageHeight = doc.internal.pageSize.getHeight();

  if (
    cursorY + requiredHeight >
    pageHeight - MARGIN
  ) {
    doc.addPage();

    cursorY = MARGIN + 5;

    addPageHeader(doc);
  }
};

/* -------------------------------------------------------------------------- */
/* SECTION UI                                                                 */
/* -------------------------------------------------------------------------- */

const addSectionTitle = (
  doc: jsPDF,
  title: string,
  subtitle?: string
) => {
  ensurePageSpace(doc, subtitle ? 23 : 17);

  doc.setFillColor(...COLORS.dark);

  doc.roundedRect(
    MARGIN,
    cursorY,
    CONTENT_WIDTH,
    subtitle ? 17 : 12,
    2,
    2,
    "F"
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.white);

  doc.text(
    title,
    MARGIN + 5,
    cursorY + 7.5
  );

  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(226, 232, 240);

    doc.text(
      subtitle,
      MARGIN + 5,
      cursorY + 13
    );
  }

  cursorY += subtitle ? 23 : 18;
};

const addField = (
  doc: jsPDF,
  label: string,
  value: any,
  labelWidth = 50
) => {
  const text = cleanText(value);

  const valueX = MARGIN + labelWidth;

  const availableWidth =
    PAGE_WIDTH - MARGIN - valueX;

  const lines = doc.splitTextToSize(
    text,
    availableWidth
  );

  const height = Math.max(
    7,
    lines.length * 4.2 + 3
  );

  ensurePageSpace(doc, height + 2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);

  doc.text(
    label,
    MARGIN,
    cursorY
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.text);

  doc.text(
    lines,
    valueX,
    cursorY
  );

  cursorY += height;
};

const addParagraph = (
  doc: jsPDF,
  text: any
) => {
  const value = cleanText(text);

  const lines = doc.splitTextToSize(
    value,
    CONTENT_WIDTH
  );

  ensurePageSpace(
    doc,
    lines.length * 4.2 + 6
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.text);

  doc.text(
    lines,
    MARGIN,
    cursorY
  );

  cursorY +=
    lines.length * 4.2 + 5;
};

/* -------------------------------------------------------------------------- */
/* INFO CARDS                                                                 */
/* -------------------------------------------------------------------------- */

const addInfoCards = (
  doc: jsPDF,
  cards: {
    label: string;
    value: any;
  }[]
) => {
  const gap = 4;

  const cardWidth =
    (CONTENT_WIDTH - gap) / 2;

  const cardHeight = 17;

  for (
    let i = 0;
    i < cards.length;
    i += 2
  ) {
    ensurePageSpace(
      doc,
      cardHeight + 5
    );

    const pair = cards.slice(
      i,
      i + 2
    );

    pair.forEach(
      (card, index) => {
        const x =
          MARGIN +
          index *
            (cardWidth + gap);

        doc.setFillColor(
          ...COLORS.light
        );

        doc.setDrawColor(
          ...COLORS.border
        );

        doc.roundedRect(
          x,
          cursorY,
          cardWidth,
          cardHeight,
          2,
          2,
          "FD"
        );

        doc.setFont(
          "helvetica",
          "bold"
        );

        doc.setFontSize(6.8);

        doc.setTextColor(
          ...COLORS.muted
        );

        doc.text(
          String(card.label).toUpperCase(),
          x + 4,
          cursorY + 5
        );

        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(8.2);

        doc.setTextColor(
          ...COLORS.dark
        );

        const value =
          cleanText(card.value);

        const lines =
          doc.splitTextToSize(
            value,
            cardWidth - 8
          );

        doc.text(
          lines.slice(0, 2),
          x + 4,
          cursorY + 11
        );
      }
    );

    cursorY +=
      cardHeight + 4;
  }
};

/* -------------------------------------------------------------------------- */
/* TABLE                                                                      */
/* -------------------------------------------------------------------------- */

const addTable = (
  doc: jsPDF,
  headers: string[],
  rows: any[][]
) => {
  if (!rows.length) return;

  ensurePageSpace(doc, 25);

  autoTable(doc, {
    startY: cursorY,

    head: [headers],

    body: rows.map((row) =>
      row.map((value) =>
        cleanText(value)
      )
    ),

    margin: {
      left: MARGIN,
      right: MARGIN,
      bottom: 15,
    },

    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: 3,
      overflow: "linebreak",
      valign: "top",
      textColor: COLORS.text,
      lineColor: COLORS.border,
      lineWidth: 0.15,
    },

    headStyles: {
      fillColor: COLORS.dark,
      textColor: COLORS.white,
      fontStyle: "bold",
      fontSize: 7.5,
    },

    alternateRowStyles: {
      fillColor: [248, 250, 252],
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

/* -------------------------------------------------------------------------- */
/* IMAGE HELPERS                                                              */
/* -------------------------------------------------------------------------- */

const blobToDataUrl = (
  blob: Blob
): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () =>
      resolve(String(reader.result));

    reader.onerror = reject;

    reader.readAsDataURL(blob);
  });

const loadImage = (
  dataUrl: string
): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () =>
      resolve(img);

    img.onerror = () =>
      reject(
        new Error(
          "Unable to load image"
        )
      );

    img.src = dataUrl;
  });

const fetchImageAsDataUrl = async (
  url: string,
  fileName?: string
): Promise<string | null> => {
  try {
    if (!url) return null;

    const response =
      await fetch(url);

    if (!response.ok) {
      console.error(
        "PDF image fetch failed:",
        response.status,
        fileName
      );

      return null;
    }

    const blob =
      await response.blob();

    if (
      !blob.type.startsWith("image/")
    ) {
      console.error(
        "PDF file is not image:",
        blob.type,
        fileName
      );

      return null;
    }

    return await blobToDataUrl(blob);
  } catch (error) {
    console.error(
      "PDF image fetch error:",
      fileName,
      error
    );

    return null;
  }
};

const convertImageToJpeg = async (
  dataUrl: string
) => {
  const img =
    await loadImage(dataUrl);

  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width =
    img.naturalWidth || 1;

  canvas.height =
    img.naturalHeight || 1;

  const context =
    canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "Canvas context unavailable"
    );
  }

  context.fillStyle = "#ffffff";

  context.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  context.drawImage(
    img,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas.toDataURL(
    "image/jpeg",
    0.9
  );
};

const getImageData = async (
  url: string,
  fileName?: string
) => {
  const dataUrl =
    await fetchImageAsDataUrl(
      url,
      fileName
    );

  if (!dataUrl) {
    return null;
  }

  const mimeMatch =
    dataUrl.match(
      /^data:image\/([^;]+);base64,/i
    );

  const mime =
    mimeMatch?.[1]?.toLowerCase();

  if (
    mime === "png"
  ) {
    return {
      dataUrl,
      format: "PNG" as const,
    };
  }

  if (
    mime === "jpeg" ||
    mime === "jpg"
  ) {
    return {
      dataUrl,
      format: "JPEG" as const,
    };
  }

  return {
    dataUrl:
      await convertImageToJpeg(
        dataUrl
      ),
    format: "JPEG" as const,
  };
};

/* -------------------------------------------------------------------------- */
/* IMAGE GALLERY                                                              */
/* -------------------------------------------------------------------------- */

const addImageGallery = async (
  doc: jsPDF,
  title: string,
  files: any[]
) => {
  if (
    !Array.isArray(files) ||
    !files.length
  ) {
    return;
  }

  addSectionTitle(
    doc,
    title,
    `${files.length} file${
      files.length === 1
        ? ""
        : "s"
    }`
  );

  const gap = 5;

  const cardWidth =
    (CONTENT_WIDTH - gap) / 2;

  const cardHeight = 78;

  for (
    let index = 0;
    index < files.length;
    index++
  ) {
    const file = files[index];

    if (!file?.fileUrl) {
      continue;
    }

    const column =
      index % 2;

    const row =
      Math.floor(index / 2);

    if (column === 0) {
      ensurePageSpace(
        doc,
        cardHeight + 5
      );
    }

    /*
     * If a new page was created,
     * restart gallery row position.
     */
    const x =
      MARGIN +
      column *
        (cardWidth + gap);

    const y = cursorY;

    /*
     * Background card
     */
    doc.setFillColor(
      ...COLORS.white
    );

    doc.setDrawColor(
      ...COLORS.border
    );

    doc.roundedRect(
      x,
      y,
      cardWidth,
      cardHeight,
      2,
      2,
      "FD"
    );

    try {
      const image =
        await getImageData(
          file.fileUrl,
          file.fileName
        );

      if (image) {
        const img =
          await loadImage(
            image.dataUrl
          );

        const naturalWidth =
          img.naturalWidth || 1;

        const naturalHeight =
          img.naturalHeight || 1;

        const boxX = x + 3;
        const boxY = y + 3;

        const boxWidth =
          cardWidth - 6;

        const boxHeight = 62;

        const ratio = Math.min(
          boxWidth / naturalWidth,
          boxHeight / naturalHeight
        );

        const imageWidth =
          naturalWidth * ratio;

        const imageHeight =
          naturalHeight * ratio;

        const imageX =
          boxX +
          (boxWidth -
            imageWidth) /
            2;

        const imageY =
          boxY +
          (boxHeight -
            imageHeight) /
            2;

        doc.addImage(
          image.dataUrl,
          image.format,
          imageX,
          imageY,
          imageWidth,
          imageHeight
        );
      } else {
        doc.setFont(
          "helvetica",
          "normal"
        );

        doc.setFontSize(8);

        doc.setTextColor(
          ...COLORS.muted
        );

        doc.text(
          "Image unavailable",
          x + cardWidth / 2,
          y + 35,
          {
            align: "center",
          }
        );
      }
    } catch (error) {
      console.error(
        "PDF gallery image error:",
        file.fileName,
        error
      );

      doc.setFont(
        "helvetica",
        "normal"
      );

      doc.setFontSize(8);

      doc.setTextColor(
        ...COLORS.muted
      );

      doc.text(
        "Unable to load image",
        x + cardWidth / 2,
        y + 35,
        {
          align: "center",
        }
      );
    }

    /*
     * Filename
     */
    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(6.5);

    doc.setTextColor(
      ...COLORS.muted
    );

    const fileName =
      file.fileName ||
      "Image";

    const fileLines =
      doc.splitTextToSize(
        fileName,
        cardWidth - 8
      );

    doc.text(
      fileLines.slice(0, 1),
      x + 4,
      y + 72
    );

    /*
     * After second image of row,
     * move cursor.
     */
    if (
      column === 1 ||
      index === files.length - 1
    ) {
      cursorY +=
        cardHeight + 5;
    }
  }
};

/* -------------------------------------------------------------------------- */
/* DOCUMENTS                                                                  */
/* -------------------------------------------------------------------------- */

const addDocuments = async (
  doc: jsPDF,
  title: string,
  files: any[]
) => {
  if (
    !Array.isArray(files) ||
    !files.length
  ) {
    return;
  }

  const imageFiles: any[] = [];
  const otherFiles: any[] = [];

  files.forEach((file) => {
    const type =
      String(
        file?.fileType || ""
      ).toLowerCase();

    const name =
      String(
        file?.fileName || ""
      ).toLowerCase();

    const isImage =
      type.includes("image") ||
      /\.(jpg|jpeg|png|webp|gif)$/i.test(
        name
      );

    if (isImage) {
      imageFiles.push(file);
    } else {
      otherFiles.push(file);
    }
  });

  if (imageFiles.length) {
    await addImageGallery(
      doc,
      title,
      imageFiles
    );
  } else if (otherFiles.length) {
    addSectionTitle(
      doc,
      title
    );
  }

  if (otherFiles.length) {
    addTable(
      doc,
      [
        "Document",
        "Type",
      ],
      otherFiles.map(
        (file: any) => [
          file?.fileName ||
            "Document",

          file?.fileType ||
            "Document",
        ]
      )
    );
  }
};

const normalizeDocuments = (
  assessment: AnyObject
) => {
  const documents =
    assessment?.documents || {};

  const electricityBill =
    documents.electricityBill;

  return {
    sitePhotos:
      Array.isArray(
        documents.sitePhotos
      )
        ? documents.sitePhotos
        : [],

    machineryPhotos:
      Array.isArray(
        documents.machineryPhotos
      )
        ? documents.machineryPhotos
        : [],

    productPhotos:
      Array.isArray(
        documents.productPhotos
      )
        ? documents.productPhotos
        : [],

    electricityBill:
      Array.isArray(
        electricityBill
      )
        ? electricityBill
        : electricityBill
        ? [electricityBill]
        : [],

    otherDocuments:
      Array.isArray(
        documents.otherDocuments
      )
        ? documents.otherDocuments
        : [],
  };
};

/* -------------------------------------------------------------------------- */
/* PARTICIPANT PROFILE                                                        */
/* -------------------------------------------------------------------------- */

const addRegistrationSection = (
  doc: jsPDF,
  participant: AnyObject
) => {
  addSectionTitle(
    doc,
    "01. Participant Profile",
    "Registration and participant information"
  );

  addInfoCards(doc, [
    {
      label: "Participant",
      value: getParticipantName(
        participant
      ),
    },
    {
      label: "Mobile",
      value: getParticipantMobile(
        participant
      ),
    },
    {
      label: "Organisation",
      value: getOrganizationName(
        participant
      ),
    },
    {
      label: "Location",
      value: getParticipantLocation(
        participant
      ),
    },
    {
      label: "Sector",
      value: statusLabel(
        getSector(participant)
      ),
    },
    {
      label: "Livelihood",
      value: getLivelihood(
        participant
      ),
    },
    {
      label: "Assessment",
      value: statusLabel(
        participant.assessmentStatus
      ),
    },
    {
      label: "Implementation",
      value: statusLabel(
        participant.implementationStatus
      ),
    },
  ]);

  addField(
    doc,
    "Email",
    getParticipantEmail(
      participant
    )
  );

  addField(
    doc,
    "Organisation Type",
    statusLabel(
      getOrganizationType(
        participant
      )
    )
  );

  addField(
    doc,
    "Preferred Language",
    getLanguage(participant)
  );

  addField(
    doc,
    "Registration Method",
    statusLabel(
      participant.registrationMethod
    )
  );

  addField(
    doc,
    "Registration Date",
    formatDateTime(
      participant.createdAt
    )
  );

  if (
    Array.isArray(
      participant.supportSolutions
    ) &&
    participant.supportSolutions.length
  ) {
    addField(
      doc,
      "Required Solutions",
      participant.supportSolutions
        .map(solutionLabel)
        .join(", ")
    );
  }

  if (
    Array.isArray(
      participant.requirements
    ) &&
    participant.requirements.length
  ) {
    addSectionTitle(
      doc,
      "Post-event Requirements"
    );

    addTable(
      doc,
      [
        "Requirement",
        "Details",
      ],
      participant.requirements.map(
        (item: any) => [
          item?.title ||
            item?.name ||
            item?.requirement ||
            "Requirement",

          item?.description ||
            item?.details ||
            item?.value ||
            "—",
        ]
      )
    );
  }
};

/* -------------------------------------------------------------------------- */
/* ORIGINAL REGISTRATION ANSWERS                                              */
/* -------------------------------------------------------------------------- */

const addRegistrationAnswers = (
  doc: jsPDF,
  participant: AnyObject,
  questions: AnyObject[]
) => {
  const answers =
    Array.isArray(
      participant?.answers
    )
      ? participant.answers
      : [];

  if (
    !questions?.length &&
    !answers.length
  ) {
    return;
  }

  addSectionTitle(
    doc,
    "02. Original Registration Answers"
  );

  const answerMap =
    new Map<string, any>();

  answers.forEach(
    (answer: any) => {
      const possibleKeys = [
        answer?.questionId,
        answer?.question?._id,
        answer?.questionKey,
        answer?.question?.key,
        answer?.key,
      ];

      possibleKeys.forEach(
        (key) => {
          if (
            key !== undefined &&
            key !== null
          ) {
            answerMap.set(
              String(key),
              answer?.answer ??
                answer?.value ??
                answer?.response ??
                answer?.text ??
                "—"
            );
          }
        }
      );
    }
  );

  const rows =
    questions.map(
      (
        question: any,
        index: number
      ) => {
        const id =
          question?._id ??
          question?.id;

        const key =
          question?.key ??
          question?.questionKey;

        const answer =
          answerMap.get(
            String(id)
          ) ??
          answerMap.get(
            String(key)
          ) ??
          "—";

        return [
          index + 1,

          question?.question ||
            question?.text ||
            question?.title ||
            "Question",

          cleanText(answer),
        ];
      }
    );

  if (rows.length) {
    addTable(
      doc,
      [
        "#",
        "Question",
        "Answer",
      ],
      rows
    );
  }
};

/* -------------------------------------------------------------------------- */
/* DETAILED ASSESSMENT                                                        */
/* -------------------------------------------------------------------------- */

const ASSESSMENT_FIELDS = [
  {
    key: "livelihoodAndProcess",
    label: "Main livelihood and process",
    aliases: [
      "mainLivelihood",
      "livelihood",
      "livelihoodProcess",
    ],
  },
  {
    key: "difficultActivity",
    label: "Most difficult activity",
    aliases: [
      "mostDifficultActivity",
      "difficultProcess",
    ],
  },
  {
    key: "productionCapacityAndSeasonality",
    label: "Production capacity and seasonality",
    aliases: [
      "productionCapacity",
      "capacityAndSeasonality",
      "production",
    ],
  },
  {
    key: "machinesAndManualActivities",
    label: "Machines, tools and manual activities",
    aliases: [
      "machinesAndTools",
      "machinesToolsManualActivities",
      "machines",
    ],
  },
  {
    key: "monthlyFinancials",
    label: "Monthly sales, expenses and net profit",
    aliases: [
      "monthlySalesExpensesProfit",
      "salesExpensesProfit",
      "financials",
    ],
  },
  {
    key: "operatingCosts",
    label: "Major operating costs",
    aliases: [
      "majorOperatingCosts",
      "operationalCosts",
    ],
  },
  {
    key: "powerSourceAndIssues",
    label: "Power source and electricity issues",
    aliases: [
      "powerSource",
      "electricityAndPowerIssues",
      "powerIssues",
    ],
  },
  {
    key: "requiredImprovementOrSolution",
    label: "Required improvement or solution",
    aliases: [
      "requiredImprovement",
      "solutionRequired",
      "requiredSolution",
    ],
  },
  {
    key: "loansAndSpaceDetails",
    label: "Loans and space details",
    aliases: [
      "loansAndSpace",
      "loanAndSpaceDetails",
      "loans",
      "spaceDetails",
    ],
  },
  {
    key: "futureScaleAndSupport",
    label: "Future scale and support",
    aliases: [
      "futureScale",
      "futureSupport",
      "scaleAndSupport",
    ],
  },
  {
    key: "expectedSolution",
    label: "Expected solution",
    aliases: [
      "expectedSupport",
      "expectedIntervention",
    ],
  },
  {
    key: "identifiedSolution",
    label: "Identified solution",
    aliases: [
      "identifiedIntervention",
      "selectedSolution",
    ],
  },
];

const unwrapAssessment = (
  raw: any
): AnyObject => {
  let current = raw;

  for (let i = 0; i < 6; i++) {
    if (
      !current ||
      typeof current !== "object" ||
      Array.isArray(current)
    ) {
      return {};
    }

    if (
      current.assessment &&
      isObject(current.assessment)
    ) {
      current =
        current.assessment;

      continue;
    }

    if (
      current.detailedAssessment &&
      isObject(
        current.detailedAssessment
      )
    ) {
      current =
        current.detailedAssessment;

      continue;
    }

    if (
      current.data &&
      isObject(current.data) &&
      (
        current.data.assessment ||
        current.data.detailedAssessment
      )
    ) {
      current =
        current.data;

      continue;
    }

    break;
  }

  return isObject(current)
    ? current
    : {};
};

const getAssessmentAnswer = (
  assessment: AnyObject,
  field: typeof ASSESSMENT_FIELDS[number]
) => {
  const source =
    unwrapAssessment(
      assessment
    );

  const keys = [
    field.key,
    ...field.aliases,
  ];

  /*
   * Direct field lookup
   */
  for (const key of keys) {
    const value =
      source?.[key];

    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      return cleanText(value);
    }
  }

  /*
   * Nested answer arrays
   */
  const collections = [
    source?.answers,
    source?.responses,
    source?.assessmentAnswers,
  ];

  for (
    const collection of collections
  ) {
    if (
      !Array.isArray(collection)
    ) {
      continue;
    }

    const found =
      collection.find(
        (item: any) => {
          const itemKey =
            item?.key ||
            item?.field ||
            item?.questionKey;

          return keys.includes(
            String(itemKey)
          );
        }
      );

    if (found) {
      return cleanText(
        found?.answer ??
          found?.value ??
          found?.response ??
          found?.text
      );
    }
  }

  return "—";
};

const getDynamicAssessmentFields = (
  assessment: AnyObject
) => {
  const excluded = new Set([
    "_id",
    "documents",
    "geolocation",
    "lastUpdatedAt",
    "createdAt",
    "updatedAt",
    "answers",
    "responses",
    "assessmentAnswers",
  ]);

  const known = new Set(
    ASSESSMENT_FIELDS.map(
      (field) => field.key
    )
  );

  return Object.entries(
    assessment || {}
  )
    .filter(
      ([key, value]) =>
        !excluded.has(key) &&
        !known.has(key) &&
        value !== null &&
        value !== undefined &&
        value !== ""
    )
    .map(
      ([key]) => ({
        key,
        label: humanizeKey(key),
        aliases: [],
      })
    );
};

/* -------------------------------------------------------------------------- */
/* ASSESSMENT CARDS                                                           */
/* -------------------------------------------------------------------------- */

const addAssessmentCard = (
  doc: jsPDF,
  number: number,
  question: string,
  answer: string
) => {
  const questionLines =
    doc.splitTextToSize(
      question,
      CONTENT_WIDTH - 10
    );

  const answerLines =
    doc.splitTextToSize(
      cleanText(answer),
      CONTENT_WIDTH - 10
    );

  const height =
    8 +
    questionLines.length * 3.8 +
    3 +
    answerLines.length * 4 +
    7;

  ensurePageSpace(
    doc,
    height + 4
  );

  doc.setFillColor(
    ...COLORS.light
  );

  doc.setDrawColor(
    ...COLORS.border
  );

  doc.roundedRect(
    MARGIN,
    cursorY,
    CONTENT_WIDTH,
    height,
    2,
    2,
    "FD"
  );

  /*
   * Number badge
   */
  doc.setFillColor(
    ...COLORS.accent
  );

  doc.roundedRect(
    MARGIN + 4,
    cursorY + 4,
    8,
    8,
    1.5,
    1.5,
    "F"
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(7);

  doc.setTextColor(
    ...COLORS.white
  );

  doc.text(
    String(number),
    MARGIN + 8,
    cursorY + 9.2,
    {
      align: "center",
    }
  );

  /*
   * Question
   */
  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(8.5);

  doc.setTextColor(
    ...COLORS.dark
  );

  doc.text(
    questionLines,
    MARGIN + 16,
    cursorY + 7
  );

  const questionHeight =
    questionLines.length * 3.8;

  /*
   * Answer label
   */
  const answerY =
    cursorY +
    9 +
    questionHeight;

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(6.5);

  doc.setTextColor(
    ...COLORS.muted
  );

  doc.text(
    "ANSWER",
    MARGIN + 6,
    answerY
  );

  /*
   * Answer
   */
  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(8);

  doc.setTextColor(
    ...COLORS.text
  );

  doc.text(
    answerLines,
    MARGIN + 6,
    answerY + 5
  );

  cursorY +=
    height + 5;
};

const addAssessmentSection = (
  doc: jsPDF,
  assessment: AnyObject
) => {
  const source =
    unwrapAssessment(
      assessment
    );

  addSectionTitle(
    doc,
    "03. Detailed Assessment",
    "Participant assessment responses and field observations"
  );

  const fields = [
    ...ASSESSMENT_FIELDS,
    ...getDynamicAssessmentFields(
      source
    ),
  ];

  fields.forEach(
    (field, index) => {
      const answer =
        getAssessmentAnswer(
          source,
          field as any
        );

      addAssessmentCard(
        doc,
        index + 1,
        field.label,
        answer
      );
    }
  );

  /*
   * Geolocation
   */
  const geo =
    source?.geolocation;

  if (
    geo &&
    (
      geo.latitude !== undefined ||
      geo.longitude !== undefined
    )
  ) {
    addSectionTitle(
      doc,
      "Assessment Location"
    );

    addInfoCards(doc, [
      {
        label: "Latitude",
        value: geo.latitude,
      },
      {
        label: "Longitude",
        value: geo.longitude,
      },
      {
        label: "Captured At",
        value: formatDateTime(
          geo.capturedAt
        ),
      },
    ]);
  }
};

/* -------------------------------------------------------------------------- */
/* SOLUTION & DESIGN                                                          */
/* -------------------------------------------------------------------------- */

const addSolutionDesignSection = (
  doc: jsPDF,
  solutionDesign: AnyObject
) => {
  if (
    !solutionDesign ||
    typeof solutionDesign !==
      "object"
  ) {
    return;
  }

  const hasContent =
    (
      Array.isArray(
        solutionDesign.gaps
      ) &&
      solutionDesign.gaps.length
    ) ||
    (
      Array.isArray(
        solutionDesign.interventions
      ) &&
      solutionDesign.interventions.length
    ) ||
    (
      Array.isArray(
        solutionDesign.indicators
      ) &&
      solutionDesign.indicators.length
    );

  if (!hasContent) {
    return;
  }

  addSectionTitle(
    doc,
    "05. Solution & Design",
    "Recommended interventions and design decisions"
  );

  if (
    Array.isArray(
      solutionDesign.gaps
    ) &&
    solutionDesign.gaps.length
  ) {
    addSectionTitle(
      doc,
      "Identified Gaps"
    );

    addTable(
      doc,
      [
        "Gap",
        "Description",
      ],
      solutionDesign.gaps.map(
        (gap: any) => [
          gap?.name ||
            gap?.title ||
            "Gap",

          gap?.description ||
            gap?.details ||
            "—",
        ]
      )
    );
  }

  if (
    Array.isArray(
      solutionDesign.interventions
    ) &&
    solutionDesign.interventions.length
  ) {
    addSectionTitle(
      doc,
      "Recommended Interventions"
    );

    addTable(
      doc,
      [
        "Type",
        "Title",
        "Specification",
        "Priority",
        "Estimated Cost",
        "Decision",
        "Status",
      ],
      solutionDesign.interventions.map(
        (item: any) => [
          statusLabel(
            item?.interventionType
          ),
          item?.title,
          item?.specification,
          statusLabel(
            item?.priority
          ),
          item?.estimatedCost,
          statusLabel(
            item?.teamDecision
          ),
          statusLabel(
            item?.status
          ),
        ]
      )
    );

    for (
      const intervention of
        solutionDesign.interventions
    ) {
      addSectionTitle(
        doc,
        intervention?.title ||
          "Intervention Details"
      );

      addField(
        doc,
        "Why",
        intervention?.why
      );

      addField(
        doc,
        "Source",
        intervention?.source
      );

      addField(
        doc,
        "Leverage - End User",
        intervention?.leverageEndUserPercent !==
          undefined
          ? `${intervention.leverageEndUserPercent}%`
          : "—"
      );

      addField(
        doc,
        "Leverage - SELCO",
        intervention?.leverageSelcoPercent !==
          undefined
          ? `${intervention.leverageSelcoPercent}%`
          : "—"
      );

      addField(
        doc,
        "Decision Rationale",
        intervention?.decisionRationale
      );

      addField(
        doc,
        "Add To Intervention Plan",
        intervention?.addToInterventionPlan
      );
    }
  }

  if (
    Array.isArray(
      solutionDesign.indicators
    ) &&
    solutionDesign.indicators.length
  ) {
    addSectionTitle(
      doc,
      "Indicators"
    );

    addTable(
      doc,
      [
        "Indicator",
        "Baseline",
        "Target",
        "Current",
        "Measured",
      ],
      solutionDesign.indicators.map(
        (indicator: any) => [
          indicator?.name,
          indicator?.baseline,
          indicator?.target,
          indicator?.current,
          formatDate(
            indicator?.dateMeasured
          ),
        ]
      )
    );
  }
};

/* -------------------------------------------------------------------------- */
/* IMPLEMENTATION                                                             */
/* -------------------------------------------------------------------------- */

const addImplementationSection = (
  doc: jsPDF,
  implementation: AnyObject
) => {
  if (
    !implementation ||
    !Array.isArray(
      implementation.interventions
    ) ||
    !implementation.interventions.length
  ) {
    return;
  }

  addSectionTitle(
    doc,
    "06. Implementation",
    "Implementation progress and intervention tracking"
  );

  implementation.interventions.forEach(
    (item: any, index: number) => {
      addSectionTitle(
        doc,
        `${index + 1}. ${
          item?.interventionTitle ||
          item?.title ||
          "Intervention"
        }`
      );

      addInfoCards(doc, [
        {
          label: "Status",
          value: statusLabel(
            item?.currentStatus ||
              item?.status
          ),
        },
        {
          label: "Vendor",
          value:
            item?.vendorName,
        },
        {
          label: "Actual Cost",
          value:
            item?.actualCost,
        },
        {
          label: "GPS Confirmed",
          value:
            item?.gpsSiteConfirmed,
        },
      ]);

      addField(
        doc,
        "End User Contribution",
        item?.endUserContribution
      );

      addField(
        doc,
        "SELCO Contribution",
        item?.selcoContribution
      );

      addField(
        doc,
        "Procurement Date",
        formatDate(
          item?.procurementDate
        )
      );

      addField(
        doc,
        "Installation Date",
        formatDate(
          item?.installationDate
        )
      );

      addField(
        doc,
        "Operational Date",
        formatDate(
          item?.operationalDate
        )
      );

      if (
        item?.latitude !== undefined &&
        item?.longitude !== undefined
      ) {
        addField(
          doc,
          "GPS",
          `${safe(
            item.latitude
          )}, ${safe(
            item.longitude
          )}`
        );
      }

      addField(
        doc,
        "Reason For Change",
        item?.reasonForChange
      );
    }
  );
};

/* -------------------------------------------------------------------------- */
/* WHATSAPP                                                                   */
/* -------------------------------------------------------------------------- */

const addWhatsAppSection = (
  doc: jsPDF,
  interactions: AnyObject[]
) => {
  if (
    !Array.isArray(
      interactions
    ) ||
    !interactions.length
  ) {
    return;
  }

  addSectionTitle(
    doc,
    "07. WhatsApp Messages",
    `${interactions.length} interaction${
      interactions.length === 1
        ? ""
        : "s"
    }`
  );

  addTable(
    doc,
    [
      "Date",
      "Direction",
      "Type",
      "Message",
      "Status",
    ],
    interactions.map(
      (item: any) => [
        formatDateTime(
          item?.createdAt ||
            item?.updatedAt
        ),

        statusLabel(
          item?.direction ||
            item?.type
        ),

        item?.messageType ||
          item?.templateName ||
          "—",

        item?.message ||
          item?.text ||
          item?.body ||
          "—",

        statusLabel(
          item?.status
        ),
      ]
    )
  );
};

/* -------------------------------------------------------------------------- */
/* SUMMARY                                                                    */
/* -------------------------------------------------------------------------- */

const addJourneySummary = (
  doc: jsPDF,
  participant: AnyObject,
  assessment: AnyObject,
  solutionDesign: AnyObject,
  implementation: AnyObject
) => {
  addSectionTitle(
    doc,
    "08. Journey Summary",
    "Overall participant journey status"
  );

  const assessmentSource =
    unwrapAssessment(
      assessment
    );

  const interventionCount =
    Array.isArray(
      solutionDesign?.interventions
    )
      ? solutionDesign.interventions
          .length
      : 0;

  const implementationCount =
    Array.isArray(
      implementation?.interventions
    )
      ? implementation.interventions
          .length
      : 0;

  const documentCount =
    Object.values(
      assessmentSource?.documents ||
        {}
    ).reduce(
      (
        total: number,
        files: any
      ) => {
        if (Array.isArray(files)) {
          return (
            total +
            files.length
          );
        }

        return (
          total +
          (files ? 1 : 0)
        );
      },
      0
    );

  addInfoCards(doc, [
    {
      label: "Assessment Status",
      value: statusLabel(
        participant?.assessmentStatus
      ),
    },
    {
      label: "Implementation Status",
      value: statusLabel(
        participant?.implementationStatus
      ),
    },
    {
      label: "Interventions",
      value: interventionCount,
    },
    {
      label: "Implementation Records",
      value: implementationCount,
    },
    {
      label: "Assessment Documents",
      value: documentCount,
    },
    {
      label: "Report Generated",
      value: formatDateTime(
        new Date()
      ),
    },
  ]);
};

/* -------------------------------------------------------------------------- */
/* FOOTER                                                                     */
/* -------------------------------------------------------------------------- */

const addFooter = (
  doc: jsPDF
) => {
  const totalPages =
    doc.getNumberOfPages();

  for (
    let page = 1;
    page <= totalPages;
    page++
  ) {
    doc.setPage(page);

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(7);

    doc.setTextColor(
      ...COLORS.muted
    );

    doc.text(
      `Participant Journey Report • Page ${page} of ${totalPages}`,
      MARGIN,
      PAGE_HEIGHT - 7
    );

    doc.text(
      "SELCO Foundation × KVK | Nandurbar Mela 2026",
      PAGE_WIDTH - MARGIN,
      PAGE_HEIGHT - 7,
      {
        align: "right",
      }
    );
  }
};

/* -------------------------------------------------------------------------- */
/* MAIN GENERATOR                                                             */
/* -------------------------------------------------------------------------- */

export const generateParticipantPdf =
  async ({
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
      compress: true,
    });

    cursorY = MARGIN + 10;

    addPageHeader(doc);

    /* ---------------------------------------------------------------------- */
    /* COVER                                                                  */
    /* ---------------------------------------------------------------------- */

    ensurePageSpace(
      doc,
      70
    );

    cursorY += 15;

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(25);

    doc.setTextColor(
      ...COLORS.dark
    );

    doc.text(
      "Participant",
      MARGIN,
      cursorY
    );

    cursorY += 11;

    doc.text(
      "Journey Report",
      MARGIN,
      cursorY
    );

    cursorY += 10;

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(11);

    doc.setTextColor(
      ...COLORS.accent
    );

    doc.text(
      "Nandurbar Mela 2026",
      MARGIN,
      cursorY
    );

    cursorY += 6;

    doc.setFontSize(8.5);

    doc.setTextColor(
      ...COLORS.muted
    );

    doc.text(
      "SELCO Foundation × KVK",
      MARGIN,
      cursorY
    );

    cursorY += 18;

    /*
     * Participant hero card
     */
    doc.setFillColor(
      ...COLORS.dark
    );

    doc.roundedRect(
      MARGIN,
      cursorY,
      CONTENT_WIDTH,
      48,
      3,
      3,
      "F"
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(16);

    doc.setTextColor(
      ...COLORS.white
    );

    doc.text(
      getParticipantName(
        participant
      ),
      MARGIN + 7,
      cursorY + 12
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(8.5);

    doc.setTextColor(
      226,
      232,
      240
    );

    doc.text(
      getOrganizationName(
        participant
      ),
      MARGIN + 7,
      cursorY + 20
    );

    doc.text(
      getParticipantLocation(
        participant
      ),
      MARGIN + 7,
      cursorY + 27
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(7);

    doc.setTextColor(
      191,
      219,
      254
    );

    doc.text(
      "ASSESSMENT",
      MARGIN + 7,
      cursorY + 38
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setTextColor(
      ...COLORS.white
    );

    doc.text(
      statusLabel(
        participant?.assessmentStatus
      ),
      MARGIN + 35,
      cursorY + 38
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setTextColor(
      191,
      219,
      254
    );

    doc.text(
      "IMPLEMENTATION",
      MARGIN + 82,
      cursorY + 38
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setTextColor(
      ...COLORS.white
    );

    doc.text(
      statusLabel(
        participant?.implementationStatus
      ),
      MARGIN + 122,
      cursorY + 38
    );

    cursorY += 62;

    addField(
      doc,
      "Report Generated",
      formatDateTime(
        new Date()
      )
    );

    /*
     * Page break after cover
     */
    doc.addPage();

    cursorY = MARGIN + 5;

    addPageHeader(doc);

    /* ---------------------------------------------------------------------- */
    /* PROFILE                                                                */
    /* ---------------------------------------------------------------------- */

    addRegistrationSection(
      doc,
      participant
    );

    /* ---------------------------------------------------------------------- */
    /* REGISTRATION ANSWERS                                                   */
    /* ---------------------------------------------------------------------- */

    addRegistrationAnswers(
      doc,
      participant,
      questions
    );

    /* ---------------------------------------------------------------------- */
    /* ASSESSMENT                                                             */
    /* ---------------------------------------------------------------------- */

    addAssessmentSection(
      doc,
      assessment
    );

    /* ---------------------------------------------------------------------- */
    /* DOCUMENTS                                                              */
    /* ---------------------------------------------------------------------- */

    const assessmentSource =
      unwrapAssessment(
        assessment
      );

    const documents =
      normalizeDocuments(
        assessmentSource
      );

    await addDocuments(
      doc,
      "04. Site Photos",
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

    /* ---------------------------------------------------------------------- */
    /* SOLUTION DESIGN                                                        */
    /* ---------------------------------------------------------------------- */

    addSolutionDesignSection(
      doc,
      solutionDesign
    );

    /* ---------------------------------------------------------------------- */
    /* IMPLEMENTATION                                                         */
    /* ---------------------------------------------------------------------- */

    addImplementationSection(
      doc,
      implementation
    );

    /* ---------------------------------------------------------------------- */
    /* WHATSAPP                                                               */
    /* ---------------------------------------------------------------------- */

    addWhatsAppSection(
      doc,
      whatsapp
    );

    /* ---------------------------------------------------------------------- */
    /* SUMMARY                                                                */
    /* ---------------------------------------------------------------------- */

    addJourneySummary(
      doc,
      participant,
      assessment,
      solutionDesign,
      implementation
    );

    /* ---------------------------------------------------------------------- */
    /* FOOTER                                                                 */
    /* ---------------------------------------------------------------------- */

    addFooter(doc);

    /* ---------------------------------------------------------------------- */
    /* SAVE                                                                   */
    /* ---------------------------------------------------------------------- */

    const safeName =
      String(
        getParticipantName(
          participant
        )
      )
        .trim()
        .replace(
          /[^a-zA-Z0-9-_]+/g,
          "-"
        )
        .replace(
          /-+/g,
          "-"
        );

    doc.save(
      `participant-journey-${
        safeName || "participant"
      }.pdf`
    );
  };