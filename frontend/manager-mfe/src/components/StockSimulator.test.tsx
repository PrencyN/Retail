import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import userEvent
  from "@testing-library/user-event";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import StockSimulator
  from "./StockSimulator";

function renderSimulator(
  onUpdateStock =
    vi.fn()
) {
  return render(
    <StockSimulator
      productId="cdbbf518-d4d4-4c8f-9aaf-e3e6188d6d99"
      productName="RetailIQ Red Electronics 25"
      locationCode="HYD-02"
      locationName="Hitech City Store"
      initialAvailableQuantity={4}
      initialReservedQuantity={1}
      initialReorderLevel={2}
      resetVersion={0}
      onUpdateStock={
        onUpdateStock
      }
    />
  );
}

describe(
  "StockSimulator",
  () => {
    it(
      "shows product and location details",
      () => {
        renderSimulator();

        expect(
          screen.getByRole(
            "heading",
            {
              name:
                "Stock Simulator",
            }
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "RetailIQ Red Electronics 25"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Hitech City Store"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "HYD-02"
          )
        ).toBeInTheDocument();
      }
    );

    it(
      "shows initial inventory and ATS",
      () => {
        renderSimulator();

        const fields =
          screen.getAllByRole(
            "spinbutton"
          );

        expect(
          fields[0]
        ).toHaveValue(
          4
        );

        expect(
          fields[1]
        ).toHaveValue(
          1
        );

        expect(
          fields[2]
        ).toHaveValue(
          2
        );

        expect(
          screen.getByText(
            "Available to sell"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "3"
          )
        ).toBeInTheDocument();
      }
    );

    it(
      "changes stock to zero",
      async () => {
        const user =
          userEvent.setup();

        renderSimulator();

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Out of stock",
            }
          )
        );

        const fields =
          screen.getAllByRole(
            "spinbutton"
          );

        expect(
          fields[0]
        ).toHaveValue(
          0
        );

        expect(
          fields[1]
        ).toHaveValue(
          0
        );
      }
    );

    it(
      "calls the stock callback",
      async () => {
        const user =
          userEvent.setup();

        const callback =
          vi.fn().mockResolvedValue(
            undefined
          );

        renderSimulator(
          callback
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Out of stock",
            }
          )
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Apply Stock & Recalculate",
            }
          )
        );

        await waitFor(
          () => {
            expect(
              callback
            ).toHaveBeenCalledTimes(
              1
            );
          }
        );

        expect(
          callback
        ).toHaveBeenCalledWith(
          "cdbbf518-d4d4-4c8f-9aaf-e3e6188d6d99",
          "HYD-02",
          0,
          0,
          2,
          expect.objectContaining({
            title:
              "Stock Updated",
          })
        );
      }
    );

    it(
      "rejects reserved quantity greater than available",
      async () => {
        const user =
          userEvent.setup();

        const callback =
          vi.fn();

        renderSimulator(
          callback
        );

        const fields =
          screen.getAllByRole(
            "spinbutton"
          );

        await user.clear(
          fields[0]
        );

        await user.type(
          fields[0],
          "2"
        );

        await user.clear(
          fields[1]
        );

        await user.type(
          fields[1],
          "3"
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Apply Stock & Recalculate",
            }
          )
        );

        expect(
          await screen.findByRole(
            "alert"
          )
        ).toHaveTextContent(
          /cannot exceed available quantity/i
        );

        expect(
          callback
        ).not.toHaveBeenCalled();
      }
    );
  }
);