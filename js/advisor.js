// ============================================================================
// ROAD NEXT-GEN: AI Research Advisor & Best-Practice Decision Engine
// ศึกษา ค้นคว้า วิเคราะห์ และคัดเลือกตัวเลือกวิจัยที่ดีที่สุดและปฏิบัติได้ง่ายที่สุดให้ผู้ใช้งานอัตโนมัติ
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

  // ฟังก์ชันหลัก: วิเคราะห์และคัดเลือก 3 ทางเลือกที่ดีที่สุดและปฏิบัติได้ง่ายที่สุด
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

    // สร้าง 3 ตัวเลือกที่ผ่านการคัดกรองความง่ายในการปฏิบัติจริง (Practicality-First)
    const recommendations = [
      // อันดับ 1: Best Balance of High Approval Rate + Easy Classroom Implementation
      {
        rank: 1,
        badge: "🏆 แนะนำอันดับ 1: ดีที่สุดและทำได้ง่ายที่สุด (Best Choice)",
        practicalityScore: 98,
        rigorScore: 96,
        timeWeeks: goal.id === "car_fast" ? 4 : 5,
        whyBest: [
          `ใช้นวัตกรรมที่เป็น "ชุดกิจกรรมการเรียนรู้เชิงรุก + สื่อ/ใบงาน 4–5 ขั้นตอน" ซึ่งครูสร้างเองได้ง่ายที่สุดใน Word/Canva ไม่ต้องเขียนโปรแกรมซับซ้อน`,
          `ใช้กลุ่มตัวอย่างห้องเรียนเดียวที่ครูสอนประจำ (${grade.sampleSize} คน) ด้วยแบบแผน One-Group Pretest-Posttest Design จึงไม่ต้องวิ่งหาห้องเปรียบเทียบและไม่กระทบตารางสอน`,
          `เก็บข้อมูลครบทั้ง ประสิทธิภาพ E1/E2 (${grade.criterion}), ดัชนีประสิทธิผล (E.I.), เปรียบเทียบก่อน-หลังเรียน (t-test) และความพึงพอใจ ซึ่งตรงตามเกณฑ์กรรมการประเมิน 100%`
        ],
        actionPlan: [
          "สัปดาห์ที่ 1: วิเคราะห์ตัวชี้วัด สร้างแผนการสอน 4–5 แผน + แบบทดสอบ 20–30 ข้อ ให้ผู้เชี่ยวชาญ 3–5 ท่านตรวจค่า IOC",
          "สัปดาห์ที่ 2: สอบก่อนเรียน (Pretest: O1) และเริ่มจัดกิจกรรมแผนที่ 1–2 พร้อมเก็บคะแนนใบงานระหว่างเรียน (E1)",
          "สัปดาห์ที่ 3–4: จัดกิจกรรมแผนที่ 3–5 จนครบ สอบหลังเรียน (Posttest: O2 เพื่อหาค่า E2, E.I. และ t-test) และแจกแบบสอบถามความพึงพอใจ",
          "สัปดาห์ที่ 5: กรอกคะแนนในแท็บ R&D Stat Lab ของแอพนี้ แล้วกดส่งออกรายงานวิจัย 5 บทเป็นไฟล์ Word (.doc) ทันที!"
        ],
        projectPayload: {
          label: `[AI Best Choice] ${subj.name} (${grade.label.split(" ")[0]})`,
          modelId: goal.preferredModel,
          academicRank: goal.rankId,
          A: goal.id === "wpa_ks4_rd" ? "การวิจัยและพัฒนา" : "การพัฒนา",
          B: subj.id === "math" || subj.id === "sci"
            ? "ชุดกิจกรรมการเรียนรู้เชิงรุก (Active Learning) โดยใช้ปัญหาเป็นฐาน (PBL) ร่วมกับสื่ออินโฟกราฟิก"
            : subj.id === "thai" || subj.id === "eng"
            ? "ชุดฝึกทักษะการเรียนรู้เชิงรุกตามแนวคิดสมองเป็นฐาน (BBL) ร่วมกับเกมการศึกษา"
            : subj.id === "admin"
            ? "รูปแบบการนิเทศภายในโดยใช้ชุมชนแห่งการเรียนรู้ทางวิชาชีพ (PLC) ร่วมกับการโค้ช (Coaching)"
            : "ชุดกิจกรรมการเรียนรู้เชิงรุก (Active Learning) ร่วมกับกระบวนการคิดขั้นสูงเชิงระบบ (GPAS 5 Steps)",
          B_short: subj.id === "math" || subj.id === "sci"
            ? "ชุดกิจกรรมการเรียนรู้แบบ PBL ร่วมกับสื่ออินโฟกราฟิก"
            : subj.id === "thai" || subj.id === "eng"
            ? "ชุดฝึกทักษะตามแนวคิด BBL ร่วมกับเกมการศึกษา"
            : subj.id === "admin"
            ? "รูปแบบการนิเทศภายในโดยใช้ PLC ร่วมกับการโค้ช"
            : "ชุดกิจกรรมการเรียนรู้เชิงรุกร่วมกับ GPAS 5 Steps",
          B_steps: [
            "ขั้นที่ 1 กระตุ้นความสนใจและเชื่อมโยงสถานการณ์ปัญหา (Hook & Problem Engagement)",
            "ขั้นที่ 2 สำรวจสืบค้นและวิเคราะห์ข้อมูลผ่านสื่อใบงาน (Explore & Analyze)",
            "ขั้นที่ 3 ลงมือปฏิบัติภารกิจกลุ่มและแลกเปลี่ยนเรียนรู้ (Active Collaborative Practice)",
            "ขั้นที่ 4 สรุปองค์ความรู้และสะท้อนคิดการนำไปใช้ (Summarize & Reflect)"
          ],
          C_connector: "เพื่อส่งเสริม",
          C_list: [c1, c2],
          D: grade.dText,
          subject: `กลุ่มสาระการเรียนรู้${subj.name} เรื่อง ${topicText}`,
          semester: "ภาคเรียนที่ 1 ปีการศึกษา 2569",
          duration: goal.durationText,
          population: `ผู้เรียน${grade.dText.replace(/^สำหรับ|^ของ/, "")} ${schoolText} ปีการศึกษา 2569`,
          sample: `ผู้เรียน${grade.dText.replace(/^สำหรับ|^ของ/, "")}/1 ${schoolText} จำนวน ${grade.sampleSize} คน ได้มาโดยการเลือกแบบเจาะจง (Purposive Sampling) / การสุ่มแบบกลุ่ม`,
          efficiencyCriterion: grade.criterion
        }
      },

      // อันดับ 2: Systematic Instructional Model (GPAS 5 Steps / R&D 4-Step) for Higher Academic Impact
      {
        rank: 2,
        badge: "🌟 แนะนำอันดับ 2: เน้นความลุ่มลึกทางวิชาการ (เหมาะส่ง วPA คศ.3–คศ.4 / ประกวดนวัตกรรม)",
        practicalityScore: 92,
        rigorScore: 99,
        timeWeeks: 6,
        whyBest: [
          `ยกระดับจากชุดกิจกรรมเป็น "รูปแบบการจัดการเรียนรู้ (Instructional Model)" ที่มีขั้นตอน GPAS 5 Steps ชัดเจน มีน้ำหนักทางวิชาการสูงมาก`,
          `ใช้กระบวนการวิจัยและพัฒนา 4 ระยะ (R1-D1-R2-D2) ตามแนวคิด รศ.ดร.ชวลิต ชูกำแพง ทำให้บทที่ 3 และบทที่ 4 มีความสมบูรณ์ระดับงานวิจัยชั้นนำ`,
          `ผู้เรียนได้สร้างชิ้นงาน/นวัตกรรมในขั้น Applying ทำให้มีร่องรอยหลักฐาน (Evidence) สำหรับถ่ายภาพและทำคลิปส่งประเมิน วPA ได้ชัดเจน`
        ],
        actionPlan: [
          "ระยะที่ 1 (R1): สำรวจปัญหาจากคะแนนปีที่ผ่านมาและสัมภาษณ์ผู้เรียน 5–10 คน (ใช้เวลา 3 วัน)",
          "ระยะที่ 2 (D1): ออกแบบรูปแบบการจัดการเรียนรู้ 5 ขั้นตอน ให้ผู้เชี่ยวชาญ 5 ท่านประเมินค่า IOC",
          "ระยะที่ 3 (R2): นำไปทดลองใช้จริงในชั้นเรียน 5–6 สัปดาห์ เก็บคะแนน E1/E2 และวัดทักษะก่อน–หลังเรียน",
          "ระยะที่ 4 (D2): ประเมินความพึงพอใจและสรุปรายงาน 5 บท"
        ],
        projectPayload: {
          label: `[AI Academic Pro] รูปแบบการสอน ${subj.name}`,
          modelId: "rd_4step",
          academicRank: "ks3",
          A: "การวิจัยและพัฒนา",
          B: "รูปแบบการจัดการเรียนรู้เชิงรุก (Active Learning) ร่วมกับกระบวนการคิดขั้นสูงเชิงระบบ (GPAS 5 Steps)",
          B_short: "รูปแบบการจัดการเรียนรู้เชิงรุกร่วมกับ GPAS 5 Steps",
          B_steps: [
            "ขั้นที่ 1 การรวบรวมและเลือกข้อมูล (Gathering)",
            "ขั้นที่ 2 การจัดกระทำและวิเคราะห์ข้อมูล (Processing)",
            "ขั้นที่ 3 การประยุกต์ใช้ความรู้และลงมือปฏิบัติ (Applying 1)",
            "ขั้นที่ 4 การสื่อสารและนำเสนอผลงาน (Applying 2)",
            "ขั้นที่ 5 การกำกับตนเองและประเมินคุณค่า (Self-Regulating)"
          ],
          C_connector: "เพื่อพัฒนา",
          C_list: [c1, c2],
          D: grade.dText,
          subject: `กลุ่มสาระการเรียนรู้${subj.name} เรื่อง ${topicText}`,
          semester: "ภาคเรียนที่ 1 ปีการศึกษา 2569",
          duration: "จำนวน 6 แผนการจัดการเรียนรู้ เวลา 18 ชั่วโมง",
          population: `ผู้เรียน${grade.dText.replace(/^สำหรับ|^ของ/, "")} ${schoolText} ปีการศึกษา 2569`,
          sample: `ผู้เรียน${grade.dText.replace(/^สำหรับ|^ของ/, "")}/1 ${schoolText} จำนวน ${grade.sampleSize} คน ได้มาโดยการสุ่มแบบกลุ่ม (Cluster Random Sampling)`,
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
          `ใช้ "บอร์ดเกม/เกมการศึกษา + แบบฝึกทักษะระยะสั้น 4 ชุด" ที่นำไปใช้ในคาบเรียนปกติได้ทันทีโดยผู้เรียนให้ความร่วมมือสูงสุด`,
          `ใช้ระเบียบวิธีวิจัยเชิงปฏิบัติการในชั้นเรียน (PAOR) ที่ยืดหยุ่น ปรับแก้ระหว่างสอนได้ง่าย เหมาะกับครูที่มีเวลาจำกัดแต่ต้องการผลงานวิจัย 5 บทที่ครบถ้วน`
        ],
        actionPlan: [
          "สัปดาห์ที่ 1: สร้างแบบฝึกทักษะระยะสั้น 4 ชุด + กิจกรรมเกมถามตอบ ทดสอบก่อนเรียน",
          "สัปดาห์ที่ 2–3: จัดกิจกรรมสัปดาห์ละ 2 ชุด เก็บคะแนนระหว่างเรียนและสอบหลังเรียน",
          "สัปดาห์ที่ 4: วิเคราะห์สถิติและพิมพ์รายงานวิจัย 5 บท"
        ],
        projectPayload: {
          label: `[AI Fast-Track] เกมการศึกษา ${subj.name}`,
          modelId: "paor",
          academicRank: "ks2",
          A: "การพัฒนา",
          B: "แบบฝึกทักษะการเรียนรู้เชิงรุกร่วมกับเทคนิคเกมมิฟิเคชัน (Gamification) และสื่อดิจิทัล",
          B_short: "แบบฝึกทักษะร่วมกับเทคนิคเกมมิฟิเคชัน",
          B_steps: [
            "ขั้นที่ 1 เตรียมความพร้อมและชี้แจงภารกิจเกม (Mission Briefing)",
            "ขั้นที่ 2 เรียนรู้เนื้อหาและฝึกทักษะผ่านด่านภารกิจ (Skill Quest)",
            "ขั้นที่ 3 แข่งขันแก้ปัญหาและสะสมแต้มความสำเร็จ (Team Challenge & Leaderboard)",
            "ขั้นที่ 4 สรุปบทเรียนและมอบรางวัลสะท้อนผล (Debrief & Reward)"
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

  // สร้าง Prompt สำหรับสั่ง Gemini AI วิเคราะห์เจาะลึกและคัดเลือกชุดวิจัยที่ปฏิบัติได้จริงที่สุด
  buildAdvisorGeminiPrompt(criteria) {
    const subj = this.SUBJECT_GROUPS.find(s => s.id === criteria.subjectId) || this.SUBJECT_GROUPS[2];
    const grade = this.GRADE_LEVELS.find(g => g.id === criteria.gradeId) || this.GRADE_LEVELS[3];
    const pain = this.PAIN_POINTS.find(p => p.id === criteria.painId) || this.PAIN_POINTS[0];
    const goal = this.GOALS_TARGET.find(g => g.id === criteria.goalId) || this.GOALS_TARGET[1];
    const topicText = (criteria.customTopic || "").trim() || subj.defaultTopic;
    const schoolText = (criteria.schoolName || "").trim() || "สถานศึกษา";

    return `คุณคือที่ปรึกษาวิจัยอาวุโสและผู้เชี่ยวชาญการวิจัยและพัฒนา (R&D) ตามแนวคิดของ รศ.ดร.ชวลิต ชูกำแพง
โปรดศึกษา วิเคราะห์ และเลือก "แนวทางการทำวิจัยที่ดีที่สุดและปฏิบัติได้ง่ายที่สุดในห้องเรียนจริง" สำหรับข้อมูลของผู้ใช้ต่อไปนี้:
- กลุ่มสาระ/สาขาวิชา: ${subj.name}
- หัวข้อเนื้อหา/หน่วยการเรียนรู้ที่จะสอน: ${topicText}
- ระดับชั้นกลุ่มเป้าหมาย: ${grade.label} (${schoolText})
- สภาพปัญหาสำคัญที่พบในห้องเรียน: ${pain.label}
- เป้าหมายการนำผลงานไปใช้: ${goal.label}

โปรดตอบกลับเป็น JSON เท่านั้น (ห้ามมีข้อความอื่นนอก JSON) ตามโครงสร้างนี้ เพื่อที่ระบบจะนำไปตั้งค่าให้ผู้ใช้ทันที:
{
  "A": "คำกริยาการวิจัยที่เหมาะสมที่สุด เช่น การพัฒนา หรือ การวิจัยและพัฒนา",
  "B": "ชื่อนวัตกรรมที่ทำได้จริง ไม่ซับซ้อนเกินไป และแก้ปัญหาได้ตรงจุดที่สุด",
  "B_short": "ชื่อย่อนวัตกรรม",
  "B_steps": ["ขั้นที่ 1 ...", "ขั้นที่ 2 ...", "ขั้นที่ 3 ...", "ขั้นที่ 4 ..."],
  "C_connector": "เพื่อส่งเสริม",
  "C_list": ["ตัวแปรตามที่ 1 ที่แก้ปัญหาโดยตรง", "ผลสัมฤทธิ์ทางการเรียน..."],
  "D": "${grade.dText}",
  "subject": "รายวิชา${subj.name} เรื่อง ${topicText}",
  "duration": "${goal.durationText}",
  "efficiencyCriterion": "${grade.criterion}",
  "whyBestSummary": "อธิบายสั้นๆ 3 ข้อว่าทำไมตัวเลือกนี้จึงดีที่สุดและทำจริงได้ง่ายที่สุดสำหรับครู"
}`;
  }
};
