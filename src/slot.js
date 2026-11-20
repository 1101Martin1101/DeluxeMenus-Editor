import './App.css';

import { Item } from './item';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { MCText } from './mcparse';

/** "CYAN_DYE" -> "Cyan Dye", "minecraft:diamond_sword" -> "Diamond Sword". */
const prettyName = (raw, customHeadLabel = 'Custom head') => {
  if (!raw) return '';
  const value = String(raw).trim();
  if (!value || value.toLowerCase() === 'none') return '';
  if (/^(basehead-|head-)/i.test(value)) return customHeadLabel;

  return value
    .replace(/^minecraft:/i, '')
    .split('_')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const ROMAN_TABLE = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
  [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

/** 7 -> "VII", 10 -> "X". Non-numeric levels are returned unchanged. */
const toRoman = (value) => {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0 || num > 3999) return String(value ?? '').trim();
  let n = num;
  let out = '';
  for (const [amount, symbol] of ROMAN_TABLE) {
    while (n >= amount) {
      out += symbol;
      n -= amount;
    }
  }
  return out;
};

/**
 * DeluxeMenus enchantment lines look like "BLAST_PROTECTION;7".
 * Returns [{ name: 'Blast Protection', level: 'VII' }, ...].
 */
const parseEnchantments = (raw) => {
  if (!raw) return [];
  const lines = Array.isArray(raw) ? raw : String(raw).split('\n');

  return lines
    .map(line => String(line).trim())
    .filter(Boolean)
    .map((line) => {
      const [namePart, levelPart] = line.split(/[;:]/);
      return {
        name: prettyName(namePart),
        level: levelPart != null && String(levelPart).trim() !== '' ? toRoman(levelPart) : '',
      };
    })
    .filter(enchant => enchant.name);
};

export class Slot extends Component {
  state = { hover: false, x: 0, y: 0, flipped: false };
  tipRef = React.createRef();
  lastRect = null;

  showTooltip = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    this.lastRect = rect;
    // Half of the tooltip's max width + a small viewport margin.
    const margin = 172;
    const center = rect.left + rect.width / 2;
    const x = window.innerWidth > margin * 2
      ? Math.min(Math.max(center, margin), window.innerWidth - margin)
      : window.innerWidth / 2;
    this.setState({ hover: true, x, y: rect.top - 8, flipped: false });
  };

  hideTooltip = () => {
    if (this.state.hover) this.setState({ hover: false });
  };

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.hover && this.state.hover) {
      window.addEventListener('scroll', this.hideTooltip, true);
    } else if (prevState.hover && !this.state.hover) {
      window.removeEventListener('scroll', this.hideTooltip, true);
    }

    // Not enough room above the slot (first row, long lore, sticky site nav)?
    // Flip the tooltip below the slot instead of covering the header.
    if (this.state.hover && !this.state.flipped && this.tipRef.current && this.lastRect) {
      const tipRect = this.tipRef.current.getBoundingClientRect();
      if (tipRect.top < 64) {
        this.setState({ flipped: true, y: this.lastRect.bottom + 8 });
      }
    }
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.hideTooltip, true);
  }

  slotData = () => <div
    onClick={() => { if (!this.props.isSearch) this.props.selectedSlot(this.props.id) }}
    onContextMenu={(e) => {
      if (!this.props.isSearch) {
        e.preventDefault();
        this.props.openSearch(this.props.id);
      }
    }}
    onMouseEnter={this.props.isSearch || this.hasTooltipContent() ? this.showTooltip : undefined}
    onMouseLeave={this.hideTooltip}
    onWheel={this.hideTooltip}
    id={this.props.id}
    className={`slot${this.props.isSelected ? ' selectedSlot' : ''}`}
  >
    <Item
      img={this.props.icon || 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAQAAADZc7J/AAAAF0lEQVRIDWMYBaNgFIyCUTAKRsEoQAMACCAAATXQUGAAAAAASUVORK5CYII='}
      count={this.props.amount}
      />
    {this.props.showPriority && this.props.priority !== undefined && this.props.priority !== null && this.props.priority !== '' && (
      <span className="slot-priority">{this.props.priority}</span>
    )}
    {this.props.requirementMet === false && (
      <span className="slot-requirement" title="Requirements not met in simulation">!</span>
    )}
  </div>

  hasTooltipContent = () => {
    const loreText = Array.isArray(this.props.lore)
      ? this.props.lore.join('\n')
      : (this.props.lore || '');
    return Boolean(
      this.props.display_name ||
      loreText ||
      prettyName(this.props.material) ||
      parseEnchantments(this.props.enchantments).length
    );
  };

  render() {
    const loreText = Array.isArray(this.props.lore)
      ? this.props.lore.join('\n')
      : (this.props.lore || '');
    const rawDisplayName = this.props.display_name || '';
    // A name containing only colour codes (e.g. "&a") shows nothing useful.
    const displayName = String(rawDisplayName)
      .replace(/&(#[0-9a-fA-F]{6}|[0-9a-fk-orA-FK-OR])/g, '')
      .trim()
      ? rawDisplayName
      : '';
    const lang = this.props.lang || {};
    const customHead = lang.ui_custom_head || 'Custom head';
    const materialName = prettyName(this.props.material, customHead);
    const enchantments = this.props.hide_enchantments
      ? []
      : parseEnchantments(this.props.enchantments);
    const priorityText = (lang.ui_priority_line || 'Priority {priority}').replace('{priority}', this.props.priority);
    const requirementsNotMet = lang.ui_requirements_not_met || 'Requirements not met:';
    const clickMet = lang.ui_click_met || 'Click requirement met';
    const clickNotMet = lang.ui_click_not_met || 'Click requirement not met:';
    const localizeCheck = (text) => String(text || '')
      .replace(/\(now /g, `(${lang.ui_now || 'now'} `)
      .replace(/\(not simulatable\)/g, `(${lang.ui_not_simulatable || 'not simulatable'})`)
      .replace(/^NOT permission /, `${lang.ui_not_permission_word || 'NOT permission'} `)
      .replace(/^permission /, `${lang.ui_permission || 'permission'} `);
    const hasTooltip = displayName || loreText || materialName || enchantments.length;
    const hasPriority = this.props.priority !== undefined && this.props.priority !== null && this.props.priority !== '';
    const showPriorityLine = hasPriority && this.props.showPriority;

    const tooltip = hasTooltip && this.state.hover ? ReactDOM.createPortal(
      <div
        ref={this.tipRef}
        className={`mc-tooltip${this.state.flipped ? ' mc-tooltip-below' : ''}`}
        style={{ left: `${this.state.x}px`, top: `${this.state.y}px` }}
      >
        {displayName
          ? (
            <MCText
              className="mc-tooltip-name"
              style={{ display: 'block', marginBottom: (loreText || enchantments.length || showPriorityLine) ? 4 : 0 }}
            >
              {displayName}
            </MCText>
          )
          : (materialName
            ? <span className="mc-tooltip-name">{materialName}</span>
            : null)}
        {showPriorityLine && (
          <div className="mc-tooltip-priority">{priorityText}</div>
        )}
        {this.props.requirementMet === false && (
          <div className="mc-tooltip-requirement">
            {requirementsNotMet}
            {(this.props.requirementChecks || [])
              .filter(check => !check.pass)
              .slice(0, 4)
              .map((check, index) => (
                <div key={index} className="mc-tooltip-check">- {localizeCheck(check.text)}</div>
              ))}
          </div>
        )}
        {this.props.simulateRequirements && this.props.hasClickRequirement && (
          <div className={`mc-tooltip-click ${this.props.clickRequirementMet ? 'ok' : 'fail'}`}>
            {this.props.clickRequirementMet ? clickMet : clickNotMet}
            {!this.props.clickRequirementMet && (this.props.clickRequirementChecks || [])
              .filter(check => !check.pass)
              .slice(0, 4)
              .map((check, index) => (
                <div key={index} className="mc-tooltip-check">- {localizeCheck(check.text)}</div>
              ))}
          </div>
        )}
        {enchantments.length > 0 && (
          <div className="mc-tooltip-enchants">
            {enchantments.map((enchant, i) => (
              <div key={`${enchant.name}_${i}`} className="mc-tooltip-enchant">
                {enchant.name}{enchant.level ? ` ${enchant.level}` : ''}
              </div>
            ))}
          </div>
        )}
        {loreText && (
          <MCText
            className="mc-tooltip-lore"
            style={{ display: 'block', whiteSpace: 'pre-line', fontSize: '0.9em' }}
          >
            {loreText}
          </MCText>
        )}
      </div>,
      document.body
    ) : null;

    return (
      <>
        {this.slotData()}
        {tooltip}
      </>
    );
  }
}
