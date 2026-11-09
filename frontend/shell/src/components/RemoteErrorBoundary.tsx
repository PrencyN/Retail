import {
  Component,
  type ErrorInfo,
  type PropsWithChildren,
  type ReactNode,
} from "react";

type Props =
  PropsWithChildren<{
    remoteName: string;

    title: string;

    port: number;
  }>;

type State = {
  hasError: boolean;

  message: string;
};

class RemoteErrorBoundary
  extends Component<
    Props,
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
      `Unable to load ${this.props.remoteName}.`,
      error,
      errorInfo
    );
  }

  private handleReload =
    (): void => {
      window.location.reload();
    };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <section
          className="remote-error-card"
          role="alert"
        >
          <span className="section-label">
            Micro-Frontend Unavailable
          </span>

          <h2>
            {this.props.title}
          </h2>

          <p>
            Confirm that{" "}
            <strong>
              {this.props.remoteName}
            </strong>{" "}
            is running on port{" "}
            <strong>
              {this.props.port}
            </strong>
            , then reload FulfillIQ.
          </p>

          {import.meta.env.DEV &&
            this.state.message && (
              <details className="remote-error-details">
                <summary>
                  Technical details
                </summary>

                <small>
                  {this.state.message}
                </small>
              </details>
            )}

          <button
            type="button"
            className="primary-button"
            onClick={
              this.handleReload
            }
          >
            Reload FulfillIQ
          </button>
        </section>
      );
    }

    return this.props.children;
  }
}

export default RemoteErrorBoundary;