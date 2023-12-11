const { expressjwt: jwt } = require("express-jwt");
const dotenv = require('dotenv');
dotenv.config();

function authJwt() {
  const { SECRET, API_URL } = process.env;

  if (!SECRET || !API_URL) {
    throw new Error('SECRET or API_URL is missing in the environment variables.');
  }

  const jwtMiddleware = jwt({
    secret: SECRET,
    algorithms: ['HS256'],
    isRevoked: isRevoked
  });

  const unlessPaths = [
     { url: /\/api\/v1\/transactions(.*)/, methods: ['GET', 'OPTIONS', 'POST','PUT'] },
     { url: /\/api\/v1\/funcImgs(.*)/, methods: ['GET', 'OPTIONS', 'POST'] },
    { url: /\/api\/v1\/users(.*)/, methods: ['GET','OPTIONS', 'POST','PUT'] },
    `${API_URL}/users/login`,
    `${API_URL}/users/register`,
  ];

  return jwtMiddleware.unless({ path: unlessPaths });
}

async function isRevoked(req, payload, done) {
  if (!payload.isAdmin) {
    done(null, true);
  } else {
    done();
  }
}

module.exports = authJwt;
