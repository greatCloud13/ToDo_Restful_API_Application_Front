// hooks/useAnalytics.js
import { useState, useEffect, useRef } from 'react';
import { analyticsService } from '../services/analyticsService';
import { useAppContext } from '../contexts/AppContext';

export const useAnalytics = (period = 'week') => {
  const { todos } = useAppContext();
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

  const [state, setState] = useState({
    summary: null,
    trends: null,
    distribution: null,
    loading: true,
    error: null,
    lastUpdated: null
  });

  // fallback 데이터 생성
  const generateFallbackSummary = () => {
    if (!todos || todos.length === 0) return null;

    const total = todos.length;
    const completed = todos.filter(todo => todo.status === 'completed').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      total,
      completed,
      pending: todos.filter(todo => todo.status === 'pending').length,
      inProgress: todos.filter(todo => todo.status === 'in-progress').length,
      completionRate,
      overdueCount: 0,
      urgentCount: todos.filter(todo => 
        (todo.priority === 'critical' || todo.priority === 'high') && 
        todo.status !== 'completed'
      ).length,
      avgDailyCompletion: (completed / 7).toFixed(1),
      trend: 0,
      activeDays: 7
    };
  };

  // Mock 데이터 생성
  const generateMockData = () => {
    return {
      distribution: {
        priorityDistribution: [
          { priority: 'VERY_HIGH', count: 5 },
          { priority: 'HIGH', count: 8 },
          { priority: 'MIDDLE', count: 10 },
          { priority: 'LOW', count: 3 },
          { priority: 'VERY_LOW', count: 2 }
        ],
        categoryDistribution: [
          { categoryName: '업무', completed: 10, inProgress: 3, pending: 2, completionRate: 67 }
        ]
      }
    };
  };

  // 데이터 로드 함수
  const loadData = async () => {
    if (loadingRef.current) {
      console.log('이미 로딩 중이므로 중복 호출 방지');
      return;
    }

    loadingRef.current = true;
    console.log(`🚀 Analytics 로드 시작 - period: ${period}`);

    setState(prev => ({ ...prev, loading: true, error: null }));

    // Mock 데이터 먼저 설정 (즉시 UI 표시)
    const mockData = generateMockData();
    setState(prev => ({ ...prev, ...mockData }));

    try {
      // 병렬로 API 호출
      const apiCalls = [];
      
      // Summary API
      apiCalls.push(
        analyticsService.getSummary(period)
          .then(data => ({ type: 'summary', data }))
          .catch(error => ({ type: 'summary', error: error.message }))
      );

      // Trends API
      apiCalls.push(
        analyticsService.getTrends(period)
          .then(data => ({ type: 'trends', data }))
          .catch(error => ({ type: 'trends', error: error.message }))
      );

      // Distribution API
      apiCalls.push(
        analyticsService.getDistribution('all', period)
          .then(data => ({ type: 'distribution', data }))
          .catch(error => ({ type: 'distribution', error: error.message }))
      );

      console.log('📡 모든 Analytics API 병렬 호출 시작...');
      const results = await Promise.all(apiCalls);
      
      if (!mountedRef.current) return;

      // 결과 처리
      let hasError = false;
      let errorMessages = [];
      const updates = {};

      results.forEach(result => {
        if (result.error) {
          console.error(`❌ ${result.type} API 실패:`, result.error);
          hasError = true;
          errorMessages.push(`${result.type}: ${result.error}`);
        } else {
          console.log(`✅ ${result.type} API 성공:`, result.data);
          
          if (result.type === 'trends') {
            // Trends 데이터 변환
            const chartData = result.data.map(item => ({
              date: item.date.substring(5).replace('-', '/'),
              completed: parseInt(item.completed) || 0,
              total: parseInt(item.total) || 0
            }));
            updates.trends = { data: chartData };
            
          } else if (result.type === 'distribution') {
            // Distribution 데이터는 API 응답 그대로 사용
            updates.distribution = result.data;
            
          } else {
            // 다른 데이터는 그대로 설정
            updates[result.type] = result.data;
          }
        }
      });

      // 상태 업데이트
      setState(prev => ({ 
        ...prev, 
        ...updates,
        error: hasError ? errorMessages.join(', ') : null,
        lastUpdated: new Date()
      }));

      console.log('✅ Analytics 데이터 로드 완료');

    } catch (error) {
      console.error('❌ Analytics API 호출 전체 실패:', error);
      
      if (mountedRef.current) {
        // Summary 실패 시 fallback 사용
        const fallbackSummary = generateFallbackSummary();
        setState(prev => ({ 
          ...prev, 
          summary: fallbackSummary,
          error: error.message,
          lastUpdated: new Date()
        }));
      }
    } finally {
      if (mountedRef.current) {
        setState(prev => ({ ...prev, loading: false }));
      }
      loadingRef.current = false;
      console.log('🏁 Analytics 로드 완료');
    }
  };

  // period 변경 시에만 데이터 로드
  useEffect(() => {
    mountedRef.current = true;
    loadData();

    return () => {
      mountedRef.current = false;
    };
  }, [period]);

  // 수동 새로고침
  const refresh = () => {
    console.log('🔄 수동 새로고침 요청');
    loadData();
  };

  // cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    ...state,
    refresh,
    isStale: state.lastUpdated && (Date.now() - state.lastUpdated.getTime()) > 300000
  };
};