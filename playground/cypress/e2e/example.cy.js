describe("Playground", () => {
  it("loads the configuration controls and preview", () => {
    cy.visit("/");
    cy.contains("h1", "Grid Plan");
    cy.get("#setting-showGrid2d").should("be.checked");
    cy.get("#use-icon-library").check();
    cy.get(".grid-plan-component-icon i.bi").should("exist");
  });

  it("synchronizes external menu and inventory actions with the grid", () => {
    cy.visit("/");
    cy.get(".blueprint .grid-plan-menu").should("not.exist");
    cy.get(".blueprint .grid-plan-inventory").should("not.exist");
    cy.get(".grid-plan-menu > summary").click();
    cy.get(".grid-plan-menu button")
      .first()
      .click()
      .should("have.attr", "aria-pressed", "true");
    cy.get(".grid-plan-inventory > summary").click();
    cy.get(".inventory-item").first().contains("button", "Focus").click();
    cy.get(".grid-plan-delete-control").should("exist");
    cy.get(".inventory-item").then((rows) => {
      const count = rows.length;
      cy.get(".inventory-item").first().contains("button", "Delete").click();
      cy.get(".inventory-item").should("have.length", count - 1);
    });
    cy.get(".grid-plan-delete-control").should("not.exist");
  });
});
