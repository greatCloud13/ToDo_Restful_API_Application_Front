import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { todoService } from '../services/todoService';
import { dashboardService } from '../services/dashboardService';

// Context 생성
const AppContext = createContext();

// 초기 상태
const initialState = {
  todos: [],
  user: {
    username: window.authTokens?.username || "admin",
    authorities: window.authTokens?.authorities || ["ROLE_ADMIN"]
  },
  loading: false,
  error: null
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
  SET_USER: 'SET_USER'
};

// Reducer 함수
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
        dispatch({
          type: actionTypes.SET_USER,
          payload: {
            username: window.authTokens.username,
            authorities: window.authTokens.authorities
          }
        });
      }
    };

    updateUser();
    const interval = setInterval(updateUser, 1000);
    return () => clearInterval(interval);
  }, []);

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

  // 대시보드 전용 API 함수들 - dashboardService 사용
  const getTodayTodos = useCallback(async () => {
    try {
      return await dashboardService.getTodayTodos();
    } catch (error) {
      console.error('오늘 할일 조회 실패:', error);
      // 실패 시 로컬 데이터로 fallback
      const today = new Date().toISOString().split('T')[0];
      return state.todos.filter(todo => todo.dueDate === today);
    }
  }, [state.todos]);

  const getUrgentTodos = useCallback(async () => {
    try {
      return await dashboardService.getUrgentTodos();
    } catch (error) {
      console.error('긴급 할일 조회 실패:', error);
      // 실패 시 로컬 데이터로 fallback
      return state.todos.filter(todo => 
        (todo.priority === 'critical' || todo.priority === 'high') && 
        todo.status !== 'completed'
      );
    }
  }, [state.todos]);

  const getStats = useCallback(async () => {
    try {
      return await dashboardService.getStats();
    } catch (error) {
      console.error('통계 조회 실패:', error);
      // 실패 시 로컬 데이터로 fallback
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
    }
  }, [state.todos]);

  const clearError = () => {
    dispatch({ type: actionTypes.SET_ERROR, payload: null });
  };

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

    // 대시보드 API 함수들
    getTodayTodos,
    getUrgentTodos,
    getStats,

    // 로컬 유틸리티 함수들 (fallback용)
    getTodayTodosLocal: () => {
      const today = new Date().toISOString().split('T')[0];
      return state.todos.filter(todo => todo.dueDate === today);
    },
    
    getUrgentTodosLocal: () => {
      return state.todos.filter(todo => 
        (todo.priority === 'critical' || todo.priority === 'high') && 
        todo.status !== 'completed'
      );
    },
    
    getTodosByDate: (date) => {
      return state.todos.filter(todo => todo.dueDate === date);
    },
    
    getStatsLocal: () => {
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