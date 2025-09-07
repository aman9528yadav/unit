

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
import { listenToBroadcastNotification, BroadcastNotification } from "@/services/firestore";
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
  const [broadcast, setBroadcast] = useState<AppNotification | null>(null);
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
        
        const unsubscribe = listenToBroadcastNotification((info) => {
            if(info && info.title && info.description && info.createdAt) {
                const readIds = getReadNotificationIds();
                setBroadcast({
                    id: 'global_broadcast',
                    ...info,
                    read: readIds.has('global_broadcast') && readIds.has(info.createdAt)
                });
            } else {
                setBroadcast(null);
            }
        });

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'readAppNotifications') {
                 if (broadcast) {
                    const readIds = getReadNotificationIds();
                    setBroadcast(b => b ? {...b, read: readIds.has('global_broadcast') && readIds.has(b.createdAt)} : null);
                 }
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
  }, [isClient, profile, broadcast]);
  
  const getReadNotificationIds = (): Set<string> => {
    const stored = localStorage.getItem('readBroadcasts');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  };

  const handleMarkAsRead = () => {
    if(!broadcast) return;
    const readIds = getReadNotificationIds();
    readIds.add('global_broadcast');
    readIds.add(broadcast.createdAt); // Mark this specific version as read
    localStorage.setItem('readBroadcasts', JSON.stringify(Array.from(readIds)));
    setBroadcast(b => b ? { ...b, read: true } : null);
  };
  
  const unreadCount = broadcast && !broadcast.read ? 1 : 0;

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
        ) : broadcast ? (
          <DropdownMenuItem 
              key={broadcast.id} 
              className={`flex items-start gap-3 p-2 cursor-pointer group relative ${!broadcast.read ? 'bg-accent/20' : ''}`}
              onSelect={(e) => { e.preventDefault(); handleMarkAsRead(); }}
          >
              <div className="flex-shrink-0 mt-1">{iconMap[broadcast.icon]}</div>
              <div className="flex-1">
              <p className="font-semibold">{broadcast.title}</p>
              <p className="text-sm text-muted-foreground">{broadcast.description}</p>
              <p className="text-xs text-muted-foreground/80 mt-1">{formatDistanceToNow(new Date(broadcast.createdAt))} ago</p>
              </div>
               {!broadcast.read && <div className="w-2 h-2 rounded-full bg-primary self-center"></div>}
          </DropdownMenuItem>
        ) : (
             <DropdownMenuItem className="text-center text-muted-foreground" disabled>
                {t('notifications.noNotifications')}
            </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
