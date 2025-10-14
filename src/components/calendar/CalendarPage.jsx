import React, { useState } from 'react';
import TodoModal from '../common/TodoModal';
import { 
  CheckCircle, 
  Calendar, 
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  X,
  Edit,
  Trash2
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { authService } from '../../services/authService';
import { useCalendar } from '../../hooks/useCalendar';
import { todoService } from '../../services/todoService';
import Navigation from '../../components/common/Navigation';

const CalendarPage = ({ onPageChange, currentPage = 'calendar', onLogout }) => {
  // 로컬 상태들
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddTodoModalOpen, setIsAddTodoModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [newTodo, setNewTodo] = useState({
    title: '',
    priority: 'medium',
    category: '업무',
    dueDate: new Date().toISOString().split('T')[0]
  });

  // Custom Hook으로 데이터 관리 (API 기반)
  const {
    monthTodos,
    selectedDateTodos,
    stats,
    urgentTodos,
    isLoading,
    error,
    getTodosByDate,
    refresh
  } = useCalendar(selectedDate, currentDate);

  const {
    todos,
    user,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodoStatus,
    clearError,
    loading: contextLoading
  } = useAppContext();

  // 통합 로딩/에러 상태
  const loading = contextLoading || isLoading;

  // 우선순위별 색상
  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500',
      minimal: 'bg-blue-500'
    };
    return colors[priority] || 'bg-gray-500';
  };

  const getPriorityText = (priority) => {
    const texts = {
      critical: '매우긴급',
      high: '높음',
      medium: '보통',
      low: '낮음',
      minimal: '최소'
    };
    return texts[priority] || '미정';
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'text-green-400 bg-green-500/10',
      'in-progress': 'text-blue-400 bg-blue-500/10',
      pending: 'text-orange-400 bg-orange-500/10'
    };
    return colors[status] || 'text-gray-400 bg-gray-500/10';
  };

  const getStatusText = (status) => {
    const texts = {
      completed: '완료',
      'in-progress': '진행중',
      pending: '대기'
    };
    return texts[status] || '미정';
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

  const handleViewDetail = async (todo) => {
    try {
      const detailTodo = await todoService.getTodoById(todo.id);
      setSelectedTodo(detailTodo);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('할일 상세 조회 실패:', error);
      setSelectedTodo(todo);
      setIsDetailModalOpen(true);
    }
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTodo(null);
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
      setTimeout(() => window.location.reload(), 500);
      
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
      dueDate: todo.dueDate,
      status: todo.status || 'pending', // ✅ status 추가
      memo: todo.memo || '' // ✅ memo 추가
    });
    setIsAddTodoModalOpen(false); // ✅ 추가 모달 닫기
    setIsDetailModalOpen(false); // ✅ 상세보기 모달 닫기
    setIsEditModalOpen(true); // ✅ 수정 모달 열기
  };

  const handleCloseModal = () => {
    setIsAddTodoModalOpen(false);
    setIsEditModalOpen(false); // ✅ 추가
    setIsDetailModalOpen(false); // ✅ 추가
    setEditingTodo(null);
    setNewTodo({
      title: '',
      priority: 'medium',
      category: '업무',
      dueDate: new Date().toISOString().split('T')[0],
      status: 'pending', // ✅ 추가
      memo: '' // ✅ 추가
    });
    clearError();
  };

  const handleNewTodoChange = (e) => {
    const { name, value } = e.target;
    setNewTodo(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitTodo = async (e) => {
    e.preventDefault(); // ✅ 추가
    if (!newTodo.title.trim()) return;

    try {
      if (editingTodo) {
        // ✅ 수정 모드
        await updateTodo(editingTodo.id, newTodo);
      } else {
        // ✅ 추가 모드
        await addTodo(newTodo);
      }
      handleCloseModal();
      refresh();
    } catch (error) {
      console.error('할일 저장 실패:', error);
    }
  };

  const handleDeleteTodo = async (id) => {
    if (window.confirm('정말로 이 할일을 삭제하시겠습니까?')) {
      try {
        await deleteTodo(id);
        refresh();
      } catch (error) {
        console.error('할일 삭제 실패:', error);
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      // 현재 todo 찾기
      const currentTodo = selectedDateTodos.find(t => t.id === id) || selectedTodo;
      
      if (!currentTodo) {
        console.error('할일을 찾을 수 없습니다');
        return;
      }

      // 상태에 따라 다른 API 호출
      if (currentTodo.status === 'completed') {
        // 완료 상태면 → 진행중으로 변경
        await todoService.updateTodoStatus(id, 'IN_PROGRESS');
      } else {
        // 그 외 상태면 → 완료로 변경
        await todoService.toggleTodoStatus(id); // 또는 updateTodoStatus(id, 'COMPLETE')
      }
      
      refresh();
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

    const dayHeaders = weekDays.map(day => (
      <div key={day} className="text-center text-gray-400 text-sm font-medium py-3">
        {day}
      </div>
    ));

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square p-2"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = formatDate(year, month, day);
      const dayTodos = getTodosByDate ? getTodosByDate(dateString) : [];
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
              {dayTodos.slice(0, 2).map((todo) => (
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation 컴포넌트 */}
      <Navigation
        currentPage={currentPage}
        onPageChange={onPageChange}
        onLogout={handleLogout}
        onTodoClick={(todo) => {
          // 캘린더에서는 해당 날짜로 이동하고 상세보기
          setSelectedDate(new Date(todo.dueDate));
          setSelectedTodo(todo);
          setIsDetailModalOpen(true);
        }}
      />

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
                        <h4 
                          className={`text-sm font-medium flex-1 cursor-pointer hover:text-purple-300 transition-colors ${
                            todo.status === 'completed' ? 'text-gray-400 line-through' : 'text-white'
                          }`}
                          onClick={() => handleViewDetail(todo)}
                          title="클릭하여 상세보기"
                        >
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

      {/* 할일 추가/수정 모달 */}
      <TodoModal
        isOpen={isAddTodoModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitTodo}
        formData={newTodo}
        onChange={handleNewTodoChange}
        loading={loading}
        mode="add"
        title="새 할일 추가"
      />

      {/* 할일 상세정보 모달 */}
      <TodoModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitTodo}
        formData={newTodo}
        onChange={handleNewTodoChange}
        loading={loading}
        mode="edit"
        title="할일 수정"
      />
    </div>
  );
};

export default CalendarPage;