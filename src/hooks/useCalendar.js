import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { calendarService } from '../services/calendarService';

export const useCalendar = (selectedDate, currentDate) => {
  const {
    todos,
    getUrgentTodos,
    getStats
  } = useAppContext();

  // 로컬 상태
  const [monthTodos, setMonthTodos] = useState([]);
  const [selectedDateTodos, setSelectedDateTodos] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    completionRate: 0
  });
  const [urgentTodos, setUrgentTodos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 월별 데이터 로드
  const loadMonthTodos = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await calendarService.getMonthTodos(currentDate);
      setMonthTodos(data);
      
      // 통계 계산 (로컬)
      const statsData = calendarService.calculateStats(data);
      setStats(statsData);
      
      // 긴급 할일 필터링 (로컬)
      const urgent = calendarService.filterUrgentTodos(data);
      setUrgentTodos(urgent);
      
    } catch (err) {
      console.error('월별 데이터 로드 실패:', err);
      setError(err.message);
      setMonthTodos([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  // 선택된 날짜 할일 필터링
  useEffect(() => {
  if (monthTodos.length > 0 && selectedDate) {
    const dateString = calendarService.formatLocalDate(selectedDate);
    const filtered = calendarService.filterTodosByDate(monthTodos, dateString);
    setSelectedDateTodos(filtered);
  }
}, [selectedDate, monthTodos]);

  // 월 변경 시 데이터 재로드
  useEffect(() => {
    loadMonthTodos();
  }, [loadMonthTodos]);

  // ✅ 날짜별 할일 가져오기 함수 (동기)
  const getTodosByDate = useCallback((dateString) => {
    return calendarService.filterTodosByDate(monthTodos, dateString);
  }, [monthTodos]);

  return {
    monthTodos,           // 전체 월 데이터
    selectedDateTodos,    // 선택된 날짜 할일
    stats,                // 통계
    urgentTodos,          // 긴급 할일
    isLoading,
    error,
    getTodosByDate,
    refresh: loadMonthTodos
  };
};

export default useCalendar;