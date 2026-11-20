import './App.css';
import { MCText } from './mcparse';
import { Slot } from './slot';
import { Search, allItemsList } from './search';
import {
  RESOLVED_VIEW,
  buildGrid,
  layersFromGrid,
  layersFromItems,
  layersToItems,
  permissionsFromLayers,
  placeholderTypesFromLayers,
  prioritiesOf,
  requirementResult,
  sizeForLayers,
  syncGrid,
} from './priority';
import { GradientModal } from './gradient';
import React, { Component } from 'react';
import AceEditor from 'react-ace';
import YAML from 'js-yaml';
import Modal from 'react-modal';
import _LANG from './lang/english';
import extraStrings, { formatString } from './lang/extra';
import fileDownload from 'js-file-download';

import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';

import "ace-builds/src-noconflict/mode-yaml";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-twilight";
import "ace-builds/src-noconflict/theme-chrome";
import "ace-builds/src-noconflict/ext-searchbox";

const LANGLIST = [
  { value: 'english',    label: 'English',     flag: 'gb' },
  { value: 'czech',      label: 'Čeština',     flag: 'cz' },
  { value: 'spanish',    label: 'Español',     flag: 'es' },
  { value: 'polish',     label: 'Polski',      flag: 'pl' },
  { value: 'german',     label: 'Deutsch',     flag: 'de' },
  { value: 'russian',    label: 'Русский',     flag: 'ru' },
  { value: 'chinese',    label: '中文',         flag: 'cn' },
  { value: 'vietnamese', label: 'Tiếng Việt',  flag: 'vn' },
];

const _lang = localStorage.getItem('lang') || 'english';
let LANG = { ..._LANG, ...extraStrings.english, ...(extraStrings[_lang] || {}) };
const IS_TEST_BUILD = /\/test\/?$/.test(process.env.PUBLIC_URL || '');
const STATE_KEY = IS_TEST_BUILD ? 'state_test' : 'state';

let selectLang = async (lang) => {
  if (lang && LANGLIST.some(l => l.value === lang)) {
    await import(`./lang/${lang}`).then(res => {
      LANG = { ...res.default, ...extraStrings.english, ...(extraStrings[lang] || {}) };
    });
  }
  localStorage.setItem('lang', lang);
}

const CMD_TAGS = [
  { tag: '[player]',            descKey: 'cmd_tag_player' },
  { tag: '[console]',           descKey: 'cmd_tag_console' },
  { tag: '[commandevent]',      descKey: 'cmd_tag_commandevent' },
  { tag: '[placeholder]',       descKey: 'cmd_tag_placeholder' },
  { tag: '[message]',           descKey: 'cmd_tag_message' },
  { tag: '[broadcast]',         descKey: 'cmd_tag_broadcast' },
  { tag: '[minimessage]',       descKey: 'cmd_tag_minimessage' },
  { tag: '[minibroadcast]',     descKey: 'cmd_tag_minibroadcast' },
  { tag: '[openguimenu]',       descKey: 'cmd_tag_openguimenu' },
  { tag: '[connect]',           descKey: 'cmd_tag_connect' },
  { tag: '[close]',             descKey: 'cmd_tag_close' },
  { tag: '[json]',              descKey: 'cmd_tag_json' },
  { tag: '[jsonbroadcast]',     descKey: 'cmd_tag_jsonbroadcast' },
  { tag: '[refresh]',           descKey: 'cmd_tag_refresh' },
  { tag: '[broadcastsound]',    descKey: 'cmd_tag_broadcastsound' },
  { tag: '[broadcastsoundworld]', descKey: 'cmd_tag_broadcastsoundworld' },
  { tag: '[sound]',             descKey: 'cmd_tag_sound' },
  { tag: '[takemoney]',         descKey: 'cmd_tag_takemoney' },
  { tag: '[givemoney]',         descKey: 'cmd_tag_givemoney' },
  { tag: '[takeexp]',           descKey: 'cmd_tag_takeexp' },
  { tag: '[giveexp]',           descKey: 'cmd_tag_giveexp' },
  { tag: '[givepermission]',    descKey: 'cmd_tag_givepermission' },
  { tag: '[takepermission]',    descKey: 'cmd_tag_takepermission' },
  { tag: '[meta]',              descKey: 'cmd_tag_meta' },
  { tag: '[chat]',              descKey: 'cmd_tag_chat' },
];

Modal.setAppElement('#root');

const customStyles = {
  content : {
    width                 : '450px',
    minHeight             : '400px',
    top                   : '50%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '-50%',
    transform             : 'translate(-50%, -50%)',
    boxShadow             : '0 20px 40px rgba(0,0,0,0.6)',
    background            : '#161d29',
    border                : '1px solid #2b3543',
    borderRadius          : '12px',
    color                 : '#e6edf3',
    padding               : '20px'
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 999
  }
};

const fields = () => [
  {
    name: LANG['data'],
    value: 'data',
    extra: true,
    type: 'text',
    tagName: 'input'
  },
  {
    name: LANG['amount'],
    value: 'amount',
    extra: false,
    type: 'number',
    tagName: 'input',
    min: 1,
    max: 64,
  },
  {
    name: LANG['dynamic_amount'],
    value: 'dynamic_amount',
    extra: true,
    type: 'text',
    tagName: 'input'
  },
  {
    name: LANG['model_data'],
    value: 'model_data',
    extra: true,
    type: 'text',
    tagName: 'input'
  },
  {
    name: LANG['nbt_string'],
    value: 'nbt_string',
    extra: true,
    type: 'text',
    tagName: 'input'
  },
  {
    name: LANG['nbt_int'],
    value: 'nbt_int',
    extra: true,
    type: 'text',
    tagName: 'input'
  },
  {
    name: LANG['banner_meta'],
    value: 'banner_meta',
    extra: true,
    type: 'text',
    tagName: 'textarea'
  },
  {
    name: LANG['rgb'],
    value: 'rgb',
    extra: true,
    type: 'text',
    tagName: 'input'
  },
  {
    name: LANG['base_color'],
    value: 'base_color',
    extra: true,
    type: 'text',
    tagName: 'input'
  },
  {
    name: LANG['item_flags'],
    value: 'item_flags',
    extra: true,
    type: 'text',
    tagName: 'textarea'
  },
  {
    name: LANG['potion_effects'],
    value: 'potion_effects',
    extra: true,
    type: 'text',
    tagName: 'textarea'
  },
  {
    name: LANG['entity_type'],
    value: 'entity_type',
    extra: true,
    type: 'text',
    tagName: 'input'
  },
  {
    name: LANG['display_name'],
    value: 'display_name',
    extra: false,
    type: 'text',
    tagName: 'input',
    gradient: true,
  },
  {
    name: LANG['lore'],
    value: 'lore',
    extra: false,
    type: 'text',
    tagName: 'textarea',
    gradient: true,
  },
  {
    name: LANG['priority'],
    value: 'priority',
    extra: false,
    type: 'number',
    tagName: 'input'
  },
  {
    name: LANG['view_requirement'],
    value: 'view_requirement',
    extra: true,
    type: 'text',
    tagName: 'input'
  },
  {
    name: LANG['enchantments'],
    value: 'enchantments',
    extra: true,
    type: '',
    tagName: 'textarea'
  },
  {
    name: LANG['update'],
    value: 'update',
    extra: true,
    type: 'checkbox',
    tagName: 'input'
  },
  {
    name: LANG['hide_enchantments'],
    value: 'hide_enchantments',
    extra: true,
    type: 'checkbox',
    tagName: 'input'
  },
  {
    name: LANG['hide_attributes'],
    value: 'hide_attributes',
    extra: true,
    type: 'checkbox',
    tagName: 'input'
  },
  {
    name: LANG['hide_effects'],
    value: 'hide_effects',
    extra: true,
    type: 'checkbox',
    tagName: 'input'
  },
  {
    name: LANG['unbreakable'],
    value: 'unbreakable',
    extra: true,
    type: 'checkbox',
    tagName: 'input'
  },
  {
    name: LANG['hide_unbreakable'],
    value: 'hide_unbreakable',
    extra: true,
    type: 'checkbox',
    tagName: 'input'
  },
  {
    name: 'click_commands',
    value: 'click_commands',
    extra: false,
    type: '',
    tagName: 'textarea',
    commands: true,
  },
  {
    name: LANG['left_click_commands'],
    value: 'left_click_commands',
    extra: true,
    type: '',
    tagName: 'textarea',
    commands: true,
  },
  {
    name: LANG['right_click_commands'],
    value: 'right_click_commands',
    extra: true,
    type: '',
    tagName: 'textarea',
    commands: true,
  },
  {
    name: LANG['middle_click_commands'],
    value: 'middle_click_commands',
    extra: true,
    type: '',
    tagName: 'textarea',
    commands: true,
  },
  {
    name: LANG['shift_left_click_commands'],
    value: 'shift_left_click_commands',
    extra: true,
    type: '',
    tagName: 'textarea',
    commands: true,
  },
  {
    name: LANG['shift_right_click_commands'],
    value: 'shift_right_click_commands',
    extra: true,
    type: '',
    tagName: 'textarea',
    commands: true,
  },
  {
    name: LANG['left_click_requirement'],
    value: 'left_click_requirement',
    extra: true,
    type: '',
    tagName: 'textarea'
  },
  {
    name: LANG['right_click_requirement'],
    value: 'right_click_requirement',
    extra: true,
    type: '',
    tagName: 'textarea'
  },
  {
    name: LANG['middle_click_requirement'],
    value: 'middle_click_requirement',
    extra: true,
    type: '',
    tagName: 'textarea'
  },
  {
    name: LANG['shift_left_click_requirement'],
    value: 'shift_left_click_requirement',
    extra: true,
    type: '',
    tagName: 'textarea'
  },
  {
    name: LANG['shift_right_click_requirement'],
    value: 'shift_right_click_requirement',
    extra: true,
    type: '',
    tagName: 'textarea'
  },
];

