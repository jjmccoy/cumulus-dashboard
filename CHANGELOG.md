# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

### BREAKING CHANGES

- You must be using Cumulus API version v1.14.0 or above in order to use the new distribution metrics functionality.

## [Unreleased]

- **CUMULUS-1308**
  - Pass full provider object to API on edit to ensure compatibility with API
    changes where HTTP PUTs for Collections, Providers, and Rules expect full
    objects to be supplied (rather than partial objects)
  - Upgrade Cypress to latest version (3.4.1)
  - Eliminate "caniuse-lite is outdated" message during testing
  - Fix flaky Cypress integration test
  - Fix invalid value for prop `className` on `<a>` tag
  - Fix failed prop type error for checkboxes in tables
  - Fix unhandled rejection in `getMMTLinks` function

- **CUMULUS-1337**
  - Must use Cumulus API version v1.14.0 or above in order to use the new distribution metrics functionality.
  - Distribution metrics are no longer served from the Cumulus API , but are computed from the logs in an ELK stack.
  - If you want to display distribution metrics using a Kibana instance (ELK stack), you need to set the environment variables `KIBANAROOT` to point to the base url of an accessible Kibana instance as well as `ESROOT` to the Elastic Search endpoint holding your metrics.
  - The `KIBANAROOT` will be used to generate links to the kibana discovery page to interrogate errors/successes further.
  - The `ESROOT` is used to query Elasticsearch directly to retrieve the displayed counts.
  - For information on setting up the Cumulus Distribution API Logs and S3 Server Access see the [Cumulus distribution metrics documentation](https://nasa.github.io/cumulus/docs/features/distribution-metrics).
  - See this project's `README.md` for instructions on setting up development access for Kibana and Elasticsearch.
  
- **CUMULUS-1427**
  - Dashboard home page no longer displays non-error granules in the Granules
    Errors list


## [v1.4.0] - 2019-04-19

### BREAKING CHANGES

- You must be using Cumulus API version 1.12.1 or above with this version of the dashboard.

### Added

- **CUMULUS-820**
  - Added information from Cumulus vs CMR reconciliation report to page (files, collections, granules)
  - Added ability to expand/collapse tables in reconciliation report output. Tables larger than 10 rows are collapsed by default.

### Changed

- Updated to `gulp-sass@^3` so Python build of `node-sass` library is not required. Removed unnecessary direct dependency on `node-sass` package.

### Fixed

- Updates to `./bin/build_in_docker.sh` (Fixes #562):
  - Use `yarn` instead of `npm`.
  - Updated script to run in `node:8-slim` Docker image instead of `node:slim`.
  - Added ability to specify all environment variables for configuring dashboard when building via `./bin/build_in_docker.sh`.
  - Removed install of unnecessary system packages.

### Removed

- **CUMULUS-997** - Removed the deprecated "associated collections" section from the individual provider pages

## [v1.3.0] - 2019-03-04

### Added

- Execution details (inputs and outputs) are shown for executions and execution steps. [CUMULUS-692]
- Link to parent workflow execution if any exists. [Cumulus-689]
- Logs for specific workflow executions. [Cumulus-691]
- Documentation was added to the `execution-status.js` component about how to find task / version information for step function events. [Cumulus-690]
- Added Cypress for front-end testing. [Cumulus-918]
- Added tests for the login page and dashboard home page. [Cumulus-638]
- Added tests for the Collections page and Providers page. [Cumulus-643]
- Added warning message to granules `reingest` button to indicates that existing data will be overwritten. [Cumulus-792]

### Changed

- Updated React to version 16.6.3
- Updated all component classes using ES6 style [Cumulus-1096]

## [v1.2.0] - 2018-08-08

### Added

- `Execute` option on granules to start a workflow with the granule as payload.
- Dashboard menus now support `GITC` and `DAAC` labels. The dashboard also supports addition of new labels.

### Changed

- The Rules add and edit forms are changed to a JSON editor box
- All Rule fields are now editable on the dashboard

### Fixed

- batch-async-command now collects all errors in a queue, rather than emptying the queue after the first error

## [v1.1.0] - 2018-04-20

### Added

- Expandable errors. [CUMULUS-394]

### Changed

- In `components/logs/viewer.js`, changed references to `type` to `level` to match cumulus v1 logging [CUMULUS-306].
- Tests use ava instead of tape. [CUMULUS-418]
- Remove `defaultVersion` from the config. To use a particular version of the API, just set that in the API URL.

## v1.0.1 - 2018-03-07

### Added

- Versioning and changelog [CUMULUS-197] by @kkelly51

[Unreleased]: https://github.com/nasa/cumulus-dashboard/compare/v1.4.0...HEAD
[v1.4.0]: https://github.com/nasa/cumulus-dashboard/compare/v1.3.0...v1.4.0
[v1.3.0]: https://github.com/nasa/cumulus-dashboard/compare/v1.2.0...v1.3.0
[v1.2.0]: https://github.com/nasa/cumulus-dashboard/compare/v1.1.0...v1.2.0
[v1.1.0]: https://github.com/nasa/cumulus-dashboard/compare/v1.0.1...v1.1.0
