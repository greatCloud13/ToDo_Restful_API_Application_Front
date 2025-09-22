import React, { useState, useEffect } from 'react';
import { AppProvider } from './contexts/AppContext';
import { useAuth } from './hooks/useAuth';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './components/auth/LoginPage';
import Dashboard from './components/dashboard/Dashboard';
import CalendarPage from './components/calendar/CalendarPage';
import TodoManagementPage from './components/todo/TodoManagementPage';
import AnalyticsPage from './components/pages/AnalyticsPage';
import SettingsPage from './components/pages/SettingsPage';
import LoadingSpinner from './components/common/LoadingSpinner';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  const { 
    isLoggedIn, 
    user, 
    isLoading, 
    isLoggingOut, 
    login, 
    logout 
  } = useAuth();

  // 페이지 변경 시 스크롤 맨 위로
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleLoginSuccess = () => {
    setCurrentPage('dashboard');
  };

  const renderCurrentPage = () => {
    const commonProps = {
      onPageChange: handlePageChange,
      currentPage: currentPage,
      onLogout: logout
    };

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard {...commonProps} />;
      case 'calendar':
        return <CalendarPage {...commonProps} />;
      case 'todos':
        return <TodoManagementPage {...commonProps} />;
      case 'analytics':
        return <AnalyticsPage {...commonProps} />;
      case 'settings':
        return <SettingsPage {...commonProps} />;
      default:
        return <Dashboard {...commonProps} />;
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ErrorBoundary>
      <div className="App">
        {isLoggedIn ? (
          <AppProvider user={user}>
            {renderCurrentPage()}
          </AppProvider>
        ) : (
          <LoginPage 
            onLoginSuccess={handleLoginSuccess}
            onLogin={login}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;