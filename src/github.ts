import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";

dotenv.config();

const octokit = new Octokit({
  auth: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
});

export async function fetchOpenIssues(owner: string, repo: string) {
  const { data } = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state: "open",
    per_page: 20,
  });

  return data.map((issue) => ({
    number: issue.number,
    title: issue.title,
    author: issue.user?.login,
    labels: issue.labels.map((label) =>
      typeof label === "string" ? label : label.name,
    ),
    url: issue.html_url,
  }));
}

export async function createNewIssue(
  owner: string,
  repo: string,
  title: string,
  body?: string,
) {
  const { data } = await octokit.rest.issues.create({
    owner,
    repo,
    title,
    body,
  });

  return {
    number: data.number,
    title: data.title,
    url: data.html_url,
  };
}
