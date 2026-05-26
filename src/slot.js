import './App.css';

import { Item } from './item';
import React, { Component } from 'react';
import { MCText } from './mcparse';
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap_white.css';

export class Slot extends Component {
  slotData = () => <div
    onClick={() => { if (!this.props.isSearch) this.props.selectedSlot(this.props.id) }}
    onContextMenu={(e) => {
      if (!this.props.isSearch) {
        e.preventDefault();
        this.props.openSearch(this.props.id);
      }
    }}
    id={this.props.id}
    className={`slot${this.props.isSelected ? ' selectedSlot' : ''}`}
  >
    <Item
      img={this.props.icon || 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAQAAADZc7J/AAAAF0lEQVRIDWMYBaNgFIyCUTAKRsEoQAMACCAAATXQUGAAAAAASUVORK5CYII='}
      count={this.props.amount}
      />
  </div>
  render() {
    const loreText = Array.isArray(this.props.lore)
      ? this.props.lore.join('\n')
      : (this.props.lore || '');
    const displayName = this.props.display_name || '';
    const hasTooltip = displayName || loreText;

    const tooltipContent = (
      <div style={{ fontFamily: 'Minecraft', maxWidth: 300 }}>
        {displayName && (
          <MCText style={{ display: 'block', marginBottom: loreText ? 4 : 0 }}>
            {displayName}
          </MCText>
        )}
        {loreText && (
          <MCText style={{ display: 'block', whiteSpace: 'pre-line', color: '#b0b', fontSize: '0.9em' }}>
            {loreText}
          </MCText>
        )}
      </div>
    );

    return(
      hasTooltip ? <Tooltip
        showArrow={false}
        overlay={tooltipContent}
      >
        {this.slotData()}
      </Tooltip> : this.slotData()
    )
  }
}
