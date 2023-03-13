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
            "Authorization" :  `Bearer ${token}`
        }
    }
    if(method !== "GET") {
        options.body = JSON.stringify(requestData)
    }
    return await fetch(base + url, options)
} 


// Definition of endpoints 

export const getProjectList = () => {
    return callAPI("/api/Projects?&includeall=false", "GET", {})
}
export const getProjectDetails = () => {
    return callAPI(`/api/Projects/${sessionStorage.getItem("selectedProjectId")}`, "GET", {})
}

export const getSubmissions = (urlParams: string) => { 
    return callAPI(`/api/MetadataSearch${urlParams}`, 'GET', {})
    //return callAPI(`/api/Submissions/x${urlParams}`, 'GET', {})
    //return callAPI(`/api/Submissions/x?includeall=False&groupContext=${sessionStorage.getItem("selectedProjectMemberGroupId")}`, 'GET', {})
}

export const getAnalyses = () => {
    return callAPI(`/api/Analyses/?filters=ProjectId==${sessionStorage.getItem("selectedProjectId")}&includeall=false`, 'GET', {})
}