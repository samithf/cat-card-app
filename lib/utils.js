const util = require("util");

// generate a URL objects with host/pathname ans params
function generateUrl({ host, pathname, params }) {
  const url = new URL(host);

  if (pathname) {
    url.pathname = pathname;
  }

  if (params) {
    const searchParams = url.searchParams;

    for (const key of Object.keys(params)) {
      searchParams.append(key, params[key]);
    }
  }

  return url;
}

function promisify(func) {
  return util.promisify(func);
}

module.exports = {
  generateUrl,
  promisify,
};
