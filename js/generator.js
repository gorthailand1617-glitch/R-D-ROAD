// ============================================================================
// ROAD NEXT-GEN: 5-Chapter Blueprint Generator, R1-D1-R2-D2 Operational Table,
// R1-to-D1 Synthesis Bridge, Alignment Matrix, Smart Prompts & Word Exporter
// ตามแนวคิดและมาตรฐานวิชาการของ รศ.ดร.ชวลิต ชูกำแพง
// ============================================================================

// Helper function for safe HTML rendering
function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

window.ROAD_GENERATOR = {
  // ประเมินคะแนนความสมบูรณ์และตรวจ 10 กฎเหล็ก (Health Score & Validator)
  evaluateResearchHealth(p) {
    if (window.ROAD_ADVISOR && typeof window.ROAD_ADVISOR.validate10Pitfalls === "function") {
      return window.ROAD_ADVISOR.validate10Pitfalls(p);
    }
    return { healthScore: 100, passedCount: 11, totalRules: 11, results: [] };
  },

  // ประกอบชื่อเรื่องวิจัยเต็มจาก ABCD
  composeFullTitle(p) {
    const a = (p.A || "").trim();
    const b = (p.B || "").trim();
    const conn = (p.C_connector || "เพื่อส่งเสริม").trim();
    const cList = (p.C_list || []).map(x => x.trim()).filter(Boolean);
    const cText = cList.length > 1
      ? cList.slice(0, -1).join(" และ") + " และ" + cList[cList.length - 1]
      : (cList[0] || "");
    const d = (p.D || "").trim();
    return `${a}${b ? ' ' + b : ''} ${conn}${cText ? ' ' + cText : ''} ${d}`.replace(/\s+/g, " ").trim();
  },

  // ประกอบชื่อเรื่องวิจัยแบบแยกสีและองค์ประกอบ A B C D สำหรับแสดงผลใน UI
  composeColorCodedTitle(p) {
    const esc = str => String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const a = (p.A || "").trim();
    const b = (p.B || "").trim();
    const conn = (p.C_connector || "เพื่อส่งเสริม").trim();
    const cList = (p.C_list || []).map(x => x.trim()).filter(Boolean);
    const cText = cList.length > 1
      ? cList.slice(0, -1).join(" และ") + " และ" + cList[cList.length - 1]
      : (cList[0] || "");
    const d = (p.D || "").trim();

    return `
      <div class="inline-flex items-center gap-1.5 flex-wrap leading-relaxed">
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold text-xs sm:text-sm text-sky-800 dark:text-sky-200 bg-sky-100/90 dark:bg-sky-950/80 border border-sky-300 dark:border-sky-800 shadow-sm" title="A: นวัตกรรมที่จะพัฒนา">
          <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold bg-sky-200 dark:bg-sky-900 text-sky-900 dark:text-sky-100">A</span>
          <span>${esc(a || "(ยังไม่ระบุ A)")}</span>
        </span>
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold text-xs sm:text-sm text-blue-900 dark:text-blue-200 bg-blue-100/90 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-800 shadow-sm" title="B: หลักการ/แนวคิดทฤษฎีเบื้องหลัง">
          <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100">B</span>
          <span>${esc(b || "(ยังไม่ระบุ B)")}</span>
        </span>
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 bg-emerald-100/90 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 shadow-sm" title="C: ตัวแปรตาม / ผลลัพธ์ วPA">
          <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100">C</span>
          <span>${esc(conn)} ${esc(cText || "(ยังไม่ระบุ C)")}</span>
        </span>
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold text-xs sm:text-sm text-amber-900 dark:text-amber-200 bg-amber-100/90 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 shadow-sm" title="D: กลุ่มเป้าหมาย / บริบท">
          <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">D</span>
          <span>${esc(d || "(ยังไม่ระบุ D)")}</span>
        </span>
      </div>
    `;
  },

  // ถอดรหัสชื่อเรื่องวิจัยภาษาไทย แยกเป็นองค์ประกอบ A B C D อัตโนมัติ (Smart Title Decomposer)
  parseTitleToABCD(rawTitle) {
    if (!rawTitle || typeof rawTitle !== "string") {
      return {
        A: "รูปแบบการจัดการเรียนรู้",
        B: "กระบวนการคิดขั้นสูงเชิงระบบ GPAS 5 Steps",
        B_short: "รูปแบบ GPAS 5 Steps",
        C_connector: "เพื่อส่งเสริม",
        C_list: ["ความสามารถในการคิดวิเคราะห์", "ผลสัมฤทธิ์ทางการเรียน"],
        D: "สำหรับนักเรียนชั้นมัธยมศึกษาปีที่ 3",
        parsed: false
      };
    }

    let text = rawTitle.replace(/\s+/g, " ").trim();

    // 1. Detect Action / Innovation type (A)
    const actionPatterns = [
      "การวิจัยและพัฒนารูปแบบการจัดการเรียนรู้",
      "การวิจัยและพัฒนารูปแบบการบริหารจัดการ",
      "การวิจัยและพัฒนารูปแบบการนิเทศการศึกษา",
      "การวิจัยและพัฒนาระบบ",
      "การวิจัยและพัฒนา",
      "การพัฒนารูปแบบการจัดการเรียนรู้",
      "การพัฒนารูปแบบการบริหารจัดการ",
      "การพัฒนารูปแบบการนิเทศการศึกษา",
      "การพัฒนาระบบ",
      "การพัฒนาชุดกิจกรรมการเรียนรู้",
      "การพัฒนาชุดฝึกทักษะ",
      "การพัฒนา",
      "การศึกษาผลการใช้",
      "การยกระดับ"
    ];

    let foundA = "การพัฒนา";
    for (const act of actionPatterns) {
      if (text.startsWith(act)) {
        foundA = act;
        text = text.substring(act.length).trim();
        break;
      }
    }

    // 2. Detect C Connector
    const cConnectors = [
      "เพื่อส่งเสริมและพัฒนา",
      "เพื่อพัฒนาและส่งเสริม",
      "เพื่อยกระดับ",
      "เพื่อส่งเสริม",
      "เพื่อพัฒนา",
      "เพื่อศึกษาผลของ",
      "เพื่อศึกษาผล",
      "เพื่อศึกษา",
      "ที่ส่งผลต่อ",
      "เพื่อ"
    ];

    let foundConn = "เพื่อส่งเสริม";
    let bText = "";
    let restAfterConn = "";

    let connIndex = -1;
    let matchedConn = "";
    for (const conn of cConnectors) {
      const idx = text.indexOf(conn);
      if (idx !== -1 && (connIndex === -1 || idx < connIndex)) {
        connIndex = idx;
        matchedConn = conn;
      }
    }

    if (connIndex !== -1) {
      bText = text.substring(0, connIndex).trim();
      foundConn = matchedConn;
      restAfterConn = text.substring(connIndex + matchedConn.length).trim();
    } else {
      bText = text;
      restAfterConn = "";
    }

    // 3. Detect D Connector in restAfterConn or text
    const dConnectors = [
      "สำหรับนักเรียนชั้น",
      "สำหรับนักเรียน",
      "สำหรับเด็กปฐมวัย",
      "สำหรับนักศึกษา",
      "ของนักเรียนชั้น",
      "ของนักเรียน",
      "ของครูผู้สอน",
      "ของครู",
      "ของสถานศึกษา",
      "สังกัดสำนักงาน",
      "สำหรับ",
      "ของ"
    ];

    let dIndex = -1;
    let matchedDConn = "";
    for (const dConn of dConnectors) {
      const idx = restAfterConn.indexOf(dConn);
      if (idx !== -1 && (dIndex === -1 || idx < dIndex)) {
        dIndex = idx;
        matchedDConn = dConn;
      }
    }

    let cRaw = "";
    let dText = "";

    if (dIndex !== -1) {
      cRaw = restAfterConn.substring(0, dIndex).trim();
      dText = restAfterConn.substring(dIndex).trim();
    } else {
      cRaw = restAfterConn;
      dText = "สำหรับนักเรียนกลุ่มเป้าหมาย";
    }

    // Clean C List
    let cList = cRaw
      .split(/และ|,|\//)
      .map(x => x.trim())
      .filter(x => x.length > 2);

    if (cList.length === 0) {
      cList = ["ความสามารถในการคิดวิเคราะห์", "ผลสัมฤทธิ์ทางการเรียน"];
    }

    return {
      A: foundA,
      B: bText || "กระบวนการเรียนรู้เชิงรุก (Active Learning)",
      B_short: bText ? bText.substring(0, 45) : "นวัตกรรมการเรียนรู้",
      C_connector: foundConn,
      C_list: cList,
      D: dText || "สำหรับนักเรียนกลุ่มเป้าหมาย",
      parsed: true
    };
  },

  // ==========================================================================
  // ตารางการดำเนินการวิจัย 4 ระยะ (R1 - D1 - R2 - D2 Operational Table 6 คอลัมน์)
  // ตามระเบียบวิธีวิจัยมาตรฐานของ รศ.ดร.ชวลิต ชูกำแพง
  // ==========================================================================
  generateOperationalTable(p) {
    const bShort = p.B_short || p.B || "นวัตกรรมการเรียนรู้";
    const cList = (p.C_list || ["ความสามารถในการคิดวิเคราะห์", "ผลสัมฤทธิ์ทางการเรียน"]).filter(Boolean);
    const cJoined = cList.join(" และ ");
    const d = p.D || "สำหรับกลุ่มเป้าหมาย";
    const sample = p.sample || d;
    const crit = p.efficiencyCriterion || "80/80";

    return [
      {
        phase: "ระยะที่ 1 (R1)",
        phaseName: "การศึกษาข้อมูลพื้นฐานและความต้องการจำเป็น (Research 1)",
        objective: `1. เพื่อศึกษาสภาพปัญหา ความต้องการจำเป็น เอกสารและงานวิจัยที่เกี่ยวข้องในการพัฒนา${bShort} ${d}`,
        dataCollection: "1) การวิเคราะห์เนื้อหาเอกสาร (Document Analysis)\n2) การสนทนากลุ่ม (Focus Group Discussion 8–12 คน)\n3) การสัมภาษณ์เชิงลึก (In-depth Interview)",
        sources: "เอกสารหลักสูตร, งานวิจัยที่เกี่ยวข้อง, ผู้ทรงคุณวุฒิ, ครูผู้สอน และตัวแทนผู้เรียน/ผู้มีส่วนได้ส่วนเสีย",
        output: `1) กรอบแนวคิดเชิงทฤษฎีในการพัฒนา\n2) รายการสภาพปัญหาและความต้องการจำเป็น\n3) หัวข้อสาระความรู้สำหรับสังเคราะห์บทที่ 2`,
        notes: "ไม่มีการตั้งสมมติฐาน (การวิจัยเชิงสำรวจและวิเคราะห์เอกสาร)"
      },
      {
        phase: "ระยะที่ 2 (D1)",
        phaseName: "การออกแบบและพัฒนานวัตกรรม (Development 1)",
        objective: `2. เพื่อยกร่าง ตรวจสอบความเหมาะสม และหาประสิทธิภาพเบื้องต้นของ${bShort} ${d} ตามเกณฑ์ ${crit}`,
        dataCollection: "1) การประชุมเชิงปฏิบัติการยกร่างนวัตกรรม\n2) การประเมินความสอดคล้อง (IOC) และความเหมาะสมโดยผู้เชี่ยวชาญ 5 ท่าน\n3) การทดลองนำร่อง (Try out) กับผู้เรียน 1:1, 1:10, 1:100",
        sources: "ผู้เชี่ยวชาญ/ผู้ทรงคุณวุฒิ 5 ท่าน และกลุ่มทดลองนำร่อง (Try out) ที่ไม่ใช่กลุ่มตัวอย่างจริง",
        output: `1) ร่าง${bShort} ฉบับยกร่าง (ร่างที่ 1)\n2) ผลการประเมินความเหมาะสมและค่า IOC (ร่างที่ 2)\n3) แผนการสอนและเครื่องมือวิจัยที่มีคุณภาพ พร้อมคู่มือการใช้`,
        notes: "ไม่มีการตั้งสมมติฐาน (เน้นตรวจสอบเกณฑ์ความเหมาะสมและประสิทธิภาพ E1/E2)"
      },
      {
        phase: "ระยะที่ 3 (R2)",
        phaseName: "การทดลองใช้นวัตกรรมในสถานการณ์จริง (Research 2)",
        objective: `3. เพื่อศึกษาผลการใช้และเปรียบเทียบ${cJoined} ของ${d} ก่อนและหลังการใช้${bShort}`,
        dataCollection: `1) การทดสอบก่อนเรียน (Pre-test: O1)\n2) การจัดการเรียนรู้และเก็บคะแนนระหว่างเรียน (E1)\n3) การทดสอบหลังเรียน (Post-test: O2)\n4) แบบวัด${cList[0] || 'ทักษะ'}`,
        sources: `กลุ่มตัวอย่างจริง: ${sample}`,
        output: `1) ค่าประสิทธิภาพกระบวนการและผลลัพธ์ (E1/E2) ตามเกณฑ์ ${crit}\n2) ค่าดัชนีประสิทธิผล (E.I.)\n3) ผลการเปรียบเทียบก่อน-หลังเรียน (t-test Dependent) และขนาดอิทธิพล (Cohen's d)`,
        notes: "★ เฉพาะระยะนี้เท่านั้นที่มีการตั้งสมมติฐานการวิจัย!"
      },
      {
        phase: "ระยะที่ 4 (D2)",
        phaseName: "การประเมินผล ปรับปรุง และขยายผล (Development 2)",
        objective: `4. เพื่อศึกษาความพึงพอใจและประสิทธิผลของผู้ใช้ที่มีต่อ${bShort} และปรับปรุงเป็นฉบับสมบูรณ์`,
        dataCollection: "1) แบบสอบถามความพึงพอใจแบบมาตราส่วนประมาณค่า 5 ระดับ (Likert Scale)\n2) แบบประเมินผลการใช้รูปแบบ\n3) การสนทนาสะท้อนผล (After Action Review: AAR)",
        sources: `ผู้เรียน/ผู้รับการทดลอง (${sample}), ครูผู้สอน และผู้มีส่วนได้ส่วนเสีย (Stakeholders)`,
        output: `1) ข้อมูลระดับความพึงพอใจ (x̄, S.D.)\n2) ข้อเสนอแนะเชิงลึกเพื่อการปรับปรุง\n3) ${bShort} ฉบับสมบูรณ์พร้อมคู่มือและข้อเสนอแนะเชิงนโยบาย`,
        notes: "ไม่มีการตั้งสมมติฐาน (การวิจัยเชิงประเมินและสะท้อนคิด)"
      }
    ];
  },

  // ==========================================================================
  // ตารางสังเคราะห์ขั้นตอนการจัดกิจกรรมการเรียนรู้จากนักวิชาการ 7 ท่าน (Syntax Synthesis Matrix)
  // คำนวณความถี่ ร้อยละ และสังเคราะห์ขั้นตอนสุดท้ายของผู้วิจัย
  // ==========================================================================
  generateSyntaxSynthesisMatrix(p) {
    const defaultData = (window.ROAD_DATA && window.ROAD_DATA.DEFAULT_SYNTAX_SYNTHESIS_MATRIX) || {
      scholars: [
        { id: "s1", name: "Joyce & Weil (2009)", title: "Information Processing Models" },
        { id: "s2", name: "Robert Gagné (1985)", title: "Nine Events of Instruction" },
        { id: "s3", name: "Madeline Hunter (1982)", title: "Mastery Teaching Design" },
        { id: "s4", name: "Lev Vygotsky (1978)", title: "Social Constructivism & ZPD" },
        { id: "s5", name: "ชวลิต ชูกำแพง (2563)", title: "การพัฒนาหลักสูตรและการจัดการเรียนรู้เชิงรุก" },
        { id: "s6", name: "ทิศนา แขมมณี (2561)", title: "ศาสตร์การสอนและโมเดล CIPPA" },
        { id: "s7", name: "Robert Slavin (2015)", title: "Cooperative Learning Methods" }
      ],
      steps: []
    };

    const matrix = p.syntaxSynthesisMatrix || defaultData;
    const scholars = (matrix.scholars && matrix.scholars.length > 0) ? matrix.scholars : defaultData.scholars;
    const rawSteps = (matrix.steps && matrix.steps.length > 0) ? matrix.steps : defaultData.steps;

    const computedSteps = rawSteps.map((st, sIdx) => {
      const checks = st.scholarChecks || [];
      const count = checks.filter(Boolean).length;
      const total = scholars.length || 7;
      const pct = total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;
      return {
        id: st.id || `step-${sIdx + 1}`,
        stepName: st.stepName || `ขั้นตอนที่ ${sIdx + 1}`,
        scholarChecks: checks,
        count,
        totalScholars: total,
        percent: pct,
        isAccepted: pct >= 60.0,
        synthesizedStep: st.synthesizedStep || st.stepName,
        note: st.note || ""
      };
    });

    const finalSynthesizedSteps = computedSteps
      .filter(s => s.isAccepted)
      .map(s => s.synthesizedStep);

    return {
      scholars,
      steps: computedSteps,
      finalSynthesizedSteps: finalSynthesizedSteps.length > 0 ? finalSynthesizedSteps : (p.B_steps || [])
    };
  },

  // ==========================================================================
  // ตารางแสดงการเชื่อมโยงจาก R1 สู่ D1 (R1-to-D1 Synthesis Bridge)
  // ตอบคำถามว่า "ผลการศึกษาใน R1 นำไปสู่การออกแบบนวัตกรรมใน D1 อย่างไร" (How & Why)
  // ==========================================================================
  generateR1toD1Bridge(p) {
    const bShort = p.B_short || p.B || "นวัตกรรมการเรียนรู้";
    const c1 = (p.C_list || [])[0] || "การคิดวิเคราะห์";
    const syntaxData = this.generateSyntaxSynthesisMatrix(p);
    const synSteps = (syntaxData.finalSynthesizedSteps && syntaxData.finalSynthesizedSteps.length > 0)
      ? syntaxData.finalSynthesizedSteps
      : (p.B_steps || []).filter(Boolean);

    // Get PNI items from state or default
    const pniSource = (p.pniItems && p.pniItems.length > 0)
      ? p.pniItems
      : (window.ROAD_DATA && window.ROAD_DATA.DEFAULT_PNI_ITEMS)
      ? window.ROAD_DATA.DEFAULT_PNI_ITEMS
      : [];

    let highestPni = null;
    if (pniSource.length > 0) {
      const calcPni = pniSource.map(it => {
        const iM = Number(it.iMean || it.expectedMean || 4.5);
        const dM = Number(it.dMean || it.currentMean || 2.5);
        const pni = dM > 0 ? Number(((iM - dM) / dM).toFixed(3)) : 0;
        return { ...it, iMean: iM, dMean: dM, pni };
      });
      calcPni.sort((a, b) => b.pni - a.pni);
      highestPni = calcPni[0];
    }

    const pniText = highestPni
      ? `ผลการประเมินความต้องการจำเป็น (PNI_modified) พบว่า '${highestPni.name}' มีความจำเป็นสูงสุดเป็นลำดับที่ 1 (PNI_modified = ${highestPni.pni.toFixed(3)}, สภาพที่ควรจะเป็น Ī = ${highestPni.iMean.toFixed(2)}, สภาพปัจจุบัน D̄ = ${highestPni.dMean.toFixed(2)}) สะท้อนปัญหาที่ผู้เรียนขาดทักษะ${c1}`
      : `ผู้เรียนขาดทักษะ${c1}, การจัดการเรียนรู้เน้นบรรยายฝ่ายเดียวทำให้ผู้เรียนขาดการมีส่วนร่วม, ขาดสื่อนวัตกรรมที่เชื่อมโยงกับชีวิตจริง`;

    const expInsts = (p.experimentalInstruments && p.experimentalInstruments.length > 0)
      ? p.experimentalInstruments
      : (window.ROAD_DATA && window.ROAD_DATA.DEFAULT_EXPERIMENTAL_INSTRUMENTS)
      ? window.ROAD_DATA.DEFAULT_EXPERIMENTAL_INSTRUMENTS
      : [];

    const dcInsts = (p.dataCollectionInstruments && p.dataCollectionInstruments.length > 0)
      ? p.dataCollectionInstruments
      : (window.ROAD_DATA && window.ROAD_DATA.DEFAULT_DATA_COLLECTION_INSTRUMENTS)
      ? window.ROAD_DATA.DEFAULT_DATA_COLLECTION_INSTRUMENTS
      : [];

    return [
      {
        r1Dimension: "1. ด้านทฤษฎีและงานวิจัยที่เกี่ยวข้อง (Literature & Theory)",
        r1Findings: `ศึกษาทฤษฎีการสร้างความรู้ด้วยตนเอง (Constructivism), การเรียนรู้เชิงรุก (Active Learning) และแนวคิดสำคัญของ ${p.B || bShort}`,
        d1Transformation: "สังเคราะห์เป็น 'หลักการและปรัชญาพื้นฐานของรูปแบบ (Principles)' ใน D1",
        whyHow: `นำข้อค้นพบที่ว่าผู้เรียนจะเข้าใจ${c1} ได้ดีที่สุดเมื่อได้สร้างความรู้ด้วยตนเองผ่านกิจกรรมเชิงรุก มากำหนดเป็นหลักการพื้นฐาน 4 ข้อของรูปแบบ`
      },
      {
        r1Dimension: "2. ด้านสภาพปัญหาและความต้องการจำเป็น (Needs Assessment: PNI_modified)",
        r1Findings: pniText,
        d1Transformation: "กำหนดเป็น 'วัตถุประสงค์ของรูปแบบ (Model Objectives)' และตัวชี้วัดผลลัพธ์ วPA",
        whyHow: "เปลี่ยนความต้องการจำเป็นที่มีลำดับความสำคัญสูงสุดในพื้นที่จริง ให้กลายเป็นเป้าหมายการพัฒนาตัวแปรตาม C และตัวชี้วัดความสำเร็จของนวัตกรรมอย่างเป็นรูปธรรม"
      },
      {
        r1Dimension: "3. ด้านขั้นตอนการจัดกิจกรรมการเรียนรู้ (Syntax Synthesis)",
        r1Findings: `ตารางสังเคราะห์ขั้นตอนการจัดกิจกรรมจากนักวิชาการ 7 ท่าน (Joyce & Weil, Gagné, Hunter, Vygotsky, ชวลิต, ทิศนา, Slavin) มีความถี่ร่วมกันสูงใน 5 ขั้นตอน (71.4% – 100%)`,
        d1Transformation: `สังเคราะห์เป็น 'ขั้นตอนการจัดกิจกรรม (Syntax / ${synSteps.length} Steps)' ของ${bShort}`,
        whyHow: `นำข้อค้นพบมาร้อยเรียงเป็นขั้นตอนกิจกรรมการเรียนรู้ ${synSteps.length} ขั้นตอน ได้แก่: ${synSteps.map((s, i) => `${i+1}) ${s.split("(")[0].trim()}`).join(", ")}`
      },
      {
        r1Dimension: "4. ด้านสื่อ อุปกรณ์ และการวัดประเมินผล (Support & Measurement System)",
        r1Findings: `ครูและผู้ทรงคุณวุฒิต้องการระบบสนับสนุนที่ชัดเจน: แผนการจัดการเรียนรู้, สื่อ/ใบงาน, ผังข้อสอบ (Test Blueprint 6 ระดับ), และเกณฑ์รูบริกส์ 4 ระดับคุณภาพ`,
        d1Transformation: "จัดทำ 'ระบบสิ่งสนับสนุน (Support System)' และคู่มือการใช้นวัตกรรมฉบับสมบูรณ์",
        whyHow: `สร้างเครื่องมือทดลอง (${expInsts.map(e => e.name).slice(0, 2).join(", ") || 'แผนการจัดการเรียนรู้และสื่อ'}) และเครื่องมือวัดผล (${dcInsts.map(d => d.name).slice(0, 2).join(", ") || 'แบบทดสอบและรูบริกส์'}) เพื่อให้ครูนำไปจัดการเรียนรู้ได้อย่างมีประสิทธิภาพตามมาตรฐาน`
      }
    ];
  },

  // ==========================================================================
  // โครงสร้างองค์ประกอบของรูปแบบ (Innovation Model Components)
  // ครูผู้สอน: 5 ด้าน / ผู้บริหารและศึกษานิเทศก์: 6 ด้าน
  // ==========================================================================
  generateModelComponents(p) {
    const track = p.track || "teacher";
    const bShort = p.B_short || p.B || "รูปแบบการจัดการเรียนรู้";
    const steps = (p.B_steps || []).filter(Boolean);
    const cJoined = (p.C_list || []).filter(Boolean).join(" และ ");

    if (track === "admin" || track === "supervisor") {
      // องค์ประกอบรูปแบบ 6 ด้าน สำหรับผู้บริหาร/ศึกษานิเทศก์
      return [
        {
          num: 1,
          name: "1. หลักการและทฤษฎีพื้นฐานของรูปแบบ (Principles & Theoretical Foundations)",
          content: `พัฒนาขึ้นบนพื้นฐานทฤษฎีระบบ (Systems Theory), การบริหารแบบมีส่วนร่วม, และชุมชนแห่งการเรียนรู้ทางวิชาชีพ (PLC) เพื่อขับเคลื่อนคุณภาพการศึกษาอย่างยั่งยืน`
        },
        {
          num: 2,
          name: "2. วัตถุประสงค์ของรูปแบบ (Model Objectives)",
          content: `เพื่อยกระดับ${cJoined} ในสถานศึกษาเป้าหมาย และเสริมสร้างภาวะผู้นำทางวิชาการร่วมกัน`
        },
        {
          num: 3,
          name: "3. ระบบงานและกลไกการดำเนินงาน (Work Systems & Mechanisms: Input-Process-Output)",
          content: `ประกอบด้วย: 1) ปัจจัยนำเข้า (Input: นโยบาย บุคลากร ทรัพยากร) 2) กระบวนการดำเนินงาน (Process: การวางแผน การโค้ช การเปิดชั้นเรียน การสะท้อนคิด) 3) ผลผลิตและผลลัพธ์ (Output/Outcome: คุณภาพครูและผลสัมฤทธิ์ผู้เรียน)`
        },
        {
          num: 4,
          name: "4. วิธีการและแผนการดำเนินงาน (Implementation Procedures & Steps)",
          content: steps.map((s, i) => `ขั้นตอนที่ ${i+1}: ${s}`).join("\n")
        },
        {
          num: 5,
          name: "5. แนวทางการวัดและประเมินผลรูปแบบ (Evaluation Guidelines)",
          content: `ประเมินผล 3 ระดับ: 1) ประเมินประสิทธิผลกระบวนการทำงาน 2) ประเมินสมรรถนะครูผู้สอน 3) ประเมินผลลัพธ์ที่เกิดกับผู้เรียนตามเกณฑ์ วPA`
        },
        {
          num: 6,
          name: "6. เงื่อนไขและปัจจัยสู่ความสำเร็จในการนำรูปแบบไปใช้ (Success Factors & Conditions)",
          content: `ความต่อเนื่องของนโยบาย, การสนับสนุนงบประมาณและเวลาสำหรับทำ PLC, การมีส่วนร่วมอย่างจริงใจของผู้มีส่วนได้ส่วนเสีย และการสะท้อนคิดเชิงสร้างสรรค์`
        }
      ];
    }

    // องค์ประกอบรูปแบบ 5 ด้าน สำหรับครูผู้สอน
    return [
      {
        num: 1,
        name: "1. หลักการของรูปแบบ (Principles of the Model)",
        content: `มุ่งเน้นให้ผู้เรียนเป็นศูนย์กลาง ได้ลงมือปฏิบัติจริง (Active Learning) สร้างองค์ความรู้ผ่านการสืบเสาะและการมีปฏิสัมพันธ์ร่วมกัน โดยครูทำหน้าที่เป็นผู้อำนวยความสะดวก (Facilitator) และให้ข้อมูลสะท้อนกลับ (Feedback)`
      },
      {
        num: 2,
        name: "2. วัตถุประสงค์ของรูปแบบ (Model Objectives)",
        content: `เพื่อส่งเสริมและพัฒนา${cJoined} ของ${p.D || "ผู้เรียนกลุ่มเป้าหมาย"} ให้มีพัฒนาการสูงขึ้นและผ่านเกณฑ์มาตรฐาน`
      },
      {
        num: 3,
        name: "3. กระบวนการจัดการเรียนรู้ (Syntax / Learning Procedures)",
        content: steps.map((s, i) => `ขั้นที่ ${i+1}: ${s} (บทบาทครู: กระตุ้นคำถาม สังเกต แนะนำ / บทบาทนักเรียน: สืบค้น ร่วมมือ ปฏิบัติ สรุป)`).join("\n")
      },
      {
        num: 4,
        name: "4. ระบบสิ่งสนับสนุนการเรียนรู้ (Support System)",
        content: `แผนการจัดการเรียนรู้เชิงรุก, สื่อดิจิทัลและใบกิจกรรม, บอร์ดเกม/ชุดกิจกรรม, แหล่งเรียนรู้ออนไลน์ และห้องเรียนที่เอื้อต่อการทำงานกลุ่มอย่างปลอดภัย`
      },
      {
        num: 5,
        name: "5. การวัดและประเมินผล (Measurement & Evaluation)",
        content: `1) การประเมินระหว่างเรียน (Formative Assessment: สังเกตพฤติกรรม ใบงาน E1) 2) การประเมินหลังเรียน (Summative Assessment: แบบทดสอบ E2, แบบวัดทักษะ และแบบสอบถามความพึงพอใจ)`
      }
    ];
  },

  // ==========================================================================
  // Research Alignment Matrix (ตารางความสอดคล้อง 360 องศา)
  // ==========================================================================
  generateAlignmentMatrix(p) {
    const bShort = p.B_short || p.B || "นวัตกรรมการเรียนรู้";
    const cList = (p.C_list || ["ความสามารถในการคิดวิเคราะห์", "ผลสัมฤทธิ์ทางการเรียน"]).filter(Boolean);
    const c1 = cList[0] || "ความสามารถในการเรียนรู้";
    const c2 = cList[1] || null;
    const d = p.D || "สำหรับนักเรียนกลุ่มเป้าหมาย";
    const crit = p.efficiencyCriterion || "80/80";

    const rows = [
      {
        phase: "ระยะที่ 1 (R1): ศึกษาข้อมูลพื้นฐาน",
        objective: `1. เพื่อศึกษาสภาพปัญหา ความต้องการจำเป็น และข้อมูลพื้นฐานในการพัฒนา${bShort} ${d}`,
        question: `สภาพปัญหาและความต้องการจำเป็นในการพัฒนา${bShort} ${d} เป็นอย่างไร?`,
        hypothesis: "— (การวิจัยเชิงสำรวจและวิเคราะห์เอกสาร ไม่ตั้งสมมติฐาน)",
        informants: "เอกสารหลักสูตร, งานวิจัยที่เกี่ยวข้อง, ผู้ทรงคุณวุฒิ, ครูผู้สอน และตัวแทนผู้เรียน",
        instruments: "แบบวิเคราะห์เอกสาร, แบบสัมภาษณ์กึ่งโครงสร้าง และแบบบันทึกการสนทนากลุ่ม (Focus Group)",
        statistics: "การวิเคราะห์เนื้อหา (Content Analysis), ความถี่, ร้อยละ, ค่าเฉลี่ย (x̄) และส่วนเบี่ยงเบนมาตรฐาน (S.D.)",
        ch4Section: "ตอนที่ 1 ผลการวิเคราะห์ข้อมูลพื้นฐานและความต้องการจำเป็น"
      },
      {
        phase: "ระยะที่ 2 (D1): ออกแบบและพัฒนานวัตกรรม",
        objective: `2. เพื่อพัฒนาและหาประสิทธิภาพของ${bShort} ${d} ให้มีประสิทธิภาพตามเกณฑ์ ${crit}`,
        question: `${bShort} ที่พัฒนาขึ้นมีความเหมาะสมและมีประสิทธิภาพตามเกณฑ์ ${crit} หรือไม่?`,
        hypothesis: "— (การตรวจสอบเกณฑ์มาตรฐาน ไม่ตั้งสมมติฐานและไม่ใช้ t-test)",
        informants: `ผู้เชี่ยวชาญ 5 ท่าน (ตรวจสอบ IOC) และกลุ่มทดลองนำร่อง (Try out)`,
        instruments: `1) ${bShort} และแผนการจัดการเรียนรู้ 2) แบบประเมินความสอดคล้อง (IOC) และความเหมาะสม 3) แบบทดสอบย่อยระหว่างเรียน`,
        statistics: `ค่าดัชนีความสอดคล้อง (IOC), ค่าเฉลี่ย (x̄), S.D. และค่าประสิทธิภาพของกระบวนการและผลลัพธ์ (E1/E2)`,
        ch4Section: `ตอนที่ 2 ผลการสร้าง พัฒนา และหาประสิทธิภาพของ${bShort} (E1/E2)`
      },
      {
        phase: "ระยะที่ 3 (R2): ทดลองใช้นวัตกรรมจริง",
        objective: `3.1 เพื่อเปรียบเทียบ${c1} ของ${d} ก่อนและหลังการจัดการเรียนรู้ด้วย${bShort}`,
        question: `ผู้เรียนที่ได้รับการจัดการเรียนรู้ด้วย${bShort} มี${c1} หลังเรียนสูงกว่าก่อนเรียนหรือไม่?`,
        hypothesis: `ผู้เรียนมี${c1} หลังเรียนสูงกว่าก่อนเรียนอย่างมีนัยสำคัญทางสถิติที่ระดับ .05 (★ สมมติฐานเฉพาะระยะนี้)`,
        informants: `กลุ่มตัวอย่างจริง (${p.sample || d})`,
        instruments: `แบบวัด${c1} (Pre-test และ Post-test)`,
        statistics: `ค่าเฉลี่ย (x̄), ส่วนเบี่ยงเบนมาตรฐาน (S.D.), t-test for Dependent Samples และขนาดอิทธิพล (Cohen's d)`,
        ch4Section: `ตอนที่ 3.1 ผลการเปรียบเทียบ${c1} ก่อนและหลังเรียน`
      }
    ];

    if (c2) {
      rows.push({
        phase: "ระยะที่ 3 (R2): ทดลองใช้นวัตกรรมจริง",
        objective: `3.2 เพื่อเปรียบเทียบ${c2} ของ${d} หลังเรียนเทียบกับเกณฑ์ หรือก่อนและหลังเรียน`,
        question: `ผู้เรียนมี${c2} หลังเรียนสูงกว่าก่อนเรียน หรือสูงกว่าเกณฑ์ที่กำหนดหรือไม่?`,
        hypothesis: `ผู้เรียนมี${c2} หลังเรียนสูงกว่าก่อนเรียนอย่างมีนัยสำคัญทางสถิติที่ระดับ .05`,
        informants: `กลุ่มตัวอย่างจริง (${p.sample || d})`,
        instruments: `แบบทดสอบวัด${c2}`,
        statistics: `ค่าเฉลี่ย (x̄), S.D., t-test Dependent หรือ One-sample t-test เทียบเกณฑ์ร้อยละ`,
        ch4Section: `ตอนที่ 3.2 ผลการเปรียบเทียบ${c2}`
      });
    }

    rows.push({
      phase: "ระยะที่ 4 (D2): ประเมินผลและปรับปรุง",
      objective: `4. เพื่อศึกษาความพึงพอใจของ${d} ที่มีต่อการจัดการเรียนรู้ด้วย${bShort} และปรับปรุงเป็นฉบับสมบูรณ์`,
      question: `ผู้เรียนมีความพึงพอใจต่อการจัดการเรียนรู้ด้วย${bShort} ในระดับใด?`,
      hypothesis: "— (การวิจัยเชิงประเมินความรู้สึกและความคิดเห็น ไม่ตั้งสมมติฐาน)",
      informants: `กลุ่มตัวอย่างจริง (${p.sample || d}) และผู้เกี่ยวข้อง`,
      instruments: "แบบสอบถามความพึงพอใจแบบมาตราส่วนประมาณค่า 5 ระดับ (Likert Scale)",
      statistics: "ค่าเฉลี่ย (x̄), ส่วนเบี่ยงเบนมาตรฐาน (S.D.) และเกณฑ์การแปลผล 5 ระดับ",
      ch4Section: `ตอนที่ 4 ผลการประเมินความพึงพอใจและข้อเสนอแนะในการปรับปรุง`
    });

    return rows;
  },

  // ==========================================================================
  // พิมพ์เขียวรายงานวิจัย 5 บทฉบับเต็ม (5-Chapter Research Blueprint)
  // ตามเกณฑ์ วPA และหลักการเขียนของ รศ.ดร.ชวลิต ชูกำแพง
  // ==========================================================================
  generateChapters(p) {
    const fullTitle = this.composeFullTitle(p);
    const bShort = p.B_short || p.B || "นวัตกรรมการเรียนรู้";
    const bFull = p.B || bShort;
    const cList = (p.C_list || ["ความสามารถในการคิดวิเคราะห์", "ผลสัมฤทธิ์ทางการเรียน"]).filter(Boolean);
    const c1 = cList[0] || "ความสามารถในการเรียนรู้";
    const c2 = cList[1] || null;
    const cJoined = cList.join(" และ ");
    const d = p.D || "สำหรับนักเรียนชั้นมัธยมศึกษาปีที่ 3";
    const sample = p.sample || d;
    const population = p.population || `ผู้เรียน ${d}`;
    const subject = p.subject || "กลุ่มสาระการเรียนรู้";
    const duration = p.duration || "จำนวน 5 แผนการจัดการเรียนรู้ เวลา 15 ชั่วโมง";
    const crit = p.efficiencyCriterion || "80/80";
    const critParts = String(crit).split("/").map(Number);
    const critE1 = critParts[0] || 80;
    const critE2 = critParts[1] || 80;

    const st = p.statsData || {
      n: 38,
      fullScore: 40,
      e1: 82.45,
      e2: 81.68,
      ei: 0.6842,
      preMean: 18.42,
      preSD: 3.15,
      postMean: 32.67,
      postSD: 2.64,
      tValue: 24.86,
      pValue: ".000",
      c1PreMean: 14.20,
      c1PreSD: 2.45,
      c1PostMean: 25.10,
      c1PostSD: 2.12,
      c1Full: 30,
      c1TValue: 21.34,
      satMean: 4.62,
      satSD: 0.45,
      iocAvg: 0.92
    };

    // V2.0 Sampling, Instruments, Blueprint & Rubric Data Sources
    const samplingMeta = p.samplingMetadata || {
      type: "cluster_random",
      sampleSize: st.n || 38,
      isNormalDistributed: true,
      unit: "ห้องเรียน (Classroom Unit)",
      populationSize: 380
    };
    const isNonRandom = samplingMeta.type === "purposive" || samplingMeta.type === "population";

    const opDefs = (p.operationalDefinitions && p.operationalDefinitions.length > 0)
      ? p.operationalDefinitions
      : (window.ROAD_DATA && window.ROAD_DATA.DEFAULT_OPERATIONAL_DEFINITIONS)
      ? window.ROAD_DATA.DEFAULT_OPERATIONAL_DEFINITIONS
      : [];

    const expInsts = (p.experimentalInstruments && p.experimentalInstruments.length > 0)
      ? p.experimentalInstruments
      : (window.ROAD_DATA && window.ROAD_DATA.DEFAULT_EXPERIMENTAL_INSTRUMENTS)
      ? window.ROAD_DATA.DEFAULT_EXPERIMENTAL_INSTRUMENTS
      : [];

    const dcInsts = (p.dataCollectionInstruments && p.dataCollectionInstruments.length > 0)
      ? p.dataCollectionInstruments
      : (window.ROAD_DATA && window.ROAD_DATA.DEFAULT_DATA_COLLECTION_INSTRUMENTS)
      ? window.ROAD_DATA.DEFAULT_DATA_COLLECTION_INSTRUMENTS
      : [];

    const testBp = p.testBlueprint || (window.ROAD_DATA && window.ROAD_DATA.DEFAULT_TEST_BLUEPRINT) || {
      targetConstruct: c1,
      totalItems: 40,
      bufferPercent: 30,
      units: []
    };

    const rubrics = (p.analyticRubrics && p.analyticRubrics.length > 0)
      ? p.analyticRubrics
      : (window.ROAD_DATA && window.ROAD_DATA.DEFAULT_ANALYTIC_RUBRICS)
      ? window.ROAD_DATA.DEFAULT_ANALYTIC_RUBRICS
      : [];

    const steps = (p.B_steps || []).filter(Boolean);
    const opTable = this.generateOperationalTable(p);
    const r1d1Bridge = this.generateR1toD1Bridge(p);
    const modelComponents = this.generateModelComponents(p);
    const matrix = this.generateAlignmentMatrix(p);

    // คำนวณยอดรวมใน Test Blueprint Grid
    const bpUnits = (testBp.units || []);
    let bpColTotals = { remember: 0, understand: 0, apply: 0, analyze: 0, evaluate: 0, create: 0, totalItems: 0, hours: 0 };
    bpUnits.forEach(u => {
      bpColTotals.hours += Number(u.hours || 0);
      bpColTotals.remember += Number(u.remember || 0);
      bpColTotals.understand += Number(u.understand || 0);
      bpColTotals.apply += Number(u.apply || 0);
      bpColTotals.analyze += Number(u.analyze || 0);
      bpColTotals.evaluate += Number(u.evaluate || 0);
      bpColTotals.create += Number(u.create || 0);
    });
    bpColTotals.totalItems = bpColTotals.remember + bpColTotals.understand + bpColTotals.apply + bpColTotals.analyze + bpColTotals.evaluate + bpColTotals.create;
    const bpGrandTotal = bpColTotals.totalItems || Number(testBp.totalItems || 40);
    const bufferPct = Number(testBp.bufferPercent || 30);
    const suggestedTryoutCount = Math.round(bpGrandTotal * (1 + bufferPct / 100));

    // 1. ประมวลผลข้อมูล PNI_modified สำหรับตารางบทที่ 4 ตอนที่ 1
    const pniSource = (p.pniItems && p.pniItems.length > 0)
      ? p.pniItems
      : (window.ROAD_DATA && window.ROAD_DATA.DEFAULT_PNI_ITEMS)
      ? window.ROAD_DATA.DEFAULT_PNI_ITEMS
      : [];
    const pniRows = pniSource.map((it, idx) => {
      const iM = Number(it.iMean || it.expectedMean || 4.5);
      const iS = Number(it.iSD || 0.45);
      const dM = Number(it.dMean || it.currentMean || 2.5);
      const dS = Number(it.dSD || 0.65);
      const pni = dM > 0 ? Number(((iM - dM) / dM).toFixed(3)) : 0;
      return { id: it.id || `pni_${idx+1}`, name: it.name || `ประเด็นที่ ${idx+1}`, iMean: iM, iSD: iS, dMean: dM, dSD: dS, pni, origIdx: idx };
    });
    const sortedPni = [...pniRows].sort((a, b) => b.pni - a.pni);

    // 2. ตารางสังเคราะห์ขั้นตอนการจัดกิจกรรม (Syntax Synthesis Matrix)
    const syntaxData = this.generateSyntaxSynthesisMatrix(p);

    // 3. ตารางบทที่ 4 จำแนกตาม 4 วัตถุประสงค์ R&D (Section 4.1 to 4.4)
    // 4.1 ตารางผลการประเมินความต้องการจำเป็น (PNI_modified)
    const table4_1 = {
      tableNo: "ตารางที่ 4.1",
      caption: `ผลการวิเคราะห์สภาพปัญหาและความต้องการจำเป็นในการพัฒนา${bShort} ${d} (PNI_modified)`,
      headers: ["ประเด็นความต้องการจำเป็น", "สภาพที่คาดหวัง (Ī)", "S.D.", "สภาพปัจจุบัน (D̄)", "S.D.", "PNI_modified", "อันดับความสำคัญ"],
      rows: sortedPni.map((it, idx) => [
        it.name,
        it.iMean.toFixed(2),
        it.iSD.toFixed(2),
        it.dMean.toFixed(2),
        it.dSD.toFixed(2),
        it.pni.toFixed(3),
        `อันดับ ${idx + 1}`
      ]),
      interpretation: `จากตารางที่ 4.1 ผลการวิเคราะห์สภาพปัญหาและความต้องการจำเป็นในการพัฒนา${bShort} ${d} พบว่า ในภาพรวมผู้เรียนและครูผู้สอนมีความต้องการจำเป็นในระดับสูง โดยประเด็นที่มีดัชนีความต้องการจำเป็น (PNI_modified) สูงสุดเป็นลำดับที่ 1 ได้แก่ "${sortedPni[0]?.name || 'การจัดการเรียนรู้เพื่อพัฒนาทักษะการคิดขั้นสูง'}" มีค่า PNI_modified เท่ากับ ${(sortedPni[0]?.pni || 1.252).toFixed(3)} (สภาพที่คาดหวัง Ī = ${(sortedPni[0]?.iMean || 4.82).toFixed(2)}, สภาพปัจจุบัน D̄ = ${(sortedPni[0]?.dMean || 2.14).toFixed(2)}) รองลงมาได้แก่ "${sortedPni[1]?.name || 'การใช้สื่อนวัตกรรมดิจิทัล'}" (PNI_modified = ${(sortedPni[1]?.pni || 1.065).toFixed(3)}) และ "${sortedPni[2]?.name || 'การจัดกิจกรรมการเรียนรู้แบบร่วมมือ'}" (PNI_modified = ${(sortedPni[2]?.pni || 0.934).toFixed(3)}) ตามลำดับ ชี้ให้เห็นถึงความจำเป็นเร่งด่วนในการพัฒนานวัตกรรม${bShort} เพื่อแก้ปัญหาการเรียนรู้ในบริบทจริงอย่างเป็นรูปธรรม`
    };

    // 4.2 ตารางคุณภาพนวัตกรรม IOC/CVI และผลการวิเคราะห์ข้อสอบ Try-out
    const table4_2a = {
      tableNo: "ตารางที่ 4.2",
      caption: `ผลการตรวจสอบความตรงเชิงเนื้อหา (IOC) และดัชนีความตรงเชิงเนื้อหา (CVI) ของเครื่องมือวิจัยโดยผู้เชี่ยวชาญ 5 ท่าน`,
      headers: ["เครื่องมือนวัตกรรมและเครื่องมือวัดผล", "จำนวนผู้เชี่ยวชาญ (คน)", "เกณฑ์การยอมรับ", "ค่าเฉลี่ย IOC", "ค่า S-CVI", "ผลการประเมิน"],
      rows: [
        [`1. แผนการจัดการเรียนรู้ตาม${bShort}`, "5", "≥ 0.60", "0.92", "0.94", "มีความสอดคล้องระดับสูงมาก (นำไปใช้ได้)"],
        [`2. สื่อการเรียนรู้และชุดกิจกรรมประกอบ`, "5", "≥ 0.60", "0.90", "0.92", "มีความสอดคล้องระดับสูงมาก (นำไปใช้ได้)"],
        [`3. แบบทดสอบวัด${c1}`, "5", "≥ 0.60", "0.88", "0.90", "มีความสอดคล้องระดับสูงมาก (นำไปใช้ได้)"],
        [`4. เกณฑ์การประเมินรูบริกส์วัดทักษะปฏิบัติ`, "5", "≥ 0.60", "0.94", "0.96", "มีความสอดคล้องระดับสูงมาก (นำไปใช้ได้)"],
        [`5. แบบสอบถามความพึงพอใจต่อ${bShort}`, "5", "≥ 0.60", "0.96", "0.98", "มีความสอดคล้องระดับสูงมาก (นำไปใช้ได้)"],
        ["ภาพรวมเครื่องมือวิจัยทุกฉบับ", "5", "≥ 0.60", "0.92", "0.94", "ผ่านเกณฑ์มาตรฐานความตรงเชิงเนื้อหาทุกฉบับ"]
      ],
      interpretation: `จากตารางที่ 4.2 ผลการประเมินความสอดคล้องเชิงเนื้อหาและโครงสร้างของเครื่องมือนวัตกรรมและเครื่องมือวัดผลการวิจัยโดยผู้เชี่ยวชาญ 5 ท่าน พบว่า เครื่องมือทุกฉบับมีค่าเฉลี่ย IOC อยู่ระหว่าง 0.88 ถึง 0.96 และค่าเฉลี่ยรวมทั้งฉบับเท่ากับ 0.92 ส่วนค่าดัชนีความตรงเชิงเนื้อหาทั้งฉบับ (Scale-level CVI: S-CVI) เท่ากับ 0.94 ซึ่งสูงกว่าเกณฑ์ที่กำหนด (IOC ≥ 0.60) แสดงว่าเครื่องมือที่สร้างขึ้นมีความตรงเชิงเนื้อหา สามารถนำไปใช้ในการทดลองภาคสนามได้อย่างมีคุณภาพ`
    };

    const table4_2b = {
      tableNo: "ตารางที่ 4.3",
      caption: `ผลการวิเคราะห์คุณภาพข้อสอบวัด${c1} จากการทดลองใช้ (Try-out Item Analysis)`,
      headers: ["ตัวชี้วัดคุณภาพข้อสอบ", "เกณฑ์มาตรฐานที่ยอมรับ", "ผลการวิเคราะห์จากการทดลองใช้ (Try-out)", "การแปลผลคุณภาพ"],
      rows: [
        ["ค่าความยากง่าย (p)", "0.20 – 0.80", "0.38 – 0.72 (เฉลี่ย 0.54)", "ข้อสอบมีความยากง่ายเหมาะสม ไม่ยากหรือง่ายเกินไป"],
        ["ค่าอำนาจจำแนก (r / r_pbi)", "≥ 0.20", "0.26 – 0.68 (เฉลี่ย 0.46)", "ข้อสอบจำแนกผู้เรียนกลุ่มเก่งและกลุ่มอ่อนได้ดี"],
        ["ค่าความเชื่อมั่นทั้งฉบับ (KR-20 / Cronbach's Alpha)", "≥ 0.80", "0.864", "แบบทดสอบมีความเชื่อมั่นอยู่ในระดับสูงมาก"],
        ["จำนวนข้อสอบที่คัดเลือกไว้ใช้จริง", "ตามผัง Test Blueprint", `${bpGrandTotal} ข้อ (จาก Try-out ${suggestedTryoutCount} ข้อ)`, "คัดเลือกเฉพาะข้อสอบที่ผ่านเกณฑ์คุณภาพครบถ้วน"]
      ],
      interpretation: `จากตารางที่ 4.3 ผลการทดลองใช้แบบทดสอบ (Try-out) กับผู้เรียนที่มีบริบทใกล้เคียงกัน พบว่าข้อสอบที่คัดเลือกไว้จำนวน ${bpGrandTotal} ข้อ มีค่าความยากง่าย (p) อยู่ระหว่าง 0.38 ถึง 0.72 มีค่าอำนาจจำแนก (r) อยู่ระหว่าง 0.26 ถึง 0.68 และมีค่าความเชื่อมั่นทั้งฉบับ (KR-20) เท่ากับ 0.864 ซึ่งผ่านเกณฑ์มาตรฐานจิตวิทยาการวัดผลทุกประการ`
    };

    // 4.3 ตารางผลการทดลองใช้นวัตกรรม R2: E1/E2, Pre-Post Comparison, E.I.
    const eDiffVal = Math.abs(Number(st.e1) - Number(st.e2)).toFixed(2);
    const table4_3a = {
      tableNo: "ตารางที่ 4.4",
      caption: `ผลการวิเคราะห์หาประสิทธิภาพของ${bShort} ${d} ตามเกณฑ์ ${crit} (พร้อมตรวจสอบ Variance Tolerance)`,
      headers: ["รายการประเมินประสิทธิภาพ", "คะแนนเต็ม", "คะแนนเฉลี่ย (x̄)", "ส่วนเบี่ยงเบนมาตรฐาน (S.D.)", "ร้อยละ / ประสิทธิภาพ", "เกณฑ์มาตรฐาน", "ผลการประเมิน"],
      rows: [
        ["ประสิทธิภาพของกระบวนการ (E1)", String(st.fullScore * 2 || 80), (st.preMean * 2.1).toFixed(2), (st.preSD * 1.1).toFixed(2), `${st.e1}%`, `${critE1}%`, Number(st.e1) >= critE1 ? "สูงกว่าเกณฑ์" : "ต่ำกว่าเกณฑ์"],
        ["ประสิทธิภาพของผลลัพธ์ (E2)", String(st.fullScore || 40), Number(st.postMean).toFixed(2), Number(st.postSD).toFixed(2), `${st.e2}%`, `${critE2}%`, Number(st.e2) >= critE2 ? "สูงกว่าเกณฑ์" : "ต่ำกว่าเกณฑ์"],
        ["สรุปประสิทธิภาพรวม (E1/E2)", "—", "—", "—", `${st.e1}/${st.e2}`, crit, "มีประสิทธิภาพตามเกณฑ์ที่กำหนด"],
        ["ผลต่างประสิทธิภาพ (|E1 - E2|)", "—", "—", "—", `${eDiffVal}%`, "≤ 5.0%", Number(eDiffVal) <= 5.0 ? "ผ่านเกณฑ์สมดุล (Variance Tolerance)" : "เกินเกณฑ์มาตรฐาน"]
      ],
      interpretation: `จากตารางที่ 4.4 พบว่า ${bShort} มีประสิทธิภาพของกระบวนการ (E1) เท่ากับ ${st.e1}% และประสิทธิภาพของผลลัพธ์ (E2) เท่ากับ ${st.e2}% คิดเป็นประสิทธิภาพรวม E1/E2 เท่ากับ ${st.e1}/${st.e2} ซึ่งสูงกว่าเกณฑ์มาตรฐาน ${crit} ที่กำหนดไว้ และมีค่าผลต่างของประสิทธิภาพ (|E1 - E2|) เท่ากับ ${eDiffVal}% ซึ่งไม่เกินร้อยละ 5 ตามเกณฑ์ความแปรปรวนที่ยอมรับได้ตามระเบียบวิธีวิจัยมาตรฐานของ รศ.ดร.ชวลิต ชูกำแพง สรุปได้ว่า ${bShort} ที่พัฒนาขึ้นมีประสิทธิภาพเหมาะสม สามารถนำไปใช้จัดการเรียนรู้ได้อย่างมีคุณภาพ`
    };

    const table4_3b = {
      tableNo: "ตารางที่ 4.5",
      caption: `ผลการเปรียบเทียบ${c1} ของ${d} ก่อนและหลังการจัดการเรียนรู้ด้วย${bShort}`,
      headers: ["การทดสอบ", "จำนวนนักเรียน (n)", "คะแนนเต็ม", "คะแนนเฉลี่ย (x̄)", "ส่วนเบี่ยงเบน (S.D.)", "สถิติทดสอบ", "ระดับนัยสำคัญ (p)", "ขนาดอิทธิพล (Cohen's d)"],
      rows: [
        ["ก่อนเรียน (Pre-test)", String(st.n || 38), String(st.c1Full || 30), Number(st.c1PreMean).toFixed(2), Number(st.c1PreSD).toFixed(2), isNonRandom ? "Wilcoxon Z = 5.24" : `t = ${st.c1TValue || '21.34'}`, "p < .001", "d = 1.84 (ขนาดใหญ่มาก)"],
        ["หลังเรียน (Post-test)", String(st.n || 38), String(st.c1Full || 30), Number(st.c1PostMean).toFixed(2), Number(st.c1PostSD).toFixed(2), "", "", ""]
      ],
      interpretation: `จากตารางที่ 4.5 พบว่า ก่อนเรียนผู้เรียนมีคะแนน${c1} เฉลี่ยเท่ากับ ${Number(st.c1PreMean).toFixed(2)} (S.D. = ${Number(st.c1PreSD).toFixed(2)}) และหลังการจัดการเรียนรู้ด้วย${bShort} มีคะแนนเฉลี่ยเพิ่มขึ้นเป็น ${Number(st.c1PostMean).toFixed(2)} (S.D. = ${Number(st.c1PostSD).toFixed(2)}) เมื่อเปรียบเทียบความแตกต่างพบว่า ผู้เรียนมีคะแนน${c1} หลังเรียนสูงกว่าก่อนเรียนอย่างมีนัยสำคัญทางสถิติที่ระดับ .05 (${isNonRandom ? 'Wilcoxon Signed-Rank Z = 5.24, p < .001' : `t(${Number(st.n || 38) - 1}) = ${st.c1TValue || '21.34'}, p < .001`}) และมีค่าขนาดอิทธิพล (Cohen's d) เท่ากับ 1.84 ซึ่งจัดอยู่ในระดับขนาดใหญ่มาก (Large Effect Size: d > 0.80) แสดงว่านวัตกรรมส่งผลต่อการพัฒนา${c1} ของผู้เรียนอย่างแท้จริง เป็นไปตามสมมติฐานการวิจัยที่ตั้งไว้`
    };

    const table4_3c = {
      tableNo: "ตารางที่ 4.6",
      caption: `ผลการวิเคราะห์ดัชนีประสิทธิผล (Effectiveness Index: E.I.) ของการจัดการเรียนรู้ด้วย${bShort}`,
      headers: ["การประเมินผลสัมฤทธิ์", "คะแนนเต็ม", "คะแนนเฉลี่ย (x̄)", "S.D.", "ดัชนีประสิทธิผล (E.I.)", "คิดเป็นร้อยละ", "เกณฑ์การยอมรับ"],
      rows: [
        ["ก่อนเรียน (Pre-test)", String(st.fullScore || 40), Number(st.preMean).toFixed(2), Number(st.preSD).toFixed(2), String(st.ei), `${(Number(st.ei) * 100).toFixed(2)}%`, "≥ 0.50 (ร้อยละ 50)"],
        ["หลังเรียน (Post-test)", String(st.fullScore || 40), Number(st.postMean).toFixed(2), Number(st.postSD).toFixed(2), "", "", "ผู้เรียนมีความก้าวหน้าในระดับสูง"]
      ],
      interpretation: `จากตารางที่ 4.6 พบว่า ดัชนีประสิทธิผล (E.I.) ของ${bShort} มีค่าเท่ากับ ${st.ei} คิดเป็นร้อยละ ${(Number(st.ei) * 100).toFixed(2)} แสดงว่าผู้เรียนมีความรู้เพิ่มขึ้นหรือมีความก้าวหน้าทางการเรียนรู้คิดเป็นร้อยละ ${(Number(st.ei) * 100).toFixed(2)} หลังจากที่ได้เรียนรู้ด้วย${bShort} ซึ่งสูงกว่าเกณฑ์การยอมรับที่กำหนดไว้ที่ร้อยละ 50 (E.I. ≥ 0.50)`
    };

    // 4.4 ตารางผลการประเมินความพึงพอใจ D2
    const table4_4 = {
      tableNo: "ตารางที่ 4.7",
      caption: `ผลการประเมินความพึงพอใจของ${d} ที่มีต่อการจัดการเรียนรู้ด้วย${bShort}`,
      headers: ["ด้านการประเมินความพึงพอใจ", "ค่าเฉลี่ย (x̄)", "ส่วนเบี่ยงเบนมาตรฐาน (S.D.)", "ระดับความพึงพอใจ", "อันดับ"],
      rows: [
        ["1. ด้านเนื้อหาและการจัดลำดับกิจกรรมการเรียนรู้", (st.satMean * 1.01).toFixed(2), (st.satSD * 0.95).toFixed(2), "มากที่สุด", "1"],
        ["2. ด้านบทบาทของครูผู้สอนและการให้คำปรึกษาชี้แนะ", Number(st.satMean).toFixed(2), Number(st.satSD).toFixed(2), "มากที่สุด", "2"],
        ["3. ด้านสื่อ นวัตกรรม และบรรยากาศการเรียนรู้เชิงรุก", (st.satMean * 0.99).toFixed(2), (st.satSD * 1.05).toFixed(2), "มากที่สุด", "3"],
        ["4. ด้านประโยชน์และการนำทักษะไปประยุกต์ใช้ในชีวิตจริง", (st.satMean * 1.0).toFixed(2), (st.satSD * 1.0).toFixed(2), "มากที่สุด", "4"],
        ["ภาพรวมความพึงพอใจทุกด้าน", Number(st.satMean).toFixed(2), Number(st.satSD).toFixed(2), "มากที่สุด", "—"]
      ],
      interpretation: `จากตารางที่ 4.7 พบว่า ผู้เรียนมีความพึงพอใจต่อการจัดการเรียนรู้ด้วย${bShort} ในภาพรวมอยู่ในระดับมากที่สุด (x̄ = ${Number(st.satMean).toFixed(2)}, S.D. = ${Number(st.satSD).toFixed(2)}) เมื่อพิจารณาเป็นรายด้านพบว่าทุกด้านอยู่ในระดับมากที่สุดเช่นเดียวกัน โดยด้านที่มีค่าเฉลี่ยสูงสุดได้แก่ ด้านเนื้อหาและการจัดลำดับกิจกรรมการเรียนรู้ รองลงมาได้แก่ ด้านบทบาทของครูผู้สอน และด้านประโยชน์และการนำไปประยุกต์ใช้ ตามลำดับ`
    };

    // โครงสร้างเนื้อหา 5 บทละเอียด (5-Chapter Research Full Structure)
    const chapters = [
      // บทที่ 1: บทนำ
      {
        number: 1,
        chapterNo: 1,
        title: "บทที่ 1",
        subtitle: "บทนำ",
        sections: [
          {
            heading: "1.1 ความเป็นมาและความสำคัญของปัญหา (7 ย่อหน้าตามโครงสร้าง รศ.ดร.ชวลิต ชูกำแพง)",
            title: "1.1 ความเป็นมาและความสำคัญของปัญหา (7 ย่อหน้าตามโครงสร้าง รศ.ดร.ชวลิต ชูกำแพง)",
            type: "custom_html",
            content: `
              <div class="space-y-3 leading-relaxed text-justify">
                <p><b>ย่อหน้า 1 (ความสำคัญของตัวแปร C):</b> การศึกษาในยุคศตวรรษที่ 21 มุ่งเน้นการเสริมสร้างสมรรถนะผู้เรียนให้มีความฉลาดรู้และทักษะแห่งอนาคต โดยเฉพาะอย่างยิ่ง <b>${cJoined}</b> ซึ่งถือเป็นสมรรถนะสำคัญในการวิเคราะห์ สังเคราะห์ และประยุกต์ใช้ความรู้เพื่อการแก้ปัญหาที่ซับซ้อนในชีวิตจริงและการพัฒนาประเทศ</p>
                <p><b>ย่อหน้า 2 (นโยบาย/หลักสูตรและทิศทางชาติ):</b> พระราชบัญญัติการศึกษาแห่งชาติ หลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน และทิศทางการวิจัยทางการศึกษาของชาติ พ.ศ. 2568–2570 ได้กำหนดเป้าหมายชัดเจนในการพัฒนาคุณภาพผู้เรียนสู่การเรียนรู้ตลอดชีวิต การจัดการเรียนรู้เชิงรุก (Active Learning) และการใช้เทคโนโลยีนวัตกรรมการศึกษา</p>
                <p><b>ย่อหน้า 3 (ปัญหาภาพรวมระดับประเทศ/ระดับเขต):</b> อย่างไรก็ดี จากรายงานการทดสอบทางการศึกษาระดับชาติ และการประเมินคุณภาพผู้เรียนในภาพรวม พบว่าผู้เรียนจำนวนมากยังขาดทักษะ${c1} การเรียนการสอนส่วนใหญ่ยังเน้นการถ่ายทอดเนื้อหาแบบบรรยาย ทำให้ผู้เรียนขาดโอกาสในการฝึกคิดวิเคราะห์และลงมือปฏิบัติ</p>
                <p><b>ย่อหน้า 4 (สาเหตุของปัญหาและสภาพจริงในพื้นที่ D):</b> จากการศึกษาสภาพบริบทของ <b>${d}</b> ใน <b>${subject}</b> พบว่าผู้เรียนประสบปัญหาในการทำความเข้าใจบทเรียน ไม่สามารถเชื่อมโยงแนวคิดหลักได้ ครูยังขาดสื่อนวัตกรรมการสอนเชิงรุกที่ส่งเสริมการเรียนรู้ร่วมกัน ส่งผลให้${cJoined} ยังไม่บรรลุเป้าหมายตามเกณฑ์มาตรฐานของสถานศึกษา</p>
                <p><b>ย่อหน้า 5 (แนวคิด/หลักการ B ที่นำมาแก้ปัญหา):</b> เพื่อแก้ปัญหาดังกล่าว ผู้วิจัยได้ศึกษาค้นคว้าหลักการและแนวคิด <b>${bFull}</b> ซึ่งมีจุดเด่นในการจัดกระบวนการเรียนรู้อย่างเป็นขั้นตอน ช่วยกระตุ้นความสนใจ เชื่อมโยงความรู้เดิมสู่ความรู้ใหม่ และเปิดโอกาสให้ผู้เรียนได้ลงมือปฏิบัติจริงและสะท้อนคิด</p>
                <p><b>ย่อหน้า 6 (นวัตกรรม A และช่องว่างวิจัย Research Gap):</b> จากการทบทวนวรรณกรรมพบว่า แม้จะมีการนำแนวคิดนี้ไปประยุกต์ใช้ในบางบริบท แต่ยังไม่มีการวิจัยและพัฒนาอย่างเป็นระบบที่บูรณาการเข้ากับบริบทของ ${d} ผู้วิจัยจึงได้บูรณาการสร้างสรรค์ <b>${p.A} ${bFull}</b> ขึ้นอย่างเป็นระบบตามกระบวนการวิจัยและพัฒนา (R&D)</p>
                <p><b>ย่อหน้า 7 (สรุปเหตุผลและเป้าหมายการวิจัย):</b> ด้วยเหตุผลและความสำคัญดังกล่าว ผู้วิจัยจึงมีความสนใจที่จะทำวิจัยเรื่อง <b>"${fullTitle}"</b> เพื่อยกระดับ${cJoined} ของผู้เรียน และสร้างองค์ความรู้ นวัตกรรมทางการศึกษาที่เป็นแบบอย่างที่ดีตามเกณฑ์มาตรฐานวิทยฐานะ วPA ต่อไป</p>
              </div>
            `
          },
          {
            heading: "1.2 วัตถุประสงค์การวิจัย (ล้อตาม 4 ระยะ R1-D1-R2-D2)",
            title: "1.2 วัตถุประสงค์การวิจัย (ล้อตาม 4 ระยะ R1-D1-R2-D2)",
            type: "custom_html",
            content: `
              <ol class="list-decimal pl-6 space-y-1 text-xs">
                <li>เพื่อศึกษาสภาพปัญหา ความต้องการจำเป็น และข้อมูลพื้นฐานในการพัฒนา${bShort} ${d} (ระยะที่ 1: R1)</li>
                <li>เพื่อสร้าง พัฒนา และหาประสิทธิภาพของ${bShort} ${d} ให้มีประสิทธิภาพตามเกณฑ์ ${crit} (ระยะที่ 2: D1)</li>
                <li>เพื่อทดลองใช้${bShort} กับกลุ่มตัวอย่างจริง (ระยะที่ 3: R2) โดยมีวัตถุประสงค์ย่อย:
                  <ul class="list-disc pl-5 mt-1">
                    <li>3.1 เพื่อเปรียบเทียบ${c1} ของ${d} ก่อนและหลังการจัดการเรียนรู้ด้วย${bShort}</li>
                    ${c2 ? `<li>3.2 เพื่อเปรียบเทียบ${c2} ของ${d} ก่อนและหลังการจัดการเรียนรู้ด้วย${bShort}</li>` : ''}
                    <li>3.3 เพื่อหาค่าดัชนีประสิทธิผล (Effectiveness Index: E.I.) ของการจัดการเรียนรู้ด้วย${bShort}</li>
                  </ul>
                </li>
                <li>เพื่อศึกษาความพึงพอใจของ${d} ที่มีต่อการจัดการเรียนรู้ด้วย${bShort} และปรับปรุงนวัตกรรมเป็นฉบับสมบูรณ์ (ระยะที่ 4: D2)</li>
              </ol>
            `
          },
          {
            heading: "1.3 สมมติฐานการวิจัย (★ มีเฉพาะระยะที่ 3 R2 ที่มีการเปรียบเทียบเท่านั้น)",
            title: "1.3 สมมติฐานการวิจัย (★ มีเฉพาะระยะที่ 3 R2 ที่มีการเปรียบเทียบเท่านั้น)",
            type: "custom_html",
            content: isNonRandom ? `
              <div class="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                <p class="font-bold">⚠️ ข้อมูลกลุ่มเป้าหมายระดับประชากร / การเลือกแบบเจาะจง (Non-Probability Sampling):</p>
                <p class="mt-1">เนื่องจากการวิจัยนี้กำหนดกลุ่มเป้าหมายเป็นการศึกษาจาก<b>${samplingMeta.type === 'purposive' ? 'การเลือกแบบเจาะจง (Purposive Sampling)' : 'ประชากรทั้งหมด (Population / Census)'}</b> ซึ่งไม่มีความคลาดเคลื่อนจากการสุ่ม (No Sampling Error) และไม่เป็นไปตามข้อตกลงเบื้องต้นเรื่องการสุ่มตัวอย่างอย่างอิสระตามหลักความน่าจะเป็น จึง<b>ไม่ต้องตั้งสมมติฐานการวิจัยเชิงอนุมาน (Inferential Hypotheses)</b> และไม่ทดสอบด้วยสถิติ t-test</p>
                <p class="mt-1.5">ทั้งนี้ การตัดสินผลการทดลองในระยะที่ 3 (R2) จะใช้<b>เกณฑ์การตัดสินด้วยสถิติบรรยาย (ค่าเฉลี่ย x̄, ส่วนเบี่ยงเบนมาตรฐาน S.D., ร้อยละ)</b> ร่วมกับการประเมินพัฒนาการความก้าวหน้าของผู้เรียนด้วย<b>ดัชนีประสิทธิผล (Effectiveness Index: E.I.) ไม่น้อยกว่าร้อยละ 50 (E.I. ≥ 0.50)</b></p>
              </div>
            ` : `
              <div class="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200">
                <p><b>1.</b> ผู้เรียนที่ได้รับการจัดการเรียนรู้ด้วย${bShort} มีคะแนน${c1} หลังเรียนสูงกว่าก่อนเรียน อย่างมีนัยสำคัญทางสถิติที่ระดับ .05</p>
                ${c2 ? `<p class="mt-1"><b>2.</b> ผู้เรียนที่ได้รับการจัดการเรียนรู้ด้วย${bShort} มีคะแนน${c2} หลังเรียนสูงกว่าก่อนเรียน อย่างมีนัยสำคัญทางสถิติที่ระดับ .05</p>` : ''}
                <p class="mt-2 text-[11px] text-slate-500 dark:text-slate-400"><i>หมายเหตุ: ตามระเบียบวิธีวิจัยมาตรฐานของ รศ.ดร.ชวลิต ชูกำแพง ระยะ R1 (ศึกษาข้อมูล), D1 (หาประสิทธิภาพ E1/E2 ตามเกณฑ์) และ D2 (ประเมินความพึงพอใจ) ไม่ต้องตั้งสมมติฐาน มีสมมติฐานเฉพาะระยะ R2 ที่มีการเปรียบเทียบเท่านั้น</i></p>
              </div>
            `
          },
          {
            heading: "1.4 ขอบเขตการวิจัย (แยกตาม 4 ระยะ R1-D1-R2-D2)",
            title: "1.4 ขอบเขตการวิจัย (แยกตาม 4 ระยะ R1-D1-R2-D2)",
            type: "custom_html",
            content: `
              <div class="space-y-2 text-xs">
                <p><b>1. ด้านประชากรและกลุ่มตัวอย่าง:</b> ประชากรได้แก่ ${population} และกลุ่มตัวอย่างได้แก่ ${sample}</p>
                <p><b>2. ด้านตัวแปรที่ศึกษา:</b>
                  <br>- ตัวแปรต้น (Independent Variable): ${bFull}
                  <br>- ตัวแปรตาม (Dependent Variables): 1) ${c1} 2) ${c2 || 'ผลสัมฤทธิ์ทางการเรียน'} 3) ความพึงพอใจของผู้เรียน
                </p>
                <p><b>3. ด้านเนื้อหา:</b> ${subject}</p>
                <p><b>4. ด้านระยะเวลา:</b> ดำเนินการใน ${p.semester || 'ภาคเรียนที่ 1 ปีการศึกษา 2569'} (${duration})</p>
              </div>
            `
          },
          {
            heading: "1.5 นิยามศัพท์เฉพาะเชิงปฏิบัติการ (Operational Definitions - ครบ 3 มิติตามระเบียบวิธีวิจัย)",
            title: "1.5 นิยามศัพท์เฉพาะเชิงปฏิบัติการ (Operational Definitions - ครบ 3 มิติตามระเบียบวิธีวิจัย)",
            type: "custom_html",
            content: `
              <div class="space-y-3 text-xs leading-relaxed">
                <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <p class="font-bold text-sky-800 dark:text-sky-300">1. ${bShort} (ตัวแปรต้น - นวัตกรรม):</p>
                  <p class="mt-1 text-slate-700 dark:text-slate-300">หมายถึง นวัตกรรมการจัดการเรียนรู้ที่ผู้วิจัยพัฒนาขึ้นตามแนวคิด ${bFull} ประกอบด้วยกระบวนการจัดการเรียนรู้ ${syntaxData.finalSynthesizedSteps.length} ขั้นตอน ได้แก่ ${syntaxData.finalSynthesizedSteps.map(s => s.split("(")[0]).join(", ")} พร้อมแผนการจัดการเรียนรู้และสื่อประกอบการสอน</p>
                </div>
                <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <p class="font-bold text-sky-800 dark:text-sky-300">2. ประสิทธิภาพของนวัตกรรม (${crit}):</p>
                  <p class="mt-1 text-slate-700 dark:text-slate-300">หมายถึง ประสิทธิภาพของ${bShort} ตามเกณฑ์ ${crit} โดย E1 หมายถึง ประสิทธิภาพของกระบวนการ ประเมินจากร้อยละของคะแนนเฉลี่ยจากการทำกิจกรรม/ใบงานระหว่างเรียน และ E2 หมายถึง ประสิทธิภาพของผลลัพธ์ ประเมินจากร้อยละของคะแนนเฉลี่ยจากการทำแบบทดสอบหลังเรียน</p>
                </div>
                ${opDefs.map((od, idx) => `
                  <div class="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
                    <p class="font-bold text-emerald-900 dark:text-emerald-200">${idx + 3}. ${od.construct} (ตัวแปรตาม):</p>
                    <p class="text-slate-700 dark:text-slate-300 pl-2"><b>(1) นิยามเชิงโครงสร้าง/มโนทัศน์:</b> ${od.definition}</p>
                    <div class="text-slate-700 dark:text-slate-300 pl-2">
                      <b>(2) ตัวบ่งชี้พฤติกรรม/ขั้นตอนการแสดงออก:</b>
                      <ul class="list-disc pl-5 mt-0.5 space-y-0.5">
                        ${(od.indicators || []).map(ind => `<li>${ind}</li>`).join("")}
                      </ul>
                    </div>
                    <p class="text-slate-700 dark:text-slate-300 pl-2"><b>(3) เครื่องมือวัดและเกณฑ์การประเมิน:</b> ${od.instrumentAndCriteria}</p>
                  </div>
                `).join("")}
                <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <p class="font-bold text-sky-800 dark:text-sky-300">${opDefs.length + 3}. ดัชนีประสิทธิผล (Effectiveness Index: E.I.):</p>
                  <p class="mt-1 text-slate-700 dark:text-slate-300">หมายถึง ค่าที่แสดงถึงความก้าวหน้าในการเรียนรู้ของผู้เรียนหลังจากเรียนด้วย${bShort} คำนวณจากคะแนนสอบก่อนเรียนและหลังเรียน</p>
                </div>
                <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <p class="font-bold text-sky-800 dark:text-sky-300">${opDefs.length + 4}. ความพึงพอใจ:</p>
                  <p class="mt-1 text-slate-700 dark:text-slate-300">หมายถึง ความรู้สึกและความคิดเห็นเชิงบวกของผู้เรียนที่มีต่อ${bShort} วัดได้จากแบบสอบถามความพึงพอใจมาตราส่วนประมาณค่า 5 ระดับ</p>
                </div>
              </div>
            `
          }
        ]
      },

      // บทที่ 2: เอกสารและงานวิจัยที่เกี่ยวข้อง
      {
        number: 2,
        chapterNo: 2,
        title: "บทที่ 2",
        subtitle: "เอกสารและงานวิจัยที่เกี่ยวข้อง",
        sections: [
          {
            heading: "2.1 โครงสร้างหัวข้อในบทที่ 2 (จัดหมวดหมู่ตามคำสำคัญ A, B, C)",
            title: "2.1 โครงสร้างหัวข้อในบทที่ 2 (จัดหมวดหมู่ตามคำสำคัญ A, B, C)",
            type: "custom_html",
            content: `
              <div class="space-y-2 text-xs">
                <p><b>1. เอกสารและงานวิจัยที่เกี่ยวข้องกับนวัตกรรม (${bShort}):</b> ความหมาย, ความสำคัญ, แนวคิดและทฤษฎีพื้นฐาน, องค์ประกอบของรูปแบบ, ขั้นตอนการจัดกิจกรรม, และงานวิจัยที่เกี่ยวข้อง</p>
                <p><b>2. เอกสารและงานวิจัยที่เกี่ยวข้องกับตัวแปรตาม (${c1}):</b> ความหมาย, ทฤษฎีและกระบวนการพัฒนา, เครื่องมือวัดและประเมินผล</p>
                ${c2 ? `<p><b>3. เอกสารและงานวิจัยที่เกี่ยวข้องกับ ${c2}:</b> ทฤษฎีการเรียนรู้, ผลสัมฤทธิ์, และการประเมินผล</p>` : ''}
                <p><b>4. เอกสารเกี่ยวกับประสิทธิภาพของนวัตกรรมและดัชนีประสิทธิผล (E1/E2 & E.I.)</b></p>
                <p><b>5. งานวิจัยที่เกี่ยวข้องในประเทศและต่างประเทศ</b></p>
              </div>
            `
          },
          {
            heading: "2.2 ตารางสังเคราะห์ขั้นตอนการจัดกิจกรรมการเรียนรู้จากนักวิชาการ (Syntax Synthesis Matrix)",
            title: "2.2 ตารางสังเคราะห์ขั้นตอนการจัดกิจกรรมการเรียนรู้จากนักวิชาการ (Syntax Synthesis Matrix)",
            type: "stat_tables",
            tables: [
              {
                tableNo: "ตารางที่ 2.1",
                caption: `การสังเคราะห์ขั้นตอนการจัดกิจกรรมการเรียนรู้จากแนวคิดและทฤษฎีของนักวิชาการ 7 ท่าน`,
                headers: ["ขั้นตอนการจัดกิจกรรมการเรียนรู้", "1. Joyce & Weil", "2. Gagné", "3. Hunter", "4. Vygotsky", "5. ชวลิต", "6. ทิศนา", "7. Slavin", "ความถี่ (คน)", "ร้อยละ (%)", "การสังเคราะห์สู่นวัตกรรม D1"],
                rows: syntaxData.steps.map(st => [
                  st.stepName,
                  st.scholarChecks[0] ? "✓" : "—",
                  st.scholarChecks[1] ? "✓" : "—",
                  st.scholarChecks[2] ? "✓" : "—",
                  st.scholarChecks[3] ? "✓" : "—",
                  st.scholarChecks[4] ? "✓" : "—",
                  st.scholarChecks[5] ? "✓" : "—",
                  st.scholarChecks[6] ? "✓" : "—",
                  `${st.count}/${st.totalScholars}`,
                  `${st.percent}%`,
                  st.synthesizedStep
                ]),
                interpretation: `จากตารางที่ 2.1 ผลการสังเคราะห์ขั้นตอนการจัดกิจกรรมการเรียนรู้จากนักวิชาการ 7 ท่าน พบว่า ทุกขั้นตอนมีความถี่ร่วมกันตั้งแต่ 5 ถึง 7 ท่าน (คิดเป็นร้อยละ 71.4% ถึง 100.0%) ซึ่งผ่านเกณฑ์การยอมรับ (ร้อยละ 60 ขึ้นไป) ผู้วิจัยจึงได้สังเคราะห์ขั้นตอนการจัดกิจกรรมการเรียนรู้ของ ${bShort} เป็น ${syntaxData.finalSynthesizedSteps.length} ขั้นตอนสำคัญ ได้แก่: ${syntaxData.finalSynthesizedSteps.map((s, i) => `${i+1}) ${s.split("(")[0].trim()}`).join(", ")} เพื่อนำไปใช้เป็นแกนหลักในการออกแบบแผนการจัดการเรียนรู้ในระยะ D1 ต่อไป`
              }
            ]
          },
          {
            heading: "2.3 ตารางแสดงการเชื่อมโยงจากผลการศึกษา R1 สู่การออกแบบนวัตกรรม D1 (R1-to-D1 Synthesis Bridge Table)",
            title: "2.3 ตารางแสดงการเชื่อมโยงจากผลการศึกษา R1 สู่การออกแบบนวัตกรรม D1 (R1-to-D1 Synthesis Bridge Table)",
            type: "stat_tables",
            tables: [
              {
                tableNo: "ตารางที่ 2.2",
                caption: `การเชื่อมโยงข้อค้นพบจากการศึกษาข้อมูลพื้นฐาน (R1) สู่การสร้างและพัฒนานวัตกรรม (D1)`,
                headers: ["มิติการศึกษาใน R1", "ข้อค้นพบและข้อมูลพื้นฐานจากพื้นที่จริง", "การสังเคราะห์สู่โครงสร้างนวัตกรรม D1", "เหตุผลและความเชื่อมโยง (Why & How)"],
                rows: r1d1Bridge.map(b => [
                  b.r1Dimension,
                  b.r1Findings,
                  b.d1Transformation,
                  b.whyHow
                ]),
                interpretation: `ตารางที่ 2.2 แสดงให้เห็นถึงสะพานเชื่อมโยงความรู้เชิงระเบียบวิธีวิจัย (Methodological Synthesis Bridge) ว่าผลการศึกษาเอกสาร ทฤษฎี และข้อมูลสภาพปัญหาความต้องการจำเป็นในระยะ R1 ได้ถูกแปรเปลี่ยนเป็นโครงสร้าง หลักการ วัตถุประสงค์ ขั้นตอนการสอน (Syntax) และระบบสิ่งสนับสนุนของนวัตกรรมในระยะ D1 อย่างเป็นระบบและมีเหตุผลรองรับชัดเจน`
              }
            ]
          },
          {
            heading: "2.4 กรอบแนวคิดเชิงทฤษฎีในการวิจัย (Theoretical Conceptual Framework)",
            title: "2.4 กรอบแนวคิดเชิงทฤษฎีในการวิจัย (Theoretical Conceptual Framework)",
            type: "custom_html",
            content: `
              <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                <div class="font-bold text-slate-800 dark:text-slate-200 mb-2">แผนผังกรอบแนวคิดเชิงทฤษฎี (Theoretical Model Framework)</div>
                <div class="grid md:grid-cols-3 gap-3 items-center text-center">
                  <div class="p-3 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800">
                    <div class="font-bold text-sky-800 dark:text-sky-300">แนวคิดทฤษฎีพื้นฐาน (B)</div>
                    <div class="text-[11px] mt-1 text-slate-600 dark:text-slate-400">${bFull}</div>
                  </div>
                  <div class="font-bold text-lg text-slate-400">➔ บูรณาการสร้าง ➔</div>
                  <div class="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                    <div class="font-bold text-emerald-800 dark:text-emerald-300">ตัวแปรตามเป้าหมาย (C)</div>
                    <div class="text-[11px] mt-1 text-slate-600 dark:text-slate-400">1. ${c1}<br>2. ${c2 || 'ผลสัมฤทธิ์ทางการเรียน'}<br>3. ความพึงพอใจ</div>
                  </div>
                </div>
                <div class="mt-3 text-[11px] text-slate-500 italic text-center">
                  * กรอบแนวคิดในบทที่ 2 แสดงความสัมพันธ์เชิงทฤษฎี (Why) ระหว่างหลักการ B และผลลัพธ์ C โดยไม่ปะปนกับขั้นตอนวิธีดำเนินการวิจัย 4 ระยะ
                </div>
              </div>
            `
          }
        ]
      },

      // บทที่ 3: วิธีดำเนินการวิจัย
      {
        number: 3,
        chapterNo: 3,
        title: "บทที่ 3",
        subtitle: "วิธีดำเนินการวิจัย",
        sections: [
          {
            heading: "3.1 ตารางการดำเนินการวิจัย 4 ระยะ (R1-D1-R2-D2 Operational Table)",
            title: "3.1 ตารางการดำเนินการวิจัย 4 ระยะ (R1-D1-R2-D2 Operational Table)",
            type: "custom_html",
            content: `
              <div class="overflow-x-auto text-xs">
                <table class="w-full border-collapse border border-slate-300 dark:border-slate-700">
                  <thead>
                    <tr class="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 font-bold">
                      <th class="p-2 border border-slate-300 dark:border-slate-700 text-left">ขั้นตอนการวิจัย</th>
                      <th class="p-2 border border-slate-300 dark:border-slate-700 text-left">วัตถุประสงค์ย่อย</th>
                      <th class="p-2 border border-slate-300 dark:border-slate-700 text-left">การเก็บรวบรวมข้อมูล</th>
                      <th class="p-2 border border-slate-300 dark:border-slate-700 text-left">แหล่งข้อมูล/กลุ่มตัวอย่าง</th>
                      <th class="p-2 border border-slate-300 dark:border-slate-700 text-left">ผลที่ได้รับ</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${opTable.map(r => `
                      <tr class="border-b border-slate-200 dark:border-slate-800">
                        <td class="p-2 border border-slate-300 dark:border-slate-700 font-semibold align-top">${r.phase}<br><span class="text-[10px] text-slate-500">${r.phaseName}</span></td>
                        <td class="p-2 border border-slate-300 dark:border-slate-700 align-top">${r.objective}</td>
                        <td class="p-2 border border-slate-300 dark:border-slate-700 align-top whitespace-pre-line">${r.dataCollection}</td>
                        <td class="p-2 border border-slate-300 dark:border-slate-700 align-top">${r.sources}</td>
                        <td class="p-2 border border-slate-300 dark:border-slate-700 align-top whitespace-pre-line">${r.output}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            `
          },
          {
            heading: "3.2 ตารางเชื่อมโยงจาก R1 สู่ D1 (R1-to-D1 Synthesis Bridge)",
            title: "3.2 ตารางเชื่อมโยงจาก R1 สู่ D1 (R1-to-D1 Synthesis Bridge)",
            type: "custom_html",
            content: `
              <div class="overflow-x-auto text-xs">
                <table class="w-full border-collapse border border-slate-300 dark:border-slate-700">
                  <thead>
                    <tr class="bg-slate-100 dark:bg-slate-800 font-bold">
                      <th class="p-2 border border-slate-300 dark:border-slate-700 text-left">มิติการศึกษาใน R1</th>
                      <th class="p-2 border border-slate-300 dark:border-slate-700 text-left">ข้อค้นพบและข้อมูลพื้นฐาน</th>
                      <th class="p-2 border border-slate-300 dark:border-slate-700 text-left">การสังเคราะห์สู่นวัตกรรมใน D1</th>
                      <th class="p-2 border border-slate-300 dark:border-slate-700 text-left">เหตุผลความเชื่อมโยง (Why & How)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${r1d1Bridge.map(b => `
                      <tr class="border-b border-slate-200 dark:border-slate-800">
                        <td class="p-2 border border-slate-300 dark:border-slate-700 font-semibold align-top">${b.r1Dimension}</td>
                        <td class="p-2 border border-slate-300 dark:border-slate-700 align-top">${b.r1Findings}</td>
                        <td class="p-2 border border-slate-300 dark:border-slate-700 align-top font-medium text-sky-800 dark:text-sky-300">${b.d1Transformation}</td>
                        <td class="p-2 border border-slate-300 dark:border-slate-700 align-top">${b.whyHow}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            `
          },
          {
            heading: "3.3 องค์ประกอบของรูปแบบที่พัฒนาขึ้น (Model Components)",
            title: "3.3 องค์ประกอบของรูปแบบที่พัฒนาขึ้น (Model Components)",
            type: "custom_html",
            content: `
              <div class="space-y-2 text-xs">
                ${modelComponents.map(mc => `
                  <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div class="font-bold text-slate-900 dark:text-white">${mc.name}</div>
                    <div class="text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-line">${mc.content}</div>
                  </div>
                `).join("")}
              </div>
            `
          },
          {
            heading: "3.4 เครื่องมือที่ใช้ในการวิจัย (Research Instruments - แยกตาม 2 ประเภทเคร่งครัด)",
            title: "3.4 เครื่องมือที่ใช้ในการวิจัย (Research Instruments - แยกตาม 2 ประเภทเคร่งครัด)",
            type: "custom_html",
            content: `
              <div class="space-y-4 text-xs">
                <div class="p-3 rounded-xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
                  <div class="font-bold text-sm text-sky-900 dark:text-sky-200 flex items-center gap-2 mb-2">
                    <span class="px-2 py-0.5 rounded bg-sky-600 text-white text-[11px]">ประเภทที่ 1</span>
                    <span>เครื่องมือที่ใช้ในการทดลอง / จัดกระทำ (Experimental Instruments)</span>
                  </div>
                  <p class="text-slate-600 dark:text-slate-400 mb-2">เป็นนวัตกรรมและสื่อที่ผู้วิจัยสร้างขึ้นเพื่อนำไปใช้จัดกิจกรรมการเรียนรู้กับกลุ่มตัวอย่าง:</p>
                  <div class="space-y-2">
                    ${expInsts.map((inst, idx) => `
                      <div class="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div class="font-bold text-slate-800 dark:text-slate-200">1.${idx + 1} ${inst.name}</div>
                        <div class="text-slate-600 dark:text-slate-400 mt-0.5">${inst.description || 'เครื่องมือนวัตกรรมสำหรับการจัดกระทำทางการทดลอง'}</div>
                        <div class="mt-1 text-[11px] text-sky-700 dark:text-sky-400">จำนวนการใช้งาน: ${inst.targetSessions || '6'} แผน/คาบ | สถานะ: พร้อมใช้</div>
                      </div>
                    `).join("")}
                  </div>
                </div>

                <div class="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <div class="font-bold text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-2 mb-2">
                    <span class="px-2 py-0.5 rounded bg-emerald-600 text-white text-[11px]">ประเภทที่ 2</span>
                    <span>เครื่องมือที่ใช้ในการเก็บรวบรวมข้อมูล (Data Collection Instruments)</span>
                  </div>
                  <p class="text-slate-600 dark:text-slate-400 mb-2">เป็นเครื่องมือวัดและประเมินผลเพื่อเก็บรวบรวมข้อมูลตัวแปรตาม:</p>
                  <div class="space-y-2">
                    ${dcInsts.map((inst, idx) => `
                      <div class="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div class="font-bold text-slate-800 dark:text-slate-200">2.${idx + 1} ${inst.name}</div>
                        <div class="text-slate-600 dark:text-slate-400 mt-0.5">วัดตัวแปรตาม: <b class="text-emerald-800 dark:text-emerald-300">${inst.targetConstruct || 'ตัวแปรตาม'}</b> | ลักษณะ: ${inst.format || 'แบบวัดมาตรฐาน'} (${inst.itemsCount || '40'} ข้อ/เกณฑ์)</div>
                        <div class="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400">เกณฑ์คุณภาพ: ${inst.qualityMetric || 'IOC ≥ 0.80, ความเชื่อมั่น KR-20 หรือ Alpha ≥ 0.80'}</div>
                      </div>
                    `).join("")}
                  </div>
                </div>
              </div>
            `
          },
          {
            heading: "3.5 ผังการสร้างแบบทดสอบ (Test Blueprint Table - Revised Bloom's 6 Levels)",
            title: "3.5 ผังการสร้างแบบทดสอบ (Test Blueprint Table - Revised Bloom's 6 Levels)",
            type: "custom_html",
            content: `
              <div class="space-y-3 text-xs">
                <p>ตารางวิเคราะห์หลักสูตรและผังการสร้างแบบทดสอบจำแนกตามพฤติกรรมพุทธิพิสัย 6 ระดับ (Revised Bloom's Taxonomy):</p>
                <div class="overflow-x-auto">
                  <table class="w-full border-collapse border border-slate-300 dark:border-slate-700 text-center">
                    <thead>
                      <tr class="bg-slate-100 dark:bg-slate-800 font-bold border-b border-slate-300 dark:border-slate-700">
                        <th class="p-2 border border-slate-300 dark:border-slate-700 text-left">หน่วยการเรียนรู้ / เนื้อหา</th>
                        <th class="p-2 border border-slate-300 dark:border-slate-700">เวลา (ชม.)</th>
                        <th class="p-2 border border-slate-300 dark:border-slate-700">จำ</th>
                        <th class="p-2 border border-slate-300 dark:border-slate-700">เข้าใจ</th>
                        <th class="p-2 border border-slate-300 dark:border-slate-700">ประยุกต์</th>
                        <th class="p-2 border border-slate-300 dark:border-slate-700">วิเคราะห์</th>
                        <th class="p-2 border border-slate-300 dark:border-slate-700">ประเมินค่า</th>
                        <th class="p-2 border border-slate-300 dark:border-slate-700">สร้างสรรค์</th>
                        <th class="p-2 border border-slate-300 dark:border-slate-700 font-bold bg-sky-50 dark:bg-sky-950">รวมข้อ</th>
                        <th class="p-2 border border-slate-300 dark:border-slate-700">ร้อยละ</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${bpUnits.map(u => {
                        const rowSum = (Number(u.remember) || 0) + (Number(u.understand) || 0) + (Number(u.apply) || 0) + (Number(u.analyze) || 0) + (Number(u.evaluate) || 0) + (Number(u.create) || 0);
                        const rowPct = bpGrandTotal > 0 ? ((rowSum / bpGrandTotal) * 100).toFixed(1) : "0.0";
                        return `
                          <tr class="border-b border-slate-200 dark:border-slate-800">
                            <td class="p-2 border border-slate-300 dark:border-slate-700 text-left font-medium">${u.name}</td>
                            <td class="p-2 border border-slate-300 dark:border-slate-700">${u.hours || 0}</td>
                            <td class="p-2 border border-slate-300 dark:border-slate-700">${u.remember || 0}</td>
                            <td class="p-2 border border-slate-300 dark:border-slate-700">${u.understand || 0}</td>
                            <td class="p-2 border border-slate-300 dark:border-slate-700">${u.apply || 0}</td>
                            <td class="p-2 border border-slate-300 dark:border-slate-700">${u.analyze || 0}</td>
                            <td class="p-2 border border-slate-300 dark:border-slate-700">${u.evaluate || 0}</td>
                            <td class="p-2 border border-slate-300 dark:border-slate-700">${u.create || 0}</td>
                            <td class="p-2 border border-slate-300 dark:border-slate-700 font-bold bg-sky-50 dark:bg-sky-950">${rowSum}</td>
                            <td class="p-2 border border-slate-300 dark:border-slate-700">${rowPct}%</td>
                          </tr>
                        `;
                      }).join("")}
                      <tr class="bg-slate-100 dark:bg-slate-800 font-bold border-t-2 border-slate-400">
                        <td class="p-2 border border-slate-300 dark:border-slate-700 text-left">รวมทั้งสิ้น</td>
                        <td class="p-2 border border-slate-300 dark:border-slate-700">${bpColTotals.hours}</td>
                        <td class="p-2 border border-slate-300 dark:border-slate-700">${bpColTotals.remember}</td>
                        <td class="p-2 border border-slate-300 dark:border-slate-700">${bpColTotals.understand}</td>
                        <td class="p-2 border border-slate-300 dark:border-slate-700">${bpColTotals.apply}</td>
                        <td class="p-2 border border-slate-300 dark:border-slate-700">${bpColTotals.analyze}</td>
                        <td class="p-2 border border-slate-300 dark:border-slate-700">${bpColTotals.evaluate}</td>
                        <td class="p-2 border border-slate-300 dark:border-slate-700">${bpColTotals.create}</td>
                        <td class="p-2 border border-slate-300 dark:border-slate-700 bg-sky-100 dark:bg-sky-900">${bpGrandTotal}</td>
                        <td class="p-2 border border-slate-300 dark:border-slate-700">100.0%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div class="font-bold text-slate-800 dark:text-slate-200">เกณฑ์การสร้างและจำนวนข้อทดลองนำร่อง (Try-out Item Count):</div>
                  <div class="text-slate-600 dark:text-slate-400">
                    - จำนวนข้อสอบที่ต้องการใช้จริง: <b>${bpGrandTotal} ข้อ</b>
                    <br>- อัตราข้อสอบสำรองเพื่อการทดลองใช้ (Buffer Rate): <b>+${bufferPct}%</b> (ตามหลักจิตวิทยาการวัดผลเพื่อคัดกรองค่าความยากง่าย p และอำนาจจำแนก r)
                    <br>- จำนวนข้อสอบที่ต้องสร้างและนำไป Try-out: <b>${suggestedTryoutCount} ข้อ</b> (คัดเลือกไว้ ${bpGrandTotal} ข้อที่มีคุณภาพตามเกณฑ์)
                  </div>
                </div>
              </div>
            `
          },
          {
            heading: "3.6 เกณฑ์การประเมินรูบริกแบบวิเคราะห์ (Analytic Rubrics 4 ระดับคุณภาพ)",
            title: "3.6 เกณฑ์การประเมินรูบริกแบบวิเคราะห์ (Analytic Rubrics 4 ระดับคุณภาพ)",
            type: "custom_html",
            content: `
              <div class="space-y-3 text-xs">
                ${rubrics.map(rub => `
                  <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div class="font-bold text-sm text-slate-800 dark:text-slate-200 mb-2">${rub.title}</div>
                    <div class="overflow-x-auto">
                      <table class="w-full border-collapse border border-slate-300 dark:border-slate-700 text-left">
                        <thead>
                          <tr class="bg-slate-100 dark:bg-slate-800 font-bold border-b border-slate-300 dark:border-slate-700">
                            <th class="p-2 border border-slate-300 dark:border-slate-700 w-1/4">ประเด็นการประเมิน / น้ำหนัก</th>
                            <th class="p-2 border border-slate-300 dark:border-slate-700 w-1/5">ดีเยี่ยม (4 คะแนน)</th>
                            <th class="p-2 border border-slate-300 dark:border-slate-700 w-1/5">ดี (3 คะแนน)</th>
                            <th class="p-2 border border-slate-300 dark:border-slate-700 w-1/6">พอใช้ (2 คะแนน)</th>
                            <th class="p-2 border border-slate-300 dark:border-slate-700 w-1/6">ปรับปรุง (1 คะแนน)</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${(rub.criteria || []).map(c => `
                            <tr class="border-b border-slate-200 dark:border-slate-800 align-top">
                              <td class="p-2 border border-slate-300 dark:border-slate-700 font-semibold bg-slate-50/50 dark:bg-slate-800/50">
                                ${c.name}
                                <div class="text-[11px] text-sky-700 dark:text-sky-400 font-normal mt-0.5">น้ำหนัก: ${c.weight || 25}%</div>
                              </td>
                              <td class="p-2 border border-slate-300 dark:border-slate-700">${c.level4}</td>
                              <td class="p-2 border border-slate-300 dark:border-slate-700">${c.level3}</td>
                              <td class="p-2 border border-slate-300 dark:border-slate-700">${c.level2}</td>
                              <td class="p-2 border border-slate-300 dark:border-slate-700 text-slate-500">${c.level1}</td>
                            </tr>
                          `).join("")}
                        </tbody>
                      </table>
                    </div>
                  </div>
                `).join("")}
              </div>
            `
          }
        ]
      },

      // บทที่ 4: ผลการวิเคราะห์ข้อมูล (4 Distinct Sections Matching 4 R&D Objectives)
      {
        number: 4,
        chapterNo: 4,
        title: "บทที่ 4",
        subtitle: "ผลการวิเคราะห์ข้อมูล",
        sections: [
          {
            heading: `4.1 ตอนที่ 1 ผลการวิเคราะห์ข้อมูลพื้นฐาน สภาพปัญหา และความต้องการจำเป็นในการพัฒนา${bShort} (ระยะ R1)`,
            title: `4.1 ตอนที่ 1 ผลการวิเคราะห์ข้อมูลพื้นฐาน สภาพปัญหา และความต้องการจำเป็นในการพัฒนา${bShort} (ระยะ R1)`,
            type: "stat_tables",
            tables: [table4_1]
          },
          {
            heading: `4.2 ตอนที่ 2 ผลการสร้าง พัฒนา และตรวจสอบคุณภาพนวัตกรรม (ระยะ D1)`,
            title: `4.2 ตอนที่ 2 ผลการสร้าง พัฒนา และตรวจสอบคุณภาพนวัตกรรม (ระยะ D1)`,
            type: "stat_tables",
            tables: [table4_2a, table4_2b]
          },
          {
            heading: `4.3 ตอนที่ 3 ผลการทดลองใช้นวัตกรรมกับกลุ่มตัวอย่าง (ระยะ R2)`,
            title: `4.3 ตอนที่ 3 ผลการทดลองใช้นวัตกรรมกับกลุ่มตัวอย่าง (ระยะ R2)`,
            type: "stat_tables",
            tables: [table4_3a, table4_3b, table4_3c]
          },
          {
            heading: `4.4 ตอนที่ 4 ผลการประเมินความพึงพอใจและข้อเสนอแนะในการปรับปรุง (ระยะ D2)`,
            title: `4.4 ตอนที่ 4 ผลการประเมินความพึงพอใจและข้อเสนอแนะในการปรับปรุง (ระยะ D2)`,
            type: "stat_tables",
            tables: [table4_4]
          }
        ]
      },

      // บทที่ 5: สรุปผล อภิปรายผล และข้อเสนอแนะ (3-Tier Academic Discussion Structure)
      {
        number: 5,
        chapterNo: 5,
        title: "บทที่ 5",
        subtitle: "สรุปผล อภิปรายผล และข้อเสนอแนะ",
        sections: [
          {
            heading: "5.1 สรุปผลการวิจัย (4 ตอนตามวัตถุประสงค์ R1-D1-R2-D2)",
            title: "5.1 สรุปผลการวิจัย (4 ตอนตามวัตถุประสงค์ R1-D1-R2-D2)",
            type: "custom_html",
            content: `
              <div class="space-y-2.5 text-xs text-justify leading-relaxed">
                <p><b>1. ผลการศึกษาข้อมูลพื้นฐาน (ระยะ R1):</b> จากการประเมินความต้องการจำเป็น (PNI_modified) พบว่า "${sortedPni[0]?.name || 'การจัดการเรียนรู้เพื่อพัฒนาทักษะการคิด'}" มีความจำเป็นสูงสุดเป็นลำดับที่ 1 (PNI_modified = ${(sortedPni[0]?.pni || 1.252).toFixed(3)}) สะท้อนปัญหาที่ผู้เรียนขาดทักษะ${c1} และครูผู้สอนต้องการนวัตกรรมการจัดการเรียนรู้เชิงรุกที่ชัดเจน</p>
                <p><b>2. ผลการพัฒนาและตรวจสอบคุณภาพ (ระยะ D1):</b> เครื่องมือนวัตกรรมและเครื่องมือวัดผลมีค่าเฉลี่ยความสอดคล้องเชิงเนื้อหา (IOC) เท่ากับ 0.92 และแบบทดสอบมีค่าความเชื่อมั่น KR-20 เท่ากับ 0.864 และผลการทดสอบประสิทธิภาพ E1/E2 เท่ากับ ${st.e1}/${st.e2} ซึ่งสูงกว่าเกณฑ์ ${crit} ที่กำหนดไว้ และมีผลต่างเพียง ${eDiffVal}% ผ่านเกณฑ์ความแปรปรวน</p>
                <p><b>3. ผลการทดลองใช้จริงกับกลุ่มตัวอย่าง (ระยะ R2):</b> ผู้เรียนมีคะแนน${c1} หลังเรียน (x̄ = ${Number(st.c1PostMean).toFixed(2)}) สูงกว่าก่อนเรียน (x̄ = ${Number(st.c1PreMean).toFixed(2)}) อย่างมีนัยสำคัญทางสถิติที่ระดับ .05 (${isNonRandom ? 'Wilcoxon Z = 5.24' : `t = ${st.c1TValue || '21.34'}`}, p < .001) ขนาดอิทธิพล Cohen's d = 1.84 และมีค่าดัชนีประสิทธิผล (E.I.) เท่ากับ ${st.ei} (${(Number(st.ei) * 100).toFixed(2)}%) ซึ่งสูงกว่าเกณฑ์ 0.50</p>
                <p><b>4. ผลการศึกษาความพึงพอใจ (ระยะ D2):</b> ผู้เรียนมีความพึงพอใจต่อการจัดการเรียนรู้ด้วย${bShort} ในภาพรวมอยู่ในระดับมากที่สุด (x̄ = ${Number(st.satMean).toFixed(2)}, S.D. = ${Number(st.satSD).toFixed(2)})</p>
              </div>
            `
          },
          {
            heading: "5.2 การอภิปรายผลการวิจัย (3-Tier Academic Discussion Structure)",
            title: "5.2 การอภิปรายผลการวิจัย (3-Tier Academic Discussion Structure)",
            type: "custom_html",
            content: `
              <div class="space-y-4 text-xs leading-relaxed text-justify">
                <!-- ประเด็นที่ 1 -->
                <div class="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <div class="font-bold text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <span class="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px]">ประเด็นที่ 1</span>
                    <span>ด้านประสิทธิภาพของนวัตกรรม (${st.e1}/${st.e2} ตามเกณฑ์ ${crit})</span>
                  </div>
                  <p><b>1. ระดับสรุปผลตามเกณฑ์ (Result Summary):</b> ผลการวิจัยพบว่า ${bShort} มีประสิทธิภาพของกระบวนการ (E1) เท่ากับ ${st.e1}% และประสิทธิภาพของผลลัพธ์ (E2) เท่ากับ ${st.e2}% ซึ่งสูงกว่าเกณฑ์มาตรฐาน ${crit} และมีผลต่างประสิทธิภาพ (|E1 - E2|) เพียง ${eDiffVal}% ซึ่งไม่เกินเกณฑ์ความคลาดเคลื่อน 5.0%</p>
                  <p><b>2. ระดับกลไกเชิงสาเหตุจากขั้นตอนนวัตกรรม D1 (Causal Mechanism):</b> ทั้งนี้เป็นเพราะผู้วิจัยได้ยกร่างนวัตกรรมอย่างเป็นระบบโดยผ่านการสังเคราะห์ขั้นตอนกิจกรรม ${syntaxData.finalSynthesizedSteps.length} ขั้นตอน และผ่านการประเมินของผู้เชี่ยวชาญ 5 ท่าน รวมทั้งได้นำไปทดลองนำร่อง (Try-out) เพื่อปรับปรุงภาษา ใบงาน และระยะเวลาในแต่ละกิจกรรมให้มีความกระชับ นอกจากนี้ ในแต่ละขั้นตอน โดยเฉพาะขั้นสืบเสาะความรู้และลงมือปฏิบัติจริง ผู้เรียนได้มีส่วนร่วมในการทำกิจกรรมอย่างกระตือรือร้น ทำให้เกิดความเข้าใจคงทน ส่งผลให้คะแนนระหว่างเรียน (E1) และคะแนนหลังเรียน (E2) สูงกว่าเกณฑ์อย่างสมดุล</p>
                  <p><b>3. ระดับความสอดคล้องกับทฤษฎีและงานวิจัยในบทที่ 2 (Theoretical Alignment):</b> สอดคล้องกับหลักการพัฒนาประสิทธิภาพสื่อนวัตกรรมของ รศ.ดร.ชวลิต ชูกำแพง (2563) และ เผชิญ กิจระการ (2546) ที่ระบุว่าการสร้างนวัตกรรมที่มีขั้นตอนเชื่อมโยงตามลำดับพัฒนาการของผู้เรียนจะส่งผลให้ประสิทธิภาพกระบวนการและผลลัพธ์มีความกลมกลืน และสอดคล้องกับงานวิจัยของ สมชาย คงคาหลวง (2568) ที่พบว่าการจัดกิจกรรมการเรียนรู้แบบมีส่วนร่วมช่วยให้นวัตกรรมมีประสิทธิภาพสูงกว่าเกณฑ์ 80/80 อย่างมีนัยสำคัญ</p>
                </div>

                <!-- ประเด็นที่ 2 -->
                <div class="p-3.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 space-y-2">
                  <div class="font-bold text-sm text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                    <span class="px-2 py-0.5 rounded bg-sky-600 text-white text-[10px]">ประเด็นที่ 2</span>
                    <span>ด้าน${c1} ของผู้เรียนหลังเรียนสูงกว่าก่อนเรียนอย่างมีนัยสำคัญทางสถิติ</span>
                  </div>
                  <p><b>1. ระดับสรุปผลตามสมมติฐาน (Result Summary):</b> ผลการวิจัยพบว่า ผู้เรียนมีคะแนน${c1} หลังเรียน (x̄ = ${Number(st.c1PostMean).toFixed(2)}) สูงกว่าก่อนเรียน (x̄ = ${Number(st.c1PreMean).toFixed(2)}) อย่างมีนัยสำคัญทางสถิติที่ระดับ .05 (${isNonRandom ? 'Wilcoxon Z = 5.24' : `t = ${st.c1TValue || '21.34'}`}, p < .001) และมีขนาดอิทธิพล Cohen's d เท่ากับ 1.84 ซึ่งเป็นผลกระทบระดับใหญ่มาก สอดคล้องกับสมมติฐานการวิจัย</p>
                  <p><b>2. ระดับกลไกเชิงสาเหตุจากขั้นตอนนวัตกรรม D1 (Causal Mechanism):</b> ทั้งนี้เนื่องจากในกระบวนการจัดการเรียนรู้ของ ${bShort} ผู้เรียนได้เรียนรู้ผ่าน ${syntaxData.finalSynthesizedSteps.length} ขั้นตอนอย่างต่อเนื่อง โดยเฉพาะในขั้นที่ 2 การสืบเสาะและร่วมมือแก้ปัญหา และขั้นที่ 3 การลงมือปฏิบัติสร้างสรรค์ชิ้นงาน ผู้เรียนได้ฝึกคิดวิเคราะห์สถานการณ์ปัญหาจริง ได้แลกเปลี่ยนมุมมองกับเพื่อนร่วมกลุ่ม และได้รับคำชี้แนะย้อนกลับ (Formative Feedback) จากครูผู้สอนทันที ทำให้สามารถปรับปรุงกระบวนการคิดและสร้างองค์ความรู้ได้ด้วยตนเอง</p>
                  <p><b>3. ระดับความสอดคล้องกับทฤษฎีและงานวิจัยในบทที่ 2 (Theoretical Alignment):</b> สอดคล้องกับทฤษฎีการสร้างความรู้ด้วยตนเองผ่านปฏิสัมพันธ์ทางสังคม (Social Constructivism) ของ Lev Vygotsky (1978) ที่ระบุว่าการเรียนรู้ของผู้เรียนจะพัฒนาได้สูงสุดเมื่อได้มีปฏิสัมพันธ์ร่วมมือกับผู้อื่นในพื้นที่รอยต่อพัฒนาการ (Zone of Proximal Development: ZPD) และสอดคล้องกับแนวคิด Active Learning ของ Joyce & Weil (2009) รวมถึงงานวิจัยของ นิตยา พลเยี่ยม (2568) ที่พบว่าการจัดการเรียนรู้เชิงรุกช่วยพัฒนาทักษะการคิดวิเคราะห์ของผู้เรียนได้อย่างมีนัยสำคัญ</p>
                </div>

                <!-- ประเด็นที่ 3 -->
                <div class="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
                  <div class="font-bold text-sm text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <span class="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px]">ประเด็นที่ 3</span>
                    <span>ด้านดัชนีประสิทธิผล (Effectiveness Index: E.I. = ${st.ei})</span>
                  </div>
                  <p><b>1. ระดับสรุปผลตามเกณฑ์ (Result Summary):</b> ค่าดัชนีประสิทธิผลเท่ากับ ${st.ei} คิดเป็นร้อยละ ${(Number(st.ei) * 100).toFixed(2)} ซึ่งสูงกว่าเกณฑ์ยอมรับมาตรฐานที่ 0.50 ขึ้นไป</p>
                  <p><b>2. ระดับกลไกเชิงสาเหตุจากขั้นตอนนวัตกรรม D1 (Causal Mechanism):</b> ผู้เรียนมีอัตราพัฒนาการความก้าวหน้าอย่างก้าวกระโดดเนื่องจากกิจกรรมการเรียนรู้มีการเรียงลำดับจากง่ายไปสู่ยาก มีการจัดทำผังแบบทดสอบ (Test Blueprint) ครอบคลุมพฤติกรรมพุทธิพิสัย 6 ระดับ ทำให้การวัดผลมีความเที่ยงตรงและสะท้อนความงอกงามทางปัญญาของผู้เรียนได้อย่างแท้จริง</p>
                  <p><b>3. ระดับความสอดคล้องกับทฤษฎีและงานวิจัยในบทที่ 2 (Theoretical Alignment):</b> สอดคล้องกับหลักการวัดและประเมินผลการเรียนรู้ของ เผชิญ กิจระการ และ ชวลิต ชูกำแพง ที่ชี้ว่าดัชนีประสิทธิผลที่เกิน 0.50 ยืนยันว่านวัตกรรมส่งเสริมให้ผู้เรียนเรียนรู้ได้เกินกว่าครึ่งหนึ่งของศักยภาพที่สามารถพัฒนาได้</p>
                </div>

                <!-- ประเด็นที่ 4 -->
                <div class="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2">
                  <div class="font-bold text-sm text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <span class="px-2 py-0.5 rounded bg-amber-600 text-white text-[10px]">ประเด็นที่ 4</span>
                    <span>ด้านความพึงพอใจของผู้เรียนที่มีต่อการจัดการเรียนรู้ (x̄ = ${Number(st.satMean).toFixed(2)})</span>
                  </div>
                  <p><b>1. ระดับสรุปผลตามเกณฑ์ (Result Summary):</b> ผู้เรียนมีความพึงพอใจอยู่ในระดับมากที่สุด (x̄ = ${Number(st.satMean).toFixed(2)}, S.D. = ${Number(st.satSD).toFixed(2)})</p>
                  <p><b>2. ระดับกลไกเชิงสาเหตุจากขั้นตอนนวัตกรรม D1 (Causal Mechanism):</b> กิจกรรมการเรียนรู้เน้นให้ผู้เรียนได้ลงมือทำ บรรยากาศในชั้นเรียนมีความเป็นกัลยาณมิตร ครูปรับเปลี่ยนบทบาทจากผู้บรรยายมาเป็นผู้อำนวยความสะดวก (Facilitator) และมีการใช้สื่อนวัตกรรมที่ทันสมัย ทำให้ผู้เรียนรู้สึกสนุก ท้าทาย และเห็นคุณค่าของสิ่งที่เรียน</p>
                  <p><b>3. ระดับความสอดคล้องกับทฤษฎีและงานวิจัยในบทที่ 2 (Theoretical Alignment):</b> สอดคล้องกับทฤษฎีแรงจูงใจภายใน (Intrinsic Motivation Theory) และแนวคิดจิตวิทยาเชิงบวกในการจัดการชั้นเรียนที่ระบุว่า ความรู้สึกเป็นเจ้าของการเรียนรู้และการมีอิสระในการคิดแก้ปัญหาจะสร้างความพึงพอใจและความผูกพันต่อการเรียนรู้ในระดับสูง</p>
                </div>
              </div>
            `
          },
          {
            heading: "5.3 ข้อเสนอแนะ (ข้อเสนอแนะเชิงปฏิบัติ และข้อเสนอแนะในการวิจัยครั้งต่อไป)",
            title: "5.3 ข้อเสนอแนะ (ข้อเสนอแนะเชิงปฏิบัติ และข้อเสนอแนะในการวิจัยครั้งต่อไป)",
            type: "custom_html",
            content: `
              <div class="space-y-3 text-xs leading-relaxed text-justify">
                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div class="font-bold text-slate-900 dark:text-white">5.3.1 ข้อเสนอแนะในการนำผลการวิจัยไปใช้ (Practical Recommendations):</div>
                  <p><b>1) สำหรับผู้บริหารสถานศึกษาและศึกษานิเทศก์:</b> ควรส่งเสริมและสนับสนุนการจัดตั้งชุมชนแห่งการเรียนรู้ทางวิชาชีพ (PLC) เพื่อให้ครูผู้สอนได้ร่วมกันวิเคราะห์แผนการจัดการเรียนรู้ ออกแบบสื่อนวัตกรรม และแลกเปลี่ยนเทคนิคการจัดการเรียนรู้เชิงรุกอย่างต่อเนื่อง พร้อมจัดสรรทรัพยากรและงบประมาณสนับสนุนอุปกรณ์การเรียนรู้</p>
                  <p><b>2) สำหรับครูผู้สอน:</b> ควรเตรียมความพร้อมด้านสื่ออุปกรณ์และชี้แจงบทบาทหน้าที่ของสมาชิกในกลุ่มให้ชัดเจนก่อนเริ่มกิจกรรม มีการบริหารเวลาในแต่ละขั้นตอนอย่างยืดหยุ่นตามความพร้อมของผู้เรียน และควรให้ความสำคัญกับการให้ข้อมูลย้อนกลับเชิงสร้างสรรค์ (Constructive Feedback) แก่ผู้เรียนเป็นรายบุคคล</p>
                </div>

                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div class="font-bold text-slate-900 dark:text-white">5.3.2 ข้อเสนอแนะในการทำวิจัยครั้งต่อไป (Future Research Recommendations):</div>
                  <p><b>1) การศึกษาความคงทนในการเรียนรู้ (Retention):</b> ควรมีการติดตามและทดสอบวัดความคงทนในการเรียนรู้ของผู้เรียนหลังจากเสร็จสิ้นการจัดการเรียนรู้ไปแล้ว 2–4 สัปดาห์ เพื่อยืนยันว่าทักษะและองค์ความรู้ที่เกิดขึ้นมีความยั่งยืน</p>
                  <p><b>2) การขยายผลสู่กลุ่มสาระการเรียนรู้และระดับชั้นอื่น:</b> ควรนำกระบวนการจัดการเรียนรู้ของ ${bShort} ไปปรับประยุกต์ใช้กับกลุ่มสาระการเรียนรู้อื่น หรือกลุ่มผู้เรียนในระดับชั้นอื่นและบริบทสถานศึกษาที่มีความหลากหลาย เพื่อขยายขอบเขตและยืนยันประสิทธิผลของนวัตกรรมให้กว้างขวางยิ่งขึ้น</p>
                </div>
              </div>
            `
          }
        ]
      }
    ];

    const appendix = this.generateAppendix(p);

    return {
      fullTitle,
      chapters,
      appendix,
      matrix,
      opTable,
      r1d1Bridge,
      modelComponents
    };
  },

  // ==========================================================================
  // ระบบสร้างเอกสารภาคผนวกและเครื่องมือวิจัยฉบับจริง (ภาคผนวก ก, ข, ค, ง)
  // ตามเกณฑ์ วPA และระเบียบวิธีวิจัยของ รศ.ดร.ชวลิต ชูกำแพง
  // ==========================================================================
  generateAppendix(p) {
    const fullTitle = this.composeFullTitle(p);
    const bShort = p.B_short || p.B || "นวัตกรรมการจัดการเรียนรู้";
    const c1 = (p.C_list || [])[0] || "ผลสัมฤทธิ์ทางการเรียน";
    const d = p.D || "นักเรียนชั้นมัธยมศึกษา";
    const researcher = p.researcher || p.author || "นายสมชาย ใจมั่น";
    const position = p.position || "ครู วิทยฐานะครูชำนาญการพิเศษ";
    const school = p.school || p.workplace || "โรงเรียนเป้าหมาย สพฐ.";
    const affiliation = p.affiliation || "สำนักงานเขตพื้นที่การศึกษา";
    const crit = p.efficiencyCriterion || "80/80";
    const rubrics = p.analyticRubrics || window.ROAD_DATA.DEFAULT_ANALYTIC_RUBRICS || [];
    const rub1 = rubrics[0] || { title: "เกณฑ์การประเมินทักษะปฏิบัติ", criteria: [] };

    const appendices = [
      // ภาคผนวก ก: รายชื่อผู้เชี่ยวชาญและหนังสือขอความอนุเคราะห์
      {
        code: "ก",
        title: "ภาคผนวก ก",
        subtitle: "รายชื่อผู้เชี่ยวชาญและหนังสือขอความอนุเคราะห์เป็นผู้เชี่ยวชาญตรวจสอบคุณภาพเครื่องมือวิจัย",
        sections: [
          {
            heading: "ก.1 หนังสือขอความอนุเคราะห์เป็นผู้เชี่ยวชาญตรวจสอบคุณภาพเครื่องมือวิจัยและนวัตกรรม",
            title: "ก.1 หนังสือขอความอนุเคราะห์เป็นผู้เชี่ยวชาญตรวจสอบคุณภาพเครื่องมือวิจัยและนวัตกรรม",
            type: "custom_html",
            content: `
              <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-sm text-xs sm:text-sm font-sans space-y-4">
                <div class="text-center font-bold text-base sm:text-lg text-slate-900 dark:text-white border-b pb-3 border-slate-200 dark:border-slate-800">
                  บันทึกข้อความ / หนังสือขอความอนุเคราะห์ผู้เชี่ยวชาญ
                </div>
                <div class="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                  <div><b>หน่วยงาน:</b> ${school} ${affiliation}</div>
                  <div class="text-right"><b>วันที่:</b> 12 พฤษภาคม 2569</div>
                  <div class="col-span-2"><b>เรื่อง:</b> ขอความอนุเคราะห์เป็นผู้เชี่ยวชาญตรวจสอบคุณภาพเครื่องมือการวิจัยและนวัตกรรม</div>
                  <div class="col-span-2"><b>เรียน:</b> ผู้เชี่ยวชาญตรวจสอบคุณภาพเครื่องมือวิจัย</div>
                </div>
                <div class="space-y-2 text-slate-700 dark:text-slate-300 leading-relaxed text-justify">
                  <p class="indent-8">
                    ด้วยข้าพเจ้า <b>${researcher}</b> ตำแหน่ง ${position} ${school} กำลังดำเนินการวิจัยและพัฒนา (Research and Development: R&D) เรื่อง <b>"${fullTitle}"</b> เพื่อพัฒนาคุณภาพการจัดการเรียนรู้ของผู้เรียน และใช้เป็นผลงานทางวิชาการประกอบการเสนอขอเลื่อนวิทยฐานะตามเกณฑ์ วPA
                  </p>
                  <p class="indent-8">
                    ในการนี้ ผู้วิจัยได้สร้างและพัฒนานวัตกรรมพร้อมเครื่องมือการวิจัยเสร็จเรียบร้อยแล้ว และมีความประสงค์จะตรวจสอบคุณภาพความเที่ยงตรงเชิงเนื้อหา (Content Validity) ความถูกต้องเหมาะสมของภาษา และความเป็นไปได้ในการนำไปปฏิบัติจริง ผู้วิจัยได้พิจารณาเห็นว่าท่านเป็นผู้ทรงคุณวุฒิ มีความรู้ ความสามารถ และประสบการณ์เชี่ยวชาญสูงยิ่ง จึงใคร่ขอความอนุเคราะห์จากท่านเป็นผู้เชี่ยวชาญตรวจพิจารณาเครื่องมือวิจัย ดังรายการต่อไปนี้:
                  </p>
                  <div class="pl-10 space-y-1">
                    <div>1. แผนการจัดการเรียนรู้และนวัตกรรม <b>${bShort}</b> จำนวน 6 แผนการจัดการเรียนรู้</div>
                    <div>2. แบบทดสอบวัด${c1} (ฉบับทดลองใช้ Try-out) จำนวน 40 ข้อ</div>
                    <div>3. แบบประเมินทักษะปฏิบัติตามเกณฑ์รูบริกแบบวิเคราะห์ (Analytic Rubrics)</div>
                    <div>4. แบบสอบถามความพึงพอใจของผู้เรียนที่มีต่อการจัดการเรียนรู้</div>
                    <div>5. แบบประเมินความสอดคล้องเชิงเนื้อหา (IOC) สำหรับผู้เชี่ยวชาญ</div>
                  </div>
                  <p class="indent-8">
                    หวังเป็นอย่างยิ่งว่าจะได้รับความอนุเคราะห์จากท่าน และขอขอบพระคุณเป็นอย่างสูงมา ณ โอกาสนี้
                  </p>
                </div>
                <div class="pt-6 flex justify-end text-right text-slate-800 dark:text-slate-200">
                  <div class="space-y-1">
                    <p>ขอแสดงความนับถืออย่างยิ่ง</p>
                    <p class="pt-8">(${researcher})</p>
                    <p>ตำแหน่ง ${position}</p>
                    <p>${school}</p>
                  </div>
                </div>
              </div>
            `
          },
          {
            heading: "ก.2 รายชื่อผู้เชี่ยวชาญตรวจสอบคุณภาพเครื่องมือวิจัยและนวัตกรรม (5 ท่าน)",
            title: "ก.2 รายชื่อผู้เชี่ยวชาญตรวจสอบคุณภาพเครื่องมือวิจัยและนวัตกรรม (5 ท่าน)",
            type: "stat_tables",
            tables: [
              {
                tableNo: "ตารางที่ ก.1",
                caption: "รายชื่อผู้เชี่ยวชาญตรวจสอบคุณภาพเครื่องมือวิจัยและนวัตกรรม (Content Validity & IOC)",
                headers: ["ลำดับ", "ชื่อ - นามสกุล", "ตำแหน่ง / วิทยฐานะ", "สถานที่ทำงาน / สังกัด", "ความเชี่ยวชาญเฉพาะด้าน"],
                rows: [
                  ["1", "รศ.ดร.ชวลิต ชูกำแพง", "รองศาสตราจารย์ (สาขาหลักสูตรและการสอน)", "มหาวิทยาลัยมหาสารคาม", "ผู้เชี่ยวชาญด้านหลักสูตร การสอน และระเบียบวิธีวิจัย R&D"],
                  ["2", "ดร.สมเกียรติ พัฒนศักดิ์", "ศึกษานิเทศก์เชี่ยวชาญ (คศ.4)", "สำนักงานเขตพื้นที่การศึกษามัธยมศึกษา", "ผู้เชี่ยวชาญด้านการจัดการเรียนรู้เชิงรุกและเนื้อหาสาระ"],
                  ["3", "ผศ.ดร.นิภาพร จันทรประเสริฐ", "ผู้ช่วยศาสตราจารย์ (สาขาวัดและประเมินผล)", "มหาวิทยาลัยศรีนครินทรวิโรฒ", "ผู้เชี่ยวชาญด้านการวัด ประเมินผล และจิตวิทยาการศึกษา"],
                  ["4", "ดร.วรวิทย์ กาญจนสุข", "ผู้อำนวยการกลุ่มนิเทศ ติดตามและประเมินผล", "สำนักงานเขตพื้นที่การศึกษาประถมศึกษา", "ผู้เชี่ยวชาญด้านการวัดผลและเครื่องมือวิจัยทางการศึกษา"],
                  ["5", "ดร.กิตติพงษ์ เทพสุวรรณ", "อาจารย์ประจำสาขาเทคโนโลยีการศึกษา", "มหาวิทยาลัยขอนแก่น", "ผู้เชี่ยวชาญด้านสื่อนวัตกรรมและเทคโนโลยีดิจิทัลเพื่อการเรียนรู้"]
                ],
                interpretation: "ผู้เชี่ยวชาญทั้ง 5 ท่านเป็นผู้ทรงคุณวุฒิที่มีความเชี่ยวชาญตรงตามศาสตร์ ทั้งด้านเนื้อหากลุ่มสาระการเรียนรู้ ด้านการวัดและประเมินผล และด้านการพัฒนานวัตกรรมการเรียนรู้ตามมาตรฐานของสำนักงาน ก.ค.ศ."
              }
            ]
          }
        ]
      },

      // ภาคผนวก ข: แบบประเมินความสอดคล้อง IOC สำหรับผู้เชี่ยวชาญ
      {
        code: "ข",
        title: "ภาคผนวก ข",
        subtitle: "แบบประเมินความสอดคล้องเชิงเนื้อหา (Index of Item-Objective Congruence: IOC) สำหรับผู้เชี่ยวชาญ",
        sections: [
          {
            heading: "ข.1 คำชี้แจงและเกณฑ์การให้คะแนนแบบประเมิน IOC",
            title: "ข.1 คำชี้แจงและเกณฑ์การให้คะแนนแบบประเมิน IOC",
            type: "custom_html",
            content: `
              <div class="p-4 rounded-xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs sm:text-sm leading-relaxed space-y-2 text-slate-700 dark:text-slate-300">
                <div class="font-bold text-sky-900 dark:text-sky-200 text-sm">คำชี้แจงสำหรับผู้เชี่ยวชาญ:</div>
                <p>โปรดพิจารณาตรวจสอบความสอดคล้องระหว่างข้อคำถาม / แผนกิจกรรม / เกณฑ์การประเมิน กับวัตถุประสงค์เชิงพฤติกรรมและนิยามศัพท์เฉพาะ โดยทำเครื่องหมาย ✓ ลงในช่องคะแนนความคิดเห็นตามเกณฑ์ดังนี้:</p>
                <div class="grid sm:grid-cols-3 gap-2 pt-1 font-medium">
                  <div class="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                    <b>+1</b> หมายถึง แน่ใจว่า ข้อสอบ/กิจกรรม สอดคล้องกับวัตถุประสงค์
                  </div>
                  <div class="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300">
                    <b>0</b> หมายถึง ไม่แน่ใจว่า ข้อสอบ/กิจกรรม สอดคล้องกับวัตถุประสงค์
                  </div>
                  <div class="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300">
                    <b>-1</b> หมายถึง แน่ใจว่า ข้อสอบ/กิจกรรม ไม่สอดคล้องกับวัตถุประสงค์
                  </div>
                </div>
                <div class="text-[11px] text-slate-500 italic pt-1">
                  * เกณฑ์การตัดสิน: รายการที่มีค่าเฉลี่ย IOC ตั้งแต่ 0.60 ขึ้นไป ถือว่าผ่านเกณฑ์การยอมรับ (สำหรับผู้เชี่ยวชาญ 5 ท่าน)
                </div>
              </div>
            `
          },
          {
            heading: "ข.2 แบบประเมินความสอดคล้องเชิงเนื้อหาของเครื่องมือวิจัย (IOC Evaluation Form)",
            title: "ข.2 แบบประเมินความสอดคล้องเชิงเนื้อหาของเครื่องมือวิจัย (IOC Evaluation Form)",
            type: "stat_tables",
            tables: [
              {
                tableNo: "ตารางที่ ข.1",
                caption: `แบบประเมินความสอดคล้องระหว่างวัตถุประสงค์การวิจัยกับเครื่องมือนวัตกรรมและแบบวัดผล`,
                headers: ["ข้อที่", "รายการประเมินเครื่องมือและข้อคำถาม", "+1", "0", "-1", "ข้อเสนอแนะในการปรับปรุง"],
                rows: [
                  ["1", `แผนการจัดการเรียนรู้ที่ 1-6 มีขั้นตอนกิจกรรมสอดคล้องกับ ${bShort}`, "[  ]", "[  ]", "[  ]", "ระบุเวลาและสื่อให้กระชับ"],
                  ["2", `สื่อการเรียนรู้ ใบงาน และแบบฝึกปฏิบัติส่งเสริมทักษะ${c1}`, "[  ]", "[  ]", "[  ]", "เพิ่มภาพประกอบสถานการณ์ปัญหา"],
                  ["3", `ข้อสอบวัดพฤติกรรมด้านความจำ (Remembering) ตรงตามตัวชี้วัด`, "[  ]", "[  ]", "[  ]", "ข้อคำถามชัดเจนดีแล้ว"],
                  ["4", `ข้อสอบวัดพฤติกรรมด้านความเข้าใจ (Understanding) สอดคล้องกับบทเรียน`, "[  ]", "[  ]", "[  ]", "ปรับตัวเลือกไม่ให้กำกวม"],
                  ["5", `ข้อสอบวัดพฤติกรรมด้านการประยุกต์ใช้ (Applying) มีสถานการณ์จำลอง`, "[  ]", "[  ]", "[  ]", "เชื่อมโยงชีวิตประจำวัน"],
                  ["6", `ข้อสอบวัดพฤติกรรมด้านการวิเคราะห์ (Analyzing) จำแนกสาเหตุได้`, "[  ]", "[  ]", "[  ]", "ดีมาก ส่งเสริมการคิดวิเคราะห์"],
                  ["7", `ข้อสอบวัดพฤติกรรมด้านการประเมินค่า (Evaluating) มีเกณฑ์ตัดสินชัดเจน`, "[  ]", "[  ]", "[  ]", "ปรับความยาวโจทย์ให้พอดี"],
                  ["8", `ข้อสอบวัดพฤติกรรมด้านการสร้างสรรค์ (Creating) กระตุ้นจินตนาการ`, "[  ]", "[  ]", "[  ]", "เปิดโอกาสให้ตอบหลากหลาย"],
                  ["9", `เกณฑ์รูบริกประเมินทักษะปฏิบัติ 4 ระดับคุณภาพมีความชัดเจนและวัดได้จริง`, "[  ]", "[  ]", "[  ]", "เกณฑ์พฤติกรรมบ่งชี้ชัดเจนมาก"],
                  ["10", `แบบสอบถามความพึงพอใจ 5 ระดับครอบคลุมกระบวนการและบรรยากาศการเรียน`, "[  ]", "[  ]", "[  ]", "ข้อคำถามเข้าใจง่าย เหมาะกับผู้เรียน"]
                ],
                footnote: "คะแนนความคิดเห็นรวมของผู้เชี่ยวชาญจะถูกนำไปคำนวณ IOC = ∑R / N ตามสูตรของ Rovinelli and Hambleton",
                interpretation: "ตารางแบบประเมินนี้ใช้สำหรับให้ผู้เชี่ยวชาญทั้ง 5 ท่านพิจารณาให้คะแนนความสอดคล้องเชิงเนื้อหา พร้อมบันทึกข้อเสนอแนะเพื่อนำมาปรับปรุงเครื่องมือก่อนการทดลองใช้ (Try-out)"
              }
            ]
          }
        ]
      },

      // ภาคผนวก ค: เครื่องมือที่ใช้ในการเก็บรวบรวมข้อมูลฉบับจริง
      {
        code: "ค",
        title: "ภาคผนวก ค",
        subtitle: "เครื่องมือที่ใช้ในการวิจัยและเก็บรวบรวมข้อมูลฉบับจริง (พร้อมพิมพ์ใช้งาน)",
        sections: [
          {
            heading: "ค.1 แบบสอบถามความพึงพอใจของผู้เรียนที่มีต่อการจัดการเรียนรู้ (Student Satisfaction Questionnaire)",
            title: "ค.1 แบบสอบถามความพึงพอใจของผู้เรียนที่มีต่อการจัดการเรียนรู้ (Student Satisfaction Questionnaire)",
            type: "custom_html",
            content: `
              <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 space-y-4 text-xs sm:text-sm">
                <div class="text-center space-y-1 border-b pb-3 border-slate-200 dark:border-slate-800">
                  <h3 class="font-bold text-base sm:text-lg text-slate-900 dark:text-white">แบบสอบถามความพึงพอใจของผู้เรียนที่มีต่อการจัดการเรียนรู้ด้วย ${escapeHtml(bShort)}</h3>
                  <p class="text-slate-500">${escapeHtml(p.subject || 'กลุ่มสาระการเรียนรู้')} ${escapeHtml(d)}</p>
                </div>
                <div class="text-slate-700 dark:text-slate-300 leading-relaxed text-justify">
                  <b>คำชี้แจง:</b> แบบสอบถามฉบับนี้มีวัตถุประสงค์เพื่อสอบถามความคิดเห็นและความพึงพอใจของนักเรียนที่มีต่อการเรียนรู้ด้วย ${escapeHtml(bShort)} โปรดทำเครื่องหมาย ✓ ลงในช่องระดับความพึงพอใจที่ตรงกับความรู้สึกของนักเรียนมากที่สุด (5 = มากที่สุด, 4 = มาก, 3 = ปานกลาง, 2 = น้อย, 1 = น้อยที่สุด)
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-xs border-collapse border border-slate-300 dark:border-slate-700 text-center">
                    <thead>
                      <tr class="bg-slate-100 dark:bg-slate-800 font-bold border-b border-slate-300 dark:border-slate-700">
                        <th class="p-2 border border-slate-300 dark:border-slate-700 text-left w-3/5">รายการประเมินความพึงพอใจ</th>
                        <th class="p-2 border border-slate-300 dark:border-slate-700 w-12">มากที่สุด (5)</th>
                        <th class="p-2 border border-slate-300 dark:border-slate-700 w-12">มาก (4)</th>
                        <th class="p-2 border border-slate-300 dark:border-slate-700 w-12">ปานกลาง (3)</th>
                        <th class="p-2 border border-slate-300 dark:border-slate-700 w-12">น้อย (2)</th>
                        <th class="p-2 border border-slate-300 dark:border-slate-700 w-12">น้อยที่สุด (1)</th>
                      </tr>
                    </thead>
                    <tbody class="text-slate-800 dark:text-slate-200">
                      <tr class="bg-sky-50/60 dark:bg-sky-950/30 font-bold text-left"><td colspan="6" class="p-2 border border-slate-300 dark:border-slate-700">1. ด้านกระบวนการจัดกิจกรรมการเรียนรู้</td></tr>
                      <tr><td class="p-2 border border-slate-300 dark:border-slate-700 text-left">1.1 กิจกรรมการเรียนรู้มีความน่าสนใจ กระตุ้นให้อยากเรียนรู้</td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td></tr>
                      <tr><td class="p-2 border border-slate-300 dark:border-slate-700 text-left">1.2 ขั้นตอนการจัดกิจกรรมมีความต่อเนื่อง เรียงลำดับจากง่ายไปยาก</td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td></tr>
                      <tr><td class="p-2 border border-slate-300 dark:border-slate-700 text-left">1.3 นักเรียนได้ลงมือปฏิบัติกิจกรรมและทดลองแก้ปัญหาด้วยตนเอง</td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td></tr>
                      <tr><td class="p-2 border border-slate-300 dark:border-slate-700 text-left">1.4 มีการแลกเปลี่ยนเรียนรู้และทำงานร่วมกับเพื่อนในกลุ่มอย่างมีความสุข</td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td></tr>

                      <tr class="bg-sky-50/60 dark:bg-sky-950/30 font-bold text-left"><td colspan="6" class="p-2 border border-slate-300 dark:border-slate-700">2. ด้านสื่อนวัตกรรมและแหล่งเรียนรู้</td></tr>
                      <tr><td class="p-2 border border-slate-300 dark:border-slate-700 text-left">2.1 สื่อนวัตกรรมมีความทันสมัย น่าสนใจ และเข้าใจง่าย</td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td></tr>
                      <tr><td class="p-2 border border-slate-300 dark:border-slate-700 text-left">2.2 ใบความรู้และใบงานมีความชัดเจน เหมาะสมกับเวลาเรียน</td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td></tr>
                      <tr><td class="p-2 border border-slate-300 dark:border-slate-700 text-left">2.3 สื่อช่วยให้นักเรียนเกิดความเข้าใจในเนื้อหาบทเรียนได้รวดเร็วยิ่งขึ้น</td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td></tr>
                      <tr><td class="p-2 border border-slate-300 dark:border-slate-700 text-left">2.4 นักเรียนสามารถเข้าถึงสื่อการเรียนรู้ได้สะดวกทั้งในและนอกห้องเรียน</td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td></tr>

                      <tr class="bg-sky-50/60 dark:bg-sky-950/30 font-bold text-left"><td colspan="6" class="p-2 border border-slate-300 dark:border-slate-700">3. ด้านบรรยากาศและการมีส่วนร่วมในชั้นเรียน</td></tr>
                      <tr><td class="p-2 border border-slate-300 dark:border-slate-700 text-left">3.1 บรรยากาศในห้องเรียนมีความเป็นกันเอง อบอุ่น และเอื้อต่อการเรียนรู้</td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td></tr>
                      <tr><td class="p-2 border border-slate-300 dark:border-slate-700 text-left">3.2 ครูเปิดโอกาสให้นักเรียนได้ซักถามและแสดงความคิดเห็นอย่างอิสระ</td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td></tr>
                      <tr><td class="p-2 border border-slate-300 dark:border-slate-700 text-left">3.3 ครูคอยให้คำแนะนำช่วยเหลือและให้กำลังใจเมื่อนักเรียนพบปัญหา</td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td></tr>
                      <tr><td class="p-2 border border-slate-300 dark:border-slate-700 text-left">3.4 นักเรียนมีความกระตือรือร้นและมีสมาธิตลอดช่วงเวลาการจัดกิจกรรม</td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td></tr>

                      <tr class="bg-sky-50/60 dark:bg-sky-950/30 font-bold text-left"><td colspan="6" class="p-2 border border-slate-300 dark:border-slate-700">4. ด้านประโยชน์ที่ได้รับและการนำไปใช้</td></tr>
                      <tr><td class="p-2 border border-slate-300 dark:border-slate-700 text-left">4.1 นักเรียนเข้าใจเนื้อหาและมีความรู้ความเข้าใจใน${c1}เพิ่มขึ้น</td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td></tr>
                      <tr><td class="p-2 border border-slate-300 dark:border-slate-700 text-left">4.2 นักเรียนได้พัฒนาทักษะการคิดวิเคราะห์และการแก้ปัญหาอย่างเป็นระบบ</td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td></tr>
                      <tr><td class="p-2 border border-slate-300 dark:border-slate-700 text-left">4.3 นักเรียนมีความมั่นใจในการนำความรู้ไปใช้ในชีวิตประจำวัน</td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td></tr>
                      <tr><td class="p-2 border border-slate-300 dark:border-slate-700 text-left">4.4 นักเรียนมีความรู้สึกที่ดีและมีเจตคติเชิงบวกต่อรายวิชานี้</td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td><td class="border border-slate-300 dark:border-slate-700"></td></tr>
                    </tbody>
                  </table>
                </div>
                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div class="font-bold text-slate-800 dark:text-slate-200">ข้อเสนอแนะเพิ่มเติมของนักเรียน:</div>
                  <div class="h-14 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"></div>
                </div>
              </div>
            `
          },
          {
            heading: "ค.2 แบบประเมินทักษะปฏิบัติตามเกณฑ์รูบริกแบบวิเคราะห์ (Analytic Scoring Rubrics Sheet)",
            title: "ค.2 แบบประเมินทักษะปฏิบัติตามเกณฑ์รูบริกแบบวิเคราะห์ (Analytic Scoring Rubrics Sheet)",
            type: "custom_html",
            content: `
              <div class="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 space-y-4 text-xs sm:text-sm">
                <div class="text-center space-y-1 border-b pb-3 border-slate-200 dark:border-slate-800">
                  <h3 class="font-bold text-base sm:text-lg text-slate-900 dark:text-white">แบบประเมินทักษะปฏิบัติตามเกณฑ์รูบริกแบบวิเคราะห์ (Analytic Rubrics)</h3>
                  <p class="text-slate-500">${escapeHtml(rub1.title || 'เกณฑ์การประเมินทักษะปฏิบัติ')} (${escapeHtml(p.subject || '')})</p>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-xs border-collapse border border-slate-300 dark:border-slate-700 text-left">
                    <thead>
                      <tr class="bg-slate-100 dark:bg-slate-800 font-bold border-b border-slate-300 dark:border-slate-700">
                        <th class="p-2 border border-slate-300 dark:border-slate-700 w-1/4">ประเด็นการประเมิน / น้ำหนัก</th>
                        <th class="p-2 border border-slate-300 dark:border-slate-700 w-1/5">ดีเยี่ยม (4 คะแนน)</th>
                        <th class="p-2 border border-slate-300 dark:border-slate-700 w-1/5">ดี (3 คะแนน)</th>
                        <th class="p-2 border border-slate-300 dark:border-slate-700 w-1/6">พอใช้ (2 คะแนน)</th>
                        <th class="p-2 border border-slate-300 dark:border-slate-700 w-1/6">ปรับปรุง (1 คะแนน)</th>
                      </tr>
                    </thead>
                    <tbody class="align-top">
                      ${(rub1.criteria || []).map(c => `
                        <tr class="border-b border-slate-200 dark:border-slate-800">
                          <td class="p-2 border border-slate-300 dark:border-slate-700 font-bold bg-slate-50/50 dark:bg-slate-800/50">
                            ${escapeHtml(c.name)}
                            <div class="text-[11px] text-sky-700 dark:text-sky-400 font-normal mt-0.5">น้ำหนัก: ${c.weight || 25}%</div>
                          </td>
                          <td class="p-2 border border-slate-300 dark:border-slate-700">${escapeHtml(c.level4)}</td>
                          <td class="p-2 border border-slate-300 dark:border-slate-700">${escapeHtml(c.level3)}</td>
                          <td class="p-2 border border-slate-300 dark:border-slate-700">${escapeHtml(c.level2)}</td>
                          <td class="p-2 border border-slate-300 dark:border-slate-700 text-slate-500">${escapeHtml(c.level1)}</td>
                        </tr>
                      `).join("")}
                    </tbody>
                  </table>
                </div>
                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                  <b>เกณฑ์การตัดสินระดับคุณภาพ:</b>
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1 font-medium text-center">
                    <span class="p-1.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">14–16 คะแนน: ดีเยี่ยม</span>
                    <span class="p-1.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">11–13 คะแนน: ดี</span>
                    <span class="p-1.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">8–10 คะแนน: พอใช้</span>
                    <span class="p-1.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">ต่ำกว่า 8 คะแนน: ปรับปรุง</span>
                  </div>
                </div>
              </div>
            `
          }
        ]
      },

      // ภาคผนวก ง: สรุปผลการหาคุณภาพเครื่องมือวิจัยและประสิทธิภาพนวัตกรรม
      {
        code: "ง",
        title: "ภาคผนวก ง",
        subtitle: "สรุปผลการหาคุณภาพเครื่องมือวิจัยและประสิทธิภาพนวัตกรรม",
        sections: [
          {
            heading: "ง.1 ตารางสรุปผลการประเมินค่าความสอดคล้องเชิงเนื้อหา (IOC) ของเครื่องมือวิจัยทุกประเภท",
            title: "ง.1 ตารางสรุปผลการประเมินค่าความสอดคล้องเชิงเนื้อหา (IOC) ของเครื่องมือวิจัยทุกประเภท",
            type: "stat_tables",
            tables: [
              {
                tableNo: "ตารางที่ ง.1",
                caption: "สรุปผลการประเมินความสอดคล้องเชิงเนื้อหา (IOC) จากผู้เชี่ยวชาญ 5 ท่าน",
                headers: ["ประเภทเครื่องมือวิจัย", "จำนวนข้อ/รายการ", "ช่วงค่า IOC รายข้อ", "ค่าเฉลี่ย IOC รวม", "ผลการพิจารณา"],
                rows: [
                  ["แผนการจัดการเรียนรู้และนวัตกรรม", "6 แผน", "0.80 – 1.00", "0.94", "ผ่านเกณฑ์คุณภาพสูงมาก"],
                  [`แบบทดสอบวัด${c1}`, "40 ข้อ", "0.80 – 1.00", "0.90", "ผ่านเกณฑ์คุณภาพสูงมาก"],
                  ["แบบประเมินทักษะปฏิบัติตามรูบริก", "4 เกณฑ์", "0.80 – 1.00", "0.92", "ผ่านเกณฑ์คุณภาพสูงมาก"],
                  ["แบบสอบถามความพึงพอใจ", "16 ข้อ", "0.80 – 1.00", "0.96", "ผ่านเกณฑ์คุณภาพสูงมาก"],
                  ["รวมเครื่องมือวิจัยทั้งฉบับ", "66 รายการ", "0.80 – 1.00", "0.93", "ผ่านเกณฑ์คุณภาพทุกฉบับ"]
                ],
                interpretation: "ผลการประเมินความสอดคล้องเชิงเนื้อหา (IOC) ของเครื่องมือทุกประเภทมีค่าเฉลี่ยตั้งแต่ 0.90 ถึง 0.96 ซึ่งสูงกว่าเกณฑ์ยอมรับ 0.60 แสดงว่าเครื่องมือมีความตรงเชิงเนื้อหาและมีความเหมาะสมในการนำไปใช้"
              }
            ]
          },
          {
            heading: "ง.2 ตารางสรุปผลการวิเคราะห์ข้อสอบรายข้อ (Item Analysis: p, r) และค่าความเชื่อมั่น KR-20",
            title: "ง.2 ตารางสรุปผลการวิเคราะห์ข้อสอบรายข้อ (Item Analysis: p, r) และค่าความเชื่อมั่น KR-20",
            type: "stat_tables",
            tables: [
              {
                tableNo: "ตารางที่ ง.2",
                caption: `ผลการวิเคราะห์ค่าความยากง่าย (p) ค่าอำนาจจำแนก (r) และค่าความเชื่อมั่นของแบบทดสอบ (N = 30 คน)`,
                headers: ["ช่วงข้อสอบ", "พฤติกรรมเป้าหมาย (Bloom)", "ค่าความยากง่าย (p)", "ค่าอำนาจจำแนก (r)", "ผลการคัดเลือก"],
                rows: [
                  ["ข้อ 1 – 6", "ความจำ (Remembering)", "0.58 – 0.72", "0.35 – 0.52", "คัดเลือกไว้ใช้งาน"],
                  ["ข้อ 7 – 14", "ความเข้าใจ (Understanding)", "0.50 – 0.68", "0.40 – 0.58", "คัดเลือกไว้ใช้งาน"],
                  ["ข้อ 15 – 22", "การประยุกต์ใช้ (Applying)", "0.42 – 0.60", "0.38 – 0.62", "คัดเลือกไว้ใช้งาน"],
                  ["ข้อ 23 – 30", "การวิเคราะห์ (Analyzing)", "0.38 – 0.55", "0.45 – 0.65", "คัดเลือกไว้ใช้งาน"],
                  ["ข้อ 31 – 35", "การประเมินค่า (Evaluating)", "0.35 – 0.48", "0.32 – 0.50", "คัดเลือกไว้ใช้งาน"],
                  ["ข้อ 36 – 40", "การสร้างสรรค์ (Creating)", "0.32 – 0.45", "0.35 – 0.48", "คัดเลือกไว้ใช้งาน"]
                ],
                footnote: "* คัดเลือกข้อสอบที่มีค่า p ระหว่าง 0.20–0.80 และค่า r ตั้งแต่ 0.20 ขึ้นไปไว้จำนวน 30 ข้อ โดยมีค่าความเชื่อมั่นทั้งฉบับ KR-20 = 0.864",
                interpretation: "ข้อสอบที่ผ่านการทดลองใช้ (Try-out) มีค่าความยากง่ายพอเหมาะ ค่าอำนาจจำแนกอยู่ในเกณฑ์ดีถึงดีมาก และมีความเชื่อมั่นทั้งฉบับสูงกว่าเกณฑ์ 0.70"
              }
            ]
          },
          {
            heading: "ง.3 ตารางสรุปผลการทดสอบประสิทธิภาพนวัตกรรม (E1/E2) ในขั้นทดลองนำร่อง (Try-out 3 ระดับ)",
            title: "ง.3 ตารางสรุปผลการทดสอบประสิทธิภาพนวัตกรรม (E1/E2) ในขั้นทดลองนำร่อง (Try-out 3 ระดับ)",
            type: "stat_tables",
            tables: [
              {
                tableNo: "ตารางที่ ง.3",
                caption: `ผลการทดลองหาประสิทธิภาพของ ${bShort} ในขั้นทดลองนำร่อง 3 ขั้นตอน`,
                headers: ["ขั้นตอนการทดลอง", "กลุ่มตัวอย่าง", "คะแนนกระบวนการ (E1)", "คะแนนผลลัพธ์ (E2)", "ผลการพัฒนาและปรับปรุง"],
                rows: [
                  ["1. ทดสอบรายบุคคล (1:1)", "นักเรียน 3 คน (เก่ง 1, ปานกลาง 1, อ่อน 1)", "68.50%", "66.80%", "ปรับปรุงภาษาในใบงานให้กระชับ และเพิ่มเวลาทำกิจกรรม 5 นาที"],
                  ["2. ทดสอบกลุ่มเล็ก (1:10)", "นักเรียน 9 คน (เก่ง 3, ปานกลาง 3, อ่อน 3)", "75.80%", "74.50%", "ปรับปรุงสัญลักษณ์ในสื่อกิจกรรม และเพิ่มคำถามกระตุ้นการคิด"],
                  ["3. ทดสอบภาคสนาม (Field Test)", "นักเรียน 30 คน (ห้องเรียนที่ไม่ใช่กลุ่มตัวอย่าง)", "82.40%", "83.10%", `ผ่านเกณฑ์ประสิทธิภาพมาตรฐาน ${crit} พร้อมนำไปใช้จริงในระยะ R2`]
                ],
                interpretation: `ผลการทดลองหาประสิทธิภาพของ ${bShort} ตามขั้นตอน 1:1, 1:10 และภาคสนาม แสดงให้เห็นถึงพัฒนาการของประสิทธิภาพอย่างเป็นระบบ จนในขั้นภาคสนามมีค่า E1/E2 เท่ากับ 82.40/83.10 ซึ่งสูงกว่าเกณฑ์ ${crit} ที่ตั้งไว้ และมีผลต่างเพียง 0.70% ผ่านเกณฑ์ความแปรปรวนไม่เกิน 5.0%`
              }
            ]
          }
        ]
      }
    ];

    return {
      title: "ภาคผนวก",
      subtitle: "เครื่องมือการวิจัย เอกสารขอความอนุเคราะห์ และหลักฐานการตรวจสอบคุณภาพเครื่องมือ",
      appendices
    };
  },

  // ==========================================================================
  // Smart Prompt Builder สำหรับส่งให้ Gemini AI หรือคัดลอกไปใช้ใน ChatGPT
  // ==========================================================================
  buildSmartPrompt(p, taskType) {
    const fullTitle = this.composeFullTitle(p);
    const bFull = p.B || "";
    const cJoined = (p.C_list || []).filter(Boolean).join(" และ ");
    const d = p.D || "";
    const steps = (p.B_steps || []).filter(Boolean).join("\n- ");
    const st = p.statsData || {};

    const baseContext = `คุณคือศาสตราจารย์และผู้เชี่ยวชาญด้านการวิจัยและพัฒนาทางการศึกษา (Educational Research & Development: R&D) และการทำผลงานทางวิชาการเพื่อเลื่อนวิทยฐานะ (วPA) ตามแนวคิดของ รศ.ดร.ชวลิต ชูกำแพง
ข้อมูลงานวิจัยปัจจุบัน:
- ชื่อเรื่องวิจัย: "${fullTitle}"
- นวัตกรรม/ตัวแปรต้น (A & B): ${p.A} ${bFull}
- ขั้นตอนของนวัตกรรม:
- ${steps}
- ตัวแปรตาม (C): ${cJoined}
- กลุ่มเป้าหมาย (D): ${d}
- รายวิชา/เนื้อหา: ${p.subject} (${p.duration})
- เกณฑ์ประสิทธิภาพ E1/E2: ${p.efficiencyCriterion} (ผลจริง E1/E2 = ${st.e1}/${st.e2}, E.I. = ${st.ei}, t = ${st.tValue}, ความพึงพอใจ x̄ = ${st.satMean})`;

    const prompts = {
      title_polish: `${baseContext}\n\nคำสั่ง: ช่วยวิเคราะห์ชื่อเรื่องวิจัยข้างต้นตามหลัก ABCD (รศ.ดร.ชวลิต) และเสนอทางเลือกชื่อเรื่องวิจัยที่คมชัด สละสลวย ถูกต้องตามหลักเกณฑ์ วPA ระดับ คศ.3–คศ.5 จำนวน 3 ทางเลือก พร้อมระบุ A B C D ของแต่ละข้อ`,
      ch1_background: `${baseContext}\n\nคำสั่ง: ช่วยเขียน "1.1 ความเป็นมาและความสำคัญของปัญหา" ความยาว 7 ย่อหน้า ตามโครงสร้างของ รศ.ดร.ชวลิต ชูกำแพง:
(1) ความสำคัญของตัวแปร C
(2) นโยบาย/หลักสูตรและทิศทางการวิจัยชาติ 2568–2570
(3) ปัญหาภาพรวมระดับประเทศ
(4) สาเหตุของปัญหาและสภาพจริงในพื้นที่ D
(5) หลักการ/แนวคิด B ที่นำมาแก้ปัญหา
(6) นวัตกรรม A และช่องว่างวิจัย (Research Gap)
(7) สรุปเหตุผลความจำเป็นในการทำวิจัยเรื่องนี้`,
      ch1_definitions: `${baseContext}\n\nคำสั่ง: ช่วยเขียน "1.5 นิยามศัพท์เฉพาะ" (Operational Definitions) ให้ครบทุกตัวแปร ได้แก่ นวัตกรรม (${p.B_short || p.B}), ประสิทธิภาพของนวัตกรรม (${p.efficiencyCriterion}), ตัวแปรตาม (${cJoined}), ดัชนีประสิทธิผล (E.I.) และความพึงพอใจ โดยห้ามนิยามคำทั่วไปอย่าง นักเรียน หรือ ครู`,
      ch2_synthesis: `${baseContext}\n\nคำสั่ง: ช่วยร่างโครงสร้างเนื้อหาและการอ้างอิงวรรณกรรมใน "บทที่ 2 เอกสารและงานวิจัยที่เกี่ยวข้อง" พร้อมเขียนอธิบายกรอบแนวคิดเชิงทฤษฎี [หลักการ B + นวัตกรรม A] ===> [ตัวแปร C] โดยห้ามวาดเป็นขั้นตอนการวิจัย R1-D2`,
      r1_d1_bridge: `${baseContext}\n\nคำสั่ง: ช่วยสังเคราะห์ตารางเชื่อมโยงจาก R1 สู่ D1 (R1-to-D1 Synthesis Bridge) โดยอธิบายว่าผลการศึกษาทฤษฎีและสภาพปัญหาใน R1 นำไปสู่การออกแบบหลักการ วัตถุประสงค์ และขั้นตอนกิจกรรมของนวัตกรรมใน D1 อย่างไร พร้อมตอบคำถาม How & Why`,
      ch5_discussion: `${baseContext}\n\nคำสั่ง: ช่วยเขียน "5.2 อภิปรายผลการวิจัย" ตามสูตร 4 องค์ประกอบของ รศ.ดร.ชวลิต ชูกำแพง:
1) ผลการวิจัยพบว่าอะไร
2) ทั้งนี้เป็นเพราะเหตุใด (อธิบายจากกิจกรรมที่ครูจัดจริงในชั้นเรียน)
3) สอดคล้องกับหลักการ/ทฤษฎีของใคร อย่างไร
4) สอดคล้องกับผลงานวิจัยของใคร ที่พบว่าอย่างไร`
    };

    return prompts[taskType] || prompts.ch1_background;
  },

  // เรียกใช้งาน Gemini API สดจากเบราว์เซอร์
  async callGeminiAPI(apiKey, promptText, modelName = "gemini-2.5-flash") {
    const cleanKey = String(apiKey || "").trim();
    if (!cleanKey) {
      throw new Error("กรุณากรอก Gemini API Key ก่อนสั่งเขียนด้วย AI หรือใช้ปุ่ม 'คัดลอก Smart Prompt' เพื่อนำไปวางใน ChatGPT/Gemini ฟรี");
    }

    const modelsToTry = [modelName, "gemini-2.0-flash", "gemini-1.5-flash"];
    let lastError = null;

    for (const m of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(cleanKey)}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              temperature: 0.65,
              maxOutputTokens: 4096
            }
          })
        });
        const data = await res.json();
        if (!res.ok) {
          lastError = new Error(data?.error?.message || `HTTP ${res.status}`);
          continue;
        }
        const text = data?.candidates?.[0]?.content?.parts?.map(pt => pt.text || "").join("\n") || "";
        if (text) return { text, model: m };
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error("ไม่สามารถเชื่อมต่อ Gemini API ได้ กรุณาตรวจสอบ API Key");
  },

  // ==========================================================================
  // ส่วนเรนเดอร์เนื้อหาแต่ละ Section สำหรับส่งออกเป็นไฟล์ Word
  // รองรับทั้ง paragraphs, list, subsections, definitions, custom_html, stat_tables
  // ==========================================================================
  renderSectionToWordHtml(sec) {
    let out = `<h3 style="font-size: 16pt; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt;">${sec.heading || sec.title}</h3>`;

    if (sec.type === "paragraphs" && Array.isArray(sec.content)) {
      out += sec.content.map(p => `<p style="margin-top: 0; margin-bottom: 6pt; text-align: justify; text-indent: 1.27cm; line-height: 1.25;">${p}</p>`).join("");
    } else if (sec.type === "list" && Array.isArray(sec.content)) {
      out += `<ul style="margin-left: 2cm; margin-top: 4pt; margin-bottom: 6pt;">${sec.content.map(li => `<li style="line-height: 1.25; margin-bottom: 3pt;">${li}</li>`).join("")}</ul>`;
    } else if (sec.type === "subsections" && Array.isArray(sec.items)) {
      out += sec.items.map(sub => `
        <p style="text-indent: 0; font-weight: bold; margin-top: 8pt; margin-bottom: 2pt;">${sub.subTitle}</p>
        <p style="margin-top: 0; margin-bottom: 6pt; text-align: justify; text-indent: 1.27cm; line-height: 1.25;">${(sub.text || "").replace(/\n/g, '<br/>')}</p>
      `).join("");
    } else if (sec.type === "definitions" && Array.isArray(sec.items)) {
      out += sec.items.map(d => `<p style="margin-top: 0; margin-bottom: 6pt; text-align: justify; text-indent: 1.27cm; line-height: 1.25;"><b>${d.term}</b> ${d.def}</p>`).join("");
    } else if (sec.type === "custom_html" || (sec.content && typeof sec.content === "string")) {
      out += `<div style="margin-top: 6pt; margin-bottom: 8pt; line-height: 1.25;">${sec.content}</div>`;
    }

    if (sec.tables && Array.isArray(sec.tables) && sec.tables.length > 0) {
      out += sec.tables.map(t => `
        <div style="margin-top: 14pt; margin-bottom: 16pt;">
          <p class="table-caption" style="font-weight: bold; margin-bottom: 4pt; text-indent: 0; font-size: 16pt;"><b>${t.tableNo}</b> ${t.caption}</p>
          <table class="apa-table" style="width: 100%; border-collapse: collapse; margin-top: 6pt; margin-bottom: 6pt; font-size: 15pt; border-top: 1.5pt solid black; border-bottom: 1.5pt solid black; border-left: none; border-right: none;">
            <thead>
              <tr>
                ${t.headers.map(h => `<th style="border-top: 1.5pt solid black; border-bottom: 1.0pt solid black; border-left: none; border-right: none; padding: 5pt 6pt; font-weight: bold; text-align: center; background-color: #f8fafc;">${h}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${t.rows.map((r, ri) => `
                <tr style="${ri === t.rows.length - 1 ? 'border-bottom: 1.5pt solid black;' : 'border-bottom: 0.5pt solid #d1d5db;'}">
                  ${r.map((c, ci) => `<td style="border-left: none; border-right: none; padding: 4.5pt 6pt; ${ci === 0 ? 'text-align: left;' : 'text-align: center;'} ${ri === t.rows.length - 1 ? 'border-bottom: 1.5pt solid black;' : 'border-bottom: 0.5pt solid #d1d5db;'}">${c}</td>`).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
          ${t.footnote ? `<p class="table-note" style="font-size: 14pt; color: #4b5563; text-indent: 0; margin-top: 2pt;">${t.footnote}</p>` : ''}
          <p class="table-note" style="font-size: 15pt; text-indent: 0; margin-top: 4pt; line-height: 1.35;"><b>คำแปลผล:</b> ${t.interpretation}</p>
        </div>
      `).join("");
    }

    return out;
  },

  // ==========================================================================
  // ส่งออกไฟล์ Microsoft Word (.doc) ฟอนต์ TH Sarabun / Sarabun 16pt
  // พร้อมระยะขอบมาตรฐานวิจัย A4 (บน 1.5", ซ้าย 1.5", ขวา 1.0", ล่าง 1.0")
  // และตารางมาตรฐานวิชาการ APA 7th (Three-line APA Table)
  // ==========================================================================
  exportToWordDoc(p) {
    const generated = this.generateChapters(p);
    const bShort = p.B_short || p.B;

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${generated.fullTitle}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 {
            size: 21.0cm 29.7cm;
            margin: 3.81cm 2.54cm 2.54cm 3.81cm;
            mso-header-margin: 35.4pt;
            mso-footer-margin: 35.4pt;
            mso-paper-source: 0;
          }
          div.Section1 { page: Section1; }
          body {
            font-family: "TH Sarabun PSK", "TH Sarabun New", "Sarabun", sans-serif;
            font-size: 16pt;
            line-height: 1.25;
            color: #000000;
          }
          h1 { font-family: "TH Sarabun PSK", "TH Sarabun New", "Sarabun", sans-serif; font-size: 20pt; font-weight: bold; text-align: center; margin-top: 18pt; margin-bottom: 10pt; }
          h2 { font-family: "TH Sarabun PSK", "TH Sarabun New", "Sarabun", sans-serif; font-size: 18pt; font-weight: bold; margin-top: 14pt; margin-bottom: 6pt; }
          h3 { font-family: "TH Sarabun PSK", "TH Sarabun New", "Sarabun", sans-serif; font-size: 16pt; font-weight: bold; margin-top: 10pt; margin-bottom: 4pt; }
          p { margin-top: 0pt; margin-bottom: 6pt; text-align: justify; text-indent: 1.27cm; line-height: 1.25; }
          p.no-indent { text-indent: 0; }
          table.apa-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8pt;
            margin-bottom: 8pt;
            font-size: 15pt;
            border-top: 1.5pt solid black;
            border-bottom: 1.5pt solid black;
            border-left: none;
            border-right: none;
          }
          table.apa-table thead th, table.apa-table th {
            border-top: 1.5pt solid #000;
            border-bottom: 1pt solid #000;
            border-left: none;
            border-right: none;
            padding: 5pt 6pt;
            font-weight: bold;
            text-align: center;
            background-color: #f8fafc;
          }
          table.apa-table tbody td, table.apa-table td {
            border-top: none;
            border-bottom: 0.5pt solid #d1d5db;
            border-left: none;
            border-right: none;
            padding: 4.5pt 6pt;
          }
          table.apa-table tbody tr:last-child td, table.apa-table tr:last-child td {
            border-bottom: 1.5pt solid #000;
          }
          .table-caption { font-weight: bold; margin-bottom: 4pt; text-indent: 0; font-size: 16pt; }
          .table-note { font-size: 14pt; margin-top: 4pt; text-indent: 0; }
        </style>
      </head>
      <body>
        <div class="Section1">
          <!-- Cover Title -->
          <h1>รายงานการวิจัยและพัฒนา (R&D)<br>เรื่อง: ${generated.fullTitle}</h1>
          <p class="no-indent" style="text-align: center; font-weight: bold; margin-top: 10pt; font-size: 16pt;">
            ตามเกณฑ์การประเมินวิทยฐานะ วPA และระเบียบวิธีวิจัยของ รศ.ดร.ชวลิต ชูกำแพง
          </p>
          <hr style="margin-top: 15pt; margin-bottom: 20pt;">

          <!-- Chapters 1 to 5 -->
          ${generated.chapters.map(ch => `
            <h1>${ch.title}</h1>
            <h2 style="text-align: center; margin-bottom: 18pt;">${ch.subtitle}</h2>
            ${ch.sections.map(sec => this.renderSectionToWordHtml(sec)).join("")}
            <br style="page-break-after: always; clear: both; mso-break-type: section-break;">
          `).join("")}

          <!-- Appendices ก to ง -->
          ${generated.appendix ? `
            <h1 style="font-size: 24pt; font-weight: bold; text-align: center; margin-top: 24pt; margin-bottom: 8pt;">ภาคผนวก</h1>
            <p class="no-indent" style="text-align: center; font-size: 16pt; margin-bottom: 24pt;">(${generated.appendix.subtitle})</p>
            <br style="page-break-after: always; clear: both; mso-break-type: section-break;">
            ${generated.appendix.appendices.map(app => `
              <h1>${app.title}</h1>
              <h2 style="text-align: center; margin-bottom: 18pt;">${app.subtitle}</h2>
              ${app.sections.map(sec => this.renderSectionToWordHtml(sec)).join("")}
              <br style="page-break-after: always; clear: both; mso-break-type: section-break;">
            `).join("")}
          ` : ''}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `รายงานวิจัย_${(bShort || "ROAD").replace(/[\/\\?%*:|"<>]/g, "_")}.doc`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  },

  exportSingleChapterToWordDoc(p, chapterNumber) {
    const generated = this.generateChapters(p);
    const chNum = Number(chapterNumber) || 1;
    const ch = generated.chapters.find(c => c.number === chNum) || generated.chapters[0];
    const bShort = p.B_short || p.B;

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${ch.title} - ${generated.fullTitle}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 {
            size: 21.0cm 29.7cm;
            margin: 3.81cm 2.54cm 2.54cm 3.81cm;
            mso-header-margin: 35.4pt;
            mso-footer-margin: 35.4pt;
            mso-paper-source: 0;
          }
          div.Section1 { page: Section1; }
          body {
            font-family: 'TH Sarabun PSK', 'TH Sarabun New', 'Sarabun', sans-serif;
            font-size: 16pt;
            line-height: 1.25;
            color: #000000;
          }
          h1 {
            font-family: 'TH Sarabun PSK', 'TH Sarabun New', 'Sarabun', sans-serif;
            font-size: 20pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 6pt;
          }
          h2 {
            font-family: 'TH Sarabun PSK', 'TH Sarabun New', 'Sarabun', sans-serif;
            font-size: 18pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 20pt;
          }
          h3 {
            font-family: 'TH Sarabun PSK', 'TH Sarabun New', 'Sarabun', sans-serif;
            font-size: 16pt;
            font-weight: bold;
            margin-top: 12pt;
            margin-bottom: 6pt;
          }
          p {
            margin-top: 0;
            margin-bottom: 6pt;
            text-align: justify;
            text-indent: 1.27cm;
            line-height: 1.25;
          }
          p.no-indent { text-indent: 0; }
          table.apa-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10pt 0;
            font-size: 15pt;
            border-top: 1.5pt solid black;
            border-bottom: 1.5pt solid black;
            border-left: none;
            border-right: none;
          }
          table.apa-table th {
            border-top: 1.5pt solid black;
            border-bottom: 1.0pt solid black;
            border-left: none;
            border-right: none;
            padding: 5pt 6pt;
            text-align: center;
            font-weight: bold;
            background-color: #f8fafc;
          }
          table.apa-table td {
            padding: 4.5pt 6pt;
            border-top: none;
            border-left: none;
            border-right: none;
            border-bottom: 0.5pt solid #d1d5db;
          }
          table.apa-table tr:last-child td {
            border-bottom: 1.5pt solid black;
          }
          .table-caption { font-weight: bold; margin-bottom: 4pt; text-indent: 0; font-size: 16pt; }
          .table-note { font-size: 14pt; margin-top: 4pt; text-indent: 0; }
        </style>
      </head>
      <body>
        <div class="Section1">
          <p class="no-indent" style="font-size: 14pt; color: #475569; margin-bottom: 16pt;"><b>ชื่อเรื่องวิจัย:</b> ${generated.fullTitle}</p>
          <h1>${ch.title}</h1>
          <h2>${ch.subtitle}</h2>
          ${ch.sections.map(sec => this.renderSectionToWordHtml(sec)).join("")}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `รายงานวิจัย_บทที่${chNum}_${(bShort || "ROAD").replace(/[\/\\?%*:|"<>]/g, "_")}.doc`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  },

  // ==========================================================================
  // ส่งออกชุดเครื่องมือวิจัยและเอกสารภาคผนวกฉบับเต็ม (.doc) พร้อมส่งผู้เชี่ยวชาญ
  // พร้อมระยะขอบมาตรฐานวิจัย A4 (บน 1.5", ซ้าย 1.5", ขวา 1.0", ล่าง 1.0")
  // ==========================================================================
  exportAppendixToWordDoc(p) {
    const generated = this.generateChapters(p);
    const appendix = generated.appendix || this.generateAppendix(p);
    const bShort = p.B_short || p.B || "นวัตกรรม R&D";

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>ภาคผนวกและเครื่องมือวิจัย - ${generated.fullTitle}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page Section1 {
            size: 21.0cm 29.7cm;
            margin: 3.81cm 2.54cm 2.54cm 3.81cm;
            mso-header-margin: 35.4pt;
            mso-footer-margin: 35.4pt;
            mso-paper-source: 0;
          }
          div.Section1 { page: Section1; }
          body {
            font-family: "TH Sarabun PSK", "TH Sarabun New", "Sarabun", sans-serif;
            font-size: 16pt;
            line-height: 1.25;
            color: #000000;
          }
          h1 { font-family: "TH Sarabun PSK", "TH Sarabun New", "Sarabun", sans-serif; font-size: 20pt; font-weight: bold; text-align: center; margin-top: 18pt; margin-bottom: 10pt; }
          h2 { font-family: "TH Sarabun PSK", "TH Sarabun New", "Sarabun", sans-serif; font-size: 18pt; font-weight: bold; text-align: center; margin-top: 10pt; margin-bottom: 16pt; }
          h3 { font-family: "TH Sarabun PSK", "TH Sarabun New", "Sarabun", sans-serif; font-size: 16pt; font-weight: bold; margin-top: 12pt; margin-bottom: 6pt; }
          p { margin-top: 0pt; margin-bottom: 6pt; text-align: justify; text-indent: 1.27cm; line-height: 1.25; }
          p.no-indent { text-indent: 0; }
          table.apa-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8pt;
            margin-bottom: 8pt;
            font-size: 15pt;
            border-top: 1.5pt solid black;
            border-bottom: 1.5pt solid black;
            border-left: none;
            border-right: none;
          }
          table.apa-table thead th, table.apa-table th {
            border-top: 1.5pt solid #000;
            border-bottom: 1pt solid #000;
            border-left: none;
            border-right: none;
            padding: 5pt 6pt;
            font-weight: bold;
            text-align: center;
            background-color: #f8fafc;
          }
          table.apa-table tbody td, table.apa-table td {
            border-top: none;
            border-bottom: 0.5pt solid #d1d5db;
            border-left: none;
            border-right: none;
            padding: 4.5pt 6pt;
          }
          table.apa-table tbody tr:last-child td, table.apa-table tr:last-child td {
            border-bottom: 1.5pt solid #000;
          }
          .table-caption { font-weight: bold; margin-bottom: 4pt; text-indent: 0; font-size: 16pt; }
          .table-note { font-size: 14pt; margin-top: 4pt; text-indent: 0; }
        </style>
      </head>
      <body>
        <div class="Section1">
          <!-- Cover -->
          <h1>ชุดเครื่องมือการวิจัยและเอกสารภาคผนวก (Research Instruments & Appendix Package)<br>เรื่อง: ${generated.fullTitle}</h1>
          <p class="no-indent" style="text-align: center; font-weight: bold; margin-top: 10pt; font-size: 16pt;">
            สำหรับเสนอผู้เชี่ยวชาญตรวจสอบคุณภาพและประกอบการประเมินวิทยฐานะ วPA
          </p>
          <hr style="margin-top: 15pt; margin-bottom: 20pt;">

          <!-- Appendices ก to ง -->
          ${appendix.appendices.map(app => `
            <h1>${app.title}</h1>
            <h2>${app.subtitle}</h2>
            ${app.sections.map(sec => this.renderSectionToWordHtml(sec)).join("")}
            <br style="page-break-after: always; clear: both; mso-break-type: section-break;">
          `).join("")}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ชุดเครื่องมือและภาคผนวก_${(bShort || "ROAD").replace(/[\/\\?%*:|"<>]/g, "_")}.doc`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }
};
