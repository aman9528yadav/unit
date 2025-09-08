
import { NoteEditor } from '@/components/note-editor';

export const dynamic = 'force-dynamic';

export default function EditNotePage({ params }: { params: { id: string } }) {
    return (
        <main className="w-full flex-grow flex flex-col items-center p-4 sm:p-6">
            <NoteEditor noteId={params.id} />
        </main>
    );
}
