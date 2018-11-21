const jwt = require('jsonwebtoken');

const tokenSecret = 'secret';
// let token;
function generateJWT (params) {
  params = params || {};
  const options = Object.assign({
    expiresIn: 10
  }, params);
  return jwt.sign({
    data: 'fake-token'
  }, tokenSecret, options);
}

function verifyJWT (token, params) {
  params = params || {};
  const options = Object.assign({}, params);
  jwt.verify(token, tokenSecret, options);
}

module.exports = {
  generateJWT,
  verifyJWT
};
