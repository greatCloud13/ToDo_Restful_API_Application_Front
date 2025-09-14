import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  CheckCircle,
  Activity,
  Settings,
  LogOut,
  Bell,
  BarChart3,
  PieChart,
  Target,
  Clock,
  Award,
  AlertTriangle,
  TrendingDown,
  Users,
  Zap,
  Filter
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, 
  Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, RadialBarChart, RadialBar, AreaChart, Area 
} from 'recharts';
import { useAppContext } from '../../contexts/AppContext';
import { authService } from '../../services/authService';

const AnalyticsPage = ({ onPageChange, currentPage = 'analytics', onLogout }) => {
  const {
    // Context 상태
    todos,
    user,
    loading,
    // 유틸리티 함수들
    getStats,
    getUrgentTodos
  } = useAppContext();

  // 로컬 상태
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // week, month, year
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 메뉴 아이템들
  const menuItems = [
    { id: 'dashboard', name: '대시보드', icon: Activity },
    { id: 'todos', name: '할 일 관리', icon: CheckCircle },
    { id: 'calendar', name: '캘린더', icon: Calendar },
    { id: 'analytics', name: '통계', icon: TrendingUp },
    { id: 'settings', name: '설정', icon: Settings }
  ];

  const urgentTodos = getUrgentTodos();
  const stats = getStats();

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

  // 통계 데이터 계산
  const analyticsData = useMemo(() => {
    // 우선순위별 분포
    const priorityDistribution = [
      { name: '매우긴급', value: todos.filter(t => t.priority === 'critical').length, color: '#ef4444' },
      { name: '높음', value: todos.filter(t => t.priority === 'high').length, color: '#f97316' },
      { name: '보통', value: todos.filter(t => t.priority === 'medium').length, color: '#eab308' },
      { name: '낮음', value: todos.filter(t => t.priority === 'low').length, color: '#22c55e' },
      { name: '최소', value: todos.filter(t => t.priority === 'minimal').length, color: '#3b82f6' }
    ];

    // 카테고리별 진행 상황
    const categoryProgress = ['업무', '개발', '개인'].map(category => {
      const categoryTodos = todos.filter(t => t.category === category);
      const completed = categoryTodos.filter(t => t.status === 'completed').length;
      const total = categoryTodos.length;
      return {
        name: category,
        완료: completed,
        진행중: categoryTodos.filter(t => t.status === 'in-progress').length,
        대기: categoryTodos.filter(t => t.status === 'pending').length,
        완료율: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    });

    // 최근 7일간 완료 추이
    const last7Days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayTodos = todos.filter(t => t.dueDate === dateStr);
      const completedCount = dayTodos.filter(t => t.status === 'completed').length;
      
      last7Days.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        완료: completedCount,
        전체: dayTodos.length
      });
    }

    // 요일별 생산성
    const weekdayProductivity = ['일', '월', '화', '수', '목', '금', '토'].map((day, index) => {
      const dayTodos = todos.filter(t => {
        const todoDate = new Date(t.dueDate);
        return todoDate.getDay() === index;
      });
      const completed = dayTodos.filter(t => t.status === 'completed').length;
      return {
        day,
        완료: completed,
        전체: dayTodos.length,
        완료율: dayTodos.length > 0 ? Math.round((completed / dayTodos.length) * 100) : 0
      };
    });

    // 지연된 할일 분석
    const overdueTodos = todos.filter(t => {
      const dueDate = new Date(t.dueDate);
      return dueDate < today && t.status !== 'completed';
    });

    // 평균 완료 시간 (더미 데이터 - 실제로는 백엔드에서 계산)
    const avgCompletionTime = {
      critical: 1.2,
      high: 2.5,
      medium: 3.8,
      low: 5.2,
      minimal: 7.1
    };

    return {
      priorityDistribution,
      categoryProgress,
      last7Days,
      weekdayProductivity,
      overdueTodos,
      avgCompletionTime
    };
  }, [todos]);

  // 인사이트 계산
  const insights = useMemo(() => {
    const data = analyticsData;
    
    // 가장 생산적인 요일
    const mostProductiveDay = data.weekdayProductivity.reduce((prev, current) => 
      (prev.완료율 > current.완료율) ? prev : current
    );

    // 가장 많이 지연되는 카테고리
    const categoryDelays = ['업무', '개발', '개인'].map(category => {
      const overdue = data.overdueTodos.filter(t => t.category === category).length;
      return { category, overdue };
    });
    const mostDelayedCategory = categoryDelays.reduce((prev, current) => 
      (prev.overdue > current.overdue) ? prev : current
    );

    // 완료율 추세
    const recentTrend = data.last7Days.slice(-3).reduce((acc, day) => {
      return acc + (day.전체 > 0 ? (day.완료 / day.전체) : 0);
    }, 0) / 3 * 100;

    const previousTrend = data.last7Days.slice(0, 3).reduce((acc, day) => {
      return acc + (day.전체 > 0 ? (day.완료 / day.전체) : 0);
    }, 0) / 3 * 100;

    const trend = recentTrend - previousTrend;

    return {
      mostProductiveDay,
      mostDelayedCategory,
      trend,
      totalOverdue: data.overdueTodos.length,
      avgDailyCompletion: (stats.completed / 7).toFixed(1)
    };
  }, [analyticsData, stats]);

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800/90 backdrop-blur-sm p-3 rounded-lg border border-white/20">
          <p className="text-white font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // 기간 선택 옵션
  const periodOptions = [
    { value: 'week', label: '주간' },
    { value: 'month', label: '월간' },
    { value: 'year', label: '연간' }
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
                  <BarChart3 className="w-8 h-8 mr-3" />
                  통계 분석
                  {loading && (
                    <div className="ml-3 w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  )}
                </h2>
                <p className="text-gray-300">생산성 패턴과 인사이트를 확인하세요</p>
              </div>
              
              {/* 기간 선택 */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {periodOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-gray-800">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 핵심 지표 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">전체 완료율</p>
                <p className="text-2xl font-bold text-white">{stats.completionRate}%</p>
                <p className="text-xs text-gray-400 mt-1">
                  {stats.completed}/{stats.total}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">일평균 완료</p>
                <p className="text-2xl font-bold text-blue-400">{insights.avgDailyCompletion}</p>
                <p className="text-xs text-gray-400 mt-1">개/일</p>
              </div>
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">지연된 작업</p>
                <p className="text-2xl font-bold text-red-400">{insights.totalOverdue}</p>
                <p className="text-xs text-gray-400 mt-1">긴급 처리 필요</p>
              </div>
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">생산성 추세</p>
                <p className="text-2xl font-bold text-purple-400 flex items-center">
                  {insights.trend > 0 ? '+' : ''}{insights.trend.toFixed(1)}%
                  {insights.trend > 0 ? 
                    <TrendingUp className="w-4 h-4 ml-1 text-green-400" /> : 
                    <TrendingDown className="w-4 h-4 ml-1 text-red-400" />
                  }
                </p>
                <p className="text-xs text-gray-400 mt-1">최근 3일 vs 이전</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs">최고 생산성</p>
                <p className="text-2xl font-bold text-yellow-400">{insights.mostProductiveDay.day}요일</p>
                <p className="text-xs text-gray-400 mt-1">
                  {insights.mostProductiveDay.완료율}% 완료율
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* 차트 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 완료 추이 차트 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">📈 일별 완료 추이</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={analyticsData.last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="완료" 
                  stroke="#8b5cf6" 
                  fill="url(#colorGradient)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="전체" 
                  stroke="#06b6d4" 
                  fill="url(#colorGradient2)" 
                  strokeWidth={2}
                  opacity={0.5}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorGradient2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 우선순위 분포 파이 차트 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">🎯 우선순위별 분포</h3>
            <ResponsiveContainer width="100%" height={250}>
              <RePieChart>
                <Pie
                  data={analyticsData.priorityDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analyticsData.priorityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 카테고리별 진행 상황 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">📊 카테고리별 진행 상황</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.categoryProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="완료" stackId="a" fill="#22c55e" />
              <Bar dataKey="진행중" stackId="a" fill="#3b82f6" />
              <Bar dataKey="대기" stackId="a" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-4 mt-4">
            {analyticsData.categoryProgress.map((category) => (
              <div key={category.name} className="text-center">
                <p className="text-gray-400 text-sm">{category.name}</p>
                <p className="text-2xl font-bold text-white">{category.완료율}%</p>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${category.완료율}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 요일별 생산성 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">📅 요일별 생산성 패턴</h3>
            <ResponsiveContainer width="100%" height={250}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="90%" data={analyticsData.weekdayProductivity}>
                <RadialBar minAngle={15} label={{ position: 'insideStart', fill: '#fff' }} background clockWise dataKey="완료율">
                  {analyticsData.weekdayProductivity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${280 - index * 30}, 70%, 50%)`} />
                  ))}
                </RadialBar>
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="flex justify-around mt-4">
              {analyticsData.weekdayProductivity.map((day, index) => (
                <div key={day.day} className="text-center">
                  <p className="text-xs text-gray-400">{day.day}</p>
                  <p className="text-sm font-bold" style={{ color: `hsl(${280 - index * 30}, 70%, 60%)` }}>
                    {day.완료}/{day.전체}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 인사이트 카드 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">💡 AI 인사이트</h3>
            <div className="space-y-4">
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center space-x-2 mb-1">
                  <Award className="w-4 h-4 text-green-400" />
                  <p className="text-sm font-medium text-green-400">최고 생산성</p>
                </div>
                <p className="text-white text-sm">
                  {insights.mostProductiveDay.day}요일에 가장 많은 작업을 완료합니다.
                  완료율 {insights.mostProductiveDay.완료율}%
                </p>
              </div>

              <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <div className="flex items-center space-x-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <p className="text-sm font-medium text-yellow-400">주의 필요</p>
                </div>
                <p className="text-white text-sm">
                  {insights.mostDelayedCategory.category} 카테고리에서 {insights.mostDelayedCategory.overdue}개의 지연된 작업이 있습니다.
                </p>
              </div>

              <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <div className="flex items-center space-x-2 mb-1">
                  <Target className="w-4 h-4 text-purple-400" />
                  <p className="text-sm font-medium text-purple-400">추천 사항</p>
                </div>
                <p className="text-white text-sm">
                  긴급 작업 {urgentTodos.length}개를 우선 처리하면 전체 완료율을 {Math.min(100, stats.completionRate + 15)}%까지 올릴 수 있습니다.
                </p>
              </div>

              <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="flex items-center space-x-2 mb-1">
                  {insights.trend > 0 ? 
                    <TrendingUp className="w-4 h-4 text-blue-400" /> : 
                    <TrendingDown className="w-4 h-4 text-blue-400" />
                  }
                  <p className="text-sm font-medium text-blue-400">생산성 추세</p>
                </div>
                <p className="text-white text-sm">
                  최근 3일간 생산성이 {Math.abs(insights.trend).toFixed(1)}% {insights.trend > 0 ? '상승' : '하락'}했습니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 평균 완료 시간 (더미 데이터) */}
        <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">⏱️ 우선순위별 평균 소요 시간</h3>
          <div className="grid grid-cols-5 gap-4">
            {Object.entries(analyticsData.avgCompletionTime).map(([priority, time]) => (
              <div key={priority} className="text-center">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center border border-purple-500/30">
                  <Clock className="w-8 h-8 text-purple-400" />
                </div>
                <p className="text-gray-400 text-sm mt-2 capitalize">{priority}</p>
                <p className="text-xl font-bold text-white">{time}일</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;