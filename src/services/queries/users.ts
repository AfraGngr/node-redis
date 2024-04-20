import type { CreateUserAttrs } from '$services/types';
import { genId } from '$services/utils';
import { client } from '$services/redis';
import { usernamesUniqueKey, usersKey } from '$services/keys';

export const getUserByUsername = async (username: string) => {};

export const getUserById = async (id: string) => {
    const user = await client.hGetAll(usersKey(id))
    return deserialize(id, user)
};

export const createUser = async (attrs: CreateUserAttrs) => {
    const id = genId();
    // Check if the user exists 
    const exists = await client.sIsMember(usernamesUniqueKey(), attrs.username)
    if(exists) throw Error('Username is already taken.')
    // Otherwise continue
    await client.hSet(usersKey(id), serialize(attrs))
    //Add username into usernames
    await client.sAdd(usernamesUniqueKey(), attrs.username)

    return id;
};


const serialize = (user: CreateUserAttrs) => {
    return {
        username: user.username,
        password: user.password
    }
}

const deserialize = (id: string, user: { [key: string]: string }) => {
    return {
        id,
        username: user.username,
        password: user.password

    }
}