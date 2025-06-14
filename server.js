const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DATA_FILE = 'expenses.json';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Helper function to read expenses
const readExpenses = () => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

// Helper function to write expenses
const writeExpenses = (expenses) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2));
};

// Routes

// Get all expenses
app.get('/api/expenses', (req, res) => {
    const expenses = readExpenses();
    res.json(expenses);
});

// Add new expense
app.post('/api/expenses', (req, res) => {
    const { amount, description, category, date } = req.body;
    
    if (!amount || !description || !category || !date) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const expenses = readExpenses();
    const newExpense = {
        id: Date.now().toString(),
        amount: parseFloat(amount),
        description,
        category,
        date,
        createdAt: new Date().toISOString()
    };

    expenses.push(newExpense);
    writeExpenses(expenses);
    
    res.status(201).json(newExpense);
});

// Update expense
app.put('/api/expenses/:id', (req, res) => {
    const { id } = req.params;
    const { amount, description, category, date } = req.body;
    
    const expenses = readExpenses();
    const expenseIndex = expenses.findIndex(exp => exp.id === id);
    
    if (expenseIndex === -1) {
        return res.status(404).json({ error: 'Expense not found' });
    }

    expenses[expenseIndex] = {
        ...expenses[expenseIndex],
        amount: parseFloat(amount),
        description,
        category,
        date
    };

    writeExpenses(expenses);
    res.json(expenses[expenseIndex]);
});

// Delete expense
app.delete('/api/expenses/:id', (req, res) => {
    const { id } = req.params;
    const expenses = readExpenses();
    const filteredExpenses = expenses.filter(exp => exp.id !== id);
    
    if (filteredExpenses.length === expenses.length) {
        return res.status(404).json({ error: 'Expense not found' });
    }

    writeExpenses(filteredExpenses);
    res.json({ message: 'Expense deleted successfully' });
});

// Get spending summary
app.get('/api/summary', (req, res) => {
    const expenses = readExpenses();
    
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const byCategory = expenses.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
    }, {});

    res.json({
        total: total.toFixed(2),
        byCategory,
        count: expenses.length
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
