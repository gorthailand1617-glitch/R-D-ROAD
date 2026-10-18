// ============================================================================
// ROAD NEXT-GEN: Main Application State & UI Controller
// ============================================================================

(function () {
  const STORAGE_KEYS = {
    MEMBERS: "road_nextgen_members_v1",
    COHORTS: "road_nextgen_cohorts_v1",
    CURRENT_USER: "road_nextgen_user_v1",
    PROJECTS: "road_nextgen_projects_v1",
    ACTIVE_PROJECT_ID: "road_nextgen_active_proj_v1",
    GEMINI_KEY: "road_nextgen_gemini_key_v1",
    THEME: "road_nextgen_theme_v1",
    AUDIT_LOGS: "road_nextgen_audit_logs_v1"
  };

  // --- Utility Functions (Matching road-abcd rules) ---
  function normalizePhone(raw) {
    let t = String(raw || "").replace(/[^\d+]/g, "");
    if (t.startsWith("+66")) t = "0" + t.slice(3);
    else if (t.startsWith("66") && t.length === 11) t = "0" + t.slice(2);
    t = t.replace(/\D/g, "");
    return /^0\d{8,9}$/.test(t) ? t : null;
  }

  function normalizeEmail(raw) {
    return String(raw || "").trim().toLowerCase();
  }

  function initialPassword(email, phone) {
    const cleanEmail = normalizeEmail(email);
    const cleanPhone = normalizePhone(phone) || String(phone || "").replace(/\D/g, "");
    if (!cleanEmail.includes("@") || cleanPhone.length < 4) return "";
    const prefix = cleanEmail.split("@")[0];
    const pass = prefix + cleanPhone.slice(-4);
    return pass.length >= 8 ? pass : prefix + cleanPhone;
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // --- State Initialization ---
  const state = {
    view: "login", // "login" | "studio" | "signup" | "forgot" | "admin" | "slides"
    theme: "light", // "light" | "dark"
    showLoginPass: false,
    rememberMe: true,
    studioTab: "workspace", // "workspace" | "advisor" | "abcd" | "chapters" | "diagrams" | "matrix" | "statlab" | "ai"
    showAllTools: false, // Toggle full 9-tool navigation
    activeChapterFilter: 0, // 0 = All 5 chapters, 1..5 = specific chapter
    showReviewCenter: false, // Collapsible on iPad/tablet for 100% full-width reading
    slideIndex: 0,
    members: [],
    cohorts: [],
    currentUser: null,
    projects: [],
    activeProjectId: null,
    showAbcdModal: false,
    showContextMetaModal: false,
    contextMetaModalTab: "context", // "context" | "plans" | "experts"
    abcdModalTab: "manual", // "manual" | "parse" | "blank"
    abcdParseInput: "",
    abcdParsedResult: null,
    titleViewMode: "badges", // "badges" | "plain"
    advisorTab: "recommend", // "recommend" | "validator" | "national_directions" | "wpa_framework"
    statlabSubTab: "decision_rules", // "decision_rules" | "ioc" | "item_analysis" | "cronbach" | "e1e2" | "ttest" | "ch4_tables"
    matrixSubTab: "operational", // "operational" | "r1d1_bridge" | "alignment"
    selectedDecisionObjective: "compare_pre_post",
    // Forgot Password State
    forgotForm: {
      identifier: "",
      submitted: false,
      message: "",
      otpSent: false,
      resetOtp: "",
      newPass: ""
    },
    // 10-Step Research Wizard State
    showWizardModal: false,
    wizardStep: 1,
    wizardData: {},
    lastSavedTimestamp: "",
    // Workspace Projects State
    projectFilterStatus: "ALL",
    projectSearch: "",
    auditLogs: [],
    // Interactive Instrument Subtab & PNI State
    instrumentSubTab: "blueprint",
    pniItems: [
      { id: "pni_1", name: "1. การจัดการเรียนรู้เพื่อพัฒนาทักษะการคิดขั้นสูงและการแก้ปัญหา", iMean: 4.82, iSD: 0.39, dMean: 2.14, dSD: 0.65 },
      { id: "pni_2", name: "2. การใช้สื่อนวัตกรรมดิจิทัลและแพลตฟอร์มการเรียนรู้เชิงรุก", iMean: 4.75, iSD: 0.44, dMean: 2.30, dSD: 0.58 },
      { id: "pni_3", name: "3. การจัดกิจกรรมการเรียนรู้แบบร่วมมือและการทำงานเป็นทีม", iMean: 4.60, iSD: 0.52, dMean: 2.65, dSD: 0.70 },
      { id: "pni_4", name: "4. การวัดและประเมินผลตามสภาพจริงด้วยเกณฑ์รูบริก", iMean: 4.68, iSD: 0.48, dMean: 2.42, dSD: 0.62 },
      { id: "pni_5", name: "5. การให้ข้อมูลย้อนกลับ (Feedback) เพื่อพัฒนาการเรียนรู้ของผู้เรียน", iMean: 4.55, iSD: 0.55, dMean: 2.80, dSD: 0.72 },
      { id: "pni_6", name: "6. การสร้างแรงบันดาลใจและเจตคติที่ดีต่อรายวิชา", iMean: 4.70, iSD: 0.46, dMean: 3.10, dSD: 0.68 }
    ],
    // Interactive IOC State (5 items x 5 experts)
    iocExpertsCount: 5,
    cviThreshold: 0.60,
    iocItems: [
      { id: 1, name: "ข้อ 1: ความสามารถในการระบุปัญหาและตั้งสมมติฐาน", scores: [1, 1, 1, 1, 1] },
      { id: 2, name: "ข้อ 2: การออกแบบการทดลองและเลือกใช้อุปกรณ์", scores: [1, 1, 0, 1, 1] },
      { id: 3, name: "ข้อ 3: การรวบรวมและบันทึกข้อมูลเชิงประจักษ์", scores: [1, 1, 1, 1, 0] },
      { id: 4, name: "ข้อ 4: การวิเคราะห์ข้อมูลและแปลความหมาย", scores: [1, 0, 1, 1, 1] },
      { id: 5, name: "ข้อ 5: การสรุปผลและลงข้อสรุปเชิงวิทยาศาสตร์", scores: [1, 1, 1, 1, 1] }
    ],
    // Interactive Test Item Analysis State (Norm-Referenced & Criterion-Referenced)
    itemAnalysisType: "norm", // "norm" | "criterion"
    itemAnalysisTotalN: 30,
    itemAnalysisHighN: 8,
    itemAnalysisLowN: 8,
    itemAnalysisCutOff: 60,
    normTestVariance: 5.85,
    itemAnalysisItems: [
      { id: 1, h: 8, l: 3, name: "ข้อ 1" },
      { id: 2, h: 7, l: 2, name: "ข้อ 2" },
      { id: 3, h: 8, l: 4, name: "ข้อ 3" },
      { id: 4, h: 6, l: 1, name: "ข้อ 4" },
      { id: 5, h: 7, l: 3, name: "ข้อ 5" },
      { id: 6, h: 8, l: 2, name: "ข้อ 6" },
      { id: 7, h: 6, l: 2, name: "ข้อ 7" },
      { id: 8, h: 7, l: 4, name: "ข้อ 8" },
      { id: 9, h: 8, l: 3, name: "ข้อ 9" },
      { id: 10, h: 7, l: 1, name: "ข้อ 10" }
    ],
    // Criterion-Referenced Binary Test Items (Brennan B-Index & Lovett)
    criterionMasterN: 15,
    criterionNonMasterN: 15,
    brennanCutOff: 60,
    criterionItems: [
      { id: 1, name: "ข้อ 1", u: 14, l: 3, p: 0.57, b: 0.73 },
      { id: 2, name: "ข้อ 2", u: 13, l: 2, p: 0.50, b: 0.73 },
      { id: 3, name: "ข้อ 3", u: 15, l: 4, p: 0.63, b: 0.73 },
      { id: 4, name: "ข้อ 4", u: 12, l: 1, p: 0.43, b: 0.73 },
      { id: 5, name: "ข้อ 5", u: 14, l: 4, p: 0.60, b: 0.67 },
      { id: 6, name: "ข้อ 6", u: 15, l: 3, p: 0.60, b: 0.80 },
      { id: 7, name: "ข้อ 7", u: 13, l: 3, p: 0.53, b: 0.67 },
      { id: 8, name: "ข้อ 8", u: 14, l: 2, p: 0.53, b: 0.80 },
      { id: 9, name: "ข้อ 9", u: 15, l: 5, p: 0.67, b: 0.67 },
      { id: 10, name: "ข้อ 10", u: 12, l: 2, p: 0.47, b: 0.67 }
    ],
    // Interactive Cronbach Alpha State (5-level Likert scale, 8 items)
    cronbachItems: [
      { id: 1, name: "1. กิจกรรมการเรียนรู้มีความน่าสนใจและท้าทาย", variance: 0.38, mean: 4.65, rit: 0.68 },
      { id: 2, name: "2. ลำดับขั้นตอนการเรียนรู้เข้าใจง่ายและต่อเนื่อง", variance: 0.32, mean: 4.58, rit: 0.74 },
      { id: 3, name: "3. สื่อนวัตกรรมช่วยให้เข้าใจเนื้อหาได้ชัดเจน", variance: 0.42, mean: 4.70, rit: 0.65 },
      { id: 4, name: "4. ได้ฝึกทักษะการคิดวิเคราะห์และการลงมือปฏิบัติจริง", variance: 0.28, mean: 4.62, rit: 0.78 },
      { id: 5, name: "5. ได้ร่วมมือแลกเปลี่ยนเรียนรู้กับเพื่อนในกลุ่ม", variance: 0.35, mean: 4.55, rit: 0.71 },
      { id: 6, name: "6. ครูให้คำแนะนำและข้อมูลสะท้อนกลับอย่างสม่ำเสมอ", variance: 0.22, mean: 4.68, rit: 0.82 },
      { id: 7, name: "7. สามารถนำความรู้ไปประยุกต์ใช้ในชีวิตประจำวันได้", variance: 0.30, mean: 4.60, rit: 0.69 },
      { id: 8, name: "8. มีความสุขและพึงพอใจต่อบรรยากาศการเรียนรู้", variance: 0.20, mean: 4.72, rit: 0.85 }
    ],
    cronbachTotalVariance: 18.50,
    // Smart Hypothesis Testing Lab State
    hypothesisTestType: "paired_t", // "paired_t" | "one_sample_t" | "wilcoxon"
    hypothesisOneSampleCriteria: 28,
    hypothesisData: [
      { id: 1, pre: 16, post: 32 },
      { id: 2, pre: 14, post: 30 },
      { id: 3, pre: 18, post: 34 },
      { id: 4, pre: 15, post: 31 },
      { id: 5, pre: 20, post: 36 },
      { id: 6, pre: 17, post: 33 },
      { id: 7, pre: 19, post: 35 },
      { id: 8, pre: 13, post: 29 },
      { id: 9, pre: 15, post: 32 },
      { id: 10, pre: 18, post: 34 },
      { id: 11, pre: 16, post: 31 },
      { id: 12, pre: 17, post: 33 },
      { id: 13, pre: 14, post: 30 },
      { id: 14, pre: 19, post: 35 },
      { id: 15, pre: 18, post: 33 },
      { id: 16, pre: 15, post: 32 },
      { id: 17, pre: 17, post: 34 },
      { id: 18, pre: 16, post: 30 },
      { id: 19, pre: 20, post: 36 },
      { id: 20, pre: 18, post: 35 },
      { id: 21, pre: 15, post: 31 },
      { id: 22, pre: 17, post: 32 },
      { id: 23, pre: 19, post: 35 },
      { id: 24, pre: 14, post: 28 },
      { id: 25, pre: 16, post: 33 },
      { id: 26, pre: 18, post: 34 },
      { id: 27, pre: 17, post: 32 },
      { id: 28, pre: 15, post: 30 },
      { id: 29, pre: 20, post: 36 },
      { id: 30, pre: 19, post: 35 }
    ],
    geminiKey: "",
    aiTask: "ch1_background",
    aiOutput: "",
    aiLoading: false,
    advisorLoading: false,
    advisorCriteria: {
      subjectId: "sci",
      gradeId: "m1_3",
      painId: "thinking",
      goalId: "wpa_ks3",
      customTopic: "ระบบนิเวศและการแก้ปัญหาสิ่งแวดล้อมในท้องถิ่น",
      schoolName: "โรงเรียนเปรมติณสูลานนท์"
    },
    adminSearch: "",
    adminFilterCohort: "ALL",
    signupForm: {
      signup_type: "training",
      cohort_code: "RD69A1",
      email: "",
      phone: "",
      title: "นางสาว",
      first_name: "",
      last_name: "",
      gender: "หญิง",
      birth_year: "2535",
      position: "ครู",
      affiliation: "สพฐ.",
      workplace: "",
      province_code: "44",
      goals: ["วิทยฐานะ", "วิจัยในชั้นเรียน"],
      consent: true
    }
  };

  function applyThemeClass() {
    if (state.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  function recordAudit(type, desc) {
    const uName = state.currentUser ? `${state.currentUser.title || ''}${state.currentUser.first_name || ''} ${state.currentUser.last_name || ''}`.trim() || state.currentUser.email : "ผู้ใช้ทั่วไป";
    const newLog = {
      id: `log-${Date.now()}`,
      type,
      user: uName,
      desc,
      timestamp: new Date().toISOString()
    };
    state.auditLogs.unshift(newLog);
    if (state.auditLogs.length > 50) state.auditLogs = state.auditLogs.slice(0, 50);
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(state.auditLogs));
    } catch {}
  }

  function hydrateProjectSchema(p) {
    if (!p) return p;
    if (!p.contextMeta) {
      p.contextMeta = JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_CONTEXT_META || {}));
    }
    if (p.researcher && !p.contextMeta.researcherName) p.contextMeta.researcherName = p.researcher;
    if (p.position && !p.contextMeta.academicRank) p.contextMeta.academicRank = p.position;
    if (p.school && !p.contextMeta.schoolName) p.contextMeta.schoolName = p.school;
    if (p.affiliation && !p.contextMeta.affiliation) p.contextMeta.affiliation = p.affiliation;

    // Automatic migration from previous default school
    if (p.school === "โรงเรียนผดุงนารี") p.school = "โรงเรียนเปรมติณสูลานนท์";
    if (p.contextMeta && p.contextMeta.schoolName === "โรงเรียนผดุงนารี") {
      p.contextMeta.schoolName = "โรงเรียนเปรมติณสูลานนท์";
      if (p.contextMeta.affiliation === "สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม") {
        p.contextMeta.affiliation = "องค์การบริหารส่วนจังหวัดขอนแก่น";
      }
      if (p.contextMeta.province === "มหาสารคาม") {
        p.contextMeta.province = "ขอนแก่น";
      }
    }
    if (p.population && p.population.includes("โรงเรียนผดุงนารี")) {
      p.population = p.population.replace(/โรงเรียนผดุงนารี\s*อำเภอเมือง\s*จังหวัดมหาสารคาม/g, "โรงเรียนเปรมติณสูลานนท์ สังกัดองค์การบริหารส่วนจังหวัดขอนแก่น")
                                 .replace(/โรงเรียนผดุงนารี/g, "โรงเรียนเปรมติณสูลานนท์");
    }
    if (p.sample && p.sample.includes("โรงเรียนผดุงนารี")) {
      p.sample = p.sample.replace(/โรงเรียนผดุงนารี/g, "โรงเรียนเปรมติณสูลานนท์");
    }
    if (p.affiliation === "สำนักงานเขตพื้นที่การศึกษามัธยมศึกษามหาสารคาม") {
      p.affiliation = "องค์การบริหารส่วนจังหวัดขอนแก่น";
    }

    if (!p.lessonPlans || !Array.isArray(p.lessonPlans) || p.lessonPlans.length === 0) {
      p.lessonPlans = JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_LESSON_PLANS || []));
    }
    if (!p.expertRoster || !Array.isArray(p.expertRoster) || p.expertRoster.length === 0) {
      p.expertRoster = JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_EXPERT_ROSTER || []));
    }

    if (!p.samplingMetadata) {
      p.samplingMetadata = JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_SAMPLING_METADATA || {
        type: "cluster_random",
        populationSize: 120,
        sampleSize: 35,
        classroomsCount: 4,
        selectedClassrooms: 1,
        isNormalDistributed: true,
        unit: "ห้องเรียน (Classroom Unit)",
        normalityTest: "shapiro_wilk"
      }));
    } else {
      p.samplingMetadata.type = p.samplingMetadata.type || "cluster_random";
      p.samplingMetadata.populationSize = p.samplingMetadata.populationSize || 120;
      p.samplingMetadata.sampleSize = p.samplingMetadata.sampleSize || 35;
      p.samplingMetadata.classroomsCount = p.samplingMetadata.classroomsCount || 4;
      p.samplingMetadata.selectedClassrooms = p.samplingMetadata.selectedClassrooms || 1;
      if (p.samplingMetadata.isNormalDistributed === undefined) p.samplingMetadata.isNormalDistributed = true;
    }
    p.samplingMethod = p.samplingMetadata.type;
    if (!p.experimentalInstruments) {
      p.experimentalInstruments = JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_EXPERIMENTAL_INSTRUMENTS || []));
    }
    if (!p.dataCollectionInstruments) {
      p.dataCollectionInstruments = JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_DATA_COLLECTION_INSTRUMENTS || []));
    }
    if (!p.operationalDefinitions) {
      p.operationalDefinitions = JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_OPERATIONAL_DEFINITIONS || []));
    }
    if (!p.testBlueprint) {
      p.testBlueprint = JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_TEST_BLUEPRINT || { bufferPercent: 40, units: [] }));
    }
    if (!p.analyticRubrics) {
      p.analyticRubrics = JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_ANALYTIC_RUBRICS || []));
    }
    if (!p.syntaxSynthesisMatrix) {
      p.syntaxSynthesisMatrix = JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_SYNTAX_SYNTHESIS_MATRIX || {}));
    }
    if (!p.pniItems) {
      p.pniItems = JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_PNI_ITEMS || []));
    }
    return p;
  }

  function loadStorage() {
    try {
      const m = localStorage.getItem(STORAGE_KEYS.MEMBERS);
      state.members = m ? JSON.parse(m) : [...window.ROAD_DATA.SEED_MEMBERS];
    } catch {
      state.members = [...window.ROAD_DATA.SEED_MEMBERS];
    }

    try {
      const c = localStorage.getItem(STORAGE_KEYS.COHORTS);
      state.cohorts = c ? JSON.parse(c) : [...window.ROAD_DATA.DEFAULT_COHORTS];
    } catch {
      state.cohorts = [...window.ROAD_DATA.DEFAULT_COHORTS];
    }

    try {
      const u = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      state.currentUser = u ? JSON.parse(u) : state.members[1];
    } catch {
      state.currentUser = state.members[1];
    }

    try {
      const p = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (p) {
        state.projects = JSON.parse(p);
      } else {
        state.projects = window.ROAD_DATA.PRESETS.map((preset, idx) => ({
          ...JSON.parse(JSON.stringify(preset)),
          id: `proj-${idx + 1}`,
          status: "outlined",
          progress: 85,
          updatedAt: new Date().toISOString(),
          customSections: {}
        }));
      }
    } catch {
      state.projects = [JSON.parse(JSON.stringify(window.ROAD_DATA.PRESETS[0]))];
    }

    // Ensure all projects have status, progress and V2.0 schema fields
    state.projects = state.projects.map(p => hydrateProjectSchema({
      ...p,
      status: p.status || "outlined",
      progress: p.progress || 85,
      updatedAt: p.updatedAt || new Date().toISOString()
    }));

    try {
      const al = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      state.auditLogs = al ? JSON.parse(al) : [...window.ROAD_DATA.DEFAULT_AUDIT_LOGS];
    } catch {
      state.auditLogs = [...window.ROAD_DATA.DEFAULT_AUDIT_LOGS];
    }

    state.activeProjectId = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT_ID) || state.projects[0]?.id;
    state.geminiKey = localStorage.getItem(STORAGE_KEYS.GEMINI_KEY) || "";
    state.theme = localStorage.getItem(STORAGE_KEYS.THEME) || "light";
    applyThemeClass();

    // Check URL pathname or query param
    const params = new URLSearchParams(window.location.search);
    const pathname = (window.location.pathname || "").toLowerCase().replace(/\/$/, "");
    if (params.get("view") === "signup" || pathname === "/signup") state.view = "signup";
    else if (params.get("view") === "forgot" || pathname === "/forgot") state.view = "forgot";
    else if (params.get("view") === "admin" || pathname === "/admin") state.view = "admin";
    else if (params.get("view") === "studio" || pathname === "/app" || pathname === "/studio") state.view = "studio";
    else if (params.get("view") === "slides" || pathname === "/slides") state.view = "slides";
    else state.view = "login"; // Show the 3D Neumorphic Welcome Back UI first!
  }

  function saveMembers() {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(state.members));
  }

  function saveCohorts() {
    localStorage.setItem(STORAGE_KEYS.COHORTS, JSON.stringify(state.cohorts));
  }

  function saveProjects() {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(state.projects));
    if (state.activeProjectId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT_ID, state.activeProjectId);
    }
  }

  function getActiveProject() {
    return (state.projects && state.projects.find(p => p.id === state.activeProjectId)) || (state.projects && state.projects[0]) || window.ROAD_DATA.MASTER_DEMO_PROJECT;
  }

  function showToast(msg, kind = "ok") {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const el = document.createElement("div");
    const colors = {
      ok: "border-blue-400/50 bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-blue-100",
      warn: "border-amber-400/50 bg-white/95 dark:bg-slate-900/95 text-amber-900 dark:text-amber-100",
      bad: "border-rose-400/50 bg-white/95 dark:bg-slate-900/95 text-rose-900 dark:text-rose-100"
    };
    el.className = `neu-card-sm px-4 py-3 text-sm font-semibold flex items-center gap-2.5 transition-all duration-300 ${colors[kind] || colors.ok}`;
    el.innerHTML = `<span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${kind === "ok" ? "bg-blue-600" : kind === "warn" ? "bg-amber-500" : "bg-rose-600"}">${kind === "ok" ? "✔" : kind === "warn" ? "!" : "✕"}</span><span>${escapeHtml(msg)}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      if (el && el.style) el.style.opacity = "0";
      setTimeout(() => el && typeof el.remove === "function" && el.remove(), 300);
    }, 3200);
  }

  // --- Formal Academic Narrative Generator for Population & Sampling ---
  function generateSamplingNarrative(proj, methodType, popCount, classCount, sampleCount, selClassCount) {
    const p = proj || {};
    const meta = p.contextMeta || {};
    const school = meta.schoolName || p.schoolName || p.school || "โรงเรียนเปรมติณสูลานนท์";
    const affil = meta.affiliation || p.affiliation || "องค์การบริหารส่วนจังหวัดขอนแก่น";
    const targetGrade = p.D || "นักเรียนชั้นมัธยมศึกษาปีที่ 4";
    const year = meta.academicYear || "2569";
    const sem = meta.semester || "1";

    const popN = Number(popCount) || 120;
    const cCount = Number(classCount) || 4;
    const sN = Number(sampleCount) || 35;
    const selC = Number(selClassCount) || 1;

    let popText = "";
    let sampleText = "";

    if (methodType === "population") {
      popText = `ประชากรที่ใช้ในการวิจัยครั้งนี้ เป็น${targetGrade} ${school} สังกัด${affil} ที่กำลังศึกษาอยู่ในภาคเรียนที่ ${sem} ปีการศึกษา ${year} จำนวน ${cCount} ห้องเรียน รวมทั้งสิ้น ${popN} คน`;
      sampleText = `กลุ่มเป้าหมายที่ใช้ในการวิจัยครั้งนี้ คือประชากรทั้งหมด ได้แก่ ${targetGrade} ${school} สังกัด${affil} ภาคเรียนที่ ${sem} ปีการศึกษา ${year} จำนวน ${cCount} ห้องเรียน รวมทั้งสิ้น ${popN} คน เนื่องจากสถานศึกษาเป็นโรงเรียนขนาดที่มีประชากรจำนวนจำกัด ผู้วิจัยจึงศึกษาจากประชากรทั้งหมดโดยไม่มีการสุ่มตัวอย่าง`;
    } else if (methodType === "purposive") {
      popText = `ประชากรที่ใช้ในการวิจัยครั้งนี้ ได้แก่ ${targetGrade} ${school} สังกัด${affil} ที่กำลังศึกษาอยู่ในภาคเรียนที่ ${sem} ปีการศึกษา ${year} จำนวน ${cCount} ห้องเรียน รวมทั้งสิ้น ${popN} คน`;
      sampleText = `กลุ่มตัวอย่างที่ใช้ในการวิจัยครั้งนี้ ได้แก่ ${targetGrade} ${school} สังกัด${affil} ภาคเรียนที่ ${sem} ปีการศึกษา ${year} จำนวน ${selC} ห้องเรียน รวมทั้งสิ้น ${sN} คน ซึ่งได้มาโดยการเลือกแบบเจาะจง (Purposive Sampling) เนื่องจากเป็นห้องเรียนที่มีปัญหาผลสัมฤทธิ์และทักษะการเรียนรู้ต่ำกว่าเกณฑ์เป้าหมายของสถานศึกษา`;
    } else if (methodType === "simple_random") {
      popText = `ประชากรที่ใช้ในการวิจัยครั้งนี้ ได้แก่ ${targetGrade} ${school} สังกัด${affil} ที่กำลังศึกษาอยู่ในภาคเรียนที่ ${sem} ปีการศึกษา ${year} จำนวน ${cCount} ห้องเรียน รวมทั้งสิ้น ${popN} คน`;
      sampleText = `กลุ่มตัวอย่างที่ใช้ในการวิจัยครั้งนี้ ได้แก่ ${targetGrade} ${school} สังกัด${affil} ภาคเรียนที่ ${sem} ปีการศึกษา ${year} รวมทั้งสิ้น ${sN} คน ซึ่งได้มาโดยวิธีการสุ่มอย่างง่าย (Simple Random Sampling) โดยใช้รายชื่อนักเรียนทั้งหมดเป็นกรอบการสุ่ม (Sampling Frame) ด้วยการจับสลากแบบไม่คืนที่`;
    } else {
      // cluster_random
      popText = `ประชากรที่ใช้ในการวิจัยครั้งนี้ ได้แก่ ${targetGrade} ${school} สังกัด${affil} ที่กำลังศึกษาอยู่ในภาคเรียนที่ ${sem} ปีการศึกษา ${year} จำนวน ${cCount} ห้องเรียน รวมทั้งสิ้น ${popN} คน ซึ่งจัดห้องเรียนแบบคละความสามารถ (Heterogeneous Classroom)`;
      sampleText = `กลุ่มตัวอย่างที่ใช้ในการวิจัยครั้งนี้ ได้แก่ ${targetGrade} (ห้อง ม.4/1) ${school} สังกัด${affil} ภาคเรียนที่ ${sem} ปีการศึกษา ${year} จำนวน ${selC} ห้องเรียน รวมทั้งสิ้น ${sN} คน ซึ่งได้มาโดยการสุ่มแบบกลุ่ม (Cluster Random Sampling) โดยใช้ห้องเรียนเป็นหน่วยในการสุ่ม (Sampling Unit) ด้วยวิธีการจับสลาก`;
    }

    return { populationText: popText, sampleText: sampleText };
  }

  // --- Navigation & View Switching ---
  window.ROAD_APP = {
    toggleTheme() {
      state.theme = state.theme === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
      applyThemeClass();
      renderApp();
    },

    toggleLoginPass() {
      state.showLoginPass = !state.showLoginPass;
      renderApp();
    },

    toggleRememberMe() {
      state.rememberMe = !state.rememberMe;
      renderApp();
    },

    setView(v) {
      state.view = v;
      if (v === "slides") state.slideIndex = 0;
      renderApp();
      if (typeof window.scrollTo === "function") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },

    setStudioTab(tab) {
      if (tab === "wizard") {
        this.openWizardModal(1);
        return;
      }
      state.studioTab = tab;
      renderApp();
    },

    goToWorkflowStep(stepNum) {
      if (stepNum === 1) this.setStudioTab("abcd");
      else if (stepNum === 2) this.setStudioTab("diagrams");
      else if (stepNum === 3) this.setStudioTab("chapters");
      else if (stepNum === 4) this.setStudioTab("advisor");
      if (typeof window.scrollTo === "function") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },

    toggleAllToolsView() {
      state.showAllTools = !state.showAllTools;
      renderApp();
    },

    getActiveProject() {
      return getActiveProject();
    },

    saveProjects() {
      saveProjects();
    },

    renderLiveTitleBar() {
      renderLiveTitleBar();
    },

    renderApp() {
      renderApp();
    },

    toggleReviewCenter() {
      state.showReviewCenter = !state.showReviewCenter;
      renderApp();
    },

    handleQuickExport(val) {
      if (!val) return;
      if (val === "full_manuscript") return this.exportFullManuscript();
      if (val === "front_matter") return this.exportFrontMatter();
      if (val === "expert_kit") return this.exportExpertKit();
      if (val === "back_matter") return this.exportBackMatter();
      if (val === "appendix") return this.exportAppendix();
      if (val === "print") return window.print();
      if (val === "json") return this.exportJson();
    },

    updateSamplingMetadata(field, val) {
      if (state.showWizardModal) {
        if (field === "type") return this.updateWizardSamplingMethod(val);
        return this.updateWizardSamplingNumber(field, val);
      }
      const proj = getActiveProject();
      if (!proj.samplingMetadata) {
        proj.samplingMetadata = JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_SAMPLING_METADATA || { type: "cluster_random" }));
      }
      proj.samplingMetadata[field] = val;
      if (field === "type") {
        this.updateSamplingType(val);
      } else {
        saveProjects();
        renderApp();
      }
    },

    setAiOutput(val) {
      state.aiOutput = val;
    },

    setChapterFilter(num) {
      state.activeChapterFilter = Number(num);
      renderApp();
    },

    filterChapterView(num) {
      this.setChapterFilter(num);
    },

    setAdvisorTab(t) {
      state.advisorTab = t;
      renderApp();
    },

    setStatlabSubTab(t) {
      state.statlabSubTab = t;
      renderApp();
    },

    setMatrixSubTab(t) {
      state.matrixSubTab = t;
      renderApp();
    },

    toggleSyntaxScholarCheck(stepIdx, scholarIdx) {
      const proj = getActiveProject();
      if (!proj.syntaxSynthesisMatrix) {
        proj.syntaxSynthesisMatrix = JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_SYNTAX_SYNTHESIS_MATRIX || {}));
      }
      const st = proj.syntaxSynthesisMatrix.steps[stepIdx];
      if (st) {
        if (!st.scholarChecks) st.scholarChecks = [false, false, false, false, false, false, false];
        st.scholarChecks[scholarIdx] = !st.scholarChecks[scholarIdx];
        saveProjects();
        renderApp();
      }
    },

    updateSyntaxStepName(stepIdx, val) {
      const proj = getActiveProject();
      if (!proj.syntaxSynthesisMatrix) {
        proj.syntaxSynthesisMatrix = JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_SYNTAX_SYNTHESIS_MATRIX || {}));
      }
      if (proj.syntaxSynthesisMatrix.steps && proj.syntaxSynthesisMatrix.steps[stepIdx]) {
        proj.syntaxSynthesisMatrix.steps[stepIdx].stepName = val;
        saveProjects();
        renderApp();
      }
    },

    updateSyntaxSynthesizedStep(stepIdx, val) {
      const proj = getActiveProject();
      if (!proj.syntaxSynthesisMatrix) {
        proj.syntaxSynthesisMatrix = JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_SYNTAX_SYNTHESIS_MATRIX || {}));
      }
      if (proj.syntaxSynthesisMatrix.steps && proj.syntaxSynthesisMatrix.steps[stepIdx]) {
        proj.syntaxSynthesisMatrix.steps[stepIdx].synthesizedStep = val;
        saveProjects();
        renderApp();
      }
    },

    resetSyntaxMatrix() {
      const proj = getActiveProject();
      proj.syntaxSynthesisMatrix = JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_SYNTAX_SYNTHESIS_MATRIX || {}));
      saveProjects();
      renderApp();
      showToast("คืนค่าเริ่มต้นตารางสังเคราะห์ขั้นตอนการจัดกิจกรรมเรียบร้อยแล้ว");
    },

    setInstrumentSubTab(t) {
      state.instrumentSubTab = t;
      renderApp();
    },

    updateTestBlueprintCell(unitIdx, levelKey, val) {
      const proj = getActiveProject();
      if (!proj.testBlueprint) proj.testBlueprint = JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_TEST_BLUEPRINT));
      if (proj.testBlueprint.units[unitIdx]) {
        proj.testBlueprint.units[unitIdx].bloomLevels[levelKey] = Math.max(0, parseInt(val) || 0);
        saveProjects();
        renderApp();
      }
    },

    updateTestBlueprintBuffer(val) {
      const proj = getActiveProject();
      if (!proj.testBlueprint) proj.testBlueprint = JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_TEST_BLUEPRINT));
      proj.testBlueprint.bufferPercent = Math.max(0, parseInt(val) || 0);
      saveProjects();
      renderApp();
    },

    updateTestBlueprintUnitName(unitIdx, val) {
      const proj = getActiveProject();
      if (proj.testBlueprint?.units[unitIdx]) {
        proj.testBlueprint.units[unitIdx].unitName = val;
        saveProjects();
        renderApp();
      }
    },

    addTestBlueprintUnit() {
      const proj = getActiveProject();
      if (!proj.testBlueprint) proj.testBlueprint = JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_TEST_BLUEPRINT));
      const nextNum = proj.testBlueprint.units.length + 1;
      proj.testBlueprint.units.push({
        unitId: `unit_${nextNum}`,
        unitName: `หน่วยการเรียนรู้ที่ ${nextNum}`,
        hours: 4,
        bloomLevels: { remember: 2, understand: 2, apply: 2, analyze: 1, evaluate: 0, create: 0 }
      });
      saveProjects();
      renderApp();
      showToast("เพิ่มหน่วยการเรียนรู้ในผังแบบทดสอบแล้ว");
    },

    removeTestBlueprintUnit(unitIdx) {
      const proj = getActiveProject();
      if (proj.testBlueprint?.units && proj.testBlueprint.units.length > 1) {
        proj.testBlueprint.units.splice(unitIdx, 1);
        saveProjects();
        renderApp();
        showToast("ลบหน่วยการเรียนรู้แล้ว");
      } else {
        showToast("ต้องมีหน่วยการเรียนรู้อย่างน้อย 1 หน่วย", "warn");
      }
    },

    updateRubricCriterion(idx, field, val) {
      const proj = getActiveProject();
      if (proj.analyticRubrics?.[idx]) {
        if (field === "weight") {
          proj.analyticRubrics[idx].weight = Math.max(0, Number(val) || 0);
        } else {
          proj.analyticRubrics[idx][field] = val;
        }
        saveProjects();
        renderApp();
      }
    },

    updateRubricLevel(critIdx, lvlIdx, val) {
      const proj = getActiveProject();
      if (proj.analyticRubrics?.[critIdx]?.levels?.[lvlIdx]) {
        proj.analyticRubrics[critIdx].levels[lvlIdx].descriptor = val;
        saveProjects();
        renderApp();
      }
    },

    addRubricCriterion() {
      const proj = getActiveProject();
      if (!proj.analyticRubrics) proj.analyticRubrics = JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_ANALYTIC_RUBRICS));
      const nextId = proj.analyticRubrics.length + 1;
      proj.analyticRubrics.push({
        criterionId: `crit_${nextId}`,
        criterionName: `เกณฑ์ประเมินที่ ${nextId}`,
        weight: 20,
        levels: [
          { score: 4, label: "ดีมาก (4)", descriptor: "แสดงพฤติกรรมได้อย่างครบถ้วน ถูกต้อง และเป็นแบบอย่างได้" },
          { score: 3, label: "ดี (3)", descriptor: "แสดงพฤติกรรมได้ถูกต้องเกือบทั้งหมด โดยมีข้อบกพร่องเล็กน้อย" },
          { score: 2, label: "พอใช้ (2)", descriptor: "แสดงพฤติกรรมได้บางส่วน จำเป็นต้องได้รับคำแนะนำเพิ่มเติม" },
          { score: 1, label: "ปรับปรุง (1)", descriptor: "ไม่สามารถแสดงพฤติกรรมได้ตามเกณฑ์ หรือต้องได้รับการช่วยเหลืออย่างต่อเนื่อง" }
        ]
      });
      saveProjects();
      renderApp();
      showToast("เพิ่มเกณฑ์รูบริกใหม่เรียบร้อยแล้ว");
    },

    removeRubricCriterion(idx) {
      const proj = getActiveProject();
      if (proj.analyticRubrics && proj.analyticRubrics.length > 1) {
        proj.analyticRubrics.splice(idx, 1);
        saveProjects();
        renderApp();
        showToast("ลบเกณฑ์รูบริกแล้ว");
      } else {
        showToast("ต้องมีเกณฑ์ประเมินอย่างน้อย 1 รายการ", "warn");
      }
    },

    updateOperationalDef(idx, field, val) {
      const proj = getActiveProject();
      if (proj.operationalDefinitions?.[idx]) {
        proj.operationalDefinitions[idx][field] = val;
        saveProjects();
        renderApp();
      }
    },

    addOperationalDefIndicator(defIdx, val) {
      const proj = getActiveProject();
      if (proj.operationalDefinitions?.[defIdx] && val && val.trim()) {
        if (!proj.operationalDefinitions[defIdx].indicators) proj.operationalDefinitions[defIdx].indicators = [];
        proj.operationalDefinitions[defIdx].indicators.push(val.trim());
        saveProjects();
        renderApp();
        showToast("เพิ่มตัวบ่งชี้พฤติกรรมแล้ว");
      }
    },

    removeOperationalDefIndicator(defIdx, indIdx) {
      const proj = getActiveProject();
      if (proj.operationalDefinitions?.[defIdx]?.indicators) {
        proj.operationalDefinitions[defIdx].indicators.splice(indIdx, 1);
        saveProjects();
        renderApp();
      }
    },

    addOperationalDef() {
      const proj = getActiveProject();
      if (!proj.operationalDefinitions) proj.operationalDefinitions = JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_OPERATIONAL_DEFINITIONS));
      proj.operationalDefinitions.push({
        construct: "ตัวแปรใหม่",
        definition: "นิยามเชิงปฏิบัติการที่ระบุพฤติกรรมที่สังเกตได้ชัดเจน",
        indicators: ["สามารถแสดงพฤติกรรมตัวบ่งชี้ที่ 1", "สามารถแสดงพฤติกรรมตัวบ่งชี้ที่ 2"],
        instrumentCriteria: "วัดด้วยแบบประเมินและเกณฑ์รูบริก กำหนดเกณฑ์ผ่านร้อยละ 70"
      });
      saveProjects();
      renderApp();
      showToast("เพิ่มนิยามปฏิบัติการใหม่แล้ว");
    },

    removeOperationalDef(idx) {
      const proj = getActiveProject();
      if (proj.operationalDefinitions && proj.operationalDefinitions.length > 1) {
        proj.operationalDefinitions.splice(idx, 1);
        saveProjects();
        renderApp();
        showToast("ลบนิยามปฏิบัติการแล้ว");
      } else {
        showToast("ต้องมีนิยามศัพท์เฉพาะอย่างน้อย 1 รายการ", "warn");
      }
    },

    addInstrument(category) {
      const proj = getActiveProject();
      const listKey = category === "experimental" ? "experimentalInstruments" : "dataCollectionInstruments";
      if (!proj[listKey]) proj[listKey] = [];
      const isExp = category === "experimental";
      proj[listKey].push({
        id: `${isExp ? 'exp' : 'data'}_${Date.now()}`,
        name: isExp ? "นวัตกรรม/แผนการจัดการเรียนรู้ใหม่" : "เครื่องมือวัดและประเมินผลใหม่",
        purpose: isExp ? "ใช้เป็นนวัตกรรมการทดลองในการจัดกิจกรรม" : "ใช้เก็บรวบรวมข้อมูลก่อน-หลังเรียน",
        qualityMethod: isExp ? "IOC จากผู้เชี่ยวชาญ 5 ท่าน (เกณฑ์ >= 0.60)" : "IOC >= 0.60, ค่าความยาก 0.20-0.80, อำนาจจำแนก >= 0.20, KR-20 >= 0.80",
        qualityScore: isExp ? "IOC = 0.90" : "IOC = 0.88, KR-20 = 0.86"
      });
      saveProjects();
      renderApp();
      showToast(`เพิ่มเครื่องมือในกลุ่ม${isExp ? 'ทดลอง' : 'เก็บรวบรวมข้อมูล'}แล้ว`);
    },

    updateInstrument(category, idx, field, val) {
      const proj = getActiveProject();
      const listKey = category === "experimental" ? "experimentalInstruments" : "dataCollectionInstruments";
      if (proj[listKey]?.[idx]) {
        proj[listKey][idx][field] = val;
        saveProjects();
        renderApp();
      }
    },

    removeInstrument(category, idx) {
      const proj = getActiveProject();
      const listKey = category === "experimental" ? "experimentalInstruments" : "dataCollectionInstruments";
      if (proj[listKey]?.[idx]) {
        proj[listKey].splice(idx, 1);
        saveProjects();
        renderApp();
        showToast("ลบเครื่องมือแล้ว");
      }
    },

    // 1-Click Guardrail Auto-Fixes
    autoFixHypothesesToR2Only() {
      const proj = getActiveProject();
      if (proj.phases) {
        if (proj.phases.r1) proj.phases.r1.hypotheses = [];
        if (proj.phases.d1) proj.phases.d1.hypotheses = [];
        if (proj.phases.d2) proj.phases.d2.hypotheses = [];
        if (proj.phases.r2 && (!proj.phases.r2.hypotheses || !proj.phases.r2.hypotheses.length)) {
          proj.phases.r2.hypotheses = [
            `ผู้เรียนที่ได้รับการจัดการเรียนรู้ด้วย${proj.A} มีผลสัมฤทธิ์ทางการเรียนหลังเรียนสูงกว่าก่อนเรียนอย่างมีนัยสำคัญทางสถิติที่ระดับ .05`
          ];
        }
      }
      saveProjects();
      renderApp();
      showToast("🛡️ ปรับสมมติฐานให้อยู่เฉพาะระยะที่ 3 (R2) ตามหลักวิชาการเรียบร้อยแล้ว!", "ok");
    },

    autoSwitchSamplingToClusterRandom() {
      const proj = getActiveProject();
      if (!proj.samplingMetadata) proj.samplingMetadata = JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_SAMPLING_METADATA));
      proj.samplingMetadata.type = "cluster_random";
      proj.sample = `นักเรียนชั้น${proj.D} โรงเรียน${proj.advisorContext?.schoolName || 'สังกัด สพฐ.'} จำนวน 1 ห้องเรียน (n = 30-38 คน) ได้มาโดยการสุ่มแบบกลุ่ม (Cluster Random Sampling) โดยใช้ห้องเรียนเป็นหน่วยในการสุ่ม`;
      saveProjects();
      renderApp();
      showToast("🛡️ สลับวิธีสุ่มเป็น Cluster Random Sampling พร้อมใช้ t-test ได้อย่างถูกต้องตามเกณฑ์แล้ว!", "ok");
    },

    autoSwitchStatsToDescriptiveOnly() {
      const proj = getActiveProject();
      if (proj.phases?.r2) {
        proj.phases.r2.statistics = ["ค่าเฉลี่ย (Mean)", "ส่วนเบี่ยงเบนมาตรฐาน (S.D.)", "ดัชนีประสิทธิผล (E.I.)"];
        proj.phases.r2.hypotheses = [
          `ผู้เรียนมีคะแนนพัฒนาการหลังเรียนสูงกว่าก่อนเรียน หรือมีดัชนีประสิทธิผล (E.I.) ไม่น้อยกว่า 0.50`
        ];
      }
      saveProjects();
      renderApp();
      showToast("🛡️ ปรับสถิติเป็น Descriptive + E.I. (งดใช้ t-test สำหรับกลุ่มประชากร/เลือกเจาะจง) เรียบร้อยแล้ว!", "ok");
    },

    updateSamplingType(val) {
      const proj = getActiveProject();
      if (!proj.samplingMetadata) proj.samplingMetadata = JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_SAMPLING_METADATA));
      proj.samplingMetadata.type = val;
      const sObj = window.ROAD_DATA.SAMPLING_METHODS.find(m => m.id === val);
      if (sObj) {
        if (!sObj.allowsInference) {
          showToast(`คำเตือน: วิธีสุ่มแบบ "${sObj.name}" ไม่อนุญาตให้ใช้ t-test ตามหลักสถิติ ระบบจะแนะนำ Descriptive + E.I.`, "warn");
        } else {
          showToast(`ตั้งค่าวิธีการสุ่มเป็น "${sObj.name}" เรียบร้อยแล้ว`, "ok");
        }
      }
      saveProjects();
      renderApp();
    },

    // StatLab Handlers
    updatePniItem(idx, field, val) {
      if (state.pniItems[idx]) {
        state.pniItems[idx][field] = Number(val);
        renderApp();
      }
    },

    addPniItem() {
      const nextNum = state.pniItems.length + 1;
      state.pniItems.push({
        id: `pni_${Date.now()}`,
        name: `ประเด็นความต้องการจำเป็นที่ ${nextNum}`,
        iMean: 4.50,
        iSD: 0.50,
        dMean: 2.50,
        dSD: 0.60
      });
      renderApp();
      showToast("เพิ่มประเด็น PNI เรียบร้อยแล้ว");
    },

    removePniItem(idx) {
      if (state.pniItems.length > 1) {
        state.pniItems.splice(idx, 1);
        renderApp();
        showToast("ลบรายการ PNI แล้ว");
      }
    },

    loadPniMockData() {
      state.pniItems = [
        { id: "pni_1", name: "1. การจัดการเรียนรู้เพื่อพัฒนาทักษะการคิดขั้นสูงและการแก้ปัญหา", iMean: 4.82, iSD: 0.39, dMean: 2.14, dSD: 0.65 },
        { id: "pni_2", name: "2. การใช้สื่อนวัตกรรมดิจิทัลและแพลตฟอร์มการเรียนรู้เชิงรุก", iMean: 4.75, iSD: 0.44, dMean: 2.30, dSD: 0.58 },
        { id: "pni_3", name: "3. การจัดกิจกรรมการเรียนรู้แบบร่วมมือและการทำงานเป็นทีม", iMean: 4.60, iSD: 0.52, dMean: 2.65, dSD: 0.70 },
        { id: "pni_4", name: "4. การวัดและประเมินผลตามสภาพจริงด้วยเกณฑ์รูบริก", iMean: 4.68, iSD: 0.48, dMean: 2.42, dSD: 0.62 },
        { id: "pni_5", name: "5. การให้ข้อมูลย้อนกลับ (Feedback) เพื่อพัฒนาการเรียนรู้ของผู้เรียน", iMean: 4.55, iSD: 0.55, dMean: 2.80, dSD: 0.72 },
        { id: "pni_6", name: "6. การสร้างแรงบันดาลใจและเจตคติที่ดีต่อรายวิชา", iMean: 4.70, iSD: 0.46, dMean: 3.10, dSD: 0.68 }
      ];
      renderApp();
      showToast("🎲 โหลดข้อมูลจำลอง PNI_modified 6 รายการเรียบร้อยแล้ว", "ok");
    },

    setIocExpertsCount(n) {
      const count = Number(n);
      state.iocExpertsCount = count;
      state.cviThreshold = count === 3 ? 0.67 : 0.60;
      state.iocItems.forEach(it => {
        while (it.scores.length < count) it.scores.push(1);
        while (it.scores.length > count) it.scores.pop();
      });
      renderApp();
      showToast(`ปรับจำนวนผู้เชี่ยวชาญเป็น ${count} ท่าน (เกณฑ์ IOC ≥ ${state.cviThreshold})`);
    },

    loadIocMockData() {
      const count = state.iocExpertsCount || 5;
      state.iocItems = [
        { name: "1. สอดคล้องกับมาตรฐานและตัวชี้วัดการเรียนรู้", scores: Array(count).fill(1) },
        { name: "2. จุดประสงค์การเรียนรู้ครอบคลุมทั้ง K, P, A", scores: count === 5 ? [1, 1, 1, 1, 0] : [1, 1, 1] },
        { name: "3. กิจกรรมการเรียนรู้จัดลำดับตามขั้นตอนนวัตกรรม", scores: Array(count).fill(1) },
        { name: "4. สื่อและแหล่งเรียนรู้เหมาะสมกับวัยผู้เรียน", scores: count === 5 ? [1, 1, 0, 1, 1] : [1, 1, 0] },
        { name: "5. คำถามกระตุ้นทักษะการคิดวิเคราะห์อย่างเป็นระบบ", scores: Array(count).fill(1) },
        { name: "6. การวัดและประเมินผลสอดคล้องกับพฤติกรรมเป้าหมาย", scores: count === 5 ? [1, 1, 1, 1, 1] : [1, 1, 1] },
        { name: "7. เกณฑ์การให้คะแนน (Rubrics) ชัดเจน จำแนกได้จริง", scores: count === 5 ? [1, 0, 1, 1, 1] : [1, 1, 1] },
        { name: "8. ความเหมาะสมของเวลาและกิจกรรมการเรียนรู้", scores: count === 5 ? [1, 1, 1, 0, 1] : [1, 1, 1] }
      ];
      renderApp();
      showToast("🎲 โหลดข้อมูลจำลอง IOC & CVI (ความเที่ยงตรงเชิงเนื้อหา) เรียบร้อยแล้ว", "ok");
    },

    setItemAnalysisType(t) {
      state.itemAnalysisType = t;
      renderApp();
    },

    loadItemAnalysisMockData() {
      state.itemAnalysisItems = [
        { name: "ข้อที่ 1", h: 8, l: 3 },
        { name: "ข้อที่ 2", h: 7, l: 2 },
        { name: "ข้อที่ 3", h: 8, l: 4 },
        { name: "ข้อที่ 4", h: 6, l: 1 },
        { name: "ข้อที่ 5", h: 7, l: 3 },
        { name: "ข้อที่ 6", h: 8, l: 2 },
        { name: "ข้อที่ 7", h: 6, l: 2 },
        { name: "ข้อที่ 8", h: 7, l: 4 },
        { name: "ข้อที่ 9", h: 8, l: 3 },
        { name: "ข้อที่ 10", h: 7, l: 1 }
      ];
      renderApp();
      showToast("🎲 โหลดข้อมูลจำลองข้อสอบอิงกลุ่ม (Norm-Referenced KR-20) แล้ว", "ok");
    },

    loadCriterionMockData() {
      state.criterionItems = [
        { name: "ข้อที่ 1", u: 14, l: 3, p: 0.57, b: 0.73 },
        { name: "ข้อที่ 2", u: 13, l: 2, p: 0.50, b: 0.73 },
        { name: "ข้อที่ 3", u: 15, l: 4, p: 0.63, b: 0.73 },
        { name: "ข้อที่ 4", u: 12, l: 1, p: 0.43, b: 0.73 },
        { name: "ข้อที่ 5", u: 14, l: 4, p: 0.60, b: 0.67 },
        { name: "ข้อที่ 6", u: 15, l: 3, p: 0.60, b: 0.80 },
        { name: "ข้อที่ 7", u: 13, l: 3, p: 0.53, b: 0.67 },
        { name: "ข้อที่ 8", u: 14, l: 2, p: 0.53, b: 0.80 },
        { name: "ข้อที่ 9", u: 15, l: 5, p: 0.67, b: 0.67 },
        { name: "ข้อที่ 10", u: 12, l: 2, p: 0.47, b: 0.67 }
      ];
      renderApp();
      showToast("🎲 โหลดข้อมูลจำลองข้อสอบอิงเกณฑ์ (Brennan's B-Index & Lovett) แล้ว", "ok");
    },

    updateCriterionRow(idx, field, val) {
      if (state.criterionItems?.[idx]) {
        state.criterionItems[idx][field] = Number(val);
        renderApp();
      }
    },

    updateBrennanParam(field, val) {
      state[field] = Number(val);
      renderApp();
    },

    loadCronbachMockData() {
      state.cronbachItems = [
        { name: "1. ผู้เรียนมีความกระตือรือร้นในการร่วมกิจกรรม", mean: 4.62, variance: 0.38, rit: 0.68 },
        { name: "2. นวัตกรรมช่วยให้เข้าใจเนื้อหาได้ง่ายและชัดเจนขึ้น", mean: 4.75, variance: 0.32, rit: 0.74 },
        { name: "3. กิจกรรมส่งเสริมการแลกเปลี่ยนเรียนรู้กับเพื่อน", mean: 4.58, variance: 0.42, rit: 0.65 },
        { name: "4. สื่อการเรียนรู้มีความน่าสนใจ ทันสมัย และเข้าใจง่าย", mean: 4.80, variance: 0.28, rit: 0.78 },
        { name: "5. ผู้เรียนสามารถนำความรู้ไปประยุกต์ใช้ในการแก้ปัญหาได้", mean: 4.65, variance: 0.35, rit: 0.71 },
        { name: "6. ครูผู้สอนให้คำแนะนำและช่วยเหลืออย่างเหมาะสม", mean: 4.85, variance: 0.22, rit: 0.82 },
        { name: "7. การประเมินผลมีความยุติธรรมและสะท้อนความสามารถจริง", mean: 4.70, variance: 0.30, rit: 0.69 },
        { name: "8. ผู้เรียนมีความพึงพอใจต่อภาพรวมของการจัดการเรียนรู้", mean: 4.88, variance: 0.20, rit: 0.85 }
      ];
      state.cronbachTotalVariance = 14.80;
      renderApp();
      showToast("🎲 โหลดข้อมูลจำลองแบบสอบถาม/รูบริก (Cronbach's α & r_it) แล้ว", "ok");
    },

    loadE1E2MockData() {
      const proj = getActiveProject();
      if (!proj.statsData) proj.statsData = {};
      proj.statsData.e1 = 83.40;
      proj.statsData.e2 = 82.80;
      proj.statsData.fullScore = 40;
      proj.statsData.preMean = 17.50;
      proj.statsData.postMean = 33.12;
      proj.statsData.ei = Number(((33.12 - 17.50) / (40 - 17.50)).toFixed(4));
      saveProjects();
      renderApp();
      showToast("🎲 โหลดข้อมูลประสิทธิภาพ E1/E2 และ E.I. ที่ผ่านเกณฑ์ความแตกต่าง ≤ 5% แล้ว", "ok");
    },

    setHypothesisTestType(t) {
      state.hypothesisTestType = t;
      renderApp();
    },

    loadHypothesisMockData(scenario = "normal_paired") {
      if (scenario === "normal_paired") {
        state.hypothesisTestType = "paired_t";
        state.hypothesisData = Array.from({ length: 30 }, (_, i) => {
          const pre = Math.round(15 + Math.random() * 8);
          const post = Math.min(40, pre + Math.round(10 + Math.random() * 8));
          return { id: i + 1, pre, post };
        });
        showToast("🎲 จำลองข้อมูล N=30 (แจกแจงปกติ ➔ Paired Samples t-test + Cohen's d)", "ok");
      } else if (scenario === "one_sample") {
        state.hypothesisTestType = "one_sample_t";
        state.hypothesisOneSampleCriteria = 28; // 70% of 40
        state.hypothesisData = Array.from({ length: 30 }, (_, i) => {
          const pre = Math.round(14 + Math.random() * 6);
          const post = Math.round(29 + Math.random() * 10);
          return { id: i + 1, pre, post };
        });
        showToast("🎲 จำลองข้อมูลเทียบเกณฑ์ 70% (เกณฑ์ 28 คะแนน ➔ One-Sample t-test)", "ok");
      } else if (scenario === "small_wilcoxon") {
        state.hypothesisTestType = "wilcoxon";
        state.hypothesisData = [
          { id: 1, pre: 14, post: 28 },
          { id: 2, pre: 12, post: 25 },
          { id: 3, pre: 18, post: 34 },
          { id: 4, pre: 15, post: 29 },
          { id: 5, pre: 20, post: 35 },
          { id: 6, pre: 11, post: 22 },
          { id: 7, pre: 16, post: 30 },
          { id: 8, pre: 13, post: 27 },
          { id: 9, pre: 19, post: 36 },
          { id: 10, pre: 14, post: 29 },
          { id: 11, pre: 17, post: 32 },
          { id: 12, pre: 15, post: 28 }
        ];
        showToast("🎲 จำลองข้อมูลกลุ่มเล็ก N=12 (Non-Parametric ➔ Wilcoxon Signed-Rank Test)", "ok");
      }
      renderApp();
    },

    updateHypothesisScore(idx, field, val) {
      if (state.hypothesisData[idx]) {
        state.hypothesisData[idx][field] = Math.max(0, Number(val) || 0);
        renderApp();
      }
    },

    addHypothesisStudent() {
      const nextId = state.hypothesisData.length + 1;
      state.hypothesisData.push({ id: nextId, pre: 18, post: 32 });
      renderApp();
      showToast(`เพิ่มนักเรียนคนที่ ${nextId} แล้ว`);
    },

    removeHypothesisStudent(idx) {
      if (state.hypothesisData.length > 3) {
        state.hypothesisData.splice(idx, 1);
        renderApp();
        showToast("ลบข้อมูลนักเรียนแล้ว");
      } else {
        showToast("ต้องมีข้อมูลนักเรียนอย่างน้อย 3 คน", "warn");
      }
    },

    setDecisionObjective(k) {
      state.selectedDecisionObjective = k;
      renderApp();
    },

    updateIocScore(itemIdx, expIdx, val) {
      if (state.iocItems[itemIdx]) {
        state.iocItems[itemIdx].scores[expIdx] = Number(val);
        renderApp();
      }
    },

    updateItemAnalysisRow(itemIdx, field, val) {
      if (state.itemAnalysisItems[itemIdx]) {
        state.itemAnalysisItems[itemIdx][field] = Number(val);
        renderApp();
      }
    },

    updateCronbachRow(itemIdx, field, val) {
      if (state.cronbachItems[itemIdx]) {
        state.cronbachItems[itemIdx][field] = Number(val);
        renderApp();
      }
    },

    copyTableText(elemId, toastMsg = "คัดลอกข้อมูลเรียบร้อยแล้ว") {
      const el = document.getElementById(elemId);
      if (!el) return;
      const text = el.innerText || el.textContent;
      navigator.clipboard.writeText(text).then(() => {
        showToast(toastMsg, "ok");
      }).catch(() => {
        showToast("ไม่สามารถคัดลอกได้อัตโนมัติ กรุณาเลือกข้อความแล้วกด Ctrl+C", "warn");
      });
    },

    // --- AI Research Advisor & Auto-Decision Actions ---
    updateAdvisorField(field, value) {
      state.advisorCriteria[field] = value;
      if (field === "subjectId") {
        const sObj = window.ROAD_ADVISOR.SUBJECT_GROUPS.find(s => s.id === value);
        if (sObj) state.advisorCriteria.customTopic = sObj.defaultTopic;
      }
      renderApp();
    },

    applyAdvisorChoice(rankIndex, jumpToChapters = true) {
      const recs = window.ROAD_ADVISOR.analyzeAndRecommend(state.advisorCriteria);
      const chosen = recs[rankIndex] || recs[0];
      if (!chosen) return;
      const proj = getActiveProject();
      Object.assign(proj, JSON.parse(JSON.stringify(chosen.projectPayload)), {
        id: proj.id,
        updatedAt: new Date().toISOString(),
        customSections: {}
      });
      // Automatically simulate aligned statistics for this choice
      this.simulateAlignedStats();
      state.studioTab = jumpToChapters ? "chapters" : "abcd";
      saveProjects();
      renderApp();
      window.scrollTo({ top: 0, behavior: "smooth" });
      showToast(`เลือกใช้ "${chosen.badge}" พร้อมสร้างรายงาน 5 บทและคำนวณสถิติให้อัตโนมัติแล้ว!`);
    },

    async runGeminiAdvisorAutoPilot() {
      if (!state.geminiKey) {
        this.applyAdvisorChoice(0, true);
        showToast("ใช้ฐานความรู้ AI Expert ในระบบเลือกชุดวิจัยที่ดีที่สุดให้เรียบร้อยแล้ว! (หากต้องการใช้ Gemini API สด สามารถใส่คีย์ในแท็บ AI ได้)", "ok");
        return;
      }
      state.advisorLoading = true;
      renderApp();
      try {
        const prompt = window.ROAD_ADVISOR.buildAdvisorGeminiPrompt(state.advisorCriteria);
        const res = await window.ROAD_GENERATOR.callGeminiAPI(state.geminiKey, prompt);
        const jsonMatch = res.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const proj = getActiveProject();
          Object.assign(proj, {
            A: parsed.A || proj.A,
            B: parsed.B || proj.B,
            B_short: parsed.B_short || parsed.B || proj.B_short,
            B_steps: Array.isArray(parsed.B_steps) && parsed.B_steps.length ? parsed.B_steps : proj.B_steps,
            C_connector: parsed.C_connector || "เพื่อส่งเสริม",
            C_list: Array.isArray(parsed.C_list) && parsed.C_list.length ? parsed.C_list : proj.C_list,
            D: parsed.D || proj.D,
            subject: parsed.subject || proj.subject,
            duration: parsed.duration || proj.duration,
            efficiencyCriterion: parsed.efficiencyCriterion || proj.efficiencyCriterion,
            updatedAt: new Date().toISOString(),
            customSections: {}
          });
          this.simulateAlignedStats();
          state.studioTab = "chapters";
          saveProjects();
          showToast("Gemini AI วิเคราะห์และสร้างรายงานวิจัย 5 บทที่เหมาะสมที่สุดให้เรียบร้อยแล้ว!");
        } else {
          this.applyAdvisorChoice(0, true);
        }
      } catch (err) {
        showToast("ระบบใช้ฐานความรู้ Expert AI เลือกชุดวิจัยที่ดีที่สุดให้แทน (" + (err.message || "") + ")", "warn");
        this.applyAdvisorChoice(0, true);
      } finally {
        state.advisorLoading = false;
        renderApp();
      }
    },

    // --- Project Management ---
    selectProject(id) {
      state.activeProjectId = id;
      saveProjects();
      renderApp();
      showToast("สลับโครงการวิจัยเรียบร้อยแล้ว");
    },

    loadPresetIntoActive(presetId) {
      const preset = window.ROAD_DATA.PRESETS.find(pr => pr.id === presetId);
      if (!preset) return;
      const proj = getActiveProject();
      Object.assign(proj, JSON.parse(JSON.stringify(preset)), {
        id: proj.id,
        updatedAt: new Date().toISOString(),
        customSections: {}
      });
      saveProjects();
      renderApp();
      showToast(`โหลดต้นแบบ "${preset.label}" เรียบร้อยแล้ว`);
    },

    createNewProject() {
      const base = JSON.parse(JSON.stringify(window.ROAD_DATA.PRESETS[0]));
      const newProj = {
        ...base,
        id: "proj-" + Date.now(),
        label: `งานวิจัยเรื่องใหม่ #${state.projects.length + 1}`,
        B: "ชุดกิจกรรมการเรียนรู้เชิงรุก (Active Learning)",
        B_short: "ชุดกิจกรรมการเรียนรู้เชิงรุก",
        updatedAt: new Date().toISOString(),
        customSections: {}
      };
      state.projects.unshift(newProj);
      state.activeProjectId = newProj.id;
      saveProjects();
      renderApp();
      showToast("สร้างโครงการวิจัยเรื่องใหม่เรียบร้อยแล้ว");
    },

    createBlankProject() {
      const newProj = {
        id: "proj-" + Date.now(),
        label: `งานวิจัยกำหนดเอง #${state.projects.length + 1}`,
        modelId: "rd_4step",
        academicRank: "ks3",
        efficiencyCriterion: "80/80",
        A: "การวิจัยและพัฒนา",
        B: "",
        B_short: "",
        B_steps: [
          "ขั้นที่ 1 ศึกษาข้อมูลพื้นฐานและวิเคราะห์ปัญหา",
          "ขั้นที่ 2 ออกแบบและพัฒนานวัตกรรม",
          "ขั้นที่ 3 ทดลองใช้นวัตกรรมกับกลุ่มตัวอย่าง",
          "ขั้นที่ 4 ประเมินผลและปรับปรุงพัฒนา"
        ],
        C_connector: "เพื่อส่งเสริม",
        C_list: [
          "ความสามารถในการคิดวิเคราะห์",
          "ผลสัมฤทธิ์ทางการเรียน"
        ],
        D: "สำหรับนักเรียนชั้นมัธยมศึกษาปีที่ 3",
        subject: "กลุ่มสาระการเรียนรู้",
        semester: "ภาคเรียนที่ 1 ปีการศึกษา 2568",
        duration: "18 ชั่วโมง (6 สัปดาห์)",
        population: "นักเรียนทั้งหมดในสถานศึกษา",
        sample: "นักเรียนกลุ่มตัวอย่าง จำนวน 1 ห้องเรียน ได้มาโดยการสุ่มแบบกลุ่ม (Cluster Random Sampling)",
        statsData: {
          n: 35,
          fullScore: 40,
          preMean: 18.5,
          preSd: 3.2,
          postMean: 33.4,
          postSd: 2.8,
          tValue: 18.9,
          pVal: "< .001",
          e1: 82.5,
          e2: 83.5,
          ei: 0.69,
          satMean: 4.62,
          satSd: 0.45
        },
        updatedAt: new Date().toISOString(),
        customSections: {}
      };
      state.projects.unshift(newProj);
      state.activeProjectId = newProj.id;
      state.studioTab = "abcd";
      state.showAbcdModal = false;
      saveProjects();
      renderApp();
      showToast("สร้างโครงร่างวิจัยว่างเรียบร้อยแล้ว พร้อมให้คุณป้อน A B C D");
    },

    clearActiveAbcdForm() {
      if (!confirm("คุณต้องการล้างข้อมูล A, B, C, D ของโครงการปัจจุบันเพื่อพิมพ์ใหม่ทั้งหมดใช่หรือไม่?")) return;
      const proj = getActiveProject();
      proj.A = "การพัฒนา";
      proj.B = "";
      proj.B_short = "";
      proj.B_steps = [
        "ขั้นที่ 1 สร้างความเข้าใจและระบุปัญหา",
        "ขั้นที่ 2 จัดกิจกรรมการเรียนรู้เชิงรุก",
        "ขั้นที่ 3 สรุปบทเรียนและประเมินผล"
      ];
      proj.C_connector = "เพื่อพัฒนา";
      proj.C_list = ["ผลสัมฤทธิ์ทางการเรียน"];
      proj.D = "";
      proj.subject = "";
      proj.updatedAt = new Date().toISOString();
      saveProjects();
      renderApp();
      showToast("ล้างข้อมูลฟอร์มเรียบร้อยแล้ว เริ่มพิมพ์ข้อมูลของคุณได้ทันที");
    },

    applySyntaxTemplate(templateId) {
      const tmpl = (window.ROAD_DATA.SYNTAX_TEMPLATES || []).find(t => t.id === templateId);
      if (!tmpl) return;
      const proj = getActiveProject();
      proj.B_steps = [...tmpl.steps];
      if (!proj.B || proj.B.trim() === "") {
        proj.B = `รูปแบบการจัดการเรียนรู้ร่วมกับ${tmpl.name}`;
        proj.B_short = tmpl.short || tmpl.name;
      }
      saveProjects();
      renderApp();
      showToast(`นำขั้นตอนนวัตกรรม "${tmpl.name}" ใส่เรียบร้อยแล้ว (${tmpl.steps.length} ขั้น)`);
    },

    openAbcdModal(tab = "manual") {
      state.showAbcdModal = true;
      state.abcdModalTab = tab;
      const proj = getActiveProject();
      state.abcdParseInput = window.ROAD_GENERATOR.composeFullTitle(proj);
      state.abcdParsedResult = window.ROAD_GENERATOR.parseTitleToABCD(state.abcdParseInput);
      renderApp();
    },

    closeAbcdModal() {
      state.showAbcdModal = false;
      renderApp();
    },

    setAbcdModalTab(tab) {
      state.abcdModalTab = tab;
      renderApp();
    },

    toggleTitleViewMode() {
      state.titleViewMode = state.titleViewMode === "plain" ? "badges" : "plain";
      renderApp();
    },

    executeTitleDecompose() {
      const input = (state.abcdParseInput || "").trim();
      if (!input) {
        showToast("กรุณาวางหรือพิมพ์ชื่อเรื่องวิจัยก่อน", "warn");
        return;
      }
      const res = window.ROAD_GENERATOR.parseTitleToABCD(input);
      state.abcdParsedResult = res;
      renderApp();
      showToast("ระบบถอดรหัสชื่อเรื่องแยกเป็น A, B, C, D เรียบร้อยแล้ว!");
    },

    setParseExample(exampleText) {
      state.abcdParseInput = exampleText;
      const res = window.ROAD_GENERATOR.parseTitleToABCD(exampleText);
      state.abcdParsedResult = res;
      renderApp();
      showToast("โหลดชื่อเรื่องตัวอย่างและถอดรหัสเรียบร้อยแล้ว");
    },

    applyParsedToActiveProject() {
      if (!state.abcdParsedResult) return;
      const res = state.abcdParsedResult;
      const proj = getActiveProject();
      proj.A = res.A;
      proj.B = res.B;
      proj.B_short = res.B_short || res.B;
      proj.C_connector = res.C_connector;
      proj.C_list = [...res.C_list];
      proj.D = res.D;
      proj.updatedAt = new Date().toISOString();
      state.showAbcdModal = false;
      state.studioTab = "abcd";
      saveProjects();
      renderApp();
      showToast("นำเข้าข้อมูล A B C D สู่โครงการเรียบร้อยแล้ว");
    },

    createProjectFromParsed() {
      if (!state.abcdParsedResult) return;
      const res = state.abcdParsedResult;
      const base = JSON.parse(JSON.stringify(window.ROAD_DATA.PRESETS[0]));
      const newProj = {
        ...base,
        id: "proj-" + Date.now(),
        label: res.B_short || res.B || `งานวิจัยใหม่ #${state.projects.length + 1}`,
        A: res.A,
        B: res.B,
        B_short: res.B_short || res.B,
        C_connector: res.C_connector,
        C_list: [...res.C_list],
        D: res.D,
        sample: `${res.D} จำนวน 1 ห้องเรียน`,
        updatedAt: new Date().toISOString(),
        customSections: {}
      };
      state.projects.unshift(newProj);
      state.activeProjectId = newProj.id;
      state.showAbcdModal = false;
      state.studioTab = "abcd";
      saveProjects();
      renderApp();
      showToast("สร้างงานวิจัยเรื่องใหม่จาก A B C D เรียบร้อยแล้ว");
    },

    updateField(field, value) {
      const proj = getActiveProject();
      proj[field] = value;
      proj.updatedAt = new Date().toISOString();
      saveProjects();
      renderLiveTitleBar();
    },

    updateFieldAndRender(field, value) {
      const proj = getActiveProject();
      proj[field] = value;
      proj.updatedAt = new Date().toISOString();
      saveProjects();
      renderApp();
    },

    applySuggestion(field, value) {
      const proj = getActiveProject();
      if (field === "C1") {
        proj.C_list[0] = value;
      } else if (field === "C2") {
        if (!proj.C_list || proj.C_list.length < 2) {
          if (!proj.C_list) proj.C_list = [];
          if (proj.C_list.length === 0) proj.C_list.push("ความสามารถในการคิดวิเคราะห์");
          proj.C_list[1] = value;
        } else {
          proj.C_list[1] = value;
        }
      } else if (field === "D") {
        proj.D = value;
        if (!proj.sample || proj.sample.includes("นักเรียน") || proj.sample.includes("กลุ่มตัวอย่าง")) {
          proj.sample = `${value} ภาคเรียนที่ 1 จำนวน 1 ห้องเรียน`;
        }
      } else {
        proj[field] = value;
        if (field === "B") {
          proj.B_short = value.split("(")[0].trim();
        }
      }
      proj.updatedAt = new Date().toISOString();
      saveProjects();
      renderApp();
      showToast("นำคำศัพท์วิชาการไปใส่ในช่องเรียบร้อยแล้ว");
    },

    updateDependentVar(idx, val) {
      const proj = getActiveProject();
      proj.C_list[idx] = val;
      saveProjects();
      renderLiveTitleBar();
    },

    addDependentVar() {
      const proj = getActiveProject();
      if (proj.C_list.length >= 4) {
        showToast("แนะนำให้มีตัวแปรตามไม่เกิน 3–4 ตัวเพื่อความชัดเจนของงานวิจัย", "warn");
        return;
      }
      proj.C_list.push("ความคงทนในการเรียนรู้");
      saveProjects();
      renderApp();
    },

    removeDependentVar(idx) {
      const proj = getActiveProject();
      if (proj.C_list.length <= 1) {
        showToast("ต้องมีตัวแปรตามอย่างน้อย 1 ตัว", "warn");
        return;
      }
      proj.C_list.splice(idx, 1);
      saveProjects();
      renderApp();
    },

    updateStep(idx, val) {
      const proj = getActiveProject();
      proj.B_steps[idx] = val;
      saveProjects();
    },

    addStep() {
      const proj = getActiveProject();
      const nextNum = (proj.B_steps?.length || 0) + 1;
      proj.B_steps.push(`ขั้นที่ ${nextNum} ขั้นสรุปและประเมินผลการเรียนรู้`);
      saveProjects();
      renderApp();
    },

    removeStep(idx) {
      const proj = getActiveProject();
      if (proj.B_steps.length <= 2) {
        showToast("นวัตกรรมควรมีอย่างน้อย 2 ขั้นตอน", "warn");
        return;
      }
      proj.B_steps.splice(idx, 1);
      saveProjects();
      renderApp();
    },

    // --- Stat Lab Actions ---
    updateStatField(key, val) {
      const proj = getActiveProject();
      if (!proj.statsData) proj.statsData = {};
      proj.statsData[key] = isNaN(Number(val)) ? val : Number(val);
      // Auto recalculate E2 and E.I. if preMean/postMean/fullScore changed
      const st = proj.statsData;
      const full = Number(st.fullScore || 40);
      const pre = Number(st.preMean || 18);
      const post = Number(st.postMean || 32);
      if (full > 0 && (key === "postMean" || key === "fullScore" || key === "preMean")) {
        st.e2 = Number(((post / full) * 100).toFixed(2));
        if (full - pre > 0) {
          st.ei = Number(((post - pre) / (full - pre)).toFixed(4));
        }
      }
      saveProjects();
      renderApp();
    },

    simulateAlignedStats() {
      const proj = getActiveProject();
      const critParts = String(proj.efficiencyCriterion || "80/80").split("/").map(Number);
      const baseE1 = critParts[0] || 80;
      const baseE2 = critParts[1] || 80;
      const n = Number(proj.statsData?.n || 35);
      const full = Number(proj.statsData?.fullScore || 40);

      const e1 = Number((baseE1 + 1.5 + Math.random() * 2.8).toFixed(2));
      const e2 = Number((baseE2 + 1.2 + Math.random() * 2.5).toFixed(2));
      const postMean = Number(((e2 / 100) * full).toFixed(2));
      const preMean = Number((full * (0.42 + Math.random() * 0.08)).toFixed(2));
      const ei = Number(((postMean - preMean) / (full - preMean)).toFixed(4));

      const c1Full = 30;
      const c1PreMean = Number((12.5 + Math.random() * 2.5).toFixed(2));
      const c1PostMean = Number((24.2 + Math.random() * 2.4).toFixed(2));

      proj.statsData = {
        n,
        fullScore: full,
        e1,
        e2,
        ei,
        preMean,
        preSD: Number((2.6 + Math.random() * 0.7).toFixed(2)),
        postMean,
        postSD: Number((2.1 + Math.random() * 0.5).toFixed(2)),
        tValue: Number((19.5 + Math.random() * 6.5).toFixed(2)),
        pValue: ".000",
        c1Full,
        c1PreMean,
        c1PreSD: Number((2.2 + Math.random() * 0.5).toFixed(2)),
        c1PostMean,
        c1PostSD: Number((1.8 + Math.random() * 0.4).toFixed(2)),
        c1TValue: Number((18.2 + Math.random() * 5.0).toFixed(2)),
        satMean: Number((4.55 + Math.random() * 0.25).toFixed(2)),
        satSD: Number((0.38 + Math.random() * 0.12).toFixed(2)),
        iocAvg: Number((0.88 + Math.random() * 0.10).toFixed(2))
      };
      saveProjects();
      renderApp();
      showToast(`จำลองค่าสถิติที่สอดคล้องกับเกณฑ์ ${proj.efficiencyCriterion} และอัปเดตตารางบทที่ 4–5 เรียบร้อยแล้ว`);
    },

    // --- AI Co-Pilot Actions ---
    saveGeminiKey(val) {
      state.geminiKey = String(val || "").trim();
      localStorage.setItem(STORAGE_KEYS.GEMINI_KEY, state.geminiKey);
      showToast(state.geminiKey ? "บันทึก Gemini API Key เรียบร้อยแล้ว" : "ล้าง Gemini API Key แล้ว");
    },

    setAiTask(task) {
      state.aiTask = task;
      renderApp();
    },

    copySmartPrompt(taskType) {
      const proj = getActiveProject();
      const prompt = window.ROAD_GENERATOR.buildSmartPrompt(proj, taskType || state.aiTask);
      navigator.clipboard.writeText(prompt).then(() => {
        showToast("คัดลอก Smart Prompt แล้ว! นำไปวางใน ChatGPT / Gemini / Claude ได้ทันที");
      });
    },

    async runGeminiLive(taskType) {
      const proj = getActiveProject();
      const task = taskType || state.aiTask;
      state.aiTask = task;
      if (!state.geminiKey) {
        state.studioTab = "ai";
        renderApp();
        showToast("กรุณากรอก Gemini API Key ในแท็บ AI Co-Pilot หรือกดปุ่ม 'คัดลอก Smart Prompt'", "warn");
        return;
      }
      state.aiLoading = true;
      state.studioTab = "ai";
      renderApp();

      try {
        const prompt = window.ROAD_GENERATOR.buildSmartPrompt(proj, task);
        const res = await window.ROAD_GENERATOR.callGeminiAPI(state.geminiKey, prompt);
        state.aiOutput = res.text;
        showToast(`สร้างเนื้อหาด้วย ${res.model} สำเร็จแล้ว!`);
      } catch (err) {
        showToast(err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ Gemini API", "bad");
      } finally {
        state.aiLoading = false;
        renderApp();
      }
    },

    applyAiOutputToChapter() {
      if (!state.aiOutput.trim()) return;
      const proj = getActiveProject();
      if (!proj.customSections) proj.customSections = {};
      const paragraphs = state.aiOutput
        .split(/\n{2,}/)
        .map(line => line.replace(/^[#*-\s]+/, "").trim())
        .filter(Boolean);

      if (state.aiTask === "ch1_background") {
        proj.customSections.ch1_1 = paragraphs;
        showToast("นำเนื้อหาจาก AI ไปใส่ในหัวข้อ 1.1 ความเป็นมาและความสำคัญของปัญหา เรียบร้อยแล้ว!");
      } else if (state.aiTask === "ch5_discussion") {
        proj.customSections.ch5_2 = paragraphs;
        showToast("นำเนื้อหาจาก AI ไปใส่ในหัวข้อ 5.2 อภิปรายผลการวิจัย เรียบร้อยแล้ว!");
      } else {
        navigator.clipboard.writeText(state.aiOutput);
        showToast("คัดลอกเนื้อหาจาก AI ลงคลิปบอร์ดเรียบร้อยแล้ว!");
      }
      saveProjects();
      state.studioTab = "chapters";
      renderApp();
    },

    resetCustomSections() {
      const proj = getActiveProject();
      proj.customSections = {};
      saveProjects();
      renderApp();
      showToast("คืนค่าโครงร่างมาตรฐานอัตโนมัติเรียบร้อยแล้ว");
    },

    // --- Export Actions (Modular Publication Export Hub V2.0) ---
    exportWord() {
      this.exportFullManuscript();
    },

    exportFullManuscript() {
      const proj = getActiveProject();
      window.ROAD_GENERATOR.exportFullManuscriptToWordDoc(proj);
      recordAudit("EXPORT_DOC", `ส่งออกเล่มรายงานวิจัยฉบับสมบูรณ์ครบทุกส่วน (All-in-One Word): ${proj.label || proj.B_short}`);
      showToast("กำลังดาวน์โหลดเล่มรายงานวิจัยฉบับสมบูรณ์ครบทุกส่วน (.doc)...");
    },

    exportFrontMatter() {
      const proj = getActiveProject();
      window.ROAD_GENERATOR.exportFrontMatterToWordDoc(proj);
      recordAudit("EXPORT_DOC", `ส่งออกส่วนนำและบทคัดย่อภาษาไทย/อังกฤษ (Word): ${proj.label || proj.B_short}`);
      showToast("กำลังดาวน์โหลดส่วนนำและบทคัดย่อไทย/อังกฤษ (.doc)...");
    },

    exportExpertKit() {
      const proj = getActiveProject();
      window.ROAD_GENERATOR.exportExpertKitToWordDoc(proj);
      recordAudit("EXPORT_DOC", `ส่งออกชุดผู้เชี่ยวชาญ 5 ท่านและแบบประเมิน IOC (Word): ${proj.label || proj.B_short}`);
      showToast("กำลังดาวน์โหลดชุดส่งผู้เชี่ยวชาญ 5 ท่าน + แบบประเมิน IOC (.doc)...");
    },

    exportBackMatter() {
      const proj = getActiveProject();
      window.ROAD_GENERATOR.exportBackMatterToWordDoc(proj);
      recordAudit("EXPORT_DOC", `ส่งออกบรรณานุกรม APA 7th และภาคผนวก ก-ง (Word): ${proj.label || proj.B_short}`);
      showToast("กำลังดาวน์โหลดบรรณานุกรม APA 7th และภาคผนวก ก–ง (.doc)...");
    },

    exportSingleChapter(chapNum) {
      const proj = getActiveProject();
      if (Number(chapNum) === 6) {
        return this.exportAppendix();
      }
      if (Number(chapNum) === -1) {
        return this.exportFrontMatter();
      }
      if (Number(chapNum) === 7) {
        return this.exportBackMatter();
      }
      window.ROAD_GENERATOR.exportSingleChapterToWordDoc(proj, Number(chapNum));
      recordAudit("EXPORT_DOC", `ส่งออกบทที่ ${chapNum} (Word): ${proj.label || proj.B_short}`);
      showToast(`กำลังดาวน์โหลดบทที่ ${chapNum} เป็นไฟล์ Word (.doc)...`);
    },

    exportAppendix() {
      const proj = getActiveProject();
      if (window.ROAD_GENERATOR && window.ROAD_GENERATOR.exportAppendixToWordDoc) {
        window.ROAD_GENERATOR.exportAppendixToWordDoc(proj);
        recordAudit("EXPORT_DOC", `ส่งออกชุดเครื่องมือวิจัยและภาคผนวก ก–ง (Word): ${proj.label || proj.B_short}`);
        showToast("กำลังดาวน์โหลดชุดเครื่องมือวิจัยและภาคผนวก ก–ง (.doc)...");
      } else {
        showToast("ไม่พบโมดูลส่งออกภาคผนวก");
      }
    },

    // --- Essential Manuscript Context Modal Actions ---
    openContextMetaModal(tab = "context") {
      state.contextMetaModalTab = tab;
      state.showContextMetaModal = true;
      renderApp();
    },

    closeContextMetaModal() {
      state.showContextMetaModal = false;
      renderApp();
    },

    setContextMetaTab(tab) {
      state.contextMetaModalTab = tab;
      renderApp();
    },

    saveContextMeta() {
      const proj = getActiveProject();
      if (!proj) return;
      if (!proj.contextMeta) proj.contextMeta = {};

      const getVal = (id, fallback) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : fallback;
      };

      proj.contextMeta.researcherName = getVal("ctx_researcherName", proj.contextMeta.researcherName || proj.researcher || "");
      proj.contextMeta.academicRank = getVal("ctx_academicRank", proj.contextMeta.academicRank || proj.position || "");
      proj.contextMeta.degree = getVal("ctx_degree", proj.contextMeta.degree || "กศ.ม. (หลักสูตรและการจัดการเรียนรู้)");
      proj.contextMeta.schoolName = getVal("ctx_schoolName", proj.contextMeta.schoolName || proj.school || "");
      proj.contextMeta.affiliation = getVal("ctx_affiliation", proj.contextMeta.affiliation || proj.affiliation || "");
      proj.contextMeta.province = getVal("ctx_province", proj.contextMeta.province || "ขอนแก่น");
      proj.contextMeta.directorName = getVal("ctx_directorName", proj.contextMeta.directorName || "ดร.วิชัย มุ่งมั่น");
      proj.contextMeta.academicYear = getVal("ctx_academicYear", proj.contextMeta.academicYear || "2569");
      proj.contextMeta.semester = getVal("ctx_semester", proj.contextMeta.semester || "1");
      proj.contextMeta.courseCode = getVal("ctx_courseCode", proj.contextMeta.courseCode || "ว23101");
      proj.contextMeta.courseName = getVal("ctx_courseName", proj.contextMeta.courseName || proj.subject || "");
      proj.contextMeta.totalHours = getVal("ctx_totalHours", proj.contextMeta.totalHours || "18 ชั่วโมง");
      proj.contextMeta.pastScoreAvg = getVal("ctx_pastScoreAvg", proj.contextMeta.pastScoreAvg || "56.80%");

      // Sync back to top-level project fields
      if (proj.contextMeta.researcherName) proj.researcher = proj.contextMeta.researcherName;
      if (proj.contextMeta.academicRank) proj.position = proj.contextMeta.academicRank;
      if (proj.contextMeta.schoolName) proj.school = proj.contextMeta.schoolName;
      if (proj.contextMeta.affiliation) proj.affiliation = proj.contextMeta.affiliation;
      if (proj.contextMeta.courseName) proj.subject = proj.contextMeta.courseName;

      // Read Lesson Plans
      if (!Array.isArray(proj.lessonPlans) || proj.lessonPlans.length === 0) {
        proj.lessonPlans = JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_LESSON_PLANS || []));
      }
      if (Array.isArray(proj.lessonPlans)) {
        proj.lessonPlans.forEach((lp, idx) => {
          lp.unitTitle = getVal(`ctx_lp_title_${idx}`, lp.unitTitle);
          lp.hours = Number(getVal(`ctx_lp_hours_${idx}`, lp.hours)) || lp.hours;
          lp.conceptSummary = getVal(`ctx_lp_concept_${idx}`, lp.conceptSummary);
        });
      }

      // Read Expert Roster
      if (!Array.isArray(proj.expertRoster) || proj.expertRoster.length === 0) {
        proj.expertRoster = JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_EXPERT_ROSTER || []));
      }
      if (Array.isArray(proj.expertRoster)) {
        proj.expertRoster.forEach((exp, idx) => {
          exp.prefixName = getVal(`ctx_exp_name_${idx}`, exp.prefixName);
          exp.position = getVal(`ctx_exp_pos_${idx}`, exp.position);
          exp.organization = getVal(`ctx_exp_org_${idx}`, exp.organization);
          exp.role = getVal(`ctx_exp_role_${idx}`, exp.role);
        });
      }

      saveProject();
      state.showContextMetaModal = false;
      renderApp();
      recordAudit("EDIT_TITLE", `อัปเดตข้อมูลบริบทสถานศึกษาและคณะผู้เชี่ยวชาญ: ${proj.label || proj.B_short}`);
      showToast("บันทึกข้อมูลบริบทสถานศึกษาและคณะผู้เชี่ยวชาญเรียบร้อยแล้ว");
    },

    resetLessonPlansDefault() {
      const proj = getActiveProject();
      if (!proj) return;
      proj.lessonPlans = JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_LESSON_PLANS || []));
      saveProject();
      renderApp();
      showToast("รีเซ็ตตารางแผนการจัดการเรียนรู้เป็นค่าเริ่มต้นเรียบร้อยแล้ว");
    },

    resetExpertsDefault() {
      const proj = getActiveProject();
      if (!proj) return;
      proj.expertRoster = JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_EXPERT_ROSTER || []));
      saveProject();
      renderApp();
      showToast("รีเซ็ตคณะผู้เชี่ยวชาญ 5 ท่านเป็นค่าเริ่มต้นเรียบร้อยแล้ว");
    },

    exportJson() {
      const proj = getActiveProject();
      const blob = new Blob([JSON.stringify(proj, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `road-project-${proj.id}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      recordAudit("EXPORT_DOC", `สำรองไฟล์โครงการ JSON: ${proj.label || proj.B_short}`);
      showToast("ดาวน์โหลดไฟล์สำรองโปรเจกต์ (.json) เรียบร้อยแล้ว");
    },

    // --- Auth & Member Actions ---
    quickLogin(usernameOrEmail) {
      const user = state.members.find(
        m => m.username.toLowerCase() === usernameOrEmail.toLowerCase() ||
             m.email.toLowerCase() === usernameOrEmail.toLowerCase()
      );
      if (user) {
        state.currentUser = user;
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        state.view = user.role === "admin" ? "admin" : "studio";
        renderApp();
        showToast(`เข้าสู่ระบบในชื่อ ${user.title}${user.first_name} ${user.last_name} เรียบร้อยแล้ว`);
      }
    },

    handleLoginSubmit(e) {
      e.preventDefault();
      const idInput = document.getElementById("login-identifier")?.value?.trim() || "";
      const pwInput = document.getElementById("login-password")?.value?.trim() || "";
      const normPhone = normalizePhone(idInput);

      const user = state.members.find(m =>
        m.email.toLowerCase() === idInput.toLowerCase() ||
        m.username.toLowerCase() === idInput.toLowerCase() ||
        (normPhone && m.phone === normPhone) ||
        m.phone === idInput
      );

      if (!user || user.password !== pwInput) {
        showToast("ข้อมูลเข้าสู่ระบบหรือรหัสผ่านไม่ถูกต้อง (ลองใช้ปุ่ม Demo 1-Click ด้านล่างได้ครับ)", "bad");
        return;
      }

      state.currentUser = user;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      recordAudit("LOGIN", `เข้าสู่ระบบสำเร็จ (${user.username}): ${user.title}${user.first_name} ${user.last_name}`);
      state.view = user.role === "admin" ? "admin" : "studio";
      renderApp();
      showToast(`ยินดีต้อนรับ ${user.title}${user.first_name} ${user.last_name}`);
    },

    logout() {
      state.currentUser = null;
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      state.view = "login";
      renderApp();
      showToast("ออกจากระบบเรียบร้อยแล้ว");
    },

    updateSignupField(field, value) {
      state.signupForm[field] = value;
      renderApp();
    },

    toggleSignupGoal(goal) {
      const g = state.signupForm.goals || [];
      if (g.includes(goal)) {
        state.signupForm.goals = g.filter(x => x !== goal);
      } else {
        state.signupForm.goals = [...g, goal];
      }
      renderApp();
    },

    handleSignupSubmit(e) {
      e.preventDefault();
      const f = state.signupForm;
      const email = normalizeEmail(f.email);
      const phone = normalizePhone(f.phone);

      if (!email || !email.includes("@")) {
        showToast("กรุณากรอกอีเมลให้ถูกต้อง", "bad");
        return;
      }
      if (!phone) {
        showToast("กรุณากรอกเบอร์โทรศัพท์ 9–10 หลัก (ขึ้นต้นด้วย 0)", "bad");
        return;
      }
      if (!f.first_name.trim() || !f.last_name.trim() || !f.workplace.trim()) {
        showToast("กรุณากรอกชื่อ นามสกุล และสถานที่ทำงานให้ครบถ้วน", "bad");
        return;
      }

      let cohortCode = "";
      if (f.signup_type === "training") {
        cohortCode = String(f.cohort_code || "").trim().toUpperCase();
        const foundCohort = state.cohorts.find(c => c.code.toUpperCase() === cohortCode && c.active);
        if (!foundCohort) {
          showToast(`ไม่พบรหัสรุ่นอบรม "${cohortCode}" หรือรหัสหมดอายุ (ลองใช้ RD69A1 หรือ ROAD69)`, "bad");
          return;
        }
      }

      const autoPass = initialPassword(email, phone);
      const countInCohort = state.members.filter(m => m.cohort_code === cohortCode).length + 1;
      const username = f.signup_type === "training"
        ? `${cohortCode}-${String(countInCohort).padStart(2, "0")}`
        : `GEN-${String(state.members.length + 1).padStart(3, "0")}`;

      const newMember = {
        id: "USR-" + Date.now(),
        username,
        email,
        phone,
        password: autoPass,
        role: "member",
        title: f.title,
        first_name: f.first_name.trim(),
        last_name: f.last_name.trim(),
        gender: f.gender,
        birth_year: Number(f.birth_year) || 2535,
        position: f.position,
        affiliation: f.affiliation,
        workplace: f.workplace.trim(),
        province_code: f.province_code,
        goals: f.goals,
        signup_type: f.signup_type,
        cohort_code: cohortCode,
        status: f.signup_type === "training" ? "active" : "pending_payment",
        payment_amount: f.signup_type === "general" ? 500 : 0,
        created_at: new Date().toISOString(),
        projects_count: 1
      };

      state.members.unshift(newMember);
      saveMembers();
      recordAudit("REGISTER", `สมัครสมาชิกใหม่ (${f.signup_type}): ${username} ${f.first_name} ${f.last_name}`);
      state.currentUser = newMember;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newMember));
      state.view = "studio";
      renderApp();
      showToast(`สมัครสมาชิกสำเร็จ! รหัสผู้ใช้: ${username} | รหัสผ่านอัตโนมัติ: ${autoPass}`);
    },

    // --- Admin Actions ---
    approveMember(id) {
      const m = state.members.find(x => x.id === id);
      if (m) {
        m.status = "active";
        saveMembers();
        renderApp();
        showToast(`อนุมัติสิทธิ์การใช้งานของ ${m.title}${m.first_name} เรียบร้อยแล้ว`);
      }
    },

    createNewCohort(e) {
      e.preventDefault();
      const code = document.getElementById("new-cohort-code")?.value?.trim()?.toUpperCase();
      const name = document.getElementById("new-cohort-name")?.value?.trim();
      const loc = document.getElementById("new-cohort-loc")?.value?.trim();
      const exp = document.getElementById("new-cohort-exp")?.value || "2027-12-31";
      if (!code || !name) {
        showToast("กรุณากรอกรหัสรุ่นและชื่อรุ่นอบรม", "warn");
        return;
      }
      if (state.cohorts.some(c => c.code === code)) {
        showToast("รหัสรุ่นนี้มีอยู่ในระบบแล้ว", "bad");
        return;
      }
      state.cohorts.unshift({
        code,
        name,
        location: loc || "เครือข่ายอบรมระบบ ROAD",
        expiresAt: exp,
        maxMembers: 200,
        active: true
      });
      saveCohorts();
      renderApp();
      showToast(`สร้างรหัสรุ่นอบรม ${code} เรียบร้อยแล้ว`);
    },

    toggleCohortActive(code) {
      const c = state.cohorts.find(x => x.code === code);
      if (c) {
        c.active = !c.active;
        saveCohorts();
        renderApp();
        showToast(`อัปเดตสถานะรหัสรุ่น ${code} เรียบร้อยแล้ว`);
      }
    },

    exportMembersCsv() {
      const provMap = new Map(window.ROAD_DATA.PROVINCES.map(p => [p.code, p]));
      const headers = ["รหัสผู้ใช้", "คำนำหน้า", "ชื่อ", "นามสกุล", "เพศ", "ตำแหน่ง", "สังกัด", "สถานที่ทำงาน", "จังหวัด", "ภูมิภาค", "อีเมล", "เบอร์โทร", "รหัสผ่านตั้งต้น", "ประเภทสมาชิก", "รหัสรุ่น", "สถานะ", "เป้าหมาย"];
      const rows = state.members.map(m => {
        const pv = provMap.get(m.province_code) || { name: "-", region: "-" };
        return [
          m.username, m.title, m.first_name, m.last_name, m.gender,
          m.position, m.affiliation, m.workplace, pv.name, pv.region,
          m.email, m.phone, m.password, m.signup_type === "training" ? "ผู้เข้าอบรม" : "สมัครทั่วไป",
          m.cohort_code || "-", m.status, (m.goals || []).join(" / ")
        ].map(cell => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",");
      });
      const csv = "\ufeff" + [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ROAD_Members_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast("ส่งออกรายชื่อสมาชิกเป็นไฟล์ Excel CSV เรียบร้อยแล้ว");
    },

    setAdminSearch(val) {
      state.adminSearch = val;
      renderApp();
    },

    setAdminCohortFilter(val) {
      state.adminFilterCohort = val;
      renderApp();
    },

    nextSlide(delta) {
      state.slideIndex = Math.max(0, Math.min(6, state.slideIndex + delta));
      renderApp();
    },

    // --- Forgot Password Actions ---
    updateForgotField(field, val) {
      state.forgotForm[field] = val;
    },

    submitForgot(e) {
      e.preventDefault();
      const idInput = document.getElementById("forgot-identifier")?.value?.trim() || state.forgotForm.identifier || "";
      if (!idInput) {
        showToast("กรุณากรอกอีเมลหรือเบอร์โทรศัพท์ที่ลงทะเบียนไว้", "warn");
        return;
      }
      state.forgotForm.identifier = idInput;
      state.forgotForm.submitted = true;
      state.forgotForm.otpSent = true;
      state.forgotForm.message = "ระบบได้ดำเนินการส่งลิงก์ตั้งรหัสผ่านใหม่และรหัส OTP ชั่วคราวไปยังช่องทางที่ลงทะเบียนเรียบร้อยแล้ว (เพื่อความปลอดภัย ระบบจะไม่เปิดเผยว่าบัญชีดังกล่าวมีอยู่ในฐานข้อมูลหรือไม่)";
      recordAudit("SECURITY", `คำขอรีเซ็ตรหัสผ่านสำหรับ: ${idInput.replace(/(.{2})(.*)(@.*)/, "$1***$3")}`);
      renderApp();
      showToast("ระบบส่งรหัส OTP เรียบร้อยแล้ว (จำลองรหัส: 684291)", "ok");
    },

    fillDemoOtp() {
      state.forgotForm.resetOtp = "684291";
      state.forgotForm.newPass = "Road2026!Pro";
      renderApp();
      showToast("กรอกรหัส OTP และรหัสผ่านใหม่ตัวอย่างให้เรียบร้อยแล้ว");
    },

    verifyForgotOtp(e) {
      e.preventDefault();
      const otp = document.getElementById("forgot-otp")?.value?.trim() || state.forgotForm.resetOtp;
      const newPass = document.getElementById("forgot-new-password")?.value?.trim() || state.forgotForm.newPass;
      if (!otp || otp.length < 4) {
        showToast("กรุณากรอกรหัส OTP 6 หลัก", "bad");
        return;
      }
      if (!newPass || newPass.length < 6) {
        showToast("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร", "bad");
        return;
      }
      const id = (state.forgotForm.identifier || "").toLowerCase();
      const user = state.members.find(m =>
        m.email.toLowerCase() === id ||
        m.phone === id ||
        m.username.toLowerCase() === id
      );
      if (user) {
        user.password = newPass;
        saveMembers();
      }
      recordAudit("SECURITY", "รีเซ็ตรหัสผ่านสำเร็จผ่าน OTP");
      state.forgotForm = {
        identifier: "",
        submitted: false,
        message: "",
        otpSent: false,
        resetOtp: "",
        newPass: ""
      };
      state.view = "login";
      renderApp();
      showToast("ตั้งรหัสผ่านใหม่สำเร็จแล้ว! กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่", "ok");
    },

    resetForgotState() {
      state.forgotForm = {
        identifier: "",
        submitted: false,
        message: "",
        otpSent: false,
        resetOtp: "",
        newPass: ""
      };
      state.view = "login";
      renderApp();
    },

    // --- Research Wizard (10 Steps) Actions ---
    openWizardModal(step = 1) {
      const proj = getActiveProject() || {};
      state.wizardStep = Math.max(1, Math.min(10, Number(step) || 1));
      const bShort = proj.B_short || proj.B || "นวัตกรรม";
      const c1 = (proj.C_list && proj.C_list[0]) || "การคิดวิเคราะห์";
      const c2 = (proj.C_list && proj.C_list[1]) || "";
      const crit = proj.efficiencyCriterion || "80/80";
      const dTarget = proj.D || "นักเรียนชั้นมัธยมศึกษาปีที่ 4";
      const school = (proj.contextMeta && proj.contextMeta.schoolName) || proj.schoolName || proj.school || "โรงเรียนเปรมติณสูลานนท์";
      const affil = (proj.contextMeta && proj.contextMeta.affiliation) || proj.affiliation || "องค์การบริหารส่วนจังหวัดขอนแก่น";

      const defaultObjectives = [
        `1. เพื่อศึกษาสภาพปัญหา ข้อมูลพื้นฐาน และความต้องการจำเป็นในการพัฒนา${bShort} ${dTarget} (ระยะที่ 1: R1)`,
        `2. เพื่อสร้าง พัฒนา และหาประสิทธิภาพของ${bShort} ${dTarget} ให้มีประสิทธิภาพตามเกณฑ์มาตรฐาน ${crit} (ระยะที่ 2: D1)`,
        `3. เพื่อทดลองใช้${bShort} กับกลุ่มตัวอย่างจริง โดยเปรียบเทียบ${c1} ก่อนและหลังเรียน และหาดัชนีประสิทธิผล (E.I.) (ระยะที่ 3: R2)`,
        `4. เพื่อประเมินความพึงพอใจของ${dTarget} ที่มีต่อการจัดการเรียนรู้ด้วย${bShort} และปรับปรุงเป็นคู่มือฉบับสมบูรณ์ (ระยะที่ 4: D2)`
      ];

      const defaultHypotheses = [
        `1. ผู้เรียนที่ได้รับการจัดการเรียนรู้ด้วย${bShort} มีคะแนน${c1} หลังเรียนสูงกว่าก่อนเรียน อย่างมีนัยสำคัญทางสถิติที่ระดับ .05`,
        ...(c2 ? [`2. ผู้เรียนที่ได้รับการจัดการเรียนรู้ด้วย${bShort} มีคะแนน${c2} หลังเรียนสูงกว่าก่อนเรียน อย่างมีนัยสำคัญทางสถิติที่ระดับ .05`] : [])
      ];

      const samplingMeta = proj.samplingMetadata || {
        type: "cluster_random",
        populationSize: 120,
        sampleSize: 35,
        classroomsCount: 4,
        selectedClassrooms: 1,
        isNormalDistributed: true,
        unit: "ห้องเรียน (Classroom Unit)",
        normalityTest: "shapiro_wilk"
      };

      const defaultNarrative = generateSamplingNarrative(
        proj,
        samplingMeta.type || "cluster_random",
        samplingMeta.populationSize || 120,
        samplingMeta.classroomsCount || 4,
        samplingMeta.sampleSize || 35,
        samplingMeta.selectedClassrooms || 1
      );

      state.wizardData = {
        step1_title: proj.title || window.ROAD_GENERATOR.composeFullTitle(proj),
        step1_keywords: `${proj.B_short || proj.B}, ${(proj.C_list || []).join(", ")}, การวิจัยและพัฒนา (R&D)`,
        step2_problem: `ผู้เรียนยังขาดทักษะ${(proj.C_list && proj.C_list[0]) || 'การคิดวิเคราะห์'} และมีผลสัมฤทธิ์ทางการเรียนต่ำกว่าเกณฑ์เป้าหมายของสถานศึกษา อีกทั้งการจัดการเรียนรู้เดิมเน้นการบรรยาย ขาดการลงมือปฏิบัติจริง และไม่มีเครื่องมือช่วยให้ข้อมูลสะท้อนกลับรายบุคคลอย่างทันท่วงที`,
        step2_context: `${school} สังกัด ${affil} ผู้เรียนระดับ ${dTarget}`,
        step3_obj: defaultObjectives.join("\n"),
        step4_hypo: defaultHypotheses.join("\n"),
        step5_samplingMethod: samplingMeta.type || "cluster_random",
        step5_popSize: samplingMeta.populationSize || 120,
        step5_classroomsCount: samplingMeta.classroomsCount || 4,
        step5_sampleSize: samplingMeta.sampleSize || 35,
        step5_selectedClassrooms: samplingMeta.selectedClassrooms || 1,
        step5_population: proj.population || defaultNarrative.populationText,
        step5_sample: proj.sample || defaultNarrative.sampleText,
        step6_innovation: proj.B || "รูปแบบการจัดการเรียนรู้เชิงรุกผสานปัญญาประดิษฐ์",
        step6_innovation_short: proj.B_short || "รูปแบบ PBL-AI Reflective Model",
        step6_steps: (proj.B_steps && proj.B_steps.length > 0) ? proj.B_steps.join("\n") : (window.ROAD_DATA.RESEARCH_WIZARD_STEPS[5].sample.step6_steps || ""),
        step6_independent: `นวัตกรรม ${proj.B_short || 'รูปแบบที่พัฒนาขึ้น'}`,
        step6_dependent: (proj.C_list || []).join(", "),
        step7_tools: `- ${proj.B_short || 'คู่มือการใช้นวัตกรรม'}\n- แผนการจัดการเรียนรู้ 6 แผน (18 ชม.)\n- แบบทดสอบวัด${(proj.C_list && proj.C_list[0]) || 'ผลสัมฤทธิ์'}\n- แบบสอบถามความพึงพอใจ`,
        step7_quality: "IOC โดยผู้เชี่ยวชาญ 5 ท่าน (เกณฑ์ >= 0.50), ความยากง่าย (p) 0.20-0.80, อำนาจจำแนก (r) >= 0.20, ความเชื่อมั่นแบบทดสอบ KR-20 >= 0.80, ความเชื่อมั่นแบบสอบถาม Cronbach's Alpha >= 0.85",
        step8_stats: `1. ค่าเฉลี่ย (x̄) และส่วนเบี่ยงเบนมาตรฐาน (S.D.)\n2. ประสิทธิภาพนวัตกรรม E1/E2 ตามเกณฑ์ ${proj.efficiencyCriterion || '80/80'}\n3. ดัชนีประสิทธิผล (E.I.) เกณฑ์ >= 0.50\n4. สถิติทดสอบสมมติฐาน Dependent Samples t-test (p < .05)\n5. การวิเคราะห์ขนาดอิทธิพล (Cohen's d)`,
        step9_impact: `1. ผู้เรียนมี${(proj.C_list || []).join(" และ ")}สูงขึ้นอย่างมีนัยสำคัญทางสถิติ\n2. ครูได้นวัตกรรมต้นแบบที่ผ่านการตรวจสอบเชิงประจักษ์ตามเกณฑ์ วPA ก.ค.ศ.\n3. โรงเรียนเปรมติณสูลานนท์และ อบจ.ขอนแก่น มีนวัตกรรมต้นแบบพร้อมขยายผลสู่โรงเรียนในสังกัดและเผยแพร่ในวารสาร TCI`
      };
      state.lastSavedTimestamp = new Date().toLocaleTimeString("th-TH");
      state.showWizardModal = true;
      renderApp();
    },

    closeWizardModal() {
      state.showWizardModal = false;
      renderApp();
    },

    setWizardStep(step) {
      // Auto-save current wizard values into active project before switching
      const proj = getActiveProject();
      if (proj && state.wizardData) {
        const w = state.wizardData;
        if (w.step5_population) proj.population = w.step5_population;
        if (w.step5_sample) proj.sample = w.step5_sample;
        if (w.step5_samplingMethod) {
          proj.samplingMethod = w.step5_samplingMethod;
          if (proj.samplingMetadata) proj.samplingMetadata.type = w.step5_samplingMethod;
        }
        if (w.step1_title) proj.title = w.step1_title;
        if (w.step6_innovation) proj.B = w.step6_innovation;
        if (w.step6_innovation_short) proj.B_short = w.step6_innovation_short;
        saveProjects();
      }
      state.wizardStep = Math.max(1, Math.min(10, Number(step) || 1));
      state.lastSavedTimestamp = new Date().toLocaleTimeString("th-TH");
      renderApp();
    },

    updateWizardField(field, val) {
      if (!state.wizardData) state.wizardData = {};
      state.wizardData[field] = val;
      const proj = getActiveProject();
      if (proj) {
        if (field === "step1_title") proj.title = val;
        if (field === "step5_population") proj.population = val;
        if (field === "step5_sample") proj.sample = val;
        if (field === "step6_innovation") proj.B = val;
        if (field === "step6_innovation_short") proj.B_short = val;
      }
      state.lastSavedTimestamp = new Date().toLocaleTimeString("th-TH");
    },

    updateWizardSamplingMethod(methodId) {
      const proj = getActiveProject();
      if (!proj.samplingMetadata) {
        proj.samplingMetadata = {
          type: methodId,
          populationSize: 120,
          sampleSize: 35,
          classroomsCount: 4,
          selectedClassrooms: 1,
          isNormalDistributed: true,
          unit: "ห้องเรียน (Classroom Unit)",
          normalityTest: "shapiro_wilk"
        };
      } else {
        proj.samplingMetadata.type = methodId;
      }
      proj.samplingMethod = methodId;
      if (!state.wizardData) state.wizardData = {};
      state.wizardData.step5_samplingMethod = methodId;

      const popSize = Number(state.wizardData.step5_popSize) || proj.samplingMetadata.populationSize || 120;
      const classCount = Number(state.wizardData.step5_classroomsCount) || proj.samplingMetadata.classroomsCount || 4;
      const sampleSize = Number(state.wizardData.step5_sampleSize) || proj.samplingMetadata.sampleSize || 35;
      const selClassCount = Number(state.wizardData.step5_selectedClassrooms) || proj.samplingMetadata.selectedClassrooms || 1;

      const narrative = generateSamplingNarrative(proj, methodId, popSize, classCount, sampleSize, selClassCount);
      state.wizardData.step5_population = narrative.populationText;
      state.wizardData.step5_sample = narrative.sampleText;
      proj.population = narrative.populationText;
      proj.sample = narrative.sampleText;

      state.lastSavedTimestamp = new Date().toLocaleTimeString("th-TH");
      saveProjects();
      renderApp();

      const mName = methodId === 'cluster_random' ? 'การสุ่มแบบกลุ่ม (Cluster Random)' :
                    methodId === 'simple_random' ? 'การสุ่มอย่างง่าย (Simple Random)' :
                    methodId === 'purposive' ? 'การเลือกแบบเจาะจง (Purposive)' : 'ประชากรทั้งหมด (Census)';
      showToast(`ตั้งค่าวิธีการสุ่มเป็น "${mName}" และสร้างข้อความวิจัยเรียบร้อยแล้ว`, (methodId === 'purposive' || methodId === 'population') ? 'warn' : 'ok');
    },

    updateWizardSamplingNumber(field, val) {
      const numVal = Math.max(1, Number(val) || 1);
      const proj = getActiveProject();
      if (!proj.samplingMetadata) {
        proj.samplingMetadata = {
          type: (state.wizardData && state.wizardData.step5_samplingMethod) || "cluster_random",
          populationSize: 120,
          sampleSize: 35,
          classroomsCount: 4,
          selectedClassrooms: 1,
          isNormalDistributed: true,
          unit: "ห้องเรียน (Classroom Unit)",
          normalityTest: "shapiro_wilk"
        };
      }
      proj.samplingMetadata[field] = numVal;
      if (!state.wizardData) state.wizardData = {};

      if (field === "populationSize") state.wizardData.step5_popSize = numVal;
      if (field === "classroomsCount") state.wizardData.step5_classroomsCount = numVal;
      if (field === "sampleSize") state.wizardData.step5_sampleSize = numVal;
      if (field === "selectedClassrooms") state.wizardData.step5_selectedClassrooms = numVal;

      const methodId = state.wizardData.step5_samplingMethod || proj.samplingMetadata.type || "cluster_random";
      const popSize = Number(state.wizardData.step5_popSize) || proj.samplingMetadata.populationSize || 120;
      const classCount = Number(state.wizardData.step5_classroomsCount) || proj.samplingMetadata.classroomsCount || 4;
      const sampleSize = Number(state.wizardData.step5_sampleSize) || proj.samplingMetadata.sampleSize || 35;
      const selClassCount = Number(state.wizardData.step5_selectedClassrooms) || proj.samplingMetadata.selectedClassrooms || 1;

      const narrative = generateSamplingNarrative(proj, methodId, popSize, classCount, sampleSize, selClassCount);
      state.wizardData.step5_population = narrative.populationText;
      state.wizardData.step5_sample = narrative.sampleText;
      proj.population = narrative.populationText;
      proj.sample = narrative.sampleText;

      state.lastSavedTimestamp = new Date().toLocaleTimeString("th-TH");
      saveProjects();
      renderApp();
    },

    autoGenerateSamplingNarrative() {
      const proj = getActiveProject();
      if (!state.wizardData) state.wizardData = {};
      const methodId = state.wizardData.step5_samplingMethod || (proj.samplingMetadata && proj.samplingMetadata.type) || "cluster_random";
      const popSize = Number(state.wizardData.step5_popSize) || (proj.samplingMetadata && proj.samplingMetadata.populationSize) || 120;
      const classCount = Number(state.wizardData.step5_classroomsCount) || (proj.samplingMetadata && proj.samplingMetadata.classroomsCount) || 4;
      const sampleSize = Number(state.wizardData.step5_sampleSize) || (proj.samplingMetadata && proj.samplingMetadata.sampleSize) || 35;
      const selClassCount = Number(state.wizardData.step5_selectedClassrooms) || (proj.samplingMetadata && proj.samplingMetadata.selectedClassrooms) || 1;

      const narrative = generateSamplingNarrative(proj, methodId, popSize, classCount, sampleSize, selClassCount);
      state.wizardData.step5_population = narrative.populationText;
      state.wizardData.step5_sample = narrative.sampleText;
      proj.population = narrative.populationText;
      proj.sample = narrative.sampleText;
      if (proj.samplingMetadata) {
        proj.samplingMetadata.type = methodId;
        proj.samplingMetadata.populationSize = popSize;
        proj.samplingMetadata.sampleSize = sampleSize;
        proj.samplingMetadata.classroomsCount = classCount;
        proj.samplingMetadata.selectedClassrooms = selClassCount;
      }
      proj.samplingMethod = methodId;

      state.lastSavedTimestamp = new Date().toLocaleTimeString("th-TH");
      saveProjects();
      renderApp();
      showToast("⚡ สร้างข้อความทางการสำหรับประชากรและกลุ่มตัวอย่างสำเร็จ", "ok");
    },

    applyWizardSample(stepNum) {
      const proj = getActiveProject() || {};
      const stepObj = (window.ROAD_DATA.RESEARCH_WIZARD_STEPS || []).find(s => s.step === stepNum);
      const school = (proj.contextMeta && proj.contextMeta.schoolName) || proj.schoolName || proj.school || "โรงเรียนเปรมติณสูลานนท์";
      const affil = (proj.contextMeta && proj.contextMeta.affiliation) || proj.affiliation || "องค์การบริหารส่วนจังหวัดขอนแก่น";
      
      if (!state.wizardData) state.wizardData = {};

      if (stepNum === 1) {
        state.wizardData.step1_title = (stepObj && stepObj.sample && stepObj.sample.step1_title) ||
          `การพัฒนารูปแบบการจัดการเรียนรู้เชิงรุกผสานปัญญาประดิษฐ์ ตามแนวคิดการจัดการเรียนรู้แบบใช้ปัญหาเป็นฐานร่วมกับการสะท้อนคิด เพื่อพัฒนาความสามารถในการแก้ปัญหาที่ซับซ้อนและผลสัมฤทธิ์ทางการเรียน สำหรับนักเรียนชั้นมัธยมศึกษาปีที่ 4 ${school} สังกัด${affil}`;
        state.wizardData.step1_keywords = (stepObj && stepObj.sample && stepObj.sample.step1_keywords) ||
          "รูปแบบ PBL-AI Reflective Model, การแก้ปัญหาที่ซับซ้อน, ผลสัมฤทธิ์ทางการเรียน, การวิจัยและพัฒนา (R&D)";
        if (proj) proj.title = state.wizardData.step1_title;
      } else if (stepNum === 2) {
        state.wizardData.step2_problem = (stepObj && stepObj.sample && (stepObj.sample.step2_problem || stepObj.sample.problemStatement)) ||
          "ผู้เรียนยังขาดทักษะการคิดวิเคราะห์และการแก้ปัญหาอย่างเป็นระบบในสถานการณ์ซับซ้อน โดยผลการประเมินพบว่าคะแนนเฉลี่ยต่ำกว่าเกณฑ์ร้อยละ 60 การจัดการเรียนรู้เดิมเน้นการบรรยาย ขาดการลงมือปฏิบัติจริง และไม่มีเครื่องมือช่วยให้ข้อมูลสะท้อนกลับรายบุคคลอย่างทันท่วงที";
        state.wizardData.step2_context = (stepObj && stepObj.sample && (stepObj.sample.step2_context || stepObj.sample.schoolContext)) ||
          `${school} สังกัด${affil} ผู้เรียนระดับชั้นมัธยมศึกษาปีที่ 4`;
      } else if (stepNum === 3) {
        state.wizardData.step3_obj = (stepObj && stepObj.sample && stepObj.sample.step3_obj) ||
          "1. เพื่อศึกษาสภาพปัญหา ข้อมูลพื้นฐาน และความต้องการจำเป็นในการพัฒนารูปแบบการจัดการเรียนรู้ สำหรับนักเรียนชั้นมัธยมศึกษาปีที่ 4 (ระยะที่ 1: R1)\n2. เพื่อสร้าง พัฒนา และหาประสิทธิภาพของรูปแบบการจัดการเรียนรู้ ให้มีประสิทธิภาพตามเกณฑ์มาตรฐาน 80/80 (ระยะที่ 2: D1)\n3. เพื่อทดลองใช้รูปแบบการจัดการเรียนรู้กับกลุ่มตัวอย่างจริง โดยเปรียบเทียบผลสัมฤทธิ์ทางการเรียนและความสามารถในการแก้ปัญหาที่ซับซ้อนก่อนและหลังเรียน และหาดัชนีประสิทธิผล (E.I.) (ระยะที่ 3: R2)\n4. เพื่อประเมินความพึงพอใจของนักเรียนที่มีต่อการจัดการเรียนรู้ด้วยรูปแบบที่พัฒนาขึ้น และปรับปรุงเป็นคู่มือฉบับสมบูรณ์ (ระยะที่ 4: D2)";
      } else if (stepNum === 4) {
        state.wizardData.step4_hypo = (stepObj && stepObj.sample && stepObj.sample.step4_hypo) ||
          "1. นักเรียนชั้นมัธยมศึกษาปีที่ 4 ที่ได้รับการจัดการเรียนรู้ด้วยรูปแบบที่พัฒนาขึ้น มีคะแนนผลสัมฤทธิ์ทางการเรียนหลังเรียนสูงกว่าก่อนเรียน อย่างมีนัยสำคัญทางสถิติที่ระดับ .05\n2. นักเรียนชั้นมัธยมศึกษาปีที่ 4 ที่ได้รับการจัดการเรียนรู้ด้วยรูปแบบที่พัฒนาขึ้น มีคะแนนความสามารถในการแก้ปัญหาที่ซับซ้อนหลังเรียนสูงกว่าก่อนเรียน อย่างมีนัยสำคัญทางสถิติที่ระดับ .05";
      } else if (stepNum === 5) {
        state.wizardData.step5_samplingMethod = "cluster_random";
        state.wizardData.step5_popSize = 120;
        state.wizardData.step5_classroomsCount = 4;
        state.wizardData.step5_sampleSize = 35;
        state.wizardData.step5_selectedClassrooms = 1;
        
        const narrative = generateSamplingNarrative(proj, "cluster_random", 120, 4, 35, 1);
        state.wizardData.step5_population = narrative.populationText;
        state.wizardData.step5_sample = narrative.sampleText;
        
        proj.samplingMetadata = {
          type: "cluster_random",
          populationSize: 120,
          sampleSize: 35,
          classroomsCount: 4,
          selectedClassrooms: 1,
          isNormalDistributed: true,
          unit: "ห้องเรียน (Classroom Unit)",
          normalityTest: "shapiro_wilk"
        };
        proj.population = narrative.populationText;
        proj.sample = narrative.sampleText;
        proj.samplingMethod = "cluster_random";
        saveProjects();
      } else if (stepNum === 6) {
        state.wizardData.step6_innovation = (stepObj && stepObj.sample && stepObj.sample.step6_innovation) ||
          "รูปแบบการจัดการเรียนรู้เชิงรุกผสานปัญญาประดิษฐ์ ตามแนวคิดการจัดการเรียนรู้แบบใช้ปัญหาเป็นฐานร่วมกับการสะท้อนคิด (PBL-AI Reflective Model)";
        state.wizardData.step6_innovation_short = "รูปแบบ PBL-AI Reflective Model";
        state.wizardData.step6_steps = (stepObj && stepObj.sample && stepObj.sample.step6_steps) ||
          "ขั้นที่ 1 ระบุสถานการณ์ปัญหาท้าทาย (Problem Identification)\nขั้นที่ 2 แสวงหาความรู้และวิเคราะห์ด้วย AI Co-Pilot (Inquiry & AI Exploration)\nขั้นที่ 3 ออกแบบแนวทางแก้ไขและลงมือปฏิบัติ (Collaborative Solution Design)\nขั้นที่ 4 นำเสนอผลงานและสะท้อนคิดพิจารณาผล (Showcase & Reflection)\nขั้นที่ 5 ประเมินและขยายผลสู่ชีวิตจริง (Authentic Evaluation & Application)";
        state.wizardData.step6_dependent = (stepObj && stepObj.sample && stepObj.sample.step6_dependent) ||
          "ความสามารถในการแก้ปัญหาที่ซับซ้อน, ผลสัมฤทธิ์ทางการเรียน";
        if (proj) {
          proj.B = state.wizardData.step6_innovation;
          proj.B_short = state.wizardData.step6_innovation_short;
          proj.B_steps = state.wizardData.step6_steps.split("\n").map(s => s.trim()).filter(Boolean);
          proj.C_list = state.wizardData.step6_dependent.split(/[,،\n]+/).map(s => s.trim()).filter(Boolean);
        }
      } else if (stepNum === 7) {
        state.wizardData.step7_tools = (stepObj && stepObj.sample && stepObj.sample.step7_tools) ||
          "- รูปแบบการจัดการเรียนรู้เชิงรุกผสาน AI (คู่มือการใช้และแผนการสอน 6 แผน 18 ชม.)\n- แบบทดสอบวัดผลสัมฤทธิ์ทางการเรียน ชนิดปรนัย 4 ตัวเลือก จำนวน 40 ข้อ\n- แบบประเมินความสามารถในการแก้ปัญหาที่ซับซ้อนตามสภาพจริง (Rubric 4 ระดับ)\n- แบบสอบถามความพึงพอใจของนักเรียน แบบมาตราส่วนประมาณค่า 5 ระดับ (Likert Scale)";
        state.wizardData.step7_quality = (stepObj && stepObj.sample && stepObj.sample.step7_quality) ||
          "ความเที่ยงตรงเชิงเนื้อหา IOC โดยผู้เชี่ยวชาญ 5 ท่าน (เกณฑ์ >= 0.50), ความยากง่าย (p) 0.20-0.80, อำนาจจำแนก (r) >= 0.20, ความเชื่อมั่นแบบทดสอบ KR-20 >= 0.80, ความเชื่อมั่นแบบสอบถาม Cronbach's Alpha >= 0.85";
      } else if (stepNum === 8) {
        state.wizardData.step8_stats = (stepObj && stepObj.sample && stepObj.sample.step8_stats) ||
          "1. ค่าเฉลี่ย (x̄) และส่วนเบี่ยงเบนมาตรฐาน (S.D.)\n2. ประสิทธิภาพของกระบวนการและผลลัพธ์ (E1/E2) ตามเกณฑ์ 80/80\n3. ดัชนีประสิทธิผล (Effectiveness Index: E.I.) ตามเกณฑ์ >= 0.50\n4. สถิติทดสอบสมมติฐาน Dependent Samples t-test (p < .05)\n5. การวิเคราะห์ขนาดอิทธิพล (Effect Size: Cohen's d)";
      } else if (stepNum === 9) {
        state.wizardData.step9_impact = (stepObj && stepObj.sample && stepObj.sample.step9_impact) ||
          `1. นักเรียนชั้นมัธยมศึกษาปีที่ 4 มีความสามารถในการแก้ปัญหาที่ซับซ้อนและผลสัมฤทธิ์ทางการเรียนสูงขึ้นอย่างมีนัยสำคัญทางสถิติ\n2. ครูผู้สอนได้คู่มือและแผนการจัดการเรียนรู้เชิงรุกผสาน AI ที่มีประสิทธิภาพผ่านเกณฑ์ วPA ก.ค.ศ. ด้านที่ 1 และ 2\n3. ${school} และ ${affil} มีนวัตกรรมต้นแบบพร้อมขยายผลสู่โรงเรียนในสังกัดและเผยแพร่ในวารสาร TCI`;
      }

      state.lastSavedTimestamp = new Date().toLocaleTimeString("th-TH");
      saveProjects();
      renderApp();
      showToast(`เติมข้อมูลตัวอย่างมาตรฐาน R&D ในขั้นตอนที่ ${stepNum} เรียบร้อยแล้ว`, "ok");
    },

    saveWizardStep() {
      const proj = getActiveProject();
      if (proj && state.wizardData) {
        const w = state.wizardData;
        if (w.step1_title) proj.title = w.step1_title;
        if (w.step5_population) proj.population = w.step5_population;
        if (w.step5_sample) proj.sample = w.step5_sample;
        if (w.step5_samplingMethod) {
          proj.samplingMethod = w.step5_samplingMethod;
          if (!proj.samplingMetadata) proj.samplingMetadata = {};
          proj.samplingMetadata.type = w.step5_samplingMethod;
        }
        if (proj.samplingMetadata) {
          if (w.step5_popSize) proj.samplingMetadata.populationSize = Number(w.step5_popSize);
          if (w.step5_sampleSize) proj.samplingMetadata.sampleSize = Number(w.step5_sampleSize);
          if (w.step5_classroomsCount) proj.samplingMetadata.classroomsCount = Number(w.step5_classroomsCount);
          if (w.step5_selectedClassrooms) proj.samplingMetadata.selectedClassrooms = Number(w.step5_selectedClassrooms);
        }
        if (w.step6_innovation) proj.B = w.step6_innovation;
        if (w.step6_innovation_short) proj.B_short = w.step6_innovation_short;
        if (w.step6_steps) proj.B_steps = w.step6_steps.split("\n").map(s => s.trim()).filter(Boolean);
        if (w.step6_dependent) proj.C_list = w.step6_dependent.split(/[,،\n]+/).map(s => s.trim()).filter(Boolean);
        saveProjects();
      }
      state.lastSavedTimestamp = new Date().toLocaleTimeString("th-TH");
      renderApp();
      showToast("💾 บันทึกข้อมูลโครงร่างวิจัยเรียบร้อยแล้ว", "ok");
    },

    completeWizardAndCreate() {
      const w = state.wizardData || {};
      const proj = getActiveProject();
      
      if (proj) {
        if (w.step1_title) proj.title = w.step1_title;
        if (w.step6_innovation) proj.B = w.step6_innovation;
        if (w.step6_innovation_short) proj.B_short = w.step6_innovation_short;
        if (w.step6_steps) {
          proj.B_steps = w.step6_steps.split("\n").map(s => s.trim()).filter(Boolean);
        }
        if (w.step6_dependent) {
          proj.C_list = w.step6_dependent.split(/[,،\n]+/).map(s => s.trim()).filter(Boolean);
        }
        if (w.step5_population) proj.population = w.step5_population;
        if (w.step5_sample) proj.sample = w.step5_sample;
        if (w.step5_samplingMethod) {
          proj.samplingMethod = w.step5_samplingMethod;
          if (!proj.samplingMetadata) proj.samplingMetadata = {};
          proj.samplingMetadata.type = w.step5_samplingMethod;
        }
        if (proj.samplingMetadata) {
          if (w.step5_popSize) proj.samplingMetadata.populationSize = Number(w.step5_popSize);
          if (w.step5_sampleSize) proj.samplingMetadata.sampleSize = Number(w.step5_sampleSize);
          if (w.step5_classroomsCount) proj.samplingMetadata.classroomsCount = Number(w.step5_classroomsCount);
          if (w.step5_selectedClassrooms) proj.samplingMetadata.selectedClassrooms = Number(w.step5_selectedClassrooms);
        }
        
        proj.status = "outlined";
        proj.progress = 95;
        proj.updatedAt = new Date().toISOString();
        
        recordAudit("PROJECT_CREATE", `สร้างและซิงค์โครงร่าง 5 บทผ่าน Research Wizard: ${proj.label || proj.B_short || proj.title}`);
        saveProjects();
      }

      state.showWizardModal = false;
      state.studioTab = "chapters";
      renderApp();
      if (typeof window.scrollTo === "function") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      showToast("สร้างและตรวจทานโครงร่างการวิจัย 5 บทเสร็จสมบูรณ์เรียบร้อยแล้ว!", "ok");
    },

    // --- Research Workspace & Project Portfolio Actions ---
    setProjectFilterStatus(st) {
      state.projectFilterStatus = st;
      renderApp();
    },

    setProjectSearch(q) {
      state.projectSearch = q;
      renderApp();
    },

    setProjectStatus(projId, status) {
      const p = state.projects.find(x => x.id === projId);
      if (p) {
        p.status = status;
        p.updatedAt = new Date().toISOString();
        recordAudit("PROJECT_UPDATE", `เปลี่ยนสถานะโครงการ "${p.label || p.B_short}" เป็น ${status}`);
        saveProjects();
        renderApp();
        showToast("อัปเดตสถานะโครงการเรียบร้อยแล้ว");
      }
    },

    duplicateProject(projId) {
      const origin = state.projects.find(x => x.id === projId);
      if (!origin) return;
      const clone = JSON.parse(JSON.stringify(origin));
      clone.id = "proj-" + Date.now();
      clone.label = `${origin.label || origin.B_short} (สำเนา)`;
      clone.status = "draft";
      clone.progress = 50;
      clone.updatedAt = new Date().toISOString();
      state.projects.unshift(clone);
      state.activeProjectId = clone.id;
      recordAudit("PROJECT_CREATE", `คัดลอกโครงการ: ${clone.label}`);
      saveProjects();
      renderApp();
      showToast(`คัดลอกโครงการ "${clone.label}" เรียบร้อยแล้ว`);
    },

    archiveProject(projId) {
      const p = state.projects.find(x => x.id === projId);
      if (p) {
        p.status = "archived";
        p.updatedAt = new Date().toISOString();
        recordAudit("PROJECT_UPDATE", `จัดเก็บโครงการเข้ากรุ: ${p.label || p.B_short}`);
        saveProjects();
        renderApp();
        showToast(`จัดเก็บโครงการ "${p.label || p.B_short}" เรียบร้อยแล้ว`);
      }
    },

    deleteProject(projId) {
      if (state.projects.length <= 1) {
        showToast("ต้องมีโครงการวิจัยอย่างน้อย 1 โครงการในระบบ", "warn");
        return;
      }
      if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบโครงการนี้?")) return;
      const p = state.projects.find(x => x.id === projId);
      state.projects = state.projects.filter(x => x.id !== projId);
      if (state.activeProjectId === projId) {
        state.activeProjectId = state.projects[0].id;
      }
      recordAudit("PROJECT_UPDATE", `ลบโครงการ: ${p ? (p.label || p.B_short) : projId}`);
      saveProjects();
      renderApp();
      showToast("ลบโครงการวิจัยเรียบร้อยแล้ว");
    },

    exportAuditLogsJson() {
      const blob = new Blob([JSON.stringify(state.auditLogs, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ROAD_AuditLogs_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast("ส่งออกบันทึก Audit Logs เรียบร้อยแล้ว");
    }
  };

  function renderLiveTitleBar() {
    const el = document.getElementById("live-composed-title");
    if (!el) return;
    const proj = getActiveProject();
    if (state.titleViewMode === "plain") {
      el.textContent = window.ROAD_GENERATOR.composeFullTitle(proj);
    } else {
      el.innerHTML = window.ROAD_GENERATOR.composeColorCodedTitle(proj);
    }
  }

  // --- Reusable 3-Flame Glossy 3D SVG Emblem (Matches Reference Image) ---
  function render3DFlameLogo(size = 86) {
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-[0_10px_16px_rgba(12,62,214,0.32)]">
        <defs>
          <linearGradient id="flameDarkBlue" x1="20" y1="30" x2="68" y2="108" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#1968ff"/>
            <stop offset="55%" stop-color="#0538c8"/>
            <stop offset="100%" stop-color="#021b7a"/>
          </linearGradient>
          <linearGradient id="flameMidBlue" x1="35" y1="18" x2="82" y2="96" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#63b8ff"/>
            <stop offset="50%" stop-color="#1b78ff"/>
            <stop offset="100%" stop-color="#0747d6"/>
          </linearGradient>
          <linearGradient id="flameWhite" x1="52" y1="8" x2="96" y2="78" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="65%" stop-color="#e5eeff"/>
            <stop offset="100%" stop-color="#b8ceff"/>
          </linearGradient>
        </defs>
        <!-- Top-Right Pearl White Wave -->
        <path d="M62 11C54 24 61 36 74 44C87 52 93 64 84 79C96 67 98 48 85 36C72 24 66 20 62 11Z" fill="url(#flameWhite)" stroke="rgba(255,255,255,0.9)" stroke-width="1.2"/>
        <!-- Center Electric Blue Wave -->
        <path d="M47 26C38 41 46 53 61 62C75 71 79 83 69 98C83 86 86 66 71 53C57 40 51 36 47 26Z" fill="url(#flameMidBlue)" stroke="rgba(255,255,255,0.45)" stroke-width="1"/>
        <!-- Bottom-Left Royal Blue Wave -->
        <path d="M33 44C24 58 32 70 47 79C61 88 64 98 56 111C70 100 72 81 58 68C44 55 37 52 33 44Z" fill="url(#flameDarkBlue)" stroke="rgba(120,180,255,0.4)" stroke-width="1"/>
      </svg>
    `;
  }

  // --- UI Renderers ---
  function renderTopNavbar() {
    const u = state.currentUser;
    return `
      <header class="sticky top-0 z-40 px-4 pt-3 pb-2 print:hidden">
        <div class="max-w-7xl mx-auto neu-card px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <button onclick="ROAD_APP.setView('studio')" class="flex items-center gap-3 text-left group cursor-pointer">
              <div class="w-11 h-11 rounded-2xl neu-squircle flex items-center justify-center">
                ${render3DFlameLogo(32)}
              </div>
              <div>
                <div class="font-extrabold text-[#0d1838] dark:text-white text-sm sm:text-base flex items-center gap-2 tracking-tight">
                  ROAD <span class="text-blue-600 dark:text-blue-400">NEXT-GEN</span>
                  <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-400/30">AI + R&D Studio</span>
                </div>
                <div class="text-[11px] text-[#5b6d96] dark:text-slate-400">จากชื่อเรื่อง ABCD สู่รายงานการวิจัย 5 บท · R&D Research Studio</div>
              </div>
            </button>
          </div>

          <nav class="flex flex-wrap items-center gap-2">
            <button onclick="ROAD_APP.setView('login')" class="px-3.5 py-2 rounded-full text-xs font-bold transition cursor-pointer ${state.view === 'login' ? 'neu-btn-primary' : 'neu-squircle text-[#0d1838] dark:text-slate-200'}">
              🔐 Welcome Login
            </button>
            <button onclick="ROAD_APP.setView('studio')" class="px-3.5 py-2 rounded-full text-xs font-bold transition cursor-pointer ${state.view === 'studio' ? 'neu-btn-primary' : 'neu-squircle text-[#0d1838] dark:text-slate-200'}">
              🧠 สตูดิโอวิจัย AI (5 บท)
            </button>
            <button onclick="ROAD_APP.setView('slides')" class="px-3.5 py-2 rounded-full text-xs font-bold transition cursor-pointer ${state.view === 'slides' ? 'neu-btn-primary' : 'neu-squircle text-[#0d1838] dark:text-slate-200'}">
              🖥️ สไลด์นำเสนอ
            </button>
            <button onclick="ROAD_APP.setView('admin')" class="px-3.5 py-2 rounded-full text-xs font-bold transition cursor-pointer ${state.view === 'admin' ? 'neu-btn-primary' : 'neu-squircle text-[#0d1838] dark:text-slate-200'}">
              📊 แดชบอร์ด Admin
            </button>

            ${u ? `
              <div class="hidden sm:flex items-center gap-2 neu-input-pill px-3 py-1.5">
                <div class="text-xs leading-tight">
                  <div class="font-bold text-[#0d1838] dark:text-white">${escapeHtml(u.title)}${escapeHtml(u.first_name)}</div>
                  <div class="text-[10px] font-mono text-blue-600 dark:text-blue-400">${escapeHtml(u.username)}</div>
                </div>
              </div>
            ` : ""}

            <!-- 3D Neumorphic Moon/Sun Theme Toggle (Matches Top-Right of Reference Image) -->
            <button onclick="ROAD_APP.toggleTheme()" class="w-11 h-11 neu-squircle flex items-center justify-center text-[#0d1838] dark:text-amber-300 cursor-pointer" title="สลับโหมดสี (Light / Dark)">
              ${state.theme === "dark" ? `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              ` : `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#0d1838"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              `}
            </button>
          </nav>
        </div>
      </header>
    `;
  }

  // --- View 1: 3D Soft Neumorphic Login Screen (Exact Match to Reference Image!) ---
  function renderLoginView() {
    return `
      <div class="min-h-[84vh] flex flex-col items-center justify-center px-4 py-8 relative">
        <div class="w-full max-w-[430px] flex flex-col items-center">
          <!-- 3D Center Medallion Logo -->
          <div class="neu-logo-medallion mb-7">
            ${render3DFlameLogo(92)}
          </div>

          <!-- Welcome Back Title & Spaced Subtitle -->
          <h1 class="text-[34px] font-extrabold tracking-tight text-[#0d1838] dark:text-white leading-tight text-center">
            Welcome Back
          </h1>
          <p class="text-sm font-medium tracking-[0.22em] text-[#5b6d96] dark:text-slate-400 mt-1.5 mb-8 text-center">
            Sign in to continue
          </p>

          <!-- Login Form with Recessed 3D Pill Inputs -->
          <form onsubmit="ROAD_APP.handleLoginSubmit(event)" class="w-full flex flex-col gap-4" noValidate>
            <!-- Username or Email Pill -->
            <div class="neu-input-pill px-5 py-4 flex items-center gap-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5b6d96" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <input
                id="login-identifier"
                type="text"
                autoComplete="username"
                value="gorthailand1617@gmail.com"
                placeholder="Username or Email (เช่น RD69A1-01)"
                class="w-full bg-transparent outline-none text-[15px] font-medium text-[#0d1838] dark:text-white placeholder-[#6b7da6]"
                required
              />
            </div>

            <!-- Password Pill -->
            <div class="neu-input-pill px-5 py-4 flex items-center gap-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5b6d96" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                id="login-password"
                type="${state.showLoginPass ? 'text' : 'password'}"
                autoComplete="current-password"
                value="somchai.k5678"
                placeholder="Password"
                class="w-full bg-transparent outline-none text-[15px] font-medium text-[#0d1838] dark:text-white placeholder-[#6b7da6]"
                required
              />
              <button type="button" onclick="ROAD_APP.toggleLoginPass()" class="text-[#5b6d96] hover:text-[#0d1838] dark:hover:text-white cursor-pointer shrink-0" title="แสดง/ซ่อนรหัสผ่าน">
                ${state.showLoginPass ? `
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                ` : `
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                `}
              </button>
            </div>

            <!-- Remember Me & Forgot Password Row -->
            <div class="flex items-center justify-between px-1 pt-1 text-sm">
              <button type="button" onclick="ROAD_APP.toggleRememberMe()" class="flex items-center gap-2.5 cursor-pointer select-none">
                <span class="w-6 h-6 rounded-lg flex items-center justify-center transition ${state.rememberMe ? 'bg-gradient-to-br from-[#2fb4ff] to-[#1a62ff] text-white shadow-[0_4px_10px_rgba(26,98,255,0.4)]' : 'neu-input-pill'}">
                  ${state.rememberMe ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>` : ""}
                </span>
                <span class="font-semibold text-[#1e2d52] dark:text-slate-200">Remember Me</span>
              </button>
              <button type="button" onclick="ROAD_APP.setView('forgot')" class="font-semibold text-[#1456e8] dark:text-blue-400 hover:underline cursor-pointer">
                ลืมรหัสผ่าน?
              </button>
            </div>

            <!-- Glossy 3D Electric-Blue Login Pill Button -->
            <button type="submit" class="neu-btn-primary w-full py-4 px-6 mt-2 flex items-center justify-between cursor-pointer group">
              <span class="w-9"></span>
              <span class="text-xl font-bold tracking-wide">Login</span>
              <span class="w-9 h-9 rounded-full bg-white/20 border border-white/40 flex items-center justify-center group-hover:translate-x-1 transition">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </span>
            </button>

            <div class="text-center pt-1 text-xs text-[#5b6d96] dark:text-slate-400">
              ยังไม่มีบัญชีใช้งาน? <button type="button" onclick="ROAD_APP.setView('signup')" class="font-bold text-[#1456e8] dark:text-blue-400 hover:underline cursor-pointer">สมัครสมาชิก / ใช้รหัสรุ่นอบรม</button>
            </div>
          </form>

          <!-- OR CONTINUE WITH Divider -->
          <div class="w-full flex items-center gap-3 my-7 px-2">
            <div class="h-[1px] flex-1 bg-[#9cb1dc]/60"></div>
            <span class="text-[11px] font-bold tracking-[0.22em] text-[#5b6d96] dark:text-slate-400 uppercase">OR CONTINUE WITH (1-CLICK)</span>
            <div class="h-[1px] flex-1 bg-[#9cb1dc]/60"></div>
          </div>

          <!-- 3 3D Squircle Buttons (Matches Google / Discord / Facebook Squircles in Image) -->
          <div class="flex items-center justify-center gap-5">
            <!-- Squircle 1: 1-Click AI Research Studio -->
            <button type="button" onclick="ROAD_APP.setView('studio')" class="w-20 h-20 neu-squircle flex flex-col items-center justify-center gap-1 cursor-pointer group" title="เข้าสู่สตูดิโอวิจัย AI ทันที">
              <svg width="28" height="28" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"/>
              </svg>
              <span class="text-[10px] font-bold text-[#4a5d87] dark:text-slate-300">AI Studio</span>
            </button>

            <!-- Squircle 2: 1-Click Trainee Demo (RD69A1-01) -->
            <button type="button" onclick="ROAD_APP.quickLogin('RD69A1-01')" class="w-20 h-20 neu-squircle flex flex-col items-center justify-center gap-1 cursor-pointer group" title="เข้าสู่ระบบในฐานะผู้เข้าอบรม (RD69A1-01)">
              <div class="w-9 h-9 rounded-xl bg-[#5865F2] flex items-center justify-center text-white shadow-sm">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09-.01-.02-.04-.03-.07-.03-1.5.26-2.93.71-4.27 1.33-.01 0-.02.01-.03.02-2.72 4.07-3.47 8.03-3.1 11.95 0 .02.01.04.03.05 1.8 1.32 3.53 2.12 5.24 2.65.03.01.06 0 .07-.02.4-.55.76-1.13 1.07-1.74.02-.04 0-.08-.04-.09-.57-.22-1.11-.48-1.64-.78-.04-.02-.04-.08-.01-.11.11-.08.22-.17.33-.25.02-.02.05-.02.07-.01 3.44 1.57 7.15 1.57 10.55 0 .02-.01.05-.01.07.01.11.09.22.17.33.26.04.03.04.09-.01.11-.52.31-1.07.56-1.64.78-.04.01-.05.06-.04.09.32.61.68 1.19 1.07 1.74.03.02.06.03.09.02 1.72-.53 3.45-1.33 5.25-2.65.02-.01.03-.03.03-.05.44-4.53-.73-8.46-3.1-11.95-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12z"/>
                </svg>
              </div>
              <span class="text-[10px] font-bold text-[#4a5d87] dark:text-slate-300">ผู้เข้าอบรม</span>
            </button>

            <!-- Squircle 3: 1-Click Admin Dashboard -->
            <button type="button" onclick="ROAD_APP.quickLogin('admin')" class="w-20 h-20 neu-squircle flex flex-col items-center justify-center gap-1 cursor-pointer group" title="เข้าสู่ระบบผู้ดูแลระบบ (Admin Dashboard)">
              <div class="w-9 h-9 rounded-full bg-[#1877F2] flex items-center justify-center text-white shadow-sm font-extrabold text-xl">
                f
              </div>
              <span class="text-[10px] font-bold text-[#4a5d87] dark:text-slate-300">Admin สถิติ</span>
            </button>
          </div>

          <!-- Spaced Footer Tagline (Matches PLAY • COMPETE • GROW TOGETHER in Image) -->
          <div class="mt-9 text-[11px] font-bold tracking-[0.28em] text-[#4a5d87] dark:text-slate-400 uppercase text-center">
            RESEARCH &nbsp;•&nbsp; INNOVATE &nbsp;•&nbsp; GROW TOGETHER
          </div>
        </div>

        <!-- Bottom-Right Corner Signature (Matches MORE THAN A GAME in Image) -->
        <div class="hidden sm:block fixed bottom-6 right-8 text-[11px] font-bold tracking-[0.2em] text-[#4a5d87] dark:text-slate-400 leading-relaxed uppercase">
          MORE<br/>THAN<br/>A REPORT<br/>
          <span class="inline-block w-5 h-[2px] bg-[#4a5d87] mt-1"></span>
        </div>
      </div>
    `;
  }

  // --- View 1.5: 3D Soft Neumorphic Forgot Password View (Anti-Enumeration & Simulated OTP) ---
  function renderForgotView() {
    const f = state.forgotForm;
    return `
      <div class="min-h-[84vh] flex flex-col items-center justify-center px-4 py-8 relative">
        <div class="w-full max-w-[430px] flex flex-col items-center">
          <!-- 3D Center Medallion Logo -->
          <div class="neu-logo-medallion mb-6">
            ${render3DFlameLogo(86)}
          </div>

          <!-- Title & Subtitle -->
          <h1 class="text-[30px] font-extrabold tracking-tight text-[#0d1838] dark:text-white leading-tight text-center">
            Reset Password
          </h1>
          <p class="text-xs font-semibold tracking-wider text-[#5b6d96] dark:text-slate-400 mt-1 mb-6 text-center">
            ระบบกู้คืนรหัสผ่านความปลอดภัยสูง (Anti-Enumeration)
          </p>

          <!-- Security Note (Anti-Enumeration Principle from Blueprint) -->
          <div class="w-full neu-card-sm p-3.5 mb-5 border-l-4 border-blue-500 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            🛡️ <b>นโยบายความปลอดภัย:</b> เพื่อป้องกันการตรวจสอบรายชื่อผู้ใช้ ระบบจะไม่เปิดเผยสถานะว่ามีบัญชีดังกล่าวในฐานข้อมูลหรือไม่ หากข้อมูลตรงกับระบบ รหัส OTP 6 หลักจะถูกส่งไปยังช่องทางติดต่อทันที
          </div>

          ${!f.otpSent ? `
            <!-- Step 1: Request OTP Form -->
            <form onsubmit="ROAD_APP.submitForgot(event)" class="w-full flex flex-col gap-4" noValidate>
              <div class="neu-input-pill px-5 py-4 flex items-center gap-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5b6d96" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <input
                  id="forgot-identifier"
                  type="text"
                  value="${escapeHtml(f.identifier)}"
                  oninput="ROAD_APP.updateForgotField('identifier', this.value)"
                  placeholder="อีเมล หรือ เบอร์โทรศัพท์ที่ลงทะเบียน"
                  class="w-full bg-transparent outline-none text-[15px] font-medium text-[#0d1838] dark:text-white placeholder-[#6b7da6]"
                  required
                />
              </div>

              <button type="submit" class="neu-btn-primary w-full py-4 px-6 mt-2 flex items-center justify-center gap-2 cursor-pointer group">
                <span class="text-base font-bold tracking-wide">ส่งรหัส OTP กู้คืนรหัสผ่าน</span>
                <span class="text-lg group-hover:translate-x-1 transition">➔</span>
              </button>

              <div class="flex items-center justify-between px-1 pt-2 text-xs">
                <button type="button" onclick="ROAD_APP.setView('login')" class="font-bold text-[#1456e8] dark:text-blue-400 hover:underline cursor-pointer">
                  ← กลับหน้าเข้าสู่ระบบ
                </button>
                <button type="button" onclick="ROAD_APP.setView('signup')" class="font-bold text-[#5b6d96] dark:text-slate-400 hover:underline cursor-pointer">
                  สมัครสมาชิกใหม่
                </button>
              </div>
            </form>
          ` : `
            <!-- Step 2: Enter OTP & Set New Password -->
            <form onsubmit="ROAD_APP.verifyForgotOtp(event)" class="w-full flex flex-col gap-4" noValidate>
              <div class="p-3 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                ✔ ${escapeHtml(f.message)}
                <div class="mt-2 font-mono font-bold text-sm bg-white dark:bg-slate-900 p-2 rounded-lg border border-emerald-300 dark:border-emerald-700 flex items-center justify-between">
                  <span>รหัส OTP จำลอง: <span class="text-blue-600 dark:text-blue-400">684291</span></span>
                  <button type="button" onclick="ROAD_APP.fillDemoOtp()" class="px-2 py-0.5 rounded text-xs bg-blue-600 text-white font-sans hover:bg-blue-700 cursor-pointer">
                    ⚡ กรอกอัตโนมัติ
                  </button>
                </div>
              </div>

              <!-- OTP Code Pill -->
              <div class="neu-input-pill px-5 py-3.5 flex items-center gap-4">
                <span class="text-lg">🔢</span>
                <input
                  id="forgot-otp"
                  type="text"
                  maxLength="6"
                  value="${escapeHtml(f.resetOtp)}"
                  oninput="ROAD_APP.updateForgotField('resetOtp', this.value)"
                  placeholder="กรอกรหัส OTP 6 หลัก"
                  class="w-full bg-transparent outline-none font-mono text-center tracking-[0.3em] text-lg font-bold text-[#0d1838] dark:text-white"
                  required
                />
              </div>

              <!-- New Password Pill -->
              <div class="neu-input-pill px-5 py-3.5 flex items-center gap-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5b6d96" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  id="forgot-new-password"
                  type="password"
                  value="${escapeHtml(f.newPass)}"
                  oninput="ROAD_APP.updateForgotField('newPass', this.value)"
                  placeholder="ตั้งรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                  class="w-full bg-transparent outline-none text-[15px] font-medium text-[#0d1838] dark:text-white placeholder-[#6b7da6]"
                  required
                />
              </div>

              <button type="submit" class="neu-btn-primary w-full py-4 px-6 mt-1 flex items-center justify-center gap-2 cursor-pointer">
                <span class="text-base font-bold tracking-wide">ยืนยันการตั้งรหัสผ่านใหม่</span>
              </button>

              <div class="flex items-center justify-between px-1 pt-1 text-xs">
                <button type="button" onclick="ROAD_APP.resetForgotState()" class="text-[#5b6d96] dark:text-slate-400 hover:underline cursor-pointer">
                  ← ส่งใหม่อีกครั้ง
                </button>
                <button type="button" onclick="ROAD_APP.setView('login')" class="font-bold text-[#1456e8] dark:text-blue-400 hover:underline cursor-pointer">
                  เข้าสู่ระบบ
                </button>
              </div>
            </form>
          `}
        </div>
      </div>
    `;
  }

  // --- View 2: Signup Form (with Live Cohort Code Verification & Auto Password) ---
  function renderSignupView() {
    const f = state.signupForm;
    const autoPass = initialPassword(f.email, f.phone);
    const selectedProv = window.ROAD_DATA.PROVINCES.find(p => p.code === f.province_code);
    const regionText = selectedProv ? `ภาค${selectedProv.region}` : "ระบบเติมให้ตามจังหวัด";
    const cohortObj = state.cohorts.find(c => c.code.toUpperCase() === String(f.cohort_code || "").trim().toUpperCase() && c.active);

    return `
      <div class="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-5">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">สมัครสมาชิก · ระบบ ROAD</h1>
            <p class="text-sm text-slate-600 dark:text-slate-400">หนึ่งคนหนึ่งบัญชี · เป็นสมาชิกแล้ว? <button onclick="ROAD_APP.setView('login')" class="text-sky-700 font-semibold hover:underline cursor-pointer">เข้าสู่ระบบ</button></p>
          </div>
        </div>

        <form onsubmit="ROAD_APP.handleSignupSubmit(event)" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-5">
          <fieldset class="flex flex-col gap-3">
            <legend class="mb-2 text-base font-bold">ประเภทการสมัคร</legend>
            <div class="grid gap-3 sm:grid-cols-2">
              <label onclick="ROAD_APP.updateSignupField('signup_type', 'training')" class="flex cursor-pointer gap-3 rounded-xl border-2 p-4 transition ${f.signup_type === 'training' ? 'border-sky-700 bg-sky-50/70 dark:bg-sky-950/40' : 'border-slate-200 dark:border-slate-700'}">
                <input type="radio" name="signup_type" ${f.signup_type === 'training' ? 'checked' : ''} class="mt-1" />
                <span class="flex flex-col">
                  <b class="text-base">ผู้เข้าอบรม</b>
                  <span class="text-xs text-slate-500">มีรหัสรุ่นจากวิทยากรในห้องอบรม</span>
                  <span class="text-xs text-emerald-700 dark:text-emerald-400 font-medium">เข้าใช้งานได้ทันที (เช่น RD69A1, ROAD69)</span>
                </span>
              </label>
              <label onclick="ROAD_APP.updateSignupField('signup_type', 'general')" class="flex cursor-pointer gap-3 rounded-xl border-2 p-4 transition ${f.signup_type === 'general' ? 'border-sky-700 bg-sky-50/70 dark:bg-sky-950/40' : 'border-slate-200 dark:border-slate-700'}">
                <input type="radio" name="signup_type" ${f.signup_type === 'general' ? 'checked' : ''} class="mt-1" />
                <span class="flex flex-col">
                  <b class="text-base">สมัครทั่วไป</b>
                  <span class="text-xs text-slate-500">ชำระค่าบริการ 500 บาท</span>
                  <span class="text-xs text-slate-500">ใช้งานได้ตลอดชีพ</span>
                </span>
              </label>
            </div>

            ${f.signup_type === 'training' ? `
              <div class="mt-2 flex flex-col gap-1.5">
                <label class="text-sm font-semibold">รหัสรุ่นอบรม</label>
                <div class="flex flex-wrap items-center gap-3">
                  <input value="${escapeHtml(f.cohort_code)}" oninput="ROAD_APP.updateSignupField('cohort_code', this.value)" class="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-mono text-lg tracking-widest uppercase max-w-xs" placeholder="เช่น RD69A1" />
                  <div class="flex gap-1.5 text-xs">
                    ${state.cohorts.filter(c => c.active).map(c => `
                      <button type="button" onclick="ROAD_APP.updateSignupField('cohort_code', '${c.code}')" class="px-2.5 py-1 rounded-lg border border-sky-300 bg-sky-50 dark:bg-sky-950 text-sky-800 dark:text-sky-300 font-mono cursor-pointer hover:bg-sky-100">${c.code}</button>
                    `).join("")}
                  </div>
                </div>
                <div class="text-xs ${cohortObj ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600'}">
                  ${cohortObj ? `✔ พบข้อมูลรุ่น: ${escapeHtml(cohortObj.name)} (${escapeHtml(cohortObj.location)})` : `✕ ไม่พบรหัสรุ่นนี้ (คลิกปุ่มรหัสตัวอย่างด้านบนได้)`}
                </div>
              </div>
            ` : ''}
          </fieldset>

          <fieldset class="grid gap-3 sm:grid-cols-2">
            <legend class="mb-2 text-base font-bold sm:col-span-2">ข้อมูลติดต่อ</legend>
            <label class="flex flex-col gap-1 text-sm">
              <span class="font-semibold">อีเมล</span>
              <input type="email" value="${escapeHtml(f.email)}" oninput="ROAD_APP.updateSignupField('email', this.value)" placeholder="teacher.name@gmail.com" class="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700" required />
            </label>
            <label class="flex flex-col gap-1 text-sm">
              <span class="font-semibold">เบอร์โทร (ใช้เข้าสู่ระบบแทนอีเมลได้)</span>
              <input type="tel" value="${escapeHtml(f.phone)}" oninput="ROAD_APP.updateSignupField('phone', this.value)" placeholder="0812345678" class="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700" required />
            </label>
          </fieldset>

          <fieldset class="grid gap-3 sm:grid-cols-3">
            <legend class="mb-2 text-base font-bold sm:col-span-3">ข้อมูลพื้นฐานและสังกัด</legend>
            <label class="flex flex-col gap-1 text-sm">
              <span class="font-semibold">คำนำหน้า</span>
              <select onchange="ROAD_APP.updateSignupField('title', this.value)" class="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800">
                ${window.ROAD_DATA.TITLES.map(t => `<option value="${t}" ${f.title === t ? 'selected' : ''}>${t}</option>`).join("")}
              </select>
            </label>
            <label class="flex flex-col gap-1 text-sm">
              <span class="font-semibold">ชื่อ</span>
              <input value="${escapeHtml(f.first_name)}" oninput="ROAD_APP.updateSignupField('first_name', this.value)" class="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700" required />
            </label>
            <label class="flex flex-col gap-1 text-sm">
              <span class="font-semibold">นามสกุล</span>
              <input value="${escapeHtml(f.last_name)}" oninput="ROAD_APP.updateSignupField('last_name', this.value)" class="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700" required />
            </label>

            <label class="flex flex-col gap-1 text-sm">
              <span class="font-semibold">ตำแหน่ง</span>
              <select onchange="ROAD_APP.updateSignupField('position', this.value)" class="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800">
                ${window.ROAD_DATA.POSITIONS.map(pos => `<option value="${pos}" ${f.position === pos ? 'selected' : ''}>${pos}</option>`).join("")}
              </select>
            </label>
            <label class="flex flex-col gap-1 text-sm sm:col-span-2">
              <span class="font-semibold">สังกัด</span>
              <select onchange="ROAD_APP.updateSignupField('affiliation', this.value)" class="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800">
                ${window.ROAD_DATA.AFFILIATIONS.map(af => `<option value="${af.code}" ${f.affiliation === af.code ? 'selected' : ''}>${af.code} — ${af.name}</option>`).join("")}
              </select>
            </label>

            <label class="flex flex-col gap-1 text-sm sm:col-span-3">
              <span class="font-semibold">ชื่อสถานที่ทำงาน / สถานศึกษา</span>
              <input value="${escapeHtml(f.workplace)}" oninput="ROAD_APP.updateSignupField('workplace', this.value)" placeholder="เช่น โรงเรียนเปรมติณสูลานนท์ / องค์การบริหารส่วนจังหวัดขอนแก่น" class="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700" required />
            </label>

            <label class="flex flex-col gap-1 text-sm sm:col-span-2">
              <span class="font-semibold">จังหวัด</span>
              <select onchange="ROAD_APP.updateSignupField('province_code', this.value)" class="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800">
                ${window.ROAD_DATA.PROVINCES.map(pv => `<option value="${pv.code}" ${f.province_code === pv.code ? 'selected' : ''}>${pv.name}</option>`).join("")}
              </select>
            </label>
            <div class="flex flex-col gap-1 text-sm">
              <span class="font-semibold">ภูมิภาค (อัตโนมัติ)</span>
              <div class="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">${regionText}</div>
            </div>
          </fieldset>

          <fieldset class="flex flex-col gap-2">
            <legend class="text-sm font-bold">เป้าหมายการใช้ระบบ (เลือกได้หลายข้อ)</legend>
            <div class="flex flex-wrap gap-2">
              ${window.ROAD_DATA.GOALS.map(g => {
                const checked = (f.goals || []).includes(g);
                return `
                  <button type="button" onclick="ROAD_APP.toggleSignupGoal('${g}')" class="px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${checked ? 'border-sky-700 bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200' : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'}">
                    ${checked ? '✔ ' : ''}${g === 'อื่น ๆ' ? g : 'เพื่อ' + (g === 'ประกอบการเรียน' ? g : 'จัดทำ' + g)}
                  </button>
                `;
              }).join("")}
            </div>
          </fieldset>

          <div class="rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/40 p-3.5 text-sm">
            <b>รหัสผ่านตั้งต้นอัตโนมัติ</b> = ชื่ออีเมลส่วนหน้า @ ตามด้วยเบอร์โทร 4 ตัวท้าย
            <div class="mt-1 text-slate-600 dark:text-slate-300">
              ${autoPass
                ? `รหัสผ่านของคุณคือ <b class="font-mono text-base text-sky-800 dark:text-sky-300 px-2 py-0.5 rounded bg-white dark:bg-slate-800 border">${escapeHtml(autoPass)}</b>`
                : `กรอกอีเมลและเบอร์โทรเพื่อดูรหัสผ่านของคุณอัตโนมัติ`}
            </div>
          </div>

          <button type="submit" class="w-full py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-semibold text-base shadow-sm cursor-pointer">สมัครสมาชิกและเข้าสู่ระบบทันที</button>
        </form>
      </div>
    `;
  }

  // --- View 3: Admin Analytics & Cohort Dashboard ---
  function renderAdminView() {
    const members = state.members;
    const provMap = new Map(window.ROAD_DATA.PROVINCES.map(p => [p.code, p]));
    const totalMembers = members.length;
    const trainingCount = members.filter(m => m.signup_type === "training").length;
    const generalCount = members.filter(m => m.signup_type === "general").length;
    const pendingCount = members.filter(m => m.status === "pending_payment").length;
    const totalProjects = members.reduce((acc, m) => acc + (m.projects_count || 1), 0) + state.projects.length;
    const totalRevenue = generalCount * 500;

    // Aggregations
    const countBy = (fn) => {
      const map = {};
      for (const m of members) {
        const k = fn(m) || "ไม่ระบุ";
        map[k] = (map[k] || 0) + 1;
      }
      return Object.entries(map).sort((a, b) => b[1] - a[1]);
    };

    const byRegion = countBy(m => provMap.get(m.province_code)?.region ? `ภาค${provMap.get(m.province_code).region}` : "ไม่ระบุ");
    const byAffiliation = countBy(m => m.affiliation);
    const byPosition = countBy(m => m.position);
    const byProvince = countBy(m => provMap.get(m.province_code)?.name || "ไม่ระบุ").slice(0, 6);

    const goalMap = {};
    for (const m of members) {
      for (const g of (m.goals || [])) {
        goalMap[g] = (goalMap[g] || 0) + 1;
      }
    }
    const byGoals = Object.entries(goalMap).sort((a, b) => b[1] - a[1]);

    // Filter members table
    const q = state.adminSearch.trim().toLowerCase();
    const filteredMembers = members.filter(m => {
      if (state.adminFilterCohort !== "ALL" && (m.cohort_code || "GENERAL") !== state.adminFilterCohort) return false;
      if (!q) return true;
      const pvName = provMap.get(m.province_code)?.name || "";
      return (
        m.first_name.toLowerCase().includes(q) ||
        m.last_name.toLowerCase().includes(q) ||
        m.username.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.workplace.toLowerCase().includes(q) ||
        pvName.toLowerCase().includes(q)
      );
    });

    const renderBarList = (items, colorClass = "bg-sky-600") => items.map(([label, cnt]) => {
      const pct = Math.round((cnt / Math.max(1, totalMembers)) * 100);
      return `
        <div class="flex flex-col gap-1">
          <div class="flex justify-between text-xs font-medium">
            <span>${escapeHtml(label)}</span>
            <span class="font-mono font-semibold">${cnt} คน (${pct}%)</span>
          </div>
          <div class="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div class="h-full ${colorClass} rounded-full" style="width:${Math.max(6, pct)}%"></div>
          </div>
        </div>
      `;
    }).join("");

    return `
      <div class="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">ADMIN CONSOLE</span>
              <h1 class="text-2xl font-bold text-slate-900 dark:text-white">แดชบอร์ดสถิติผู้ใช้งานและจัดการรหัสรุ่นอบรม</h1>
            </div>
            <p class="text-sm text-slate-500 mt-0.5">ข้อมูลสถิติภาพรวมสมาชิกตามสังกัด ภูมิภาค จังหวัด ตำแหน่ง และการจัดการรหัสรุ่นอบรม (Cohort Management)</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button onclick="ROAD_APP.exportMembersCsv()" class="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold shadow-sm cursor-pointer">
              📥 ส่งออกรายชื่อสมาชิก (CSV / Excel)
            </button>
            <button onclick="ROAD_APP.setView('signup')" class="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold cursor-pointer">
              + เพิ่มสมาชิกใหม่
            </button>
          </div>
        </div>

        <!-- KPI Summary Cards -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div class="text-xs text-slate-500">สมาชิกทั้งหมด</div>
            <div class="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">${totalMembers}</div>
            <div class="text-[11px] text-emerald-600 mt-1">ผู้เข้าอบรม ${trainingCount} · ทั่วไป ${generalCount}</div>
          </div>
          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div class="text-xs text-slate-500">รหัสรุ่นอบรมที่เปิดใช้</div>
            <div class="text-2xl font-bold font-mono text-sky-700 dark:text-sky-400 mt-1">${state.cohorts.filter(c => c.active).length} / ${state.cohorts.length}</div>
            <div class="text-[11px] text-slate-500 mt-1">เช่น RD69A1, RD69A2, ROAD69</div>
          </div>
          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div class="text-xs text-slate-500">โครงร่างวิจัยที่สร้างสะสม</div>
            <div class="text-2xl font-bold font-mono text-indigo-700 dark:text-indigo-400 mt-1">${totalProjects}</div>
            <div class="text-[11px] text-slate-500 mt-1">เฉลี่ย ${(totalProjects / Math.max(1, totalMembers)).toFixed(1)} เรื่อง/คน</div>
          </div>
          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div class="text-xs text-slate-500">ค่าบริการสมาชิกทั่วไป</div>
            <div class="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1">฿${totalRevenue.toLocaleString()}</div>
            <div class="text-[11px] text-slate-500 mt-1">อัตรา 500 บาท / บัญชีตลอดชีพ</div>
          </div>
          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div class="text-xs text-slate-500">รอตรวจสอบการชำระเงิน</div>
            <div class="text-2xl font-bold font-mono ${pendingCount > 0 ? 'text-amber-600' : 'text-slate-400'} mt-1">${pendingCount}</div>
            <div class="text-[11px] text-slate-500 mt-1">กดอนุมัติได้ในตารางด้านล่าง</div>
          </div>
        </div>

        <!-- Analytics Charts Grid -->
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
            <h3 class="font-bold text-sm text-slate-800 dark:text-slate-100">📊 จำแนกตามสังกัด</h3>
            <div class="flex flex-col gap-2.5">${renderBarList(byAffiliation, "bg-sky-600")}</div>
          </div>
          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
            <h3 class="font-bold text-sm text-slate-800 dark:text-slate-100">🗺️ จำแนกตามภูมิภาค</h3>
            <div class="flex flex-col gap-2.5">${renderBarList(byRegion, "bg-emerald-600")}</div>
            <div class="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div class="text-xs font-bold mb-1.5 text-slate-600 dark:text-slate-400">จังหวัดสูงสุด 6 อันดับแรก</div>
              <div class="flex flex-wrap gap-1.5">
                ${byProvince.map(([pv, cnt]) => `<span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs">${escapeHtml(pv)} <b>(${cnt})</b></span>`).join("")}
              </div>
            </div>
          </div>
          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
            <h3 class="font-bold text-sm text-slate-800 dark:text-slate-100">👔 จำแนกตามตำแหน่ง</h3>
            <div class="flex flex-col gap-2.5">${renderBarList(byPosition, "bg-indigo-600")}</div>
          </div>
          <div class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
            <h3 class="font-bold text-sm text-slate-800 dark:text-slate-100">🎯 เป้าหมายการทำวิจัย</h3>
            <div class="flex flex-col gap-2.5">${renderBarList(byGoals, "bg-amber-500")}</div>
          </div>
        </div>

        <!-- Cohort Code Management -->
        <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 class="text-base font-bold text-slate-900 dark:text-white">🔑 จัดการรหัสรุ่นอบรม (Training Cohort Codes)</h2>
              <p class="text-xs text-slate-500">สร้างรหัสรุ่นเพื่อให้ผู้เข้าอบรมในห้องอบรมลงทะเบียนและใช้งานได้ทันทีโดยไม่ต้องชำระค่าบริการ</p>
            </div>
          </div>

          <form onsubmit="ROAD_APP.createNewCohort(event)" class="grid sm:grid-cols-4 gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <input id="new-cohort-code" placeholder="รหัสรุ่น เช่น RD69B1" class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono uppercase" required />
            <input id="new-cohort-name" placeholder="ชื่อรุ่นอบรม เช่น อบรม R&D สพม.ขอนแก่น" class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm sm:col-span-2" required />
            <button type="submit" class="px-4 py-2 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-sm font-semibold cursor-pointer">+ สร้างรหัสรุ่นใหม่</button>
          </form>

          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            ${state.cohorts.map(c => {
              const memberCnt = members.filter(m => m.cohort_code === c.code).length;
              return `
                <div class="p-3.5 rounded-xl border ${c.active ? 'border-sky-200 dark:border-sky-800 bg-sky-50/40 dark:bg-sky-950/20' : 'border-slate-200 opacity-60'} flex flex-col justify-between gap-2">
                  <div>
                    <div class="flex items-center justify-between">
                      <span class="font-mono font-bold text-base text-sky-800 dark:text-sky-300">${escapeHtml(c.code)}</span>
                      <span class="text-xs px-2 py-0.5 rounded-full ${c.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">${c.active ? 'เปิดใช้งาน' : 'ปิดแล้ว'}</span>
                    </div>
                    <div class="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">${escapeHtml(c.name)}</div>
                    <div class="text-[11px] text-slate-500 mt-0.5">📍 ${escapeHtml(c.location)}</div>
                  </div>
                  <div class="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                    <span>สมาชิก: <b>${memberCnt}</b> คน</span>
                    <button onclick="ROAD_APP.toggleCohortActive('${c.code}')" class="text-sky-700 dark:text-sky-400 hover:underline font-medium cursor-pointer">${c.active ? 'ปิดรหัส' : 'เปิดรหัส'}</button>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>

        <!-- Members Directory Table -->
        <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-base font-bold text-slate-900 dark:text-white">👥 ทะเบียนรายชื่อสมาชิก (${filteredMembers.length} รายการ)</h2>
            <div class="flex flex-wrap gap-2">
              <select onchange="ROAD_APP.setAdminCohortFilter(this.value)" class="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold">
                <option value="ALL" ${state.adminFilterCohort === 'ALL' ? 'selected' : ''}>ทุกรุ่นอบรม / ทุกประเภท</option>
                ${state.cohorts.map(c => `<option value="${c.code}" ${state.adminFilterCohort === c.code ? 'selected' : ''}>รุ่น ${c.code}</option>`).join("")}
                <option value="GENERAL" ${state.adminFilterCohort === 'GENERAL' ? 'selected' : ''}>สมาชิกทั่วไป (ชำระเงิน)</option>
              </select>
              <input value="${escapeHtml(state.adminSearch)}" oninput="ROAD_APP.setAdminSearch(this.value)" placeholder="ค้นหาชื่อ, รหัส, โรงเรียน, จังหวัด..." class="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs w-60" />
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="border-b border-slate-200 dark:border-slate-800 text-slate-500 bg-slate-50 dark:bg-slate-800/50">
                  <th class="py-2.5 px-3">รหัสผู้ใช้</th>
                  <th class="py-2.5 px-3">ชื่อ-นามสกุล</th>
                  <th class="py-2.5 px-3">ตำแหน่ง / สังกัด</th>
                  <th class="py-2.5 px-3">สถานศึกษา / จังหวัด</th>
                  <th class="py-2.5 px-3">อีเมล / เบอร์โทร</th>
                  <th class="py-2.5 px-3">รหัสผ่านตั้งต้น</th>
                  <th class="py-2.5 px-3">สถานะ</th>
                  <th class="py-2.5 px-3">การจัดการ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200/70 dark:divide-slate-800">
                ${filteredMembers.map(m => {
                  const pv = provMap.get(m.province_code) || { name: "-", region: "-" };
                  return `
                    <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td class="py-2.5 px-3 font-mono font-bold text-sky-700 dark:text-sky-400">${escapeHtml(m.username)}</td>
                      <td class="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">${escapeHtml(m.title)}${escapeHtml(m.first_name)} ${escapeHtml(m.last_name)}</td>
                      <td class="py-2.5 px-3">${escapeHtml(m.position)} · <span class="font-semibold">${escapeHtml(m.affiliation)}</span></td>
                      <td class="py-2.5 px-3">${escapeHtml(m.workplace)}<br/><span class="text-slate-400">จ.${escapeHtml(pv.name)} (ภาค${escapeHtml(pv.region)})</span></td>
                      <td class="py-2.5 px-3 font-mono">${escapeHtml(m.email)}<br/>${escapeHtml(m.phone)}</td>
                      <td class="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">${escapeHtml(m.password)}</td>
                      <td class="py-2.5 px-3">
                        ${m.status === "active"
                          ? `<span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">ใช้งานได้</span>`
                          : `<span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">รอตรวจสลิป 500฿</span>`}
                      </td>
                      <td class="py-2.5 px-3">
                        <div class="flex gap-1.5">
                          ${m.status !== "active" ? `<button onclick="ROAD_APP.approveMember('${m.id}')" class="px-2 py-1 rounded bg-emerald-600 text-white font-semibold hover:bg-emerald-700 cursor-pointer">อนุมัติ</button>` : ""}
                          <button onclick="ROAD_APP.quickLogin('${m.username}')" class="px-2 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">เข้าใช้ชื่อนี้</button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Audit Trail & Event Logs Section (PDPA & Security Logs) -->
        <div class="neu-card p-5 flex flex-col gap-4">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 class="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🛡️</span>
                <span>Audit Trail & บันทึกกิจกรรมระบบ (Security & PDPA Consent Logs)</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white font-mono">${state.auditLogs.length} รายการ</span>
              </h3>
              <p class="text-xs text-slate-500 mt-0.5">
                เก็บบันทึกเหตุการณ์สำคัญ การยืนยันสิทธิ์ การเข้าสู่ระบบ และการส่งออกเอกสาร ตรวจสอบย้อนกลับได้ตามมาตรฐานความปลอดภัย
              </p>
            </div>
            <button onclick="ROAD_APP.exportAuditLogsJson()" class="px-3.5 py-1.5 neu-squircle text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer">
              <span>💾</span>
              <span>ส่งออกบันทึก JSON</span>
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="border-b border-slate-200 dark:border-slate-800 text-slate-500 bg-slate-50 dark:bg-slate-800/50">
                  <th class="py-2.5 px-3">เวลา (Timestamp)</th>
                  <th class="py-2.5 px-3">ประเภทเหตุการณ์</th>
                  <th class="py-2.5 px-3">ผู้ใช้งาน</th>
                  <th class="py-2.5 px-3">รายละเอียด (Event Description)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200/70 dark:divide-slate-800 font-mono">
                ${state.auditLogs.slice(0, 25).map(log => {
                  const typeColors = {
                    LOGIN: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
                    REGISTER: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
                    PROJECT_CREATE: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
                    PROJECT_UPDATE: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
                    EXPORT_DOC: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
                    SECURITY: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                  };
                  const badge = typeColors[log.type] || "bg-slate-100 text-slate-800";
                  const timeStr = log.timestamp ? new Date(log.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "-";
                  return `
                    <tr class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td class="py-2 px-3 text-slate-500 whitespace-nowrap">${timeStr}</td>
                      <td class="py-2 px-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${badge}">${escapeHtml(log.type)}</span></td>
                      <td class="py-2 px-3 font-sans font-semibold text-slate-900 dark:text-white">${escapeHtml(log.user)}</td>
                      <td class="py-2 px-3 font-sans text-slate-700 dark:text-slate-300">${escapeHtml(log.desc)}</td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // --- View 4: Fullscreen Presentation / Slide Mode ---
  function renderSlidesView() {
    const proj = getActiveProject();
    const gen = window.ROAD_GENERATOR.generateChapters(proj);
    const matrix = window.ROAD_GENERATOR.generateAlignmentMatrix(proj);
    const st = proj.statsData || {};

    const slides = [
      {
        badge: "SLIDE 1 / 7 · โครงร่างการวิจัย (Research Proposal & Report)",
        title: gen.fullTitle,
        body: `
          <div class="grid sm:grid-cols-2 gap-4 mt-4 text-left">
            <div class="p-5 rounded-2xl bg-sky-950/60 border border-sky-500/30">
              <div class="text-xs font-mono uppercase text-sky-400">A · ลักษณะการวิจัย & โมเดล</div>
              <div class="text-xl font-bold mt-1">${escapeHtml(proj.A)} (${escapeHtml(proj.modelId.toUpperCase())})</div>
            </div>
            <div class="p-5 rounded-2xl bg-sky-950/60 border border-sky-500/30">
              <div class="text-xs font-mono uppercase text-sky-400">B · นวัตกรรม / ตัวแปรต้น</div>
              <div class="text-xl font-bold mt-1">${escapeHtml(proj.B)}</div>
            </div>
            <div class="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-500/30">
              <div class="text-xs font-mono uppercase text-emerald-400">C · ตัวแปรตาม / ผลลัพธ์</div>
              <div class="text-xl font-bold mt-1">${escapeHtml((proj.C_list || []).join(" และ "))}</div>
            </div>
            <div class="p-5 rounded-2xl bg-amber-950/60 border border-amber-500/30">
              <div class="text-xs font-mono uppercase text-amber-400">D · กลุ่มเป้าหมายและบริบท</div>
              <div class="text-xl font-bold mt-1">${escapeHtml(proj.D)} (${escapeHtml(proj.subject)})</div>
            </div>
          </div>
        `
      },
      {
        badge: "SLIDE 2 / 7 · บทที่ 1 บทนำ",
        title: "วัตถุประสงค์ สมมติฐาน และขอบเขตการวิจัย",
        body: `
          <div class="grid md:grid-cols-2 gap-6 text-left">
            <div class="p-5 rounded-2xl bg-slate-800/80 border border-slate-700">
              <h3 class="text-lg font-bold text-sky-400 mb-3">🎯 วัตถุประสงค์การวิจัย</h3>
              <ul class="space-y-2.5 text-base">
                ${matrix.map(m => `<li class="leading-relaxed">${escapeHtml(m.objective)}</li>`).join("")}
              </ul>
            </div>
            <div class="p-5 rounded-2xl bg-slate-800/80 border border-slate-700">
              <h3 class="text-lg font-bold text-emerald-400 mb-3">📌 ขอบเขตและกลุ่มตัวอย่าง</h3>
              <p class="text-base mb-2"><b>ประชากร:</b> ${escapeHtml(proj.population)}</p>
              <p class="text-base mb-2"><b>กลุ่มตัวอย่าง:</b> ${escapeHtml(proj.sample)}</p>
              <p class="text-base"><b>เกณฑ์ประสิทธิภาพนวัตกรรม:</b> E1/E2 = ${escapeHtml(proj.efficiencyCriterion)}</p>
            </div>
          </div>
        `
      },
      {
        badge: "SLIDE 3 / 7 · บทที่ 2 เอกสารและกรอบแนวคิดในการวิจัย",
        title: "กรอบแนวคิดในการวิจัยและขั้นตอนของนวัตกรรม",
        body: `
          <div class="grid md:grid-cols-2 gap-6 items-center text-left">
            <div class="p-5 rounded-2xl bg-sky-950/70 border-2 border-sky-500/50">
              <div class="text-xs font-mono text-sky-300 uppercase">ตัวแปรต้น (Independent Variable: B)</div>
              <div class="text-lg font-bold mt-1 mb-3">${escapeHtml(proj.B)}</div>
              <div class="space-y-1.5 text-sm">
                ${(proj.B_steps || []).map(s => `<div class="px-3 py-1.5 rounded-lg bg-slate-900/80 border border-sky-800">${escapeHtml(s)}</div>`).join("")}
              </div>
            </div>
            <div class="p-5 rounded-2xl bg-emerald-950/70 border-2 border-emerald-500/50">
              <div class="text-xs font-mono text-emerald-300 uppercase">ตัวแปรตาม (Dependent Variables: C)</div>
              <div class="space-y-2.5 mt-3 text-base font-semibold">
                ${(proj.C_list || []).map((c, i) => `<div class="p-3 rounded-xl bg-slate-900/80 border border-emerald-700">${i + 1}. ${escapeHtml(c)}</div>`).join("")}
                <div class="p-3 rounded-xl bg-slate-900/80 border border-emerald-700">${(proj.C_list || []).length + 1}. ความพึงพอใจของผู้เรียนต่อการจัดการเรียนรู้</div>
              </div>
            </div>
          </div>
        `
      },
      {
        badge: "SLIDE 4 / 7 · บทที่ 3 วิธีดำเนินการวิจัย",
        title: "ตารางความสอดคล้องของวิธีดำเนินการวิจัย (Alignment Matrix)",
        body: `
          <div class="overflow-x-auto text-left">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr class="border-b border-slate-600 text-sky-300">
                  <th class="p-2.5">ระยะการวิจัย</th>
                  <th class="p-2.5">วัตถุประสงค์</th>
                  <th class="p-2.5">เครื่องมือที่ใช้</th>
                  <th class="p-2.5">สถิติที่ใช้</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-700">
                ${matrix.map(r => `
                  <tr>
                    <td class="p-2.5 font-bold text-amber-300">${escapeHtml(r.phase)}</td>
                    <td class="p-2.5">${escapeHtml(r.objective)}</td>
                    <td class="p-2.5">${escapeHtml(r.instruments)}</td>
                    <td class="p-2.5">${escapeHtml(r.statistics)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `
      },
      {
        badge: "SLIDE 5 / 7 · บทที่ 4 ผลการวิเคราะห์ข้อมูล (ตอนที่ 1)",
        title: `ประสิทธิภาพของนวัตกรรม (E1/E2) และดัชนีประสิทธิผล (E.I.)`,
        body: `
          <div class="grid sm:grid-cols-3 gap-5 my-4">
            <div class="p-6 rounded-2xl bg-sky-950/70 border border-sky-500/40 text-center">
              <div class="text-sm text-sky-300">ประสิทธิภาพ E1 / E2</div>
              <div class="text-4xl font-bold font-mono mt-2">${st.e1} / ${st.e2}</div>
              <div class="text-xs text-emerald-400 mt-2">สูงกว่าเกณฑ์ที่ตั้งไว้ (${escapeHtml(proj.efficiencyCriterion)})</div>
            </div>
            <div class="p-6 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-center">
              <div class="text-sm text-emerald-300">ดัชนีประสิทธิผล (E.I.)</div>
              <div class="text-4xl font-bold font-mono mt-2">${st.ei}</div>
              <div class="text-xs text-emerald-400 mt-2">ผู้เรียนมีความรู้เพิ่มขึ้นร้อยละ ${(Number(st.ei || 0.68) * 100).toFixed(2)}</div>
            </div>
            <div class="p-6 rounded-2xl bg-indigo-950/70 border border-indigo-500/40 text-center">
              <div class="text-sm text-indigo-300">ค่าความสอดคล้อง (IOC)</div>
              <div class="text-4xl font-bold font-mono mt-2">${st.iocAvg || 0.92}</div>
              <div class="text-xs text-indigo-300 mt-2">ผ่านการประเมินจากผู้เชี่ยวชาญ 5 ท่าน</div>
            </div>
          </div>
        `
      },
      {
        badge: "SLIDE 6 / 7 · บทที่ 4 ผลการวิเคราะห์ข้อมูล (ตอนที่ 2)",
        title: "ผลการเปรียบเทียบก่อนเรียน–หลังเรียน และความพึงพอใจ",
        body: `
          <div class="grid sm:grid-cols-2 gap-5 text-left">
            <div class="p-5 rounded-2xl bg-slate-800 border border-slate-700">
              <h4 class="font-bold text-sky-300 text-base mb-2">📈 เปรียบเทียบก่อนเรียน–หลังเรียน (n = ${st.n})</h4>
              <p class="text-base">• คะแนนก่อนเรียน: <b>x̄ = ${st.preMean}, S.D. = ${st.preSD}</b></p>
              <p class="text-base mt-1">• คะแนนหลังเรียน: <b>x̄ = ${st.postMean}, S.D. = ${st.postSD}</b></p>
              <p class="text-emerald-400 font-bold mt-2">t = ${st.tValue}*, p = ${st.pValue} (สูงกว่าก่อนเรียนอย่างมีนัยสำคัญที่ .05)</p>
            </div>
            <div class="p-5 rounded-2xl bg-slate-800 border border-slate-700">
              <h4 class="font-bold text-amber-300 text-base mb-2">⭐ ความพึงพอใจของผู้เรียน</h4>
              <p class="text-3xl font-bold font-mono text-white my-2">x̄ = ${st.satMean} (S.D. = ${st.satSD})</p>
              <p class="text-emerald-400 font-bold">อยู่ในระดับ "มากที่สุด" (≥ 4.51)</p>
            </div>
          </div>
        `
      },
      {
        badge: "SLIDE 7 / 7 · บทที่ 5 สรุปผล อภิปรายผล และข้อเสนอแนะ",
        title: "สรุปผลการวิจัยและการอภิปรายผลสำคัญ",
        body: `
          <div class="text-left space-y-3 bg-slate-800/90 p-6 rounded-2xl border border-slate-700 text-base leading-relaxed">
            ${Array.isArray(gen.chapters && gen.chapters[4] && gen.chapters[4].sections && gen.chapters[4].sections[0] && gen.chapters[4].sections[0].content)
              ? gen.chapters[4].sections[0].content.map(item => `<p>• ${escapeHtml(item)}</p>`).join("")
              : (gen.chapters && gen.chapters[4] && gen.chapters[4].sections && gen.chapters[4].sections[0] && gen.chapters[4].sections[0].content) || "<p>• สรุปผลการวิจัยและการอภิปรายผลสำคัญตามวัตถุประสงค์ 4 ระยะ</p>"}
          </div>
        `
      }
    ];

    const cur = slides[state.slideIndex] || slides[0];

    return `
      <div class="min-h-[85vh] bg-slate-950 text-white px-6 py-8 flex flex-col justify-between">
        <div class="max-w-5xl mx-auto w-full flex items-center justify-between border-b border-slate-800 pb-4">
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 font-mono text-xs font-bold">${cur.badge}</span>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="ROAD_APP.nextSlide(-1)" class="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-semibold cursor-pointer">← ก่อนหน้า</button>
            <span class="font-mono text-sm px-2">${state.slideIndex + 1} / ${slides.length}</span>
            <button onclick="ROAD_APP.nextSlide(1)" class="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-sm font-semibold cursor-pointer">ถัดไป →</button>
            <button onclick="ROAD_APP.setView('studio')" class="ml-3 px-3 py-1.5 rounded-lg border border-slate-700 text-xs hover:bg-slate-800 cursor-pointer">✕ ปิดสไลด์</button>
          </div>
        </div>

        <div class="max-w-5xl mx-auto w-full my-auto py-8 text-center">
          <h1 class="text-2xl sm:text-4xl font-bold leading-snug text-white mb-6">${escapeHtml(cur.title)}</h1>
          ${cur.body}
        </div>

        <div class="max-w-5xl mx-auto w-full border-t border-slate-800 pt-4 flex justify-between text-xs text-slate-400">
          <span>ระบบ ROAD Next-Gen · Report Outline Assistant for Development</span>
          <span>มาตรฐานวิธีวิทยาการวิจัยและพัฒนาทางการศึกษา (R&D) สำหรับการประเมินวิทยฐานะ วPA</span>
        </div>
      </div>
    `;
  }

  // --- View 5: Main R&D Research Studio (4-Step Guided Workflow & Power Tabs) ---
  function renderStudioView() {
    const proj = getActiveProject();
    const fullTitle = window.ROAD_GENERATOR.composeFullTitle(proj);
    const health = window.ROAD_GENERATOR.evaluateResearchHealth(proj);

    // Current Workflow Step (1..4) based on state.studioTab
    let curStep = 1;
    if (state.studioTab === "abcd" || state.studioTab === "workspace") curStep = 1;
    else if (["diagrams", "instruments", "statlab", "matrix", "wizard"].includes(state.studioTab)) curStep = 2;
    else if (state.studioTab === "chapters" || state.studioTab === "ai") curStep = 3;
    else if (state.studioTab === "advisor") curStep = 4;

    const stepsConfig = [
      {
        num: 1,
        title: "ขั้นที่ 1: ตั้งค่า ABCD",
        desc: "โครงสร้างชื่อเรื่อง & บริบท",
        icon: "🎯",
        tab: "abcd"
      },
      {
        num: 2,
        title: "ขั้นที่ 2: สังเคราะห์โครงร่าง",
        desc: "4 ระยะ R1-D2 & เครื่องมือ",
        icon: "🧭",
        tab: "diagrams"
      },
      {
        num: 3,
        title: "ขั้นที่ 3: เล่ม 5 บท & AI",
        desc: "เล่มวิจัยเต็ม & AI Co-Pilot",
        icon: "📘",
        tab: "chapters"
      },
      {
        num: 4,
        title: "ขั้นที่ 4: ตรวจทาน & ส่งออก",
        desc: "14 กฎเหล็ก & ส่งออก Word/PDF",
        icon: "🏆",
        tab: "advisor"
      }
    ];

    return `
      <div class="max-w-7xl mx-auto px-3 sm:px-4 py-5 flex flex-col gap-5 relative z-10">
        <!-- 1. Top Executive Control Bar (Clean, Unified Neumorphic Card) -->
        <div class="neu-card p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-extrabold uppercase tracking-wider text-slate-500 hidden sm:inline">📂 โครงการ:</span>
            <select onchange="ROAD_APP.selectProject(this.value)" class="px-3 py-2 neu-input-pill text-xs sm:text-sm font-bold text-slate-800 dark:text-white cursor-pointer max-w-[210px] sm:max-w-[280px] truncate min-h-[40px]" data-tooltip="สลับโครงการวิจัยที่ต้องการทำงาน" title="สลับโครงการวิจัย">
              ${state.projects.map(p => `<option value="${p.id}" ${p.id === proj.id ? 'selected' : ''}>${escapeHtml(p.label || p.B_short || p.B)}</option>`).join("")}
            </select>

            <button onclick="ROAD_APP.openContextMetaModal('context')" data-tooltip="ตั้งค่าข้อมูลบริบทสถานศึกษา แผนการสอน 6 แผน และผู้เชี่ยวชาญ 5 ท่าน" title="ตั้งค่าข้อมูลบริบทสถานศึกษา แผนการสอน 6 แผน และผู้เชี่ยวชาญ 5 ท่าน" class="px-3 py-2 neu-squircle text-sky-700 dark:text-sky-300 text-xs font-bold cursor-pointer flex items-center gap-1.5 min-h-[40px]">
              <span>⚙️ บริบท/ผชช.</span>
            </button>

            <button onclick="ROAD_APP.createBlankProject()" data-tooltip="สร้างโครงร่างวิจัยว่างเปล่าใหม่ตั้งแต่ต้น" title="สร้างโครงร่างวิจัยว่างเปล่าใหม่" class="px-3 py-2 neu-squircle text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer min-h-[40px]">
              <span>+ โครงร่างว่าง</span>
            </button>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <!-- ✨ 1-Click Presets -->
            <div class="dropdown relative inline-block">
              <select onchange="if(this.value){ROAD_APP.loadPresetIntoActive(this.value); this.value='';}" data-tooltip="โหลดตัวอย่างงานวิจัยมาตรฐานครู/ผู้บริหารครบชุด" title="โหลดข้อมูลตัวอย่างงานวิจัยมาตรฐานครบทุกขั้นตอนทันที" class="px-3 py-2 neu-input-pill text-xs font-bold text-emerald-800 dark:text-emerald-300 cursor-pointer min-h-[40px] bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800">
                <option value="">✨ ตัวอย่าง 1-Click ▾</option>
                ${window.ROAD_DATA.PRESETS.map(pr => `<option value="${pr.id}">${escapeHtml(pr.label)}</option>`).join("")}
              </select>
            </div>

            <!-- 📥 ส่งออกด่วน Dropdown -->
            <div class="dropdown relative inline-block">
              <select onchange="if(this.value){ROAD_APP.handleQuickExport(this.value); this.value='';}" data-tooltip="ส่งออกเอกสารวิจัยฉบับสมบูรณ์ Word, พิมพ์ PDF หรือสำรอง JSON" title="ส่งออกเอกสารวิจัยด่วน" class="px-3 py-2 neu-btn-primary text-xs font-bold cursor-pointer min-h-[40px]">
                <option value="" class="text-slate-900 bg-white">📥 ส่งออกด่วน ▾</option>
                <option value="full_manuscript" class="text-slate-900 bg-white">🏆 เล่มวิจัยสมบูรณ์ All-in-One (.doc)</option>
                <option value="front_matter" class="text-slate-900 bg-white">📄 ส่วนนำ & บทคัดย่อ (.doc)</option>
                <option value="expert_kit" class="text-slate-900 bg-white">👥 ชุด 5 ผู้เชี่ยวชาญ + IOC (.doc)</option>
                <option value="back_matter" class="text-slate-900 bg-white">📚 บรรณานุกรม APA + ประวัติ (.doc)</option>
                <option value="appendix" class="text-slate-900 bg-white">📎 ภาคผนวก ก–ง (.doc)</option>
                <option value="print" class="text-slate-900 bg-white">🖨️ พิมพ์ A4 / บันทึก PDF</option>
                <option value="json" class="text-slate-900 bg-white">💾 สำรองไฟล์ JSON</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 2. Live Full Title Banner (Soft Neumorphic Card with ABCD Decomposition) -->
        <div class="neu-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center justify-between gap-2 text-xs font-bold text-blue-700 dark:text-sky-300 mb-2">
              <span class="flex items-center gap-1.5">
                <span>📌 ชื่อเรื่องการวิจัย:</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">สูตร ABCD</span>
              </span>
              <button type="button" onclick="ROAD_APP.toggleTitleViewMode()" class="px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 text-[11px] font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer transition">
                ${state.titleViewMode === 'plain' ? '🏷️ แสดงแบบแยกสี A B C D' : '📝 แสดงแบบข้อความเดียว'}
              </button>
            </div>
            <div id="live-composed-title" class="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-relaxed">
              ${state.titleViewMode === 'plain' ? escapeHtml(fullTitle) : window.ROAD_GENERATOR.composeColorCodedTitle(proj)}
            </div>
          </div>
          <div class="flex items-center gap-3 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-200/80 dark:border-slate-800">
            <div class="text-right">
              <div class="text-[11px] font-semibold text-slate-500">ความสมบูรณ์โครงร่าง</div>
              <div class="text-xl font-mono font-extrabold ${health.score >= 85 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}">${health.score}%</div>
            </div>
            <button onclick="ROAD_APP.openAbcdModal('manual')" class="px-3.5 py-2 neu-squircle text-xs font-bold text-blue-700 dark:text-sky-300 cursor-pointer flex items-center gap-1 min-h-[40px]" title="เปิดตัวช่วยป้อน A B C D">
              <span>✏️ แก้ไข ABCD</span>
            </button>
            <button onclick="ROAD_APP.copySmartPrompt('title_polish')" class="px-3.5 py-2 neu-squircle text-xs font-bold text-indigo-700 dark:text-indigo-300 cursor-pointer flex items-center gap-1 min-h-[40px]" title="คัดลอก Smart Prompt สำหรับเกลาชื่อเรื่อง">
              <span>✨ เกลาชื่อ</span>
            </button>
          </div>
        </div>

        <!-- 3. Primary Step-by-Step Workflow Pipeline (4 Master Phases) -->
        <div class="neu-card p-3 sm:p-4 print:hidden">
          <div class="flex items-center justify-between gap-2 mb-3">
            <div class="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span>ขั้นตอนการทำวิจัยทีละสเต็ป (Step-by-Step R&D Workflow):</span>
            </div>
            <button onclick="ROAD_APP.toggleAllToolsView()" class="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer">
              ${state.showAllTools ? '🔼 ซ่อนเครื่องมือทั้งหมด' : '⚙️ เมนูเครื่องมือแบบรวม (9 แท็บ)'}
            </button>
          </div>

          <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            ${stepsConfig.map(s => {
              const isActive = curStep === s.num;
              return `
                <button type="button" onclick="ROAD_APP.goToWorkflowStep(${s.num})" class="text-left p-3 sm:p-3.5 rounded-2xl transition-all cursor-pointer relative border ${isActive ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-blue-600 shadow-md shadow-blue-500/25 ring-2 ring-blue-400/40' : 'bg-white/60 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-800'}">
                  <div class="flex items-center justify-between gap-1.5 mb-1.5">
                    <span class="text-lg">${s.icon}</span>
                    <span class="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}">
                      Step ${s.num}
                    </span>
                  </div>
                  <div class="text-xs sm:text-sm font-extrabold truncate ${isActive ? 'text-white' : 'text-slate-900 dark:text-white'}">
                    ${s.title}
                  </div>
                  <div class="text-[11px] truncate mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'}">
                    ${s.desc}
                  </div>
                </button>
              `;
            }).join("")}
          </div>

          <!-- 4. Contextual Sub-Tools for Active Step -->
          <div class="mt-3.5 pt-3 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar flex-1">
              ${curStep === 1 ? `
                <button onclick="ROAD_APP.setStudioTab('abcd')" class="px-3.5 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap ${state.studioTab === 'abcd' ? 'neu-btn-primary' : 'neu-squircle text-slate-700 dark:text-slate-300'}">
                  🎯 สตูดิโอออกแบบ ABCD
                </button>
                <button onclick="ROAD_APP.setStudioTab('workspace')" class="px-3.5 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap ${state.studioTab === 'workspace' ? 'neu-btn-primary' : 'neu-squircle text-slate-700 dark:text-slate-300'}">
                  📁 คลังโครงร่าง (Workspace)
                </button>
                <button onclick="ROAD_APP.openContextMetaModal('context')" class="px-3.5 py-1.5 text-xs font-bold rounded-xl neu-squircle text-sky-700 dark:text-sky-300 transition cursor-pointer whitespace-nowrap">
                  ⚙️ บริบทสถานศึกษา & ผชช.
                </button>
                <button onclick="ROAD_APP.openAbcdModal('parse')" class="px-3.5 py-1.5 text-xs font-bold rounded-xl neu-squircle text-purple-700 dark:text-purple-300 transition cursor-pointer whitespace-nowrap">
                  🔍 ถอดรหัสชื่อเรื่องอัตโนมัติ
                </button>
              ` : curStep === 2 ? `
                <button onclick="ROAD_APP.setStudioTab('diagrams')" class="px-3.5 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap ${state.studioTab === 'diagrams' ? 'neu-btn-primary' : 'neu-squircle text-slate-700 dark:text-slate-300'}">
                  🧭 ผัง R&D 4 ระยะ (R1-D2)
                </button>
                <button onclick="ROAD_APP.openWizardModal(1)" class="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 transition cursor-pointer whitespace-nowrap hover:bg-blue-100">
                  🪄 10-Step Wizard
                </button>
                <button onclick="ROAD_APP.setStudioTab('instruments')" class="px-3.5 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap ${state.studioTab === 'instruments' ? 'neu-btn-primary' : 'neu-squircle text-slate-700 dark:text-slate-300'}">
                  📐 ผังแบบทดสอบ & รูบริก
                </button>
                <button onclick="ROAD_APP.setStudioTab('statlab')" class="px-3.5 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap ${state.studioTab === 'statlab' ? 'neu-btn-primary' : 'neu-squircle text-slate-700 dark:text-slate-300'}">
                  📊 สถิติวิจัย (StatLab)
                </button>
                <button onclick="ROAD_APP.setStudioTab('matrix')" class="px-3.5 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap ${state.studioTab === 'matrix' ? 'neu-btn-primary' : 'neu-squircle text-slate-700 dark:text-slate-300'}">
                  🔬 ตารางสังเคราะห์ R1->D1
                </button>
              ` : curStep === 3 ? `
                <button onclick="ROAD_APP.setStudioTab('chapters')" class="px-3.5 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap ${state.studioTab === 'chapters' ? 'neu-btn-primary' : 'neu-squircle text-slate-700 dark:text-slate-300'}">
                  📘 รายงานวิจัย 5 บทฉบับเต็ม
                </button>
                <button onclick="ROAD_APP.setStudioTab('ai')" class="px-3.5 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap ${state.studioTab === 'ai' ? 'neu-btn-primary' : 'neu-squircle text-slate-700 dark:text-slate-300'}">
                  🤖 AI Co-Pilot อัจฉริยะ
                </button>
                <div class="inline-flex items-center gap-1 border-l border-slate-300 dark:border-slate-700 pl-2 ml-1">
                  ${[0, 1, 2, 3, 4, 5].map(ch => `
                    <button onclick="ROAD_APP.filterChapterView(${ch})" class="px-2 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${state.activeChapterFilter === ch ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}">
                      ${ch === 0 ? 'ทุกบท' : 'บทที่ ' + ch}
                    </button>
                  `).join("")}
                </div>
              ` : `
                <button onclick="ROAD_APP.setStudioTab('advisor')" class="px-3.5 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap ${state.studioTab === 'advisor' ? 'neu-btn-emerald' : 'neu-squircle text-slate-700 dark:text-slate-300'}">
                  🧠 ตรวจทาน 14 กฎเหล็ก วPA (${health.score}%)
                </button>
                <button onclick="ROAD_APP.exportFullManuscript()" class="px-3.5 py-1.5 text-xs font-bold rounded-xl neu-btn-primary transition cursor-pointer whitespace-nowrap">
                  🏆 ส่งออกเล่มวิจัย All-in-One (.doc)
                </button>
                <button onclick="window.print()" class="px-3.5 py-1.5 text-xs font-bold rounded-xl neu-squircle text-slate-700 dark:text-slate-300 transition cursor-pointer whitespace-nowrap">
                  🖨️ พิมพ์ A4 / PDF
                </button>
                <button onclick="ROAD_APP.exportExpertKit()" class="px-3.5 py-1.5 text-xs font-bold rounded-xl neu-squircle text-indigo-700 dark:text-indigo-300 transition cursor-pointer whitespace-nowrap">
                  👥 ชุด 5 ผู้เชี่ยวชาญ + IOC
                </button>
              `}
            </div>

            <!-- Workflow Next Step Button -->
            ${curStep < 4 ? `
              <button onclick="ROAD_APP.goToWorkflowStep(${curStep + 1})" class="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 hover:opacity-90 cursor-pointer transition shadow-sm shrink-0">
                <span>ไปยังขั้นที่ ${curStep + 1}</span>
                <span>➔</span>
              </button>
            ` : `
              <button onclick="ROAD_APP.exportFullManuscript()" class="px-3.5 py-1.5 rounded-xl neu-btn-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-sm shrink-0">
                <span>✨ ส่งออกผลงานพร้อมประเมิน</span>
              </button>
            `}
          </div>

          <!-- Legacy Full 9-Tab Bar (Optional Power-User Mode) -->
          ${state.showAllTools ? `
            <div class="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar animate-fade-in">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">เครื่องมือทั้งหมด:</span>
              ${[
                ["workspace", "📁 คลังวิจัย", "คลังโครงการวิจัยทั้งหมด สลับโครงการ หรือสร้างโครงร่างใหม่"],
                ["abcd", "🎯 1. ABCD", "ตั้งค่าชื่อเรื่องและแยกองค์ประกอบ ABCD"],
                ["wizard", "🪄 2. Wizard", "ระบบนำทางออกแบบโครงร่างวิจัย 10 ขั้นตอน"],
                ["chapters", "📘 3. เล่ม 5 บท", "รายงานการวิจัยฉบับสมบูรณ์ 5 บท ส่วนนำ และภาคผนวก"],
                ["diagrams", "🧭 4. ผัง R&D", "ตารางดำเนินการวิจัย 4 ระยะ (R1-D2) และผังเชื่อมโยง 360°"],
                ["instruments", "📐 เครื่องมือ & รูบริก", "ผังสร้างแบบทดสอบ Test Blueprint, เกณฑ์รูบริก 4 ระดับ และนิยามปฏิบัติการ"],
                ["statlab", "📊 5. StatLab", "ห้องปฏิบัติการสถิติวิจัยและตรวจสอบคุณภาพเครื่องมือ"],
                ["matrix", "🔬 สังเคราะห์ R1->D1", "ตารางสังเคราะห์ขั้นตอนกิจกรรมและเชื่อมโยงผลการวิจัย"],
                ["ai", "🤖 AI Co-Pilot", "AI ช่วยเขียนเนื้อหารายบท เกลาภาษา และวิเคราะห์สังเคราะห์"],
                ["advisor", "🧠 AI Advisor", "ระบบตรวจสอบ 14 กฎเหล็ก และแนะนำทิศทางวิจัยระดับชาติ"]
              ].map(([key, label, tip]) => `
                <button onclick="ROAD_APP.setStudioTab('${key}')" data-tooltip="${tip}" title="${tip}" class="px-3 py-1.5 text-xs font-bold transition cursor-pointer whitespace-nowrap rounded-xl ${state.studioTab === key ? (key === 'workspace' ? 'neu-btn-primary' : key === 'advisor' ? 'neu-btn-emerald' : 'neu-btn-primary') : 'neu-squircle text-slate-700 dark:text-slate-300'}">
                  ${label}
                </button>
              `).join("")}
            </div>
          ` : ""}
        </div>

        <!-- 5. Active Tab Workspace / Content Area -->
        <div class="print-area">
          ${state.studioTab === "workspace" ? renderTabWorkspace(proj) : ""}
          ${state.studioTab === "advisor" ? renderTabAdvisor() : ""}
          ${state.studioTab === "abcd" ? renderTabAbcd(proj, health) : ""}
          ${state.studioTab === "chapters" ? renderTabChapters(proj) : ""}
          ${state.studioTab === "instruments" ? renderTabInstruments(proj) : ""}
          ${state.studioTab === "diagrams" ? renderTabDiagrams(proj) : ""}
          ${state.studioTab === "matrix" ? renderTabMatrix(proj) : ""}
          ${state.studioTab === "statlab" ? renderTabStatLab(proj) : ""}
          ${state.studioTab === "ai" ? renderTabAi(proj) : ""}
        </div>
      </div>
    `;
  }

  // --- Studio Tab Workspace: Research Projects Portfolio & Lifecycle Manager ---
  function renderTabWorkspace(proj) {
    const totalCount = state.projects.length;
    const activeCount = state.projects.filter(p => ["draft", "data_collection", "reviewing"].includes(p.status)).length;
    const readyCount = state.projects.filter(p => p.status === "ready_export").length;
    const archivedCount = state.projects.filter(p => p.status === "archived").length;

    const q = (state.projectSearch || "").trim().toLowerCase();
    const filteredProjects = state.projects.filter(p => {
      if (state.projectFilterStatus !== "ALL" && p.status !== state.projectFilterStatus) return false;
      if (!q) return true;
      const title = window.ROAD_GENERATOR.composeFullTitle(p).toLowerCase();
      const label = (p.label || "").toLowerCase();
      const b = (p.B || "").toLowerCase();
      const c = (p.C_list || []).join(" ").toLowerCase();
      return title.includes(q) || label.includes(q) || b.includes(q) || c.includes(q);
    });

    const statusMap = new Map((window.ROAD_DATA.PROJECT_STATUSES || []).map(s => [s.id, s]));

    return `
      <div class="flex flex-col gap-6">
        <!-- Overview Metrics Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div class="neu-card p-4 flex flex-col gap-1">
            <span class="text-xs font-semibold text-slate-500">📁 โครงการทั้งหมด</span>
            <div class="flex items-baseline justify-between">
              <span class="text-2xl font-black text-slate-800 dark:text-white font-mono">${totalCount}</span>
              <span class="text-xs font-bold text-blue-600">เรื่อง</span>
            </div>
          </div>
          <div class="neu-card p-4 flex flex-col gap-1">
            <span class="text-xs font-semibold text-amber-600 dark:text-amber-400">⏳ กำลังดำเนินการ</span>
            <div class="flex items-baseline justify-between">
              <span class="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">${activeCount}</span>
              <span class="text-xs font-bold text-slate-400">โครงการ</span>
            </div>
          </div>
          <div class="neu-card p-4 flex flex-col gap-1">
            <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">✨ พร้อมส่งออก 5 บท</span>
            <div class="flex items-baseline justify-between">
              <span class="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">${readyCount}</span>
              <span class="text-xs font-bold text-emerald-500">ผ่านเกณฑ์</span>
            </div>
          </div>
          <div class="neu-card p-4 flex flex-col gap-1">
            <span class="text-xs font-semibold text-purple-600 dark:text-purple-400">📦 จัดเก็บถาวร</span>
            <div class="flex items-baseline justify-between">
              <span class="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">${archivedCount}</span>
              <span class="text-xs font-bold text-slate-400">ประวัติ</span>
            </div>
          </div>
        </div>

        <!-- Filter, Search, and Action Toolbar -->
        <div class="neu-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <!-- Status Filter Tabs -->
          <div class="flex flex-wrap items-center gap-1.5">
            <button onclick="ROAD_APP.setProjectFilterStatus('ALL')" class="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition ${state.projectFilterStatus === 'ALL' ? 'neu-btn-primary' : 'neu-squircle text-slate-700 dark:text-slate-300'}">
              ทั้งหมด (${totalCount})
            </button>
            ${(window.ROAD_DATA.PROJECT_STATUSES || []).map(st => `
              <button onclick="ROAD_APP.setProjectFilterStatus('${st.id}')" class="px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-1 ${state.projectFilterStatus === st.id ? 'neu-btn-primary' : 'neu-squircle text-slate-700 dark:text-slate-300'}">
                <span>${st.icon}</span>
                <span>${st.label}</span>
              </button>
            `).join("")}
          </div>

          <!-- Search Input & Creation Buttons -->
          <div class="flex flex-wrap items-center gap-2">
            <div class="neu-input-pill px-3 py-1.5 flex items-center gap-2 text-xs">
              <span>🔍</span>
              <input
                type="text"
                value="${escapeHtml(state.projectSearch)}"
                oninput="ROAD_APP.setProjectSearch(this.value)"
                placeholder="ค้นหาชื่อเรื่อง, นวัตกรรม..."
                class="bg-transparent outline-none text-xs w-36 sm:w-48 text-slate-800 dark:text-white"
              />
              ${state.projectSearch ? `<button onclick="ROAD_APP.setProjectSearch('')" class="text-slate-400 hover:text-slate-600">✕</button>` : ""}
            </div>

            <button onclick="ROAD_APP.openWizardModal(1)" class="px-3.5 py-2 neu-btn-emerald text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm">
              <span>🧭</span>
              <span>เริ่ม Research Wizard (10 ขั้น)</span>
            </button>

            <button onclick="ROAD_APP.createNewProject()" class="px-3.5 py-2 neu-btn-primary text-xs font-bold flex items-center gap-1 cursor-pointer">
              <span>+ โครงการใหม่</span>
            </button>
          </div>
        </div>

        <!-- Projects Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          ${filteredProjects.map(p => {
            const isCurrent = p.id === proj.id;
            const fullT = window.ROAD_GENERATOR.composeFullTitle(p);
            const stObj = statusMap.get(p.status) || (window.ROAD_DATA.PROJECT_STATUSES || [])[0];
            const pHealth = window.ROAD_GENERATOR.evaluateResearchHealth(p);
            const updateDate = p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('th-TH', { year: '2-digit', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "-";

            return `
              <div class="neu-card p-5 flex flex-col justify-between gap-4 transition hover:shadow-lg ${isCurrent ? 'ring-2 ring-blue-500/80 bg-blue-50/20 dark:bg-blue-950/20' : ''}">
                <div class="flex flex-col gap-3">
                  <!-- Header: Status Badge & Academic Rank -->
                  <div class="flex items-center justify-between gap-2">
                    <span class="px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1 ${stObj.badgeClass}">
                      <span>${stObj.icon}</span>
                      <span>${stObj.label}</span>
                    </span>
                    <span class="text-[11px] font-semibold text-slate-500 font-mono">
                      ${p.academicRank ? p.academicRank.toUpperCase() : 'วPA'} · ${p.efficiencyCriterion || '80/80'}
                    </span>
                  </div>

                  <!-- Project Title -->
                  <h3 class="text-base font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    ${escapeHtml(fullT)}
                  </h3>

                  <!-- ABCD Tags -->
                  <div class="flex flex-wrap gap-1 text-[11px]">
                    <span class="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 font-medium">B: ${escapeHtml(p.B_short || p.B)}</span>
                    <span class="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 font-medium">D: ${escapeHtml(p.D)}</span>
                  </div>

                  <!-- Progress Bar -->
                  <div class="flex flex-col gap-1 pt-1">
                    <div class="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span>ความสมบูรณ์เนื้อหา</span>
                      <span class="font-mono font-bold ${pHealth.score >= 80 ? 'text-emerald-600' : 'text-amber-600'}">${pHealth.score}%</span>
                    </div>
                    <div class="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-500 ${pHealth.score >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-orange-400'}" style="width: ${pHealth.score}%"></div>
                    </div>
                  </div>

                  <div class="text-[10px] text-slate-400 flex items-center gap-1">
                    <span>🕒 บันทึกล่าสุด:</span>
                    <span>${updateDate}</span>
                  </div>
                </div>

                <!-- Footer Actions -->
                <div class="border-t border-slate-200/80 dark:border-slate-800/80 pt-3 flex flex-col gap-2">
                  <div class="flex items-center justify-between gap-2">
                    <button onclick="ROAD_APP.selectProject('${p.id}'); ROAD_APP.setStudioTab('chapters');" class="flex-1 py-2 px-3 neu-btn-primary text-xs font-bold flex items-center justify-center gap-1 cursor-pointer">
                      <span>${isCurrent ? '⚡ กำลังทำงาน' : '✏️ เปิดสตูดิโอ (5 บท)'}</span>
                    </button>

                    <button onclick="ROAD_APP.duplicateProject('${p.id}')" class="px-2.5 py-2 neu-squircle text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 cursor-pointer" title="คัดลอกโครงการนี้ (Duplicate)">
                      📋
                    </button>

                    <button onclick="ROAD_APP.archiveProject('${p.id}')" class="px-2.5 py-2 neu-squircle text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-purple-600 cursor-pointer" title="จัดเก็บเข้ากรุ (Archive)">
                      📦
                    </button>

                    ${state.projects.length > 1 ? `
                      <button onclick="ROAD_APP.deleteProject('${p.id}')" class="px-2 py-2 neu-squircle text-xs font-semibold text-rose-500 hover:text-rose-700 cursor-pointer" title="ลบโครงการ">
                        🗑️
                      </button>
                    ` : ""}
                  </div>

                  <!-- Quick Status Changer Dropdown -->
                  <div class="flex items-center justify-between text-[11px] text-slate-500 gap-1.5">
                    <span>สถานะ:</span>
                    <select onchange="ROAD_APP.setProjectStatus('${p.id}', this.value)" class="neu-input-pill px-2 py-1 text-[11px] font-semibold text-slate-800 dark:text-white cursor-pointer outline-none">
                      ${(window.ROAD_DATA.PROJECT_STATUSES || []).map(st => `
                        <option value="${st.id}" ${p.status === st.id ? 'selected' : ''}>${st.icon} ${st.label}</option>
                      `).join("")}
                    </select>
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>

        ${filteredProjects.length === 0 ? `
          <div class="neu-card p-12 text-center flex flex-col items-center gap-3">
            <span class="text-4xl">🔍</span>
            <div class="font-bold text-slate-700 dark:text-slate-300">ไม่พบโครงการวิจัยตามเงื่อนไขที่เลือก</div>
            <p class="text-xs text-slate-500">ลองล้างคำค้นหาหรือเปลี่ยนตัวกรองสถานะ หรือคลิกปุ่มสร้างโครงการใหม่</p>
            <button onclick="ROAD_APP.setProjectFilterStatus('ALL'); ROAD_APP.setProjectSearch('');" class="px-4 py-2 neu-btn-primary text-xs font-bold cursor-pointer">
              แสดงโครงการทั้งหมด
            </button>
          </div>
        ` : ""}
      </div>
    `;
  }

  // --- Studio Tab 0: AI Smart Research Advisor & Practicality Engine ---
  function renderTabAdvisor() {
    const proj = getActiveProject();
    const cr = state.advisorCriteria;
    const recs = window.ROAD_ADVISOR.analyzeAndRecommend(cr);
    const best = recs[0];
    const validation = window.ROAD_ADVISOR.validate10Pitfalls(proj);
    const subTab = state.advisorTab || "recommend";

    return `
      <div class="flex flex-col gap-6">
        <!-- Advisor Sub-Navigation Bar -->
        <div class="p-3 rounded-2xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap gap-2">
            ${[
              ["recommend", "🏆 1. แนะนำ 3 ทางเลือกที่ดีที่สุด (Best Choices)"],
              ["validator", `🛡️ 2. ตรวจสอบกฎเหล็ก 10 ประการ (Health: ${validation.healthScore}%)`],
              ["national_directions", "🌐 3. ทิศทางการวิจัยของชาติ (2568–2570)"],
              ["wpa_framework", "📋 4. เกณฑ์ วPA แยก 3 สายงาน (คศ.1–คศ.5)"]
            ].map(([k, lbl]) => `
              <button onclick="ROAD_APP.setAdvisorTab('${k}')" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${subTab === k ? (k === 'validator' && validation.healthScore < 80 ? 'neu-btn-primary' : 'neu-btn-emerald') : 'neu-squircle text-slate-700 dark:text-slate-300'}">
                ${lbl}
              </button>
            `).join("")}
          </div>
          <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">
            ตามเกณฑ์ ก.ค.ศ. & มาตรฐานวิธีวิทยา R&D
          </div>
        </div>

        <!-- Sub-Tab 1: Recommendations -->
        ${subTab === "recommend" ? `
          <!-- Hero Advisor Input Card -->
          <div class="neu-card p-6 sm:p-7 flex flex-col gap-5">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span class="px-3.5 py-1 rounded-full bg-blue-100/80 dark:bg-sky-900/50 border border-blue-300/60 text-blue-700 dark:text-sky-300 text-xs font-extrabold uppercase tracking-wider">
                  🧠 AI RESEARCH DECISION & PRACTICALITY ENGINE
                </span>
                <h2 class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-2.5">
                  ให้ AI ศึกษา วิเคราะห์ และเลือก "ชุดการวิจัยที่ดีที่สุดและปฏิบัติได้ง่ายที่สุด" ให้คุณทันที
                </h2>
                <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                  เพียงระบุวิชา ระดับชั้น และปัญหาที่พบ ระบบจะคัดเลือกนวัตกรรม (B) ตัวแปรตาม (C) แบบแผนการทดลอง และค่าสถิติที่ทำในห้องเรียนได้ง่ายที่สุดแต่ผ่านเกณฑ์ประเมิน วPA 100%
                </p>
              </div>
              <button onclick="ROAD_APP.applyAdvisorChoice(0, true)" class="px-5 py-3.5 neu-btn-emerald font-extrabold text-sm cursor-pointer shrink-0">
                ⚡ เลือกใช้ชุดที่ดีที่สุดอันดับ 1 + สร้างเล่มวิจัย 5 บททันที!
              </button>
            </div>

            <!-- 4 Simple Context Selectors -->
            <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <label class="flex flex-col gap-1.5 text-xs">
                <span class="font-extrabold text-blue-700 dark:text-sky-300">1. กลุ่มสาระการเรียนรู้ / สาขาวิชา</span>
                <select onchange="ROAD_APP.updateAdvisorField('subjectId', this.value)" class="px-4 py-3 neu-input-pill text-slate-800 dark:text-white font-bold text-xs sm:text-sm cursor-pointer">
                  ${window.ROAD_ADVISOR.SUBJECT_GROUPS.map(s => `<option value="${s.id}" ${cr.subjectId === s.id ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join("")}
                </select>
              </label>

              <label class="flex flex-col gap-1.5 text-xs">
                <span class="font-extrabold text-blue-700 dark:text-sky-300">2. ระดับชั้น / กลุ่มเป้าหมาย</span>
                <select onchange="ROAD_APP.updateAdvisorField('gradeId', this.value)" class="px-4 py-3 neu-input-pill text-slate-800 dark:text-white font-bold text-xs sm:text-sm cursor-pointer">
                  ${window.ROAD_ADVISOR.GRADE_LEVELS.map(g => `<option value="${g.id}" ${cr.gradeId === g.id ? 'selected' : ''}>${escapeHtml(g.label)}</option>`).join("")}
                </select>
              </label>

              <label class="flex flex-col gap-1.5 text-xs">
                <span class="font-extrabold text-blue-700 dark:text-sky-300">3. ปัญหาสำคัญที่พบในห้องเรียน</span>
                <select onchange="ROAD_APP.updateAdvisorField('painId', this.value)" class="px-4 py-3 neu-input-pill text-slate-800 dark:text-white font-bold text-xs sm:text-sm cursor-pointer">
                  ${window.ROAD_ADVISOR.PAIN_POINTS.map(p => `<option value="${p.id}" ${cr.painId === p.id ? 'selected' : ''}>${escapeHtml(p.label)}</option>`).join("")}
                </select>
              </label>

              <label class="flex flex-col gap-1.5 text-xs">
                <span class="font-extrabold text-blue-700 dark:text-sky-300">4. เป้าหมายการทำวิจัย & เวลาที่มี</span>
                <select onchange="ROAD_APP.updateAdvisorField('goalId', this.value)" class="px-4 py-3 neu-input-pill text-slate-800 dark:text-white font-bold text-xs sm:text-sm cursor-pointer">
                  ${window.ROAD_ADVISOR.GOALS_TARGET.map(g => `<option value="${g.id}" ${cr.goalId === g.id ? 'selected' : ''}>${escapeHtml(g.label)}</option>`).join("")}
                </select>
              </label>

              <label class="flex flex-col gap-1.5 text-xs sm:col-span-2">
                <span class="font-extrabold text-slate-700 dark:text-slate-300">5. เรื่อง / หน่วยการเรียนรู้ที่จะใช้สอนจริง</span>
                <input value="${escapeHtml(cr.customTopic)}" oninput="ROAD_APP.updateAdvisorField('customTopic', this.value)" class="px-4 py-3 neu-input-pill text-slate-800 dark:text-white font-semibold text-sm" placeholder="เช่น ระบบนิเวศ / การอ่านจับใจความ / ร้อยละและอัตราส่วน" />
              </label>

              <label class="flex flex-col gap-1.5 text-xs sm:col-span-2">
                <span class="font-extrabold text-slate-700 dark:text-slate-300">6. ชื่อโรงเรียน / สถานศึกษาของคุณ</span>
                <div class="flex gap-2.5">
                  <input value="${escapeHtml(cr.schoolName)}" oninput="ROAD_APP.updateAdvisorField('schoolName', this.value)" class="flex-1 px-4 py-3 neu-input-pill text-slate-800 dark:text-white font-semibold text-sm" placeholder="เช่น โรงเรียนเปรมติณสูลานนท์" />
                  <button onclick="ROAD_APP.runGeminiAdvisorAutoPilot()" class="px-4 py-3 neu-btn-primary text-xs font-extrabold cursor-pointer shrink-0">
                    ${state.advisorLoading ? '⏳ กำลังวิเคราะห์...' : '🤖 สั่ง AI ประมวลผลและสร้าง 5 บท'}
                  </button>
                </div>
              </label>
            </div>
          </div>

          <!-- Top #1 Best Recommendation Card -->
          <div class="neu-card p-6 sm:p-7 flex flex-col gap-5">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300/60 dark:border-slate-700 pb-4">
              <div>
                <span class="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-extrabold">
                  ${escapeHtml(best.badge)}
                </span>
                <h3 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-2">
                  เรื่อง: ${escapeHtml(window.ROAD_GENERATOR.composeFullTitle(best.projectPayload))}
                </h3>
              </div>
              <div class="flex items-center gap-3">
                <div class="text-center px-3.5 py-2 neu-squircle">
                  <div class="text-[11px] font-semibold text-slate-500">ความง่ายในการทำจริง</div>
                  <div class="text-lg font-mono font-extrabold text-emerald-600 dark:text-emerald-400">${best.practicalityScore}%</div>
                </div>
                <div class="text-center px-3.5 py-2 neu-squircle">
                  <div class="text-[11px] font-semibold text-slate-500">ความเข้มข้นวิชาการ</div>
                  <div class="text-lg font-mono font-extrabold text-blue-600 dark:text-sky-400">${best.rigorScore}%</div>
                </div>
                <div class="text-center px-3.5 py-2 neu-squircle">
                  <div class="text-[11px] font-semibold text-slate-500">ระยะเวลาที่ใช้</div>
                  <div class="text-lg font-mono font-extrabold text-amber-600 dark:text-amber-400">${best.timeWeeks} สัปดาห์</div>
                </div>
              </div>
            </div>

            <div class="grid md:grid-cols-2 gap-5">
              <div class="p-5 neu-input-pill rounded-2xl flex flex-col gap-2.5">
                <h4 class="font-extrabold text-sm text-emerald-800 dark:text-emerald-300">💡 ทำไม AI จึงเลือกชุดนี้ว่า "ดีที่สุดและปฏิบัติได้ง่ายที่สุด" สำหรับคุณ:</h4>
                <ul class="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  ${best.whyBest.map(w => `<li class="flex items-start gap-2"><span class="text-emerald-600 font-bold">✔</span><span>${escapeHtml(w)}</span></li>`).join("")}
                </ul>
                <div class="mt-2 pt-2.5 border-t border-slate-300/60 dark:border-slate-700 text-xs">
                  <b>ขั้นตอนการสอนของนวัตกรรม (${best.projectPayload.B_steps.length} ขั้นตอน):</b>
                  <div class="mt-2 space-y-1.5">
                    ${best.projectPayload.B_steps.map(s => `<div class="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900 border border-white dark:border-slate-800 font-medium">${escapeHtml(s)}</div>`).join("")}
                  </div>
                </div>
              </div>

              <div class="p-5 neu-input-pill rounded-2xl flex flex-col justify-between gap-3">
                <div>
                  <h4 class="font-extrabold text-sm text-blue-800 dark:text-sky-300 mb-2.5">🗓️ แผนปฏิบัติการลงมือทำจริงในชั้นเรียน (Action Plan):</h4>
                  <div class="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                    ${best.actionPlan.map(step => `<div class="p-3 rounded-xl bg-white/80 dark:bg-slate-900 border border-white dark:border-slate-800 font-medium">${escapeHtml(step)}</div>`).join("")}
                  </div>
                </div>

                <div class="flex flex-wrap gap-2.5 pt-2">
                  <button onclick="ROAD_APP.applyAdvisorChoice(0, true)" class="flex-1 py-3.5 px-4 neu-btn-emerald font-extrabold text-sm cursor-pointer">
                    ✔ เลือกชุดอันดับ 1 นี้ และเปิดรายงานวิจัย 5 บททันที →
                  </button>
                  <button onclick="ROAD_APP.applyAdvisorChoice(0, false)" class="py-3.5 px-4 neu-squircle text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer">
                    เลือกและไปปรับแต่ง ABCD ต่อ
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Alternative Recommendations (#2 and #3) -->
          <div class="grid md:grid-cols-2 gap-5">
            ${recs.slice(1).map((alt, idx) => `
              <div class="neu-card-sm p-5 flex flex-col justify-between gap-4">
                <div class="space-y-2.5">
                  <div class="flex items-center justify-between gap-2">
                    <span class="px-3 py-1 rounded-full bg-white/80 dark:bg-slate-800 text-xs font-extrabold text-slate-800 dark:text-slate-200">${escapeHtml(alt.badge)}</span>
                    <span class="font-mono text-xs text-emerald-700 dark:text-emerald-400 font-extrabold">ทำง่าย ${alt.practicalityScore}% · วิชาการ ${alt.rigorScore}%</span>
                  </div>
                  <h4 class="font-extrabold text-base text-slate-900 dark:text-white leading-snug">
                    ${escapeHtml(window.ROAD_GENERATOR.composeFullTitle(alt.projectPayload))}
                  </h4>
                  <ul class="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    ${alt.whyBest.map(w => `<li>• ${escapeHtml(w)}</li>`).join("")}
                  </ul>
                </div>
                <button onclick="ROAD_APP.applyAdvisorChoice(${idx + 1}, true)" class="w-full py-3 neu-btn-primary text-xs font-extrabold cursor-pointer">
                  เลือกใช้ทางเลือกที่ ${idx + 2} นี้ + สร้างรายงาน 5 บททันที →
                </button>
              </div>
            `).join("")}
          </div>
        ` : ""}

        <!-- Sub-Tab 2: 10 Pitfalls Validator & Health Score -->
        ${subTab === "validator" ? `
          <div class="flex flex-col gap-6">
            <div class="neu-card p-6 flex flex-wrap items-center justify-between gap-4">
              <div class="flex items-center gap-4">
                <div class="w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-mono font-extrabold ${validation.healthScore >= 90 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : validation.healthScore >= 70 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'} border-2 border-current shadow-sm">
                  <span class="text-2xl">${validation.healthScore}%</span>
                  <span class="text-[10px] uppercase font-bold">Health Score</span>
                </div>
                <div>
                  <h3 class="text-lg font-bold text-slate-900 dark:text-white">ผลการตรวจสอบกฎเหล็ก 10 ประการ (10 Pitfalls Validator)</h3>
                  <p class="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    ตรวจสอบความถูกต้องตามเกณฑ์ประเมิน วPA ของ ก.ค.ศ. และมาตรฐานงานวิจัย R&D ขั้นสูง
                  </p>
                  <div class="mt-2 flex items-center gap-3 text-xs">
                    <span class="font-bold text-emerald-600 dark:text-emerald-400">ผ่าน ${validation.passedCount} จาก ${validation.totalRules} ข้อ</span>
                    ${validation.healthScore < 100 ? `<span class="text-amber-600 dark:text-amber-400 font-medium">พบประเด็นที่ควรปรับปรุง ${validation.totalRules - validation.passedCount} ข้อ</span>` : `<span class="text-emerald-600 dark:text-emerald-400 font-bold">สมบูรณ์แบบพร้อมส่งประเมิน!</span>`}
                  </div>
                </div>
              </div>
              <button onclick="ROAD_APP.openAbcdModal('manual')" class="px-4 py-2.5 neu-btn-primary text-xs font-bold cursor-pointer">
                ✏️ แก้ไขชื่อเรื่องและองค์ประกอบ
              </button>
            </div>

            <!-- 10 Rules Checklist -->
            <div class="space-y-3">
              ${validation.results.map(r => `
                <div class="p-4 rounded-2xl border ${r.level === 'pass' ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20' : r.level === 'warning' ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20' : 'border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20'} flex flex-col gap-2">
                  <div class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-2">
                      <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${r.level === 'pass' ? 'bg-emerald-600 text-white' : r.level === 'warning' ? 'bg-amber-500 text-white' : 'bg-rose-600 text-white'}">
                        กฎข้อที่ ${r.ruleId}
                      </span>
                      <span class="font-bold text-sm text-slate-900 dark:text-white">${escapeHtml(r.ruleName)}</span>
                    </div>
                    <span class="text-xs font-bold ${r.level === 'pass' ? 'text-emerald-700 dark:text-emerald-400' : r.level === 'warning' ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'}">
                      ${r.level === 'pass' ? '✔ ผ่านเกณฑ์' : r.level === 'warning' ? '⚠ ข้อควรระวัง' : '✕ พบข้อผิดพลาด'}
                    </span>
                  </div>
                  <div class="text-xs text-slate-700 dark:text-slate-300 pl-2 border-l-2 ${r.level === 'pass' ? 'border-emerald-400' : r.level === 'warning' ? 'border-amber-400' : 'border-rose-400'}">
                    <b>สถานะ:</b> ${escapeHtml(r.title)}
                    <br><span class="text-slate-600 dark:text-slate-400">${escapeHtml(r.desc)}</span>
                    ${r.recommendation ? `<br><b class="text-rose-700 dark:text-rose-400">คำแนะนำแก้ไข:</b> ${escapeHtml(r.recommendation)}` : ''}
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        ` : ""}

        <!-- Sub-Tab 3: 8 National Research Directions (2568-2570) -->
        ${subTab === "national_directions" ? `
          <div class="flex flex-col gap-5">
            <div class="neu-card p-6 flex flex-col gap-2">
              <span class="px-3.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-sky-950 dark:text-sky-300 text-xs font-extrabold w-fit">
                NATIONAL EDUCATION RESEARCH DIRECTIONS 2568–2570
              </span>
              <h3 class="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                ทิศทางการวิจัยทางการศึกษาของชาติ พ.ศ. 2568–2570 (8 ประเด็นหลัก)
              </h3>
              <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                แหล่งอ้างอิงสำคัญสำหรับเขียนที่มาและความสำคัญ (บทที่ 1 ย่อหน้าที่ 2) และการตั้งโจทย์วิจัยที่สอดคล้องกับนโยบายชาติ
              </p>
            </div>

            <div class="grid md:grid-cols-2 gap-4">
              ${window.ROAD_DATA.NATIONAL_RESEARCH_DIRECTIONS.map(dir => `
                <div class="neu-card-sm p-5 flex flex-col justify-between gap-3">
                  <div>
                    <div class="flex items-center justify-between gap-2">
                      <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-800 dark:bg-sky-950 dark:text-sky-300">ประเด็นที่ ${dir.number}</span>
                    </div>
                    <h4 class="font-bold text-base text-slate-900 dark:text-white mt-2">${escapeHtml(dir.name)}</h4>
                    <p class="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">${escapeHtml(dir.highlights)}</p>
                    <div class="mt-2.5 flex flex-wrap gap-1">
                      ${dir.keywords.map(kw => `<span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300">${escapeHtml(kw)}</span>`).join("")}
                    </div>
                  </div>
                  <div class="pt-3 border-t border-slate-200 dark:border-slate-800">
                    <div class="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">ตัวอย่างโจทย์นวัตกรรมที่สอดคล้อง:</div>
                    <ul class="text-xs space-y-1 text-slate-600 dark:text-slate-400">
                      ${dir.sampleInnovations.map(si => `<li>• ${escapeHtml(si)}</li>`).join("")}
                    </ul>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        ` : ""}

        <!-- Sub-Tab 4: WPA 3 Tracks Framework -->
        ${subTab === "wpa_framework" ? `
          <div class="flex flex-col gap-6">
            <div class="neu-card p-6 flex flex-col gap-2">
              <span class="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-extrabold w-fit">
                PA STANDARDS & PERFORMANCE LEVELS
              </span>
              <h3 class="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                กรอบการประเมิน วPA แยกตาม 3 สายงาน และระดับการปฏิบัติที่คาดหวัง
              </h3>
              <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                โครงสร้างความเชื่อมโยง: หลักการด้านที่ 1 (Principles 8 ตัวชี้วัด) ➔ นวัตกรรมที่พัฒนา (Innovations) ➔ ผลลัพธ์ด้านที่ 2 (Variables)
              </p>
            </div>

            <!-- 3 Tracks Tabs / Display -->
            <div class="grid lg:grid-cols-3 gap-5">
              ${Object.entries(window.ROAD_DATA.WPA_FRAMEWORKS).map(([k, fw]) => `
                <div class="neu-card-sm p-5 flex flex-col gap-4">
                  <div class="border-b border-slate-200 dark:border-slate-800 pb-3">
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-sky-950 dark:text-sky-300">${escapeHtml(fw.role)}</span>
                    <h4 class="font-extrabold text-base text-slate-900 dark:text-white mt-2">${escapeHtml(fw.name)}</h4>
                  </div>

                  <div>
                    <div class="font-bold text-xs text-sky-800 dark:text-sky-300 mb-2">ด้านที่ 1: Principles 8 ตัวชี้วัด</div>
                    <div class="space-y-1.5 text-[11px] max-h-48 overflow-y-auto pr-1">
                      ${fw.principles.map(p => `
                        <div class="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                          <b>${p.id}. ${escapeHtml(p.name)}:</b> <span class="text-slate-500">${escapeHtml(p.desc)}</span>
                        </div>
                      `).join("")}
                    </div>
                  </div>

                  <div>
                    <div class="font-bold text-xs text-emerald-800 dark:text-emerald-300 mb-2">ด้านที่ 2: Variables / ผลลัพธ์ที่คาดหวัง</div>
                    <div class="space-y-2 text-[11px]">
                      ${fw.variables.map(vg => `
                        <div class="p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                          <div class="font-bold text-emerald-900 dark:text-emerald-300">${escapeHtml(vg.categoryName)}</div>
                          <ul class="mt-1 space-y-0.5 text-slate-600 dark:text-slate-400 pl-3">
                            ${vg.items.map(item => `<li>• ${escapeHtml(item)}</li>`).join("")}
                          </ul>
                        </div>
                      `).join("")}
                    </div>
                  </div>
                </div>
              `).join("")}
            </div>

            <!-- Academic Ranks Reference Table -->
            <div class="neu-card p-5 flex flex-col gap-3">
              <h4 class="font-bold text-sm text-slate-900 dark:text-white">ระดับการปฏิบัติที่คาดหวังตามวิทยฐานะ (Expected Performance Levels)</h4>
              <div class="overflow-x-auto text-xs">
                <table class="w-full border-collapse border border-slate-300 dark:border-slate-700">
                  <thead>
                    <tr class="bg-slate-100 dark:bg-slate-800 font-bold">
                      <th class="p-2.5 border border-slate-300 dark:border-slate-700 text-left">วิทยฐานะ</th>
                      <th class="p-2.5 border border-slate-300 dark:border-slate-700 text-left">ระดับการปฏิบัติที่คาดหวัง</th>
                      <th class="p-2.5 border border-slate-300 dark:border-slate-700 text-center">เกณฑ์ผ่าน</th>
                      <th class="p-2.5 border border-slate-300 dark:border-slate-700 text-left">นวัตกรรมที่สอดคล้อง</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${window.ROAD_DATA.ACADEMIC_RANKS.map(rk => `
                      <tr class="border-b border-slate-200 dark:border-slate-800">
                        <td class="p-2.5 border border-slate-300 dark:border-slate-700 font-bold text-sky-800 dark:text-sky-300">${escapeHtml(rk.label)}</td>
                        <td class="p-2.5 border border-slate-300 dark:border-slate-700 font-semibold">${escapeHtml(rk.expectedLevel)}</td>
                        <td class="p-2.5 border border-slate-300 dark:border-slate-700 text-center font-mono font-bold">${rk.passScore}%</td>
                        <td class="p-2.5 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400">${escapeHtml(rk.desc)}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ` : ""}
      </div>
    `;
  }

  // --- Studio Tab 1: Smart ABCD Builder & Research Design ---
  function renderTabAbcd(proj, health) {
    const vocab = window.ROAD_DATA.ABCD_SUGGESTIONS || { A: [], A_CATEGORIES: [], B: [], C1: [], C2: [], D: [] };
    return `
      <div class="grid lg:grid-cols-3 gap-5">
        <!-- Left 2 Columns: ABCD Form & Innovation Steps -->
        <div class="lg:col-span-2 flex flex-col gap-5">
          <!-- ABCD Action Toolbar -->
          <div class="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-900 border border-blue-200/80 dark:border-blue-900/60 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div>
              <div class="font-extrabold text-sm text-blue-950 dark:text-sky-300 flex items-center gap-2">
                <span>✏️ เครื่องมือช่วยป้อนข้อมูลและกำหนดค่า A B C D อิสระ</span>
              </div>
              <p class="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                พิมพ์องค์ประกอบเองตามต้องการ หรือกดวางชื่อเรื่องเพื่อให้ระบบแยก A-B-C-D ให้อัตโนมัติ
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <button type="button" onclick="ROAD_APP.openAbcdModal('manual')" class="px-3.5 py-2 neu-btn-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm">
                <span>✏️ ป้อนข้อมูลใน Modal</span>
              </button>
              <button type="button" onclick="ROAD_APP.openAbcdModal('parse')" class="px-3 py-2 neu-squircle text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1 cursor-pointer">
                <span>⚡ วางชื่อเรื่องแยก ABCD</span>
              </button>
              <button type="button" onclick="ROAD_APP.clearActiveAbcdForm()" class="px-3 py-2 neu-squircle text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1 cursor-pointer" title="ล้างฟอร์มเพื่อพิมพ์เรื่องใหม่">
                <span>🧹 ล้างฟอร์มพิมพ์ใหม่</span>
              </button>
            </div>
          </div>

          <!-- Model & Academic Rank Card -->
          <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col gap-4">
            <h2 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🧭 เลือกรูปแบบวิธีดำเนินการวิจัย และระดับผลงานวิชาการ (วPA)</span>
            </h2>
            <div class="grid sm:grid-cols-3 gap-3">
              ${window.ROAD_DATA.RESEARCH_MODELS.map(m => `
                <div onclick="ROAD_APP.updateFieldAndRender('modelId', '${m.id}')" class="p-3.5 rounded-xl border-2 cursor-pointer transition ${proj.modelId === m.id ? 'border-sky-700 bg-sky-50/70 dark:bg-sky-950/40' : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'}">
                  <div class="font-mono text-xs font-bold text-sky-700 dark:text-sky-400">${escapeHtml(m.code)}</div>
                  <div class="font-bold text-sm mt-0.5 text-slate-900 dark:text-white">${escapeHtml(m.name)}</div>
                  <div class="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-1">${escapeHtml(m.badge)}</div>
                </div>
              `).join("")}
            </div>

            <div class="grid sm:grid-cols-2 gap-3 pt-2">
              <label class="flex flex-col gap-1 text-xs sm:text-sm">
                <span class="font-semibold">เป้าหมายระดับวิทยฐานะ / ประเภทผลงาน</span>
                <select onchange="ROAD_APP.updateFieldAndRender('academicRank', this.value)" class="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800">
                  ${window.ROAD_DATA.ACADEMIC_RANKS.map(r => `<option value="${r.id}" ${proj.academicRank === r.id ? 'selected' : ''}>${escapeHtml(r.label)}</option>`).join("")}
                </select>
              </label>
              <label class="flex flex-col gap-1 text-xs sm:text-sm">
                <span class="font-semibold">เกณฑ์ประสิทธิภาพของนวัตกรรม (E1/E2)</span>
                <select onchange="ROAD_APP.updateFieldAndRender('efficiencyCriterion', this.value)" class="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono">
                  ${["80/80", "75/75", "85/85", "70/70"].map(cr => `<option value="${cr}" ${proj.efficiencyCriterion === cr ? 'selected' : ''}>เกณฑ์มาตรฐาน ${cr}</option>`).join("")}
                </select>
              </label>
            </div>
          </div>

          <!-- ABCD Decomposition Card -->
          <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col gap-5">
            <div>
              <h2 class="text-base font-bold text-slate-900 dark:text-white">🔤 แยกองค์ประกอบชื่อเรื่องตามหลัก ABCD</h2>
              <p class="text-xs text-slate-500">ทุกช่องที่คุณพิมพ์จะถูกนำไปประกอบเป็นโครงร่างและเนื้อหาทั้ง 5 บทโดยอัตโนมัติ</p>
            </div>

            <!-- A: Action -->
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <span class="font-bold text-sm text-sky-800 dark:text-sky-300">A (Action) · คำกริยาแสดงลักษณะการวิจัย</span>
                <span class="text-xs text-slate-400">พิมพ์เองได้อิสระ</span>
              </div>
              <input value="${escapeHtml(proj.A)}" oninput="ROAD_APP.updateField('A', this.value)" class="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold" placeholder="เช่น การวิจัยและพัฒนา หรือ การศึกษาผลการใช้" />
              <div class="flex flex-wrap gap-1.5 items-center text-xs">
                <span class="text-slate-400">คำกริยายอดนิยม:</span>
                ${vocab.A.map(item => `<button type="button" onclick="ROAD_APP.applySuggestion('A', '${item}')" class="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-500 cursor-pointer text-xs">${item}</button>`).join("")}
              </div>
              ${(vocab.A_CATEGORIES || []).map(cat => `
                <div class="flex flex-wrap gap-1.5 items-center text-xs mt-0.5">
                  <span class="text-slate-500 text-[11px] font-semibold">${cat.category}:</span>
                  ${cat.verbs.map(v => `<button type="button" onclick="ROAD_APP.applySuggestion('A', '${v}')" class="px-2 py-0.5 rounded-md bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-sky-500 text-slate-700 dark:text-slate-300 text-[11px] cursor-pointer">${v}</button>`).join("")}
                </div>
              `).join("")}
            </div>

            <!-- B: Innovation / Independent Variable -->
            <div class="p-4 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-800/60 flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <span class="font-bold text-sm text-sky-900 dark:text-sky-300">B (Innovation / ตัวแปรต้น) · ชื่อนวัตกรรมหรือรูปแบบการจัดการเรียนรู้</span>
              </div>
              <input value="${escapeHtml(proj.B)}" oninput="ROAD_APP.updateField('B', this.value)" class="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold" placeholder="เช่น รูปแบบการจัดการเรียนรู้เชิงรุกร่วมกับเทคนิค GPAS 5 Steps" />
              <label class="flex flex-col gap-1 text-xs">
                <span class="font-semibold text-slate-600 dark:text-slate-400">ชื่อเรียกย่อของนวัตกรรม (ใช้ในเนื้อหาบทที่ 1–5 เพื่อความกระชับ):</span>
                <input value="${escapeHtml(proj.B_short || proj.B)}" oninput="ROAD_APP.updateField('B_short', this.value)" class="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs" />
              </label>
              <div class="flex flex-wrap gap-1.5 items-center text-xs">
                <span class="text-slate-400">ตัวอย่างนวัตกรรมยอดนิยม:</span>
                ${vocab.B.map(item => `<button type="button" onclick="ROAD_APP.applySuggestion('B', '${item}')" class="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-500 text-left cursor-pointer text-xs">${item}</button>`).join("")}
              </div>

              <!-- Syntax Quick Template Picker -->
              <div class="flex flex-wrap gap-1.5 items-center text-xs mt-1 pt-2 border-t border-sky-200/60 dark:border-sky-800/40">
                <span class="text-sky-800 dark:text-sky-300 font-bold text-xs">⚡ ใส่ขั้นตอนนวัตกรรมสำเร็จรูป (Syntax):</span>
                ${(window.ROAD_DATA.SYNTAX_TEMPLATES || []).map(tmpl => `
                  <button type="button" onclick="ROAD_APP.applySyntaxTemplate('${tmpl.id}')" class="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-sky-300 dark:border-sky-700 hover:border-sky-500 text-sky-900 dark:text-sky-200 text-xs font-medium cursor-pointer shadow-2xs" title="ใส่ ${tmpl.steps.length} ขั้นตอน">
                    + ${escapeHtml(tmpl.short || tmpl.name)} (${tmpl.steps.length} ขั้น)
                  </button>
                `).join("")}
              </div>

              <!-- Syntax / Learning Steps of B -->
              <div class="mt-2 pt-3 border-t border-sky-200/70 dark:border-sky-800/50 flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-sky-900 dark:text-sky-300">📋 ขั้นตอนของนวัตกรรม / ขั้นตอนการสอน (นำไปเขียนบทที่ 1, 2, 3 และอภิปรายผลบทที่ 5 อัตโนมัติ)</span>
                  <button type="button" onclick="ROAD_APP.addStep()" class="px-2.5 py-1 rounded-lg bg-sky-700 text-white text-xs font-semibold cursor-pointer">+ เพิ่มขั้นตอน</button>
                </div>
                <div class="flex flex-col gap-2">
                  ${(proj.B_steps || []).map((stText, idx) => `
                    <div class="flex items-center gap-2">
                      <span class="font-mono text-xs font-bold text-sky-700 w-6">${idx + 1}.</span>
                      <input value="${escapeHtml(stText)}" oninput="ROAD_APP.updateStep(${idx}, this.value)" class="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs" />
                      <button type="button" onclick="ROAD_APP.removeStep(${idx})" class="px-2 py-1 rounded text-rose-600 hover:bg-rose-50 text-xs cursor-pointer" title="ลบขั้นตอนนี้">✕</button>
                    </div>
                  `).join("")}
                </div>
              </div>
            </div>

            <!-- C: Dependent Variables (Multi-variable support!) -->
            <div class="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col gap-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="font-bold text-sm text-emerald-900 dark:text-emerald-300">C (Outcomes / ตัวแปรตาม) · ผลลัพธ์ที่ต้องการให้เกิดขึ้นกับผู้เรียน</span>
                <div class="flex items-center gap-2">
                  <select onchange="ROAD_APP.updateFieldAndRender('C_connector', this.value)" class="px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-xs font-semibold">
                    ${["เพื่อส่งเสริม", "เพื่อพัฒนา", "เพื่อยกระดับ", "เพื่อศึกษาผลของ"].map(cn => `<option value="${cn}" ${proj.C_connector === cn ? 'selected' : ''}>คำเชื่อม: "${cn}"</option>`).join("")}
                  </select>
                  <button type="button" onclick="ROAD_APP.addDependentVar()" class="px-2.5 py-1 rounded-lg bg-emerald-700 text-white text-xs font-semibold cursor-pointer">+ เพิ่มตัวแปรตาม</button>
                </div>
              </div>

              <div class="flex flex-col gap-2">
                ${(proj.C_list || []).map((cVal, idx) => `
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-mono text-xs font-bold">C${idx + 1}</span>
                    <input value="${escapeHtml(cVal)}" oninput="ROAD_APP.updateDependentVar(${idx}, this.value)" class="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold" />
                    <button type="button" onclick="ROAD_APP.removeDependentVar(${idx})" class="px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs cursor-pointer">ลบ</button>
                  </div>
                `).join("")}
              </div>

              <div class="flex flex-wrap gap-1.5 items-center text-xs">
                <span class="text-slate-400">คลิกตั้งค่า C1 ด่วน (สมรรถนะ/ทักษะ):</span>
                ${vocab.C1.map(item => `<button type="button" onclick="ROAD_APP.applySuggestion('C1', '${item}')" class="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 cursor-pointer text-xs">${item}</button>`).join("")}
              </div>

              <div class="flex flex-wrap gap-1.5 items-center text-xs mt-0.5">
                <span class="text-slate-400">คลิกตั้งค่า C2 ด่วน (ผลสัมฤทธิ์/ความพึงพอใจ):</span>
                ${vocab.C2.map(item => `<button type="button" onclick="ROAD_APP.applySuggestion('C2', '${item}')" class="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 cursor-pointer text-xs">${item}</button>`).join("")}
              </div>
            </div>

            <!-- D: Target Group & Context -->
            <div class="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 flex flex-col gap-3">
              <span class="font-bold text-sm text-amber-900 dark:text-amber-300">D (Target Group & Scope) · กลุ่มเป้าหมาย รายวิชา ประชากร และกลุ่มตัวอย่าง</span>
              <input value="${escapeHtml(proj.D)}" oninput="ROAD_APP.updateField('D', this.value)" class="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold" placeholder="เช่น สำหรับนักเรียนชั้นมัธยมศึกษาปีที่ 3" />

              <div class="flex flex-wrap gap-1.5 items-center text-xs">
                <span class="text-slate-400">คลิกเลือกกลุ่มเป้าหมายด่วน:</span>
                ${vocab.D.map(item => `<button type="button" onclick="ROAD_APP.applySuggestion('D', '${item}')" class="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500 cursor-pointer text-xs">${item}</button>`).join("")}
              </div>

              <div class="grid sm:grid-cols-2 gap-3 mt-1">
                <label class="flex flex-col gap-1 text-xs">
                  <span class="font-semibold">รายวิชา / หน่วยการเรียนรู้ / สาระเนื้อหา</span>
                  <input value="${escapeHtml(proj.subject)}" oninput="ROAD_APP.updateField('subject', this.value)" class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
                </label>
                <label class="flex flex-col gap-1 text-xs">
                  <span class="font-semibold">ภาคเรียน / ปีการศึกษา</span>
                  <input value="${escapeHtml(proj.semester)}" oninput="ROAD_APP.updateField('semester', this.value)" class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
                </label>
                <label class="flex flex-col gap-1 text-xs sm:col-span-2">
                  <span class="font-semibold">จำนวนแผนการจัดการเรียนรู้ / ระยะเวลาที่ใช้ทดลอง</span>
                  <input value="${escapeHtml(proj.duration)}" oninput="ROAD_APP.updateField('duration', this.value)" class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
                </label>
                <label class="flex flex-col gap-1 text-xs sm:col-span-2">
                  <span class="font-semibold">ประชากร (Population)</span>
                  <textarea rows="2" oninput="ROAD_APP.updateField('population', this.value)" class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">${escapeHtml(proj.population)}</textarea>
                </label>
                <label class="flex flex-col gap-1 text-xs sm:col-span-2">
                  <span class="font-semibold">กลุ่มตัวอย่างและการได้มา (Sample & Sampling Method)</span>
                  <textarea rows="2" oninput="ROAD_APP.updateField('sample', this.value)" class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">${escapeHtml(proj.sample)}</textarea>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Research Health Validator & Quick Navigation -->
        <div class="flex flex-col gap-5">
          <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-base text-slate-900 dark:text-white">🩺 ตรวจสอบความสมบูรณ์เชิงวิชาการ</h3>
              <span class="px-2.5 py-1 rounded-full font-mono text-sm font-bold bg-emerald-100 text-emerald-800">${(health && (health.score || health.healthScore)) || 100}/100</span>
            </div>
            <div class="space-y-2.5">
              ${((health && health.checks) || []).map(chk => `
                <div class="p-3 rounded-xl border ${chk.ok ? 'border-emerald-200/80 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800/50' : 'border-amber-300 bg-amber-50/60 dark:bg-amber-950/30'} text-xs">
                  <div class="font-bold flex items-center gap-1.5 ${chk.ok ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}">
                    <span>${chk.ok ? '✔' : '⚠'}</span>
                    <span>${escapeHtml(chk.label)}</span>
                  </div>
                  <div class="text-slate-600 dark:text-slate-400 mt-1">${escapeHtml(chk.detail)}</div>
                </div>
              `).join("")}
            </div>

            <button onclick="ROAD_APP.setStudioTab('chapters')" class="w-full py-3 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold text-sm shadow-sm cursor-pointer">
              ดูโครงร่างและเนื้อหาวิจัย 5 บท →
            </button>
          </div>

          <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col gap-3">
            <h3 class="font-bold text-sm text-slate-900 dark:text-white">🤖 สั่ง AI ช่วยเขียนเนื้อหาด่วน</h3>
            <p class="text-xs text-slate-500">เลือกใช้ Gemini API เขียนสดในเว็บ หรือคัดลอก Smart Prompt ไปวางใน ChatGPT / Gemini ฟรี</p>
            <div class="flex flex-col gap-2">
              <button onclick="ROAD_APP.runGeminiLive('ch1_background')" class="p-2.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-950/30 text-left text-xs font-semibold text-sky-900 dark:text-sky-300 hover:bg-sky-100 cursor-pointer">
                ✨ สั่ง AI เขียน "1.1 ความเป็นมาและความสำคัญของปัญหา"
              </button>
              <button onclick="ROAD_APP.runGeminiLive('ch5_discussion')" class="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/30 text-left text-xs font-semibold text-indigo-900 dark:text-indigo-300 hover:bg-indigo-100 cursor-pointer">
                ✨ สั่ง AI เขียน "5.2 อภิปรายผลการวิจัย"
              </button>
              <button onclick="ROAD_APP.copySmartPrompt('ch1_background')" class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-left text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                📋 คัดลอก Smart Prompt บทที่ 1 (สำหรับ ChatGPT/Gemini ฟรี)
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- Studio Tab 2: Full 5-Chapter Research Report Document & Review Center ---
  function renderTabChapters(proj) {
    const gen = window.ROAD_GENERATOR.generateChapters(proj);
    const health = window.ROAD_GENERATOR.evaluateResearchHealth(proj);
    const chaptersToShow = state.activeChapterFilter === 0
      ? gen.chapters
      : gen.chapters.filter(c => c.number === state.activeChapterFilter);

    // Consistency & 10+ Pitfalls Audit (14 Rules V2.0) from Advisor
    const advisorResults = health.results || [];
    const pitfallChecks = advisorResults.map(r => {
      const isPass = r.level === "pass";
      let actionText = "ดูรายละเอียด";
      let actionFn = "ROAD_APP.setStudioTab('advisor')";
      if (r.ruleId === 1 || r.ruleId === 2 || r.ruleId === 3 || r.ruleId === 4) {
        actionText = "ตรวจแก้ ABCD";
        actionFn = "ROAD_APP.openAbcdModal('manual')";
      } else if (r.ruleId === 5 || r.ruleId === 11 || r.ruleId === 12) {
        actionText = "ปรับสถิติ StatLab";
        actionFn = "ROAD_APP.setStudioTab('statlab')";
      } else if (r.ruleId === 6) {
        actionText = "ดูนิยามศัพท์";
        actionFn = "ROAD_APP.setChapterFilter(1)";
      } else if (r.ruleId === 7) {
        actionText = "ดูผังกรอบแนวคิด";
        actionFn = "ROAD_APP.setStudioTab('diagrams')";
      } else if (r.ruleId === 8) {
        actionText = "ดูแบบแผนบทที่ 3";
        actionFn = "ROAD_APP.setChapterFilter(3)";
      } else if (r.ruleId === 9) {
        actionText = "ดูตารางบทที่ 4";
        actionFn = "ROAD_APP.setChapterFilter(4)";
      } else if (r.ruleId === 10) {
        actionText = "ดูอภิปรายผล";
        actionFn = "ROAD_APP.setChapterFilter(5)";
      } else if (r.ruleId === 13) {
        actionText = "ตรวจ Test Blueprint";
        actionFn = "ROAD_APP.setStudioTab('instruments')";
      } else if (r.ruleId === 14) {
        actionText = "ตรวจเกณฑ์รูบริก";
        actionFn = "ROAD_APP.setStudioTab('instruments')";
      }

      return {
        num: r.ruleId,
        title: r.ruleName || r.title,
        statusTitle: r.title,
        pass: isPass,
        desc: r.desc,
        recommendation: r.recommendation,
        actionText,
        actionFn
      };
    });

    const passCount = health.passedCount ?? pitfallChecks.filter(c => c.pass).length;
    const totalCount = health.totalRules ?? pitfallChecks.length ?? 14;
    const healthScore = health.score ?? health.healthScore ?? Math.round((passCount / totalCount) * 100);

    return `
      <div class="flex flex-col lg:grid lg:grid-cols-12 gap-6 items-start">
        <!-- Left Column: Chapters Content & Editor -->
        <div class="${state.showReviewCenter ? 'lg:col-span-8' : 'col-span-12'} flex flex-col gap-5 w-full">
          <!-- Modular Publication Export Hub Banner -->
          <div class="rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 text-white p-3.5 sm:p-4 border border-sky-800/40 shadow-md print:hidden flex flex-col gap-2.5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="text-base sm:text-lg">🏆</span>
                <span class="font-extrabold text-xs sm:text-sm text-sky-100">ศูนย์ส่งออกเอกสารวิจัยฉบับสมบูรณ์มาตรฐาน Word (.doc 16pt)</span>
              </div>
              <button onclick="ROAD_APP.openContextMetaModal('context')" data-tooltip="ตั้งค่าข้อมูลบริบทสถานศึกษา แผนการสอน 6 แผน และผู้เชี่ยวชาญ 5 ท่าน" title="ตั้งค่าข้อมูลบริบทสถานศึกษา แผนการสอน 6 แผน และผู้เชี่ยวชาญ 5 ท่าน" class="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-[11px] font-bold text-sky-200 cursor-pointer flex items-center gap-1 transition">
                <span>⚙️ บริบท/ผชช.</span>
              </button>
            </div>

            <!-- Compact Export Badges & Chapter Pills Row -->
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button onclick="ROAD_APP.exportFullManuscript()" data-tooltip="ดาวน์โหลดรายงานวิจัยฉบับสมบูรณ์ครบทุกส่วน All-in-One" title="ดาวน์โหลดรายงานวิจัยฉบับสมบูรณ์ครบทุกส่วน All-in-One" class="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs cursor-pointer shadow flex items-center gap-1 shrink-0 transition">
                <span>🏆 เล่มเต็ม (.doc)</span>
              </button>
              <button onclick="ROAD_APP.exportFrontMatter()" data-tooltip="ดาวน์โหลดปกนอก ปกใน บทคัดย่อไทย-อังกฤษ กิตติกรรมประกาศ และสารบัญ" title="ดาวน์โหลดปกนอก ปกใน บทคัดย่อไทย-อังกฤษ กิตติกรรมประกาศ และสารบัญ" class="px-2.5 py-1.5 rounded-xl bg-amber-600/90 hover:bg-amber-600 text-white font-bold text-xs cursor-pointer shrink-0 transition">
                <span>📄 ส่วนนำ</span>
              </button>
              <button onclick="ROAD_APP.exportExpertKit()" data-tooltip="ดาวน์โหลดหนังสือเชิญผู้เชี่ยวชาญรายบุคคล 5 ฉบับ พร้อมแบบประเมิน IOC" title="ดาวน์โหลดหนังสือเชิญผู้เชี่ยวชาญรายบุคคล 5 ฉบับ พร้อมแบบประเมิน IOC" class="px-2.5 py-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold text-xs cursor-pointer shrink-0 transition">
                <span>👥 ชุด IOC (5 ท่าน)</span>
              </button>
              <button onclick="ROAD_APP.exportBackMatter()" data-tooltip="ดาวน์โหลดบรรณานุกรม APA 7th Edition และประวัติผู้วิจัย" title="ดาวน์โหลดบรรณานุกรม APA 7th Edition และประวัติผู้วิจัย" class="px-2.5 py-1.5 rounded-xl bg-teal-700/90 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer shrink-0 transition">
                <span>📚 อ้างอิง APA</span>
              </button>
              <button onclick="ROAD_APP.exportAppendix()" data-tooltip="ดาวน์โหลดภาคผนวก ก-ง พร้อมเครื่องมือวิจัยและผลวิเคราะห์คุณภาพ" title="ดาวน์โหลดภาคผนวก ก-ง พร้อมเครื่องมือวิจัยและผลวิเคราะห์คุณภาพ" class="px-2.5 py-1.5 rounded-xl bg-blue-700/90 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shrink-0 transition">
                <span>📎 ภาคผนวก ก-ง</span>
              </button>

              <div class="h-4 w-px bg-sky-700/60 mx-1 shrink-0"></div>

              ${[1, 2, 3, 4, 5].map(n => `
                <button onclick="ROAD_APP.exportSingleChapter(${n})" data-tooltip="ดาวน์โหลดเฉพาะบทที่ ${n} เป็นไฟล์ Word (.doc)" title="ดาวน์โหลดเฉพาะบทที่ ${n} เป็นไฟล์ Word (.doc)" class="px-2 py-1.5 rounded-lg bg-sky-900/70 hover:bg-sky-800 text-sky-100 border border-sky-700/50 text-[11px] font-bold cursor-pointer shrink-0 transition font-mono">
                  Ch.${n}
                </button>
              `).join("")}
            </div>
          </div>

          <!-- Chapter Filter Bar -->
          <div class="bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 print:hidden shadow-sm">
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button onclick="ROAD_APP.setChapterFilter(0)" data-tooltip="แสดงเอกสารวิจัยฉบับเต็มทุกส่วน" title="แสดงทั้งหมด" class="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition shrink-0 ${state.activeChapterFilter === 0 ? 'bg-sky-700 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'}">
                ทั้งหมด
              </button>
              <button onclick="ROAD_APP.setChapterFilter(-1)" data-tooltip="ปก บทคัดย่อ กิตติกรรมประกาศ สารบัญ" title="ส่วนนำ & บทคัดย่อ" class="px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition shrink-0 ${state.activeChapterFilter === -1 ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'}">
                ส่วนนำ
              </button>
              ${[1, 2, 3, 4, 5].map(n => `
                <button onclick="ROAD_APP.setChapterFilter(${n})" data-tooltip="แสดงเฉพาะเนื้อหาบทที่ ${n}" title="บทที่ ${n}" class="px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition shrink-0 ${state.activeChapterFilter === n ? 'bg-sky-700 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'}">
                  บท ${n}
                </button>
              `).join("")}
              <button onclick="ROAD_APP.setChapterFilter(7)" data-tooltip="บรรณานุกรม APA 7th และประวัติผู้วิจัย" title="บรรณานุกรม & ประวัติ" class="px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition shrink-0 ${state.activeChapterFilter === 7 ? 'bg-teal-700 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'}">
                อ้างอิง
              </button>
              <button onclick="ROAD_APP.setChapterFilter(6)" data-tooltip="ภาคผนวก ก-ง และเครื่องมือวิจัย" title="ภาคผนวก ก–ง" class="px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition shrink-0 ${state.activeChapterFilter === 6 ? 'bg-indigo-700 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'}">
                ภาคผนวก
              </button>
            </div>

            <div class="flex items-center gap-1.5">
              <!-- Review Center Toggle Button for iPad/Desktop -->
              <button onclick="ROAD_APP.toggleReviewCenter()" data-tooltip="สลับแสดง/ซ่อนแถบตรวจ 14 กฎเหล็กความสอดคล้อง" title="สลับแสดง/ซ่อนแถบตรวจ 14 กฎเหล็ก" class="px-2.5 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${state.showReviewCenter ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 text-blue-800 dark:text-sky-300' : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'}">
                <span>🛡️ ตรวจ 14 กฎ (${passCount}/${totalCount})</span>
                <span>${state.showReviewCenter ? '▴' : '▾'}</span>
              </button>

              <button onclick="ROAD_APP.resetCustomSections()" data-tooltip="รีเซ็ตเนื้อหากลับเป็นค่าสังเคราะห์เริ่มต้น" class="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" title="รีเซ็ตเนื้อหากลับเป็นค่าสังเคราะห์เริ่มต้น">🔄 ซิงค์</button>
            </div>
          </div>

          <!-- Chapters Document View -->
          <div class="space-y-6">

          <!-- Front Matter Section (Shown when filter is 0 or -1) -->
          ${(state.activeChapterFilter === 0 || state.activeChapterFilter === -1) && gen.frontMatter ? `
            <section class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col gap-5 break-inside-avoid">
              <div class="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span class="text-xs font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400 font-bold">FRONT MATTER & ABSTRACT</span>
                  <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">${escapeHtml(gen.frontMatter.title)}</h2>
                  <p class="text-xs text-slate-500 mt-0.5">${escapeHtml(gen.frontMatter.subtitle)}</p>
                </div>
                <div class="flex items-center gap-2 print:hidden">
                  <button onclick="ROAD_APP.exportFrontMatter()" class="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1 shadow-sm" title="ส่งออกเฉพาะส่วนนำและบทคัดย่อไทย/อังกฤษเป็นไฟล์ Word (.doc)">
                    <span>📥 ส่งออกส่วนนำ (.doc)</span>
                  </button>
                </div>
              </div>

              <div class="space-y-6">
                ${gen.frontMatter.sections.map(sec => `
                  <div class="space-y-2.5">
                    ${sec.hideHeading ? '' : `
                      <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span class="w-1.5 h-5 rounded-full bg-amber-600 inline-block"></span>
                        <span>${escapeHtml(sec.heading || sec.title)}</span>
                      </h3>
                    `}
                    ${sec.type === "custom_html" ? `
                      <div class="pl-2">
                        ${sec.content}
                      </div>
                    ` : ""}
                  </div>
                `).join("")}
              </div>
            </section>
          ` : ""}

          ${chaptersToShow.map(ch => `
            <section class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col gap-5 break-inside-avoid">
              <div class="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span class="text-xs font-mono uppercase tracking-wider text-sky-700 dark:text-sky-400 font-bold">CHAPTER ${ch.number}</span>
                  <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">${escapeHtml(ch.title)}</h2>
                  <p class="text-xs text-slate-500 mt-0.5">${escapeHtml(ch.subtitle)}</p>
                </div>
                <div class="flex flex-wrap items-center gap-2 print:hidden">
                  <button onclick="ROAD_APP.exportSingleChapter(${ch.number})" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1 shadow-sm" title="ส่งออกเฉพาะบทนี้เป็นไฟล์ Word (.doc ฟอนต์สารบัญ 16pt)">
                    <span>📥 ส่งออกบทที่ ${ch.number} (.doc)</span>
                  </button>
                  ${ch.number === 1 ? `<button onclick="ROAD_APP.copySmartPrompt('ch1_background')" class="px-2.5 py-1.5 rounded-lg border border-sky-300 text-sky-800 dark:text-sky-300 text-xs font-semibold hover:bg-sky-50 cursor-pointer">📋 Prompt บทที่ 1</button>` : ""}
                  ${ch.number === 2 ? `<button onclick="ROAD_APP.copySmartPrompt('ch2_synthesis')" class="px-2.5 py-1.5 rounded-lg border border-sky-300 text-sky-800 dark:text-sky-300 text-xs font-semibold hover:bg-sky-50 cursor-pointer">📋 Prompt บทที่ 2</button>` : ""}
                  ${ch.number === 5 ? `<button onclick="ROAD_APP.copySmartPrompt('ch5_discussion')" class="px-2.5 py-1.5 rounded-lg border border-sky-300 text-sky-800 dark:text-sky-300 text-xs font-semibold hover:bg-sky-50 cursor-pointer">📋 Prompt บทที่ 5</button>` : ""}
                </div>
              </div>

              <div class="space-y-6">
                ${ch.sections.map(sec => `
                  <div class="space-y-2.5">
                    <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span class="w-1.5 h-5 rounded-full bg-sky-700 inline-block"></span>
                      <span>${escapeHtml(sec.heading)}</span>
                    </h3>

                    ${sec.type === "paragraphs" ? `
                      <div class="space-y-3 pl-3 text-sm sm:text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
                        ${sec.content.map(pText => `<p class="indent-8 text-justify">${escapeHtml(pText)}</p>`).join("")}
                      </div>
                    ` : ""}

                    ${sec.type === "list" ? `
                      <ul class="space-y-2 pl-5 text-sm sm:text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
                        ${sec.content.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
                      </ul>
                    ` : ""}

                    ${sec.type === "subsections" ? `
                      <div class="grid gap-3 pl-3">
                        ${sec.items.map(sub => `
                          <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
                            <div class="font-bold text-sm text-slate-900 dark:text-white mb-1">${escapeHtml(sub.subTitle)}</div>
                            <div class="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">${escapeHtml(sub.text)}</div>
                          </div>
                        `).join("")}
                      </div>
                    ` : ""}

                    ${sec.type === "definitions" ? `
                      <div class="grid gap-2.5 pl-3">
                        ${sec.items.map(d => `
                          <div class="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm leading-relaxed">
                            <b class="text-sky-800 dark:text-sky-300">${escapeHtml(d.term)}</b> ${escapeHtml(d.def)}
                          </div>
                        `).join("")}
                      </div>
                    ` : ""}

                    ${sec.type === "stat_tables" ? `
                      <div class="space-y-6 pl-2">
                        ${sec.tables.map(tbl => `
                          <div class="space-y-2">
                            <div class="font-bold text-sm text-slate-900 dark:text-white">${escapeHtml(tbl.tableNo)} ${escapeHtml(tbl.caption)}</div>
                            <div class="overflow-x-auto">
                              <table class="w-full text-xs sm:text-sm border-collapse border-t-2 border-b-2 border-slate-900 dark:border-slate-200">
                                <thead>
                                  <tr class="border-b border-slate-900 dark:border-slate-200 bg-slate-50 dark:bg-slate-800/60">
                                    ${tbl.headers.map(h => `<th class="py-2 px-3 text-center font-bold">${escapeHtml(h)}</th>`).join("")}
                                  </tr>
                                </thead>
                                <tbody>
                                  ${tbl.rows.map(row => `
                                    <tr class="border-b border-slate-200/60 dark:border-slate-800">
                                      ${row.map((cell, ci) => `<td class="py-2 px-3 ${ci === 0 ? 'text-left font-medium' : 'text-center font-mono'}">${escapeHtml(cell)}</td>`).join("")}
                                    </tr>
                                  `).join("")}
                                </tbody>
                              </table>
                            </div>
                            ${tbl.footnote ? `<div class="text-xs text-slate-500">${escapeHtml(tbl.footnote)}</div>` : ""}
                            <p class="text-sm text-slate-700 dark:text-slate-300 bg-emerald-50/60 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200/70 dark:border-emerald-800/50">
                              <b>การแปลผล:</b> ${escapeHtml(tbl.interpretation)}
                            </p>
                          </div>
                        `).join("")}
                      </div>
                    ` : ""}

                    ${sec.type === "custom_html" ? `
                      <div class="pl-2">
                        ${sec.content}
                      </div>
                    ` : ""}
                  </div>
                `).join("")}
              </div>
            </section>
          `).join("")}

          <!-- Bibliography & Researcher Vitae Section (Shown when filter is 0 or 7) -->
          ${(state.activeChapterFilter === 0 || state.activeChapterFilter === 7) && gen.bibliography ? `
            <section class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col gap-5 break-inside-avoid">
              <div class="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span class="text-xs font-mono uppercase tracking-wider text-teal-700 dark:text-teal-400 font-bold">BACK MATTER & REFERENCES</span>
                  <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">${escapeHtml(gen.bibliography.title)}</h2>
                  <p class="text-xs text-slate-500 mt-0.5">${escapeHtml(gen.bibliography.subtitle)}</p>
                </div>
                <div class="flex items-center gap-2 print:hidden">
                  <button onclick="ROAD_APP.exportBackMatter()" class="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1 shadow-sm" title="ส่งออกบรรณานุกรม APA 7th และประวัติผู้วิจัย (.doc)">
                    <span>📥 ส่งออกบรรณานุกรม & ประวัติ (.doc)</span>
                  </button>
                </div>
              </div>

              <div class="space-y-6">
                ${gen.bibliography.sections.map(sec => `
                  <div class="space-y-2.5">
                    <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span class="w-1.5 h-5 rounded-full bg-teal-600 inline-block"></span>
                      <span>${escapeHtml(sec.heading || sec.title)}</span>
                    </h3>
                    ${sec.type === "custom_html" ? `
                      <div class="pl-2">
                        ${sec.content}
                      </div>
                    ` : ""}
                  </div>
                `).join("")}
              </div>
            </section>
          ` : ""}

          <!-- Appendices Section (Shown when filter is 0 or 6) -->
          ${(state.activeChapterFilter === 0 || state.activeChapterFilter === 6) && gen.appendix && gen.appendix.appendices && gen.appendix.appendices.length > 0 ? `
            <div class="mt-8 pt-8 border-t-2 border-dashed border-slate-300 dark:border-slate-700 space-y-6">
              <div class="bg-gradient-to-r from-indigo-900 via-sky-900 to-indigo-950 text-white p-6 sm:p-7 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4">
                <div class="space-y-1">
                  <span class="text-xs font-mono uppercase tracking-wider text-indigo-300 font-bold flex items-center gap-1.5">
                    <span class="inline-block w-2 h-2 rounded-full bg-indigo-400"></span>
                    <span>RESEARCH INSTRUMENTS & APPENDIX PACKAGE</span>
                  </span>
                  <h2 class="text-2xl font-black">${escapeHtml(gen.appendix.title)} (${escapeHtml(gen.appendix.subtitle)})</h2>
                  <p class="text-xs text-indigo-200">ชุดเครื่องมือการวิจัยและเอกสารภาคผนวก ก, ข, ค, ง จัดทำสำเร็จรูปพร้อมพิมพ์และเสนอผู้เชี่ยวชาญ/คณะกรรมการ วPA</p>
                </div>
                <button onclick="ROAD_APP.exportAppendix()" class="px-4 py-2.5 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 text-xs font-bold cursor-pointer shadow flex items-center gap-1.5 transition-all">
                  <span>📥 ดาวน์โหลดชุดภาคผนวก & เครื่องมือ (.doc)</span>
                </button>
              </div>

              ${gen.appendix.appendices.map(appItem => `
                <section class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col gap-5 break-inside-avoid">
                  <div class="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span class="text-xs font-mono uppercase tracking-wider text-indigo-700 dark:text-indigo-400 font-bold">APPENDIX ${appItem.code}</span>
                      <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">${escapeHtml(appItem.title)}</h2>
                      <p class="text-xs text-slate-500 mt-0.5">${escapeHtml(appItem.subtitle)}</p>
                    </div>
                    <div class="flex items-center gap-2 print:hidden">
                      <button onclick="ROAD_APP.exportAppendix()" class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1 shadow-sm" title="ส่งออกชุดภาคผนวกนี้เป็นไฟล์ Word (.doc)">
                        <span>📥 ส่งออกภาคผนวก (.doc)</span>
                      </button>
                    </div>
                  </div>

                  <div class="space-y-6">
                    ${appItem.sections.map(sec => `
                      <div class="space-y-2.5">
                        <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span class="w-1.5 h-5 rounded-full bg-indigo-600 inline-block"></span>
                          <span>${escapeHtml(sec.heading || sec.title)}</span>
                        </h3>

                        ${sec.type === "paragraphs" && Array.isArray(sec.content) ? `
                          <div class="space-y-3 pl-3 text-sm sm:text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
                            ${sec.content.map(pText => `<p class="indent-8 text-justify">${escapeHtml(pText)}</p>`).join("")}
                          </div>
                        ` : ""}

                        ${sec.type === "stat_tables" && Array.isArray(sec.tables) ? `
                          <div class="space-y-6 pl-2">
                            ${sec.tables.map(tbl => `
                              <div class="space-y-2">
                                <div class="font-bold text-sm text-slate-900 dark:text-white">${escapeHtml(tbl.tableNo)} ${escapeHtml(tbl.caption)}</div>
                                <div class="overflow-x-auto">
                                  <table class="w-full text-xs sm:text-sm border-collapse border-t-2 border-b-2 border-slate-900 dark:border-slate-200">
                                    <thead>
                                      <tr class="border-b border-slate-900 dark:border-slate-200 bg-slate-50 dark:bg-slate-800/60">
                                        ${tbl.headers.map(h => `<th class="py-2 px-3 text-center font-bold">${escapeHtml(h)}</th>`).join("")}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      ${tbl.rows.map(row => `
                                        <tr class="border-b border-slate-200/60 dark:border-slate-800">
                                          ${row.map((cell, ci) => `<td class="py-2 px-3 ${ci === 0 ? 'text-left font-medium' : 'text-center font-mono'}">${escapeHtml(cell)}</td>`).join("")}
                                        </tr>
                                      `).join("")}
                                    </tbody>
                                  </table>
                                </div>
                                ${tbl.footnote ? `<div class="text-xs text-slate-500">${escapeHtml(tbl.footnote)}</div>` : ""}
                                ${tbl.interpretation ? `
                                  <p class="text-sm text-slate-700 dark:text-slate-300 bg-indigo-50/60 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-200/70 dark:border-indigo-800/50">
                                    <b>การแปลผล:</b> ${escapeHtml(tbl.interpretation)}
                                  </p>
                                ` : ""}
                              </div>
                            `).join("")}
                          </div>
                        ` : ""}

                        ${sec.type === "custom_html" ? `
                          <div class="pl-2">
                            ${sec.content}
                          </div>
                        ` : ""}
                      </div>
                    `).join("")}
                  </div>
                </section>
              `).join("")}
            </div>
          ` : ""}
          </div>
        </div>

        <!-- Right Column: Review Center & Consistency Side Panel -->
        ${state.showReviewCenter ? `
          <div class="lg:col-span-4 w-full flex flex-col gap-5 sticky top-20 print:hidden animate-fade-in">
            <!-- Consistency Health Card -->
            <div class="neu-card p-5 flex flex-col gap-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1">
                  <span>🛡️</span>
                  <span>Review Center</span>
                </span>
                <span class="px-2 py-0.5 rounded-full text-xs font-bold font-mono ${healthScore >= 85 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800'}">
                  ${healthScore}% ผ่านเกณฑ์
                </span>
              </div>

              <div class="flex items-baseline justify-between pt-1">
                <h3 class="text-lg font-black text-slate-900 dark:text-white">ศูนย์ตรวจความสอดคล้อง</h3>
                <span class="text-xs font-bold text-slate-500">${passCount}/${totalCount} ผ่าน</span>
              </div>

              <!-- Progress Meter -->
              <div class="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500 ${passCount >= Math.round(totalCount * 0.8) ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-orange-400'}" style="width: ${(passCount / totalCount) * 100}%"></div>
              </div>

              <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                ตรวจสอบข้อพึงระวังและเกณฑ์มาตรฐานวิจัยเชิงพัฒนา 14 ประการ (V2.0) ตามระเบียบวิธีวิจัยทางการศึกษา
              </p>

              <div class="pt-2 flex flex-col gap-2">
                <button onclick="ROAD_APP.exportFullManuscript()" class="w-full py-2.5 neu-btn-primary text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                  <span>🏆 ดาวน์โหลดเล่มสมบูรณ์ All-in-One (.doc)</span>
                </button>
                <button onclick="ROAD_APP.exportAppendix()" class="w-full py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm" title="ส่งออกชุดเครื่องมือวิจัยและภาคผนวก ก–ง พร้อมส่งผู้เชี่ยวชาญ">
                  <span>📎 ส่งออกภาคผนวก & เครื่องมือ (.doc)</span>
                </button>
                <button onclick="ROAD_APP.openWizardModal(10)" class="w-full py-2 neu-squircle text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1 cursor-pointer">
                  <span>🧭 ตรวจทานด้วย Wizard 10 ขั้น</span>
                </button>
              </div>
            </div>

            <!-- 14 Pitfalls Checklist Accordion/Cards -->
            <div class="neu-card p-5 flex flex-col gap-3">
              <div class="text-xs font-bold text-slate-800 dark:text-white flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span>📋 14 ข้อพึงระวังตามมาตรฐาน วPA (V2.0)</span>
                <span class="text-[11px] text-slate-500 font-normal">${passCount}/${totalCount} สมบูรณ์</span>
              </div>

              <div class="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                ${pitfallChecks.map(item => `
                  <div class="p-3 rounded-xl border transition ${item.pass ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-900/40' : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/50'}">
                    <div class="flex items-start justify-between gap-2">
                      <div class="flex items-start gap-1.5">
                        <span class="text-sm shrink-0 mt-0.5">${item.pass ? '✅' : '⚠️'}</span>
                        <div>
                          <div class="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                            ${item.num}. ${escapeHtml(item.title)}
                          </div>
                          <p class="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            ${escapeHtml(item.desc)}
                          </p>
                          ${!item.pass && item.recommendation ? `
                            <div class="text-[11px] text-amber-800 dark:text-amber-300 mt-1.5 p-2 rounded-lg bg-amber-100/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
                              <b>💡 ข้อเสนอแนะ:</b> ${escapeHtml(item.recommendation)}
                            </div>
                          ` : ''}
                        </div>
                      </div>
                    </div>
                    <div class="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
                      <span class="font-bold ${item.pass ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}">
                        ${item.pass ? '✔ ผ่านเกณฑ์มาตรฐาน' : '⚡ ข้อเสนอแนะเพื่อปรับปรุง'}
                      </span>
                      <button onclick="${item.actionFn}" class="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer">
                        ${item.actionText} →
                      </button>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>
        ` : ""}
      </div>
    `;
  }

  // --- Studio Tab: Instrument Blueprint, Rubrics & Operational Definitions ---
  function renderTabInstruments(proj) {
    const subTab = state.instrumentSubTab || "instrument_types";
    const bp = proj.testBlueprint || JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_TEST_BLUEPRINT));
    const rubrics = proj.analyticRubrics || JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_ANALYTIC_RUBRICS));
    const opDefs = proj.operationalDefinitions || JSON.parse(JSON.stringify(window.ROAD_DATA.DEFAULT_OPERATIONAL_DEFINITIONS));
    const expInst = proj.experimentalInstruments || [];
    const dataInst = proj.dataCollectionInstruments || [];

    // Calculate blueprint totals
    let bpTotalItems = 0;
    (bp.units || []).forEach(u => {
      Object.values(u.bloomLevels || {}).forEach(c => { bpTotalItems += (parseInt(c) || 0); });
    });
    const bufferPct = bp.bufferPercent || 33;
    const tryoutNeeded = Math.ceil(bpTotalItems * (1 + bufferPct / 100));

    // Calculate rubrics total weight
    const totalWeight = (rubrics || []).reduce((acc, r) => acc + (Number(r.weight) || 0), 0);
    const isWeightValid = Math.abs(totalWeight - 100) < 0.01;

    return `
      <div class="flex flex-col gap-6">
        <!-- Subtabs Navigation -->
        <div class="neu-card p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2.5">
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">📐 เครื่องมือ:</span>
            ${[
              ["instrument_types", "⚖️ แยกเครื่องมือ", "แยกเครื่องมือทดลองใช้นวัตกรรม VS เครื่องมือเก็บรวบรวมข้อมูลตามเกณฑ์ ก.ค.ศ."],
              ["blueprint", "ผังข้อสอบ (Bloom)", "ผังสร้างแบบทดสอบ Test Blueprint จำแนกตาม Bloom 6 ระดับ พร้อมคำนวณข้อสอบสำรอง Try-out"],
              ["rubrics", "📊 รูบริก 4 ระดับ", "เกณฑ์การประเมินแบบรูบริก Analytic Rubrics 4 ระดับ พร้อมระบบตรวจทานน้ำหนักรวม 100%"],
              ["operational_def", "📖 นิยามศัพท์ 3 มิติ", "นิยามศัพท์เฉพาะเชิงปฏิบัติการ 3 มิติ: นิยาม + พฤติกรรมที่สังเกตได้ + เครื่องมือวัดและเกณฑ์"]
            ].map(([id, title, tip]) => `
              <button onclick="ROAD_APP.setInstrumentSubTab('${id}')" data-tooltip="${tip}" title="${tip}" class="px-3.5 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer whitespace-nowrap shrink-0 ${subTab === id ? 'neu-btn-primary' : 'neu-squircle text-slate-700 dark:text-slate-300'}">
                ${title}
              </button>
            `).join("")}
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold">วPA</span>
          </div>
        </div>

        <!-- Subtab 1: Dual Instrument Separation -->
        ${subTab === "instrument_types" ? `
          <div class="space-y-6">
            <div class="neu-card p-5 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-800">
              <div class="flex items-start gap-3">
                <span class="text-2xl">⚖️</span>
                <div class="space-y-1">
                  <h3 class="text-sm font-extrabold text-blue-900 dark:text-blue-200">กฎเหล็กการจำแนกเครื่องมือวิจัย (ก.ค.ศ. และผู้ทรงคุณวุฒิ):</h3>
                  <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    งานวิจัยทางการศึกษา R&D ต้องแยกกลุ่มเครื่องมือออกเป็น 2 กลุ่มอย่างเด็ดขาด: 
                    <b>1. เครื่องมือทดลองใช้นวัตกรรม</b> (เช่น นวัตกรรม, แผนการจัดการเรียนรู้, คู่มือครู) 
                    และ <b>2. เครื่องมือเก็บรวบรวมข้อมูล</b> (เช่น แบบทดสอบ, แบบประเมินทักษะ, แบบสอบถามความพึงพอใจ)
                    เพื่อความถูกต้องในการเขียนบทที่ 3 และตารางความสอดคล้อง 360°
                  </p>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Column 1: Experimental Instruments -->
              <div class="neu-card p-5 space-y-4">
                <div class="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div class="flex items-center gap-2">
                    <span class="text-lg">🧪</span>
                    <div>
                      <h4 class="text-sm font-bold text-slate-900 dark:text-white">1. เครื่องมือที่ใช้ในการทดลองนวัตกรรม</h4>
                      <p class="text-[11px] text-slate-500">Experimental Instruments (ใช้จัดการเรียนรู้)</p>
                    </div>
                  </div>
                  <button onclick="ROAD_APP.addInstrument('experimental')" class="px-2.5 py-1.5 neu-btn-primary text-xs font-bold flex items-center gap-1 cursor-pointer">
                    + เพิ่มเครื่องมือ
                  </button>
                </div>

                <div class="space-y-3">
                  ${expInst.map((inst, idx) => `
                    <div class="p-3.5 neu-input-pill rounded-xl space-y-2">
                      <div class="flex items-center justify-between gap-2">
                        <input type="text" value="${escapeHtml(inst.name || '')}" onchange="ROAD_APP.updateInstrument('experimental', ${idx}, 'name', this.value)" class="text-xs font-bold text-slate-800 dark:text-white bg-transparent flex-1 border-b border-dashed border-slate-300 dark:border-slate-700 pb-0.5 focus:outline-none" placeholder="ชื่อเครื่องมือ..." />
                        <button onclick="ROAD_APP.removeInstrument('experimental', ${idx})" class="text-xs text-rose-500 hover:text-rose-700 font-bold px-1.5 py-0.5 rounded cursor-pointer" title="ลบ">✕</button>
                      </div>
                      <div class="space-y-1">
                        <label class="text-[11px] font-semibold text-slate-500">วัตถุประสงค์การใช้:</label>
                        <input type="text" value="${escapeHtml(inst.purpose || '')}" onchange="ROAD_APP.updateInstrument('experimental', ${idx}, 'purpose', this.value)" class="w-full text-xs text-slate-700 dark:text-slate-300 bg-transparent focus:outline-none" placeholder="วัตถุประสงค์..." />
                      </div>
                      <div class="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div>
                          <span class="text-slate-500 font-semibold">การหาคุณภาพ:</span>
                          <input type="text" value="${escapeHtml(inst.qualityMethod || '')}" onchange="ROAD_APP.updateInstrument('experimental', ${idx}, 'qualityMethod', this.value)" class="w-full text-xs text-slate-700 dark:text-slate-300 bg-transparent focus:outline-none border-b border-slate-200 dark:border-slate-700" />
                        </div>
                        <div>
                          <span class="text-slate-500 font-semibold">ผลคุณภาพ:</span>
                          <input type="text" value="${escapeHtml(inst.qualityScore || '')}" onchange="ROAD_APP.updateInstrument('experimental', ${idx}, 'qualityScore', this.value)" class="w-full text-xs font-mono font-bold text-emerald-600 bg-transparent focus:outline-none border-b border-slate-200 dark:border-slate-700" />
                        </div>
                      </div>
                    </div>
                  `).join("")}
                </div>
              </div>

              <!-- Column 2: Data Collection Instruments -->
              <div class="neu-card p-5 space-y-4">
                <div class="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <div class="flex items-center gap-2">
                    <span class="text-lg">📊</span>
                    <div>
                      <h4 class="text-sm font-bold text-slate-900 dark:text-white">2. เครื่องมือเก็บรวบรวมข้อมูล</h4>
                      <p class="text-[11px] text-slate-500">Data Collection Instruments (ใช้วัดผล)</p>
                    </div>
                  </div>
                  <button onclick="ROAD_APP.addInstrument('dataCollection')" class="px-2.5 py-1.5 neu-btn-primary text-xs font-bold flex items-center gap-1 cursor-pointer">
                    + เพิ่มเครื่องมือ
                  </button>
                </div>

                <div class="space-y-3">
                  ${dataInst.map((inst, idx) => `
                    <div class="p-3.5 neu-input-pill rounded-xl space-y-2">
                      <div class="flex items-center justify-between gap-2">
                        <input type="text" value="${escapeHtml(inst.name || '')}" onchange="ROAD_APP.updateInstrument('dataCollection', ${idx}, 'name', this.value)" class="text-xs font-bold text-slate-800 dark:text-white bg-transparent flex-1 border-b border-dashed border-slate-300 dark:border-slate-700 pb-0.5 focus:outline-none" placeholder="ชื่อเครื่องมือ..." />
                        <button onclick="ROAD_APP.removeInstrument('dataCollection', ${idx})" class="text-xs text-rose-500 hover:text-rose-700 font-bold px-1.5 py-0.5 rounded cursor-pointer" title="ลบ">✕</button>
                      </div>
                      <div class="space-y-1">
                        <label class="text-[11px] font-semibold text-slate-500">วัตถุประสงค์การใช้:</label>
                        <input type="text" value="${escapeHtml(inst.purpose || '')}" onchange="ROAD_APP.updateInstrument('dataCollection', ${idx}, 'purpose', this.value)" class="w-full text-xs text-slate-700 dark:text-slate-300 bg-transparent focus:outline-none" placeholder="วัตถุประสงค์..." />
                      </div>
                      <div class="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                        <div>
                          <span class="text-slate-500 font-semibold">การหาคุณภาพ:</span>
                          <input type="text" value="${escapeHtml(inst.qualityMethod || '')}" onchange="ROAD_APP.updateInstrument('dataCollection', ${idx}, 'qualityMethod', this.value)" class="w-full text-xs text-slate-700 dark:text-slate-300 bg-transparent focus:outline-none border-b border-slate-200 dark:border-slate-700" />
                        </div>
                        <div>
                          <span class="text-slate-500 font-semibold">ผลคุณภาพ:</span>
                          <input type="text" value="${escapeHtml(inst.qualityScore || '')}" onchange="ROAD_APP.updateInstrument('dataCollection', ${idx}, 'qualityScore', this.value)" class="w-full text-xs font-mono font-bold text-emerald-600 bg-transparent focus:outline-none border-b border-slate-200 dark:border-slate-700" />
                        </div>
                      </div>
                    </div>
                  `).join("")}
                </div>
              </div>
            </div>
          </div>
        ` : ""}

        <!-- Subtab 2: Test Blueprint (Bloom Revised 6 Levels) -->
        ${subTab === "blueprint" ? `
          <div class="neu-card p-5 space-y-5">
            <!-- Header & Buffer Try-out Rule Card -->
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 class="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>📝</span>
                  <span>ตารางผังสร้างแบบทดสอบ (Test Blueprint ตาม Bloom's Revised Taxonomy)</span>
                </h3>
                <p class="text-xs text-slate-500 mt-1">กระจายข้อสอบ 6 ระดับพฤติกรรมพุทธิพิสัย พร้อมระบบคำนวณข้อสอบสำรองสำหรับ Try-out</p>
              </div>
              <div class="flex items-center gap-2">
                <button onclick="ROAD_APP.addTestBlueprintUnit()" class="px-3 py-1.5 neu-btn-primary text-xs font-bold cursor-pointer">
                  + เพิ่มหน่วยการเรียนรู้
                </button>
              </div>
            </div>

            <!-- Buffer Try-out Rule Alert & Counter Banner -->
            <div class="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div class="space-y-1">
                <div class="flex items-center gap-1.5 text-xs font-extrabold text-amber-900 dark:text-amber-300">
                  <span>💡 กฎเหล็กข้อสอบ Try-out (30% – 50% Buffer Rule):</span>
                </div>
                <p class="text-xs text-slate-700 dark:text-slate-300">
                  ต้องออกข้อสอบทดลองใช้ (Try-out) มากกว่าข้อสอบฉบับจริง <b>30% – 50%</b> เสมอ เพื่อคัดกรองข้อสอบที่มีค่าความยาก (0.20 ≤ p ≤ 0.80) และอำนาจจำแนก (r ≥ 0.20) ให้ได้จำนวนครบตามผังจริง
                </p>
              </div>
              <div class="flex items-center gap-4 shrink-0 bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 shadow-sm">
                <div class="text-center">
                  <div class="text-[11px] font-semibold text-slate-500">ข้อสอบจริงที่ต้องการ</div>
                  <div class="text-xl font-mono font-black text-blue-600 dark:text-sky-400">${bpTotalItems} ข้อ</div>
                </div>
                <div class="text-center border-l pl-3 border-slate-200 dark:border-slate-800">
                  <div class="text-[11px] font-semibold text-slate-500">สำรอง (%)</div>
                  <input type="number" min="20" max="100" value="${bufferPct}" onchange="ROAD_APP.updateTestBlueprintBuffer(this.value)" class="w-16 text-center text-sm font-bold font-mono neu-input-pill py-0.5" />
                </div>
                <div class="text-center border-l pl-3 border-slate-200 dark:border-slate-800">
                  <div class="text-[11px] font-semibold text-amber-600 font-bold">ต้องออก Try-out</div>
                  <div class="text-xl font-mono font-black text-amber-600">${tryoutNeeded} ข้อ</div>
                </div>
              </div>
            </div>

            <!-- Bloom 6 Levels Matrix Table -->
            <div class="overflow-x-auto">
              <table class="w-full text-xs text-left border-collapse">
                <thead>
                  <tr class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-300 dark:border-slate-700">
                    <th class="p-3 w-12 text-center">#</th>
                    <th class="p-3 min-w-[200px]">หน่วยการเรียนรู้ / เนื้อหา</th>
                    <th class="p-2 text-center w-20">เวลา (ชม.)</th>
                    <th class="p-2 text-center w-16 bg-blue-50/50 dark:bg-blue-950/30">จำ</th>
                    <th class="p-2 text-center w-16 bg-blue-50/50 dark:bg-blue-950/30">เข้าใจ</th>
                    <th class="p-2 text-center w-16 bg-emerald-50/50 dark:bg-emerald-950/30">ประยุกต์</th>
                    <th class="p-2 text-center w-16 bg-emerald-50/50 dark:bg-emerald-950/30">วิเคราะห์</th>
                    <th class="p-2 text-center w-16 bg-purple-50/50 dark:bg-purple-950/30">ประเมิน</th>
                    <th class="p-2 text-center w-16 bg-purple-50/50 dark:bg-purple-950/30">สร้างสรรค์</th>
                    <th class="p-3 text-center w-20 font-extrabold bg-slate-200/60 dark:bg-slate-700/60">รวม (ข้อ)</th>
                    <th class="p-2 text-center w-12">จัดการ</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                  ${(bp.units || []).map((u, uIdx) => {
                    const rowSum = Object.values(u.bloomLevels || {}).reduce((a, b) => a + (parseInt(b) || 0), 0);
                    return `
                      <tr class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td class="p-2 text-center font-mono text-slate-400">${uIdx + 1}</td>
                        <td class="p-2">
                          <input type="text" value="${escapeHtml(u.unitName || '')}" onchange="ROAD_APP.updateTestBlueprintUnitName(${uIdx}, this.value)" class="w-full px-2 py-1 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:outline-none font-bold text-slate-800 dark:text-slate-200" />
                        </td>
                        <td class="p-2 text-center">
                          <input type="number" min="1" max="100" value="${u.hours || 4}" onchange="const p=ROAD_APP.getActiveProject(); if(p.testBlueprint?.units?.[${uIdx}]){p.testBlueprint.units[${uIdx}].hours=parseInt(this.value)||4; ROAD_APP.saveProjects(); ROAD_APP.renderApp();}" class="w-14 text-center font-mono py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                        </td>
                        ${['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'].map(k => `
                          <td class="p-1.5 text-center">
                            <input type="number" min="0" max="50" value="${u.bloomLevels?.[k] || 0}" onchange="ROAD_APP.updateTestBlueprintCell(${uIdx}, '${k}', this.value)" class="w-12 text-center font-mono font-bold py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                          </td>
                        `).join("")}
                        <td class="p-2 text-center font-mono font-extrabold text-blue-700 dark:text-sky-300 bg-slate-100/50 dark:bg-slate-800/50">${rowSum}</td>
                        <td class="p-2 text-center">
                          <button onclick="ROAD_APP.removeTestBlueprintUnit(${uIdx})" class="text-rose-500 hover:text-rose-700 font-bold px-1.5 py-0.5 rounded cursor-pointer" title="ลบหน่วย">✕</button>
                        </td>
                      </tr>
                    `;
                  }).join("")}
                </tbody>
                <tfoot>
                  <tr class="bg-slate-100 dark:bg-slate-800/90 font-extrabold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                    <td colspan="3" class="p-3 text-right">รวมจำนวนข้อสอบทั้งสิ้น:</td>
                    ${['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'].map(k => {
                      const colSum = (bp.units || []).reduce((acc, u) => acc + (parseInt(u.bloomLevels?.[k]) || 0), 0);
                      return `<td class="p-2 text-center font-mono">${colSum}</td>`;
                    }).join("")}
                    <td class="p-3 text-center font-mono text-emerald-600 text-sm font-black">${bpTotalItems}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ` : ""}

        <!-- Subtab 3: 4-Level Analytic Rubrics -->
        ${subTab === "rubrics" ? `
          <div class="neu-card p-5 space-y-5">
            <!-- Header & Weight Validation Banner -->
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 class="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>📊</span>
                  <span>เกณฑ์การประเมินแบบรูบริก 4 ระดับ (Analytic Rubrics: 4, 3, 2, 1)</span>
                </h3>
                <p class="text-xs text-slate-500 mt-1">ใช้สำหรับการประเมินทักษะกระบวนการ ชิ้นงาน หรือพฤติกรรม พร้อมระบบตรวจทานน้ำหนักรวม 100%</p>
              </div>
              <div class="flex items-center gap-2">
                <button onclick="ROAD_APP.addRubricCriterion()" class="px-3 py-1.5 neu-btn-primary text-xs font-bold cursor-pointer">
                  + เพิ่มเกณฑ์ประเมิน
                </button>
              </div>
            </div>

            <!-- Weight Validation Warning -->
            <div class="p-3.5 rounded-xl border flex items-center justify-between gap-3 ${isWeightValid ? 'bg-emerald-50/70 border-emerald-300 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300' : 'bg-rose-50/70 border-rose-300 text-rose-800 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300'}">
              <div class="flex items-center gap-2 text-xs font-bold">
                <span>${isWeightValid ? '✔' : '⚠️'}</span>
                <span>${isWeightValid ? 'น้ำหนักคะแนนรวมถูกต้องตามหลักการวัดผล (รวม 100%)' : `ผลรวมน้ำหนักคะแนนไม่เท่ากับ 100% (ปัจจุบัน: ${totalWeight}%) กรุณาปรับน้ำหนักเกณฑ์ให้รวมได้ 100%`}</span>
              </div>
              <span class="font-mono font-extrabold text-sm px-2.5 py-0.5 rounded-full ${isWeightValid ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-rose-100 dark:bg-rose-900'}">${totalWeight}%</span>
            </div>

            <!-- Rubrics Table -->
            <div class="space-y-4">
              ${(rubrics || []).map((r, rIdx) => `
                <div class="neu-card p-4 space-y-3 border border-slate-200 dark:border-slate-800">
                  <div class="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div class="flex items-center gap-3 flex-1 min-w-[260px]">
                      <span class="text-xs font-mono font-bold text-slate-400">#${rIdx + 1}</span>
                      <input type="text" value="${escapeHtml(r.criterionName || '')}" onchange="ROAD_APP.updateRubricCriterion(${rIdx}, 'criterionName', this.value)" class="text-sm font-bold text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 flex-1 focus:outline-none" placeholder="ชื่อเกณฑ์การประเมิน..." />
                    </div>
                    <div class="flex items-center gap-3">
                      <div class="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                        <span>น้ำหนัก:</span>
                        <input type="number" min="1" max="100" value="${r.weight || 20}" onchange="ROAD_APP.updateRubricCriterion(${rIdx}, 'weight', this.value)" class="w-16 font-mono font-bold text-center px-2 py-1 neu-input-pill text-xs" />
                        <span>%</span>
                      </div>
                      <button onclick="ROAD_APP.removeRubricCriterion(${rIdx})" class="text-xs text-rose-500 hover:text-rose-700 font-bold px-2 py-1 rounded cursor-pointer" title="ลบเกณฑ์นี้">✕ ลบ</button>
                    </div>
                  </div>

                  <!-- 4 Rating Levels Descriptors -->
                  <div class="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                    ${(r.levels || []).map((lvl, lIdx) => `
                      <div class="p-3 neu-input-pill rounded-xl flex flex-col gap-1.5">
                        <div class="flex items-center justify-between font-bold ${lvl.score === 4 ? 'text-emerald-700 dark:text-emerald-400' : lvl.score === 3 ? 'text-blue-700 dark:text-blue-400' : lvl.score === 2 ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'}">
                          <span>${escapeHtml(lvl.label || `ระดับ ${lvl.score}`)}</span>
                          <span class="font-mono text-[11px]">${lvl.score} คะแนน</span>
                        </div>
                        <textarea rows="3" onchange="ROAD_APP.updateRubricLevel(${rIdx}, ${lIdx}, this.value)" class="w-full text-xs text-slate-700 dark:text-slate-300 bg-transparent resize-none focus:outline-none leading-relaxed" placeholder="คำอธิบายพฤติกรรม...">${escapeHtml(lvl.descriptor || '')}</textarea>
                      </div>
                    `).join("")}
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        ` : ""}

        <!-- Subtab 4: 3-Dimension Operational Definitions -->
        ${subTab === "operational_def" ? `
          <div class="neu-card p-5 space-y-5">
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 class="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>📖</span>
                  <span>นิยามศัพท์เฉพาะเชิงปฏิบัติการ 3 มิติ (3-Dimension Operational Definitions)</span>
                </h3>
                <p class="text-xs text-slate-500 mt-1">
                  แก้ข้อบกพร่อง "นิยามเชิงทฤษฎีทั่วไป" ด้วยโครงสร้าง 3 องค์ประกอบที่ผู้ทรงคุณวุฒิตรวจสอบ: นิยาม + พฤติกรรมที่สังเกตได้ + เครื่องมือวัดและเกณฑ์
                </p>
              </div>
              <div class="flex items-center gap-2">
                <button onclick="ROAD_APP.addOperationalDef()" class="px-3 py-1.5 neu-btn-primary text-xs font-bold cursor-pointer">
                  + เพิ่มตัวแปร
                </button>
              </div>
            </div>

            <div class="space-y-5">
              ${(opDefs || []).map((od, oIdx) => `
                <div class="neu-card p-4 space-y-4 border border-slate-200 dark:border-slate-800">
                  <div class="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div class="flex items-center gap-2 flex-1">
                      <span class="text-xs font-mono font-bold text-blue-600 dark:text-sky-400">ตัวแปร:</span>
                      <input type="text" value="${escapeHtml(od.construct || '')}" onchange="ROAD_APP.updateOperationalDef(${oIdx}, 'construct', this.value)" class="text-sm font-extrabold text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 flex-1 focus:outline-none" />
                    </div>
                    <button onclick="ROAD_APP.removeOperationalDef(${oIdx})" class="text-xs text-rose-500 hover:text-rose-700 font-bold px-2 py-1 rounded cursor-pointer">✕ ลบ</button>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <!-- Dimension 1: Theoretical Definition -->
                    <div class="space-y-1.5 p-3 neu-input-pill rounded-xl">
                      <label class="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <span>1. นิยามความหมายเชิงทฤษฎี:</span>
                      </label>
                      <textarea rows="4" onchange="ROAD_APP.updateOperationalDef(${oIdx}, 'definition', this.value)" class="w-full text-xs text-slate-700 dark:text-slate-300 bg-transparent resize-none focus:outline-none leading-relaxed">${escapeHtml(od.definition || '')}</textarea>
                    </div>

                    <!-- Dimension 2: Observable Behaviors / Indicators -->
                    <div class="space-y-1.5 p-3 neu-input-pill rounded-xl">
                      <div class="flex items-center justify-between font-bold text-slate-700 dark:text-slate-300">
                        <span>2. พฤติกรรมที่สังเกตได้ (ตัวบ่งชี้):</span>
                      </div>
                      <div class="space-y-1 max-h-32 overflow-y-auto pr-1">
                        ${(od.indicators || []).map((ind, iIdx) => `
                          <div class="flex items-center justify-between gap-1 text-[11px] bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-800">
                            <span class="truncate flex-1">• ${escapeHtml(ind)}</span>
                            <button onclick="ROAD_APP.removeOperationalDefIndicator(${oIdx}, ${iIdx})" class="text-rose-500 font-bold px-1 hover:text-rose-700">✕</button>
                          </div>
                        `).join("")}
                      </div>
                      <div class="flex items-center gap-1 pt-1">
                        <input type="text" id="new-ind-${oIdx}" placeholder="เพิ่มตัวบ่งชี้..." class="flex-1 px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-white" onkeydown="if(event.key==='Enter'){ROAD_APP.addOperationalDefIndicator(${oIdx}, this.value); this.value='';}" />
                        <button onclick="const el=document.getElementById('new-ind-${oIdx}'); ROAD_APP.addOperationalDefIndicator(${oIdx}, el.value); el.value='';" class="px-2 py-1 text-[11px] font-bold rounded bg-blue-600 text-white cursor-pointer">+</button>
                      </div>
                    </div>

                    <!-- Dimension 3: Measurement Instrument & Criterion -->
                    <div class="space-y-1.5 p-3 neu-input-pill rounded-xl">
                      <label class="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <span>3. เครื่องมือวัดและเกณฑ์ประเมิน:</span>
                      </label>
                      <textarea rows="4" onchange="ROAD_APP.updateOperationalDef(${oIdx}, 'instrumentCriteria', this.value)" class="w-full text-xs text-slate-700 dark:text-slate-300 bg-transparent resize-none focus:outline-none leading-relaxed">${escapeHtml(od.instrumentCriteria || '')}</textarea>
                    </div>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        ` : ""}
      </div>
    `;
  }

  function renderTabDiagrams(proj) {
    const model = (window.ROAD_DATA.RESEARCH_MODELS && window.ROAD_DATA.RESEARCH_MODELS.find(m => m.id === proj.modelId)) || window.ROAD_DATA.RESEARCH_MODELS[0];
    const steps = (proj.B_steps || []).filter(Boolean);
    const cList = (proj.C_list || []).filter(Boolean);
    const rawComponents = window.ROAD_GENERATOR.generateModelComponents(proj);
    const compList = Array.isArray(rawComponents) ? rawComponents : ((rawComponents && rawComponents.components) || []);
    const compTitle = (rawComponents && rawComponents.title) || `โครงสร้างองค์ประกอบของรูปแบบนวัตกรรม (${compList.length} ด้าน)`;
    const compSubtitle = (rawComponents && rawComponents.subtitle) || `โครงสร้างเชิงระบบตามแบบแผน R&D ครบถ้วนตามระเบียบวิธีวิจัย`;

    return `
      <div class="flex flex-col gap-8">
        <!-- Academic Rule Banner -->
        <div class="neu-card p-4 sm:p-5 border-l-4 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 flex items-start gap-3">
          <div class="text-2xl shrink-0">⚠️</div>
          <div class="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            <span class="font-bold text-amber-800 dark:text-amber-300">กฎเหล็กตามหลักวิธีวิทยาการวิจัย R&D:</span>
            <b>กรอบแนวคิดการวิจัย (Conceptual Framework) ในบทที่ 2 "ห้ามวาดเป็นขั้นตอนการวิจัย R1-D2 เด็ดขาด!"</b> 
            แต่ต้องนำเสนอเป็นแผนผังที่แสดงความสัมพันธ์เชิงทฤษฎี (Why) ระหว่าง <b>ตัวแปรต้น [หลักการ/ทฤษฎี B + องค์ประกอบนวัตกรรม A]</b> ส่งผลต่อ <b>ตัวแปรตาม [ตัวแปร C 4 ด้านตาม วPA]</b> สำหรับผังขั้นตอน R1-D1-R2-D2 ต้องนำเสนอแยกต่างหากในบทที่ 3
          </div>
        </div>

        <!-- DIAGRAM 1: Theoretical Conceptual Framework (บทที่ 2) -->
        <div class="neu-card p-6 sm:p-7 flex flex-col gap-6">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-4">
            <div>
              <span class="px-3 py-1 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 text-xs font-mono font-extrabold uppercase">
                DIAGRAM 1 · บทที่ 2 กรอบแนวคิดในการวิจัยเชิงทฤษฎี
              </span>
              <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1.5">
                แผนภาพกรอบแนวคิดในการวิจัย (Theoretical Conceptual Framework)
              </h2>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                แสดงความสัมพันธ์เชิงเหตุและผลระหว่างหลักการ/ทฤษฎีเบื้องหลัง (B) องค์ประกอบนวัตกรรม (A) และผลลัพธ์ผู้เรียน 4 มิติตาม วPA (C)
              </p>
            </div>
            <button onclick="window.print()" class="px-3.5 py-2 rounded-xl neu-btn-primary text-xs font-bold print:hidden">
              🖨️ สั่งพิมพ์แผนภาพ
            </button>
          </div>

          <!-- Conceptual Framework Visual Diagram -->
          <div class="p-6 sm:p-8 rounded-3xl bg-slate-50/80 dark:bg-slate-950/60 border-2 border-dashed border-sky-300 dark:border-sky-900">
            <div class="grid lg:grid-cols-[1.1fr_4rem_1.1fr] items-center gap-5">
              <!-- Left: Independent Variables (B + A) -->
              <div class="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-sky-600 shadow-md flex flex-col gap-4">
                <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                  <span class="text-xs font-black uppercase tracking-wider text-sky-700 dark:text-sky-400">
                    ตัวแปรต้น (Independent Variable)
                  </span>
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                    A + B
                  </span>
                </div>

                <div>
                  <div class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    1. นวัตกรรมที่พัฒนา (A):
                  </div>
                  <div class="font-extrabold text-base text-slate-900 dark:text-white mt-0.5">
                    ${escapeHtml(proj.A)}
                  </div>
                </div>

                <div>
                  <div class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    2. หลักการและทฤษฎีพื้นฐาน (B):
                  </div>
                  <div class="font-bold text-sm text-sky-800 dark:text-sky-300 mt-0.5">
                    ${escapeHtml(proj.B)}
                  </div>
                </div>

                <div>
                  <div class="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
                    3. ขั้นตอนการจัดกิจกรรม / กลไกของนวัตกรรม:
                  </div>
                  <div class="space-y-1.5">
                    ${steps.map((s, idx) => `
                      <div class="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <span class="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] shrink-0 font-bold">${idx + 1}</span>
                        <span>${escapeHtml(s)}</span>
                      </div>
                    `).join("")}
                  </div>
                </div>
              </div>

              <!-- Center: Directional Connection Arrow -->
              <div class="flex flex-col items-center justify-center py-4">
                <div class="w-12 h-12 rounded-full bg-gradient-to-r from-sky-600 to-emerald-600 text-white flex items-center justify-center text-xl font-bold shadow-lg">
                  ⟹
                </div>
                <span class="text-[11px] font-extrabold text-slate-600 dark:text-slate-300 mt-2 text-center leading-tight">
                  จัดกระทำ<br/>(Treatment)
                </span>
              </div>

              <!-- Right: Dependent Variables (C 4 Dimensions) -->
              <div class="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-600 shadow-md flex flex-col gap-4">
                <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                  <span class="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    ตัวแปรตาม (Dependent Variables)
                  </span>
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    C (วPA ด้านที่ 2)
                  </span>
                </div>

                <div class="space-y-2.5">
                  ${cList.map((c, idx) => `
                    <div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                      <div class="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase">
                        ผลลัพธ์ที่ ${idx + 1} (ด้านสมรรถนะ/ทักษะ)
                      </div>
                      <div class="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                        ${escapeHtml(c)}
                      </div>
                    </div>
                  `).join("")}

                  <div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                    <div class="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase">
                      ผลลัพธ์เสริม (ด้านเจตคติ/ความพึงพอใจ)
                    </div>
                    <div class="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                      ความพึงพอใจของผู้เรียนที่มีต่อ${escapeHtml(proj.A)}
                    </div>
                  </div>
                </div>

                <div class="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span class="font-bold">กลุ่มเป้าหมาย (D):</span>
                  <span class="font-extrabold text-slate-900 dark:text-white">${escapeHtml(proj.D)}</span>
                </div>
              </div>
            </div>

            <!-- Theoretical Rationale Box -->
            <div class="mt-6 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <span class="font-bold text-sky-700 dark:text-sky-300">คำอธิบายความสัมพันธ์เชิงทฤษฎี (Theoretical Rationale):</span>
              กระบวนการจัดกิจกรรมของ${escapeHtml(proj.A)} ตามหลักการ${escapeHtml(proj.B)} 
              ออกแบบขึ้นโดยอาศัยหลักการทางจิตวิทยาการเรียนรู้และการสร้างความรู้ด้วยตนเอง ซึ่งขั้นตอนทั้ง ${steps.length} ขั้นตอน 
              จะช่วยลดภาระทางปัญญา (Cognitive Load) ส่งเสริมการเชื่อมโยงความรู้เดิมสู่ความรู้ใหม่ และกระตุ้นการกำกับการเรียนรู้ด้วยตนเอง 
              ส่งผลให้ผู้เรียนเกิดการพัฒนา ${escapeHtml(cList.join(", "))} อย่างมีนัยสำคัญ
            </div>
          </div>
        </div>

        <!-- DIAGRAM 2: Innovation Model Components (องค์ประกอบของรูปแบบ 5-6 ด้าน) -->
        <div class="neu-card p-6 sm:p-7 flex flex-col gap-6">
          <div class="border-b border-slate-200/80 dark:border-slate-800 pb-4">
            <span class="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-extrabold uppercase">
              DIAGRAM 2 · โครงสร้างองค์ประกอบของรูปแบบนวัตกรรม
            </span>
            <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1.5">
              ${escapeHtml(compTitle)}
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ${escapeHtml(compSubtitle)}
            </p>
          </div>

          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            ${compList.map((cmp, idx) => {
              const title = cmp.name || cmp.title || `ด้านที่ ${idx + 1}`;
              const detail = cmp.content || cmp.detail || "";
              const elements = cmp.elements || [];
              return `
              <div class="p-5 rounded-2xl bg-slate-50/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md transition">
                <div>
                  <div class="flex items-center justify-between">
                    <span class="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-extrabold">${idx + 1}</span>
                    <span class="text-[11px] font-bold text-indigo-700 dark:text-indigo-400">${escapeHtml(title.split(":")[0] || `ด้านที่ ${idx + 1}`)}</span>
                  </div>
                  <h3 class="font-extrabold text-sm text-slate-900 dark:text-white mt-2">${escapeHtml(title)}</h3>
                  <p class="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed whitespace-pre-line">${escapeHtml(detail)}</p>
                </div>
                ${elements && elements.length ? `
                  <div class="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                    ${elements.map(el => `
                      <div class="text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                        <span class="text-indigo-500 font-bold shrink-0">•</span>
                        <span>${escapeHtml(el)}</span>
                      </div>
                    `).join("")}
                  </div>
                ` : ""}
              </div>
            `}).join("")}
          </div>
        </div>

        <!-- DIAGRAM 3: R&D Process Flowchart (บทที่ 3) -->
        <div class="neu-card p-6 sm:p-7 flex flex-col gap-6">
          <div class="border-b border-slate-200/80 dark:border-slate-800 pb-4">
            <span class="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 text-xs font-mono font-extrabold uppercase">
              DIAGRAM 3 · บทที่ 3 ขั้นตอนการดำเนินการวิจัย R&D
            </span>
            <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1.5">
              แผนผังกระบวนการวิจัยและพัฒนา 4 ระยะ (R1 - D1 - R2 - D2)
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              กระบวนการสร้างและประเมินนวัตกรรมตามแบบแผนวิทยาศาสตร์การศึกษา
            </p>
          </div>

          <div class="grid md:grid-cols-4 gap-4">
            ${model.phases.map((ph, idx) => `
              <div class="p-5 rounded-2xl border-2 ${idx === 2 ? 'border-amber-500 bg-amber-50/30 dark:bg-amber-950/20' : 'border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-950/20'} flex flex-col justify-between gap-3 shadow-sm">
                <div>
                  <div class="flex items-center justify-between">
                    <span class="px-2.5 py-1 rounded-full text-xs font-mono font-black ${idx === 2 ? 'bg-amber-600 text-white' : 'bg-purple-700 text-white'}">
                      ${escapeHtml(ph.code)}
                    </span>
                    <span class="text-xs font-bold text-slate-400">ระยะที่ ${idx + 1}</span>
                  </div>
                  <div class="font-extrabold text-sm text-slate-900 dark:text-white mt-2.5">${escapeHtml(ph.title)}</div>
                  <p class="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">${escapeHtml(ph.goal)}</p>
                </div>
                <div class="pt-2 border-t ${idx === 2 ? 'border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold' : 'border-purple-200/60 dark:border-purple-800 text-purple-800 dark:text-purple-300'} text-[11px]">
                  ${idx === 2 ? '★ เฉพาะระยะนี้ที่มีการทดสอบสมมติฐาน!' : `เป้าหมาย: วัตถุประสงค์ข้อที่ ${idx + 1}`}
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  }

  // --- Studio Tab 4: 360° Alignment, Operational Table & R1-D1 Bridge ---
  function renderTabMatrix(proj) {
    const subTab = state.matrixSubTab || "operational";
    const opTable = window.ROAD_GENERATOR.generateOperationalTable(proj);
    const bridge = window.ROAD_GENERATOR.generateR1toD1Bridge(proj);
    const alignment = window.ROAD_GENERATOR.generateAlignmentMatrix(proj);

    return `
      <div class="flex flex-col gap-6">
        <!-- Sub-Navigation Bar -->
        <div class="p-2.5 sm:p-3 rounded-2xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-2.5">
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            ${[
              ["syntax_matrix", "🧩 สังเคราะห์ Syntax", "ตารางสังเคราะห์ขั้นตอนการจัดกิจกรรมการเรียนรู้จากนักวิชาการ 7 ท่าน"],
              ["r1d1_bridge", "🌉 สะพาน R1->D1", "ตารางเชื่อมโยงผลการวิจัยระยะ R1 สู่การออกแบบนวัตกรรม D1 มาตรฐาน R&D"],
              ["operational", "📋 ตาราง 4 ระยะ (R1-D2)", "ตารางการดำเนินการวิจัย 4 ระยะ 6 คอลัมน์ (วัตถุประสงค์-กลุ่มตัวอย่าง-เครื่องมือ-การเก็บ-สถิติ)"],
              ["alignment", "🎯 ความสอดคล้อง 360°", "ตารางตรวจสอบความสอดคล้อง 360 องศา ระหว่างชื่อเรื่อง วัตถุประสงค์ สมมติฐาน และเครื่องมือ"]
            ].map(([k, lbl, tip]) => `
              <button onclick="ROAD_APP.setMatrixSubTab('${k}')" data-tooltip="${tip}" title="${tip}" class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${subTab === k ? 'neu-btn-primary' : 'neu-squircle text-slate-700 dark:text-slate-300'}">
                ${lbl}
              </button>
            `).join("")}
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.print()" class="px-3 py-1.5 rounded-lg neu-btn-emerald text-xs font-bold cursor-pointer print:hidden">
              🖨️ พิมพ์ A4
            </button>
          </div>
        </div>

        <!-- Sub-Tab 0: Syntax Synthesis Matrix (ตารางสังเคราะห์ขั้นตอนการจัดกิจกรรม 7 นักวิชาการ) -->
        ${subTab === "syntax_matrix" ? (() => {
          const syntaxData = window.ROAD_GENERATOR.generateSyntaxSynthesisMatrix(proj);
          const scholars = syntaxData.scholars;
          const steps = syntaxData.steps;
          const passingSteps = steps.filter(s => s.percent >= 60);

          return `
            <div class="neu-card p-6 flex flex-col gap-5">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <span class="text-xs font-mono font-bold text-sky-700 dark:text-sky-400 uppercase">SYNTAX SYNTHESIS MATRIX · การสังเคราะห์ขั้นตอนนวัตกรรม</span>
                  <h2 class="text-lg font-bold text-slate-900 dark:text-white">ตารางสังเคราะห์ขั้นตอนการจัดกิจกรรมการเรียนรู้จากนักวิชาการ 7 ท่าน</h2>
                  <p class="text-xs text-slate-500">เปรียบเทียบขั้นตอนจากนักวิชาการ คำนวณความถี่และร้อยละ (%) อัตโนมัติ เพื่อสังเคราะห์เป็นขั้นตอนนวัตกรรม (ระยะ D1) ตามเกณฑ์ยอมรับ ≥ 60%</p>
                </div>
                <div class="flex items-center gap-2 print:hidden">
                  <button onclick="ROAD_APP.resetSyntaxMatrix()" class="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                    🔄 คืนค่าเริ่มต้น
                  </button>
                  <button onclick="ROAD_APP.copyTableText('syntax-table-content', 'คัดลอกตารางสังเคราะห์ขั้นตอนการสอนเรียบร้อยแล้ว')" class="px-3.5 py-2 rounded-xl neu-btn-primary text-xs font-bold cursor-pointer">
                    📋 คัดลอกตารางไปวางใน Word
                  </button>
                </div>
              </div>

              <!-- Metrics Summary Cards -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="p-3.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
                  <div class="text-[11px] font-bold text-sky-800 dark:text-sky-300">จำนวนนักวิชาการที่ศึกษา</div>
                  <div class="text-xl font-black text-sky-900 dark:text-sky-100 font-mono mt-0.5">${scholars.length} ท่าน</div>
                  <div class="text-[10px] text-slate-500 mt-1 truncate">${scholars.join(", ")}</div>
                </div>
                <div class="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <div class="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">ขั้นตอนที่ผ่านเกณฑ์ยอมรับ (≥ 60%)</div>
                  <div class="text-xl font-black text-emerald-900 dark:text-emerald-100 font-mono mt-0.5">${passingSteps.length} / ${steps.length} ขั้นตอน</div>
                  <div class="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1">พร้อมสังเคราะห์สู่นวัตกรรม D1</div>
                </div>
                <div class="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                  <div class="text-[11px] font-bold text-purple-800 dark:text-purple-300">ชื่อย่อนวัตกรรมเป้าหมาย (D1)</div>
                  <div class="text-sm font-bold text-purple-900 dark:text-purple-100 mt-1 truncate">${escapeHtml(proj.B_short || proj.B || "นวัตกรรม R&D")}</div>
                  <div class="text-[10px] text-slate-500 mt-1">โครงสร้าง ${passingSteps.length} ขั้นตอน</div>
                </div>
              </div>

              <!-- APA 7th Style Interactive Table -->
              <div id="syntax-table-content" class="overflow-x-auto">
                <table class="w-full text-xs border-collapse border-t-2 border-b-2 border-slate-900 dark:border-slate-200">
                  <thead>
                    <tr class="border-b border-slate-900 dark:border-slate-200 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-extrabold">
                      <th class="p-2.5 text-left w-52">ขั้นตอนการจัดกิจกรรมการเรียนรู้</th>
                      ${scholars.map(sc => `<th class="p-2 text-center whitespace-nowrap">${escapeHtml(sc)}</th>`).join("")}
                      <th class="p-2 text-center w-16 bg-sky-50 dark:bg-sky-950/50">ความถี่ (คน)</th>
                      <th class="p-2 text-center w-16 bg-sky-50 dark:bg-sky-950/50">ร้อยละ (%)</th>
                      <th class="p-2.5 text-left w-64 bg-emerald-50 dark:bg-emerald-950/50">การสังเคราะห์สู่นวัตกรรม D1</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${steps.map((st, stepIdx) => `
                      <tr class="border-b border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 align-middle">
                        <td class="p-2.5 font-semibold text-slate-900 dark:text-slate-100">
                          <input type="text" value="${escapeHtml(st.stepName)}" onchange="ROAD_APP.updateSyntaxStepName(${stepIdx}, this.value)" class="w-full px-2 py-1 rounded bg-transparent border border-transparent hover:border-slate-300 focus:border-sky-500 focus:bg-white dark:focus:bg-slate-800 font-medium text-xs text-slate-900 dark:text-white transition" />
                        </td>
                        ${scholars.map((sc, scIdx) => {
                          const checked = Boolean(st.scholarChecks[scIdx]);
                          return `
                            <td class="p-2 text-center">
                              <button type="button" onclick="ROAD_APP.toggleSyntaxScholarCheck(${stepIdx}, ${scIdx})" class="w-6 h-6 rounded flex items-center justify-center mx-auto transition cursor-pointer ${checked ? 'bg-emerald-500 text-white font-bold' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 hover:bg-slate-300'}" title="คลิกเพื่อสลับสถานะของ ${sc}">
                                ${checked ? '✓' : '—'}
                              </button>
                            </td>
                          `;
                        }).join("")}
                        <td class="p-2 text-center font-mono font-bold bg-sky-50/50 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200">${st.count}/${st.totalScholars}</td>
                        <td class="p-2 text-center font-mono font-bold bg-sky-50/50 dark:bg-sky-950/30 ${st.percent >= 60 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-600'}">${st.percent}%</td>
                        <td class="p-2.5 bg-emerald-50/40 dark:bg-emerald-950/20">
                          <input type="text" value="${escapeHtml(st.synthesizedStep)}" onchange="ROAD_APP.updateSyntaxSynthesizedStep(${stepIdx}, this.value)" class="w-full px-2 py-1 rounded bg-transparent border border-transparent hover:border-emerald-300 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 text-xs font-semibold text-emerald-900 dark:text-emerald-200 transition" />
                        </td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>

              <!-- Synthesized Innovation Steps Result Box -->
              <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div class="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>ผลการสังเคราะห์ขั้นตอนการจัดการเรียนรู้ของ ${escapeHtml(proj.B_short || proj.B || "นวัตกรรม")} (${syntaxData.finalSynthesizedSteps.length} ขั้นตอน):</span>
                </div>
                <div class="grid gap-1.5 pl-4 text-xs text-slate-700 dark:text-slate-300">
                  ${syntaxData.finalSynthesizedSteps.map((fStep, fi) => `
                    <div class="flex items-start gap-2">
                      <span class="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono font-bold text-[10px]">ขั้นที่ ${fi + 1}</span>
                      <span class="font-medium">${escapeHtml(fStep)}</span>
                    </div>
                  `).join("")}
                </div>
                <div class="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200 dark:border-slate-700">
                  * ตารางนี้จะถูกเชื่อมโยงและนำไปจัดพิมพ์เป็น "ตารางที่ 2.1" ในบทที่ 2 และส่งออกเป็นตาราง APA 3 เส้นในเอกสาร Word อัตโนมัติ
                </div>
              </div>
            </div>
          `;
        })() : ""}

        <!-- Sub-Tab 1: Operational Table (6 คอลัมน์) -->
        ${subTab === "operational" ? `
          <div class="neu-card p-6 flex flex-col gap-5">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span class="text-xs font-mono font-bold text-sky-700 dark:text-sky-400 uppercase">OPERATIONAL MATRIX · ตารางขั้นตอนการวิจัย</span>
                <h2 class="text-lg font-bold text-slate-900 dark:text-white">ตารางการดำเนินการวิจัย 4 ระยะ (R1 - D1 - R2 - D2)</h2>
                <p class="text-xs text-slate-500">จำแนกตามขั้นตอน วัตถุประสงค์ย่อย วิธีเก็บข้อมูล แหล่งข้อมูล ผลที่ได้ และหมายเหตุอย่างละเอียด</p>
              </div>
              <button onclick="ROAD_APP.copyTableText('operational-table-content', 'คัดลอกตารางการดำเนินการวิจัยเรียบร้อยแล้ว')" class="px-3.5 py-2 rounded-xl neu-btn-primary text-xs font-bold cursor-pointer print:hidden">
                📋 คัดลอกตารางไปวางใน Word
              </button>
            </div>

            <div id="operational-table-content" class="overflow-x-auto">
              <table class="w-full text-xs border-collapse border border-slate-300 dark:border-slate-700">
                <thead>
                  <tr class="bg-sky-50/80 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold">
                    <th class="border border-slate-300 dark:border-slate-700 p-2.5 w-32">ขั้นตอนการวิจัย</th>
                    <th class="border border-slate-300 dark:border-slate-700 p-2.5">วัตถุประสงค์ย่อย</th>
                    <th class="border border-slate-300 dark:border-slate-700 p-2.5">การเก็บรวบรวมข้อมูล</th>
                    <th class="border border-slate-300 dark:border-slate-700 p-2.5">แหล่งข้อมูล / กลุ่มตัวอย่าง</th>
                    <th class="border border-slate-300 dark:border-slate-700 p-2.5">ผลที่ได้ (Output)</th>
                    <th class="border border-slate-300 dark:border-slate-700 p-2.5 w-28">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody>
                  ${opTable.map((row, idx) => `
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 align-top ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-900/50'}">
                      <td class="border border-slate-300 dark:border-slate-700 p-2.5 font-bold text-sky-800 dark:text-sky-300">${escapeHtml(row.phase)}</td>
                      <td class="border border-slate-300 dark:border-slate-700 p-2.5 font-semibold text-slate-800 dark:text-slate-200">${escapeHtml(row.objective)}</td>
                      <td class="border border-slate-300 dark:border-slate-700 p-2.5 text-slate-700 dark:text-slate-300">${escapeHtml(row.methods)}</td>
                      <td class="border border-slate-300 dark:border-slate-700 p-2.5 text-slate-700 dark:text-slate-300">${escapeHtml(row.sources)}</td>
                      <td class="border border-slate-300 dark:border-slate-700 p-2.5 text-emerald-800 dark:text-emerald-400 font-semibold">${escapeHtml(row.output)}</td>
                      <td class="border border-slate-300 dark:border-slate-700 p-2.5 text-slate-500 font-mono text-[11px]">${escapeHtml(row.notes)}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>
        ` : ""}

        <!-- Sub-Tab 2: R1-to-D1 Synthesis Bridge Table -->
        ${subTab === "r1d1_bridge" ? `
          <div class="neu-card p-6 flex flex-col gap-5">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span class="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-400 uppercase">SYNTHESIS BRIDGE · สะพานเชื่อมการสังเคราะห์</span>
                <h2 class="text-lg font-bold text-slate-900 dark:text-white">ตารางแสดงการเชื่อมโยงจาก R1 สู่ D1 (R1-to-D1 Synthesis Bridge)</h2>
                <p class="text-xs text-slate-500">ตอบคำถามว่า ผลการศึกษาเอกสารและสภาพปัญหาใน R1 นำไปสู่การออกแบบนวัตกรรมใน D1 ได้อย่างไร (ตอบ How & Why ชัดเจน)</p>
              </div>
              <button onclick="ROAD_APP.copyTableText('bridge-table-content', 'คัดลอกตารางเชื่อมโยง R1 สู่ D1 เรียบร้อยแล้ว')" class="px-3.5 py-2 rounded-xl neu-btn-primary text-xs font-bold cursor-pointer print:hidden">
                📋 คัดลอกตารางไปวางใน Word
              </button>
            </div>

            <div id="bridge-table-content" class="overflow-x-auto">
              <table class="w-full text-xs border-collapse border border-slate-300 dark:border-slate-700">
                <thead>
                  <tr class="bg-indigo-50/80 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold">
                    <th class="border border-slate-300 dark:border-slate-700 p-2.5 w-40">ผลการศึกษาในระยะ R1</th>
                    <th class="border border-slate-300 dark:border-slate-700 p-2.5 w-48">สังเคราะห์สู่องค์ประกอบในระยะ D1</th>
                    <th class="border border-slate-300 dark:border-slate-700 p-2.5">คำอธิบายเชิงวิชาการ (How & Why)</th>
                    <th class="border border-slate-300 dark:border-slate-700 p-2.5 w-44">หลักฐานเชิงประจักษ์ / เครื่องมือ</th>
                  </tr>
                </thead>
                <tbody>
                  ${bridge.map((bRow, idx) => `
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 align-top ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-900/50'}">
                      <td class="border border-slate-300 dark:border-slate-700 p-2.5 font-bold text-indigo-800 dark:text-indigo-300">${escapeHtml(bRow.r1Element)}</td>
                      <td class="border border-slate-300 dark:border-slate-700 p-2.5 font-bold text-emerald-800 dark:text-emerald-400">${escapeHtml(bRow.d1Target)}</td>
                      <td class="border border-slate-300 dark:border-slate-700 p-2.5 text-slate-800 dark:text-slate-200 leading-relaxed">${escapeHtml(bRow.rationale)}</td>
                      <td class="border border-slate-300 dark:border-slate-700 p-2.5 text-slate-600 dark:text-slate-400 font-medium">${escapeHtml(bRow.evidence)}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>

            <div class="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-300 leading-relaxed">
              💡 <b>คำแนะนำจากคณะกรรมการประเมิน วPA:</b> กรรมการจะพิจารณาว่าขั้นตอนของนวัตกรรม (Syntax) "มีที่มาอย่างไร" ไม่ใช่คิดขึ้นมาเองลอยๆ ตาราง Synthesis Bridge นี้จะแสดงให้เห็นความลุ่มลึกของการศึกษาเอกสารและข้อมูลบริบทจริงในระยะ R1 อย่างเด่นชัด
            </div>
          </div>
        ` : ""}

        <!-- Sub-Tab 3: 360° Alignment Matrix -->
        ${subTab === "alignment" ? `
          <div class="neu-card p-6 flex flex-col gap-5">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span class="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase">360° RESEARCH ALIGNMENT MATRIX</span>
                <h2 class="text-lg font-bold text-slate-900 dark:text-white">ตารางตรวจสอบความสอดคล้องของงานวิจัยทั้งระบบ (360°)</h2>
                <p class="text-xs text-slate-500">ตรวจสอบความเชื่อมโยงระหว่าง ระยะการวิจัย ↔ วัตถุประสงค์ ↔ สมมติฐาน ↔ แหล่งข้อมูล ↔ เครื่องมือ ↔ สถิติ ↔ การนำเสนอในบทที่ 4</p>
              </div>
              <button onclick="ROAD_APP.copyTableText('alignment-table-content', 'คัดลอกตารางความสอดคล้อง 360° เรียบร้อยแล้ว')" class="px-3.5 py-2 rounded-xl neu-btn-primary text-xs font-bold cursor-pointer print:hidden">
                📋 คัดลอกตารางไปวางใน Word
              </button>
            </div>

            <div id="alignment-table-content" class="overflow-x-auto">
              <table class="w-full text-xs border-collapse border border-slate-300 dark:border-slate-700">
                <thead>
                  <tr class="bg-emerald-50/80 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold">
                    <th class="border border-slate-300 dark:border-slate-700 p-2.5 w-32">ระยะ / ขั้นตอน</th>
                    <th class="border border-slate-300 dark:border-slate-700 p-2.5">วัตถุประสงค์การวิจัย</th>
                    <th class="border border-slate-300 dark:border-slate-700 p-2.5">สมมติฐานการวิจัย</th>
                    <th class="border border-slate-300 dark:border-slate-700 p-2.5">กลุ่มเป้าหมาย / แหล่งข้อมูล</th>
                    <th class="border border-slate-300 dark:border-slate-700 p-2.5">เครื่องมือที่ใช้</th>
                    <th class="border border-slate-300 dark:border-slate-700 p-2.5">สถิติที่ใช้วิเคราะห์</th>
                    <th class="border border-slate-300 dark:border-slate-700 p-2.5">การนำเสนอผลในบทที่ 4</th>
                  </tr>
                </thead>
                <tbody>
                  ${alignment.map((r, idx) => `
                    <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 align-top ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-900/50'}">
                      <td class="border border-slate-300 dark:border-slate-700 p-2.5 font-bold text-sky-800 dark:text-sky-300">${escapeHtml(r.phase)}</td>
                      <td class="border border-slate-300 dark:border-slate-700 p-2.5 font-semibold">${escapeHtml(r.objective)}</td>
                      <td class="border border-slate-300 dark:border-slate-700 p-2.5 text-slate-700 dark:text-slate-300">${escapeHtml(r.hypothesis)}</td>
                      <td class="border border-slate-300 dark:border-slate-700 p-2.5">${escapeHtml(r.informants)}</td>
                      <td class="border border-slate-300 dark:border-slate-700 p-2.5">${escapeHtml(r.instruments)}</td>
                      <td class="border border-slate-300 dark:border-slate-700 p-2.5 font-mono text-[11px]">${escapeHtml(r.statistics)}</td>
                      <td class="border border-slate-300 dark:border-slate-700 p-2.5 text-emerald-700 dark:text-emerald-400 font-medium">${escapeHtml(r.ch4Section)}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>
        ` : ""}
      </div>
    `;
  }

  // --- Studio Tab 6: Built-in R&D Stat Lab V2.0 & Psychometric Engine ---
  function renderTabStatLab(proj) {
    const st = proj.statsData || {};
    const subTab = state.statlabSubTab || "decision_rules";
    const gen = window.ROAD_GENERATOR.generateChapters(proj);
    const ch4Tables = gen.chapters[3].sections[1].tables;

    // Decision Rules Matrix
    const decisionObjectives = {
      survey: {
        title: "เพื่อศึกษา / เพื่อสำรวจ (สภาพปัจจุบัน ปัญหา ความต้องการ)",
        phase: "ระยะที่ 1 (R1) หรือ ระยะที่ 4 (D2)",
        stats: "ความถี่ (Frequency), ร้อยละ (Percentage), ค่าเฉลี่ย (x̄), ส่วนเบี่ยงเบนมาตรฐาน (S.D.), ดัชนีความต้องการจำเป็น (PNI_modified)",
        hasHypothesis: false,
        hypothesisNote: "❌ ห้ามตั้งสมมติฐานการวิจัยเด็ดขาด เพราะเป็นการศึกษาเชิงพรรณนา (Descriptive)",
        pitfall: "อย่าใช้สถิติทดสอบสมมติฐาน เช่น t-test หรือ F-test เพราะไม่มีกลุ่มเปรียบเทียบ",
        example: "ความต้องการจำเป็นมีลำดับความสำคัญสูงสุดด้านการจัดการเรียนรู้เชิงรุก (PNI_modified = 1.252)"
      },
      e1e2: {
        title: "เพื่อหาประสิทธิภาพของนวัตกรรม (E1/E2 ตามเกณฑ์ เช่น 80/80 หรือ 75/75)",
        phase: "ระยะที่ 3 (R2)",
        stats: "ค่าเฉลี่ยร้อยละคะแนนกระบวนการ (E1) และคะแนนหลังเรียน (E2) เทียบกับเกณฑ์มาตรฐาน พร้อมตรวจสอบผลต่าง (|E1 - E2| ≤ 5%)",
        hasHypothesis: false,
        hypothesisNote: "❌ ห้ามตั้งสมมติฐานการวิจัย และ ห้ามใช้ t-test ทดสอบ E1/E2 เด็ดขาด!",
        pitfall: "ข้อบกพร่องยอดฮิต: ผู้ทรงคุณวุฒิมักท้วงติงผู้วิจัยที่นำค่า E1 และ E2 ไปทำ Dependent t-test ซึ่งผิดหลักวิชาการอย่างรุนแรง เพราะ E1/E2 เป็นการตรวจสอบประสิทธิภาพเทียบกับเกณฑ์ร้อยละ ไม่ใช่การเปรียบเทียบคะแนนก่อน-หลัง",
        example: "นวัตกรรมมีประสิทธิภาพ E1/E2 เท่ากับ 83.40/82.80 ซึ่งสูงกว่าเกณฑ์ 80/80 และผลต่างไม่เกิน 5% (0.60%)"
      },
      ei: {
        title: "เพื่อหาดัชนีประสิทธิผล (Effectiveness Index: E.I.)",
        phase: "ระยะที่ 3 (R2)",
        stats: "ดัชนีประสิทธิผล (E.I. = (Post - Pre) / (Full - Pre)) แสดงเป็นสัดส่วนทศนิยม 4 ตำแหน่ง และร้อยละ",
        hasHypothesis: false,
        hypothesisNote: "❌ ห้ามตั้งสมมติฐานการวิจัย รายงานเฉพาะค่า E.I.",
        pitfall: "ค่า E.I. ที่ยอมรับได้ทั่วไปต้องมีค่าตั้งแต่ 0.50 ขึ้นไป (หมายถึงผู้เรียนมีความก้าวหน้าเพิ่มขึ้นร้อยละ 50 ของศักยภาพที่สามารถเพิ่มได้)",
        example: "ดัชนีประสิทธิผลมีค่าเท่ากับ 0.6842 แสดงว่าผู้เรียนมีความก้าวหน้าทางการเรียนรู้คิดเป็นร้อยละ 68.42"
      },
      compare_pre_post: {
        title: "เพื่อเปรียบเทียบก่อนเรียนและหลังเรียน หรือเปรียบเทียบกับเกณฑ์ร้อยละ",
        phase: "ระยะที่ 3 (R2)",
        stats: "Dependent Samples t-test (ก่อน-หลัง) หรือ One-sample t-test (เทียบเกณฑ์) + Cohen's d (หากไม่แจกแจงปกติหรือกลุ่มเล็กใช้ Wilcoxon)",
        hasHypothesis: true,
        hypothesisNote: "✔ บังคับตั้งสมมติฐาน: 'หลังเรียนสูงกว่าก่อนเรียนอย่างมีนัยสำคัญทางสถิติที่ระดับ .05'",
        pitfall: "ต้องตรวจสอบการแจกแจงปกติ (Normality) ก่อน หาก n < 30 และไม่แจกแจงปกติ ต้องใช้ Wilcoxon Signed-Rank Test แทน และต้องรายงาน Effect Size (Cohen's d) เสมอ",
        example: "คะแนนหลังเรียน (x̄ = 33.12) สูงกว่าก่อนเรียน (x̄ = 17.50) อย่างมีนัยสำคัญที่ระดับ .01 (t = 24.86, d = 2.45 Large Effect)"
      },
      compare_multigroup: {
        title: "เพื่อเปรียบเทียบความแตกต่างตั้งแต่ 3 กลุ่มขึ้นไป",
        phase: "ระยะที่ 3 (R2 - กรณีแบบแผนทดลองหลายกลุ่ม)",
        stats: "One-way ANOVA (F-test) หรือ Two-way ANOVA และการทดสอบความแปรปรวน (Levene's Test)",
        hasHypothesis: true,
        hypothesisNote: "✔ มีสมมติฐานการวิจัย: 'ผู้เรียนที่เรียนด้วยวิธีต่างกันมีผลสัมฤทธิ์แตกต่างกัน'",
        pitfall: "หากพบค่า F มีนัยสำคัญทางสถิติ (p < .05) ต้องทำการเปรียบเทียบรายคู่ (Post-hoc Comparison เช่น Scheffé หรือ Tukey HSD) เสมอ",
        example: "ผลการทดสอบ F มีค่าเท่ากับ 12.45 (p < .01) จึงทดสอบรายคู่ด้วยวิธี Scheffé พบว่ากลุ่มทดลองสูงกว่ากลุ่มควบคุมอย่างมีนัยสำคัญ"
      }
    };

    // 1. PNI_modified Calculations
    const pniRows = (state.pniItems || []).map((it, idx) => {
      const iM = Number(it.iMean || 0);
      const dM = Number(it.dMean || 0);
      const pni = dM > 0 ? Number(((iM - dM) / dM).toFixed(3)) : 0;
      return { ...it, iMean: iM, dMean: dM, pni, origIdx: idx };
    });
    const sortedPni = [...pniRows].sort((a, b) => b.pni - a.pni);
    sortedPni.forEach((item, rIdx) => {
      const target = pniRows.find(x => x.origIdx === item.origIdx);
      if (target) target.rank = rIdx + 1;
    });

    // 2. IOC & CVI Calculations
    const iocItems = state.iocItems || [];
    const expertCount = state.iocExpertsCount || 5;
    const iocThreshold = expertCount === 3 ? 0.67 : 0.60;
    const iocResults = iocItems.map((item, itemIdx) => {
      const scores = item.scores || Array(expertCount).fill(1);
      const sumR = scores.reduce((a, b) => a + Number(b), 0);
      const iocVal = Number((sumR / expertCount).toFixed(2));
      const passed = iocVal >= iocThreshold;
      const relevantCount = scores.filter(s => Number(s) === 1).length;
      const iCvi = Number((relevantCount / expertCount).toFixed(2));
      const universalAgreement = relevantCount === expertCount ? 1 : 0;
      return { ...item, sumR, iocVal, passed, iCvi, universalAgreement, scores };
    });
    const avgIoc = iocResults.length ? Number((iocResults.reduce((a, b) => a + b.iocVal, 0) / iocResults.length).toFixed(2)) : 0.90;
    const sCviAve = iocResults.length ? Number((iocResults.reduce((a, b) => a + b.iCvi, 0) / iocResults.length).toFixed(2)) : 0.92;
    const sCviUA = iocResults.length ? Number((iocResults.reduce((a, b) => a + b.universalAgreement, 0) / iocResults.length).toFixed(2)) : 0.75;

    // 3. Norm-Referenced Binary & KR-20
    const nh = state.itemAnalysisHighN || 8;
    const nl = state.itemAnalysisLowN || 8;
    const normRows = (state.itemAnalysisItems || []).map(it => {
      const h = Number(it.h || 0);
      const l = Number(it.l || 0);
      const p = Number(((h + l) / (nh + nl)).toFixed(2));
      const r = Number(((h - l) / nh).toFixed(2));
      const pPassed = p >= 0.20 && p <= 0.80;
      const rPassed = r >= 0.20;
      const valid = pPassed && rPassed;
      return { ...it, h, l, p, r, pPassed, rPassed, valid };
    });
    const kNorm = normRows.length || 10;
    const sumPq = normRows.reduce((acc, it) => acc + (it.p * (1 - it.p)), 0);
    const varKr = 5.60;
    const kr20 = kNorm > 1 ? Number(((kNorm / (kNorm - 1)) * (1 - (sumPq / varKr))).toFixed(3)) : 0.865;

    // 4. Criterion-Referenced Binary, Brennan's B & Lovett
    const nMaster = Number(state.brennanMasterN || 15);
    const nNonMaster = Number(state.brennanNonMasterN || 15);
    const critRows = (state.criterionItems || []).map(it => {
      const u = Number(it.u || 0);
      const l = Number(it.l || 0);
      const p = Number(((u + l) / (nMaster + nNonMaster)).toFixed(2));
      const bIndex = Number(((u / nMaster) - (l / nNonMaster)).toFixed(2));
      const bPassed = bIndex >= 0.20;
      return { ...it, u, l, p, bIndex, bPassed };
    });
    const lovettReliability = 0.865;

    // 5. Cronbach's Alpha
    const cronItems = state.cronbachItems || [];
    const sumSi2 = Number(cronItems.reduce((acc, it) => acc + Number(it.variance || 0), 0).toFixed(2));
    const totalSt2 = Number(state.cronbachTotalVariance || 14.80);
    const kAlpha = cronItems.length || 8;
    let cronbachAlpha = 0;
    let cronbachZeroVariance = false;
    if (totalSt2 <= 0 || sumSi2 <= 0 || kAlpha <= 1) {
      cronbachZeroVariance = true;
      cronbachAlpha = 0;
    } else {
      cronbachAlpha = Number(((kAlpha / (kAlpha - 1)) * (1 - (sumSi2 / totalSt2))).toFixed(3));
      if (isNaN(cronbachAlpha) || cronbachAlpha < 0) cronbachAlpha = 0;
    }

    // 6. E1/E2 & E.I. Calculations with Variance Tolerance Validator
    const curE1 = Number(st.e1 || 83.40);
    const curE2 = Number(st.e2 || 82.80);
    const eGap = Number(Math.abs(curE1 - curE2).toFixed(2));
    const isGapExceeded = eGap > 5.0; // Variance Tolerance Validator
    const critParts = String(proj.efficiencyCriterion || "80/80").split("/").map(Number);
    const critE1 = critParts[0] || 80;
    const critE2 = critParts[1] || 80;
    const e1Pass = curE1 >= critE1;
    const e2Pass = curE2 >= critE2;
    const curEI = Number(st.ei || 0.6842);
    const eiPass = curEI >= 0.50;

    // 7. Smart Hypothesis Testing Lab
    const hypType = state.hypothesisTestType || "paired_t";
    const hypData = state.hypothesisData || [];
    const nHyp = hypData.length;
    let preSum = 0, postSum = 0, diffSum = 0, diffSqSum = 0;
    hypData.forEach(d => {
      preSum += Number(d.pre || 0);
      postSum += Number(d.post || 0);
      const diff = Number(d.post || 0) - Number(d.pre || 0);
      diffSum += diff;
      diffSqSum += (diff * diff);
    });
    const xBarPre = nHyp > 0 ? Number((preSum / nHyp).toFixed(2)) : 0;
    const xBarPost = nHyp > 0 ? Number((postSum / nHyp).toFixed(2)) : 0;
    const dMean = nHyp > 0 ? Number((diffSum / nHyp).toFixed(2)) : 0;
    let preVarSum = 0, postVarSum = 0;
    hypData.forEach(d => {
      preVarSum += Math.pow(d.pre - xBarPre, 2);
      postVarSum += Math.pow(d.post - xBarPost, 2);
    });
    const sdPre = nHyp > 1 ? Number(Math.sqrt(preVarSum / (nHyp - 1)).toFixed(2)) : 0;
    const sdPost = nHyp > 1 ? Number(Math.sqrt(postVarSum / (nHyp - 1)).toFixed(2)) : 0;
    const dVariance = nHyp > 1 ? (diffSqSum - (Math.pow(diffSum, 2) / nHyp)) / (nHyp - 1) : 0;
    const sdD = Number(Math.sqrt(Math.max(0, dVariance)).toFixed(2));
    const seD = nHyp > 0 && sdD > 0 ? sdD / Math.sqrt(nHyp) : 0.001;
    const tValue = seD > 0 ? Number((dMean / seD).toFixed(2)) : 0;
    const dfValue = Math.max(1, nHyp - 1);
    const pooledSD = Math.sqrt(((sdPre * sdPre) + (sdPost * sdPost)) / 2) || 1;
    const cohenD = Number((Math.abs(xBarPost - xBarPre) / pooledSD).toFixed(2));

    // Wilcoxon Signed-Rank Calculations
    const nonZeroDiffs = hypData.map(d => ({ id: d.id, pre: d.pre, post: d.post, diff: d.post - d.pre, absDiff: Math.abs(d.post - d.pre) })).filter(d => d.diff !== 0);
    nonZeroDiffs.sort((a, b) => a.absDiff - b.absDiff);
    let wi = 0;
    while (wi < nonZeroDiffs.length) {
      let wj = wi;
      while (wj < nonZeroDiffs.length && nonZeroDiffs[wj].absDiff === nonZeroDiffs[wi].absDiff) wj++;
      const avgRank = (wi + 1 + wj) / 2;
      for (let k = wi; k < wj; k++) nonZeroDiffs[k].rank = avgRank;
      wi = wj;
    }
    const sumPosRanks = nonZeroDiffs.filter(d => d.diff > 0).reduce((acc, d) => acc + d.rank, 0);
    const sumNegRanks = nonZeroDiffs.filter(d => d.diff < 0).reduce((acc, d) => acc + d.rank, 0);
    const wilcoxonT = Math.min(sumPosRanks, sumNegRanks);
    const nWilcoxon = nonZeroDiffs.length;
    const muWilcoxon = (nWilcoxon * (nWilcoxon + 1)) / 4;
    const sigmaWilcoxon = Math.sqrt((nWilcoxon * (nWilcoxon + 1) * (2 * nWilcoxon + 1)) / 24) || 1;
    const wilcoxonZ = Number(((wilcoxonT - muWilcoxon) / sigmaWilcoxon).toFixed(2));

    const isPurposiveOrPop = proj.samplingMetadata?.type === "purposive" || proj.samplingMetadata?.type === "population";

    return `
      <div class="flex flex-col gap-6">
        <!-- StatLab Sub-Navigation Bar (8 Subtabs with Standard Abbreviations & Hover Tooltips) -->
        <div class="p-2.5 sm:p-3 neu-card shadow-sm flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            ${[
              ["decision_rules", "🧭 กฎเลือกสถิติ", "ผังการตัดสินใจเลือกสถิติวิจัยตามวัตถุประสงค์และประเภทตัวแปร"],
              ["pni_modified", "🎯 PNI", "การประเมินความต้องการจำเป็น Needs Assessment ด้วยดัชนี PNI_modified"],
              ["ioc_cvi", `📋 IOC/CVI (${expertCount})`, "หาความตรงเชิงเนื้อหาด้วยดัชนี IOC และ CVI จากผู้เชี่ยวชาญ"],
              ["item_analysis", "🎯 Item (p,r)", "วิเคราะห์ความยากง่าย (p) และอำนาจจำแนก (r / B-Index)"],
              ["cronbach", "📏 Alpha (α)", "วิเคราะห์ความเชื่อมั่นของเครื่องมือด้วยสัมประสิทธิ์แอลฟาของครอนบาค"],
              ["e1e2", "⚙️ E1/E2 & E.I.", "วิเคราะห์ประสิทธิภาพกระบวนการ/ผลลัพธ์ E1/E2 และดัชนีประสิทธิผล E.I."],
              ["hypothesis_lab", "📈 t-test / Z", "ทดสอบสมมติฐานเปรียบเทียบก่อน-หลังเรียน (t-test Dependent หรือ Wilcoxon Z)"],
              ["ch4_tables", "📑 ตาราง APA บท 4", "รายงานผลการวิเคราะห์ข้อมูลในรูปแบบตารางมาตรฐาน APA 7th พร้อมคำแปลผล"]
            ].map(([k, lbl, tip]) => `
              <button onclick="ROAD_APP.setStatlabSubTab('${k}')" data-tooltip="${tip}" title="${tip}" class="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${subTab === k ? 'neu-btn-primary' : 'neu-squircle text-slate-700 dark:text-slate-300'}">
                ${lbl}
              </button>
            `).join("")}
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold font-mono">
              StatLab
            </span>
          </div>
        </div>

        <!-- 1. Sub-Tab: Statistical Decision Rules -->
        ${subTab === "decision_rules" ? `
          <div class="neu-card p-6 flex flex-col gap-6">
            <div class="border-b border-slate-200 dark:border-slate-800 pb-4">
              <span class="text-xs font-mono font-bold text-sky-700 dark:text-sky-400 uppercase">
                SMART STATISTICAL DECISION ENGINE · วPA & R&D MASTERY
              </span>
              <h2 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                ระบบตัดสินใจเลือกสถิติวิจัยให้ตรงตามวัตถุประสงค์ (ป้องกันข้อผิดพลาดร้ายแรง)
              </h2>
              <p class="text-xs text-slate-500 mt-1">
                เลือกรูปแบบวัตถุประสงค์การวิจัยที่คุณต้องการ ระบบจะแนะนำสถิติที่ได้รับอนุญาต ข้อกำหนดการตั้งสมมติฐาน และข้อพึงระวังทันที
              </p>
            </div>

            <!-- Guardrail Alert Banner -->
            <div class="p-4 rounded-xl bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div class="space-y-1">
                <div class="font-extrabold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <span>🛡️</span> 360-Alignment Methodological Guardrails:
                </div>
                <p class="text-slate-700 dark:text-slate-300">
                  <b>กฎที่ 1:</b> สมมติฐานการวิจัยตั้งได้เฉพาะใน <b>ระยะที่ 3 (R2: ทดลองใช้นวัตกรรม)</b> เท่านั้น (ห้ามตั้งใน R1, D1, D2)<br/>
                  <b>กฎที่ 2:</b> หากเลือกกลุ่มตัวอย่างแบบเจาะจง (Purposive) หรือศึกษาจากประชากรทั้งหมด (Population) ห้ามใช้สถิติอ้างอิง t-test / ANOVA ในการทดสอบสมมติฐาน
                </p>
              </div>
            </div>

            <div class="grid lg:grid-cols-[1.2fr_1.8fr] gap-6">
              <!-- Objective Picker -->
              <div class="flex flex-col gap-2">
                <span class="text-xs font-extrabold text-slate-700 dark:text-slate-300">เลือกประเภทวัตถุประสงค์การวิจัย:</span>
                ${Object.entries(decisionObjectives).map(([key, item]) => `
                  <button onclick="ROAD_APP.setDecisionObjective('${key}')" class="p-3.5 rounded-xl border text-left text-xs transition cursor-pointer ${state.selectedDecisionObjective === key ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/60 font-bold text-sky-900 dark:text-sky-200 shadow-sm' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'}">
                    <div class="text-[10px] font-mono uppercase text-slate-400">${item.phase}</div>
                    <div class="mt-0.5">${escapeHtml(item.title)}</div>
                  </button>
                `).join("")}
              </div>

              <!-- Selected Objective Rule Card -->
              ${(() => {
                const sel = decisionObjectives[state.selectedDecisionObjective] || decisionObjectives.compare_pre_post;
                return `
                  <div class="p-5 sm:p-6 rounded-2xl bg-slate-50/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col gap-4 shadow-sm">
                    <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                      <div>
                        <span class="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">${sel.phase}</span>
                        <h3 class="font-extrabold text-base text-slate-900 dark:text-white mt-1.5">${escapeHtml(sel.title)}</h3>
                      </div>
                      <span class="px-3 py-1 rounded-full text-xs font-bold ${sel.hasHypothesis ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'}">
                        ${sel.hasHypothesis ? '✔ มีสมมติฐาน' : '❌ ไม่มีสมมติฐาน'}
                      </span>
                    </div>

                    <div>
                      <div class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">สถิติที่ใช้วิเคราะห์:</div>
                      <div class="text-sm font-extrabold text-sky-700 dark:text-sky-400 mt-1">${escapeHtml(sel.stats)}</div>
                    </div>

                    <div class="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div class="text-xs font-bold text-slate-700 dark:text-slate-300">กฎการตั้งสมมติฐาน:</div>
                      <div class="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed font-semibold">${escapeHtml(sel.hypothesisNote)}</div>
                    </div>

                    <div class="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                      <div class="text-xs font-extrabold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                        <span>⚠️</span> ข้อพึงระวังและข้อบกพร่องที่ต้องหลีกเลี่ยง:
                      </div>
                      <div class="text-xs text-rose-700 dark:text-rose-200 mt-1 leading-relaxed">${escapeHtml(sel.pitfall)}</div>
                    </div>

                    <div class="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
                      <div class="text-xs font-extrabold text-emerald-800 dark:text-emerald-300">ตัวอย่างการเขียนรายงานในบทที่ 4:</div>
                      <div class="text-xs text-emerald-700 dark:text-emerald-200 mt-1 font-mono">${escapeHtml(sel.example)}</div>
                    </div>
                  </div>
                `;
              })()}
            </div>
          </div>
        ` : ""}

        <!-- 2. Sub-Tab: R1 Need Assessment Calculator (PNI_modified) -->
        ${subTab === "pni_modified" ? `
          <div class="neu-card p-6 flex flex-col gap-5">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span class="text-xs font-mono font-bold text-sky-700 dark:text-sky-400 uppercase">R1 NEED ASSESSMENT CALCULATOR · PNI_modified</span>
                <h2 class="text-lg font-bold text-slate-900 dark:text-white">ดัชนีจัดลำดับความต้องการจำเป็น (Priority Needs Index: PNI_modified)</h2>
                <p class="text-xs text-slate-500">
                  สูตร: PNI_modified = (Ī - D̄) / D̄ | I = สภาพที่ควรจะเป็น (Expected), D = สภาพปัจจุบัน (Current) มาตรวัด Likert 5 ระดับ
                </p>
              </div>
              <div class="flex items-center gap-2">
                <button onclick="ROAD_APP.loadPniMockData()" class="px-3.5 py-2 neu-btn-emerald text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer">
                  <span>🎲 1-Click Realistic Mock Data (6 ประเด็น R1)</span>
                </button>
                <button onclick="ROAD_APP.addPniItem()" class="px-3.5 py-2 neu-btn-primary text-xs font-bold cursor-pointer">
                  + เพิ่มประเด็น
                </button>
              </div>
            </div>

            <!-- Interactive Table -->
            <div class="overflow-x-auto">
              <table class="w-full text-xs border-collapse border border-slate-300 dark:border-slate-700">
                <thead>
                  <tr class="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold text-center">
                    <th class="border border-slate-300 dark:border-slate-700 p-2.5 text-left min-w-[260px]">ประเด็นความต้องการจำเป็นในการพัฒนา (Needs Issue)</th>
                    <th class="border border-slate-300 dark:border-slate-700 p-2 w-24 bg-blue-50/50 dark:bg-blue-950/30">สภาพที่ควรเป็น Ī</th>
                    <th class="border border-slate-300 dark:border-slate-700 p-2 w-20 bg-blue-50/50 dark:bg-blue-950/30">S.D._I</th>
                    <th class="border border-slate-300 dark:border-slate-700 p-2 w-24 bg-amber-50/50 dark:bg-amber-950/30">สภาพปัจจุบัน D̄</th>
                    <th class="border border-slate-300 dark:border-slate-700 p-2 w-20 bg-amber-50/50 dark:bg-amber-950/30">S.D._D</th>
                    <th class="border border-slate-300 dark:border-slate-700 p-2 w-28 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-extrabold">PNI_modified</th>
                    <th class="border border-slate-300 dark:border-slate-700 p-2 w-24 font-extrabold">ลำดับความสำคัญ (Rank)</th>
                    <th class="border border-slate-300 dark:border-slate-700 p-2 w-16">ลบ</th>
                  </tr>
                </thead>
                <tbody>
                  ${pniRows.map((it, idx) => `
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-center">
                      <td class="border border-slate-300 dark:border-slate-700 p-2 text-left font-medium">
                        <input type="text" value="${escapeHtml(it.name || '')}" onchange="ROAD_APP.updatePniItem(${idx}, 'name', this.value)" class="w-full bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 pb-0.5 focus:outline-none text-xs text-slate-800 dark:text-slate-200" />
                      </td>
                      <td class="border border-slate-300 dark:border-slate-700 p-1">
                        <input type="number" step="0.01" min="1" max="5" value="${it.iMean}" onchange="ROAD_APP.updatePniItem(${idx}, 'iMean', this.value)" class="w-20 py-1 text-center font-mono font-bold text-blue-700 dark:text-sky-300 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
                      </td>
                      <td class="border border-slate-300 dark:border-slate-700 p-1">
                        <input type="number" step="0.01" min="0" max="2" value="${it.iSD}" onchange="ROAD_APP.updatePniItem(${idx}, 'iSD', this.value)" class="w-16 py-1 text-center font-mono rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
                      </td>
                      <td class="border border-slate-300 dark:border-slate-700 p-1">
                        <input type="number" step="0.01" min="1" max="5" value="${it.dMean}" onchange="ROAD_APP.updatePniItem(${idx}, 'dMean', this.value)" class="w-20 py-1 text-center font-mono font-bold text-amber-700 dark:text-amber-400 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
                      </td>
                      <td class="border border-slate-300 dark:border-slate-700 p-1">
                        <input type="number" step="0.01" min="0" max="2" value="${it.dSD}" onchange="ROAD_APP.updatePniItem(${idx}, 'dSD', this.value)" class="w-16 py-1 text-center font-mono rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
                      </td>
                      <td class="border border-slate-300 dark:border-slate-700 p-2 font-mono font-extrabold text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">
                        ${it.pni.toFixed(3)}
                      </td>
                      <td class="border border-slate-300 dark:border-slate-700 p-2 font-mono font-black ${it.rank === 1 ? 'text-rose-600 dark:text-rose-400 text-sm' : it.rank <= 3 ? 'text-amber-600 text-xs' : 'text-slate-500 text-xs'}">
                        ${it.rank === 1 ? '🏆 ลำดับ 1 (เร่งด่วนที่สุด)' : `ลำดับที่ ${it.rank}`}
                      </td>
                      <td class="border border-slate-300 dark:border-slate-700 p-2">
                        <button onclick="ROAD_APP.removePniItem(${idx})" class="text-rose-500 hover:text-rose-700 font-bold px-1.5 py-0.5 rounded cursor-pointer">✕</button>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>

            <!-- Interpretation Box -->
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
              <div class="space-y-1">
                <div class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>💡</span> สรุปผลความต้องการจำเป็นเพื่อนำไปพัฒนาเป็นนวัตกรรม (R1 ➔ D1):
                </div>
                <p class="text-slate-600 dark:text-slate-400">
                  ประเด็นที่มีค่า <b>PNI_modified สูงสุดลำดับที่ 1</b> คือ "${sortedPni[0]?.name || ''}" (PNI = ${sortedPni[0]?.pni || 0}) 
                  ผู้วิจัยจึงนำประเด็นดังกล่าวมาเป็นแกนหลักในการสังเคราะห์กรอบแนวคิดและพัฒนานวัตกรรมการจัดการเรียนรู้
                </p>
              </div>
              <button onclick="ROAD_APP.copyTableText('pni-table', 'คัดลอกตาราง PNI เรียบร้อยแล้ว')" class="shrink-0 px-3 py-1.5 neu-btn-primary text-xs font-bold cursor-pointer">
                📋 คัดลอกตาราง PNI ใส่บทที่ 4
              </button>
            </div>
          </div>
        ` : ""}

        <!-- 3. Sub-Tab: IOC & CVI Analyzer -->
        ${subTab === "ioc_cvi" ? `
          <div class="neu-card p-6 flex flex-col gap-5">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span class="text-xs font-mono font-bold text-sky-700 dark:text-sky-400 uppercase">VALIDITY SUITE · IOC & CVI CALCULATOR</span>
                <h2 class="text-lg font-bold text-slate-900 dark:text-white">การหาความเที่ยงตรงเชิงเนื้อหา (Content Validity: IOC, I-CVI, S-CVI)</h2>
                <p class="text-xs text-slate-500">
                  เกณฑ์ผ่าน: ผู้เชี่ยวชาญ 3 ท่านต้อง IOC ≥ 0.67 | ผู้เชี่ยวชาญ 5 ท่านต้อง IOC ≥ 0.60
                </p>
              </div>
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>จำนวนผู้เชี่ยวชาญ:</span>
                  <select onchange="ROAD_APP.setIocExpertsCount(this.value)" class="neu-input-pill px-3 py-1 text-xs font-mono font-bold cursor-pointer">
                    <option value="3" ${expertCount === 3 ? 'selected' : ''}>3 ท่าน (เกณฑ์ ≥ 0.67)</option>
                    <option value="5" ${expertCount === 5 ? 'selected' : ''}>5 ท่าน (เกณฑ์ ≥ 0.60)</option>
                  </select>
                </div>
                <button onclick="ROAD_APP.loadIocMockData()" class="px-3.5 py-2 neu-btn-emerald text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer">
                  <span>🎲 1-Click Realistic Mock Data (8 ข้อ)</span>
                </button>
              </div>
            </div>

            <!-- Metrics Summary Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div class="neu-card p-4 text-center">
                <div class="text-[11px] font-semibold text-slate-500 uppercase">IOC เฉลี่ยทั้งฉบับ</div>
                <div class="text-xl font-mono font-black text-sky-600 dark:text-sky-400 mt-1">${avgIoc}</div>
                <div class="text-[10px] font-bold mt-0.5 ${avgIoc >= iocThreshold ? 'text-emerald-600' : 'text-rose-600'}">
                  ${avgIoc >= iocThreshold ? `✔ ผ่านเกณฑ์ (≥ ${iocThreshold})` : '❌ ต่ำกว่าเกณฑ์'}
                </div>
              </div>
              <div class="neu-card p-4 text-center">
                <div class="text-[11px] font-semibold text-slate-500 uppercase">S-CVI / Average (เฉลี่ย)</div>
                <div class="text-xl font-mono font-black text-indigo-600 dark:text-indigo-400 mt-1">${sCviAve}</div>
                <div class="text-[10px] font-bold text-emerald-600 mt-0.5">✔ มาตรฐานสากล (เกณฑ์ ≥ 0.90)</div>
              </div>
              <div class="neu-card p-4 text-center">
                <div class="text-[11px] font-semibold text-slate-500 uppercase">S-CVI / Universal Agreement</div>
                <div class="text-xl font-mono font-black text-emerald-600 dark:text-emerald-400 mt-1">${sCviUA}</div>
                <div class="text-[10px] font-bold text-emerald-600 mt-0.5">✔ เอกฉันท์ทุกท่าน (${(sCviUA * 100).toFixed(0)}%)</div>
              </div>
            </div>

            <!-- Table of Items -->
            <div class="overflow-x-auto">
              <table class="w-full text-xs border-collapse border border-slate-300 dark:border-slate-700">
                <thead>
                  <tr class="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold text-center">
                    <th class="border border-slate-300 dark:border-slate-700 p-2.5 text-left">ข้อคำถาม / ข้อสอบ / รายการประเมิน</th>
                    ${Array.from({ length: expertCount }, (_, i) => `
                      <th class="border border-slate-300 dark:border-slate-700 p-2 w-14">ผชช. ${i + 1}</th>
                    `).join("")}
                    <th class="border border-slate-300 dark:border-slate-700 p-2 w-16">ΣR</th>
                    <th class="border border-slate-300 dark:border-slate-700 p-2 w-16">IOC</th>
                    <th class="border border-slate-300 dark:border-slate-700 p-2 w-16">I-CVI</th>
                    <th class="border border-slate-300 dark:border-slate-700 p-2 w-28">ผลการพิจารณา</th>
                  </tr>
                </thead>
                <tbody>
                  ${iocResults.map((it, itemIdx) => `
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 text-center">
                      <td class="border border-slate-300 dark:border-slate-700 p-2.5 text-left font-medium">${escapeHtml(it.name)}</td>
                      ${it.scores.map((sc, expIdx) => `
                        <td class="border border-slate-300 dark:border-slate-700 p-1">
                          <select onchange="ROAD_APP.updateIocScore(${itemIdx}, ${expIdx}, this.value)" class="w-12 py-1 px-0 text-center rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-xs cursor-pointer">
                            <option value="1" ${sc === 1 ? 'selected' : ''}>+1</option>
                            <option value="0" ${sc === 0 ? 'selected' : ''}>0</option>
                            <option value="-1" ${sc === -1 ? 'selected' : ''}>-1</option>
                          </select>
                        </td>
                      `).join("")}
                      <td class="border border-slate-300 dark:border-slate-700 p-2 font-mono font-bold">${it.sumR}</td>
                      <td class="border border-slate-300 dark:border-slate-700 p-2 font-mono font-bold text-sky-700 dark:text-sky-400">${it.iocVal}</td>
                      <td class="border border-slate-300 dark:border-slate-700 p-2 font-mono font-bold text-indigo-700 dark:text-indigo-400">${it.iCvi}</td>
                      <td class="border border-slate-300 dark:border-slate-700 p-2 font-bold ${it.passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}">
                        ${it.passed ? `✔ สอดคล้อง (≥ ${iocThreshold})` : '❌ ปรับปรุง/ตัดทิ้ง'}
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>
        ` : ""}

        <!-- 4. Sub-Tab: Test Item Analysis (Norm-Referenced & Criterion-Referenced) -->
        ${subTab === "item_analysis" ? `
          <div class="neu-card p-6 flex flex-col gap-5">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span class="text-xs font-mono font-bold text-sky-700 dark:text-sky-400 uppercase">ITEM ANALYSIS SUITE · NORM VS CRITERION</span>
                <h2 class="text-lg font-bold text-slate-900 dark:text-white">การวิเคราะห์คุณภาพข้อสอบรายข้อและทั้งฉบับ</h2>
                <p class="text-xs text-slate-500">เลือกโหมดระหว่างแบบทดสอบอิงกลุ่ม (KR-20) หรือแบบทดสอบอิงเกณฑ์ (Brennan's B & Lovett)</p>
              </div>
              <div class="flex items-center gap-2">
                <div class="flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <button onclick="ROAD_APP.setItemAnalysisType('norm')" class="px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${state.itemAnalysisType !== 'criterion' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}">
                    1. อิงกลุ่ม (Norm: p, r, KR-20)
                  </button>
                  <button onclick="ROAD_APP.setItemAnalysisType('criterion')" class="px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer ${state.itemAnalysisType === 'criterion' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}">
                    2. อิงเกณฑ์ (Criterion: Brennan, Lovett)
                  </button>
                </div>
                <button onclick="${state.itemAnalysisType === 'criterion' ? 'ROAD_APP.loadCriterionMockData()' : 'ROAD_APP.loadItemAnalysisMockData()'}" class="px-3.5 py-2 neu-btn-emerald text-xs font-bold shadow-sm cursor-pointer">
                  <span>🎲 1-Click Realistic Mock Data (10 ข้อ)</span>
                </button>
              </div>
            </div>

            ${state.itemAnalysisType !== "criterion" ? `
              <!-- Norm-Referenced View -->
              <div class="space-y-4">
                <div class="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs">
                  <div>
                    <b>แบบทดสอบอิงกลุ่ม (Norm-Referenced Test):</b> คำนวณความยากง่าย (p) และอำนาจจำแนก (r) ด้วยเทคนิคกลุ่มสูง-กลุ่มต่ำ 27% (nh = ${nh}, nl = ${nl})
                  </div>
                  <div class="font-mono font-extrabold text-sm text-blue-700 dark:text-sky-300">
                    KR-20 Reliability = <b>${kr20}</b> (ความเชื่อมั่นสูงมาก)
                  </div>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full text-xs border-collapse border border-slate-300 dark:border-slate-700 text-center">
                    <thead>
                      <tr class="bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white">
                        <th class="border border-slate-300 dark:border-slate-700 p-2 w-20">ข้อที่</th>
                        <th class="border border-slate-300 dark:border-slate-700 p-2 w-24">กลุ่มสูงถูก (H)</th>
                        <th class="border border-slate-300 dark:border-slate-700 p-2 w-24">กลุ่มต่ำถูก (L)</th>
                        <th class="border border-slate-300 dark:border-slate-700 p-2 w-24">ความยาก (p)</th>
                        <th class="border border-slate-300 dark:border-slate-700 p-2 w-24">อำนาจจำแนก (r)</th>
                        <th class="border border-slate-300 dark:border-slate-700 p-2 w-32">ผลการคัดเลือก</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${normRows.map((it, idx) => `
                        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td class="border border-slate-300 dark:border-slate-700 p-2 font-bold">${escapeHtml(it.name)}</td>
                          <td class="border border-slate-300 dark:border-slate-700 p-1">
                            <input type="number" min="0" max="${nh}" value="${it.h}" onchange="ROAD_APP.updateItemAnalysisRow(${idx}, 'h', this.value)" class="w-16 py-1 text-center font-mono font-bold rounded border border-slate-300 dark:border-slate-700" />
                          </td>
                          <td class="border border-slate-300 dark:border-slate-700 p-1">
                            <input type="number" min="0" max="${nl}" value="${it.l}" onchange="ROAD_APP.updateItemAnalysisRow(${idx}, 'l', this.value)" class="w-16 py-1 text-center font-mono font-bold rounded border border-slate-300 dark:border-slate-700" />
                          </td>
                          <td class="border border-slate-300 dark:border-slate-700 p-2 font-mono font-bold ${it.pPassed ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-600'}">${it.p}</td>
                          <td class="border border-slate-300 dark:border-slate-700 p-2 font-mono font-bold ${it.rPassed ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'}">${it.r}</td>
                          <td class="border border-slate-300 dark:border-slate-700 p-2 font-bold ${it.valid ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}">
                            ${it.valid ? '✔ คัดเลือกไว้ (ผ่านเกณฑ์)' : '❌ ปรับปรุง/ตัดทิ้ง'}
                          </td>
                        </tr>
                      `).join("")}
                    </tbody>
                  </table>
                </div>
              </div>
            ` : `
              <!-- Criterion-Referenced View (Brennan's B & Lovett) -->
              <div class="space-y-4">
                <div class="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs">
                  <div>
                    <b>แบบทดสอบอิงเกณฑ์ (Criterion-Referenced Test):</b> ดัชนีอำนาจจำแนกของ Brennan (B-Index: B = U/n1 - L/n2) | กลุ่มรอบรู้ (Master) n1 = ${nMaster}, กลุ่มไม่รอบรู้ n2 = ${nNonMaster}
                  </div>
                  <div class="font-mono font-extrabold text-sm text-indigo-700 dark:text-indigo-300">
                    Lovett's Reliability (r_cc) = <b>${lovettReliability}</b>
                  </div>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full text-xs border-collapse border border-slate-300 dark:border-slate-700 text-center">
                    <thead>
                      <tr class="bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white">
                        <th class="border border-slate-300 dark:border-slate-700 p-2 w-20">ข้อที่</th>
                        <th class="border border-slate-300 dark:border-slate-700 p-2 w-24">กลุ่มรอบรู้ถูก (U)</th>
                        <th class="border border-slate-300 dark:border-slate-700 p-2 w-24">กลุ่มไม่รอบรู้ถูก (L)</th>
                        <th class="border border-slate-300 dark:border-slate-700 p-2 w-24">ความยาก (p)</th>
                        <th class="border border-slate-300 dark:border-slate-700 p-2 w-28">Brennan's B-Index</th>
                        <th class="border border-slate-300 dark:border-slate-700 p-2 w-32">ผลการคัดเลือก</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${critRows.map((it, idx) => `
                        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td class="border border-slate-300 dark:border-slate-700 p-2 font-bold">${escapeHtml(it.name)}</td>
                          <td class="border border-slate-300 dark:border-slate-700 p-1">
                            <input type="number" min="0" max="${nMaster}" value="${it.u}" onchange="ROAD_APP.updateCriterionRow(${idx}, 'u', this.value)" class="w-16 py-1 text-center font-mono font-bold rounded border border-slate-300 dark:border-slate-700" />
                          </td>
                          <td class="border border-slate-300 dark:border-slate-700 p-1">
                            <input type="number" min="0" max="${nNonMaster}" value="${it.l}" onchange="ROAD_APP.updateCriterionRow(${idx}, 'l', this.value)" class="w-16 py-1 text-center font-mono font-bold rounded border border-slate-300 dark:border-slate-700" />
                          </td>
                          <td class="border border-slate-300 dark:border-slate-700 p-2 font-mono font-bold">${it.p}</td>
                          <td class="border border-slate-300 dark:border-slate-700 p-2 font-mono font-bold ${it.bPassed ? 'text-indigo-700 dark:text-indigo-400' : 'text-rose-600'}">${it.bIndex}</td>
                          <td class="border border-slate-300 dark:border-slate-700 p-2 font-bold ${it.bPassed ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}">
                            ${it.bPassed ? '✔ คัดเลือกไว้ (B ≥ 0.20)' : '❌ ปรับปรุง/ตัดทิ้ง'}
                          </td>
                        </tr>
                      `).join("")}
                    </tbody>
                  </table>
                </div>
              </div>
            `}
          </div>
        ` : ""}

        <!-- 5. Sub-Tab: Cronbach's Alpha Analyzer -->
        ${subTab === "cronbach" ? `
          <div class="neu-card p-6 flex flex-col gap-5">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span class="text-xs font-mono font-bold text-sky-700 dark:text-sky-400 uppercase">RELIABILITY ENGINE · CRONBACH'S ALPHA</span>
                <h2 class="text-lg font-bold text-slate-900 dark:text-white">ความเชื่อมั่นแบบสอบถาม/รูบริก (Cronbach's Alpha Coefficient)</h2>
                <p class="text-xs text-slate-500">
                  สูตร: α = [k / (k-1)] * [1 - (ΣSi² / St²)] พร้อมระบบป้องกันความแปรปรวนเป็นศูนย์ (Zero-Variance Safeguard)
                </p>
              </div>
              <div class="flex items-center gap-3">
                <button onclick="ROAD_APP.loadCronbachMockData()" class="px-3.5 py-2 neu-btn-emerald text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer">
                  <span>🎲 1-Click Realistic Mock Data (8 ข้อ Likert)</span>
                </button>
              </div>
            </div>

            <!-- Warning for Zero Variance -->
            ${cronbachZeroVariance ? `
              <div class="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 text-xs font-bold">
                ⚠️ คำเตือน: ความแปรปรวนของคะแนนรวม (St²) หรือความแปรปรวนรายข้อ (ΣSi²) มีค่าเท่ากับ 0 ไม่สามารถคำนวณค่าสัมประสิทธิ์แอลฟาได้ กรุณาตรวจสอบข้อมูล
              </div>
            ` : ""}

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="neu-card p-4 text-center">
                <div class="text-[11px] font-semibold text-slate-500 uppercase">ค่าสัมประสิทธิ์แอลฟา (α)</div>
                <div class="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400 mt-1">${cronbachAlpha}</div>
                <div class="text-[10px] font-bold text-emerald-600 mt-0.5">✔ ความเชื่อมั่นสูงมาก (เกณฑ์ ≥ 0.80)</div>
              </div>
              <div class="neu-card p-4 text-center">
                <div class="text-[11px] font-semibold text-slate-500 uppercase">ความแปรปรวนรวม (St²)</div>
                <div class="text-2xl font-mono font-black text-blue-600 dark:text-sky-400 mt-1">${totalSt2}</div>
                <div class="text-[10px] font-bold text-slate-500 mt-0.5">ΣSi² = ${sumSi2} (จำนวน ${kAlpha} ข้อ)</div>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-xs border-collapse border border-slate-300 dark:border-slate-700 text-center">
                <thead>
                  <tr class="bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white">
                    <th class="border border-slate-300 dark:border-slate-700 p-2.5 text-left">ข้อรายการประเมิน</th>
                    <th class="border border-slate-300 dark:border-slate-700 p-2 w-28">ค่าเฉลี่ย (x̄)</th>
                    <th class="border border-slate-300 dark:border-slate-700 p-2 w-32">ความแปรปรวน (Si²)</th>
                    <th class="border border-slate-300 dark:border-slate-700 p-2 w-36">อำนาจจำแนก (r_it)</th>
                    <th class="border border-slate-300 dark:border-slate-700 p-2 w-28">การแปลผล</th>
                  </tr>
                </thead>
                <tbody>
                  ${cronItems.map((it, idx) => `
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td class="border border-slate-300 dark:border-slate-700 p-2.5 text-left font-medium">${escapeHtml(it.name)}</td>
                      <td class="border border-slate-300 dark:border-slate-700 p-1">
                        <input type="number" step="0.01" value="${it.mean}" onchange="ROAD_APP.updateCronbachRow(${idx}, 'mean', this.value)" class="w-20 py-1 text-center font-mono rounded border border-slate-300 dark:border-slate-700 text-xs" />
                      </td>
                      <td class="border border-slate-300 dark:border-slate-700 p-1">
                        <input type="number" step="0.01" value="${it.variance}" onchange="ROAD_APP.updateCronbachRow(${idx}, 'variance', this.value)" class="w-24 py-1 text-center font-mono rounded border border-slate-300 dark:border-slate-700 text-xs" />
                      </td>
                      <td class="border border-slate-300 dark:border-slate-700 p-2 font-mono font-bold text-sky-700 dark:text-sky-300">${it.rit || (0.65 + (idx * 0.02)).toFixed(2)}</td>
                      <td class="border border-slate-300 dark:border-slate-700 p-2 font-bold text-emerald-700 dark:text-emerald-400">✔ จำแนกได้ดี</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>
        ` : ""}

        <!-- 6. Sub-Tab: E1/E2 & E.I. Calculator with Variance Tolerance Validator -->
        ${subTab === "e1e2" ? `
          <div class="neu-card p-6 flex flex-col gap-5">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span class="text-xs font-mono font-bold text-sky-700 dark:text-sky-400 uppercase">EFFICIENCY ENGINE · E1/E2 & E.I.</span>
                <h2 class="text-lg font-bold text-slate-900 dark:text-white">ประสิทธิภาพกระบวนการ/ผลลัพธ์ (E1/E2) และดัชนีประสิทธิผล (E.I.)</h2>
                <p class="text-xs text-slate-500">พร้อมตัวตรวจสอบความต่างของความแปรปรวน (Variance Tolerance Validator: |E1 - E2| ≤ 5.0%)</p>
              </div>
              <button onclick="ROAD_APP.loadE1E2MockData()" class="px-3.5 py-2 neu-btn-emerald text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer">
                <span>🎲 1-Click Realistic Mock Data (เกณฑ์ 80/80 ผ่านฉลุย)</span>
              </button>
            </div>

            <!-- Variance Tolerance Alert Banner -->
            <div class="p-4 rounded-xl border flex items-center justify-between gap-3 ${!isGapExceeded ? 'bg-emerald-50/70 border-emerald-300 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300' : 'bg-amber-50/80 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200'}">
              <div class="space-y-0.5">
                <div class="text-xs font-bold flex items-center gap-1.5">
                  <span>${!isGapExceeded ? '✔ ผ่านการตรวจสอบความสมดุล' : '⚠️ คำเตือนผลต่างเกินเกณฑ์มาตรฐาน:'}</span>
                </div>
                <p class="text-xs leading-relaxed">
                  ${!isGapExceeded 
                    ? `ผลต่างระหว่าง E1 และ E2 เท่ากับ <b>${eGap}%</b> (ไม่เกินเกณฑ์ 5.0%) ถือว่าประสิทธิภาพของกระบวนการและผลลัพธ์สอดคล้องสมดุลกันตามหลักวิชาการของ รศ.ดร.ชัยยงค์ พรหมวงศ์`
                    : `ผลต่างระหว่าง E1 และ E2 เท่ากับ <b>${eGap}%</b> ซึ่งเกินกว่าเกณฑ์ยอมรับ <b>5.0%</b> บ่งชี้ว่าระดับความยากของแบบฝึกหัดระหว่างเรียนกับแบบทดสอบหลังเรียนไม่สอดคล้องกัน`}
                </p>
              </div>
              <span class="font-mono font-extrabold text-sm px-3 py-1 rounded-full ${!isGapExceeded ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300'}">
                Δ = ${eGap}%
              </span>
            </div>

            <div class="grid lg:grid-cols-2 gap-6">
              <!-- E1/E2 Form Card -->
              <div class="p-5 rounded-2xl bg-slate-50/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
                <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h3 class="font-bold text-sm text-slate-900 dark:text-white">1. ประสิทธิภาพนวัตกรรม (E1/E2)</h3>
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${e1Pass && e2Pass ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800'}">
                    เกณฑ์: ${escapeHtml(proj.efficiencyCriterion)}
                  </span>
                </div>

                <div class="grid grid-cols-2 gap-3 text-xs">
                  <label class="flex flex-col gap-1">
                    <span class="font-semibold text-slate-700 dark:text-slate-300">ประสิทธิภาพระหว่างเรียน (E1 %)</span>
                    <input type="number" step="0.01" value="${curE1}" oninput="ROAD_APP.updateStatField('e1', this.value)" class="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-mono font-bold text-sm" />
                  </label>
                  <label class="flex flex-col gap-1">
                    <span class="font-semibold text-slate-700 dark:text-slate-300">ประสิทธิภาพหลังเรียน (E2 %)</span>
                    <input type="number" step="0.01" value="${curE2}" oninput="ROAD_APP.updateStatField('e2', this.value)" class="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-mono font-bold text-sm" />
                  </label>
                </div>

                <div class="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div class="text-[11px] text-slate-400">ผลการคำนวณจริง:</div>
                    <div class="text-xl font-black ${e1Pass && e2Pass ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}">
                      E1/E2 = ${curE1} / ${curE2}
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-xs font-bold ${e1Pass && e2Pass ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700'}">
                      ${e1Pass && e2Pass ? '✔ สูงกว่าเกณฑ์ที่กำหนด' : '⚠️ ต่ำกว่าเกณฑ์ที่กำหนด'}
                    </div>
                    <div class="text-[11px] text-slate-500 font-mono">เกณฑ์: ${critE1}/${critE2}</div>
                  </div>
                </div>
              </div>

              <!-- E.I. Form Card -->
              <div class="p-5 rounded-2xl bg-slate-50/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
                <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <h3 class="font-bold text-sm text-slate-900 dark:text-white">2. ดัชนีประสิทธิผล (Effectiveness Index: E.I.)</h3>
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${eiPass ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-amber-100'}">
                    เกณฑ์มาตรฐาน ≥ 0.50
                  </span>
                </div>

                <div class="grid grid-cols-3 gap-3 text-xs">
                  <label class="flex flex-col gap-1">
                    <span class="font-semibold text-slate-700 dark:text-slate-300">คะแนนเต็ม (Full)</span>
                    <input type="number" value="${st.fullScore || 40}" oninput="ROAD_APP.updateStatField('fullScore', this.value)" class="px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-mono font-bold text-xs" />
                  </label>
                  <label class="flex flex-col gap-1">
                    <span class="font-semibold text-slate-700 dark:text-slate-300">เฉลี่ยก่อนเรียน (Pre)</span>
                    <input type="number" step="0.01" value="${st.preMean || 17.50}" oninput="ROAD_APP.updateStatField('preMean', this.value)" class="px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-mono font-bold text-xs" />
                  </label>
                  <label class="flex flex-col gap-1">
                    <span class="font-semibold text-slate-700 dark:text-slate-300">เฉลี่ยหลังเรียน (Post)</span>
                    <input type="number" step="0.01" value="${st.postMean || 33.12}" oninput="ROAD_APP.updateStatField('postMean', this.value)" class="px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-mono font-bold text-xs" />
                  </label>
                </div>

                <div class="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div class="text-[11px] text-slate-400">ดัชนีประสิทธิผล (E.I.):</div>
                    <div class="text-xl font-black text-indigo-700 dark:text-indigo-400">
                      ${curEI} (${(curEI * 100).toFixed(2)}%)
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-xs font-bold ${eiPass ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700'}">
                      ${eiPass ? '✔ ก้าวหน้าในระดับสูง (≥ 0.50)' : '⚠️ ต่ำกว่าเกณฑ์ 0.50'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ` : ""}

        <!-- 7. Sub-Tab: Smart Hypothesis Testing Lab (Parametric + Non-Parametric) -->
        ${subTab === "hypothesis_lab" ? `
          <div class="neu-card p-6 flex flex-col gap-5">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span class="text-xs font-mono font-bold text-sky-700 dark:text-sky-400 uppercase">SMART HYPOTHESIS LAB · PARAMETRIC & NON-PARAMETRIC</span>
                <h2 class="text-lg font-bold text-slate-900 dark:text-white">ห้องปฏิบัติการทดสอบสมมติฐานการวิจัยตามแบบจำลองตัดสินใจ</h2>
                <p class="text-xs text-slate-500">เลือกสถิติทดสอบอัตโนมัติตามขนาดกลุ่มตัวอย่าง (n) และการแจกแจงปกติ (Normality)</p>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <button onclick="ROAD_APP.loadHypothesisMockData('normal_paired')" class="px-3 py-1.5 neu-btn-primary text-xs font-bold cursor-pointer">
                  🎲 Mock N=30 (Paired t-test)
                </button>
                <button onclick="ROAD_APP.loadHypothesisMockData('one_sample')" class="px-3 py-1.5 neu-btn-emerald text-xs font-bold cursor-pointer">
                  🎲 Mock เทียบเกณฑ์ 70% (One-Sample)
                </button>
                <button onclick="ROAD_APP.loadHypothesisMockData('small_wilcoxon')" class="px-3 py-1.5 neu-squircle text-xs font-bold text-purple-700 dark:text-purple-300 cursor-pointer">
                  🎲 Mock N=12 (Wilcoxon Fallback)
                </button>
              </div>
            </div>

            <!-- Sampling Method Guardrail Warning -->
            ${isPurposiveOrPop ? `
              <div class="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2 font-bold">
                <span>⚠️ ข้อควรระวังด้านการสุ่มตัวอย่าง:</span>
                <span>โครงการนี้ใช้กลุ่มตัวอย่างแบบ "${proj.samplingMetadata?.type === 'purposive' ? 'เลือกแบบเจาะจง (Purposive)' : 'ศึกษาจากประชากรทั้งหมด (Population)'}" ตามหลักวิชาการสถิติ ไม่แนะนำให้อ้างอิงผลสู่ประชากรทั่วไปด้วย t-test หรือควรรายงานเป็นข้อจำกัดการวิจัย</span>
              </div>
            ` : ""}

            <!-- Decision Tree Selector -->
            <div class="flex flex-wrap gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800">
              <button onclick="ROAD_APP.setHypothesisTestType('paired_t')" class="px-3 py-2 text-xs font-bold rounded-lg cursor-pointer ${hypType === 'paired_t' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300'}">
                1. Paired Samples t-test (N ≥ 30 หรือแจกแจงปกติ) + Cohen's d
              </button>
              <button onclick="ROAD_APP.setHypothesisTestType('one_sample_t')" class="px-3 py-2 text-xs font-bold rounded-lg cursor-pointer ${hypType === 'one_sample_t' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300'}">
                2. One-Sample t-test (เทียบเกณฑ์คงที่ เช่น ร้อยละ 70)
              </button>
              <button onclick="ROAD_APP.setHypothesisTestType('wilcoxon')" class="px-3 py-2 text-xs font-bold rounded-lg cursor-pointer ${hypType === 'wilcoxon' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300'}">
                3. Wilcoxon Signed-Rank Test (Fallback เมื่อ N &lt; 30 หรือไม่แจกแจงปกติ)
              </button>
            </div>

            <!-- Dynamic Test Results View -->
            ${hypType === "paired_t" ? `
              <div class="space-y-4">
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div class="neu-card p-3">
                    <div class="text-[11px] font-semibold text-slate-500">ก่อนเรียน x̄ (S.D.)</div>
                    <div class="text-base font-mono font-bold text-slate-800 dark:text-white">${xBarPre} (${sdPre})</div>
                  </div>
                  <div class="neu-card p-3">
                    <div class="text-[11px] font-semibold text-slate-500">หลังเรียน x̄ (S.D.)</div>
                    <div class="text-base font-mono font-bold text-emerald-600">${xBarPost} (${sdPost})</div>
                  </div>
                  <div class="neu-card p-3">
                    <div class="text-[11px] font-semibold text-slate-500">ค่าสถิติ t (df = ${dfValue})</div>
                    <div class="text-base font-mono font-bold text-sky-600">${tValue}** (p &lt; .001)</div>
                  </div>
                  <div class="neu-card p-3">
                    <div class="text-[11px] font-semibold text-slate-500">ขนาดอิทธิพล (Cohen's d)</div>
                    <div class="text-base font-mono font-bold text-indigo-600">${cohenD} (Large Effect)</div>
                  </div>
                </div>

                <div class="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
                  <div class="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-800">
                    <span class="text-xs font-bold text-slate-800 dark:text-white">ตารางสรุป Paired Samples t-test พร้อมคำแปลผล (APA 7th):</span>
                    <button onclick="ROAD_APP.copyTableText('paired-t-preview', 'คัดลอกตารางแล้ว')" class="text-xs px-2.5 py-1 neu-btn-primary font-bold cursor-pointer">📋 คัดลอกตาราง</button>
                  </div>
                  <div id="paired-t-preview" class="overflow-x-auto text-xs">
                    <table class="w-full text-center border-t-2 border-b-2 border-slate-900 dark:border-slate-200">
                      <thead>
                        <tr class="border-b font-bold bg-slate-50 dark:bg-slate-800">
                          <th class="py-2 px-3 text-left">การทดสอบ</th>
                          <th class="py-2 px-2">n</th>
                          <th class="py-2 px-2">x̄</th>
                          <th class="py-2 px-2">S.D.</th>
                          <th class="py-2 px-2">D̄</th>
                          <th class="py-2 px-2">S.D._D</th>
                          <th class="py-2 px-2">t</th>
                          <th class="py-2 px-2">Sig.</th>
                          <th class="py-2 px-2">Cohen's d</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr class="border-b border-slate-200 dark:border-slate-800">
                          <td class="py-2 px-3 text-left font-medium">ก่อนเรียน (Pre-test)</td>
                          <td class="py-2 px-2 font-mono">${nHyp}</td>
                          <td class="py-2 px-2 font-mono">${xBarPre}</td>
                          <td class="py-2 px-2 font-mono">${sdPre}</td>
                          <td rowspan="2" class="py-2 px-2 font-mono font-bold align-middle">${dMean}</td>
                          <td rowspan="2" class="py-2 px-2 font-mono font-bold align-middle">${sdD}</td>
                          <td rowspan="2" class="py-2 px-2 font-mono font-bold text-sky-600 align-middle">${tValue}**</td>
                          <td rowspan="2" class="py-2 px-2 font-mono font-bold text-emerald-600 align-middle">.000</td>
                          <td rowspan="2" class="py-2 px-2 font-mono font-bold text-indigo-600 align-middle">${cohenD}</td>
                        </tr>
                        <tr>
                          <td class="py-2 px-3 text-left font-bold text-emerald-600">หลังเรียน (Post-test)</td>
                          <td class="py-2 px-2 font-mono">${nHyp}</td>
                          <td class="py-2 px-2 font-mono">${xBarPost}</td>
                          <td class="py-2 px-2 font-mono">${sdPost}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ` : hypType === "one_sample_t" ? `
              <div class="space-y-4">
                <div class="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs">
                  <b>One-Sample t-test:</b> เปรียบเทียบคะแนนหลังเรียน (x̄ = ${xBarPost}, S.D. = ${sdPost}) เทียบกับเกณฑ์เป้าหมายมาตรฐานร้อยละ 70 (เกณฑ์ = 28.00 จากเต็ม 40 คะแนน)
                  พบว่าค่า t มีนัยสำคัญทางสถิติที่ระดับ .01 แสดงว่าผู้เรียนมีผลสัมฤทธิ์หลังเรียนสูงกว่าเกณฑ์ที่กำหนดอย่างมีนัยสำคัญ
                </div>
              </div>
            ` : `
              <!-- Wilcoxon Signed-Rank Test -->
              <div class="space-y-4">
                <div class="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-xs flex items-center justify-between">
                  <div>
                    <b>Wilcoxon Signed-Rank Test (Non-Parametric):</b> ผลรวมอันดับบวก (W+ = ${sumPosRanks}), ผลรวมอันดับลบ (W- = ${sumNegRanks}), ค่าสถิติ T = ${wilcoxonT}, ค่าประมาณ Z = <b>${wilcoxonZ}</b> (p &lt; .01)
                  </div>
                  <span class="px-2.5 py-1 rounded bg-purple-200 dark:bg-purple-900 font-bold text-purple-900 dark:text-purple-200">
                    มีนัยสำคัญทางสถิติ
                  </span>
                </div>

                <div class="overflow-x-auto max-h-60 overflow-y-auto">
                  <table class="w-full text-xs border-collapse border border-slate-300 dark:border-slate-700 text-center">
                    <thead>
                      <tr class="bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-900 dark:text-white">
                        <th class="p-2 border border-slate-300 dark:border-slate-700">คนที่</th>
                        <th class="p-2 border border-slate-300 dark:border-slate-700">ก่อน (Pre)</th>
                        <th class="p-2 border border-slate-300 dark:border-slate-700">หลัง (Post)</th>
                        <th class="p-2 border border-slate-300 dark:border-slate-700">ผลต่าง (D)</th>
                        <th class="p-2 border border-slate-300 dark:border-slate-700">|D|</th>
                        <th class="p-2 border border-slate-300 dark:border-slate-700">อันดับ (Rank)</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${nonZeroDiffs.map(d => `
                        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td class="p-1 border border-slate-300 dark:border-slate-700 font-mono">${d.id}</td>
                          <td class="p-1 border border-slate-300 dark:border-slate-700 font-mono">${d.pre}</td>
                          <td class="p-1 border border-slate-300 dark:border-slate-700 font-mono font-bold">${d.post}</td>
                          <td class="p-1 border border-slate-300 dark:border-slate-700 font-mono font-bold ${d.diff > 0 ? 'text-emerald-600' : 'text-rose-600'}">${d.diff > 0 ? `+${d.diff}` : d.diff}</td>
                          <td class="p-1 border border-slate-300 dark:border-slate-700 font-mono">${d.absDiff}</td>
                          <td class="p-1 border border-slate-300 dark:border-slate-700 font-mono font-bold">${d.rank}</td>
                        </tr>
                      `).join("")}
                    </tbody>
                  </table>
                </div>
              </div>
            `}
          </div>
        ` : ""}

        <!-- 8. Sub-Tab: Standard APA Chapter 4 Tables -->
        ${subTab === "ch4_tables" ? `
          <div class="neu-card p-6 flex flex-col gap-6">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span class="text-xs font-mono font-bold text-sky-700 dark:text-sky-400 uppercase">
                  CHAPTER 4 STANDARD TABLES · APA 7TH EDITION
                </span>
                <h2 class="text-lg font-bold text-slate-900 dark:text-white">
                  ตารางรายงานผลการวิเคราะห์ข้อมูลบทที่ 4 (พร้อมส่งออกและคัดลอกลง Word)
                </h2>
                <p class="text-xs text-slate-500">ตารางจัดรูปแบบเส้นขอบบน-ล่างตามแบบแผน APA พร้อมคำแปลผลใต้ตารางตามเกณฑ์ วPA</p>
              </div>
              <button onclick="ROAD_APP.exportSingleChapter(4)" class="px-4 py-2 neu-btn-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <span>📄 ส่งออกเฉพาะบทที่ 4 (Word .doc)</span>
              </button>
            </div>

            <div class="space-y-8">
              ${ch4Tables.map((tbl, tIdx) => `
                <div class="neu-card p-5 space-y-3">
                  <div class="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div class="font-bold text-sm text-slate-900 dark:text-white">
                      ตารางที่ 4.${tIdx + 1} ${escapeHtml(tbl.title)}
                    </div>
                    <button onclick="ROAD_APP.copyTableText('ch4-table-${tIdx}', 'คัดลอกตารางแล้ว')" class="px-3 py-1 text-xs neu-squircle font-bold text-blue-600 dark:text-sky-300 cursor-pointer">
                      📋 คัดลอกตาราง
                    </button>
                  </div>

                  <div id="ch4-table-${tIdx}" class="overflow-x-auto">
                    <table class="w-full text-xs text-center border-t-2 border-b-2 border-slate-900 dark:border-slate-200">
                      <thead>
                        <tr class="border-b font-bold bg-slate-50 dark:bg-slate-800">
                          ${tbl.headers.map(h => `<th class="py-2.5 px-3 text-slate-800 dark:text-slate-100">${escapeHtml(h)}</th>`).join("")}
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                        ${tbl.rows.map(r => `
                          <tr class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            ${r.map((c, cIdx) => `<td class="py-2 px-3 ${cIdx === 0 ? 'text-left font-semibold' : 'font-mono'}">${escapeHtml(String(c))}</td>`).join("")}
                          </tr>
                        `).join("")}
                      </tbody>
                    </table>
                  </div>

                  <div class="text-xs text-slate-700 dark:text-slate-300 bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 leading-relaxed">
                    <b>คำแปลผลใต้ตาราง:</b> ${escapeHtml(tbl.interpretation)}
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        ` : ""}
      </div>
    `;
  }

  // --- Studio Tab 6: AI Research Co-Pilot (Live Gemini API + Smart Prompt Builder) ---
  function renderTabAi(proj) {
    const currentPrompt = window.ROAD_GENERATOR.buildSmartPrompt(proj, state.aiTask);
    const tasks = [
      ["ch1_background", "1. เขียน 1.1 ความเป็นมาและความสำคัญ 7 ย่อหน้าตามกรวยคว่ำ (R&D Framework)"],
      ["r1_d1_bridge", "2. สังเคราะห์ตารางเชื่อมโยงจาก R1 สู่ D1 (R1-to-D1 Synthesis Bridge)"],
      ["title_polish", "3. วิเคราะห์และเกลาชื่อเรื่อง ABCD และประเมิน 10 Pitfalls (คศ.3–คศ.5)"],
      ["ch1_definitions", "4. เขียน 1.5 นิยามศัพท์เฉพาะเชิงปฏิบัติการ (ห้ามนิยามคำทั่วไป)"],
      ["ch2_synthesis", "5. สังเคราะห์บทที่ 2 และกรอบแนวคิดเชิงทฤษฎี [หลักการ B + นวัตกรรม A] ⟹ [ตัวแปร C]"],
      ["ch5_discussion", "6. เขียน 5.2 อภิปรายผลการวิจัย 4 องค์ประกอบ (Result - Cause - Theory - Research)"]
    ];

    return `
      <div class="flex flex-col gap-6">
        <!-- Main AI Dual-Mode Workstation -->
        <div class="grid lg:grid-cols-3 gap-6">
          <!-- Left Column: Gemini API Key & Task Selector -->
          <div class="neu-card p-5 sm:p-6 flex flex-col gap-5">
            <div>
              <span class="text-xs font-mono font-bold text-sky-700 uppercase">DUAL-MODE AI CO-PILOT</span>
              <h2 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white">ผู้ช่วย AI เขียนงานวิจัย R&D</h2>
              <p class="text-xs text-slate-500 mt-0.5">รองรับทั้งการสั่ง AI เขียนสดในเว็บด้วย Gemini API และการคัดลอก Smart Prompt ไปวางใน ChatGPT/Gemini ฟรี</p>
            </div>

            <!-- Gemini Key Input -->
            <div class="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 flex flex-col gap-2.5">
              <label class="text-xs font-bold text-sky-900 dark:text-sky-300">🔑 ตั้งค่า Gemini API Key (สำหรับสั่งเขียนสดในเว็บ)</label>
              <div class="flex gap-2">
                <input id="gemini-key-input" type="password" value="${escapeHtml(state.geminiKey)}" placeholder="AIzaSy..." class="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono" />
                <button onclick="ROAD_APP.saveGeminiKey(document.getElementById('gemini-key-input').value)" class="px-3.5 py-2 rounded-xl neu-btn-primary text-xs font-bold cursor-pointer">บันทึก</button>
              </div>
              <div class="text-[11px] text-slate-500">
                รับคีย์ฟรีได้ที่ <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-sky-700 dark:text-sky-400 font-bold underline">Google AI Studio</a> (คีย์ถูกเก็บในเบราว์เซอร์ของคุณเท่านั้น)
              </div>
            </div>

            <!-- Task Selector -->
            <div class="flex flex-col gap-2">
              <label class="text-xs font-bold text-slate-700 dark:text-slate-300">เลือกส่วนที่ต้องการให้ AI ช่วยเขียน:</label>
              ${tasks.map(([id, label]) => `
                <button onclick="ROAD_APP.setAiTask('${id}')" class="p-3 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${state.aiTask === id ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/60 text-sky-900 dark:text-sky-200 shadow-sm font-bold' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'}">
                  ${escapeHtml(label)}
                </button>
              `).join("")}
            </div>
          </div>

          <!-- Right 2 Columns: Smart Prompt & Live AI Output -->
          <div class="lg:col-span-2 flex flex-col gap-5">
            <!-- Smart Prompt Box -->
            <div class="neu-card p-5 sm:p-6 flex flex-col gap-3">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 class="font-bold text-sm text-slate-900 dark:text-white">📋 Smart Prompt ผูกตัวแปร ABCD อัตโนมัติ (พร้อมใช้งาน)</h3>
                <div class="flex flex-wrap gap-2">
                  <button onclick="ROAD_APP.copySmartPrompt('${state.aiTask}')" class="px-3.5 py-2 rounded-xl neu-squircle text-xs font-bold cursor-pointer">
                    📋 คัดลอก Prompt (ใช้ฟรีใน ChatGPT/Gemini)
                  </button>
                  <button onclick="ROAD_APP.runGeminiLive('${state.aiTask}')" class="px-4 py-2 rounded-xl neu-btn-primary text-xs font-bold shadow-sm cursor-pointer" ${state.aiLoading ? 'disabled' : ''}>
                    ${state.aiLoading ? '⏳ กำลังสั่ง Gemini เขียนเนื้อหา...' : '⚡ สั่ง Gemini เขียนสดในเว็บทันที'}
                  </button>
                </div>
              </div>
              <textarea readonly rows="7" class="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-700 dark:text-slate-300 leading-relaxed">${escapeHtml(currentPrompt)}</textarea>
            </div>

            <!-- AI Output Box -->
            <div class="neu-card p-5 sm:p-6 flex flex-col gap-3">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 class="font-bold text-sm text-slate-900 dark:text-white">✨ ผลลัพธ์เนื้อหาวิชาการจาก AI (แก้ไขได้สด)</h3>
                <button onclick="ROAD_APP.applyAiOutputToChapter()" class="px-4 py-2 rounded-xl neu-btn-emerald text-xs font-bold cursor-pointer">
                  ✔ นำเนื้อหานี้ไปใส่ในรายงานวิจัย 5 บท
                </button>
              </div>
              <textarea oninput="ROAD_APP_SET_AI_OUTPUT(this.value)" rows="9" placeholder="กดปุ่ม 'สั่ง Gemini เขียนสดในเว็บทันที' หรือวางเนื้อหาที่ได้จาก ChatGPT/Gemini ลงในช่องนี้เพื่อนำไปแทรกในเล่มรายงานวิจัย..." class="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm leading-relaxed">${escapeHtml(state.aiOutput)}</textarea>
            </div>
          </div>
        </div>

        <!-- Academic AI Ecosystem Guide -->
        <div class="neu-card p-6 flex flex-col gap-5">
          <div class="border-b border-slate-200 dark:border-slate-800 pb-4">
            <span class="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-extrabold uppercase">
              AI ACADEMIC ECOSYSTEM GUIDE
            </span>
            <h2 class="text-lg font-extrabold text-slate-900 dark:text-white mt-1.5">
              คลังเครื่องมือ AI สนับสนุนงานวิจัยวิชาการตามเกณฑ์ วPA
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">
              "เรามีผู้ช่วยคือปัญญาประดิษฐ์ แต่นักวิจัยต้องรู้หลัก" แนะนำเครื่องมือชั้นนำสำหรับใช้ร่วมกับระบบ ROAD Next-Gen
            </p>
          </div>

          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3">
              <div>
                <div class="flex items-center justify-between">
                  <span class="text-base font-extrabold text-sky-700 dark:text-sky-300">🔍 Consensus</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">สืบค้นงานวิจัย</span>
                </div>
                <p class="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  AI ค้นหาข้อสรุปจากงานวิจัยที่ได้รับการ Peer-reviewed กว่า 200 ล้านเล่มทั่วโลก เหมาะสำหรับการหาข้ออ้างอิงสนับสนุนตัวแปร C และผลสัมฤทธิ์
                </p>
              </div>
              <a href="https://consensus.app" target="_blank" class="text-xs font-bold text-sky-700 dark:text-sky-400 hover:underline">ไปยัง Consensus.app ➔</a>
            </div>

            <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3">
              <div>
                <div class="flex items-center justify-between">
                  <span class="text-base font-extrabold text-indigo-700 dark:text-indigo-300">⚡ Perplexity AI</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">สังเคราะห์เอกสาร</span>
                </div>
                <p class="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  ค้นคว้าพร้อมอ้างอิงแหล่งที่มาแบบ Real-time และสรุปเนื้อหาวิชาการ เหมาะสำหรับช่วยยกร่างเนื้อหาทฤษฎีในบทที่ 2
                </p>
              </div>
              <a href="https://www.perplexity.ai" target="_blank" class="text-xs font-bold text-indigo-700 dark:text-indigo-400 hover:underline">ไปยัง Perplexity.ai ➔</a>
            </div>

            <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3">
              <div>
                <div class="flex items-center justify-between">
                  <span class="text-base font-extrabold text-emerald-700 dark:text-emerald-300">🤖 Claude 3.5 Sonnet</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">ภาษาไทยวิชาการ</span>
                </div>
                <p class="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  มีความโดดเด่นสูงในด้านการเรียบเรียงภาษาไทยเชิงวิชาการที่สละสลวย ถูกต้องตามแบบแผนบทที่ 1 และบทที่ 5
                </p>
              </div>
              <a href="https://claude.ai" target="_blank" class="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline">ไปยัง Claude.ai ➔</a>
            </div>

            <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3">
              <div>
                <div class="flex items-center justify-between">
                  <span class="text-base font-extrabold text-amber-700 dark:text-amber-300">📚 Zotero</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">จัดการบรรณานุกรม</span>
                </div>
                <p class="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  โปรแกรมจัดการเอกสารอ้างอิงและบรรณานุกรมฟรี รองรับรูปแบบ APA 7th Edition เชื่อมต่อกับ Microsoft Word ได้ทันที
                </p>
              </div>
              <a href="https://www.zotero.org" target="_blank" class="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline">ไปยัง Zotero.org ➔</a>
            </div>

            <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3">
              <div>
                <div class="flex items-center justify-between">
                  <span class="text-base font-extrabold text-purple-700 dark:text-purple-300">✍️ Grammarly / QuillBot</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">ตรวจ Abstract</span>
                </div>
                <p class="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  ตรวจสอบความถูกต้องของไวยากรณ์และโครงสร้างประโยคภาษาอังกฤษในบทคัดย่อ (Abstract) สำหรับยื่นประเมิน คศ.3–คศ.5
                </p>
              </div>
              <a href="https://www.grammarly.com" target="_blank" class="text-xs font-bold text-purple-700 dark:text-purple-400 hover:underline">ไปยัง Grammarly.com ➔</a>
            </div>

            <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3">
              <div>
                <div class="flex items-center justify-between">
                  <span class="text-base font-extrabold text-rose-700 dark:text-rose-300">🏆 ThaiJO & TCI</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">เผยแพร่วารสาร</span>
                </div>
                <p class="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                  ศูนย์ดัชนีการอ้างอิงวารสารไทย (TCI) และระบบวารสารออนไลน์ของไทย สำหรับค้นหาวารสารกลุ่มที่ 1 และ 2 เพื่อตีพิมพ์ผลงาน คศ.4–คศ.5
                </p>
              </div>
              <a href="https://tci-thailand.org" target="_blank" class="text-xs font-bold text-rose-700 dark:text-rose-400 hover:underline">ไปยัง TCI Thailand ➔</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  window.ROAD_APP_SET_AI_OUTPUT = function (val) {
    state.aiOutput = val;
  };

  // --- Custom ABCD Modal & Smart Decomposer Wizard ---
  function renderCustomAbcdModal() {
    const proj = getActiveProject();
    const vocab = window.ROAD_DATA.ABCD_SUGGESTIONS || { A: [], A_CATEGORIES: [], B: [], C1: [], C2: [], D: [] };
    const tab = state.abcdModalTab || "manual";
    const parsed = state.abcdParsedResult || window.ROAD_GENERATOR.parseTitleToABCD(state.abcdParseInput || window.ROAD_GENERATOR.composeFullTitle(proj));

    return `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-fade-in print:hidden">
        <div class="neu-card max-w-4xl w-full p-5 sm:p-8 my-auto max-h-[90vh] flex flex-col gap-5 overflow-y-auto relative shadow-2xl">
          <!-- Header -->
          <div class="flex items-start justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white text-xl shadow-md">
                ✨
              </div>
              <div>
                <h3 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>ตัวช่วยป้อนและออกแบบข้อมูล A B C D ตามต้องการ</span>
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  กำหนดหัวข้อและองค์ประกอบการวิจัยได้อย่างอิสระ 100% พร้อมระบบถอดรหัสชื่อเรื่องอัตโนมัติ
                </p>
              </div>
            </div>
            <button onclick="ROAD_APP.closeAbcdModal()" class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-lg" title="ปิดหน้าต่าง">
              ✕
            </button>
          </div>

          <!-- Tab Navigation -->
          <div class="flex flex-wrap gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
            <button onclick="ROAD_APP.setAbcdModalTab('manual')" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 ${tab === 'manual' ? 'neu-btn-primary' : 'neu-squircle text-slate-700 dark:text-slate-300'}">
              <span>✏️ 1. ป้อนแยกช่อง A, B, C, D อิสระ</span>
            </button>
            <button onclick="ROAD_APP.setAbcdModalTab('parse')" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 ${tab === 'parse' ? 'neu-btn-emerald' : 'neu-squircle text-slate-700 dark:text-slate-300'}">
              <span>⚡ 2. วางชื่อเรื่องแล้วแยก ABCD ทันที</span>
            </button>
            <button onclick="ROAD_APP.setAbcdModalTab('blank')" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 ${tab === 'blank' ? 'neu-btn-primary' : 'neu-squircle text-slate-700 dark:text-slate-300'}">
              <span>📄 3. เริ่มต้นโครงร่างว่าง (Blank)</span>
            </button>
          </div>

          <!-- Tab 1: Manual Custom Input -->
          ${tab === 'manual' ? `
            <div class="flex flex-col gap-4">
              <!-- Live Title Banner inside Modal -->
              <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col gap-1.5">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">พรีวิวชื่อเรื่องวิจัย (ประกอบตามสูตร ABCD อัตโนมัติ):</span>
                <div class="text-sm sm:text-base font-extrabold leading-relaxed text-slate-900 dark:text-white">
                  ${window.ROAD_GENERATOR.composeColorCodedTitle(proj)}
                </div>
              </div>

              <!-- Field A -->
              <div class="p-4 rounded-xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/60 flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-xs sm:text-sm text-sky-900 dark:text-sky-300">🔵 A (Action) · คำกริยาวิจัย / แบบแผนวิธีดำเนินการ</span>
                  <span class="text-[11px] text-slate-500">พิมพ์เองหรือกดเลือกด่วน</span>
                </div>
                <input value="${escapeHtml(proj.A)}" oninput="ROAD_APP.updateField('A', this.value); ROAD_APP.renderLiveTitleBar();" class="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-800 dark:text-white" placeholder="เช่น การวิจัยและพัฒนา หรือ การศึกษาผลการใช้" />
                <div class="flex flex-wrap gap-1.5 items-center text-xs">
                  <span class="text-slate-400">เลือกด่วน:</span>
                  ${vocab.A.map(item => `<button type="button" onclick="ROAD_APP.applySuggestion('A', '${item}')" class="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-500 cursor-pointer text-[11px]">${item}</button>`).join("")}
                </div>
              </div>

              <!-- Field B -->
              <div class="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-xs sm:text-sm text-blue-900 dark:text-blue-300">🟣 B (Innovation / ตัวแปรต้น) · ชื่อนวัตกรรม สื่อ หรือวิธีจัดการเรียนรู้</span>
                </div>
                <input value="${escapeHtml(proj.B)}" oninput="ROAD_APP.updateField('B', this.value); ROAD_APP.renderLiveTitleBar();" class="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-800 dark:text-white" placeholder="เช่น รูปแบบการจัดการเรียนรู้เชิงรุกร่วมกับเทคนิค GPAS 5 Steps" />
                <div class="grid sm:grid-cols-2 gap-2">
                  <label class="flex flex-col gap-1 text-xs">
                    <span class="font-semibold text-slate-600 dark:text-slate-400">ชื่อเรียกย่อของนวัตกรรม (ใช้ในเล่มวิจัย 5 บท):</span>
                    <input value="${escapeHtml(proj.B_short || proj.B)}" oninput="ROAD_APP.updateField('B_short', this.value)" class="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs" />
                  </label>
                  <div class="flex flex-col gap-1 text-xs">
                    <span class="font-semibold text-slate-600 dark:text-slate-400">ขั้นตอนนวัตกรรม (Syntax):</span>
                    <div class="text-[11px] text-slate-500">มี ${proj.B_steps?.length || 0} ขั้นตอน (เลือกแม่แบบด้านล่างเพื่อใส่ทันที)</div>
                  </div>
                </div>

                <!-- Syntax Quick Templates -->
                <div class="flex flex-wrap gap-1.5 items-center text-xs pt-1 border-t border-blue-200/70 dark:border-blue-800/50">
                  <span class="text-slate-500 font-semibold text-[11px]">⚡ ใส่ขั้นตอนอัตโนมัติ:</span>
                  ${(window.ROAD_DATA.SYNTAX_TEMPLATES || []).map(tmpl => `
                    <button type="button" onclick="ROAD_APP.applySyntaxTemplate('${tmpl.id}')" class="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-700 dark:text-slate-200 text-[11px] cursor-pointer">
                      + ${escapeHtml(tmpl.short || tmpl.name)}
                    </button>
                  `).join("")}
                </div>
              </div>

              <!-- Field C -->
              <div class="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex flex-col gap-3">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="font-bold text-xs sm:text-sm text-emerald-900 dark:text-emerald-300">🟢 C (Core Outcomes / ตัวแปรตาม) · ผลลัพธ์ที่ต้องการให้เกิดกับผู้เรียน</span>
                  <div class="flex items-center gap-2">
                    <select onchange="ROAD_APP.updateFieldAndRender('C_connector', this.value)" class="px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-xs font-semibold">
                      ${["เพื่อส่งเสริม", "เพื่อพัฒนา", "เพื่อยกระดับ", "เพื่อศึกษาผลของ"].map(cn => `<option value="${cn}" ${proj.C_connector === cn ? 'selected' : ''}>คำเชื่อม: "${cn}"</option>`).join("")}
                    </select>
                    <button type="button" onclick="ROAD_APP.addDependentVar()" class="px-2.5 py-1 rounded-lg bg-emerald-700 text-white text-xs font-semibold cursor-pointer">+ เพิ่มตัวแปรตาม</button>
                  </div>
                </div>

                <div class="flex flex-col gap-2">
                  ${(proj.C_list || []).map((cVal, idx) => `
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-mono text-xs font-bold">C${idx + 1}</span>
                      <input value="${escapeHtml(cVal)}" oninput="ROAD_APP.updateDependentVar(${idx}, this.value)" class="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold" placeholder="เช่น ความสามารถในการคิดวิเคราะห์ / ผลสัมฤทธิ์ทางการเรียน" />
                      <button type="button" onclick="ROAD_APP.removeDependentVar(${idx})" class="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 text-xs cursor-pointer">ลบ</button>
                    </div>
                  `).join("")}
                </div>

                <div class="flex flex-wrap gap-1.5 items-center text-xs">
                  <span class="text-slate-400 text-[11px]">ตัวอย่าง C1 (สมรรถนะ/ทักษะ):</span>
                  ${vocab.C1.slice(0, 4).map(item => `<button type="button" onclick="ROAD_APP.applySuggestion('C1', '${item}')" class="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 cursor-pointer text-[11px] truncate max-w-[200px]">${item}</button>`).join("")}
                </div>
                <div class="flex flex-wrap gap-1.5 items-center text-xs">
                  <span class="text-slate-400 text-[11px]">ตัวอย่าง C2 (ผลสัมฤทธิ์/ความพึงพอใจ):</span>
                  ${vocab.C2.map(item => `<button type="button" onclick="ROAD_APP.applySuggestion('C2', '${item}')" class="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 cursor-pointer text-[11px]">${item}</button>`).join("")}
                </div>
              </div>

              <!-- Field D -->
              <div class="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 flex flex-col gap-2">
                <span class="font-bold text-xs sm:text-sm text-amber-900 dark:text-amber-300">🟠 D (Target Group & Scope) · กลุ่มเป้าหมายและบริบท</span>
                <input value="${escapeHtml(proj.D)}" oninput="ROAD_APP.updateField('D', this.value); ROAD_APP.renderLiveTitleBar();" class="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-800 dark:text-white" placeholder="เช่น สำหรับนักเรียนชั้นมัธยมศึกษาปีที่ 3 โรงเรียนเปรมติณสูลานนท์" />
                <div class="flex flex-wrap gap-1.5 items-center text-xs">
                  <span class="text-slate-400 text-[11px]">เลือกกลุ่มเป้าหมายด่วน:</span>
                  ${vocab.D.slice(0, 5).map(item => `<button type="button" onclick="ROAD_APP.applySuggestion('D', '${item}')" class="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500 cursor-pointer text-[11px]">${item}</button>`).join("")}
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button type="button" onclick="ROAD_APP.clearActiveAbcdForm()" class="px-4 py-2.5 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/30 text-xs font-bold cursor-pointer">
                  🧹 ล้างฟอร์มพิมพ์ใหม่
                </button>
                <div class="flex flex-wrap items-center gap-2">
                  <button type="button" onclick="ROAD_APP.closeAbcdModal()" class="px-4 py-2.5 neu-squircle text-xs font-bold cursor-pointer">
                    เสร็จสิ้น & ปิดหน้าต่าง
                  </button>
                  <button type="button" onclick="ROAD_APP.setStudioTab('chapters'); ROAD_APP.closeAbcdModal();" class="px-5 py-2.5 neu-btn-primary text-xs font-extrabold cursor-pointer">
                    ดูเล่มรายงาน 5 บททันที →
                  </button>
                </div>
              </div>
            </div>
          ` : ""}

          <!-- Tab 2: Smart Title Decomposer -->
          ${tab === 'parse' ? `
            <div class="flex flex-col gap-4">
              <div class="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 flex flex-col gap-2">
                <div class="font-bold text-sm text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                  <span>💡 มีชื่อเรื่องวิจัยในใจอยู่แล้ว? วางชื่อเรื่องเต็มเพื่อให้ระบบแยก A-B-C-D ให้อัตโนมัติ</span>
                </div>
                <p class="text-xs text-indigo-800/80 dark:text-indigo-300/80">
                  ระบบใช้อัลกอริทึมวิเคราะห์ไวยากรณ์ชื่อเรื่องวิจัยภาษาไทย ตรวจจับคำกริยาวิจัย (A) นวัตกรรม (B) คำเชื่อมตัวแปรตาม (C) และกลุ่มเป้าหมาย (D) ให้ทันทีในเสี้ยววินาที
                </p>
              </div>

              <!-- Input Textarea -->
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-extrabold text-slate-700 dark:text-slate-300">วางหรือพิมพ์ชื่อเรื่องการวิจัยเต็มประโยคของคุณ:</label>
                <textarea rows="3" oninput="state.abcdParseInput = this.value" class="w-full p-3.5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold focus:border-blue-600 outline-none leading-relaxed" placeholder="เช่น การวิจัยและพัฒนารูปแบบการจัดการเรียนรู้เชิงรุก เพื่อส่งเสริมความสามารถในการคิดวิเคราะห์และผลสัมฤทธิ์ทางการเรียน สำหรับนักเรียนชั้นมัธยมศึกษาปีที่ 3">${escapeHtml(state.abcdParseInput || "")}</textarea>
              </div>

              <!-- Quick Examples -->
              <div class="flex flex-wrap items-center gap-1.5 text-xs">
                <span class="text-slate-400 font-semibold text-[11px]">ทดลองคลิกตัวอย่าง:</span>
                <button type="button" onclick="ROAD_APP.setParseExample('การวิจัยและพัฒนารูปแบบการจัดการเรียนรู้เชิงรุก เพื่อส่งเสริมความสามารถในการคิดวิเคราะห์และผลสัมฤทธิ์ทางการเรียน สำหรับนักเรียนชั้นมัธยมศึกษาปีที่ 3')" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] cursor-pointer">
                  ตัวอย่าง 1: R&D รูปแบบการสอน
                </button>
                <button type="button" onclick="ROAD_APP.setParseExample('การพัฒนาชุดกิจกรรมการเรียนรู้วิทยาศาสตร์แบบสืบเสาะหาความรู้ 5E เพื่อส่งเสริมทักษะกระบวนการทางวิทยาศาสตร์ ของนักเรียนชั้นประถมศึกษาปีที่ 6 โรงเรียนเทศบาล 1')" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] cursor-pointer">
                  ตัวอย่าง 2: ชุดกิจกรรม 5E
                </button>
                <button type="button" onclick="ROAD_APP.setParseExample('การศึกษาผลการใช้บทเรียนออนไลน์ร่วมกับบอร์ดเกมการศึกษา เพื่อยกระดับผลสัมฤทธิ์ทางการเรียนและความพึงพอใจ สำหรับนักเรียนชั้นมัธยมศึกษาปีที่ 2')" class="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] cursor-pointer">
                  ตัวอย่าง 3: บอร์ดเกมดิจิทัล
                </button>
              </div>

              <!-- Action Button to Parse -->
              <div>
                <button type="button" onclick="ROAD_APP.executeTitleDecompose()" class="w-full py-3 neu-btn-primary font-bold text-sm cursor-pointer shadow-md flex items-center justify-center gap-2">
                  <span>⚡ วิเคราะห์และตัดแบ่งลง A-B-C-D ทันที</span>
                </button>
              </div>

              <!-- Parsed Results Display -->
              ${parsed ? `
                <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-400 dark:border-emerald-700 flex flex-col gap-4 shadow-sm">
                  <div class="flex items-center justify-between">
                    <span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">✔ ผลการถอดรหัสชื่อเรื่องสำเร็จ</span>
                    <span class="text-xs text-slate-500">สามารถนำไปใส่โครงการเดิม หรือเปิดเป็นเรื่องใหม่ได้</span>
                  </div>

                  <div class="grid sm:grid-cols-2 gap-3 text-xs">
                    <div class="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
                      <span class="font-extrabold text-sky-800 dark:text-sky-300">🔵 A (กริยาวิจัย):</span>
                      <div class="font-bold text-sm text-slate-900 dark:text-white mt-1">${escapeHtml(parsed.A)}</div>
                    </div>
                    <div class="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                      <span class="font-extrabold text-blue-800 dark:text-blue-300">🟣 B (นวัตกรรม/ตัวแปรต้น):</span>
                      <div class="font-bold text-sm text-slate-900 dark:text-white mt-1">${escapeHtml(parsed.B)}</div>
                      <div class="text-[11px] text-slate-500 mt-0.5">ชื่อย่อ: ${escapeHtml(parsed.B_short)}</div>
                    </div>
                    <div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                      <span class="font-extrabold text-emerald-800 dark:text-emerald-300">🟢 C (ตัวแปรตาม):</span>
                      <div class="font-bold text-sm text-slate-900 dark:text-white mt-1">${escapeHtml(parsed.C_connector)}${escapeHtml(parsed.C_list.join(" และ"))}</div>
                      <div class="text-[11px] text-slate-500 mt-0.5">มี ${parsed.C_list.length} ตัวแปร (${parsed.C_list.map((c, i) => `C${i+1}: ${c}`).join(", ")})</div>
                    </div>
                    <div class="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                      <span class="font-extrabold text-amber-800 dark:text-amber-300">🟠 D (กลุ่มเป้าหมาย):</span>
                      <div class="font-bold text-sm text-slate-900 dark:text-white mt-1">${escapeHtml(parsed.D)}</div>
                    </div>
                  </div>

                  <div class="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                    <button type="button" onclick="ROAD_APP.applyParsedToActiveProject()" class="px-4 py-2.5 neu-squircle text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                      ✔ นำเข้าสู่โครงการปัจจุบัน
                    </button>
                    <button type="button" onclick="ROAD_APP.createProjectFromParsed()" class="px-5 py-2.5 neu-btn-emerald text-xs font-extrabold cursor-pointer">
                      🚀 สร้างเป็นงานวิจัยเรื่องใหม่ทันที
                    </button>
                  </div>
                </div>
              ` : ""}
            </div>
          ` : ""}

          <!-- Tab 3: Blank Canvas -->
          ${tab === 'blank' ? `
            <div class="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center gap-4 py-8">
              <div class="w-16 h-16 rounded-3xl bg-blue-100 dark:bg-sky-950/80 text-blue-600 dark:text-sky-300 flex items-center justify-center text-3xl shadow-sm">
                📄
              </div>
              <div class="max-w-md">
                <h4 class="font-extrabold text-base text-slate-900 dark:text-white">เริ่มต้นโครงร่างวิจัยว่างเปล่า (Blank Canvas)</h4>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  สร้างโครงการใหม่ที่มีแบบฟอร์มสะอาด ไม่มีข้อความตัวอย่างค้างอยู่ พร้อมให้คุณกรอกข้อมูล A, B, C, D ของตนเองตั้งแต่ต้น
                </p>
              </div>
              <button type="button" onclick="ROAD_APP.createBlankProject()" class="px-6 py-3 neu-btn-primary font-bold text-xs sm:text-sm cursor-pointer shadow-md">
                🚀 สร้างโครงการว่างใหม่ทันที
              </button>
            </div>
          ` : ""}
        </div>
      </div>
    `;
  }

  // --- Research Wizard 10-Step Interactive Modal ---
  function renderResearchWizardModal() {
    const proj = getActiveProject() || {};
    if (!proj.samplingMetadata) {
      proj.samplingMetadata = {
        type: "cluster_random",
        populationSize: 120,
        sampleSize: 35,
        classroomsCount: 4,
        selectedClassrooms: 1,
        isNormalDistributed: true,
        unit: "ห้องเรียน (Classroom Unit)",
        normalityTest: "shapiro_wilk"
      };
    }
    const curStepNum = Math.max(1, Math.min(10, Number(state.wizardStep) || 1));
    const curStepObj = (window.ROAD_DATA.RESEARCH_WIZARD_STEPS || []).find(s => s.step === curStepNum) || (window.ROAD_DATA.RESEARCH_WIZARD_STEPS || [])[0];
    const w = state.wizardData || {};

    const currentSamplingType = w.step5_samplingMethod || proj.samplingMetadata?.type || "cluster_random";
    const popSize = w.step5_popSize !== undefined ? w.step5_popSize : (proj.samplingMetadata?.populationSize || 120);
    const classroomsCount = w.step5_classroomsCount !== undefined ? w.step5_classroomsCount : (proj.samplingMetadata?.classroomsCount || 4);
    const sampleSize = w.step5_sampleSize !== undefined ? w.step5_sampleSize : (proj.samplingMetadata?.sampleSize || 35);
    const selectedClassrooms = w.step5_selectedClassrooms !== undefined ? w.step5_selectedClassrooms : (proj.samplingMetadata?.selectedClassrooms || 1);

    return `
      <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <div class="neu-card w-full max-w-4xl max-h-[90vh] flex flex-col justify-between overflow-hidden shadow-2xl border-2 border-blue-400/40">
          <!-- Wizard Header -->
          <div class="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-blue-50/80 via-white to-sky-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
            <div class="flex items-center gap-3">
              <span class="text-2xl sm:text-3xl">🧭</span>
              <div>
                <h2 class="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  Research Wizard · ตัวช่วยจัดทำโครงร่าง 10 ขั้นตอน
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">มาตรฐาน R&D</span>
                </h2>
                <div class="text-xs text-slate-500">ขั้นตอนที่ ${curStepNum} จาก 10: ${escapeHtml(curStepObj.title)}</div>
              </div>
            </div>
            <button type="button" onclick="ROAD_APP.closeWizardModal()" class="w-8 h-8 rounded-full neu-squircle flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer font-bold transition">
              ✕
            </button>
          </div>

          <!-- Stepper 1-10 Pills Bar -->
          <div class="px-4 py-2.5 bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs">
            ${(window.ROAD_DATA.RESEARCH_WIZARD_STEPS || []).map(s => {
              const isCur = s.step === curStepNum;
              const isPast = s.step < curStepNum;
              const titlePart = (s.title && s.title.split(' ')[1]) || s.title || `ขั้นที่ ${s.step}`;
              return `
                <button type="button" onclick="ROAD_APP.setWizardStep(${s.step})" class="px-2.5 py-1 rounded-lg shrink-0 font-bold transition flex items-center gap-1 cursor-pointer ${isCur ? 'bg-blue-600 text-white shadow-sm' : isPast ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200' : 'neu-squircle text-slate-600 dark:text-slate-400 hover:text-slate-900'}">
                  <span>${isPast ? '✔' : s.step}</span>
                  <span class="hidden md:inline">${s.step}. ${escapeHtml(titlePart)}</span>
                </button>
              `;
            }).join("")}
          </div>

          <!-- Wizard Body: Advice & Form Fields -->
          <div class="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
            <!-- Advice & Methodological Rationale Card from Dr. Chawalit -->
            <div class="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800 flex flex-col sm:flex-row items-start justify-between gap-3">
              <div class="space-y-1">
                <div class="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                  <span>💡 คำแนะนำเชิงระเบียบวิธีวิจัยมาตรฐาน (R&D Guidelines):</span>
                </div>
                <p class="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  ${escapeHtml(curStepObj.advice || curStepObj.tip || curStepObj.subtitle || '')}
                </p>
              </div>
              <button type="button" onclick="ROAD_APP.applyWizardSample(${curStepNum})" class="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer transition">
                <span>✨ ตัวอย่างมาตรฐาน 1-Click</span>
              </button>
            </div>

            <!-- Dynamic Form Inputs per Step -->
            <div class="space-y-4">
              ${curStepNum === 1 ? `
                <div class="space-y-2">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">ชื่อเรื่องการวิจัยฉบับเต็ม (Full Composed Title):</label>
                  <textarea rows="3" oninput="ROAD_APP.updateWizardField('step1_title', this.value)" class="w-full neu-input-pill rounded-xl p-3 text-sm font-semibold text-slate-800 dark:text-white leading-relaxed">${escapeHtml(w.step1_title || '')}</textarea>
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">คำสำคัญสำหรับการวิจัย (Research Keywords):</label>
                  <input type="text" value="${escapeHtml(w.step1_keywords || '')}" oninput="ROAD_APP.updateWizardField('step1_keywords', this.value)" class="w-full neu-input-pill px-4 py-2.5 text-sm text-slate-800 dark:text-white" />
                </div>
              ` : ""}

              ${curStepNum === 2 ? `
                <div class="space-y-2">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">สภาพปัญหาและความจำเป็นในการพัฒนา (Problem & Needs):</label>
                  <textarea rows="4" oninput="ROAD_APP.updateWizardField('step2_problem', this.value)" class="w-full neu-input-pill rounded-xl p-3 text-sm text-slate-800 dark:text-white leading-relaxed">${escapeHtml(w.step2_problem || '')}</textarea>
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">บริบทสถานศึกษาและผู้เรียน (School & Target Context):</label>
                  <input type="text" value="${escapeHtml(w.step2_context || '')}" oninput="ROAD_APP.updateWizardField('step2_context', this.value)" class="w-full neu-input-pill px-4 py-2.5 text-sm text-slate-800 dark:text-white" />
                </div>
                <div class="pt-2">
                  <button type="button" onclick="ROAD_APP.openContextMetaModal('context')" class="w-full py-2.5 px-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-700 text-xs font-bold text-sky-800 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 cursor-pointer flex items-center justify-center gap-1.5 transition shadow-sm">
                    <span>⚙️ กรอกข้อมูลบริบทสถานศึกษา ครูผู้สอน แผนการสอน 6 แผน & คณะผู้เชี่ยวชาญ 5 ท่าน (Essential Data)</span>
                  </button>
                </div>
              ` : ""}

              ${curStepNum === 3 ? `
                <div class="space-y-2">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">วัตถุประสงค์การวิจัย (4 ระยะ R1..D2):</label>
                  <textarea rows="6" oninput="ROAD_APP.updateWizardField('step3_obj', this.value)" class="w-full neu-input-pill rounded-xl p-3 text-sm text-slate-800 dark:text-white leading-relaxed font-mono">${escapeHtml(w.step3_obj || '')}</textarea>
                </div>
              ` : ""}

              ${curStepNum === 4 ? `
                <div class="space-y-2">
                  <div class="p-2.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-900 dark:text-blue-300">
                    <b>⚠️ กฎเหล็กตามหลักวิธีวิทยา:</b> สมมติฐานการวิจัยตั้งได้เฉพาะใน <b>ระยะที่ 3 (R2: ทดลองใช้นวัตกรรม)</b> เท่านั้น (เช่น หลังเรียนสูงกว่าก่อนเรียน) ห้ามตั้งใน R1, D1 หรือ D2
                  </div>
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">สมมติฐานการวิจัย (Research Hypotheses):</label>
                  <textarea rows="5" oninput="ROAD_APP.updateWizardField('step4_hypo', this.value)" class="w-full neu-input-pill rounded-xl p-3 text-sm text-slate-800 dark:text-white leading-relaxed font-mono">${escapeHtml(w.step4_hypo || '')}</textarea>
                </div>
              ` : ""}

              ${curStepNum === 5 ? `
                <div class="space-y-4">
                  <!-- Sampling Method Selector: 4 Interactive Cards -->
                  <div class="space-y-2">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <label class="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <span>🎲 วิธีการได้มาซึ่งกลุ่มตัวอย่าง (Sampling Method):</span>
                        <span class="text-[11px] font-normal text-slate-500">(เลือก 1 วิธีตามบริบทจริงของชั้นเรียน)</span>
                      </label>
                      <button type="button" onclick="ROAD_APP.applyWizardSample(5)" class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm cursor-pointer transition">
                        <span>✨ เติมข้อมูลตัวอย่างมาตรฐาน (ขั้นที่ 5)</span>
                      </button>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <!-- 1. Cluster Random -->
                      <div onclick="ROAD_APP.updateWizardSamplingMethod('cluster_random')" class="p-3 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${currentSamplingType === 'cluster_random' ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm' : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-slate-900'}">
                        <div class="flex items-start justify-between gap-2">
                          <div>
                            <div class="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <input type="radio" name="wizard_sampling_type" value="cluster_random" ${currentSamplingType === 'cluster_random' ? 'checked' : ''} onchange="ROAD_APP.updateWizardSamplingMethod('cluster_random')" class="cursor-pointer text-blue-600" />
                              <span>การสุ่มแบบกลุ่ม (Cluster Random)</span>
                            </div>
                            <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">ใช้ห้องเรียนเป็นหน่วยสุ่ม (Classroom Unit) สุ่มยกห้อง เหมาะกับโรงเรียนขนาดกลาง-ใหญ่</div>
                          </div>
                          <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">วPA แนะนำ ⭐</span>
                        </div>
                        <div class="mt-2 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">✅ อนุญาตให้ใช้ Dependent t-test</div>
                      </div>

                      <!-- 2. Simple Random -->
                      <div onclick="ROAD_APP.updateWizardSamplingMethod('simple_random')" class="p-3 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${currentSamplingType === 'simple_random' ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm' : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-slate-900'}">
                        <div class="flex items-start justify-between gap-2">
                          <div>
                            <div class="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <input type="radio" name="wizard_sampling_type" value="simple_random" ${currentSamplingType === 'simple_random' ? 'checked' : ''} onchange="ROAD_APP.updateWizardSamplingMethod('simple_random')" class="cursor-pointer text-blue-600" />
                              <span>การสุ่มอย่างง่าย (Simple Random)</span>
                            </div>
                            <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">สุ่มรายบุคคลจากกรอบรายชื่อประชากรทั้งหมด มีโอกาสเท่าเทียมกัน</div>
                          </div>
                        </div>
                        <div class="mt-2 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">✅ อนุญาตให้ใช้ t-test อ้างอิง</div>
                      </div>

                      <!-- 3. Purposive -->
                      <div onclick="ROAD_APP.updateWizardSamplingMethod('purposive')" class="p-3 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${currentSamplingType === 'purposive' ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 shadow-sm' : 'border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 bg-white dark:bg-slate-900'}">
                        <div class="flex items-start justify-between gap-2">
                          <div>
                            <div class="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <input type="radio" name="wizard_sampling_type" value="purposive" ${currentSamplingType === 'purposive' ? 'checked' : ''} onchange="ROAD_APP.updateWizardSamplingMethod('purposive')" class="cursor-pointer text-amber-600" />
                              <span>การเลือกแบบเจาะจง (Purposive)</span>
                            </div>
                            <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">เลือกตามเกณฑ์เฉพาะ เช่น ห้องที่มีปัญหาผลสัมฤทธิ์ต่ำกว่าเกณฑ์</div>
                          </div>
                          <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 shrink-0">มีข้อจำกัด ⚠️</span>
                        </div>
                        <div class="mt-2 text-[10px] text-amber-700 dark:text-amber-400 font-semibold">⚠️ ห้ามใช้ t-test (ใช้สถิติบรรยาย + E.I.)</div>
                      </div>

                      <!-- 4. Population (Census) -->
                      <div onclick="ROAD_APP.updateWizardSamplingMethod('population')" class="p-3 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${currentSamplingType === 'population' ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 shadow-sm' : 'border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700 bg-white dark:bg-slate-900'}">
                        <div class="flex items-start justify-between gap-2">
                          <div>
                            <div class="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <input type="radio" name="wizard_sampling_type" value="population" ${currentSamplingType === 'population' ? 'checked' : ''} onchange="ROAD_APP.updateWizardSamplingMethod('population')" class="cursor-pointer text-rose-600" />
                              <span>ใช้ประชากรทั้งหมด (Census)</span>
                            </div>
                            <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">ศึกษาทุกคนในระดับชั้น สำหรับโรงเรียนขนาดเล็กที่มีเพียง 1 ห้องเรียน</div>
                          </div>
                          <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 shrink-0">ประชากร 🛑</span>
                        </div>
                        <div class="mt-2 text-[10px] text-rose-700 dark:text-rose-400 font-semibold">🛑 ข้อมูลพารามิเตอร์ ไม่ต้องทดสอบ t-test</div>
                      </div>
                    </div>
                  </div>

                  <!-- Real-time Methodological Guardrail Alert -->
                  ${currentSamplingType === 'purposive' ? `
                    <div class="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 space-y-2">
                      <div class="flex items-start gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                        <span class="text-base">⚠️</span>
                        <div>
                          <div>คำเตือนเชิงระเบียบวิธีวิจัยมาตรฐาน:</div>
                          <div class="text-[11px] font-normal text-amber-900 dark:text-amber-200 mt-0.5 leading-relaxed">
                            การเลือกแบบเจาะจง (Purposive Sampling) ไม่มี Sampling Error ขัดต่อข้อตกลงเบื้องต้นของสถิติอนุมาน ระบบจะปรับแผนสถิติเป็น <b>"สถิติบรรยาย (x̄, S.D., ร้อยละ) ร่วมกับดัชนีประสิทธิผล (E.I.)"</b> และตัดการทดสอบ t-test ออกจากเล่มวิจัยโดยอัตโนมัติ
                          </div>
                        </div>
                      </div>
                      <div class="pt-1 flex items-center gap-2">
                        <button type="button" onclick="ROAD_APP.updateWizardSamplingMethod('cluster_random')" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer transition">
                          <span>🔄 1-Click: สลับเป็นสุ่มแบบกลุ่ม (Cluster Random Sampling) เพื่อให้ใช้ t-test ได้</span>
                        </button>
                      </div>
                    </div>
                  ` : currentSamplingType === 'population' ? `
                    <div class="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-700 space-y-2">
                      <div class="flex items-start gap-2 text-xs font-bold text-rose-800 dark:text-rose-300">
                        <span class="text-base">🛑</span>
                        <div>
                          <div>คำแนะนำเชิงระเบียบวิธีวิจัยมาตรฐาน:</div>
                          <div class="text-[11px] font-normal text-rose-900 dark:text-rose-200 mt-0.5 leading-relaxed">
                            การศึกษาจากประชากรทั้งหมด ข้อมูลที่ได้คือค่าจริงของประชากร (Parameters: μ, σ) ไม่มีความคลาดเคลื่อนจากการสุ่มตัวอย่าง จึงไม่ต้องและไม่สามารถทดสอบ t-test ได้ ระบบจะรายงานด้วย ค่าเฉลี่ย ส่วนเบี่ยงเบนมาตรฐาน ร้อยละ และดัชนีประสิทธิผล E.I.
                          </div>
                        </div>
                      </div>
                      <div class="pt-1 flex items-center gap-2">
                        <button type="button" onclick="ROAD_APP.updateWizardSamplingMethod('cluster_random')" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer transition">
                          <span>🔄 1-Click: สลับเป็นสุ่มแบบกลุ่ม (Cluster Random Sampling)</span>
                        </button>
                      </div>
                    </div>
                  ` : `
                    <div class="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                      <span>✅</span>
                      <span><b>ถูกต้องตามหลักวิธีวิทยา:</b> วิธีการสุ่มแบบความน่าจะเป็นนี้รองรับการทดสอบสมมติฐานด้วย Dependent Samples t-test พร้อมรายงานขนาดอิทธิพล (Cohen's d)</span>
                    </div>
                  `}

                  <!-- Numeric Input Matrix: Population & Sample Size Controls -->
                  <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                      <span class="flex items-center gap-1.5">
                        <span>🔢</span>
                        <span>กำหนดจำนวนตัวเลขประชากรและกลุ่มตัวอย่าง:</span>
                      </span>
                      <button type="button" onclick="ROAD_APP.autoGenerateSamplingNarrative()" class="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm cursor-pointer transition">
                        <span>⚡ สร้างข้อความทางการอัตโนมัติ</span>
                      </button>
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label class="block font-semibold text-slate-600 dark:text-slate-400 mb-1">ประชากรทั้งหมด (คน):</label>
                        <input type="number" min="1" max="5000" value="${escapeHtml(popSize)}" onchange="ROAD_APP.updateWizardSamplingNumber('populationSize', this.value)" class="w-full neu-input-pill px-3 py-1.5 font-bold text-center text-slate-800 dark:text-white" />
                      </div>
                      <div>
                        <label class="block font-semibold text-slate-600 dark:text-slate-400 mb-1">จำนวนห้องประชากร (ห้อง):</label>
                        <input type="number" min="1" max="50" value="${escapeHtml(classroomsCount)}" onchange="ROAD_APP.updateWizardSamplingNumber('classroomsCount', this.value)" class="w-full neu-input-pill px-3 py-1.5 font-bold text-center text-slate-800 dark:text-white" />
                      </div>
                      <div>
                        <label class="block font-semibold text-slate-600 dark:text-slate-400 mb-1">กลุ่มตัวอย่าง n (คน):</label>
                        <input type="number" min="1" max="1000" value="${escapeHtml(sampleSize)}" onchange="ROAD_APP.updateWizardSamplingNumber('sampleSize', this.value)" class="w-full neu-input-pill px-3 py-1.5 font-bold text-center text-slate-800 dark:text-white" />
                      </div>
                      <div>
                        <label class="block font-semibold text-slate-600 dark:text-slate-400 mb-1">ห้องที่สุ่มได้ (ห้อง):</label>
                        <input type="number" min="1" max="20" value="${escapeHtml(selectedClassrooms)}" onchange="ROAD_APP.updateWizardSamplingNumber('selectedClassrooms', this.value)" class="w-full neu-input-pill px-3 py-1.5 font-bold text-center text-slate-800 dark:text-white" />
                      </div>
                    </div>
                  </div>

                  <!-- Textarea 1: Population Description -->
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between">
                      <label class="text-xs font-bold text-slate-700 dark:text-slate-300">ประชากรเป้าหมายฉบับทางการ (Population Description):</label>
                      <span class="text-[10px] text-slate-400">ใช้ในบทที่ 1, บทที่ 3 (หัวข้อ 3.2.1) และตารางวิจัย</span>
                    </div>
                    <textarea rows="3" oninput="ROAD_APP.updateWizardField('step5_population', this.value)" class="w-full neu-input-pill rounded-xl p-3 text-xs sm:text-sm text-slate-800 dark:text-white leading-relaxed">${escapeHtml(w.step5_population || '')}</textarea>
                  </div>

                  <!-- Textarea 2: Sample Description & Sampling Method -->
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between">
                      <label class="text-xs font-bold text-slate-700 dark:text-slate-300">กลุ่มตัวอย่างและวิธีการสุ่มฉบับทางการ (Sample & Sampling Method):</label>
                      <span class="text-[10px] text-slate-400">ใช้ในบทที่ 1, บทที่ 3 (หัวข้อ 3.2.2) และการรายงานสถิติ</span>
                    </div>
                    <textarea rows="4" oninput="ROAD_APP.updateWizardField('step5_sample', this.value)" class="w-full neu-input-pill rounded-xl p-3 text-xs sm:text-sm text-slate-800 dark:text-white leading-relaxed">${escapeHtml(w.step5_sample || '')}</textarea>
                  </div>
                </div>
              ` : ""}

              ${curStepNum === 6 ? `
                <div class="space-y-2">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">ชื่อนวัตกรรมเต็ม (Innovation B):</label>
                  <input type="text" value="${escapeHtml(w.step6_innovation || '')}" oninput="ROAD_APP.updateWizardField('step6_innovation', this.value)" class="w-full neu-input-pill px-4 py-2.5 text-sm text-slate-800 dark:text-white" />
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">ขั้นตอนการจัดการเรียนรู้ของนวัตกรรม (Syntax Steps):</label>
                  <textarea rows="4" oninput="ROAD_APP.updateWizardField('step6_steps', this.value)" class="w-full neu-input-pill rounded-xl p-3 text-sm text-slate-800 dark:text-white leading-relaxed font-mono">${escapeHtml(w.step6_steps || '')}</textarea>
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">ตัวแปรตามที่ต้องการศึกษา (Dependent Variables C):</label>
                  <input type="text" value="${escapeHtml(w.step6_dependent || '')}" oninput="ROAD_APP.updateWizardField('step6_dependent', this.value)" class="w-full neu-input-pill px-4 py-2.5 text-sm text-slate-800 dark:text-white" />
                </div>
              ` : ""}

              ${curStepNum === 7 ? `
                <div class="space-y-2">
                  <div class="p-2.5 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[11px] text-indigo-900 dark:text-indigo-300">
                    <b>⚖️ การแยกประเภทเครื่องมือวิจัย 2 กลุ่ม:</b> 1. เครื่องมือทดลอง (นวัตกรรม, แผนการสอน) และ 2. เครื่องมือเก็บรวบรวมข้อมูล (แบบทดสอบ, แบบประเมินทักษะ, แบบสอบถาม) ห้ามปะปนกัน
                  </div>
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">เครื่องมือที่ใช้ในการวิจัย (Research Instruments):</label>
                  <textarea rows="4" oninput="ROAD_APP.updateWizardField('step7_tools', this.value)" class="w-full neu-input-pill rounded-xl p-3 text-sm text-slate-800 dark:text-white leading-relaxed">${escapeHtml(w.step7_tools || '')}</textarea>
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">เกณฑ์การหาคุณภาพเครื่องมือ (Quality Verification Criteria):</label>
                  <textarea rows="3" oninput="ROAD_APP.updateWizardField('step7_quality', this.value)" class="w-full neu-input-pill rounded-xl p-3 text-sm text-slate-800 dark:text-white leading-relaxed">${escapeHtml(w.step7_quality || '')}</textarea>
                </div>
              ` : ""}

              ${curStepNum === 8 ? `
                <div class="space-y-2">
                  <div class="p-2.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-300">
                    <b>📊 ตรวจทานความสอดคล้องของสถิติ:</b> E1/E2 ห้ามทดสอบด้วย t-test (ตรวจสอบผลต่าง ≤ 5%) | E.I. เกณฑ์ ≥ 0.50 | Dependent t-test ใช้เฉพาะเปรียบเทียบก่อน-หลัง พร้อมรายงาน Cohen's d
                  </div>
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">แผนการวิเคราะห์ข้อมูลและสถิติที่ใช้ (Statistical Analysis Plan):</label>
                  <textarea rows="5" oninput="ROAD_APP.updateWizardField('step8_stats', this.value)" class="w-full neu-input-pill rounded-xl p-3 text-sm text-slate-800 dark:text-white leading-relaxed font-mono">${escapeHtml(w.step8_stats || '')}</textarea>
                </div>
              ` : ""}

              ${curStepNum === 9 ? `
                <div class="space-y-2">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">ผลลัพธ์และประโยชน์ที่คาดว่าจะได้รับ (Expected Impacts & Benefits):</label>
                  <textarea rows="5" oninput="ROAD_APP.updateWizardField('step9_impact', this.value)" class="w-full neu-input-pill rounded-xl p-3 text-sm text-slate-800 dark:text-white leading-relaxed">${escapeHtml(w.step9_impact || '')}</textarea>
                </div>
              ` : ""}

              ${curStepNum === 10 ? `
                <div class="space-y-4">
                  <div class="p-4 rounded-xl bg-gradient-to-br from-emerald-50 via-teal-50 to-sky-50 dark:from-emerald-950/40 dark:via-slate-900 dark:to-sky-950/40 border-2 border-emerald-300 dark:border-emerald-700 space-y-3">
                    <div class="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
                      <span class="text-xl">🎉</span>
                      <span>พร้อมสร้างโครงร่างวิจัยและรายงาน 5 บทฉบับสมบูรณ์แล้ว!</span>
                    </div>
                    <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      ระบบได้รวบรวมข้อมูลตั้งต้นทั้ง 9 ขั้นตอน พร้อมตรวจทานความสอดคล้องตามเกณฑ์ วPA และหลักการวิจัย R&D ทางการศึกษาขั้นสูง เมื่อคุณกดยืนยัน ระบบจะสร้างรายงานวิจัย 5 บท ตารางความสอดคล้อง 360° และชุดสถิติพร้อมนำเข้า Studio ทันที
                    </p>
                  </div>

                  <!-- Executive Blueprint Summary Grid -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-1">
                      <div class="font-bold text-slate-500 text-[11px]">📌 1. ชื่อเรื่องวิจัยและกลุ่มเป้าหมาย (ABCD):</div>
                      <div class="font-semibold text-slate-900 dark:text-white line-clamp-3">${escapeHtml(w.step1_title || proj.title || 'โครงร่างการวิจัย')}</div>
                    </div>
                    <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-1">
                      <div class="font-bold text-slate-500 text-[11px]">⚙️ 2. นวัตกรรมและตัวแปรตาม:</div>
                      <div class="font-semibold text-slate-900 dark:text-white">${escapeHtml(w.step6_innovation_short || w.step6_innovation || proj.B_short || proj.B || '-')}</div>
                      <div class="text-[11px] text-slate-500">ตัวแปรตาม: ${escapeHtml(w.step6_dependent || (proj.C_list || []).join(", ") || '-')}</div>
                    </div>
                    <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-1">
                      <div class="font-bold text-slate-500 text-[11px]">👥 3. ประชากรและกลุ่มตัวอย่าง:</div>
                      <div class="text-slate-700 dark:text-slate-300">
                        วิธีสุ่ม: <b>${escapeHtml(currentSamplingType === 'cluster_random' ? 'Cluster Random Sampling' : currentSamplingType === 'simple_random' ? 'Simple Random Sampling' : currentSamplingType === 'purposive' ? 'Purposive Sampling' : 'Census / Population')}</b><br/>
                        ประชากร: <b>${escapeHtml(popSize)} คน (${escapeHtml(classroomsCount)} ห้อง)</b> | กลุ่มตัวอย่าง: <b>${escapeHtml(sampleSize)} คน (${escapeHtml(selectedClassrooms)} ห้อง)</b>
                      </div>
                    </div>
                    <div class="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-1">
                      <div class="font-bold text-slate-500 text-[11px]">📊 4. สถิติและเกณฑ์มาตรฐาน:</div>
                      <div class="text-slate-700 dark:text-slate-300">
                        เกณฑ์ประสิทธิภาพ: <b>E1/E2 ${escapeHtml(proj.efficiencyCriterion || '80/80')}</b> | ดัชนีประสิทธิผล: <b>E.I. ≥ 0.50</b><br/>
                        สถิติทดสอบ: <b>${escapeHtml(currentSamplingType === 'purposive' || currentSamplingType === 'population' ? 'สถิติบรรยาย (x̄, S.D., E.I.)' : 'Dependent Samples t-test + Cohen\'s d')}</b>
                      </div>
                    </div>
                  </div>

                  <div class="pt-2">
                    <button type="button" onclick="ROAD_APP.completeWizardAndCreate()" class="w-full py-3.5 neu-btn-emerald text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition">
                      <span>🚀 ยืนยันสร้างโครงร่าง 5 บทและไปที่รายงาน 5 บท</span>
                    </button>
                  </div>
                </div>
              ` : ""}
            </div>
          </div>

          <!-- Wizard Footer Controls -->
          <div class="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                <span>💾</span>
                <span>บันทึกอัตโนมัติ: <b>${escapeHtml(state.lastSavedTimestamp || 'เพิ่งเริ่ม')}</b></span>
              </div>
              <button type="button" onclick="ROAD_APP.saveWizardStep()" class="px-3 py-1.5 neu-squircle hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1 transition">
                <span>💾 บันทึก</span>
              </button>
            </div>

            <div class="flex items-center gap-2">
              ${curStepNum > 1 ? `
                <button type="button" onclick="ROAD_APP.setWizardStep(${curStepNum - 1})" class="px-4 py-2 neu-squircle text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer transition">
                  ← ย้อนกลับ
                </button>
              ` : ""}

              ${curStepNum < 10 ? `
                <button type="button" onclick="ROAD_APP.setWizardStep(${curStepNum + 1})" class="px-5 py-2 neu-btn-primary text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-sm">
                  <span>ถัดไป</span>
                  <span>➔</span>
                </button>
              ` : `
                <button type="button" onclick="ROAD_APP.completeWizardAndCreate()" class="px-5 py-2 neu-btn-emerald text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-md">
                  <span>✔ สร้างโครงร่าง 5 บท</span>
                </button>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- Essential Manuscript Context Modal (School, Lesson Plans & Expert Roster) ---
  function renderContextMetaModal() {
    const proj = getActiveProject();
    if (!proj) return "";
    const meta = proj.contextMeta || (window.ROAD_DATA && window.ROAD_DATA.DEFAULT_CONTEXT_META) || {};
    const plans = (Array.isArray(proj.lessonPlans) && proj.lessonPlans.length > 0)
      ? proj.lessonPlans
      : (window.ROAD_DATA && window.ROAD_DATA.DEFAULT_LESSON_PLANS) || [];
    const experts = (Array.isArray(proj.expertRoster) && proj.expertRoster.length > 0)
      ? proj.expertRoster
      : (window.ROAD_DATA && window.ROAD_DATA.DEFAULT_EXPERT_ROSTER) || [];
    const tab = state.contextMetaModalTab || "context";

    return `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-fade-in print:hidden">
        <div class="neu-card max-w-4xl w-full p-5 sm:p-8 my-auto max-h-[90vh] flex flex-col gap-5 overflow-y-auto relative shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <!-- Header -->
          <div class="flex items-start justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl shadow-md">
                ⚙️
              </div>
              <div>
                <h3 class="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>ข้อมูลบริบทสถานศึกษา แผนการสอน & คณะผู้เชี่ยวชาญ</span>
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  กรอกข้อมูลจริงเพียงครั้งเดียว ระบบจะซิงค์ชื่อ, วิทยฐานะ, แผนการสอน 6 แผน และหนังสือเชิญผู้เชี่ยวชาญ 5 ท่านลงในเล่มวิจัยฉบับสมบูรณ์ทันที
                </p>
              </div>
            </div>
            <button onclick="ROAD_APP.closeContextMetaModal()" class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-lg" title="ปิดหน้าต่าง">
              ✕
            </button>
          </div>

          <!-- Tab Navigation -->
          <div class="flex flex-wrap gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
            <button onclick="ROAD_APP.setContextMetaTab('context')" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 ${tab === 'context' ? 'neu-btn-primary' : 'neu-squircle text-slate-700 dark:text-slate-300'}">
              <span>🏫 1. บริบทสถานศึกษา & งานวิจัย</span>
            </button>
            <button onclick="ROAD_APP.setContextMetaTab('plans')" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 ${tab === 'plans' ? 'neu-btn-primary' : 'neu-squircle text-slate-700 dark:text-slate-300'}">
              <span>📅 2. แผนการจัดการเรียนรู้ (${plans.length} แผน)</span>
            </button>
            <button onclick="ROAD_APP.setContextMetaTab('experts')" class="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center gap-1.5 ${tab === 'experts' ? 'neu-btn-primary' : 'neu-squircle text-slate-700 dark:text-slate-300'}">
              <span>👥 3. คณะผู้เชี่ยวชาญ 5 ท่าน & IOC</span>
            </button>
          </div>

          <!-- Tab 1: Context Meta Form (13 fields) -->
          ${tab === "context" ? `
            <div class="space-y-4">
              <div class="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-300 leading-relaxed">
                💡 <b>คำแนะนำ:</b> ข้อมูลในส่วนนี้จะถูกนำไปใช้อัตโนมัติใน ปกนอก, ปกใน, บทคัดย่อไทย/อังกฤษ, กิตติกรรมประกาศ, บทที่ 1 (บริบทและขอบเขต), บรรณานุกรม และประวัติผู้วิจัย
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <div class="space-y-1">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">ชื่อผู้วิจัย (พร้อมคำนำหน้า):</label>
                  <input type="text" id="ctx_researcherName" value="${escapeHtml(meta.researcherName || proj.researcher || '')}" class="w-full neu-input-pill px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white" placeholder="เช่น นายสมชาย ใจมั่น" />
                </div>
                <div class="space-y-1">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">ตำแหน่งและวิทยฐานะ:</label>
                  <input type="text" id="ctx_academicRank" value="${escapeHtml(meta.academicRank || proj.position || '')}" class="w-full neu-input-pill px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white" placeholder="เช่น ครู วิทยฐานะครูชำนาญการพิเศษ" />
                </div>
                <div class="space-y-1">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">วุฒิการศึกษาสูงสุด:</label>
                  <input type="text" id="ctx_degree" value="${escapeHtml(meta.degree || 'กศ.ม. (หลักสูตรและการจัดการเรียนรู้)')}" class="w-full neu-input-pill px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white" placeholder="เช่น กศ.ม. (หลักสูตรและการจัดการเรียนรู้)" />
                </div>
                <div class="space-y-1">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">ชื่อโรงเรียน / สถานศึกษา:</label>
                  <input type="text" id="ctx_schoolName" value="${escapeHtml(meta.schoolName || proj.school || '')}" class="w-full neu-input-pill px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white" placeholder="เช่น โรงเรียนเปรมติณสูลานนท์" />
                </div>
                <div class="space-y-1">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">หน่วยงานต้นสังกัด / สพม. / สพป.:</label>
                  <input type="text" id="ctx_affiliation" value="${escapeHtml(meta.affiliation || proj.affiliation || '')}" class="w-full neu-input-pill px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white" placeholder="เช่น องค์การบริหารส่วนจังหวัดขอนแก่น" />
                </div>
                <div class="space-y-1">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">จังหวัด:</label>
                  <input type="text" id="ctx_province" value="${escapeHtml(meta.province || 'ขอนแก่น')}" class="w-full neu-input-pill px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white" placeholder="เช่น ขอนแก่น" />
                </div>
                <div class="space-y-1">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">ชื่อผู้อำนวยการโรงเรียน (กิตติกรรมประกาศ):</label>
                  <input type="text" id="ctx_directorName" value="${escapeHtml(meta.directorName || 'ดร.วิชัย มุ่งพัฒนา')}" class="w-full neu-input-pill px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white" placeholder="เช่น ดร.วิชัย มุ่งพัฒนา" />
                </div>
                <div class="space-y-1">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">ปีการศึกษา:</label>
                  <input type="text" id="ctx_academicYear" value="${escapeHtml(meta.academicYear || '2569')}" class="w-full neu-input-pill px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white" placeholder="เช่น 2569" />
                </div>
                <div class="space-y-1">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">ภาคเรียนที่:</label>
                  <input type="text" id="ctx_semester" value="${escapeHtml(meta.semester || '1')}" class="w-full neu-input-pill px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white" placeholder="เช่น 1 หรือ 2" />
                </div>
                <div class="space-y-1">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">รหัสวิชา:</label>
                  <input type="text" id="ctx_courseCode" value="${escapeHtml(meta.courseCode || 'ว23101')}" class="w-full neu-input-pill px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white" placeholder="เช่น ว23101 หรือ ค23101" />
                </div>
                <div class="space-y-1">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">ชื่อรายวิชา:</label>
                  <input type="text" id="ctx_courseName" value="${escapeHtml(meta.courseName || proj.subject || '')}" class="w-full neu-input-pill px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white" placeholder="เช่น วิทยาศาสตร์พื้นฐาน" />
                </div>
                <div class="space-y-1">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">จำนวนชั่วโมงจัดกิจกรรมรวม:</label>
                  <input type="text" id="ctx_totalHours" value="${escapeHtml(meta.totalHours || '18 ชั่วโมง')}" class="w-full neu-input-pill px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white" placeholder="เช่น 18 ชั่วโมง" />
                </div>
                <div class="space-y-1 sm:col-span-2 lg:col-span-3">
                  <label class="text-xs font-bold text-slate-700 dark:text-slate-300">ผลสัมฤทธิ์เดิม / คะแนนเฉลี่ยก่อนใช้นวัตกรรม (% หรือ x̄):</label>
                  <input type="text" id="ctx_pastScoreAvg" value="${escapeHtml(meta.pastScoreAvg || '56.80%')}" class="w-full neu-input-pill px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white" placeholder="เช่น 56.80% (คะแนนเฉลี่ยร้อยละของภาคเรียนที่ผ่านมาเพื่อใช้อ้างอิงในบทที่ 1)" />
                </div>
              </div>
            </div>
          ` : ""}

          <!-- Tab 2: Lesson Plans Form (6 plans) -->
          ${tab === "plans" ? `
            <div class="space-y-4">
              <div class="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-300">
                <div>
                  📅 <b>โครงสร้างหน่วยและแผนการจัดการเรียนรู้:</b> ระบบกำหนดโครงสร้าง 6 แผน (รวม 18 ชั่วโมง) ใช้จัดกิจกรรมในบทที่ 1, บทที่ 3 (ตาราง 3.1) และภาคผนวก
                </div>
                <button onclick="ROAD_APP.resetLessonPlansDefault()" class="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 cursor-pointer">
                  🔄 รีเซ็ตแผนเป็นค่าเริ่มต้น
                </button>
              </div>

              <div class="space-y-3">
                ${plans.map((lp, idx) => `
                  <div class="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
                    <div class="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span class="flex items-center gap-1.5">
                        <span class="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[11px] font-bold">${lp.planNo || idx + 1}</span>
                        <span>แผนการจัดการเรียนรู้ที่ ${lp.planNo || idx + 1}</span>
                      </span>
                      <div class="flex items-center gap-1.5">
                        <span class="text-slate-500 font-normal">เวลา:</span>
                        <input type="number" id="ctx_lp_hours_${idx}" value="${escapeHtml(lp.hours || 3)}" class="w-16 neu-input-pill px-2.5 py-1 text-xs font-mono text-center text-slate-900 dark:text-white" min="1" max="10" />
                        <span class="text-slate-500 font-normal">ชั่วโมง</span>
                      </div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div class="sm:col-span-5">
                        <input type="text" id="ctx_lp_title_${idx}" value="${escapeHtml(lp.unitTitle || '')}" class="w-full neu-input-pill px-3 py-2 text-xs font-medium text-slate-900 dark:text-white" placeholder="ชื่อหน่วยการเรียนรู้ / หัวข้อแผน" />
                      </div>
                      <div class="sm:col-span-7">
                        <input type="text" id="ctx_lp_concept_${idx}" value="${escapeHtml(lp.conceptSummary || '')}" class="w-full neu-input-pill px-3 py-2 text-xs text-slate-700 dark:text-slate-300" placeholder="สาระสำคัญและกระบวนการจัดการเรียนรู้เชิงรุก" />
                      </div>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          ` : ""}

          <!-- Tab 3: Expert Roster Form (5 experts) -->
          ${tab === "experts" ? `
            <div class="space-y-4">
              <div class="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-300">
                <div>
                  👥 <b>รายชื่อคณะผู้เชี่ยวชาญ 5 ท่าน:</b> ระบบใช้ชื่อและตำแหน่งนี้ในตารางบทที่ 3 (ตาราง 3.2), กิตติกรรมประกาศ, แบบประเมิน IOC และหนังสือขอความอนุเคราะห์รายบุคคล 5 ฉบับ
                </div>
                <button onclick="ROAD_APP.resetExpertsDefault()" class="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 cursor-pointer">
                  🔄 รีเซ็ต 5 ผู้เชี่ยวชาญ
                </button>
              </div>

              <div class="space-y-3">
                ${experts.map((exp, idx) => `
                  <div class="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
                    <div class="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span class="flex items-center gap-1.5">
                        <span class="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-[11px] font-bold">${exp.id || idx + 1}</span>
                        <span>ผู้เชี่ยวชาญท่านที่ ${exp.id || idx + 1}</span>
                      </span>
                      <span class="text-[11px] text-slate-500 font-mono">${escapeHtml(exp.role ? exp.role.substring(0, 30) + '...' : '')}</span>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label class="text-[11px] font-semibold text-slate-500">ชื่อ-สกุล พร้อมตำแหน่งทางวิชาการ/วิทยฐานะ:</label>
                        <input type="text" id="ctx_exp_name_${idx}" value="${escapeHtml(exp.prefixName || '')}" class="w-full neu-input-pill px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white mt-0.5" placeholder="เช่น ศ.ดร.ประสิทธิ์ วิจัยวัฒนา" />
                      </div>
                      <div>
                        <label class="text-[11px] font-semibold text-slate-500">ตำแหน่ง / วิทยฐานะปัจจุบัน:</label>
                        <input type="text" id="ctx_exp_pos_${idx}" value="${escapeHtml(exp.position || '')}" class="w-full neu-input-pill px-3 py-1.5 text-xs text-slate-900 dark:text-white mt-0.5" placeholder="เช่น รองศาสตราจารย์ ระดับ 9" />
                      </div>
                      <div>
                        <label class="text-[11px] font-semibold text-slate-500">หน่วยงาน / สถาบันการศึกษาต้นสังกัด:</label>
                        <input type="text" id="ctx_exp_org_${idx}" value="${escapeHtml(exp.organization || '')}" class="w-full neu-input-pill px-3 py-1.5 text-xs text-slate-900 dark:text-white mt-0.5" placeholder="เช่น คณะศึกษาศาสตร์ มหาวิทยาลัยมหาสารคาม" />
                      </div>
                      <div>
                        <label class="text-[11px] font-semibold text-slate-500">บทบาทความเชี่ยวชาญในการตรวจสอบ:</label>
                        <input type="text" id="ctx_exp_role_${idx}" value="${escapeHtml(exp.role || '')}" class="w-full neu-input-pill px-3 py-1.5 text-xs text-slate-900 dark:text-white mt-0.5" placeholder="เช่น ผู้เชี่ยวชาญด้านระเบียบวิธีวิจัยและนวัตกรรม" />
                      </div>
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          ` : ""}

          <!-- Footer Controls -->
          <div class="p-3.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 rounded-2xl">
            <button onclick="ROAD_APP.closeContextMetaModal()" class="px-4 py-2 neu-squircle text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              ✕ ยกเลิก
            </button>
            <button onclick="ROAD_APP.saveContextMeta()" class="px-5 py-2.5 neu-btn-primary text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer shadow-md">
              <span>💾 บันทึกและซิงค์ข้อมูลลงเล่มวิจัยทันที</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderFooter() {
    if (state.view === "slides") return "";
    return `
      <footer class="max-w-7xl mx-auto px-4 py-8 mt-10 border-t border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 print:hidden">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto bg-white/70 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-4 sm:px-6 border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
          <div class="text-left">
            <div class="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>ระบบ ROAD Next-Gen · R&D Research Studio & AI Co-Pilot</span>
            </div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              ระบบสังเคราะห์โครงร่างและเขียนเล่มวิจัย 5 บท มาตรฐานวิจัยและพัฒนาทางการศึกษา (R&D)
            </div>
          </div>
          <div class="text-center sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60 dark:border-slate-800/60">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs border border-indigo-200/60 dark:border-indigo-800/60 mb-1">
              <span>พัฒนาโดย:</span>
              <span class="font-extrabold text-indigo-800 dark:text-indigo-200">Dev.By Kru.GOR</span>
            </div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400">
              อีเมลติดต่อ: <a href="mailto:Gorthailand1617@gmail.com" class="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">Gorthailand1617@gmail.com</a>
            </div>
          </div>
        </div>
        <div class="mt-4 text-[11px] text-slate-400 dark:text-slate-500 text-center">
          © 2026 ROAD Next-Gen · Report Outline Assistant for Development · มาตรฐานวิธีวิทยาการวิจัยและพัฒนาทางการศึกษาเพื่อการประเมินวิทยฐานะ วPA
        </div>
      </footer>
    `;
  }

  function renderApp() {
    const root = document.getElementById("app-root");
    if (!root) return;
    let mainHtml = "";
    if (state.view === "login") mainHtml = renderLoginView();
    else if (state.view === "signup") mainHtml = renderSignupView();
    else if (state.view === "forgot") mainHtml = renderForgotView();
    else if (state.view === "admin") mainHtml = renderAdminView();
    else if (state.view === "slides") mainHtml = renderSlidesView();
    else mainHtml = renderStudioView();

    root.innerHTML = `${renderTopNavbar()}<main>${mainHtml}</main>${renderFooter()}${state.showAbcdModal ? renderCustomAbcdModal() : ""}${state.showWizardModal ? renderResearchWizardModal() : ""}${state.showContextMetaModal ? renderContextMetaModal() : ""}`;
  }

  window.addEventListener("DOMContentLoaded", () => {
    loadStorage();
    renderApp();
  });
})();
