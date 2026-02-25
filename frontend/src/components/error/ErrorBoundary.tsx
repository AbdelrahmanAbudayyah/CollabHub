"use client";

/**
 * ErrorBoundary — Catches React errors and displays a fallback UI
 *
 * React error boundaries must be class components (can't use hooks).
 * This component catches errors in the component tree below it and
 * prevents the entire app from crashing.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <YourComponent />
 *   </ErrorBoundary>
 *
 * When an error occurs:
 * - Shows a user-friendly error message
 * - Provides a "Try again" button to reset the error state
 * - Logs error to console for debugging
 */

import React, { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode; // Optional custom fallback UI
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details to console (in production, you'd send this to an error tracking service)
    console.error("Error Boundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // If custom fallback provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center px-6 py-16 text-center">
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            We encountered an unexpected error. Please try refreshing the page or contact
            support if the problem persists.
          </p>
          {this.state.error && process.env.NODE_ENV === "development" && (
            <details className="mt-4 max-w-xl text-left">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                Error details (dev only)
              </summary>
              <pre className="mt-2 overflow-auto rounded-lg bg-muted p-4 text-xs">
                {this.state.error.toString()}
                {this.state.error.stack}
              </pre>
            </details>
          )}
          <Button onClick={this.handleReset} className="mt-6">
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based wrapper for pages that need error boundaries
 *
 * Usage in a page:
 *   export default function SomePage() {
 *     return (
 *       <ErrorBoundary>
 *         <PageContent />
 *       </ErrorBoundary>
 *     );
 *   }
 */
export default ErrorBoundary;
