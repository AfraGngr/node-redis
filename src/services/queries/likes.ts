import { userLikesKey, itemsKey } from '$services/keys';
import { client } from '$services/redis';
import { getItem, getItems } from './items';

export const userLikesItem = async (itemId: string, userId: string) => {
	return await client.sIsMember(userLikesKey(userId), itemId);
};

export const likedItems = async (userId: string) => {
	//Fetch all the ids of the items that user like
	const ids = await client.sMembers(userLikesKey(userId));

	// get all the items of these ids
	return await getItems(ids);
};

export const likeItem = async (itemId: string, userId: string) => {
	const inserted = await client.sAdd(userLikesKey(userId), itemId);
	if (inserted) {
		return client.hIncrBy(itemsKey(itemId), 'likes', 1);
	}
};

export const unlikeItem = async (itemId: string, userId: string) => {
	const removed = await client.sRem(userLikesKey(userId), itemId);

	if (removed) {
		return client.hIncrBy(itemsKey(itemId), 'likes', -1);
	}
};

export const commonLikedItems = async (userOneId: string, userTwoId: string) => {
	const ids = await client.sInter([userLikesKey(userOneId), userLikesKey(userTwoId)]);

	return getItems(ids);
};
