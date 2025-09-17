import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Target,
  Activity,
  Star,
  X,
  ChevronDown,
  Edit,
  Trash2,
  FileText,
  Eye
} from 'lucide-react';

// 서비스 클래스들 (실제로는 별도 파일에서 import)
class DashboardService {
  constructor() {
    this.baseURL = 'http://localhost:8080/dashboard';
  }

  getAuthHeaders() {
    const token = window.authTokens?.accessToken;
    if (!token) {
      throw new Error('인증 토큰이 없습니다.');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  mapBackendToFrontend(backendTodo) {
    if (!backendTodo) return null;
    
    const priorityMap = {
      'VERY_HIGH': 'critical',
      'HIGH': 'high',
      'MIDDLE': 'medium',
      'LOW': 'low',
      'VERY_LOW': 'minimal'
    };

    const statusMap = {
      'IN_PROGRESS': 'in-progress',
      'COMPLETE': 'completed',
      'ON_HOLD': 'pending'
    };

    return {
      id: backendTodo.id,
      title: backendTodo.title,
      priority: priorityMap[backendTodo.taskPriority] || 'medium',
      status: statusMap[backendTodo.taskStatus] || 'pending',
      dueDate: backendTodo.planningDate ? backendTodo.planningDate.split('T')[0] : new Date().toISOString().split('T')[0],
      category: backendTodo.category || '업무',
      memo: backendTodo.memo || '',
      createdAt: backendTodo.createdAt || new Date().toISOString(),
      username: backendTodo.username
    };
  }

  async getTodayTodos() {
    const response = await fetch(`${this.baseURL}/today`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`오늘 할일 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data.map(todo => this.mapBackendToFrontend(todo)) : [];
  }

  async getUrgentTodos() {
    const response = await fetch(`${this.baseURL}/urgent`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`긴급 할일 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data.map(todo => this.mapBackendToFrontend(todo)) : [];
  }

  async getStats() {
    const response = await fetch(`${this.baseURL}/stats`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`통계 조회 실패: ${response.status}`);
    }

    const data = await response.json();
    return {
      total: data.total || 0,
      completed: data.completed || 0,
      inProgress: data.inprogress || 0,
      pending: data.pending || 0,
      completionRate: data.completionRate || 0
    };
  }
}

class TodoService {
  constructor() {
    this.baseURL = 'http://localhost:8080/todos';
  }

  getAuthHeaders() {
    const token = window.authTokens?.accessToken;
    if (!token) {
      throw new Error('인증 토큰이 없습니다.');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  mapFrontendToBackend(frontendTodo) {
    const priorityMap = {
      'critical': 'VERY_HIGH',
      'high': 'HIGH',
      'medium': 'MIDDLE',
      'low': 'LOW',
      'minimal': 'VERY_LOW'
    };

    const statusMap = {
      'in-progress': 'IN_PROGRESS',
      'completed': 'COMPLETE',
      'pending': 'ON_HOLD'
    };

    return {
      title: frontendTodo.title,
      memo: frontendTodo.memo || '',
      priority: priorityMap[frontendTodo.priority] || 'MIDDLE',
      category: frontendTodo.category || '업무',
      status: statusMap[frontendTodo.status] || 'ON_HOLD',
      targetDate: frontendTodo.dueDate ? new Date(frontendTodo.dueDate).toISOString() : new Date().toISOString()
    };
  }

  async createTodo(todoData) {
    const backendData = this.mapFrontendToBackend(todoData);
    const response = await fetch(`${this.baseURL}/post`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(backendData)
    });

    if (!response.ok) {
      throw new Error(`할일 생성 실패: ${response.status}`);
    }

    return response.json();
  }

  async toggleTodoStatus(id) {
    const response = await fetch(`${this.baseURL}/status/${id}?status=COMPLETE`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`상태 변경 실패: ${response.status}`);
    }
    
    return response.json();
  }

  async deleteTodo(id) {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`할일 삭제 실패: ${response.status}`);
    }

    return true;
  }
}

// 서비스 인스턴스
const dashboardService = new DashboardService();
const todoService = new TodoService();

