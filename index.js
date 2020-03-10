const core = require('@actions/core');
const { exec } = require('@actions/exec');
const fs = require('fs');
const os = require('os');
const util = require('util');
const write = util.promisify(fs.writeFile);

async function run() {
  try {
    let scope = core.getInput('scope');
    let sanitizedScope = scope && (scope.includes('@') ? scope : `@${scope}`)
    const npmrc = `${os.homedir()}/.npmrc`
    const packageJson = require(`${process.cwd()}/package.json`);
    const packageName = packageJson.name;
    const scopedPackage = packageName.includes('@');

    const registries = {
      github: {
        url: `npm.pkg.github.com`,
        token: core.getInput('github_token'),
        scopeAnyWay: true
      },
      npm: {
        url: 'registry.npmjs.org',
        token: core.getInput('npm_token'),
        scopeAnyWay: false
      }
    };

    if (scopedPackage) {
      sanitizedScope = packageName.split('/')[0];
    }

    core.info(`using scope: ${scope}`);

    await Object.keys(registries).reduce(async (promise, registry) => {
      const { url, token, scopeAnyWay } = registries[registry];
      await promise;
      core.startGroup(`Publishing to ${registry}`);

      const regstr = scopeAnyWay ? `${url}/${sanitizedScope}` : url;

      // create a local .npmrc file
      await write(npmrc, `//${regstr}/:_authToken=${token}`);

      // get latest tags
      await exec('git', ['pull', 'origin', 'master', '--tags']);

      // configure npm and publish
      const publishArgs = ['publish'];

      if (scopedPackage || scopeAnyWay) {
        publishArgs.push(`--scope=${sanitizedScope}`);
      }

      await exec('npm', publishArgs);

      core.info(`Successfully published to ${registry} !`);
      core.endGroup(`Publishing to ${registry}`)

    }, Promise.resolve());

  } catch (error) {
    core.setFailed(`Failed to publish ${error.message}`);
  }
}

run();
