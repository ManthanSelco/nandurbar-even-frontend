import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, errorMessage } from "../../lib/api";
import {
  enqueueRegistration,
  flushRegistrationQueue,
  isRetryableRegistrationError,
} from "../../lib/registrationQueue";
import "./RegistrationPage.css";

type Language = "en" | "hi" | "mr" | "gu";
type RegistrationMode = "SELF" | "VOLUNTEER";
type Step = "details" | "done";

type Question = {
  _id: string;
  question: string;
  type: "TEXT" | "TEXTAREA" | "SELECT" | "MULTI_SELECT";
  options: Array<string | { value: string; label: string }>;
  required: boolean;
  minWords: number;
  maxWords: number;
  displayOrder: number;
};

const initialForm = {
  name: "",
  mobile: "",
  gender: "",
  location: "",
  organizationType: "",
  organizationName: "",
  sector: "",
  whatsappAvailable: true,
  consentGiven: true,
};

const copy: Record<Language, Record<string, string>> = {
  en: {
    self: "SELF REGISTRATION",
    volunteer: "VOLUNTEER ASSISTED",
    selfTitle: "Participant Registration",
    volunteerTitle: "Volunteer Participant Registration",
    intro: "Please provide the required information to complete the participant registration.",
    language: "Language",
    participantDetails: "Participant details",
    volunteerInfo: "Volunteer-assisted registration",
    volunteerHelp: "You are registering this participant through the volunteer link.",
    participantInfo: "Participant information",
    participantInfoHelp: "Tell us a little about the participant.",
    fullName: "Full name",
    fullNamePlaceholder: "Enter participant's full name",
    mobile: "Participant mobile number",
    mobilePlaceholder: "Enter 10 digit mobile number",
    mobileHelp: "Enter a valid 10 digit mobile number.",
    gender: "Gender",
    female: "Female",
    male: "Male",
    other: "Other",
    preferNot: "Prefer not to say",
    age: "Age",
    agePlaceholder: "Enter age",
    location: "Place",
    locationPlaceholder: "Village / Town",
    organizationType: "What type of organisation/enterprise do you represent?",
    individualEntrepreneur: "Individual entrepreneur",
    shg: "SHG",
    fpoFpc: "FPO/FPC",
    cooperative: "Cooperative",
    ngo: "NGO",
    government: "Government",
    privateCompany: "Private company",
    organizationOther: "Other",
    organizationName: "Name of the Organization",
    organizationNamePlaceholder: "Enter organization name",
    sector: "Which sector do you primarily work in?",
    foodProcessing: "Food processing",
    agriculture: "Agriculture",
    livestock: "Livestock",
    retailServices: "Retail & Services",
    manufacturing: "Manufacturing",
    sectorOther: "Other",
    occupation: "Occupation",
    occupationPlaceholder: "Current occupation",
    support: "Support information",
    supportHelp: "Help us understand the participant's needs.",
    purpose: "Purpose of visit",
    purposePlaceholder: "Why are they attending?",
    interest: "Interest category",
    interestPlaceholder: "Area of interest",
    whatsapp: "WhatsApp availability",
    whatsappHelp: "Can this participant receive information through WhatsApp?",
    questions: "Additional questions",
    questionsHelp: "Please answer the questions below.",
    noQuestions: "No additional questions",
    noQuestionsHelp: "There are no additional questions configured for this registration.",
    required: "Required",
    optional: "Optional",
    words: "words",
    submit: "Complete registration →",
    submitting: "Creating participant profile...",
    secure: "Your information will be securely recorded in the Participant Journey system.",
    error: "Something went wrong",
    success: "Success",
    complete: "REGISTRATION COMPLETE",
    successTitle: "Registration successful!",
    successText: "The participant profile has been created successfully.",
    participant: "Participant",
    event: "Event",
    registration: "Registration",
    volunteerRegistration: "Volunteer Assisted",
    selfRegistration: "Self Registration",
    thankYou: "Thank you for registering for the Nandurbar Event.",

  

papad: "Papad",
mushroom: "Mushroom",
millets: "Millets",
chilli: "Chilli",
oilMill: "Oil Mill",
riceMill: "Rice Mill",
dairy: "Dairy",
honey: "Honey",
dal: "Dal",
vegetable: "Vegetable",


    
    offline: "Registration saved on this device. It will sync automatically when the connection is available.",
    languageUnavailable: "This language is temporarily unavailable. Please try English or check the translation configuration.",
  },
  hi: {
    self: "स्वयं पंजीकरण", volunteer: "स्वयंसेवक द्वारा पंजीकरण", selfTitle: "प्रतिभागी पंजीकरण", volunteerTitle: "स्वयंसेवक द्वारा प्रतिभागी पंजीकरण", intro: "प्रतिभागी पंजीकरण पूरा करने के लिए आवश्यक जानकारी दें।", language: "भाषा", participantDetails: "प्रतिभागी विवरण", volunteerInfo: "स्वयंसेवक द्वारा पंजीकरण", volunteerHelp: "आप स्वयंसेवक लिंक के माध्यम से इस प्रतिभागी का पंजीकरण कर रहे हैं।", participantInfo: "प्रतिभागी की जानकारी", participantInfoHelp: "प्रतिभागी के बारे में थोड़ी जानकारी दें।", fullName: "पूरा नाम", fullNamePlaceholder: "प्रतिभागी का पूरा नाम दर्ज करें", mobile: "प्रतिभागी का मोबाइल नंबर", mobilePlaceholder: "10 अंकों का मोबाइल नंबर दर्ज करें", mobileHelp: "मान्य 10 अंकों का मोबाइल नंबर दर्ज करें।", gender: "लिंग", female: "महिला", male: "पुरुष", other: "अन्य", preferNot: "बताना नहीं चाहते", age: "आयु", agePlaceholder: "आयु दर्ज करें", location: "स्थान", locationPlaceholder: "गांव / शहर", organizationType: "आप किस प्रकार के संगठन/उद्यम का प्रतिनिधित्व करते हैं?", individualEntrepreneur: "व्यक्तिगत उद्यमी", shg: "SHG", fpoFpc: "FPO/FPC", cooperative: "सहकारी संस्था", ngo: "NGO", government: "सरकार", privateCompany: "निजी कंपनी", organizationOther: "अन्य", organizationName: "संगठन का नाम", organizationNamePlaceholder: "संगठन का नाम दर्ज करें", sector: "आप मुख्य रूप से किस क्षेत्र में काम करते हैं?", foodProcessing: "खाद्य प्रसंस्करण", agriculture: "कृषि", livestock: "पशुपालन", retailServices: "खुदरा और सेवाएं", manufacturing: "विनिर्माण", sectorOther: "अन्य", occupation: "व्यवसाय", occupationPlaceholder: "वर्तमान व्यवसाय", support: "सहायता संबंधी जानकारी", supportHelp: "प्रतिभागी की जरूरतों को समझने में हमारी मदद करें।", purpose: "आने का उद्देश्य", purposePlaceholder: "वे क्यों आ रहे हैं?", interest: "रुचि की श्रेणी", interestPlaceholder: "रुचि का क्षेत्र", whatsapp: "व्हाट्सऐप उपलब्धता", whatsappHelp: "क्या प्रतिभागी व्हाट्सऐप पर जानकारी प्राप्त कर सकते हैं?", questions: "अतिरिक्त प्रश्न", questionsHelp: "नीचे दिए गए प्रश्नों के उत्तर दें।", noQuestions: "कोई अतिरिक्त प्रश्न नहीं", noQuestionsHelp: "इस पंजीकरण के लिए कोई अतिरिक्त प्रश्न उपलब्ध नहीं है।", required: "आवश्यक", optional: "वैकल्पिक", words: "शब्द", submit: "पंजीकरण पूरा करें →", submitting: "प्रतिभागी प्रोफ़ाइल बनाई जा रही है...", secure: "आपकी जानकारी Participant Journey प्रणाली में सुरक्षित रूप से दर्ज की जाएगी।", error: "कुछ गलत हो गया", success: "सफलता", complete: "पंजीकरण पूरा हुआ", successTitle: "पंजीकरण सफल रहा!", successText: "प्रतिभागी प्रोफ़ाइल सफलतापूर्वक बनाई गई है।", participant: "प्रतिभागी", event: "कार्यक्रम", registration: "पंजीकरण", volunteerRegistration: "स्वयंसेवक द्वारा", selfRegistration: "स्वयं पंजीकरण", thankYou: "Nandurbar Event में पंजीकरण करने के लिए धन्यवाद।", offline: "पंजीकरण इस डिवाइस पर सुरक्षित है। इंटरनेट उपलब्ध होने पर यह अपने आप सिंक हो जाएगा।", languageUnavailable: "यह भाषा अभी उपलब्ध नहीं है। कृपया अंग्रेज़ी चुनें या अनुवाद कॉन्फ़िगरेशन जांचें।",papad: "पापड़",
mushroom: "मशरूम",
millets: "बाजरा",
chilli: "मिर्च",
oilMill: "तेल मिल",
riceMill: "चावल मिल",
dairy: "डेयरी",
honey: "शहद",
dal: "दाल",
vegetable: "सब्ज़ी",
  },
  mr: {
    self: "स्वयं नोंदणी", volunteer: "स्वयंसेवकाद्वारे नोंदणी", selfTitle: "सहभागी नोंदणी", volunteerTitle: "स्वयंसेवकाद्वारे सहभागी नोंदणी", intro: "सहभागी नोंदणी पूर्ण करण्यासाठी आवश्यक माहिती द्या.", language: "भाषा", participantDetails: "सहभागी तपशील", volunteerInfo: "स्वयंसेवकाद्वारे नोंदणी", volunteerHelp: "तुम्ही स्वयंसेवकाच्या लिंकद्वारे या सहभागीची नोंदणी करत आहात.", participantInfo: "सहभागीची माहिती", participantInfoHelp: "सहभागीबद्दल थोडी माहिती द्या.", fullName: "पूर्ण नाव", fullNamePlaceholder: "सहभागीचे पूर्ण नाव लिहा", mobile: "सहभागीचा मोबाईल नंबर", mobilePlaceholder: "10 अंकी मोबाईल नंबर लिहा", mobileHelp: "वैध 10 अंकी मोबाईल नंबर लिहा.", gender: "लिंग", female: "महिला", male: "पुरुष", other: "इतर", preferNot: "सांगू इच्छित नाही", age: "वय", agePlaceholder: "वय लिहा", location: "ठिकाण", locationPlaceholder: "गाव / शहर", organizationType: "तुम्ही कोणत्या प्रकारच्या संस्था/उद्योगाचे प्रतिनिधित्व करता?", individualEntrepreneur: "वैयक्तिक उद्योजक", shg: "SHG", fpoFpc: "FPO/FPC", cooperative: "सहकारी संस्था", ngo: "NGO", government: "शासकीय संस्था", privateCompany: "खाजगी कंपनी", organizationOther: "इतर", organizationName: "संस्थेचे नाव", organizationNamePlaceholder: "संस्थेचे नाव लिहा", sector: "तुम्ही प्रामुख्याने कोणत्या क्षेत्रात काम करता?", foodProcessing: "अन्न प्रक्रिया", agriculture: "कृषी", livestock: "पशुधन", retailServices: "किरकोळ व सेवा", manufacturing: "उत्पादन", sectorOther: "इतर", occupation: "व्यवसाय", occupationPlaceholder: "सध्याचा व्यवसाय", support: "सहाय्याची माहिती", supportHelp: "सहभागीच्या गरजा समजून घेण्यासाठी आम्हाला मदत करा.", purpose: "भेटीचा उद्देश", purposePlaceholder: "ते का येत आहेत?", interest: "आवडीची श्रेणी", interestPlaceholder: "आवडीचे क्षेत्र", whatsapp: "व्हॉट्सॲप उपलब्धता", whatsappHelp: "या सहभागीला व्हॉट्सॲपवर माहिती मिळू शकते का?", questions: "अतिरिक्त प्रश्न", questionsHelp: "खालील प्रश्नांची उत्तरे द्या.", noQuestions: "अतिरिक्त प्रश्न नाहीत", noQuestionsHelp: "या नोंदणीसाठी कोणतेही अतिरिक्त प्रश्न उपलब्ध नाहीत.", required: "आवश्यक", optional: "ऐच्छिक", words: "शब्द", submit: "नोंदणी पूर्ण करा →", submitting: "सहभागी प्रोफाइल तयार होत आहे...", secure: "तुमची माहिती Participant Journey प्रणालीमध्ये सुरक्षितपणे नोंदवली जाईल.", error: "काहीतरी चूक झाली", success: "यशस्वी", complete: "नोंदणी पूर्ण झाली", successTitle: "नोंदणी यशस्वी झाली!", successText: "सहभागी प्रोफाइल यशस्वीरित्या तयार झाले आहे.", participant: "सहभागी", event: "कार्यक्रम", registration: "नोंदणी", volunteerRegistration: "स्वयंसेवकाद्वारे", selfRegistration: "स्वयं नोंदणी", thankYou: "Nandurbar Event साठी नोंदणी केल्याबद्दल धन्यवाद.", offline: "नोंदणी या डिव्हाइसवर सुरक्षित केली आहे. इंटरनेट उपलब्ध झाल्यावर ती आपोआप सिंक होईल.", languageUnavailable: "ही भाषा सध्या उपलब्ध नाही. कृपया इंग्रजी निवडा किंवा अनुवाद कॉन्फिगरेशन तपासा.",papad: "पापड",
mushroom: "मशरूम",
millets: "बाजरी",
chilli: "मिरची",
oilMill: "तेल गिरणी",
riceMill: "तांदूळ गिरणी",
dairy: "दुग्ध व्यवसाय",
honey: "मध",
dal: "डाळ",
vegetable: "भाजीपाला",
  },
  gu: {
    self: "સ્વ-નોંધણી", volunteer: "સ્વયંસેવક દ્વારા નોંધણી", selfTitle: "ભાગીદાર નોંધણી", volunteerTitle: "સ્વયંસેવક દ્વારા ભાગીદાર નોંધણી", intro: "ભાગીદાર નોંધણી પૂર્ણ કરવા માટે જરૂરી માહિતી આપો.", language: "ભાષા", participantDetails: "ભાગીદાર વિગતો", volunteerInfo: "સ્વયંસેવક દ્વારા નોંધણી", volunteerHelp: "તમે સ્વયંસેવક લિંક દ્વારા આ ભાગીદારની નોંધણી કરી રહ્યા છો.", participantInfo: "ભાગીદારની માહિતી", participantInfoHelp: "ભાગીદાર વિશે થોડી માહિતી આપો.", fullName: "પૂરું નામ", fullNamePlaceholder: "ભાગીદારનું પૂરું નામ દાખલ કરો", mobile: "ભાગીદારનો મોબાઇલ નંબર", mobilePlaceholder: "10 અંકનો મોબાઇલ નંબર દાખલ કરો", mobileHelp: "માન્ય 10 અંકનો મોબાઇલ નંબર દાખલ કરો.", gender: "લિંગ", female: "સ્ત્રી", male: "પુરુષ", other: "અન્ય", preferNot: "કહેવા માંગતા નથી", age: "ઉંમર", agePlaceholder: "ઉંમર દાખલ કરો", location: "સ્થળ", locationPlaceholder: "ગામ / શહેર", organizationType: "તમે કયા પ્રકારની સંસ્થા/ઉદ્યોગનું પ્રતિનિધિત્વ કરો છો?", individualEntrepreneur: "વ્યક્તિગત ઉદ્યોગસાહસિક", shg: "SHG", fpoFpc: "FPO/FPC", cooperative: "સહકારી સંસ્થા", ngo: "NGO", government: "સરકાર", privateCompany: "ખાનગી કંપની", organizationOther: "અન્ય", organizationName: "સંસ્થાનું નામ", organizationNamePlaceholder: "સંસ્થાનું નામ દાખલ કરો", sector: "તમે મુખ્યત્વે કયા ક્ષેત્રમાં કામ કરો છો?", foodProcessing: "ખાદ્ય પ્રક્રિયા", agriculture: "કૃષિ", livestock: "પશુપાલન", retailServices: "રિટેલ અને સેવાઓ", manufacturing: "ઉત્પાદન", sectorOther: "અન્ય", occupation: "વ્યવસાય", occupationPlaceholder: "હાલનો વ્યવસાય", support: "સહાયની માહિતી", supportHelp: "ભાગીદારની જરૂરિયાત સમજવામાં અમારી મદદ કરો.", purpose: "મુલાકાતનો હેતુ", purposePlaceholder: "તેઓ શા માટે આવી રહ્યા છે?", interest: "રસની શ્રેણી", interestPlaceholder: "રસનું ક્ષેત્ર", whatsapp: "WhatsApp ઉપલબ્ધતા", whatsappHelp: "શું આ ભાગીદાર WhatsApp દ્વારા માહિતી મેળવી શકે છે?", questions: "વધારાના પ્રશ્નો", questionsHelp: "નીચેના પ્રશ્નોના જવાબ આપો.", noQuestions: "વધારાના પ્રશ્નો નથી", noQuestionsHelp: "આ નોંધણી માટે કોઈ વધારાના પ્રશ્નો ઉપલબ્ધ નથી.", required: "જરૂરી", optional: "વૈકલ્પિક", words: "શબ્દો", submit: "નોંધણી પૂર્ણ કરો →", submitting: "ભાગીદાર પ્રોફાઇલ બનાવવામાં આવી રહી છે...", secure: "તમારી માહિતી Participant Journey સિસ્ટમમાં સુરક્ષિત રીતે નોંધવામાં આવશે.", error: "કંઈક ખોટું થયું", success: "સફળતા", complete: "નોંધણી પૂર્ણ", successTitle: "નોંધણી સફળ થઈ!", successText: "ભાગીદાર પ્રોફાઇલ સફળતાપૂર્વક બનાવવામાં આવી છે.", participant: "ભાગીદાર", event: "ઇવેન્ટ", registration: "નોંધણી", volunteerRegistration: "સ્વયંસેવક દ્વારા", selfRegistration: "સ્વ-નોંધણી", thankYou: "Nandurbar Event માટે નોંધણી કરવા બદલ આભાર.", offline: "નોંધણી આ ડિવાઇસ પર સાચવવામાં આવી છે. ઇન્ટરનેટ ઉપલબ્ધ થતાં તે આપમેળે સિંક થશે.", languageUnavailable: "આ ભાષા હાલમાં ઉપલબ્ધ નથી. કૃપા કરીને અંગ્રેજી પસંદ કરો અથવા અનુવાદ ગોઠવણી તપાસો.",papad: "પાપડ",
mushroom: "મશરૂમ",
millets: "બાજરી",
chilli: "મરચું",
oilMill: "તેલ મિલ",
riceMill: "ચોખાની મિલ",
dairy: "ડેરી",
honey: "મધ",
dal: "દાળ",
vegetable: "શાકભાજી",
  },
};

