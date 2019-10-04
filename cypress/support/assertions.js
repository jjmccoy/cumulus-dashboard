exports.shouldBeLoggedIn = () => {
  cy.get('h1[class=heading--xlarge').should('have.text', 'CUMULUS Dashboard');
};

exports.shouldBeRedirectedToLogin = () => {
  cy.url().should('include', '/#/auth');
  cy.get('div[class=modal__internal]').within(() => {
    cy.get('a').should('have.attr', 'href').and('include', 'token?');
    cy.get('a').should('have.text', 'Login with Earthdata Login');
  });
};

exports.shouldHaveNoToken = () => {
  cy.window().its('appStore').then((store) => {
    expect(store.getState().api.tokens.token).to.be.null;
    cy.window().its('localStorage').invoke('getItem', 'auth-token').then(token => {
      expect(token).to.be.null;
    });
  });
};

exports.shouldHaveDeletedToken = () => {
  cy.window().its('appStore').then((store) => {
    expect(store.getState().api.tokens.token).to.be.null;
    cy.window().its('localStorage').invoke('getItem', 'auth-token').then(token => {
      expect(token).to.eq('');
    });
  });
};
