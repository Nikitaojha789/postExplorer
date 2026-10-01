import { Component, type ComponentType, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /**
   * Rendered instead of children after a render error. Rendered as a
   * component (never called as a function) so it may use hooks.
   */
  fallback: ComponentType<{ error: Error; reset: () => void }>;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-phase errors below it. Place one at the root (whole-app
 * fallback) and optionally around risky, isolated widgets so one broken
 * card doesn't take down the screen. Does NOT catch errors in event
 * handlers or async code — those go through `reportError` / AppError.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  private readonly reset = () => this.setState({ error: null });

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const Fallback = this.props.fallback;
    return <Fallback error={error} reset={this.reset} />;
  }
}
