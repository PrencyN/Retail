import {
  lazy,
} from "react";

import {
  render,
  screen,
} from "@testing-library/react";

import {
  describe,
  expect,
  it,
} from "vitest";

import RemoteLoader
  from "./RemoteLoader";

function LoadedRemote() {
  return (
    <div>
      Loaded remote content
    </div>
  );
}

const DelayedRemote =
  lazy(
    () =>
      new Promise<{
        default:
          typeof LoadedRemote;
      }>(
        () => {
          return;
        }
      )
  );

describe(
  "RemoteLoader",
  () => {
    it(
      "renders remote content",
      () => {
        render(
          <RemoteLoader
            remoteName="Order MFE"
            title="Order Summary could not load"
            port={5174}
            loadingMessage="Loading Order Summary micro-frontend..."
          >
            <LoadedRemote />
          </RemoteLoader>
        );

        expect(
          screen.getByText(
            "Loaded remote content"
          )
        ).toBeInTheDocument();
      }
    );

    it(
      "shows the loading fallback while a remote is pending",
      () => {
        render(
          <RemoteLoader
            remoteName="Order MFE"
            title="Order Summary could not load"
            port={5174}
            loadingMessage="Loading Order Summary micro-frontend..."
          >
            <DelayedRemote />
          </RemoteLoader>
        );

        expect(
          screen.getByText(
            "Loading Order Summary micro-frontend..."
          )
        ).toBeInTheDocument();
      }
    );

    it(
      "renders different remote content independently",
      () => {
        render(
          <>
            <RemoteLoader
              remoteName="Order MFE"
              title="Order Summary could not load"
              port={5174}
              loadingMessage="Loading Order MFE..."
            >
              <div>
                Order remote content
              </div>
            </RemoteLoader>

            <RemoteLoader
              remoteName="Manager MFE"
              title="Manager Workspace could not load"
              port={5176}
              loadingMessage="Loading Manager MFE..."
            >
              <div>
                Manager remote content
              </div>
            </RemoteLoader>
          </>
        );

        expect(
          screen.getByText(
            "Order remote content"
          )
        ).toBeInTheDocument();

        expect(
          screen.getByText(
            "Manager remote content"
          )
        ).toBeInTheDocument();
      }
    );
  }
);