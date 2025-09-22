import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { todoService } from '../services/todoService';
import { dashboardService } from '../services/dashboardService';
import { calendarService } from '../services/calendarService';

// Context 생성
const AppContext = createContext();

// 초기 상태 (먼저 정의!)
const initialState = {
  todos: [],
  user: {
    username: window.authTokens?.username || "admin",
    authorities: window.authTokens?.authorities || ["ROLE_ADMIN"]
  },
  loading: false,
  error: null,
  filter: {
    status: 'all',
    priority: 'all',
    category: 'all',
    dateRange: null
  },
  sort: {
    field: 'dueDate',
    direction: 'asc'
  }
};

// 액션 타입들
export const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_TODOS: 'SET_TODOS',
  ADD_TODO: 'ADD_TODO',
  UPDATE_TODO: 'UPDATE_TODO',
  DELETE_TODO: 'DELETE_TODO',
  TOGGLE_TODO: 'TOGGLE_TODO',
  SET_USER: 'SET_USER',
  SET_FILTER: 'SET_FILTER',
  SET_SORT: 'SET_SORT',
  BULK_UPDATE_TODOS: 'BULK_UPDATE_TODOS'
};

// Reducer 함수 (initialState 다음에 정의!)
const appReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    
    case actionTypes.SET_TODOS:
      return { ...state, todos: action.payload, loading: false };
    
    case actionTypes.ADD_TODO:
      return { 
        ...state, 
        todos: [...state.todos, action.payload],
        loading: false 
      };
    
    case actionTypes.UPDATE_TODO:
      return {
        ...state,
        todos: state.todos.map(todo => 
          todo.id === action.payload.id ? action.payload : todo
        ),
        loading: false
      };
    
    case actionTypes.DELETE_TODO:
      return {
        ...state,
        todos: state.todos.filter(todo => todo.id !== action.payload),
        loading: false
      };
    
    case actionTypes.TOGGLE_TODO:
      return {
        ...state,
        todos: state.todos.map(todo => 
          todo.id === action.payload 
            ? { ...todo, status: todo.status === 'completed' ? 'pending' : 'completed' }
            : todo
        ),
        loading: false
      };
    
    case actionTypes.SET_USER:
      return { ...state, user: action.payload };

    case actionTypes.SET_FILTER:
      return { ...state, filter: { ...state.filter, ...action.payload } };
    
    case actionTypes.SET_SORT:
      return { ...state, sort: action.payload };
    
    case actionTypes.BULK_UPDATE_TODOS:
      return {
        ...state,
        todos: state.todos.map(todo => {
          const update = action.payload.find(u => u.id === todo.id);
          return update ? { ...todo, ...update.data } : todo;
        })
      };
    
    default:
      return state;
  }
};

// Context Provider 컴포넌트
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 초기 데이터 로드
  useEffect(() => {
    loadTodos();
  }, []);

  // 사용자 정보 업데이트 감지
  useEffect(() => {
  const updateUser = () => {
    if (window.authTokens) {
      const newUser = {
        username: window.authTokens.username,
        authorities: window.authTokens.authorities
      };
      
      // 실제로 변경된 경우에만 업데이트
      if (JSON.stringify(newUser) !== JSON.stringify(state.user)) {
        dispatch({
          type: actionTypes.SET_USER,
          payload: newUser
        });
      }
    }
  };

  updateUser();
  // 1초 간격을 3초로 늘리거나 아예 제거
  const interval = setInterval(updateUser, 3000); // 3초로 변경
  return () => clearInterval(interval);
}, [state.user]); // 의존성 배열 추가

  // 액션 함수들
  const loadTodos = async () => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    try {
      const todos = await todoService.getAllTodos();
      dispatch({ type: actionTypes.SET_TODOS, payload: todos });
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
    }
  };

  const addTodo = async (todoData) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    try {
      const newTodo = await todoService.createTodo(todoData);
      dispatch({ type: actionTypes.ADD_TODO, payload: newTodo });
      return newTodo;
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const updateTodo = async (id, todoData) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    try {
      const updatedTodo = await todoService.updateTodo(id, todoData);
      dispatch({ type: actionTypes.UPDATE_TODO, payload: updatedTodo });
      return updatedTodo;
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const deleteTodo = async (id) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    try {
      await todoService.deleteTodo(id);
      dispatch({ type: actionTypes.DELETE_TODO, payload: id });
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  const toggleTodoStatus = async (id) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    try {
      const updatedTodo = await todoService.toggleTodoStatus(id);
      dispatch({ type: actionTypes.UPDATE_TODO, payload: updatedTodo });
      return updatedTodo;
    } catch (error) {
      dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  // 필터 및 정렬 함수들
  const setFilter = (filterData) => {
    dispatch({ type: actionTypes.SET_FILTER, payload: filterData });
  };

  const setSort = (sortData) => {
    dispatch({ type: actionTypes.SET_SORT, payload: sortData });
  };

  // 대시보드 전용 API 함수들
  const getTodayTodos = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return state.todos.filter(todo => todo.dueDate === today);
  }, [state.todos]);

  const getUrgentTodos = useCallback(() => {
    return state.todos.filter(todo => 
      (todo.priority === 'critical' || todo.priority === 'high') && 
      todo.status !== 'completed'
    );
  }, [state.todos]);

  const getStats = useCallback(() => {
    const total = state.todos.length;
    const completed = state.todos.filter(todo => todo.status === 'completed').length;
    const pending = state.todos.filter(todo => todo.status === 'pending').length;
    const inProgress = state.todos.filter(todo => todo.status === 'in-progress').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      total,
      completed,
      pending,
      inProgress,
      completionRate
    };
  }, [state.todos]);

  const clearError = () => {
    dispatch({ type: actionTypes.SET_ERROR, payload: null });
  };

  // 필터링된 할일 목록 계산
  const getFilteredTodos = useCallback(() => {
    let filtered = [...state.todos];
    
    // 상태 필터
    if (state.filter.status !== 'all') {
      filtered = filtered.filter(todo => todo.status === state.filter.status);
    }
    
    // 우선순위 필터
    if (state.filter.priority !== 'all') {
      filtered = filtered.filter(todo => todo.priority === state.filter.priority);
    }
    
    // 카테고리 필터
    if (state.filter.category !== 'all') {
      filtered = filtered.filter(todo => todo.category === state.filter.category);
    }
    
    // 정렬
    filtered.sort((a, b) => {
      const { field, direction } = state.sort;
      const aValue = a[field];
      const bValue = b[field];
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [state.todos, state.filter, state.sort]);

  // Context value
  const value = {
    // 상태
    ...state,
    
    // 액션 함수들
    loadTodos,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodoStatus,
    clearError,
    setFilter,
    setSort,

    // 계산된 값들
    getTodayTodos,
    getUrgentTodos,
    getStats,
    getFilteredTodos,
    
    // 날짜별 할일 조회
    getTodosByDate: (date) => {
      return state.todos.filter(todo => todo.dueDate === date);
    }
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Context 사용 훅
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;