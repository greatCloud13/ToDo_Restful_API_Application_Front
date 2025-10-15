import React, { useState, useEffect, useMemo } from 'react';
import TodoModal from '../common/TodoModal';
import Navigation from '../../components/common/Navigation';
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
import { todoService } from '../../services/todoService';

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
    loadTodos,
    clearError,
    // 유틸리티 함수들
    selectedTodoFromNotification,
    getUrgentTodos,
    onClearSelectedTodo
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
  const [viewMode, setViewMode] = useState('list');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [urgentTodos, setUrgentTodos] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    priority: 'medium',
    category: '업무',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'pending',
    memo: ''
  });

  useEffect(() => {
    if (selectedTodoFromNotification) {
      setSelectedTodo(selectedTodoFromNotification);
      setIsDetailModalOpen(true);
    }
  }, [selectedTodoFromNotification]);

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

  // 필터링 및 검색된 할일 목록
  const filteredAndSearchedTodos = useMemo(() => {
    let filtered = [...todos];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(todo => 
        todo.title.toLowerCase().includes(query) ||
        todo.category.toLowerCase().includes(query) ||
        (todo.memo && todo.memo.toLowerCase().includes(query))
      );
    }

    if (filterConfig.status !== 'all') {
      filtered = filtered.filter(todo => todo.status === filterConfig.status);
    }

    if (filterConfig.priority !== 'all') {
      filtered = filtered.filter(todo => todo.priority === filterConfig.priority);
    }

    if (filterConfig.category !== 'all') {
      filtered = filtered.filter(todo => todo.category === filterConfig.category);
    }

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

    filtered.sort((a, b) => {
      const { key, direction } = sortConfig;
      let aValue = a[key];
      let bValue = b[key];

      if (key === 'priority') {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, minimal: 4 };
        aValue = priorityOrder[a.priority];
        bValue = priorityOrder[b.priority];
      }

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

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setTimeout(() => {
      setSelectedTodo(null);
      if (onClearSelectedTodo) {
        onClearSelectedTodo();
      }
    }, 200);
  };

  const handleLogout = async () => {
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

  const handleBulkDelete = async () => {
    const count = selectedTodos.size;
    
    if (!window.confirm(`선택된 ${count}개의 할일을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const ids = Array.from(selectedTodos);
      await todoService.bulkDeleteTodos(ids);
      await loadTodos();
      
      setSelectedTodos(new Set());
      alert(`${count}개의 할일이 삭제되었습니다.`);
    } catch (error) {
      console.error('대량 삭제 실패:', error);
      alert('일부 할일의 삭제에 실패했습니다.');
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
      memo: todo.memo || ''
    });
    setIsDetailModalOpen(false);
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
      const currentTodo = filteredAndSearchedTodos.find(t => t.id === id) || selectedTodo;
      
      if (!currentTodo) {
        console.error('할일을 찾을 수 없습니다');
        alert('할일을 찾을 수 없습니다.');
        return;
      }

      if (currentTodo.status === 'completed') {
        await todoService.updateTodoStatus(id, 'IN_PROGRESS');
      } else {
        await todoService.toggleTodoStatus(id);
      }
      
      await loadTodos();
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleAddTodo = () => {
    setFormData({
      title: '',
      priority: 'medium',
      category: '업무',
      dueDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      memo: ''
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
        memo: ''
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
      
      await new Promise(resolve => setTimeout(resolve, 300));
      await loadTodos();
      
    } catch (error) {
      console.error('할일 수정 실패:', error);
      alert('할일 수정에 실패했습니다: ' + error.message);
    }
  };

  const closeModals = () => {
    setIsDetailModalOpen(false);
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedTodo(null);
    clearError();
  };

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
      <Navigation
        currentPage={currentPage}
        onPageChange={onPageChange}
        onLogout={handleLogout}
        onTodoClick={(todo) => {
          handleViewDetail(todo);
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* 헤더 섹션 - 모바일 최적화 */}
        <div className="mb-6 md:mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/20">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center">
                  <Target className="w-6 h-6 md:w-8 md:h-8 mr-3" />
                  할 일 관리
                  {loading && (
                    <div className="ml-3 w-5 h-5 md:w-6 md:h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  )}
                </h2>
                <p className="text-sm md:text-base text-gray-300">모든 할 일을 한 곳에서 관리하세요</p>
                {error && (
                  <div className="mt-2 text-red-400 text-sm bg-red-500/10 p-2 rounded-lg">
                    {error}
                  </div>
                )}
              </div>
              
              {/* 통계 요약 - 반응형 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-white">{stats.total}</div>
                  <div className="text-xs text-gray-400">전체</div>
                </div>
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-green-400">{stats.completed}</div>
                  <div className="text-xs text-gray-400">완료</div>
                </div>
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-blue-400">{stats.inProgress}</div>
                  <div className="text-xs text-gray-400">진행중</div>
                </div>
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-red-400">{stats.overdue}</div>
                  <div className="text-xs text-gray-400">지연</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 도구바 - 모바일 최적화 */}
        <div className="mb-6 relative z-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex flex-col space-y-3">
              {/* 검색바 */}
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="할 일 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              {/* 필터 & 정렬 & 추가 버튼 */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors text-sm"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  필터
                  <ChevronDown className="w-4 h-4 ml-2" />
                </button>
                
                <select
                  value={sortConfig.key}
                  onChange={(e) => setSortConfig({ key: e.target.value, direction: 'desc' })}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="createdAt" className="bg-gray-800">최신순</option>
                  <option value="priority" className="bg-gray-800">우선순위</option>
                  <option value="dueDate" className="bg-gray-800">마감일</option>
                </select>
                
                <button 
                  onClick={handleAddTodo}
                  disabled={loading}
                  className="flex items-center px-3 py-2 md:px-4 md:py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 text-sm whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">새 할일</span>
                </button>
              </div>

              {/* 필터 패널 */}
              {isFilterOpen && (
                <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-100 mb-2">상태</label>
                    <select
                      value={filterConfig.status}
                      onChange={(e) => setFilterConfig(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                    >
                      <option value="all" className="bg-gray-800">전체</option>
                      <option value="pending" className="bg-gray-800">대기</option>
                      <option value="in-progress" className="bg-gray-800">진행중</option>
                      <option value="completed" className="bg-gray-800">완료</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-100 mb-2">우선순위</label>
                    <select
                      value={filterConfig.priority}
                      onChange={(e) => setFilterConfig(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                    >
                      <option value="all" className="bg-gray-800">전체</option>
                      <option value="critical" className="bg-gray-800">매우긴급</option>
                      <option value="high" className="bg-gray-800">높음</option>
                      <option value="medium" className="bg-gray-800">보통</option>
                      <option value="low" className="bg-gray-800">낮음</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 할일 목록 - 모바일: 카드 / 데스크톱: 테이블 */}
        {/* 모바일 카드 뷰 (1024px 미만) */}
        <div className="lg:hidden space-y-3">
          {filteredAndSearchedTodos.length > 0 ? (
            filteredAndSearchedTodos.map(todo => (
              <div
                key={todo.id}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all"
              >
                {/* 상단: 체크박스 + 제목 */}
                <div className="flex items-start space-x-3 mb-3">
                  <button
                    onClick={() => handleToggleStatus(todo.id)}
                    className={`mt-1 w-6 h-6 rounded-full border-2 transition-all flex-shrink-0 flex items-center justify-center ${
                      todo.status === 'completed' 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-gray-400 hover:border-green-400'
                    }`}
                  >
                    {todo.status === 'completed' && (
                      <Check className="w-4 h-4 text-white" />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 
                        onClick={() => handleViewDetail(todo)}
                        className={`font-medium text-base cursor-pointer ${
                          todo.status === 'completed' 
                            ? 'text-gray-400 line-through' 
                            : 'text-white'
                        }`}
                      >
                        {todo.title}
                      </h3>
                      {todo.memo && (
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                    
                    {/* 배지들 */}
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(todo.priority)}`}>
                        {getPriorityText(todo.priority)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(todo.status)}`}>
                        {getStatusText(todo.status)}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {todo.category}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* 하단: 날짜 + 액션 */}
                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                  <span className="text-sm text-gray-400">
                    📅 {formatDate(todo.dueDate)}
                  </span>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewDetail(todo)}
                      className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                      title="상세보기"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(todo)}
                      className="p-2 text-gray-400 hover:text-yellow-400 transition-colors"
                      title="수정"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(todo.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-400 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <Target className="w-16 h-16 mx-auto mb-3 opacity-50" />
              <p className="text-base">조건에 맞는 할 일이 없습니다</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-purple-400 hover:text-purple-300 transition-colors text-sm"
                >
                  검색 초기화
                </button>
              )}
            </div>
          )}
        </div>

        {/* 데스크톱 테이블 뷰 (1024px 이상) */}
        <div className="hidden lg:block bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
          {/* 테이블 헤더 */}
          <div className="p-4 border-b border-white/10">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-1">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-purple-500 bg-white/10 border-white/20 rounded"
                />
              </div>
              <div className="col-span-4">
                <button
                  onClick={() => handleSort('title')}
                  className="flex items-center text-gray-300 hover:text-white transition-colors text-sm"
                >
                  제목
                  {sortConfig.key === 'title' && (
                    sortConfig.direction === 'desc' ? <SortDesc className="w-4 h-4 ml-1" /> : <SortAsc className="w-4 h-4 ml-1" />
                  )}
                </button>
              </div>
              <div className="col-span-2 text-gray-300 text-sm">마감일</div>
              <div className="col-span-1 text-gray-300 text-sm">작업</div>
            </div>
          </div>

          {/* 테이블 내용 */}
          <div className="max-h-96 overflow-y-auto">
            {filteredAndSearchedTodos.length > 0 ? (
              filteredAndSearchedTodos.map(todo => (
                <div
                  key={todo.id}
                  className="grid grid-cols-12 gap-4 items-center p-4 border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-purple-500 bg-white/10 border-white/20 rounded"
                    />
                  </div>
                  
                  <div className="col-span-4">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleToggleStatus(todo.id)}
                        className={`w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                          todo.status === 'completed' 
                            ? 'bg-green-500 border-green-500' 
                            : 'border-gray-400 hover:border-green-400'
                        }`}
                      >
                        {todo.status === 'completed' && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </button>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 
                            onClick={() => handleViewDetail(todo)}
                            className={`font-medium truncate cursor-pointer hover:text-purple-400 transition-colors ${
                              todo.status === 'completed' ? 'text-gray-400 line-through' : 'text-white'
                            }`}
                          >
                            {todo.title}
                          </h3>
                          {todo.memo && (
                            <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{todo.category}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <div className={`px-2 py-1 rounded-full text-xs border inline-block ${getPriorityColor(todo.priority)}`}>
                      {getPriorityText(todo.priority)}
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <div className={`px-2 py-1 rounded-full text-xs inline-block ${getStatusColor(todo.status)}`}>
                      {getStatusText(todo.status)}
                    </div>
                  </div>
                  
                  <div className="col-span-2 text-sm text-gray-400">
                    {formatDate(todo.dueDate)}
                  </div>
                  
                  <div className="col-span-1 flex items-center space-x-1">
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
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 md:p-8">
              {/* 헤더 */}
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-white">할 일 상세</h2>
                <button
                  onClick={handleCloseDetailModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* 내용 */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">제목</label>
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-white text-lg font-medium">{selectedTodo.title}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">우선순위</label>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(selectedTodo.priority)}`}>
                        {getPriorityText(selectedTodo.priority)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">상태</label>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTodo.status)}`}>
                        {getStatusText(selectedTodo.status)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">카테고리</label>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-gray-200 text-sm">{selectedTodo.category}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">마감일</label>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-gray-200 text-sm">{selectedTodo.dueDate}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">메모</label>
                  {selectedTodo.memo ? (
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-white whitespace-pre-wrap">{selectedTodo.memo}</p>
                    </div>
                  ) : (
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-gray-400 italic">작성된 메모가 없습니다</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">생성일</label>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-gray-200 text-sm">
                        {selectedTodo.createdAt ? new Date(selectedTodo.createdAt).toLocaleString('ko-KR') : '-'}
                      </p>
                    </div>
                  </div>

                  {selectedTodo.status === 'completed' && selectedTodo.doneAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">완료일</label>
                      <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <p className="text-green-300 text-sm">
                          {new Date(selectedTodo.doneAt).toLocaleString('ko-KR')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedTodo.username && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">작성자</label>
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-gray-200 text-sm">{selectedTodo.username}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 액션 버튼들 - 모바일 최적화 */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-6">
                <button
                  onClick={() => handleEdit(selectedTodo)}
                  className="flex-1 py-3 px-4 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center justify-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  수정
                </button>
                
                <button
                  onClick={async () => {
                    await handleToggleStatus(selectedTodo.id);
                    handleCloseDetailModal();
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg transition-colors flex items-center justify-center ${
                    selectedTodo.status === 'completed'
                      ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  }`}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {selectedTodo.status === 'completed' ? '미완료로 변경' : '완료 처리'}
                </button>
                
                <button
                  onClick={async () => {
                    handleDelete(selectedTodo.id);
                    await handleCloseDetailModal();
                  }}
                  className="flex-1 py-3 px-4 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 할일 추가 모달 */}
      <TodoModal
        isOpen={isAddModalOpen}
        onClose={closeModals}
        onSubmit={handleSubmitAdd}
        formData={formData}
        onChange={handleFormChange}
        loading={loading}
        mode="add"
        title="새 할일 추가"
      />

      {/* 할일 수정 모달 */}
      <TodoModal
        isOpen={isEditModalOpen}
        onClose={closeModals}
        onSubmit={handleSubmitEdit}
        formData={formData}
        onChange={handleFormChange}
        loading={loading}
        mode="edit"
        title="할일 수정"
      />

      {/* 외부 클릭으로 필터 닫기 */}
      {isFilterOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setIsFilterOpen(false)}
        />
      )}
    </div>
  );
};

export default TodoManagementPage;