import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Log error to external service here if needed
    // Example: logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error?: Error;
  errorInfo?: ErrorInfo;
  onRetry: () => void;
  onReload: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  errorInfo, 
  onRetry, 
  onReload 
}) => {
  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center', 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{ 
        maxWidth: '600px', 
        backgroundColor: 'white', 
        padding: '40px', 
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚨</div>
        <h1 style={{ color: '#e74c3c', marginBottom: '16px' }}>
          Oops! Something went wrong
        </h1>
        <p style={{ color: '#6c757d', marginBottom: '24px', lineHeight: '1.6' }}>
          We encountered an unexpected error. This has been logged and our team will look into it.
        </p>
        
        <div style={{ marginBottom: '24px' }}>
          <button 
            onClick={onRetry}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              marginRight: '12px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Try Again
          </button>
          
          <button 
            onClick={onReload}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Reload Page
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <details style={{ 
            textAlign: 'left', 
            backgroundColor: '#f8f9fa', 
            padding: '16px', 
            borderRadius: '6px',
            border: '1px solid #dee2e6'
          }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}>
              Error Details (Development Only)
            </summary>
            <pre style={{ 
              fontSize: '12px', 
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              color: '#e74c3c'
            }}>
              {error.toString()}
            </pre>
            {errorInfo && (
              <pre style={{ 
                fontSize: '12px', 
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                color: '#6c757d',
                marginTop: '8px'
              }}>
                {errorInfo.componentStack}
              </pre>
            )}
          </details>
        )}

        <div style={{ marginTop: '24px', fontSize: '14px', color: '#6c757d' }}>
          <p>If this problem persists, please contact support at:</p>
          <a href="mailto:support@expiryalert.com" style={{ color: '#007bff' }}>
            support@expiryalert.com
          </a>
        </div>
      </div>
    </div>
  );
};

// HOC wrapper to use hooks
const ErrorBoundary: React.FC<Props> = ({ children }) => {
  return <ErrorBoundaryClass>{children}</ErrorBoundaryClass>;
};

export default ErrorBoundary; 