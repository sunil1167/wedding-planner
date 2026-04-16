import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'tasks.json');

function readTasks() {
  try {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeTasks(tasks) {
  fs.writeFileSync(dataFilePath, JSON.stringify(tasks, null, 2), 'utf8');
}

export default function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET': {
      const tasks = readTasks();
      res.status(200).json(tasks);
      break;
    }

    case 'POST': {
      const tasks = readTasks();
      const newTask = {
        id: Date.now().toString(),
        title: req.body.title || '',
        category: req.body.category || '',
        dueDate: req.body.dueDate || '',
        completed: false,
        totalCost: parseFloat(req.body.totalCost) || 0,
        amountPaid: parseFloat(req.body.amountPaid) || 0,
        notes: req.body.notes || '',
        extraInfo: req.body.extraInfo || '',
        createdAt: new Date().toISOString(),
      };
      tasks.push(newTask);
      writeTasks(tasks);
      res.status(201).json(newTask);
      break;
    }

    case 'PUT': {
      const { id } = req.query;
      const tasks = readTasks();
      const index = tasks.findIndex((t) => t.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Task not found' });
      }
      tasks[index] = {
        ...tasks[index],
        ...req.body,
        id: tasks[index].id,
        totalCost: parseFloat(req.body.totalCost) ?? tasks[index].totalCost,
        amountPaid: parseFloat(req.body.amountPaid) ?? tasks[index].amountPaid,
      };
      writeTasks(tasks);
      res.status(200).json(tasks[index]);
      break;
    }

    case 'DELETE': {
      const { id } = req.query;
      const tasks = readTasks();
      const filtered = tasks.filter((t) => t.id !== id);
      if (filtered.length === tasks.length) {
        return res.status(404).json({ error: 'Task not found' });
      }
      writeTasks(filtered);
      res.status(200).json({ success: true });
      break;
    }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
