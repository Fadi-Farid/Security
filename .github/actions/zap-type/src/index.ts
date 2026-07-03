import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as fs from 'fs';
import * as path from 'path';
 
async function run(): Promise<void> {
  try {
    //  Inputs
    const target = core.getInput('target');
    const dockerImage = core.getInput('docker_name') || 'zaproxy/zap-stable';
    const rulesFile = core.getInput('rules_file_name');
    const cmdOptions = core.getInput('cmd_options');
    const failOn = (core.getInput('fail_on') || 'high').toLowerCase();
 
    //  Validate required input
    if (!target) {
      core.setFailed('Input "target" is required');
      return;
    }
 
    //  FIX permissions
 
    //  Ensure reports directory exists
    const reportsDir = path.join(process.cwd(), 'zap-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir);
    }
    fs.chmodSync(reportsDir, 0o777);
 
    //  Build ZAP arguments
    const zapArgs: string[] = ['zap-baseline.py', '-t', target, '-r', 'report.html','-J', 'report.json'];
 
    //  Optional: rules file
    if (rulesFile) {
      zapArgs.push('-c', rulesFile);
    }
 
    //  Optional: custom options
    if (cmdOptions) {
      zapArgs.push(...cmdOptions.split(' '));
    }
 
    //  Debug output (VERY important for CI)
    core.info(`Running ZAP baseline scan`);
    core.info(`Target: ${target}`);
    core.info(`Docker image: ${dockerImage}`);
    core.info(`Final args: ${zapArgs.join(' ')}`);
 
    //  Run Docker container
    const dockerArgs: string[] = [
      'run',
      '--rm',
      '-v',
      `${reportsDir}:/zap/wrk`,
      dockerImage,
      ...zapArgs
    ];
 
    // const exitCode = await exec.exec('docker', dockerArgs);
 
    // core.info(`ZAP scan finished with exit code: ${exitCode}`);
 
    // // ✅ Handle ZAP exit codes explicitly (important for CI behaviour)
    // if (exitCode === 1) {
    //   core.setFailed('ZAP detected at least one FAIL issue');
    // } else if (exitCode === 2) {
    //   core.warning('ZAP detected WARN issues');
    // } else if (exitCode === 3) {
    //   core.setFailed('ZAP execution failed (configuration/runtime issue)');
    // }
 
    const exitCode = await exec.exec('docker', dockerArgs, {
      ignoreReturnCode: true
    });
 
    core.info(`ZAP scan finished with exit code: ${exitCode}`);
    core.info(`Fail policy: ${failOn}`);
 
    if (exitCode === 3) {
      core.setFailed('ZAP execution failed (runtime/config issue)');
    } else if (exitCode === 1) {
      core.setFailed('ZAP detected FAIL (High/Critical) issues');
    } else if (exitCode === 2) {
      if (failOn === 'medium' || failOn === 'low') {
        core.setFailed('ZAP detected WARN (Medium) issues and policy is to fail');
      } else {
        core.warning('ZAP detected WARN (Medium) issues — not failing the build');
      }
    } else {
      core.info('ZAP scan passed with no blocking issues');
    }
 
    // ✅ Only fail on FAIL (High/Critical)
    // if (exitCode === 1) {
    //   core.setFailed('ZAP detected at least one FAIL (High/Critical) issue');
    // } else if (exitCode === 2) {
    //   core.warning('ZAP detected WARN (Medium) issues — not failing the build');
    // } else if (exitCode === 3) {
    //   core.setFailed('ZAP execution failed (runtime/config issue)');
    // } else {
    //   core.info('ZAP scan passed with no blocking issues');
    // }
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}
 
run();

has context menu
