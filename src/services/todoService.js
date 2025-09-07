// src/services/todoService.js
// 현재는 로컬 데이터로 동작, 추후 백엔드 API로 교체 예정
class TodoService {
  constructor() {
    // 초기 더미 데이터 - 기존 컴포넌트에서 가져온 것
    this.todos = [
      { id: 1, title: "프로젝트 기획서 작성", priority: "critical", status: "pending", dueDate: "2025-09-05", category: "업무", createdAt: new Date().toISOString() },
      { id: 2, title: "코드 리뷰 완료", priority: "high", status: "in-progress", dueDate: "2025-09-04", category: "개발", createdAt: new Date().toISOString() },
      { id: 3, title: "회의 준비", priority: "medium", status: "completed", dueDate: "2025-09-03", category: "업무", createdAt: new Date().toISOString() },
      { id: 4, title: "운동하기", priority: "low", status: "pending", dueDate: "2025-09-04", category: "개인", createdAt: new Date().toISOString() },
      { id: 5, title: "독서 30분", priority: "minimal", status: "completed", dueDate: "2025-09-03", category: "개인", createdAt: new Date().toISOString() },
      { id: 6, title: "긴급 버그 수정", priority: "critical", status: "pending", dueDate: "2025-09-04", category: "개발", createdAt: new Date().toISOString() },
      { id: 7, title: "팀 미팅 참석", priority: "high", status: "pending", dueDate: "2025-09-04", category: "업무", createdAt: new Date().toISOString() },
      { id: 8, title: "문서 정리", priority: "medium", status: "pending", dueDate: "2025-09-07", category: "업무", createdAt: new Date().toISOString() },
      { id: 9, title: "신규 기능 개발", priority: "high", status: "in-progress", dueDate: "2025-09-10", category: "개발", createdAt: new Date().toISOString() }
    ];
    
    // 로컬스토리지에서 데이터 로드 (있을 경우)
    this.loadFromStorage();
  }

  // 로컬스토리지에서 데이터 로드
  loadFromStorage() {
    try {
      const storedTodos = localStorage.getItem('todos');
      if (storedTodos) {
        this.todos = JSON.parse(storedTodos);
      }
    } catch (error) {
      console.warn('로컬스토리지에서 todos 로드 실패:', error);
    }
  }

  // 로컬스토리지에 데이터 저장
  saveToStorage() {
    try {
      localStorage.setItem('todos', JSON.stringify(this.todos));
    } catch (error) {
      console.warn('로컬스토리지에 todos 저장 실패:', error);
    }
  }

  // API 응답을 시뮬레이션하기 위한 지연 함수
  delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 모든 할일 조회
  async getAllTodos() {
    await this.delay();
    return [...this.todos];
  }

  // 특정 할일 조회
  async getTodoById(id) {
    await this.delay();
    const todo = this.todos.find(todo => todo.id === parseInt(id));
    if (!todo) {
      throw new Error(`ID ${id}에 해당하는 할일을 찾을 수 없습니다.`);
    }
    return { ...todo };
  }

