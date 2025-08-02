const QRCode = require("qrcode");

module.exports = {
  generate: async (data) => {
    // data will be a URL string
    return QRCode.toDataURL(data);
  }
};
