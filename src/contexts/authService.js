// src/services/authService.js
import { API_ENDPOINTS } from '../config/api';
class AuthService {
  constructor() {
    this.baseURL = API_ENDPOINTS.AUTH;
    this.tokenKey = 'authTokens';
    
    // 앱 시작 시 토큰 초기화
    this.initializeTokens();
  }

  // localStorage에서 토큰 초기화 (단일 진입점)
  initializeTokens() {
    try {
      const savedTokens = localStorage.getItem(this.tokenKey);
      if (savedTokens) {
        const tokens = JSON.parse(savedTokens);
        
        // 토큰 구조 검증
        if (this.isValidTokenStructure(tokens)) {
          // 만료 시간 확인
          if (this.isTokenValid(tokens)) {
            window.authTokens = tokens;
            console.log('토큰 복원 성공');
          } else {
            console.log('만료된 토큰 삭제');
            this.clearAllTokens();
          }
        } else {
          console.log('잘못된 토큰 구조, 삭제');
          this.clearAllTokens();
        }
      } else {
        // 토큰이 없는 경우
        window.authTokens = null;
      }
    } catch (error) {
      console.error('토큰 초기화 실패:', error);
      this.clearAllTokens();
    }
  }

  // 토큰 구조 유효성 검사
  isValidTokenStructure(tokens) {
    return tokens && 
           typeof tokens === 'object' &&
           tokens.accessToken &&
           tokens.username &&
           Array.isArray(tokens.authorities);
  }

  // 토큰 유효성 검사 (만료시간 기준)
  isTokenValid(tokens) {
    if (!tokens || !tokens.expiresAt) {
      return false;
    }
    
    try {
      const expiresAt = new Date(tokens.expiresAt);
      const now = new Date();
      // 5분 여유시간을 두어 토큰 갱신
      const bufferTime = 5 * 60 * 1000; // 5분
      
      return expiresAt > new Date(now.getTime() + bufferTime);
    } catch (error) {
      console.error('토큰 만료시간 확인 실패:', error);
      return false;
    }
  }

