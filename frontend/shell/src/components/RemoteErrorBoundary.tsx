import {
  Component,
  type ErrorInfo,
  type PropsWithChildren,
  type ReactNode,
} from "react";

type State = {
  hasError: boolean;

  message: string;
};

class RemoteErrorBoundary
  extends Component<
    PropsWithChildren,
    State
  > {
  public state: State = {
    hasError:
      false,

    message:
      "",
  };

  public static getDerivedStateFromError(
    error: Error
  ): State {
    return {
      hasError:
        true,

      message:
        error.message,
    };
  }

  public componentDidCatch(
    error: Error,
    errorInfo: ErrorInfo
  ): void {
    console.error(
      "Unable to load the Order micro-frontend.",
      error,
      errorInfo
    );
  }

  private handleRetry = (): void => {
    window.location.reload();
  };

  public render(): ReactNode {
    if (
      this.state.hasError
    ) {
      return (
        <section
          className="remote-error-card"
          role="alert"
        >
          <span className="section-label">
            Micro-Frontend Unavailable
          </span>

          <h2>
            Order Summary could not load
          </h2>

          <p>
            Confirm that the Order MFE is
            running on port 5174, then retry.
          </p>

          {import.meta.env.DEV &&
            this.state.message && (
            <small>
              {this.state.message}
            </small>
          )}

          <button
            type="button"
            className="primary-button"
            onClick={
              this.handleRetry
            }
          >
            Retry
          </button>
        </section>
      );
    }

    return this.props.children;
  }
}

export default RemoteErrorBoundary;