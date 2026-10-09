import { Component } from "react";
export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <div className="container my-5" role="alert"><h2>We couldn’t load this page.</h2><p>Please reload to try again. Your saved cart will be kept.</p><button className="btn btn-primary" onClick={() => window.location.reload()}>Reload page</button></div>;
    return this.props.children;
  }
}
