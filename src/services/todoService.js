// src/services/todoService.js
// 백엔드 API와 연동하는 실제 서비스

class TodoService {
  constructor() {
    this.baseURL = 'http://localhost:8080/todos';
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
      dueDate: backendTodo.targetDate || backendTodo.planningDate || new Date().toISOString().split('T')[0],
      category: backendTodo.category || '업무',
      memo: backendTodo.memo || '',
      createdAt: backendTodo.createdAt || new Date().toISOString(),
      updatedAt: backendTodo.updatedAt || new Date().toISOString()
    };
  }

  // 프론트엔드 -> 백엔드 데이터 매핑
  mapFrontendToBackend(frontendTodo) {
    // 우선순위 역매핑
    const priorityMap = {
      'critical': 'VERY_HIGH',
      'high': 'HIGH',
      'medium': 'MIDDLE',
      'low': 'LOW',
      'minimal': 'VERY_LOW'
    };

    // 상태 역매핑
    const statusMap = {
      'in-progress': 'IN_PROGRESS',
      'completed': 'COMPLETE',
      'pending': 'ON_HOLD'
    };

    return {
      title: frontendTodo.title,
      memo: frontendTodo.memo || '',
      priority: priorityMap[frontendTodo.priority] || 'MIDDLE',
      category: frontendTodo.category || '업무',
      status: statusMap[frontendTodo.status] || 'ON_HOLD',
      targetDate: frontendTodo.dueDate ? new Date(frontendTodo.dueDate).toISOString() : new Date().toISOString()
    };
  }

  // 모든 할일 조회 (페이징 처리)
  async getAllTodos(page = 0, size = 100) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sort: 'id,desc'
      });

      const response = await fetch(`${this.baseURL}?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`할일 목록 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      
      // 페이징된 응답에서 content 배열 추출
      const todos = data.content || [];
      return todos.map(todo => this.mapBackendToFrontend(todo));
    } catch (error) {
      console.error('할일 목록 조회 중 오류:', error);
      throw error;
    }
  }

  // 특정 할일 조회
  async getTodoById(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`할일 조회 실패: ${response.status}`);
      }

      const data = await response.json();
      return this.mapBackendToFrontend(data);
    } catch (error) {
      console.error('할일 조회 중 오류:', error);
      throw error;
    }
  }

  // 새 할일 생성
  async createTodo(todoData) {
    try {
      if (!todoData.title || !todoData.title.trim()) {
        throw new Error('할일 제목은 필수입니다.');
      }

      const backendData = this.mapFrontendToBackend(todoData);

      const response = await fetch(`${this.baseURL}/post`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(backendData)
      });

      if (!response.ok) {
        throw new Error(`할일 생성 실패: ${response.status}`);
      }

      const data = await response.json();
      return this.mapBackendToFrontend(data);
    } catch (error) {
      console.error('할일 생성 중 오류:', error);
      throw error;
    }
  }

  // 할일 수정
  async updateTodo(id, todoData) {
    try {
      if (todoData.title !== undefined && (!todoData.title || !todoData.title.trim())) {
        throw new Error('할일 제목은 필수입니다.');
      }

      const backendData = this.mapFrontendToBackend(todoData);

      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(backendData)
      });

      if (!response.ok) {
        throw new Error(`할일 수정 실패: ${response.status}`);
      }

      const data = await response.json();
      return this.mapBackendToFrontend(data);
    } catch (error) {
      console.error('할일 수정 중 오류:', error);
      throw error;
    }
  }

  // 할일 삭제
  async deleteTodo(id) {
    try {
      const response = await fetch(`${this.baseURL}/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`할일 삭제 실패: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('할일 삭제 중 오류:', error);
      throw error;
    }
  }

  // 할일 상태 토글 (pending <-> completed)
  async toggleTodoStatus(id) {
  try {
    // ✅ Dashboard와 동일하게 단순화
    const response = await fetch(`${this.baseURL}/status/${id}?status=COMPLETE`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`상태 변경 실패: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('상태 토글 중 오류:', error);
    throw error;
  }
}

  // 할일 상태 변경 (별도 API 엔드포인트 사용)
  async updateTodoStatus(id, status) {
    try {
      const validStatuses = ['pending', 'in-progress', 'completed'];
      if (!validStatuses.includes(status)) {
        throw new Error(`유효하지 않은 상태입니다: ${status}`);
      }

      // 상태 매핑
      const statusMap = {
        'in-progress': 'IN_PROGRESS',
        'completed': 'COMPLETE',
        'pending': 'ON_HOLD'
      };

      const backendStatus = statusMap[status];

      const response = await fetch(`${this.baseURL}/status/${id}?status=${backendStatus}`, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`상태 변경 실패: ${response.status}`);
      }

      // 상태 변경 후 업데이트된 할일 정보 반환
      return await this.getTodoById(id);
    } catch (error) {
      console.error('상태 변경 중 오류:', error);
      throw error;
    }
  }

  // 날짜별 할일 조회 (전체 조회 후 필터링)
  async getTodosByDate(date) {
    try {
      const todos = await this.getAllTodos();
      return todos.filter(todo => todo.dueDate === date);
    } catch (error) {
      console.error('날짜별 할일 조회 중 오류:', error);
      throw error;
    }
  }

  // 우선순위별 할일 조회 (전체 조회 후 필터링)
  async getTodosByPriority(priority) {
    try {
      const todos = await this.getAllTodos();
      return todos.filter(todo => todo.priority === priority);
    } catch (error) {
      console.error('우선순위별 할일 조회 중 오류:', error);
      throw error;
    }
  }

  // 상태별 할일 조회 (전체 조회 후 필터링)
  async getTodosByStatus(status) {
    try {
      const todos = await this.getAllTodos();
      return todos.filter(todo => todo.status === status);
    } catch (error) {
      console.error('상태별 할일 조회 중 오류:', error);
      throw error;
    }
  }

  // 카테고리별 할일 조회 (전체 조회 후 필터링)
  async getTodosByCategory(category) {
    try {
      const todos = await this.getAllTodos();
      return todos.filter(todo => todo.category === category);
    } catch (error) {
      console.error('카테고리별 할일 조회 중 오류:', error);
      throw error;
    }
  }

  // 할일 검색 (전체 조회 후 필터링)
  async searchTodos(query) {
    try {
      const todos = await this.getAllTodos();
      const lowerQuery = query.toLowerCase();
      return todos.filter(todo => 
        todo.title.toLowerCase().includes(lowerQuery) ||
        todo.category.toLowerCase().includes(lowerQuery) ||
        (todo.memo && todo.memo.toLowerCase().includes(lowerQuery))
      );
    } catch (error) {
      console.error('할일 검색 중 오류:', error);
      throw error;
    }
  }

  // 대시보드 통계 조회
  async getDashboardStats() {
    try {
      const todos = await this.getAllTodos();
      
      const total = todos.length;
      const completed = todos.filter(todo => todo.status === 'completed').length;
      const pending = todos.filter(todo => todo.status === 'pending').length;
      const inProgress = todos.filter(todo => todo.status === 'in-progress').length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // 긴급 할일 (critical, high 우선순위이면서 미완료)
      const urgent = todos.filter(todo => 
        (todo.priority === 'critical' || todo.priority === 'high') && 
        todo.status !== 'completed'
      ).length;

      // 오늘 할일
      const today = new Date().toISOString().split('T')[0];
      const todayTodos = todos.filter(todo => todo.dueDate === today).length;

      // 카테고리별 통계
      const categoryStats = todos.reduce((acc, todo) => {
        acc[todo.category] = (acc[todo.category] || 0) + 1;
        return acc;
      }, {});

      return {
        total,
        completed,
        pending,
        inProgress,
        completionRate,
        urgent,
        todayTodos,
        categoryStats
      };
    } catch (error) {
      console.error('통계 조회 중 오류:', error);
      throw error;
    }
  }

  // 카테고리 목록 조회 (고유값 추출)
  async getCategories() {
    try {
      const todos = await this.getAllTodos();
      const categories = [...new Set(todos.map(todo => todo.category))];
      return categories.filter(category => category); // 빈 값 제거
    } catch (error) {
      console.error('카테고리 목록 조회 중 오류:', error);
      throw error;
    }
  }

  // 대량 상태 변경
  async bulkUpdateStatus(ids, status) {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('변경할 할일을 선택해주세요.');
      }

      const validStatuses = ['pending', 'in-progress', 'completed'];
      if (!validStatuses.includes(status)) {
        throw new Error(`유효하지 않은 상태입니다: ${status}`);
      }

      // 상태 매핑
      const statusMap = {
        'in-progress': 'IN_PROGRESS',
        'completed': 'COMPLETE',
        'pending': 'ON_HOLD'
      };

      const backendStatus = statusMap[status];

      const response = await fetch(`${this.baseURL}/bulkUpdate`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          id: ids,
          status: backendStatus
        })
      });

      if (!response.ok) {
        throw new Error(`대량 상태 변경 실패: ${response.status}`);
      }

      const data = await response.json();
      return data.map(todo => this.mapBackendToFrontend(todo));
    } catch (error) {
      console.error('대량 상태 변경 중 오류:', error);
      throw error;
    }
  }

  // 대량 삭제
  async bulkDeleteTodos(ids) {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('삭제할 할일을 선택해주세요.');
      }

      const response = await fetch(`${this.baseURL}/bulkDelete`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(ids)
      });

      if (!response.ok) {
        throw new Error(`대량 삭제 실패: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('대량 삭제 중 오류:', error);
      throw error;
    }
  }

}


// 싱글톤 인스턴스 생성
export const todoService = new TodoService();