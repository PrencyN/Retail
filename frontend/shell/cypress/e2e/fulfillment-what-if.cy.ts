describe(
  "FulfillIQ authentication",
  () => {
    it(
      "requires Microsoft sign-in before showing the fulfillment dashboard",
      () => {
        cy.visit("/");

        cy.contains(
          "FulfillIQ"
        ).should(
          "be.visible"
        );

        cy.contains(
          "Intelligent fulfillment decisions"
        ).should(
          "be.visible"
        );

        cy.contains(
          "Sign in with Microsoft"
        ).should(
          "be.visible"
        );

        cy.contains(
          "SYN-1001"
        ).should(
          "not.exist"
        );
      }
    );

    it(
      "shows the Entra authorization requirement",
      () => {
        cy.visit("/");

        cy.contains(
          "Microsoft Entra role authorization"
        ).should(
          "be.visible"
        );

        cy.contains(
          /Fulfillment Manager or Admin role/i
        ).should(
          "be.visible"
        );
      }
    );
  }
);