const QRCode = require('qrcode');

exports.generate = async function (payload) {
  console.log("QR Generator called with payload:", payload);
  try {
    const dataString = JSON.stringify(payload);
    console.log("Generating QR for:", dataString);
    const qr = await QRCode.toDataURL(dataString);
    console.log("QR generated successfully");
    return qr;
  } catch (err) {
    console.error("Error generating QR:", err);
    throw err;
  }
};
