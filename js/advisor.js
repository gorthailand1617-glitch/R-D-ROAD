// ============================================================================
// ROAD NEXT-GEN: AI Research Advisor & Best-Practice Decision Engine
// ระบบวิเคราะห์ชื่อเรื่อง ABCD, กฎเหล็ก 10 ประการ (10 Pitfalls Validator),
// และระบบคัดสรรทางเลือกวิจัยที่ดีที่สุดตามเกณฑ์ วPA และหลักการ รศ.ดร.ชวลิต ชูกำแพง
// ============================================================================

window.ROAD_ADVISOR = {
  SUBJECT_GROUPS: [
    { id: "thai", name: "ภาษาไทย", defaultTopic: "การอ่านจับใจความสำคัญและการเขียนสื่อสาร", codePrefix: "ท" },
    { id: "math", name: "คณิตศาสตร์", defaultTopic: "การแก้โจทย์ปัญหาร้อยละและอัตราส่วนในชีวิตประจำวัน", codePrefix: "ค" },
    { id: "sci", name: "วิทยาศาสตร์และเทคโนโลยี", defaultTopic: "ระบบนิเวศและการแก้ปัญหาเชิงวิทยาศาสตร์", codePrefix: "ว" },
    { id: "soc", name: "สังคมศึกษา ศาสนา และวัฒนธรรม", defaultTopic: "พลเมืองดีและการวิเคราะห์เหตุการณ์ร่วมสมัย", codePrefix: "ส" },
    { id: "eng", name: "ภาษาต่างประเทศ (ภาษาอังกฤษ)", defaultTopic: "การสื่อสารภาษาอังกฤษเพื่อชีวิตประจำวัน (Communicative English)", codePrefix: "อ" },
    { id: "health", name: "สุขศึกษาและพลศึกษา", defaultTopic: "การสร้างเสริมสุขภาพและทักษะการเคลื่อนไหว", codePrefix: "พ" },
    { id: "art", name: "ศิลปะ ดนตรี นาฏศิลป์", defaultTopic: "การสร้างสรรค์ผลงานทัศนศิลป์และดนตรีสร้างสรรค์", codePrefix: "ศ" },
    { id: "career", name: "การงานอาชีพและเทคโนโลยี", defaultTopic: "ทักษะงานประดิษฐ์และการคิดเชิงออกแบบ (Design Thinking)", codePrefix: "ง" },
    { id: "early", name: "การศึกษาปฐมวัย", defaultTopic: "การพัฒนาทักษะสมอง EF และกล้ามเนื้อมัดเล็ก", codePrefix: "ปฐมวัย" },
    { id: "voc", name: "อาชีวศึกษา (ปวช./ปวส.)", defaultTopic: "ทักษะปฏิบัติงานวิชาชีพและการแก้ปัญหาหน้างาน", codePrefix: "รหัสวิชาชีพ" },
    { id: "admin", name: "บริหารการศึกษา / นิเทศการศึกษา", defaultTopic: "การนิเทศภายในโดยใช้ชุมชนแห่งการเรียนรู้ทางวิชาชีพ (PLC)", codePrefix: "บริหาร" }
  ],

  GRADE_LEVELS: [
    { id: "k", label: "ระดับปฐมวัย (อนุบาล 1–3)", dText: "สำหรับเด็กปฐมวัย ชั้นอนุบาลปีที่ 3", sampleSize: 25, criterion: "75/75" },
    { id: "p1_3", label: "ประถมศึกษาตอนต้น (ป.1–ป.3)", dText: "ของนักเรียนชั้นประถมศึกษาปีที่ 3", sampleSize: 30, criterion: "75/75" },
    { id: "p4_6", label: "ประถมศึกษาตอนปลาย (ป.4–ป.6)", dText: "สำหรับนักเรียนชั้นประถมศึกษาปีที่ 6", sampleSize: 32, criterion: "80/80" },
    { id: "m1_3", label: "มัธยมศึกษาตอนต้น (ม.1–ม.3)", dText: "สำหรับนักเรียนชั้นมัธยมศึกษาปีที่ 3", sampleSize: 38, criterion: "80/80" },
    { id: "m4_6", label: "มัธยมศึกษาตอนปลาย (ม.4–ม.6)", dText: "สำหรับนักเรียนชั้นมัธยมศึกษาปีที่ 5", sampleSize: 40, criterion: "80/80" },
    { id: "voc", label: "อาชีวศึกษา (ปวช. / ปวส.)", dText: "สำหรับนักศึกษาระดับประกาศนียบัตรวิชาชีพ (ปวช.) ชั้นปีที่ 2", sampleSize: 35, criterion: "80/80" },
    { id: "teacher", label: "ครูผู้สอนในสถานศึกษา (สำหรับผู้บริหาร/ศึกษานิเทศก์)", dText: "ของครูผู้สอนในสถานศึกษา", sampleSize: 30, criterion: "80/80" }
  ],

  PAIN_POINTS: [
    {
      id: "thinking",
      label: "ผู้เรียนขาดทักษะการคิดวิเคราะห์ / แก้โจทย์ปัญหาไม่เป็น",
      c1BySubject: {
        math: "ความสามารถในการแก้โจทย์ปัญหาทางคณิตศาสตร์",
        sci: "ความสามารถในการคิดวิเคราะห์เชิงวิทยาศาสตร์",
        thai: "ความสามารถในการคิดวิเคราะห์และการอ่านอย่างมีวิจารณญาณ",
        default: "ความสามารถในการคิดวิเคราะห์และแก้ปัญหา"
      }
    },
    {
      id: "reading_writing",
      label: "ผู้เรียนอ่านไม่คล่อง / จับใจความสำคัญไม่ได้ / เขียนสื่อสารไม่คล่อง",
      c1BySubject: {
        thai: "ความสามารถในการอ่านจับใจความสำคัญและการเขียนสื่อสาร",
        eng: "ความสามารถในการอ่านเพื่อความเข้าใจและคำศัพท์ภาษาอังกฤษ",
        default: "ทักษะการอ่านจับใจความสำคัญและการสรุปองค์ความรู้"
      }
    },
    {
      id: "practice",
      label: "ผู้เรียนขาดทักษะการลงมือปฏิบัติจริง / สร้างชิ้นงานไม่สำเร็จ",
      c1BySubject: {
        sci: "ทักษะกระบวนการทางวิทยาศาสตร์และการสร้างสรรค์ชิ้นงาน",
        career: "ทักษะการปฏิบัติงานและการคิดเชิงออกแบบ (Design Thinking)",
        voc: "ทักษะการปฏิบัติงานวิชาชีพตามมาตรฐานสมรรถนะ",
        default: "ทักษะการปฏิบัติและการสร้างสรรค์ชิ้นงาน"
      }
    },
    {
      id: "motivation",
      label: "ผู้เรียนขาดแรงจูงใจ / เบื่อการเรียนแบบบรรยาย / ขาดการมีส่วนร่วม",
      c1BySubject: {
        default: "การมีส่วนร่วมในการเรียนรู้และทักษะการคิดอย่างกระตือรือร้น"
      }
    },
    {
      id: "achievement",
      label: "ผลสัมฤทธิ์ทางการเรียนต่ำกว่าเกณฑ์มาตรฐานของสถานศึกษา",
      c1BySubject: {
        default: "ความสามารถในการเรียนรู้และประยุกต์ใช้แนวคิดสำคัญ"
      }
    }
  ],

  GOALS_TARGET: [
    {
      id: "car_fast",
      label: "วิจัยในชั้นเรียน / วPA คศ.1–คศ.2 (เน้นทำง่าย จบไวใน 3–4 สัปดาห์)",
      rankId: "ks2",
      preferredModel: "paor",
      durationText: "จำนวน 4 แผนการจัดการเรียนรู้ เวลา 12 ชั่วโมง (4 สัปดาห์)"
    },
    {
      id: "wpa_ks3",
      label: "เลื่อนวิทยฐานะ ชำนาญการพิเศษ (คศ.3) / R&D มาตรฐาน (สมดุลระหว่างความเข้มข้นและทำได้จริง)",
      rankId: "ks3",
      preferredModel: "addie",
      durationText: "จำนวน 5 แผนการจัดการเรียนรู้ เวลา 15 ชั่วโมง (5 สัปดาห์)"
    },
    {
      id: "wpa_ks4_rd",
      label: "เลื่อนวิทยฐานะ เชี่ยวชาญ (คศ.4) / วิทยานิพนธ์ ป.โท–เอก (R&D 4 ระยะเต็มรูปแบบ)",
      rankId: "ks4",
      preferredModel: "rd_4step",
      durationText: "จำนวน 6 แผนการจัดการเรียนรู้ เวลา 18 ชั่วโมง (6 สัปดาห์)"
    }
  ],

  // ==========================================================================
  // ระบบตรวจสอบข้อบกพร่อง 10 ประการ (10 Pitfalls Validator & Health Score)
  // ตามหลักการประเมิน วPA และระเบียบวิธีวิจัย R&D ของ รศ.ดร.ชวลิต ชูกำแพง
  // ==========================================================================
  validate10Pitfalls(p) {
    const rawA = (p.A || "").trim();
    const rawB = (p.B || "").trim();
    const rawCList = (p.C_list || []).filter(Boolean);
    const rawD = (p.D || "").trim();
    const fullTitle = `${rawA}${rawB} ${(p.C_connector || "เพื่อส่งเสริม")} ${rawCList.join(" และ ")} ${rawD}`.trim();
    const rank = p.academicRank || "ks3";
    const track = p.track || "teacher";
    const model = p.modelId || "rd_4step";

    const results = [];
    let passedCount = 0;

    // Rule 1: ห้ามทำประเมินโครงการเพียวๆ
    const isProjEval = fullTitle.includes("การประเมินโครงการ") || fullTitle.startsWith("การประเมินผลโครงการ");
    results.push({
      ruleId: 1,
      ruleName: "ห้ามทำวิจัยเชิงประเมินโครงการเพียวๆ (Non-Project Evaluation Rule)",
      level: isProjEval ? "error" : "pass",
      title: isProjEval ? "พบข้อผิดพลาด: ขึ้นต้นด้วย 'การประเมินโครงการ...'" : "ผ่านเกณฑ์: เป็นการวิจัยและพัฒนานวัตกรรม (R&D)",
      desc: isProjEval
        ? "การประเมินโครงการ (CIPP Model) ไม่สอดคล้องกับหลักเกณฑ์ วPA ของ ก.ค.ศ. ที่เน้น 'การพัฒนานวัตกรรม' ให้เปลี่ยนเป็น 'การวิจัยและพัฒนา' หรือ 'การพัฒนารูปแบบ...'"
        : "ชื่อเรื่องมุ่งเน้นการสร้างและพัฒนานวัตกรรมตามเกณฑ์ วPA ถูกต้อง",
      recommendation: isProjEval ? "ปรับคำกริยาเป็น 'การวิจัยและพัฒนารูปแบบ...' หรือ 'การพัฒนาระบบ...'" : null
    });
    if (!isProjEval) passedCount++;

    // Rule 2: ห้ามใส่คำว่า Model ลอยๆ โดยไม่มีหลักการ
    const hasModelNameWithoutPrinciple = /\b[A-Z]{3,}\s+Model\b/i.test(fullTitle) &&
      !/(ตามแนวคิด|ตามหลักการ|โดยใช้|ร่วมกับ|บนพื้นฐาน)/i.test(rawB);
    results.push({
      ruleId: 2,
      ruleName: "ห้ามตั้งชื่อย่อโมเดล (XYZ Model) ลอยๆ โดยไม่ระบุหลักการเบื้องหลัง",
      level: hasModelNameWithoutPrinciple ? "warning" : "pass",
      title: hasModelNameWithoutPrinciple ? "ข้อควรระวัง: มีชื่อย่อโมเดลลอยๆ ในชื่อเรื่อง" : "ผ่านเกณฑ์: ระบุหลักการ/ทฤษฎีเบื้องหลังชัดเจน",
      desc: hasModelNameWithoutPrinciple
        ? "ตามหลักการ รศ.ดร.ชวลิต ชูกำแพง ชื่อย่อโมเดล (Acronym) ควรเกิดขึ้นหลังจากการสังเคราะห์ในระยะ D1 แล้ว ไม่ควรตั้งไว้ล่วงหน้าลอยๆ ในชื่อเรื่องโดยไม่มีหลักการ/แนวคิดทฤษฎีรองรับ"
        : "ชื่อเรื่องระบุทฤษฎี/แนวคิดที่ใช้ในการพัฒนานวัตกรรมอย่างเป็นรูปธรรม",
      recommendation: hasModelNameWithoutPrinciple ? "ระบุหลักการ เช่น 'รูปแบบการจัดการเรียนรู้ตามแนวคิด GPAS 5 Steps' แทนการใส่ชื่อย่อโมเดลลอยๆ" : null
    });
    if (!hasModelNameWithoutPrinciple) passedCount++;

    // Rule 3: ตรวจตัวแปรคลุมเครือ กว้างเกินไป
    const vagueKeywords = ["ความเป็นคนดี", "กลยุทธ์ที่มีประสิทธิภาพ", "เพื่อพัฒนาการศึกษา", "เพื่อพัฒนาผู้เรียน", "เพื่อพัฒนาผลสัมฤทธิ์$"];
    const isVagueC = rawCList.length === 0 || rawCList.some(c => vagueKeywords.some(v => c.includes(v) || c.trim() === "ผลสัมฤทธิ์"));
    results.push({
      ruleId: 3,
      ruleName: "ตัวแปรตาม (C) ต้องเจาะจง ชัดเจน และวัดได้จริงตามเกณฑ์ วPA ด้านที่ 2",
      level: isVagueC ? "error" : "pass",
      title: isVagueC ? "พบข้อผิดพลาด: ตัวแปรตามกว้างเกินไปหรือคลุมเครือ" : "ผ่านเกณฑ์: ตัวแปรตามชัดเจน สอดคล้องกับตัวชี้วัด",
      desc: isVagueC
        ? "ตัวแปรตาม (C) ต้องสามารถวัดและประเมินได้อย่างเป็นรูปธรรม หลีกเลี่ยงคำว่า 'ความเป็นคนดี' หรือ 'ผลสัมฤทธิ์' ลอยๆ (ต้องระบุกลุ่มสาระหรือทักษะเฉพาะ เช่น ทักษะการคิดวิเคราะห์)"
        : `ระบุตัวแปรตาม ${rawCList.length} ตัวแปรชัดเจน (${rawCList.join(", ")})`,
      recommendation: isVagueC ? "ระบุตัวแปรตามให้ชัด เช่น 'ความสามารถในการคิดวิเคราะห์' หรือ 'ผลสัมฤทธิ์ทางการเรียนวิชา...'" : null
    });
    if (!isVagueC) passedCount++;

    // Rule 4: ตรวจความสอดคล้องกับระดับวิทยฐานะ (คศ.4-5 ต้องเป็น R&D รูปแบบ/ระบบ)
    const isHighRank = rank === "ks4" || rank === "ks5";
    const isSimpleSkillKit = /แบบฝึก|ชุดฝึกทักษะ/.test(rawA + rawB);
    const rankMismatch = isHighRank && isSimpleSkillKit;
    results.push({
      ruleId: 4,
      ruleName: "ระดับนวัตกรรมต้องสอดคล้องกับระดับวิทยฐานะที่คาดหวัง",
      level: rankMismatch ? "error" : "pass",
      title: rankMismatch ? "พบข้อผิดพลาด: นวัตกรรมระดับ 'แบบฝึกทักษะ' ไม่สอดคล้องกับ คศ.4–คศ.5" : "ผ่านเกณฑ์: ระดับนวัตกรรมสมดุลกับระดับวิทยฐานะ",
      desc: rankMismatch
        ? "วิทยฐานะเชี่ยวชาญ (คศ.4) และเชี่ยวชาญพิเศษ (คศ.5) ต้องอยู่ในระดับ 'คิดค้น ปรับเปลี่ยน' นวัตกรรมต้องเป็น 'รูปแบบ (Model) / ระบบ (System) / โปรแกรม (Program) / หลักสูตร' วิจัยแบบ R&D 4 ระยะ ไม่ใช่แค่ชุดฝึกทักษะย่อย"
        : `วิทยฐานะ ${rank} สอดคล้องกับนวัตกรรม "${rawA} ${rawB}"`,
      recommendation: rankMismatch ? "ยกระดับเป็น 'รูปแบบการจัดการเรียนรู้...' หรือ 'รูปแบบการบริหารจัดการ...'" : null
    });
    if (!rankMismatch) passedCount++;

    // Rule 5: ห้ามตั้งสมมติฐานในระยะ R1, D1, D2 (Rule 1: Hypotheses only in R2)
    const hasHypoInOtherPhases = Boolean(
      p.hasHypothesesInNonR2 ||
      (p.hypothesesByPhase && (p.hypothesesByPhase.r1 || p.hypothesesByPhase.d1 || p.hypothesesByPhase.d2))
    );
    results.push({
      ruleId: 5,
      ruleName: "สมมติฐานการวิจัยต้องมีเฉพาะระยะทดลอง (R2) ที่มีการเปรียบเทียบเท่านั้น",
      level: hasHypoInOtherPhases ? "error" : "pass",
      title: hasHypoInOtherPhases
        ? "พบข้อผิดพลาด: มีการตั้งสมมติฐานในระยะ R1, D1 หรือ D2"
        : "ผ่านเกณฑ์: กำหนดสมมติฐานเฉพาะระยะที่ 3 (R2) ตามระเบียบวิธีวิจัยมาตรฐาน",
      desc: hasHypoInOtherPhases
        ? "ตามหลักการวิจัยและพัฒนา (R&D) ของ รศ.ดร.ชวลิต ชูกำแพง ระยะ R1 (สำรวจบริบท/ปัญหา), D1 (สร้างนวัตกรรม/หาประสิทธิภาพ E1/E2 เทียบเกณฑ์) และ D2 (ประเมินความพึงพอใจ) เป็นการวิจัยเชิงพรรณนา ห้ามตั้งสมมติฐานเด็ดขาด! สมมติฐานมีได้เฉพาะระยะทดลองจริง (R2) ที่มีการเปรียบเทียบผลเท่านั้น"
        : "ระยะที่ 1 (R1), ระยะที่ 2 (D1) และระยะที่ 4 (D2) เป็นการวิจัยเชิงสำรวจและประเมินคุณภาพ จึงไม่ต้องตั้งสมมติฐาน มีสมมติฐานเฉพาะระยะที่ 3 (เปรียบเทียบผลก่อน-หลัง)",
      recommendation: hasHypoInOtherPhases ? "คลิกปุ่ม 'ปรับแก้สมมติฐานเฉพาะระยะ R2 อัตโนมัติ' เพื่อตัดสมมติฐานในระยะ R1, D1, D2 ออกทันที" : null,
      autoFixAction: hasHypoInOtherPhases ? "autoFixHypothesesToR2Only" : null
    });
    if (!hasHypoInOtherPhases) passedCount++;

    // Rule 6: ห้ามวาดกรอบแนวคิดการวิจัย (Conceptual Framework) เป็นขั้นตอน R1-D2
    results.push({
      ruleId: 6,
      ruleName: "กรอบแนวคิดการวิจัย (บทที่ 2) ต้องเป็นความสัมพันธ์เชิงทฤษฎี ห้ามวาดเป็นขั้นตอน R1-D2",
      level: "pass",
      title: "ผ่านเกณฑ์: กรอบแนวคิดจำลองความสัมพันธ์ [หลักการ B + นวัตกรรม A] ===> [ตัวแปร C]",
      desc: "ระบบบล็อกไม่ให้วาดแผนผังขั้นตอนการวิจัย (Research Flow) ปนกับกรอบแนวคิดเชิงทฤษฎี (Conceptual Framework) เพื่อป้องกันกรรมการตีตกในบทที่ 2",
      recommendation: null
    });
    passedCount++;

    // Rule 7: ห้ามนิยามศัพท์คำทั่วไป (นักเรียน ครู โรงเรียน)
    results.push({
      ruleId: 7,
      ruleName: "นิยามศัพท์เฉพาะ (1.6) ห้ามนิยามคำทั่วไปที่ปรากฏในขอบเขตการวิจัยแล้ว",
      level: "pass",
      title: "ผ่านเกณฑ์: จำกัดนิยามเฉพาะคำสำคัญ A, B, C และการพัฒนานวัตกรรม",
      desc: "คำว่า 'นักเรียน', 'ครู', 'โรงเรียน' เป็นประชากรและขอบเขตแล้ว ไม่จำเป็นต้องนำมานิยามศัพท์ซ้ำ",
      recommendation: null
    });
    passedCount++;

    // Rule 8: ห้ามใช้วัตถุประสงค์เพื่อหาประสิทธิภาพ E1/E2 ไปทดสอบ t-test
    results.push({
      ruleId: 8,
      ruleName: "การหาประสิทธิภาพ E1/E2 เป็นการตรวจสอบเกณฑ์ ห้ามตั้งสมมติฐานและห้ามใช้ t-test",
      level: "pass",
      title: "ผ่านเกณฑ์: แยกการรายงาน E1/E2 ออกจากการทดสอบสมมติฐาน t-test ชัดเจน",
      desc: "ประสิทธิภาพ E1/E2 รายงานเฉพาะร้อยละเทียบกับเกณฑ์ (เช่น 80/80) ส่วน t-test ใช้ทดสอบการเปรียบเทียบคะแนนก่อน-หลังเรียนในตัวแปร C",
      recommendation: null
    });
    passedCount++;

    // Rule 9: การอภิปรายผลต้องมีครบ 4 องค์ประกอบ (ห้ามเขียนแบบขนมชั้น)
    results.push({
      ruleId: 9,
      ruleName: "การอภิปรายผล (5.2) ต้องครบ 4 องค์ประกอบ: ผล -> สาเหตุ -> ทฤษฎี -> งานวิจัย",
      level: "pass",
      title: "ผ่านเกณฑ์: สังเคราะห์การอภิปรายผลตาม 4-Part Discussion Formula",
      desc: "ระบบเตรียมโครงสร้างการเขียนอภิปรายผลครบทั้ง 4 ส่วน: ผลเป็นอย่างไร -> เกิดจากกิจกรรมใด -> สอดคล้องทฤษฎีใคร -> สอดคล้องงานวิจัยใคร",
      recommendation: null
    });
    passedCount++;

    // Rule 10: ความสอดคล้องระหว่าง A, B, C, D ข้ามสายงาน
    let trackConflict = false;
    if (track === "admin" && /นักเรียนชั้น|เด็กปฐมวัย/.test(rawD) && !/ครู|สถานศึกษา|โรงเรียน/.test(rawD)) {
      trackConflict = true;
    }
    if (track === "teacher" && /การบริหารจัดการ|การนิเทศภายในเขต/.test(rawA + rawB)) {
      trackConflict = true;
    }
    results.push({
      ruleId: 10,
      ruleName: "ความสอดคล้องระหว่างประเภทนวัตกรรม กลุ่มเป้าหมาย และสายงาน วPA",
      level: trackConflict ? "error" : "pass",
      title: trackConflict ? "พบข้อผิดพลาด: นวัตกรรมหรือกลุ่มเป้าหมายไม่ตรงกับสายงานที่สังกัด" : "ผ่านเกณฑ์: สายงาน นวัตกรรม และกลุ่มเป้าหมายสอดคล้องกัน",
      desc: trackConflict
        ? `สายงาน ${track} ควรมีกลุ่มเป้าหมายและนวัตกรรมที่ตรงกับภาระงาน เช่น ผู้บริหารเน้นการบริหาร/ครู ครูผู้สอนเน้นห้องเรียน/นักเรียน`
        : `สายงาน ${track} มุ่งพัฒนา ${rawD} อย่างเหมาะสม`,
      recommendation: trackConflict ? "ปรับกลุ่มเป้าหมายและนวัตกรรมให้สอดคล้องกับภาระหน้าที่ตามสายงาน" : null
    });
    if (!trackConflict) passedCount++;

    // Rule 11 (V2.0 Guardrail): ความสอดคล้องระหว่างวิธีการสุ่มตัวอย่างและสถิติอ้างอิง (Sampling & Inferential Statistics Guardrail)
    const samplingMeta = p.samplingMetadata || {};
    let samplingType = samplingMeta.type;
    if (!samplingType) {
      if (p.sample && (p.sample.includes("เจาะจง") || p.sample.includes("Purposive"))) samplingType = "purposive";
      else if (p.sample && (p.sample.includes("ประชากรทั้งหมด") || p.sample.includes("ทุกคน") || p.sample.includes("Census"))) samplingType = "population";
      else samplingType = "cluster_random";
    }

    const isNonRandomSampling = samplingType === "purposive" || samplingType === "population";
    const usesTTest = p.selectedStats ? p.selectedStats.includes("ttest") : true;
    const samplingConflict = isNonRandomSampling && usesTTest;

    results.push({
      ruleId: 11,
      ruleName: "ข้อตกลงเบื้องต้นของการสุ่มตัวอย่างกับการใช้สถิติทดสอบสมมติฐาน (Sampling & Hypothesis Guardrail)",
      level: samplingConflict ? "error" : "pass",
      title: samplingConflict
        ? `พบข้อบกพร่องวิกฤต: กลุ่มตัวอย่างแบบ "${samplingType === 'purposive' ? 'เลือกแบบเจาะจง (Purposive)' : 'ประชากรทั้งหมด (Population)'}" ขัดต่อการทดสอบ t-test`
        : "ผ่านเกณฑ์: วิธีการสุ่มตัวอย่างสอดคล้องกับแผนการวิเคราะห์สถิติทดสอบสมมติฐาน",
      desc: samplingConflict
        ? `กลุ่มตัวอย่างระบุเป็น "${samplingType === 'purposive' ? 'การเลือกแบบเจาะจง (Purposive Sampling)' : 'ศึกษาจากประชากรทั้งหมด (Population - ไม่มีการสุ่ม)'}" ขัดต่อข้อตกลงเบื้องต้นเรื่อง Random Sampling และไม่มี Sampling Error ตามหลักสถิติศาสตร์ ห้ามใช้ t-test หรือสถิติอนุมานทดสอบสมมติฐาน ต้องเปลี่ยนเป็นสถิติบรรยาย (x̄, S.D., ร้อยละ) และดัชนีประสิทธิผล (E.I.) หรือปรับวิธีการสุ่มเป็น การสุ่มแบบกลุ่ม (Cluster Random Sampling)`
        : `กลุ่มตัวอย่างใช้ ${samplingType === 'cluster_random' ? 'การสุ่มแบบกลุ่ม (Cluster Random Sampling)' : samplingType === 'simple_random' ? 'การสุ่มอย่างง่าย (Simple Random)' : 'สถิติบรรยายเหมาะสมกับกลุ่มเป้าหมาย'} ถูกต้องตามหลักสถิติวิจัย`,
      recommendation: samplingConflict
        ? "เลือกแก้ไข: 1) ปรับวิธีการสุ่มเป็น 'Cluster Random Sampling' เพื่อใช้ t-test ต่อได้ หรือ 2) ปรับแผนสถิติเป็น 'สถิติบรรยาย + ดัชนีประสิทธิผล E.I.'"
        : null,
      autoFixAction: samplingConflict ? "autoSwitchSamplingToClusterRandom" : null,
      autoFixAction2: samplingConflict ? "autoSwitchStatsToDescriptiveOnly" : null
    });
    // Rule 12: การตรวจสอบความแปรปรวนของประสิทธิภาพ (|E1 - E2| ≤ 5.0% Variance Tolerance)
    const stData = p.statsData || {};
    const e1Val = Number(stData.e1 || 0);
    const e2Val = Number(stData.e2 || 0);
    const eDiff = Math.abs(e1Val - e2Val);
    const eDiffExceeded = (e1Val > 0 && e2Val > 0 && eDiff > 5.0);

    results.push({
      ruleId: 12,
      ruleName: "เกณฑ์ผลต่างประสิทธิภาพกระบวนการและผลลัพธ์ (|E1 - E2| ≤ 5% Variance Tolerance)",
      level: eDiffExceeded ? "error" : "pass",
      title: eDiffExceeded
        ? `พบข้อบกพร่อง: ค่าผลต่าง |E1 - E2| = ${eDiff.toFixed(2)}% เกินกว่าเกณฑ์ 5.0%`
        : `ผ่านเกณฑ์: ผลต่างประสิทธิภาพกระบวนการและผลลัพธ์อยู่ในเกณฑ์มาตรฐาน (${eDiff.toFixed(2)}% ≤ 5.0%)`,
      desc: eDiffExceeded
        ? `ตามหลักวิชาการของ รศ.ดร.ชวลิต ชูกำแพง และ เผชิญ กิจระการ ประสิทธิภาพ E1 (กระบวนการ) และ E2 (ผลลัพธ์) ควรมีความสอดคล้องกันและมีผลต่างไม่เกินร้อยละ 5 (|E1 - E2| ≤ 5%) หากผลต่างสูงเกินไป แสดงว่าแบบทดสอบระหว่างเรียนหรือหลังเรียนมีความคลาดเคลื่อน หรือกระบวนการจัดกิจกรรมไม่สมดุลกับแบบทดสอบวัดผลรวม`
        : `ค่า E1 (${e1Val.toFixed(2)}%) และ E2 (${e2Val.toFixed(2)}%) มีความสมดุลกลมกลืนตามเกณฑ์มาตรฐาน`,
      recommendation: eDiffExceeded
        ? "ปรับปรุงแบบฝึกหัดระหว่างเรียนหรือแบบทดสอบหลังเรียนให้มีความยากง่ายสอดคล้องกัน หรือกดปุ่ม 'ปรับสถิติ E1/E2 ให้สมดุลอัตโนมัติ' ใน StatLab"
        : null
    });
    if (!eDiffExceeded) passedCount++;

    // Rule 13: อัตราสำรองข้อสอบสำหรับการทดลองใช้ (Try-out Item Buffer Rate ≥ 30%)
    const testBp = p.testBlueprint || {};
    const bufferPct = Number(testBp.bufferPercent || 0);
    const isBufferTooLow = bufferPct > 0 && bufferPct < 30;

    results.push({
      ruleId: 13,
      ruleName: "อัตราสำรองข้อสอบเพื่อการคัดเลือกคุณภาพจากการทดลองใช้ (Try-out Buffer Rate ≥ 30%)",
      level: isBufferTooLow ? "warning" : "pass",
      title: isBufferTooLow
        ? `ข้อควรระวัง: อัตราสำรองข้อสอบ Try-out (+${bufferPct}%) ต่ำกว่าเกณฑ์มาตรฐาน 30%`
        : "ผ่านเกณฑ์: อัตราสำรองข้อสอบเพียงพอต่อการคัดกรองข้อสอบคุณภาพ",
      desc: isBufferTooLow
        ? "ตามหลักจิตวิทยาการวัดผล (Psychometrics) การสร้างแบบทดสอบต้องสร้างข้อสอบเกินจำนวนที่ต้องการใช้อย่างน้อย 30%–50% เพื่อนำไปทดลองใช้ (Try-out) แล้วคัดเลือกเฉพาะข้อที่มีค่าความยากง่าย (p = 0.20–0.80) และอำนาจจำแนก (r ≥ 0.20) หากสำรองน้อยเกินไปจะไม่เหลือข้อสอบที่มีคุณภาพตามเกณฑ์"
        : `ผังสร้างข้อสอบมีอัตราสำรอง ${bufferPct || 30}% เหมาะสมสำหรับการคัดเลือกข้อสอบ`,
      recommendation: isBufferTooLow
        ? "เพิ่มอัตราสำรองข้อสอบในแถบ 'ผังแบบทดสอบและรูบริก' เป็นอย่างน้อย +30% ถึง +50%"
        : null
    });
    if (!isBufferTooLow) passedCount++;

    // Rule 14: ผลรวมน้ำหนักเกณฑ์รูบริกแบบวิเคราะห์ (Analytic Rubrics Total Weight = 100%)
    const rubricsList = p.analyticRubrics || [];
    let rubricWeightError = false;
    let rubricWeightDetails = [];
    rubricsList.forEach(rub => {
      const sumWeight = (rub.criteria || []).reduce((sum, c) => sum + Number(c.weight || 0), 0);
      if (Math.abs(sumWeight - 100) > 0.01) {
        rubricWeightError = true;
        rubricWeightDetails.push(`"${rub.title}" รวมได้ ${sumWeight}%`);
      }
    });

    results.push({
      ruleId: 14,
      ruleName: "ผลรวมค่าน้ำหนักของเกณฑ์การประเมินรูบริกแบบวิเคราะห์ (Analytic Rubrics Total Weight = 100%)",
      level: rubricWeightError ? "error" : "pass",
      title: rubricWeightError
        ? `พบข้อบกพร่อง: ค่าน้ำหนักเกณฑ์รูบริกรวมไม่ครบ 100% (${rubricWeightDetails.join(", ")})`
        : "ผ่านเกณฑ์: ค่าน้ำหนักเกณฑ์การประเมินรูบริกครบถ้วน 100%",
      desc: rubricWeightError
        ? "การสร้างเกณฑ์การประเมินแบบแยกส่วน (Analytic Rubrics) ค่าน้ำหนักความสำคัญของแต่ละประเด็นการประเมิน (Criteria Weights) เมื่อรวมกันแล้วต้องเท่ากับร้อยละ 100 พอดีตามหลักการวัดผลการศึกษา"
        : "เกณฑ์การประเมินรูบริกมีการกระจายน้ำหนักครบ 100% ถูกต้องตามหลักการวัดผล",
      recommendation: rubricWeightError
        ? "ปรับสัดส่วนน้ำหนักในแต่ละข้อของรูบริกให้รวมกันได้ 100% พอดี"
        : null
    });
    if (!rubricWeightError) passedCount++;

    const totalRules = results.length;
    const healthScore = Math.round((passedCount / totalRules) * 100);

    return {
      score: healthScore,
      healthScore,
      passedCount,
      totalRules,
      results
    };
  },

  // ==========================================================================
  // ฟังก์ชันหลัก: วิเคราะห์และคัดเลือก 3 ทางเลือกที่ดีที่สุดและปฏิบัติได้ง่ายที่สุด
  // ==========================================================================
  analyzeAndRecommend(criteria) {
    const subj = this.SUBJECT_GROUPS.find(s => s.id === criteria.subjectId) || this.SUBJECT_GROUPS[2];
    const grade = this.GRADE_LEVELS.find(g => g.id === criteria.gradeId) || this.GRADE_LEVELS[3];
    const pain = this.PAIN_POINTS.find(p => p.id === criteria.painId) || this.PAIN_POINTS[0];
    const goal = this.GOALS_TARGET.find(g => g.id === criteria.goalId) || this.GOALS_TARGET[1];
    const topicText = (criteria.customTopic || "").trim() || subj.defaultTopic;
    const schoolText = (criteria.schoolName || "").trim() || "โรงเรียนเป้าหมาย";

    const c1 = pain.c1BySubject[subj.id] || pain.c1BySubject.default;
    const c2 = subj.id === "admin"
      ? "สมรรถนะการจัดการเรียนรู้เชิงรุกของครูผู้สอน"
      : `ผลสัมฤทธิ์ทางการเรียนวิชา${subj.name}`;

    const recommendations = [
      // อันดับ 1: Best Balance of High Approval Rate + Easy Classroom Implementation
      {
        rank: 1,
        badge: "🏆 แนะนำอันดับ 1: นวัตกรรมเด่นตามเกณฑ์ วPA และทำได้ง่ายที่สุด (Best Choice)",
        practicalityScore: 98,
        rigorScore: 96,
        timeWeeks: goal.id === "car_fast" ? 4 : 5,
        whyBest: [
          `นวัตกรรมมีความชัดเจน เป็น 'รูปแบบการจัดการเรียนรู้เชิงรุก' หรือ 'ชุดกิจกรรม' ที่ครูสร้างและนำไปปฏิบัติได้จริงในชั้นเรียนปกติ`,
          `ใช้แบบแผน One-Group Pretest-Posttest Design กับผู้เรียนห้องเรียนเดียว (${grade.sampleSize} คน) จึงไม่กระทบตารางสอนรวม`,
          `เก็บข้อมูลครบถ้วนทั้ง ประสิทธิภาพ E1/E2 (${grade.criterion}), ดัชนีประสิทธิผล (E.I.), เปรียบเทียบผลสัมฤทธิ์ (t-test) และความพึงพอใจ ตรงตามเกณฑ์กรรมการ 100%`
        ],
        actionPlan: [
          "สัปดาห์ที่ 1: วิเคราะห์มาตรฐาน/ตัวชี้วัด ออกแบบแผนการสอน 4–5 แผน + แบบทดสอบ ให้ผู้เชี่ยวชาญ 5 ท่านตรวจค่า IOC",
          "สัปดาห์ที่ 2: ทดสอบก่อนเรียน (Pretest) และจัดกิจกรรมแผนที่ 1–2 พร้อมเก็บคะแนนใบงานระหว่างเรียน (E1)",
          "สัปดาห์ที่ 3–4: จัดกิจกรรมแผนที่ 3–5 ทดสอบหลังเรียน (Posttest เพื่อหาค่า E2, E.I. และ t-test) และเก็บแบบสอบถามความพึงพอใจ",
          "สัปดาห์ที่ 5: กรอกคะแนนลงในระบบ ROAD StatLab แล้วกดส่งออกรายงานวิจัย 5 บทเป็นไฟล์ Word (.doc) ทันที"
        ],
        projectPayload: {
          label: `[AI Best Choice] ${subj.name} (${grade.label.split(" ")[0]})`,
          track: "teacher",
          modelId: goal.preferredModel,
          academicRank: goal.rankId,
          A: "รูปแบบการจัดการเรียนรู้",
          A_type: "รูปแบบการจัดการเรียนรู้",
          B: subj.id === "math"
            ? "แนวคิด CPA ร่วมกับการวาดแถบบาร์โมเดล (Bar Model) และเกมการศึกษา"
            : subj.id === "sci"
            ? "กระบวนการคิดขั้นสูงเชิงระบบ GPAS 5 Steps ร่วมกับการสืบเสาะหาความรู้"
            : subj.id === "thai" || subj.id === "eng"
            ? "แนวคิดสมองเป็นฐาน (Brain-Based Learning: BBL) ร่วมกับเกมการศึกษา"
            : subj.id === "admin"
            ? "ชุมชนแห่งการเรียนรู้ทางวิชาชีพ (PLC) ร่วมกับการโค้ชเชิงรุก"
            : "การจัดการเรียนรู้เชิงรุก (Active Learning) ร่วมกับกระบวนการคิดขั้นสูง GPAS 5 Steps",
          B_short: subj.id === "math"
            ? "รูปแบบการสอน CPA + Bar Model"
            : subj.id === "sci"
            ? "รูปแบบการสอน GPAS 5 Steps"
            : subj.id === "thai" || subj.id === "eng"
            ? "รูปแบบการสอน BBL ร่วมกับเกมการศึกษา"
            : subj.id === "admin"
            ? "รูปแบบการบริหารวิชาการผ่าน PLC"
            : "รูปแบบการจัดการเรียนรู้ GPAS 5 Steps",
          B_steps: [
            "ขั้นที่ 1 กระตุ้นความสนใจและเชื่อมโยงสถานการณ์ปัญหา (Hook & Engagement)",
            "ขั้นที่ 2 สำรวจสืบค้นและวิเคราะห์ข้อมูลผ่านสื่อกิจกรรม (Explore & Analyze)",
            "ขั้นที่ 3 ลงมือปฏิบัติภารกิจกลุ่มและสร้างสรรค์ชิ้นงาน (Active Practice & Creating)",
            "ขั้นที่ 4 นำเสนอ อภิปราย และสะท้อนคิดการนำไปใช้ (Presentation & Reflection)"
          ],
          C_connector: "เพื่อส่งเสริม",
          C_list: [c1, c2],
          D: grade.dText,
          subject: `กลุ่มสาระการเรียนรู้${subj.name} เรื่อง ${topicText}`,
          semester: "ภาคเรียนที่ 1 ปีการศึกษา 2569",
          duration: goal.durationText,
          population: `ผู้เรียน${grade.dText.replace(/^สำหรับ|^ของ/, "")} ${schoolText} ปีการศึกษา 2569`,
          sample: `ผู้เรียน${grade.dText.replace(/^สำหรับ|^ของ/, "")}/1 ${schoolText} จำนวน ${grade.sampleSize} คน ได้มาโดยการสุ่มแบบกลุ่ม (Cluster Random Sampling)`,
          efficiencyCriterion: grade.criterion
        }
      },

      // อันดับ 2: Systematic Instructional Model (R&D 4-Step) for Higher Academic Impact
      {
        rank: 2,
        badge: "🌟 แนะนำอันดับ 2: เน้นความลุ่มลึกทางวิชาการ (เหมาะส่ง วPA คศ.3–คศ.4 / ตีพิมพ์ TCI)",
        practicalityScore: 92,
        rigorScore: 99,
        timeWeeks: 6,
        whyBest: [
          `ใช้ระเบียบวิธีวิจัยและพัฒนา 4 ระยะ (R1-D1-R2-D2) ตามแนวคิด รศ.ดร.ชวลิต ชูกำแพง ครบถ้วนตามมาตรฐานงานวิจัยระดับสูง`,
          `มีตารางเชื่อมโยงจาก R1 สู่ D1 ชี้แจงที่มาของการสังเคราะห์หลักการของรูปแบบอย่างมีหลักฐานอ้างอิงชัดเจน`,
          `ผู้เรียนสร้างชิ้นงาน/นวัตกรรมในขั้นนำไปใช้ (Applying) ทำให้มีร่องรอยหลักฐานชัดเจนสำหรับถ่ายคลิปการสอน วPA`
        ],
        actionPlan: [
          "ระยะที่ 1 (R1): วิเคราะห์หลักสูตร สำรวจปัญหา และสัมภาษณ์ผู้ทรงคุณวุฒิ/ผู้เรียน (ใช้เวลา 1 สัปดาห์)",
          "ระยะที่ 2 (D1): สังเคราะห์ยกร่างรูปแบบ 5 ขั้นตอน ให้ผู้ทรงคุณวุฒิ 5 ท่านประเมิน และทดลอง Try out คุณภาพเครื่องมือ",
          "ระยะที่ 3 (R2): นำไปทดลองใช้จริงในชั้นเรียน 5–6 สัปดาห์ เก็บคะแนน E1/E2 และทดสอบก่อน-หลังเรียน",
          "ระยะที่ 4 (D2): ประเมินความพึงพอใจ ถอดบทเรียน และจัดทำรายงานวิจัย 5 บทฉบับสมบูรณ์"
        ],
        projectPayload: {
          label: `[AI Academic Pro] รูปแบบ R&D 4 ระยะ ${subj.name}`,
          track: "teacher",
          modelId: "rd_4step",
          academicRank: "ks4",
          A: "การวิจัยและพัฒนา",
          A_type: "รูปแบบการจัดการเรียนรู้",
          B: "รูปแบบการจัดการเรียนรู้เชิงรุก (Active Learning) ร่วมกับกระบวนการคิดขั้นสูงเชิงระบบ (GPAS 5 Steps)",
          B_short: "รูปแบบการจัดการเรียนรู้เชิงรุกร่วมกับ GPAS 5 Steps",
          B_steps: [
            "ขั้นที่ 1 การรวบรวมและเลือกข้อมูล (Gathering: G)",
            "ขั้นที่ 2 การจัดกระทำและวิเคราะห์ข้อมูล (Processing: P)",
            "ขั้นที่ 3 การประยุกต์ใช้ความรู้และสร้างสรรค์นวัตกรรม (Applying 1: A1)",
            "ขั้นที่ 4 การสื่อสารและนำเสนอผลงาน (Applying 2: A2)",
            "ขั้นที่ 5 การกำกับตนเองและประเมินคุณค่า (Self-Regulating: S)"
          ],
          C_connector: "เพื่อพัฒนา",
          C_list: [c1, c2],
          D: grade.dText,
          subject: `กลุ่มสาระการเรียนรู้${subj.name} เรื่อง ${topicText}`,
          semester: "ภาคเรียนที่ 1 ปีการศึกษา 2569",
          duration: "จำนวน 6 แผนการจัดการเรียนรู้ เวลา 18 ชั่วโมง",
          population: `ผู้เรียน${grade.dText.replace(/^สำหรับ|^ของ/, "")} ${schoolText} ปีการศึกษา 2569`,
          sample: `ผู้เรียน${grade.dText.replace(/^สำหรับ|^ของ/, "")}/1 ${schoolText} จำนวน ${grade.sampleSize} คน`,
          efficiencyCriterion: grade.criterion
        }
      },

      // อันดับ 3: Fast Classroom Action Research + Gamification (ทำเร็วที่สุด 3 สัปดาห์จบ)
      {
        rank: 3,
        badge: "⚡ แนะนำอันดับ 3: ประหยัดเวลาที่สุด เน้นผู้เรียนสนุกและเห็นผลไว (Fast-Track 3–4 สัปดาห์)",
        practicalityScore: 99,
        rigorScore: 91,
        timeWeeks: 3,
        whyBest: [
          `ใช้ 'ชุดกิจกรรมการเรียนรู้แบบเกมเป็นฐาน (Game-Based) ร่วมกับสื่อดิจิทัล' ผู้เรียนตื่นตัวและให้ความร่วมมือสูงสุด`,
          `ใช้ระเบียบวิธีวิจัยปฏิบัติการในชั้นเรียน (PAOR) ที่ยืดหยุ่น ปรับแก้ระหว่างสอนได้ง่าย เหมาะกับงานวิจัยแก้ปัญหาในชั้นเรียน (CAR)`
        ],
        actionPlan: [
          "สัปดาห์ที่ 1: เตรียมชุดกิจกรรมและกติกาเกม 4 ชุด พร้อมแบบทดสอบก่อนเรียน",
          "สัปดาห์ที่ 2–3: ดำเนินกิจกรรมสัปดาห์ละ 2 ชุด เก็บคะแนนและสอบหลังเรียน",
          "สัปดาห์ที่ 4: ประมวลผลสถิติและพิมพ์รายงาน 5 บท"
        ],
        projectPayload: {
          label: `[AI Fast-Track] เกมการศึกษา ${subj.name}`,
          track: "teacher",
          modelId: "paor",
          academicRank: "ks2",
          A: "การพัฒนา",
          A_type: "ชุดกิจกรรมการเรียนรู้",
          B: "ชุดกิจกรรมการเรียนรู้แบบเกมเป็นฐาน (Game-Based Learning) ร่วมกับสื่อดิจิทัล",
          B_short: "ชุดกิจกรรมการเรียนรู้แบบเกมเป็นฐาน",
          B_steps: [
            "ขั้นที่ 1 เตรียมความพร้อมและชี้แจงภารกิจเกม (Mission Briefing)",
            "ขั้นที่ 2 ปฏิบัติภารกิจสืบค้นและฝึกทักษะ (Skill Quest)",
            "ขั้นที่ 3 แข่งขันแก้ปัญหาและสะสมแต้มความสำเร็จ (Team Challenge)",
            "ขั้นที่ 4 สรุปบทเรียนและสะท้อนผลการเรียนรู้ (Debrief & Reflection)"
          ],
          C_connector: "เพื่อยกระดับ",
          C_list: [c1, c2],
          D: grade.dText,
          subject: `กลุ่มสาระการเรียนรู้${subj.name} เรื่อง ${topicText}`,
          semester: "ภาคเรียนที่ 1 ปีการศึกษา 2569",
          duration: "จำนวน 4 แผนการจัดการเรียนรู้ เวลา 12 ชั่วโมง",
          population: `ผู้เรียน${grade.dText.replace(/^สำหรับ|^ของ/, "")} ${schoolText} ปีการศึกษา 2569`,
          sample: `ผู้เรียน${grade.dText.replace(/^สำหรับ|^ของ/, "")}/1 ${schoolText} จำนวน ${grade.sampleSize} คน`,
          efficiencyCriterion: grade.criterion
        }
      }
    ];

    return recommendations;
  },

  // สร้าง Prompt สำหรับปรึกษา AI Advisor
  buildAdvisorGeminiPrompt(criteria) {
    const subj = this.SUBJECT_GROUPS.find(s => s.id === criteria.subjectId) || this.SUBJECT_GROUPS[2];
    const grade = this.GRADE_LEVELS.find(g => g.id === criteria.gradeId) || this.GRADE_LEVELS[3];
    const pain = this.PAIN_POINTS.find(p => p.id === criteria.painId) || this.PAIN_POINTS[0];
    const goal = this.GOALS_TARGET.find(g => g.id === criteria.goalId) || this.GOALS_TARGET[1];

    return `คุณคือผู้เชี่ยวชาญด้านการวิจัยและพัฒนาทางการศึกษา (R&D) และเกณฑ์ วPA ของ ก.ค.ศ. ตามแนวคิดของ รศ.ดร.ชวลิต ชูกำแพง
บริบทการขอคำแนะนำ:
- กลุ่มสาระ: ${subj.name} (หัวข้อ: ${criteria.customTopic || subj.defaultTopic})
- ระดับชั้น/กลุ่มเป้าหมาย: ${grade.label} (${grade.dText})
- สภาพปัญหาหลัก: ${pain.label}
- เป้าหมายการทำผลงาน: ${goal.label}
- โรงเรียน: ${criteria.schoolName || "โรงเรียนเป้าหมาย"}

คำสั่ง:
1. วิเคราะห์และนำเสนอ "ชื่อเรื่องวิจัยที่สมบูรณ์ตามหลัก ABCD" จำนวน 3 ทางเลือก
2. วิเคราะห์จุดเด่นของนวัตกรรม (B) และระบุขั้นตอนการจัดกิจกรรม 4–5 ขั้นตอน
3. วิเคราะห์ตัวแปรตาม (C) ให้สอดคล้องกับเกณฑ์ วPA ด้านที่ 2
4. ให้คำแนะนำการป้องกันข้อผิดพลาดตามกฎเหล็ก 10 ประการ (10 Pitfalls)
5. สรุปปฏิทินปฏิบัติงานวิจัยที่กระชับและทำได้จริงในชั้นเรียน`;
  }
};
