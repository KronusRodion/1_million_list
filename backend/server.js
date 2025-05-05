const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

app.use(cors());
app.use(express.json());

let selectedItems = {};
const pageSize = 20;

// Генерация 1 млн элементов
const generateItems = () => {
  const items = [];
  for (let i = 1; i <= 1000000; i++) {
    items.push({
      id: i,
      text: `Item ${i}`,
      checked: false,
    });
  }
  return items;
};

let allItems = generateItems();

// Вспомогательная функция для поиска индекса элемента
const findItemIndex = (id) => allItems.findIndex(item => item.id === id);

app.get('/api/items', (req, res) => {
  const { page = 1, search = '' } = req.query;
  const currentPage = parseInt(page);
  const searchTerm = search.toLowerCase();

  let filtered = allItems;
  if (searchTerm) {
    filtered = allItems.filter(item => 
      item.text.toLowerCase().includes(searchTerm)
    );
  }

  const total = filtered.length;
  const data = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  data.forEach(item => {
    item.checked = !!selectedItems[item.id];
  });

  res.json({ data, page: currentPage, total, pageSize });
});

app.post('/api/items/order', (req, res) => {
  const { movedItemId, targetItemId } = req.body;
  
  if (!movedItemId || !targetItemId) {
    return res.status(400).json({ success: false, message: "Invalid input" });
  }

  const movedIndex = findItemIndex(movedItemId);
  const targetIndex = findItemIndex(targetItemId);

  if (movedIndex === -1 || targetIndex === -1) {
    return res.status(400).json({ success: false, message: "Item not found" });
  }

  // Удаляем перемещаемый элемент
  const [movedItem] = allItems.splice(movedIndex, 1);
  console.log(movedIndex, targetIndex)

  // Вставляем элемент на новую позицию
  allItems.splice(targetIndex, 0, movedItem);

  res.json({ success: true });
});

app.post('/api/items/selection', (req, res) => {
  const { id, checked } = req.body;
  if (id !== undefined && checked !== undefined) {
    selectedItems[id] = checked;
  }
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});