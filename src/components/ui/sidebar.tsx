
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
  React.ComponentProps<typeof motion.div>
>(({ children, ...props }, ref) => {
  const { open, setOpen } = useSidebar()

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 bg-black/50"
          onClick={() => setOpen(false)}
          {...props}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
})
Sidebar.displayName = "Sidebar"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof motion.div>
>(({ className, ...props }, ref) => (
  <motion.div
    ref={ref}
    initial={{ x: "-100%" }}
    animate={{ x: 0 }}
    exit={{ x: "-100%" }}
    transition={{ type: "spring", stiffness: 260, damping: 30 }}
    onClick={(e) => e.stopPropagation()}
    className={cn(
      "fixed inset-y-0 left-0 z-50 p-5 w-72 max-w-full shadow-2xl rounded-r-3xl",
      "bg-sidebar-background",
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
    className={cn("grid grid-cols-2 gap-4 sm:grid-cols-3", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof motion.div>
>(({ className, ...props }, ref) => {
  const { setOpen } = useSidebar()
  return (
    <motion.div
      ref={ref}
      whileTap={{ scale: 0.95 }}
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
        "flex flex-col items-center justify-center p-4 rounded-2xl shadow-md transition w-full text-sm font-medium tracking-wide backdrop-blur-sm hover:shadow-lg",
        isActive
          ? "bg-primary/20 text-primary"
          : "bg-card text-primary",
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
