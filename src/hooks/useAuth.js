// src/hooks/useAuth.js
import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // 인증 상태 초기화
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        const isAuthenticated = authService.isLoggedIn();
        
        if (isAuthenticated) {
          const currentUser = authService.getCurrentUser();
          setUser(currentUser);
          setIsLoggedIn(true);
          
          // 선택적: 토큰 유효성 서버 검증
          try {
            await authService.checkTokenStatus();
          } catch (error) {
            console.log('토큰 검증 실패, 로그아웃 처리');
            await performLogout();
          }
        } else {
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        console.error('인증 초기화 오류:', error);
        await performLogout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // 인증 상태 변경 이벤트 리스너
  useEffect(() => {
    const handleAuthStateChange = (event) => {
      const { isLoggedIn: newLoginStatus } = event.detail;
      
      if (newLoginStatus) {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        setIsLoggedIn(true);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
      
      setIsLoggingOut(false);
    };

    window.addEventListener('authStateChanged', handleAuthStateChange);
    
    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChange);
    };
  }, []);

  // 주기적 토큰 상태 확인
  useEffect(() => {
    if (!isLoggedIn) return;

    const interval = setInterval(() => {
      const isAuthenticated = authService.isLoggedIn();
      if (!isAuthenticated) {
        console.log('토큰 만료 감지');
        setIsLoggedIn(false);
        setUser(null);
      }
    }, 60000); // 1분마다 체크

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // 로그인 처리
  const login = useCallback(async (username, password) => {
    try {
      const result = await authService.login(username, password);
      
      authService.saveTokens(result);
      
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      setIsLoggedIn(true);
      
      return { success: true, data: result };
    } catch (error) {
      console.error('로그인 실패:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // 내부 로그아웃 수행 함수
  const performLogout = useCallback(async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsLoggedIn(false);
      return { success: true };
    } catch (error) {
      console.error('로그아웃 처리 오류:', error);
      // 오류가 발생해도 로컬 상태는 초기화
      setUser(null);
      setIsLoggedIn(false);
      return { success: false, error: error.message };
    }
  }, []);

  // 외부용 로그아웃 함수
  const logout = useCallback(async () => {
    if (isLoggingOut) return; // 중복 실행 방지

    setIsLoggingOut(true);
    
    try {
      const result = await performLogout();
      
      // 로그아웃 후 페이지 새로고침 (선택적)
      if (result.success) {
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
      
      return result;
    } finally {
      // isLoggingOut은 authStateChanged 이벤트에서 false로 설정됨
    }
  }, [isLoggingOut, performLogout]);

  // 토큰 갱신
  const refreshToken = useCallback(async () => {
    try {
      const result = await authService.refreshToken();
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      return { success: true, data: result };
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
      await performLogout();
      return { success: false, error: error.message };
    }
  }, [performLogout]);

  return {
    // 상태
    isLoggedIn,
    user,
    isLoading,
    isLoggingOut,
    
    // 함수
    login,
    logout,
    refreshToken,
    
    // 유틸리티
    isTokenExpired: authService.isTokenExpired.bind(authService)
  };
};