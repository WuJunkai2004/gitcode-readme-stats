// @ts-check

import { retryer } from "../common/retryer.js";
import { excludeRepositories } from "../common/envs.js";
import { CustomError, MissingParamError } from "../common/error.js";
import { request } from "../common/gitcode.js";

/**
 * Top languages fetcher object.
 *
 * @param {any} variables Fetcher variables.
 * @param {string} token GitCode token.
 * @returns {Promise<import("axios").AxiosResponse>} Response with all repos.
 */
const fetcher = (variables, token) => {
  /** @type{any[]} */
  let allRepos = [];
  let page = 1;
  const per_page = 100;

  /**
   * A recursive function to fetch all pages of repositories.
   *
   * @returns {Promise<import("axios").AxiosResponse>} Response with all repos.
   */
  const fetchNextPage = () => {
    return request(
      "/users/:username/repos",
      { ...variables, page, per_page },
      token,
    ).then((res) => {
      const repos = res.data;
      /** @type{import("axios").AxiosResponse} */
      const result = {
        data: allRepos,
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      };

      if (!Array.isArray(repos) || repos.length === 0) {
        return result;
      }

      allRepos = allRepos.concat(repos);
      result.data = allRepos;

      if (repos.length < per_page) {
        return result;
      } else {
        page += 1;
        return fetchNextPage();
      }
    });
  };

  return fetchNextPage();
};

/**
 * @typedef {import("./types").TopLangData} TopLangData Top languages data.
 */

/**
 * Fetch top languages for a given username.
 *
 * @param {string} username GitHub username.
 * @param {string[]} exclude_repo List of repositories to exclude.
 * @param {number} size_weight Weightage to be given to size.
 * @param {number} count_weight Weightage to be given to count.
 * @returns {Promise<TopLangData>} Top languages data.
 */
const fetchTopLanguages = async (
  username,
  exclude_repo = [],
  size_weight = 1,
  count_weight = 0,
) => {
  if (!username) {
    throw new MissingParamError(["username"]);
  }

  const res = await retryer(fetcher, { username });

  if (!res || !Array.isArray(res.data)) {
    throw new CustomError("Could not fetch user.", CustomError.USER_NOT_FOUND);
  }

  let repoNodes = res.data;
  /** @type {Record<string, boolean>} */
  let repoToHide = {};
  const allExcludedRepos = [...exclude_repo, ...excludeRepositories];

  // populate repoToHide map for quick lookup
  // while filtering out
  if (allExcludedRepos) {
    allExcludedRepos.forEach((repoName) => {
      repoToHide[repoName] = true;
    });
  }

  // filter out repositories to be hidden
  repoNodes = repoNodes
    .filter((repo) => repo.language)
    .filter((repo) => !repoToHide[repo.name]);

  /** @type {Record<String, any>} */
  const languages = repoNodes.reduce((acc, repo) => {
    const langName = repo.language;
    const langColor =
      repo.main_repository_language && repo.main_repository_language[1]
        ? repo.main_repository_language[1]
        : "#ccc"; // Default color if missing

    if (acc[langName]) {
      acc[langName].size += 1;
      acc[langName].count += 1;
    } else {
      acc[langName] = {
        name: langName,
        color: langColor,
        size: 1,
        count: 1,
      };
    }
    return acc;
  }, {});

  Object.keys(languages).forEach((name) => {
    // comparison index calculation
    languages[name].size =
      Math.pow(languages[name].size, size_weight) *
      Math.pow(languages[name].count, count_weight);
  });

  const topLangs = Object.keys(languages)
    .sort((a, b) => languages[b].size - languages[a].size)
    .reduce((result, key) => {
      result[key] = languages[key];
      return result;
    }, {});

  return topLangs;
};

export { fetchTopLanguages };
export default fetchTopLanguages;
