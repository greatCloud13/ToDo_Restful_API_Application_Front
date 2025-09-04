import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Calendar, 
  TrendingUp, 
  LogOut,
  Bell,
  Settings,
  Search,
  Activity,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  AlertCircle,
  Target,
  X,
  Edit,
  Trash2
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

const CalendarPage = ({ onPageChange, currentPage = 'calendar' }) => {
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
    getTodosByDate,
    getUrgentTodos,
    getStats
  } = useAppContext();

  // 로컬 상태들
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddTodoModalOpen, setIsAddTodoModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [newTodo, setNewTodo] = useState({
    title: '',
    priority: 'medium',
    category: '업무',
    dueDate: new Date().toISOString().split('T')[0]
  });

  // Context에서 데이터 가져오기
  const stats = getStats();
  const urgentTodos = getUrgentTodos();

  // 메뉴 아이템들
  const menuItems = [
    { id: 'dashboard', name: '대시보드', icon: Activity },
    { id: 'todos', name: '할 일 관리', icon: CheckCircle },
    { id: 'calendar', name: '캘린더', icon: Calendar },
    { id: 'analytics', name: '통계', icon: TrendingUp },
    { id: 'settings', name: '설정', icon: Settings }
  ];

  // 우선순위별 색상
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      case 'minimal': return 'bg-blue-500';
      default: return 'bg-gray-500';
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

  // 달력 관련 함수들
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const isToday = (year, month, day) => {
    const today = new Date();
    return today.getFullYear() === year && 
           today.getMonth() === month && 
           today.getDate() === day;
  };

  const isSelectedDate = (year, month, day) => {
    return selectedDate.getFullYear() === year && 
           selectedDate.getMonth() === month && 
           selectedDate.getDate() === day;
  };

  // 이벤트 핸들러들
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const handleLogout = () => {
    window.authTokens = null;
    window.location.reload();
  };

  const handleMenuClick = (menuId) => {
    if (onPageChange) {
      onPageChange(menuId);
    }
  };

  const handleDateClick = (year, month, day) => {
    setSelectedDate(new Date(year, month, day));
  };

  const handleAddTodo = () => {
    const selectedDateString = formatDate(
      selectedDate.getFullYear(), 
      selectedDate.getMonth(), 
      selectedDate.getDate()
    );
    
    setIsAddTodoModalOpen(true);
    setEditingTodo(null);
    setNewTodo({
      title: '',
      priority: 'medium',
      category: '업무',
      dueDate: selectedDateString
    });
  };

  const handleEditTodo = (todo) => {
    setEditingTodo(todo);
    setNewTodo({
      title: todo.title,
      priority: todo.priority,
      category: todo.category,
      dueDate: todo.dueDate
    });
    setIsAddTodoModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddTodoModalOpen(false);
    setEditingTodo(null);
    setNewTodo({
      title: '',
      priority: 'medium',
      category: '업무',
      dueDate: new Date().toISOString().split('T')[0]
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

  // 달력 렌더링
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    // 요일 헤더
    const dayHeaders = weekDays.map(day => (
      <div key={day} className="text-center text-gray-400 text-sm font-medium py-3">
        {day}
      </div>
    ));

    // 빈 날짜들 (이전 달)
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="aspect-square p-2">
        </div>
      );
    }

    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = formatDate(year, month, day);
      const dayTodos = getTodosByDate(dateString);
      const isCurrentDay = isToday(year, month, day);
      const isSelected = isSelectedDate(year, month, day);

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(year, month, day)}
          className={`aspect-square p-2 cursor-pointer rounded-lg transition-all duration-200 ${
            isSelected 
              ? 'bg-purple-500/30 border border-purple-500/50' 
              : isCurrentDay
              ? 'bg-blue-500/20 border border-blue-500/30'
              : 'hover:bg-white/10'
          }`}
        >
          <div className="h-full flex flex-col">
            <div className={`text-sm font-medium mb-1 ${
              isCurrentDay ? 'text-blue-300' : 
              isSelected ? 'text-purple-300' : 
              'text-gray-300'
            }`}>
              {day}
            </div>
            <div className="flex-1 space-y-1">
              {dayTodos.slice(0, 2).map((todo, index) => (
                <div
                  key={todo.id}
                  className={`w-full h-1.5 rounded-full ${getPriorityColor(todo.priority)} opacity-80`}
                  title={todo.title}
                />
              ))}
              {dayTodos.length > 2 && (
                <div className="text-xs text-gray-400 text-center">
                  +{dayTodos.length - 2}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {dayHeaders}
        {days}
      </div>
    );
  };

  // 선택된 날짜의 할 일들
  const selectedDateString = formatDate(
    selectedDate.getFullYear(), 
    selectedDate.getMonth(), 
    selectedDate.getDate()
  );
  const selectedDateTodos = getTodosByDate(selectedDateString);

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 캘린더 헤더 */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h2 className="text-3xl font-bold text-white flex items-center">
                  <Calendar className="w-8 h-8 mr-3" />
                  {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
                  {loading && (
                    <div className="ml-2 w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  )}
                </h2>
                {error && (
                  <div className="text-red-400 text-sm bg-red-500/10 p-2 rounded-lg">
                    {error}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={goToToday}
                  className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                >
                  오늘
                </button>
                <button
                  onClick={goToPreviousMonth}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  disabled={loading}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goToNextMonth}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  disabled={loading}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 캘린더 메인 */}
          <div className="lg:col-span-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              {renderCalendar()}
            </div>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 선택된 날짜 정보 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                {selectedDate.toLocaleDateString('ko-KR', { 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })}
              </h3>
              
              {/* 할 일 목록 - 고정 높이 + 스크롤 */}
              <div className="space-y-3 min-h-56 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {selectedDateTodos.length > 0 ? selectedDateTodos.map(todo => (
                  <div key={todo.id} className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 flex-1">
                        <button
                          onClick={() => handleToggleStatus(todo.id)}
                          className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                            todo.status === 'completed' 
                              ? 'bg-green-500 border-green-500' 
                              : 'border-gray-400 hover:border-green-400'
                          }`}
                        >
                          {todo.status === 'completed' && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </button>
                        <h4 className={`text-sm font-medium flex-1 ${
                          todo.status === 'completed' ? 'text-gray-400 line-through' : 'text-white'
                        }`}>
                          {todo.title}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(todo.priority)}`}></div>
                        <button
                          onClick={() => handleEditTodo(todo)}
                          className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                          title="수정"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(todo.status)}`}>
                        {getStatusText(todo.status)}
                      </span>
                      <span className="text-xs text-gray-400">{todo.category}</span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-6 text-gray-400">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">선택한 날짜에 할 일이 없습니다</p>
                  </div>
                )}
              </div>

              {/* 할 일 추가 버튼 */}
              <button 
                onClick={handleAddTodo}
                disabled={loading}
                className="w-full mt-4 py-2 px-4 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors flex items-center justify-center disabled:opacity-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                할 일 추가
              </button>
            </div>

            {/* 이달 통계 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">이달 통계</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">전체 할 일</span>
                  <span className="text-white font-medium">{stats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">완료</span>
                  <span className="text-green-400 font-medium">{stats.completed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">진행중</span>
                  <span className="text-blue-400 font-medium">{stats.inProgress}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">대기</span>
                  <span className="text-orange-400 font-medium">{stats.pending}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-gray-300">완료율</span>
                  <span className="text-purple-400 font-medium">{stats.completionRate}%</span>
                </div>
              </div>
            </div>

            {/* 우선순위 범례 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">우선순위</h3>
              <div className="space-y-2">
                {[
                  { priority: 'critical', label: '매우긴급', count: todos.filter(t => t.priority === 'critical').length },
                  { priority: 'high', label: '높음', count: todos.filter(t => t.priority === 'high').length },
                  { priority: 'medium', label: '보통', count: todos.filter(t => t.priority === 'medium').length },
                  { priority: 'low', label: '낮음', count: todos.filter(t => t.priority === 'low').length },
                  { priority: 'minimal', label: '최소', count: todos.filter(t => t.priority === 'minimal').length }
                ].map(({ priority, label, count }) => (
                  <div key={priority} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${getPriorityColor(priority)}`}></div>
                      <span className="text-gray-300 text-sm">{label}</span>
                    </div>
                    <span className="text-white text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 할 일 추가/수정 모달 */}
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

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    우선순위
                  </label>
                  <select
                    name="priority"
                    value={newTodo.priority}
                    onChange={handleNewTodoChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="critical" className="bg-gray-800">🔴 매우긴급</option>
                    <option value="high" className="bg-gray-800">🟠 높음</option>
                    <option value="medium" className="bg-gray-800">🟡 보통</option>
                    <option value="low" className="bg-gray-800">🟢 낮음</option>
                    <option value="minimal" className="bg-gray-800">🔵 최소</option>
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
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="업무" className="bg-gray-800">업무</option>
                    <option value="개발" className="bg-gray-800">개발</option>
                    <option value="개인" className="bg-gray-800">개인</option>
                  </select>
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
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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

export default CalendarPage;