import { fetchPost } from '../http/Fetch';

export default async (opts, cb) => {
    const result = await fetchPost(`${opts.serverUrl}/agent/roomInfo`, {aid: opts.id}, opts.token);
    if (result && result.statusCode === 200) {
        const roomInfo = result.response;
        if (roomInfo) {
            cb && cb({code: 200, num: roomInfo.customerCount, customers: roomInfo.customers});
        }
    } else {
        cb && cb({code: 500, error: result});
    }
}