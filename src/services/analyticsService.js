import { apiClient } from './apiClient';

export const analyticsService = {
  // 전체 통계 요약
  getAnalyticsSummary: async (period = 'week') => {
    const response = await apiClient.get(`/analytics/summary?period=${period}`);
    return response.data;
  },

  // 완료 추이 데이터
  getCompletionTrend: async (period = 'week', startDate) => {
    const params = new URLSearchParams({ period });
    if (startDate) params.append('startDate', startDate);
    
    const response = await apiClient.get(`/analytics/completion-trend?${params}`);
    return response.data;
  },

  // 분포 데이터 (우선순위, 카테고리별)
  getDistribution: async (type = 'priority') => {
    const response = await apiClient.get(`/analytics/distribution?type=${type}`);
    return response.data;
  },

  // 생산성 패턴 분석
  getProductivityPatterns: async () => {
    const response = await apiClient.get('/analytics/productivity-patterns');
    return response.data;
  },

  // 완료 시간 분석
  getCompletionTimeAnalysis: async () => {
    const response = await apiClient.get('/analytics/completion-time');
    return response.data;
  },

  // AI 인사이트
  getInsights: async () => {
    const response = await apiClient.get('/analytics/insights');
    return response.data;
  }
};