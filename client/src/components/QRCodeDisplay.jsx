import React from 'react';
function QRCodeDisplay({ dataUrl }) {
  return dataUrl ? <img src={dataUrl} alt="QR Code" /> : null;
}
export default QRCodeDisplay;