const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function element() {
  return {
    children: [], textContent: "", classList: { toggle() {} },
    addEventListener() {}, setAttribute(name, value) { this[name] = value; },
    replaceChildren() { this.children = []; },
    append(...items) { this.children.push(...items); },
  };
}

const elements = new Map();
const document = {
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, element());
    return elements.get(id);
  },
  createElement: element,
};
const context = vm.createContext({ window: {}, document, console, Date });
const source = fs.readFileSync(path.join(__dirname, "../web/app.js"), "utf8");
vm.runInContext(source, context);

vm.runInContext(`
  memoryFacts = [
    { id: "old", subject: "User", predicate: "likes", object: "tea", createdAt: "2026-11-08T12:00:00.000+00:00", corrected: true },
    { id: "new", subject: "User", predicate: "likes", object: "coffee", createdAt: "2026-11-09T12:00:00.000+00:00" }
  ];
  memoryView = "pending";
  renderFacts();
`, context);
assert.equal(elements.get("pending-facts").textContent, "Pending review (1)");
assert.equal(elements.get("facts").children.length, 1);
assert.equal(elements.get("facts").children[0].children[0].children[0].textContent.includes("coffee"), true);
assert.match(elements.get("facts").children[0].children[0].children[1].textContent, /^Added /);
assert.equal(elements.get("facts").children[0].children[1].children[0].textContent, "Confirm");

vm.runInContext(`memoryView = "all"; renderFacts();`, context);
assert.equal(elements.get("facts").children.length, 2);
assert.equal(elements.get("all-facts").textContent, "All memory (2)");
console.log("Memory review rendering passed");
