import type {
  ReactElement,
} from "react";

import {
  render,
  screen,
} from "@testing-library/react";

import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import RemoteErrorBoundary
  from "./RemoteErrorBoundary";

function WorkingChild():
  ReactElement {
  return (
    <div>
      Remote loaded successfully
    </div>
  );
}

function FailingChild():
  ReactElement {
  throw new Error(
    "Remote module failed to load."
  );
}

describe(
  "RemoteErrorBoundary",
  () => {
    it(
      "renders the remote child when no error occurs",
      () => {
        render(
          <RemoteErrorBoundary
            remoteName="Manager MFE"
            title="Manager Workspace could not load"
            port={5176}
          >
            <WorkingChild />
          </RemoteErrorBoundary>
        );

        expect(
          screen.getByText(
            "Remote loaded successfully"
          )
        ).toBeInTheDocument();

        expect(
          screen.queryByText(
            "Micro-Frontend Unavailable"
          )
        ).not.toBeInTheDocument();
      }
    );

    it(
      "isolates an error thrown by the remote",
      () => {
        const consoleError =
          vi.spyOn(
            console,
            "error"
          ).mockImplementation(
            () => undefined
          );

        render(
          <RemoteErrorBoundary
            remoteName="Manager MFE"
            title="Manager Workspace could not load"
            port={5176}
          >
            <FailingChild />
          </RemoteErrorBoundary>
        );

        expect(
          screen.getByText(
            "Micro-Frontend Unavailable"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "heading",
            {
              name:
                "Manager Workspace could not load",
            }
          )
        ).toBeInTheDocument();

        consoleError.mockRestore();
      }
    );

    it(
      "shows the correct remote name and port",
      () => {
        const consoleError =
          vi.spyOn(
            console,
            "error"
          ).mockImplementation(
            () => undefined
          );

        render(
          <RemoteErrorBoundary
            remoteName="Fulfillment MFE"
            title="Fulfillment Analysis could not load"
            port={5175}
          >
            <FailingChild />
          </RemoteErrorBoundary>
        );

        expect(
          screen.getByText(
            "Fulfillment MFE"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "5175"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByRole(
            "heading",
            {
              name:
                "Fulfillment Analysis could not load",
            }
          )
        ).toBeInTheDocument();

        consoleError.mockRestore();
      }
    );

    it(
      "shows technical details during development",
      () => {
        const consoleError =
          vi.spyOn(
            console,
            "error"
          ).mockImplementation(
            () => undefined
          );

        render(
          <RemoteErrorBoundary
            remoteName="Order MFE"
            title="Order Summary could not load"
            port={5174}
          >
            <FailingChild />
          </RemoteErrorBoundary>
        );

        expect(
          screen.getByText(
            "Technical details"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Remote module failed to load."
          )
        ).toBeInTheDocument();

        consoleError.mockRestore();
      }
    );

    it(
      "shows the reload FulfillIQ action",
      () => {
        const consoleError =
          vi.spyOn(
            console,
            "error"
          ).mockImplementation(
            () => undefined
          );

        render(
          <RemoteErrorBoundary
            remoteName="Order MFE"
            title="Order Summary could not load"
            port={5174}
          >
            <FailingChild />
          </RemoteErrorBoundary>
        );

        expect(
          screen.getByRole(
            "button",
            {
              name:
                "Reload FulfillIQ",
            }
          )
        ).toBeInTheDocument();

        consoleError.mockRestore();
      }
    );
  }
);