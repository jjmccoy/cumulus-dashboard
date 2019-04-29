// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
// import { resetTables } from '../../node_modules/@cumulus/api/bin/serve';
import { DELETE_TOKEN, SET_TOKEN } from '../../app/scripts/actions/types';

Cypress.Commands.add('login', () => {
  const authUrl = `${Cypress.config('baseUrl')}/#/auth`;
  cy.request({
    url: `${Cypress.env('APIROOT')}/token`,
    qs: {
      state: encodeURIComponent(authUrl)
    },
    followRedirect: true
  }).then((response) => {
    const redirectUrl = response.redirects[1].split(' ')[1];
    const token = redirectUrl.split('=')[1];
    cy.window().its('appStore').then((store) => {
      store.dispatch({
        type: SET_TOKEN,
        token
      });
    });
  });
});

Cypress.Commands.add('logout', () => {
  cy.window().its('appStore')
    .then((store) => {
      store.dispatch({
        type: DELETE_TOKEN
      });
    });
  cy.reload();
});

Cypress.Commands.add('resetTables', () => {
  cy.exec('cd ./node_modules/@cumulus/api && npm run reset-tables');
});

Cypress.Commands.add('editJsonTextarea', ({ data, update = false }) => {
  cy.window().its('aceEditorRef').its('editor').then((editor) => {
    if (update) {
      const value = editor.getValue();
      let currentObject = JSON.parse(value);
      data = Cypress._.assign(currentObject, data);
    }
    data = JSON.stringify(data);
    editor.setValue(data);
  });
});

Cypress.Commands.add('getJsonTextareaValue', () => {
  return cy.window().its('aceEditorRef').its('editor').then((editor) => {
    const value = editor.getValue();
    return JSON.parse(value);
  });
});

Cypress.Commands.add('getFakeApiFixture', (fixturePath) => {
  const fixtureFile = `./test/fake-api/fixtures/${fixturePath}/index.json`;
  return cy.readFile(fixtureFile);
});
