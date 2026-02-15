/**
 * Calendar Sync - Supabase Integration
 * Handles all CRUD operations for the Takvim (Calendar) system.
 */

const CalendarSync = {
    config: {
        baseUrl: 'https://znrlvhbuzmukznnfxpjy.supabase.co/rest/v1/calendar_events',
        apiKey: 'sb_publishable_VQ6Eu0R0LKEMZOh9P93L0w_qR3Ylyu3'
    },

    /**
     * Fetch all calendar events from Supabase
     */
    async fetchAll() {
        console.log('🔄 [Calendar] Syncing from Supabase...');
        try {
            const res = await fetch(this.config.baseUrl, {
                headers: {
                    'apikey': this.config.apiKey,
                    'Authorization': `Bearer ${this.config.apiKey}`
                }
            });

            if (!res.ok) throw new Error(`Supabase error: ${res.status}`);

            const data = await res.json();

            // Map Supabase columns to UI fields
            const events = data.map(item => ({
                id: item.id,
                title: item.title,
                startDate: new Date(item.start_date),
                endDate: item.end_date ? new Date(item.end_date) : undefined,
                category: item.category
            }));

            // Handle global assignment if needed
            if (typeof window !== 'undefined') {
                window.customEvents = events;
                if (typeof window.renderCalendar === 'function') {
                    window.renderCalendar();
                }
            }

            return events;
        } catch (err) {
            console.error('❌ [Calendar] Fetch error:', err);
            return [];
        }
    },

    /**
     * Add new event
     */
    async addEvent(data) {
        console.log('📤 [Calendar] Adding to Supabase:', data.title);
        try {
            const res = await fetch(this.config.baseUrl, {
                method: 'POST',
                headers: {
                    'apikey': this.config.apiKey,
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    id: data.id || Math.random().toString(36).substr(2, 9),
                    title: data.title,
                    start_date: data.startDate.toISOString(),
                    end_date: data.endDate ? data.endDate.toISOString() : null,
                    category: data.category
                })
            });

            if (!res.ok) throw new Error(`Save failed: ${await res.text()}`);

            await this.fetchAll();
            return true;
        } catch (err) {
            console.error('❌ [Calendar] Add error:', err);
            throw err;
        }
    },

    /**
     * Delete event
     */
    async deleteEvent(id) {
        console.log('🗑️ [Calendar] Deleting from Supabase:', id);
        try {
            const res = await fetch(`${this.config.baseUrl}?id=eq.${id}`, {
                method: 'DELETE',
                headers: {
                    'apikey': this.config.apiKey,
                    'Authorization': `Bearer ${this.config.apiKey}`
                }
            });

            if (!res.ok) throw new Error(`Delete failed: ${res.status}`);

            await this.fetchAll();
            return true;
        } catch (err) {
            console.error('❌ [Calendar] Delete error:', err);
            throw err;
        }
    }
};

window.CalendarSync = CalendarSync;
