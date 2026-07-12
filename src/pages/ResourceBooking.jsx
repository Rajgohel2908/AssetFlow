import { useState } from 'react';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import ConflictModal from '../components/common/ConflictModal';
import { bookings, resources } from '../data/mockData';
import { format, addDays, startOfWeek, addWeeks, subWeeks } from 'date-fns';

const HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];

export default function ResourceBooking() {
  const [bookingsList, setBookingsList] = useState(bookings);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date('2024-01-15'), { weekStartsOn: 1 }));
  const [showForm,   setShowForm]  = useState(false);
  const [conflict,   setConflict]  = useState(false);
  
  // Form State
  const [selectedRes, setSelectedRes] = useState('');
  const [bookDate, setBookDate] = useState('2024-01-15');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [purpose, setPurpose] = useState('');

  const [tab, setTab] = useState(0); // 0=calendar, 1=list

  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  // Map bookings to calendar cells
  const bookingMap = {};
  bookingsList.forEach(b => {
    const key = `${b.resource}|${b.date}`;
    if (!bookingMap[key]) bookingMap[key] = [];
    bookingMap[key].push(b);
  });

  const handleBook = (e) => {
    e.preventDefault();
    if (!selectedRes || !purpose) return;
    
    // Check overlap
    const existing = bookingsList.filter(b => b.resource === selectedRes && b.date === bookDate && b.status === 'Confirmed');
    const isConflict = existing.some(b => (startTime >= b.startTime && startTime < b.endTime) || (endTime > b.startTime && endTime <= b.endTime));
    
    if (isConflict) {
      setConflict(true);
      setShowForm(false);
      return;
    }

    const newBooking = {
      id: `BKG-00${bookingsList.length + 1}`,
      resource: selectedRes,
      bookedBy: 'Current User',
      date: bookDate,
      startTime,
      endTime,
      purpose,
      status: 'Confirmed'
    };
    setBookingsList([...bookingsList, newBooking]);
    setShowForm(false);
    setSelectedRes(''); setPurpose('');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="page-title">Resource Booking</h2>
          <p className="page-subtitle">Book rooms, equipment, and shared assets</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(s => !s)}>
          <Plus size={14} /> New Booking
        </button>
      </div>

      {/* Booking Form */}
      {showForm && (
        <div className="card">
          <div className="card-header">
            <span className="text-sm font-semibold">New Booking</span>
            <button onClick={() => setShowForm(false)} className="btn-ghost py-1 px-2"><X size={14} /></button>
          </div>
          <form onSubmit={handleBook} className="card-body">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Resource *</label>
                <select required className="form-select" value={selectedRes} onChange={e => setSelectedRes(e.target.value)}>
                  <option value="">Select resource…</option>
                  {resources.map(r => <option key={r.id} value={r.name}>{r.name} ({r.type})</option>)}
                </select>
              </div>
              <div><label className="form-label">Date *</label><input required className="form-input" type="date" value={bookDate} onChange={e => setBookDate(e.target.value)} /></div>
              <div>
                <label className="form-label">Start Time *</label>
                <select className="form-select" value={startTime} onChange={e => setStartTime(e.target.value)}>
                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">End Time *</label>
                <select className="form-select" value={endTime} onChange={e => setEndTime(e.target.value)}>
                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div><label className="form-label">Purpose</label><input required className="form-input" placeholder="e.g. Sprint Planning" value={purpose} onChange={e => setPurpose(e.target.value)} /></div>
              <div><label className="form-label">Attendees</label><input className="form-input" type="number" placeholder="1" /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="submit" className="btn-primary">Check & Book</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Tab toggle */}
      <div className="flex border-b border-gray-200 gap-1">
        {['Calendar View', 'Booking List'].map((t, i) => (
          <button key={t} className={`tab-btn ${tab === i ? 'active' : ''}`} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>

      {tab === 0 && (
        <div className="card">
          {/* Week nav */}
          <div className="card-header">
            <div className="flex items-center gap-3">
              <button className="btn-ghost py-1 px-2" onClick={() => setWeekStart(w => subWeeks(w, 1))}>
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-semibold">
                {format(weekStart, 'MMM d')} — {format(addDays(weekStart, 4), 'MMM d, yyyy')}
              </span>
              <button className="btn-ghost py-1 px-2" onClick={() => setWeekStart(w => addWeeks(w, 1))}>
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-200 inline-block"/> Confirmed</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-200 inline-block"/> Rejected</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Header row */}
              <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: '160px repeat(5, 1fr)' }}>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50">Resource</div>
                {weekDays.map(d => (
                  <div key={d} className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border-l border-gray-100 text-center">
                    {format(d, 'EEE d')}
                  </div>
                ))}
              </div>

              {/* Resource rows */}
              {resources.map(res => (
                <div
                  key={res.id}
                  className="grid border-b border-gray-100 hover:bg-gray-50/50"
                  style={{ gridTemplateColumns: '160px repeat(5, 1fr)' }}
                >
                  <div className="px-3 py-3 border-r border-gray-100">
                    <p className="text-xs font-semibold text-gray-800">{res.name}</p>
                    <p className="text-[10px] text-gray-400">{res.type} · Cap: {res.capacity}</p>
                  </div>
                  {weekDays.map(d => {
                    const key = `${res.name}|${format(d, 'yyyy-MM-dd')}`;
                    const dayBookings = bookingMap[key] ?? [];
                    return (
                      <div key={d.toISOString()} className="px-2 py-1.5 border-l border-gray-100 min-h-[60px]">
                        {dayBookings.map(b => (
                          <div
                            key={b.id}
                            className={`text-[10px] rounded px-1.5 py-0.5 mb-1 font-medium truncate
                              ${b.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}
                            title={`${b.purpose} (${b.startTime}–${b.endTime})`}
                          >
                            {b.startTime}–{b.endTime} {b.purpose}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead>
                <tr>
                  {['ID','Resource','Booked By','Date','Time','Purpose','Status'].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {bookingsList.map(b => (
                  <tr key={b.id} className="table-tr">
                    <td className="table-td">{b.id}</td>
                    <td className="table-td font-medium">{b.resource}</td>
                    <td className="table-td">{b.bookedBy}</td>
                    <td className="table-td">{b.date}</td>
                    <td className="table-td">{b.startTime} – {b.endTime}</td>
                    <td className="table-td">{b.purpose}</td>
                    <td className="table-td"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Overlap conflict */}
      <ConflictModal
        isOpen={conflict}
        onClose={() => setConflict(false)}
        title="Booking Overlap Detected"
        message="The selected time slot is already booked for this resource."
        conflictDetail="Conference Room A is already booked from 09:00–11:00 on Jan 15 (Sprint Planning — Alice Johnson)."
        alternativeLabel="See Available Slots"
        onAlternative={() => setConflict(false)}
      />
    </div>
  );
}
