import {
  Suspense,
  type ReactNode,
} from "react";

import RemoteErrorBoundary
  from "./RemoteErrorBoundary";

type Props = {
  remoteName: string;

  title: string;

  port: number;

  loadingMessage: string;

  children: ReactNode;
};

function RemoteLoader({
  remoteName,
  title,
  port,
  loadingMessage,
  children,
}: Props) {
  return (
    <RemoteErrorBoundary
      remoteName={
        remoteName
      }
      title={
        title
      }
      port={
        port
      }
    >
      <Suspense
        fallback={
          <section
            className="remote-loading-card"
            aria-live="polite"
          >
            <div
              className="spinner"
              aria-hidden="true"
            />

            <p>
              {loadingMessage}
            </p>
          </section>
        }
      >
        {children}
      </Suspense>
    </RemoteErrorBoundary>
  );
}

export default RemoteLoader;