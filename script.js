class ExpenseTracker {
    constructor() {
        this.apiUrl = '/api';
        this.expenses = [];
        this.editingId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadExpenses();
        this.setDefaultDate();
    }

    bindEvents() {
        document.getElementById('expenseForm').addEventListener('submit', (e) => this.handleSubmit(e));
        document.getElementById('cancelBtn').addEventListener('click', () => this.cancelEdit());
        document.getElementById('categoryFilter').addEventListener('change', () => this.filterExpenses());
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }

    async loadExpenses() {
        try {
            const response = await fetch(`${this.apiUrl}/expenses`);
            this.expenses = await response.json();
            this.renderExpenses();
            this.updateSummary();
        } catch (error) {
            console.error('Error loading expenses:', error);
            this.showError('Failed to load expenses');
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = {
            amount: document.getElementById('amount').value,
            description: document.getElementById('description').value,
            category: document.getElementById('category').value,
            date: document.getElementById('date').value
        };

        try {
            if (this.editingId) {
                await this.updateExpense(this.editingId, formData);
            } else {
                await this.addExpense(formData);
            }
            
            this.resetForm();
            this.loadExpenses();
        } catch (error) {
            console.error('Error saving expense:', error);
            this.showError('Failed to save expense');
        }
    }

    async addExpense(data) {
        const response = await fetch(`${this.apiUrl}/expenses`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to add expense');
        }
    }

    async updateExpense(id, data) {
        const response = await fetch(`${this.apiUrl}/expenses/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to update expense');
        }
    }

    async deleteExpense(id) {
        if (!confirm('Are you sure you want to delete this expense?')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/expenses/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete expense');
            }

            this.loadExpenses();
        } catch (error) {
            console.error('Error deleting expense:', error);
            this.showError('Failed to delete expense');
        }
    }

    editExpense(id) {
        const expense = this.expenses.find(exp => exp.id === id);
        if (!expense) return;

        document.getElementById('amount').value = expense.amount;
        document.getElementById('description').value = expense.description;
        document.getElementById('category').value = expense.category;
        document.getElementById('date').value = expense.date;

        this.editingId = id;
        document.getElementById('submitBtn').textContent = 'Update Expense';
        document.getElementById('cancelBtn').style.display = 'inline-block';
        
        // Scroll to form
        document.querySelector('.add-expense').scrollIntoView({ behavior: 'smooth' });
    }

    cancelEdit() {
        this.resetForm();
    }

    resetForm() {
        document.getElementById('expenseForm').reset();
        this.editingId = null;
        document.getElementById('submitBtn').textContent = 'Add Expense';
        document.getElementById('cancelBtn').style.display = 'none';
        this.setDefaultDate();
    }

    filterExpenses() {
        const filterCategory = document.getElementById('categoryFilter').value;
        this.renderExpenses(filterCategory);
    }

    renderExpenses(filterCategory = '') {
        const container = document.getElementById('expensesList');
        let filteredExpenses = this.expenses;

        if (filterCategory) {
            filteredExpenses = this.expenses.filter(exp => exp.category === filterCategory);
        }

        if (filteredExpenses.length === 0) {
            container.innerHTML = '<div class="no-expenses">No expenses found.</div>';
            return;
        }

        // Sort by date (newest first)
        filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = filteredExpenses.map(expense => `
            <div class="expense-item">
                <div class="expense-info">
                    <div class="expense-description">${this.escapeHtml(expense.description)}</div>
                    <div class="expense-details">
                        ${this.getCategoryIcon(expense.category)} ${expense.category.charAt(0).toUpperCase() + expense.category.slice(1)} • ${this.formatDate(expense.date)}
                    </div>
                </div>
                <div class="expense-amount">-$${expense.amount.toFixed(2)}</div>
                <div class="expense-actions">
                    <button class="btn-edit" onclick="tracker.editExpense('${expense.id}')">Edit</button>
                    <button class="btn-delete" onclick="tracker.deleteExpense('${expense.id}')">Delete</button>
                </div>
            </div>
        `).join('');
    }

    async updateSummary() {
        try {
            const response = await fetch(`${this.apiUrl}/summary`);
            const summary = await response.json();
            
            document.getElementById('totalAmount').textContent = `$${summary.total}`;
            document.getElementById('totalCount').textContent = summary.count;
        } catch (error) {
            console.error('Error loading summary:', error);
        }
    }

    getCategoryIcon(category) {
        const icons = {
            food: '🍕',
            transport: '🚗',
            entertainment: '🎬',
            shopping: '🛒',
            utilities: '💡',
            health: '💊',
            other: '📦'
        };
        return icons[category] || '📦';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        alert(message); // Simple error handling - you could enhance this with a toast/notification system
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tracker = new ExpenseTracker();
});
