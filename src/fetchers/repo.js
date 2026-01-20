// @ts-check

import { MissingParamError } from "../common/error.js";
import { request } from "../common/gitcode.js";
import { retryer } from "../common/retryer.js";

/**
 * Repo data fetcher.
 *
 * @param {object} variables Fetcher variables.
 * @param {string} token GitCode token.
 * @returns {Promise<import('axios').AxiosResponse>} The response.
 */
const fetcher = (variables, token) => {
  return request("/repos/:owner/:repo", variables, token);
};

const urlExample = "/api/pin?username=USERNAME&amp;repo=REPO_NAME";

/**
 * @typedef {import("./types").RepositoryData} RepositoryData Repository data.
 */

/**
 * Fetch repository data.
 *
 * @param {string} username GitCode username.
 * @param {string} reponame GitCode repository name.
 * @returns {Promise<RepositoryData>} Repository data.
 */
const fetchRepo = async (username, reponame) => {
  if (!username && !reponame) {
    throw new MissingParamError(["username", "repo"], urlExample);
  }
  if (!username) {
    throw new MissingParamError(["username"], urlExample);
  }
  if (!reponame) {
    throw new MissingParamError(["repo"], urlExample);
  }

  let res = await retryer(fetcher, { owner: username, repo: reponame });

  const data = res.data;

  if (!data || res.status === 404) {
    throw new Error("Not found");
  }

  const languageData = data.main_repository_language;

  return {
    name: data.name,
    nameWithOwner: data.full_name,
    isPrivate: data.private,
    isArchived: false,
    isTemplate: false,
    stargazers: { totalCount: data.stargazers_count },
    description: data.description,
    primaryLanguage: {
      name: languageData ? languageData[0] : null,
      color: languageData ? languageData[1] : null,
      id: "",
    },
    forkCount: data.forks_count,
    starCount: data.stargazers_count,
  };
};

export { fetchRepo };
export default fetchRepo;
