async function fetchPrices(tokenName, tokenAddress) {
    const url = `https://birdeye-proxy.jup.ag/defi/multi_price?list_address=${tokenAddress},EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        const value = data.data[tokenAddress]?.value;
        return { tokenName, value: value ? parseFloat(value).toFixed(10) : 'Error' };
    } catch (error) {
        console.error(`Error fetching prices for token ${tokenName}:`, error);
        return { tokenName, value: 'Error' };
    }
}

async function readTokensAndFetchPrices() {
    try {
        const response = await fetch('tokens.txt');
        const text = await response.text();
        const tokens = text.split('\n').map(line => line.trim()).filter(line => line);

        const prices = [];
        for (const token of tokens) {
            const [tokenName, tokenAddress] = token.split(';');
            if (tokenName && tokenAddress) {
                const price = await fetchPrices(tokenName, tokenAddress);
                prices.push(price);
            }
        }
        updateTable(prices);
    } catch (error) {
        console.error('Error reading tokens.txt:', error);
    }
}

function updateTable(prices) {
    const tbody = document.querySelector('#pricesTable tbody');
    tbody.innerHTML = ''; // Limpa a tabela antes de atualizar

    prices.forEach(({ tokenName, value }, index) => {
        const row = document.createElement('tr');
        
        // Coluna do contador
        const indexCell = document.createElement('td');
        indexCell.textContent = index + 1; // Começa de 1
        row.appendChild(indexCell);

        const nameCell = document.createElement('td');
        const valueCell = document.createElement('td');
        const quantityCell = document.createElement('td');
        const totalCell = document.createElement('td');

        nameCell.textContent = tokenName;
        valueCell.textContent = value;
        
        const quantityInput = document.createElement('input');
        quantityInput.type = 'number';
        quantityInput.step = '0.01';
        quantityInput.min = '0';
        quantityInput.value = localStorage.getItem(tokenName) || '';
        
        quantityInput.addEventListener('input', () => {
            localStorage.setItem(tokenName, quantityInput.value);
            updateTotal(row, value);
        });

        quantityCell.appendChild(quantityInput);
        row.appendChild(indexCell);
        row.appendChild(nameCell);
        row.appendChild(valueCell);
        row.appendChild(quantityCell);
        row.appendChild(totalCell);
        
        tbody.appendChild(row);

        updateTotal(row, value);
    });

    updateTotalValue();
}

function updateTotal(row, price) {
    const quantityInput = row.cells[3].querySelector('input');
    const totalCell = row.cells[4];

    const quantity = parseFloat(quantityInput.value) || 0;
    const priceValue = parseFloat(price) || 0;

    totalCell.textContent = (quantity * priceValue).toFixed(3);
    updateTotalValue();
}

function updateTotalValue() {
    const tbody = document.querySelector('#pricesTable tbody');
    let totalValue = 0;

    Array.from(tbody.rows).forEach(row => {
        const totalCell = row.cells[4];
        const value = parseFloat(totalCell.textContent) || 0;
        totalValue += value;
    });
    totalValue = totalValue * 2;

    const totalElement = document.getElementById('totalValue');
    totalElement.textContent = `Total Value: ${totalValue.toFixed(2)}`;
}

setInterval(readTokensAndFetchPrices, 30000);
document.addEventListener('DOMContentLoaded', readTokensAndFetchPrices);
