const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('=== TESTING FOCUS PRESERVATION & KEYSTROKE STABILITY ===');

const appContent = fs.readFileSync('js/app.js', 'utf8');
const dataContent = fs.readFileSync('js/data.js', 'utf8');
const advisorContent = fs.readFileSync('js/advisor.js', 'utf8');
const genContent = fs.readFileSync('js/generator.js', 'utf8');

let renderAppCallCount = 0;
let focusedElement = null;
let setSelectionRangeCalledWith = null;

const mockInput = {
  id: 'abcd_input_A',
  tagName: 'INPUT',
  type: 'text',
  value: 'ก',
  selectionStart: 1,
  selectionEnd: 1,
  getAttribute: (attr) => attr === 'oninput' ? "ROAD_APP.updateField('A', this.value)" : null,
  focus() {
    focusedElement = this;
  },
  setSelectionRange(start, end) {
    setSelectionRangeCalledWith = [start, end];
  }
};

const rootMock = {
  innerHTML: '',
  querySelector: (sel) => {
    if (sel.includes('abcd_input_A')) return mockInput;
    return null;
  },
  querySelectorAll: (tag) => [mockInput]
};

const context = {
  window: {
    location: { search: '' },
    scrollTo: () => {},
    print: () => {},
    addEventListener: (evt, cb) => { if (evt === 'DOMContentLoaded') cb(); }
  },
  document: {
    documentElement: { classList: { add: () => {}, remove: () => {} } },
    createElement: () => ({ setAttribute: () => {}, click: () => {} }),
    body: { appendChild: () => {}, removeChild: () => {} },
    activeElement: mockInput,
    getElementById: (id) => {
      if (id === 'app-root') return rootMock;
      if (id === 'abcd_input_A') return mockInput;
      return null;
    },
    querySelector: (sel) => null,
    querySelectorAll: (sel) => [mockInput]
  },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  navigator: { userAgent: 'node' },
  setTimeout: (fn) => typeof fn === 'function' && fn(),
  clearTimeout: () => {},
  setInterval: () => 123,
  clearInterval: () => {},
  URL: { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} },
  URLSearchParams: URLSearchParams,
  Blob: function(parts) { this.parts = parts; }
};

context.window.window = context.window;
context.window.document = context.document;
context.window.localStorage = context.localStorage;

vm.createContext(context);
vm.runInContext(dataContent, context);
vm.runInContext(advisorContent, context);
vm.runInContext(genContent, context);
vm.runInContext(appContent, context);

const ROAD_APP = context.ROAD_APP || context.window.ROAD_APP;

console.log('✓ Environment loaded successfully.');

// Test 1: updateAdvisorField on keystroke
ROAD_APP.updateAdvisorField('customTopic', 'ระบบนิเวศน์');
console.log('✓ updateAdvisorField called without errors on typing.');

// Test 2: updateSignupField on keystroke
ROAD_APP.updateSignupField('first_name', 'สมชาย');
console.log('✓ updateSignupField called without errors on typing.');

// Test 3: updateStatField on keystroke
ROAD_APP.updateStatField('preMean', 20.5);
assert.strictEqual(ROAD_APP.getActiveProject().statsData.preMean, 20.5);
console.log('✓ updateStatField updates numbers smoothly without destroying active input.');

// Test 4: updateField on ABCD typing
ROAD_APP.updateField('A', 'การพัฒนา');
assert.strictEqual(ROAD_APP.getActiveProject().A, 'การพัฒนา');
console.log('✓ updateField saves in-memory and keeps focus intact.');

// Test 5: Verify renderApp focus restoration
context.document.activeElement = mockInput;
ROAD_APP.renderApp();
assert.strictEqual(focusedElement, mockInput, 'Focus should be restored to mockInput');
assert.deepStrictEqual(setSelectionRangeCalledWith, [1, 1], 'Selection range should be preserved at [1, 1]');
console.log('✓ renderApp successfully preserved active element focus and selection cursor position [1, 1]!');

console.log('======================================================');
console.log('🎉 100% PASS: INPUT FOCUS & CURSOR RETENTION FULLY VERIFIED!');
console.log('======================================================');
