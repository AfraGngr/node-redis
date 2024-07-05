import { SchemaFieldTypes } from 'redis'
import { client } from './client';
import { itemsIndexKey, itemsKey } from "$services/keys";

export const createIndexes = async () => {
    const indexes = client.ft._list()
    const exists = (await indexes).find(index => index === itemsIndexKey());

    if(exists) return 

    client.ft.create(
        itemsIndexKey(),
        {
            name: {
                type : SchemaFieldTypes.TEXT
            },
            description: {
                type : SchemaFieldTypes.TEXT
            }
        },
        {
            ON: 'HASH',
            PREFIX: itemsKey('')
        }
    )
};
