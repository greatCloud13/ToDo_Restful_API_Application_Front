import React, { useState, useEffect } from 'react';
import { AppProvider } from './contexts/AppContext';
import LoginPage from './components/auth/LoginPage';
import Dashboard from './components/dashboard/Dashboard';
import CalendarPage from './components/calendar/CalendarPage';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    // 로그인 상태 체크
    const checkAuthStatus = () => {
      if (window.authTokens && window.authTokens.accessToken) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    };

    checkAuthStatus();

    // authTokens 변경 감지 (로그아웃 시)
    const interval = setInterval(() => {
      checkAuthStatus();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 로그인 성공 시 호출되는 함수
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  // 페이지 변경 함수
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 페이지 렌더링 함수
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onPageChange={handlePageChange} currentPage={currentPage} />;
      case 'calendar':
        return <CalendarPage onPageChange={handlePageChange} currentPage={currentPage} />;
      case 'todos':
        // TODO: 할 일 관리 페이지 추가 예정
        return <Dashboard onPageChange={handlePageChange} currentPage={currentPage} />;
      case 'analytics':
        // TODO: 통계 페이지 추가 예정
        return <Dashboard onPageChange={handlePageChange} currentPage={currentPage} />;
      case 'settings':
        // TODO: 설정 페이지 추가 예정
        return <Dashboard onPageChange={handlePageChange} currentPage={currentPage} />;
      default:
        return <Dashboard onPageChange={handlePageChange} currentPage={currentPage} />;
    }
  };

  return (
    <div className="App">
      {isLoggedIn ? (
        <AppProvider>
          {renderCurrentPage()}
        </AppProvider>
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;