function getInitialLanguage(): Language {
  const value = new URLSearchParams(window.location.search).get("language");
  return value === "en" || value === "hi" || value === "mr" || value === "gu" ? value : "mr";
}

function showError(setError: (value: string) => void, text: string) {
  setError(text);
  window.alert(text);
}

export function RegistrationPage() {
  const [searchParams] = useSearchParams();
  const volunteerToken = searchParams.get("volunteerToken");
  const questionsParam = searchParams.get("questions");
  const registrationMode: RegistrationMode = volunteerToken ? "VOLUNTEER" : "SELF";

  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState("");
  const [step, setStep] = useState<Step>("details");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [queuedOffline, setQueuedOffline] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [form, setForm] = useState<any>(initialForm);

  const t = copy[language];
  const fallbackQuestions = useMemo(() => {
    if (!questionsParam) return [];
    try {
      const decoded = JSON.parse(decodeURIComponent(questionsParam));
      return Array.isArray(decoded) ? decoded.filter((q) => q && typeof q._id === "string" && typeof q.question === "string") : [];
    } catch {
      return [];
    }
  }, [questionsParam]);

  const setField = (key: string, value: any) => setForm((current: any) => ({ ...current, [key]: value }));

  useEffect(() => {
    if (volunteerToken) sessionStorage.setItem("volunteer_token", volunteerToken);
    else sessionStorage.removeItem("volunteer_token");
  }, [volunteerToken]);

  useEffect(() => {
    const sync = () => void flushRegistrationQueue(api);
    void flushRegistrationQueue(api);
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadQuestions() {
      setQuestionsLoading(true);
      setQuestionsError("");
      try {
        const response = await api.get("/participant-questions/registration", { params: { language } });
        if (!cancelled) {
          const list = Array.isArray(response.data?.data) ? response.data.data : [];
          setQuestions(list);
          setAnswers({});
        }
      } catch (loadError) {
        if (!cancelled) {
          if (language !== "en" && fallbackQuestions.length) {
            setQuestions(fallbackQuestions);
            setQuestionsError(t.languageUnavailable);
          } else {
            setQuestions([]);
            setQuestionsError(errorMessage(loadError));
          }
        }
      } finally {
        if (!cancelled) setQuestionsLoading(false);
      }
    }
    void loadQuestions();
    return () => { cancelled = true; };
  }, [language, fallbackQuestions, t.languageUnavailable]);

  function clearMessages() {
    setError("");
    setMessage("");
  }

  function validateMobile() {
    const mobile = String(form.mobile || "").trim();
    if (!mobile) return t.mobileHelp;
    if (!/^[0-9]{10}$/.test(mobile)) return t.mobileHelp;
    return "";
  }

  function validateQuestionAnswers() {
    for (const question of questions) {
      const answer = (answers[question._id] || "").trim();
      if (question.required && !answer) return `${t.required}: ${question.question}`;
      if (!answer) continue;
      const wordCount = answer.split(/\s+/).filter(Boolean).length;
      if (wordCount < question.minWords) return `${question.question}: ${question.minWords} ${t.words} minimum.`;
      if (wordCount > question.maxWords) return `${question.question}: ${question.maxWords} ${t.words} maximum.`;
    }
    return "";
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();

    const mobileError = validateMobile();
    if (mobileError) {
      showError(setError, mobileError);
      return;
    }

    const questionError = validateQuestionAnswers();
    if (questionError) {
      showError(setError, questionError);
      return;
    }

    setBusy(true);
    const requestId = crypto.randomUUID();
    const payload: any = {
      requestId,
      mobile: String(form.mobile).trim(),
      countryCode: "+91",
      preferredLanguage: language,
      name: form.name,
      gender: form.gender,
      location: form.location,
      organizationType: form.organizationType,
      organizationName: form.organizationName,
      sector: form.sector,
      whatsappAvailable: Boolean(form.whatsappAvailable),
      consentGiven: true,
      answers: questions.map((question) => ({ questionId: question._id, answer: answers[question._id] || "" })),
    };

    const endpoint = registrationMode === "SELF" ? "/participants/registration" : "/participants/volunteer/registration";
    const headers = registrationMode === "VOLUNTEER" && volunteerToken ? { "X-Volunteer-Token": volunteerToken } : undefined;

    try {
      await api.post(endpoint, payload, { headers });
      sessionStorage.removeItem("registration_token");
      sessionStorage.removeItem("volunteer_token");
      setStep("done");
    } catch (submitError: any) {
      if (isRetryableRegistrationError(submitError)) {
        try {
          await enqueueRegistration(endpoint, payload, headers);
          setQueuedOffline(true);
          setMessage(t.offline);
          setStep("done");
        } catch (queueError) {
          showError(setError, errorMessage(queueError));
        }
      } else {
        showError(setError, errorMessage(submitError));
      }
    } finally {
      setBusy(false);
    }
  }

  const title = registrationMode === "VOLUNTEER" ? t.volunteerTitle : t.selfTitle;

  return (
    <div className="registration-page">
      <div className="registration-background" />
      <main className="registration-shell">
        <header className="registration-header">
          <div className="registration-brand">
            <div className="brand-mark">PJ</div>
            <div><div className="brand-title">Participant Journey</div><div className="brand-subtitle">SELCO Foundation</div></div>
          </div>
          <div className="event-badge"><span className="event-dot" />Nandurbar Event</div>
        </header>

        <section className="registration-card">
          <div className="registration-intro">
            <div>
              <span className="intro-label">{registrationMode === "VOLUNTEER" ? t.volunteer : t.self}</span>
              <h1>{title}</h1>
              <p>{t.intro}</p>
            </div>
            <div className="language-control">
              <label htmlFor="registration-language">{t.language}</label>
              <select id="registration-language" value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="mr">मराठी</option>
                <option value="gu">ગુજરાતી</option>
              </select>
            </div>
          </div>

          {step !== "done" && <div className="progress-area"><div className="progress-top"><span>{t.participantDetails}</span><span>100%</span></div><div className="progress-track"><div className="progress-fill" style={{ width: "100%" }} /></div></div>}

          {error && <div className="alert alert-error"><span className="alert-icon">!</span><div><strong>{t.error}</strong><p>{error}</p></div></div>}
          {message && <div className="alert alert-success"><span className="alert-icon">✓</span><div><strong>{t.success}</strong><p>{message}</p></div></div>}

          {step === "details" && (
            <form className="step-content" onSubmit={submit}>
              {registrationMode === "VOLUNTEER" && <div className="info-banner"><div className="info-banner-icon">i</div><div><strong>{t.volunteerInfo}</strong><span>{t.volunteerHelp}</span></div></div>}

              <div className="section-heading"><div className="section-icon">01</div><div><h2>{t.participantInfo}</h2><p>{t.participantInfoHelp}</p></div></div>
              <div className="form-grid">
                <div className="field field-full"><label className="field-label" htmlFor="name">{t.fullName}<span>*</span></label><input id="name" required placeholder={t.fullNamePlaceholder} value={form.name} onChange={(event) => setField("name", event.target.value)} autoComplete="name" /></div>
                <div className="field field-full"><label className="field-label" htmlFor="mobile">{t.mobile}<span>*</span></label><div className="mobile-input"><div className="country-code">🇮🇳 +91</div><input id="mobile" type="tel" inputMode="numeric" maxLength={10} pattern="[0-9]{10}" required placeholder={t.mobilePlaceholder} value={form.mobile} onChange={(event) => setField("mobile", event.target.value.replace(/\D/g, ""))} autoComplete="tel" /></div><p className="field-help">{t.mobileHelp}</p></div>
                <div className="field"><label className="field-label" htmlFor="gender">{t.gender}<span>*</span></label><select id="gender" required value={form.gender} onChange={(event) => setField("gender", event.target.value)}><option value="">—</option><option value="FEMALE">{t.female}</option><option value="MALE">{t.male}</option><option value="OTHER">{t.other}</option><option value="PREFER_NOT_TO_SAY">{t.preferNot}</option></select></div>
                <div className="field"><label className="field-label" htmlFor="location">{t.location}<span>*</span></label><input id="location" required placeholder={t.locationPlaceholder} value={form.location} onChange={(event) => setField("location", event.target.value)} /></div>
                <div className="field field-full"><label className="field-label" htmlFor="organizationType">{t.organizationType}<span>*</span></label><select id="organizationType" required value={form.organizationType} onChange={(event) => setField("organizationType", event.target.value)}><option value="">—</option><option value="INDIVIDUAL_ENTREPRENEUR">{t.individualEntrepreneur}</option><option value="SHG">{t.shg}</option><option value="FPO_FPC">{t.fpoFpc}</option><option value="COOPERATIVE">{t.cooperative}</option><option value="NGO">{t.ngo}</option><option value="GOVERNMENT">{t.government}</option><option value="PRIVATE_COMPANY">{t.privateCompany}</option><option value="OTHER">{t.organizationOther}</option></select></div>
                <div className="field field-full"><label className="field-label" htmlFor="organizationName">{t.organizationName}<span>*</span></label><input id="organizationName" required placeholder={t.organizationNamePlaceholder} value={form.organizationName} onChange={(event) => setField("organizationName", event.target.value)} /></div>
                <div className="field field-full"><label className="field-label" htmlFor="sector">{t.sector}<span>*</span></label><select id="sector" required value={form.sector} onChange={(event) => setField("sector", event.target.value)}><option value="">—</option><option value="FOOD_PROCESSING">{t.foodProcessing}</option><option value="AGRICULTURE">{t.agriculture}</option><option value="LIVESTOCK">{t.livestock}</option><option value="RETAIL_SERVICES">{t.retailServices}</option><option value="MANUFACTURING">{t.manufacturing}</option> <option value="Papad">{t.papad}</option><option value="Mushroom">{t.mushroom}</option><option value="Millets">{t.millets}</option><option value="Chilli">{t.chilli}</option><option value="Oil Mill">{t.oilMill}</option><option value="Rice Mill">{t.riceMill}</option><option value="Dairy">{t.dairy}</option><option value="Honey">{t.honey}</option><option value="Dal">{t.dal}</option><option value="Vegitable">{t.vegetable}</option><option value="OTHER">{t.sectorOther}</option></select></div>
              </div>

              <div className="preference-card"><div className="preference-icon">💬</div><div className="preference-content"><strong>{t.whatsapp}</strong><span>{t.whatsappHelp}</span></div><label className="switch"><input type="checkbox" checked={form.whatsappAvailable} onChange={(event) => setField("whatsappAvailable", event.target.checked)} /><span className="switch-slider" /></label></div>

              <div className="section-heading section-heading-spaced"><div className="section-icon">03</div><div><h2>{t.questions}</h2><p>{t.questionsHelp}</p></div></div>
              {questionsLoading ? <div className="empty-question"><div className="empty-question-icon">…</div><div><strong>Loading...</strong><span>{t.questionsHelp}</span></div></div> : questionsError && questions.length === 0 ? <div className="empty-question"><div className="empty-question-icon">!</div><div><strong>{t.error}</strong><span>{questionsError}</span></div></div> : questions.length === 0 ? <div className="empty-question"><div className="empty-question-icon">✓</div><div><strong>{t.noQuestions}</strong><span>{t.noQuestionsHelp}</span></div></div> : <div className="questions-list">{questions.map((question, index) => {
                const value = answers[question._id] || "";
                const selected = value ? value.split("|").filter(Boolean) : [];
                const normalizedOptions = (question.options || []).map((option: any) => typeof option === "string" ? { value: option, label: option } : option);
                return <div className="question-card" key={question._id}>
                  <div className="question-number">{index + 1}</div>
                  <div className="question-body">
                    <label className="question-label" htmlFor={`question-${question._id}`}>{question.question}{question.required && <span>*</span>}</label>
                    {question.type === "SELECT" ? <select id={`question-${question._id}`} required={question.required} value={value} onChange={(event) => setAnswers((current) => ({ ...current, [question._id]: event.target.value }))}>
                      <option value="">—</option>{normalizedOptions.map((option:any) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select> : question.type === "MULTI_SELECT" ? <div className="question-options">{normalizedOptions.map((option:any) => <label key={option.value} className="option-check"><input type="checkbox" checked={selected.includes(option.value)} onChange={(event) => { const next = event.target.checked ? [...selected, option.value] : selected.filter((item) => item !== option.value); setAnswers((current) => ({ ...current, [question._id]: next.join("|") })); }} /> <span>{option.label}</span></label>)}</div> : question.type === "TEXT" ? <input id={`question-${question._id}`} required={question.required} value={value} onChange={(event) => setAnswers((current) => ({ ...current, [question._id]: event.target.value }))} /> : <textarea id={`question-${question._id}`} required={question.required} rows={4} value={value} onChange={(event) => setAnswers((current) => ({ ...current, [question._id]: event.target.value }))} />}
                    <div className="question-meta"><span>{question.required ? t.required : t.optional}</span>{question.type !== "SELECT" && question.type !== "MULTI_SELECT" && <span>{question.minWords}–{question.maxWords} {t.words}</span>}</div>
                  </div>
                </div>;
              })}</div>}

              <div className="submit-area"><button type="submit" className="button-primary button-large" disabled={busy || questionsLoading}>{busy ? t.submitting : t.submit}</button><p>{t.secure}</p></div>
            </form>
          )}

          {step === "done" && <div className="success-screen"><div className="success-circle">✓</div><span className="intro-label">{t.complete}</span><h2>{queuedOffline ? t.success : t.successTitle}</h2><p>{queuedOffline ? t.offline : t.successText}</p><div className="success-details"><div><span>{t.participant}</span><strong>{form.name}</strong></div><div><span>{t.event}</span><strong>Nandurbar Event</strong></div><div><span>{t.registration}</span><strong>{registrationMode === "VOLUNTEER" ? t.volunteerRegistration : t.selfRegistration}</strong></div></div><div className="thank-you"><span>✓</span><p>{t.thankYou}</p></div></div>}
        </section>

        <footer className="registration-footer"><span>Participant Journey · SELCO Foundation</span><span>Nandurbar Event · 20-21 August</span></footer>
      </main>
    </div>
  );
}
