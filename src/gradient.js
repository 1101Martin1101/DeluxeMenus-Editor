import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import Modal from 'react-modal';
import { MCText } from './mcparse';
import { HexColorPicker } from 'react-colorful';

// ── Local gradient engine (no external API needed) ──────────────────────────

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function toHex2(n) {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
}

function interpolateColor(stops, pos) {
  // stops sorted by pos, each { hex, pos }
  let left = stops[0];
  let right = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (pos >= stops[i].pos && pos <= stops[i + 1].pos) {
      left = stops[i];
      right = stops[i + 1];
      break;
    }
  }
  const range = right.pos - left.pos;
  const t = range === 0 ? 0 : (pos - left.pos) / range;
  const [r1, g1, b1] = hexToRgb(left.hex);
  const [r2, g2, b2] = hexToRgb(right.hex);
  return [r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t];
}

function generateGradientLine(line, colors, fmtCodes, prefix) {
  if (!line) return '';
  const chars = [...line];
  if (colors.length === 1) {
    return prefix + `&#${colors[0].replace('#', '')}${fmtCodes}` + chars.join('');
  }
  const stops = colors.map((hex, i) => ({
    hex,
    pos: Math.round((i / (colors.length - 1)) * 100),
  }));
  const n = chars.length;
  return prefix + chars.map((c, i) => {
    const pos = n === 1 ? 0 : (i / (n - 1)) * 100;
    const [r, g, b] = interpolateColor(stops, pos);
    return `&#${toHex2(r)}${toHex2(g)}${toHex2(b)}${fmtCodes}${c}`;
  }).join('');
}

export function generateGradient({ text, colors, bold, italic, strikethrough, underline, obfuscated, reset }) {
  if (!text) return text;
  const fmtCodes = [
    bold && '&l',
    italic && '&o',
    strikethrough && '&m',
    underline && '&n',
    obfuscated && '&k',
  ].filter(Boolean).join('');
  const prefix = reset ? '&r' : '';
  // Each line gets its own gradient
  return text.split('\n').map(line => generateGradientLine(line, colors, fmtCodes, prefix)).join('\n');
}

// ────────────────────────────────────────────────────────────────────────────

const gradientStyles = {
  content: {
    width: '560px',
    maxHeight: '92vh',
    overflowY: 'auto',
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    background: '#1e293b',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: '#f8fafc',
    padding: '22px',
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 1100,
  }
};

const LABEL = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 1,
  color: '#38bdf8',
  marginBottom: 6,
  display: 'block',
};

// ── Minecraft default color palette ─────────────────────────────────────────
const MC_COLORS = [
  { code: '§0', name: 'Black',        hex: '#000000' },
  { code: '§1', name: 'Dark Blue',    hex: '#0000aa' },
  { code: '§2', name: 'Dark Green',   hex: '#00aa00' },
  { code: '§3', name: 'Dark Aqua',    hex: '#00aaaa' },
  { code: '§4', name: 'Dark Red',     hex: '#aa0000' },
  { code: '§5', name: 'Dark Purple',  hex: '#aa00aa' },
  { code: '§6', name: 'Gold',         hex: '#ffaa00' },
  { code: '§7', name: 'Gray',         hex: '#aaaaaa' },
  { code: '§8', name: 'Dark Gray',    hex: '#555555' },
  { code: '§9', name: 'Blue',         hex: '#5555ff' },
  { code: '§a', name: 'Lime',         hex: '#55ff55' },
  { code: '§b', name: 'Aqua',         hex: '#55ffff' },
  { code: '§c', name: 'Red',          hex: '#ff5555' },
  { code: '§d', name: 'Light Purple', hex: '#ff55ff' },
  { code: '§e', name: 'Yellow',       hex: '#ffff55' },
  { code: '§f', name: 'White',        hex: '#ffffff' },
];

