import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { authService } from '../services/authService';

const useDashboard = ({ onPageChange, onLogout }) => {
  // Context에서 데이터 가져오기
  const {
    todos,
    user,
    loading,
    error,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodoStatus,
    clearError,
    getTodayTodos,
    getUrgentTodos,
    getStats,
    getTodayTodosLocal,
    getUrgentTodosLocal,
    getStatsLocal
  } = useAppContext();

  // 로컬 상태들
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAddTodoModalOpen, setIsAddTodoModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [sortOrder, setSortOrder] = useState('priority');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // 대시보드 전용 데이터 상태
  const [dashboardData, setDashboardData] = useState({
    stats: null,
    todayTodos: [],
    urgentTodos: [],
    loading: false,
    error: null
  });

  const [newTodo, setNewTodo] = useState({
    title: '',
    priority: 'medium',
    category: '업무',
    dueDate: new Date().toISOString().split('T')[0],
    memo: ''
  });

  // 시계 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 대시보드 데이터 로드 함수 - 중복 호출 방지를 위한 debounce
  const loadDashboardData = useCallback(async () => {
    setDashboardData(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Promise.allSettled로 병렬 처리하되, 실패해도 계속 진행
      const [statsResult, todayResult, urgentResult] = await Promise.allSettled([
        getStats(),
        getTodayTodos(),
        getUrgentTodos()
      ]);

      // 각 결과 처리 - 성공하면 API 데이터, 실패하면 로컬 데이터
      const stats = statsResult.status === 'fulfilled' 
        ? statsResult.value 
        : getStatsLocal();
      
      const todayTodos = todayResult.status === 'fulfilled' 
        ? todayResult.value 
        : getTodayTodosLocal();
      
      const urgentTodos = urgentResult.status === 'fulfilled' 
        ? urgentResult.value 
        : getUrgentTodosLocal();

      setDashboardData({
        stats,
        todayTodos,
        urgentTodos,
        loading: false,
        error: null
      });

      // 에러 로깅 (개발 환경에서만)
      const errors = [statsResult, todayResult, urgentResult]
        .filter(result => result.status === 'rejected')
        .map(result => result.reason);
      
      if (errors.length > 0) {
        console.warn('일부 대시보드 API 호출 실패, 로컬 데이터로 대체:', errors);
      }

    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
      
      // 전체 실패 시 로컬 데이터로 완전 fallback
      setDashboardData({
        stats: getStatsLocal(),
        todayTodos: getTodayTodosLocal(),
        urgentTodos: getUrgentTodosLocal(),
        loading: false,
        error: error.message
      });
    }
  }, [getStats, getTodayTodos, getUrgentTodos, getStatsLocal, getTodayTodosLocal, getUrgentTodosLocal]);

  // 초기 로드 - 한 번만 실행
  useEffect(() => {
    loadDashboardData();
  }, []); // 의존성 배열 비움 - 초기 마운트 시에만 실행

  // todos 변경 감지 - 디바운스 적용으로 과도한 API 호출 방지
  useEffect(() => {
    const timer = setTimeout(() => {
      // todos가 실제로 변경되었을 때만 새로고침
      if (todos.length > 0) {
        loadDashboardData();
      }
    }, 1000); // 1초 디바운스

    return () => clearTimeout(timer);
  }, [todos.length]); // todos.length만 감시하여 불필요한 재렌더링 방지

  // 메모화된 계산 값들 - API 데이터 우선
  const stats = useMemo(() => {
    return dashboardData.stats || getStatsLocal();
  }, [dashboardData.stats, getStatsLocal]);

  const todayTodos = useMemo(() => {
    return dashboardData.todayTodos.length > 0 
      ? dashboardData.todayTodos 
      : getTodayTodosLocal();
  }, [dashboardData.todayTodos, getTodayTodosLocal]);

  const urgentTodos = useMemo(() => {
    return dashboardData.urgentTodos.length > 0 
      ? dashboardData.urgentTodos 
      : getUrgentTodosLocal();
  }, [dashboardData.urgentTodos, getUrgentTodosLocal]);

  // 정렬 함수
  const sortTodos = useCallback((todoList, sortBy) => {
    const sortedTodos = [...todoList];
    
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, minimal: 4 };
        return sortedTodos.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      case 'date':
        return sortedTodos.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      case 'status':
        const statusOrder = { pending: 0, 'in-progress': 1, completed: 2 };
        return sortedTodos.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
      case 'category':
        return sortedTodos.sort((a, b) => a.category.localeCompare(b.category));
      default:
        return sortedTodos;
    }
  }, []);

  const sortedTodayTodos = useMemo(() => {
    return sortTodos(todayTodos, sortOrder);
  }, [todayTodos, sortOrder, sortTodos]);

  // 이벤트 핸들러들
  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      
      if (onLogout && typeof onLogout === 'function') {
        await onLogout();
        return;
      }
      
      await authService.logout();
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error('로그아웃 처리 중 오류:', error);
      try {
        authService.clearAllTokens();
      } catch (clearError) {
        console.error('토큰 정리 실패:', clearError);
      }
      window.location.reload();
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, onLogout]);

  const handleMenuClick = useCallback((menuId) => {
    if (onPageChange) {
      onPageChange(menuId);
    }
  }, [onPageChange]);

  const handleAddTodo = useCallback(() => {
    setIsAddTodoModalOpen(true);
    setEditingTodo(null);
    setNewTodo({
      title: '',
      priority: 'medium',
      category: '업무',
      dueDate: new Date().toISOString().split('T')[0],
      memo: ''
    });
  }, []);

  const handleEditTodo = useCallback((todo) => {
    setEditingTodo(todo);
    setNewTodo({
      title: todo.title,
      priority: todo.priority,
      category: todo.category,
      dueDate: todo.dueDate,
      memo: todo.memo || ''
    });
    setIsAddTodoModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsAddTodoModalOpen(false);
    setIsDetailModalOpen(false);
    setEditingTodo(null);
    setSelectedTodo(null);
    setNewTodo({
      title: '',
      priority: 'medium',
      category: '업무',
      dueDate: new Date().toISOString().split('T')[0],
      memo: ''
    });
    clearError();
  }, [clearError]);

  const handleNewTodoChange = useCallback((e) => {
    const { name, value } = e.target;
    setNewTodo(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleSubmitTodo = useCallback(async () => {
    if (!newTodo.title.trim()) {
      return;
    }

    try {
      if (editingTodo) {
        await updateTodo(editingTodo.id, newTodo);
      } else {
        await addTodo(newTodo);
      }
      handleCloseModal();
      
      // 할일 추가/수정 후 즉시 대시보드 갱신 (디바운스 무시)
      setTimeout(() => loadDashboardData(), 100);
    } catch (error) {
      console.error('할일 저장 실패:', error);
    }
  }, [newTodo, editingTodo, updateTodo, addTodo, handleCloseModal, loadDashboardData]);

  const handleDeleteTodo = useCallback(async (id) => {
    if (window.confirm('정말로 이 할일을 삭제하시겠습니까?')) {
      try {
        await deleteTodo(id);
        
        // 삭제 후 즉시 대시보드 갱신
        setTimeout(() => loadDashboardData(), 100);
      } catch (error) {
        console.error('할일 삭제 실패:', error);
      }
    }
  }, [deleteTodo, loadDashboardData]);

  const handleToggleStatus = useCallback(async (id) => {
    try {
      await toggleTodoStatus(id);
      
      // 상태 변경 후 즉시 대시보드 갱신
      setTimeout(() => loadDashboardData(), 100);
    } catch (error) {
      console.error('상태 변경 실패:', error);
    }
  }, [toggleTodoStatus, loadDashboardData]);

  const handleViewDetail = useCallback(async (todo) => {
    try {
      const { todoService } = await import('../services/todoService');
      const detailTodo = await todoService.getTodoById(todo.id);
      setSelectedTodo(detailTodo);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('할일 상세 조회 실패:', error);
      setSelectedTodo(todo);
      setIsDetailModalOpen(true);
    }
  }, []);

  const handleSortChange = useCallback((newSortOrder) => {
    setSortOrder(newSortOrder);
  }, []);

  // 대시보드 데이터 수동 새로고침
  const refreshDashboard = useCallback(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // 반환하는 객체
  return {
    // 상태들
    currentTime,
    isAddTodoModalOpen,
    editingTodo,
    sortOrder,
    isDetailModalOpen,
    selectedTodo,
    isLoggingOut,
    newTodo,
    
    // Context 데이터
    user,
    loading,
    error,
    
    // 계산된 값들 (API + 로컬)
    stats,
    todayTodos,
    urgentTodos,
    sortedTodayTodos,
    
    // 핸들러들
    handleLogout,
    handleMenuClick,
    handleAddTodo,
    handleEditTodo,
    handleCloseModal,
    handleNewTodoChange,
    handleSubmitTodo,
    handleDeleteTodo,
    handleToggleStatus,
    handleViewDetail,
    handleSortChange,
    
    // 새로운 기능
    refreshDashboard,
    dashboardLoading: dashboardData.loading,
    dashboardError: dashboardData.error
  };
};

export default useDashboard;