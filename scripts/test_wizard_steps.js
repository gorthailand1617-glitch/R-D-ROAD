const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('======================================================');
console.log('🤖 RUNNING AUTOMATED 10-STEP RESEARCH WIZARD TEST SUITE');
console.log('======================================================');

const dataCode = fs.readFileSync('js/data.js', 'utf8');
const genCode = fs.readFileSync('js/generator.js', 'utf8');
const advCode = fs.readFileSync('js/advisor.js', 'utf8');
const appCode = fs.readFileSync('js/app.js', 'utf8');

const rootMock = { innerHTML: '' };
let domReadyHandler = null;

const sandbox = {
  window: {
    location: { search: '' },
    scrollTo: () => {},
    print: () => {},
    addEventListener: (evt, handler) => {
      if (evt === 'DOMContentLoaded') domReadyHandler = handler;
    }
  },
  document: {
    documentElement: { classList: { add: () => {}, remove: () => {} } },
    createElement: (tag) => ({
      setAttribute: () => {},
      click: () => {},
      appendChild: () => {},
      style: {}
    }),
    body: { appendChild: () => {}, removeChild: () => {} },
    getElementById: (id) => {
      if (id === 'app-root') return rootMock;
      return null;
    },
    querySelectorAll: () => []
  },
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  },
  navigator: { userAgent: 'node' },
  URLSearchParams: URLSearchParams,
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  console: console
};

sandbox.window.window = sandbox.window;
sandbox.window.document = sandbox.document;
sandbox.window.localStorage = sandbox.localStorage;

vm.createContext(sandbox);

// 1. Execute scripts in order
console.log('Loading scripts in sandbox...');
vm.runInContext(dataCode, sandbox);
vm.runInContext(genCode, sandbox);
vm.runInContext(advCode, sandbox);
vm.runInContext(appCode, sandbox);

// Trigger DOMContentLoaded
if (domReadyHandler) {
  domReadyHandler();
}

const ROAD_APP = sandbox.window.ROAD_APP;
const ROAD_DATA = sandbox.window.ROAD_DATA;
const ROAD_ADVISOR = sandbox.window.ROAD_ADVISOR;

assert(ROAD_APP, 'window.ROAD_APP must exist');
assert(ROAD_DATA, 'window.ROAD_DATA must exist');
console.log('✓ All scripts loaded successfully into VM sandbox.');

// 2. Open Research Wizard
console.log('\n--- TEST 1: Open Research Wizard at Step 1 ---');
ROAD_APP.openWizardModal(1);
assert.strictEqual(rootMock.innerHTML.includes('Research Wizard · ตัวช่วยจัดทำโครงร่าง 10 ขั้นตอน'), true, 'Modal should be rendered');
assert.strictEqual(rootMock.innerHTML.includes('ขั้นตอนที่ 1 จาก 10'), true, 'Should be on Step 1');
console.log('✓ Step 1 renders correctly with full title and keywords.');

// 3. Step through all 10 steps
console.log('\n--- TEST 2: Stepping Through Steps 1 -> 10 and Testing 1-Click Samples ---');
for (let step = 1; step <= 10; step++) {
  ROAD_APP.setWizardStep(step);
  assert(rootMock.innerHTML.includes(`ขั้นตอนที่ ${step} จาก 10`), `Modal must render Step ${step}`);
  
  // Test applyWizardSample on every step
  ROAD_APP.applyWizardSample(step);
  assert(rootMock.innerHTML.includes(`ขั้นตอนที่ ${step} จาก 10`), `Step ${step} must re-render cleanly after sample`);

  // Test saveWizardStep on every step
  ROAD_APP.saveWizardStep();
  console.log(`✓ Step ${step}/10 verified: navigation, 1-click sample, and saving functional with 0 errors.`);
}

// 4. In-depth inspection of Step 5 (Population & Sampling)
console.log('\n--- TEST 3: Deep Interactive Testing of Step 5 (Population & Sampling) ---');
ROAD_APP.setWizardStep(5);
assert(rootMock.innerHTML.includes('วิธีการได้มาซึ่งกลุ่มตัวอย่าง (Sampling Method)'), 'Step 5 must render Sampling Method selector');
assert(rootMock.innerHTML.includes('การสุ่มแบบกลุ่ม (Cluster Random)'), 'Step 5 must offer Cluster Random Sampling');
assert(rootMock.innerHTML.includes('การสุ่มอย่างง่าย (Simple Random)'), 'Step 5 must offer Simple Random Sampling');
assert(rootMock.innerHTML.includes('การเลือกแบบเจาะจง (Purposive)'), 'Step 5 must offer Purposive Sampling');
assert(rootMock.innerHTML.includes('ใช้ประชากรทั้งหมด (Census)'), 'Step 5 must offer Population / Census');

// Test A: Switching to purposive sampling triggers warning alert
console.log('Testing Purposive Sampling guardrail...');
ROAD_APP.updateWizardSamplingMethod('purposive');
assert(rootMock.innerHTML.includes('คำเตือนเชิงระเบียบวิธีวิจัย'), 'Purposive sampling must display guardrail warning');
assert(rootMock.innerHTML.includes('สถิติบรรยาย (x̄, S.D., ร้อยละ) ร่วมกับดัชนีประสิทธิผล (E.I.)'), 'Purposive warning must specify stats restriction');

