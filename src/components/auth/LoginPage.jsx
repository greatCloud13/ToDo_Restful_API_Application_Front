import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Lock, User, Mail, UserPlus, LogIn, CheckCircle, XCircle, AlertCircle, Key } from 'lucide-react';
import { authService } from '../../services/authService';

const LoginPage = ({ onLoginSuccess, onLogin }) => {
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 로그인 폼 데이터
  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  });

  // 회원가입 폼 데이터
  const [signupData, setSignupData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    inviteCode: ''
  });

  const [errors, setErrors] = useState({});
  const [validations, setValidations] = useState({
    username: null,
    email: null,
    password: null
  });

  // 실시간 검증 debounce용
  const debounceTimers = useRef({});

  // 비밀번호 정책 검증
  const validatePassword = (password) => {
    if (!password) return { valid: false, message: '비밀번호를 입력해주세요' };
    if (password.length < 8) return { valid: false, message: '비밀번호는 8자 이상이어야 합니다' };
    if (password.length > 100) return { valid: false, message: '비밀번호는 100자 이하여야 합니다' };
    
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&]/.test(password);
    
    if (!(hasLower && hasUpper && hasNumber && hasSpecial)) {
      return { valid: false, message: '영문 대소문자, 숫자, 특수문자(@$!%*?&)를 모두 포함해야 합니다' };
    }
    
    return { valid: true, message: '사용 가능한 비밀번호입니다' };
  };

  // 아이디 유효성 검증
  const validateUsername = (username) => {
    if (!username) return { valid: false, message: '아이디를 입력해주세요' };
    if (username.length < 3) return { valid: false, message: '아이디는 3자 이상이어야 합니다' };
    if (username.length > 20) return { valid: false, message: '아이디는 20자 이하여야 합니다' };
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return { valid: false, message: '아이디는 영문, 숫자, 언더스코어만 사용 가능합니다' };
    
    return { valid: true, message: '' };
  };

  // 이메일 유효성 검증
  const validateEmail = (email) => {
    if (!email) return { valid: false, message: '이메일을 입력해주세요' };
    if (email.length > 100) return { valid: false, message: '이메일은 100자 이하여야 합니다' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { valid: false, message: '올바른 이메일 형식이 아닙니다' };
    
    return { valid: true, message: '' };
  };

  // 실시간 아이디 중복 확인
  const checkUsernameDebounced = (username) => {
    clearTimeout(debounceTimers.current.username);
    
    debounceTimers.current.username = setTimeout(async () => {
      const validation = validateUsername(username);
      if (!validation.valid) {
        setValidations(prev => ({ ...prev, username: false }));
        setErrors(prev => ({ ...prev, username: validation.message }));
        return;
      }

      try {
        const result = await authService.checkUsername(username);
        if (result.success) {
          setValidations(prev => ({ ...prev, username: true }));
          setErrors(prev => ({ ...prev, username: '' }));
        }
      } catch (error) {
        setValidations(prev => ({ ...prev, username: false }));
        if (error.message.includes('409')) {
          setErrors(prev => ({ ...prev, username: '이미 사용중인 아이디입니다' }));
        } else {
          setErrors(prev => ({ ...prev, username: '아이디 확인 중 오류가 발생했습니다' }));
        }
      }
    }, 500);
  };

  // 실시간 이메일 중복 확인
  const checkEmailDebounced = (email) => {
    clearTimeout(debounceTimers.current.email);
    
    debounceTimers.current.email = setTimeout(async () => {
      const validation = validateEmail(email);
      if (!validation.valid) {
        setValidations(prev => ({ ...prev, email: false }));
        setErrors(prev => ({ ...prev, email: validation.message }));
        return;
      }

      try {
        const result = await authService.checkEmail(email);
        if (result.success) {
          setValidations(prev => ({ ...prev, email: true }));
          setErrors(prev => ({ ...prev, email: '' }));
        }
      } catch (error) {
        setValidations(prev => ({ ...prev, email: false }));
        if (error.message.includes('409')) {
          setErrors(prev => ({ ...prev, email: '이미 사용중인 이메일입니다' }));
        } else {
          setErrors(prev => ({ ...prev, email: '이메일 확인 중 오류가 발생했습니다' }));
        }
      }
    }, 500);
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
    // 에러 클리어
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupData(prev => ({
      ...prev,
      [name]: value
    }));

    // 에러 클리어
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // 실시간 검증
    if (name === 'username' && value.trim()) {
      setValidations(prev => ({ ...prev, username: null }));
      checkUsernameDebounced(value.trim());
    } else if (name === 'email' && value.trim()) {
      setValidations(prev => ({ ...prev, email: null }));
      checkEmailDebounced(value.trim());
    } else if (name === 'password') {
      const validation = validatePassword(value);
      setValidations(prev => ({ ...prev, password: validation.valid }));
      if (!validation.valid) {
        setErrors(prev => ({ ...prev, password: validation.message }));
      } else {
        setErrors(prev => ({ ...prev, password: '' }));
      }
      
      // 비밀번호 확인 재검증
      if (signupData.confirmPassword) {
        if (value !== signupData.confirmPassword) {
          setErrors(prev => ({ ...prev, confirmPassword: '비밀번호가 일치하지 않습니다' }));
        } else {
          setErrors(prev => ({ ...prev, confirmPassword: '' }));
        }
      }
    } else if (name === 'confirmPassword') {
      if (value !== signupData.password) {
        setErrors(prev => ({ ...prev, confirmPassword: '비밀번호가 일치하지 않습니다' }));
      } else {
        setErrors(prev => ({ ...prev, confirmPassword: '' }));
      }
    }
  };

  // 회원가입 폼 전체 유효성 검증
  const validateSignupForm = () => {
    const newErrors = {};

    if (!signupData.username.trim()) {
      newErrors.username = '아이디를 입력해주세요';
    } else if (validations.username !== true) {
      newErrors.username = '아이디 중복 확인이 필요합니다';
    }

    if (!signupData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (validations.email !== true) {
      newErrors.email = '이메일 중복 확인이 필요합니다';
    }

    if (!signupData.password) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else if (validations.password !== true) {
      newErrors.password = '비밀번호 정책을 확인해주세요';
    }

    if (!signupData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요';
    } else if (signupData.password !== signupData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }

    if (!signupData.inviteCode.trim()) {
      newErrors.inviteCode = '초대 코드를 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 로그인 처리 (수정됨)
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // 1순위: props로 전달된 onLogin 함수 사용 (useAuth에서 제공)
      if (onLogin && typeof onLogin === 'function') {
        console.log('useAuth login 함수 사용');
        const result = await onLogin(loginData.username, loginData.password);
        
        if (result.success) {
          // 로그인 성공 콜백 호출
          if (onLoginSuccess) {
            onLoginSuccess();
          }
        } else {
          // 로그인 실패 처리
          if (result.error) {
            if (result.error.includes('401')) {
              setErrors({ login: '아이디 또는 비밀번호가 잘못되었습니다' });
            } else if (result.error.includes('Failed to fetch')) {
              setErrors({ login: '서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요' });
            } else {
              setErrors({ login: result.error });
            }
          } else {
            setErrors({ login: '로그인 중 오류가 발생했습니다' });
          }
        }
      } else {
        // 2순위: 직접 authService 사용 (하위 호환성)
        console.log('authService 직접 사용');
        const result = await authService.login(loginData.username, loginData.password);
        
        // 토큰 저장
        authService.saveTokens(result);
        
        // 로그인 성공 처리
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }
      
    } catch (error) {
      console.error('로그인 실패:', error);
      
      if (error.message.includes('401')) {
        setErrors({ login: '아이디 또는 비밀번호가 잘못되었습니다' });
      } else if (error.message.includes('404')) {
        setErrors({ login: 'API 엔드포인트를 찾을 수 없습니다' });
      } else if (error.message.includes('Failed to fetch')) {
        setErrors({ login: '서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요' });
      } else {
        setErrors({ login: '로그인 중 오류가 발생했습니다' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 회원가입 처리
  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!validateSignupForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.signup(signupData);
      
      if (result.success) {
        alert('회원가입이 완료되었습니다! 로그인해주세요.');
        
        // 회원가입 성공 시 로그인 탭으로 전환
        setIsSignupMode(false);
        setSignupData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          inviteCode: ''
        });
        setValidations({ username: null, email: null, password: null });
      }

    } catch (error) {
      console.error('회원가입 실패:', error);
      
      if (error.message.includes('409')) {
        setErrors({ signup: '이미 존재하는 아이디 또는 이메일입니다' });
      } else if (error.message.includes('400')) {
        setErrors({ signup: '입력 정보를 다시 확인해주세요' });
      } else if (error.message.includes('Failed to fetch')) {
        setErrors({ signup: '서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인해주세요' });
      } else {
        setErrors({ signup: '회원가입 중 오류가 발생했습니다' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (signupMode) => {
    setIsSignupMode(signupMode);
    setErrors({});
    setValidations({ username: null, email: null, password: null });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // 입력 필드 상태 아이콘 렌더링
  const renderValidationIcon = (fieldName) => {
    const status = validations[fieldName];
    if (status === null) return null;
    
    return status ? (
      <CheckCircle className="w-4 h-4 text-green-400" />
    ) : (
      <XCircle className="w-4 h-4 text-red-400" />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* 배경 애니메이션 효과 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-l from-pink-600/20 to-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* 로그인/회원가입 컨테이너 */}
      <div className="relative w-full max-w-md">
        {/* 글래스모피즘 효과 */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl"></div>
        
        {/* 메인 컨텐츠 */}
        <div className="relative p-8 md:p-10">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-4">
              {isSignupMode ? <UserPlus className="w-8 h-8 text-white" /> : <Lock className="w-8 h-8 text-white" />}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isSignupMode ? '회원가입' : '로그인'}
            </h1>
            <p className="text-gray-300">
              {isSignupMode 
                ? '새 계정을 만들어 시작해보세요' 
                : '계정에 로그인하여 계속하세요'
              }
            </p>
          </div>

          {/* 탭 전환 버튼 */}
          <div className="flex mb-6 bg-white/5 rounded-xl p-1">
            <button
              onClick={() => switchMode(false)}
              className={`flex-1 py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center ${
                !isSignupMode 
                  ? 'bg-white/20 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <LogIn className="w-4 h-4 mr-2" />
              로그인
            </button>
            <button
              onClick={() => switchMode(true)}
              className={`flex-1 py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center ${
                isSignupMode 
                  ? 'bg-white/20 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              회원가입
            </button>
          </div>

          {/* 전체 에러 메시지 */}
          {(errors.login || errors.signup) && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{errors.login || errors.signup}</p>
            </div>
          )}

          {/* 로그인 폼 */}
          {!isSignupMode ? (
            <form onSubmit={handleLogin} className="space-y-6">
              {/* 아이디 입력 */}
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-medium text-gray-200">
                  아이디
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={loginData.username}
                    onChange={handleLoginChange}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="아이디를 입력하세요"
                  />
                </div>
              </div>

              {/* 비밀번호 입력 */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-200">
                  비밀번호
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginData.password}
                    onChange={handleLoginChange}
                    className="w-full pl-10 pr-12 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="비밀번호를 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* 로그인 버튼 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                    로그인 중...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <LogIn className="w-5 h-5 mr-2" />
                    로그인
                  </div>
                )}
              </button>

              {/* 추가 옵션 */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-gray-300">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-500 focus:ring-2"
                  />
                  <span className="ml-2">로그인 상태 유지</span>
                </label>
                <button
                  type="button"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  비밀번호 찾기
                </button>
              </div>
            </form>
          ) : (
            /* 회원가입 폼 */
            <form onSubmit={handleSignup} className="space-y-5">
              {/* 아이디 입력 */}
              <div className="space-y-2">
                <label htmlFor="signup-username" className="block text-sm font-medium text-gray-200">
                  아이디
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="signup-username"
                    name="username"
                    type="text"
                    required
                    value={signupData.username}
                    onChange={handleSignupChange}
                    className={`w-full pl-10 pr-10 py-3 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                      errors.username ? 'border-red-500/50' : 'border-white/20'
                    }`}
                    placeholder="아이디를 입력하세요 (3-20자)"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {renderValidationIcon('username')}
                  </div>
                </div>
                {errors.username && <p className="text-red-400 text-xs">{errors.username}</p>}
                <p className="text-gray-400 text-xs">영문, 숫자, 언더스코어만 사용 가능</p>
              </div>

              {/* 이메일 입력 */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-200">
                  이메일
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={signupData.email}
                    onChange={handleSignupChange}
                    className={`w-full pl-10 pr-10 py-3 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                      errors.email ? 'border-red-500/50' : 'border-white/20'
                    }`}
                    placeholder="이메일을 입력하세요"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {renderValidationIcon('email')}
                  </div>
                </div>
                {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
              </div>

              {/* 비밀번호 입력 */}
              <div className="space-y-2">
                <label htmlFor="signup-password" className="block text-sm font-medium text-gray-200">
                  비밀번호
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="signup-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={signupData.password}
                    onChange={handleSignupChange}
                    className={`w-full pl-10 pr-16 py-3 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                      errors.password ? 'border-red-500/50' : 'border-white/20'
                    }`}
                    placeholder="비밀번호를 입력하세요"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-1">
                    {renderValidationIcon('password')}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {errors.password && <p className="text-red-400 text-xs">{errors.password}</p>}
                <p className="text-gray-400 text-xs">8자 이상, 영문 대소문자, 숫자, 특수문자 포함</p>
              </div>

              {/* 비밀번호 확인 */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-200">
                  비밀번호 확인
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={signupData.confirmPassword}
                    onChange={handleSignupChange}
                    className={`w-full pl-10 pr-12 py-3 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                      errors.confirmPassword ? 'border-red-500/50' : 'border-white/20'
                    }`}
                    placeholder="비밀번호를 다시 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs">{errors.confirmPassword}</p>}
              </div>

              {/* 초대 코드 입력 */}
              <div className="space-y-2">
                <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-200">
                  초대 코드
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="inviteCode"
                    name="inviteCode"
                    type="text"
                    required
                    value={signupData.inviteCode}
                    onChange={handleSignupChange}
                    className={`w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${
                      errors.inviteCode ? 'border-red-500/50' : 'border-white/20'
                    }`}
                    placeholder="초대 코드를 입력하세요"
                  />
                </div>
                {errors.inviteCode && <p className="text-red-400 text-xs">{errors.inviteCode}</p>}
                <p className="text-gray-400 text-xs">비공개 서비스입니다. 관리자에게 문의하세요.</p>
              </div>

              {/* 회원가입 버튼 */}
              <button
                type="submit"
                disabled={isLoading || !(validations.username && validations.email && validations.password)}
                className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                    회원가입 중...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <UserPlus className="w-5 h-5 mr-2" />
                    회원가입
                  </div>
                )}
              </button>

              {/* 이용약관 동의 */}
              <div className="text-center">
                <p className="text-xs text-gray-400">
                  회원가입을 진행하시면{' '}
                  <button className="text-purple-400 hover:text-purple-300 transition-colors">
                    이용약관
                  </button>
                  {' '}및{' '}
                  <button className="text-purple-400 hover:text-purple-300 transition-colors">
                    개인정보처리방침
                  </button>
                  에 동의하는 것으로 간주됩니다.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;