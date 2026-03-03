import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', backgroundColor: '#1e1e1e', color: '#ff4d4f', minHeight: '100vh', fontFamily: 'monospace' }}>
                    <h2>Algo salió mal (React Crash)</h2>
                    <p><strong>Error:</strong> {this.state.error?.toString()}</p>
                    <hr style={{ borderColor: '#333', margin: '1rem 0' }} />
                    <details style={{ whiteSpace: 'pre-wrap', backgroundColor: '#000', padding: '1rem', borderRadius: '8px' }}>
                        <summary>Ver Component Stack</summary>
                        {this.state.errorInfo?.componentStack}
                    </details>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: '2rem', padding: '0.8rem 1.5rem', background: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Recargar Página
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