let activeProj = ROAD_APP.getActiveProject();
assert.strictEqual(activeProj.samplingMetadata.type, 'purposive', 'Project sampling metadata type must be purposive');
assert.strictEqual(activeProj.samplingMethod, 'purposive', 'Project samplingMethod must be purposive');
assert(activeProj.sample.includes('เจาะจง') || activeProj.sample.includes('Purposive'), 'Sample narrative must reflect purposive method');

// Test Advisor Rule 11 with purposive sampling
const advPurposive = ROAD_ADVISOR.validate10Pitfalls(activeProj);
const rule11Purposive = advPurposive.results.find(r => r.ruleId === 11);
assert(rule11Purposive && rule11Purposive.level === 'error', 'Advisor Rule 11 must flag purposive sampling error when using t-test');
console.log('✓ Purposive sampling guardrail warning and Advisor Rule 11 flag verified.');

// Test B: 1-Click switch back to Cluster Random Sampling
console.log('Testing 1-Click switch back to Cluster Random Sampling...');
ROAD_APP.updateWizardSamplingMethod('cluster_random');
assert(rootMock.innerHTML.includes('ถูกต้องตามหลักวิธีวิทยา'), 'Cluster random must show green valid indicator');
activeProj = ROAD_APP.getActiveProject();
assert.strictEqual(activeProj.samplingMetadata.type, 'cluster_random');
assert.strictEqual(activeProj.samplingMethod, 'cluster_random');

const advCluster = ROAD_ADVISOR.validate10Pitfalls(activeProj);
const rule11Cluster = advCluster.results.find(r => r.ruleId === 11);
assert(rule11Cluster && rule11Cluster.level === 'pass', 'Advisor Rule 11 must pass for Cluster Random Sampling');
console.log('✓ Cluster Random sampling switch and Advisor Rule 11 pass verified.');

// Test C: Numeric inputs & automatic narrative generation
console.log('Testing numeric input matrix and auto narrative update...');
ROAD_APP.updateWizardSamplingNumber('populationSize', 160);
ROAD_APP.updateWizardSamplingNumber('classroomsCount', 5);
ROAD_APP.updateWizardSamplingNumber('sampleSize', 36);
ROAD_APP.updateWizardSamplingNumber('selectedClassrooms', 1);

activeProj = ROAD_APP.getActiveProject();
assert.strictEqual(activeProj.samplingMetadata.populationSize, 160);
assert.strictEqual(activeProj.samplingMetadata.classroomsCount, 5);
assert.strictEqual(activeProj.samplingMetadata.sampleSize, 36);
assert.strictEqual(activeProj.samplingMetadata.selectedClassrooms, 1);
assert(activeProj.population.includes('160 คน'), 'Population narrative must include updated 160 count');
assert(activeProj.sample.includes('36 คน'), 'Sample narrative must include updated 36 count');
assert(activeProj.population.includes('โรงเรียนเปรมติณสูลานนท์'), 'School name must be โรงเรียนเปรมติณสูลานนท์');
assert(activeProj.population.includes('องค์การบริหารส่วนจังหวัดขอนแก่น'), 'Affiliation must be องค์การบริหารส่วนจังหวัดขอนแก่น');
console.log('✓ Numeric updates and narrative synchronization verified.');

// Test D: Manual textarea editing
console.log('Testing manual text editing on Step 5...');
const customPopText = 'ประชากรที่ใช้ในการวิจัยครั้งนี้คือนักเรียนชั้น ม.4 ทั้งหมด 160 คน โรงเรียนเปรมติณสูลานนท์';
ROAD_APP.updateWizardField('step5_population', customPopText);
activeProj = ROAD_APP.getActiveProject();
assert.strictEqual(activeProj.population, customPopText, 'Project population must update on manual input');
console.log('✓ Manual text editing synchronization verified.');

// Test E: "✨ เติมข้อมูลตัวอย่างมาตรฐาน (ขั้นที่ 5)" button
console.log('Testing 1-Click Standard Sample Button on Step 5...');
ROAD_APP.applyWizardSample(5);
activeProj = ROAD_APP.getActiveProject();
assert.strictEqual(activeProj.samplingMetadata.type, 'cluster_random');
assert.strictEqual(activeProj.samplingMetadata.sampleSize, 35);
assert.strictEqual(activeProj.samplingMetadata.populationSize, 120);
assert(activeProj.population.includes('โรงเรียนเปรมติณสูลานนท์'), 'Sample button must populate standard text for โรงเรียนเปรมติณสูลานนท์');
console.log('✓ 1-Click Standard Sample button on Step 5 verified.');

// 5. Complete Wizard on Step 10
console.log('\n--- TEST 4: Completing Wizard on Step 10 ---');
ROAD_APP.setWizardStep(10);
assert(rootMock.innerHTML.includes('Executive Blueprint Summary Grid') || rootMock.innerHTML.includes('พร้อมสร้างโครงร่างวิจัยและรายงาน 5 บทฉบับสมบูรณ์แล้ว!'));
ROAD_APP.completeWizardAndCreate();

activeProj = ROAD_APP.getActiveProject();
assert.strictEqual(activeProj.status, 'outlined', 'Project status must be outlined');
assert.strictEqual(activeProj.progress, 95, 'Project progress must be 95');
console.log('✓ Wizard completion, data sync, and transition to chapters verified.');

console.log('\n======================================================');
console.log('🎉 ALL 10 WIZARD STEPS & STEP 5 HOTFIX TESTS PASSED 100%!');
console.log('======================================================');
