import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { makeAutoObservable, runInAction } from "mobx";
import { ChatComment } from "../models/comment";
import { store } from "./store";

export default class CommentStore {
    comments: ChatComment[] = [];
    hubConnection: HubConnection | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    createHubConnection = (activiId: string) => {
        if (store.activityStore.selectedActivity){
            this.hubConnection = new HubConnectionBuilder()
                .withUrl('http://localhost:5000/chat?activityId=' + activiId, {
                    accessTokenFactory: () => {return store.userStore.user ? store.userStore.user.token! : ''} //cant yse nullable
                })
                .withAutomaticReconnect()
                .configureLogging(LogLevel.Information)
                .build();

            this.hubConnection.start().catch(error => console.log('Error establishing the connection: ', error));

            this.hubConnection.on('LoadComments', (comments: ChatComment[]) => {
                runInAction(() => {
                    comments.forEach(comment => {
                        comment.createdAt = new Date(comment.createdAt + 'Z');
                    })
                    this.comments = comments});
            })

            this.hubConnection.on('ReceiveComment', (comment: ChatComment) => {
                runInAction(() => {
                    comment.createdAt = new Date(comment.createdAt);
                    this.comments.unshift(comment)
                });
            })
        }
    }
    
    stopHubConnection = () => {
        if (this.hubConnection) //cant use nullable
            this.hubConnection.stop().catch(error => console.log('Error stoping connection: ', error));
    }

    clearComments = () => {
        this.comments = [];
        this.stopHubConnection();
    }

    addComment = async (values: any) => {
        if (store.activityStore.selectedActivity)
            values.activityId = store.activityStore.selectedActivity.id;
        try {
            if (this.hubConnection)
                await this.hubConnection.invoke('SendComment', values);
        } catch (error) {
            console.log(error);
        }
    }
}