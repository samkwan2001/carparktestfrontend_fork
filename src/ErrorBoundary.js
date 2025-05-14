import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'white', backgroundColor: '#282c34' }}>
          <h2>發生了錯誤</h2>
          <p>{this.state.error && this.state.error.toString()}</p>
          <button onClick={() => window.location.reload()}>重新加載頁面</button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;