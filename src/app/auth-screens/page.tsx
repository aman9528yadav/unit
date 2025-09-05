
"use client"

// This is a placeholder page to match the navigation structure.
// In a real application, you might have a dedicated UI for managing authentication screens.

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AuthScreensPage() {
    return (
        <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
            <h1 className="text-2xl font-bold">Authentication Screens</h1>
            <p className="text-muted-foreground mt-2">This is a placeholder page for managing auth screens.</p>
            <Button asChild className="mt-6">
                <Link href="/settings">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Settings
                </Link>
            </Button>
        </main>
    );
}
