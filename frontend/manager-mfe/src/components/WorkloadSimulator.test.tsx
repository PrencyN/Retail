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

import WorkloadSimulator
  from "./WorkloadSimulator";

function renderSimulator(
  onUpdateWorkload =
    vi.fn()
) {
  return render(
    <WorkloadSimulator
      locationCode="HYD-03"
      locationName="Kukatpally Store"
      currentWorkload={25}
      onUpdateWorkload={
        onUpdateWorkload
      }
    />
  );
}

describe(
  "WorkloadSimulator",
  () => {
    it(
      "shows the current workload",
      () => {
        renderSimulator();

        expect(
          screen.getByRole(
            "heading",
            {
              name:
                "Workload Simulator",
            }
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "HYD-03"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Kukatpally Store"
          )
        ).toBeInTheDocument();

        expect(
          screen.getAllByText(
            "25%"
          ).length
        ).toBeGreaterThanOrEqual(
          1
        );
      }
    );

    it(
      "shows workload presets",
      () => {
        renderSimulator();

        expect(
          screen.getByRole(
            "button",
            {
              name: "25%",
            }
          )
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "button",
            {
              name: "50%",
            }
          )
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "button",
            {
              name: "75%",
            }
          )
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "button",
            {
              name: "95%",
            }
          )
        ).toBeInTheDocument();
      }
    );

    it(
      "changes workload to 95 percent",
      async () => {
        const user =
          userEvent.setup();

        renderSimulator();

        await user.click(
          screen.getByRole(
            "button",
            {
              name: "95%",
            }
          )
        );

        expect(
          screen.getByRole(
            "spinbutton",
            {
              name:
                "Workload percentage",
            }
          )
        ).toHaveValue(
          95
        );
      }
    );

    it(
      "calls the workload callback",
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
              name: "95%",
            }
          )
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Apply & Recalculate",
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
          "HYD-03",
          95,
          {
            title:
              "Workload Updated",

            cause:
              "Kukatpally Store workload changed from 25% to 95%.",
          }
        );
      }
    );

    it(
      "rejects an invalid workload",
      async () => {
        const user =
          userEvent.setup();

        const callback =
          vi.fn();

        renderSimulator(
          callback
        );

        const input =
          screen.getByRole(
            "spinbutton",
            {
              name:
                "Workload percentage",
            }
          );

        await user.clear(
          input
        );

        await user.type(
          input,
          "101"
        );

        await user.click(
          screen.getByRole(
            "button",
            {
              name:
                "Apply & Recalculate",
            }
          )
        );

        expect(
          await screen.findByRole(
            "alert"
          )
        ).toHaveTextContent(
          /between 0 and 100/i
        );

        expect(
          callback
        ).not.toHaveBeenCalled();
      }
    );
  }
);