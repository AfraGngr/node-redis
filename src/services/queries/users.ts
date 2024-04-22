import type { CreateUserAttrs } from '$services/types';
import { genId } from '$services/utils';
import { client } from '$services/redis';
import { userNamesKey, usernamesUniqueKey, usersKey } from '$services/keys';

export const getUserByUsername = async (username: string) => {
    // Use the username arg to look up the persons User ID with the usernamse sorted set
    const userIdRaw = await client.zScore(userNamesKey(), username)
    // make sure we actually got an ID from lookup1
    if(!userIdRaw) throw new Error('User does not exist !');
    // Take the ID conver it back
    const userId = userIdRaw.toString(16)
    // Look up the user hash
    const user = await client.hGetAll(usersKey(userId))
    // deserialize and return the hash
    return deserialize(userId, user)
};

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
    // Add user id into 'usernames' hash
    await client.zAdd(userNamesKey(), {
        value: attrs.username,
        score: parseInt(id, 16)
    })

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