# Cumulus Dashboard

[![CircleCI](https://circleci.com/gh/nasa/cumulus-dashboard.svg?style=svg)](https://circleci.com/gh/nasa/cumulus-dashboard)

Code to generate and deploy the dashboard for the Cumulus API.

## Documentation

- [Usage](https://github.com/nasa/cumulus-dashboard/blob/master/USAGE.md)
- [Development Guide](https://github.com/nasa/cumulus-dashboard/blob/master/DEVELOPMENT.md)
- [Technical documentation on tables](https://github.com/nasa/cumulus-dashboard/blob/master/TABLES.md)

## Wireframes and mocks

- [Designs](ancillary/dashboard-designs.pdf)
- [Wireframes](ancillary/dashboard-wireframes.pdf)

## Configuration

The dashboard is populated from the Cumulus API. The dashboard has to point to a working version of the Cumulus API before it is installed and built.

The information needed to configure the dashboard is stored at `app/scripts/config/config.js`.

The following environment variables override the default values in `config.js`:

| Env Name | Description |
| -------- | ----------- |
| HIDE_PDR | whether to hide the PDR menu, default to true |
| DAAC\_NAME    | e.g. LPDAAC, default to Local |
| STAGE | e.g. UAT, default to development |
| LABELS | gitc or daac localization (defaults to daac) |
| APIROOT | the API URL. This must be set by the user as it defaults to example.com |
| ENABLE\_RECOVERY | If true, adds recovery options to the granule and collection pages. default: false |
| KIBANAROOT | \<optional\> Should point to a Kibana endpoint. Must be set to examine distribution metrics details. |
| SHOW\_TEA\_METRICS | \<optional\> display metrics from Thin Egress Application (TEA). default: true |
| SHOW\_DISTRIBUTION\_API\_METRICS | \<optional\> Display metrics from Cumulus Distribution API. default: false |
| ESROOT | \<optional\> Should point to an Elasticsearch endpoint. Must be set for distribution metrics to be displayed. |
| ES\_USER | \<optional\> Elasticsearch username, needed when protected by basic authorization |
| ES\_PASSWORD | \<optional\> Elasticsearch password,needed when protected by basic authorization |


## Building or running locally

The dashboard uses node v8.11. To build/run the dashboard on your local machine using node v8.11, install [nvm](https://github.com/creationix/nvm) and run `nvm use`.

`yarn` is required to install the correct dependencies for the dashboard. To install `yarn`:

```bash
  $ nvm use
  $ npm install -g yarn
```

## Building the dashboard

### Building in Docker

The Cumulus Dashboard can be built inside of a Docker container, without needing to install any local dependencies.

```bash
  $ DAAC_NAME=LPDAAC STAGE=production HIDE_PDR=false LABELS=daac APIROOT=https://myapi.com ./bin/build_in_docker.sh
```

**NOTE**: Only the `APIROOT` environment variable is required.

The compiled files will be placed in the `dist` directory.

### Building locally

To build the dashboard:

```bash
  $ nvm use
  $ DAAC_NAME=LPDAAC STAGE=production HIDE_PDR=false LABELS=daac APIROOT=https://myapi.com yarn run build
```

**NOTE**: Only the `APIROOT` environment variable is required.

The compiled files will be placed in the `dist` directory.

### Building a specific dashboard version

`cumulus-dashboard` versions are distributed using tags in GitHub. You can pull a specific version in the following manner:

```bash
  $ git clone https://github.com/nasa/cumulus-dashboard
  $ cd cumulus-dashboard
  $ git fetch origin ${tagNumber}:refs/tags/${tagNumber}
  $ git checkout ${tagNumber}
```

Then follow the steps noted above to build the dashboard locally or using Docker.

## Running the dashboard

### Running locally

To run the dashboard locally:

```bash
  $ git clone https://github.com/nasa/cumulus-dashboard
  $ cd cumulus-dashboard
  $ nvm use
  $ yarn install
  $ APIROOT=https://myapi.com yarn run serve
```

#### Fake API server

For development and testing purposes, you can use a fake API server provided with the dashboard. To use the fake API server, run `node fake-api.js` in a separate terminal session, then launch the dashboard with:

```bash
  $ nvm use
  $ APIROOT=http://localhost:5001 yarn run serve
```

#### NGAP Sandbox Metrics Development

##### Kibana and Elasticsearch access

In order to develop features that interact with Kibana or Elasticsearch in the NGAP sandbox, you need to set up tunnels through the metric's teams bastion-host.  First you must get access to the metric's host. This will require a [NASD ticket](https://bugs.earthdata.nasa.gov/servicedesk/customer/portal/7/create/79) and permission from the metrics team.  Once you have access to the metrics-bastion-host you can get the IP addresses for the Bastion, Kibana and Elasticsearch from the metrics team and configure your `.ssh/config` file to create you local tunnels.  This configuration will open traffic to the Kibana endpoint on localhost:5601 and Elasticsearch on localhost:9201 tunneling traffic through the Bastion and Kibana machines.

```
Host metrics-bastion-host
  Hostname "Bastion.Host.Ip.Address"
  User ec2-user
  IdentitiesOnly yes
  IdentityFile ~/.ssh/your_private_bastion_key
Host metrics-elk-tunnels
  Hostname "Kibana.Host.IP.Address"
  IdentitiesOnly yes
  ProxyCommand ssh metrics-bastion-host -W %h:%p
  User ec2-user
  IdentityFile ~/.ssh/your_private_bastion_key
  # kibana
  LocalForward 5601 "Kibana.Host.IP.Address":5601
  # elastic search
  LocalForward 9201 "Elasticsearch.Host.IP.Address":9201
```

Now you can configure you sandbox environment with these variables.

```sh
export ESROOT=http://localhost:9201
export KIBANAROOT=http://localhost:5601
```

If the Elasticsearch machine is protected by basic authorization, the following two variables should also be set.

```sh
export ES_USER=<username>
export ES_PASSWORD=<password>
```



### Running locally in Docker

There is a script called `bin/build_docker_image.sh` which will build a Docker image
that runs the Cumulus dashboard.  It expects that the dashboard has already been
built and can be found in the `dist` directory.

The script takes one optional parameter, the tag that you would like to apply to
the generated image.

Example of building and running the project in Docker:

```bash
  $ ./bin/build_docker_image.sh cumulus-dashboard:production-1
  ...
  $ docker run -e PORT=8181 -p 8181:8181 cumulus-dashboard:production-1
```

In this example, the dashboard would be available at http://localhost:8181/.

## Deployment Using S3

First build the site

```bash
  $ nvm use
  $ DAAC_NAME=LPDAAC STAGE=production HIDE_PDR=false LABELS=daac APIROOT=https://myapi.com yarn run build
```

Then deploy the `dist` folder

```bash
  $ aws s3 sync dist s3://my-bucket-to-be-used --acl public-read
```

## Tests

### Unit Tests

```bash
  $ yarn run test
```

## Integration & Validation Tests

For the integration tests to work, you have to launch the fake API and the dashboard first. Run the following commands in separate terminal sessions:

```bash
  $ node fake-api.js
  $ APIROOT=http://localhost:5001 yarn run serve
```

Run the test suite in another terminal:

```bash
  $ yarn run validation
  $ yarn run cypress
```

When the cypress editor opens, click on `run all specs`.

## develop vs. master branches

The `master` branch is the branch where the source code of HEAD always reflects the latest product release. The `develop` branch is the branch where the source code of HEAD always reflects the latest merged development changes for the next release.  The `develop` branch is the branch where we should branch off.

When the source code in the develop branch reaches a stable point and is ready to be released, all of the changes should be merged back into master and then tagged with a release number.

## How to release

### 1. Checkout `develop` branch

We will make changes in the `develop` branch.

### 2. Create a new branch for the release

Create a new branch off of the `develop` branch for the release named `release-vX.X.X` (e.g. `release-v1.3.0`).

### 3. Update the version number

When changes are ready to be released, the version number must be updated in `package.json`.

### 4. Update the minimum version of Cumulus API if necessary

See the `minCompatibleApiVersion` value in `app/scrips/config/index.js`.

### 5. Update CHANGELOG.md

Update the CHANGELOG.md. Put a header under the 'Unreleased' section with the new version number and the date.

Add a link reference for the GitHub "compare" view at the bottom of the CHANGELOG.md, following the existing pattern. This link reference should create a link in the CHANGELOG's release header to changes in the corresponding release.

### 6. Create a pull request against the master branch

Create a PR for the `release-vX.X.X` branch against the `master` branch. Verify that the Circle CI build for the PR succeeds and then merge to `master`.

### 7. Create a git tag for the release

Push a new release tag to Github. The tag should be in the format `v1.2.3`, where `1.2.3` is the new version.

Create and push a new git tag:

```bash
  $ git checkout master
  $ git tag -a v1.x.x -m "Release 1.x.x"
  $ git push origin v1.x.x
```

### 8. Add the release to GitHub

Follow the [Github documentation to create a new release](https://help.github.com/articles/creating-releases/) for the dashboard using the tag that you just pushed. Make sure to use the content from the CHANGELOG for this release as the description of the release on GitHub.

### 9. Create a pull request against the develop branch

The updates to the CHANGELOG and the version number still need to be merged back to the `develop` branch.

Create a PR for the `release-vX.X.X` branch against the `develop` branch. Verify that the Circle CI build for the PR succeeds and then merge to `develop`.
