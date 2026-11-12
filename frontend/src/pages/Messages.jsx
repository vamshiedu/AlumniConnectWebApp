import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { messageService, networkService } from '../services/auth';
import { connectSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import {
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const Messages = () => {
  const { user } = useAuth();
  const location = useLocation();
  const currentUserId = user?._id;

  const [conversations, setConversations] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New-conversation modal state
  const [showNewModal, setShowNewModal] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const messagesEndRef = useRef(null);
  const selectedRef = useRef(null);
  selectedRef.current = selectedConversation;

  const loadChats = useCallback(async () => {
    try {
      const data = await messageService.getChats();
      setConversations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoadingChats(false);
    }
  }, []);

  const loadMessages = useCallback(async (chatId) => {
    if (!chatId) return;
    try {
      const data = await messageService.getMessages(chatId);
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, []);

  // Initial load; realtime updates arrive via socket.
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Live updates: append incoming messages and refresh the conversation list.
  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;

    const handleNewMessage = ({ message, chatId }) => {
      if (selectedRef.current?._id && chatId === selectedRef.current._id) {
        setMessages((prev) =>
          prev.some((m) => m._id === message._id) ? prev : [...prev, message]
        );
      }
      loadChats();
    };

    socket.on('newMessage', handleNewMessage);
    return () => socket.off('newMessage', handleNewMessage);
  }, [loadChats]);

  // Load messages when a conversation is opened.
  useEffect(() => {
    if (!selectedConversation?._id) return;
    setLoadingMessages(true);
    loadMessages(selectedConversation._id).finally(() => setLoadingMessages(false));
  }, [selectedConversation?._id, loadMessages]);

  // Scroll to the newest message.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversationWith = useCallback((participant) => {
    setConversations((prev) => {
      const existing = prev.find((c) => c.participant?._id === participant._id);
      if (existing) {
        setSelectedConversation(existing);
      } else {
        // A placeholder chat with no id yet; the first sent message creates it.
        setSelectedConversation({ _id: null, participant, unreadCount: 0 });
        setMessages([]);
      }
      return prev;
    });
    setShowNewModal(false);
  }, []);

  // Allow other pages (e.g. Network) to open a chat by passing a recipient.
  useEffect(() => {
    const recipient = location.state?.recipient;
    if (recipient?._id) {
      openConversationWith(recipient);
    }
  }, [location.state, openConversationWith]);

  // If we opened a placeholder chat but a real conversation with that person
  // already exists, upgrade to it once the conversation list has loaded.
  useEffect(() => {
    if (!selectedConversation || selectedConversation._id) return;
    const existing = conversations.find(
      (c) => c.participant?._id === selectedConversation.participant?._id
    );
    if (existing) setSelectedConversation(existing);
  }, [conversations, selectedConversation]);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setConversations((prev) =>
      prev.map((c) =>
        c._id === conversation._id ? { ...c, unreadCount: 0 } : c
      )
    );
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || !selectedConversation?.participant?._id || sending) return;

    setSending(true);
    try {
      const { message, chatId } = await messageService.sendMessage(
        selectedConversation.participant._id,
        text
      );
      setNewMessage('');
      setMessages((prev) => [...prev, message]);
      if (!selectedConversation._id) {
        setSelectedConversation((prev) => ({ ...prev, _id: chatId }));
      }
      loadChats();
    } catch (error) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Load the people the user follows to start a new conversation with.
  useEffect(() => {
    if (!showNewModal) return;
    setLoadingUsers(true);
    const timer = setTimeout(async () => {
      try {
        const data = await networkService.getFollowing(userSearch);
        setUserResults(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load following:', error);
        setUserResults([]);
        toast.error(error.message || 'Could not load your following list.');
      } finally {
        setLoadingUsers(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch, showNewModal]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredConversations = conversations.filter((conv) =>
    (conv.participant?.name || '')
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        style={{ height: 'calc(100vh - 200px)' }}
      >
        <div className="flex h-full">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
                <Button
                  size="sm"
                  onClick={() => setShowNewModal(true)}
                  className="flex items-center space-x-1"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>New</span>
                </Button>
              </div>

              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {loadingChats ? (
                <div className="p-8 flex justify-center">
                  <LoadingSpinner />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">
                  No conversations yet. Click "New" to start one.
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <motion.div
                    key={conversation._id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`p-4 border-b border-gray-100 cursor-pointer transition-colors duration-200 ${
                      selectedConversation?._id === conversation._id
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    whileHover={{ x: 2 }}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar
                        src={conversation.participant?.avatar}
                        name={conversation.participant?.name}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {conversation.participant?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTime(conversation.updatedAt)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500 truncate">
                            {conversation.latestMessage?.text || 'No messages yet'}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={selectedConversation.participant?.avatar}
                      name={selectedConversation.participant?.name}
                      size="md"
                    />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {selectedConversation.participant?.name}
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">
                        {selectedConversation.participant?.role}
                        {selectedConversation.participant?.department
                          ? ` • ${selectedConversation.participant.department}`
                          : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingMessages && messages.length === 0 ? (
                    <div className="flex justify-center pt-8">
                      <LoadingSpinner />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-sm text-gray-500 pt-8">
                      Say hello to start the conversation.
                    </div>
                  ) : (
                    messages.map((message) => {
                      const mine =
                        (message.sender?._id || message.sender) === currentUserId;
                      return (
                        <div
                          key={message._id}
                          className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              mine
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.text}
                            </p>
                            <p
                              className={`text-xs mt-1 ${
                                mine ? 'text-blue-100' : 'text-gray-500'
                              }`}
                            >
                              {formatTime(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  <form
                    onSubmit={handleSendMessage}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="rounded-full p-2 w-10 h-10 flex items-center justify-center"
                    >
                      <PaperAirplaneIcon className="h-5 w-5" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              /* No conversation selected */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-10 h-10 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-500">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* New Conversation Modal */}
      <AnimatePresence>
        {showNewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setShowNewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  New message
                </h3>
                <button
                  onClick={() => setShowNewModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4">
                <div className="relative mb-3">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Search people..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {loadingUsers ? (
                    <div className="py-6 flex justify-center">
                      <LoadingSpinner />
                    </div>
                  ) : userResults.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-500">
                      You are not following anyone yet.
                    </p>
                  ) : (
                    userResults.map((u) => (
                      <button
                        key={u._id}
                        onClick={() => openConversationWith(u)}
                        className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 text-left"
                      >
                        <Avatar src={u.avatar} name={u.name} size="md" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {u.name}
                          </p>
                          <p className="text-xs text-gray-500 capitalize truncate">
                            {u.role}
                            {u.department ? ` • ${u.department}` : ''}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Messages;
