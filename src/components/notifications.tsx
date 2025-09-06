
"use client";

import React, { useState, useEffect } from "react";
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
import { getNotificationsWithReadStatus, markAsRead, removeAllNotifications, type AppNotification } from "@/lib/notifications";
import { listenToGlobalNotifications } from "@/services/firestore";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";

const getUserKey = (key: string, email: string | null) => `${email || 'guest'}_${key}`;

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
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    setIsClient(true);
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
    }
  }, []);
  
  const checkNotificationSetting = () => {
    const userKey = profile?.email || 'guest';
    const enabled = localStorage.getItem(getUserKey('notificationsEnabled', userKey));
    setAreNotificationsEnabled(enabled === null ? true : JSON.parse(enabled));
  }
  
  useEffect(() => {
    if (isClient) {
        checkNotificationSetting();
        
        const unsubscribe = listenToGlobalNotifications((globalNotifications) => {
          const notificationsWithStatus = getNotificationsWithReadStatus(globalNotifications);
          setNotifications(notificationsWithStatus);
        });

        const handleStorageChange = (event: StorageEvent) => {
            // This listens for changes in read status from other tabs
            if (event.key === 'readAppNotifications') {
                const globalNotifications = notifications.map(({read, ...rest}) => rest); // Get current global data
                const updatedNotifications = getNotificationsWithReadStatus(globalNotifications);
                setNotifications(updatedNotifications);
            }
            if (event.key === getUserKey('notificationsEnabled', profile?.email || 'guest')) {
               checkNotificationSetting();
           }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            unsubscribe();
            window.removeEventListener('storage', handleStorageChange);
        };
    }
  }, [isClient, profile]);

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
    // Optimistically update the UI without waiting for a re-render from storage event
    setNotifications(prev => prev.map(n => n.id === id ? {...n, read: true} : n));
  };
  
  const handleRemoveAll = () => {
      removeAllNotifications();
      // Optimistically update UI
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast({ title: t('notifications.toast.cleared') });
  }

  const handleMarkAllAsRead = () => {
    notifications.forEach(n => {
        if (!n.read) {
            markAsRead(n.id);
        }
    });
    // Optimistically update UI
    setNotifications(prev => prev.map(n => ({...n, read: true})));
    toast({ title: t('notifications.toast.markedAllRead')});
  };

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
             {areNotificationsEnabled && unreadCount > 0 && (
                <Button variant="link" size="sm" onClick={handleMarkAllAsRead} className="h-auto p-0">{t('notifications.markAllRead')}</Button>
             )}
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
          <>
            {notifications.map((notification) => (
            <DropdownMenuItem 
                key={notification.id} 
                className={`flex items-start gap-3 p-2 cursor-pointer group relative ${!notification.read ? 'bg-accent/20' : ''}`}
                onSelect={(e) => { e.preventDefault(); handleMarkAsRead(notification.id); }}
            >
                <div className="flex-shrink-0 mt-1">{iconMap[notification.icon]}</div>
                <div className="flex-1">
                <p className="font-semibold">{notification.title}</p>
                <p className="text-sm text-muted-foreground">{notification.description}</p>
                <p className="text-xs text-muted-foreground/80 mt-1">{formatDistanceToNow(new Date(notification.createdAt))} ago</p>
                </div>
                 {!notification.read && <div className="w-2 h-2 rounded-full bg-primary self-center"></div>}
                 {/* Remove button is not part of this implementation as users shouldn't delete global notifications */}
            </DropdownMenuItem>
            ))}
             <DropdownMenuSeparator />
             <DropdownMenuItem onSelect={handleRemoveAll} className="flex items-center justify-center gap-2 text-muted-foreground">
                <Trash2 className="w-4 h-4"/> {t('notifications.clearAll')}
             </DropdownMenuItem>
          </>
        ) : (
             <DropdownMenuItem className="text-center text-muted-foreground" disabled>
                {t('notifications.noNotifications')}
            </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

    