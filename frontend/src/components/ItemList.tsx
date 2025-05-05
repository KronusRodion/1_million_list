'use client'
import { useEffect, useState, useRef, useCallback, memo } from "react";
import Sortable, { SortableEvent } from "sortablejs";
import throttle from "lodash.throttle";
import { fetchItems, updateItemOrder, updateItemSelection, Item } from "../services/itemService";



const MemoizedListItem: React.FC<{
    item: Item;
    handleCheckboxChange: (id: number, checked: boolean) => void;
}> = memo(({ item, handleCheckboxChange }) => {
  return (
    <li
      key={item.id}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "13.5px",
        marginBottom: "10px",
        border: "1px solid #eee",
        borderRadius: "10px",
        backgroundColor: "#f9f9f9",
        cursor: "grab",
        height: '15px',
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}
    >
      <input
        type="checkbox"
        checked={item.checked}
        onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
        style={{ marginRight: "20px" }}
        aria-label={`Select item ${item.id}`}
      />
      <span style={{ fontSize: "18px", flex: 1 }}>{item.text}</span>
    </li>
  );
});

MemoizedListItem.displayName = "MemoizedListItem";

const ItemList = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const sortableRef = useRef<Sortable | null>(null);
  const isMounted = useRef(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentSearch = useRef<string>(searchTerm);

  useEffect(() => {
    currentSearch.current = searchTerm;
  }, [searchTerm]);
  

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchDataItems = useCallback(async (resetPage = false) => {
    setIsLoading(true);
    try {
      const currentPage = resetPage ? 1 : page;
      const data = await fetchItems(currentPage, searchTerm);

      if (!isMounted.current) return;

      if (resetPage) {
        setItems(data.data);
      } else {
        setItems((prev) => [...prev, ...data.data]);
      }

      setTotal(data.total);
      if (resetPage) setPage(1);

      setTimeout(checkScrollPosition, 80);
    } catch (error) {
      console.error("Failed to fetch items:", error);
      alert("Ошибка при загрузке элементов");
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    fetchDataItems(true);
  }, [searchTerm]);

  useEffect(() => {
    if (page > 1) {
      fetchDataItems();
    }
  }, [page]);

  const checkScrollPosition = () => {
    if (!containerRef.current || isLoading || items.length >= total) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const threshold = 300;

    if (scrollHeight - scrollTop <= clientHeight + threshold) {
      setPage(prev => prev + 1);
    }
  };

  const handleScroll = useCallback(throttle(() => {
    if (!isMounted.current) return;
    checkScrollPosition();
  }, 200), [isLoading, items.length, total]);

  useEffect(() => {
    const el = document.getElementById("sortable-list");
    if (el && !sortableRef.current) {
      sortableRef.current = new Sortable(el, {
        animation: 150,
        onEnd: async (evt: SortableEvent) => {
          const { oldIndex, newIndex } = evt;
          
          // Проверяем, что индексы определены и не равны между собой
          if (oldIndex == null || newIndex == null || oldIndex === newIndex) return;
  
          try {
            const movedItemId = items[oldIndex].id;
            const targetItemId = items[newIndex]?.id;
  
            await updateItemOrder(movedItemId, targetItemId);
  
            setItems(prev => {
              const newItems = [...prev];
              const [movedItem] = newItems.splice(oldIndex, 1);
              newItems.splice(newIndex, 0, movedItem);
              return newItems;
            });
          } catch (error) {
            console.error("Failed to update order:", error);
            alert("Ошибка при изменении порядка элементов");
          }
        }
      });
    }
  
    return () => {
      if (sortableRef.current) {
        sortableRef.current.destroy();
        sortableRef.current = null;
      }
    };
  }, [items]);

  const handleCheckboxChange = useCallback(async (id: number, checked: boolean) => {
    try {
      await updateItemSelection(id, checked);
      setItems(prev => prev.map(item =>
        item.id === id ? { ...item, checked } : item
      ));
    } catch (error) {
      console.error("Failed to update selection:", error);
      alert("Ошибка при обновлении выбора");
    }
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height: "calc(100vh - 100px)",
        overflowY: "auto",
        padding: "20px",
        boxSizing: "border-box"
      }}
    >
      <div style={{ marginBottom: "20px", position: 'sticky' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search..."
          style={{
            width: "100%",
            padding: "12px",
            fontSize: "16px",
            borderRadius: "8px",
            border: "2px solid #ddd"
          }}
        />
      </div>

      <ul
        id="sortable-list"
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          minHeight: "200px"
        }}
      >
        {items.map((item) => (
          <MemoizedListItem
            key={item.id}
            item={item}
            handleCheckboxChange={handleCheckboxChange}
          />
        ))}
      </ul>
      {isLoading && <div style={{ padding: '10px', textAlign: 'center' }}>Loading more items...</div>}
      {items.length === 0 && !isLoading && (
        <div style={{ padding: '20px' }}>No items found</div>
      )}
    </div>
  );
};

export default ItemList;