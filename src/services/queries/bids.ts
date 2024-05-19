import type { CreateBidAttrs, Bid } from '$services/types';
import { bidHistoryKey, itemsKey } from '$services/keys'
import { DateTime } from 'luxon';
import { client } from '$services/redis';
import { getItem } from './items';
export const createBid = async (attrs: CreateBidAttrs) => {
	return client.executeIsolated(async (isolated) => {
		const item = await getItem(attrs.itemId);

		if(!item) throw new Error ('Item does not exist!') 

		if(item.price >= attrs.amount) throw new Error('Bid too low')

		if(item.endingAt.diff(DateTime.now()).toMillis() < 0) throw new Error('Item is close for bidding')

		const serialized = serializeHistory(
			attrs.amount,
			attrs.createdAt.toMillis()
		)

		return isolated.multi()
		.rPush(bidHistoryKey(attrs.itemId), serialized)
		.hSet(itemsKey(item.id), {
				bids: item.bids + 1,
				price : attrs.amount,
				highestBidUserId: attrs.userId,
		})
		.exec()
	})
};	

export const getBidHistory = async (itemId: string, offset = 0, count = 10): Promise<Bid[]> => {
	const startIndex  = -1 * offset - count
	const endIndex = -1 - offset

	const range = await client.lRange(bidHistoryKey(itemId), startIndex, endIndex)
	return range.map(bid => deserializeHistory(bid))
};


const serializeHistory = (amaount: number, createdAt: number) => {
	return `${amaount}:${createdAt}`
}

const deserializeHistory = (stored: string) => {
	const [amount, createdAt ] = stored.split(':');
	
	return {
		amount: parseFloat(amount),
		createdAt: DateTime.fromMillis(parseInt(createdAt))
	}
}