// 커스텀 훅: 서버 데이터 fetching만 담당
function useDashboardData() {
  const [data, setData] = useState({
    stats: null,
    todayTodos: [],
    urgentTodos: [],
    loading: true,
    error: null
  });

  const fetchDashboardData = useCallback(async () => {
    console.log('Dashboard 데이터 로드 시작');
    
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      const [statsResult, todayResult, urgentResult] = await Promise.allSettled([
        dashboardService.getStats(),
        dashboardService.getTodayTodos(),
        dashboardService.getUrgentTodos()
      ]);

      setData({
        stats: statsResult.status === 'fulfilled' ? statsResult.value : null,
        todayTodos: todayResult.status === 'fulfilled' ? todayResult.value : [],
        urgentTodos: urgentResult.status === 'fulfilled' ? urgentResult.value : [],
        loading: false,
        error: null
      });

      console.log('Dashboard 데이터 로드 완료');
    } catch (error) {
      console.error('Dashboard 데이터 로드 실패:', error);
      setData(prev => ({ ...prev, loading: false, error: error.message }));
    }
  }, []);

  // 마운트 시 한 번만 실행
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { ...data, refetch: fetchDashboardData };
}

// 메인 대시보드 컴포넌트
const Dashboard = ({ onPageChange, currentPage = 'dashboard', onLogout }) => {
  // 서버 데이터
  const { stats, todayTodos, urgentTodos, loading, error, refetch } = useDashboardData();
  
  // 로컬 UI 상태
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAddTodoModalOpen, setIsAddTodoModalOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('priority');
  const [newTodo, setNewTodo] = useState({
    title: '',
    priority: 'medium',
    category: '업무',
    dueDate: new Date().toISOString().split('T')[0],
    memo: ''
  });

  // 사용자 정보 (간단하게 처리)
  const user = {
    username: window.authTokens?.username || "admin",
    authorities: window.authTokens?.authorities || ["ROLE_ADMIN"]
  };

  // 시계 업데이트
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 정렬된 오늘 할일
  const sortedTodayTodos = useMemo(() => {
    if (!todayTodos.length) return [];
    
    const sorted = [...todayTodos];
    switch (sortOrder) {
      case 'priority':
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, minimal: 4 };
        return sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
      case 'date':
        return sorted.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      default:
        return sorted;
    }
  }, [todayTodos, sortOrder]);

  // 이벤트 핸들러들
  const handleAddTodo = useCallback(async () => {
    if (!newTodo.title.trim()) return;

    try {
      await todoService.createTodo(newTodo);
      setIsAddTodoModalOpen(false);
      setNewTodo({
        title: '',
        priority: 'medium',
        category: '업무',
        dueDate: new Date().toISOString().split('T')[0],
        memo: ''
      });
      // 데이터 새로고침
      refetch();
    } catch (error) {
      console.error('할일 추가 실패:', error);
      alert('할일 추가에 실패했습니다.');
    }
  }, [newTodo, refetch]);

  const handleToggleStatus = useCallback(async (id) => {
    try {
      await todoService.toggleTodoStatus(id);
      refetch();
    } catch (error) {
      console.error('상태 변경 실패:', error);
    }
  }, [refetch]);

  const handleDeleteTodo = useCallback(async (id) => {
    if (!window.confirm('정말로 삭제하시겠습니까?')) return;
    
    try {
      await todoService.deleteTodo(id);
      refetch();
    } catch (error) {
      console.error('할일 삭제 실패:', error);
    }
  }, [refetch]);

  const handleLogout = useCallback(async () => {
    try {
      if (onLogout) {
        await onLogout();
      } else {
        // 간단한 로그아웃 처리
        window.authTokens = null;
        localStorage.removeItem('authTokens');
        window.location.reload();
      }
    } catch (error) {
      console.error('로그아웃 실패:', error);
      window.location.reload();
    }
  }, [onLogout]);

  // UI 헬퍼 함수들
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
      case 'critical': return '🔴 매우긴급';
      case 'high': return '🟠 높음';
      case 'medium': return '🟡 보통';
      case 'low': return '🟢 낮음';
      case 'minimal': return '🔵 최소';
      default: return '⚪ 미정';
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

  // 기본 통계 (데이터 없을 때)
  const displayStats = stats || { total: 0, completed: 0, inProgress: 0, pending: 0, completionRate: 0 };

  const menuItems = [
    { id: 'dashboard', name: '대시보드', icon: Activity },
    { id: 'todos', name: '할 일 관리', icon: CheckCircle },
    { id: 'calendar', name: '캘린더', icon: Calendar },
    { id: 'analytics', name: '통계', icon: TrendingUp },
    { id: 'settings', name: '설정', icon: Settings }
  ];

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

              <div className="hidden md:flex space-x-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onPageChange?.(item.id)}
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
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
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
            <div className="bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-xl p-4 border border-red-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-red-500/30 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-7 h-7 text-red-300" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{urgentTodos.length}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-red-200 font-bold text-lg">⚡ 긴급 알림 🔥</h3>
                    <p className="text-red-300">{urgentTodos.length}개의 긴급한 할 일이 있습니다!</p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  {urgentTodos.slice(0, 2).map((todo) => (
                    <div key={todo.id} className={`rounded-lg px-4 py-3 border shadow-lg ${getPriorityBackground(todo.priority)}`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">{todo.priority === 'critical' ? '🚨' : '⚠️'}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(todo.priority)}`}>
                          {getPriorityText(todo.priority)}
                        </span>
                      </div>
                      <p className="text-white text-sm font-medium truncate max-w-32">{todo.title}</p>
                      <p className="text-red-200 text-xs">📅 {todo.dueDate}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 환영 메시지 */}
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
                    API 오류: {error}
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
                <p className="text-3xl font-bold text-white">{displayStats.total}</p>
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
                <p className="text-3xl font-bold text-green-400">{displayStats.completed}</p>
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
                <p className="text-3xl font-bold text-blue-400">{displayStats.inProgress}</p>
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
                <p className="text-3xl font-bold text-purple-400">{displayStats.completionRate}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* 오늘 할 일 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="appearance-none bg-white/10 border border-white/20 text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="priority" className="bg-gray-800">우선순위순</option>
                    <option value="date" className="bg-gray-800">마감일순</option>
                  </select>
                  
                  <button 
                    onClick={() => setIsAddTodoModalOpen(true)}
                    disabled={loading}
                    className="flex items-center px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    추가
                  </button>
                </div>
              </div>

              <div className="space-y-3 min-h-80 max-h-80 overflow-y-auto">
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
                        {todo.memo && <FileText className="w-3 h-3 text-gray-400" />}
                        <span className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(todo.priority)}`}>
                          {getPriorityText(todo.priority)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">{todo.category}</span>
                        <span className="text-xs text-gray-400">📅 {todo.dueDate}</span>
                      </div>
                    </div>
                    <div className="flex space-x-1">
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
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 사이드 패널 */}
          <div className="space-y-6">
            {/* 진행률 차트 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-4">진행률</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm text-gray-300 mb-1">
                    <span>완료</span>
                    <span>{displayStats.completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${displayStats.completionRate}%` }}
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
                        {todo.memo && <FileText className="w-3 h-3 text-gray-400" />}
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

            {/* 새로고침 버튼 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <button
                onClick={refetch}
                disabled={loading}
                className="w-full py-2 px-4 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-blue-400/20 border-t-blue-400 rounded-full animate-spin mr-2"></div>
                ) : (
                  <Activity className="w-4 h-4 mr-2" />
                )}
                데이터 새로고침
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 할 일 추가 모달 */}
      {isAddTodoModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">새 할 일 추가</h3>
                <button
                  onClick={() => setIsAddTodoModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">할 일 제목</label>
                  <input
                    type="text"
                    value={newTodo.title}
                    onChange={(e) => setNewTodo(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="할 일을 입력하세요"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">우선순위</label>
                    <select
                      value={newTodo.priority}
                      onChange={(e) => setNewTodo(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="critical" className="bg-gray-800">🔴 매우긴급</option>
                      <option value="high" className="bg-gray-800">🟠 높음</option>
                      <option value="medium" className="bg-gray-800">🟡 보통</option>
                      <option value="low" className="bg-gray-800">🟢 낮음</option>
                      <option value="minimal" className="bg-gray-800">🔵 최소</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">카테고리</label>
                    <select
                      value={newTodo.category}
                      onChange={(e) => setNewTodo(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="업무" className="bg-gray-800">업무</option>
                      <option value="개발" className="bg-gray-800">개발</option>
                      <option value="개인" className="bg-gray-800">개인</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">마감일</label>
                  <input
                    type="date"
                    value={newTodo.dueDate}
                    onChange={(e) => setNewTodo(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">메모</label>
                  <textarea
                    value={newTodo.memo}
                    onChange={(e) => setNewTodo(prev => ({ ...prev, memo: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="추가 메모 (선택사항)"
                    rows="3"
                  />
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setIsAddTodoModalOpen(false)}
                    className="flex-1 py-3 px-4 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleAddTodo}
                    disabled={!newTodo.title.trim()}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50"
                  >
                    추가
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