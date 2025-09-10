
"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { Slot } from "@radix-ui/react-slot"

type SidebarContext = {
  open: boolean
  setOpen: (open: boolean) => void
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ children, ...props }, ref) => {
  const [open, setOpen] = React.useState(false)

  const contextValue = React.useMemo<SidebarContext>(
    () => ({ open, setOpen }),
    [open, setOpen]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <div ref={ref} {...props}>
        {children}
      </div>
    </SidebarContext.Provider>
  )
})
SidebarProvider.displayName = "SidebarProvider"

const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean }
>(({ onClick, asChild = false, ...props }, ref) => {
  const { setOpen } = useSidebar()
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      ref={ref}
      onClick={(event) => {
        onClick?.(event)
        setOpen(true)
      }}
      {...props}
    />
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarClose = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean }
>(({ onClick, asChild = false, ...props }, ref) => {
  const { setOpen } = useSidebar()
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      ref={ref}
      onClick={(event) => {
        onClick?.(event)
        setOpen(false)
      }}
      {...props}
    />
  )
})
SidebarClose.displayName = "SidebarClose"

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ children, ...props }, ref) => {
  const { open, setOpen } = useSidebar()

  return (
    <>
      {open && (
        <div
          ref={ref}
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => setOpen(false)}
          {...props}
        >
          {children}
        </div>
      )}
    </>
  )
})
Sidebar.displayName = "Sidebar"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    onClick={(e) => e.stopPropagation()}
    className={cn(
      "fixed inset-y-0 left-0 z-50 p-5 w-72 max-w-full shadow-2xl rounded-r-3xl",
      "bg-background",
      className
    )}
    {...props}
  />
))
SidebarContent.displayName = "SidebarContent"

const SidebarMenu = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-2", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  const { setOpen } = useSidebar()
  return (
    <div
      ref={ref}
      onClick={() => setOpen(false)}
      className={cn("relative", className)}
      {...props}
    />
  )
})
SidebarMenuItem.displayName = "SidebarMenuItem"

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { isActive?: boolean }
>(({ isActive, className, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "flex items-center justify-start p-3 rounded-xl shadow-sm transition w-full text-sm font-medium tracking-wide backdrop-blur-sm hover:shadow-md gap-3",
        isActive
          ? "bg-primary/20 text-primary"
          : "bg-secondary text-secondary-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
})
SidebarMenuButton.displayName = "SidebarMenuButton"

export {
  Sidebar,
  SidebarClose,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
}
