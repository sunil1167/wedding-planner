import { useState, useRef, useEffect } from 'react';
import styles from '../styles/TaskCard.module.css';

const CATEGORY_CONFIG = {
  venue:        { label: 'Venue',       icon: '🏛️',  color: '#b5956a', bg: 'rgba(181,149,106,0.12)', accent: '#c9a87c' },
  catering:     { label: 'Catering',    icon: '🍽️',  color: '#a0785a', bg: 'rgba(160,120,90,0.12)',  accent: '#c49070' },
  decoration:   { label: 'Decoration',  icon: '🌸',  color: '#a07880', bg: 'rgba(160,120,128,0.12)', accent: '#c49098' },
  photography:  { label: 'Photography', icon: '📷',  color: '#7880a0', bg: 'rgba(120,128,160,0.12)', accent: '#9098c4' },
  music:        { label: 'Music',       icon: '🎵',  color: '#80a078', bg: 'rgba(128,160,120,0.12)', accent: '#98c490' },
  attire:       { label: 'Attire',      icon: '👗',  color: '#a08870', bg: 'rgba(160,136,112,0.12)', accent: '#c4a888' },
  other:        { label: 'Other',       icon: '✨',  color: '#8a8a8a', bg: 'rgba(138,138,138,0.10)', accent: '#aaaaaa' },
};

