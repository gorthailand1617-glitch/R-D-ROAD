// ============================================================================
// ROAD NEXT-GEN: 5-Chapter Blueprint Generator, Alignment Matrix,
// AI Co-Pilot (Gemini Live API + Smart Prompt Builder) & Word (.doc) Exporter
// ============================================================================

window.ROAD_GENERATOR = {
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
    return `${a}${b} ${conn}${cText} ${d}`.replace(/\s+/g, " ").trim();
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
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold text-xs sm:text-sm text-sky-800 dark:text-sky-200 bg-sky-100/90 dark:bg-sky-950/80 border border-sky-300 dark:border-sky-800 shadow-sm" title="A: คำกริยาแสดงลักษณะการวิจัย">
          <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold bg-sky-200 dark:bg-sky-900 text-sky-900 dark:text-sky-100">A</span>
          <span>${esc(a || "(ยังไม่ระบุ A)")}</span>
        </span>
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold text-xs sm:text-sm text-blue-900 dark:text-blue-200 bg-blue-100/90 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-800 shadow-sm" title="B: ชื่อนวัตกรรม / ตัวแปรต้น">
          <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100">B</span>
          <span>${esc(b || "(ยังไม่ระบุ B)")}</span>
        </span>
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 bg-emerald-100/90 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 shadow-sm" title="C: ตัวแปรตาม / ผลลัพธ์ที่พัฒนา">
          <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100">C</span>
          <span>${esc(conn)}${esc(cText || "(ยังไม่ระบุ C)")}</span>
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
        A: "การวิจัยและพัฒนา",
        B: "",
        B_short: "",
        C_connector: "เพื่อส่งเสริม",
        C_list: ["ความสามารถในการคิดวิเคราะห์", "ผลสัมฤทธิ์ทางการเรียน"],
        D: "สำหรับนักเรียนชั้นมัธยมศึกษาปีที่ 3",
        parsed: false
      };
    }

    let text = rawTitle.replace(/\s+/g, " ").trim();

    // 1. Detect Action (A)
    const actionPatterns = [
      "การวิจัยและพัฒนาและประเมินผล",
      "การวิจัยและพัฒนา",
      "การพัฒนาและศึกษาผลของ",
      "การพัฒนาและศึกษาผลการใช้",
      "การพัฒนาและหาประสิทธิภาพ",
      "การสร้างและหาประสิทธิภาพ",
      "การสร้างและพัฒนา",
      "การศึกษาผลการใช้",
      "การศึกษาผลการจัด",
      "การศึกษาผลของ",
      "การทดลองใช้",
      "การพัฒนา",
      "การยกระดับ",
      "การเปรียบเทียบ",
      "การส่งเสริม"
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
      "เพื่อสร้างและพัฒนา",
      "เพื่อเปรียบเทียบ",
      "ที่ส่งผลต่อ",
      "เพื่อ"
    ];

    let foundConn = "เพื่อพัฒนา";
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
      "สำหรับนักศึกษา",
      "สำหรับผู้เรียน",
      "สำหรับครูผู้สอน",
      "สำหรับครู",
      "ของนักเรียนชั้น",
      "ของนักเรียน",
      "ของนักศึกษา",
      "ของผู้เรียน",
      "ของครูผู้สอน",
      "ของครู",
      "ในสถานศึกษาสังกัด",
      "ในสถานศึกษา",
      "ในโรงเรียน",
      "สำหรับ",
      "ของ"
    ];

    let foundD = "";
    let cText = "";

    if (restAfterConn) {
      let dIndex = -1;
      let matchedDConn = "";
      for (const dConn of dConnectors) {
        const idx = restAfterConn.indexOf(dConn);
        if (idx !== -1 && (dIndex === -1 || idx < dIndex)) {
          dIndex = idx;
          matchedDConn = dConn;
        }
      }

      if (dIndex !== -1) {
        cText = restAfterConn.substring(0, dIndex).trim();
        foundD = restAfterConn.substring(dIndex).trim();
      } else {
        cText = restAfterConn.trim();
        foundD = "สำหรับนักเรียนกลุ่มเป้าหมาย";
      }
    } else {
      let dIndex = -1;
      let matchedDConn = "";
      for (const dConn of dConnectors) {
        const idx = bText.indexOf(dConn);
        if (idx !== -1 && (dIndex === -1 || idx < dIndex)) {
          dIndex = idx;
          matchedDConn = dConn;
        }
      }
      if (dIndex !== -1) {
        foundD = bText.substring(dIndex).trim();
        bText = bText.substring(0, dIndex).trim();
      }
    }

    // 4. Split C into C1, C2 if "และ" is present
    let cList = [];
    if (cText) {
      const parts = cText.split(/ และ |, |และ/);
      cList = parts.map(s => s.trim().replace(/^และ\s*/, "")).filter(s => s.length >= 2);
    }
    if (cList.length === 0) {
      cList = ["ความสามารถในการคิดวิเคราะห์", "ผลสัมฤทธิ์ทางการเรียน"];
    }

    // 5. Build B short name
    let bShort = bText;
    if (bText.includes("(")) {
      bShort = bText.split("(")[0].trim();
    } else if (bText.length > 50) {
      bShort = bText.substring(0, 48) + "...";
    }

    return {
      A: foundA,
      B: bText || "ชุดกิจกรรมการเรียนรู้เชิงรุก",
      B_short: bShort || bText || "ชุดกิจกรรมการเรียนรู้",
      C_connector: foundConn,
      C_list: cList,
      D: foundD || "สำหรับนักเรียนชั้นมัธยมศึกษาปีที่ 3",
      parsed: true
    };
  },

  // ตรวจสอบสุขภาพและความสอดคล้องของโครงร่างวิจัย (Health & Alignment Score)
  evaluateResearchHealth(p) {
    const checks = [];
    let score = 0;

    const hasA = Boolean(p.A && p.A.trim().length >= 4);
    checks.push({
      label: "องค์ประกอบ A (คำกริยา/ประเภทการวิจัย)",
      ok: hasA,
      detail: hasA ? `ระบุชัดเจน: "${p.A}"` : "ควรระบุประเภทการวิจัย เช่น การพัฒนา หรือ การวิจัยและพัฒนา"
    });
    if (hasA) score += 15;

    const hasB = Boolean(p.B && p.B.trim().length >= 8);
    checks.push({
      label: "องค์ประกอบ B (นวัตกรรม/ตัวแปรต้น)",
      ok: hasB,
      detail: hasB ? `ระบุนวัตกรรมชัดเจน (${(p.B_steps || []).length} ขั้นตอน)` : "ควรระบุชื่อนวัตกรรมและขั้นตอนการจัดกิจกรรม"
    });
    if (hasB) score += 20;

    const cList = (p.C_list || []).filter(Boolean);
    const hasC = cList.length >= 1;
    checks.push({
      label: "องค์ประกอบ C (ตัวแปรตาม/ผลลัพธ์ที่ต้องการพัฒนา)",
      ok: hasC,
      detail: hasC ? `มีตัวแปรตาม ${cList.length} ตัว (${cList.join(", ")})` : "ต้องมีตัวแปรตามอย่างน้อย 1 ตัว"
    });
    if (hasC) score += 20;

    const hasD = Boolean(p.D && p.D.trim().length >= 6);
    checks.push({
      label: "องค์ประกอบ D (กลุ่มเป้าหมาย/ระดับชั้น/บริบท)",
      ok: hasD,
      detail: hasD ? `ระบุกลุ่มเป้าหมายชัดเจน: "${p.D}"` : "ควรระบุระดับชั้นหรือกลุ่มเป้าหมายให้ชัดเจน"
    });
    if (hasD) score += 15;

    const hasSteps = Array.isArray(p.B_steps) && p.B_steps.filter(Boolean).length >= 3;
    checks.push({
      label: "ขั้นตอนของนวัตกรรม (Syntax / Learning Steps)",
      ok: hasSteps,
      detail: hasSteps ? `กำหนดไว้ ${p.B_steps.filter(Boolean).length} ขั้นตอน สอดคล้องกับบทที่ 2 และ 3` : "ควรระบุขั้นตอนของนวัตกรรมอย่างน้อย 3–5 ขั้นตอน"
    });
    if (hasSteps) score += 15;

    const s = p.statsData || {};
    const critParts = String(p.efficiencyCriterion || "80/80").split("/").map(Number);
    const e1Pass = Number(s.e1) >= (critParts[0] || 80);
    const e2Pass = Number(s.e2) >= (critParts[1] || 80);
    const statConsistent = Number(s.postMean) > Number(s.preMean) && e1Pass && e2Pass;
    checks.push({
      label: "ความสอดคล้องของค่าสถิติและสมมติฐาน (บทที่ 3–4)",
      ok: statConsistent,
      detail: statConsistent
        ? `E1/E2 (${s.e1}/${s.e2}) สูงกว่าเกณฑ์ ${p.efficiencyCriterion} และคะแนนหลังเรียน (${s.postMean}) สูงกว่าก่อนเรียน (${s.preMean})`
        : `ตรวจสอบค่า E1/E2 (${s.e1}/${s.e2}) หรือคะแนนหลังเรียนเทียบกับเกณฑ์ ${p.efficiencyCriterion}`
    });
    if (statConsistent) score += 15;

    return { score, checks };
  },

  // สร้างตารางตรวจสอบความสอดคล้อง 360 องศา (Alignment Matrix)
  generateAlignmentMatrix(p) {
    const bShort = p.B_short || p.B || "นวัตกรรมการเรียนรู้";
    const cList = (p.C_list || ["ความสามารถในการคิดวิเคราะห์", "ผลสัมฤทธิ์ทางการเรียน"]).filter(Boolean);
    const c1 = cList[0] || "ความสามารถในการเรียนรู้";
    const c2 = cList[1] || null;
    const d = p.D || "สำหรับนักเรียนกลุ่มเป้าหมาย";
    const crit = p.efficiencyCriterion || "80/80";
    const isRD = p.modelId === "rd_4step";

    const rows = [];

    if (isRD) {
      rows.push({
        phase: "ระยะที่ 1 (R1): ศึกษาข้อมูลพื้นฐาน",
        objective: `1. เพื่อศึกษาสภาพปัญหา ความต้องการจำเป็น และข้อมูลพื้นฐานในการพัฒนา${bShort} ${d}`,
        question: `สภาพปัญหาและความต้องการจำเป็นในการพัฒนา${bShort} ${d} เป็นอย่างไร?`,
        hypothesis: "— (การวิจัยเชิงสำรวจ/วิเคราะห์เอกสารและข้อมูลพื้นฐาน)",
        informants: "เอกสารหลักสูตร แนวคิดทฤษฎี ผู้เชี่ยวชาญ/ครูผู้สอน และตัวแทนผู้เรียน",
        instruments: "แบบวิเคราะห์เอกสาร แบบสัมภาษณ์กึ่งโครงสร้าง และแบบสอบถามความต้องการจำเป็น",
        statistics: "การวิเคราะห์เนื้อหา (Content Analysis), ความถี่, ร้อยละ, ค่าเฉลี่ย (x̄) และส่วนเบี่ยงเบนมาตรฐาน (S.D.)",
        ch4Section: "ตอนที่ 1 ผลการวิเคราะห์ข้อมูลพื้นฐานและความต้องการจำเป็น"
      });
    }

    rows.push({
      phase: isRD ? "ระยะที่ 2 (D1): พัฒนาและหาคุณภาพนวัตกรรม" : "ขั้นพัฒนาและหาประสิทธิภาพนวัตกรรม",
      objective: `${rows.length + 1}. เพื่อพัฒนาและหาประสิทธิภาพของ${bShort} ${d} ให้มีประสิทธิภาพตามเกณฑ์ ${crit}`,
      question: `${bShort} ที่พัฒนาขึ้นมีคุณภาพความเหมาะสมและมีประสิทธิภาพตามเกณฑ์ ${crit} หรือไม่?`,
      hypothesis: `${bShort} ที่พัฒนาขึ้นมีประสิทธิภาพไม่ต่ำกว่าเกณฑ์ ${crit} และมีดัชนีประสิทธิผล (E.I.) ตั้งแต่ 0.50 ขึ้นไป`,
      informants: `ผู้เชี่ยวชาญจำนวน 5 ท่าน (ตรวจสอบคุณภาพ IOC) และกลุ่มทดลองนำร่อง (Tryout) / กลุ่มตัวอย่าง (${p.sample || d})`,
      instruments: `1) ${bShort} (${p.duration || "แผนการจัดการเรียนรู้"}) 2) แบบประเมินความสอดคล้อง IOC และความเหมาะสม 3) แบบทดสอบย่อยระหว่างเรียนและหลังเรียน`,
      statistics: `ค่าดัชนีความสอดคล้อง (IOC), ค่าเฉลี่ย (x̄), S.D., ค่าประสิทธิภาพของกระบวนการและผลลัพธ์ (E1/E2) และค่าดัชนีประสิทธิผล (E.I.)`,
      ch4Section: `ตอนที่ ${rows.length + 1} ผลการพัฒนาและหาประสิทธิภาพของ${bShort} (E1/E2 และ E.I.)`
    });

    rows.push({
      phase: isRD ? "ระยะที่ 3 (R2): ทดลองใช้นวัตกรรม (ตัวแปรตามที่ 1)" : "ขั้นทดลองใช้นวัตกรรม (ตัวแปรตามที่ 1)",
      objective: `${rows.length + 1}. เพื่อเปรียบเทียบ${c1} ${d} ก่อนและหลังการจัดการเรียนรู้ด้วย${bShort}`,
      question: `ผู้เรียนที่ได้รับการจัดการเรียนรู้ด้วย${bShort} มี${c1} หลังเรียนสูงกว่าก่อนเรียนหรือไม่?`,
      hypothesis: `ผู้เรียนที่เรียนด้วย${bShort} มี${c1} หลังเรียนสูงกว่าก่อนเรียนอย่างมีนัยสำคัญทางสถิติที่ระดับ .05`,
      informants: `กลุ่มตัวอย่าง ได้แก่ ${p.sample || d}`,
      instruments: `แบบวัด/แบบทดสอบวัด${c1} (ค่าความเชื่อมั่น α ของครอนบาค)`,
      statistics: "ค่าเฉลี่ย (x̄), ส่วนเบี่ยงเบนมาตรฐาน (S.D.) และสถิติทดสอบทีแบบกลุ่มไม่อิสระ (t-test dependent)",
      ch4Section: `ตอนที่ ${rows.length + 1} ผลการเปรียบเทียบ${c1} ก่อนเรียนและหลังเรียน`
    });

    if (c2) {
      rows.push({
        phase: isRD ? "ระยะที่ 3 (R2): ทดลองใช้นวัตกรรม (ตัวแปรตามที่ 2)" : "ขั้นทดลองใช้นวัตกรรม (ตัวแปรตามที่ 2)",
        objective: `${rows.length + 1}. เพื่อเปรียบเทียบ${c2} ${d} ก่อนและหลังการจัดการเรียนรู้ด้วย${bShort}`,
        question: `ผู้เรียนที่ได้รับการจัดการเรียนรู้ด้วย${bShort} มี${c2} หลังเรียนสูงกว่าก่อนเรียนหรือไม่?`,
        hypothesis: `ผู้เรียนที่เรียนด้วย${bShort} มี${c2} หลังเรียนสูงกว่าก่อนเรียนอย่างมีนัยสำคัญทางสถิติที่ระดับ .05`,
        informants: `กลุ่มตัวอย่าง ได้แก่ ${p.sample || d}`,
        instruments: `แบบทดสอบวัด${c2} ชนิดปรนัย 4 ตัวเลือก จำนวน ${p.statsData?.fullScore || 40} ข้อ`,
        statistics: "ค่าเฉลี่ย (x̄), ส่วนเบี่ยงเบนมาตรฐาน (S.D.) และสถิติทดสอบทีแบบกลุ่มไม่อิสระ (t-test dependent)",
        ch4Section: `ตอนที่ ${rows.length + 1} ผลการเปรียบเทียบ${c2} ก่อนเรียนและหลังเรียน`
      });
    }

    rows.push({
      phase: isRD ? "ระยะที่ 4 (D2): ประเมินผลและปรับปรุง" : "ขั้นประเมินความพึงพอใจ",
      objective: `${rows.length + 1}. เพื่อศึกษาความพึงพอใจของผู้เรียนที่มีต่อการจัดการเรียนรู้ด้วย${bShort} ${d}`,
      question: `ผู้เรียนมีความพึงพอใจต่อการจัดการเรียนรู้ด้วย${bShort} อยู่ในระดับใด?`,
      hypothesis: `ผู้เรียนมีความพึงพอใจต่อการจัดการเรียนรู้ด้วย${bShort} อยู่ในระดับมากขึ้นไป (x̄ ≥ 3.51)`,
      informants: `กลุ่มตัวอย่าง ได้แก่ ${p.sample || d}`,
      instruments: "แบบสอบถามความพึงพอใจชนิดมาตราส่วนประมาณค่า 5 ระดับ (Likert Scale) จำนวน 15 ข้อ",
      statistics: "ค่าเฉลี่ย (x̄) และส่วนเบี่ยงเบนมาตรฐาน (S.D.) เทียบกับเกณฑ์การแปลผล 5 ระดับ",
      ch4Section: `ตอนที่ ${rows.length + 1} ผลการวิเคราะห์ความพึงพอใจของผู้เรียน`
    });

    return rows;
  },

  // สร้างโครงร่างและเนื้อหา 5 บทแบบสมบูรณ์
  generateChapters(p) {
    const fullTitle = this.composeFullTitle(p);
    const bFull = p.B || "รูปแบบการจัดการเรียนรู้";
    const bShort = p.B_short || bFull;
    const cList = (p.C_list || ["ความสามารถในการคิดวิเคราะห์", "ผลสัมฤทธิ์ทางการเรียน"]).filter(Boolean);
    const c1 = cList[0] || "ความสามารถในการคิดวิเคราะห์";
    const c2 = cList[1] || null;
    const cJoined = cList.join(" และ");
    const d = p.D || "สำหรับนักเรียนชั้นมัธยมศึกษาปีที่ 3";
    const subj = p.subject || "รายวิชาพื้นฐานตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน";
    const sem = p.semester || "ภาคเรียนที่ 1 ปีการศึกษา 2569";
    const dur = p.duration || "จำนวน 6 แผนการจัดการเรียนรู้ เวลา 18 ชั่วโมง";
    const pop = p.population || `นักเรียน${d.replace(/^สำหรับ|^ของ/, "")} ในสถานศึกษาเป้าหมาย`;
    const samp = p.sample || `นักเรียน${d.replace(/^สำหรับ|^ของ/, "")} จำนวน 1 ห้องเรียน`;
    const crit = p.efficiencyCriterion || "80/80";
    const critParts = crit.split("/");
    const steps = (p.B_steps || []).filter(Boolean);
    const matrix = this.generateAlignmentMatrix(p);
    const st = p.statsData || {};

    // แปลผลระดับความพึงพอใจ
    const satVal = Number(st.satMean || 4.62);
    const satLevel = satVal >= 4.51 ? "มากที่สุด" : satVal >= 3.51 ? "มาก" : satVal >= 2.51 ? "ปานกลาง" : "น้อย";

    // เนื้อหาที่ผู้ใช้ปรับแต่งเอง (ถ้ามี)
    const custom = p.customSections || {};

    return {
      fullTitle,
      chapters: [
        {
          number: 1,
          title: "บทที่ 1 บทนำ",
          subtitle: "ความเป็นมา คำถามวิจัย วัตถุประสงค์ สมมติฐาน ขอบเขต และนิยามศัพท์เฉพาะ",
          sections: [
            {
              id: "ch1_1",
              heading: "1.1 ความเป็นมาและความสำคัญของปัญหา",
              type: "paragraphs",
              content: custom.ch1_1 || [
                `[ย่อหน้าที่ 1: บริบทระดับมหภาคและนโยบายการศึกษา] การจัดการศึกษาในศตวรรษที่ 21 มุ่งเน้นการพัฒนาผู้เรียนให้มีสมรรถนะสำคัญและทักษะที่จำเป็นต่อการดำรงชีวิตและการเรียนรู้ตลอดชีวิต โดยเฉพาะใน${subj} ซึ่งเป็นรากฐานสำคัญในการพัฒนาผู้เรียน (${d.replace(/^สำหรับ|^ของ/, "")}) ให้สามารถเชื่อมโยงองค์ความรู้ไปสู่การประยุกต์ใช้ในสถานการณ์จริง สอดคล้องกับมาตรฐานการเรียนรู้และตัวชี้วัดของหลักสูตรแกนกลางการศึกษาขั้นพื้นฐานและแนวทางการพัฒนาคุณภาพการศึกษาของสถานศึกษา`,
                `[ย่อหน้าที่ 2: สภาพปัญหาจริงในชั้นเรียนของตัวแปรตาม (C)] อย่างไรก็ตาม จากการศึกษารายงานผลการจัดการเรียนรู้และการวิเคราะห์สภาพปัญหาในชั้นเรียนช่วงที่ผ่านมา พบว่า ผู้เรียนยังคงประสบปัญหาด้าน${cJoined} กล่าวคือ ผู้เรียนส่วนใหญ่ยังขาดทักษะในการวิเคราะห์เชื่อมโยงข้อมูลและมีคะแนนผลสัมฤทธิ์ทางการเรียนต่ำกว่าเกณฑ์ที่สถานศึกษากำหนด สาเหตุสำคัญส่วนหนึ่งเกิดจากการจัดกิจกรรมการเรียนรู้แบบเดิมที่ยังเน้นการบรรยายและการท่องจำเนื้อหามากกว่าการให้ผู้เรียนได้ลงมือปฏิบัติและคิดวิเคราะห์ด้วยตนเอง`,
                `[ย่อหน้าที่ 3: แนวคิดและจุดเด่นของนวัตกรรม (B)] จากการทบทวนวรรณกรรมและแนวคิดทฤษฎีทางการศึกษา ผู้วิจัยพบว่า "${bFull}" เป็นนวัตกรรมการจัดการเรียนรู้ที่มีจุดเด่นในการส่งเสริมให้ผู้เรียนเกิดการเรียนรู้เชิงรุกอย่างเป็นระบบ โดยมีขั้นตอนสำคัญ ${steps.length} ขั้นตอน ได้แก่ ${steps.join(" → ")} ซึ่งกระบวนการดังกล่าวช่วยกระตุ้นให้ผู้เรียนได้สืบค้น วิเคราะห์ สังเคราะห์ และสร้างองค์ความรู้ด้วยตนเองอย่างมีความหมาย`,
                `[ย่อหน้าที่ 4: สรุปเหตุผลและความสำคัญของการวิจัย (A+B+C+D)] ด้วยเหตุผลและความสำคัญดังกล่าว ผู้วิจัยจึงสนใจดำเนินการวิจัยเรื่อง "${fullTitle}" เพื่อพัฒนา${bShort} ที่มีประสิทธิภาพตามเกณฑ์มาตรฐาน ${crit} และนำไปใช้พัฒนา${cJoined} ${d} อันจะเป็นแนวทางสำคัญในการยกระดับคุณภาพการจัดการเรียนรู้และเป็นต้นแบบแก่วงวิชาชีพครูต่อไป`
              ]
            },
            {
              id: "ch1_2",
              heading: "1.2 คำถามการวิจัย",
              type: "list",
              content: custom.ch1_2 || matrix.map((r, i) => `1.2.${i + 1} ${r.question}`)
            },
            {
              id: "ch1_3",
              heading: "1.3 วัตถุประสงค์การวิจัย",
              type: "list",
              content: custom.ch1_3 || matrix.map(r => r.objective)
            },
            {
              id: "ch1_4",
              heading: "1.4 สมมติฐานการวิจัย",
              type: "list",
              content: custom.ch1_4 || matrix.filter(r => !r.hypothesis.startsWith("—")).map((r, i) => `1.4.${i + 1} ${r.hypothesis}`)
            },
            {
              id: "ch1_5",
              heading: "1.5 ขอบเขตการวิจัย",
              type: "subsections",
              items: [
                {
                  subTitle: "1.5.1 ประชากรและกลุ่มตัวอย่าง",
                  text: `• ประชากร (Population): ${pop}\n• กลุ่มตัวอย่าง (Sample): ${samp}`
                },
                {
                  subTitle: "1.5.2 ตัวแปรที่ศึกษา",
                  text: `• ตัวแปรต้น (Independent Variable): การจัดการเรียนรู้ด้วย${bFull}\n• ตัวแปรตาม (Dependent Variables): ได้แก่ ${cList.map((c, idx) => `(${idx + 1}) ${c}`).join(" ")} และ (${cList.length + 1}) ความพึงพอใจของผู้เรียนที่มีต่อการจัดการเรียนรู้ด้วย${bShort}`
                },
                {
                  subTitle: "1.5.3 ขอบเขตด้านเนื้อหา",
                  text: `เนื้อหาที่ใช้ในการวิจัยครั้งนี้ เป็นเนื้อหาตามหลักสูตรใน${subj} โดยจัดทำเป็น${bShort} ${dur}`
                },
                {
                  subTitle: "1.5.4 ขอบเขตด้านระยะเวลา",
                  text: `ดำเนินการวิจัยและทดลองใช้ใน${sem} ใช้เวลาในการทดลองรวมทั้งสิ้น ${dur}`
                }
              ]
            },
            {
              id: "ch1_6",
              heading: "1.6 นิยามศัพท์เฉพาะ",
              type: "definitions",
              items: [
                {
                  term: `1. ${bShort}`,
                  def: `หมายถึง กระบวนการหรือสื่อการจัดกิจกรรมการเรียนรู้ใน${subj} ที่ผู้วิจัยพัฒนาขึ้นอย่างเป็นระบบ ประกอบด้วยองค์ประกอบสำคัญและขั้นตอนการจัดกิจกรรมการเรียนรู้ ${steps.length} ขั้นตอน ได้แก่ ${steps.join(" ")}`
                },
                {
                  term: `2. ประสิทธิภาพของ${bShort} (${crit})`,
                  def: `หมายถึง เกณฑ์การประเมินคุณภาพของ${bShort} แบ่งเป็น 2 ส่วน คือ ประสิทธิภาพของกระบวนการ (E1 = ${critParts[0]}) หมายถึง คะแนนเฉลี่ยร้อยละจากการทำกิจกรรมและแบบฝึกหัดระหว่างเรียนทุกแผนรวมกัน และประสิทธิภาพของผลลัพธ์ (E2 = ${critParts[1]}) หมายถึง คะแนนเฉลี่ยร้อยละจากการทำแบบทดสอบวัดผลสัมฤทธิ์หลังเรียน`
                },
                {
                  term: `3. ${c1}`,
                  def: `หมายถึง คะแนนความสามารถของผู้เรียนในการคิด วิเคราะห์ และปฏิบัติภารกิจการเรียนรู้ ซึ่งวัดได้จากแบบวัด/แบบทดสอบวัด${c1} ที่ผู้วิจัยสร้างขึ้นและผ่านการตรวจสอบคุณภาพจากผู้เชี่ยวชาญ`
                },
                ...(c2 ? [{
                  term: `4. ${c2}`,
                  def: `หมายถึง คะแนนความรู้ความเข้าใจของผู้เรียนในเนื้อหา${subj} ซึ่งวัดได้จากการทำแบบทดสอบวัด${c2} ชนิดปรนัย 4 ตัวเลือก จำนวน ${st.fullScore || 40} ข้อ ก่อนเรียนและหลังเรียน`
                }] : []),
                {
                  term: `${c2 ? 5 : 4}. ความพึงพอใจต่อการจัดการเรียนรู้`,
                  def: `หมายถึง ความรู้สึกหรือความคิดเห็นทางบวกของผู้เรียนที่มีต่อการจัดกิจกรรมการเรียนรู้ สื่อการเรียนรู้ และการวัดและประเมินผลด้วย${bShort} ซึ่งวัดได้จากแบบสอบถามความพึงพอใจชนิดมาตราส่วนประมาณค่า 5 ระดับ`
                },
                {
                  term: `${c2 ? 6 : 5}. ผู้เรียน / กลุ่มเป้าหมาย`,
                  def: `หมายถึง ${samp} ใน${sem}`
                }
              ]
            },
            {
              id: "ch1_7",
              heading: "1.7 ประโยชน์ที่คาดว่าจะได้รับ",
              type: "list",
              content: [
                `1.7.1 ผู้เรียน (${d.replace(/^สำหรับ|^ของ/, "")}) ได้รับการพัฒนา${cJoined} ให้สูงขึ้นอย่างเป็นระบบผ่านการเรียนรู้ด้วย${bShort}`,
                `1.7.2 ได้${bShort} ใน${subj} ที่มีประสิทธิภาพตามเกณฑ์มาตรฐาน ${crit} สามารถนำไปใช้ในการจัดการเรียนรู้ได้จริง`,
                `1.7.3 เป็นแนวทางและสารสนเทศสำหรับครูผู้สอน ศึกษานิเทศก์ และบุคลากรทางการศึกษาในการออกแบบและพัฒนานวัตกรรมการเรียนรู้ตามกระบวนการวิจัยและพัฒนา (R&D)`
              ]
            }
          ]
        },
        {
          number: 2,
          title: "บทที่ 2 เอกสารและงานวิจัยที่เกี่ยวข้อง",
          subtitle: "การสังเคราะห์แนวคิด ทฤษฎี หลักสูตร นวัตกรรม ตัวแปรตาม และกรอบแนวคิดในการวิจัย",
          sections: [
            {
              id: "ch2_overview",
              heading: "โครงสร้างหัวข้อเอกสารและงานวิจัยที่เกี่ยวข้อง",
              type: "paragraphs",
              content: [
                `ในการวิจัยเรื่อง "${fullTitle}" ผู้วิจัยได้ศึกษาวิเคราะห์และสังเคราะห์เอกสาร ตำรา แนวคิด ทฤษฎี และงานวิจัยที่เกี่ยวข้อง โดยนำเสนอตามลำดับหัวข้อดังต่อไปนี้`
              ]
            },
            {
              id: "ch2_topics",
              heading: "หัวข้อหลักและสาระสำคัญในบทที่ 2",
              type: "subsections",
              items: [
                {
                  subTitle: `2.1 หลักสูตรและบริบทของ${subj}`,
                  text: `• เป้าหมาย มาตรฐานการเรียนรู้ และตัวชี้วัดของหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน\n• คำอธิบายรายวิชาและวิเคราะห์สาระสำคัญของเนื้อหาใน${subj}\n• แนวทางการจัดการเรียนรู้และการวัดประเมินผลสำหรับ${d.replace(/^สำหรับ|^ของ/, "")}`
                },
                {
                  subTitle: `2.2 แนวคิดและทฤษฎีเกี่ยวกับ${bFull}`,
                  text: `• ความหมายและแนวคิดพื้นฐานของ${bShort}\n• ทฤษฎีการเรียนรู้ที่รองรับและหลักการสำคัญ\n• องค์ประกอบและขั้นตอนการจัดกิจกรรมการเรียนรู้ (${steps.join(" / ")})\n• การหาประสิทธิภาพของนวัตกรรมตามเกณฑ์มาตรฐาน E1/E2 (${crit}) และค่าดัชนีประสิทธิผล (E.I.)`
                },
                {
                  subTitle: `2.3 แนวคิดและทฤษฎีเกี่ยวกับ${c1}`,
                  text: `• ความหมายและความสำคัญของ${c1}\n• องค์ประกอบและตัวบ่งชี้ของ${c1}\n• แนวทางการพัฒนาและการสร้างเครื่องมือวัดและประเมิน${c1}`
                },
                ...(c2 ? [{
                  subTitle: `2.4 แนวคิดและทฤษฎีเกี่ยวกับ${c2}`,
                  text: `• ความหมายและองค์ประกอบของ${c2}\n• แนวทางการสร้างและหาคุณภาพแบบทดสอบวัด${c2} (ค่า IOC, ความยากง่าย p, อำนาจจำแนก r, และความเชื่อมั่น α)`
                }] : []),
                {
                  subTitle: `2.${c2 ? 5 : 4} แนวคิดเกี่ยวกับความพึงพอใจในการเรียนรู้`,
                  text: `• ความหมายและทฤษฎีเกี่ยวกับความพึงพอใจของผู้เรียน\n• การสร้างและการแปลผลแบบสอบถามความพึงพอใจตามแนวคิดของ Likert`
                },
                {
                  subTitle: `2.${c2 ? 6 : 5} งานวิจัยที่เกี่ยวข้อง`,
                  text: `• งานวิจัยในประเทศที่เกี่ยวข้องกับการพัฒนา${bShort} และการพัฒนา${cJoined}\n• งานวิจัยต่างประเทศที่เกี่ยวข้องกับนวัตกรรมการเรียนรู้เชิงรุกและการพัฒนาสมรรถนะผู้เรียน\n• บทสังเคราะห์งานวิจัยที่เกี่ยวข้องเพื่อเชื่อมโยงสู่การออกแบบนวัตกรรมในการวิจัยครั้งนี้`
                },
                {
                  subTitle: `2.${c2 ? 7 : 6} กรอบแนวคิดในการวิจัย (Conceptual Framework)`,
                  text: `ผู้วิจัยสังเคราะห์กรอบแนวคิดโดยกำหนดให้ ตัวแปรต้น คือ การจัดการเรียนรู้ด้วย${bFull} (${steps.length} ขั้นตอน) และตัวแปรตาม คือ ${cList.map((c, idx) => `${idx + 1}) ${c}`).join(" ")} และ ${cList.length + 1}) ความพึงพอใจของผู้เรียน (แสดงดังแผนภาพกรอบแนวคิดในแท็บ Visual Diagrams)`
                }
              ]
            }
          ]
        },
        {
          number: 3,
          title: "บทที่ 3 วิธีดำเนินการวิจัย",
          subtitle: "ขั้นตอนการวิจัยตามระยะ ประชากรและกลุ่มตัวอย่าง เครื่องมือวิจัย การเก็บรวบรวมข้อมูล และสถิติ",
          sections: [
            {
              id: "ch3_1",
              heading: "3.1 รูปแบบและขั้นตอนการดำเนินการวิจัย",
              type: "subsections",
              items: matrix.map((m, idx) => ({
                subTitle: `ขั้นตอน/ระยะที่ ${idx + 1}: ${m.phase}`,
                text: `• วัตถุประสงค์เฉพาะระยะ: ${m.objective}\n• แหล่งข้อมูล/กลุ่มเป้าหมาย: ${m.informants}\n• เครื่องมือที่ใช้: ${m.instruments}\n• การวิเคราะห์ข้อมูล: ${m.statistics}`
              }))
            },
            {
              id: "ch3_2",
              heading: "3.2 ประชากรและกลุ่มตัวอย่าง / แบบแผนการทดลอง",
              type: "paragraphs",
              content: [
                `1) ประชากรที่ใช้ในการวิจัย: ${pop}`,
                `2) กลุ่มตัวอย่างที่ใช้ในการวิจัย: ${samp}`,
                `3) แบบแผนการทดลอง (Experimental Design): ใช้แบบแผนการทดลองเบื้องต้นแบบกลุ่มเดียวสอบก่อนและสอบหลังเรียน (One-Group Pretest-Posttest Design) สัญลักษณ์ O1 → X → O2 เมื่อ O1 คือ การทดสอบก่อนเรียน (Pretest), X คือ การจัดการเรียนรู้ด้วย${bShort}, และ O2 คือ การทดสอบหลังเรียน (Posttest) และประเมินความพึงพอใจ`
              ]
            },
            {
              id: "ch3_3",
              heading: "3.3 เครื่องมือที่ใช้ในการวิจัยและการหาคุณภาพเครื่องมือ",
              type: "subsections",
              items: [
                {
                  subTitle: `3.3.1 นวัตกรรมที่ใช้ในการทดลอง ได้แก่ ${bShort}`,
                  text: `ดำเนินการสร้างตามขั้นตอน ${steps.length} ขั้นตอน จำนวน ${dur} นำเสนอผู้เชี่ยวชาญจำนวน 5 ท่าน ตรวจสอบความเที่ยงตรงเชิงเนื้อหาและความเหมาะสม ได้ค่าดัชนีความสอดคล้อง (IOC) เฉลี่ยเท่ากับ ${st.iocAvg || 0.92} (ผ่านเกณฑ์ IOC ≥ 0.50 ทุกข้อ) และนำไปทดลองใช้เบื้องต้น (Tryout) เพื่อหาประสิทธิภาพตามเกณฑ์ ${crit}`
                },
                {
                  subTitle: `3.3.2 เครื่องมือเก็บรวบรวมข้อมูลด้าน${c1}`,
                  text: `สร้างตารางวิเคราะห์ตัวชี้วัดและข้อคำถาม นำเสนอผู้เชี่ยวชาญ 5 ท่าน ตรวจสอบค่า IOC (ได้ค่าระหว่าง 0.80–1.00) และนำไปทดลองใช้กับนักเรียนที่ไม่ใช่กลุ่มตัวอย่างเพื่อวิเคราะห์หาค่าความยากง่าย (p = 0.20–0.80) ค่าอำนาจจำแนก (r ≥ 0.20) และค่าความเชื่อมั่นทั้งฉบับ (Reliability)`
                },
                ...(c2 ? [{
                  subTitle: `3.3.3 แบบทดสอบวัด${c2}`,
                  text: `เป็นแบบทดสอบชนิดปรนัย 4 ตัวเลือก จำนวน ${st.fullScore || 40} ข้อ ผ่านการตรวจสอบค่า IOC จากผู้เชี่ยวชาญ 5 ท่าน และวิเคราะห์คุณภาพรายข้อพร้อมหาค่าความเชื่อมั่นทั้งฉบับตามวิธีของ Lovett หรือ KR-20`
                }] : []),
                {
                  subTitle: `3.3.${c2 ? 4 : 3} แบบสอบถามความพึงพอใจของผู้เรียน`,
                  text: `เป็นแบบสอบถามมาตราส่วนประมาณค่า 5 ระดับ (5-Point Likert Scale) จำนวน 15 ข้อ ครอบคลุมด้านเนื้อหา ด้านการจัดกิจกรรมการเรียนรู้ ด้านสื่อและแหล่งเรียนรู้ และด้านการวัดและประเมินผล มีค่าความเชื่อมั่นสัมประสิทธิ์แอลฟาของครอนบาค (Cronbach's Alpha) เท่ากับ 0.91`
                }
              ]
            },
            {
              id: "ch3_4",
              heading: "3.4 สถิติที่ใช้ในการวิเคราะห์ข้อมูลและเกณฑ์การแปลผล",
              type: "list",
              content: [
                "1) สถิติพื้นฐาน ได้แก่ ค่าร้อยละ (Percentage) ค่าเฉลี่ย (Mean: x̄) และส่วนเบี่ยงเบนมาตรฐาน (Standard Deviation: S.D.)",
                `2) สถิติที่ใช้หาคุณภาพและประสิทธิภาพของนวัตกรรม ได้แก่ ค่าดัชนีความสอดคล้อง (IOC), ค่าประสิทธิภาพของกระบวนการและผลลัพธ์ (E1/E2 ตามเกณฑ์ ${crit}) และค่าดัชนีประสิทธิผล (Effectiveness Index: E.I.) ตามแนวคิดของเผชิญ กิจระการ`,
                "3) สถิติที่ใช้ทดสอบสมมติฐานเปรียบเทียบคะแนนก่อนเรียนและหลังเรียน ได้แก่ สถิติทดสอบทีแบบกลุ่มไม่อิสระ (t-test for dependent samples)",
                "4) เกณฑ์การแปลความหมายค่าเฉลี่ยความพึงพอใจ 5 ระดับ: 4.51–5.00 = มากที่สุด, 3.51–4.50 = มาก, 2.51–3.50 = ปานกลาง, 1.51–2.50 = น้อย, 1.00–1.50 = น้อยที่สุด"
              ]
            }
          ]
        },
        {
          number: 4,
          title: "บทที่ 4 ผลการวิเคราะห์ข้อมูล",
          subtitle: "การนำเสนอตารางวิเคราะห์ผลตามวัตถุประสงค์และการแปลผลทางสถิติ (ซิงค์จาก R&D Stat Lab)",
          sections: [
            {
              id: "ch4_intro",
              heading: "สัญลักษณ์ที่ใช้ในการนำเสนอผลการวิเคราะห์ข้อมูล",
              type: "list",
              content: [
                `n แทน จำนวนผู้เรียนในกลุ่มตัวอย่าง (n = ${st.n || 38} คน)`,
                "x̄ แทน ค่าเฉลี่ย (Mean)",
                "S.D. แทน ส่วนเบี่ยงเบนมาตรฐาน (Standard Deviation)",
                "E1 / E2 แทน ประสิทธิภาพของกระบวนการ / ประสิทธิภาพของผลลัพธ์",
                "E.I. แทน ดัชนีประสิทธิผล (Effectiveness Index)",
                "t แทน ค่าสถิติทดสอบที (t-distribution)",
                "* แทน มีนัยสำคัญทางสถิติที่ระดับ .05"
              ]
            },
            {
              id: "ch4_tables",
              heading: "ตารางผลการวิเคราะห์ข้อมูลและการแปลผล (APA 3-Line Tables)",
              type: "stat_tables",
              tables: [
                {
                  tableNo: "ตารางที่ 1",
                  caption: `ผลการวิเคราะห์หาประสิทธิภาพ (E1/E2) และดัชนีประสิทธิผล (E.I.) ของ${bShort} ${d} (n = ${st.n || 38})`,
                  headers: ["รายการประเมิน", "คะแนนเต็ม", "ค่าเฉลี่ย (x̄)", "S.D.", "ร้อยละ / ค่าที่ได้", "เกณฑ์ที่ตั้งไว้", "ผลการประเมิน"],
                  rows: [
                    ["คะแนนกิจกรรมระหว่างเรียน (E1)", "100%", "—", "—", `${Number(st.e1 || 82.45).toFixed(2)}`, `${critParts[0] || 80}.00`, "สูงกว่าเกณฑ์"],
                    ["คะแนนทดสอบหลังเรียน (E2)", `${st.fullScore || 40}`, `${Number(st.postMean || 32.67).toFixed(2)}`, `${Number(st.postSD || 2.64).toFixed(2)}`, `${Number(st.e2 || 81.68).toFixed(2)}`, `${critParts[1] || 80}.00`, "สูงกว่าเกณฑ์"],
                    ["ดัชนีประสิทธิผล (E.I.)", "1.0000", "—", "—", `${Number(st.ei || 0.6842).toFixed(4)}`, "≥ 0.5000", `ผู้เรียนมีความก้าวหน้าร้อยละ ${(Number(st.ei || 0.6842) * 100).toFixed(2)}`]
                  ],
                  interpretation: `จากตารางที่ 1 พบว่า ${bShort} ${d} มีประสิทธิภาพเท่ากับ ${Number(st.e1 || 82.45).toFixed(2)}/${Number(st.e2 || 81.68).toFixed(2)} ซึ่งสูงกว่าเกณฑ์ที่กำหนดไว้ คือ ${crit} และมีค่าดัชนีประสิทธิผล (E.I.) เท่ากับ ${Number(st.ei || 0.6842).toFixed(4)} แสดงว่าหลังการเรียนด้วย${bShort} ผู้เรียนมีความรู้เพิ่มขึ้นคิดเป็นร้อยละ ${(Number(st.ei || 0.6842) * 100).toFixed(2)}`
                },
                {
                  tableNo: "ตารางที่ 2",
                  caption: `ผลการเปรียบเทียบ${c1} ${d} ก่อนเรียนและหลังเรียนด้วย${bShort} (n = ${st.n || 38})`,
                  headers: ["การทดสอบ", "จำนวน (n)", "คะแนนเต็ม", "ค่าเฉลี่ย (x̄)", "S.D.", "t", "p-value"],
                  rows: [
                    ["ก่อนเรียน (Pretest)", `${st.n || 38}`, `${st.c1Full || 30}`, `${Number(st.c1PreMean || 14.20).toFixed(2)}`, `${Number(st.c1PreSD || 2.45).toFixed(2)}`, `${Number(st.c1TValue || 21.34).toFixed(2)}*`, `${st.pValue || ".000"}`],
                    ["หลังเรียน (Posttest)", `${st.n || 38}`, `${st.c1Full || 30}`, `${Number(st.c1PostMean || 25.10).toFixed(2)}`, `${Number(st.c1PostSD || 2.12).toFixed(2)}`, "", ""]
                  ],
                  footnote: "* มีนัยสำคัญทางสถิติที่ระดับ .05",
                  interpretation: `จากตารางที่ 2 พบว่า ผู้เรียนที่ได้รับการจัดการเรียนรู้ด้วย${bShort} มีคะแนน${c1} หลังเรียน (x̄ = ${Number(st.c1PostMean || 25.10).toFixed(2)}, S.D. = ${Number(st.c1PostSD || 2.12).toFixed(2)}) สูงกว่าก่อนเรียน (x̄ = ${Number(st.c1PreMean || 14.20).toFixed(2)}, S.D. = ${Number(st.c1PreSD || 2.45).toFixed(2)}) อย่างมีนัยสำคัญทางสถิติที่ระดับ .05 (t = ${Number(st.c1TValue || 21.34).toFixed(2)}, p = ${st.pValue || ".000"}) ซึ่งเป็นไปตามสมมติฐานการวิจัยที่ตั้งไว้`
                },
                ...(c2 ? [{
                  tableNo: "ตารางที่ 3",
                  caption: `ผลการเปรียบเทียบ${c2} ${d} ก่อนเรียนและหลังเรียนด้วย${bShort} (n = ${st.n || 38})`,
                  headers: ["การทดสอบ", "จำนวน (n)", "คะแนนเต็ม", "ค่าเฉลี่ย (x̄)", "S.D.", "t", "p-value"],
                  rows: [
                    ["ก่อนเรียน (Pretest)", `${st.n || 38}`, `${st.fullScore || 40}`, `${Number(st.preMean || 18.42).toFixed(2)}`, `${Number(st.preSD || 3.15).toFixed(2)}`, `${Number(st.tValue || 24.86).toFixed(2)}*`, `${st.pValue || ".000"}`],
                    ["หลังเรียน (Posttest)", `${st.n || 38}`, `${st.fullScore || 40}`, `${Number(st.postMean || 32.67).toFixed(2)}`, `${Number(st.postSD || 2.64).toFixed(2)}`, "", ""]
                  ],
                  footnote: "* มีนัยสำคัญทางสถิติที่ระดับ .05",
                  interpretation: `จากตารางที่ 3 พบว่า ผู้เรียนมีคะแนน${c2} หลังเรียน (x̄ = ${Number(st.postMean || 32.67).toFixed(2)}, S.D. = ${Number(st.postSD || 2.64).toFixed(2)}) สูงกว่าก่อนเรียน (x̄ = ${Number(st.preMean || 18.42).toFixed(2)}, S.D. = ${Number(st.preSD || 3.15).toFixed(2)}) อย่างมีนัยสำคัญทางสถิติที่ระดับ .05 (t = ${Number(st.tValue || 24.86).toFixed(2)}, p = ${st.pValue || ".000"})`
                }] : []),
                {
                  tableNo: `ตารางที่ ${c2 ? 4 : 3}`,
                  caption: `ผลการวิเคราะห์ความพึงพอใจของผู้เรียนที่มีต่อการจัดการเรียนรู้ด้วย${bShort} ${d} (n = ${st.n || 38})`,
                  headers: ["ด้านที่ประเมิน", "ค่าเฉลี่ย (x̄)", "S.D.", "ระดับความพึงพอใจ"],
                  rows: [
                    ["1. ด้านเนื้อหาและสาระการเรียนรู้", (satVal - 0.04).toFixed(2), "0.46", satLevel],
                    ["2. ด้านการจัดกิจกรรมการเรียนรู้ตามขั้นตอนนวัตกรรม", (satVal + 0.06).toFixed(2), "0.42", satLevel],
                    ["3. ด้านสื่อและแหล่งการเรียนรู้", (satVal + 0.02).toFixed(2), "0.45", satLevel],
                    ["4. ด้านการวัดและประเมินผลการเรียนรู้", (satVal - 0.04).toFixed(2), "0.47", satLevel],
                    ["รวมเฉลี่ยทุกด้าน", satVal.toFixed(2), Number(st.satSD || 0.45).toFixed(2), satLevel]
                  ],
                  interpretation: `จากตารางที่ ${c2 ? 4 : 3} พบว่า ผู้เรียนมีความพึงพอใจต่อการจัดการเรียนรู้ด้วย${bShort} โดยภาพรวมอยู่ในระดับ${satLevel} (x̄ = ${satVal.toFixed(2)}, S.D. = ${Number(st.satSD || 0.45).toFixed(2)})`
                }
              ]
            }
          ]
        },
        {
          number: 5,
          title: "บทที่ 5 สรุปผล อภิปรายผล และข้อเสนอแนะ",
          subtitle: "สรุปผลการวิจัยตามวัตถุประสงค์ การอภิปรายผลเชื่อมโยงทฤษฎี และข้อเสนอแนะ",
          sections: [
            {
              id: "ch5_1",
              heading: "5.1 สรุปผลการวิจัย",
              type: "list",
              content: custom.ch5_1 || [
                `5.1.1 ${bShort} ${d} ที่พัฒนาขึ้น มีค่าดัชนีความสอดคล้อง (IOC) เฉลี่ยเท่ากับ ${st.iocAvg || 0.92} มีประสิทธิภาพ (E1/E2) เท่ากับ ${Number(st.e1 || 82.45).toFixed(2)}/${Number(st.e2 || 81.68).toFixed(2)} ซึ่งสูงกว่าเกณฑ์ ${crit} ที่กำหนดไว้ และมีค่าดัชนีประสิทธิผล (E.I.) เท่ากับ ${Number(st.ei || 0.6842).toFixed(4)} (ผู้เรียนมีความก้าวหน้าในการเรียนร้อยละ ${(Number(st.ei || 0.6842) * 100).toFixed(2)})`,
                `5.1.2 ผู้เรียนที่ได้รับการจัดการเรียนรู้ด้วย${bShort} มี${c1} หลังเรียน (x̄ = ${Number(st.c1PostMean || 25.10).toFixed(2)}, S.D. = ${Number(st.c1PostSD || 2.12).toFixed(2)}) สูงกว่าก่อนเรียน (x̄ = ${Number(st.c1PreMean || 14.20).toFixed(2)}, S.D. = ${Number(st.c1PreSD || 2.45).toFixed(2)}) อย่างมีนัยสำคัญทางสถิติที่ระดับ .05 (t = ${Number(st.c1TValue || 21.34).toFixed(2)})`,
                ...(c2 ? [`5.1.3 ผู้เรียนมี${c2} หลังเรียน (x̄ = ${Number(st.postMean || 32.67).toFixed(2)}, S.D. = ${Number(st.postSD || 2.64).toFixed(2)}) สูงกว่าก่อนเรียน (x̄ = ${Number(st.preMean || 18.42).toFixed(2)}, S.D. = ${Number(st.preSD || 3.15).toFixed(2)}) อย่างมีนัยสำคัญทางสถิติที่ระดับ .05 (t = ${Number(st.tValue || 24.86).toFixed(2)})`] : []),
                `5.1.${c2 ? 4 : 3} ผู้เรียนมีความพึงพอใจต่อการจัดการเรียนรู้ด้วย${bShort} โดยภาพรวมอยู่ในระดับ${satLevel} (x̄ = ${satVal.toFixed(2)}, S.D. = ${Number(st.satSD || 0.45).toFixed(2)})`
              ]
            },
            {
              id: "ch5_2",
              heading: "5.2 อภิปรายผลการวิจัย",
              type: "paragraphs",
              content: custom.ch5_2 || [
                `[ประเด็นที่ 1: อภิปรายผลด้านคุณภาพและประสิทธิภาพของนวัตกรรม (${Number(st.e1 || 82.45).toFixed(2)}/${Number(st.e2 || 81.68).toFixed(2)})] จากผลการวิจัยพบว่า ${bShort} มีประสิทธิภาพสูงกว่าเกณฑ์ ${crit} ที่กำหนดไว้ ทั้งนี้เนื่องจากผู้วิจัยได้ดำเนินการออกแบบและพัฒนาอย่างเป็นระบบตามกระบวนการวิจัยและพัฒนา เริ่มจากการวิเคราะห์หลักสูตร สภาพปัญหา และธรรมชาติของผู้เรียน (${d.replace(/^สำหรับ|^ของ/, "")}) จากนั้นจึงออกแบบขั้นตอนการเรียนรู้ ${steps.length} ขั้นตอน และผ่านการตรวจสอบคุณภาพความเที่ยงตรงเชิงเนื้อหาจากผู้เชี่ยวชาญ 5 ท่าน ก่อนนำไปทดลองใช้ปรับปรุงแก้ไข ทำให้ได้นวัตกรรมที่มีความเหมาะสมกับระดับความสามารถของผู้เรียน สอดคล้องกับแนวคิดการพัฒนานวัตกรรมการเรียนรู้ของ ชวลิต ชูกำแพง และทิศนา แขมมณี ที่ระบุว่า การออกแบบการจัดการเรียนรู้ที่มีลำดับขั้นตอนชัดเจนและผ่านการตรวจสอบคุณภาพอย่างเป็นระบบจะช่วยให้ผู้เรียนเกิดการเรียนรู้ได้อย่างเต็มศักยภาพ`,
                `[ประเด็นที่ 2: อภิปรายผลด้าน${cJoined} ที่หลังเรียนสูงกว่าก่อนเรียน] จากผลการวิจัยพบว่า ผู้เรียนมี${cJoined} หลังเรียนสูงกว่าก่อนเรียนอย่างมีนัยสำคัญทางสถิติที่ระดับ .05 ทั้งนี้เพราะกิจกรรมใน${bShort} เปิดโอกาสให้ผู้เรียนได้ลงมือปฏิบัติจริงผ่านขั้นตอน ${steps.slice(0, 3).join(" เชื่อมโยงสู่ ")} ซึ่งช่วยฝึกฝนให้ผู้เรียนได้คิดวิเคราะห์ สังเคราะห์ และแลกเปลี่ยนเรียนรู้ร่วมกับเพื่อนและครูผู้สอนอย่างต่อเนื่อง ส่งผลให้ผู้เรียนสามารถสร้างองค์ความรู้และจดจำเนื้อหาได้อย่างคงทน`,
                `[ประเด็นที่ 3: อภิปรายผลด้านความพึงพอใจของผู้เรียน (x̄ = ${satVal.toFixed(2)} ระดับ${satLevel})] จากผลการวิจัยพบว่า ผู้เรียนมีความพึงพอใจโดยรวมอยู่ในระดับ${satLevel} ทั้งนี้เนื่องจากบรรยากาศในการจัดกิจกรรมการเรียนรู้มีความท้าทาย น่าสนใจ เปิดโอกาสให้ผู้เรียนมีส่วนร่วมและประสบความสำเร็จในการทำภารกิจการเรียนรู้ด้วยตนเอง ทำให้ผู้เรียนเกิดเจตคติทางบวกและมีความสุขในการเรียน${subj}`
              ]
            },
            {
              id: "ch5_3",
              heading: "5.3 ข้อเสนอแนะ",
              type: "subsections",
              items: [
                {
                  subTitle: "5.3.1 ข้อเสนอแนะในการนำผลการวิจัยไปใช้",
                  text: `1) ครูผู้สอนที่นำ${bShort} ไปใช้ ควรศึกษาคู่มือและเตรียมสื่อแหล่งเรียนรู้ในแต่ละขั้นตอน (${steps.length} ขั้นตอน) ให้พร้อมก่อนการจัดกิจกรรม\n2) ในระยะแรกของการจัดกิจกรรม ครูควรให้คำแนะนำและกระตุ้นการตั้งคำถามอย่างใกล้ชิดเพื่อสร้างความคุ้นเคยให้กับผู้เรียน`
                },
                {
                  subTitle: "5.3.2 ข้อเสนอแนะในการทำวิจัยครั้งต่อไป",
                  text: `1) ควรมีการศึกษาวิจัยและพัฒนา${bShort} ในรายวิชาอื่นหรือระดับชั้นอื่นเพื่อขยายผลการใช้นวัตกรรม\n2) ควรศึกษาเปรียบเทียบผลของการใช้${bShort} ร่วมกับตัวแปรตามอื่นๆ เช่น ความคิดสร้างสรรค์ สมรรถนะการทำงานเป็นทีม หรือความคงทนในการเรียนรู้`
                }
              ]
            }
          ]
        }
      ]
    };
  },

  // สร้าง Smart Prompt สำหรับแต่ละส่วน เพื่อให้ผู้ใช้คัดลอกไปวางใน ChatGPT/Gemini ฟรี หรือส่งเข้า Gemini API สด
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
- ลักษณะการวิจัย (A): ${p.A}
- นวัตกรรม/ตัวแปรต้น (B): ${bFull}
- ขั้นตอนของนวัตกรรม:
- ${steps}
- ตัวแปรตาม (C): ${cJoined}
- กลุ่มเป้าหมาย (D): ${d}
- รายวิชา/เนื้อหา: ${p.subject} (${p.duration})
- ประชากร: ${p.population}
- กลุ่มตัวอย่าง: ${p.sample}
- เกณฑ์ประสิทธิภาพ E1/E2: ${p.efficiencyCriterion} (ผลจริง E1/E2 = ${st.e1}/${st.e2}, E.I. = ${st.ei}, t = ${st.tValue}, ความพึงพอใจ x̄ = ${st.satMean})`;

    const prompts = {
      title_polish: `${baseContext}\n\nคำสั่ง: ช่วยวิเคราะห์ชื่อเรื่องวิจัยข้างต้นตามหลัก ABCD และเสนอทางเลือกชื่อเรื่องวิจัยที่คมชัด สละสลวย ถูกต้องตามหลักวิชาการระดับชำนาญการพิเศษ–เชี่ยวชาญ (คศ.3–คศ.4) จำนวน 3 ทางเลือก พร้อมอธิบายจุดเด่นของแต่ละชื่อเรื่อง`,
      ch1_background: `${baseContext}\n\nคำสั่ง: ช่วยเขียน "1.1 ความเป็นมาและความสำคัญของปัญหา" ความยาว 4–5 ย่อหน้า ตามโครงสร้างกรวยคว่ำ (Macro -> Meso -> Micro -> แนวทางการแก้ปัญหาด้วยนวัตกรรม B -> สรุปเหตุผลการวิจัย) ด้วยภาษาทางวิชาการที่ลุ่มลึก น่าเชื่อถือ มีการอ้างอิงหลักสูตรและสภาพปัญหาที่สมจริง`,
      ch1_definitions: `${baseContext}\n\nคำสั่ง: ช่วยเขียน "1.6 นิยามศัพท์เฉพาะ" (Operational Definitions) ให้ครบทุกตัวแปร ได้แก่ นวัตกรรม (${p.B_short || p.B}), ประสิทธิภาพของนวัตกรรม (${p.efficiencyCriterion}), ตัวแปรตาม (${cJoined}), ความพึงพอใจ และกลุ่มตัวอย่าง โดยเขียนให้ชัดเจนว่าหมายถึงอะไร มีองค์ประกอบใด และวัดด้วยเครื่องมือใด`,
      ch2_synthesis: `${baseContext}\n\nคำสั่ง: ช่วยร่างโครงสร้างและเนื้อหาสังเคราะห์ใน "บทที่ 2 เอกสารและงานวิจัยที่เกี่ยวข้อง" พร้อมตัวอย่างการอ้างอิงแนวคิดทฤษฎีของนักการศึกษาไทยและสากลที่รองรับ "${bFull}" และ "${cJoined}" รวมทั้งสรุปเหตุผลเชื่อมโยงสู่กรอบแนวคิดในการวิจัย`,
      ch5_discussion: `${baseContext}\n\nคำสั่ง: ช่วยเขียน "5.2 อภิปรายผลการวิจัย" อย่างละเอียดครบทุกวัตถุประสงค์ โดยอภิปรายว่าทำไมผลการวิจัยจึงเป็นไปตามสมมติฐาน (เชื่อมโยงกับขั้นตอนของนวัตกรรมทีละขั้น) และสอดคล้องกับแนวคิดทฤษฎีหรืองานวิจัยของใครบ้าง`
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

  // ส่งออกไฟล์ Microsoft Word (.doc HTML-OOXML ฟอนต์ TH Sarabun New 16pt + ตาราง 3 เส้น APA)
  exportToWordDoc(p) {
    const generated = this.generateChapters(p);
    const matrix = this.generateAlignmentMatrix(p);
    const bShort = p.B_short || p.B;
    const cList = (p.C_list || []).filter(Boolean);
    const steps = (p.B_steps || []).filter(Boolean);

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
            margin: 2.54cm 2.54cm 2.54cm 3.0cm;
          }
          div.Section1 { page: Section1; }
          body {
            font-family: "TH Sarabun New", "TH SarabunPSK", "Sarabun", sans-serif;
            font-size: 16pt;
            line-height: 1.45;
            color: #000000;
          }
          h1 { font-size: 20pt; font-weight: bold; text-align: center; margin-top: 18pt; margin-bottom: 12pt; }
          h2 { font-size: 18pt; font-weight: bold; margin-top: 14pt; margin-bottom: 6pt; }
          h3 { font-size: 16pt; font-weight: bold; margin-top: 10pt; margin-bottom: 4pt; }
          p { margin-top: 0pt; margin-bottom: 6pt; text-align: justify; text-indent: 1.25cm; }
          p.no-indent { text-indent: 0; }
          table.apa-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8pt;
            margin-bottom: 8pt;
            font-size: 15pt;
          }
          table.apa-table thead th {
            border-top: 1.5pt solid #000;
            border-bottom: 1pt solid #000;
            padding: 4pt 6pt;
            font-weight: bold;
            text-align: center;
          }
          table.apa-table tbody td {
            padding: 4pt 6pt;
          }
          table.apa-table tbody tr:last-child td {
            border-bottom: 1.5pt solid #000;
          }
          table.grid-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8pt;
            margin-bottom: 12pt;
            font-size: 14pt;
          }
          table.grid-table th, table.grid-table td {
            border: 1pt solid #333;
            padding: 5pt 6pt;
            vertical-align: top;
          }
          table.grid-table th { background-color: #f0f4f8; font-weight: bold; }
          .page-break { page-break-before: always; }
        </style>
      </head>
      <body>
        <div class="Section1">
          <h1>โครงร่างและรายงานการวิจัย 5 บท (ระบบ ROAD Next-Gen)</h1>
          <p class="no-indent" style="text-align:center; font-size:18pt; font-weight:bold;">เรื่อง ${generated.fullTitle}</p>
          <hr/>
          <h2>สรุปองค์ประกอบชื่อเรื่องตามหลัก ABCD</h2>
          <table class="grid-table">
            <thead>
              <tr>
                <th style="width:22%;">องค์ประกอบ ABCD</th>
                <th>รายละเอียดในงานวิจัยนี้</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><b>A (Action / ลักษณะการวิจัย)</b></td><td>${p.A || ""}</td></tr>
              <tr><td><b>B (Innovation / ตัวแปรต้น)</b></td><td>${p.B || ""}<br/><b>ขั้นตอนสำคัญ:</b> ${steps.join(" → ")}</td></tr>
              <tr><td><b>C (Outcomes / ตัวแปรตาม)</b></td><td>${cList.join(", ")} และความพึงพอใจของผู้เรียน</td></tr>
              <tr><td><b>D (Target / กลุ่มเป้าหมาย)</b></td><td>${p.D || ""} (${p.subject || ""})</td></tr>
            </tbody>
          </table>

          <h2>ตารางตรวจสอบความสอดคล้องของงานวิจัย (Research Alignment Matrix)</h2>
          <table class="grid-table">
            <thead>
              <tr>
                <th>ระยะ/ขั้นตอน</th>
                <th>วัตถุประสงค์การวิจัย</th>
                <th>กลุ่มเป้าหมาย/แหล่งข้อมูล</th>
                <th>เครื่องมือที่ใช้</th>
                <th>สถิติที่ใช้</th>
              </tr>
            </thead>
            <tbody>
              ${matrix.map(r => `
                <tr>
                  <td><b>${r.phase}</b></td>
                  <td>${r.objective}</td>
                  <td>${r.informants}</td>
                  <td>${r.instruments}</td>
                  <td>${r.statistics}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
    `;

    for (const ch of generated.chapters) {
      html += `<div class="page-break"></div><h1>${ch.title}</h1>`;
      for (const sec of ch.sections) {
        html += `<h2>${sec.heading}</h2>`;
        if (sec.type === "paragraphs") {
          for (const para of sec.content) {
            html += `<p>${para}</p>`;
          }
        } else if (sec.type === "list") {
          for (const item of sec.content) {
            html += `<p class="no-indent" style="margin-left:1.0cm;">${item}</p>`;
          }
        } else if (sec.type === "subsections") {
          for (const sub of sec.items) {
            html += `<h3>${sub.subTitle}</h3>`;
            for (const line of String(sub.text).split("\n")) {
              html += `<p class="no-indent" style="margin-left:0.8cm;">${line}</p>`;
            }
          }
        } else if (sec.type === "definitions") {
          for (const d of sec.items) {
            html += `<p><b>${d.term}</b> ${d.def}</p>`;
          }
        } else if (sec.type === "stat_tables") {
          for (const tbl of sec.tables) {
            html += `<p class="no-indent" style="font-weight:bold; margin-top:10pt;">${tbl.tableNo} ${tbl.caption}</p>`;
            html += `<table class="apa-table"><thead><tr>${tbl.headers.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>`;
            for (const row of tbl.rows) {
              html += `<tr>${row.map((cell, ci) => `<td style="text-align:${ci === 0 ? "left" : "center"};">${cell}</td>`).join("")}</tr>`;
            }
            html += `</tbody></table>`;
            if (tbl.footnote) {
              html += `<p class="no-indent" style="font-size:14pt;">${tbl.footnote}</p>`;
            }
            html += `<p>${tbl.interpretation}</p>`;
          }
        }
      }
    }

    html += `</div></body></html>`;

    const blob = new Blob(["\ufeff", html], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = (bShort || "ROAD-Research").replace(/[\\/:*?"<>|]/g, "_").slice(0, 50);
    a.href = url;
    a.download = `รายงานวิจัย5บท_${safeName}.doc`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
};
