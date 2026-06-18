import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';
import * as artifact from '@actions/artifact';

// Main action logic
async function run(): Promise<void> {
  try {
    // Get inputs
    const zapVersion = core.getInput('zap-version');
    const rules = core.getInput('rules-file-name');
    
    // Execute ZAP baseline
    await exec.exec('docker', ['run', 'owasp/zap2docker-stable', 'zap-baseline.py']);
    
    // Handle artifacts
    const artifactClient = artifact.create();
    await artifactClient.uploadArtifact(
      'zap-baseline-report',
      ['report.html'],
      process.cwd()
    );
    
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

run();
