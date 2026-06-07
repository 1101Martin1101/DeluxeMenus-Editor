import './App.css';
import { MCText } from './mcparse';
import { Slot } from './slot';
import { Search, allItemsList } from './search';
import { GradientModal } from './gradient';
import React, { Component } from 'react';
import AceEditor from 'react-ace';
import YAML from 'js-yaml';
import Modal from 'react-modal';
import _LANG from './lang/english';
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

let LANG = _LANG;
const _lang = localStorage.getItem('lang') || 'english';

let selectLang = async (lang) => {
  if (lang && LANGLIST.some(l => l.value === lang)) {
    await import(`./lang/${lang}`).then(res => {
      LANG = res.default;
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
    background            : '#1e293b',
    border                : '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius          : '12px',
    color                 : '#f8fafc',
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
    extra: true,
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

  _changeLang = async (e) => {
    await selectLang(e.value);
    this.setState({ currentLang: e.value });
  }

  componentDidMount() {
    document.addEventListener('mousedown', this._handleOutsideClick);
    this._changeLang({value: _lang});

    let saved = localStorage.getItem('state');

    if (saved) {
      const old = JSON.parse(saved);
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
      currentItem: {
        material: this.computedMaterial(0)
      },
      aceValue: YAML.dump(this.computedItems(elems), YAML_DEFAULTS)
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
      localStorage.setItem('state', JSON.stringify(this.state))
    }, 500);
  }

  selectedHead = (itm) => {
    let ar = this.state.items;
    ar[this.state.selected] = {
      id: this.state.selected,
      icon: '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',
    }
    this.setState({
      items: ar,
    })
  }
  selectedFromSearch = (itm, obj) => {
    let ar = this.state.items;
    if (itm === 'copy') {
      let parent = typeof obj.parent === 'number' ? obj.parent : obj.id;
      if (typeof ar[parent].slot === 'number') {
        delete ar[parent].slot;
        ar[parent].slots = [parent];
      }

      ar[parent].slots = [...ar[parent].slots, this.state.selected];

      ar[this.state.selected] = {
        id: this.state.selected,
        parent,
      }
    } else {
      ar[this.state.selected] = {
        id: this.state.selected,
        icon: itm.icon,
        material: itm.name.replace(/ /g, '_').toUpperCase(),
        slot: this.state.selected,
      }
    }
    this.setState({
      items: ar,
      currentItem: {
        material: this.computedMaterial(this.state.selected)
      },
      aceValue: YAML.dump(this.computedItems(ar), this.state.yaml)
    });
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

      let size = content.size || this.state.size || 54;
      
      // Auto-expand size if needed
      Object.keys(itemsData).forEach(key => {
        const item = itemsData[key];
        if (!item || typeof item !== 'object') return;
        if (typeof item.slot === 'number') size = Math.max(size, item.slot + 1);
        else if (Array.isArray(item.slots)) size = Math.max(size, Math.max(...item.slots) + 1);
        else if (typeof item.slot === 'string' && item.slot.includes('-')) {
          const [start, end] = item.slot.split('-').map(Number);
          size = Math.max(size, end + 1);
        }
      });
      size = Math.min(Math.ceil(size / 9) * 9, 54);
      
      let newItems = [];
      for (let i = 0; i < size; i++) {
        newItems.push({ id: i });
      }

      const _fields = fields();
      const textAreaFields = _fields.filter(f => f.tagName === 'textarea').map(f => f.value);
      const inputTextFields = _fields.filter(f => f.tagName === 'input' && f.type === 'text').map(f => f.value);

      Object.keys(itemsData).forEach(key => {
        const item = itemsData[key];
        if (!item || typeof item !== 'object') return;

        textAreaFields.forEach(tf => {
          if (Array.isArray(item[tf])) {
            item[tf] = item[tf].join('\n');
          }
        });

        // Input fields (e.g. display_name) must be single-line — strip newlines
        inputTextFields.forEach(f => {
          if (typeof item[f] === 'string') {
            item[f] = item[f].replace(/\n/g, ' ').trim();
          } else if (Array.isArray(item[f])) {
            item[f] = item[f].join(' ');
          }
        });

        // Ensure key itself is treated as a slot index if it's numeric
        let slots = [];
        if (!isNaN(key)) slots = [Number(key)];

        // But prefer explicit slot/slots property if present
        if (typeof item.slot === 'number') slots = [item.slot];
        else if (Array.isArray(item.slots)) slots = item.slots;
        else if (typeof item.slot === 'string' && item.slot.includes('-')) {
          const [start, end] = item.slot.split('-').map(Number);
          for (let s = start; s <= end; s++) slots.push(s);
        }

        if (slots.length > 0) {
          let icon = undefined;
          if (item.material) {
            const matString = String(item.material);
            if (matString.toLowerCase().startsWith('basehead-') || matString.toLowerCase().startsWith('head-')) {
              icon = `${process.env.PUBLIC_URL}/items/player_head.png`;
            } else {
              icon = `${process.env.PUBLIC_URL}/items/${matString.toLowerCase()}.png`;
            }
          }

          slots.forEach((s, idx) => {
            if (s < size && newItems[s]) {
              newItems[s] = { ...item, id: s, parent: idx === 0 ? undefined : slots[0], icon: icon || item.icon };
            }
          });
        }
      });

      this.setState({
        menu_title: content.menu_title || this.state.menu_title || LANG['Menu default title'],
        open_command: content.open_command || this.state.open_command || 'menu',
        register_command: content.register_command === true,
        size: size,
        items: newItems
      });

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
    this.setState({
      aceValue: YAML.dump(this.computedItems(), this.state.yaml)
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
    fileDownload(YAML.dump(this.computedItems(), this.state.yaml), `${cmd}.yml`);
  }
  clearSlot = () => {
    let ar = this.state.items;

    ar[this.state.selected] = {id: this.state.selected};

    for (let i = 0; i < ar.length; i += 1) {
      if (typeof ar[i].slots !== 'undefined' && ar[i].slots.includes(this.state.selected)) {
        let index = ar[i].slots.indexOf(this.state.selected);

        ar[i].slots.splice(index, 1);

        if (ar[i].slots.length === 1) {
          ar[i].slot = ar[i].slots[0];
          delete ar[i].slots;
        }
      }
    }

    this.setState({
      items: ar,
    }, this.updateAceFromGrid);
  }
  changeSize = (e) => {
    if (e.currentTarget.textContent === LANG['button Remove row']) {
      if (this.state.items.length === 9) {
        return;
      }
      this.setState({
        items: this.state.items.slice(0, this.state.items.length-9),
        size: this.state.size-9
      });
      if (this.state.selected > this.state.items.length-10) {
        this.setState({
          selected: 0
        })
      }
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
  updateItem = (e) => {
    let ar = this.state.items;

    if (!ar[this.state.selected]) {
      return;
    }

    let val;

    switch (e.target.type) {
      case 'number':
        if (e.target.value === '') {
          delete ar[this.state.selected][e.target.name];
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

    ar[this.state.selected][e.target.name] = val;

    if ((e.target.type === 'text' || e.target.type === 'textarea') && val === '') {
      delete ar[this.state.selected][e.target.name];
    }

    if (e.target.type === 'checkbox' && val === false) {
      delete ar[this.state.selected][e.target.name];
    }

    this.setState({
      items: ar,
    }, this.updateAceFromGrid);
  }

  insertCommandPrefix = (fieldName, prefix) => {
    const ar = [...this.state.items];
    if (!ar[this.state.selected]) return;
    const current = ar[this.state.selected][fieldName] || '';
    ar[this.state.selected][fieldName] = current ? current + '\n' + prefix + ' ' : prefix + ' ';
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

    const ar = [...this.state.items];
    if (!ar[this.state.selected]) return;
    ar[this.state.selected][gradientField.name] = value;
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

        let newItems = [];
        let size = content.size || 54;
        
        // Find maximum slot used to dynamically adjust size if needed
        Object.keys(itemsData).forEach(key => {
          const item = itemsData[key];
          if (!item || typeof item !== 'object') return;
          if (typeof item.slot === 'number') size = Math.max(size, item.slot + 1);
          else if (Array.isArray(item.slots)) size = Math.max(size, Math.max(...item.slots) + 1);
          else if (typeof item.slot === 'string' && item.slot.includes('-')) {
            // eslint-disable-next-line
            const [start, end] = item.slot.split('-').map(Number);
            size = Math.max(size, end + 1);
          }
        });

        // Ensure size is multiple of 9, max 54
        size = Math.min(Math.ceil(size / 9) * 9, 54);

        for(let i=0; i<size; i++) {
          newItems.push({id: i});
        }

        const _fields = fields();
        const textAreaFields = _fields.filter(f => f.tagName === 'textarea').map(f => f.value);

        Object.keys(itemsData).forEach(key => {
          const item = itemsData[key];
          if (!item || typeof item !== 'object') return;

          textAreaFields.forEach(tf => {
            if (Array.isArray(item[tf])) {
              item[tf] = item[tf].join('\n');
            }
          });

          let slots = [];
          if (typeof item.slot === 'number') slots = [item.slot];
          else if (Array.isArray(item.slots)) slots = item.slots;
          else if (typeof item.slot === 'string' && item.slot.includes('-')) {
            const [start, end] = item.slot.split('-').map(Number);
            for (let s = start; s <= end; s++) slots.push(s);
          }

          if (slots.length > 0) {
            let icon = undefined;
            if (item.material) {
              const matString = String(item.material);
              if (matString.toLowerCase().startsWith('basehead-') || matString.toLowerCase().startsWith('head-')) {
                icon = `${process.env.PUBLIC_URL}/items/player_head.png`;
              } else {
                icon = `${process.env.PUBLIC_URL}/items/${matString.toLowerCase()}.png`;
              }
            }

            slots.forEach((s, idx) => {
              if (s < size && newItems[s]) {
                newItems[s] = { ...item, id: s, parent: idx === 0 ? undefined : slots[0], icon: icon || item.icon };
              }
            });
          }
        });

        this.setState({
          menu_title: content.menu_title || LANG['Menu default title'],
          open_command: content.open_command || 'menu',
          register_command: content.register_command === true,
          size: size,
          items: newItems,
          selected: 0,
          aceValue: event.target.result
        });
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

          <div className="toolbar">
            <button onClick={() => {localStorage.clear();window.location.reload(false);}}>{LANG['button CLEAR']}</button>
            <button onClick={this.clearSlot}>{LANG['button Clear slot']}</button>
            <button onClick={this.changeSize}>{LANG['button Remove row']}</button>
            <button onClick={this.changeSize}>{LANG['button Add row']}</button>
            <button onClick={this.showExtra}>{this.state.extra ? LANG['button Hide extra'] : LANG['button Show extra']}</button>
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
                />
              ))}
            </div>
          </div>

          <div className="info-section">
            <div className="section-header">{LANG['Menu info']}</div>
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

          <div className="info-section">
            <div className="section-header">{LANG['Item info']}</div>
            {fields().map((el, i) => (
              <div
                key={i}
                className={`value${(!el.extra || this.state.extra) ? '' : ' field-hidden'}`}
              >
                <span>{el.name}:</span>
                {el.gradient ? (
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
             title={LANG['Search items']}
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
