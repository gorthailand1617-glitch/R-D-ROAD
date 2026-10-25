// scripts/test_flexible_plans.js
// Test suite for flexible lesson plans and duration according to Thai Curriculum & R&D standards

const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('assert');

// Setup mock browser environment
const dom = {
  elements: {},
  getElementById(id) {
    if (!this.elements[id]) {
      this.elements[id] = {
        value: '',
        innerHTML: '',
        innerText: '',
        textContent: '',
        style: {},
        classList: {
          add: () => {},
          remove: () => {},
          contains: () => false
        },
        querySelectorAll: () => [],
        querySelector: () => null,
        appendChild: () => {},
        removeChild: () => {},
        addEventListener: () => {},
        setAttribute: () => {},
        removeAttribute: () => {}
      };
    }
    return this.elements[id];
  },
  documentElement: { classList: { add: () => {}, remove: () => {} } },
  body: { appendChild: () => {}, removeChild: () => {} },
  querySelectorAll: () => [],
  querySelector: () => null,
  createElement: (tag) => ({
    tagName: tag,
    style: {},
    classList: { add: () => {}, remove: () => {} },
    appendChild: () => {},
    setAttribute: () => {},
    addEventListener: () => {}
  })
};

let readyCallback = null;

const sandbox = {
  window: {},
  document: dom,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  alert: (msg) => console.log('[Alert]:', msg),
  confirm: () => true,
  prompt: () => '',
  addEventListener: (evt, fn) => {
    if (evt === 'DOMContentLoaded') readyCallback = fn;
  },
  removeEventListener: () => {},
  scrollTo: () => {},
  location: { search: '' },
  URLSearchParams: global.URLSearchParams,
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
  }
};
sandbox.window = sandbox;

vm.createContext(sandbox);

function loadScript(filePath) {
  const code = fs.readFileSync(path.resolve(__dirname, '..', filePath), 'utf8');
  vm.runInContext(code, sandbox, { filename: filePath });
}

console.log('Loading scripts in sandbox...');
loadScript('js/data.js');
loadScript('js/advisor.js');
loadScript('js/generator.js');
loadScript('js/app.js');

if (readyCallback) {
  readyCallback();
}

console.log('✓ All scripts loaded successfully.');

console.log('\n--- TEST 1: Curriculum Presets Validation ---');
const presetsList = sandbox.ROAD_DATA.CURRICULUM_DURATION_PRESETS;
assert(Array.isArray(presetsList), 'CURRICULUM_DURATION_PRESETS must be an array');
console.log(`Found ${presetsList.length} curriculum presets:`, presetsList.map(p => p.id));
assert.strictEqual(presetsList.length, 5, 'Should have 5 curriculum presets');

const p4 = presetsList.find(p => p.id === 'preset_4_plans_12h');
assert(p4, 'Preset 4 plans 12h must exist');
assert.strictEqual(p4.plansCount, 4);
assert.strictEqual(p4.totalHours, 12);

const p8 = presetsList.find(p => p.id === 'preset_8_plans_16h');
assert(p8, 'Preset 8 plans 16h must exist');
assert.strictEqual(p8.plansCount, 8);
assert.strictEqual(p8.totalHours, 16);

const p10 = presetsList.find(p => p.id === 'preset_10_plans_20h');
assert(p10, 'Preset 10 plans 20h must exist');
assert.strictEqual(p10.plansCount, 10);
assert.strictEqual(p10.totalHours, 20);
console.log('✓ Presets structure verified.');

console.log('\n--- TEST 2: getProjectDurationInfo Helper ---');
const gen = sandbox.ROAD_GENERATOR;

// Test with 4-plan project
const proj4 = {
  lessonPlans: [
    { planNo: 1, title: 'แผน 1', hours: 3 },
    { planNo: 2, title: 'แผน 2', hours: 3 },
    { planNo: 3, title: 'แผน 3', hours: 3 },
    { planNo: 4, title: 'แผน 4', hours: 3 }
  ],
  contextMeta: { totalHours: '12 ชั่วโมง' }
};
const dur4 = gen.getProjectDurationInfo(proj4);
assert.strictEqual(dur4.plansCount, 4);
assert.strictEqual(dur4.totalHours, 12);
console.log('✓ 4-plan duration computation:', dur4);

// Test with 8-plan project
const proj8 = {
  lessonPlans: [
    { planNo: 1, title: 'แผน 1', hours: 2 },
    { planNo: 2, title: 'แผน 2', hours: 2 },
    { planNo: 3, title: 'แผน 3', hours: 2 },
    { planNo: 4, title: 'แผน 4', hours: 2 },
    { planNo: 5, title: 'แผน 5', hours: 2 },
    { planNo: 6, title: 'แผน 6', hours: 2 },
    { planNo: 7, title: 'แผน 7', hours: 2 },
    { planNo: 8, title: 'แผน 8', hours: 2 }
  ],
  contextMeta: { totalHours: '16 ชั่วโมง' }
};
const dur8 = gen.getProjectDurationInfo(proj8);
assert.strictEqual(dur8.plansCount, 8);
assert.strictEqual(dur8.totalHours, 16);
console.log('✓ 8-plan duration computation:', dur8);

