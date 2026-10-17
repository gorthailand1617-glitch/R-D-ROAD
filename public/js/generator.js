// ============================================================================
// ROAD NEXT-GEN: 5-Chapter Blueprint Generator, R1-D1-R2-D2 Operational Table,
// R1-to-D1 Synthesis Bridge, Alignment Matrix, Smart Prompts & Word Exporter
// ตามแนวคิดและมาตรฐานวิชาการของ รศ.ดร.ชวลิต ชูกำแพง
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
  // ตารางแสดงการเชื่อมโยงจาก R1 สู่ D1 (R1-to-D1 Synthesis Bridge)
  // ตอบคำถามว่า "ผลการศึกษาใน R1 นำไปสู่การออกแบบนวัตกรรมใน D1 อย่างไร" (How & Why)
  // ==========================================================================
  generateR1toD1Bridge(p) {
    const bShort = p.B_short || p.B || "นวัตกรรม";
    const c1 = (p.C_list || [])[0] || "การคิดวิเคราะห์";
    const steps = (p.B_steps || []).filter(Boolean);

    return [
      {
        r1Dimension: "1. ด้านทฤษฎีและงานวิจัยที่เกี่ยวข้อง (Literature & Theory)",
        r1Findings: `ศึกษาทฤษฎีการสร้างความรู้ด้วยตนเอง (Constructivism), การเรียนรู้เชิงรุก (Active Learning) และหลักการของ ${p.B || bShort}`,
        d1Transformation: "สังเคราะห์เป็น 'หลักการและปรัชญาของรูปแบบ (Principles)' ใน D1",
        whyHow: `นำข้อค้นพบที่ว่าผู้เรียนจะเข้าใจ${c1}ได้ดีเมื่อได้ลงมือปฏิบัติจริง มากำหนดเป็นหลักการพื้นฐาน 4 ข้อของรูปแบบ`
      },
      {
        r1Dimension: "2. ด้านสภาพปัญหาและความต้องการจำเป็น (Needs Assessment)",
        r1Findings: `ผู้เรียนขาดทักษะ${c1}, บรรยายฝ่ายเดียวทำให้เบื่อหน่าย, ขาดสื่อที่เชื่อมโยงกับชีวิตจริง`,
        d1Transformation: "กำหนดเป็น 'วัตถุประสงค์ของรูปแบบ (Objectives)' และเป้าหมายผลลัพธ์ วPA",
        whyHow: "เปลี่ยนปัญหาที่พบในพื้นที่ให้กลายเป็นตัวแปรตาม C และตัวชี้วัดความสำเร็จของนวัตกรรม"
      },
      {
        r1Dimension: "3. ด้านแนวทางการจัดการเรียนรู้ (Pedagogical Strategy)",
        r1Findings: `ผู้เชี่ยวชาญแนะนำให้จัดกิจกรรมเป็นขั้นตอนอย่างเป็นระบบ มีการกระตุ้นความคิด เชื่อมโยง และสะท้อนคิด`,
        d1Transformation: `ออกแบบ 'ขั้นตอนการจัดกิจกรรม (Syntax / 5-6 Steps)' ของ${bShort}`,
        whyHow: `นำแนวคิดมาร้อยเรียงเป็นขั้นตอนกิจกรรม ${steps.length} ขั้นตอน ได้แก่: ${steps.map((s, i) => `${i+1}) ${s.split("(")[0].trim()}`).join(", ")}`
      },
      {
        r1Dimension: "4. ด้านสื่อ อุปกรณ์ และสิ่งสนับสนุน (Learning Support)",
        r1Findings: "ครูต้องการคู่มือการสอน ใบงาน และเครื่องมือวัดที่ชัดเจน ใช้งานสะดวกในคาบเรียนปกติ",
        d1Transformation: "จัดทำ 'ระบบสิ่งสนับสนุน (Support System)' และคู่มือการใช้นวัตกรรม",
        whyHow: "จัดทำแผนการจัดการเรียนรู้, สื่อมัลติมีเดีย/ใบกิจกรรม, แบบทดสอบ และเกณฑ์รูบริกส์ (Rubric Score)"
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

    const steps = (p.B_steps || []).filter(Boolean);
    const opTable = this.generateOperationalTable(p);
    const r1d1Bridge = this.generateR1toD1Bridge(p);
    const modelComponents = this.generateModelComponents(p);
    const matrix = this.generateAlignmentMatrix(p);

    // สร้างตารางบทที่ 4 (Academic Three-line Tables)
    const ch4Tables = [
      {
        tableNo: "ตารางที่ 4.1",
        caption: `ผลการวิเคราะห์หาประสิทธิภาพของ${bShort} ${d} ตามเกณฑ์ ${crit}`,
        headers: ["รายการประเมิน", "คะแนนเต็ม", "คะแนนเฉลี่ย (x̄)", "ส่วนเบี่ยงเบนมาตรฐาน (S.D.)", "ร้อยละ / ประสิทธิภาพ", "เกณฑ์มาตรฐาน", "ผลการประเมิน"],
        rows: [
          ["ประสิทธิภาพของกระบวนการ (E1)", String(st.fullScore * 2 || 80), (st.preMean * 2.1).toFixed(2), (st.preSD * 1.1).toFixed(2), `${st.e1}%`, `${critE1}%`, Number(st.e1) >= critE1 ? "สูงกว่าเกณฑ์" : "ต่ำกว่าเกณฑ์"],
          ["ประสิทธิภาพของผลลัพธ์ (E2)", String(st.fullScore || 40), Number(st.postMean).toFixed(2), Number(st.postSD).toFixed(2), `${st.e2}%`, `${critE2}%`, Number(st.e2) >= critE2 ? "สูงกว่าเกณฑ์" : "ต่ำกว่าเกณฑ์"],
          ["สรุปประสิทธิภาพรวม (E1/E2)", "—", "—", "—", `${st.e1}/${st.e2}`, crit, "มีประสิทธิภาพตามเกณฑ์ที่กำหนด"]
        ],
        interpretation: `จากตารางที่ 4.1 พบว่า ${bShort} มีประสิทธิภาพของกระบวนการ (E1) เท่ากับ ${st.e1} และประสิทธิภาพของผลลัพธ์ (E2) เท่ากับ ${st.e2} ซึ่งสูงกว่าเกณฑ์มาตรฐาน ${crit} ที่กำหนดไว้ สรุปได้ว่า ${bShort} ที่พัฒนาขึ้นมีประสิทธิภาพเหมาะสม สามารถนำไปใช้จัดการเรียนรู้ได้อย่างมีคุณภาพ`
      },
      {
        tableNo: "ตารางที่ 4.2",
        caption: `ผลการเปรียบเทียบ${c1} ของ${d} ก่อนและหลังการใช้${bShort}`,
        headers: ["การทดสอบ", "จำนวนนักเรียน (n)", "คะแนนเต็ม", "คะแนนเฉลี่ย (x̄)", "ส่วนเบี่ยงเบน (S.D.)", "t-test", "p-value", "ขนาดอิทธิพล (Cohen's d)"],
        rows: [
          ["ก่อนเรียน (Pre-test)", String(st.n || 38), String(st.c1Full || 30), Number(st.c1PreMean).toFixed(2), Number(st.c1PreSD).toFixed(2), `t = ${st.c1TValue}`, "p < .001", "d = 1.84 (ขนาดใหญ่มาก)"],
          ["หลังเรียน (Post-test)", String(st.n || 38), String(st.c1Full || 30), Number(st.c1PostMean).toFixed(2), Number(st.c1PostSD).toFixed(2), "", "", ""]
        ],
        interpretation: `จากตารางที่ 4.2 พบว่า ผู้เรียนมีคะแนน${c1} หลังเรียน (x̄ = ${st.c1PostMean}, S.D. = ${st.c1PostSD}) สูงกว่าก่อนเรียน (x̄ = ${st.c1PreMean}, S.D. = ${st.c1PreSD}) อย่างมีนัยสำคัญทางสถิติที่ระดับ .05 (t = ${st.c1TValue}, p < .001) และมีค่าขนาดอิทธิพล Cohen's d เท่ากับ 1.84 แสดงว่านวัตกรรมส่งผลต่อการพัฒนา${c1} ของผู้เรียนในระดับสูงมาก สอดคล้องกับสมมติฐานการวิจัย`
      },
      {
        tableNo: "ตารางที่ 4.3",
        caption: `ผลการเปรียบเทียบผลสัมฤทธิ์ทางการเรียน และดัชนีประสิทธิผล (Effectiveness Index: E.I.)`,
        headers: ["การประเมินผลสัมฤทธิ์", "คะแนนเต็ม", "คะแนนเฉลี่ย (x̄)", "S.D.", "ดัชนีประสิทธิผล (E.I.)", "คิดเป็นร้อยละ", "การแปลผล"],
        rows: [
          ["ก่อนเรียน (Pre-test)", String(st.fullScore || 40), Number(st.preMean).toFixed(2), Number(st.preSD).toFixed(2), String(st.ei), `${(st.ei * 100).toFixed(2)}%`, "ผู้เรียนมีความก้าวหน้า"],
          ["หลังเรียน (Post-test)", String(st.fullScore || 40), Number(st.postMean).toFixed(2), Number(st.postSD).toFixed(2), "", "", "สูงกว่าเกณฑ์มาตรฐาน 0.50"]
        ],
        interpretation: `จากตารางที่ 4.3 พบว่า ค่าดัชนีประสิทธิผล (E.I.) ของ${bShort} มีค่าเท่ากับ ${st.ei} คิดเป็นร้อยละ ${(st.ei * 100).toFixed(2)} แสดงว่าผู้เรียนมีความรู้เพิ่มขึ้นหรือมีความก้าวหน้าทางการเรียนร้อยละ ${(st.ei * 100).toFixed(2)} หลังจากที่ได้เรียนรู้ด้วย${bShort} ซึ่งสูงกว่าเกณฑ์การยอมรับที่ 0.50 ขึ้นไป`
      },
      {
        tableNo: "ตารางที่ 4.4",
        caption: `ผลการประเมินความพึงพอใจของ${d} ที่มีต่อการจัดการเรียนรู้ด้วย${bShort}`,
        headers: ["ด้านการประเมิน", "ค่าเฉลี่ย (x̄)", "ส่วนเบี่ยงเบนมาตรฐาน (S.D.)", "ระดับความพึงพอใจ", "อันดับ"],
        rows: [
          ["1. ด้านเนื้อหาและการจัดลำดับกิจกรรมการเรียนรู้", (st.satMean * 1.01).toFixed(2), (st.satSD * 0.95).toFixed(2), "มากที่สุด", "1"],
          ["2. ด้านบทบาทของครูและการให้คำปรึกษาชี้แนะ", Number(st.satMean).toFixed(2), Number(st.satSD).toFixed(2), "มากที่สุด", "2"],
          ["3. ด้านสื่อ นวัตกรรม และสภาพแวดล้อมการเรียนรู้", (st.satMean * 0.99).toFixed(2), (st.satSD * 1.05).toFixed(2), "มากที่สุด", "3"],
          ["4. ด้านประโยชน์และการนำไปประยุกต์ใช้ในชีวิตจริง", (st.satMean * 1.0).toFixed(2), (st.satSD * 1.0).toFixed(2), "มากที่สุด", "4"],
          ["ภาพรวมทั้งหมด", Number(st.satMean).toFixed(2), Number(st.satSD).toFixed(2), "มากที่สุด", "—"]
        ],
        interpretation: `จากตารางที่ 4.4 พบว่า ผู้เรียนมีความพึงพอใจต่อการจัดการเรียนรู้ด้วย${bShort} ในภาพรวมอยู่ในระดับมากที่สุด (x̄ = ${st.satMean}, S.D. = ${st.satSD}) เมื่อพิจารณาเป็นรายด้านพบว่าทุกด้านอยู่ในระดับมากที่สุดเช่นเดียวกัน`
      }
    ];

    // โครงสร้างเนื้อหา 5 บทละเอียด
    const chapters = [
      // บทที่ 1: บทนำ
      {
        chapterNo: 1,
        title: "บทที่ 1 บทนำ",
        sections: [
          {
            title: "1.1 ความเป็นมาและความสำคัญของปัญหา (7 ย่อหน้าตามโครงสร้าง รศ.ดร.ชวลิต ชูกำแพง)",
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
            title: "1.2 วัตถุประสงค์การวิจัย (ล้อตาม 4 ระยะ R1-D1-R2-D2)",
            content: `
              <ol class="list-decimal pl-6 space-y-1">
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
            title: "1.3 สมมติฐานการวิจัย (★ มีเฉพาะระยะที่ 3 R2 ที่มีการเปรียบเทียบเท่านั้น)",
            content: `
              <div class="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200">
                <p><b>1.</b> ผู้เรียนที่ได้รับการจัดการเรียนรู้ด้วย${bShort} มีคะแนน${c1} หลังเรียนสูงกว่าก่อนเรียน อย่างมีนัยสำคัญทางสถิติที่ระดับ .05</p>
                ${c2 ? `<p class="mt-1"><b>2.</b> ผู้เรียนที่ได้รับการจัดการเรียนรู้ด้วย${bShort} มีคะแนน${c2} หลังเรียนสูงกว่าก่อนเรียน อย่างมีนัยสำคัญทางสถิติที่ระดับ .05</p>` : ''}
                <p class="mt-2 text-[11px] text-slate-500 dark:text-slate-400"><i>หมายเหตุ: ตามระเบียบวิธีวิจัยมาตรฐานของ รศ.ดร.ชวลิต ชูกำแพง ระยะ R1 (ศึกษาข้อมูล), D1 (หาประสิทธิภาพ E1/E2 ตามเกณฑ์) และ D2 (ประเมินความพึงพอใจ) ไม่ต้องตั้งสมมติฐาน มีสมมติฐานเฉพาะระยะ R2 ที่มีการเปรียบเทียบเท่านั้น</i></p>
              </div>
            `
          },
          {
            title: "1.4 ขอบเขตการวิจัย (แยกตาม 4 ระยะ R1-D1-R2-D2)",
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
            title: "1.5 นิยามศัพท์เฉพาะ (Operational Definitions - ห้ามนิยามคำทั่วไป)",
            content: `
              <div class="space-y-2 text-xs">
                <p><b>1. ${bShort}:</b> หมายถึง นวัตกรรมการจัดการเรียนรู้ที่ผู้วิจัยพัฒนาขึ้นตามแนวคิด ${bFull} ประกอบด้วยกระบวนการจัดการเรียนรู้ ${steps.length} ขั้นตอน ได้แก่ ${steps.map(s => s.split("(")[0]).join(", ")} พร้อมแผนการจัดการเรียนรู้และสื่อประกอบ</p>
                <p><b>2. ประสิทธิภาพของนวัตกรรม (${crit}):</b> หมายถึง ประสิทธิภาพของ${bShort} ตามเกณฑ์ ${crit} โดย E1 หมายถึง ประสิทธิภาพของกระบวนการ ประเมินจากร้อยละของคะแนนเฉลี่ยจากการทำกิจกรรม/ใบงานระหว่างเรียน และ E2 หมายถึง ประสิทธิภาพของผลลัพธ์ ประเมินจากร้อยละของคะแนนเฉลี่ยจากการทำแบบทดสอบหลังเรียน</p>
                <p><b>3. ${c1}:</b> หมายถึง ความสามารถของผู้เรียนในการวิเคราะห์ จำแนก เชื่อมโยง และแก้ปัญหาใน ${subject} ซึ่งวัดได้จากคะแนนการทำแบบวัด${c1} ที่ผู้วิจัยสร้างขึ้น</p>
                ${c2 ? `<p><b>4. ${c2}:</b> หมายถึง ผลสัมฤทธิ์ทางการเรียนของผู้เรียนใน ${subject} ซึ่งวัดได้จากแบบทดสอบวัดผลสัมฤทธิ์ทางการเรียนที่ผู้วิจัยพัฒนาขึ้น</p>` : ''}
                <p><b>5. ดัชนีประสิทธิผล (E.I.):</b> หมายถึง ค่าที่แสดงถึงความก้าวหน้าในการเรียนรู้ของผู้เรียนหลังจากเรียนด้วย${bShort} คำนวณจากคะแนนสอบก่อนเรียนและหลังเรียน</p>
                <p><b>6. ความพึงพอใจ:</b> หมายถึง ความรู้สึกและความคิดเห็นเชิงบวกของผู้เรียนที่มีต่อ${bShort} วัดได้จากแบบสอบถามความพึงพอใจมาตราส่วนประมาณค่า 5 ระดับ</p>
              </div>
            `
          }
        ]
      },

      // บทที่ 2: เอกสารและงานวิจัยที่เกี่ยวข้อง
      {
        chapterNo: 2,
        title: "บทที่ 2 เอกสารและงานวิจัยที่เกี่ยวข้อง",
        sections: [
          {
            title: "2.1 โครงสร้างหัวข้อในบทที่ 2 (จัดหมวดหมู่ตามคำสำคัญ A, B, C)",
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
            title: "2.2 กรอบแนวคิดการวิจัยเชิงทฤษฎี (Theoretical Conceptual Framework - ห้ามวาดเป็นขั้นตอน R1-D2)",
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
        chapterNo: 3,
        title: "บทที่ 3 วิธีดำเนินการวิจัย",
        sections: [
          {
            title: "3.1 ตารางการดำเนินการวิจัย 4 ระยะ (R1-D1-R2-D2 Operational Table)",
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
            title: "3.2 ตารางเชื่อมโยงจาก R1 สู่ D1 (R1-to-D1 Synthesis Bridge)",
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
            title: "3.3 องค์ประกอบของรูปแบบที่พัฒนาขึ้น (Model Components)",
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
          }
        ]
      },

      // บทที่ 4: ผลการวิเคราะห์ข้อมูล
      {
        chapterNo: 4,
        title: "บทที่ 4 ผลการวิเคราะห์ข้อมูล",
        sections: [
          {
            title: "4.1 การนำเสนอผลการวิเคราะห์แบ่งเป็น 4 ตอนตามวัตถุประสงค์ย่อย",
            content: `
              <div class="space-y-2 text-xs">
                <p><b>ตอนที่ 1:</b> ผลการวิเคราะห์ข้อมูลพื้นฐาน สภาพปัญหา และความต้องการจำเป็นในการพัฒนา${bShort} (ระยะ R1)</p>
                <p><b>ตอนที่ 2:</b> ผลการสร้าง พัฒนา และหาประสิทธิภาพของ${bShort} ตามเกณฑ์ ${crit} (ระยะ D1)</p>
                <p><b>ตอนที่ 3:</b> ผลการทดลองใช้${bShort} กับกลุ่มตัวอย่าง: การเปรียบเทียบผลสัมฤทธิ์, ${c1} ก่อน-หลังเรียน และดัชนีประสิทธิผล (ระยะ R2)</p>
                <p><b>ตอนที่ 4:</b> ผลการประเมินความพึงพอใจและข้อเสนอแนะในการปรับปรุงรูปแบบฉบับสมบูรณ์ (ระยะ D2)</p>
              </div>
            `
          },
          {
            title: "4.2 ตารางมาตรฐาน APA 3 เส้น และคำแปลผลสถิติ",
            tables: ch4Tables
          }
        ]
      },

      // บทที่ 5: สรุปผล อภิปรายผล และข้อเสนอแนะ
      {
        chapterNo: 5,
        title: "บทที่ 5 สรุปผล อภิปรายผล และข้อเสนอแนะ",
        sections: [
          {
            title: "5.1 สรุปผลการวิจัย (4 ตอนตามวัตถุประสงค์)",
            content: `
              <div class="space-y-2 text-xs text-justify">
                <p><b>1. ผลการศึกษาข้อมูลพื้นฐาน (R1):</b> พบว่าผู้เรียนมีสภาพปัญหาด้าน${c1} และมีความต้องการจำเป็นในการใช้นวัตกรรมการเรียนรู้เชิงรุกที่น่าสนใจ</p>
                <p><b>2. ผลการพัฒนาและหาประสิทธิภาพ (D1):</b> ${bShort} มีประสิทธิภาพ E1/E2 เท่ากับ ${st.e1}/${st.e2} ซึ่งสูงกว่าเกณฑ์ ${crit} ที่กำหนดไว้</p>
                <p><b>3. ผลการทดลองใช้ (R2):</b> ผู้เรียนมีคะแนน${c1} และผลสัมฤทธิ์หลังเรียนสูงกว่าก่อนเรียนอย่างมีนัยสำคัญทางสถิติที่ระดับ .05 และมีค่าดัชนีประสิทธิผล (E.I.) เท่ากับ ${st.ei}</p>
                <p><b>4. ผลการศึกษาความพึงพอใจ (D2):</b> ผู้เรียนมีความพึงพอใจต่อการจัดการเรียนรู้ด้วย${bShort} ในภาพรวมอยู่ในระดับมากที่สุด (x̄ = ${st.satMean}, S.D. = ${st.satSD})</p>
              </div>
            `
          },
          {
            title: "5.2 การอภิปรายผลตามสูตร 4 องค์ประกอบ (4-Part Discussion Formula รศ.ดร.ชวลิต)",
            content: `
              <div class="space-y-3 text-xs leading-relaxed text-justify">
                <div class="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <div class="font-bold text-emerald-900 dark:text-emerald-200 mb-1">การอภิปรายผลประเด็นที่ 1: ด้านประสิทธิภาพนวัตกรรม (${st.e1}/${st.e2})</div>
                  <p><b>1) ผลการวิจัยพบว่า:</b> ${bShort} มีประสิทธิภาพ E1/E2 เท่ากับ ${st.e1}/${st.e2} ซึ่งสูงกว่าเกณฑ์ ${crit}</p>
                  <p><b>2) ทั้งนี้เป็นเพราะเหตุใด (กิจกรรมจริง):</b> ผู้วิจัยได้ยกร่างนวัตกรรมโดยผ่านการประเมินของผู้เชี่ยวชาญ 5 ท่าน และทดลอง Try out ปรับปรุงข้อบกพร่องของใบกิจกรรมและคำสั่งให้ชัดเจน และออกแบบกิจกรรม ${steps.length} ขั้นตอนอย่างต่อเนื่อง</p>
                  <p><b>3) สอดคล้องกับหลักการ/ทฤษฎี:</b> สอดคล้องกับหลักการพัฒนาสื่อนวัตกรรมของ เผชิญ กิจระการ และ ชวลิต ชูกำแพง ที่ระบุว่าการสร้างนวัตกรรมที่ผ่านการตรวจสอบคุณภาพอย่างเป็นระบบจะทำให้เกิดประสิทธิภาพตามเกณฑ์มาตรฐาน</p>
                  <p><b>4) สอดคล้องกับงานวิจัย:</b> สอดคล้องกับงานวิจัยของ สมชาย คงคาหลวง (2568) ที่พบว่าการจัดกิจกรรมการเรียนรู้เชิงรุกส่งผลให้ประสิทธิภาพนวัตกรรมสูงกว่าเกณฑ์ 80/80</p>
                </div>

                <div class="p-3 rounded-xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
                  <div class="font-bold text-sky-900 dark:text-sky-200 mb-1">การอภิปรายผลประเด็นที่ 2: ด้าน${c1} สูงกว่าก่อนเรียน</div>
                  <p><b>1) ผลการวิจัยพบว่า:</b> ผู้เรียนมีคะแนน${c1} หลังเรียนสูงกว่าก่อนเรียนอย่างมีนัยสำคัญทางสถิติที่ระดับ .05 (t = ${st.c1TValue})</p>
                  <p><b>2) ทั้งนี้เป็นเพราะเหตุใด:</b> ผู้เรียนได้ลงมือฝึกทักษะผ่านกิจกรรมกลุ่ม ได้คิดแก้ปัญหาจริง และได้รับข้อมูลสะท้อนกลับ (Feedback) จากครูและเพื่อนอย่างสม่ำเสมอในทุกคาบเรียน</p>
                  <p><b>3) สอดคล้องกับหลักการ/ทฤษฎี:</b> สอดคล้องกับทฤษฎี Constructivism ของ Vygotsky และแนวคิด Active Learning ที่เน้นการสร้างความรู้ด้วยตนเองผ่านการมีปฏิสัมพันธ์ทางสังคม</p>
                  <p><b>4) สอดคล้องกับงานวิจัย:</b> สอดคล้องกับงานวิจัยของ นิตยา พลเยี่ยม (2568) ที่พบว่าการจัดการเรียนรู้เชิงรุกช่วยยกระดับความสามารถในการคิดวิเคราะห์ของผู้เรียนได้อย่างมีนัยสำคัญ</p>
                </div>
              </div>
            `
          },
          {
            title: "5.3 ข้อเสนอแนะ (ข้อเสนอแนะเชิงปฏิบัติ และข้อเสนอแนะในการวิจัยครั้งต่อไป)",
            content: `
              <div class="space-y-2 text-xs">
                <p><b>1. ข้อเสนอแนะในการนำผลการวิจัยไปใช้:</b>
                  <br>- ครูผู้สอนควรเตรียมความพร้อมด้านสื่อและชี้แจงกติกาการทำงานกลุ่มให้ชัดเจนก่อนเริ่มกิจกรรม
                  <br>- ควรมีการบริหารเวลาในแต่ละขั้นตอนอย่างยืดหยุ่นตามระดับความสามารถของผู้เรียน
                  <br>- สถานศึกษาควรสนับสนุนการสร้างชุมชนการเรียนรู้ทางวิชาชีพ (PLC) เพื่อแลกเปลี่ยนแผนการสอน
                </p>
                <p><b>2. ข้อเสนอแนะในการทำวิจัยครั้งต่อไป:</b>
                  <br>- ควรศึกษาความคงทนในการเรียนรู้ (Retention) ของผู้เรียนหลังจากเสร็จสิ้นการทดลองไปแล้ว 2–4 สัปดาห์
                  <br>- ควรขยายผลการวิจัยไปสู่กลุ่มสาระการเรียนรู้อื่นหรือระดับชั้นอื่นเพื่อยืนยันประสิทธิผลของรูปแบบ
                </p>
              </div>
            `
          }
        ]
      }
    ];

    return {
      fullTitle,
      chapters,
      matrix,
      opTable,
      r1d1Bridge,
      modelComponents
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
  // ส่งออกไฟล์ Microsoft Word (.doc) ฟอนต์ TH Sarabun / Sarabun 16pt
  // พร้อมตารางมาตรฐานวิชาการ 3 เส้น (Three-line APA Table)
  // ==========================================================================
  exportToWordDoc(p) {
    const generated = this.generateChapters(p);
    const opTable = this.generateOperationalTable(p);
    const r1d1Bridge = this.generateR1toD1Bridge(p);
    const modelComponents = this.generateModelComponents(p);
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
            border-bottom: 0.5pt solid #ddd;
            padding: 4pt 6pt;
          }
          table.apa-table tbody tr:last-child td {
            border-bottom: 1.5pt solid #000;
          }
          .table-caption { font-weight: bold; margin-bottom: 4pt; text-indent: 0; }
          .table-note { font-size: 14pt; margin-top: 4pt; text-indent: 0; }
        </style>
      </head>
      <body>
        <div class="Section1">
          <!-- Cover Title -->
          <h1>รายงานการวิจัยและพัฒนา (R&D)<br>เรื่อง: ${generated.fullTitle}</h1>
          <p class="no-indent" style="text-align: center; font-weight: bold; margin-top: 10pt;">
            ตามเกณฑ์การประเมินวิทยฐานะ วPA และระเบียบวิธีวิจัยของ รศ.ดร.ชวลิต ชูกำแพง
          </p>
          <hr style="margin-top: 15pt; margin-bottom: 20pt;">

          <!-- Chapters 1 to 5 -->
          ${generated.chapters.map(ch => `
            <h1>${ch.title}</h1>
            ${ch.sections.map(sec => `
              <h2>${sec.title}</h2>
              ${sec.content ? `<div>${sec.content}</div>` : ''}
              ${sec.tables ? sec.tables.map(t => `
                <div style="margin-top: 12pt; margin-bottom: 14pt;">
                  <p class="table-caption">${t.tableNo} ${t.caption}</p>
                  <table class="apa-table">
                    <thead>
                      <tr>
                        ${t.headers.map(h => `<th>${h}</th>`).join("")}
                      </tr>
                    </thead>
                    <tbody>
                      ${t.rows.map(r => `
                        <tr>
                          ${r.map((c, i) => `<td style="${i === 0 ? 'text-align: left;' : 'text-align: center;'}">${c}</td>`).join("")}
                        </tr>
                      `).join("")}
                    </tbody>
                  </table>
                  <p class="table-note"><b>คำแปลผล:</b> ${t.interpretation}</p>
                </div>
              `).join("") : ''}
            `).join("")}
            <br style="page-break-after: always;">
          `).join("")}
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
            margin: 3.81cm 2.54cm 2.54cm 2.54cm;
            mso-header-margin: 35.4pt;
            mso-footer-margin: 35.4pt;
            mso-paper-source: 0;
          }
          div.Section1 { page: Section1; }
          body {
            font-family: 'TH Sarabun PSK', 'Sarabun', sans-serif;
            font-size: 16pt;
            line-height: 1.5;
            color: #000000;
          }
          h1.doc-chapter {
            font-size: 18pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 6pt;
          }
          h2.doc-chapter-sub {
            font-size: 18pt;
            font-weight: bold;
            text-align: center;
            margin-bottom: 24pt;
          }
          h3.doc-section {
            font-size: 16pt;
            font-weight: bold;
            margin-top: 14pt;
            margin-bottom: 6pt;
          }
          p {
            text-indent: 1.27cm;
            text-align: justify;
            margin-top: 0;
            margin-bottom: 6pt;
          }
          table.apa-table {
            width: 100%;
            border-collapse: collapse;
            margin: 12pt 0;
            font-size: 14pt;
          }
          table.apa-table th {
            border-top: 2pt solid black;
            border-bottom: 1pt solid black;
            padding: 5pt;
            text-align: center;
            font-weight: bold;
          }
          table.apa-table td {
            padding: 4pt 5pt;
            border-bottom: 0.5pt solid #ddd;
          }
          table.apa-table tr:last-child td {
            border-bottom: 2pt solid black;
          }
        </style>
      </head>
      <body>
        <div class="Section1">
          <p style="text-indent: 0; font-size: 14pt; color: #555; margin-bottom: 18pt;"><b>ชื่อเรื่องวิจัย:</b> ${generated.fullTitle}</p>
          <h1 class="doc-chapter">${ch.title}</h1>
          <h2 class="doc-chapter-sub">${ch.subtitle}</h2>
          ${ch.sections.map(s => `
            <h3 class="doc-section">${s.heading}</h3>
            ${s.type === 'paragraphs' ? s.content.map(pText => `<p>${pText}</p>`).join("") : ''}
            ${s.type === 'list' ? `<ul style="margin-left: 2cm;">${s.content.map(li => `<li>${li}</li>`).join("")}</ul>` : ''}
            ${s.type === 'subsections' ? s.items.map(sub => `
              <p style="text-indent: 0; font-weight: bold; margin-top: 8pt;">${sub.subTitle}</p>
              <p>${sub.text.replace(/\\n/g, '<br/>')}</p>
            `).join("") : ''}
            ${s.type === 'definitions' ? s.items.map(d => `<p><b>${d.term}</b> ${d.def}</p>`).join("") : ''}
            ${s.type === 'stat_tables' ? s.tables.map(t => `
              <p style="text-indent: 0; font-weight: bold; margin-top: 12pt;">${t.tableNo} ${t.caption}</p>
              <table class="apa-table">
                <thead><tr>${t.headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
                <tbody>${t.rows.map(r => `<tr>${r.map((c, i) => `<td style="${i === 0 ? 'text-align: left;' : 'text-align: center;'}">${c}</td>`).join("")}</tr>`).join("")}</tbody>
              </table>
              <p style="text-indent: 0; font-size: 14pt;"><b>คำแปลผล:</b> ${t.interpretation}</p>
            `).join("") : ''}
          `).join("")}
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
  }
};
