import { randomBytes } from 'crypto';
import { client } from './client';

export const withLock = async (key: string, cb: (signal: any) => any) => {
	// Initialize variable to retry
	const retryDelayMs = 100;
	let retries = 20;

	// Generate a random volue to store at the lock key
	const token = randomBytes(6).toString('hex');
	// Create the lock key
	const lockKey = `lock:${key}`;
	// Set up a while loop to implement a retry behaviour
	while (retries >= 0) {
		retries--;
		// Try to do set NX operation
		const acquired = await client.set(lockKey, token, {
			NX: true,
			PX: 2000
		});

		if (!acquired) {
			// Else brief pause and retry the
			await pause(retryDelayMs);
			continue;
		}

		// If the set is successful, run the callback
		try {
			const signal = { expired: false };

			setTimeout(() => {
				signal.expired = true;
			}, 2000);
			const result = await cb(signal);
			return result;
		} finally {
			// Unset the locked key
			// await client.del(lockKey);
			await client.unlock(lockKey, token);
		}
	}
};

const buildClientProxy = () => {};

const pause = (duration: number) => {
	return new Promise((resolve) => {
		setTimeout(resolve, duration);
	});
};
