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
  // 날짜 관련 state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // 모달 관련 state
  const [isAddTodoModalOpen, setIsAddTodoModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [editingTodo, setEditingTodo] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // 할일 추가용 폼 데이터
  const [newTodo, setNewTodo] = useState({
    title: '',
    priority: 'medium',
    category: '업무',
    dueDate: new Date().toISOString().split('T')[0],
    memo: ''
  });
  
  // 할일 수정용 폼 데이터
  const [formData, setFormData] = useState({
    title: '',
    priority: 'medium',
    category: '업무',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'pending',
    memo: ''
  });

  // Custom Hook으로 캘린더 데이터 관리
  const {
    selectedDateTodos,
    stats,
    getTodosByDate,
    refresh
  } = useCalendar(selectedDate, currentDate);

  // Context에서 할일 관리 함수들 가져오기
  const {
    todos,
    addTodo,
    updateTodo,
    deleteTodo,
    clearError,
    loading: contextLoading
  } = useAppContext();

  const loading = contextLoading;

  // 우선순위별 색상
  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'text-red-300 bg-red-600/20 border-red-500/30',
      high: 'text-red-400 bg-red-500/20 border-red-400/30',
      medium: 'text-yellow-400 bg-yellow-500/20 border-yellow-400/30',
      low: 'text-green-400 bg-green-500/20 border-green-400/30',
      minimal: 'text-blue-400 bg-blue-500/20 border-blue-400/30'
    };
    return colors[priority] || 'text-gray-400 bg-gray-500/20 border-gray-400/30';
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

  const getPriorityBackground = (priority) => {
    const backgrounds = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500',
      minimal: 'bg-blue-500'
    };
    return backgrounds[priority] || 'bg-gray-500';
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

  const handleDateClick = (year, month, day) => {
    setSelectedDate(new Date(year, month, day));
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

  const handleAddTodo = () => {
    const selectedDateString = formatDate(
      selectedDate.getFullYear(), 
      selectedDate.getMonth(), 
      selectedDate.getDate()
    );
    
    setEditingTodo(null);
    setNewTodo({
      title: '',
      priority: 'medium',
      category: '업무',
      dueDate: selectedDateString,
      memo: ''
    });
    setIsAddTodoModalOpen(true);
  };

  const handleEditTodo = (todo) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title,
      priority: todo.priority,
      category: todo.category,
      dueDate: todo.dueDate,
      status: todo.status || 'pending',
      memo: todo.memo || ''
    });
    setIsAddTodoModalOpen(false);
    setIsDetailModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleDeleteTodo = async (id) => {
    if (!window.confirm('정말로 이 할일을 삭제하시겠습니까?')) return;
    
    try {
      await deleteTodo(id);
      setIsDetailModalOpen(false);
      setSelectedTodo(null);
      refresh();
    } catch (error) {
      console.error('할일 삭제 실패:', error);
      alert('할일 삭제에 실패했습니다.');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const currentTodo = selectedDateTodos.find(t => t.id === id) || selectedTodo;
      
      if (!currentTodo) {
        console.error('할일을 찾을 수 없습니다');
        return;
      }

      if (currentTodo.status === 'completed') {
        await todoService.updateTodoStatus(id, 'IN_PROGRESS');
      } else {
        await todoService.toggleTodoStatus(id);
      }
      
      refresh();
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleNewTodoChange = (e) => {
    const { name, value } = e.target;
    setNewTodo(prev => ({ ...prev, [name]: value }));
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitTodo = async (e) => {
    e.preventDefault();
    
    try {
      if (editingTodo) {
        if (!formData.title.trim()) return;
        await updateTodo(editingTodo.id, formData);
        setIsEditModalOpen(false);
      } else {
        if (!newTodo.title.trim()) return;
        await addTodo(newTodo);
        setIsAddTodoModalOpen(false);
      }
      
      handleCloseModal();
      refresh();
    } catch (error) {
      console.error('할일 저장 실패:', error);
      alert('할일 저장에 실패했습니다.');
    }
  };

  const handleCloseModal = () => {
    setIsAddTodoModalOpen(false);
    setIsEditModalOpen(false);
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
    
    setFormData({
      title: '',
      priority: 'medium',
      category: '업무',
      dueDate: new Date().toISOString().split('T')[0],
      status: 'pending',
      memo: ''
    });
    
    clearError();
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setTimeout(() => {
      setSelectedTodo(null);
    }, 200);
  };

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
                  className={`w-full h-1.5 rounded-full ${getPriorityBackground(todo.priority)} opacity-80`}
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
      <Navigation
        currentPage={currentPage}
        onPageChange={onPageChange}
        onLogout={handleLogout}
        onTodoClick={(todo) => {
          setSelectedDate(new Date(todo.dueDate));
          setSelectedTodo(todo);
          setIsDetailModalOpen(true);
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="lg:col-span-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              {renderCalendar()}
            </div>
          </div>

          <div className="space-y-6">
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
                          className={`w-4 h-4 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                            todo.status === 'completed' 
                              ? 'bg-green-500 border-green-500' 
                              : 'border-gray-400 hover:border-green-400'
                          }`}
                        >
                          {todo.status === 'completed' && (
                            <CheckCircle className="w-3 h-3 text-white" />
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
                        <div className={`w-3 h-3 rounded-full ${getPriorityBackground(todo.priority)}`}></div>
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
                      <div className={`w-4 h-4 rounded-full ${getPriorityBackground(priority)}`}></div>
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

      <TodoModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitTodo}
        formData={formData}
        onChange={handleFormChange}
        loading={loading}
        mode="edit"
        title="할일 수정"
      />

      {isDetailModalOpen && selectedTodo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl w-full max-w-2xl">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-white">할 일 상세</h2>
                <button onClick={handleCloseDetailModal} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

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
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(selectedTodo.priority)}`}>
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

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    handleEditTodo(selectedTodo);
                  }}
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
                    await handleDeleteTodo(selectedTodo.id);
                    handleCloseDetailModal();
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
    </div>
  );
};

export default CalendarPage;