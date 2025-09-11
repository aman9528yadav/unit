

"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, Check, Info, Rocket, Trash2, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { addNotification, type AppNotification } from "@/lib/notifications";
import { listenToBroadcastNotification } from "@/services/firestore";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";

const NOTIFICATIONS_STORAGE_KEY = 'appNotifications';


const iconMap: { [key in AppNotification['icon']]: React.ReactNode } = {
    info: <Info className="text-blue-500" />,
    success: <Check className="text-green-500" />,
    new: <Rocket className="text-purple-500" />,
}

export function Notifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [areNotificationsEnabled, setAreNotificationsEnabled] = useState(true);
  const [profile, setProfile] = useState<{ email: string } | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { t } = useLanguage();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsClient(true);
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
    }
    if (typeof window !== 'undefined') {
        audioRef.current = new Audio('/new-notification-09-352705.mp3');
        audioRef.current.volume = 1.0;
    }
  }, []);
  
  const playSound = () => {
    if (areNotificationsEnabled && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => console.error("Audio play failed:", err));
    }
  }

  const checkNotificationSetting = () => {
    if (typeof window === 'undefined') return;
    const userKey = profile?.email || 'guest';
    const enabled = localStorage.getItem(userKey + '_notificationsEnabled');
    setAreNotificationsEnabled(enabled === null ? true : JSON.parse(enabled));
  }

  const loadNotifications = () => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const currentNotifications = stored ? JSON.parse(stored) : [];
    
    if (notifications.length > 0 && currentNotifications.length > notifications.length) {
        playSound();
    }

    setNotifications(currentNotifications);
  };

  useEffect(() => {
    if (isClient) {
        checkNotificationSetting();
        loadNotifications();
        
        const handleStorageChange = (event: StorageEvent) => {
             if (event.key === ((profile?.email || 'guest') + '_notificationsEnabled')) {
               checkNotificationSetting();
           }
            if (event.key === NOTIFICATIONS_STORAGE_KEY) {
                loadNotifications();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        
        // Listen for broadcast notifications
        let lastBroadcastTimestamp: string | null = null;
        const unsubBroadcast = listenToBroadcastNotification((broadcast) => {
            if (broadcast && broadcast.createdAt !== lastBroadcastTimestamp) {
                lastBroadcastTimestamp = broadcast.createdAt;
                addNotification({
                    title: broadcast.title,
                    description: broadcast.description,
                    icon: broadcast.icon || 'info'
                });
                playSound();
            }
        });

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            unsubBroadcast();
        };
    }
  }, [isClient, profile]);
  

  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? {...n, read: true} : n);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    loadNotifications();
  };

  const removeAllNotifications = () => {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify([]));
      loadNotifications();
  }
  
  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isClient) {
      return (
        <Button variant="ghost" size="icon" className="relative">
          <Bell />
        </Button>
      );
  }


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell />
          {areNotificationsEnabled && unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex justify-between items-center p-2">
            <DropdownMenuLabel className="p-0">{t('notifications.title')}</DropdownMenuLabel>
             <Button variant="ghost" size="sm" onClick={() => removeAllNotifications()}>{t('notifications.clearAll')}</Button>
        </div>
        <DropdownMenuSeparator />
        {!areNotificationsEnabled ? (
            <div className="p-4 text-center text-sm text-muted-foreground flex flex-col items-center gap-4">
                <Bell className="w-10 h-10"/>
                <p>{t('notifications.disabled.message')}</p>
                <Button asChild>
                    <Link href="/settings">
                        <Settings className="mr-2"/>
                        {t('notifications.disabled.button')}
                    </Link>
                </Button>
            </div>
        ) : notifications.length > 0 ? (
            notifications.map(notification => (
                <DropdownMenuItem 
                    key={notification.id} 
                    className={`flex items-start gap-3 p-2 cursor-pointer group relative ${!notification.read && 'bg-secondary'}`}
                    onSelect={(e) => { e.preventDefault(); handleMarkAsRead(notification.id); }}
                >
                    <div className="flex-shrink-0 mt-1">{iconMap[notification.icon]}</div>
                    <div className="flex-1">
                        <p className="font-semibold">{notification.title}</p>
                        <p className="text-sm text-muted-foreground">{notification.description}</p>
                        <p className="text-xs text-muted-foreground/80 mt-1">{formatDistanceToNow(new Date(notification.createdAt))} ago</p>
                    </div>
                </DropdownMenuItem>
            ))
        ) : (
             <DropdownMenuItem className="text-center text-muted-foreground" disabled>
                {t('notifications.noNotifications')}
            </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
