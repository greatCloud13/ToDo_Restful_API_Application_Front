import { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '../services/analyticsService';

export const useAnalytics = (period = 'week') => {
  const [analyticsData, setAnalyticsData] = useState({
    summary: null,
    completionTrend: [],
    priorityDistribution: [],
    categoryDistribution: [],
    productivityPatterns: null,
    completionTimeAnalysis: null,
    insights: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 모든 통계 데이터 로드
  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [
        summary,
        completionTrend,
        priorityDistribution,
        categoryDistribution,
        productivityPatterns,
        completionTimeAnalysis,
        insights
      ] = await Promise.all([
        analyticsService.getAnalyticsSummary(period),
        analyticsService.getCompletionTrend(period),
        analyticsService.getDistribution('priority'),
        analyticsService.getDistribution('category'),
        analyticsService.getProductivityPatterns(),
        analyticsService.getCompletionTimeAnalysis(),
        analyticsService.getInsights()
      ]);
      
      setAnalyticsData({
        summary,
        completionTrend: completionTrend.data || [],
        priorityDistribution: priorityDistribution.priority || [],
        categoryDistribution: categoryDistribution.category || [],
        productivityPatterns,
        completionTimeAnalysis,
        insights
      });
    } catch (err) {
      setError(err.message);
      console.error('통계 데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return {
    ...analyticsData,
    loading,
    error,
    refreshAnalytics: loadAnalytics
  };
};