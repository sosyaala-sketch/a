/**
 * Exam Notes Sync - Supabase Integration
 */

const ExamNotesSync = {
    config: {
        baseUrl: 'https://znrlvhbuzmukznnfxpjy.supabase.co/rest/v1/exam_notes',
        storageUrl: 'https://znrlvhbuzmukznnfxpjy.supabase.co/storage/v1/object/hub_files',
        apiKey: 'sb_publishable_VQ6Eu0R0LKEMZOh9P93L0w_qR3Ylyu3'
    },

    async fetchNotesByExam(examId) {
        console.log(`🔄 [ExamNotes] Fetching notes for exam: ${examId}`);
        try {
            const res = await fetch(`${this.config.baseUrl}?exam_id=eq.${examId}`, {
                headers: {
                    'apikey': this.config.apiKey,
                    'Authorization': `Bearer ${this.config.apiKey}`
                }
            });
            if (!res.ok) return [];
            return await res.json();
        } catch (err) {
            console.error('❌ [ExamNotes] Fetch error:', err);
            return [];
        }
    },

    async uploadFile(file, examId) {
        const safeName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        const fileName = `exam_notes/${examId}/${Date.now()}_${safeName}`;

        try {
            const res = await fetch(`${this.config.storageUrl}/${fileName}`, {
                method: 'POST',
                headers: {
                    'apikey': this.config.apiKey,
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': file.type
                },
                body: file
            });

            if (!res.ok) throw new Error("Upload failed");

            return `https://znrlvhbuzmukznnfxpjy.supabase.co/storage/v1/object/public/hub_files/${fileName}`;
        } catch (err) {
            console.error('❌ [ExamNotes] Upload error:', err);
            throw err;
        }
    },

    async addNote(noteData) {
        console.log(`📤 [ExamNotes] Saving metadata for: ${noteData.title}`);
        try {
            const res = await fetch(this.config.baseUrl, {
                method: 'POST',
                headers: {
                    'apikey': this.config.apiKey,
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(noteData)
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error(`❌ [ExamNotes] Save failed: ${res.status} - ${errorText}`);
                throw new Error(`Metadata save failed: ${errorText}`);
            }
            return await res.json();
        } catch (err) {
            console.error('❌ [ExamNotes] Add error:', err);
            throw err;
        }
    },

    async deleteNote(noteId) {
        console.log(`🗑️ [ExamNotes] Deleting note: ${noteId}`);
        try {
            const res = await fetch(`${this.config.baseUrl}?id=eq.${noteId}`, {
                method: 'DELETE',
                headers: {
                    'apikey': this.config.apiKey,
                    'Authorization': `Bearer ${this.config.apiKey}`
                }
            });
            if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
            return true;
        } catch (err) {
            console.error('❌ [ExamNotes] Delete error:', err);
            throw err;
        }
    },

    async updateNote(noteId, newData) {
        console.log(`📝 [ExamNotes] Updating note: ${noteId}`);
        try {
            const res = await fetch(`${this.config.baseUrl}?id=eq.${noteId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': this.config.apiKey,
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newData)
            });
            if (!res.ok) throw new Error(`Update failed: ${res.status}`);
            return true;
        } catch (err) {
            console.error('❌ [ExamNotes] Update error:', err);
            throw err;
        }
    }
};

window.ExamNotesSync = ExamNotesSync;
