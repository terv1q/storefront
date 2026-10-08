import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { strings } from '@/i18n/strings';
import { paths } from '@/routes/paths';

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Catches render errors from the route content so a failing page shows a message
 * instead of a blank screen. Remounting on navigation clears the error.
 */
export class RouteErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Route render failed', error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ error: null });
  };

  override render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className="mx-auto max-w-page px-page-x py-16">
        <div
          role="alert"
          className="rounded-panel border border-border bg-surface-muted p-6 shadow-card sm:p-8"
        >
          <h1 className="text-2xl">{strings.errors.pageFailed}</h1>
          <p className="mt-2 max-w-2xl text-ink-600">{strings.errors.generic}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="rounded-control bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {strings.actions.retry}
            </button>
            <Link
              to={paths.home}
              className="rounded-control border border-border-strong px-4 py-2 text-sm font-semibold text-ink-800 hover:bg-ink-100 hover:no-underline"
            >
              {strings.actions.backHome}
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
