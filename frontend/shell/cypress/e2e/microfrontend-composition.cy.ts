describe(
  "FulfillIQ micro-frontend composition",
  () => {
    beforeEach(
      () => {
        cy.visit("/");
      }
    );

    describe(
      "unauthenticated shell boundary",
      () => {
        it(
          "loads the FulfillIQ shell",
          () => {
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
          }
        );

        it(
          "does not expose federated business modules before authentication",
          () => {
            cy.contains(
              "order-mfe"
            ).should(
              "not.exist"
            );

            cy.contains(
              "fulfillment-mfe"
            ).should(
              "not.exist"
            );

            cy.contains(
              "manager-mfe"
            ).should(
              "not.exist"
            );

            cy.contains(
              "SYN-1001"
            ).should(
              "not.exist"
            );

            cy.contains(
              "Candidate Locations"
            ).should(
              "not.exist"
            );

            cy.contains(
              "Fulfillment Simulator"
            ).should(
              "not.exist"
            );
          }
        );
      }
    );

    describe(
      "remote availability",
      () => {
        it(
          "serves the Order MFE remote entry",
          () => {
            cy.request(
              "http://localhost:5174/remoteEntry.js"
            ).then(
              response => {
                expect(
                  response.status
                ).to.eq(
                  200
                );

                expect(
                  response.body
                ).to.be.a(
                  "string"
                );

                expect(
                  response.body.length
                ).to.be.greaterThan(
                  0
                );
              }
            );
          }
        );

        it(
          "serves the Fulfillment MFE remote entry",
          () => {
            cy.request(
              "http://localhost:5175/remoteEntry.js"
            ).then(
              response => {
                expect(
                  response.status
                ).to.eq(
                  200
                );

                expect(
                  response.body
                ).to.be.a(
                  "string"
                );

                expect(
                  response.body.length
                ).to.be.greaterThan(
                  0
                );
              }
            );
          }
        );

        it(
          "serves the Manager MFE remote entry",
          () => {
            cy.request(
              "http://localhost:5176/remoteEntry.js"
            ).then(
              response => {
                expect(
                  response.status
                ).to.eq(
                  200
                );

                expect(
                  response.body
                ).to.be.a(
                  "string"
                );

                expect(
                  response.body.length
                ).to.be.greaterThan(
                  0
                );
              }
            );
          }
        );
      }
    );
  }
);