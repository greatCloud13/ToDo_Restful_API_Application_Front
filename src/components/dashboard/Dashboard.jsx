import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navigation from '../../components/common/Navigation';
import { API_ENDPOINTS } from '../../config/api';
import confetti from 'canvas-confetti';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Plus, 
  Calendar, 
  TrendingUp, 
  Activity,
  Star,
  X,
  Edit,
  Trash2,
  FileText,
  Eye,
  Target
} from 'lucide-react';

// ===========================
// 서비스 클래스들
// ===========================

class DashboardService {
  constructor() {
    this.baseURL = API_ENDPOINTS.DASHBOARD;
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

  async getOverdueTodos() {
    const response = await fetch(`${this.baseURL}/overdue`, {
      method: 'GET',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`지연된 할일 조회 실패: ${response.status}`);
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
    this.baseURL = API_ENDPOINTS.TODOS;
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

const dashboardService = new DashboardService();
const todoService = new TodoService();

// ===========================
// Custom Hook
// ===========================

function useDashboardData() {
  const [data, setData] = useState({
    stats: null,
    todayTodos: [],
    urgentTodos: [],
    overdueTodos: [],
    loading: true,
    error: null
  });

  const fetchDashboardData = useCallback(async () => {
    console.log('Dashboard 데이터 로드 시작');
    
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      const [statsResult, todayResult, urgentResult, overdueResult] = await Promise.allSettled([
        dashboardService.getStats(),
        dashboardService.getTodayTodos(),
        dashboardService.getUrgentTodos(),
        dashboardService.getOverdueTodos()
      ]);

      setData({
        stats: statsResult.status === 'fulfilled' ? statsResult.value : null,
        todayTodos: todayResult.status === 'fulfilled' ? todayResult.value : [],
        urgentTodos: urgentResult.status === 'fulfilled' ? urgentResult.value : [],
        overdueTodos: overdueResult.status === 'fulfilled' ? overdueResult.value : [],
        loading: false,
        error: null
      });

      console.log('Dashboard 데이터 로드 완료');
    } catch (error) {
      console.error('Dashboard 데이터 로드 실패:', error);
      setData(prev => ({ ...prev, loading: false, error: error.message }));
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { ...data, refetch: fetchDashboardData };
}

// ===========================
// 메인 컴포넌트
// ===========================

const Dashboard = ({ onPageChange, currentPage = 'dashboard', onLogout, onTodoClick }) => {
  const { stats, todayTodos, urgentTodos, overdueTodos, loading, error, refetch } = useDashboardData();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAddTodoModalOpen, setIsAddTodoModalOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('priority');
  const [hiddenTodos, setHiddenTodos] = useState(new Set());
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [previousCompletionRate, setPreviousCompletionRate] = useState(0);
  const [newTodo, setNewTodo] = useState({
    title: '',
    priority: 'medium',
    category: '업무',
    dueDate: new Date().toISOString().split('T')[0],
    memo: ''
  });

  const user = {
    username: window.authTokens?.username || "admin",
    authorities: window.authTokens?.authorities || ["ROLE_ADMIN"]
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (stats) {
      const currentRate = stats.completionRate;
      
      if (previousCompletionRate < 100 && currentRate === 100 && stats.total > 0) {
        console.log('🎉 100% 달성! 컨페티 실행');
        
        confetti({
          particleCount: 130,
          angle: 130,
          spread: 80,
          startVelocity: 55,
          origin: { x: 0.70, y: 0.50 }
        });
        
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
      
      setPreviousCompletionRate(currentRate);
    }
  }, [stats, previousCompletionRate]);

  const displayUrgentTodos = useMemo(() => {
    let baseUrgentTodos = urgentTodos.length > 0 ? urgentTodos : [];
    
    if (baseUrgentTodos.length === 0) {
      baseUrgentTodos = todayTodos.filter(todo => 
        (todo.priority === 'critical' || todo.priority === 'high') && 
        todo.status !== 'completed'
      );
    } else {
      const completedTodayIds = new Set(
        todayTodos.filter(todo => todo.status === 'completed').map(todo => todo.id)
      );
      
      baseUrgentTodos = baseUrgentTodos.filter(todo => !completedTodayIds.has(todo.id));
      
      const newUrgentFromToday = todayTodos.filter(todo => 
        (todo.priority === 'critical' || todo.priority === 'high') && 
        todo.status !== 'completed' &&
        !baseUrgentTodos.some(existing => existing.id === todo.id)
      );
      
      baseUrgentTodos = [...baseUrgentTodos, ...newUrgentFromToday];
    }
    
    return baseUrgentTodos;
  }, [urgentTodos, todayTodos]);

  const displayOverdueTodos = useMemo(() => {
    if (overdueTodos && overdueTodos.length > 0) {
      return overdueTodos.filter(todo => !hiddenTodos.has(todo.id));
    }
    
    const today = new Date().toISOString().split('T')[0];
    return todayTodos.filter(todo => 
      todo.dueDate < today && 
      todo.status !== 'completed' &&
      !hiddenTodos.has(todo.id)
    ).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [overdueTodos, todayTodos, hiddenTodos]);

  const sortedTodayTodos = useMemo(() => {
    if (!todayTodos.length) return [];
    
    let filtered = todayTodos.filter(todo => !hiddenTodos.has(todo.id));
    
    filtered = filtered.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      return 0;
    });

    switch (sortOrder) {
      case 'priority':
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3, minimal: 4 };
        return filtered.sort((a, b) => {
          if ((a.status === 'completed') === (b.status === 'completed')) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          }
          return 0;
        });
      case 'date':
        return filtered.sort((a, b) => {
          if ((a.status === 'completed') === (b.status === 'completed')) {
            return new Date(a.dueDate) - new Date(b.dueDate);
          }
          return 0;
        });
      default:
        return filtered;
    }
  }, [todayTodos, sortOrder, hiddenTodos]);

  const hiddenCount = todayTodos.filter(todo => hiddenTodos.has(todo.id)).length;

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

  const handleToggleHidden = useCallback((id) => {
    setHiddenTodos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const showAllHidden = useCallback(() => {
    setHiddenTodos(new Set());
  }, []);

  const handleViewDetail = useCallback((todo) => {
    setSelectedTodo(todo);
    setIsDetailModalOpen(true);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedTodo(null);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      if (onLogout) {
        await onLogout();
      } else {
        window.authTokens = null;
        localStorage.removeItem('authTokens');
        window.location.reload();
      }
    } catch (error) {
      console.error('로그아웃 실패:', error);
      window.location.reload();
    }
  }, [onLogout]);

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

  const displayStats = stats || { total: 0, completed: 0, inProgress: 0, pending: 0, completionRate: 0 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Navigation
        currentPage={currentPage}
        onPageChange={onPageChange}
        onLogout={handleLogout}
        onTodoClick={onTodoClick}
      />

      {displayUrgentTodos.length > 0 && (
        <div className="bg-gradient-to-r from-red-600/30 via-orange-600/30 to-red-600/30 border-b border-red-500/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-xl p-4 border border-red-500/30">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-red-500/30 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-7 h-7 text-red-300" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{displayUrgentTodos.length}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-red-200 font-bold text-lg">⚡ 긴급 알림 🔥</h3>
                    <p className="text-red-300 text-sm">{displayUrgentTodos.length}개의 긴급한 할 일이 있습니다!</p>
                  </div>
                </div>
                <div className="flex space-x-3 overflow-x-auto">
                  {displayUrgentTodos.slice(0, 2).map((todo) => (
                    <div key={todo.id} className={`rounded-lg px-4 py-3 border shadow-lg ${getPriorityBackground(todo.priority)} min-w-32`}>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">{todo.priority === 'critical' ? '🚨' : '⚠️'}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(todo.priority)}`}>
                          {getPriorityText(todo.priority)}
                        </span>
                      </div>
                      <p className="text-white text-sm font-medium truncate">{todo.title}</p>
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
        {/* 개선된 반응형 헤더 */}
        <div className="mb-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
            
            {/* 데스크톱용 헤더 (768px 이상) */}
            <div className="hidden md:block p-6 lg:p-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0">
                    <span className="text-2xl lg:text-3xl">👋</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-2xl lg:text-3xl font-bold text-white mb-1 truncate">
                      안녕하세요, <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{user.username}</span>님
                    </h2>
                    <p className="text-gray-400 text-sm truncate">오늘도 멋진 하루를 만들어가세요 ✨</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 bg-slate-900/60 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden shadow-xl">
                  <div className="px-8 py-5 flex flex-col justify-between border-r border-white/10">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                      <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider">Live Time</span>
                    </div>
                    <div className="font-mono tabular-nums flex items-baseline space-x-1">
                      <span className="text-5xl font-bold text-white leading-none tracking-tight">
                        {currentTime.getHours().toString().padStart(2, '0')}
                      </span>
                      <span className="text-5xl font-bold text-purple-400 leading-none">:</span>
                      <span className="text-5xl font-bold text-white leading-none tracking-tight">
                        {currentTime.getMinutes().toString().padStart(2, '0')}
                      </span>
                      <span className="text-lg text-gray-500 ml-1 leading-none self-end mb-1">
                        {currentTime.getSeconds().toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="px-8 py-5 flex flex-col justify-between">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="w-3 h-3 text-blue-400" />
                      <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">Today</span>
                    </div>
                    <div className="flex items-end space-x-2">
                      <div className="flex flex-col justify-end space-y-0.5">
                        <span className="text-lg font-bold text-blue-400 leading-none">
                          {currentTime.toLocaleDateString('ko-KR', { month: 'short' }).replace('.', '')}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium leading-none">
                          {currentTime.toLocaleDateString('ko-KR', { weekday: 'short' })} · {currentTime.getFullYear()}
                        </span>
                      </div>
                      <span className="text-5xl font-bold text-white leading-none">
                        {currentTime.getDate()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="mt-6 bg-red-500/5 border-l-4 border-red-500 rounded-r-xl p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-300 mb-1">오류 발생</p>
                      <p className="text-xs text-red-400/90">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 모바일/태블릿용 헤더 (767px 이하) */}
            <div className="md:hidden p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <span className="text-xl">👋</span>
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-white">안녕하세요!</h2>
                      <p className="text-xs text-gray-400 truncate">{user.username}님</p>
                    </div>
                  </div>
                  
                  <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/10">
                    <div className="flex items-center space-x-1 mb-0.5">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-[8px] text-purple-400 font-bold uppercase">Live</span>
                    </div>
                    <div className="font-mono tabular-nums text-2xl font-bold text-white leading-none">
                      {currentTime.getHours().toString().padStart(2, '0')}
                      <span className="text-purple-400">:</span>
                      {currentTime.getMinutes().toString().padStart(2, '0')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-900/50 backdrop-blur-xl rounded-xl px-4 py-3 border border-white/10">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span className="text-sm text-white font-medium">
                      {currentTime.getFullYear()}년 {currentTime.getMonth() + 1}월 {currentTime.getDate()}일
                    </span>
                  </div>
                  <span className="text-sm text-blue-400 font-medium">
                    {currentTime.toLocaleDateString('ko-KR', { weekday: 'short' })}
                  </span>
                </div>

                {error && (
                  <div className="bg-red-500/5 border border-red-500/30 rounded-lg p-3">
                    <div className="flex items-start">
                      <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 mr-2 flex-shrink-0" />
                      <p className="text-xs text-red-400">{error}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs md:text-sm">전체 할 일</p>
                <p className="text-2xl md:text-3xl font-bold text-white">{displayStats.total}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs md:text-sm">완료됨</p>
                <p className="text-2xl md:text-3xl font-bold text-green-400">{displayStats.completed}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs md:text-sm">진행 중</p>
                <p className="text-2xl md:text-3xl font-bold text-blue-400">{displayStats.inProgress}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs md:text-sm">완료율</p>
                <p className="text-2xl md:text-3xl font-bold text-purple-400">{displayStats.completionRate}%</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* 왼쪽: 오늘 할 일 + 밀린 할일 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 오늘 할 일 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4 md:mb-6 flex-wrap gap-3">
                <h3 className="text-lg md:text-xl font-semibold text-white flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  오늘 할 일
                  {loading && (
                    <div className="ml-2 w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  )}
                  <span className="ml-2 text-xs md:text-sm text-gray-400">
                    ({sortedTodayTodos.length}개)
                    {hiddenCount > 0 && (
                      <span className="ml-1 text-orange-400">
                        ({hiddenCount}개 숨김)
                      </span>
                    )}
                  </span>
                </h3>
                <div className="flex items-center space-x-2 md:space-x-3">
                  {hiddenCount > 0 && (
                    <button
                      onClick={showAllHidden}
                      className="text-xs px-2 md:px-3 py-1 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors"
                    >
                      숨김 해제 ({hiddenCount})
                    </button>
                  )}
                  
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="appearance-none bg-white/10 border border-white/20 text-white text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="priority" className="bg-gray-800">우선순위순</option>
                    <option value="date" className="bg-gray-800">마감일순</option>
                  </select>
                  
                  <button 
                    onClick={() => setIsAddTodoModalOpen(true)}
                    disabled={loading}
                    className="flex items-center px-2 md:px-3 py-1 md:py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50 text-xs md:text-sm"
                  >
                    <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                    추가
                  </button>
                </div>
              </div>

              <div className="space-y-3 min-h-64 max-h-72 overflow-y-auto">
                {sortedTodayTodos.length > 0 ? sortedTodayTodos.map(todo => (
                  <div key={todo.id} className={`flex items-center p-3 md:p-4 rounded-lg border transition-all duration-200 hover:shadow-lg ${getPriorityBackground(todo.priority)} ${todo.status === 'completed' ? 'opacity-60' : ''}`}>
                    <div className="flex items-center mr-3 md:mr-4">
                      <button
                        onClick={() => handleToggleStatus(todo.id)}
                        className={`w-4 h-4 md:w-5 md:h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                          todo.status === 'completed' 
                            ? 'bg-green-500 border-green-500 shadow-lg shadow-green-500/30' 
                            : 'border-gray-400 hover:border-green-400 hover:bg-green-400/10'
                        }`}
                      >
                        {todo.status === 'completed' && (
                          <svg className="w-2 h-2 md:w-3 md:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 
                          onClick={() => handleViewDetail(todo)}
                          className={`font-medium cursor-pointer hover:text-purple-400 transition-colors text-sm md:text-base truncate ${todo.status === 'completed' ? 'text-gray-400 line-through' : 'text-white'}`}
                        >
                          {todo.title}
                        </h4>
                        {todo.memo && <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" />}
                        <span className={`px-2 py-1 rounded-full text-[10px] md:text-xs border ${getPriorityColor(todo.priority)} flex-shrink-0`}>
                          {getPriorityText(todo.priority)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className={`px-2 py-1 rounded-full text-[10px] md:text-xs ${
                          todo.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          todo.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-orange-500/20 text-orange-400'
                        }`}>
                          {todo.status === 'completed' ? '✅ 완료' : 
                           todo.status === 'in-progress' ? '🔄 진행중' : '⏸️ 대기'}
                        </span>
                        <span className="text-[10px] md:text-xs text-gray-400">{todo.category}</span>
                        <span className="text-[10px] md:text-xs text-gray-400">📅 {todo.dueDate}</span>
                      </div>
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <button 
                        onClick={() => handleToggleHidden(todo.id)}
                        className="p-1 md:p-2 text-gray-400 hover:text-yellow-400 transition-colors"
                        title="숨기기"
                      >
                        <Eye className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="p-1 md:p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12 text-gray-400">
                    <Calendar className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-base md:text-lg mb-2">
                      {hiddenCount > 0 ? '모든 할 일이 숨겨져 있습니다' : '오늘 예정된 할 일이 없습니다'}
                    </p>
                    {hiddenCount > 0 ? (
                      <button
                        onClick={showAllHidden}
                        className="text-orange-400 hover:text-orange-300 transition-colors text-sm"
                      >
                        {hiddenCount}개의 숨겨진 할 일 보기
                      </button>
                    ) : (
                      <button 
                        onClick={() => setIsAddTodoModalOpen(true)}
                        className="text-purple-400 hover:text-purple-300 transition-colors text-sm"
                      >
                        첫 번째 할 일을 추가해보세요
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 밀린 할일 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-white flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-orange-400" />
                  밀린 할일
                  <span className="ml-2 text-xs md:text-sm text-orange-400">
                    ({displayOverdueTodos.length}개)
                  </span>
                </h3>
              </div>

              <div className="space-y-3 min-h-64 max-h-72 overflow-y-auto">
                {displayOverdueTodos.length > 0 ? displayOverdueTodos.map(todo => (
                  <div key={todo.id} className="flex items-center p-3 md:p-4 rounded-lg border bg-orange-500/10 border-orange-500/30 transition-all duration-200 hover:shadow-lg">
                    <div className="flex items-center mr-3 md:mr-4">
                      <button
                        onClick={() => handleToggleStatus(todo.id)}
                        className="w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-orange-400 hover:border-orange-300 hover:bg-orange-400/10 transition-all duration-200 flex items-center justify-center"
                      >
                        {todo.status === 'completed' && (
                          <svg className="w-2 h-2 md:w-3 md:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 
                          onClick={() => handleViewDetail(todo)}
                          className={`font-medium cursor-pointer hover:text-purple-400 transition-colors text-sm md:text-base truncate ${todo.status === 'completed' ? 'text-gray-400 line-through' : 'text-white'}`}
                        >
                          {todo.title}
                        </h4>
                        {todo.memo && <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" />}
                        <span className={`px-2 py-1 rounded-full text-[10px] md:text-xs border ${getPriorityColor(todo.priority)} flex-shrink-0`}>
                          {getPriorityText(todo.priority)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="px-2 py-1 rounded-full text-[10px] md:text-xs bg-orange-500/30 text-orange-300">
                          ⚠️ 지연됨
                        </span>
                        <span className="text-[10px] md:text-xs text-gray-400">{todo.category}</span>
                        <span className="text-[10px] md:text-xs text-orange-300">📅 {todo.dueDate}</span>
                      </div>
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <button 
                        onClick={() => handleToggleHidden(todo.id)}
                        className="p-1 md:p-2 text-gray-400 hover:text-yellow-400 transition-colors"
                        title="숨기기"
                      >
                        <Eye className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteTodo(todo.id)}
                        className="p-1 md:p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12 text-gray-400">
                    <CheckCircle className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-base md:text-lg">밀린 할일이 없습니다!</p>
                    <p className="text-xs md:text-sm mt-2 text-green-400">모든 할일을 제때 처리하고 있어요 👍</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 오른쪽: 사이드바 */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20">
              <h3 className="text-base md:text-lg font-semibold text-white mb-4">진행률</h3>
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

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20">
              <h3 className="text-base md:text-lg font-semibold text-white mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-red-400" />
                긴급 할 일
                {displayUrgentTodos.length > 0 && (
                  <span className="ml-2 px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded-full">
                    {displayUrgentTodos.length}
                  </span>
                )}
              </h3>
              <div className="space-y-3">
                {displayUrgentTodos.length > 0 ? displayUrgentTodos.slice(0, 3).map(todo => (
                  <div key={todo.id} className="flex items-center p-3 bg-red-500/10 rounded-lg border border-red-500/20 cursor-pointer hover:bg-red-500/20 transition-colors" onClick={() => handleViewDetail(todo)}>
                    <div className="mr-3">
                      {todo.priority === 'critical' ? (
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      ) : (
                        <Star className="w-4 h-4 text-orange-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1">
                        <p className="text-white text-xs md:text-sm font-medium truncate">{todo.title}</p>
                        {todo.memo && <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" />}
                      </div>
                      <p className="text-red-400 text-[10px] md:text-xs">마감: {todo.dueDate}</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-4 text-gray-400">
                    <CheckCircle className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs md:text-sm">긴급한 할 일이 없습니다</p>
                  </div>
                )}
                {displayUrgentTodos.length > 3 && (
                  <div className="text-center pt-2">
                    <span className="text-xs text-gray-400">
                      +{displayUrgentTodos.length - 3}개 더
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <button
                onClick={refetch}
                disabled={loading}
                className="w-full py-2 px-4 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 flex items-center justify-center text-sm"
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

      {/* 할일 추가 모달 */}
      {isAddTodoModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl w-full max-w-md">
            <div className="p-4 md:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg md:text-xl font-bold text-white">새 할 일 추가</h3>
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

      {/* 상세보기 모달 */}
      {isDetailModalOpen && selectedTodo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl w-full max-w-md">
            <div className="p-4 md:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg md:text-xl font-bold text-white">할일 상세정보</h3>
                <button
                  onClick={handleCloseDetailModal}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">제목</label>
                  <p className="text-white text-base md:text-lg font-medium">{selectedTodo.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">우선순위</label>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs md:text-sm border ${getPriorityColor(selectedTodo.priority)}`}>
                      {getPriorityText(selectedTodo.priority)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">상태</label>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs md:text-sm ${
                      selectedTodo.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      selectedTodo.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {selectedTodo.status === 'completed' ? '✅ 완료' : 
                       selectedTodo.status === 'in-progress' ? '🔄 진행중' : '⏸️ 대기'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">카테고리</label>
                    <p className="text-white text-sm">{selectedTodo.category}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">마감일</label>
                    <p className="text-white text-sm">📅 {selectedTodo.dueDate}</p>
                  </div>
                </div>

                {selectedTodo.memo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      <FileText className="w-4 h-4 inline mr-1" />
                      메모
                    </label>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-white whitespace-pre-wrap text-sm">{selectedTodo.memo}</p>
                    </div>
                  </div>
                )}

                {selectedTodo.createdAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">생성일</label>
                    <p className="text-gray-300 text-sm">
                      {new Date(selectedTodo.createdAt).toLocaleString('ko-KR')}
                    </p>
                  </div>
                )}

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={handleCloseDetailModal}
                    className="flex-1 py-3 px-4 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors text-sm"
                  >
                    닫기
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