import React, { useState, useEffect } from 'react';
import Navigation from '../../components/common/Navigation';
import { useSupport } from '../../hooks/useSupport';
import { 
  MessageSquare,
  Send,
  Clock,
  Check,
  X,
  Bell,
  User,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const QnaPage = ({ onPageChange, currentPage = 'qna', onLogout, onTodoClick }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // useSupport 훅 사용
  const {
    qnaList,
    loading,
    error,
    creating,
    updating,
    deleting,
    filteredList,
    statistics,
    searchQuery,
    filterStatus,
    pagination,
    fetchQnaList,
    createQna,
    createAnswer,
    deleteQna,
    setSearchQuery,
    setFilterStatus,
    changePage,
    refresh
  } = useSupport();
  
  // 사용자 정보
  const user = {
    username: window.authTokens?.username || "admin",
    authorities: window.authTokens?.authorities || ["ROLE_ADMIN"]
  };

  // 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [selectedQna, setSelectedQna] = useState(null);
  const [newQna, setNewQna] = useState({
    title: '',
    content: ''
  });

  // 답변 작성 상태
  const [answerForm, setAnswerForm] = useState({
    qnaId: null,
    answer: ''
  });

  // 관리자 여부 확인
  const isAdmin = user.authorities.includes('ROLE_ADMIN');

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/\. /g, '-').replace('.', '').replace(' ', ' ');
  };

  const handleLogout = async () => {
    try {
      if (onLogout && typeof onLogout === 'function') {
        await onLogout();
      } else {
        window.authTokens = null;
        localStorage.removeItem('authTokens');
        window.location.reload();
      }
    } catch (error) {
      console.error('로그아웃 실패:', error);
      window.location.reload();
    }
  };

  const handleSubmitQna = async (e) => {
    e.preventDefault();
    if (!newQna.title.trim() || !newQna.content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    try {
      await createQna(newQna);
      setNewQna({ title: '', content: '' });
      alert('문의가 등록되었습니다.');
    } catch (error) {
      alert('문의 등록에 실패했습니다: ' + error.message);
    }
  };

  // 답변 작성 핸들러
  const handleAnswerSubmit = async (qnaId) => {
    if (!answerForm.answer.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }

    try {
      const updatedQna = await createAnswer(qnaId, answerForm.answer);
      
      // 선택된 QNA 업데이트
      if (selectedQna && selectedQna.id === qnaId) {
        setSelectedQna(updatedQna);
      }
      
      setAnswerForm({ qnaId: null, answer: '' });
      alert('답변이 등록되었습니다.');
    } catch (error) {
      alert('답변 등록에 실패했습니다: ' + error.message);
    }
  };

  // QNA 삭제 핸들러
  const handleDeleteQna = async (id) => {
    try {
      await deleteQna(id);
      if (selectedQna && selectedQna.id === id) {
        setSelectedQna(null);
      }
      alert('문의가 삭제되었습니다.');
    } catch (error) {
      alert('삭제에 실패했습니다: ' + error.message);
    }
  };

  const getStatusBadge = (isAnswered) => {
    if (isAnswered) {
      return { 
        text: '답변완료', 
        color: 'bg-green-500/20 text-green-400 border-green-500/30' 
      };
    }
    return { 
      text: '답변대기', 
      color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 네비게이션 헤더 */}
      <Navigation
        currentPage={currentPage}
        onPageChange={onPageChange}
        onLogout={handleLogout}
        onTodoClick={onTodoClick}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
                  <MessageSquare className="w-8 h-8 mr-3" />
                  고객문의
                </h2>
                <p className="text-gray-300">궁금한 사항을 문의해주세요</p>
              </div>
              
              {/* 통계 요약 */}
              <div className="flex items-center space-x-4">
                <div className="text-center bg-white/5 rounded-lg px-4 py-2">
                  <div className="text-2xl font-bold text-white">{statistics.total}</div>
                  <div className="text-xs text-gray-400">전체 문의</div>
                </div>
                <div className="text-center bg-yellow-500/10 rounded-lg px-4 py-2 border border-yellow-500/30">
                  <div className="text-2xl font-bold text-yellow-400">{statistics.pending}</div>
                  <div className="text-xs text-yellow-400">답변대기</div>
                </div>
                <div className="text-center bg-green-500/10 rounded-lg px-4 py-2 border border-green-500/30">
                  <div className="text-2xl font-bold text-green-400">{statistics.answered}</div>
                  <div className="text-xs text-green-400">답변완료</div>
                </div>
                <button
                  onClick={refresh}
                  disabled={loading}
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  title="새로고침"
                >
                  <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-red-400">{error}</span>
            </div>
          </div>
        )}

        {/* 관리자 알림 */}
        {isAdmin && statistics.pending > 0 && (
          <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center">
              <Bell className="w-5 h-5 text-yellow-400 mr-2 animate-pulse" />
              <span className="text-yellow-400 font-medium">
                답변 대기중인 문의가 {statistics.pending}건 있습니다.
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽: 새 문의 작성 (일반 사용자만) */}
          {!isAdmin && (
            <div className="lg:col-span-1">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 sticky top-24">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Send className="w-5 h-5 mr-2" />
                  새 문의 작성
                </h3>
                <form onSubmit={handleSubmitQna} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">제목</label>
                    <input
                      type="text"
                      value={newQna.title}
                      onChange={(e) => setNewQna({...newQna, title: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="문의 제목"
                      disabled={creating}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">내용</label>
                    <textarea
                      value={newQna.content}
                      onChange={(e) => setNewQna({...newQna, content: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows="8"
                      placeholder="문의 내용을 상세히 작성해주세요"
                      disabled={creating}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creating}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        등록 중...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        문의하기
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 오른쪽: 문의 목록 */}
          <div className={isAdmin ? "lg:col-span-3" : "lg:col-span-2"}>
            {/* 검색 & 필터 */}
            <div className="mb-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="문의 검색..."
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all" className="bg-gray-800">전체</option>
                    <option value="pending" className="bg-gray-800">답변대기</option>
                    <option value="answered" className="bg-gray-800">답변완료</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 로딩 상태 */}
            {loading && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-12 border border-white/20 text-center">
                <RefreshCw className="w-16 h-16 mx-auto mb-4 text-purple-400 animate-spin" />
                <p className="text-gray-400 text-lg">문의 목록을 불러오는 중...</p>
              </div>
            )}

            {/* 문의 목록 */}
            {!loading && (
              <div className="space-y-4">
                {filteredList.length > 0 ? (
                  filteredList.map(qna => {
                    const statusBadge = getStatusBadge(qna.isAnswered);
                    return (
                      <div
                        key={qna.id}
                        onClick={() => setSelectedQna(qna)}
                        className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusBadge.color}`}>
                                {statusBadge.text}
                              </span>
                              {qna.isAnswered && (
                                <div className="flex items-center text-green-400 text-xs">
                                  <Check className="w-3 h-3 mr-1" />
                                  답변됨
                                </div>
                              )}
                            </div>
                            <h4 className="text-white font-semibold text-lg mb-2 group-hover:text-purple-300 transition-colors">
                              {qna.title}
                            </h4>
                            <p className="text-gray-400 text-sm line-clamp-2 mb-3">{qna.content}</p>
                            <div className="flex items-center justify-between text-xs text-gray-400">
                              <div className="flex items-center space-x-4">
                                <span className="flex items-center">
                                  <User className="w-3 h-3 mr-1" />
                                  {qna.owner}
                                </span>
                                <span className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatDate(qna.createdAt)}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                {qna.isAnswered && (
                                  <span className="text-green-400">답변 확인 →</span>
                                )}
                                {isAdmin && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteQna(qna.id);
                                    }}
                                    disabled={deleting}
                                    className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                    title="삭제"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-400" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-12 border border-white/20 text-center">
                    <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
                    <p className="text-gray-400 text-lg">
                      {searchQuery || filterStatus !== 'all' ? '검색 결과가 없습니다' : '아직 문의가 없습니다'}
                    </p>
                    {!isAdmin && !searchQuery && filterStatus === 'all' && (
                      <p className="text-gray-500 text-sm mt-2">
                        첫 번째 문의를 작성해보세요
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 페이지네이션 */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex justify-center space-x-2">
                <button
                  onClick={() => changePage(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevious || loading}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  이전
                </button>
                <span className="px-4 py-2 text-white">
                  {pagination.currentPage + 1} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => changePage(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext || loading}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 상세 모달 */}
      {selectedQna && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedQna(null)}>
          <div className="bg-slate-900 rounded-2xl border border-white/20 shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 md:p-8">
              {/* 헤더 */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(selectedQna.isAnswered).color}`}>
                      {getStatusBadge(selectedQna.isAnswered).text}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteQna(selectedQna.id)}
                        disabled={deleting}
                        className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3 inline mr-1" />
                        삭제
                      </button>
                    )}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{selectedQna.title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <span className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {selectedQna.owner}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDate(selectedQna.createdAt)}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedQna(null)} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* 문의 내용 */}
              <div className="bg-white/5 rounded-lg p-6 mb-6 border border-white/10">
                <h4 className="text-purple-400 font-medium mb-3">문의 내용</h4>
                <p className="text-white whitespace-pre-wrap leading-relaxed">{selectedQna.content}</p>
              </div>

              {/* 답변 영역 */}
              {selectedQna.answer ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <Check className="w-5 h-5 text-green-400 mr-2" />
                    <span className="text-green-400 font-semibold">답변</span>
                  </div>
                  <p className="text-white mb-4 leading-relaxed whitespace-pre-wrap">{selectedQna.answer}</p>
                  <div className="flex items-center justify-between text-sm text-gray-400 pt-3 border-t border-green-500/20">
                    <span className="flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      {selectedQna.respondent || 'Admin'}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDate(selectedQna.answeredAt)}
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {isAdmin ? (
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <Send className="w-5 h-5 text-purple-400 mr-2" />
                        <span className="text-purple-400 font-semibold">답변 작성</span>
                      </div>
                      <textarea
                        value={answerForm.qnaId === selectedQna.id ? answerForm.answer : ''}
                        onChange={(e) => setAnswerForm({ qnaId: selectedQna.id, answer: e.target.value })}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                        rows="6"
                        placeholder="답변 내용을 입력하세요..."
                        disabled={updating}
                      />
                      <button
                        onClick={() => handleAnswerSubmit(selectedQna.id)}
                        disabled={updating}
                        className="mt-4 w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updating ? (
                          <>
                            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                            등록 중...
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5 mr-2" />
                            답변 등록
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 text-center">
                      <Clock className="w-12 h-12 mx-auto mb-3 text-yellow-400" />
                      <p className="text-yellow-400 font-medium">답변 대기 중입니다</p>
                      <p className="text-gray-400 text-sm mt-2">곧 답변 드리겠습니다</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default QnaPage;