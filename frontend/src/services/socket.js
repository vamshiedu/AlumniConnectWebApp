import { io } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

// Connect (or reuse) a single authenticated socket for the logged-in user.
export const connectSocket = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  if (socket && socket.connected) return socket;

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
      autoConnect: true,
    });
  } else {
    socket.auth = { token };
    socket.connect();
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
