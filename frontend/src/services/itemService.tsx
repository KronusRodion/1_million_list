import fetchAPI from "../components/fetch";

interface APIResponse {
    data: Item[];
    total: number;
}

export interface Item {
    id: number;
    text: string;
    checked: boolean;
}

export const fetchItems = async (
    page: number, 
    searchTerm: string,
  ): Promise<APIResponse> => {
    try {
      return await fetchAPI(
        `items?page=${page}&search=${searchTerm}`,
        'GET',
        null,
      );
    } catch (error) {
      console.error("Failed to fetch items:", error);
      throw error;
    }
  };

export const updateItemOrder = async (movedItemId: number, targetItemId: number | undefined) => {
    try {
        await fetchAPI("items/order", "POST", { movedItemId, targetItemId });
    } catch (error) {
        console.error("Failed to update order:", error);
        throw error;
    }
};

export const updateItemSelection = async (id: number, checked: boolean) => {
    try {
        await fetchAPI("items/selection", "POST", { id, checked });
    } catch (error) {
        console.error("Failed to update selection:", error);
        throw error;
    }
};