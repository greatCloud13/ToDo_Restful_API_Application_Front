// src/services/calendarService.js
// 캘린더 전용 API 서비스 (/calendar/month 엔드포인트 사용)
class CalendarService {
  constructor() {
    this.baseURL = 'http://localhost:8080/calendar';
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

  // 백엔드 -> 프론트엔드 데이터 매핑
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

    // 상태 매핑
    const statusMap = {
      'IN_PROGRESS': 'in-progress',
      'COMPLETE': 'completed',
      'ON_HOLD': 'pending'
    };

    return {
      id: backendTodo.id,
      title: backendTodo.title,
      priority: priorityMap[backendTodo.taskPriority] || 'medium',
      status: statusMap[backendTodo.taskStatus] || 'pending',
      dueDate: backendTodo.planningDate ? backendTodo.planningDate.split('T')[0] : new Date().toISOString().split('T')[0],
      category: backendTodo.category || '업무',
      memo: backendTodo.memo || '',
      createdAt: backendTodo.createdAt || new Date().toISOString(),
      doneAt: backendTodo.doneAt,
      username: backendTodo.username
    };
  }

  /**
   * 월별 할일 목록 조회
   * GET /calendar/month?startDate=YYYY-MM-DD&lastDate=YYYY-MM-DD
   * @param {Date} currentDate - 현재 보고 있는 달의 날짜
   * @returns {Promise<Array>} 해당 월의 모든 할일
   */
  async getMonthTodos(currentDate = new Date()) {
    try {
      // 해당 월의 첫날과 마지막날 계산
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      const startDate = new Date(year, month, 1);
      const lastDate = new Date(year, month + 1, 0);
      
      // YYYY-MM-DD 형식으로 변환
      const startDateStr = startDate.toISOString().split('T')[0];
      const lastDateStr = lastDate.toISOString().split('T')[0];
      
      // 쿼리 파라미터 추가
      const params = new URLSearchParams({
        startDate: startDateStr,
        lastDate: lastDateStr
      });

      const response = await fetch(`${this.baseURL}/month?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('월별 할일 조회 응답:', response.status, errorText);
        throw new Error(`월별 할일 조회 실패: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('월별 할일 API 응답:', data);
      console.log('요청 기간:', { startDate: startDateStr, lastDate: lastDateStr });
      
      // 배열인지 확인
      if (!Array.isArray(data)) {
        console.warn('월별 할일 API가 배열을 반환하지 않음:', data);
        return [];
      }

      return data.map(todo => this.mapBackendToFrontend(todo));
    } catch (error) {
      console.error('월별 할일 조회 중 오류:', error);
      throw error;
    }
  }

  /**
   * 특정 날짜의 할일 필터링 (로컬)
   * @param {Array} todos - 전체 할일 목록
   * @param {string} date - YYYY-MM-DD 형식
   * @returns {Array} 해당 날짜의 할일
   */
  filterTodosByDate(todos, date) {
    return todos.filter(todo => todo.dueDate === date);
  }

  /**
   * 날짜별 할일 조회 (월별 조회 후 필터링)
   * @param {string} date - YYYY-MM-DD 형식
   * @returns {Promise<Array>} 해당 날짜의 할일
   */
  async getTodosByDate(date) {
    try {
      const monthTodos = await this.getMonthTodos();
      return this.filterTodosByDate(monthTodos, date);
    } catch (error) {
      console.error('날짜별 할일 조회 중 오류:', error);
      throw error;
    }
  }

  /**
   * 캘린더 통계 계산 (로컬)
   * @param {Array} todos - 전체 할일 목록
   * @returns {Object} 통계 데이터
   */
  calculateStats(todos) {
    const total = todos.length;
    const completed = todos.filter(todo => todo.status === 'completed').length;
    const pending = todos.filter(todo => todo.status === 'pending').length;
    const inProgress = todos.filter(todo => todo.status === 'in-progress').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      pending,
      inProgress,
      completionRate
    };
  }

  /**
   * 긴급 할일 필터링 (로컬)
   * @param {Array} todos - 전체 할일 목록
   * @returns {Array} 긴급 할일 목록
   */
  filterUrgentTodos(todos) {
    return todos.filter(todo => 
      (todo.priority === 'critical' || todo.priority === 'high') && 
      todo.status !== 'completed'
    );
  }
}

// 싱글톤 인스턴스 생성
export const calendarService = new CalendarService();