
import { NoteViewer } from '@/components/note-viewer';

export const dynamic = 'force-dynamic';

export default function ViewNotePage({ params }: { params: { id: string } }) {
    return (
        <main className="w-full flex-grow flex flex-col items-center p-4 sm:p-6">
            <NoteViewer noteId={params.id} />
        </main>
    );
}
