import { Component } from 'react';
import ErrorState from './ErrorState';

/**
 * Catches render-time errors anywhere below it so the whole app never
 * turns into a blank white page. `resetKey` clears the error on navigation.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error, info) {
    console.error('UI error:', error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorState
          kind="crash"
          onRetry={() => window.location.reload()}
          detail={import.meta.env.DEV ? String(this.state.error?.message || this.state.error) : undefined}
        />
      );
    }
    return this.props.children;
  }
}
