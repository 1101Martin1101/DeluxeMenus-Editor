import './App.css';

import React, { Component } from 'react';

const FALLBACK = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAQAAADZc7J/AAAAF0lEQVRIDWMYBaNgFIyCUTAKRsEoQAMACCAAATXQUGAAAAAASUVORK5CYII=';

export class Item extends Component {

  render() {
    const { img, name, count } = this.props;
    // Standard base64 only contains A-Za-z0-9+/= — no dots, colons, underscores, etc.
    // Any URL or file path will contain at least one character outside that alphabet.
    const isBase64 = img && /^[A-Za-z0-9+/=\r\n]+$/.test(img);
    const src = !img ? FALLBACK : isBase64 ? `data:image/png;base64,${img}` : img;

    return(
      <div className="item">
        <img
          src={src}
          title={name}
          alt={name}
          onError={(e) => { e.target.src = FALLBACK; e.target.onerror = null; }}
        />
        <div className="number">
          {count}
        </div>
    </div>
    )
  }

}
