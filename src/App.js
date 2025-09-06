import React, { useState, useEffect } from 'react';
import { AppProvider } from './contexts/AppContext';
import LoginPage from './components/auth/LoginPage';
import Dashboard from './components/dashboard/Dashboard';
import CalendarPage from './components/calendar/CalendarPage';
import TodoManagementPage from './components/todo/TodoManagementPage';
import AnalyticsPage from './components/pages/AnalyticsPage';
import SettingsPage from './components/pages/SettingsPage';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    // 초기 로드 시 localStorage에서 토큰 복원
    const initializeAuth = () => {
      const savedTokens = localStorage.getItem('authTokens');
      if (savedTokens) {
        try {
          const tokens = JSON.parse(savedTokens);
          // 토큰 만료 확인
          if (tokens.expiresAt && new Date(tokens.expiresAt) > new Date()) {
            window.authTokens = tokens;
            setIsLoggedIn(true);
          } else {
            // 만료된 토큰 삭제
            localStorage.removeItem('authTokens');
            window.authTokens = null;
            setIsLoggedIn(false);
          }
        } catch (error) {
          console.error('토큰 복원 실패:', error);
          localStorage.removeItem('authTokens');
          setIsLoggedIn(false);
        }
      }
    };

    // 로그인 상태 체크
    const checkAuthStatus = () => {
      if (window.authTokens && window.authTokens.accessToken) {
        // 토큰 만료 확인
        if (window.authTokens.expiresAt && new Date(window.authTokens.expiresAt) <= new Date()) {
          // 만료된 토큰 처리
          localStorage.removeItem('authTokens');
          window.authTokens = null;
          setIsLoggedIn(false);
        } else {
          setIsLoggedIn(true);
        }
      } else {
        setIsLoggedIn(false);
      }
    };

    // 초기화
    initializeAuth();

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
        return <TodoManagementPage onPageChange={handlePageChange} currentPage={currentPage} />;
      case 'analytics':
        // 변경: Dashboard 대신 AnalyticsPage 사용
        return <AnalyticsPage onPageChange={handlePageChange} currentPage={currentPage} />;
      case 'settings':
        // 변경: Dashboard 대신 SettingsPage 사용
        return <SettingsPage onPageChange={handlePageChange} currentPage={currentPage} />;
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