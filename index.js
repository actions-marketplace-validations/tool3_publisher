const core = require('@actions/core');
const { exec } = require('@actions/exec');

async function run() {
  try {
    const scope = core.getInput('scope');

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
      await promise;

      core.startGroup(registry);

      const { url, token } = registries[registry];
      core.info(`Publishing to ${registry}...`);

      try {
        await exec('npm', ['publish', `--registry=https://${url}/:_authToken=${token}`]);
        core.info(`Successfully published to ${registry} !`);
      } catch (error) {
        Promise.reject(error);
      }

      core.endGroup(registry);
    }, Promise.resolve());

  } catch (error) {
    core.setFailed(`Failed to publish ${error.message}`);
  }
}

run();