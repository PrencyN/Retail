describe(
  "FulfillIQ secured fulfillment workflow",
  () => {
    const fulfillmentApi =
      "http://localhost:5249";

    const inventoryApi =
      "http://localhost:5284";

    const orderReference =
      "SYN-1001";

    const electronicsProductId =
      "cdbbf518-d4d4-4c8f-9aaf-e3e6188d6d99";

    function withAccessToken(
      action: (
        accessToken: string
      ) => void
    ) {
      cy.env(
        [
          "ACCESS_TOKEN",
        ]
      ).then(
        ({
          ACCESS_TOKEN,
        }) => {
          if (!ACCESS_TOKEN) {
            throw new Error(
              "ACCESS_TOKEN is not configured. " +
              "Provide a valid FulfillIQ API " +
              "access token before running this spec."
            );
          }

          action(
            ACCESS_TOKEN
          );
        }
      );
    }

    function authHeaders(
      accessToken: string
    ) {
      return {
        Authorization:
          `Bearer ${accessToken}`,

        "Content-Type":
          "application/json",

        Accept:
          "application/json",
      };
    }

    function calculateFulfillment(
      accessToken: string
    ) {
      return cy.request({
        method:
          "POST",

        url:
          `${fulfillmentApi}` +
          `/api/fulfillment/orders/` +
          `${orderReference}/calculate`,

        headers:
          authHeaders(
            accessToken
          ),
      });
    }

    function updateWorkload(
      accessToken: string,
      workloadPercent: number
    ) {
      return cy.request({
        method:
          "PUT",

        url:
          `${inventoryApi}` +
          `/api/locations/HYD-03/workload`,

        headers:
          authHeaders(
            accessToken
          ),

        body: {
          workloadPercent,
        },
      });
    }

    function updateInventory(
      accessToken: string,
      availableQuantity: number,
      reservedQuantity: number,
      reorderLevel: number
    ) {
      return cy.request({
        method:
          "PUT",

        url:
          `${inventoryApi}` +
          `/api/inventory/` +
          `${electronicsProductId}/HYD-02`,

        headers:
          authHeaders(
            accessToken
          ),

        body: {
          availableQuantity,
          reservedQuantity,
          reorderLevel,
        },
      });
    }

    function resetDemo(
      accessToken: string
    ) {
      updateWorkload(
        accessToken,
        25
      )
        .its(
          "status"
        )
        .should(
          "eq",
          200
        );

      updateInventory(
        accessToken,
        4,
        1,
        2
      )
        .its(
          "status"
        )
        .should(
          "eq",
          200
        );
    }

    beforeEach(
      () => {
        withAccessToken(
          accessToken => {
            resetDemo(
              accessToken
            );
          }
        );
      }
    );

    afterEach(
      () => {
        withAccessToken(
          accessToken => {
            resetDemo(
              accessToken
            );
          }
        );
      }
    );

    it(
      "returns HYD-03 as the baseline recommendation",
      () => {
        withAccessToken(
          accessToken => {
            calculateFulfillment(
              accessToken
            ).then(
              response => {
                expect(
                  response.status
                ).to.eq(
                  200
                );

                expect(
                  response.body
                    .orderReference
                ).to.eq(
                  "SYN-1001"
                );

                expect(
                  response.body
                    .recommendedLocationCode
                ).to.eq(
                  "HYD-03"
                );

                expect(
                  response.body
                    .recommendedLocationName
                ).to.eq(
                  "Kukatpally Store"
                );

                expect(
                  response.body
                    .winningScore
                ).to.be.closeTo(
                  69.64,
                  0.01
                );
              }
            );
          }
        );
      }
    );

    it(
      "changes the recommendation to WH-01 when HYD-03 workload reaches 95 percent",
      () => {
        withAccessToken(
          accessToken => {
            updateWorkload(
              accessToken,
              95
            ).then(
              response => {
                expect(
                  response.status
                ).to.eq(
                  200
                );

                expect(
                  response.body
                    .code
                ).to.eq(
                  "HYD-03"
                );

                expect(
                  response.body
                    .workloadPercent
                ).to.eq(
                  95
                );
              }
            );

            calculateFulfillment(
              accessToken
            ).then(
              response => {
                expect(
                  response.status
                ).to.eq(
                  200
                );

                expect(
                  response.body
                    .recommendedLocationCode
                ).to.eq(
                  "WH-01"
                );

                expect(
                  response.body
                    .recommendedLocationName
                ).to.eq(
                  "Central Fulfillment Warehouse"
                );

                expect(
                  response.body
                    .winningScore
                ).to.be.closeTo(
                  67,
                  0.01
                );

                const hyd03 =
                  response.body
                    .candidates
                    .find(
                      (
                        candidate: {
                          locationCode:
                            string;
                        }
                      ) =>
                        candidate
                          .locationCode ===
                        "HYD-03"
                    );

                expect(
                  hyd03
                ).to.exist;

                expect(
                  hyd03
                    .workloadPercent
                ).to.eq(
                  95
                );

                expect(
                  hyd03
                    .totalScore
                ).to.be.lessThan(
                  67
                );
              }
            );
          }
        );
      }
    );

    it(
      "restores HYD-03 after the demo is reset",
      () => {
        withAccessToken(
          accessToken => {
            updateWorkload(
              accessToken,
              95
            );

            calculateFulfillment(
              accessToken
            )
              .its(
                "body.recommendedLocationCode"
              )
              .should(
                "eq",
                "WH-01"
              );

            resetDemo(
              accessToken
            );

            calculateFulfillment(
              accessToken
            ).then(
              response => {
                expect(
                  response.status
                ).to.eq(
                  200
                );

                expect(
                  response.body
                    .recommendedLocationCode
                ).to.eq(
                  "HYD-03"
                );

                expect(
                  response.body
                    .winningScore
                ).to.be.closeTo(
                  69.64,
                  0.01
                );
              }
            );
          }
        );
      }
    );

    it(
      "makes HYD-02 ineligible when electronics stock becomes unavailable",
      () => {
        withAccessToken(
          accessToken => {
            updateInventory(
              accessToken,
              0,
              0,
              2
            ).then(
              response => {
                expect(
                  response.status
                ).to.eq(
                  200
                );

                expect(
                  response.body
                    .locationCode
                ).to.eq(
                  "HYD-02"
                );

                expect(
                  response.body
                    .availableToSell
                ).to.eq(
                  0
                );
              }
            );

            calculateFulfillment(
              accessToken
            ).then(
              response => {
                expect(
                  response.status
                ).to.eq(
                  200
                );

                const hyd02 =
                  response.body
                    .candidates
                    .find(
                      (
                        candidate: {
                          locationCode:
                            string;
                        }
                      ) =>
                        candidate
                          .locationCode ===
                        "HYD-02"
                    );

                expect(
                  hyd02
                ).to.exist;

                expect(
                  hyd02
                    .eligible
                ).to.eq(
                  false
                );

                expect(
                  hyd02
                    .completeBasket
                ).to.eq(
                  false
                );

                expect(
                  response.body
                    .recommendedLocationCode
                ).to.eq(
                  "HYD-03"
                );
              }
            );
          }
        );
      }
    );
  }
);