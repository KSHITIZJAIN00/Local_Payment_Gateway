const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  pinHash: String
});
userSchema.methods.setPin = async function(pin) {
  this.pinHash = await bcrypt.hash(pin, 10);
};
userSchema.methods.verifyPin = async function(pin) {
  return bcrypt.compare(pin, this.pinHash);
};
module.exports = mongoose.model('User', userSchema);