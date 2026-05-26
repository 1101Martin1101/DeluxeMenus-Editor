// Shared Minecraft text parser — supports &X and &#RRGGBB hex colors
import React from 'react';

const MC_COLORS = {
  '0':'#000000','1':'#0000AA','2':'#00AA00','3':'#00AAAA',
  '4':'#AA0000','5':'#AA00AA','6':'#FFAA00','7':'#AAAAAA',
  '8':'#555555','9':'#5555FF','a':'#55FF55','b':'#55FFFF',
  'c':'#FF5555','d':'#FF55FF','e':'#FFFF55','f':'#FFFFFF',
};

export function parseMC(text) {
  if (!text) return [];
  const segs = [];
  let color = null, bold = false, italic = false, under = false, strike = false, obfuscated = false;
  let i = 0;
  while (i < text.length) {
    if (text[i] === '&') {
      if (text[i + 1] === '#') {
        const hex = text.slice(i + 1, i + 8);
        if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
          color = hex; bold = false; italic = false; under = false; strike = false; obfuscated = false;
          i += 8; continue;
        }
      }
      const c = text[i + 1] ? text[i + 1].toLowerCase() : '';
      if (MC_COLORS[c])  { color = MC_COLORS[c]; bold=false; italic=false; under=false; strike=false; obfuscated=false; i+=2; continue; }
      if (c === 'l')     { bold = true;       i+=2; continue; }
      if (c === 'o')     { italic = true;     i+=2; continue; }
      if (c === 'n')     { under = true;      i+=2; continue; }
      if (c === 'm')     { strike = true;     i+=2; continue; }
      if (c === 'k')     { obfuscated = true; i+=2; continue; }
      if (c === 'r')     { color=null; bold=false; italic=false; under=false; strike=false; obfuscated=false; i+=2; continue; }
    }
    segs.push({ ch: text[i], color, bold, italic, under, strike, obfuscated });
    i++;
  }
  return segs;
}

export function MCText({ children, style }) {
  if (!children) return null;
  const lines = String(children).split('\n');
  return (
    <span style={style}>
      {lines.map((line, li) => (
        <span key={li}>
          {li > 0 && <br />}
          {parseMC(line).map((s, si) => (
            <span key={si} style={{
              color: s.color || undefined,
              fontWeight: s.bold ? 'bold' : undefined,
              fontStyle: s.italic ? 'italic' : undefined,
              textDecoration: [s.under && 'underline', s.strike && 'line-through'].filter(Boolean).join(' ') || undefined,
              filter: s.obfuscated ? 'blur(2px)' : undefined,
            }}>{s.ch}</span>
          ))}
        </span>
      ))}
    </span>
  );
}
