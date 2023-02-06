interface HTTPOptions {
    [key: string]: any
}
export async function callAPI(url:string, method:string, requestData:object) {
    let base = import.meta.env.VITE_REACT_API_URL
    let token = ""

    let options: HTTPOptions = {
        method: method,
        headers: new Headers({
            "Accept": 'application/json',
            "Authorization" : "Bearer " + token
        })
    }
    if(method !== "GET") {
        options.body = JSON.stringify(requestData)
    }
    return new Promise((resolve, reject) => {
        fetch(base + url, options)
        .then(response => {
            resolve(response)
        })
        .catch(function (error) {
            reject(error)
        })
    })
}

export function isoDateLocalDate(datetime: any) {
    let isoDate = new Date(datetime.getValue())
    let localDate = isoDate.toLocaleDateString()
    return localDate
};