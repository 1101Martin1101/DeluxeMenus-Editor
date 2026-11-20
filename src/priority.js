/**
 * Priority-aware layer helpers.
 *
 * A DeluxeMenus menu can contain several items that target the same slot with
 * different `priority` values. The editor grid is a single array of slots, so
 * this module keeps the original YAML items as "layers" and expands only the
 * requested layer (or the resolved highest-priority view) into the grid.
 */

const clone = (value) => JSON.parse(JSON.stringify(value));

/** Grid-only fields that must never be written back to YAML. */
const INTERNAL_FIELDS = [
  "id",
  "icon",
  "parent",
  "_layerKey",
  "_priority",
  "_requirementMet",
  "_requirementChecks",
  "_clickRequirementMet",
  "_clickRequirementChecks",
];

const isInternalField = (field) => INTERNAL_FIELDS.includes(field);

const stripInternalFields = (item) => {
  INTERNAL_FIELDS.forEach((field) => {
    delete item[field];
  });
  return item;
};

export const RESOLVED_VIEW = "resolved";

export function parseView(view) {
  if (typeof view === "string" && view.startsWith("p:")) {
    const priority = Number(view.slice(2));
    return { mode: "priority", priority: Number.isFinite(priority) ? priority : 0 };
  }
  return { mode: "resolved", priority: null };
}

function slotsFromItem(key, item) {
  if (typeof item.slot === "number") return [item.slot];
  if (Array.isArray(item.slots)) {
    return item.slots.map(Number).filter((n) => Number.isInteger(n));
  }
  if (typeof item.slot === "string" && item.slot.includes("-")) {
    const [start, end] = item.slot.split("-").map(Number);
    if (Number.isInteger(start) && Number.isInteger(end)) {
      const slots = [];
      for (let s = start; s <= end; s += 1) slots.push(s);
      return slots;
    }
  }
  if (key !== "" && !Number.isNaN(Number(key))) return [Number(key)];
  return [];
}

/** Raw YAML items (record) -> layers with joined textarea fields. */
export function layersFromItems(itemsData, textareaFields) {
  const layers = [];
  Object.keys(itemsData || {}).forEach((key) => {
    const raw = itemsData[key];
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return;

    const item = stripInternalFields(clone(raw));
    textareaFields.forEach((field) => {
      if (Array.isArray(item[field])) item[field] = item[field].join("\n");
    });

    const slots = slotsFromItem(key, item);
    delete item.slot;
    delete item.slots;

    const priority = Number(item.priority);
    layers.push({
      key: String(key),
      priority: Number.isFinite(priority) ? priority : 0,
      item,
      slots,
    });
  });
  return layers;
}

/** Layers -> the original `items:` object, preserving keys and fields. */
export function layersToItems(layers, textareaFields) {
  const items = {};
  layers.forEach((layer) => {
    if (!layer.slots || layer.slots.length === 0) return;

    const item = stripInternalFields(clone(layer.item));

    textareaFields.forEach((field) => {
      if (typeof item[field] === "string") item[field] = item[field].split("\n");
    });

    if (layer.slots.length === 1) {
      item.slot = layer.slots[0];
    } else {
      item.slots = [...layer.slots];
    }
    items[layer.key] = item;
  });
  return items;
}

export function prioritiesOf(layers) {
  const values = new Set(layers.map((layer) => layer.priority));
  return [...values].sort((a, b) => a - b);
}

export function sizeForLayers(layers, fallback = 54) {
  let size = 0;
  layers.forEach((layer) => {
    layer.slots.forEach((slot) => {
      if (Number.isInteger(slot) && slot >= 0) size = Math.max(size, slot + 1);
    });
  });
  size = Math.max(size, fallback);
  return Math.min(Math.ceil(size / 9) * 9, 54);
}

export function layersInView(layers, view) {
  const { mode, priority } = parseView(view);
  return mode === "priority"
    ? layers.filter((layer) => layer.priority === priority)
    : layers;
}

const PLACEHOLDER_RE = /%([^%]+)%/g;
const NUMERIC_OPS = new Set([">", ">=", "<", "<="]);
const STRING_OPS = new Set(["==", "=", "!=", "equals", "not equals", "contains", "starts with", "ends with"]);

export function walkRequirementTree(requirement, visit) {
  if (!requirement) return;
  if (Array.isArray(requirement)) {
    requirement.forEach((value) => walkRequirementTree(value, visit));
    return;
  }
  if (typeof requirement !== "object") return;
  if (typeof requirement.type === "string" && requirement.type.trim()) {
    visit(requirement);
    return;
  }
  Object.values(requirement).forEach((value) => walkRequirementTree(value, visit));
}

export function collectPermissions(requirement, found = new Set()) {
  walkRequirementTree(requirement, (node) => {
    const type = String(node.type || "").toLowerCase();
    if (type.includes("permission") && typeof node.permission === "string" && node.permission.trim()) {
      found.add(node.permission.trim());
    }
  });
  return found;
}

