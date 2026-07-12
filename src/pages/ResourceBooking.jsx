import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import ConflictModal from '../components/common/ConflictModal';
import { format, addDays, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import api from '../utils/api';

const HOURS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];

export default function ResourceBooking() {
  const [bookingsList, setBookingsList] = useState([]);
  const [resources, setResources] = useState([]);
  
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showForm,   setShowForm]  = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [conflictMsg, setConflictMsg] = useState('');
  
  // Form State
  const [selectedRes, setSelectedRes] = useState('');
  const [bookDate, setBookDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [purpose, setPurpose] = useState('');

  const [tab, setTab] = useState(0); // 0=calendar, 1=list

  const fetchData = async () => {
    try {
      const [bookRes, resRes] = await Promise.all([
        api.get('/bookings'),
        api.get('/assets')
      ]);
      setBookingsList(bookRes.data.data || []);
      const allAssets = resRes.data.data || [];
      setResources(allAssets.filter(a => a.isBookable));
    } catch (err) {
      toast.error('Failed to load booking data');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancelBooking = async (id) => {
    try {
      await api.patch(`/bookings/${id}/cancel`);
      toast.success('Booking cancelled successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

  // Map bookings to calendar cells
  const bookingMap = {};
  bookingsList.forEach(b => {
    // format date as YYYY-MM-DD
    const dateStr = format(new Date(b.startTime), 'yyyy-MM-dd');
    const key = `${b.resource?.id}|${dateStr}`;
    if (!bookingMap[key]) bookingMap[key] = [];
    bookingMap[key].push(b);
  });

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedRes || !purpose) return toast.error('Resource and purpose required');
    
    // Construct Date objects
    // Assuming user's local timezone
    const startIso = new Date(`${bookDate}T${startTime}:00`).toISOString();
    const endIso = new Date(`${bookDate}T${endTime}:00`).toISOString();

    if (new Date(endIso) <= new Date(startIso)) {
      return toast.error('End time must be after start time');
    }

    try {
      await api.post('/bookings', {
        resourceId: selectedRes,
        startTime: startIso,
        endTime: endIso,
        purpose,
      });
      toast.success('Booking created successfully!');
      setShowForm(false);
      setSelectedRes(''); setPurpose('');
      fetchData();
    } catch (err) {
      if (err.response?.status === 409) {
        const conflictData = err.response.data.details?.[0]?.conflictingBooking;
        if (conflictData) {
          const cStart = format(new Date(conflictData.startTime), 'HH:mm');
          const cEnd = format(new Date(conflictData.endTime), 'HH:mm');
          setConflictMsg(`Resource is already booked from ${cStart}–${cEnd} by ${conflictData.bookedBy}.`);
        } else {
          setConflictMsg(err.response?.data?.message || 'Conflict detected.');
        }
        setConflictOpen(true);
      } else {
        toast.error('Failed to create booking: ' + (err.response?.data?.message || err.message));
      }
    }
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
                  {resources.map(r => <option key={r.id} value={r.id}>{r.name} ({r.assetTag})</option>)}
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
              <div><label className="form-label">Purpose *</label><input required className="form-input" placeholder="e.g. Sprint Planning" value={purpose} onChange={e => setPurpose(e.target.value)} /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="submit" className="btn-primary">Check & Book</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Tab toggle */}
      <div className="flex border-b border-[#e4e4e7] gap-1">
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
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-200 inline-block"/> Upcoming/Ongoing</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-[#e4e4e7] inline-block"/> Completed/Cancelled</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Header row */}
              <div className="grid border-b border-[#f4f4f5]" style={{ gridTemplateColumns: '160px repeat(5, 1fr)' }}>
                <div className="px-3 py-2 text-xs font-semibold text-[#71717a] bg-[#fafafa]">Resource</div>
                {weekDays.map(d => (
                  <div key={d.toISOString()} className="px-3 py-2 text-xs font-semibold text-[#52525b] bg-[#fafafa] border-l border-[#f4f4f5] text-center">
                    {format(d, 'EEE d')}
                  </div>
                ))}
              </div>

              {/* Resource rows */}
              {resources.length === 0 ? (
                <div className="p-4 text-center text-sm text-[#71717a]">No bookable resources found.</div>
              ) : resources.map(res => (
                <div
                  key={res.id}
                  className="grid border-b border-[#f4f4f5] hover:bg-[#fafafa]/50"
                  style={{ gridTemplateColumns: '160px repeat(5, 1fr)' }}
                >
                  <div className="px-3 py-3 border-r border-[#f4f4f5]">
                    <p className="text-xs font-semibold text-[#18181b]">{res.name}</p>
                    <p className="text-[10px] text-[#a1a1aa]">{res.assetTag}</p>
                  </div>
                  {weekDays.map(d => {
                    const key = `${res.id}|${format(d, 'yyyy-MM-dd')}`;
                    const dayBookings = bookingMap[key] ?? [];
                    return (
                      <div key={d.toISOString()} className="px-2 py-1.5 border-l border-[#f4f4f5] min-h-[60px]">
                        {dayBookings.map(b => {
                          const isActive = ['UPCOMING', 'ONGOING'].includes(b.status);
                          return (
                            <div
                              key={b.id}
                              className={`text-[10px] rounded px-1.5 py-0.5 mb-1 font-medium truncate
                                ${isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-[#f4f4f5] text-[#71717a]'}`}
                              title={`${b.purpose} (${format(new Date(b.startTime), 'HH:mm')}–${format(new Date(b.endTime), 'HH:mm')})`}
                            >
                              {format(new Date(b.startTime), 'HH:mm')}–{format(new Date(b.endTime), 'HH:mm')} {b.purpose}
                            </div>
                          );
                        })}
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
            <table className="min-w-full divide-y divide-[#f4f4f5]">
              <thead>
                <tr>
                  {['ID','Resource','Booked By','Date','Time','Purpose','Status','Action'].map(h => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#f4f4f5]">
                {bookingsList.map(b => (
                  <tr key={b.id} className="table-tr">
                    <td className="table-td">{b.id.substring(0,8)}</td>
                    <td className="table-td font-medium">{b.resource?.name}</td>
                    <td className="table-td">{b.bookedBy?.name}</td>
                    <td className="table-td">{format(new Date(b.startTime), 'yyyy-MM-dd')}</td>
                    <td className="table-td">{format(new Date(b.startTime), 'HH:mm')} – {format(new Date(b.endTime), 'HH:mm')}</td>
                    <td className="table-td">{b.purpose}</td>
                    <td className="table-td"><StatusBadge status={b.status} /></td>
                    <td className="table-td">
                      {['UPCOMING', 'ONGOING'].includes(b.status) && (
                        <button 
                          className="btn-ghost py-1 px-2 text-xs text-red-500"
                          onClick={() => {
                            if(window.confirm('Are you sure you want to cancel this booking?')) {
                              handleCancelBooking(b.id);
                            }
                          }}
                        >
                          <X size={13} className="inline mr-1"/> Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {bookingsList.length === 0 && (
                  <tr><td colSpan="8" className="text-center p-4 text-sm text-[#71717a]">No bookings found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Overlap conflict */}
      <ConflictModal
        isOpen={conflictOpen}
        onClose={() => setConflictOpen(false)}
        title="Booking Overlap Detected"
        message="The selected time slot is already booked for this resource."
        conflictDetail={conflictMsg}
        alternativeLabel="Close"
        onAlternative={() => setConflictOpen(false)}
      />
    </div>
  );
}
