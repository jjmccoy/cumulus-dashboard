import { shouldBeRedirectedToLogin, shouldHaveDeletedToken } from '../support/assertions';
import { listGranules } from '../../app/scripts/actions';
import { SET_TOKEN } from '../../app/scripts/actions/types';

describe('Dashboard authentication', () => {
  before(() => {
    // make sure to visit app before cy.login() so that reference to
    // data store exists on window.appStore
    cy.visit('/');
  });

  beforeEach(() => {
    cy.login();
  });

  it('should not attempt refresh for non-JWT token', () => {
    cy.visit('/');

    cy.window().its('appStore').then((store) => {
      store.dispatch({
        type: SET_TOKEN,
        token: 'fake-token'
      });

      store.dispatch(listGranules());

      // token should not have been updated
      expect(store.getState().api.tokens.inflight).to.eq(false);
      expect(store.getState().api.tokens.token).to.eq('fake-token');
    });

    cy.url().should('not.include', '/#/auth');
  });

  it('should logout user on invalid JWT token', () => {
    cy.visit('/');

    cy.window().its('appStore').then((store) => {
      cy.task('generateJWT', {}).then((invalidJwt) => {
        // Dispatch an action to set the token
        store.dispatch({
          type: SET_TOKEN,
          token: invalidJwt
        });

        // Dispatch an action to request granules. It should fail
        // and log the user out when it recognizes the invalid token.
        store.dispatch(listGranules());
      });
    });

    shouldBeRedirectedToLogin();
    cy.contains('.error__report', 'Invalid token');

    shouldHaveDeletedToken();
  });

  it('should logout user on failed token refresh', () => {
    cy.visit('/');

    cy.server();
    cy.route({
      method: 'POST',
      url: `${Cypress.env('APIROOT')}/refresh`,
      status: 500,
      response: {}
    });

    cy.window().its('appStore').then((store) => {
      cy.task('generateJWT', { expiresIn: -10 }).then((expiredJwt) => {
        store.dispatch({
          type: SET_TOKEN,
          token: expiredJwt
        });

        store.dispatch(listGranules());
      });
    });

    shouldBeRedirectedToLogin();
    cy.contains('.error__report', 'Session expired');

    shouldHaveDeletedToken();
  });
});
