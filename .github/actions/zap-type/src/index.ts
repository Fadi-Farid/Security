
// import * as core from '@actions/core';
// import * as exec from '@actions/exec';
// import * as fs from 'fs';

// async function run(): Promise<void> {
//   try {
//     const target = core.getInput('target');

//     if (!target) {
//       core.setFailed('target is required');
//       return;
//     }

//     // Ensure reports dir exists
//     if (!fs.existsSync('zap-reports')) {
//       fs.mkdirSync('zap-reports');
//     }

//     // Start ZAP in daemon mode
//     await exec.exec('zap.sh', [
//       '-daemon',
//       '-port', '8080',
//       '-config', 'api.disablekey=true'
//     ]);

//     // Run baseline scan via CLI script
//     await exec.exec('zap-baseline.py', [
//       '-t', target,
//       '-r', 'zap-reports/report.html'
//     ]);

//   } catch (error) {
//     core.setFailed(error instanceof Error ? error.message : String(error));
//   }
// }

// run();


// import * as core from '@actions/core';
// import * as exec from '@actions/exec';

// import * as fs from 'fs';
// import * as path from 'path';

// async function run(): Promise<void> {
//   try {
//     const zapVersion = core.getInput('zap-version');
//     const rules = core.getInput('rules-file-name');

//     // Ensure ZAP writes to zap-reports folder
//     await exec.exec('docker', [
//       'run',
//       '--rm',
//       '-v', `${process.cwd()}/zap-reports:/zap/wrk`,
//       'zaproxy/zap-stable',
//       'zap-baseline.py',
//       '-r', 'report.html'
//     ]);

//   } catch (error) {
//     core.setFailed(error instanceof Error ? error.message : String(error));
//   }
// }

// run();


import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as fs from 'fs';
import * as path from 'path';

async function run(): Promise<void> {
  try {
    // ✅ Inputs
    const target = core.getInput('target');
    const dockerImage = core.getInput('docker_name') || 'zaproxy/zap-stable';
    const rulesFile = core.getInput('rules_file_name');
    const cmdOptions = core.getInput('cmd_options');

    // ✅ Validate required input
    if (!target) {
      core.setFailed('Input "target" is required');
      return;
    }

 

// ✅ FIX permissions

    // ✅ Ensure reports directory exists
    const reportsDir = path.join(process.cwd(), 'zap-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir);
    }
fs.chmodSync(reportsDir, 0o777);

    // ✅ Build ZAP arguments
    const zapArgs: string[] = [
      'zap-baseline.py',
      '-t', target,
      '-r', 'report.html',
      '-J', 'report.json' 
    ];

    // ✅ Optional: rules file
    if (rulesFile) {
      zapArgs.push('-c', rulesFile);
    }

    // ✅ Optional: custom options
    if (cmdOptions) {
      zapArgs.push(...cmdOptions.split(' '));
    }

    // ✅ Debug output (VERY important for CI)
    core.info(`Running ZAP baseline scan`);
    core.info(`Target: ${target}`);
    core.info(`Docker image: ${dockerImage}`);
    core.info(`Final args: ${zapArgs.join(' ')}`);

    // ✅ Run Docker container
    const dockerArgs: string[] = [
      'run',
      '--rm',
      '-v', `${reportsDir}:/zap/wrk`,
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

      // ✅ Only fail on FAIL (High/Critical)
      if (exitCode === 1) {
        core.setFailed('ZAP detected at least one FAIL (High/Critical) issue');
      } else if (exitCode === 2) {
        core.warning('ZAP detected WARN (Medium) issues — not failing the build');
      } else if (exitCode === 3) {
        core.setFailed('ZAP execution failed (runtime/config issue)');
      } else {
        core.info('ZAP scan passed with no blocking issues');
      }


  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

run();


// import * as core from '@actions/core';
// import * as exec from '@actions/exec';
// import * as github from '@actions/github';
// import { DefaultArtifactClient } from '@actions/artifact';   // ✅ FIX

// async function run(): Promise<void> {
//   try {
//     const zapVersion = core.getInput('zap-version');
//     const rules = core.getInput('rules-file-name');

//     await exec.exec('docker', [
//       'run',
//       '--rm',
//       '-v', `${process.cwd()}:/zap/wrk`,
//       'owasp/zap2docker-stable',
//       'zap-baseline.py',
//       '-r', 'report.html'
//     ]);

//     // ✅ Correct artifact client
//     const artifactClient = new DefaultArtifactClient();

//     await artifactClient.uploadArtifact(
//       'zap-baseline-report',
//       ['report.html'],
//       process.cwd()
//     );

//   } catch (error) {
//     core.setFailed(error instanceof Error ? error.message : String(error));
//   }
// }

// run();
