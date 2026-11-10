
// ======================================
// SPENDWISE - PERSONAL FINANCE TRACKER
// ======================================

// 1. SELECT HTML ELEMENTS

const transactionForm = document.getElementById("transactionForm");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const transactionList = document.getElementById("transactionList");
const filterCategory = document.getElementById("filterCategory");

// 2. CATEGORIES

const categories = [
    "Food",
    "Transport",
    "Rent",
    "Entertainment",
    "Savings",
    "Utilities"
];

// 3. FORMAT MONEY IN KENYAN SHILLINGS

function formatMoney(amount) {
    return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        minimumFractionDigits: 2
    }).format(amount);
}

// 4. GET TODAY'S DATE

function getLocalDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

dateInput.value = getLocalDate();
dateInput.max = getLocalDate();

document.getElementById("todayDate").textContent =
    new Date().toLocaleDateString("en-KE", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });

// 5. LOAD SAVED TRANSACTIONS

function loadTransactions() {
    try {
        const savedData = localStorage.getItem("spendwiseTransactions");

        if (!savedData) {
            return [];
        }

        const parsedData = JSON.parse(savedData);

        if (!Array.isArray(parsedData)) {
            return [];
        }

        return parsedData.filter(transaction =>
            transaction &&
            typeof transaction.id === "string" &&
            typeof transaction.description === "string" &&
            Number.isFinite(transaction.amount) &&
            transaction.amount > 0 &&
            ["income", "expense"].includes(transaction.type) &&
            typeof transaction.category === "string" &&
            typeof transaction.date === "string"
        );

    } catch (error) {
        console.error("Could not load saved transactions:", error);
        return [];
    }
}

let transactions = loadTransactions();

// 6. SAVE TRANSACTIONS TO LOCAL STORAGE

function saveTransactions() {
    try {
        localStorage.setItem(
            "spendwiseTransactions",
            JSON.stringify(transactions)
        );
    } catch (error) {
        alert("Your browser could not save the transactions.");
        console.error(error);
    }
}

// 7. ADD A NEW TRANSACTION

transactionForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;
    const category = categoryInput.value;
    const date = dateInput.value;

    // Validate user input

    if (!description) {
        alert("Please enter a transaction description.");
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000000) {
        alert("Please enter a valid amount.");
        return;
    }

    if (!["income", "expense"].includes(type)) {
        alert("Please select a valid transaction type.");
        return;
    }

    if (![...categories, "Other"].includes(category)) {
        alert("Please select a valid category.");
        return;
    }

    if (!date || date > getLocalDate()) {
        alert("Please select a valid date.");
        return;
    }

    // Create transaction object

    const newTransaction = {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        description: description,
        amount: amount,
        type: type,
        category: category,
        date: date
    };

    // Add transaction to the array

    transactions.push(newTransaction);

    // Save and update dashboard

    saveTransactions();
    updateDashboard();

    // Reset form

    transactionForm.reset();
    dateInput.value = getLocalDate();
    dateInput.max = getLocalDate();

    alert("Transaction added successfully!");
});

// 8. CALCULATE TOTAL INCOME

function calculateIncome() {

    return transactions
        .filter(transaction => transaction.type === "income")
        .reduce((total, transaction) => total + transaction.amount, 0);

}

// 9. CALCULATE TOTAL EXPENSES

function calculateExpenses() {

    return transactions
        .filter(transaction => transaction.type === "expense")
        .reduce((total, transaction) => total + transaction.amount, 0);

}

// 10. UPDATE FINANCIAL SUMMARY

function updateSummary() {

    const income = calculateIncome();
    const expenses = calculateExpenses();
    const balance = income - expenses;

    document.getElementById("totalIncome").textContent =
        formatMoney(income);

    document.getElementById("totalExpenses").textContent =
        formatMoney(expenses);

    document.getElementById("totalBalance").textContent =
        formatMoney(balance);

}

// 11. UPDATE SPENDING CATEGORIES

function updateCategories() {

    categories.forEach(category => {

        const total = transactions
            .filter(transaction =>
                transaction.type === "expense" &&
                transaction.category === category
            )
            .reduce((sum, transaction) => sum + transaction.amount, 0);

        const elementId =
            category.toLowerCase() + "Amount";

        document.getElementById(elementId).textContent =
            formatMoney(total);

    });

}

// 12. PROTECT TRANSACTION TEXT IN HTML

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, character => {

        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];

    });

}

// 13. DISPLAY TRANSACTIONS

function displayTransactions() {

    const selectedCategory = filterCategory.value;

    let filteredTransactions = [...transactions];

    if (selectedCategory !== "All") {

        filteredTransactions = filteredTransactions.filter(
            transaction => transaction.category === selectedCategory
        );

    }

    // Display newest transactions first

    filteredTransactions.sort((a, b) =>
        b.date.localeCompare(a.date) ||
        b.id.localeCompare(a.id)
    );

    // Show an empty message when there are no transactions

    if (filteredTransactions.length === 0) {

        transactionList.innerHTML = `
            <tr>
                <td colspan="6" class="empty-message">
                    No transactions found.
                    Add a transaction to get started.
                </td>
            </tr>
        `;

        return;
    }

    // Create table rows

    transactionList.innerHTML = filteredTransactions.map(transaction => {

        const isIncome = transaction.type === "income";

        const amountClass = isIncome
            ? "amount-income"
            : "amount-expense";

        const badgeClass = isIncome
            ? "income-badge"
            : "expense-badge";

        const sign = isIncome ? "+" : "-";

        const formattedDate = new Date(
            transaction.date + "T00:00:00"
        ).toLocaleDateString("en-KE", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

        return `
            <tr>
                <td><strong>${escapeHTML(transaction.description)}</strong></td>

                <td>${escapeHTML(transaction.category)}</td>

                <td>${formattedDate}</td>

                <td>
                    <span class="type-badge ${badgeClass}">
                        ${isIncome ? "Income" : "Expense"}
                    </span>
                </td>

                <td class="${amountClass}">
                    ${sign} ${formatMoney(transaction.amount)}
                </td>

                <td>
                    <button
                        class="delete-button"
                        data-id="${escapeHTML(transaction.id)}"
                        type="button"
                        aria-label="Delete ${escapeHTML(transaction.description)}"
                    >
                        Delete
                    </button>
                </td>
            </tr>
        `;

    }).join("");

}

// 14. DELETE A TRANSACTION

transactionList.addEventListener("click", function(event) {

    const deleteButton = event.target.closest(".delete-button");

    if (!deleteButton) {
        return;
    }

    const transactionId = deleteButton.dataset.id;

    const confirmed = confirm(
        "Are you sure you want to delete this transaction?"
    );

    if (!confirmed) {
        return;
    }

    transactions = transactions.filter(
        transaction => transaction.id !== transactionId
    );

    saveTransactions();
    updateDashboard();

});

// 15. FILTER TRANSACTIONS BY CATEGORY

filterCategory.addEventListener("change", function() {

    displayTransactions();

});

// 16. UPDATE THE COMPLETE DASHBOARD

function updateDashboard() {

    updateSummary();
    updateCategories();
    displayTransactions();

}

// 17. START THE APPLICATION

updateDashboard();

console.log("SpendWise application loaded successfully!");
