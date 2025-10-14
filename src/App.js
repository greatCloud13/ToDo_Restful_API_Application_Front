import React, { useState, useEffect } from 'react';
import { AppProvider } from './contexts/AppContext';
import { useAuth } from './hooks/useAuth';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './components/auth/LoginPage';
import Dashboard from './components/dashboard/Dashboard';
import CalendarPage from './components/calendar/CalendarPage';
import TodoManagementPage from './components/todo/TodoManagementPage';
import AnalyticsPage from './components/pages/AnalyticsPage';
import QnaPage from './components/pages/QnaPage';
import LoadingSpinner from './components/common/LoadingSpinner';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedTodoFromNotification, setSelectedTodoFromNotification] = useState(null);
  const [pendingTodoSelection, setPendingTodoSelection] = useState(null);
  
  // ✅ 추가: 페이지 전환 애니메이션 상태
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextPage, setNextPage] = useState(null);
  
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

  // ✅ 수정: 페이지 전환 완료 후 할일 선택 처리
  useEffect(() => {
    if (currentPage === 'todos' && pendingTodoSelection && !isTransitioning) {
      console.log('📱 페이지 전환 완료, 할일 상세보기 준비:', pendingTodoSelection);
      
      // 페이지 애니메이션 완료 대기 (300ms)
      const timer = setTimeout(() => {
        setSelectedTodoFromNotification(pendingTodoSelection);
        setPendingTodoSelection(null);
      }, 320); // 페이지 애니메이션(300ms) + 여유(20ms)
      
      return () => clearTimeout(timer);
    }
  }, [currentPage, pendingTodoSelection, isTransitioning]);

  // ✅ 수정: 애니메이션과 함께 페이지 전환
  const handlePageChange = (page) => {
    if (page === currentPage) return;
    
    setIsTransitioning(true);
    
    // 짧은 블러 효과 후 페이지 변경
    setTimeout(() => {
      setCurrentPage(page);
      setIsTransitioning(false);
    }, 200);
  };

  const handleLoginSuccess = () => {
    setCurrentPage('dashboard');
  };

  // ✅ 수정: 알림에서 할일 클릭 시 처리
  const handleTodoClickFromNotification = (todo) => {
    console.log('📱 알림 클릭:', todo);
    console.log('📱 현재 페이지:', currentPage);
    
    if (currentPage === 'todos') {
      // 이미 할일 페이지에 있으면 바로 선택
      console.log('📱 이미 할일 페이지, 바로 선택');
      setSelectedTodoFromNotification(todo);
    } else {
      // 다른 페이지에 있으면 페이지 전환 후 선택
      console.log('📱 페이지 전환 후 선택 예약');
      setPendingTodoSelection(todo);
      handlePageChange('todos'); // ✅ 애니메이션과 함께 전환
    }
  };

  const renderCurrentPage = () => {
    const commonProps = {
      onPageChange: handlePageChange,
      currentPage: currentPage,
      onLogout: logout,
      onTodoClick: handleTodoClickFromNotification
    };

    let PageComponent;
    let pageProps = { ...commonProps };

    switch (currentPage) {
      case 'dashboard':
        PageComponent = Dashboard;
        break;
      case 'calendar':
        PageComponent = CalendarPage;
        break;
      case 'todos':
        PageComponent = TodoManagementPage;
        pageProps = {
          ...commonProps,
          selectedTodoFromNotification,
          onClearSelectedTodo: () => {
            setSelectedTodoFromNotification(null);
            setPendingTodoSelection(null);
          }
        };
        break;
      case 'analytics':
        PageComponent = AnalyticsPage;
        break;
      case 'qna':
        PageComponent = QnaPage;
        break;
      default:
        PageComponent = Dashboard;
    }

    return (
      <div 
        key={currentPage}
        className={isTransitioning ? 'page-exit' : 'page-enter'}
      >
        <PageComponent {...pageProps} />
      </div>
    );
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