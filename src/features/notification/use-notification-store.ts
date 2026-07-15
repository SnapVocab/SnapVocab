import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { storage } from '@/lib/storage';
import { createSelectors } from '@/lib/utils';

export type Notification = {
  id: string;
  icon: string;
  header: string;
  content: string;
  timestamp: string;
  isRead: boolean;
};

type NotificationState = {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
};

const store = create<NotificationState>()(
  persist(
    set => ({
      notifications: [
        {
          id: '1',
          icon: 'flame',
          header: '3-day streak!',
          content: 'You\'ve been learning for 3 days in a row. Keep it up!',
          timestamp: '2 hours ago',
          isRead: false,
        },
        {
          id: '2',
          icon: 'trophy',
          header: 'New achievement unlocked!',
          content: 'You earned the "Fast Learner" badge. Check it out!',
          timestamp: '1 day ago',
          isRead: true,
        },
      ],
      markAsRead: id =>
        set(state => ({
          notifications: state.notifications.map(n => (n.id === id ? { ...n, isRead: true } : n)),
        })),
      markAllAsRead: () =>
        set(state => ({
          notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        })),
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => ({
        getItem: name => storage.getString(name) ?? null,
        setItem: (name, value) => storage.set(name, value),
        removeItem: name => storage.remove(name),
      })),
    },
  ),
);

export const useNotificationStore = createSelectors(store);
