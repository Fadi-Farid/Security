import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as fs from 'fs';
import * as path from 'path';

async function run(): Promise<void> {
  try {
    // Inputs
    const target = core.getInput('target');
    const dockerImage = core.getInput('docker_name') || 'zaproxy/zap-stable';
    const rulesFile = core.getInput('rules_file_name');
    const cmdOptions = core.getInput('cmd_options');

    // Validate required input
    if (!target) {
      core.setFailed('Input "target" is required');
      return;
    }

    // Ensure reports directory exists and is writable
    const reportsDir = path.join(process.cwd(), 'zap-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    try {
      fs.chmodSync(reportsDir, 0o777);
    } catch (chmodErr) {
      core.warning(`Could not chmod reports dir: ${chmodErr instanceof Error ? chmodErr.message : String(chmodErr)}`);
    }

    // Build ZAP arguments
    const zapArgs: string[] = [
      'zap-baseline.py',
      '-t', target,
      '-r', 'report.html',
      '-J', 'report.json'
    ];

    if (rulesFile) {
      zapArgs.push('-c', rulesFile);
    }
    if (cmdOptions) {
      zapArgs.push(...cmdOptions.split(' '));
    }

    // Debug output
    core.info('Running ZAP baseline scan');
    core.info(`Target: ${target}`);
    core.info(`Docker image: ${dockerImage}`);
    core.info(`Final args: ${zapArgs.join(' ')}`);

    // Run Docker container (capture exit code)
    const dockerArgs: string[] = [
      'run',
      '--rm',
      '-v', `${reportsDir}:/zap/wrk`,
      dockerImage,
      ...zapArgs
    ];

    const exitCode: number = await exec.exec('docker', dockerArgs, {
      ignoreReturnCode: true
    });

    core.info(`ZAP scan finished with exit code: ${exitCode}`);

    // Handle exit codes
    if (exitCode === 1) {
      core.setFailed('ZAP detected at least one FAIL (High/Critical) issue');
    } else if (exitCode === 2) {
      core.warning('ZAP detected WARN (Medium) issues — not failing the build');
    } else if (exitCode === 3) {
      core.setFailed('ZAP execution failed (runtime/config issue)');
    } else {
      core.info('ZAP scan passed with no blocking issues');
    }

    // ---- Report summary generation (now inside run so reportsDir & exitCode are defined) ----
    try {
      const reportPath = path.join(reportsDir, 'report.html');
      if (fs.existsSync(reportPath)) {
        // Optionally parse htmlContent if needed
        // const htmlContent = fs.readFileSync(reportPath, 'utf-8');

        const jsonReport = {
          timestamp: new Date().toISOString(),
          htmlReportPath: 'report.html',
          scanStatus: exitCode === 0 ? 'passed' : 'failed',
          exitCode
        };
        fs.writeFileSync(path.join(reportsDir, 'report.json'), JSON.stringify(jsonReport, null, 2));
        core.info('Wrote scan summary to report.json');
      } else {
        core.warning(`ZAP report not found at ${reportPath}`);
      }
    } catch (err) {
      core.warning(`Failed to write JSON report: ${err instanceof Error ? err.message : String(err)}`);
    }
    // ------------------------------------------------------------------------------------------

  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

run();
