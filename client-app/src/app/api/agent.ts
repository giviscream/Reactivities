import axios, { AxiosError, AxiosResponse } from "axios";
import { toast } from "react-toastify";
import { history } from "../..";
import { store } from "../stores/store";
import { Activity } from "../models/acitivity";
import { ServerError } from "../models/serverError";
import { User, UserFormValues } from "../models/user";
import { request } from "http";

const sleep = (delay: number) => {
    return new Promise((resolve) => {
        setTimeout(resolve, delay);
    })
}

interface AxiosResponseData {
    errors: object
}

axios.defaults.baseURL = 'http://localhost:5000/api';

axios.interceptors.request.use(config => {
    const token = store.commonStore.token;
    if (token && config && config.headers) // Cant use ? unfortunately 
        config.headers.Authorization = `Bearer ${token}`;

    return config;

})

axios.interceptors.response.use(async response => {
    await sleep(1000);
    return response;
}, (error: AxiosError) => {
    const {data, status, config} = error.response!;
    switch (status) {
        case 400:
            //to do: Разобраться, почему требуются яные приведения и не работают конструкции .?
            if (typeof data === 'string'){
                toast.error(data);
            }
            if (data instanceof Object  && data.hasOwnProperty('errors')){
                const {errors} = data as AxiosResponseData
                const modalStateErrors = [];
                
                if (config.method === 'get' && errors.hasOwnProperty('id')){
                    history.push('/not-found');
                }

                for (const key in errors){
                    if (errors[key as keyof Object]){
                        modalStateErrors.push(errors[key as keyof Object])
                    }
                }
                throw modalStateErrors.flat();

            }
            /*
            else {
                const errorText = data as string;
                toast.error(errorText);
            }
            */
            break;
        case 401:
            toast.error('unauthorised');
            break;
        case 404:
            history.push('/not-found');
            break;
        case 500:
            const serverError = data as ServerError;
            store.commonStore.setServerError(serverError);
            history.push('/server-error');
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

const Account = {
    current: () => requests.get<User>('/account'),
    login: (user: UserFormValues) => requests.post<User>('/account/login', user),
    register: (user: UserFormValues) => requests.post<User>('/account/register', user)
}

const agent = {
    Activities,
    Account
}

export default agent;