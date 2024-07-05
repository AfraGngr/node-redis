import { itemsIndexKey } from "$services/keys";
import { client } from "$services/redis";
import { describe } from "pm2";
import { deserialize } from "./deserialize";

export const searchItems = async (term: string, size: number = 5) => {
  const cleaned = term
    .replaceAll(/[^a-zA-Z0-9]/g, '')
    .trim()
    .split(' ')
    .map(word =>  word ? `%${word}%` : '')
    .join()

    // Look at cleaned and make sure it is valid
    if (cleaned === '')  return [];

    // Use the client to do an actual search
    const results = await client.ft.search(
        itemsIndexKey(),
        cleaned,
        {
            LIMIT : {
                from : 0,
                size
            }
        }

    )

    console.log(results);
    // Deserialize and return search result
    results.documents.map(({id, value}) => deserialize(id, value as any))
};
