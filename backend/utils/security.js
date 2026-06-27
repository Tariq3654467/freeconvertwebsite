const bcrypt = require('bcryptjs');

const saltRounds = 10;

exports.getPasswordHash = async (password) => {
  return await bcrypt.hash(password, saltRounds);
};

exports.verifyPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};
