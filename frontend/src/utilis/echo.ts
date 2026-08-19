import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { useStore } from '../store/useStore'; // 💡 Adjust this path if your store is located elsewhere!

Pusher.logToConsole = true;
(window as any).Pusher = Pusher;

let echoInstance: any = null;

export const getEcho = () => {
  if (echoInstance) return echoInstance;

  // 💡 Grab the token DIRECTLY from Zustand!
  const token = useStore.getState().token;

echoInstance = new Echo({
  broadcaster: 'pusher',
  key: import.meta.env.VITE_PUSHER_APP_KEY,
  cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1', // placeholder — wsHost overrides this
  wsHost: import.meta.env.VITE_PUSHER_HOST,
  wsPort: Number(import.meta.env.VITE_PUSHER_PORT),
  forceTLS: import.meta.env.VITE_PUSHER_SCHEME === 'https',
  enabledTransports: ['ws', 'wss'],
  disableStats: true,
  authEndpoint: 'http://localhost:8000/api/broadcasting/auth',
  auth: {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  },
});

  return echoInstance;
};

// 🛡️ IMPORTANT: Call this function when the user logs out 
// OR right after a successful token refresh in api.ts!
export const resetEcho = () => {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
};