export function permissionsFromLayers(layers) {
  const found = new Set();
  layers.forEach((layer) => {
    ["view_requirement", "click_requirement"].forEach((field) => {
      if (layer.item && layer.item[field]) collectPermissions(layer.item[field], found);
    });
  });
  return [...found].sort();
}

export function collectPlaceholders(value, found = new Set()) {
  if (typeof value === "string") {
    for (const match of value.matchAll(PLACEHOLDER_RE)) found.add(match[1]);
    return found;
  }
  if (Array.isArray(value)) {
    value.forEach((entry) => collectPlaceholders(entry, found));
    return found;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((entry) => collectPlaceholders(entry, found));
  }
  return found;
}

export function placeholderTypesFromLayers(layers) {
  const types = {};
  layers.forEach((layer) => {
    ["view_requirement", "click_requirement"].forEach((field) => {
      walkRequirementTree(layer.item && layer.item[field], (node) => {
        const type = String(node.type || "").trim().toLowerCase();
        if (!type || type.includes("permission")) return;
        const numeric = NUMERIC_OPS.has(type) && Number.isFinite(Number(node.output));
        const register = (key) => {
          if (numeric) types[key] = "number";
          else if (!types[key]) types[key] = "text";
        };
        collectPlaceholders(node.input).forEach(register);
        collectPlaceholders(node.output).forEach(register);
      });
    });
  });
  return types;
}

function resolvePlaceholders(value, placeholders) {
  if (value === null || value === undefined) return { text: "", resolved: true };
  let resolved = true;
  const text = String(value).replace(PLACEHOLDER_RE, (match, key) => {
    const replacement = placeholders[key];
    if (replacement === undefined || replacement === null || replacement === "") {
      resolved = false;
      return match;
    }
    return String(replacement);
  });
  return { text, resolved };
}

function compareNumeric(operator, left, right) {
  switch (operator) {
    case ">": return left > right;
    case ">=": return left >= right;
    case "<": return left < right;
    case "<=": return left <= right;
    default: return true;
  }
}

function compareString(operator, left, right) {
  switch (operator) {
    case "==":
    case "=":
    case "equals": return left === right;
    case "!=":
    case "not equals": return left !== right;
    case "contains": return left.includes(right);
    case "starts with": return left.startsWith(right);
    case "ends with": return left.endsWith(right);
    default: return true;
  }
}

function evaluateRequirementLeaf(node, context, checks) {
  const rawType = String(node.type || "").trim();
  const type = rawType.toLowerCase();

  if (type.includes("permission")) {
    const permission = String(node.permission || "").trim();
    const negated = type.startsWith("!");
    const granted = Boolean(permission && context.permissions[permission]);
    const pass = permission ? (negated ? !granted : granted) : true;
    const labels = context.labels || {};
    const label = negated
      ? (labels.notPermission || "NOT permission")
      : (labels.permission || "permission");
    checks.push({
      pass,
      text: permission ? `${label} ${permission}` : label,
    });
    return pass;
  }

  if (NUMERIC_OPS.has(type) || STRING_OPS.has(type)) {
    const input = resolvePlaceholders(node.input, context.placeholders);
    const output = resolvePlaceholders(node.output, context.placeholders);
    let pass = true;
    let unknown = false;

    if (!input.resolved || !output.resolved) {
      unknown = true;
    } else if (NUMERIC_OPS.has(type)) {
      const leftText = input.text.trim();
      const rightText = output.text.trim();
      if (leftText === "" || rightText === "") {
        unknown = true;
      } else {
        const left = Number(leftText);
        const right = Number(rightText);
        if (!Number.isFinite(left) || !Number.isFinite(right)) unknown = true;
        else pass = compareNumeric(type, left, right);
      }
    } else {
      pass = compareString(type, input.text, output.text);
    }

    const text = `${node.input ?? ""} ${rawType} ${node.output ?? ""}`.trim();
    const labels = context.labels || {};
    const nowLabel = labels.now || "now";
    const unknownLabel = labels.notSimulatable || "not simulatable";
    checks.push({
      pass: unknown ? true : pass,
      unknown,
      text: unknown ? `${text} (${unknownLabel})` : `${text} (${nowLabel} ${input.text})`,
    });
    return unknown ? true : pass;
  }

  return true;
}

export function evaluateRequirementTree(requirement, context, checks = []) {
  if (!requirement) return true;
  if (Array.isArray(requirement)) {
    return requirement.every((value) => evaluateRequirementTree(value, context, checks));
  }
  if (typeof requirement !== "object") return true;
  if (typeof requirement.type === "string" && requirement.type.trim()) {
    return evaluateRequirementLeaf(requirement, context, checks);
  }
  return Object.values(requirement).every((value) =>
    evaluateRequirementTree(value, context, checks)
  );
}

export function requirementResult(requirement, context) {
  const checks = [];
  const pass = evaluateRequirementTree(requirement, context || { permissions: {}, placeholders: {} }, checks);
  return { pass, checks };
}