const KNOWN_ITEM_FILES = new Set(allItemsList.map(item => item.filename.toLowerCase()));

const BASEHEAD_CACHE = new Map();
const TEXTURE_HASH_RE = /\/texture\/([0-9a-f]{64})/i;

/** Decode a DeluxeMenus `basehead-<base64>` value to a Mojang texture hash. */
const baseheadTextureHash = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  if (BASEHEAD_CACHE.has(raw)) return BASEHEAD_CACHE.get(raw);

  let hash = '';
  if (/^[0-9a-f]{64}$/i.test(raw)) {
    hash = raw.toLowerCase();
  } else {
    const normalized = raw.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    try {
      const decoded = atob(padded).replace(/\\\//g, '/');
      const match = decoded.match(TEXTURE_HASH_RE);
      if (match) hash = match[1].toLowerCase();
    } catch {
      hash = '';
    }
  }

  BASEHEAD_CACHE.set(raw, hash);
  return hash;
};

const isBaseheadMaterial = (material) => {
  const value = String(material || '').replace(/^minecraft:/i, '').trim();
  return /^basehead-/i.test(value) || /^head-/i.test(value);
};

/** The part after `basehead-` / `head-` (case preserved — base64 is case-sensitive). */
const baseheadValue = (material) => {
  const value = String(material || '').replace(/^minecraft:/i, '').trim();
  const index = value.indexOf('-');
  return index >= 0 ? value.slice(index + 1) : '';
};

/** Texture URL for a material; unknown/NEXO materials fall back to the site icon. */
const iconForMaterial = (material) => {
  const raw = String(material || '').replace(/^minecraft:/i, '').trim();
  if (!raw) return '';

  if (isBaseheadMaterial(raw)) {
    const hash = baseheadTextureHash(baseheadValue(raw));
    if (hash) return `/api/v1/head/${hash}?size=64&overlay=1`;
    return `${process.env.PUBLIC_URL}/items/player_head.png`;
  }

  const materialName = raw.toLowerCase();
  if (!KNOWN_ITEM_FILES.has(materialName)) {
    return `${process.env.PUBLIC_URL}/brand-icon-192.png`;
  }
  return `${process.env.PUBLIC_URL}/items/${materialName}.png`;
};

const textareaFieldNames = () =>
  fields().filter(field => field.tagName === 'textarea').map(field => field.value);

const materialAt = (items, id) => {
  const item = items && items[id];
  if (!item) return 'none';
  if (typeof item.material !== 'undefined') return item.material;
  if (Number.isInteger(item.parent) && items[item.parent]) return items[item.parent].material;
  return 'none';
};

const PERMISSION_REQUIREMENT_TYPES = ['has permission', '!has permission'];
const COMPARISON_REQUIREMENT_TYPES = [
  '>=', '>', '<=', '<', '==', '!=', 'contains', 'starts with', 'ends with',
];

const requirementTypeLabel = (type) => {
  if (type === 'has permission') return LANG['ui_type_has_permission'] || 'Has permission';
  if (type === '!has permission') return LANG['ui_type_no_permission'] || 'Does NOT have permission';
  return type;
};

const isPermissionRequirement = (type) =>
  String(type || '').toLowerCase().includes('permission');