  // 새 할일 생성
  async createTodo(todoData) {
    await this.delay();
    
    // 유효성 검증
    if (!todoData.title || !todoData.title.trim()) {
      throw new Error('할일 제목은 필수입니다.');
    }

    // 새 할일 생성
    const newTodo = {
      id: Math.max(0, ...this.todos.map(t => t.id)) + 1,
      title: todoData.title.trim(),
      priority: todoData.priority || 'medium',
      status: todoData.status || 'pending',
      dueDate: todoData.dueDate || new Date().toISOString().split('T')[0],
      category: todoData.category || '업무',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.todos.push(newTodo);
    this.saveToStorage();
    
    return { ...newTodo };
  }

  // 할일 수정
  async updateTodo(id, todoData) {
    await this.delay();
    
    const todoIndex = this.todos.findIndex(todo => todo.id === parseInt(id));
    if (todoIndex === -1) {
      throw new Error(`ID ${id}에 해당하는 할일을 찾을 수 없습니다.`);
    }

    // 제목이 제공되었다면 유효성 검증
    if (todoData.title !== undefined && (!todoData.title || !todoData.title.trim())) {
      throw new Error('할일 제목은 필수입니다.');
    }

    // 할일 업데이트
    const updatedTodo = {
      ...this.todos[todoIndex],
      ...todoData,
      id: parseInt(id), // ID는 변경되지 않도록
      updatedAt: new Date().toISOString()
    };

    // 제목이 제공된 경우 trim 처리
    if (todoData.title !== undefined) {
      updatedTodo.title = todoData.title.trim();
    }

    this.todos[todoIndex] = updatedTodo;
    this.saveToStorage();

    return { ...updatedTodo };
  }

  // 할일 삭제
  async deleteTodo(id) {
    await this.delay();
    
    const todoIndex = this.todos.findIndex(todo => todo.id === parseInt(id));
    if (todoIndex === -1) {
      throw new Error(`ID ${id}에 해당하는 할일을 찾을 수 없습니다.`);
    }

    const deletedTodo = this.todos.splice(todoIndex, 1)[0];
    this.saveToStorage();

    return { ...deletedTodo };
  }

  // 할일 상태 토글 (pending <-> completed)
  async toggleTodoStatus(id) {
    await this.delay();
    
    const todo = this.todos.find(todo => todo.id === parseInt(id));
    if (!todo) {
      throw new Error(`ID ${id}에 해당하는 할일을 찾을 수 없습니다.`);
    }

    // 상태 토글 로직
    let newStatus;
    if (todo.status === 'completed') {
      newStatus = 'pending';
    } else if (todo.status === 'pending' || todo.status === 'in-progress') {
      newStatus = 'completed';
    } else {
      newStatus = 'completed'; // 예상치 못한 상태의 경우 완료로 설정
    }

    return await this.updateTodo(id, { status: newStatus });
  }

  // 할일 상태 변경 (pending, in-progress, completed)
  async updateTodoStatus(id, status) {
    await this.delay();
    
    const validStatuses = ['pending', 'in-progress', 'completed'];
    if (!validStatuses.includes(status)) {
      throw new Error(`유효하지 않은 상태입니다: ${status}`);
    }

    return await this.updateTodo(id, { status });
  }

  // 날짜별 할일 조회
  async getTodosByDate(date) {
    await this.delay();
    return this.todos.filter(todo => todo.dueDate === date);
  }

  // 우선순위별 할일 조회
  async getTodosByPriority(priority) {
    await this.delay();
    return this.todos.filter(todo => todo.priority === priority);
  }

  // 상태별 할일 조회
  async getTodosByStatus(status) {
    await this.delay();
    return this.todos.filter(todo => todo.status === status);
  }

  // 카테고리별 할일 조회
  async getTodosByCategory(category) {
    await this.delay();
    return this.todos.filter(todo => todo.category === category);
  }

  // 할일 검색
  async searchTodos(query) {
    await this.delay();
    const lowerQuery = query.toLowerCase();
    return this.todos.filter(todo => 
      todo.title.toLowerCase().includes(lowerQuery) ||
      todo.category.toLowerCase().includes(lowerQuery)
    );
  }

  // 대시보드 통계 조회
  async getDashboardStats() {
    await this.delay();
    
    const total = this.todos.length;
    const completed = this.todos.filter(todo => todo.status === 'completed').length;
    const pending = this.todos.filter(todo => todo.status === 'pending').length;
    const inProgress = this.todos.filter(todo => todo.status === 'in-progress').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 긴급 할일 (critical, high 우선순위이면서 미완료)
    const urgent = this.todos.filter(todo => 
      (todo.priority === 'critical' || todo.priority === 'high') && 
      todo.status !== 'completed'
    ).length;

    // 오늘 할일
    const today = new Date().toISOString().split('T')[0];
    const todayTodos = this.todos.filter(todo => todo.dueDate === today).length;

    // 카테고리별 통계
    const categoryStats = this.todos.reduce((acc, todo) => {
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
  }
}

// 싱글톤 인스턴스 생성
export const todoService = new TodoService();