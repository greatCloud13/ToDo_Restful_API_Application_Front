import React, { useState, useEffect } from 'react';
import { 
  Settings,
  MessageSquare,
  Bug,
  CheckCircle,
  Calendar,
  TrendingUp,
  Activity,
  LogOut,
  Send,
  ChevronRight,
  Clock,
  Check,
  X,
  Bell
} from 'lucide-react';

const QnaPage = ({ onPageChange, currentPage = 'qna', onLogout }) => {
  const [activeTab, setActiveTab] = useState('qna');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // 사용자 정보 (Dashboard와 동일한 방식)
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
  
  // QNA 상태
  const [qnaList, setQnaList] = useState([
    {
      id: 1,
      title: '할일 삭제는 어떻게 하나요?',
      content: '할일을 삭제하는 방법을 알고 싶습니다.',
      author: 'admin',
      status: 'answered',
      createdAt: '2025-09-05 14:30',
      answer: '할일 카드 우측의 휴지통 아이콘을 클릭하시면 삭제됩니다.',
      answeredAt: '2025-09-05 15:20'
    },
    {
      id: 2,
      title: '캘린더 뷰에서 날짜 변경이 안돼요',
      content: '캘린더에서 할일의 날짜를 드래그로 변경하려고 하는데 작동하지 않습니다.',
      author: 'admin',
      status: 'pending',
      createdAt: '2025-09-06 10:15',
      answer: null
    }
  ]);

  const [selectedQna, setSelectedQna] = useState(null);
  const [newQna, setNewQna] = useState({
    title: '',
    content: ''
  });

    // 답변 작성 상태 추가
  const [answerForm, setAnswerForm] = useState({
    qnaId: null,
    answer: ''
  });

  // 버그 제보 상태
  const [bugReports, setBugReports] = useState([
    {
      id: 1,
      title: '로그인 후 화면이 깜빡입니다',
      content: '로그인하면 메인 화면이 1초 정도 깜빡이는 현상이 있습니다.',
      author: 'admin',
      status: 'fixed',
      createdAt: '2025-09-03 11:20',
      response: '다음 업데이트에서 수정되었습니다.'
    },
    {
      id: 2,
      title: '필터 적용 시 앱이 느려집니다',
      content: '여러 필터를 동시에 적용하면 앱 반응속도가 매우 느려집니다.',
      author: 'admin',
      status: 'in-progress',
      createdAt: '2025-09-06 09:30',
      response: '원인을 파악하여 수정 중입니다.'
    }
  ]);

  const [selectedBug, setSelectedBug] = useState(null);
  const [newBug, setNewBug] = useState({
    title: '',
    content: ''
  });

  // 관리자 여부 확인
  const isAdmin = user.authorities.includes('ROLE_ADMIN');

  // 답변 대기 카운트
  const pendingQnaCount = qnaList.filter(q => q.status === 'pending').length;
  const pendingBugCount = bugReports.filter(b => b.status === 'reported').length;

  const menuItems = [
    { id: 'dashboard', name: '대시보드', icon: Activity },
    { id: 'todos', name: '할 일 관리', icon: CheckCircle },
    { id: 'calendar', name: '캘린더', icon: Calendar },
    { id: 'analytics', name: '통계', icon: TrendingUp },
    { id: 'qna', name: '고객지원', icon: Settings }
  ];

  const settingsTabs = [
    { id: 'qna', name: 'Q&A', icon: MessageSquare },
    { id: 'bug', name: '버그제보', icon: Bug }
  ];

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

  const handleMenuClick = (menuId) => {
    if (onPageChange && typeof onPageChange === 'function') {
      onPageChange(menuId);
    }
  };

  const handleSubmitQna = (e) => {
    e.preventDefault();
    if (!newQna.title.trim() || !newQna.content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    const qna = {
      id: qnaList.length + 1,
      ...newQna,
      author: user.username,
      status: 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      answer: null
    };

    setQnaList([qna, ...qnaList]);
    setNewQna({
      title: '',
      content: ''
    });
    alert('문의가 등록되었습니다.');
  };

  // 답변 작성 핸들러 추가
  const handleAnswerSubmit = (qnaId) => {
    if (!answerForm.answer.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }

    setQnaList(prevList => 
      prevList.map(qna => 
        qna.id === qnaId 
          ? {
              ...qna,
              status: 'answered',
              answer: answerForm.answer,
              answeredAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
              answeredBy: user.username
            }
          : qna
      )
    );

    setAnswerForm({ qnaId: null, answer: '' });
    alert('답변이 등록되었습니다.');
  };

  const handleSubmitBug = (e) => {
    e.preventDefault();
    if (!newBug.title.trim() || !newBug.content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    const bug = {
      id: bugReports.length + 1,
      ...newBug,
      author: user.username,
      status: 'reported',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      response: null
    };

    setBugReports([bug, ...bugReports]);
    setNewBug({
      title: '',
      content: ''
    });
    alert('버그가 제보되었습니다.');
  };

  // 버그 응답 작성 핸들러 추가
  const handleBugResponseSubmit = (bugId, newStatus) => {
    if (!answerForm.answer.trim()) {
      alert('응답 내용을 입력해주세요.');
      return;
    }

    setBugReports(prevList => 
      prevList.map(bug => 
        bug.id === bugId 
          ? {
              ...bug,
              status: newStatus,
              response: answerForm.answer
            }
          : bug
      )
    );

    setAnswerForm({ qnaId: null, answer: '' });
    alert('응답이 등록되었습니다.');
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: '답변대기', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      answered: { text: '답변완료', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
      reported: { text: '제보됨', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      'in-progress': { text: '수정중', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      fixed: { text: '수정완료', color: 'bg-green-500/20 text-green-400 border-green-500/30' }
    };
    return badges[status] || badges.pending;
  };

  const renderQnaTab = () => {
    return (
      <div className="space-y-6">
        {/* 관리자 알림 추가 */}
        {isAdmin && pendingQnaCount > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center">
            <Bell className="w-5 h-5 text-yellow-400 mr-2" />
            <span className="text-yellow-400 font-medium">
              답변 대기중인 문의가 {pendingQnaCount}건 있습니다.
            </span>
          </div>
        </div>
        )}

        {/* 새 문의 작성 - 관리자가 아닐 때만 표시 */}
        {!isAdmin && (
          <div className="bg-white/5 rounded-lg p-6 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
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
                  placeholder="문의 제목을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">내용</label>
                <textarea
                  value={newQna.content}
                  onChange={(e) => setNewQna({...newQna, content: e.target.value})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows="5"
                  placeholder="문의 내용을 상세히 작성해주세요"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center font-medium"
              >
                <Send className="w-5 h-5 mr-2" />
                문의하기
              </button>
            </form>
          </div>
        )}

        {/* 문의 목록 */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white mb-3">문의 내역</h3>
          {qnaList.map(qna => {
            const statusBadge = getStatusBadge(qna.status);
            return (
              <div
                key={qna.id}
                onClick={() => setSelectedQna(qna)}
                className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs border ${statusBadge.color}`}>
                        {statusBadge.text}
                      </span>
                    </div>
                    <h4 className="text-white font-medium mb-1">{qna.title}</h4>
                    <p className="text-gray-400 text-sm line-clamp-2">{qna.content}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {qna.createdAt}
                  </span>
                  <span>{qna.author}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 상세 모달 */}
        {selectedQna && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedQna(null)}>
            <div className="bg-slate-900 rounded-2xl border border-white/20 shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs border ${getStatusBadge(selectedQna.status).color}`}>
                        {getStatusBadge(selectedQna.status).text}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">{selectedQna.title}</h3>
                  </div>
                  <button onClick={() => setSelectedQna(null)} className="text-gray-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="bg-white/5 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-400 text-sm">{selectedQna.author}</span>
                    <span className="text-gray-400 text-sm">{selectedQna.createdAt}</span>
                  </div>
                  <p className="text-white whitespace-pre-wrap">{selectedQna.content}</p>
                </div>

                {selectedQna.answer ? (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Check className="w-5 h-5 text-green-400 mr-2" />
                      <span className="text-green-400 font-medium">답변</span>
                    </div>
                    <p className="text-white mb-2">{selectedQna.answer}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{selectedQna.answeredBy}</span>
                      <span>{selectedQna.answeredAt}</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {isAdmin ? (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                        <p className="text-yellow-400 mb-3 font-medium">관리자 답변 작성</p>
                        <textarea
                          value={answerForm.qnaId === selectedQna.id ? answerForm.answer : ''}
                          onChange={(e) => setAnswerForm({ qnaId: selectedQna.id, answer: e.target.value })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                          rows="4"
                          placeholder="답변 내용을 입력하세요..."
                        />
                        <button
                          onClick={() => handleAnswerSubmit(selectedQna.id)}
                          className="mt-3 w-full py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                        >
                          답변 등록
                        </button>
                      </div>
                    ) : (
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
                        <p className="text-yellow-400">답변 대기 중입니다</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBugTab = () => {
    return (
      <div className="space-y-6">
        {/* 관리자 알림 추가 */}
        {isAdmin && pendingBugCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center">
            <Bell className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-400 font-medium">
              확인이 필요한 버그가 {pendingBugCount}건 있습니다.
            </span>
          </div>
        </div>
        )}

        {/* 새 버그 제보 - !isAdmin 조건 추가 */}
        {!isAdmin && (
        <div className="bg-white/5 rounded-lg p-6 border border-white/10">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Bug className="w-5 h-5 mr-2" />
            버그 제보하기
          </h3>
          <form onSubmit={handleSubmitBug} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">제목</label>
              <input
                type="text"
                value={newBug.title}
                onChange={(e) => setNewBug({...newBug, title: e.target.value})}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="버그 제목을 입력하세요"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">버그 설명</label>
              <textarea
                value={newBug.content}
                onChange={(e) => setNewBug({...newBug, content: e.target.value})}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                rows="5"
                placeholder="발견한 버그를 상세히 설명해주세요"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:from-red-600 hover:to-orange-600 transition-all flex items-center justify-center font-medium"
            >
              <Bug className="w-5 h-5 mr-2" />
              버그 제보하기
            </button>
          </form>
        </div>
        )}

        {/* 버그 목록 */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white mb-3">제보 내역</h3>
          {bugReports.map(bug => {
            const statusBadge = getStatusBadge(bug.status);
            return (
              <div
                key={bug.id}
                onClick={() => setSelectedBug(bug)}
                className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs border ${statusBadge.color}`}>
                        {statusBadge.text}
                      </span>
                    </div>
                    <h4 className="text-white font-medium mb-1">{bug.title}</h4>
                    <p className="text-gray-400 text-sm line-clamp-2">{bug.content}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {bug.createdAt}
                  </span>
                  <span>{bug.author}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 상세 모달 */}
        {selectedBug && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedBug(null)}>
            <div className="bg-slate-900 rounded-2xl border border-white/20 shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs border ${getStatusBadge(selectedBug.status).color}`}>
                        {getStatusBadge(selectedBug.status).text}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">{selectedBug.title}</h3>
                  </div>
                  <button onClick={() => setSelectedBug(null)} className="text-gray-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="bg-white/5 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-400 text-sm">{selectedBug.author}</span>
                    <span className="text-gray-400 text-sm">{selectedBug.createdAt}</span>
                  </div>
                  <p className="text-white whitespace-pre-wrap">{selectedBug.content}</p>
                </div>

                {selectedBug.response ? (
                  <div className={`${selectedBug.status === 'fixed' ? 'bg-green-500/10 border-green-500/20' : 'bg-purple-500/10 border-purple-500/20'} border rounded-lg p-4`}>
                    <div className="flex items-center mb-2">
                      <Check className={`w-5 h-5 ${selectedBug.status === 'fixed' ? 'text-green-400' : 'text-purple-400'} mr-2`} />
                      <span className={`${selectedBug.status === 'fixed' ? 'text-green-400' : 'text-purple-400'} font-medium`}>
                        {selectedBug.status === 'fixed' ? '수정 완료' : '진행 상황'}
                      </span>
                    </div>
                    <p className="text-white">{selectedBug.response}</p>
                  </div>
                ) : (
                  <>
                    {isAdmin ? (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                        <p className="text-blue-400 mb-3 font-medium">관리자 응답 작성</p>
                        <textarea
                          value={answerForm.qnaId === selectedBug.id ? answerForm.answer : ''}
                          onChange={(e) => setAnswerForm({ qnaId: selectedBug.id, answer: e.target.value })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="4"
                          placeholder="진행 상황이나 응답을 입력하세요..."
                        />
                        <div className="flex space-x-2 mt-3">
                          <button
                            onClick={() => handleBugResponseSubmit(selectedBug.id, 'in-progress')}
                            className="flex-1 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                          >
                            수정중으로 표시
                          </button>
                          <button
                            onClick={() => handleBugResponseSubmit(selectedBug.id, 'fixed')}
                            className="flex-1 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                          >
                            수정완료로 표시
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                        <p className="text-blue-400">확인 중입니다</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'qna':
        return renderQnaTab();
      case 'bug':
        return renderBugTab();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 네비게이션 헤더 */}
      <nav className="bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">ToDo App</h1>
              </div>

              {/* 대메뉴 */}
              <div className="hidden md:flex space-x-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMenuClick(item.id)}
                      className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                        isActive 
                          ? 'bg-white/20 text-white shadow-lg' 
                          : 'text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm text-white font-medium">{user.username}</p>
                  <p className="text-xs text-gray-400">{user.authorities.join(', ')}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  title="로그아웃"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
                  <MessageSquare className="w-8 h-8 mr-3" />
                  고객지원
                </h2>
                <p className="text-gray-300">문의사항을 남기거나 버그를 제보해주세요</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-mono text-white">
                  {currentTime.toLocaleTimeString('ko-KR')}
                </div>
                <div className="text-sm text-gray-400">
                  {currentTime.toLocaleDateString('ko-KR', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    weekday: 'long'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 사이드바 */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-4">
              <div className="space-y-1">
                {settingsTabs.map(tab => {
                  const Icon = tab.icon;
                  const count = tab.id === 'qna' ? pendingQnaCount : pendingBugCount;
                  const showBadge = isAdmin && count > 0;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all ${
                        activeTab === tab.id 
                          ? 'bg-white/20 text-white' 
                          : 'text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.name}</span>
                      {showBadge && (
                        <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                          {count}
                        </span>
                      )}
                      {activeTab === tab.id && !showBadge && (
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 콘텐츠 영역 */}
          <div className="lg:col-span-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>

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