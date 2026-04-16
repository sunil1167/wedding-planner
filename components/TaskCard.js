import { useState } from 'react';
import styles from '../styles/TaskCard.module.css';

const CATEGORY_CONFIG = {
  venue: { label: 'Venue', color: '#7b9ea3', bg: '#e8f2f4' },
  catering: { label: 'Catering', color: '#a37b7b', bg: '#f4e8e8' },
  decoration: { label: 'Decoration', color: '#8a9e7b', bg: '#eaf4e8' },
  photography: { label: 'Photography', color: '#9b8aa3', bg: '#f0eaf4' },
  other: { label: 'Other', color: '#8a8a8a', bg: '#f0f0f0' },
};

function formatCurrency(val) {
  const num = parseFloat(val) || 0;
  return '₹' + num.toLocaleString('en-IN');
}

export default function TaskCard({ task, onEdit, onDelete, onToggle, onUpdateNotes }) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(task.notes || '');
  const [extraInfo, setExtraInfo] = useState(task.extraInfo || '');

  const total = parseFloat(task.totalCost) || 0;
  const paid = parseFloat(task.amountPaid) || 0;
  const remaining = total - paid;
  const progress = total > 0 ? (paid / total) * 100 : 0;

  const cat = CATEGORY_CONFIG[task.category] || CATEGORY_CONFIG.other;

  function saveNotes() {
    onUpdateNotes(task.id, { notes, extraInfo });
    setEditingNotes(false);
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3>{task.title}</h3>
        <span
          className={styles.badge}
          style={{ background: cat.bg, color: cat.color }}
        >
          {cat.label}
        </span>
      </div>

      {task.dueDate && <p className={styles.date}>📅 {task.dueDate}</p>}

      <div className={styles.budget}>
        <p>Total: {formatCurrency(total)}</p>
        <p>Paid: {formatCurrency(paid)}</p>
        <p>Remaining: {formatCurrency(remaining)}</p>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressBar}>
        <div
          className={styles.progress}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className={styles.actions}>
        <button onClick={() => onToggle(task.id, !task.completed)}>
          {task.completed ? '✓ Done' : 'Mark Done'}
        </button>

        <button onClick={() => onEdit(task)}>Edit</button>
        <button onClick={() => onDelete(task.id)}>Delete</button>
      </div>

      <button
        className={styles.notesToggle}
        onClick={() => setNotesOpen(!notesOpen)}
      >
        {notesOpen ? 'Hide Notes' : 'Show Notes'}
      </button>

      {notesOpen && (
        <div className={styles.notes}>
          {editingNotes ? (
            <>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Notes"
              />
              <textarea
                value={extraInfo}
                onChange={e => setExtraInfo(e.target.value)}
                placeholder="Extra Info"
              />
              <button onClick={saveNotes}>Save</button>
            </>
          ) : (
            <>
              <p>{notes || 'No notes added'}</p>
              <p>{extraInfo}</p>
              <button onClick={() => setEditingNotes(true)}>Edit Notes</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}