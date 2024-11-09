import { Suite } from "@playwright/test/reporter";
import { existsSync, unlinkSync, writeFileSync } from "fs";
import { basename, join } from "path";
import { getHtmlTable } from "./getHtmlTable";
import { getSuiteStatusIcon } from "./getSuiteStatusIcon";
import { getTableRows } from "./getTableRows";
import { getTestsPerFile } from "./getTestsPerFile";
import { getTestHeading } from "./getTestHeading";
import { DisplayLevel, GitHubActionOptions } from "../models";

export const processResults = async (
  suite: Suite | undefined,
  options: GitHubActionOptions
) => {
  if (process.env.GITHUB_ACTIONS && suite) {
    const os = process.platform;

    // Unique file path per shard using matrix.shardIndex
    const shardIndex = process.env.SHARD_INDEX || "default";
    const summaryFilePath = join(
      process.cwd(),
      `playwright-summary-${shardIndex}.md`
    );

    if (existsSync(summaryFilePath)) {
      unlinkSync(summaryFilePath);
    }

    let summaryContent = "";

    // Skip header/title here; it will be added in the final job

    // Collect test details only
    for (const crntSuite of suite.suites) {
      const project = crntSuite.project();
      const tests = getTestsPerFile(crntSuite);

      for (const filePath of Object.keys(tests)) {
        const fileName = basename(filePath);

        if (options.useDetails) {
          const content = await getHtmlTable(
            tests[filePath],
            options.showAnnotations,
            options.showTags,
            !!options.showError,
            options.includeResults as DisplayLevel[]
          );

          if (content) {
            const testStatusIcon = getSuiteStatusIcon(tests[filePath]);
            summaryContent += `<details><summary>${testStatusIcon} ${getTestHeading(
              fileName,
              os,
              project
            )}</summary>\n\n${content}\n\n</details>\n\n`;
          }
        } else {
          const tableRows = await getTableRows(
            tests[filePath],
            options.showAnnotations,
            options.showTags,
            !!options.showError,
            options.includeResults as DisplayLevel[]
          );

          if (tableRows.length !== 0) {
            summaryContent += `## ${getTestHeading(fileName, os, project)}\n\n`;
            summaryContent +=
              "| Test | Result | Details |\n| --- | --- | --- |\n";
            summaryContent +=
              tableRows.map((row) => row.join(" | ")).join("\n") + "\n\n";
          }
        }
      }
    }

    // Write content without header to individual summary file
    writeFileSync(summaryFilePath, summaryContent, "utf-8");
  }
};
