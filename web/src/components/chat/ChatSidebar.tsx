'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore, ChatConversation } from '@/lib/store';

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatSidebar({ isOpen, onClose }: ChatSidebarProps) {
  const {
    conversations,
    currentConversationId,
    createConversation,
    setCurrentConversation,
    deleteConversation,
    clearConversations,
  } = useChatStore();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '오늘';
    if (days === 1) return '어제';
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const handleNewChat = () => {
    createConversation();
  };

  const handleDeleteConversation = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('이 대화를 삭제하시겠습니까?')) {
      deleteConversation(id);
    }
  };

  const handleClearAll = () => {
    if (confirm('모든 대화 기록을 삭제하시겠습니까?')) {
      clearConversations();
    }
  };

  // Group conversations by date
  const groupedConversations = conversations.reduce((groups, conv) => {
    const dateKey = formatDate(conv.updatedAt);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(conv);
    return groups;
  }, {} as Record<string, ChatConversation[]>);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-72 bg-gray-50 border-r z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">대화 기록</h2>
                <button
                  onClick={onClose}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* New Chat Button */}
              <button
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                새 대화 시작
              </button>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto p-3">
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-3">💬</div>
                  <p className="text-sm">대화 기록이 없습니다</p>
                  <p className="text-xs mt-1">새 대화를 시작해보세요!</p>
                </div>
              ) : (
                Object.entries(groupedConversations).map(([date, convs]) => (
                  <div key={date} className="mb-4">
                    <div className="text-xs font-medium text-gray-500 px-2 mb-2">{date}</div>
                    <div className="space-y-1">
                      {convs.map((conv) => (
                        <motion.button
                          key={conv.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() => setCurrentConversation(conv.id)}
                          className={`w-full text-left p-3 rounded-xl transition group ${
                            currentConversationId === conv.id
                              ? 'bg-blue-100 text-blue-900'
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate text-sm">
                                {conv.title}
                              </div>
                              {conv.messages.length > 0 && (
                                <div className="text-xs text-gray-500 truncate mt-1">
                                  {conv.messages[conv.messages.length - 1].content.slice(0, 40)}
                                  {conv.messages[conv.messages.length - 1].content.length > 40 ? '...' : ''}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={(e) => handleDeleteConversation(e, conv.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-red-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {conversations.length > 0 && (
              <div className="p-3 border-t bg-white">
                <button
                  onClick={handleClearAll}
                  className="w-full text-sm text-red-600 hover:text-red-700 hover:bg-red-50 py-2 rounded-lg transition"
                >
                  모든 대화 삭제
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
