import React, { useState } from 'react';
import { AppProvider } from './contexts/AppContext';
import { useAuth } from './hooks/useAuth';
import LoginPage from './components/auth/LoginPage';
import Dashboard from './components/dashboard/Dashboard';
import CalendarPage from './components/calendar/CalendarPage';
import TodoManagementPage from './components/todo/TodoManagementPage';
import AnalyticsPage from './components/pages/AnalyticsPage';
import SettingsPage from './components/pages/SettingsPage';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // 커스텀 훅을 통한 인증 상태 관리
  const { 
    isLoggedIn, 
    user, 
    isLoading, 
    isLoggingOut, 
    login, 
    logout 
  } = useAuth();

  // 페이지 변경 함수
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 로그인 성공 핸들러
  const handleLoginSuccess = () => {
    setCurrentPage('dashboard');
  };

  // 페이지 렌더링 함수
  const renderCurrentPage = () => {
    const commonProps = {
      onPageChange: handlePageChange,
      currentPage: currentPage,
      onLogout: logout // 통합된 로그아웃 함수 전달
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

  // 로딩 중 표시
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
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
  );
}

export default App;