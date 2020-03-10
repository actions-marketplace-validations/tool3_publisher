const core = require('@actions/core');
const { exec } = require('@actions/exec');
const fs = require('fs');
const os = require('os');
const util = require('util');
const write = util.promisify(fs.writeFile);

async function run() {
  try {
    const scope = core.getInput('scope');
    const sanitizedScope = scope.includes('@') ? scope : `@${scope}`

    const registries = {
      github: {
        url: 'npm.pkg.github.com',
        token: core.getInput('github_token')
      },
      npm: {
        url: 'registry.npmjs.org',
        token: core.getInput('npm_token')
      }
    };

    core.info(`using scope: ${scope}`);

    await Object.keys(registries).reduce(async (promise, registry) => {
      const { url, token } = registries[registry];
      await promise;
      core.startGroup(`Publishing to ${registry}`);

      // create a local .npmrc file
      const npmrc = `${os.homedir()}/.npmrc`
      await write(npmrc, `//${url}/:_authToken=${token}`);

      // get latest tags
      await exec('git', ['pull', 'origin', 'master', '--tags']);

      // configure npm and publish
      await exec('npm', ['config', 'set', 'registry', `https://${url}`]);
      await exec('npm', ['publish', `--scope=${sanitizedScope}`]);

      core.info(`Successfully published to ${registry} !`);

      core.endGroup(`Publishing to ${registry}`)
    }, Promise.resolve());

  } catch (error) {
    core.setFailed(`Failed to publish ${error.message}`);
  }
}

run();
