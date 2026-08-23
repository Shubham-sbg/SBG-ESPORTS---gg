import React, { Component, ErrorInfo, ReactNode } from 'react';
interface Props { fallback: ReactNode; children: ReactNode; onCatch?: (error: Error, errorInfo: ErrorInfo) => void; }
interface State { hasError: boolean; error?: Error; }
export class ThemeErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };
  public static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Theme Runtime Error caught by Failsafe Boundary:', error, errorInfo);
    if (this.props.onCatch) this.props.onCatch(error, errorInfo);
  }
  public render() {
    if (this.state.hasError) {
      return <>{this.props.fallback}</>;
    }
    return this.props.children;
  }
}
