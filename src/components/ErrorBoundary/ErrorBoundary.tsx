import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button, message } from "antd";
import styles from "./ErrorBoundary.module.css";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    message.error(`ErrorBoundary caught an error: ${error}`);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.header}>
              <AlertCircle className={styles.icon} />
              <h1 className={styles.title}>Something went wrong</h1>
            </div>

            <div className={styles.content}>
              <p className={styles.description}>
                发生了一个意外错误。该错误已被记录，我们会尽快修复。
              </p>

              {this.state.error && (
                <details className={styles.details}>
                  <summary className={styles.summary}>
                    Technical details
                  </summary>
                  <pre className={styles.pre}>
                    {this.state.error.toString()}
                    {this.state.errorInfo && (
                      <>
                        {"\n\nComponent Stack:"}
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </details>
              )}
            </div>

            <div className={styles.buttonGroup}>
              <Button onClick={this.handleReset}>重试</Button>

              <Button
                type="primary"
                onClick={this.handleReload}
                icon={<RefreshCw className={styles.reloadIcon} />}
              >
                重新加载应用
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for functional components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