const stripColorCodes = (text) =>
  String(text || '').replace(/&(#[0-9a-fA-F]{6}|[0-9a-fk-orA-FK-OR])/g, '').trim();

const itemLabel = (item) => {
  if (!item) return LANG['ui_empty_item'] || '(empty item)';
  const name = stripColorCodes(item.display_name);
  if (name) return name;
  if (isBaseheadMaterial(item.material)) return LANG['ui_custom_head'] || 'Custom head';
  const material = String(item.material || '').replace(/_/g, ' ').trim();
  if (material) {
    return material.charAt(0).toUpperCase() + material.slice(1).toLowerCase();
  }
  return LANG['ui_empty_item'] || '(empty item)';
};

const INTERNAL_YAML_FIELD = /^\s*_(?:requirementMet|requirementChecks|clickRequirementMet|clickRequirementChecks|layerKey|priority|priorityView):.*\r?\n?/gm;
const sanitizeYamlText = (text) => String(text || '').replace(INTERNAL_YAML_FIELD, '');

const YAML_DEFAULTS = {
  indent: 2,
  noArrayIndent: false,
  skipInvalid: false,
  flowLevel: -1,
  sortKeys: false,
  lineWidth: 80,
  noRefs: false,
  noCompatMode: false,
  condenseFlow: false,
  quotingType: '\'',
  forceQuotes: false,
};

export class Inventory extends Component {
  state = {
    menu_title: LANG['Menu default title'],
    open_command: 'menu',
    register_command: false,
    size: 0,
    showModal: false,
    showYAMLOpts: false,
    yamlError: false,
    selected: 0,
    selectedSearch: {},
    items: [],
    layers: [],
    priorityView: RESOLVED_VIEW,
    permissions: {},
    placeholders: {},
    simulateRequirements: true,
    simulateClickRequirements: false,
    showPriorityBadges: false,
    inspectorTab: 'item',
    searchMode: 'replace',
    currentItem: {
      material: 'none'
    },
    yaml: YAML_DEFAULTS,
    aceValue: '',
    showGradient: false,
    gradientField: null,
    langOpen: false,
    currentLang: _lang,
    cmdTagsOpen: null,
  }

  inputRef = React.createRef(null)
  aceRef = React.createRef(null)
  langWrapRef = React.createRef(null)
  cmdTagsRef = React.createRef(null)

  _handleOutsideClick = (e) => {
    if (this.langWrapRef.current && !this.langWrapRef.current.contains(e.target)) {
      this.setState({ langOpen: false });
    }
    if (this.cmdTagsRef.current && !this.cmdTagsRef.current.contains(e.target)) {
      this.setState({ cmdTagsOpen: null });
    }
  }

  syncSelectionToAce = (id) => {
    if (!this.aceRef.current) return;
    const editor = this.aceRef.current.editor;
    const value = editor.getValue();
    const lines = value.split('\n');
    
    let targetLine = -1;
    let inItemsBlock = false;
    let currentItemStartLine = -1;
    let currentItemIndentation = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      if (trimmed.startsWith('items:')) {
        inItemsBlock = true;
        continue;
      }
      
      const indentation = line.search(/\S/);

      if (inItemsBlock || !value.includes('items:')) {
        // Look for item keys (e.g. '0':, "name":, name:)
        if (trimmed.endsWith(':') && (inItemsBlock ? indentation > 0 : indentation === 0)) {
          // If we found a new item key, check if the previous item was the one we wanted
          currentItemStartLine = i + 1;
          currentItemIndentation = indentation;
          
          // Also check if this key itself is the id (e.g., '0':)
          const keyName = trimmed.slice(0, -1).replace(/['"]/g, '');
          if (keyName === String(id)) {
            targetLine = currentItemStartLine;
            break;
          }
        } else if (currentItemStartLine !== -1 && indentation > currentItemIndentation) {
          // We are inside an item's properties
          if (trimmed.startsWith('slot: ' + id) || 
              trimmed.startsWith('slot: "' + id + '"') ||
              trimmed.startsWith("slot: '" + id + "'")) {
            targetLine = currentItemStartLine; // Highlight the item's key, not the slot property
            break;
          }
          
          if (trimmed.startsWith('slots:') && trimmed.includes(String(id))) {
             targetLine = currentItemStartLine;
             break;
          }
        }
      }
    }

    if (targetLine !== -1) {
      editor.gotoLine(targetLine, 0, true);
      editor.scrollToLine(targetLine, true, true, function () {});
      editor.selection.selectLine(); // Highlight the line
    }
  }

  computedMaterial = (id) => {
    if (this.state.items[id]) {
      if (typeof this.state.items[id].material !== 'undefined') {
        return this.state.items[id].material;
      }

      if (typeof this.state.items[id].parent === 'number') {
        return this.state.items[this.state.items[id].parent].material;
      }
    }

    return 'none';
  }

  makeLayerKey = () => {
    const used = new Set((this.state.layers || []).map(layer => layer.key));
    let index = this._layerCounter || 0;
    let key;
    do {
      index += 1;
      key = `item_${index}`;
    } while (used.has(key));
    this._layerCounter = index;
    return key;
  };

  syncLayers = (items = this.state.items, layers = this.state.layers, view = this.state.priorityView) =>
    syncGrid(layers || [], items || [], view, this.makeLayerKey);

  requirementCheckLabels = () => ({
    permission: LANG['ui_permission'] || 'permission',
    notPermission: LANG['ui_not_permission_word'] || 'NOT permission',
    now: LANG['ui_now'] || 'now',
    notSimulatable: LANG['ui_not_simulatable'] || 'not simulatable',
  });

  requirementContextFor = (
    layer,
    permissions = this.state.permissions,
    placeholders = this.state.placeholders,
    simulate = this.state.simulateRequirements
  ) => {
    if (!simulate) return { pass: true, checks: [] };
    return requirementResult(layer.item && layer.item.view_requirement, {
      permissions,
      placeholders,
      labels: this.requirementCheckLabels(),
    });
  };

  clickRequirementContextFor = (
    layer,
    permissions = this.state.permissions,
    placeholders = this.state.placeholders,
    simulate = this.state.simulateRequirements
  ) => {
    if (!simulate) return { pass: true, checks: [] };
    return requirementResult(layer.item && layer.item.click_requirement, {
      permissions,
      placeholders,
      labels: this.requirementCheckLabels(),
    });
  };

  buildView = (
    layers,
    view = this.state.priorityView,
    permissions = this.state.permissions,
    placeholders = this.state.placeholders,
    simulate = this.state.simulateRequirements,
    strictClick = this.state.simulateClickRequirements
  ) => buildGrid(
    layers,
    view,
    this.state.size,
    iconForMaterial,
    layer => this.requirementContextFor(layer, permissions, placeholders, simulate),
    layer => this.clickRequirementContextFor(layer, permissions, placeholders, simulate),
    strictClick
  );

  allPermissions = () => {
    const found = new Set(permissionsFromLayers(this.state.layers || []));
    Object.keys(this.state.permissions || {}).forEach(permission => found.add(permission));
    return [...found].sort();
  };

  placeholderTypes = () => placeholderTypesFromLayers(this.state.layers || []);

  allPlaceholders = () => {
    const found = new Set(Object.keys(this.placeholderTypes()));
    Object.keys(this.state.placeholders || {}).forEach(key => found.add(key));
    return [...found];
  };

  permissionItemCount = (permission) => (this.state.layers || []).filter(layer =>
    permissionsFromLayers([layer]).includes(permission)
  ).length;

  toggleSimulation = () => {
    const layers = this.syncLayers();
    const simulateRequirements = !this.state.simulateRequirements;
    const items = this.buildView(
      layers,
      this.state.priorityView,
      this.state.permissions,
      this.state.placeholders,
      simulateRequirements,
      this.state.simulateClickRequirements
    );
    this.setState({
      layers,
      simulateRequirements,
      items,
      currentItem: { material: materialAt(items, this.state.selected) },
    });
  };

  toggleClickRequirements = () => {
    const layers = this.syncLayers();
    const simulateClickRequirements = !this.state.simulateClickRequirements;
    const items = this.buildView(
      layers,
      this.state.priorityView,
      this.state.permissions,
      this.state.placeholders,
      this.state.simulateRequirements,
      simulateClickRequirements
    );
    this.setState({
      layers,
      simulateClickRequirements,
      items,
      currentItem: { material: materialAt(items, this.state.selected) },
    });
  };

  togglePermission = (permission) => {
    const layers = this.syncLayers();
    const permissions = {
      ...this.state.permissions,
      [permission]: !this.state.permissions[permission],
    };
    const items = this.buildView(
      layers,
      this.state.priorityView,
      permissions,
      this.state.placeholders,
      this.state.simulateRequirements,
      this.state.simulateClickRequirements
    );
    this.setState({
      layers,
      permissions,
      items,
      currentItem: { material: materialAt(items, this.state.selected) },
    });
  };

  setAllPermissions = (granted) => {
    const layers = this.syncLayers();
    const permissions = {};
    this.allPermissions().forEach(permission => {
      permissions[permission] = granted;
    });
    const items = this.buildView(
      layers,
      this.state.priorityView,
      permissions,
      this.state.placeholders,
      this.state.simulateRequirements,
      this.state.simulateClickRequirements
    );
    this.setState({
      layers,
      permissions,
      items,
      currentItem: { material: materialAt(items, this.state.selected) },
    });
  };

  setPlaceholder = (key, value) => {
    const layers = this.syncLayers();
    const placeholders = { ...this.state.placeholders, [key]: value };
    const items = this.buildView(
      layers,
      this.state.priorityView,
      this.state.permissions,
      placeholders,
      this.state.simulateRequirements,
      this.state.simulateClickRequirements
    );
    this.setState({
      layers,
      placeholders,
      items,
      currentItem: { material: materialAt(items, this.state.selected) },
    });
  };

  simulationSummary = () => {
    const total = (this.state.layers || []).length;
    if (!this.state.simulateRequirements) return LANG['ui_simulation_off'] || 'Simulation off - requirements ignored.';

    const permissions = this.allPermissions();
    const granted = permissions.filter(permission => this.state.permissions[permission]).length;
    const placeholders = this.allPlaceholders().length;
    const strict = this.state.simulateClickRequirements;
    const visible = (this.state.layers || []).filter(layer => {
      if (!this.requirementContextFor(layer).pass) return false;
      if (strict && !this.clickRequirementContextFor(layer).pass) return false;
      return true;
    }).length;
    const strictLabel = strict ? (LANG['ui_strict_suffix'] || ' - click checks on') : '';
    const template = LANG['ui_summary'] || '{granted}/{total} perms - {placeholders} placeholders - {visible}/{count} items pass{strict}';
    return formatString(template, {
      granted,
      total: permissions.length,
      placeholders,
      visible,
      count: total,
      strict: strictLabel,
    });
  };

  requirementEntries = (kind) => {
    const item = this.state.items[this.state.selected];
    const root = item && item[kind];
    if (!root || typeof root !== "object" || Array.isArray(root)) return [];
    const requirements = root.requirements;
    if (!requirements || typeof requirements !== "object" || Array.isArray(requirements)) return [];

    return Object.entries(requirements).map(([key, value]) => ({
      key,
      requirement: value && typeof value === "object" && !Array.isArray(value) ? value : {},
    }));
  };

  requirementCount = () =>
    this.requirementEntries("view_requirement").length +
    this.requirementEntries("click_requirement").length;

  requirementRowStatus = (requirement) => {
    if (!this.state.simulateRequirements) return null;
    return requirementResult(requirement, {
      permissions: this.state.permissions,
      placeholders: this.state.placeholders,
      labels: this.requirementCheckLabels(),
    });
  };

  modifyRequirements = (kind, mutator, applyView = false) => {
    const selected = this.state.items[this.state.selected];
    if (!selected) return;

    this.layerTargets().forEach(item => {
      const root = item[kind] && typeof item[kind] === "object" && !Array.isArray(item[kind])
        ? item[kind]
        : {};
      const requirements = root.requirements && typeof root.requirements === "object" && !Array.isArray(root.requirements)
        ? { ...root.requirements }
        : {};

      const nextRoot = { ...root, requirements };
      mutator(nextRoot.requirements);

      if (Object.keys(nextRoot.requirements).length === 0 && Object.keys(root).length <= 1) {
        delete item[kind];
      } else {
        item[kind] = nextRoot;
      }
    });

    if (applyView) {
      const items = this.state.items;
      const layers = this.syncLayers(items);
      const grid = this.buildView(layers);
      this.setState({
        layers,
        items: grid,
        currentItem: { material: materialAt(grid, this.state.selected) },
      }, this.updateAceFromGrid);
    } else {
      this.setState({ items: this.state.items }, this.updateAceFromGrid);
    }
  };

  addRequirement = (kind) => {
    this.modifyRequirements(kind, requirements => {
      let index = 1;
      while (requirements[`req_${index}`]) index += 1;
      requirements[`req_${index}`] = { type: "has permission", permission: "" };
    }, true);
  };

  removeRequirement = (kind, key) => {
    this.modifyRequirements(kind, requirements => {
      delete requirements[key];
    }, true);
  };

  renameRequirement = (kind, oldKey, newKey) => {
    const clean = String(newKey || "").trim();
    if (!clean || clean === oldKey) return;

    this.modifyRequirements(kind, requirements => {
      if (requirements[clean]) return;
      const entries = Object.entries(requirements).map(([key, value]) => [
        key === oldKey ? clean : key,
        value,
      ]);
      Object.keys(requirements).forEach(key => delete requirements[key]);
      entries.forEach(([key, value]) => {
        requirements[key] = value;
      });
    });
  };

  updateRequirementField = (kind, key, field, value) => {
    this.modifyRequirements(kind, requirements => {
      requirements[key] = { ...(requirements[key] || {}), [field]: value };
    });
  };

  updateRequirementOutput = (kind, key, value) => {
    const trimmed = String(value).trim();
    const parsed = /^-?\d+(\.\d+)?$/.test(trimmed) ? Number(trimmed) : value;
    this.updateRequirementField(kind, key, "output", parsed);
  };

  changeRequirementType = (kind, key, type) => {
    this.modifyRequirements(kind, requirements => {
      const current = requirements[key] || {};
      const next = { type };

      if (isPermissionRequirement(type)) {
        next.permission = current.permission || "";
      } else {
        next.input = current.input || "";
        next.output = current.output !== undefined ? current.output : "";
      }

      Object.keys(current).forEach(field => {
        if (!(field in next) && !["type", "permission", "input", "output"].includes(field)) {
          next[field] = current[field];
        }
      });

      requirements[key] = next;
    }, true);
  };

  applyRequirementView = () => {
    const layers = this.syncLayers();
    const items = this.buildView(layers);
    this.setState({
      layers,
      items,
      currentItem: { material: materialAt(items, this.state.selected) },
    });
  };

  switchInspectorTab = (tab) => {
    if (this.state.inspectorTab === 'requirements' && tab !== 'requirements') {
      this.applyRequirementView();
    }
    this.setState({ inspectorTab: tab });
  };

  renderRequirementRow = (kind, key, requirement) => {
    const type = String(
      requirement.type || (requirement.permission ? "has permission" : ">=")
    ).trim();
    const permissionType = isPermissionRequirement(type);
    const status = this.requirementRowStatus(requirement);
    const failed = status && !status.pass ? status.checks.filter(check => !check.pass) : [];
    const hasUnknown = Boolean(status && status.pass && status.checks.some(check => check.unknown));
    const knownTypes = [...PERMISSION_REQUIREMENT_TYPES, ...COMPARISON_REQUIREMENT_TYPES];

    return (
      <div className={`req-row${status && !status.pass ? " fail" : ""}`} key={key}>
        <div className="req-row-head">
          <input
            className="req-key"
            defaultValue={key}
            key={key}
            title={LANG['ui_requirement_key'] || 'Requirement key'}
            onBlur={event => this.renameRequirement(kind, key, event.target.value)}
          />
          <select
            className="req-type"
            value={type}
            onChange={event => this.changeRequirementType(kind, key, event.target.value)}
          >
            <optgroup label={LANG['ui_permissions_group'] || 'Permissions'}>
              {PERMISSION_REQUIREMENT_TYPES.map(option => (
                <option key={option} value={option}>{requirementTypeLabel(option)}</option>
              ))}
            </optgroup>
            <optgroup label={LANG['ui_comparisons_group'] || 'Comparisons'}>
              {COMPARISON_REQUIREMENT_TYPES.map(option => (
                <option key={option} value={option}>{requirementTypeLabel(option)}</option>
              ))}
            </optgroup>
            {!knownTypes.includes(type) && <option value={type}>{requirementTypeLabel(type)}</option>}
          </select>
          {status && (
            <span
              className={`req-status ${hasUnknown ? 'unknown' : status.pass ? 'ok' : 'fail'}`}
              title={failed.map(check => check.text).join('\n')}
            >
              {hasUnknown
                ? (LANG['ui_unknown'] || 'unknown')
                : status.pass
                  ? (LANG['ui_met'] || 'met')
                  : (LANG['ui_not_met'] || 'not met')}
            </span>
          )}
          <button
            type="button"
            className="req-remove"
            title={LANG['ui_remove_requirement'] || 'Remove requirement'}
            onClick={() => this.removeRequirement(kind, key)}
          >×</button>
        </div>

        {permissionType ? (
          <label className="req-field">
            <span>{LANG['ui_permission'] || 'Permission'}</span>
            <input
              value={requirement.permission || ""}
              placeholder="daily.reward.claimed"
              onChange={event => this.updateRequirementField(kind, key, "permission", event.target.value)}
            />
          </label>
        ) : (
          <div className="req-fields">
            <label className="req-field">
              <span>{LANG['ui_input'] || 'Input'}</span>
              <input
                value={requirement.input === undefined ? "" : requirement.input}
                placeholder="%playerpoints_points%"
                onChange={event => this.updateRequirementField(kind, key, "input", event.target.value)}
              />
            </label>
            <label className="req-field">
              <span>{LANG['ui_output'] || 'Output'}</span>
              <input
                value={requirement.output === undefined ? "" : requirement.output}
                placeholder="50"
                onChange={event => this.updateRequirementOutput(kind, key, event.target.value)}
              />
            </label>
          </div>
        )}

        {failed.length > 0 && (
          <div className="req-checks">
            {failed.map((check, index) => (
              <span key={index}>{check.text}</span>
            ))}
          </div>
        )}
      </div>
    );
  };

  renderRequirementCard = (kind, title, description) => {
    const entries = this.requirementEntries(kind);

    return (
      <div className="req-card">
        <div className="req-card-head">
          <div>
            <div className="req-card-title">{title}</div>
            <div className="req-card-desc">{description}</div>
          </div>
          <button type="button" className="req-add" onClick={() => this.addRequirement(kind)}>
            {LANG['ui_add'] || '+ Add'}
          </button>
        </div>

        {entries.length > 0
          ? entries.map(({ key, requirement }) => this.renderRequirementRow(kind, key, requirement))
          : (
            <div className="req-empty">
              {kind === "view_requirement"
                ? (LANG['ui_no_view_requirement'] || 'No view requirement - the item is always shown.')
                : (LANG['ui_no_click_requirement'] || 'No click requirement - clicking always runs the commands.')}
            </div>
          )}
      </div>
    );
  };

  renderRequirementsPane = () => {
    const item = this.state.items[this.state.selected];
    const isEmpty = !item || Object.keys(item).filter(key => key !== 'id').length === 0;
    if (isEmpty) {
      return <div className="req-empty">{LANG['ui_select_item'] || 'Select an item in the inventory first.'}</div>;
    }

    const placeholders = this.allPlaceholders();

    return (
      <div className="requirements-editor">
        {this.renderRequirementCard(
          "view_requirement",
          LANG['ui_view_requirement'] || 'View requirement',
          LANG['ui_view_requirement_desc'] || 'Controls whether the item is shown (visibility + priority resolution).'
        )}
        {this.renderRequirementCard(
          "click_requirement",
          LANG['ui_click_requirement'] || 'Click requirement',
          LANG['ui_click_requirement_desc'] || 'Controls whether click commands run; enable Enforce click checks in Simulation to preview unaffordable items.'
        )}

        {placeholders.length > 0 && (
          <div className="req-placeholders">
            <span>{LANG['ui_placeholders'] || 'Placeholders'}</span>
            {placeholders.map(placeholder => (
              <button
                type="button"
                key={placeholder}
                className="req-placeholder"
                title={LANG['ui_copy_placeholder'] || 'Copy placeholder'}
                onClick={() => navigator.clipboard && navigator.clipboard.writeText(`%${placeholder}%`)}
              >%{placeholder}%</button>
            ))}
          </div>
        )}

        <div className="req-footer">
          <button type="button" className="req-apply" onClick={this.applyRequirementView}>
            {LANG['ui_re_evaluate'] || 'Re-evaluate view'}
          </button>
          <span>{this.simulationSummary()}</span>
          <span className="req-hint">{LANG['ui_edits_hint'] || 'Edits are saved to YAML immediately; Re-evaluate applies visibility.'}</span>
        </div>
      </div>
    );
  };

  selectedViewPriority = () => {
    const match = /^p:(-?\d+)$/.exec(String(this.state.priorityView || ''));
    return match ? Number(match[1]) : null;
  };

  nextLayerPriority = (slot = this.state.selected) => {
    const layers = (this.state.layers || []).filter(layer => layer.slots.includes(slot));
    if (layers.length === 0) return 0;
    const highest = Math.min(...layers.map(layer => layer.priority));
    return Math.max(0, highest - 1);
  };

  slotLayers = (slot = this.state.selected) => (this.state.layers || [])
    .filter(layer => layer.slots.includes(slot))
    .sort((a, b) => a.priority - b.priority);

  focusLayer = (layer) => {
    const layers = this.syncLayers();
    const view = `p:${layer.priority}`;
    const items = this.buildView(layers, view);
    this.setState({
      layers,
      priorityView: view,
      items,
      currentItem: { material: materialAt(items, this.state.selected) },
    }, this.updateAceFromGrid);
  };

  removeLayer = (key) => {
    const layers = this.syncLayers().filter(layer => layer.key !== key);
    const items = this.buildView(layers);
    this.setState({
      layers,
      items,
      currentItem: { material: materialAt(items, this.state.selected) },
    }, this.updateAceFromGrid);
  };

  addPriorityLayer = () => {
    const selected = this.state.items[this.state.selected];
    if (!selected) return;

    const layers = this.syncLayers();
    const item = {};
    Object.keys(selected).forEach(field => {
      if (['id', 'icon', 'parent', '_layerKey', '_priority', '_requirementMet', '_requirementChecks', '_clickRequirementMet', '_clickRequirementChecks'].includes(field)) return;
      item[field] = JSON.parse(JSON.stringify(selected[field]));
    });
    delete item.slot;
    delete item.slots;

    const viewPriority = this.selectedViewPriority();
    const priority = viewPriority !== null ? viewPriority : 0;
    if (viewPriority !== null) {
      item.priority = viewPriority;
    } else {
      delete item.priority;
    }

    const next = [...layers, {
      key: this.makeLayerKey(),
      priority,
      item,
      slots: [this.state.selected],
    }];

    const items = this.buildView(next, this.state.priorityView);
    this.setState({
      layers: next,
      items,
      currentItem: { material: materialAt(items, this.state.selected) },
    }, this.updateAceFromGrid);
  };

  openNewLayerSearch = () => {
    const selected = this.state.selected;
    this.setState({
      searchMode: 'new-layer',
      showModal: true,
      selected,
      currentItem: { material: this.computedMaterial(selected) },
    });
  };

  renderPriorityPane = () => {
    const item = this.state.items[this.state.selected];
    const isEmpty = !item || Object.keys(item).filter(key => key !== 'id').length === 0;
    if (isEmpty) {
      return <div className="req-empty">{LANG['ui_select_item'] || 'Select an item in the inventory first.'}</div>;
    }

    const layers = this.slotLayers();
    const currentPriority = Number(item.priority) || 0;

    return (
      <div className="priority-editor">
        <div className="priority-card">
          <div className="priority-card-title">{LANG['ui_selected_item'] || 'Selected item'}</div>
          <div className="priority-editor-stepper">
            <button
              type="button"
              className="priority-step"
              title={LANG['ui_higher_priority'] || 'Higher priority (lower number)'}
              onClick={() => this.bumpPriority(-1)}
            >↑</button>
            <input
              type="number"
              min="0"
              name="priority"
              value={currentPriority}
              onChange={this.updateItem}
              onBlur={this.applyRequirementView}
            />
            <button
              type="button"
              className="priority-step"
              title={LANG['ui_lower_priority'] || 'Lower priority (higher number)'}
              onClick={() => this.bumpPriority(1)}
            >↓</button>
            <span className="priority-editor-hint">{LANG['ui_priority_hint_short'] || 'Lower number = higher priority (1 beats 2).'}</span>
          </div>
        </div>

        <div className="priority-card">
          <div className="priority-card-head">
            <div>
              <div className="priority-card-title">{formatString(LANG['ui_layers_on_slot'] || 'Layers on slot {slot}', { slot: this.state.selected })}</div>
              <div className="priority-card-desc">
                {LANG['ui_layers_desc'] || 'The item with the lowest priority number whose view requirement passes is shown to players.'}
              </div>
            </div>
            <div className="priority-actions">
              <button type="button" className="req-add" onClick={this.openNewLayerSearch}>{LANG['ui_new_layer_item'] || '+ New layer item'}</button>
              <button type="button" className="req-apply" onClick={this.addPriorityLayer}>{LANG['ui_duplicate_item'] || 'Duplicate item'}</button>
            </div>
          </div>

          {layers.length === 0
            ? <div className="req-empty">{LANG['ui_no_layers'] || 'No layers on this slot.'}</div>
            : layers.map(layer => {
              const status = this.requirementRowStatus(layer.item.view_requirement || {});
              const isCurrent = layer.key === item._layerKey;
              return (
                <div className={`layer-row${isCurrent ? ' current' : ''}`} key={layer.key}>
                  <span className="layer-priority">{layer.priority}</span>
                  <div className="layer-info">
                    <div className="layer-name">{itemLabel(layer.item)}</div>
                    <div className="layer-meta">{formatString(LANG['ui_slot_meta'] || 'slot {slot}', { slot: this.state.selected })} · {layer.key}</div>
                  </div>
                  {status && (
                    <span className={`req-status ${status.pass ? 'ok' : 'fail'}`}>
                      {status.pass ? (LANG['ui_visible'] || 'visible') : (LANG['ui_hidden'] || 'hidden')}
                    </span>
                  )}
                  <button type="button" className="req-apply" onClick={() => this.focusLayer(layer)}>{LANG['ui_focus'] || 'Focus'}</button>
                  <button type="button" className="req-remove" title={LANG['ui_delete_layer'] || 'Delete layer'} onClick={() => this.removeLayer(layer.key)}>×</button>
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  computedDocument = (layers = this.syncLayers()) => {
    const document = {
      menu_title: this.state.menu_title,
      open_command: this.state.open_command,
    };
    if (this.state.register_command) document.register_command = true;
    document.size = this.state.size;

    const clamped = (layers || []).map(layer => ({
      ...layer,
      slots: layer.slots.filter(slot => slot >= 0 && slot < this.state.size),
    }));
    document.items = layersToItems(clamped, textareaFieldNames());
    return document;
  };

  /** Parse an already-loaded YAML object into priority layers + the resolved grid. */
  loadDocument = (content, itemsData, requestedSize, rawText) => {
    const _fields = fields();
    const inputTextFields = _fields
      .filter(field => field.tagName === 'input' && field.type === 'text')
      .map(field => field.value);

    Object.keys(itemsData || {}).forEach(key => {
      const item = itemsData[key];
      if (!item || typeof item !== 'object') return;
      inputTextFields.forEach(field => {
        if (typeof item[field] === 'string') {
          item[field] = item[field].replace(/\n/g, ' ').trim();
        } else if (Array.isArray(item[field])) {
          item[field] = item[field].join(' ');
        }
      });
    });

    const layers = layersFromItems(itemsData, textareaFieldNames());
    const size = Math.min(sizeForLayers(layers, requestedSize || 54), 54);
    const permissions = {};
    permissionsFromLayers(layers).forEach(permission => {
      permissions[permission] = false;
    });

    const placeholders = {};
    Object.entries(placeholderTypesFromLayers(layers)).forEach(([key, type]) => {
      placeholders[key] = type === 'number' ? 0 : '';
    });

    const context = { permissions, placeholders, labels: this.requirementCheckLabels() };
    const items = buildGrid(
      layers,
      RESOLVED_VIEW,
      size,
      iconForMaterial,
      layer => requirementResult(layer.item && layer.item.view_requirement, context),
      layer => requirementResult(layer.item && layer.item.click_requirement, context),
      false
    );
    this._layerCounter = layers.length;

    this.setState({
      menu_title: content.menu_title || this.state.menu_title || LANG['Menu default title'],
      open_command: content.open_command || this.state.open_command || 'menu',
      register_command: content.register_command === true,
      size,
      layers,
      priorityView: RESOLVED_VIEW,
      inspectorTab: 'item',
      permissions,
      placeholders,
      simulateRequirements: true,
      simulateClickRequirements: false,
      items,
      selected: 0,
      currentItem: { material: materialAt(items, 0) },
      ...(rawText != null ? { aceValue: rawText } : {}),
    });
  };

  setPriorityView = (event) => {
    const view = event.target.value;
    const layers = this.syncLayers();
    const items = this.buildView(layers, view);
    this.setState({
      layers,
      priorityView: view,
      items,
      selected: 0,
      currentItem: { material: materialAt(items, 0) },
    }, this.updateAceFromGrid);
  };

  priorities = () => prioritiesOf(this.state.layers || []);

  layerCount = (priority) =>
    (this.state.layers || []).filter(layer => layer.priority === priority).length;

  bumpPriority = (delta) => {
    const selected = this.state.items[this.state.selected];
    if (!selected) return;

    const current = Number(selected.priority) || 0;
    const next = Math.max(0, current + delta);
    const key = selected._layerKey;

    const layers = this.syncLayers();
    const layer = key ? layers.find(item => item.key === key) : null;
    if (layer) {
      layer.priority = next;
      layer.item.priority = next;
    }

    const items = this.buildView(layers, this.state.priorityView);
    this.setState({
      layers,
      items,
      currentItem: { material: materialAt(items, this.state.selected) },
    }, this.updateAceFromGrid);
  };

  _changeLang = async (e) => {
    await selectLang(e.value);
    this.setState({ currentLang: e.value }, () => {
      if (this.state.layers && this.state.layers.length) {
        // Rebuild the grid on the next tick so the new language labels are used
        // in the stored requirement check texts as well.
        setTimeout(() => this.applyRequirementView(), 0);
      }
    });
  }

  componentDidMount() {
    document.addEventListener('mousedown', this._handleOutsideClick);
    this._changeLang({value: _lang});

    let saved = localStorage.getItem(STATE_KEY);

    if (saved) {
      const old = JSON.parse(saved);

      // Older saved states had no priority layers: rebuild them from the grid.
      if (!Array.isArray(old.layers)) {
        let index = 0;
        const used = new Set();
        const makeKey = () => {
          do {
            index += 1;
          } while (used.has(`item_${index}`));
          used.add(`item_${index}`);
          return `item_${index}`;
        };
        old.layers = layersFromGrid(old.items || [], makeKey);
      }
      if (!old.priorityView) old.priorityView = RESOLVED_VIEW;
      if (!old.permissions || typeof old.permissions !== 'object') old.permissions = {};
      permissionsFromLayers(old.layers).forEach(permission => {
        if (!(permission in old.permissions)) old.permissions[permission] = false;
      });
      if (typeof old.simulateRequirements !== 'boolean') old.simulateRequirements = true;
      if (!old.placeholders || typeof old.placeholders !== 'object') old.placeholders = {};
      Object.entries(placeholderTypesFromLayers(old.layers)).forEach(([key, type]) => {
        if (!(key in old.placeholders)) old.placeholders[key] = type === 'number' ? 0 : '';
      });
      if (typeof old.simulateClickRequirements !== 'boolean') old.simulateClickRequirements = false;

      const savedSize = old.size || (Array.isArray(old.items) ? old.items.length : 54);
      old.size = savedSize;
      const context = { permissions: old.permissions, placeholders: old.placeholders, labels: this.requirementCheckLabels() };
      old.items = buildGrid(
        old.layers,
        old.priorityView,
        savedSize,
        iconForMaterial,
        layer => requirementResult(layer.item && layer.item.view_requirement, context),
        layer => requirementResult(layer.item && layer.item.click_requirement, context),
        old.simulateClickRequirements
      );

      this._layerCounter = old.layers.length;
      // Use the saved aceValue directly — recomputing it here would use
      // stale this.state.menu_title (still default) and show wrong YAML after F5
      this.setState({ ...old });
      this.inputRef.current.value = JSON.stringify(old.yaml, null, 4);
      return;
    }

    let elems = [];
    for (let i = this.state.size; i < this.state.size+9; i += 1) {
      elems.push({
        id: i
      })
    }
    this.setState({
      items: elems,
      size: 9,
      layers: [],
      priorityView: RESOLVED_VIEW,
      permissions: {},
      placeholders: {},
      simulateRequirements: true,
      simulateClickRequirements: false,
      currentItem: {
        material: this.computedMaterial(0)
      },
      aceValue: YAML.dump({
        menu_title: this.state.menu_title,
        open_command: this.state.open_command,
        size: 9,
        items: {},
      }, YAML_DEFAULTS)
    });
  }
  componentWillUnmount() {
    document.removeEventListener('mousedown', this._handleOutsideClick);
  }

  selectedSlot = (id) => {
    this.setState({
      selected: id,
      currentItem: {
        material: this.computedMaterial(id)
      }
    }, () => {
      this.syncSelectionToAce(id);
    });
  }
  openSearch = (id) => {
    this.setState({
      selected: id,
      showModal: true,
      searchMode: 'replace',
      currentItem: {
        material: this.computedMaterial(id)
      }
    }, () => {
      this.syncSelectionToAce(id);
    });
  }
  componentDidUpdate(){
    if (this._timeout) clearTimeout(this._timeout);
    this._timeout = setTimeout(() => {
      localStorage.setItem(STATE_KEY, JSON.stringify(this.state))
    }, 500);
  }

  selectedFromSearch = (itm, obj) => {
    const ar = this.state.items;

    if (itm === 'copy') {
      const source = ar[obj.id] || obj;
      const layers = this.syncLayers();
      const layer = layers.find(item => item.key === source._layerKey);
      if (layer && !layer.slots.includes(this.state.selected)) {
        layer.slots = [...layer.slots, this.state.selected].sort((a, b) => a - b);
      }
      const items = this.buildView(layers, this.state.priorityView);
      this.setState({
        layers,
        items,
        currentItem: { material: materialAt(items, this.state.selected) },
      }, this.updateAceFromGrid);
      this.closeModal();
      return;
    }

    const material = itm.name.replace(/ /g, '_').toUpperCase();
    const selected = this.state.selected;
    const current = ar[selected];

    if (this.state.searchMode === 'new-layer') {
      const layers = this.syncLayers();
      const viewPriority = this.selectedViewPriority();
      const priority = viewPriority !== null ? viewPriority : 0;
      const next = [...layers, {
        key: this.makeLayerKey(),
        priority,
        item: viewPriority !== null ? { material, priority: viewPriority } : { material },
        slots: [selected],
      }];
      const items = this.buildView(next, this.state.priorityView);
      this.setState({
        layers: next,
        items,
        searchMode: 'replace',
        currentItem: { material: materialAt(items, selected) },
      }, this.updateAceFromGrid);
      this.closeModal();
      return;
    }

    if (current && current._layerKey) {
      const layers = this.syncLayers();
      const layer = layers.find(item => item.key === current._layerKey);
      if (layer) layer.item = { ...layer.item, material };
      const items = this.buildView(layers, this.state.priorityView);
      this.setState({
        layers,
        items,
        currentItem: { material: materialAt(items, selected) },
      }, this.updateAceFromGrid);
      this.closeModal();
      return;
    }

    const layers = this.syncLayers();
    const viewPriority = this.selectedViewPriority();
    const priority = viewPriority !== null ? viewPriority : 0;
    const next = [...layers, {
      key: this.makeLayerKey(),
      priority,
      item: viewPriority !== null ? { material, priority: viewPriority } : { material },
      slots: [selected],
    }];
    const items = this.buildView(next, this.state.priorityView);
    this.setState({
      layers: next,
      items,
      currentItem: { material: materialAt(items, selected) },
    }, this.updateAceFromGrid);
    this.closeModal();
  }

  onAceChange = (newValue, isManual = false) => {
    const _setAceError = (msg, line = 0) => {
      if (this.aceRef.current) {
        this.aceRef.current.editor.getSession().setAnnotations([{ row: line, column: 0, text: msg, type: 'error' }]);
      }
    };
    try {
      const content = YAML.load(newValue);
      if (!content || typeof content !== 'object') {
        if (isManual) _setAceError('Invalid YAML: Not an object.');
        return;
      }

      // Try to find items data: either at root or under 'items' key
      let itemsData = content.items || {};
      if (Object.keys(itemsData).length === 0 && !content.menu_title && !content.open_command) {
        // If 'items' is empty, maybe the whole file IS the items object
        itemsData = content;
      }

      const size = content.size || this.state.size || 54;
      const cleanText = sanitizeYamlText(newValue);
      this.loadDocument(content, itemsData, size, cleanText !== newValue ? cleanText : undefined);

    } catch (e) {
      if (isManual) _setAceError(e.message, e.mark ? e.mark.line : 0);
    }
  }

  computedItems = (itemsOverride) => {
    // eslint-disable-next-line
    const stateItems = itemsOverride || this.state.items;
    let items = stateItems.map($ => {
      let _ = Object.assign({}, $);
      const _fields = fields();

      Object.entries(_).forEach((e) => {
        // Old version for supporting string and arrays in textarea
        // if (/\n/.test(e[1])) {
          let index = _fields.findIndex(el => el.value === e[0]);
          if (index > -1 && _fields[index].tagName === 'textarea' && typeof e[1] === 'string') {
            _[e[0]] = e[1].split('\n');
          }
        // }
      });

      if (Object.keys($).length > 2) {
        delete _.icon;
        delete _.id;
        return _;
      }
    });

    let _state = {
      menu_title: this.state.menu_title,
      open_command: this.state.open_command,
    }
    if (this.state.register_command) {
      _state.register_command = true;
    }
    _state.size = this.state.size;
    _state.items = { ...items };
    return _state;
  }
  
  updateAceFromGrid = () => {
    const layers = this.syncLayers();
    this.setState({
      layers,
      aceValue: YAML.dump(this.computedDocument(layers), this.state.yaml)
    });
  }
  handleName = (e) => {
    this.setState({
      menu_title: e.target.value
    }, this.updateAceFromGrid);
  }
  handleopen_command = (e) => {
    this.setState({
      open_command: e.target.value
    }, this.updateAceFromGrid)
  }
  downloadYaml = () => {
    const cmd = (this.state.open_command || 'menu').trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'menu';
    fileDownload(YAML.dump(this.computedDocument(), this.state.yaml), `${cmd}.yml`);
  }
  clearSlot = () => {
    const selected = this.state.items[this.state.selected];
    if (!selected || !selected._layerKey) return;

    const layers = this.syncLayers().map(layer => (
      layer.key === selected._layerKey
        ? { ...layer, slots: layer.slots.filter(slot => slot !== this.state.selected) }
        : layer
    )).filter(layer => layer.slots.length > 0);

    const items = this.buildView(layers, this.state.priorityView);
    this.setState({
      layers,
      items,
      currentItem: { material: materialAt(items, this.state.selected) },
    }, this.updateAceFromGrid);
  }
  changeSize = (e) => {
    if (e.currentTarget.textContent === LANG['button Remove row']) {
      if (this.state.items.length === 9) {
        return;
      }
      const items = this.state.items.slice(0, this.state.items.length - 9);
      const size = this.state.size - 9;
      const selected = this.state.selected >= items.length ? 0 : this.state.selected;
      this.setState({
        items,
        size,
        selected,
        currentItem: { material: materialAt(items, selected) },
      }, this.updateAceFromGrid);
    }
    if (e.currentTarget.textContent === LANG['button Add row']) {
      if (this.state.items.length > 50 ) {
        return;
      }
      let elems = [];
      for (let i = this.state.size; i < this.state.size+9; i += 1) {
        elems.push({
          id: i,
        });
      }
      this.setState({
        items: [...this.state.items, ...elems],
        size: this.state.size + 9,
      }, this.updateAceFromGrid)
    }
  }
  closeModal = () => {
    this.setState({
      showModal: false,
    });
  }
  showExtra = () => {
    this.setState({
      extra: !this.state.extra,
      inspectorTab: 'item',
    });
  }
  resetYaml = (e) => {
    this.setState({
      yaml: YAML_DEFAULTS,
    });
    this.inputRef.current.value = JSON.stringify(YAML_DEFAULTS, null, 4);
    this.setState({
      yamlError: false,
    });
  }
  updateYAMLOpts = (e) => {

    try {
      JSON.parse(e.target.value)

      this.setState({
        yaml: JSON.parse(e.target.value),
      });

      this.setState({
        yamlError: false,
      });
    } catch (error) {
      this.setState({
        yamlError: true,
      });
    }
  }
  toggleYAMLOpts = (e) => {
    this.setState({
      showYAMLOpts: !this.state.showYAMLOpts,
    });
  }
  layerTargets = () => {
    const ar = this.state.items;
    const selected = ar[this.state.selected];
    if (!selected) return [];
    if (selected._layerKey) {
      return ar.filter(item => item && item._layerKey === selected._layerKey);
    }
    return [selected];
  };

  updateItem = (e) => {
    const ar = this.state.items;

    if (!ar[this.state.selected]) {
      return;
    }

    let val;

    switch (e.target.type) {
      case 'number':
        if (e.target.value === '') {
          this.layerTargets().forEach(item => delete item[e.target.name]);
          this.setState({ items: ar }, this.updateAceFromGrid);
          return;
        }
        val = Number(e.target.value);
        break;
      case 'checkbox':
        val = e.target.checked;
        break;
      case 'text':
        val = String(e.target.value);
        break;
      default:
        val = String(e.target.value);
        break;
    }

    this.layerTargets().forEach(item => {
      item[e.target.name] = val;

      if ((e.target.type === 'text' || e.target.type === 'textarea') && val === '') {
        delete item[e.target.name];
      }

      if (e.target.type === 'checkbox' && val === false) {
        delete item[e.target.name];
      }
    });

    this.setState({
      items: ar,
    }, this.updateAceFromGrid);
  }

  insertCommandPrefix = (fieldName, prefix) => {
    const ar = this.state.items;
    if (!ar[this.state.selected]) return;
    this.layerTargets().forEach(item => {
      const current = item[fieldName] || '';
      item[fieldName] = current ? current + '\n' + prefix + ' ' : prefix + ' ';
    });
    this.setState({ items: ar }, this.updateAceFromGrid);
  };

  openGradient = (fieldName, currentValue) => {
    this.setState({ showGradient: true, gradientField: { name: fieldName, initial: currentValue || '' } });
  };

  applyGradient = (value) => {
    const { gradientField } = this.state;
    if (!gradientField) return;

    if (gradientField.name === '__menu_title__') {
      this.setState({ menu_title: value, showGradient: false, gradientField: null }, this.updateAceFromGrid);
      return;
    }

    const ar = this.state.items;
    if (!ar[this.state.selected]) return;
    this.layerTargets().forEach(item => {
      item[gradientField.name] = value;
    });
    this.setState({ items: ar, showGradient: false, gradientField: null }, this.updateAceFromGrid);
  };

  handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = YAML.load(event.target.result);
        if (!content) return;

        let itemsData = content.items || content;
        if (typeof itemsData !== 'object') {
          alert("Invalid YAML structure: 'items' not found.");
          return;
        }

        const size = content.size || 54;
        this.loadDocument(content, itemsData, size, sanitizeYamlText(event.target.result));
      } catch (err) {
        alert("Error loading YAML: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  render() {
    return(
      <div id="main-layout">

        {/* ── LEFT PANEL ── */}
        <div id="left-panel">

          <div className="lang-bar">
            <span>{LANG['Language']}:</span>
            <div className="lang-select-wrap" ref={this.langWrapRef}>
              {(() => {
                const cur = LANGLIST.find(l => l.value === this.state.currentLang) || LANGLIST[0];
                return (
                  <>
                    <button
                      className="lang-current-btn"
                      onClick={() => this.setState(s => ({ langOpen: !s.langOpen }))}
                    >
                      <img src={`https://flagcdn.com/20x15/${cur.flag}.png`} alt={cur.label} width="20" height="15" />
                      <span>{cur.label}</span>
                      <span style={{ fontSize: 10, opacity: 0.6 }}>▾</span>
                    </button>
                    {this.state.langOpen && (
                      <div className="lang-dropdown-list">
                        {LANGLIST.map(l => (
                          <div
                            key={l.value}
                            className={`lang-option${l.value === this.state.currentLang ? ' active' : ''}`}
                            onClick={() => { this._changeLang({ value: l.value }); this.setState({ langOpen: false }); }}
                          >
                            <img src={`https://flagcdn.com/20x15/${l.flag}.png`} alt={l.label} width="20" height="15" />
                            <span>{l.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          <div className="priority-bar">
            <div className="priority-view">
              <span className="priority-view-label">{LANG['ui_priority_view'] || 'Priority view'}</span>
              <select
                className="priority-select"
                value={this.state.priorityView}
                onChange={this.setPriorityView}
              >
                <option value={RESOLVED_VIEW}>{LANG['ui_resolved_view'] || 'Resolved (highest priority)'}</option>
                {this.priorities().map(priority => (
                  <option key={priority} value={`p:${priority}`}>
                    {formatString(LANG['ui_priority_option'] || 'Priority {priority} · {count} items', { priority, count: this.layerCount(priority) })}
                  </option>
                ))}
              </select>
            </div>
            <span className="priority-hint">
              {this.state.priorityView === RESOLVED_VIEW
                ? (LANG['ui_priority_hint_resolved'] || 'Lowest priority number wins each slot (1 beats 2).')
                : (LANG['ui_priority_hint_layer'] || 'Editing this priority layer only; other priorities stay intact.')}
            </span>
            <label className="priority-badge-toggle" title={LANG['ui_numbers_title'] || 'Show priority numbers on inventory slots'}>
              <input
                type="checkbox"
                checked={this.state.showPriorityBadges}
                onChange={() => this.setState(s => ({ showPriorityBadges: !s.showPriorityBadges }))}
              />
              <span>{LANG['ui_numbers'] || 'Numbers'}</span>
            </label>
          </div>

          <div className={`simulation-panel${this.state.simulateRequirements ? '' : ' off'}`}>
            <div className="simulation-head">
              <span className="simulation-title">{LANG['ui_simulation_title'] || 'Requirement simulation'}</span>
              <label className="simulation-toggle">
                <input
                  type="checkbox"
                  checked={this.state.simulateRequirements}
                  onChange={this.toggleSimulation}
                />
                <span>{this.state.simulateRequirements ? (LANG['ui_enabled'] || 'Enabled') : (LANG['ui_off'] || 'Off')}</span>
              </label>
              <label
                className="simulation-toggle"
                title={LANG['ui_enforce_click_title'] || 'When enabled, items whose click requirement fails are hidden in the resolved view too.'}
              >
                <input
                  type="checkbox"
                  checked={this.state.simulateClickRequirements}
                  onChange={this.toggleClickRequirements}
                  disabled={!this.state.simulateRequirements}
                />
                <span>{LANG['ui_enforce_click'] || 'Enforce click requirements'}</span>
              </label>
              <div className="simulation-actions">
                <button type="button" onClick={() => this.setAllPermissions(true)}>{LANG['ui_grant_all'] || 'Grant all'}</button>
                <button type="button" onClick={() => this.setAllPermissions(false)}>{LANG['ui_revoke_all'] || 'Revoke all'}</button>
              </div>
              <span className="simulation-summary">{this.simulationSummary()}</span>
            </div>
            {this.allPermissions().length > 0 ? (
              <div className="permission-chips">
                {this.allPermissions().map(permission => (
                  <label
                    key={permission}
                    className={`permission-chip${this.state.permissions[permission] ? ' granted' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={!!this.state.permissions[permission]}
                      onChange={() => this.togglePermission(permission)}
                      disabled={!this.state.simulateRequirements}
                    />
                    <code>{permission}</code>
                    <span className="permission-count">{this.permissionItemCount(permission)}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="simulation-empty">{LANG['ui_no_permissions'] || 'No permission checks in this menu.'}</div>
            )}
            {this.allPlaceholders().length > 0 && (
              <div className="placeholder-list">
                <span className="placeholder-list-label">{LANG['ui_placeholders'] || 'Placeholders'}</span>
                {this.allPlaceholders().map(key => {
                  const type = this.placeholderTypes()[key] || 'text';
                  const value = this.state.placeholders[key];
                  return (
                    <label className="placeholder-field" key={key}>
                      <code>{key}</code>
                      <span className="placeholder-kind">{type === 'number' ? 'num' : 'text'}</span>
                      <input
                        type="text"
                        inputMode={type === 'number' ? 'decimal' : 'text'}
                        value={value === undefined || value === null ? '' : value}
                        onChange={event => this.setPlaceholder(key, event.target.value)}
                        disabled={!this.state.simulateRequirements}
                        title={`${type} placeholder - enter any value`}
                      />
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="toolbar">
            <button onClick={() => {localStorage.removeItem(STATE_KEY);window.location.reload(false);}}>{LANG['button CLEAR']}</button>
            <button onClick={this.clearSlot}>{LANG['button Clear slot']}</button>
            <button onClick={this.changeSize}>{LANG['button Remove row']}</button>
            <button onClick={this.changeSize}>{LANG['button Add row']}</button>
            <button onClick={this.showExtra}>{this.state.extra ? LANG['button Hide extra'] : LANG['button Show extra']}</button>
            <button onClick={this.openNewLayerSearch}>{LANG['ui_layer_item'] || '+ Layer item'}</button>
          </div>

          <div className="inventory">
            <div id="title">
              <MCText>
                {this.state.menu_title || LANG['Menu empty title']}
              </MCText>
            </div>
            <div className="slotSpace">
              {this.state.items.map((el, i) => (
                <Slot
                  key={el.id + '_inv'}
                  id={el.id}
                  display_name={(Number.isInteger(el.parent) && this.state.items[el.parent]) ? this.state.items[el.parent].display_name : el.display_name}
                  lore={(Number.isInteger(el.parent) && this.state.items[el.parent]) ? this.state.items[el.parent].lore : el.lore}
                  selectedSlot={this.selectedSlot}
                  openSearch={this.openSearch}
                  amount={(Number.isInteger(el.parent) && this.state.items[el.parent]) ? this.state.items[el.parent].amount : el.amount}
                  isSelected={this.state.selected === el.id}
                  icon={(Number.isInteger(el.parent) && this.state.items[el.parent]) ? this.state.items[el.parent].icon : el.icon}
                  material={this.computedMaterial(el.id)}
                  priority={el._priority !== undefined ? el._priority : el.priority}
                  requirementMet={el._requirementMet !== false}
                  requirementChecks={el._requirementChecks || []}
                  clickRequirementMet={el._clickRequirementMet !== false}
                  clickRequirementChecks={el._clickRequirementChecks || []}
                  hasClickRequirement={!!el.click_requirement}
                  simulateRequirements={this.state.simulateRequirements}
                  showPriority={this.state.showPriorityBadges}
                  lang={LANG}
                  enchantments={(Number.isInteger(el.parent) && this.state.items[el.parent]) ? this.state.items[el.parent].enchantments : el.enchantments}
                  hide_enchantments={(Number.isInteger(el.parent) && this.state.items[el.parent]) ? this.state.items[el.parent].hide_enchantments : el.hide_enchantments}
                />
              ))}
            </div>
          </div>

          <div className="inspector-tabs">
            <button
              type="button"
              className={this.state.inspectorTab === 'item' ? 'active' : ''}
              onClick={() => this.switchInspectorTab('item')}
            >{LANG['ui_item_tab'] || 'Item'}</button>
            <button
              type="button"
              className={this.state.inspectorTab === 'requirements' ? 'active' : ''}
              onClick={() => this.switchInspectorTab('requirements')}
            >
              {LANG['ui_requirements_tab'] || 'Requirements'}
              {this.requirementCount() > 0 && <span className="tab-badge">{this.requirementCount()}</span>}
            </button>
            <button
              type="button"
              className={this.state.inspectorTab === 'priority' ? 'active' : ''}
              onClick={() => this.switchInspectorTab('priority')}
            >{LANG['ui_priority_tab'] || 'Priority'}</button>
            <button
              type="button"
              className={this.state.inspectorTab === 'menu' ? 'active' : ''}
              onClick={() => this.switchInspectorTab('menu')}
            >{LANG['ui_menu_tab'] || 'Menu'}</button>
          </div>

          <div className={`info-section inspector-pane${this.state.inspectorTab === 'menu' ? ' active' : ''}`}>
            <div className="value">
              <span>{LANG['menu_title']}:</span>
              <div className="input-row">
                <input type="text" name="menu_title" value={this.state.menu_title} onChange={this.handleName} />
                <button
                  className="gradient-btn"
                  title="Gradient generator"
                  onClick={() => this.openGradient('__menu_title__', this.state.menu_title)}
                >🎨</button>
              </div>
            </div>
            <div className="value">
              <span>{LANG['open_command']}:</span>
              <input type="text" name="open_command" value={this.state.open_command} onChange={this.handleopen_command} />
            </div>
            <div className="value">
              <span>register_command:</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  name="register_command"
                  checked={this.state.register_command}
                  onChange={(e) => this.setState({ register_command: e.target.checked }, this.updateAceFromGrid)}
                />
              </label>
            </div>
          </div>

          <div className={`info-section inspector-pane${this.state.inspectorTab === 'item' ? ' active' : ''}`}>
            {fields().filter(el => el.value !== 'priority').map((el, i) => (
              <div
                key={i}
                className={`value${(!el.extra || this.state.extra) ? '' : ' field-hidden'}`}
              >
                <span>{el.name}:</span>
                {el.value === 'priority' ? (
                  <div className="priority-stepper">
                    <button
                      type="button"
                      className="priority-step"
                      onClick={() => this.bumpPriority(-1)}
                      aria-label="Decrease priority"
                    >−</button>
                    <input
                      type="number"
                      min="0"
                      name="priority"
                      value={(() => {
                        const item = this.state.items[this.state.selected];
                        const value = item ? item.priority : '';
                        return value === undefined || value === null ? '' : value;
                      })()}
                      onChange={this.updateItem}
                    />
                    <button
                      type="button"
                      className="priority-step"
                      onClick={() => this.bumpPriority(1)}
                      aria-label="Increase priority"
                    >+</button>
                  </div>
                ) : el.gradient ? (
                  <div className="input-row">
                    <el.tagName
                      value={this.state.items[this.state.selected] ? this.state.items[this.state.selected][el.value] || '' : ''}
                      onChange={this.updateItem}
                      type={el.type}
                      name={el.value}
                    />
                    <button
                      className="gradient-btn"
                      title="Gradient generator"
                      onClick={() => this.openGradient(
                        el.value,
                        this.state.items[this.state.selected] ? this.state.items[this.state.selected][el.value] || '' : ''
                      )}
                    >🎨</button>
                  </div>
                ) : el.commands ? (
                  <div className="cmd-field" ref={this.state.cmdTagsOpen === el.value ? this.cmdTagsRef : null}>
                    <div className="cmd-chips">
                      {['[player]', '[console]', '[message]'].map(prefix => (
                        <button key={prefix} className="cmd-chip" onClick={() => this.insertCommandPrefix(el.value, prefix)}>
                          {prefix}
                        </button>
                      ))}
                      <button
                        className={`cmd-chip cmd-tags-toggle${this.state.cmdTagsOpen === el.value ? ' active' : ''}`}
                        onClick={() => this.setState(s => ({ cmdTagsOpen: s.cmdTagsOpen === el.value ? null : el.value }))}
                      >
                        {LANG['cmd_tags_btn'] || 'Tagy ▾'}
                      </button>
                    </div>
                    {this.state.cmdTagsOpen === el.value && (
                      <div className="cmd-tags-dropdown">
                        {CMD_TAGS.map(t => (
                          <div
                            key={t.tag}
                            className="cmd-tags-row"
                            onClick={() => { this.insertCommandPrefix(el.value, t.tag); this.setState({ cmdTagsOpen: null }); }}
                          >
                            <span className="cmd-tags-tag">{t.tag}</span>
                            <span className="cmd-tags-desc">{LANG[t.descKey] || t.tag}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <textarea
                      value={this.state.items[this.state.selected] ? this.state.items[this.state.selected][el.value] || '' : ''}
                      onChange={this.updateItem}
                      name={el.value}
                    />
                  </div>
                ) : (
                  <el.tagName
                    {...(el.type === 'checkbox'
                      ? { checked: this.state.items[this.state.selected] ? !!this.state.items[this.state.selected][el.value] : false }
                      : { value: this.state.items[this.state.selected] ? this.state.items[this.state.selected][el.value] || '' : '' }
                    )}
                    onChange={this.updateItem}
                    type={el.type}
                    name={el.value}
                    {...(el.min !== undefined ? { min: el.min } : {})}
                    {...(el.max !== undefined ? { max: el.max } : {})}
                  />
                )}
              </div>
            ))}
          </div>

          <div className={`info-section inspector-pane${this.state.inspectorTab === 'requirements' ? ' active' : ''}`}>
            {this.renderRequirementsPane()}
          </div>

          <div className={`info-section inspector-pane${this.state.inspectorTab === 'priority' ? ' active' : ''}`}>
            {this.renderPriorityPane()}
          </div>

        </div>

        {/* ── RIGHT PANEL (YAML) ── */}
        <div id="output" className={this.state.extra ? "expanded-output" : ""}>
          <button onClick={this.toggleYAMLOpts} className="download">{LANG['button YAML config']}</button>
          <div style={{
            display: this.state.showYAMLOpts ? 'block' : 'none'
          }}>
            <div
              style={{
                color: '#f87171',
                fontSize: '13px',
                display: this.state.yamlError ? 'block' : 'none'
              }}
            >JSON error, fix config</div>
            <div
              style={{
                fontSize: '13px',
                marginBottom: '6px',
              }}
            ><a target='_blank' rel='noopener noreferrer' href="https://github.com/nodeca/js-yaml#dump-object---options-">Options description</a></div>
            <textarea
              className='yamlOpts'
              onChange={this.updateYAMLOpts}
              ref={this.inputRef}
              defaultValue={JSON.stringify(this.state.yaml, null, 4)}
            ></textarea>
            <button className="download" onClick={this.resetYaml}>{LANG['button Reset YAML']}</button>
          </div>
          <button className="download" onClick={this.downloadYaml}>{LANG['button Download']}</button>
          <div className="upload-btn-wrapper">
            <button className="download">{LANG['button Upload'] || 'Upload'}</button>
            <input type="file" name="myfile" accept=".yml,.yaml" onChange={this.handleUpload} />
          </div>
          <button className="download" onClick={() => this.onAceChange(this.state.aceValue, true)}>{LANG['button Load YAML'] || 'Load from Editor'}</button>
          <AceEditor
            mode="yaml"
            theme="twilight"
            ref={this.aceRef}
            readOnly={false}
            onLoad={(editor) => {
              editor.getSession().on('change', () => {
                const val = editor.getValue();
                const annotations = [];
                const testLines = val.split('\n');
                let iter = 0;
                while (iter++ < 20) {
                  try {
                    YAML.load(testLines.join('\n'));
                    break;
                  } catch (e) {
                    const line = e.mark ? e.mark.line : 0;
                    if (annotations.some(a => a.row === line)) break;
                    annotations.push({ row: line, column: e.mark ? e.mark.column : 0, text: e.reason || e.message, type: 'error' });
                    if (line < testLines.length) testLines[line] = '';
                    else break;
                  }
                }
                editor.getSession().setAnnotations(annotations);
              });
            }}
            onChange={(val) => this.setState({ aceValue: val })}
            height={this.state.extra ? "calc(100vh - 220px)" : "calc(100vh - 220px)"}
            width="100%"
            value={this.state.aceValue}
            setOptions={{
              useWorker: false,
              fontSize: 13,
            }}
            />
        </div>

        <Modal
          isOpen={this.state.showModal}
          contentLabel="Minimal Modal Example"
          style={customStyles}
          shouldCloseOnOverlayClick={true}
          shouldCloseOnEsc={true}
          onRequestClose={this.closeModal}
        >
           <Search
             selectedFromSearch={this.selectedFromSearch}
             title={this.state.searchMode === 'new-layer' ? (LANG['ui_search_new_layer'] || 'Search items for new priority layer') : LANG['Search items']}
           />
         <br />
         {LANG['Your configured items']}
         <br /><br />
         <div style={{
           display: 'flex',
           flexWrap: 'wrap'
           }}>
             {this.state.items.filter(el => el.material).map((el, i) => (
               <Slot
                 selectedSlot={() => this.selectedFromSearch('copy', el)}
                 openSearch={() => this.selectedFromSearch('copy', el)}
                 key={el.id + '_modal'}
                 id={el.id}
                 amount={Number.isInteger(el.parent) ? this.state.items[el.parent].amount : el.amount}
                 icon={Number.isInteger(el.parent) ? this.state.items[el.parent].icon : el.icon}
                 material={this.computedMaterial(el.id)}
                 enchantments={el.enchantments}
                 hide_enchantments={el.hide_enchantments}
               />
             ))}
           </div>
       </Modal>

        <GradientModal
          isOpen={this.state.showGradient}
          onClose={() => this.setState({ showGradient: false, gradientField: null })}
          onApply={this.applyGradient}
          fieldName={this.state.gradientField ? this.state.gradientField.name : ''}
          initialText={this.state.gradientField ? this.state.gradientField.initial : ''}
          lang={LANG}
        />

      </div>
    )
  }

}
