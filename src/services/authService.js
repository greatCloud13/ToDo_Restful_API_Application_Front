// src/services/authService.js
class AuthService {
  constructor() {
    this.baseURL = 'http://localhost:8080/api/auth';
    // 앱 시작 시 localStorage에서 토큰 복원
    this.initializeTokens();
  }

  // localStorage에서 토큰 초기화
  initializeTokens() {
    const savedTokens = localStorage.getItem('authTokens');
    if (savedTokens) {
      try {
        window.authTokens = JSON.parse(savedTokens);
      } catch (error) {
        console.error('토큰 복원 실패:', error);
        this.clearLocalTokens();
      }
    }
  }

  // 로그인
  async login(username, password) {
    try {
      const response = await fetch(`${this.baseURL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
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
      return data;
    } catch (error) {
      console.error('Login error:', error);
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
          'Accept': '*/*',
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
      console.error('Signup error:', error);
      throw error;
    }
  }

  // 로그아웃
  async logout() {
    try {
      const token = window.authTokens?.accessToken;
      if (!token) {
        throw new Error('로그인 토큰이 없습니다');
      }

      const response = await fetch(`${this.baseURL}/logout`, {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`HTTP ${response.status}: ${errorData?.message || response.statusText}`);
      }

      const data = await response.json();
      
      // 로그아웃 성공 시 토큰 삭제
      this.clearLocalTokens();
      
      return data;
    } catch (error) {
      console.error('Logout error:', error);
      // 에러가 발생해도 로컬 토큰은 삭제
      this.clearLocalTokens();
      throw error;
    }
  }

  // 토큰 유효성 확인
  async checkTokenStatus() {
    try {
      const token = window.authTokens?.accessToken;
      if (!token) {
        throw new Error('로그인 토큰이 없습니다');
      }

      const response = await fetch(`${this.baseURL}/status`, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`HTTP ${response.status}: ${errorData?.message || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Token status check error:', error);
      throw error;
    }
  }

  // 아이디 중복 확인
  async checkUsername(username) {
    try {
      const response = await fetch(`${this.baseURL}/check-username?username=${encodeURIComponent(username)}`, {
        method: 'GET',
        headers: {
          'Accept': '*/*'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`HTTP ${response.status}: ${errorData?.message || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Username check error:', error);
      throw error;
    }
  }

  // 이메일 중복 확인
  async checkEmail(email) {
    try {
      const response = await fetch(`${this.baseURL}/check-email?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Accept': '*/*'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`HTTP ${response.status}: ${errorData?.message || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Email check error:', error);
      throw error;
    }
  }

  // 로컬 토큰 삭제
  clearLocalTokens() {
    window.authTokens = null;
    localStorage.removeItem('authTokens');
  }

  // 토큰 저장 (window와 localStorage 모두에 저장)
  saveTokens(tokenData) {
    const tokens = {
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      tokenType: tokenData.tokenType,
      username: tokenData.username,
      authorities: tokenData.authorities,
      expiresIn: tokenData.expiresIn,
      expiresAt: new Date(Date.now() + (tokenData.expiresIn || 3600) * 1000).toISOString()
    };
    
    // window 객체에 저장 (즉시 사용을 위해)
    window.authTokens = tokens;
    
    // localStorage에 저장 (새로고침 후에도 유지)
    try {
      localStorage.setItem('authTokens', JSON.stringify(tokens));
    } catch (error) {
      console.error('토큰 저장 실패:', error);
    }
  }

  // 토큰 만료 확인
  isTokenExpired() {
    if (!window.authTokens || !window.authTokens.expiresAt) {
      return true;
    }
    
    const expiresAt = new Date(window.authTokens.expiresAt);
    return expiresAt <= new Date();
  }

  // 현재 로그인 상태 확인
  isLoggedIn() {
    if (!window.authTokens || !window.authTokens.accessToken) {
      return false;
    }
    
    // 토큰 만료 확인
    if (this.isTokenExpired()) {
      this.clearLocalTokens();
      return false;
    }
    
    return true;
  }

  // 현재 사용자 정보
  getCurrentUser() {
    return {
      username: window.authTokens?.username || null,
      authorities: window.authTokens?.authorities || []
    };
  }

  // 토큰 갱신 (필요 시 구현)
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
          'Accept': '*/*',
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
      console.error('Token refresh error:', error);
      this.clearLocalTokens();
      throw error;
    }
  }
}

// 싱글톤 인스턴스 생성
export const authService = new AuthService();