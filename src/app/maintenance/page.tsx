
"use client";

import { Wrench } from "lucide-react";
import Link from "next/link";

export default function MaintenancePage() {
    return (
        <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
            <div className="flex flex-col items-center gap-6">
                <Link href="/dev">
                    <Wrench className="w-24 h-24 text-primary animate-bounce cursor-pointer" />
                </Link>
                <div className="flex flex-col gap-2">
                    <p className="text-lg font-semibold text-primary">Sutradhaar</p>
                    <h1 className="text-4xl font-bold">Under Maintenance</h1>
                    <p className="text-muted-foreground max-w-sm">
                        We're currently performing scheduled maintenance. We should be back online shortly. Thank you for your patience!
                    </p>
                </div>
            </div>
            <footer className="absolute bottom-6 text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} Sutradhaar | Owned by Aman Yadav</p>
            </footer>
        </main>
    );
}
