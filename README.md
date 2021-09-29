# Secure Static Site

## Setup

1. `cd cdk-construct`
1. `npm i`
1. `npm link` -> installs symlink into your global node_modules folder
1. `cd ../static-site`
1. `npm i`
1. `npm link secure-static-site` -> symlinks previously globally "installed" node module into local node_modules
1. `cdk deploy`