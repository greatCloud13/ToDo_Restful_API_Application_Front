import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  CheckCircle, 
  Calendar, 
  TrendingUp, 
  LogOut,
  Bell,
  Settings,
  Activity,
  X,
  Clock,
  AlertCircle,
  ChevronRight,
  Menu
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

const Navigation = ({ 
  currentPage, 
  onPageChange, 
  onLogout,
  onTodoClick
}) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const notificationRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // AppContext에서 데이터 가져오기
  const { todos, user } = useAppContext();

  // 알림용 데이터 계산
  const notificationData = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // 오늘 마감 (완료되지 않은 것만)
    const todayTodos = todos.filter(todo => 
      todo.dueDate === today && todo.status !== 'completed'
    );
    
    // 지연된 할일 (마감일이 지났는데 미완료)
    const overdueTodos = todos.filter(todo => 
      new Date(todo.dueDate) < new Date() && 
      todo.status !== 'completed' &&
      todo.dueDate !== today
    );
    
    // 긴급 할일 (critical, high 우선순위 + 미완료)
    const urgentTodos = todos.filter(todo => 
      (todo.priority === 'critical' || todo.priority === 'high') && 
      todo.status !== 'completed'
    );
    
    return {
      todayTodos,
      overdueTodos,
      urgentTodos
    };
  }, [todos]);

  // 메뉴 아이템들
  const menuItems = [
    { id: 'dashboard', name: '대시보드', icon: Activity },
    { id: 'todos', name: '할 일 관리', icon: CheckCircle },
    { id: 'calendar', name: '캘린더', icon: Calendar },
    { id: 'analytics', name: '통계', icon: TrendingUp },
    { id: 'qna', name: '고객지원', icon: Settings }
  ];

  // 알림 총 개수
  const { todayTodos, overdueTodos, urgentTodos } = notificationData;
  const totalNotifications = todayTodos.length + overdueTodos.length + urgentTodos.length;

  const handleMenuClick = (menuId) => {
    setIsMobileMenuOpen(false);
    if (onPageChange) {
      onPageChange(menuId);
    }
  };

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
    }
  };

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isNotificationOpen || isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationOpen, isMobileMenuOpen]);

  return (
    <nav className="bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 & 데스크톱 메뉴 */}
          <div className="flex items-center space-x-4 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white">ToDo App</h1>
            </div>

            {/* 데스크톱 메뉴 */}
            <div className="hidden lg:flex space-x-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item.id)}
                    className={`flex items-center px-3 xl:px-4 py-2 rounded-lg transition-all duration-200 text-sm ${
                      isActive 
                        ? 'bg-white/20 text-white shadow-lg' 
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    <span className="hidden xl:inline">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 우측 메뉴 */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* 알림 버튼 */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 text-gray-400 hover:text-white transition-colors"
              >
                <Bell className="w-5 h-5" />
                {totalNotifications > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse">
                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
                  </div>
                )}
              </button>

              {/* 알림 드롭다운 */}
              {isNotificationOpen && (
                <div 
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-gradient-to-b from-slate-900/95 to-purple-900/95 backdrop-blur-2xl border border-white/30 rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.5)] z-[9999] max-h-[85vh] flex flex-col"
                >
                  {/* 헤더 */}
                  <div className="flex items-center justify-between p-4 border-b border-white/20 bg-white/5 flex-shrink-0">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-5 h-5 text-purple-400" />
                      <h3 className="text-white font-bold">알림</h3>
                      {totalNotifications > 0 && (
                        <span className="px-2.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                          {totalNotifications}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => setIsNotificationOpen(false)}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 알림 내용 - 스크롤 가능 */}
                  <div className="overflow-y-auto flex-1">
                    {totalNotifications === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center">
                          <Bell className="w-8 h-8 text-purple-400 opacity-50" />
                        </div>
                        <p className="text-gray-300 font-medium mb-1">알림이 없습니다</p>
                        <p className="text-gray-500 text-sm">새로운 알림이 오면 여기에 표시됩니다</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/10">
                        {/* 오늘 마감 */}
                        {todayTodos.length > 0 && (
                          <div className="p-4 bg-gradient-to-r from-blue-500/5 to-transparent">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                  <Clock className="w-4 h-4 text-blue-400" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-blue-400">오늘 마감</h4>
                                  <p className="text-xs text-gray-400">{todayTodos.length}건의 할일</p>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {todayTodos.slice(0, 3).map(todo => (
                                <div 
                                  key={todo.id}
                                  className="group flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer border border-white/5 hover:border-blue-500/30"
                                  onClick={() => {
                                    setIsNotificationOpen(false);
                                    if (onTodoClick) {
                                      onTodoClick(todo);
                                    }
                                  }}
                                >
                                  <div className="flex-1 min-w-0 mr-3">
                                    <p className="text-sm text-white font-medium truncate group-hover:text-blue-300 transition-colors">{todo.title}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{todo.category}</p>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                                </div>
                              ))}
                              {todayTodos.length > 3 && (
                                <p className="text-xs text-center text-blue-400/60 pt-1 font-medium">
                                  외 {todayTodos.length - 3}건
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 지연됨 */}
                        {overdueTodos.length > 0 && (
                          <div className="p-4 bg-gradient-to-r from-red-500/5 to-transparent">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                                  <AlertCircle className="w-4 h-4 text-red-400" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-red-400">지연됨</h4>
                                  <p className="text-xs text-gray-400">{overdueTodos.length}건의 할일</p>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {overdueTodos.slice(0, 3).map(todo => {
                                const daysOverdue = Math.floor(
                                  (new Date() - new Date(todo.dueDate)) / (1000 * 60 * 60 * 24)
                                );
                                return (
                                  <div 
                                    key={todo.id}
                                    className="group flex items-center justify-between p-3 bg-red-900/20 hover:bg-red-900/40 rounded-xl transition-all cursor-pointer border border-red-500/20 hover:border-red-500/40"
                                    onClick={() => {
                                      setIsNotificationOpen(false);
                                      if (onTodoClick) {
                                        onTodoClick(todo);
                                      }
                                    }}
                                  >
                                    <div className="flex-1 min-w-0 mr-3">
                                      <p className="text-sm text-white font-medium truncate group-hover:text-red-300 transition-colors">{todo.title}</p>
                                      <p className="text-xs text-red-400 mt-0.5 font-medium">{daysOverdue}일 지남</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-red-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                                  </div>
                                );
                              })}
                              {overdueTodos.length > 3 && (
                                <p className="text-xs text-center text-red-400/60 pt-1 font-medium">
                                  외 {overdueTodos.length - 3}건
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 긴급 할일 */}
                        {urgentTodos.length > 0 && (
                          <div className="p-4 bg-gradient-to-r from-orange-500/5 to-transparent">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-red-500/30 to-orange-500/30 rounded-lg flex items-center justify-center">
                                  <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-full animate-pulse"></div>
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-orange-400">긴급</h4>
                                  <p className="text-xs text-gray-400">{urgentTodos.length}건의 할일</p>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {urgentTodos.slice(0, 3).map(todo => (
                                <div 
                                  key={todo.id}
                                  className="group flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800/80 rounded-xl transition-all cursor-pointer border border-white/5 hover:border-orange-500/30"
                                  onClick={() => {
                                    setIsNotificationOpen(false);
                                    if (onTodoClick) {
                                      onTodoClick(todo);
                                    }
                                  }}
                                >
                                  <div className="flex-1 min-w-0 mr-3">
                                    <p className="text-sm text-white font-medium truncate group-hover:text-orange-300 transition-colors">{todo.title}</p>
                                    <div className="flex items-center space-x-2 mt-0.5">
                                      <span className={`w-2 h-2 rounded-full ${
                                        todo.priority === 'critical' ? 'bg-red-500' : 'bg-orange-500'
                                      }`}></span>
                                      <p className="text-xs text-gray-400">{todo.category}</p>
                                    </div>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                                </div>
                              ))}
                              {urgentTodos.length > 3 && (
                                <p className="text-xs text-center text-orange-400/60 pt-1 font-medium">
                                  외 {urgentTodos.length - 3}건
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* 사용자 정보 - 태블릿 이상에서만 표시 */}
            <div className="hidden sm:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm text-white font-medium">{user?.username || 'User'}</p>
                <p className="text-xs text-gray-400">
                  {user?.authorities?.join(', ') || 'USER'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                title="로그아웃"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            {/* 모바일 햄버거 메뉴 버튼 */}
            <div className="lg:hidden relative" ref={mobileMenuRef}>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* 모바일 메뉴 드롭다운 */}
              {isMobileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-gradient-to-b from-slate-900/95 to-purple-900/95 backdrop-blur-2xl border border-white/30 rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.5)] z-[9999]">
                  {/* 사용자 정보 - 모바일용 */}
                  <div className="p-4 border-b border-white/20 sm:hidden">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">{user?.username?.[0]?.toUpperCase()}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">{user?.username || 'User'}</p>
                        <p className="text-xs text-gray-400">
                          {user?.authorities?.join(', ') || 'USER'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 메뉴 아이템들 */}
                  <div className="p-2">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentPage === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleMenuClick(item.id)}
                          className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 mb-1 ${
                            isActive 
                              ? 'bg-white/20 text-white shadow-lg' 
                              : 'text-gray-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Icon className="w-5 h-5 mr-3" />
                          {item.name}
                        </button>
                      );
                    })}
                  </div>

                  {/* 로그아웃 버튼 - 모바일용 */}
                  <div className="p-2 border-t border-white/20 sm:hidden">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      로그아웃
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;