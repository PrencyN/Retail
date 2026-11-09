import {
  render,
  screen,
  within,
} from "@testing-library/react";

import {
  describe,
  expect,
  it,
} from "vitest";

import OrderSummaryRemote
  from "./OrderSummaryRemote";

const testItems = [
  {
    productName:
      "Nike Black Performance Running Shoe",

    quantity:
      2,
  },

  {
    productName:
      "Reebok Grey Clothing 24",

    quantity:
      1,
  },

  {
    productName:
      "RetailIQ Red Electronics 25",

    quantity:
      1,
  },
];

function renderOrderSummary() {
  return render(
    <OrderSummaryRemote
      orderReference="SYN-1001"
      customerName="Synthetic Customer"
      fulfillmentZone="Hyderabad"
      items={
        testItems
      }
    />
  );
}

describe(
  "OrderSummaryRemote",
  () => {
    it(
      "shows the synthetic order reference",
      () => {
        renderOrderSummary();

        expect(
          screen.getByText(
            "Synthetic Order"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "heading",
            {
              name:
                "SYN-1001",
            }
          )
        ).toBeInTheDocument();
      }
    );

    it(
      "shows the customer and fulfillment zone",
      () => {
        renderOrderSummary();

        expect(
          screen.getByText(
            "Customer: Synthetic Customer"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Zone: Hyderabad"
          )
        ).toBeInTheDocument();
      }
    );

    it(
      "shows every order item and quantity",
      () => {
        renderOrderSummary();

        const orderItems =
          screen.getByLabelText(
            "Order items"
          );

        expect(
          within(
            orderItems
          ).getByText(
            "Nike Black Performance Running Shoe"
          )
        ).toBeInTheDocument();

        expect(
          within(
            orderItems
          ).getByText(
            "Reebok Grey Clothing 24"
          )
        ).toBeInTheDocument();

        expect(
          within(
            orderItems
          ).getByText(
            "RetailIQ Red Electronics 25"
          )
        ).toBeInTheDocument();

        expect(
          within(
            orderItems
          ).getByText(
            "× 2"
          )
        ).toBeInTheDocument();

        expect(
          within(
            orderItems
          ).getAllByText(
            "× 1"
          )
        ).toHaveLength(
          2
        );
      }
    );

    it(
      "shows the order micro-frontend badge",
      () => {
        renderOrderSummary();

        expect(
          screen.getByText(
            "order-mfe"
          )
        ).toBeInTheDocument();
      }
    );

    it(
      "shows an empty-order message when no items are supplied",
      () => {
        render(
          <OrderSummaryRemote
            orderReference="SYN-EMPTY"
            customerName="Synthetic Customer"
            fulfillmentZone="Hyderabad"
            items={[]}
          />
        );

        expect(
          screen.getByText(
            "No items are available for this order."
          )
        ).toBeInTheDocument();
      }
    );
  }
);