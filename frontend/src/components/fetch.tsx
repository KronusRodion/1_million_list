import axios from "axios";

const APIurl = process.env.NEXT_PUBLIC_API_URL;

async function fetchAPI(path: string, method: string = 'GET', data: unknown = null) {
    const newPath = APIurl + path;
    try {
        const config = {
            method: method.toLowerCase(), 
            url: newPath,
            data: data, 
        };

        // Выполняем запрос через axios
        const result = await axios(config);

        return result.data; 
    } catch (error) {
        console.error("Error fetching API:", error);
        throw error;
    }
}

export default fetchAPI;