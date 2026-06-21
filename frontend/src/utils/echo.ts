import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { useStore } from "../store/useStore";

(window as typeof window & { Pusher: typeof Pusher }).Pusher = Pusher;

export const getEcho = () => {
  const token = useStore.getState().token;

  return new Echo({
    broadcaster: "pusher",
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: true,
    authEndpoint: `${import.meta.env.VITE_API_BASE_URL}/api/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};