import { useState, useEffect } from "react";
import { getToken } from "./authUtils"
interface HTTPOptions {
    [key: string]: any
}

export async function callAPI(url:string, method:string, requestData:object) {
    let base = import.meta.env.VITE_REACT_API_URL
    const token = await getToken()

    let options: HTTPOptions = {
        method: method,
        headers: {
            "Accept": 'application/json',
            "Authorization" :  `Bearer ${token}`,
            "Access-Control-Expose-Headers": "*",
            "Ocp-Apim-Subscription-Key": import.meta.env.VITE_SUBSCRIPTION_KEY
        }
    }
    if(method !== "GET") {
        options.body = JSON.stringify(requestData)
    }
    //return await fetch(base + url, options)
    const apiRepsonse = await fetch(base + url, options)
    .then((response) => response.json())
    .then((response_data) => {
        let resp = {"Status": "Success", "Data" : response_data.data}
        return resp
    })
    .catch(error => {
        let resp = {"Status": "Error", "Message" : error}
        return resp
    })
    return apiRepsonse
} 


// Definition of endpoints 

export const getProjectList = () => {
    return callAPI("/api/Projects?&includeall=false", "GET", {})
}
export const getProjectDetails = () => {
    return callAPI(`/api/Projects/${sessionStorage.getItem("selectedProjectId")}`, "GET", {})
}

export const getSamples = (searchParams?: string) => { 
    return callAPI(`/api/MetadataSearch?${searchParams}`, 'GET', {})
    //return callAPI(`/api/Submissions/x${urlParams}`, 'GET', {})
    //return callAPI(`/api/Submissions/x?includeall=False&groupContext=${sessionStorage.getItem("selectedProjectMemberGroupId")}`, 'GET', {})
}

export const getTotalSamples = () => {
    return callAPI(`/api/MetadataSearch/?groupContext=${sessionStorage.getItem("selectedProjectMemberGroupId")}&pageSize=1&page=1`, 'GET', {})
}