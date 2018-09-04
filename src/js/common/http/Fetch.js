/**
 * Fetch 请求默认是不带cookie的， 需要设置fetch(url, {credentials: 'include'})
 * 服务器返回400， 500错误码时并不会reject， 只有网络错误这些导致请求不能完成时，fetch才会被reject
 * */

const fetchPost = (url, params, token) => {
    return fetch(url, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json;charset=UTF-8",
            "Authorization": `TxAuth ${token}`
        },
        mode: 'cors',
        body: JSON.stringify(params)
    }).then((res) => {
        if (!res.ok) {
            throw Error(res.statusText);
        }
        return res.json();
    }).catch((err) => {
        return err;
    });
};
const fetchPatch = (url, params) => {
    return fetch(url, {
        method: 'PATCH',
        headers: {
            "Content-Type": "application/json"
        },
        mode: 'cors',
        body: JSON.stringify(params)
    }).then((res) => {
        if (!res.ok) {
            throw Error(res.statusText);
        }
        return res.json();
    });
};

export { fetchPost, fetchPatch };