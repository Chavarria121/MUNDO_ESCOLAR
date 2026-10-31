import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function QrFiscal({ value, size = 110, className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(
        canvasRef.current,
        value,
        {
          width: size,
          margin: 1,
          color: {
            dark: '#132B20', // Forest green Mundo Escolar
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'M',
        },
        (error) => {
          if (error) console.error('Error generando QR Fiscal:', error);
        }
      );
    }
  }, [value, size]);

  return (
    <div className={`inline-flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
      <canvas ref={canvasRef} className="block" />
      <span className="text-[9px] font-bold tracking-wider uppercase text-slate-500 mt-1">
        DGT &bull; HACIENDA CR
      </span>
    </div>
  );
}
