// hooks/useSupport.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { supportService } from '../services/supportService';

export const useSupport = (initialParams = {}) => {
  const mountedRef = useRef(true);
  const loadingRef = useRef(false);

  // 초기 파라미터 설정
  const [params, setParams] = useState({
    page: 0,
    size: 20,
    sort: 'createdAt,desc',
    ...initialParams
  });

  // 상태 관리
  const [state, setState] = useState({
    qnaList: [],
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    loading: false,
    error: null,
    lastUpdated: null,
    searchQuery: '',
    filterStatus: 'all' // all, pending, answered
  });

  // 개별 작업 상태 관리
  const [operationState, setOperationState] = useState({
    creating: false,
    updating: false,
    deleting: false,
    loadingDetail: false
  });

  // QNA 목록 조회
  const fetchQnaList = useCallback(async (customParams = {}) => {
    if (loadingRef.current) {
      console.log('이미 로딩 중이므로 중복 호출 방지');
      return;
    }

    loadingRef.current = true;
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const fetchParams = { ...params, ...customParams };
      console.log('📋 QNA 목록 조회 시작:', fetchParams);
      
      const response = await supportService.getQnaList(fetchParams);
      
      if (!mountedRef.current) return;

      // 응답 데이터 구조 확인 및 처리
      const qnaData = {
        qnaList: response.content || [],
        totalElements: response.totalElements || 0,
        totalPages: response.totalPages || 0,
        currentPage: response.number || 0
      };

      setState(prev => ({
        ...prev,
        ...qnaData,
        loading: false,
        error: null,
        lastUpdated: new Date()
      }));

      console.log('✅ QNA 목록 조회 성공:', qnaData);
      return qnaData;

    } catch (error) {
      console.error('❌ QNA 목록 조회 실패:', error);
      
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'QNA 목록을 불러오는데 실패했습니다.'
        }));
      }
      throw error;
    } finally {
      loadingRef.current = false;
    }
  }, [params]);

  // QNA 등록
  const createQna = useCallback(async (qnaData) => {
    setOperationState(prev => ({ ...prev, creating: true }));
    
    try {
      console.log('📝 QNA 등록 시작:', qnaData);
      const newQna = await supportService.createQna(qnaData);
      
      if (!mountedRef.current) return;

      // 목록 새로고침
      await fetchQnaList();
      
      console.log('✅ QNA 등록 성공:', newQna);
      return newQna;

    } catch (error) {
      console.error('❌ QNA 등록 실패:', error);
      
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          error: error.message || 'QNA 등록에 실패했습니다.'
        }));
      }
      throw error;
    } finally {
      if (mountedRef.current) {
        setOperationState(prev => ({ ...prev, creating: false }));
      }
    }
  }, [fetchQnaList]);

  // QNA 상세 조회
  const getQnaDetail = useCallback(async (id) => {
    setOperationState(prev => ({ ...prev, loadingDetail: true }));
    
    try {
      console.log('🔍 QNA 상세 조회 시작:', id);
      const detail = await supportService.getQnaDetail(id);
      
      console.log('✅ QNA 상세 조회 성공:', detail);
      return detail;

    } catch (error) {
      console.error('❌ QNA 상세 조회 실패:', error);
      
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          error: error.message || 'QNA 상세 정보를 불러오는데 실패했습니다.'
        }));
      }
      throw error;
    } finally {
      if (mountedRef.current) {
        setOperationState(prev => ({ ...prev, loadingDetail: false }));
      }
    }
  }, []);

  // 답변 등록 (관리자용)
  const createAnswer = useCallback(async (id, answer) => {
    setOperationState(prev => ({ ...prev, updating: true }));
    
    try {
      console.log('💬 답변 등록 시작:', { id, answer });
      const updatedQna = await supportService.createAnswer(id, answer);
      
      if (!mountedRef.current) return;

      // 목록 업데이트 (로컬 상태 업데이트)
      setState(prev => ({
        ...prev,
        qnaList: prev.qnaList.map(qna => 
          qna.id === id 
            ? { ...updatedQna }
            : qna
        )
      }));

      console.log('✅ 답변 등록 성공:', updatedQna);
      return updatedQna;

    } catch (error) {
      console.error('❌ 답변 등록 실패:', error);
      
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          error: error.message || '답변 등록에 실패했습니다.'
        }));
      }
      throw error;
    } finally {
      if (mountedRef.current) {
        setOperationState(prev => ({ ...prev, updating: false }));
      }
    }
  }, []);

  // QNA 삭제
  const deleteQna = useCallback(async (id) => {
    if (!window.confirm('정말로 이 문의를 삭제하시겠습니까?')) {
      return;
    }

    setOperationState(prev => ({ ...prev, deleting: true }));
    
    try {
      console.log('🗑️ QNA 삭제 시작:', id);
      await supportService.deleteQna(id);
      
      if (!mountedRef.current) return;

      // 로컬 상태에서 삭제
      setState(prev => ({
        ...prev,
        qnaList: prev.qnaList.filter(qna => qna.id !== id),
        totalElements: Math.max(0, prev.totalElements - 1)
      }));

      console.log('✅ QNA 삭제 성공');
      return true;

    } catch (error) {
      console.error('❌ QNA 삭제 실패:', error);
      
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          error: error.message || 'QNA 삭제에 실패했습니다.'
        }));
      }
      throw error;
    } finally {
      if (mountedRef.current) {
        setOperationState(prev => ({ ...prev, deleting: false }));
      }
    }
  }, []);

  // 검색 쿼리 설정
  const setSearchQuery = useCallback((query) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  // 필터 상태 설정
  const setFilterStatus = useCallback((status) => {
    setState(prev => ({ ...prev, filterStatus: status }));
  }, []);

  // 페이지 변경
  const changePage = useCallback((newPage) => {
    setParams(prev => ({ ...prev, page: newPage }));
  }, []);

  // 페이지 크기 변경
  const changePageSize = useCallback((newSize) => {
    setParams(prev => ({ ...prev, page: 0, size: newSize }));
  }, []);

  // 정렬 변경
  const changeSort = useCallback((newSort) => {
    setParams(prev => ({ ...prev, sort: newSort }));
  }, []);

  // 필터링된 QNA 목록 계산
  const getFilteredList = useCallback(() => {
    let filtered = [...state.qnaList];
    
    // 검색 필터 적용
    if (state.searchQuery) {
      filtered = supportService.searchQna(filtered, state.searchQuery);
    }
    
    // 상태 필터 적용
    if (state.filterStatus !== 'all') {
      filtered = supportService.filterByStatus(filtered, state.filterStatus);
    }
    
    return filtered;
  }, [state.qnaList, state.searchQuery, state.filterStatus]);

  // 통계 계산
  const getStatistics = useCallback(() => {
    const total = state.qnaList.length;
    const answered = state.qnaList.filter(q => q.isAnswered).length;
    const pending = total - answered;
    
    return {
      total,
      answered,
      pending,
      answerRate: total > 0 ? Math.round((answered / total) * 100) : 0
    };
  }, [state.qnaList]);

  // 새로고침
  const refresh = useCallback(() => {
    console.log('🔄 QNA 목록 새로고침');
    return fetchQnaList();
  }, [fetchQnaList]);

  // 초기 데이터 로드
  useEffect(() => {
    mountedRef.current = true;
    fetchQnaList();

    return () => {
      mountedRef.current = false;
    };
  }, [params.page, params.size, params.sort]);

  // cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    // 상태
    ...state,
    ...operationState,
    
    // 계산된 값
    filteredList: getFilteredList(),
    statistics: getStatistics(),
    
    // 액션
    fetchQnaList,
    createQna,
    getQnaDetail,
    createAnswer,
    deleteQna,
    setSearchQuery,
    setFilterStatus,
    changePage,
    changePageSize,
    changeSort,
    refresh,
    
    // 페이지네이션 정보
    pagination: {
      currentPage: state.currentPage,
      totalPages: state.totalPages,
      totalElements: state.totalElements,
      pageSize: params.size,
      hasNext: state.currentPage < state.totalPages - 1,
      hasPrevious: state.currentPage > 0
    }
  };
};