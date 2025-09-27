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
    productivity: null,
    insights: null,
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
      trends: {
        data: Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return {
            date: `${date.getMonth() + 1}/${date.getDate()}`,
            completed: Math.floor(Math.random() * 10) + 1,
            total: Math.floor(Math.random() * 15) + 5
          };
        })
      },
      productivity: {
        weekdayStats: ['일', '월', '화', '수', '목', '금', '토'].map((day, index) => ({
          dayOfWeek: index,
          dayName: day,
          totalTodos: Math.floor(Math.random() * 20) + 5,
          completedTodos: Math.floor(Math.random() * 15) + 3,
          completionRate: Math.floor(Math.random() * 40) + 60
        }))
      },
      insights: [
        {
          type: 'productivity',
          level: 'positive',
          title: '최고 생산성',
          message: '화요일에 가장 많은 작업을 완료합니다. 완료율 85%',
          icon: 'award',
          suggestion: '화요일에 중요한 작업을 스케줄링하세요'
        },
        {
          type: 'warning',
          level: 'warning',
          title: '주의 필요',
          message: '업무 카테고리에서 5개의 지연된 작업이 있습니다',
          icon: 'alert-triangle',
          suggestion: '지연된 업무 작업의 우선순위를 재검토하세요'
        }
      ]
    };
  };

  // 데이터 로드 함수 (분포 API 연동)
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

      // Distribution API - 새로 추가된 API
      apiCalls.push(
        analyticsService.getDistribution('all', period)
          .then(data => ({ type: 'distribution', data }))
          .catch(error => ({ type: 'distribution', error: error.message }))
      );

      // Productivity API
      apiCalls.push(
        analyticsService.getProductivityPatterns(period)
          .then(data => ({ type: 'productivity', data }))
          .catch(error => ({ type: 'productivity', error: error.message }))
      );

      // Insights API
      apiCalls.push(
        analyticsService.getInsights(period)
          .then(data => ({ type: 'insights', data }))
          .catch(error => ({ type: 'insights', error: error.message }))
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
              completed: item.completed,
              total: item.total
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
  }, [period]); // 단순한 의존성

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