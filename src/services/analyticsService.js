// services/analyticsService.js
class AnalyticsService {
  constructor() {
    this.baseURL = 'http://localhost:8080/analytics';
  }

  // HTTP 요청 헬퍼 메서드
  async makeRequest(endpoint, options = {}) {
    const token = window.authTokens?.accessToken;
    
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    };

    if (token) {
      defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    const finalOptions = { ...defaultOptions, ...options };
    
    try {
      console.log(`Analytics API 요청: ${endpoint}`, finalOptions);
      
      const response = await fetch(`${this.baseURL}${endpoint}`, finalOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`HTTP ${response.status}: ${errorData?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log(`Analytics API 응답: ${endpoint}`, data);
      
      return data;
    } catch (error) {
      console.error(`Analytics API 오류 [${endpoint}]:`, error);
      throw error;
    }
  }

  // 전체 통계 요약
  async getSummary(period = 'week') {
    try {
      const params = new URLSearchParams({ period }).toString();
      return await this.makeRequest(`/summary?${params}`);
    } catch (error) {
      console.error('Analytics summary fetch failed:', error);
      throw error;
    }
  }

  // 완료 추이 데이터
  async getTrends(period = 'week', startDate = null) {
    try {
      const params = new URLSearchParams({ period });
      if (startDate) params.append('startDate', startDate);
      
      return await this.makeRequest(`/trend?${params.toString()}`);
    } catch (error) {
      console.error('Analytics trends fetch failed:', error);
      throw error;
    }
  }

  // 분포 데이터 (우선순위, 카테고리별)
  async getDistribution(type = 'all', period = 'week') {
    try {
      const params = new URLSearchParams({ type, period }).toString();
      return await this.makeRequest(`/distribution?${params}`);
    } catch (error) {
      console.error('Analytics distribution fetch failed:', error);
      throw error;
    }
  }

  // 생산성 패턴 분석
  async getProductivityPatterns(period = 'week') {
    try {
      const params = new URLSearchParams({ period }).toString();
      return await this.makeRequest(`/productivity?${params}`);
    } catch (error) {
      console.error('Productivity patterns fetch failed:', error);
      throw error;
    }
  }

  // AI 인사이트
  async getInsights(period = 'week') {
    try {
      const params = new URLSearchParams({ period }).toString();
      return await this.makeRequest(`/insights?${params}`);
    } catch (error) {
      console.error('Analytics insights fetch failed:', error);
      throw error;
    }
  }

  // 지연 작업 분석
  async getOverdueAnalysis() {
    try {
      return await this.makeRequest('/overdue');
    } catch (error) {
      console.error('Overdue analysis fetch failed:', error);
      throw error;
    }
  }

  // 완료 시간 분석
  async getCompletionTimeAnalysis(period = 'month') {
    try {
      const params = new URLSearchParams({ period }).toString();
      return await this.makeRequest(`/completion-time?${params}`);
    } catch (error) {
      console.error('Completion time analysis fetch failed:', error);
      throw error;
    }
  }

  // 배치 API 호출 (여러 통계를 한번에)
  async getBatchAnalytics(period = 'week', apis = ['summary', 'trends', 'distribution', 'insights']) {
    try {
      const params = new URLSearchParams({ 
        period,
        apis: apis.join(',')
      }).toString();
      
      return await this.makeRequest(`/batch?${params}`);
    } catch (error) {
      console.error('Batch analytics fetch failed:', error);
      throw error;
    }
  }

  // 실시간 대시보드 데이터
  async getRealTimeStats() {
    try {
      return await this.makeRequest('/realtime');
    } catch (error) {
      console.error('Real-time stats fetch failed:', error);
      throw error;
    }
  }

  // 목표 추적 데이터
  async getGoalTracking() {
    try {
      return await this.makeRequest('/goals');
    } catch (error) {
      console.error('Goal tracking fetch failed:', error);
      throw error;
    }
  }

  // 토큰 상태 확인 (authService 패턴)
  async checkApiStatus() {
    try {
      return await this.makeRequest('/status');
    } catch (error) {
      console.error('Analytics API 상태 확인 실패:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 생성 및 export
export const analyticsService = new AnalyticsService();