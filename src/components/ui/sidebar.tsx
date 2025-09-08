"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"

import { cn } from "@/lib/utils"

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
  React.ComponentProps<"button">
>(({ onClick, ...props }, ref) => {
  const { setOpen } = useSidebar()
  return (
    <button
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
  React.ComponentProps<"button">
>(({ onClick, ...props }, ref) => {
  const { setOpen } = useSidebar()
  return (
    <button
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
  const { open } = useSidebar()

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
    initial={{ y: "-100%" }}
    animate={{ y: "0%" }}
    exit={{ y: "-100%" }}
    transition={{ type: "spring", stiffness: 300, damping: 30 }}
    className={cn(
      "fixed inset-0 z-50 flex h-full w-full flex-col items-center justify-center bg-background/70 backdrop-blur-lg bg-cover bg-center text-foreground shadow-lg",
      className
    )}
    {...props}
  />
))
SidebarContent.displayName = "SidebarContent"

const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("grid w-full max-w-[400px] grid-cols-3 gap-x-4 gap-y-4", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<typeof motion.li>
>(({ className, ...props }, ref) => {
  const { setOpen } = useSidebar()
  return (
    <motion.li
      ref={ref}
      whileHover={{ scale: 1.1 }}
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
>(({ isActive, className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "flex flex-col items-center justify-center gap-1 text-center text-sm font-semibold text-black transition-colors hover:text-primary",
        {
          "text-primary": isActive,
        },
        className
      )}
      {...props}
    />
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