export class GradientModal extends Component {
  state = {
    text: '',
    colors: ['#54daf4', '#545eb6'],
    bold: false,
    italic: false,
    strikethrough: false,
    underline: false,
    obfuscated: false,
    reset: false,
    output: '',
    hexInputs: ['#54daf4', '#545eb6'],
    activeColor: 0,
    pickerPos: null,
  };

  swatchRefs = {};
  pickerPopupRef = React.createRef();

  componentDidMount() {
    document.addEventListener('mousedown', this.handleDocClick);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleDocClick);
  }

  handleDocClick = (e) => {
    if (!this.pickerPopupRef.current) return;
    if (this.pickerPopupRef.current.contains(e.target)) return;
    const onSwatch = Object.values(this.swatchRefs).some(r => r && r.contains(e.target));
    if (!onSwatch) this.setState({ pickerPos: null });
  };

  componentDidUpdate(prev) {
    if (!prev.isOpen && this.props.isOpen && this.props.initialText) {
      const c = this.state.colors;
      this.setState({ text: this.props.initialText, output: '', hexInputs: [...c] });
    }
  }

  addColor = (hex) => {
    const c = hex || '#ffffff';
    this.setState(s => ({
      colors: [...s.colors, c],
      hexInputs: [...s.hexInputs, c],
      activeColor: s.colors.length,
      output: '',
    }));
  };

  removeColor = (i) => {
    this.setState(s => {
      const colors = s.colors.filter((_, idx) => idx !== i);
      const hexInputs = s.hexInputs.filter((_, idx) => idx !== i);
      return { colors, hexInputs, activeColor: Math.min(s.activeColor, colors.length - 1), output: '' };
    });
  };

  moveColor = (i, dir) => {
    this.setState(s => {
      const colors = [...s.colors];
      const hexInputs = [...s.hexInputs];
      const j = i + dir;
      if (j < 0 || j >= colors.length) return null;
      [colors[i], colors[j]] = [colors[j], colors[i]];
      [hexInputs[i], hexInputs[j]] = [hexInputs[j], hexInputs[i]];
      return { colors, hexInputs, activeColor: j, output: '' };
    });
  };

  updateColor = (i, val) => {
    this.setState(s => {
      const colors = [...s.colors];
      const hexInputs = [...s.hexInputs];
      colors[i] = val;
      hexInputs[i] = val;
      return { colors, hexInputs, output: '' };
    });
  };

  updateHexInput = (i, raw) => {
    this.setState(s => {
      const hexInputs = [...s.hexInputs];
      hexInputs[i] = raw;
      // Apply only if valid 6-char hex
      const clean = raw.replace(/[^#0-9a-fA-F]/g, '');
      const full = clean.startsWith('#') ? clean : '#' + clean;
      const colors = [...s.colors];
      if (/^#[0-9a-fA-F]{6}$/.test(full)) {
        colors[i] = full.toLowerCase();
        return { hexInputs, colors, output: '' };
      }
      return { hexInputs };
    });
  };

  applyMCColor = (hex) => {
    const { activeColor, colors } = this.state;
    if (activeColor < colors.length) {
      this.updateColor(activeColor, hex);
    } else {
      this.addColor(hex);
    }
  };

  generate = () => {
    const { text, colors, bold, italic, strikethrough, underline, obfuscated, reset } = this.state;
    if (!text.trim() || colors.length < 1) return;
    const output = generateGradient({ text, colors, bold, italic, strikethrough, underline, obfuscated, reset });
    this.setState({ output });
  };

  apply = () => {
    if (this.state.output && this.props.onApply) {
      this.props.onApply(this.state.output);
    }
    this.props.onClose();
  };

  render() {
    const { isOpen, onClose, fieldName, lang } = this.props;
    const L = lang || {};
    const { text, colors, output, hexInputs, activeColor } = this.state;

    const fmtToggle = (key) => (e) => this.setState({ [key]: e.target.checked, output: '' });

    const FMT_OPTIONS = [
      { key: 'bold',          label: L['gradient_bold']          || 'Bold',          style: { fontWeight: 'bold' } },
      { key: 'italic',        label: L['gradient_italic']        || 'Italic',        style: { fontStyle: 'italic' } },
      { key: 'strikethrough', label: L['gradient_strikethrough'] || 'Strikethrough', style: { textDecoration: 'line-through' } },
      { key: 'underline',     label: L['gradient_underline']     || 'Underline',     style: { textDecoration: 'underline' } },
      { key: 'obfuscated',    label: L['gradient_obfuscated']    || 'Obfuscated',    style: { filter: 'blur(2px)' } },
      { key: 'reset',         label: L['gradient_reset']         || 'Reset',         style: { opacity: 0.6 } },
    ];

    // Live gradient bar
    const gradientCSS = colors.length === 1
      ? colors[0]
      : `linear-gradient(to right, ${colors.join(', ')})`;

    return (
      <Modal isOpen={isOpen} onRequestClose={onClose} style={gradientStyles}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontWeight: 700, fontSize: 15 }}>🎨 {L['gradient_title'] || 'Gradient Generator'}</span>
          {fieldName && <span style={{ fontSize: 12, color: '#94a3b8' }}>→ {fieldName}</span>}
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>✕</button>
        </div>

        {/* Text input */}
        <label style={LABEL}>{L['gradient_text'] || 'Text'}</label>
        <textarea
          rows={2}
          value={text}
          onChange={e => this.setState({ text: e.target.value, output: '' })}
          placeholder={L['gradient_placeholder'] || 'Enter text...'}
          style={{ width: '100%', marginBottom: 12, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', fontSize: 13, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: '#f8fafc', padding: '7px 10px' }}
        />

        {/* Live gradient bar */}
        <div style={{
          height: 14,
          borderRadius: 7,
          background: gradientCSS,
          marginBottom: 14,
          border: '1px solid rgba(255,255,255,0.1)',
        }} />

        {/* Color stops */}
        <label style={LABEL}>{L['gradient_colors'] || 'Color Stops'}</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
          {colors.map((c, i) => (
            <div
              key={i}
              onClick={() => this.setState({ activeColor: i })}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: activeColor === i ? 'rgba(56,189,248,0.12)' : 'rgba(0,0,0,0.2)',
                border: `1px solid ${activeColor === i ? 'rgba(56,189,248,0.35)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 8, padding: '5px 8px', cursor: 'pointer',
              }}
            >
              {/* Color swatch — click to open popup picker */}
              <div
                ref={el => { this.swatchRefs[i] = el; }}
                style={{
                  width: 32, height: 32, borderRadius: 7,
                  background: c,
                  border: `2px solid ${activeColor === i ? '#38bdf8' : 'rgba(255,255,255,0.25)'}`,
                  cursor: 'pointer',
                  boxShadow: activeColor === i ? '0 0 0 2px #38bdf8' : '0 2px 6px rgba(0,0,0,0.4)',
                  flexShrink: 0,
                  transition: 'box-shadow 0.15s',
                }}
                onClick={e => {
                  e.stopPropagation();
                  const rect = this.swatchRefs[i] ? this.swatchRefs[i].getBoundingClientRect() : null;
                  if (!rect) return;
                  const pickerW = 290;
                  const left = Math.min(rect.left, window.innerWidth - pickerW - 8);
                  this.setState({ activeColor: i, pickerPos: { top: rect.bottom + 8, left } });
                }}
              />

              {/* Hex text input */}
              <input
                type="text"
                value={hexInputs[i] !== undefined ? hexInputs[i].toUpperCase() : c.toUpperCase()}
                onChange={e => this.updateHexInput(i, e.target.value)}
                onClick={e => {
                  e.stopPropagation();
                  const rect = this.swatchRefs[i] ? this.swatchRefs[i].getBoundingClientRect() : null;
                  if (!rect) return;
                  const pickerW = 290;
                  const left = Math.min(rect.left, window.innerWidth - pickerW - 8);
                  this.setState({ activeColor: i, pickerPos: { top: rect.bottom + 8, left } });
                }}
                maxLength={7}
                style={{
                  flex: 1, fontFamily: 'monospace', fontSize: 13, letterSpacing: 1,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 6, color: '#f8fafc', padding: '4px 8px',
                }}
              />

              {/* Stop index label */}
              <span style={{ fontSize: 10, color: '#64748b', minWidth: 16, textAlign: 'center', fontWeight: 600 }}>{i + 1}</span>

              {/* Move up */}
              <button
                onClick={e => { e.stopPropagation(); this.moveColor(i, -1); }}
                disabled={i === 0}
                title="Move up"
                className="gstop-btn"
              >↑</button>
              {/* Move down */}
              <button
                onClick={e => { e.stopPropagation(); this.moveColor(i, 1); }}
                disabled={i === colors.length - 1}
                title="Move down"
                className="gstop-btn"
              >↓</button>
              {/* Remove */}
              {colors.length > 1 && (
                <button
                  onClick={e => { e.stopPropagation(); this.removeColor(i); }}
                  title="Remove"
                  className="gstop-btn gstop-remove"
                >✕</button>
              )}
            </div>
          ))}
        </div>

        {/* Portal popup color picker */}
        {this.state.pickerPos && colors[activeColor] && ReactDOM.createPortal(
          <div
            ref={this.pickerPopupRef}
            style={{
              position: 'fixed',
              top: this.state.pickerPos.top,
              left: this.state.pickerPos.left,
              zIndex: 9999,
              background: '#1e293b',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12,
              padding: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
              width: 290,
            }}
          >
            <HexColorPicker
              color={colors[activeColor]}
              onChange={hex => this.updateColor(activeColor, hex)}
              style={{ width: '100%' }}
            />
            {/* RGB inputs with custom +/- buttons */}
            <div style={{ display: 'flex', gap: 5, marginTop: 10, alignItems: 'flex-end' }}>
              {['R', 'G', 'B'].map((ch, ci) => {
                const rgb = hexToRgb(colors[activeColor]);
                const val = rgb[ci];
                const setVal = v => {
                  const n = hexToRgb(colors[activeColor]);
                  n[ci] = Math.max(0, Math.min(255, v));
                  this.updateColor(activeColor, `#${toHex2(n[0])}${toHex2(n[1])}${toHex2(n[2])}`);
                };
                return (
                  <div key={ch} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 0 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', width: '100%',
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.13)',
                      borderRadius: 7, overflow: 'hidden',
                    }}>
                      <button onClick={() => setVal(val - 1)} className="rgb-btn">−</button>
                      <input
                        type="text"
                        value={val}
                        onChange={e => { const v = parseInt(e.target.value, 10); if (!isNaN(v)) setVal(v); }}
                        style={{
                          width: 36, textAlign: 'center',
                          background: 'transparent', border: 'none', outline: 'none',
                          color: '#f8fafc', fontFamily: 'monospace', fontSize: 13, padding: '5px 0',
                        }}
                      />
                      <button onClick={() => setVal(val + 1)} className="rgb-btn">+</button>
                    </div>
                    <span style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>{ch}</span>
                  </div>
                );
              })}
              {/* EyeDropper */}
              {typeof window !== 'undefined' && window.EyeDropper && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                  <button
                    className="rgb-btn eyedrop-btn"
                    title="Pick color from screen"
                    onClick={() => {
                      const ed = new window.EyeDropper();
                      ed.open().then(r => this.updateColor(activeColor, r.sRGBHex)).catch(() => {});
                    }}
                    style={{ width: 30, height: '100%', borderRadius: 7, border: '1px solid rgba(255,255,255,0.13)', background: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.71 5.63l-2.34-2.34a1 1 0 00-1.41 0l-3.12 3.12-1.41-1.42-1.42 1.42 1.41 1.41-6.6 6.6A2 2 0 005 16v3h3a2 2 0 001.42-.59l6.6-6.6 1.41 1.41 1.42-1.42-1.42-1.41 3.12-3.12a1 1 0 000-1.41z"/>
                    </svg>
                  </button>
                  <span style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>👁</span>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

        <button onClick={() => this.addColor()} className="page-btn" style={{ fontSize: 12, padding: '4px 12px', marginBottom: 14 }}>
          {L['gradient_add_color'] || '+ Add color'}
        </button>

        {/* Minecraft quick palette */}
        <label style={LABEL}>
          {L['gradient_mc_colors'] || 'Minecraft colors'}
          <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 10, color: '#64748b', marginLeft: 8 }}>
            {activeColor < colors.length
              ? `${L['gradient_mc_hint_change'] || '\u2014 click to change stop'} ${activeColor + 1}`
              : (L['gradient_mc_hint_add'] || '\u2014 click to add')}
          </span>
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
          {MC_COLORS.map(mc => (
            <div
              key={mc.code}
              title={`${mc.name} ${mc.hex}`}
              onClick={() => this.applyMCColor(mc.hex)}
              style={{
                width: 24, height: 24, borderRadius: 5,
                background: mc.hex,
                border: '2px solid rgba(255,255,255,0.15)',
                cursor: 'pointer',
                boxShadow: colors.includes(mc.hex) ? `0 0 0 2px #38bdf8` : 'none',
                transition: 'transform 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.25)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          ))}
        </div>

        {/* Formatting */}
        <label style={LABEL}>{L['gradient_formatting'] || 'Formatting'}</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {FMT_OPTIONS.map(({ key, label, style }) => (
            <label
              key={key}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 12, cursor: 'pointer', padding: '3px 8px',
                borderRadius: 6, border: `1px solid ${this.state[key] ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                background: this.state[key] ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.04)',
                color: this.state[key] ? '#f8fafc' : '#94a3b8',
                userSelect: 'none',
                ...(this.state[key] ? style : {}),
              }}
            >
              <input type="checkbox" checked={this.state[key]} onChange={fmtToggle(key)} style={{ display: 'none' }} />
              {label}
            </label>
          ))}
        </div>

        {/* Generate */}
        <button
          onClick={this.generate}
          className="page-btn"
          style={{ width: '100%', padding: '9px', fontSize: 13 }}
          disabled={!text.trim()}
        >
          {L['gradient_generate'] || 'Generate gradient'}
        </button>

        {/* Output */}
        {output && (
          <div style={{ marginTop: 14 }}>
            <label style={LABEL}>{L['gradient_preview'] || 'Preview'}</label>
            <div style={{
              background: 'rgba(0,0,0,0.5)', borderRadius: 7, padding: '10px 14px',
              marginBottom: 8, fontSize: 15, minHeight: 36,
              display: 'flex', alignItems: 'center',
            }}>
              <MCText>{output}</MCText>
            </div>
            <label style={LABEL}>{L['gradient_output'] || 'Output'}</label>
            <div style={{
              background: 'rgba(0,0,0,0.35)', borderRadius: 7, padding: '9px 12px',
              fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all',
              color: '#e2e8f0', lineHeight: 1.6, marginBottom: 10,
              userSelect: 'all', maxHeight: 80, overflowY: 'auto',
            }}>
              {output}
            </div>
            <button
              onClick={this.apply}
              className="page-btn"
              style={{ width: '100%', padding: '9px', fontSize: 13, background: '#22c55e', borderColor: '#16a34a' }}
            >
              ✓ {L['gradient_apply'] || 'Apply to field'}
            </button>
          </div>
        )}
      </Modal>
    );
  }
}
