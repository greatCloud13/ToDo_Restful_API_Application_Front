// services/analyticsService.js
import { API_ENDPOINTS } from '../config/api';

class AnalyticsService {
  constructor() {
    this.baseURL = API_ENDPOINTS.ANALYTICS;
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
}

// 싱글톤 인스턴스 생성 및 export
export const analyticsService = new AnalyticsService();