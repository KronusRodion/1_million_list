import Sortable, { MultiDrag, Swap } from 'sortablejs';
import ItemList from "../components/ItemList";

Sortable.mount(new MultiDrag(), new Swap());

export default function Home() {
  return (
      <ItemList />
  );
}
