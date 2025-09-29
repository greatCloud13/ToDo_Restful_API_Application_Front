// components/pages/AnalyticsPage.js
import React, { useState, useCallback } from 'react';
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
  Filter,
  RefreshCw
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart as RePieChart, Pie, 
  Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, RadialBarChart, RadialBar, AreaChart, Area 
} from 'recharts';
import { useAnalytics } from '../../hooks/useAnalytics';
import { authService } from '../../services/authService';

const AnalyticsPage = ({ onPageChange, currentPage = 'analytics', onLogout }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 주간으로 고정
  const selectedPeriod = 'week';

  // useAnalytics 훅 사용법 수정
  const {
    summary,
    trends,
    distribution,
    productivity,
    insights,
    loading,
    error,
    lastUpdated,
    refresh, // refreshAnalytics -> refresh로 수정
    isStale  // isDataStale -> isStale로 수정
  } = useAnalytics(selectedPeriod); // 주간으로 고정

  // 메뉴 아이템들
  const menuItems = [
    { id: 'dashboard', name: '대시보드', icon: Activity },
    { id: 'todos', name: '할 일 관리', icon: CheckCircle },
    { id: 'calendar', name: '캘린더', icon: Calendar },
    { id: 'analytics', name: '통계', icon: TrendingUp },
    { id: 'settings', name: '설정', icon: Settings }
  ];

  // 우선순위 레벨 매핑
  const priorityLevelMap = {
    'VERY_HIGH': { label: '매우높음', color: '#dc2626' },
    'HIGH': { label: '높음', color: '#ea580c' },
    'MEDIUM': { label: '중간', color: '#ca8a04' },
    'MIDDLE': { label: '중간', color: '#ca8a04' }, // API 응답에서 MIDDLE 사용
    'LOW': { label: '낮음', color: '#16a34a' },
    'VERY_LOW': { label: '매우낮음', color: '#2563eb' }
  };

  // 이벤트 핸들러들
  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      if (onLogout && typeof onLogout === 'function') {
        await onLogout();
      } else {
        await authService.logout();
        window.location.reload();
      }
    } catch (error) {
      console.error('로그아웃 오류:', error);
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

  const handleRefresh = useCallback(() => {
    refresh(); // refreshAnalytics -> refresh로 수정
  }, [refresh]);

  // Custom Tooltip
  const CustomTooltip = useCallback(({ active, payload, label }) => {
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
  }, []);



  // API 데이터를 차트에 맞게 변환하는 함수들
  const getPriorityChartData = () => {
    if (!distribution?.priorityDistribution) {
      // Mock 데이터
      return [
        { name: 'VERY_HIGH', label: '매우높음', count: 5, color: '#dc2626' },
        { name: 'HIGH', label: '높음', count: 8, color: '#ea580c' },
        { name: 'MEDIUM', label: '중간', count: 10, color: '#ca8a04' },
        { name: 'LOW', label: '낮음', count: 3, color: '#16a34a' },
        { name: 'VERY_LOW', label: '매우낮음', count: 2, color: '#2563eb' }
      ];
    }

    return distribution.priorityDistribution.map(item => ({
      name: item.priority,
      label: priorityLevelMap[item.priority]?.label || item.priority,
      count: item.count,
      color: priorityLevelMap[item.priority]?.color || '#6b7280'
    }));
  };

  const getCategoryChartData = () => {
    if (!distribution?.categoryDistribution) {
      // Mock 데이터
      return [
        { 
          name: '업무', 
          completed: 10, 
          inProgress: 3, 
          pending: 2, 
          completionRate: 67,
          total: 15
        },
        { 
          name: '개발', 
          completed: 8, 
          inProgress: 1, 
          pending: 1, 
          completionRate: 80,
          total: 10
        },
        { 
          name: '개인', 
          completed: 3, 
          inProgress: 0, 
          pending: 0, 
          completionRate: 100,
          total: 3
        }
      ];
    }

    return distribution.categoryDistribution.map(item => ({
      name: item.categoryName,
      completed: item.completed,
      inProgress: item.inProgress,
      pending: item.pending,
      completionRate: item.completionRate,
      total: item.completed + item.inProgress + item.pending
    }));
  };

  const getTrendsChartData = () => {
    if (!trends?.data) {
      // API 데이터가 없으면 빈 배열 반환
      return [];
    }

    return trends.data.map(item => ({
      date: item.date,
      completed: item.completed,
      total: item.total
    }));
  };

  const getProductivityData = () => {
    if (!productivity?.weekdayStats) {
      // Mock 데이터
      return ['일', '월', '화', '수', '목', '금', '토'].map((day, index) => ({
        dayName: day,
        completedTodos: Math.floor(Math.random() * 15) + 3,
        totalTodos: Math.floor(Math.random() * 20) + 5,
        completionRate: Math.floor(Math.random() * 40) + 60
      }));
    }

    return productivity.weekdayStats;
  };

  const getInsightsData = () => {
    if (!insights || insights.length === 0) {
      // Mock 데이터
      return [
        {
          type: 'productivity',
          level: 'positive',
          title: '최고 생산성',
          message: '화요일에 가장 많은 작업을 완료합니다. 완료율 85%',
          icon: 'award',
          suggestion: '화요일에 중요한 작업을 스케줄링하세요'
        },
        {
          type: 'warning',
          level: 'warning',
          title: '주의 필요',
          message: '업무 카테고리에서 5개의 지연된 작업이 있습니다',
          icon: 'alert-triangle',
          suggestion: '지연된 업무 작업의 우선순위를 재검토하세요'
        },
        {
          type: 'recommendation',
          level: 'positive',
          title: '목표 달성 가능',
          message: '긴급 작업 5개를 우선 처리하면 전체 완료율을 91%까지 올릴 수 있습니다',
          icon: 'target',
          suggestion: '오늘 긴급 작업부터 시작하세요'
        }
      ];
    }

    return insights;
  };

  // 로딩 상태
  if (loading && !summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">통계 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const priorityChartData = getPriorityChartData();
  const categoryChartData = getCategoryChartData();
  const trendsChartData = getTrendsChartData();
  const productivityData = getProductivityData();
  const insightsData = getInsightsData();

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
                {summary?.urgentCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse">
                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
                  </div>
                )}
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm text-white font-medium">관리자</p>
                  <p className="text-xs text-gray-400">ROLE_ADMIN</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  title="로그아웃"
                  disabled={isLoggingOut}
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
                {lastUpdated && (
                  <p className="text-xs text-gray-400 mt-1">
                    마지막 업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}
                    {isStale && <span className="text-yellow-400 ml-1">(업데이트 필요)</span>}
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                {/* 새로고침 버튼 */}
                <button
                  onClick={handleRefresh}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="새로고침"
                  disabled={loading}
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 에러 알림 */}
        {error && summary && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <p className="text-yellow-400 text-sm">
                일부 데이터를 불러오지 못했습니다: {error}
              </p>
              <button
                onClick={handleRefresh}
                className="text-yellow-400 underline text-sm hover:text-yellow-300"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}

        {/* 차트 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 완료 추이 차트 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">일별 완료 추이</h3>
            {trendsChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={trendsChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" domain={[0, 'auto']} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#8b5cf6" 
                    fill="url(#colorGradient)" 
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
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
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>추이 데이터가 없습니다</p>
                  <p className="text-sm">API에서 데이터를 불러오는 중...</p>
                </div>
              </div>
            )}
          </div>

          {/* 우선순위별 분포 파이 차트 - API 연동 완료 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">우선순위별 분포</h3>
            <ResponsiveContainer width="100%" height={250}>
              <RePieChart>
                <Pie
                  data={priorityChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.label}: ${entry.count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="label"
                >
                  {priorityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [value, props.payload.label]}
                />
              </RePieChart>
            </ResponsiveContainer>
            {!distribution?.priorityDistribution && (
              <p className="text-xs text-gray-400 text-center mt-2">
                로컬 데이터 사용 중 - API 연동 대기
              </p>
            )}
          </div>
        </div>

        {/* 카테고리별 진행 상황과 AI 인사이트 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* 카테고리별 진행 상황 - API 연동 완료 */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">카테고리별 진행 상황</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryChartData} barSize={categoryChartData.length === 1 ? 250 : undefined}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" domain={[0, 'auto']} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="completed" stackId="a" fill="#8b5cf6" name="완료" />
                <Bar dataKey="inProgress" stackId="a" fill="#06b6d4" name="진행중" />
                <Bar dataKey="pending" stackId="a" fill="#ec4899" name="대기" />
              </BarChart>
            </ResponsiveContainer>
            <div className={`grid gap-4 mt-4 ${
              categoryChartData.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
              categoryChartData.length === 2 ? 'grid-cols-2' :
              'grid-cols-3'
            }`}>
              {categoryChartData.map((category) => (
                <div key={category.name} className="text-center">
                  <p className="text-gray-400 text-sm">{category.name}</p>
                  <p className="text-2xl font-bold text-white">{category.completionRate}%</p>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${category.completionRate}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    총 {category.total}개
                  </p>
                </div>
              ))}
            </div>
            {!distribution?.categoryDistribution && (
              <p className="text-xs text-gray-400 text-center mt-4">
                로컬 데이터 사용 중 - API 연동 대기
              </p>
            )}
          </div>

          {/* AI 인사이트 카드 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">AI 인사이트</h3>
            <div className="space-y-4">
              {insightsData.slice(0, 4).map((insight, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${
                    insight.level === 'positive' ? 'bg-green-500/10 border-green-500/20' :
                    insight.level === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' :
                    'bg-red-500/10 border-red-500/20'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {insight.icon === 'award' && <Award className="w-4 h-4 text-green-400" />}
                    {insight.icon === 'alert-triangle' && <AlertTriangle className="w-4 h-4 text-yellow-400" />}
                    {insight.icon === 'target' && <Target className="w-4 h-4 text-purple-400" />}
                    {insight.icon === 'trending-up' && <TrendingUp className="w-4 h-4 text-blue-400" />}
                    <p className={`text-sm font-medium ${
                      insight.level === 'positive' ? 'text-green-400' :
                      insight.level === 'warning' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {insight.title}
                    </p>
                  </div>
                  <p className="text-white text-sm">{insight.message}</p>
                  {insight.suggestion && (
                    <p className="text-gray-400 text-xs mt-1">💡 {insight.suggestion}</p>
                  )}
                </div>
              ))}
            </div>
            
            {/* API 상태 표시 */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-xs text-gray-400">
                {summary ? (
                  <span className="text-green-400">서버 데이터 연동됨</span>
                ) : (
                  <span className="text-blue-400">로컬 데이터 사용 중</span>
                )}
                {distribution?.priorityDistribution && distribution?.categoryDistribution && (
                  <span className="text-green-400 ml-2">• 분포 API 연동됨</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;