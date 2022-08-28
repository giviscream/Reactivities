import axios, { AxiosError, AxiosResponse } from "axios";
import { toast } from "react-toastify";
import { history } from "../..";
import { Activity } from "../models/acitivity";

const sleep = (delay: number) => {
    return new Promise((resolve) => {
        setTimeout(resolve, delay);
    })
}

interface AxiosResponseData {
    errors: string[]
}

axios.defaults.baseURL = 'http://localhost:5000/api';

axios.interceptors.response.use(async response => {
    await sleep(1000);
    return response;
}, (error: AxiosError) => {
    const {data, status} = error.response!;
    switch (status) {
        case 400:
            if (data instanceof Object && data.hasOwnProperty('errors')){
                const modalStateErrors = [];
                const {errors} = data as AxiosResponseData
                for (const key in errors){
                    if (errors[key]){
                        modalStateErrors.push(errors[key])
                    }
                }
                throw modalStateErrors.flat();
            }
            else {
                const errorText = data as string;
                toast.error(errorText);
            }
            break;
        case 401:
            toast.error('unauthorised');
            break;
        case 404:
            history.push('/not-found');
            break;
        case 500:
            toast.error('server error');
            break;
    }

    return Promise.reject(error);
});

const responseBody = <T> (response: AxiosResponse<T>) => response.data;

const requests = {
    get: <T> (url: string) => axios.get<T>(url).then(responseBody),
    post: <T> (url: string, body: {}) => axios.post<T>(url, body).then(responseBody),
    put: <T> (url: string, body: {}) => axios.put<T>(url, body).then(responseBody),
    delete: <T> (url: string) => axios.delete<T>(url).then(responseBody),
}

const Activities = {
    list: () => requests.get<Activity[]>('/activities'),
    details: (id: string) => requests.get<Activity>(`/activities/${id}`),
    create: (activity: Activity) => requests.post<void>('/activities', activity),
    update: (acitivity: Activity) => requests.put<void>(`/activities/${acitivity.id}`, acitivity),
    delete: (id: string) => requests.delete<void>(`/activities/${id}`)
}

const agent = {
    Activities
}

export default agent;