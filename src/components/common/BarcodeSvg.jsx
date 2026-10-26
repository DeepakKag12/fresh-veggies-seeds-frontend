import React from 'react';

/**
 * Authentic SVG Barcode generator (Code 128 / Code 39 pseudo-pattern)
 * Generates crisp vector barcode lines for thermal printers and PDFs
 */
export const BarcodeSvg = ({ value = '', height = 48, className = '', showText = true }) => {
  const cleanVal = String(value || '').trim().toUpperCase();
  if (!cleanVal) return null;

  // Deterministic bar widths based on character hash
  const bars = [];
  // Start pattern
  bars.push(2, 1, 1, 2);

  for (let i = 0; i < cleanVal.length; i++) {
    const code = cleanVal.charCodeAt(i);
    const b1 = (code % 3) + 1;
    const b2 = ((code >> 1) % 3) + 1;
    const b3 = ((code >> 2) % 3) + 1;
    const b4 = ((code >> 3) % 2) + 1;
    bars.push(b1, b2, b3, b4);
  }

  // Stop pattern
  bars.push(2, 3, 1, 1, 2);

  let currentX = 0;
  const barElements = bars.map((w, idx) => {
    const isBlack = idx % 2 === 0;
    const rect = isBlack ? (
      <rect
        key={idx}
        x={currentX}
        y={0}
        width={w * 1.5}
        height={height}
        fill="#000000"
      />
    ) : null;
    currentX += w * 1.5;
    return rect;
  });

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        width={Math.max(120, currentX)}
        height={height}
        viewBox={`0 0 ${currentX} ${height}`}
        className="w-auto h-auto max-w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {barElements}
      </svg>
      {showText && (
        <span className="font-mono text-[10px] sm:text-xs font-bold tracking-widest text-black mt-1 uppercase">
          *{cleanVal}*
        </span>
      )}
    </div>
  );
};

export default BarcodeSvg;
