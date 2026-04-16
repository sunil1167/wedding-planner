import { supabase } from '../../lib/supabase';

export default async function handler(req, res) {
  try {
    const { method } = req;

    switch (method) {
      case 'GET': {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        return res.status(200).json(data);
      }

      case 'POST': {
        const body = req.body || {};

        const newTask = {
          id: Date.now().toString(),
          title: body.title || '',
          category: body.category || '',
          due_date: body.dueDate || '',
          completed: false,
          total_cost: !isNaN(parseFloat(body.totalCost))
            ? parseFloat(body.totalCost)
            : 0,
          amount_paid: !isNaN(parseFloat(body.amountPaid))
            ? parseFloat(body.amountPaid)
            : 0,
          notes: body.notes || '',
          extra_info: body.extraInfo || '',
        };

        const { data, error } = await supabase
          .from('tasks')
          .insert([newTask])
          .select()
          .single();

        if (error) throw error;

        return res.status(201).json(data);
      }

      case 'PUT': {
        const { id } = req.query;
        const body = req.body || {};

        const updateData = {
          title: body.title,
          category: body.category,
          due_date: body.dueDate,
          completed: body.completed,
          notes: body.notes,
          extra_info: body.extraInfo,
        };

        if (!isNaN(parseFloat(body.totalCost))) {
          updateData.total_cost = parseFloat(body.totalCost);
        }

        if (!isNaN(parseFloat(body.amountPaid))) {
          updateData.amount_paid = parseFloat(body.amountPaid);
        }

        const { data, error } = await supabase
          .from('tasks')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        return res.status(200).json(data);
      }

      case 'DELETE': {
        const { id } = req.query;

        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', id);

        if (error) throw error;

        return res.status(200).json({ success: true });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Supabase API Error:', error);

    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
}