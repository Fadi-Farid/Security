
import * as core from '@actions/core';
import * as exec from '@actions/exec';

async function run(): Promise<void> {
  try {
    const zapVersion = core.getInput('zap-version');
    const rules = core.getInput('rules-file-name');

    // Ensure ZAP writes to zap-reports folder
    await exec.exec('docker', [
      'run',
      '--rm',
      '-v', `${process.cwd()}/zap-reports:/zap/wrk`,
      'owasp/zap2docker-stable',
      'zap-baseline.py',
      '-r', 'report.html'
    ]);

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