export function evaluateViewRequirement(requirement, granted = {}) {
  return requirementResult(requirement, { permissions: granted, placeholders: {} }).pass;
}

/**
 * Expand the active view into the slot grid used by the editor.
 * In the resolved view, higher priority wins on a shared slot and only items
 * whose view requirements pass are considered.
 */
export function buildGrid(
  layers,
  view,
  size,
  iconFor,
  requirementCheck,
  clickRequirementCheck,
  strictClick
) {
  const grid = [];
  for (let i = 0; i < size; i += 1) grid.push({ id: i });

  const check = requirementCheck || (() => ({ pass: true, checks: [] }));
  const clickCheck = clickRequirementCheck || (() => ({ pass: true, checks: [] }));
  const active = layersInView(layers, view);
  const resolved = parseView(view).mode === "resolved";

  const visible = resolved
    ? active.filter((layer) => {
        if (!check(layer).pass) return false;
        if (!strictClick) return true;
        return clickCheck(layer).pass;
      })
    : active;

  const ordered = resolved
    ? visible
        .map((layer, index) => ({ layer, index }))
        // Lower priority number = higher priority: apply higher numbers first
        // so the best (lowest) number overwrites them last.
        .sort((a, b) => b.layer.priority - a.layer.priority || a.index - b.index)
        .map((entry) => entry.layer)
    : visible;

  ordered.forEach((layer) => {
    const viewResult = check(layer);
    const clickResult = clickCheck(layer);

    layer.slots.forEach((slot) => {
      if (!Number.isInteger(slot) || slot < 0 || slot >= size) return;
      grid[slot] = {
        ...clone(layer.item),
        id: slot,
        icon: layer.item.material ? iconFor(layer.item.material) : layer.item.icon,
        _layerKey: layer.key,
        _priority: layer.priority,
        _requirementMet: viewResult.pass,
        _requirementChecks: viewResult.checks,
        _clickRequirementMet: clickResult.pass,
        _clickRequirementChecks: clickResult.checks,
      };
    });
  });
  return grid;
}

/**
 * Merge edits of the visible grid back into the layer list.
 * Layers that are not part of the active view stay untouched.
 */
export function syncGrid(layers, grid, view, makeKey) {
  const { mode } = parseView(view);
  const next = layers.map((layer) => ({
    key: layer.key,
    priority: layer.priority,
    item: clone(layer.item),
    slots: [...layer.slots],
  }));
  const viewKeys = new Set(layersInView(next, view).map((layer) => layer.key));
  const groups = new Map();

  grid.forEach((entry) => {
    if (!entry || !entry._layerKey) return;
    if (!groups.has(entry._layerKey)) {
      groups.set(entry._layerKey, { slots: [], first: entry });
    }
    groups.get(entry._layerKey).slots.push(entry.id);
  });

  next.forEach((layer) => {
    if (!viewKeys.has(layer.key)) return;

    const group = groups.get(layer.key);
    if (!group) {
      // A layer without grid entries is hidden behind another layer (same or
      // higher priority), not empty. Clearing slots is handled explicitly.
      return;
    }

    const item = {};
    Object.keys(group.first).forEach((field) => {
      if (isInternalField(field)) return;
      item[field] = clone(group.first[field]);
    });

    layer.item = item;
    if (mode === "priority") {
      layer.slots = [...new Set(group.slots)].sort((a, b) => a - b);
    }
    const priority = Number(group.first.priority);
    layer.priority = Number.isFinite(priority) ? priority : 0;
  });

  grid.forEach((entry) => {
    if (!entry || entry._layerKey) return;

    const meaningful = Object.keys(entry).some(
      (field) => !["id", "parent"].includes(field) && entry[field] !== "" && entry[field] != null
    );
    if (!meaningful) return;

    const key = makeKey();
    const item = {};
    Object.keys(entry).forEach((field) => {
      if (isInternalField(field)) return;
      item[field] = clone(entry[field]);
    });

    const priority = Number(entry.priority);
    next.push({
      key,
      priority: Number.isFinite(priority) ? priority : 0,
      item,
      slots: [entry.id],
    });

    entry._layerKey = key;
    entry._priority = Number.isFinite(priority) ? priority : 0;
  });

  return next.filter((layer) => layer.slots.length > 0);
}

/** Rebuild layers from a legacy saved grid (no layers in localStorage). */
export function layersFromGrid(grid, makeKey) {
  const layers = [];
  grid.forEach((entry) => {
    if (!entry) return;
    const meaningful = Object.keys(entry).some(
      (field) => !["id", "parent"].includes(field) && entry[field] !== "" && entry[field] != null
    );
    if (!meaningful) return;

    const item = {};
    Object.keys(entry).forEach((field) => {
      if (isInternalField(field)) return;
      item[field] = clone(entry[field]);
    });
    const priority = Number(entry.priority);
    layers.push({
      key: makeKey(),
      priority: Number.isFinite(priority) ? priority : 0,
      item,
      slots: [entry.id],
    });
  });
  return layers;
}
