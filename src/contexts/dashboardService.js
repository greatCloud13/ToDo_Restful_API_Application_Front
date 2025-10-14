// src/services/dashboardService.js
// 대시보드 전용 API 서비스
import { API_ENDPOINTS } from '../config/api';

class DashboardService {
  constructor() {
    this.baseURL = API_ENDPOINTS.DASHBOARD;
    // API 호출 쿨다운을 위한 캐시
    this.cache = new Map();
    this.CACHE_DURATION = 5000; // 5초 캐시
  }

  // 캐시 확인 헬퍼 메서드
  isValidCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    return Date.now() - cached.timestamp < this.CACHE_DURATION;
  }

  // 캐시에서 데이터 가져오기
  getFromCache(key) {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  // 캐시에 데이터 저장
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // 토큰 가져오기
  getAuthHeaders() {
    const token = window.authTokens?.accessToken;
    if (!token) {
      throw new Error('인증 토큰이 없습니다. 다시 로그인해주세요.');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  // 백엔드 -> 프론트엔드 데이터 매핑 (todoService와 동일하게 수정)
  mapBackendToFrontend(backendTodo) {
    if (!backendTodo) return null;
    
    // 우선순위 매핑
    const priorityMap = {
      'VERY_HIGH': 'critical',
      'HIGH': 'high',
      'MIDDLE': 'medium',
      'LOW': 'low',
      'VERY_LOW': 'minimal'
    };

    // 상태 매핑 (백엔드 응답의 taskStatus 필드명 확인)
    const statusMap = {
      'IN_PROGRESS': 'in-progress',
      'COMPLETE': 'completed',
      'ON_HOLD': 'pending'
    };

    return {
      id: backendTodo.id,
      title: backendTodo.title,
      priority: priorityMap[backendTodo.taskPriority] || 'medium',
      status: statusMap[backendTodo.taskStatus] || 'pending', // taskStatus 필드명 수정
      dueDate: backendTodo.planningDate ? backendTodo.planningDate.split('T')[0] : new Date().toISOString().split('T')[0],
      category: backendTodo.category || '업무',
      memo: backendTodo.memo || '',
      createdAt: backendTodo.createdAt || new Date().toISOString(),
      username: backendTodo.username // 대시보드 API 응답에 포함된 사용자명
    };
  }

  // 오늘 할일 조회
  async getTodayTodos() {
    const cacheKey = 'today_todos';
    
    // 캐시 확인
    if (this.isValidCache(cacheKey)) {
      console.log('오늘 할일 캐시 사용');
      return this.getFromCache(cacheKey);
    }

    try {
      const response = await fetch(`${this.baseURL}/today`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('오늘 할일 조회 응답:', response.status, errorText);
        throw new Error(`오늘 할일 조회 실패: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('오늘 할일 API 응답:', data);
      
      // 배열인지 확인
      if (!Array.isArray(data)) {
        console.warn('오늘 할일 API가 배열을 반환하지 않음:', data);
        return [];
      }

      const result = data.map(todo => this.mapBackendToFrontend(todo));
      
      // 캐시 저장
      this.setCache(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('오늘 할일 조회 중 오류:', error);
      throw error;
    }
  }

  // 긴급 할일 조회
  async getUrgentTodos() {
    const cacheKey = 'urgent_todos';
    
    // 캐시 확인
    if (this.isValidCache(cacheKey)) {
      console.log('긴급 할일 캐시 사용');
      return this.getFromCache(cacheKey);
    }

    try {
      const response = await fetch(`${this.baseURL}/urgent`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('긴급 할일 조회 응답:', response.status, errorText);
        throw new Error(`긴급 할일 조회 실패: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('긴급 할일 API 응답:', data);
      
      // 배열인지 확인
      if (!Array.isArray(data)) {
        console.warn('긴급 할일 API가 배열을 반환하지 않음:', data);
        return [];
      }

      const result = data.map(todo => this.mapBackendToFrontend(todo));
      
      // 캐시 저장
      this.setCache(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('긴급 할일 조회 중 오류:', error);
      throw error;
    }
  }

  // 통계 조회
  async getStats() {
    try {
      const response = await fetch(`${this.baseURL}/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('통계 조회 응답:', response.status, errorText);
        throw new Error(`통계 조회 실패: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('통계 API 응답:', data); // 디버깅용
      
      // 백엔드 응답을 프론트엔드 형식으로 변환
      // Swagger 문서에 따른 응답 형식: { total, completed, inprogress, pending, completionRate }
      return {
        total: data.total || 0,
        completed: data.completed || 0,
        inProgress: data.inprogress || 0, // 백엔드에서 inprogress로 응답
        pending: data.pending || 0,
        completionRate: data.completionRate || 0
      };
    } catch (error) {
      console.error('통계 조회 중 오류:', error);
      throw error;
    }
  }

  // API 연결 테스트용 메서드
  async testConnection() {
    try {
      console.log('대시보드 API 연결 테스트 시작...');
      
      const [todayResult, urgentResult, statsResult] = await Promise.allSettled([
        this.getTodayTodos(),
        this.getUrgentTodos(),
        this.getStats()
      ]);

      console.log('테스트 결과:', {
        today: todayResult.status === 'fulfilled' ? `성공 (${todayResult.value.length}개)` : `실패: ${todayResult.reason?.message}`,
        urgent: urgentResult.status === 'fulfilled' ? `성공 (${urgentResult.value.length}개)` : `실패: ${urgentResult.reason?.message}`,
        stats: statsResult.status === 'fulfilled' ? '성공' : `실패: ${statsResult.reason?.message}`
      });

      return {
        today: todayResult.status === 'fulfilled',
        urgent: urgentResult.status === 'fulfilled', 
        stats: statsResult.status === 'fulfilled'
      };
    } catch (error) {
      console.error('API 연결 테스트 실패:', error);
      return { today: false, urgent: false, stats: false };
    }
  }
}

// 싱글톤 인스턴스 생성
export const dashboardService = new DashboardService();