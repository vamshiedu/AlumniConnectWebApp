import api from './api';

export const authService = {
  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/user/login', credentials);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      console.log(response);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  // Register user
  register: async (userData) => {
    try {
      const response = await api.post('/user/register', userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      console.log(response);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/user/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get user data' };
    }
  },

  // Logout user
  logout: async () => {
    try {
      await api.get('/user/logout');
      localStorage.removeItem('token');
    } catch (error) {
      // Even if logout fails on server, remove token locally
      localStorage.removeItem('token');
      throw error.response?.data || { message: 'Logout failed' };
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/user/profile', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Profile update failed' };
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/user/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Password change failed' };
    }
  },

  // Follow/Unfollow user
  followUser: async (userId) => {
    try {
      const response = await api.post(`/user/follow/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Follow action failed' };
    }
  },

  // Get user profile by ID
  getUserProfile: async (userId) => {
    try {
      const response = await api.get(`/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get user profile' };
    }
  },

  // Endorse (or un-endorse) a skill on another user's profile
  endorseSkill: async (userId, skillName) => {
    try {
      const response = await api.post(`/user/${userId}/endorse`, { skillName });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to endorse skill' };
    }
  },
};

export const postService = {
  // Get all posts
  getAllPosts: async () => {
    try {
      const response = await api.get('/post/all');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get posts' };
    }
  },

  // Create post
  createPost: async (postData) => {
    try {
      const response = await api.post('/post/create', postData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create post' };
    }
  },

  // Get single post
  getPost: async (postId) => {
    try {
      const response = await api.get(`/post/${postId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get post' };
    }
  },

  // Update post
  updatePost: async (postId, postData) => {
    try {
      const response = await api.put(`/post/${postId}`, postData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update post' };
    }
  },

  // Delete post
  deletePost: async (postId) => {
    try {
      const response = await api.delete(`/post/${postId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete post' };
    }
  },

  // Like/Unlike post
  likePost: async (postId) => {
    try {
      const response = await api.post(`/post/like/${postId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to like post' };
    }
  },

  // Comment on post
  commentOnPost: async (postId, commentData) => {
    try {
      const response = await api.post(`/post/comment/${postId}`, commentData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to comment on post' };
    }
  },

  // Save/Unsave post
  savePost: async (postId) => {
    try {
      const response = await api.post(`/post/save/${postId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to save post' };
    }
  },

  // Get saved posts
  getSavedPosts: async () => {
    try {
      const response = await api.get('/post/saved/all');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get saved posts' };
    }
  },

  // Delete comment
  deleteComment: async (postId, commentId) => {
    try {
      const response = await api.delete(`/post/comment/${postId}`, {
        data: { commentId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete comment' };
    }
  },
};

export const eventService = {
  getAllEvents: async () => {
    try {
      const response = await api.get('/event/all');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get events' };
    }
  },

  createEvent: async (eventData) => {
    try {
      const response = await api.post('/event/create', eventData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create event' };
    }
  },

  updateEvent: async (eventId, eventData) => {
    try {
      const response = await api.put(`/event/${eventId}`, eventData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update event' };
    }
  },

  deleteEvent: async (eventId) => {
    try {
      const response = await api.delete(`/event/${eventId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete event' };
    }
  },
};

// Network/Connection services
export const networkService = {
  // Get alumni directory
  getAlumni: async (filters = {}) => {
    try {
      const response = await api.get('/user/alumni', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get alumni data' };
    }
  },

  // Search users
  searchUsers: async (query) => {
    try {
      const response = await api.get(`/user/search?q=${query}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to search users' };
    }
  },

  // List users (used to pick a recipient when starting a conversation)
  getAllUsers: async (search = '') => {
    try {
      const response = await api.get('/user/all', { params: { search } });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get users' };
    }
  },

  // List the accounts the current user follows (used in the "New message" modal)
  getFollowing: async (search = '') => {
    try {
      const response = await api.get('/user/following', { params: { search } });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get following' };
    }
  },
};

// Messaging services
export const messageService = {
  // Get all of the current user's conversations
  getChats: async () => {
    try {
      const response = await api.get('/message/chats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get conversations' };
    }
  },

  // Get all messages in a conversation
  getMessages: async (chatId) => {
    try {
      const response = await api.get(`/message/${chatId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get messages' };
    }
  },

  // Send a message to a user (creates the conversation if needed)
  sendMessage: async (recipientId, text) => {
    try {
      const response = await api.post('/message/send', { recipientId, text });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send message' };
    }
  },
};