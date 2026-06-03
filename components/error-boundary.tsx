"use client";

import { Component, type ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback || (
          <Alert variant="destructive" className="m-4">
            <AlertDescription>
              {this.state.error.message || "Ha ocurrido un error inesperado"}
            </AlertDescription>
          </Alert>
        )
      );
    }

    return this.props.children;
  }
}
