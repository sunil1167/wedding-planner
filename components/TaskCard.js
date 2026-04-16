import { useState } from 'react';
import styles from '../styles/TaskCard.module.css';

const CATEGORY_CONFIG = {
  venue:       { label: 'Venue',        color: '#7b9ea3', bg: '#e8f2f4' },
  catering:    { label: 'Catering',     color: '#a37b7b', bg: '#f4e8e8' },
  decoration:  { label: 'Decoration',   color: '#8a9e7b', bg: '#eaf4e8' },
  photography: { label: 'Photography',  color: '#9b8aa3', bg: '#f0eaf4' },
  music:       { label: 'Music',        color: '#a38e7b', bg: '#f4ece8' },
  attire:      { label: 'Attire',       color: '#a39b7b', bg: '#f4f2e8' },
  stationery:  { label: 'Stationery',   color: '#7ba39e', bg: '#e8f4f2' },
  transport:   { label: 'Transport',    color: '#7b8ea3', bg: '#e8eef4' },
  other:       { label: 'Other',        color: '#8a8a8a', bg: '#f0f0f0' },
};

function formatCurrency(val) {
  const num = parseFloat(val) || 0;
  return '₹' + num.toLocaleString('en-IN');
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isOverdue(dateStr, completed) {
  if (!dateStr || completed) return false;
  return new Date(dateStr + 'T00:00:00') < new Date();
}

export default function TaskCard({ task, onEdit, onDelete, onToggle, onUpdateNotes }) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(task.notes || '');
  const [extraDraft, setExtraDraft] = useState(task.extraInfo || '');

  const total = parseFloat(task.totalCost) || 0;
  const paid = parseFloat(task.amountPaid) || 0;
  const remaining = total - paid;
  const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;

  const payStatus = pct >= 100 ? 'fullPaid' : paid > 0 ? 'partPaid' : 'notPaid';
  const payLabel = pct >= 100 ? 'Fully Paid' : paid > 0 ? 'Partial' : 'Unpaid';

  const cat = CATEGORY_CONFIG[task.category] || CATEGORY_CONFIG.other;
  const overdue = isOverdue(task.dueDate, task.completed);

  function handleSaveNotes() {
    onUpdateNotes(task.id, { notes: notesDraft, extraInfo: extraDraft });
    setEditingNotes(false);
  }

  return (
    <div className={`${styles.card} ${task.completed ? styles.completed : ''}`}>
      <div className={styles.categoryStripe} style={{ '--stripe-color': cat.color }} />

      {/* HEADER */}
      <div className={styles.cardHeader}>
        <button
          className={styles.checkBtn}
          onClick={() => onToggle(task.id, !task.completed)}
          title={task.completed ? 'Mark as pending' : 'Mark as completed'}
          aria-label="Toggle completion"
        >
          {task.completed ? '✓' : ''}
        </button>
        <div className={styles.cardMeta}>
          <div className={styles.cardTitle}>{task.title}</div>
          <div className={styles.cardBadges}>
            {task.category && (
              <span
                className={styles.badge}
                style={{ '--badge-bg': cat.bg, '--badge-color': cat.color }}
              >
                {cat.label}
              </span>
            )}
            {task.dueDate && (
              <span className={`${styles.dateBadge} ${overdue ? styles.overdue : ''}`}>
                {overdue ? '⚠ ' : '📅 '}
                {formatDate(task.dueDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* PAYMENT */}
      {total > 0 && (
        <div className={styles.paymentSection}>
          <div className={styles.paymentBar}>
            <div
              className={`${styles.paymentFill} ${styles[payStatus]}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className={styles.paymentRow}>
            <div className={styles.paymentAmounts}>
              <div className={styles.paymentItem}>
                <span className={styles.paymentItemLabel}>Total</span>
                <span className={styles.paymentItemValue}>{formatCurrency(total)}</span>
              </div>
              <div className={styles.paymentItem}>
                <span className={styles.paymentItemLabel}>Paid</span>
                <span className={styles.paymentItemValue}>{formatCurrency(paid)}</span>
              </div>
              {remaining > 0 && (
                <div className={styles.paymentItem}>
                  <span className={styles.paymentItemLabel}>Due</span>
                  <span className={styles.paymentItemValue}>{formatCurrency(remaining)}</span>
                </div>
              )}
            </div>
            <span className={`${styles.paymentStatus} ${styles[payStatus]}`}>
              {payLabel}
            </span>
          </div>
        </div>
      )}

      {/* ACTIONS */}
      <div className={styles.cardActions}>
        <button className={styles.actionBtn} onClick={() => onEdit(task)} title="Edit task">
          ✏️ Edit
        </button>
        <button
          className={`${styles.actionBtn} ${styles.danger}`}
          onClick={() => onDelete(task.id)}
          title="Delete task"
        >
          🗑 Delete
        </button>
        <button
          className={styles.expandBtn}
          onClick={() => setNotesOpen(o => !o)}
          aria-expanded={notesOpen}
        >
          Notes
          <span className={`${styles.expandIcon} ${notesOpen ? styles.open : ''}`}>▾</span>
        </button>
      </div>

      {/* NOTES */}
      <div className={`${styles.notesSection} ${notesOpen ? styles.open : ''}`}>
        <div className={styles.notesSectionInner}>
          <div className={styles.notesLabel}>Notes</div>
          {editingNotes ? (
            <>
              <textarea
                className={styles.notesTextarea}
                value={notesDraft}
                onChange={e => setNotesDraft(e.target.value)}
                placeholder="Add notes…"
                rows={3}
              />
              <div className={styles.notesDivider} />
              <div className={styles.notesLabel}>Extra Info / Contacts</div>
              <textarea
                className={styles.notesTextarea}
                value={extraDraft}
                onChange={e => setExtraDraft(e.target.value)}
                placeholder="Contacts, instructions…"
                rows={2}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className={styles.saveNotesBtn} onClick={handleSaveNotes}>
                  ✓ Save Notes
                </button>
                <button
                  className={styles.saveNotesBtn}
                  style={{ background: 'var(--cream-dark)', color: 'var(--text-mid)' }}
                  onClick={() => {
                    setNotesDraft(task.notes || '');
                    setExtraDraft(task.extraInfo || '');
                    setEditingNotes(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              {task.notes ? (
                <p className={styles.notesText}>{task.notes}</p>
              ) : (
                <p className={styles.notesEmpty}>No notes yet.</p>
              )}
              {task.extraInfo && (
                <>
                  <div className={styles.notesDivider} />
                  <div className={styles.notesLabel}>Extra Info</div>
                  <p className={styles.notesText}>{task.extraInfo}</p>
                </>
              )}
              <button
                className={styles.saveNotesBtn}
                style={{ marginTop: 10 }}
                onClick={() => setEditingNotes(true)}
              >
                ✏️ Edit Notes
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
