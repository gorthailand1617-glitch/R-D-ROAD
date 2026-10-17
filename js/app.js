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
    THEME: "road_nextgen_theme_v1"
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
    view: "login", // "login" | "studio" | "signup" | "admin" | "slides"
    theme: "light", // "light" | "dark"
    showLoginPass: false,
    rememberMe: true,
    studioTab: "advisor", // "advisor" | "abcd" | "chapters" | "diagrams" | "matrix" | "statlab" | "ai"
    activeChapterFilter: 0, // 0 = All 5 chapters, 1..5 = specific chapter
    slideIndex: 0,
    members: [],
    cohorts: [],
    currentUser: null,
    projects: [],
    activeProjectId: null,
    showAbcdModal: false,
    abcdModalTab: "manual", // "manual" | "parse" | "blank"
    abcdParseInput: "",
    abcdParsedResult: null,
    titleViewMode: "badges", // "badges" | "plain"
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
      schoolName: "โรงเรียนผดุงนารี"
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
          updatedAt: new Date().toISOString(),
          customSections: {}
        }));
      }
    } catch {
      state.projects = [JSON.parse(JSON.stringify(window.ROAD_DATA.PRESETS[0]))];
    }

    state.activeProjectId = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT_ID) || state.projects[0]?.id;
    state.geminiKey = localStorage.getItem(STORAGE_KEYS.GEMINI_KEY) || "";
    state.theme = localStorage.getItem(STORAGE_KEYS.THEME) || "light";
    applyThemeClass();

    // Check URL pathname or query param
    const params = new URLSearchParams(window.location.search);
    const pathname = (window.location.pathname || "").toLowerCase().replace(/\/$/, "");
    if (params.get("view") === "signup" || pathname === "/signup") state.view = "signup";
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
    return state.projects.find(p => p.id === state.activeProjectId) || state.projects[0];
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
      el.style.opacity = "0";
      setTimeout(() => el.remove(), 300);
    }, 3200);
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
      window.scrollTo({ top: 0, behavior: "smooth" });
    },

    setStudioTab(tab) {
      state.studioTab = tab;
      renderApp();
    },

    setChapterFilter(num) {
      state.activeChapterFilter = Number(num);
      renderApp();
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

    // --- Export Actions ---
    exportWord() {
      const proj = getActiveProject();
      window.ROAD_GENERATOR.exportToWordDoc(proj);
      showToast("กำลังดาวน์โหลดไฟล์ Microsoft Word (.doc) ฟอนต์ TH Sarabun...");
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
                <div class="text-[11px] text-[#5b6d96] dark:text-slate-400">จากชื่อเรื่อง ABCD สู่รายงานการวิจัย 5 บท · รศ.ดร.ชวลิต ชูกำแพง</div>
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
                value="somchai.k@gmail.com"
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
              <button type="button" onclick="ROAD_APP.setView('signup')" class="font-bold text-[#1456e8] dark:text-blue-400 hover:underline cursor-pointer">
                สมัครสมาชิก / รหัสรุ่นอบรม?
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
              <input value="${escapeHtml(f.workplace)}" oninput="ROAD_APP.updateSignupField('workplace', this.value)" placeholder="เช่น โรงเรียนผดุงนารี / มหาวิทยาลัยมหาสารคาม" class="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700" required />
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
            ${gen.chapters[4].sections[0].content.map(item => `<p>• ${escapeHtml(item)}</p>`).join("")}
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
          <span>พัฒนาต่อยอดแนวคิด รศ.ดร.ชวลิต ชูกำแพง คณะศึกษาศาสตร์ มหาวิทยาลัยมหาสารคาม</span>
        </div>
      </div>
    `;
  }

  // --- View 5: Main R&D Research Studio (6 Power Tabs) ---
  function renderStudioView() {
    const proj = getActiveProject();
    const fullTitle = window.ROAD_GENERATOR.composeFullTitle(proj);
    const health = window.ROAD_GENERATOR.evaluateResearchHealth(proj);

    return `
      <div class="max-w-7xl mx-auto px-4 py-5 flex flex-col gap-6 relative z-10">
        <!-- Project Switcher & Export Action Bar (3D Soft Neumorphic Card) -->
        <div class="neu-card p-5 flex flex-col gap-4 print:hidden">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs font-extrabold uppercase tracking-wider text-slate-500">📂 โครงการวิจัย:</span>
              <select onchange="ROAD_APP.selectProject(this.value)" class="px-4 py-2 neu-input-pill text-xs sm:text-sm font-bold text-slate-800 dark:text-white cursor-pointer max-w-[240px] truncate">
                ${state.projects.map(p => `<option value="${p.id}" ${p.id === proj.id ? 'selected' : ''}>${escapeHtml(p.label || p.B_short || p.B)}</option>`).join("")}
              </select>
              <button onclick="ROAD_APP.openAbcdModal('manual')" class="px-3.5 py-2 neu-btn-primary text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-sm" title="ป้อนข้อมูลและกำหนดค่า A B C D ได้อย่างอิสระ">
                <span>✏️ ป้อน A B C D กำหนดเอง</span>
              </button>
              <button onclick="ROAD_APP.openAbcdModal('parse')" class="px-3 py-2 neu-squircle text-emerald-700 dark:text-emerald-300 text-xs font-bold cursor-pointer flex items-center gap-1" title="วางชื่อเรื่องภาษาไทยแล้วแยกลง A B C D ทันที">
                <span>⚡ วางชื่อเรื่องแยก ABCD</span>
              </button>
              <button onclick="ROAD_APP.createBlankProject()" class="px-3 py-2 neu-squircle text-blue-600 dark:text-sky-300 text-xs font-bold cursor-pointer" title="เริ่มต้นสร้างงานวิจัยใหม่แบบว่างเปล่า">
                <span>+ โครงร่างว่าง</span>
              </button>

              <div class="dropdown relative inline-block">
                <select onchange="if(this.value){ROAD_APP.loadPresetIntoActive(this.value); this.value='';}" class="px-3 py-2 neu-input-pill text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                  <option value="">✨ ตัวอย่างสำเร็จรูป (Presets)...</option>
                  ${window.ROAD_DATA.PRESETS.map(pr => `<option value="${pr.id}">${escapeHtml(pr.label)}</option>`).join("")}
                </select>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2.5">
              <button onclick="ROAD_APP.exportWord()" class="px-4 py-2.5 neu-btn-primary text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer">
                📄 ส่งออกไฟล์ Word (.doc ฟอนต์สารบัญ)
              </button>
              <button onclick="window.print()" class="px-3.5 py-2 neu-squircle text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold cursor-pointer">
                🖨️ พิมพ์ A4 / PDF
              </button>
              <button onclick="ROAD_APP.exportJson()" class="px-3 py-2 neu-squircle text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer" title="สำรองไฟล์ JSON">
                💾 JSON
              </button>
            </div>
          </div>

          <!-- Live Full Title Banner (Supports Color-Coded Badges) -->
          <div class="neu-input-pill rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex-1">
              <div class="flex items-center justify-between gap-2 text-xs font-bold text-blue-700 dark:text-sky-300 mb-1.5">
                <span>📌 ชื่อเรื่องการวิจัย (ประกอบอัตโนมัติตามสูตร ABCD):</span>
                <button type="button" onclick="ROAD_APP.toggleTitleViewMode()" class="px-2.5 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800 text-[11px] font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer transition">
                  ${state.titleViewMode === 'plain' ? '🏷️ แสดงแบบแยกสี A B C D' : '📝 แสดงแบบข้อความเดียว'}
                </button>
              </div>
              <div id="live-composed-title" class="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                ${state.titleViewMode === 'plain' ? escapeHtml(fullTitle) : window.ROAD_GENERATOR.composeColorCodedTitle(proj)}
              </div>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <div class="text-right">
                <div class="text-[11px] font-semibold text-slate-500">ความสมบูรณ์โครงร่าง</div>
                <div class="text-lg font-mono font-extrabold ${health.score >= 85 ? 'text-emerald-600' : 'text-amber-600'}">${health.score}%</div>
              </div>
              <button onclick="ROAD_APP.openAbcdModal('manual')" class="px-3.5 py-2 neu-squircle text-xs font-bold text-blue-700 dark:text-sky-300 cursor-pointer" title="เปิดตัวช่วยป้อน A B C D">
                ✏️ แก้ไข ABCD
              </button>
              <button onclick="ROAD_APP.copySmartPrompt('title_polish')" class="px-3.5 py-2 neu-squircle text-xs font-bold text-indigo-700 dark:text-indigo-300 cursor-pointer">
                ✨ Prompt เกลาชื่อ
              </button>
            </div>
          </div>

          <!-- 7 Studio Sub-Navigation Tabs (with AI Smart Advisor first!) -->
          <div class="flex flex-wrap gap-2 pt-2">
            ${[
              ["advisor", "🧠 AI วิเคราะห์และเลือกชุดวิจัยที่ดีที่สุด (แนะนำ!)"],
              ["abcd", "1. ปรับแต่งชื่อเรื่อง ABCD & นวัตกรรม"],
              ["chapters", "2. โครงร่างและรายงานวิจัย 5 บท"],
              ["diagrams", "3. แผนภาพกรอบแนวคิด & ผัง R&D"],
              ["matrix", "4. ตารางความสอดคล้อง 360°"],
              ["statlab", "5. ห้องปฏิบัติการสถิติ & ตารางบทที่ 4"],
              ["ai", "6. AI Research Co-Pilot (เขียนรายบท)"]
            ].map(([key, label]) => `
              <button onclick="ROAD_APP.setStudioTab('${key}')" class="px-4 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${state.studioTab === key ? (key === 'advisor' ? 'neu-btn-emerald' : 'neu-btn-primary') : 'neu-squircle text-slate-700 dark:text-slate-300'}">
                ${label}
              </button>
            `).join("")}
          </div>
        </div>

        <!-- Active Tab Content -->
        <div class="print-area">
          ${state.studioTab === "advisor" ? renderTabAdvisor() : ""}
          ${state.studioTab === "abcd" ? renderTabAbcd(proj, health) : ""}
          ${state.studioTab === "chapters" ? renderTabChapters(proj) : ""}
          ${state.studioTab === "diagrams" ? renderTabDiagrams(proj) : ""}
          ${state.studioTab === "matrix" ? renderTabMatrix(proj) : ""}
          ${state.studioTab === "statlab" ? renderTabStatLab(proj) : ""}
          ${state.studioTab === "ai" ? renderTabAi(proj) : ""}
        </div>
      </div>
    `;
  }

  // --- Studio Tab 0: AI Smart Research Advisor & Practicality Engine ---
  function renderTabAdvisor() {
    const cr = state.advisorCriteria;
    const recs = window.ROAD_ADVISOR.analyzeAndRecommend(cr);
    const best = recs[0];

    return `
      <div class="flex flex-col gap-6">
        <!-- Hero Advisor Input Card (3D Soft Neumorphic Card) -->
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
                เพียงระบุวิชา ระดับชั้น และปัญหาที่พบ ระบบจะคัดเลือกนวัตกรรม (B) ตัวแปรตาม (C) แบบแผนการทดลอง จำนวนแผนการสอน และค่าสถิติที่ทำในห้องเรียนได้ง่ายที่สุดแต่ผ่านเกณฑ์ประเมิน วPA / R&D 100%
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
              <span class="font-extrabold text-slate-700 dark:text-slate-300">5. เรื่อง / หน่วยการเรียนรู้ที่จะใช้สอนจริง (ปรับแก้ได้ตามต้องการ)</span>
              <input value="${escapeHtml(cr.customTopic)}" oninput="ROAD_APP.updateAdvisorField('customTopic', this.value)" class="px-4 py-3 neu-input-pill text-slate-800 dark:text-white font-semibold text-sm" placeholder="เช่น ระบบนิเวศ / การอ่านจับใจความ / ร้อยละและอัตราส่วน" />
            </label>

            <label class="flex flex-col gap-1.5 text-xs sm:col-span-2">
              <span class="font-extrabold text-slate-700 dark:text-slate-300">6. ชื่อโรงเรียน / สถานศึกษาของคุณ</span>
              <div class="flex gap-2.5">
                <input value="${escapeHtml(cr.schoolName)}" oninput="ROAD_APP.updateAdvisorField('schoolName', this.value)" class="flex-1 px-4 py-3 neu-input-pill text-slate-800 dark:text-white font-semibold text-sm" placeholder="เช่น โรงเรียนผดุงนารี" />
                <button onclick="ROAD_APP.runGeminiAdvisorAutoPilot()" class="px-4 py-3 neu-btn-primary text-xs font-extrabold cursor-pointer shrink-0">
                  ${state.advisorLoading ? '⏳ กำลังวิเคราะห์...' : '🤖 สั่ง AI ประมวลผลและสร้าง 5 บท'}
                </button>
              </div>
            </label>
          </div>
        </div>

        <!-- Top #1 Best & Most Practical Recommendation Card -->
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

          <!-- Why this is the best & easiest to implement + 4-Week Action Plan -->
          <div class="grid md:grid-cols-2 gap-5">
            <div class="p-5 neu-input-pill rounded-2xl flex flex-col gap-2.5">
              <h4 class="font-extrabold text-sm text-emerald-800 dark:text-emerald-300">💡 ทำไม AI จึงเลือกชุดนี้ว่า "ดีที่สุดและปฏิบัติได้ง่ายที่สุด" สำหรับคุณ:</h4>
              <ul class="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                ${best.whyBest.map(w => `<li class="flex items-start gap-2"><span class="text-emerald-600 font-bold">✔</span><span>${escapeHtml(w)}</span></li>`).join("")}
              </ul>
              <div class="mt-2 pt-2.5 border-t border-slate-300/60 dark:border-slate-700 text-xs">
                <b>ขั้นตอนการสอนของนวัตกรรม (${best.projectPayload.B_steps.length} ขั้นตอน จำง่าย นำไปสอนได้จริง):</b>
                <div class="mt-2 space-y-1.5">
                  ${best.projectPayload.B_steps.map(s => `<div class="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900 border border-white dark:border-slate-800 font-medium">${escapeHtml(s)}</div>`).join("")}
                </div>
              </div>
            </div>

            <div class="p-5 neu-input-pill rounded-2xl flex flex-col justify-between gap-3">
              <div>
                <h4 class="font-extrabold text-sm text-blue-800 dark:text-sky-300 mb-2.5">🗓️ แผนปฏิบัติการลงมือทำจริงในชั้นเรียน (Step-by-Step Action Plan):</h4>
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
      </div>
    `;
  }

  // --- Studio Tab 1: Smart ABCD Builder & Research Design ---
  function renderTabAbcd(proj, health) {
    const vocab = window.ROAD_DATA.ABCD_SUGGESTIONS;
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
              <span class="px-2.5 py-1 rounded-full font-mono text-sm font-bold bg-emerald-100 text-emerald-800">${health.score}/100</span>
            </div>
            <div class="space-y-2.5">
              ${health.checks.map(chk => `
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

  // --- Studio Tab 2: 5-Chapter Blueprint Viewer & Editor ---
  function renderTabChapters(proj) {
    const gen = window.ROAD_GENERATOR.generateChapters(proj);
    const chaptersToShow = state.activeChapterFilter === 0
      ? gen.chapters
      : gen.chapters.filter(c => c.number === state.activeChapterFilter);

    return `
      <div class="flex flex-col gap-5">
        <!-- Chapter Filter Bar -->
        <div class="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div class="flex flex-wrap gap-1.5">
            <button onclick="ROAD_APP.setChapterFilter(0)" class="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${state.activeChapterFilter === 0 ? 'bg-sky-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}">
              📚 แสดงครบทั้ง 5 บท
            </button>
            ${gen.chapters.map(c => `
              <button onclick="ROAD_APP.setChapterFilter(${c.number})" class="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${state.activeChapterFilter === c.number ? 'bg-sky-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}">
                ${escapeHtml(c.title)}
              </button>
            `).join("")}
          </div>
          <div class="flex items-center gap-2">
            <button onclick="ROAD_APP.resetCustomSections()" class="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs hover:bg-slate-100 cursor-pointer">🔄 ซิงค์ข้อมูลเริ่มต้นใหม่</button>
            <button onclick="ROAD_APP.exportWord()" class="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold cursor-pointer">📥 ดาวน์โหลด Word (.doc)</button>
          </div>
        </div>

        <!-- Chapters Document View -->
        <div class="space-y-6">
          ${chaptersToShow.map(ch => `
            <section class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col gap-5 break-inside-avoid">
              <div class="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span class="text-xs font-mono uppercase tracking-wider text-sky-700 dark:text-sky-400 font-bold">CHAPTER ${ch.number}</span>
                  <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">${escapeHtml(ch.title)}</h2>
                  <p class="text-xs text-slate-500 mt-0.5">${escapeHtml(ch.subtitle)}</p>
                </div>
                <div class="flex gap-2 print:hidden">
                  ${ch.number === 1 ? `<button onclick="ROAD_APP.copySmartPrompt('ch1_background')" class="px-3 py-1.5 rounded-lg border border-sky-300 text-sky-800 dark:text-sky-300 text-xs font-semibold hover:bg-sky-50 cursor-pointer">📋 คัดลอก Prompt บทที่ 1</button>` : ""}
                  ${ch.number === 2 ? `<button onclick="ROAD_APP.copySmartPrompt('ch2_synthesis')" class="px-3 py-1.5 rounded-lg border border-sky-300 text-sky-800 dark:text-sky-300 text-xs font-semibold hover:bg-sky-50 cursor-pointer">📋 คัดลอก Prompt บทที่ 2</button>` : ""}
                  ${ch.number === 5 ? `<button onclick="ROAD_APP.copySmartPrompt('ch5_discussion')" class="px-3 py-1.5 rounded-lg border border-sky-300 text-sky-800 dark:text-sky-300 text-xs font-semibold hover:bg-sky-50 cursor-pointer">📋 คัดลอก Prompt อภิปรายผล</button>` : ""}
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
                  </div>
                `).join("")}
              </div>
            </section>
          `).join("")}
        </div>
      </div>
    `;
  }

  // --- Studio Tab 3: Visual Conceptual Framework & R&D Flowchart ---
  function renderTabDiagrams(proj) {
    const model = window.ROAD_DATA.RESEARCH_MODELS.find(m => m.id === proj.modelId) || window.ROAD_DATA.RESEARCH_MODELS[0];
    const steps = (proj.B_steps || []).filter(Boolean);
    const cList = (proj.C_list || []).filter(Boolean);

    return `
      <div class="flex flex-col gap-6">
        <!-- Diagram 1: Conceptual Framework (กรอบแนวคิดในการวิจัย บทที่ 2) -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-5">
          <div>
            <span class="text-xs font-mono font-bold text-sky-700 dark:text-sky-400 uppercase">DIAGRAM 1 · บทที่ 2 กรอบแนวคิดในการวิจัย</span>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">แผนภาพกรอบแนวคิดในการวิจัย (Conceptual Framework)</h2>
          </div>

          <div class="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-300 dark:border-slate-800">
            <div class="grid md:grid-cols-[1fr_5rem_1fr] items-center gap-4">
              <!-- Independent Variable Box -->
              <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-sky-700 shadow-sm">
                <div class="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 border-b border-slate-200 dark:border-slate-800 pb-2 mb-3">
                  ตัวแปรต้น (Independent Variable)
                </div>
                <div class="font-bold text-base text-slate-900 dark:text-white mb-3">
                  การจัดการเรียนรู้ด้วย${escapeHtml(proj.B)}
                </div>
                <div class="space-y-1.5 text-xs">
                  ${steps.map(s => `<div class="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 font-medium">${escapeHtml(s)}</div>`).join("")}
                </div>
              </div>

              <!-- Arrow -->
              <div class="flex flex-col items-center justify-center py-2">
                <div class="text-3xl font-bold text-sky-700 dark:text-sky-400">⟹</div>
                <span class="text-[11px] font-mono text-slate-500">ส่งผลต่อ</span>
              </div>

              <!-- Dependent Variable Box -->
              <div class="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-700 shadow-sm">
                <div class="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-800 pb-2 mb-3">
                  ตัวแปรตาม (Dependent Variables)
                </div>
                <div class="space-y-2.5 text-sm font-bold text-slate-900 dark:text-white">
                  ${cList.map((c, idx) => `
                    <div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                      ${idx + 1}. ${escapeHtml(c)}
                    </div>
                  `).join("")}
                  <div class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                    ${cList.length + 1}. ความพึงพอใจของผู้เรียนที่มีต่อการจัดการเรียนรู้ด้วย${escapeHtml(proj.B_short || proj.B)}
                  </div>
                </div>
                <div class="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                  กลุ่มเป้าหมาย: ${escapeHtml(proj.D)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Diagram 2: Research Process Flowchart (ผังขั้นตอนการดำเนินการวิจัย บทที่ 3) -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-5">
          <div>
            <span class="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-400 uppercase">DIAGRAM 2 · บทที่ 3 ขั้นตอนการดำเนินการวิจัย</span>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">แผนผังกระบวนการวิจัย (${escapeHtml(model.name)})</h2>
          </div>

          <div class="grid md:grid-cols-4 gap-4">
            ${model.phases.map((ph, idx) => `
              <div class="p-4 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 flex flex-col justify-between gap-3">
                <div>
                  <div class="flex items-center justify-between">
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-700 text-white">${escapeHtml(ph.code)}</span>
                    <span class="text-xs font-mono text-slate-400">STEP ${idx + 1}</span>
                  </div>
                  <div class="font-bold text-sm text-slate-900 dark:text-white mt-2">${escapeHtml(ph.title)}</div>
                  <p class="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">${escapeHtml(ph.goal)}</p>
                </div>
                <div class="pt-2 border-t border-indigo-200/60 dark:border-indigo-800 text-[11px] font-semibold text-indigo-800 dark:text-indigo-300">
                  ผลลัพธ์: เชื่อมโยงสู่วัตถุประสงค์ข้อที่ ${idx + 1}
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  }

  // --- Studio Tab 4: 360° Research Alignment Matrix ---
  function renderTabMatrix(proj) {
    const matrix = window.ROAD_GENERATOR.generateAlignmentMatrix(proj);
    return `
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span class="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase">360° RESEARCH ALIGNMENT MATRIX</span>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white">ตารางตรวจสอบความสอดคล้องของงานวิจัยทั้งระบบ</h2>
            <p class="text-xs text-slate-500">ตรวจสอบความเชื่อมโยงระหว่าง ระยะการวิจัย ↔ คำถามการวิจัย ↔ วัตถุประสงค์ ↔ สมมติฐาน ↔ แหล่งข้อมูล ↔ เครื่องมือ ↔ สถิติ ↔ บทที่ 4</p>
          </div>
          <button onclick="window.print()" class="px-3.5 py-2 rounded-xl bg-sky-700 text-white text-xs font-semibold cursor-pointer print:hidden">🖨️ พิมพ์ตารางความสอดคล้อง</button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-xs border-collapse border border-slate-300 dark:border-slate-700">
            <thead>
              <tr class="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100">
                <th class="border border-slate-300 dark:border-slate-700 p-2.5 w-36">ระยะ / ขั้นตอน</th>
                <th class="border border-slate-300 dark:border-slate-700 p-2.5">วัตถุประสงค์การวิจัย</th>
                <th class="border border-slate-300 dark:border-slate-700 p-2.5">สมมติฐานการวิจัย</th>
                <th class="border border-slate-300 dark:border-slate-700 p-2.5">กลุ่มเป้าหมาย / แหล่งข้อมูล</th>
                <th class="border border-slate-300 dark:border-slate-700 p-2.5">เครื่องมือที่ใช้</th>
                <th class="border border-slate-300 dark:border-slate-700 p-2.5">สถิติที่ใช้วิเคราะห์</th>
                <th class="border border-slate-300 dark:border-slate-700 p-2.5">การนำเสนอผลในบทที่ 4</th>
              </tr>
            </thead>
            <tbody>
              ${matrix.map(r => `
                <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 align-top">
                  <td class="border border-slate-300 dark:border-slate-700 p-2.5 font-bold text-sky-800 dark:text-sky-300">${escapeHtml(r.phase)}</td>
                  <td class="border border-slate-300 dark:border-slate-700 p-2.5 font-semibold">${escapeHtml(r.objective)}</td>
                  <td class="border border-slate-300 dark:border-slate-700 p-2.5">${escapeHtml(r.hypothesis)}</td>
                  <td class="border border-slate-300 dark:border-slate-700 p-2.5">${escapeHtml(r.informants)}</td>
                  <td class="border border-slate-300 dark:border-slate-700 p-2.5">${escapeHtml(r.instruments)}</td>
                  <td class="border border-slate-300 dark:border-slate-700 p-2.5">${escapeHtml(r.statistics)}</td>
                  <td class="border border-slate-300 dark:border-slate-700 p-2.5 text-emerald-700 dark:text-emerald-400 font-medium">${escapeHtml(r.ch4Section)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // --- Studio Tab 5: Built-in R&D Stat Lab & APA Table Generator ---
  function renderTabStatLab(proj) {
    const st = proj.statsData || {};
    const gen = window.ROAD_GENERATOR.generateChapters(proj);
    const ch4Tables = gen.chapters[3].sections[1].tables;

    return `
      <div class="grid lg:grid-cols-3 gap-6">
        <!-- Left Column: Interactive Stat Controls -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-mono font-bold text-sky-700 uppercase">R&D STAT LAB</span>
              <h2 class="text-base font-bold text-slate-900 dark:text-white">คำนวณและจำลองค่าสถิติบทที่ 4</h2>
            </div>
          </div>

          <button onclick="ROAD_APP.simulateAlignedStats()" class="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm cursor-pointer">
            🎲 สุ่มจำลองข้อมูลสถิติให้ผ่านเกณฑ์ ${escapeHtml(proj.efficiencyCriterion)} อัตโนมัติ
          </button>

          <div class="grid grid-cols-2 gap-3 text-xs">
            <label class="flex flex-col gap-1">
              <span class="font-semibold">จำนวนกลุ่มตัวอย่าง (n)</span>
              <input type="number" value="${st.n || 38}" oninput="ROAD_APP.updateStatField('n', this.value)" class="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono" />
            </label>
            <label class="flex flex-col gap-1">
              <span class="font-semibold">ค่า IOC เฉลี่ย</span>
              <input type="number" step="0.01" value="${st.iocAvg || 0.92}" oninput="ROAD_APP.updateStatField('iocAvg', this.value)" class="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono" />
            </label>
            <label class="flex flex-col gap-1">
              <span class="font-semibold">ประสิทธิภาพระหว่างเรียน (E1)</span>
              <input type="number" step="0.01" value="${st.e1 || 82.45}" oninput="ROAD_APP.updateStatField('e1', this.value)" class="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono" />
            </label>
            <label class="flex flex-col gap-1">
              <span class="font-semibold">ประสิทธิภาพหลังเรียน (E2)</span>
              <input type="number" step="0.01" value="${st.e2 || 81.68}" oninput="ROAD_APP.updateStatField('e2', this.value)" class="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono" />
            </label>
            <label class="flex flex-col gap-1">
              <span class="font-semibold">คะแนนเต็มแบบทดสอบ</span>
              <input type="number" value="${st.fullScore || 40}" oninput="ROAD_APP.updateStatField('fullScore', this.value)" class="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono" />
            </label>
            <label class="flex flex-col gap-1">
              <span class="font-semibold">ดัชนีประสิทธิผล (E.I.)</span>
              <input type="number" step="0.0001" value="${st.ei || 0.6842}" oninput="ROAD_APP.updateStatField('ei', this.value)" class="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono" />
            </label>
            <label class="flex flex-col gap-1">
              <span class="font-semibold">คะแนนก่อนเรียน (x̄ Pretest)</span>
              <input type="number" step="0.01" value="${st.preMean || 18.42}" oninput="ROAD_APP.updateStatField('preMean', this.value)" class="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono" />
            </label>
            <label class="flex flex-col gap-1">
              <span class="font-semibold">คะแนนหลังเรียน (x̄ Posttest)</span>
              <input type="number" step="0.01" value="${st.postMean || 32.67}" oninput="ROAD_APP.updateStatField('postMean', this.value)" class="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono" />
            </label>
            <label class="flex flex-col gap-1">
              <span class="font-semibold">ค่าสถิติ t-test</span>
              <input type="number" step="0.01" value="${st.tValue || 24.86}" oninput="ROAD_APP.updateStatField('tValue', this.value)" class="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono" />
            </label>
            <label class="flex flex-col gap-1">
              <span class="font-semibold">ค่าเฉลี่ยความพึงพอใจ (เต็ม 5)</span>
              <input type="number" step="0.01" value="${st.satMean || 4.62}" oninput="ROAD_APP.updateStatField('satMean', this.value)" class="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-mono" />
            </label>
          </div>
          <div class="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
            💡 เมื่อปรับตัวเลขด้านบน ระบบจะคำนวณค่า E2, ค่าดัชนีประสิทธิผล E.I. = (Post - Pre) / (Full - Pre) และเขียนคำแปลผลใต้ตารางบทที่ 4 และสรุปผลบทที่ 5 ให้อัตโนมัติทันที
          </div>
        </div>

        <!-- Right 2 Columns: Live APA 3-Line Tables Preview -->
        <div class="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-6">
          <h3 class="text-base font-bold text-slate-900 dark:text-white">📊 ตารางมาตรฐาน APA 3 เส้น และคำแปลผลอัตโนมัติ (บทที่ 4)</h3>
          ${ch4Tables.map(tbl => `
            <div class="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-5 last:border-b-0">
              <div class="font-bold text-sm">${escapeHtml(tbl.tableNo)} ${escapeHtml(tbl.caption)}</div>
              <div class="overflow-x-auto">
                <table class="w-full text-xs border-collapse border-t-2 border-b-2 border-slate-900 dark:border-slate-200">
                  <thead>
                    <tr class="border-b border-slate-900 dark:border-slate-200 bg-slate-50 dark:bg-slate-800">
                      ${tbl.headers.map(h => `<th class="py-2 px-2.5 text-center font-bold">${escapeHtml(h)}</th>`).join("")}
                    </tr>
                  </thead>
                  <tbody>
                    ${tbl.rows.map(r => `
                      <tr class="border-b border-slate-200/50 dark:border-slate-800">
                        ${r.map((c, ci) => `<td class="py-2 px-2.5 ${ci === 0 ? 'text-left font-medium' : 'text-center font-mono'}">${escapeHtml(c)}</td>`).join("")}
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
              <div class="text-xs text-slate-700 dark:text-slate-300 bg-emerald-50/70 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <b>คำแปลผลใต้ตาราง:</b> ${escapeHtml(tbl.interpretation)}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  // --- Studio Tab 6: AI Research Co-Pilot (Live Gemini API + Smart Prompt Generator) ---
  function renderTabAi(proj) {
    const currentPrompt = window.ROAD_GENERATOR.buildSmartPrompt(proj, state.aiTask);
    const tasks = [
      ["ch1_background", "1. เขียน 1.1 ความเป็นมาและความสำคัญของปัญหา (4–5 ย่อหน้าแบบกรวยคว่ำ)"],
      ["title_polish", "2. วิเคราะห์และเกลาชื่อเรื่องวิจัยตามหลัก ABCD (ระดับ คศ.3–คศ.4)"],
      ["ch1_definitions", "3. เขียน 1.6 นิยามศัพท์เฉพาะเชิงปฏิบัติการ (Operational Definitions)"],
      ["ch2_synthesis", "4. สังเคราะห์เอกสารและงานวิจัยที่เกี่ยวข้อง (บทที่ 2)"],
      ["ch5_discussion", "5. เขียน 5.2 อภิปรายผลการวิจัยเชื่อมโยงขั้นตอนนวัตกรรมและทฤษฎี"]
    ];

    return `
      <div class="grid lg:grid-cols-3 gap-6">
        <!-- Left Column: Gemini API Key & Task Selector -->
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col gap-4">
          <div>
            <span class="text-xs font-mono font-bold text-sky-700 uppercase">DUAL-MODE AI CO-PILOT</span>
            <h2 class="text-base font-bold text-slate-900 dark:text-white">ผู้ช่วย AI เขียนงานวิจัย R&D</h2>
            <p class="text-xs text-slate-500 mt-0.5">รองรับทั้งการใส่ Gemini API Key เพื่อสั่งเขียนสดในเว็บ และการคัดลอก Smart Prompt ไปวางใน ChatGPT / Gemini ฟรี</p>
          </div>

          <div class="p-3.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 flex flex-col gap-2">
            <label class="text-xs font-bold text-sky-900 dark:text-sky-300">🔑 ตั้งค่า Gemini API Key (สำหรับสั่งเขียนสดในเว็บ)</label>
            <div class="flex gap-2">
              <input id="gemini-key-input" type="password" value="${escapeHtml(state.geminiKey)}" placeholder="AIzaSy..." class="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono" />
              <button onclick="ROAD_APP.saveGeminiKey(document.getElementById('gemini-key-input').value)" class="px-3 py-1.5 rounded-lg bg-sky-700 text-white text-xs font-semibold cursor-pointer">บันทึก</button>
            </div>
            <div class="text-[11px] text-slate-500">
              รับคีย์ฟรีได้ที่ <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-sky-700 underline">Google AI Studio</a> (คีย์ถูกเก็บในเบราว์เซอร์ของคุณเท่านั้น)
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300">เลือกส่วนที่ต้องการให้ AI ช่วยเขียน:</label>
            ${tasks.map(([id, label]) => `
              <button onclick="ROAD_APP.setAiTask('${id}')" class="p-3 rounded-xl border text-left text-xs font-semibold transition cursor-pointer ${state.aiTask === id ? 'border-sky-700 bg-sky-50 dark:bg-sky-950/50 text-sky-900 dark:text-sky-200' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}">
                ${escapeHtml(label)}
              </button>
            `).join("")}
          </div>
        </div>

        <!-- Right 2 Columns: Smart Prompt & Live AI Output -->
        <div class="lg:col-span-2 flex flex-col gap-5">
          <!-- Smart Prompt Box -->
          <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col gap-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="font-bold text-sm text-slate-900 dark:text-white">📋 Smart Prompt ที่ระบบผูกตัวแปร ABCD ของคุณให้เรียบร้อยแล้ว</h3>
              <div class="flex gap-2">
                <button onclick="ROAD_APP.copySmartPrompt('${state.aiTask}')" class="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold hover:bg-slate-50 cursor-pointer">
                  📋 คัดลอก Smart Prompt (ใช้ฟรีใน ChatGPT/Gemini)
                </button>
                <button onclick="ROAD_APP.runGeminiLive('${state.aiTask}')" class="px-4 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold shadow-sm cursor-pointer" ${state.aiLoading ? 'disabled' : ''}>
                  ${state.aiLoading ? '⏳ กำลังสั่ง Gemini เขียนเนื้อหา...' : '⚡ สั่ง Gemini เขียนสดในเว็บทันที'}
                </button>
              </div>
            </div>
            <textarea readonly rows="7" class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-700 dark:text-slate-300">${escapeHtml(currentPrompt)}</textarea>
          </div>

          <!-- AI Output Box -->
          <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col gap-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="font-bold text-sm text-slate-900 dark:text-white">✨ ผลลัพธ์เนื้อหาวิชาการจาก AI (สามารถแก้ไขเพิ่มเติมแล้วกดนำไปใส่ในเล่มวิจัยได้ทันที)</h3>
              <button onclick="ROAD_APP.applyAiOutputToChapter()" class="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer">
                ✔ นำเนื้อหานี้ไปใส่ในรายงานวิจัย 5 บท
              </button>
            </div>
            <textarea oninput=" ROAD_APP_SET_AI_OUTPUT(this.value)" rows="10" placeholder="กดปุ่ม 'สั่ง Gemini เขียนสดในเว็บทันที' หรือวางเนื้อหาที่ได้จาก ChatGPT/Gemini ลงในช่องนี้เพื่อนำไปแทรกในบทที่ 1 หรือบทที่ 5..." class="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm leading-relaxed">${escapeHtml(state.aiOutput)}</textarea>
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
    const vocab = window.ROAD_DATA.ABCD_SUGGESTIONS;
    const tab = state.abcdModalTab || "manual";
    const parsed = state.abcdParsedResult || window.ROAD_GENERATOR.parseTitleToABCD(state.abcdParseInput || window.ROAD_GENERATOR.composeFullTitle(proj));

    return `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-fade-in print:hidden">
        <div class="neu-card max-w-4xl w-full p-5 sm:p-8 my-auto max-h-[92vh] flex flex-col gap-5 overflow-y-auto relative shadow-2xl">
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
                <input value="${escapeHtml(proj.D)}" oninput="ROAD_APP.updateField('D', this.value); ROAD_APP.renderLiveTitleBar();" class="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-800 dark:text-white" placeholder="เช่น สำหรับนักเรียนชั้นมัธยมศึกษาปีที่ 3 โรงเรียนผดุงนารี" />
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

  function renderFooter() {
    if (state.view === "slides") return "";
    return `
      <footer class="max-w-7xl mx-auto px-4 py-8 mt-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 print:hidden">
        <b class="text-slate-800 dark:text-slate-200">ระบบ ROAD Next-Gen (R&D Research Studio & AI Co-Pilot)</b> · Report Outline Assistant for Development · จากชื่อเรื่องสู่รายงานการวิจัย 5 บท<br/>
        พัฒนาต่อยอดจากแนวคิดการบรรยายและอบรมของ รศ.ดร.ชวลิต ชูกำแพง คณะศึกษาศาสตร์ มหาวิทยาลัยมหาสารคาม
      </footer>
    `;
  }

  function renderApp() {
    const root = document.getElementById("app-root");
    if (!root) return;
    let mainHtml = "";
    if (state.view === "login") mainHtml = renderLoginView();
    else if (state.view === "signup") mainHtml = renderSignupView();
    else if (state.view === "admin") mainHtml = renderAdminView();
    else if (state.view === "slides") mainHtml = renderSlidesView();
    else mainHtml = renderStudioView();

    root.innerHTML = `${renderTopNavbar()}<main>${mainHtml}</main>${renderFooter()}${state.showAbcdModal ? renderCustomAbcdModal() : ""}`;
  }

  window.addEventListener("DOMContentLoaded", () => {
    loadStorage();
    renderApp();
  });
})();