function formatCurrency(val) {
  const num = parseFloat(val) || 0;
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 0 });
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(dateStr);
  const diff = Math.round((due - today) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function TaskCard({ task, onEdit, onDelete, onToggle, onUpdateNotes }) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(task.notes || '');
  const [extraInfo, setExtraInfo] = useState(task.extraInfo || '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef(null);

  const total = parseFloat(task.totalCost) || 0;
  const paid = parseFloat(task.amountPaid) || 0;
  const remaining = total - paid;
  const progress = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
  const cat = CATEGORY_CONFIG[task.category] || CATEGORY_CONFIG.other;
  const daysUntil = getDaysUntil(task.dueDate);
  const isOverdue = daysUntil !== null && daysUntil < 0 && !task.completed;
  const isUrgent = daysUntil !== null && daysUntil >= 0 && daysUntil <= 7 && !task.completed;

  function saveNotes() {
    onUpdateNotes(task.id, { notes, extraInfo });
    setEditingNotes(false);
  }

  function handleToggle() {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);
    onToggle(task.id, !task.completed);
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); return; }
    onDelete(task.id);
  }

  // Mouse parallax tilt effect
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.setProperty('--tilt-x', `${y * -6}deg`);
      card.style.setProperty('--tilt-y', `${x * 6}deg`);
    };
    const handleMouseLeave = () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    };
    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);
    return () => { card.removeEventListener('mousemove', handleMouseMove); card.removeEventListener('mouseleave', handleMouseLeave); };
  }, []);

  return (
    <div
      ref={cardRef}
      className={`${styles.card} ${task.completed ? styles.completed : ''} ${isOverdue ? styles.overdue : ''} ${isAnimating ? styles.toggling : ''}`}
      style={{ '--accent': cat.color, '--accent-bg': cat.bg, '--accent-glow': cat.accent }}
    >
      {/* Decorative top border */}
      <div className={styles.topAccent} style={{ background: `linear-gradient(90deg, transparent, ${cat.color}, transparent)` }} />

      {/* Card shimmer on hover */}
      <div className={styles.shimmer} />

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span className={styles.catIcon}>{cat.icon}</span>
          <div>
            <h3 className={styles.title}>{task.title}</h3>
            <span className={styles.badge} style={{ background: cat.bg, color: cat.color, borderColor: cat.color + '40' }}>
              {cat.label}
            </span>
          </div>
        </div>
        <div className={styles.statusDot} title={task.completed ? 'Completed' : 'Pending'}>
          {task.completed ? (
            <span className={styles.checkMark}>✓</span>
          ) : (
            <span className={styles.pendingDot} />
          )}
        </div>
      </div>

      {/* Date */}
      {task.dueDate && (
        <div className={`${styles.dateRow} ${isOverdue ? styles.overdueDate : ''} ${isUrgent ? styles.urgentDate : ''}`}>
          <span className={styles.dateIcon}>📅</span>
          <span>{formatDate(task.dueDate)}</span>
          {isOverdue && <span className={styles.urgentTag}>Overdue</span>}
          {isUrgent && <span className={styles.urgentTag} style={{background:'rgba(200,140,60,0.15)', color:'#c08c3c', borderColor:'#c08c3c40'}}>Due soon</span>}
        </div>
      )}

      {/* Budget section */}
      {total > 0 && (
        <div className={styles.budgetSection}>
          <div className={styles.budgetRow}>
            <div className={styles.budgetItem}>
              <span className={styles.budgetLabel}>Total</span>
              <span className={styles.budgetValue}>{formatCurrency(total)}</span>
            </div>
            <div className={styles.budgetDivider} />
            <div className={styles.budgetItem}>
              <span className={styles.budgetLabel}>Paid</span>
              <span className={styles.budgetValue} style={{ color: '#7a9e7a' }}>{formatCurrency(paid)}</span>
            </div>
            <div className={styles.budgetDivider} />
            <div className={styles.budgetItem}>
              <span className={styles.budgetLabel}>Remaining</span>
              <span className={styles.budgetValue} style={{ color: remaining > 0 ? cat.color : '#7a9e7a' }}>{formatCurrency(remaining)}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${cat.color}88, ${cat.accent})` }}
            />
            <span className={styles.progressLabel}>{Math.round(progress)}%</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button
          className={`${styles.btn} ${styles.btnPrimary} ${task.completed ? styles.btnDone : ''}`}
          onClick={handleToggle}
        >
          {task.completed ? '✓ Completed' : 'Mark Done'}
        </button>
        <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => onEdit(task)}>
          ✏️ Edit
        </button>
        <button
          className={`${styles.btn} ${styles.btnDanger} ${confirmDelete ? styles.btnConfirm : ''}`}
          onClick={handleDelete}
        >
          {confirmDelete ? 'Confirm?' : '🗑️'}
        </button>
      </div>

      {/* Notes toggle */}
      <button className={styles.notesToggle} onClick={() => setNotesOpen(!notesOpen)}>
        <span className={styles.notesIcon}>{notesOpen ? '▲' : '▼'}</span>
        <span>{notesOpen ? 'Hide Notes' : 'Show Notes'}</span>
        {(task.notes || task.extraInfo) && <span className={styles.notesDot} />}
      </button>

      {/* Notes panel */}
      {notesOpen && (
        <div className={styles.notesPanel}>
          {editingNotes ? (
            <div className={styles.notesEdit}>
              <label className={styles.notesFieldLabel}>Notes</label>
              <textarea
                className={styles.textarea}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes about this task…"
                rows={3}
              />
              <label className={styles.notesFieldLabel}>Additional Info</label>
              <textarea
                className={styles.textarea}
                value={extraInfo}
                onChange={e => setExtraInfo(e.target.value)}
                placeholder="Vendor contacts, links, references…"
                rows={2}
              />
              <div className={styles.notesBtns}>
                <button className={`${styles.btn} ${styles.btnSave}`} onClick={saveNotes}>Save Notes</button>
                <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setEditingNotes(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className={styles.notesView}>
              {notes ? <p className={styles.notesText}>{notes}</p> : <p className={styles.notesEmpty}>No notes yet.</p>}
              {extraInfo && <p className={styles.extraText}>{extraInfo}</p>}
              <button className={`${styles.btn} ${styles.btnGhost} ${styles.btnSm}`} onClick={() => setEditingNotes(true)}>
                ✏️ Edit Notes
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}