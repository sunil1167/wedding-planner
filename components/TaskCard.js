import { useState } from 'react';
import styles from '../styles/TaskCard.module.css';

const CATEGORY_CONFIG = {
  venue: { label: 'Venue', color: '#7b9ea3', bg: '#e8f2f4' },
  catering: { label: 'Catering', color: '#a37b7b', bg: '#f4e8e8' },
  decoration: { label: 'Decoration', color: '#8a9e7b', bg: '#eaf4e8' },
  photography: { label: 'Photography', color: '#9b8aa3', bg: '#f0eaf4' },
  music: { label: 'Music', color: '#a38e7b', bg: '#f4ece8' },
  attire: { label: 'Attire', color: '#a39b7b', bg: '#f4f2e8' },
  stationery: { label: 'Stationery', color: '#7ba39e', bg: '#e8f4f2' },
  transport: { label: 'Transport', color: '#7b8ea3', bg: '#e8eef4' },
  other: { label: 'Other', color: '#8a8a8a', bg: '#f0f0f0' },
};

function formatCurrency(val) {
  const num = parseFloat(val) || 0;
  return '₹' + num.toLocaleString('en-IN');
}

export default function TaskCard({ task, onEdit, onDelete, onToggle, onUpdateNotes }) {
  const [notesOpen, setNotesOpen] = useState(false);

  const total = parseFloat(task.totalCost) || 0;
  const paid = parseFloat(task.amountPaid) || 0;
  const remaining = total - paid;

  const cat = CATEGORY_CONFIG[task.category] || CATEGORY_CONFIG.other;

  return (
    <div className={styles.card}>
      <h3>{task.title}</h3>

      {task.dueDate && <p>📅 {task.dueDate}</p>}

      <p>💰 {formatCurrency(total)}</p>
      <p>💸 {formatCurrency(paid)}</p>
      <p>⚠ {formatCurrency(remaining)}</p>

      <button onClick={() => onToggle(task.id, !task.completed)}>
        {task.completed ? '✓ Done' : 'Mark Done'}
      </button>

      <button onClick={() => onEdit(task)}>Edit</button>
      <button onClick={() => onDelete(task.id)}>Delete</button>

      <button onClick={() => setNotesOpen(!notesOpen)}>Notes</button>

      {notesOpen && (
        <div>
          <p>{task.notes}</p>
          <p>{task.extraInfo}</p>
        </div>
      )}
    </div>
  );
}