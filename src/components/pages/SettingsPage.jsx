import React, { useState, useEffect } from 'react';
import { 
  Settings,
  User,
  Bell,
  Palette,
  Shield,
  Database,
  Globe,
  CheckCircle,
  Calendar,
  TrendingUp,
  Activity,
  LogOut,
  Save,
  Download,
  Upload,
  Moon,
  Sun,
  Smartphone,
  Mail,
  Lock,
  Key,
  Trash2,
  AlertCircle,
  Check,
  X,
  ChevronRight,
  Eye,
  EyeOff,
  Clock,
  Language,
  Volume2,
  VolumeX,
  Zap,
  HelpCircle,
  ExternalLink,
  Github,
  MessageSquare
} from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';
import { authService } from '../../services/authService';

const SettingsPage = ({ onPageChange, currentPage = 'settings', onLogout }) => {
  const {
    // Context 상태
    user,
    todos,
    loading,
    // 유틸리티 함수들
    getStats
  } = useAppContext();

  // 로컬 상태들
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [deleteAccountModal, setDeleteAccountModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 설정 상태들 (로컬스토리지에서 로드)
  const [settings, setSettings] = useState({
    // 프로필 설정
    profile: {
      username: user.username || 'admin',
      email: 'admin@example.com',
      fullName: '관리자',
      phone: '010-1234-5678',
      avatar: '',
      bio: '열심히 일하는 개발자입니다.'
    },
    // 알림 설정
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      desktopNotifications: false,
      soundEnabled: true,
      notifyDeadline: true,
      notifyDeadlineHours: 24,
      notifyOverdue: true,
      notifyCompletion: false,
      dailyDigest: true,
      dailyDigestTime: '09:00',
      weeklyReport: true
    },
    // 테마 설정
    theme: {
      darkMode: true,
      colorScheme: 'purple', // purple, blue, green, red, orange
      fontSize: 'medium', // small, medium, large
      compactMode: false,
      animations: true,
      showAvatars: true,
      sidebarCollapsed: false
    },
    // 일반 설정
    general: {
      language: 'ko', // ko, en, ja, zh
      timezone: 'Asia/Seoul',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h',
      weekStart: 'monday',
      defaultPriority: 'medium',
      defaultCategory: '업무',
      autoArchive: true,
      autoArchiveDays: 30,
      confirmDelete: true
    },
    // 보안 설정
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30, // minutes
      requirePasswordChange: false,
      passwordChangeInterval: 90, // days
      loginHistory: [
        { date: '2025-09-06 14:30', ip: '192.168.1.1', device: 'Chrome - Windows' },
        { date: '2025-09-05 09:15', ip: '192.168.1.1', device: 'Chrome - Windows' },
        { date: '2025-09-04 18:22', ip: '192.168.1.100', device: 'Safari - iPhone' }
      ]
    },
    // 데이터 설정
    data: {
      autoBackup: true,
      backupFrequency: 'daily', // daily, weekly, monthly
      lastBackup: '2025-09-05 23:00',
      storageUsed: 45, // percentage
      maxStorage: 100, // MB
      exportFormat: 'json' // json, csv, xml
    }
  });

  // 비밀번호 변경 폼
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 메뉴 아이템들
  const menuItems = [
    { id: 'dashboard', name: '대시보드', icon: Activity },
    { id: 'todos', name: '할 일 관리', icon: CheckCircle },
    { id: 'calendar', name: '캘린더', icon: Calendar },
    { id: 'analytics', name: '통계', icon: TrendingUp },
    { id: 'settings', name: '설정', icon: Settings }
  ];

  // 설정 탭들
  const settingsTabs = [
    { id: 'profile', name: '프로필', icon: User },
    { id: 'notifications', name: '알림', icon: Bell },
    { id: 'theme', name: '테마', icon: Palette },
    { id: 'general', name: '일반', icon: Settings },
    { id: 'security', name: '보안', icon: Shield },
    { id: 'data', name: '데이터', icon: Database },
    { id: 'about', name: '정보', icon: HelpCircle }
  ];

  // 컴포넌트 마운트 시 로컬스토리지에서 설정 로드
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('설정 로드 실패:', error);
      }
    }
  }, []);

  // 설정 저장
  const saveSettings = () => {
    try {
      localStorage.setItem('userSettings', JSON.stringify(settings));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('설정 저장 실패:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // 설정 변경 핸들러
  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  // 비밀번호 변경 핸들러
  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    // TODO: API 호출
    console.log('비밀번호 변경:', passwordForm);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setSaveStatus('success');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  // 데이터 내보내기
  const handleExportData = () => {
    const exportData = {
      todos,
      settings,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 데이터 가져오기
  const handleImportData = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target.result);
          console.log('데이터 가져오기:', importedData);
          // TODO: 실제 데이터 적용 로직
          setSaveStatus('success');
          setTimeout(() => setSaveStatus(''), 3000);
        } catch (error) {
          console.error('데이터 가져오기 실패:', error);
          setSaveStatus('error');
          setTimeout(() => setSaveStatus(''), 3000);
        }
      };
      reader.readAsText(file);
    }
  };

  // 계정 삭제
  const handleDeleteAccount = () => {
    if (window.confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      // TODO: API 호출
      console.log('계정 삭제');
      setDeleteAccountModal(false);
    }
  };

  // 로그아웃
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

  // 메뉴 클릭
  const handleMenuClick = (menuId) => {
    if (onPageChange) {
      onPageChange(menuId);
    }
  };

  // 통계 가져오기
  const stats = getStats();

  // 저장 상태 메시지
  const renderSaveStatus = () => {
    if (saveStatus === 'success') {
      return (
        <div className="fixed bottom-8 right-8 bg-green-500/20 backdrop-blur-sm border border-green-500/30 text-green-400 px-4 py-3 rounded-lg flex items-center animate-slide-up">
          <Check className="w-5 h-5 mr-2" />
          설정이 저장되었습니다
        </div>
      );
    }
    if (saveStatus === 'error') {
      return (
        <div className="fixed bottom-8 right-8 bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-center animate-slide-up">
          <X className="w-5 h-5 mr-2" />
          저장 중 오류가 발생했습니다
        </div>
      );
    }
    return null;
  };

  // 탭별 콘텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">프로필 설정</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">사용자명</label>
                <input
                  type="text"
                  value={settings.profile.username}
                  onChange={(e) => handleSettingChange('profile', 'username', e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">이메일</label>
                <input
                  type="email"
                  value={settings.profile.email}
                  onChange={(e) => handleSettingChange('profile', 'email', e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">이름</label>
                <input
                  type="text"
                  value={settings.profile.fullName}
                  onChange={(e) => handleSettingChange('profile', 'fullName', e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">전화번호</label>
                <input
                  type="tel"
                  value={settings.profile.phone}
                  onChange={(e) => handleSettingChange('profile', 'phone', e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">자기소개</label>
              <textarea
                value={settings.profile.bio}
                onChange={(e) => handleSettingChange('profile', 'bio', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows="3"
              />
            </div>

            {/* 프로필 통계 */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-sm font-medium text-gray-300 mb-3">계정 통계</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-xs text-gray-400">전체 할일</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
                  <p className="text-xs text-gray-400">완료됨</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-400">{stats.completionRate}%</p>
                  <p className="text-xs text-gray-400">완료율</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">알림 설정</h3>
            
            {/* 알림 채널 */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-sm font-medium text-gray-300 mb-3">알림 채널</h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-white">이메일 알림</p>
                      <p className="text-xs text-gray-400">중요한 업데이트를 이메일로 받기</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.emailNotifications}
                    onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                    className="w-5 h-5 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                </label>
                
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center">
                    <Smartphone className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-white">푸시 알림</p>
                      <p className="text-xs text-gray-400">모바일 앱으로 알림 받기</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.pushNotifications}
                    onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                    className="w-5 h-5 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                </label>
                
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center">
                    <Bell className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-white">데스크톱 알림</p>
                      <p className="text-xs text-gray-400">브라우저 알림 표시</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.desktopNotifications}
                    onChange={(e) => handleSettingChange('notifications', 'desktopNotifications', e.target.checked)}
                    className="w-5 h-5 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                </label>
                
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center">
                    {settings.notifications.soundEnabled ? 
                      <Volume2 className="w-5 h-5 text-gray-400 mr-3" /> : 
                      <VolumeX className="w-5 h-5 text-gray-400 mr-3" />
                    }
                    <div>
                      <p className="text-white">알림음</p>
                      <p className="text-xs text-gray-400">알림 시 소리 재생</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.soundEnabled}
                    onChange={(e) => handleSettingChange('notifications', 'soundEnabled', e.target.checked)}
                    className="w-5 h-5 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                </label>
              </div>
            </div>

            {/* 알림 유형 */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-sm font-medium text-gray-300 mb-3">알림 유형</h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-white">마감일 알림</p>
                      <p className="text-xs text-gray-400">마감일이 다가오면 알림</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.notifyDeadline}
                    onChange={(e) => handleSettingChange('notifications', 'notifyDeadline', e.target.checked)}
                    className="w-5 h-5 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                </label>
                
                {settings.notifications.notifyDeadline && (
                  <div className="ml-8">
                    <label className="block text-sm text-gray-400 mb-1">알림 시간</label>
                    <select
                      value={settings.notifications.notifyDeadlineHours}
                      onChange={(e) => handleSettingChange('notifications', 'notifyDeadlineHours', parseInt(e.target.value))}
                      className="w-full px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                    >
                      <option value="6">6시간 전</option>
                      <option value="12">12시간 전</option>
                      <option value="24">24시간 전</option>
                      <option value="48">48시간 전</option>
                    </select>
                  </div>
                )}
                
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-white">지연 작업 알림</p>
                      <p className="text-xs text-gray-400">마감일이 지난 작업 알림</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.notifyOverdue}
                    onChange={(e) => handleSettingChange('notifications', 'notifyOverdue', e.target.checked)}
                    className="w-5 h-5 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                </label>
                
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-white">작업 완료 알림</p>
                      <p className="text-xs text-gray-400">작업 완료 시 축하 메시지</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.notifyCompletion}
                    onChange={(e) => handleSettingChange('notifications', 'notifyCompletion', e.target.checked)}
                    className="w-5 h-5 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                </label>
              </div>
            </div>

            {/* 정기 알림 */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-sm font-medium text-gray-300 mb-3">정기 알림</h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center">
                    <Sun className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-white">일일 요약</p>
                      <p className="text-xs text-gray-400">매일 오늘의 할 일 요약 받기</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.dailyDigest}
                    onChange={(e) => handleSettingChange('notifications', 'dailyDigest', e.target.checked)}
                    className="w-5 h-5 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                </label>
                
                {settings.notifications.dailyDigest && (
                  <div className="ml-8">
                    <label className="block text-sm text-gray-400 mb-1">알림 시간</label>
                    <input
                      type="time"
                      value={settings.notifications.dailyDigestTime}
                      onChange={(e) => handleSettingChange('notifications', 'dailyDigestTime', e.target.value)}
                      className="w-full px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                    />
                  </div>
                )}
                
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-white">주간 리포트</p>
                      <p className="text-xs text-gray-400">매주 생산성 리포트 받기</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.weeklyReport}
                    onChange={(e) => handleSettingChange('notifications', 'weeklyReport', e.target.checked)}
                    className="w-5 h-5 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                </label>
              </div>
            </div>
          </div>
        );

      case 'theme':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">테마 설정</h3>
            
            {/* 다크모드 */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center">
                  {settings.theme.darkMode ? 
                    <Moon className="w-5 h-5 text-gray-400 mr-3" /> : 
                    <Sun className="w-5 h-5 text-gray-400 mr-3" />
                  }
                  <div>
                    <p className="text-white">다크 모드</p>
                    <p className="text-xs text-gray-400">어두운 테마 사용</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.theme.darkMode}
                  onChange={(e) => handleSettingChange('theme', 'darkMode', e.target.checked)}
                  className="w-5 h-5 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                />
              </label>
            </div>

            {/* 색상 테마 */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-sm font-medium text-gray-300 mb-3">색상 테마</h4>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { value: 'purple', color: 'bg-purple-500', label: '보라' },
                  { value: 'blue', color: 'bg-blue-500', label: '파랑' },
                  { value: 'green', color: 'bg-green-500', label: '초록' },
                  { value: 'red', color: 'bg-red-500', label: '빨강' },
                  { value: 'orange', color: 'bg-orange-500', label: '주황' }
                ].map(theme => (
                  <button
                    key={theme.value}
                    onClick={() => handleSettingChange('theme', 'colorScheme', theme.value)}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      settings.theme.colorScheme === theme.value 
                        ? 'border-white' 
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <div className={`w-full h-12 ${theme.color} rounded`}></div>
                    <p className="text-xs text-gray-300 mt-2">{theme.label}</p>
                    {settings.theme.colorScheme === theme.value && (
                      <Check className="absolute top-2 right-2 w-4 h-4 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 글꼴 크기 */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-sm font-medium text-gray-300 mb-3">글꼴 크기</h4>
              <select
                value={settings.theme.fontSize}
                onChange={(e) => handleSettingChange('theme', 'fontSize', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              >
                <option value="small">작게</option>
                <option value="medium">보통</option>
                <option value="large">크게</option>
              </select>
            </div>

            {/* 추가 옵션 */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-sm font-medium text-gray-300 mb-3">표시 옵션</h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-white">컴팩트 모드</p>
                    <p className="text-xs text-gray-400">더 많은 정보를 한 화면에 표시</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.theme.compactMode}
                    onChange={(e) => handleSettingChange('theme', 'compactMode', e.target.checked)}
                    className="w-5 h-5 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                </label>
                
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-white">애니메이션 효과</p>
                    <p className="text-xs text-gray-400">부드러운 전환 효과 사용</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.theme.animations}
                    onChange={(e) => handleSettingChange('theme', 'animations', e.target.checked)}
                    className="w-5 h-5 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                </label>
                
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-white">아바타 표시</p>
                    <p className="text-xs text-gray-400">프로필 이미지 표시</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.theme.showAvatars}
                    onChange={(e) => handleSettingChange('theme', 'showAvatars', e.target.checked)}
                    className="w-5 h-5 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                </label>
              </div>
            </div>
          </div>
        );

      case 'general':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">일반 설정</h3>
            
            {/* 언어 및 지역 */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-sm font-medium text-gray-300 mb-3">언어 및 지역</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">언어</label>
                  <select
                    value={settings.general.language}
                    onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="ko">한국어</option>
                    <option value="en">English</option>
                    <option value="ja">日本語</option>
                    <option value="zh">中文</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">시간대</label>
                  <select
                    value={settings.general.timezone}
                    onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="Asia/Seoul">서울 (GMT+9)</option>
                    <option value="Asia/Tokyo">도쿄 (GMT+9)</option>
                    <option value="America/New_York">뉴욕 (GMT-5)</option>
                    <option value="Europe/London">런던 (GMT+0)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 날짜 및 시간 형식 */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-sm font-medium text-gray-300 mb-3">날짜 및 시간</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">날짜 형식</label>
                  <select
                    value={settings.general.dateFormat}
                    onChange={(e) => handleSettingChange('general', 'dateFormat', e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="YYYY-MM-DD">2025-09-06</option>
                    <option value="DD/MM/YYYY">06/09/2025</option>
                    <option value="MM/DD/YYYY">09/06/2025</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">시간 형식</label>
                  <select
                    value={settings.general.timeFormat}
                    onChange={(e) => handleSettingChange('general', 'timeFormat', e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="24h">24시간 (14:30)</option>
                    <option value="12h">12시간 (2:30 PM)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">주 시작일</label>
                  <select
                    value={settings.general.weekStart}
                    onChange={(e) => handleSettingChange('general', 'weekStart', e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="sunday">일요일</option>
                    <option value="monday">월요일</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 기본값 설정 */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-sm font-medium text-gray-300 mb-3">할일 기본값</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">기본 우선순위</label>
                  <select
                    value={settings.general.defaultPriority}
                    onChange={(e) => handleSettingChange('general', 'defaultPriority', e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="critical">매우긴급</option>
                    <option value="high">높음</option>
                    <option value="medium">보통</option>
                    <option value="low">낮음</option>
                    <option value="minimal">최소</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">기본 카테고리</label>
                  <select
                    value={settings.general.defaultCategory}
                    onChange={(e) => handleSettingChange('general', 'defaultCategory', e.target.value)}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="업무">업무</option>
                    <option value="개발">개발</option>
                    <option value="개인">개인</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 자동화 설정 */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-sm font-medium text-gray-300 mb-3">자동화</h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-white">자동 아카이브</p>
                    <p className="text-xs text-gray-400">완료된 작업 자동 보관</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.general.autoArchive}
                    onChange={(e) => handleSettingChange('general', 'autoArchive', e.target.checked)}
                    className="w-5 h-5 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                </label>
                
                {settings.general.autoArchive && (
                  <div className="ml-8">
                    <label className="block text-sm text-gray-400 mb-1">보관 기간</label>
                    <select
                      value={settings.general.autoArchiveDays}
                      onChange={(e) => handleSettingChange('general', 'autoArchiveDays', parseInt(e.target.value))}
                      className="w-full px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                    >
                      <option value="7">7일 후</option>
                      <option value="14">14일 후</option>
                      <option value="30">30일 후</option>
                      <option value="60">60일 후</option>
                    </select>
                  </div>
                )}
                
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-white">삭제 확인</p>
                    <p className="text-xs text-gray-400">항목 삭제 시 확인 메시지 표시</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.general.confirmDelete}
                    onChange={(e) => handleSettingChange('general', 'confirmDelete', e.target.checked)}
                    className="w-5 h-5 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                </label>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">보안 설정</h3>
            
            {/* 비밀번호 변경 */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-sm font-medium text-gray-300 mb-3">비밀번호 변경</h4>
              <form onSubmit={handlePasswordChange} className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">현재 비밀번호</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-4 py-2 pr-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">새 비밀번호</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-4 py-2 pr-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">새 비밀번호 확인</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="••••••••"
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                >
                  비밀번호 변경
                </button>
              </form>
            </div>

            {/* 보안 옵션 */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-sm font-medium text-gray-300 mb-3">보안 옵션</h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-white">2단계 인증</p>
                      <p className="text-xs text-gray-400">추가 보안 레이어 활성화</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.security.twoFactorAuth}
                    onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                    className="w-5 h-5 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                </label>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">세션 타임아웃</label>
                  <select
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="15">15분</option>
                    <option value="30">30분</option>
                    <option value="60">1시간</option>
                    <option value="120">2시간</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 로그인 기록 */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-sm font-medium text-gray-300 mb-3">최근 로그인 기록</h4>
              <div className="space-y-2">
                {settings.security.loginHistory.map((login, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-white/5 rounded">
                    <div>
                      <p className="text-white text-sm">{login.device}</p>
                      <p className="text-gray-400 text-xs">{login.ip}</p>
                    </div>
                    <p className="text-gray-400 text-xs">{login.date}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 계정 삭제 */}
            <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
              <h4 className="text-sm font-medium text-red-400 mb-3">위험 구역</h4>
              <p className="text-gray-300 text-sm mb-3">
                계정 삭제는 되돌릴 수 없습니다. 모든 데이터가 영구적으로 삭제됩니다.
              </p>
              <button
                onClick={() => setDeleteAccountModal(true)}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                계정 삭제
              </button>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">데이터 관리</h3>
            
            {/* 저장 공간 */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-sm font-medium text-gray-300 mb-3">저장 공간</h4>
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">사용 중</span>
                  <span className="text-white">{settings.data.storageUsed}MB / {settings.data.maxStorage}MB</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(settings.data.storageUsed / settings.data.maxStorage) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <p className="text-gray-400">할일</p>
                  <p className="text-white font-medium">25MB</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">첨부파일</p>
                  <p className="text-white font-medium">15MB</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400">기타</p>
                  <p className="text-white font-medium">5MB</p>
                </div>
              </div>
            </div>

            {/* 백업 설정 */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-sm font-medium text-gray-300 mb-3">백업 설정</h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-white">자동 백업</p>
                    <p className="text-xs text-gray-400">정기적으로 데이터 백업</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.data.autoBackup}
                    onChange={(e) => handleSettingChange('data', 'autoBackup', e.target.checked)}
                    className="w-5 h-5 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                  />
                </label>
                
                {settings.data.autoBackup && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">백업 주기</label>
                    <select
                      value={settings.data.backupFrequency}
                      onChange={(e) => handleSettingChange('data', 'backupFrequency', e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    >
                      <option value="daily">매일</option>
                      <option value="weekly">매주</option>
                      <option value="monthly">매월</option>
                    </select>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">마지막 백업</p>
                    <p className="text-white">{settings.data.lastBackup}</p>
                  </div>
                  <button
                    className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                  >
                    지금 백업
                  </button>
                </div>
              </div>
            </div>

            {/* 내보내기/가져오기 */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-sm font-medium text-gray-300 mb-3">데이터 내보내기/가져오기</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400 mb-2">데이터 내보내기</p>
                  <div className="flex items-center space-x-2">
                    <select
                      value={settings.data.exportFormat}
                      onChange={(e) => handleSettingChange('data', 'exportFormat', e.target.value)}
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    >
                      <option value="json">JSON</option>
                      <option value="csv">CSV</option>
                      <option value="xml">XML</option>
                    </select>
                    <button
                      onClick={handleExportData}
                      className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      내보내기
                    </button>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-400 mb-2">데이터 가져오기</p>
                  <label className="flex items-center justify-center px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    파일 선택
                    <input
                      type="file"
                      accept=".json,.csv,.xml"
                      onChange={handleImportData}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* 데이터 삭제 */}
            <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
              <h4 className="text-sm font-medium text-yellow-400 mb-3">데이터 초기화</h4>
              <p className="text-gray-300 text-sm mb-3">
                모든 할일 데이터를 삭제합니다. 이 작업은 되돌릴 수 없습니다.
              </p>
              <button
                className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
              >
                데이터 초기화
              </button>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white mb-4">정보</h3>
            
            {/* 앱 정보 */}
            <div className="bg-white/5 rounded-lg p-6 border border-white/10 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">ToDo App</h2>
              <p className="text-gray-400 mb-4">버전 1.0.0</p>
              <p className="text-sm text-gray-300 mb-6">
                생산성을 높이는 스마트한 할일 관리 앱
              </p>
              
              <div className="grid grid-cols-3 gap-4 text-center mb-6">
                <div>
                  <p className="text-2xl font-bold text-purple-400">{stats.total}</p>
                  <p className="text-xs text-gray-400">전체 할일</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
                  <p className="text-xs text-gray-400">완료됨</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-400">100+</p>
                  <p className="text-xs text-gray-400">사용자</p>
                </div>
              </div>
            </div>

            {/* 업데이트 */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-sm font-medium text-gray-300 mb-3">최근 업데이트</h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-1.5"></div>
                  <div>
                    <p className="text-white text-sm">v1.0.0 - 2025.09.06</p>
                    <p className="text-gray-400 text-xs">• 통계 페이지 추가</p>
                    <p className="text-gray-400 text-xs">• 메모 기능 추가</p>
                    <p className="text-gray-400 text-xs">• UI/UX 개선</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mt-1.5"></div>
                  <div>
                    <p className="text-white text-sm">v0.9.0 - 2025.08.30</p>
                    <p className="text-gray-400 text-xs">• 캘린더 뷰 추가</p>
                    <p className="text-gray-400 text-xs">• 필터링 기능 강화</p>
                  </div>
                </div>
              </div>
              <button className="w-full mt-4 py-2 px-4 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors">
                업데이트 확인
              </button>
            </div>

            {/* 지원 */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-sm font-medium text-gray-300 mb-3">지원</h4>
              <div className="space-y-2">
                <a href="#" className="flex items-center justify-between p-2 hover:bg-white/5 rounded transition-colors">
                  <div className="flex items-center">
                    <HelpCircle className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-white">도움말 센터</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </a>
                <a href="#" className="flex items-center justify-between p-2 hover:bg-white/5 rounded transition-colors">
                  <div className="flex items-center">
                    <MessageSquare className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-white">피드백 보내기</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </a>
                <a href="#" className="flex items-center justify-between p-2 hover:bg-white/5 rounded transition-colors">
                  <div className="flex items-center">
                    <Github className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-white">GitHub</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </a>
              </div>
            </div>

            {/* 법적 고지 */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <h4 className="text-sm font-medium text-gray-300 mb-3">법적 고지</h4>
              <div className="space-y-2">
                <a href="#" className="block text-purple-400 hover:text-purple-300 text-sm">이용약관</a>
                <a href="#" className="block text-purple-400 hover:text-purple-300 text-sm">개인정보처리방침</a>
                <a href="#" className="block text-purple-400 hover:text-purple-300 text-sm">라이선스</a>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                © 2025 ToDo App. All rights reserved.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
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
                  <Settings className="w-8 h-8 mr-3" />
                  설정
                  {loading && (
                    <div className="ml-3 w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  )}
                </h2>
                <p className="text-gray-300">앱 설정을 관리하고 개인화하세요</p>
              </div>
              
              <button
                onClick={saveSettings}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                저장
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 사이드바 */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4">
              <div className="space-y-1">
                {settingsTabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all ${
                        activeTab === tab.id 
                          ? 'bg-white/20 text-white' 
                          : 'text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.name}</span>
                      {activeTab === tab.id && (
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 콘텐츠 영역 */}
          <div className="lg:col-span-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>

      {/* 저장 상태 알림 */}
      {renderSaveStatus()}

      {/* 계정 삭제 확인 모달 */}
      {deleteAccountModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white">계정 삭제</h3>
              </div>
              
              <p className="text-gray-300 mb-6">
                정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든 데이터가 영구적으로 삭제됩니다.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteAccountModal(false)}
                  className="flex-1 py-2 px-4 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 py-2 px-4 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  계정 삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SettingsPage;