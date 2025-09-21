import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../contexts/AppContext';

export const useCalendar = (selectedDate) => {
  const {
    todos,
    getTodosByDate,
    getUrgentTodos,
    getStats
  } = useAppContext();

  // 로컬 상태
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

  // 대시보드 데이터 로드 (통계, 긴급 할일)
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [statsData, urgentData] = await Promise.all([
        getStats(),
        getUrgentTodos()
      ]);
      
      setStats(statsData);
      setUrgentTodos(urgentData);
    } catch (err) {
      console.error('대시보드 데이터 로드 실패:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [getStats, getUrgentTodos]);

  // 선택된 날짜의 할일 로드
  const loadSelectedDateTodos = useCallback(async (date) => {
    if (!date) return;
    
    const dateString = formatDateString(date);
    
    try {
      const dateTodos = await getTodosByDate(dateString);
      setSelectedDateTodos(dateTodos);
    } catch (err) {
      console.error('날짜별 할일 로드 실패:', err);
      setError(err.message);
    }
  }, [getTodosByDate]);

  // 날짜 포맷팅 헬퍼
  const formatDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 초기 로드 및 todos 변경 시 대시보드 데이터 재로드
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData, todos]);

  // 선택된 날짜 변경 시 해당 날짜 할일 로드
  useEffect(() => {
    loadSelectedDateTodos(selectedDate);
  }, [selectedDate, loadSelectedDateTodos, todos]);

  return {
    selectedDateTodos,
    stats,
    urgentTodos,
    isLoading,
    error,
    refresh: loadDashboardData
  };
};