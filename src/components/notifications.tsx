
"use client";

import { Bell, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const notifications = [
    {
        title: "New Feature Added",
        description: "Custom units can now be created.",
        icon: <Check className="text-green-500" />,
        read: false
    },
    {
        title: "Maintenance Scheduled",
        description: "Scheduled maintenance on Sunday.",
        icon: <Info className="text-blue-500" />,
        read: true
    },
     {
        title: "Profile Updated",
        description: "Your profile photo was updated.",
        icon: <Check className="text-green-500" />,
        read: true
    }
];

export function Notifications() {
  const unreadCount = notifications.filter(n => !n.read).length;

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
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.map((notification, index) => (
          <DropdownMenuItem key={index} className={`flex items-start gap-3 p-2 ${!notification.read ? 'bg-accent/20' : ''}`}>
            <div className="flex-shrink-0 mt-1">{notification.icon}</div>
            <div className="flex-1">
              <p className="font-semibold">{notification.title}</p>
              <p className="text-sm text-muted-foreground">{notification.description}</p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
