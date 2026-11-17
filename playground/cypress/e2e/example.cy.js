describe('Playground', () => {
  it('loads the configuration controls and preview', () => {
    cy.visit('/')
    cy.contains('h1', 'Grid Plan')
    cy.get('#setting-showGrid2d').should('be.checked')
    cy.get('#use-icon-library').check()
    cy.get('.grid-plan-component-icon i.bi').should('exist')
  })
})