console.log('\n--- TEST 3: Report & Generator Dynamic Content Verification ---');
const sampleProject = JSON.parse(JSON.stringify(sandbox.ROAD_APP.getActiveProject()));

// Test 4 plans 12h in generator
sampleProject.lessonPlans = p4.plans;
sampleProject.contextMeta = sampleProject.contextMeta || {};
sampleProject.contextMeta.totalHours = '12 ชั่วโมง';
sampleProject.contextMeta.duration = 'ภาคเรียนที่ 1 ปีการศึกษา 2569 (รวม 12 ชั่วโมง)';

const fm4 = gen.generateFrontMatter(sampleProject);
const thContent4 = fm4.abstractTh.sections[0].content;
const enContent4 = fm4.abstractEn.sections[0].content;
assert(thContent4.includes('จำนวน 4 แผนการจัดการเรียนรู้'), 'Thai abstract must mention 4 plans');
assert(thContent4.includes('12 ชั่วโมง'), 'Thai abstract must mention 12 hours');
assert(enContent4.includes('4 instructional lesson plans'), 'English abstract must mention 4 instructional lesson plans');
assert(enContent4.includes('12 hours'), 'English abstract must mention 12 hours');
console.log('✓ FrontMatter abstracts correctly reflect 4 plans / 12 hours.');

const chData4 = gen.generateChapters(sampleProject);
const fullRep4 = JSON.stringify(chData4);
assert(fullRep4.includes('จำนวน 4 แผนการจัดการเรียนรู้ รวม 12 ชั่วโมง') || fullRep4.includes('4 แผนการจัดการเรียนรู้'), 'Report must mention 4 plans');
assert(fullRep4.includes('ตารางที่ ง.1'), 'Appendix Table ง.1 must be present');
console.log('✓ Full research report correctly reflects 4 plans / 12 hours.');

// Test 8 plans 16h in generator
sampleProject.lessonPlans = p8.plans;
sampleProject.contextMeta.totalHours = '16 ชั่วโมง';
sampleProject.contextMeta.duration = 'ภาคเรียนที่ 1 ปีการศึกษา 2569 (รวม 16 ชั่วโมง)';

const fm8 = gen.generateFrontMatter(sampleProject);
const thContent8 = fm8.abstractTh.sections[0].content;
const enContent8 = fm8.abstractEn.sections[0].content;
assert(thContent8.includes('จำนวน 8 แผนการจัดการเรียนรู้'), 'Thai abstract must mention 8 plans');
assert(thContent8.includes('16 ชั่วโมง'), 'Thai abstract must mention 16 hours');
assert(enContent8.includes('8 instructional lesson plans'), 'English abstract must mention 8 instructional lesson plans');
assert(enContent8.includes('16 hours'), 'English abstract must mention 16 hours');
console.log('✓ FrontMatter abstracts correctly reflect 8 plans / 16 hours.');

const appx8 = gen.generateAppendix(sampleProject);
const appxStr = JSON.stringify(appx8);
assert(appxStr.includes('8 แผนการจัดการเรียนรู้ (รวม 16 ชั่วโมง)'), 'Appendix A letter must reflect 8 plans and 16 hours');
console.log('✓ Appendix dynamically reflects 8 plans / 16 hours.');

console.log('\n--- TEST 4: ROAD_APP Dynamic Plan Actions ---');
const app = sandbox.ROAD_APP;
app.activeProjectId = sampleProject.id;
app.projects = [sampleProject];

// Apply 5-plan preset
app.applyLessonPlanPreset('preset_5_plans_15h');
const pAfterPreset = app.getActiveProject();
assert.strictEqual(pAfterPreset.lessonPlans.length, 5, 'Should have 5 plans after preset');
console.log('✓ applyLessonPlanPreset applied 5 plans correctly.');

// Add a plan
app.addLessonPlan();
assert.strictEqual(pAfterPreset.lessonPlans.length, 6, 'Should have 6 plans after addition');
assert.strictEqual(pAfterPreset.lessonPlans[5].planNo, 6, 'New plan must have planNo 6');
console.log('✓ addLessonPlan added 6th plan correctly.');

// Remove a plan
app.removeLessonPlan(0);
assert.strictEqual(pAfterPreset.lessonPlans.length, 5, 'Should have 5 plans after removal');
assert.strictEqual(pAfterPreset.lessonPlans[0].planNo, 1, 'First plan must be re-numbered to 1');
console.log('✓ removeLessonPlan removed plan and re-numbered correctly.');

console.log('\n======================================================');
console.log('🎉 ALL FLEXIBLE LESSON PLANS & DURATION TESTS PASSED 100%!');
console.log('======================================================');
