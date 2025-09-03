
"use client";

import React, { useState, useEffect } from "react";
import { Bell, Check, Info, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getNotifications, markAsRead, type AppNotification } from "@/lib/notifications";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const iconMap: { [key in AppNotification['icon']]: React.ReactNode } = {
    info: <Info className="text-blue-500" />,
    success: <Check className="text-green-500" />,
    new: <Rocket className="text-purple-500" />,
}

export function Notifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const loadNotifications = () => {
      const storedNotifications = getNotifications();
      setNotifications(storedNotifications);
  }

  useEffect(() => {
    if (isClient) {
        loadNotifications();
        
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'appNotifications') {
                loadNotifications();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }
  }, [isClient]);

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    notifications.forEach(n => {
        if (!n.read) {
            markAsRead(n.id);
        }
    });
    loadNotifications();
    toast({ title: "All notifications marked as read."});
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
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex justify-between items-center p-2">
            <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
             {unreadCount > 0 && (
                <Button variant="link" size="sm" onClick={handleMarkAllAsRead} className="h-auto p-0">Mark all as read</Button>
             )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length > 0 ? (
            notifications.map((notification) => (
            <DropdownMenuItem 
                key={notification.id} 
                className={`flex items-start gap-3 p-2 cursor-pointer ${!notification.read ? 'bg-accent/20' : ''}`}
                onSelect={(e) => { e.preventDefault(); handleMarkAsRead(notification.id); }}
            >
                <div className="flex-shrink-0 mt-1">{iconMap[notification.icon]}</div>
                <div className="flex-1">
                <p className="font-semibold">{notification.title}</p>
                <p className="text-sm text-muted-foreground">{notification.description}</p>
                <p className="text-xs text-muted-foreground/80 mt-1">{formatDistanceToNow(new Date(notification.createdAt))} ago</p>
                </div>
                 {!notification.read && <div className="w-2 h-2 rounded-full bg-primary self-center"></div>}
            </DropdownMenuItem>
            ))
        ) : (
             <DropdownMenuItem className="text-center text-muted-foreground" disabled>
                You have no notifications.
            </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