  // 로그인
  async login(username, password) {
    try {
      const response = await fetch(`${this.baseURL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`HTTP ${response.status}: ${errorData?.message || response.statusText}`);
      }

      const data = await response.json();
      
      // 로그인 성공 시 토큰 저장
      this.saveTokens(data);
      
      return data;
    } catch (error) {
      console.error('로그인 오류:', error);
      throw error;
    }
  }

  // 회원가입
  async signup(signupData) {
    try {
      const response = await fetch(`${this.baseURL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          username: signupData.username,
          email: signupData.email,
          password: signupData.password,
          confirmPassword: signupData.confirmPassword,
          inviteCode: signupData.inviteCode
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`HTTP ${response.status}: ${errorData?.message || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('회원가입 오류:', error);
      throw error;
    }
  }

  // 로그아웃 (개선된 버전)
  async logout() {
    try {
      // 1. 서버에 로그아웃 요청 (선택적)
      const token = window.authTokens?.accessToken;
      if (token) {
        try {
          await fetch(`${this.baseURL}/logout`, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
        } catch (error) {
          // 서버 로그아웃 실패해도 로컬 정리는 진행
          console.warn('서버 로그아웃 실패:', error);
        }
      }

      // 2. 로컬 토큰 정리
      this.clearAllTokens();

      // 3. 인증 상태 변경 이벤트 발생
      this.emitAuthStateChange(false);

      return { success: true };
    } catch (error) {
      console.error('로그아웃 처리 중 오류:', error);
      // 오류가 발생해도 로컬 정리는 반드시 실행
      this.clearAllTokens();
      this.emitAuthStateChange(false);
      return { success: true };
    }
  }

  // 모든 토큰 정리 (통합 함수)
  clearAllTokens() {
    // window 객체에서 삭제
    window.authTokens = null;
    
    // localStorage에서 삭제
    try {
      localStorage.removeItem(this.tokenKey);
    } catch (error) {
      console.error('localStorage 토큰 삭제 실패:', error);
    }
    
    console.log('모든 토큰 정리 완료');
  }

  // 인증 상태 변경 이벤트 발생
  emitAuthStateChange(isLoggedIn) {
    try {
      window.dispatchEvent(new CustomEvent('authStateChanged', {
        detail: { isLoggedIn }
      }));
    } catch (error) {
      console.error('인증 상태 이벤트 발생 실패:', error);
    }
  }

  // 토큰 저장 (개선된 버전)
  saveTokens(tokenData) {
    try {
      // expiresIn이 없는 경우 기본값 설정 (1시간)
      const expiresIn = tokenData.expiresIn || 3600;
      
      const tokens = {
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken || null,
        tokenType: tokenData.tokenType || 'Bearer',
        username: tokenData.username,
        authorities: Array.isArray(tokenData.authorities) ? tokenData.authorities : [],
        expiresIn: expiresIn,
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
        savedAt: new Date().toISOString()
      };
      
      // 토큰 구조 검증
      if (!this.isValidTokenStructure(tokens)) {
        throw new Error('유효하지 않은 토큰 구조');
      }

      // window 객체에 저장
      window.authTokens = tokens;
      
      // localStorage에 저장
      localStorage.setItem(this.tokenKey, JSON.stringify(tokens));
      
      console.log('토큰 저장 성공');
      
      // 인증 상태 변경 이벤트 발생
      this.emitAuthStateChange(true);
    } catch (error) {
      console.error('토큰 저장 실패:', error);
      this.clearAllTokens();
      throw error;
    }
  }

  // 토큰 상태 확인 API
  async checkTokenStatus() {
    try {
      const token = window.authTokens?.accessToken;
      if (!token) {
        throw new Error('액세스 토큰이 없습니다');
      }

      const response = await fetch(`${this.baseURL}/status`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // 인증 실패 시 토큰 정리
          this.clearAllTokens();
        }
        const errorData = await response.json().catch(() => null);
        throw new Error(`HTTP ${response.status}: ${errorData?.message || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('토큰 상태 확인 실패:', error);
      throw error;
    }
  }

  // 아이디 중복 확인
  async checkUsername(username) {
    try {
      const response = await fetch(`${this.baseURL}/check-username?username=${encodeURIComponent(username)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`HTTP ${response.status}: ${errorData?.message || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('아이디 확인 오류:', error);
      throw error;
    }
  }

  // 이메일 중복 확인
  async checkEmail(email) {
    try {
      const response = await fetch(`${this.baseURL}/check-email?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`HTTP ${response.status}: ${errorData?.message || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('이메일 확인 오류:', error);
      throw error;
    }
  }

  // 현재 로그인 상태 확인 (통합 메서드)
  isLoggedIn() {
    try {
      const tokens = window.authTokens;
      
      if (!tokens || !this.isValidTokenStructure(tokens)) {
        return false;
      }
      
      if (!this.isTokenValid(tokens)) {
        console.log('토큰 만료로 인한 자동 로그아웃');
        this.clearAllTokens();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('로그인 상태 확인 실패:', error);
      this.clearAllTokens();
      return false;
    }
  }

  // 토큰 만료 확인 (외부용)
  isTokenExpired() {
    const tokens = window.authTokens;
    return !this.isTokenValid(tokens);
  }

  // 현재 사용자 정보
  getCurrentUser() {
    if (!this.isLoggedIn()) {
      return {
        username: null,
        authorities: []
      };
    }

    return {
      username: window.authTokens.username,
      authorities: window.authTokens.authorities
    };
  }

  // 토큰 갱신 (구현 준비)
  async refreshToken() {
    try {
      const refreshToken = window.authTokens?.refreshToken;
      if (!refreshToken) {
        throw new Error('리프레시 토큰이 없습니다');
      }

      const response = await fetch(`${this.baseURL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          refreshToken
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`HTTP ${response.status}: ${errorData?.message || response.statusText}`);
      }

      const data = await response.json();
      this.saveTokens(data);
      return data;
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
      this.clearAllTokens();
      this.emitAuthStateChange(false);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 생성
export const authService = new AuthService();