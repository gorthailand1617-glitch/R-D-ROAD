const fs = require('fs');
const vm = require('vm');

const appContent = fs.readFileSync('js/app.js', 'utf8');
const indexContent = fs.readFileSync('index.html', 'utf8');
const genContent = fs.readFileSync('js/generator.js', 'utf8');
const dataContent = fs.readFileSync('js/data.js', 'utf8');

// 1. Extract all method calls from app.js and index.html
const appCalls = new Set();
const genCalls = new Set();

const appCallRegex = /ROAD_APP\.([a-zA-Z0-9_$]+)\s*\(/g;
let m;
while ((m = appCallRegex.exec(appContent)) !== null) {
  appCalls.add(m[1]);
}
while ((m = appCallRegex.exec(indexContent)) !== null) {
  appCalls.add(m[1]);
}

const genCallRegex = /ROAD_GENERATOR\.([a-zA-Z0-9_$]+)\s*\(/g;
while ((m = genCallRegex.exec(appContent)) !== null) {
  genCalls.add(m[1]);
}
while ((m = genCallRegex.exec(genContent)) !== null) {
  genCalls.add(m[1]);
}
while ((m = genCallRegex.exec(indexContent)) !== null) {
  genCalls.add(m[1]);
}

console.log('=== ROAD METHODS STATIC CODE SCAN ===');
console.log(`Found ${appCalls.size} unique ROAD_APP method calls.`);
console.log(`Found ${genCalls.size} unique ROAD_GENERATOR method calls.`);

// 2. Load context in VM
let readyCallback = null;
const rootMock = { innerHTML: '' };

const context = {
  window: {
    location: { search: '' },
    scrollTo: () => {},
    print: () => {}
  },
  document: {
    documentElement: { classList: { add: () => {}, remove: () => {} } },
    createElement: () => ({ setAttribute: () => {}, click: () => {} }),
    body: { appendChild: () => {}, removeChild: () => {} },
    getElementById: (id) => {
      if (id === 'app-root') return rootMock;
      return null;
    },
    querySelectorAll: () => []
  },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  navigator: { userAgent: 'node' },
  setTimeout: (fn) => fn(),
  clearTimeout: () => {},
  setInterval: () => {},
  clearInterval: () => {},
  URL: { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} },
  URLSearchParams: global.URLSearchParams,
  Blob: function() {},
  addEventListener: (evt, fn) => {
    if (evt === 'DOMContentLoaded') readyCallback = fn;
  },
  removeEventListener: () => {}
};
context.window.window = context.window;
context.window.document = context.document;
context.window.localStorage = context.localStorage;
context.window.addEventListener = context.addEventListener;
context.window.URLSearchParams = global.URLSearchParams;
context.window.URL = context.URL;
context.window.Blob = context.Blob;
context.window.setTimeout = context.setTimeout;

vm.runInNewContext(dataContent, context);
vm.runInNewContext(genContent, context);
vm.runInNewContext(appContent, context);

// Trigger DOMContentLoaded
if (readyCallback) {
  readyCallback();
}

const roadApp = context.ROAD_APP || context.window.ROAD_APP || {};
const roadGen = context.ROAD_GENERATOR || context.window.ROAD_GENERATOR || {};

const missingApp = [];
for (const call of Array.from(appCalls).sort()) {
  if (typeof roadApp[call] !== 'function') {
    missingApp.push(call);
    console.error(`❌ MISSING ROAD_APP.${call}`);
  }
}

const missingGen = [];
for (const call of Array.from(genCalls).sort()) {
  if (typeof roadGen[call] !== 'function') {
    missingGen.push(call);
    console.error(`❌ MISSING ROAD_GENERATOR.${call}`);
  }
}

if (missingApp.length === 0 && missingGen.length === 0) {
  console.log(`\n🎉 100% PASS: All ${appCalls.size} ROAD_APP methods and all ${genCalls.size} ROAD_GENERATOR methods exist and are callable!`);
} else {
  console.error(`\n⚠️ Missing methods found! App: ${missingApp.length}, Gen: ${missingGen.length}`);
  process.exit(1);
}

// 3. Test core flows execution
console.log('\n=== TESTING CORE WORKFLOW METHODS ===');
const proj = roadApp.getActiveProject();
console.log('Active project loaded:', proj ? (proj.label || proj.B_short || proj.B) : 'NONE');

// Switch views and tabs
roadApp.setView('studio');
roadApp.setStudioTab('chapters');
roadApp.setChapterFilter(0);
roadApp.setChapterFilter(1);
roadApp.setChapterFilter(2);
roadApp.setChapterFilter(3);
roadApp.setChapterFilter(4);
roadApp.setChapterFilter(5);
roadApp.setChapterFilter(7);
roadApp.setChapterFilter(6);
roadApp.setChapterFilter(0);

roadApp.setStudioTab('abcd');
roadApp.setStudioTab('statlab');
roadApp.setStatlabSubTab('pni_modified');
roadApp.setStatlabSubTab('ioc_cvi');
roadApp.setStatlabSubTab('item_analysis');
roadApp.setStatlabSubTab('cronbach');
roadApp.setStatlabSubTab('e1e2');
roadApp.setStatlabSubTab('hypothesis_lab');
roadApp.setStatlabSubTab('ch4_tables');

roadApp.setStudioTab('matrix');
roadApp.setMatrixSubTab('r1d1_bridge');
roadApp.setMatrixSubTab('syntax_matrix');
roadApp.setMatrixSubTab('operational');
roadApp.setMatrixSubTab('alignment');

roadApp.setStudioTab('instruments');
roadApp.setInstrumentSubTab('blueprint');
roadApp.setInstrumentSubTab('rubrics');
roadApp.setInstrumentSubTab('operational_def');
roadApp.setInstrumentSubTab('instrument_types');

// Test modals
roadApp.openAbcdModal('manual');
roadApp.closeAbcdModal();
roadApp.openContextMetaModal('context');
roadApp.closeContextMetaModal();
roadApp.openWizardModal(1);
roadApp.closeWizardModal();
roadApp.toggleReviewCenter();
roadApp.toggleReviewCenter();

// Test quick export handler
roadApp.handleQuickExport('front_matter');
roadApp.handleQuickExport('expert_kit');
roadApp.handleQuickExport('back_matter');

console.log('✅ ALL NAVIGATION, MODAL, EXPORT & FLOWS EXECUTED FLAWLESSLY WITH 0 ERRORS!');
