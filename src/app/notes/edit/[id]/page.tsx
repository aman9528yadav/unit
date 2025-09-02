
import { NoteEditor } from '@/components/note-editor';

export default function EditNotePage({ params }: { params: { id: string } }) {
    return (
        <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6">
            <NoteEditor noteId={params.id} />
        </main>
    );
}
