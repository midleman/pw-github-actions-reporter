import { Suite } from "@playwright/test/reporter";
import { existsSync, unlinkSync, writeFileSync } from "fs";
import { basename, join } from "path";
import { getHtmlTable } from "./getHtmlTable";
import { getSuiteStatusIcon } from "./getSuiteStatusIcon";
import { getTableRows } from "./getTableRows";
import { getSummaryTitle } from "./getSummaryTitle";
import { getSummaryDetails } from "./getSummaryDetails";
import { getTestsPerFile } from "./getTestsPerFile";
import { getTestHeading } from "./getTestHeading";
import { DisplayLevel, GitHubActionOptions } from "../models";

export const processResults = async (
  suite: Suite | undefined,
  options: GitHubActionOptions
) => {
  if (process.env.GITHUB_ACTIONS && suite) {
    const os = process.platform;

    // Generate a unique summary file path using matrix.shardIndex
    const shardIndex = process.env.SHARD_INDEX || "default";
    const summaryFilePath = join(
      process.cwd(),
      `playwright-summary-${shardIndex}.md`
    );

    if (existsSync(summaryFilePath)) {
      unlinkSync(summaryFilePath);
    }

    let summaryContent = "";

    const summaryTitle = getSummaryTitle(options.title);
    if (summaryTitle) {
      summaryContent += `# ${summaryTitle}\n\n`;
    }

    const headerText = getSummaryDetails(suite);
    summaryContent += headerText.join(` &nbsp;|&nbsp; `) + "\n\n";

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

    writeFileSync(summaryFilePath, summaryContent, "utf-8");
  }
};
