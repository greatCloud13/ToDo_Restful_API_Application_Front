import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle, 
  Calendar, 
  TrendingUp, 
  LogOut,
  Bell,
  Settings,
  Search,
  Activity,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  SortAsc,
  SortDesc,
  X,
  ChevronDown,
  MoreVertical,
  Check,
  Clock,
  AlertCircle,
  Target,
  RefreshCw,
  Archive,
  Download,
  Upload,
  FileText
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { authService } from '../../services/authService';

const TodoManagementPage = ({ onPageChange, currentPage = 'todos', onLogout }) => {
  const {
    // Context 상태
    todos,
    user,
    loading,
    error,
    // Context 함수들
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodoStatus,
    clearError,
    // 유틸리티 함수들
    getUrgentTodos
  } = useAppContext();

  // 로컬 상태들
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTodos, setSelectedTodos] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [filterConfig, setFilterConfig] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    dateRange: 'all'
  });
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [urgentTodos, setUrgentTodos] = useState([]);

  // 새 할일/수정 폼 데이터 (메모 필드 추가)
  const [formData, setFormData] = useState({
    title: '',
    priority: 'medium',
    category: '업무',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'pending',
    memo: '' // 메모 필드 추가
  });

  useEffect(() => {
    const loadUrgentTodos = async () => {
      try {
        const todos = await getUrgentTodos();
        setUrgentTodos(todos);
      } catch (error) {
        console.error('긴급 할일 로드 실패:', error);
        setUrgentTodos([]);
      }
    };
    
    loadUrgentTodos();
  }, [getUrgentTodos]);

  // 메뉴 아이템들
  const menuItems = [
    { id: 'dashboard', name: '대시보드', icon: Activity },
    { id: 'todos', name: '할 일 관리', icon: CheckCircle },
    { id: 'calendar', name: '캘린더', icon: Calendar },
    { id: 'analytics', name: '통계', icon: TrendingUp },
    { id: 'qna', name: '고객지원', icon: Settings }
  ];
  

  // 필터링 및 검색된 할일 목록
  const filteredAndSearchedTodos = useMemo(() => {
    let filtered = [...todos];

    // 검색 필터 (메모도 검색 대상에 포함)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(todo => 
        todo.title.toLowerCase().includes(query) ||
        todo.category.toLowerCase().includes(query) ||
        (todo.memo && todo.memo.toLowerCase().includes(query))
      );
    }

    // 상태 필터
    if (filterConfig.status !== 'all') {
      filtered = filtered.filter(todo => todo.status === filterConfig.status);
    }

    // 우선순위 필터
    if (filterConfig.priority !== 'all') {
      filtered = filtered.filter(todo => todo.priority === filterConfig.priority);
    }

    // 카테고리 필터
    if (filterConfig.category !== 'all') {
      filtered = filtered.filter(todo => todo.category === filterConfig.category);
    }

    // 날짜 범위 필터
    if (filterConfig.dateRange !== 'all') {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      switch (filterConfig.dateRange) {
        case 'today':
          filtered = filtered.filter(todo => todo.dueDate === todayStr);
          break;
        case 'week':
          const weekLater = new Date(today);
          weekLater.setDate(today.getDate() + 7);
          filtered = filtered.filter(todo => 
            new Date(todo.dueDate) >= today && 
            new Date(todo.dueDate) <= weekLater
          );
          break;
        case 'overdue':
          filtered = filtered.filter(todo => 
            new Date(todo.dueDate) < today && 
            todo.status !== 'completed'
          );
          break;
      }
    }

    // 정렬
    filtered.sort((a, b) => {
      const { key, direction } = sortConfig;
      let aValue = a[key];
      let bValue = b[key];

      // 우선순위 정렬을 위한 특별 처리
      if (key === 'priority') {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, minimal: 4 };
        aValue = priorityOrder[a.priority];
        bValue = priorityOrder[b.priority];
      }

      // 날짜 정렬
      if (key === 'dueDate' || key === 'createdAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [todos, searchQuery, filterConfig, sortConfig]);

  // 통계 계산
  const stats = useMemo(() => {
    return {
      total: filteredAndSearchedTodos.length,
      completed: filteredAndSearchedTodos.filter(todo => todo.status === 'completed').length,
      pending: filteredAndSearchedTodos.filter(todo => todo.status === 'pending').length,
      inProgress: filteredAndSearchedTodos.filter(todo => todo.status === 'in-progress').length,
      overdue: filteredAndSearchedTodos.filter(todo => 
        new Date(todo.dueDate) < new Date() && todo.status !== 'completed'
      ).length
    };
  }, [filteredAndSearchedTodos]);

  // 우선순위별 색상 및 텍스트
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-300 bg-red-600/20 border-red-500/30';
      case 'high': return 'text-red-400 bg-red-500/20 border-red-400/30';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-400/30';
      case 'low': return 'text-green-400 bg-green-500/20 border-green-400/30';
      case 'minimal': return 'text-blue-400 bg-blue-500/20 border-blue-400/30';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-400/30';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'critical': return '매우긴급';
      case 'high': return '높음';
      case 'medium': return '보통';
      case 'low': return '낮음';
      case 'minimal': return '최소';
      default: return '미정';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/10';
      case 'in-progress': return 'text-blue-400 bg-blue-500/10';
      case 'pending': return 'text-orange-400 bg-orange-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return '완료';
      case 'in-progress': return '진행중';
      case 'pending': return '대기';
      default: return '미정';
    }
  };

  // 이벤트 핸들러들
  const handleLogout = async () => {
      if (isLoggingOut) return; // 중복 실행 방지
  
      try {
        setIsLoggingOut(true);
        
        // 1순위: props로 전달된 onLogout 사용 (권장)
        if (onLogout && typeof onLogout === 'function') {
          console.log('Props onLogout 함수 사용');
          await onLogout();
          return;
        }
        
        // 2순위: authService 직접 사용
        console.log('authService 직접 사용');
        await authService.logout();
        
        // 로그아웃 성공 후 페이지 새로고침 (마지막 보장책)
        setTimeout(() => {
          window.location.reload();
        }, 500);
        
      } catch (error) {
        console.error('로그아웃 처리 중 오류:', error);
        
        // 오류 발생 시 강제 정리 및 새로고침
        try {
          authService.clearAllTokens();
        } catch (clearError) {
          console.error('토큰 정리 실패:', clearError);
        }
        
        // 최후의 수단: 강제 새로고침
        window.location.reload();
      } finally {
        setIsLoggingOut(false);
      }
    };

  const handleMenuClick = (menuId) => {
    if (onPageChange) {
      onPageChange(menuId);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleSelectTodo = (id) => {
    const newSelected = new Set(selectedTodos);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTodos(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTodos.size === filteredAndSearchedTodos.length) {
      setSelectedTodos(new Set());
    } else {
      setSelectedTodos(new Set(filteredAndSearchedTodos.map(todo => todo.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`선택된 ${selectedTodos.size}개의 할일을 삭제하시겠습니까?`)) {
      try {
        for (const id of selectedTodos) {
          await deleteTodo(id);
        }
        setSelectedTodos(new Set());
      } catch (error) {
        console.error('대량 삭제 실패:', error);
      }
    }
  };

  const handleBulkStatusChange = async (status) => {
    try {
      for (const id of selectedTodos) {
        await updateTodo(id, { status });
      }
      setSelectedTodos(new Set());
    } catch (error) {
      console.error('대량 상태 변경 실패:', error);
    }
  };

  const handleViewDetail = (todo) => {
    setSelectedTodo(todo);
    setIsDetailModalOpen(true);
  };

  const handleEdit = (todo) => {
    setSelectedTodo(todo);
    setFormData({
      title: todo.title,
      priority: todo.priority,
      category: todo.category,
      dueDate: todo.dueDate,
      status: todo.status,
      memo: todo.memo || '' // 메모 필드 추가
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('정말로 이 할일을 삭제하시겠습니까?')) {
      try {
        await deleteTodo(id);
      } catch (error) {
        console.error('할일 삭제 실패:', error);
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await toggleTodoStatus(id);
    } catch (error) {
      console.error('상태 변경 실패:', error);
    }
  };

  const handleAddTodo = () => {
    setFormData({
      title: '',
      priority: 'medium',
      category: '업무',
      dueDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      memo: '' // 메모 필드 초기화
    });
    setIsAddModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      await addTodo(formData);
      setIsAddModalOpen(false);
      setFormData({
        title: '',
        priority: 'medium',
        category: '업무',
        dueDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        memo: '' // 메모 필드 초기화
      });
    } catch (error) {
      console.error('할일 추가 실패:', error);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      await updateTodo(selectedTodo.id, formData);
      setIsEditModalOpen(false);
      setSelectedTodo(null);
    } catch (error) {
      console.error('할일 수정 실패:', error);
    }
  };

  const closeModals = () => {
    setIsDetailModalOpen(false);
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedTodo(null);
    clearError();
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '내일';
    if (diffDays === -1) return '어제';
    if (diffDays < 0) return `${Math.abs(diffDays)}일 지남`;
    if (diffDays <= 7) return `${diffDays}일 후`;
    
    return date.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 네비게이션 헤더 */}
      <nav className="bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">ToDo App</h1>
              </div>

              {/* 대메뉴 */}
              <div className="hidden md:flex space-x-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMenuClick(item.id)}
                      className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                        isActive 
                          ? 'bg-white/20 text-white shadow-lg' 
                          : 'text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                {urgentTodos.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse">
                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
                  </div>
                )}
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm text-white font-medium">{user.username}</p>
                  <p className="text-xs text-gray-400">{user.authorities.join(', ')}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  title="로그아웃"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
                  <Target className="w-8 h-8 mr-3" />
                  할 일 관리
                  {loading && (
                    <div className="ml-3 w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  )}
                </h2>
                <p className="text-gray-300">모든 할 일을 한 곳에서 관리하세요</p>
                {error && (
                  <div className="mt-2 text-red-400 text-sm bg-red-500/10 p-2 rounded-lg">
                    {error}
                  </div>
                )}
              </div>
              
              {/* 통계 요약 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-white">{stats.total}</div>
                  <div className="text-xs text-gray-400">전체</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
                  <div className="text-xs text-gray-400">완료</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400">{stats.inProgress}</div>
                  <div className="text-xs text-gray-400">진행중</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">{stats.overdue}</div>
                  <div className="text-xs text-gray-400">지연</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 도구바 */}
        <div className="mb-6 relative z-50">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              {/* 검색 및 필터 */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="할 일 검색... (제목, 카테고리, 메모)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
                  />
                </div>
                
                <div className="relative z-50">
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className="flex items-center px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors relative z-50"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    필터
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </button>

                  {/* 필터 드롭다운 */}
                  {isFilterOpen && (
                    <div 
                      className="absolute top-full left-0 mt-2 w-64 bg-white/20 backdrop-blur-xl border border-white/30 rounded-lg p-4 shadow-2xl transform transition-all duration-300 ease-out opacity-100 translate-y-0"
                      style={{ 
                        zIndex: 9999,
                        animation: 'slideDown 0.3s ease-out'
                      }}
                    >
                      <style jsx>{`
                        @keyframes slideDown {
                          from {
                            opacity: 0;
                            transform: translateY(-10px);
                          }
                          to {
                            opacity: 1;
                            transform: translateY(0);
                          }
                        }
                      `}</style>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-100 mb-2">상태</label>
                          <select
                            value={filterConfig.status}
                            onChange={(e) => setFilterConfig(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                              backgroundPosition: 'right 0.5rem center',
                              backgroundRepeat: 'no-repeat',
                              backgroundSize: '1.5em 1.5em',
                              paddingRight: '2.5rem'
                            }}
                          >
                            <option value="all" className="bg-gray-800 text-white">전체</option>
                            <option value="pending" className="bg-gray-800 text-white">대기</option>
                            <option value="in-progress" className="bg-gray-800 text-white">진행중</option>
                            <option value="completed" className="bg-gray-800 text-white">완료</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-100 mb-2">우선순위</label>
                          <select
                            value={filterConfig.priority}
                            onChange={(e) => setFilterConfig(prev => ({ ...prev, priority: e.target.value }))}
                            className="w-full bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                              backgroundPosition: 'right 0.5rem center',
                              backgroundRepeat: 'no-repeat',
                              backgroundSize: '1.5em 1.5em',
                              paddingRight: '2.5rem'
                            }}
                          >
                            <option value="all" className="bg-gray-800 text-white">전체</option>
                            <option value="critical" className="bg-gray-800 text-white">매우긴급</option>
                            <option value="high" className="bg-gray-800 text-white">높음</option>
                            <option value="medium" className="bg-gray-800 text-white">보통</option>
                            <option value="low" className="bg-gray-800 text-white">낮음</option>
                            <option value="minimal" className="bg-gray-800 text-white">최소</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-100 mb-2">카테고리</label>
                          <select
                            value={filterConfig.category}
                            onChange={(e) => setFilterConfig(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                              backgroundPosition: 'right 0.5rem center',
                              backgroundRepeat: 'no-repeat',
                              backgroundSize: '1.5em 1.5em',
                              paddingRight: '2.5rem'
                            }}
                          >
                            <option value="all" className="bg-gray-800 text-white">전체</option>
                            <option value="업무" className="bg-gray-800 text-white">업무</option>
                            <option value="개발" className="bg-gray-800 text-white">개발</option>
                            <option value="개인" className="bg-gray-800 text-white">개인</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-100 mb-2">기간</label>
                          <select
                            value={filterConfig.dateRange}
                            onChange={(e) => setFilterConfig(prev => ({ ...prev, dateRange: e.target.value }))}
                            className="w-full bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                              backgroundPosition: 'right 0.5rem center',
                              backgroundRepeat: 'no-repeat',
                              backgroundSize: '1.5em 1.5em',
                              paddingRight: '2.5rem'
                            }}
                          >
                            <option value="all" className="bg-gray-800 text-white">전체</option>
                            <option value="today" className="bg-gray-800 text-white">오늘</option>
                            <option value="week" className="bg-gray-800 text-white">이번 주</option>
                            <option value="overdue" className="bg-gray-800 text-white">지연됨</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 액션 버튼들 */}
              <div className="flex items-center space-x-3">
                {selectedTodos.size > 0 && (
                  <div className="flex items-center space-x-2 bg-blue-500/20 px-3 py-2 rounded-lg">
                    <span className="text-blue-400 text-sm">{selectedTodos.size}개 선택됨</span>
                    <button
                      onClick={() => handleBulkStatusChange('completed')}
                      className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs hover:bg-green-500/30"
                    >
                      완료
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30"
                    >
                      삭제
                    </button>
                  </div>
                )}
                
                <button
                  onClick={handleAddTodo}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  새 할일
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 할일 목록 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 relative z-0">
          {/* 테이블 헤더 */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={selectedTodos.size === filteredAndSearchedTodos.length && filteredAndSearchedTodos.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-purple-500 bg-white/10 border-white/20 rounded"
              />
              
              <button
                onClick={() => handleSort('title')}
                className="flex items-center text-gray-300 hover:text-white transition-colors"
              >
                제목
                {sortConfig.key === 'title' && (
                  sortConfig.direction === 'desc' ? <SortDesc className="w-4 h-4 ml-1" /> : <SortAsc className="w-4 h-4 ml-1" />
                )}
              </button>
              
              <button
                onClick={() => handleSort('priority')}
                className="flex items-center text-gray-300 hover:text-white transition-colors"
              >
                우선순위
                {sortConfig.key === 'priority' && (
                  sortConfig.direction === 'desc' ? <SortDesc className="w-4 h-4 ml-1" /> : <SortAsc className="w-4 h-4 ml-1" />
                )}
              </button>
              
              <button
                onClick={() => handleSort('status')}
                className="flex items-center text-gray-300 hover:text-white transition-colors"
              >
                상태
                {sortConfig.key === 'status' && (
                  sortConfig.direction === 'desc' ? <SortDesc className="w-4 h-4 ml-1" /> : <SortAsc className="w-4 h-4 ml-1" />
                )}
              </button>
              
              <button
                onClick={() => handleSort('dueDate')}
                className="flex items-center text-gray-300 hover:text-white transition-colors"
              >
                마감일
                {sortConfig.key === 'dueDate' && (
                  sortConfig.direction === 'desc' ? <SortDesc className="w-4 h-4 ml-1" /> : <SortAsc className="w-4 h-4 ml-1" />
                )}
              </button>
              
              <span className="text-gray-300">작업</span>
            </div>
          </div>

          {/* 테이블 내용 */}
          <div className="max-h-96 overflow-y-auto">
            {filteredAndSearchedTodos.length > 0 ? (
              filteredAndSearchedTodos.map(todo => (
                <div
                  key={todo.id}
                  className="flex items-center space-x-4 p-4 border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedTodos.has(todo.id)}
                    onChange={() => handleSelectTodo(todo.id)}
                    className="w-4 h-4 text-purple-500 bg-white/10 border-white/20 rounded"
                  />
                  
                  <button
                    onClick={() => handleToggleStatus(todo.id)}
                    className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                      todo.status === 'completed' 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-gray-400 hover:border-green-400'
                    }`}
                  >
                    {todo.status === 'completed' && (
                      <Check className="w-3 h-3 text-white m-auto" />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className={`font-medium truncate ${
                        todo.status === 'completed' ? 'text-gray-400 line-through' : 'text-white'
                      }`}>
                        {todo.title}
                      </h3>
                      {todo.memo && (
                        <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" title="메모 있음" />
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{todo.category}</p>
                  </div>
                  
                  <div className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(todo.priority)}`}>
                    {getPriorityText(todo.priority)}
                  </div>
                  
                  <div className={`px-2 py-1 rounded-full text-xs ${getStatusColor(todo.status)}`}>
                    {getStatusText(todo.status)}
                  </div>
                  
                  <div className="text-sm text-gray-400 w-20">
                    {formatDate(todo.dueDate)}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleViewDetail(todo)}
                      className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                      title="상세보기"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(todo)}
                      className="p-1 text-gray-400 hover:text-yellow-400 transition-colors"
                      title="수정"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(todo.id)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>조건에 맞는 할 일이 없습니다</p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-2 text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    검색 초기화
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 할일 상세보기 모달 */}
      {isDetailModalOpen && selectedTodo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">할일 상세</h3>
                <button onClick={closeModals} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200">제목</label>
                  <p className="text-white mt-1">{selectedTodo.title}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200">우선순위</label>
                    <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs border ${getPriorityColor(selectedTodo.priority)}`}>
                      {getPriorityText(selectedTodo.priority)}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-200">상태</label>
                    <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedTodo.status)}`}>
                      {getStatusText(selectedTodo.status)}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200">카테고리</label>
                    <p className="text-white mt-1">{selectedTodo.category}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-200">마감일</label>
                    <p className="text-white mt-1">{formatDate(selectedTodo.dueDate)}</p>
                  </div>
                </div>

                {/* 메모 영역 추가 */}
                {selectedTodo.memo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-200">메모</label>
                    <div className="mt-1 p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-white whitespace-pre-wrap">{selectedTodo.memo}</p>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-200">생성일</label>
                  <p className="text-gray-400 mt-1">
                    {new Date(selectedTodo.createdAt).toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => handleEdit(selectedTodo)}
                  className="flex-1 py-2 px-4 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={closeModals}
                  className="flex-1 py-2 px-4 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 할일 추가 모달 - 메모 필드 추가 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">새 할일 추가</h3>
                <button onClick={closeModals} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmitAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">제목</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="할 일을 입력하세요"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">우선순위</label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleFormChange}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.75rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="critical" className="bg-gray-800 text-white">매우긴급</option>
                      <option value="high" className="bg-gray-800 text-white">높음</option>
                      <option value="medium" className="bg-gray-800 text-white">보통</option>
                      <option value="low" className="bg-gray-800 text-white">낮음</option>
                      <option value="minimal" className="bg-gray-800 text-white">최소</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">카테고리</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleFormChange}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.75rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="업무" className="bg-gray-800 text-white">업무</option>
                      <option value="개발" className="bg-gray-800 text-white">개발</option>
                      <option value="개인" className="bg-gray-800 text-white">개인</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">마감일</label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>

                {/* 메모 필드 추가 */}
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">메모</label>
                  <textarea
                    name="memo"
                    value={formData.memo}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="추가 메모를 입력하세요 (선택사항)"
                    rows="3"
                  />
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={closeModals}
                    className="flex-1 py-3 px-4 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.title.trim()}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? '추가 중...' : '추가'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 할일 수정 모달 - 메모 필드 추가 */}
      {isEditModalOpen && selectedTodo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">할일 수정</h3>
                <button onClick={closeModals} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmitEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">제목</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="할 일을 입력하세요"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">우선순위</label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleFormChange}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.75rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="critical" className="bg-gray-800 text-white">매우긴급</option>
                      <option value="high" className="bg-gray-800 text-white">높음</option>
                      <option value="medium" className="bg-gray-800 text-white">보통</option>
                      <option value="low" className="bg-gray-800 text-white">낮음</option>
                      <option value="minimal" className="bg-gray-800 text-white">최소</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">상태</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleFormChange}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.75rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="pending" className="bg-gray-800 text-white">대기</option>
                      <option value="in-progress" className="bg-gray-800 text-white">진행중</option>
                      <option value="completed" className="bg-gray-800 text-white">완료</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">카테고리</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleFormChange}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.75rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="업무" className="bg-gray-800 text-white">업무</option>
                      <option value="개발" className="bg-gray-800 text-white">개발</option>
                      <option value="개인" className="bg-gray-800 text-white">개인</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">마감일</label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  </div>
                </div>

                {/* 메모 필드 추가 */}
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">메모</label>
                  <textarea
                    name="memo"
                    value={formData.memo}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="추가 메모를 입력하세요 (선택사항)"
                    rows="3"
                  />
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={closeModals}
                    className="flex-1 py-3 px-4 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.title.trim()}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? '수정 중...' : '수정'}
                  </button>
                </div>s
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 외부 클릭으로 필터 닫기 */}
      {isFilterOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsFilterOpen(false)}
        />
      )}
    </div>
  );
};

export default TodoManagementPage;