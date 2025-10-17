// services/supportService.js
import { API_ENDPOINTS } from '../config/api';

class SupportService {
  constructor() {
    this.baseURL = API_ENDPOINTS.SUPPORT;
  }

  // HTTP 요청 헬퍼 메서드
  async makeRequest(endpoint, options = {}) {
    const token = window.authTokens?.accessToken;
    
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    };

    if (token) {
      defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    const finalOptions = { ...defaultOptions, ...options };
    
    // body가 있고 Content-Type이 application/json인 경우 JSON.stringify
    if (finalOptions.body && finalOptions.headers['Content-Type'] === 'application/json') {
      finalOptions.body = JSON.stringify(finalOptions.body);
    }
    
    try {
      console.log(`Support API 요청: ${endpoint}`, finalOptions);
      
      const response = await fetch(`${this.baseURL}${endpoint}`, finalOptions);

      // 204 No Content 처리
      if (response.status === 204) {
        return null;
      }

      // 에러 처리
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // JSON 파싱 실패시 기본 메시지 사용
        }
        throw new Error(errorMessage);
      }

      // 응답 본문이 있는 경우만 JSON 파싱
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`Support API 응답: ${endpoint}`, data);
        return data;
      }

      // Boolean 응답 처리 (DELETE의 경우)
      const text = await response.text();
      if (text === 'true' || text === 'false') {
        return text === 'true';
      }

      return text;
    } catch (error) {
      console.error(`Support API 오류 [${endpoint}]:`, error);
      throw error;
    }
  }

  // QNA 목록 조회
  async getQnaList(params = {}) {
    try {
      const { page = 0, size = 20, sort = 'createdAt,desc' } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sort
      });
      
      return await this.makeRequest(`?${queryParams.toString()}`);
    } catch (error) {
      console.error('QNA 목록 조회 실패:', error);
      throw error;
    }
  }

  // QNA 등록
  async createQna(qnaData) {
    try {
      const { title, content } = qnaData;
      
      if (!title || !content) {
        throw new Error('제목과 내용은 필수입니다.');
      }

      return await this.makeRequest('', {
        method: 'POST',
        body: { title, content }
      });
    } catch (error) {
      console.error('QNA 등록 실패:', error);
      throw error;
    }
  }

  // QNA 상세 조회
  async getQnaDetail(id) {
    try {
      if (!id) {
        throw new Error('QNA ID가 필요합니다.');
      }
      
      return await this.makeRequest(`/${id}`);
    } catch (error) {
      console.error('QNA 상세 조회 실패:', error);
      throw error;
    }
  }

  // QNA 답변 등록 (관리자용)
  async createAnswer(id, answer) {
    try {
      if (!id) {
        throw new Error('QNA ID가 필요합니다.');
      }
      
      if (!answer) {
        throw new Error('답변 내용은 필수입니다.');
      }

      return await this.makeRequest(`/${id}`, {
        method: 'PATCH',
        body: { answer }
      });
    } catch (error) {
      console.error('답변 등록 실패:', error);
      throw error;
    }
  }

  // QNA 삭제
  async deleteQna(id) {
    try {
      if (!id) {
        throw new Error('QNA ID가 필요합니다.');
      }
      
      return await this.makeRequest(`/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('QNA 삭제 실패:', error);
      throw error;
    }
  }

  // 검색 기능 (프론트엔드에서 필터링)
  searchQna(qnaList, searchQuery) {
    if (!searchQuery || !searchQuery.trim()) {
      return qnaList;
    }

    const query = searchQuery.toLowerCase();
    return qnaList.filter(qna => 
      qna.title.toLowerCase().includes(query) || 
      qna.content.toLowerCase().includes(query) ||
      (qna.answer && qna.answer.toLowerCase().includes(query))
    );
  }

  // 상태별 필터링 (프론트엔드에서 필터링)
  filterByStatus(qnaList, status) {
    if (status === 'all') {
      return qnaList;
    }

    if (status === 'pending') {
      return qnaList.filter(qna => !qna.isAnswered);
    }

    if (status === 'answered') {
      return qnaList.filter(qna => qna.isAnswered);
    }

    return qnaList;
  }
}

// 싱글톤 인스턴스 생성 및 export
export const supportService = new SupportService();