// @ts-check
import axios from "axios";

const API_BASE = "https://api.gitcode.com/api/v5";

/**
 * Send request to GitCode API.
 *
 * @param {string} url The endpoint URL (e.g. /repos/:owner/:repo).
 * @param {Record<string, any>} variables Path and query parameters.
 * @param {string} token GitCode API token.
 * @returns {Promise<any>} Response data.
 */
const request = (url, variables, token) => {
  let finalUrl = API_BASE + url;
  // Find parameters starting with :
  const required = (url.match(/:(\w+)/g) || []).map((s) => s.slice(1));
  /** @type {Record<string, any>} */
  const params = {};

  // Handle path params
  for (const param of required) {
    if (variables[param] === undefined) {
      throw new Error(`Missing required parameter: ${param}`);
    }
    finalUrl = finalUrl.replace(`:${param}`, String(variables[param]));
  }

  // Handle query params
  for (const key in variables) {
    if (!required.includes(key)) {
      params[key] = variables[key];
    }
  }

  return axios.get(finalUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params,
  });
};

export { request };
