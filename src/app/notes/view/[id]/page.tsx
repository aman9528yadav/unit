
import { NoteViewer } from '@/components/note-viewer';

export const dynamic = 'force-dynamic';

export default function ViewNotePage({ params }: { params: { id: string } }) {
    return (
        <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6">
            <NoteViewer noteId={params.id} />
        </main>
    );
}
