import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Plus, 
  Calendar, 
  TrendingUp, 
  User, 
  LogOut,
  Bell,
  Settings,
  Search,
  Filter,
  MoreHorizontal,
  Target,
  Activity,
  Star,
  X,
  ChevronDown,
  Edit,
  Trash2,
  FileText
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

const Dashboard = ({ onPageChange, currentPage = 'dashboard' }) => {
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
    getTodayTodos,
    getUrgentTodos,
    getStats
  } = useAppContext();

  // 로컬 상태들
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAddTodoModalOpen, setIsAddTodoModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [sortOrder, setSortOrder] = useState('priority');
  // 메모 필드 추가
  const [newTodo, setNewTodo] = useState({
    title: '',
    priority: 'medium',
    category: '업무',
    dueDate: new Date().toISOString().split('T')[0],
    memo: '' // 메모 필드 추가
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 통계 데이터 가져오기
  const stats = getStats();
  const todayTodos = getTodayTodos();
  const urgentTodos = getUrgentTodos();

  // 정렬 함수
  const sortTodos = (todoList, sortBy) => {
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
  };

  const sortedTodayTodos = sortTodos(todayTodos, sortOrder);

  // 우선순위별 색상
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

  const getPriorityBackground = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/10 border-red-500/30 shadow-red-500/10';
      case 'high': return 'bg-red-500/5 border-red-400/20 shadow-red-400/5';
      case 'medium': return 'bg-yellow-500/5 border-yellow-400/20 shadow-yellow-400/5';
      case 'low': return 'bg-green-500/5 border-green-400/20 shadow-green-400/5';
      case 'minimal': return 'bg-blue-500/5 border-blue-400/20 shadow-blue-400/5';
      default: return 'bg-white/5 border-white/10';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'critical': return '🔴 매우긴급';
      case 'high': return '🟠 높음';
      case 'medium': return '🟡 보통';
      case 'low': return '🟢 낮음';
      case 'minimal': return '🔵 최소';
      default: return '⚪ 미정';
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

  // 정렬 옵션
  const sortOptions = [
    { value: 'priority', label: '우선순위순' },
    { value: 'date', label: '마감일순' },
    { value: 'status', label: '상태순' },
    { value: 'category', label: '카테고리순' }
  ];

  // 메뉴 아이템들
  const menuItems = [
    { id: 'dashboard', name: '대시보드', icon: Activity },
    { id: 'todos', name: '할 일 관리', icon: CheckCircle },
    { id: 'calendar', name: '캘린더', icon: Calendar },
    { id: 'analytics', name: '통계', icon: TrendingUp },
    { id: 'settings', name: '설정', icon: Settings }
  ];

  // 이벤트 핸들러들
  const handleLogout = () => {
    window.authTokens = null;
    window.location.reload();
  };

  const handleMenuClick = (menuId) => {
    if (onPageChange) {
      onPageChange(menuId);
    }
  };

  const handleAddTodo = () => {
    setIsAddTodoModalOpen(true);
    setEditingTodo(null);
    // 메모 필드 포함하여 초기화
    setNewTodo({
      title: '',
      priority: 'medium',
      category: '업무',
      dueDate: new Date().toISOString().split('T')[0],
      memo: ''
    });
  };

  const handleEditTodo = (todo) => {
    setEditingTodo(todo);
    // 메모 필드 포함하여 설정
    setNewTodo({
      title: todo.title,
      priority: todo.priority,
      category: todo.category,
      dueDate: todo.dueDate,
      memo: todo.memo || ''
    });
    setIsAddTodoModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddTodoModalOpen(false);
    setEditingTodo(null);
    // 메모 필드 포함하여 초기화
    setNewTodo({
      title: '',
      priority: 'medium',
      category: '업무',
      dueDate: new Date().toISOString().split('T')[0],
      memo: ''
    });
    clearError();
  };

  const handleNewTodoChange = (e) => {
    const { name, value } = e.target;
    setNewTodo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitTodo = async () => {
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
    } catch (error) {
      console.error('할일 저장 실패:', error);
    }
  };

  const handleDeleteTodo = async (id) => {
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

  const handleSortChange = (newSortOrder) => {
    setSortOrder(newSortOrder);
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
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="할 일 검색..."
                  className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
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

      {/* 긴급 알림 배너 */}
      {urgentTodos.length > 0 && (
        <div className="bg-gradient-to-r from-red-600/30 via-orange-600/30 to-red-600/30 border-b border-red-500/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-xl p-4 border border-red-500/30 shadow-2xl" 
                 style={{
                   animation: 'initialUrgentAlert 1.5s ease-out forwards'
                 }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-red-500/30 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-7 h-7 text-red-300" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{urgentTodos.length}</span>
                    </div>
                    <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-red-400" 
                         style={{animation: 'singleRipple 1.5s ease-out forwards'}}></div>
                  </div>
                  <div>
                    <h3 className="text-red-200 font-bold text-lg flex items-center">
                      ⚡ 긴급 알림
                      <span className="ml-2">🔥</span>
                    </h3>
                    <p className="text-red-300">
                      {urgentTodos.length}개의 긴급한 할 일이 있습니다! 즉시 확인하세요.
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3 max-w-md">
                  {urgentTodos.slice(0, 2).map((todo, index) => (
                    <div key={todo.id} 
                         className={`rounded-lg px-4 py-3 border shadow-lg transform transition-all duration-300 hover:scale-105 ${getPriorityBackground(todo.priority)}`}
                         style={{
                           animation: `slideInFromRight 0.8s ease-out ${index * 0.2 + 0.3}s both`
                         }}>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">
                          {todo.priority === 'critical' ? '🚨' : '⚠️'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(todo.priority)}`}>
                          {getPriorityText(todo.priority)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <p className="text-white text-sm font-medium truncate max-w-32">{todo.title}</p>
                        {todo.memo && (
                          <FileText className="w-3 h-3 text-gray-300 flex-shrink-0" title="메모 있음" />
                        )}
                      </div>
                      <p className="text-red-200 text-xs">📅 {todo.dueDate}</p>
                    </div>
                  ))}
                  {urgentTodos.length > 2 && (
                    <div className="bg-red-500/30 rounded-lg px-4 py-3 flex items-center border border-red-400/30 transform transition-all duration-300 hover:scale-105"
                         style={{animation: 'slideInFromRight 0.8s ease-out 0.7s both'}}>
                      <div className="text-center">
                        <p className="text-white text-lg font-bold">+{urgentTodos.length - 2}</p>
                        <p className="text-red-200 text-xs">개 더</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <style jsx>{`
            @keyframes initialUrgentAlert {
              0% {
                transform: translateY(-20px) scale(0.95);
                opacity: 0;
                box-shadow: 0 0 0px rgba(239, 68, 68, 0);
              }
              30% {
                transform: translateY(-5px) scale(1.02);
                opacity: 0.8;
                box-shadow: 0 0 25px rgba(239, 68, 68, 0.4);
              }
              60% {
                transform: translateY(2px) scale(0.98);
                opacity: 1;
                box-shadow: 0 0 35px rgba(239, 68, 68, 0.6);
              }
              80% {
                transform: translateY(-1px) scale(1.01);
                box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
              }
              100% {
                transform: translateY(0) scale(1);
                opacity: 1;
                box-shadow: 0 0 15px rgba(239, 68, 68, 0.2);
              }
            }
            
            @keyframes singleRipple {
              0% {
                transform: scale(1);
                opacity: 0.8;
              }
              50% {
                transform: scale(1.4);
                opacity: 0.4;
              }
              100% {
                transform: scale(1.8);
                opacity: 0;
              }
            }
            
            @keyframes slideInFromRight {
              0% {
                transform: translateX(100px);
                opacity: 0;
              }
              100% {
                transform: translateX(0);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 환영 메시지 & 시간 */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  안녕하세요, {user.username}님! 👋
                </h2>
                <p className="text-gray-300">오늘도 생산적인 하루 되세요!</p>
                {error && (
                  <div className="mt-2 text-red-400 text-sm bg-red-500/10 p-2 rounded-lg">
                    {error}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-mono text-white">
                  {currentTime.toLocaleTimeString('ko-KR')}
                </div>
                <div className="text-sm text-gray-400">
                  {currentTime.toLocaleDateString('ko-KR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 통계 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">전체 할 일</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">완료됨</p>
                <p className="text-3xl font-bold text-green-400">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">진행 중</p>
                <p className="text-3xl font-bold text-blue-400">{stats.inProgress}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">완료율</p>
                <p className="text-3xl font-bold text-purple-400">{stats.completionRate}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 오늘 할 일 */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  오늘 할 일
                  {loading && (
                    <div className="ml-2 w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  )}
                </h3>
                <div className="flex items-center space-x-3">
                  {/* 정렬 선택 드롭다운 */}
                  <div className="relative">
                    <select
                      value={sortOrder}
                      onChange={(e) => handleSortChange(e.target.value)}
                      className="appearance-none bg-white/10 border border-white/20 text-white text-sm px-3 py-2 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {sortOptions.map(option => (
                        <option key={option.value} value={option.value} className="bg-gray-800">
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                  </div>
                  
                  <button 
                    onClick={handleAddTodo}
                    disabled={loading}
                    className="flex items-center px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    추가
                  </button>
                </div>
              </div>

              <div className="space-y-3 min-h-80 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {sortedTodayTodos.length > 0 ? sortedTodayTodos.map(todo => (
                  <div key={todo.id} className={`flex items-center p-4 rounded-lg border transition-all duration-200 hover:shadow-lg ${getPriorityBackground(todo.priority)}`}>
                    <button
                      onClick={() => handleToggleStatus(todo.id)}
                      className={`w-4 h-4 rounded-full mr-4 border-2 transition-all duration-200 ${
                        todo.status === 'completed' 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-gray-400 hover:border-green-400'
                      }`}
                    >
                      {todo.status === 'completed' && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className={`font-medium ${todo.status === 'completed' ? 'text-gray-400 line-through' : 'text-white'}`}>
                          {todo.title}
                        </h4>
                        {todo.memo && (
                          <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" title="메모 있음" />
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(todo.priority)}`}>
                          {getPriorityText(todo.priority)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(todo.status)}`}>
                          {getStatusText(todo.status)}
                        </span>
                        <span className="text-xs text-gray-400">{todo.category}</span>
                        <span className="text-xs text-gray-400">📅 {todo.dueDate}</span>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => handleEditTodo(todo)}
                        className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                        title="수정"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-400">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>오늘 예정된 할 일이 없습니다</p>
                    <button 
                      onClick={handleAddTodo}
                      className="mt-2 text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      첫 번째 할 일을 추가해보세요
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 사이드 패널 */}
          <div className="space-y-6">
            {/* 진행률 차트 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">주간 진행률</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm text-gray-300 mb-1">
                    <span>완료</span>
                    <span>{stats.completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${stats.completionRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 긴급 할 일 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-red-400" />
                긴급 할 일
              </h3>
              <div className="space-y-3">
                {urgentTodos.length > 0 ? urgentTodos.slice(0, 3).map(todo => (
                  <div key={todo.id} className="flex items-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <Star className="w-4 h-4 text-red-400 mr-3" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-1">
                        <p className="text-white text-sm font-medium">{todo.title}</p>
                        {todo.memo && (
                          <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" title="메모 있음" />
                        )}
                      </div>
                      <p className="text-red-400 text-xs">마감: {todo.dueDate}</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-4 text-gray-400">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">긴급한 할 일이 없습니다</p>
                  </div>
                )}
              </div>
            </div>

            {/* 카테고리별 통계 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">카테고리별</h3>
              <div className="space-y-2">
                {['업무', '개발', '개인'].map(category => {
                  const categoryCount = todos.filter(todo => todo.category === category).length;
                  return (
                    <div key={category} className="flex justify-between items-center py-2">
                      <span className="text-gray-300">{category}</span>
                      <span className="text-white font-medium">{categoryCount}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 할 일 추가/수정 모달 - 메모 기능 및 통일된 디자인 적용 */}
      {isAddTodoModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">
                  {editingTodo ? '할 일 수정' : '새 할 일 추가'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    할 일 제목
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={newTodo.title}
                    onChange={handleNewTodoChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="할 일을 입력하세요"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      우선순위
                    </label>
                    <select
                      name="priority"
                      value={newTodo.priority}
                      onChange={handleNewTodoChange}
                      className="w-full bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.75rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="critical" className="bg-gray-800 text-white">🔴 매우긴급</option>
                      <option value="high" className="bg-gray-800 text-white">🟠 높음</option>
                      <option value="medium" className="bg-gray-800 text-white">🟡 보통</option>
                      <option value="low" className="bg-gray-800 text-white">🟢 낮음</option>
                      <option value="minimal" className="bg-gray-800 text-white">🔵 최소</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      카테고리
                    </label>
                    <select
                      name="category"
                      value={newTodo.category}
                      onChange={handleNewTodoChange}
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
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    마감일
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={newTodo.dueDate}
                    onChange={handleNewTodoChange}
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>

                {/* 메모 필드 추가 */}
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">메모</label>
                  <textarea
                    name="memo"
                    value={newTodo.memo}
                    onChange={handleNewTodoChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="추가 메모를 입력하세요 (선택사항)"
                    rows="3"
                  />
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 py-3 px-4 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitTodo}
                    disabled={loading || !newTodo.title.trim()}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '처리중...' : (editingTodo ? '수정' : '추가')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;