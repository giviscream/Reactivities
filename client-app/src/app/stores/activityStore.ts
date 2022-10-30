import { makeAutoObservable, runInAction} from "mobx";
import agent from "../api/agent";
import { Activity, ActivityFormValues } from "../models/acitivity";
import { Profile } from "../models/profile";
import { store } from "./store";

export default class ActivityStore{
    activityRegistry = new Map<string, Activity>();
    selectedActivity: Activity | undefined = undefined;
    editMode = false;
    loading = false;
    loadingInitial = false;

    constructor(){
        makeAutoObservable(this);
    }

    get activitiesByDate() {
        return Array.from(this.activityRegistry.values()).sort((a, b) => a.date!.getTime() - b.date!.getTime())
    }

    get groupedActivities(){
        return Object.entries(
            this.activitiesByDate.reduce((activities, activity) => {
                const date = activity.date!.toISOString().split('T')[0];
                activities[date] = activities[date] ? [...activities[date], activity] : [activity];
                return activities;
            }, {} as {[key: string]: Activity[]})
        )
    }

    loadActivities = async () => {
        this.setLoadingInitil(true);
        try {
            const activities = await agent.Activities.list();

            activities.forEach(activity =>{
                this.setActivity(activity);
                
            })
            this.setLoadingInitil(false);
        } catch (err) {
            console.log(err);
            this.setLoadingInitil(false);
            
        }
    }

    private setActivity = (activity: Activity) => {
        const user = store.userStore.user;
        if (user){
            activity.isGoing = activity.attendees!.some(
                a => a.username === user.username
            )

            activity.isHost = activity.hostUsername === user.username;

            if (activity.attendees)
                activity.host = activity.attendees.find(x => x.username === activity.hostUsername); //can't use nullable ?
        }

        activity.date = new Date(activity.date!);
        this.activityRegistry.set(activity.id, activity);
    }

    loadAtivity = async (id: string) => {
        let activity = this.getActivity(id);

        if (activity) {
            this.selectedActivity = activity;
            return activity;
        } else {
            this.loadingInitial = true;

            try {
                activity = await agent.Activities.details(id); 
                this.setActivity(activity);
                runInAction(() => {
                    this.selectedActivity = activity;
                });
                this.setLoadingInitil(false);
                return activity;
            } catch(error)
            {
                console.log(error);
                this.setLoadingInitil(false);
            }
        }
    }

    private getActivity = (id: string) => {
        return this.activityRegistry.get(id);
    }

    setLoadingInitil = (state: boolean) => {
        this.loadingInitial = state;
    }

    createActivity = async (activity: ActivityFormValues) => {
        const user = store.userStore.user;
        const attendee = new Profile(user!);
        try{
            await agent.Activities.create(activity);
            const newActivity = new Activity(activity);
            newActivity.hostUsername = user!.username;
            newActivity.attendees = [attendee];
            this.setActivity(newActivity);
            runInAction(() => {
                this.selectedActivity = newActivity;
            })
        }
        catch (error){
            console.log(error);
        }
    }

    updateActivity = async (activity: ActivityFormValues) => {
        try{
            await agent.Activities.update(activity);
            runInAction(() => {
                if (activity.id){
                    let updatedActivity = {...this.getActivity(activity.id), ...activity};
                    this.activityRegistry.set(activity.id, updatedActivity as Activity);
                    this.selectedActivity = updatedActivity as Activity;
                }
            })
        }
        catch(error){
            console.log(error);
        }

    }

    deleteActivity = async (id: string) => {
        this.loading = true;

        try {
            await agent.Activities.delete(id);

            runInAction(() => {
                this.activityRegistry.delete(id);
                this.loading = false;
            })

        }
        catch (error) {
            console.log(error);
            runInAction(() => {
                this.loading = false;
            })

        }
    }

    updateAttendance = async () => {
        const user = store.userStore.user;
        this.loading = true;

        let username: string; //cant use a => a.username !== user?.username
        if (user)
            username = user.username;

        try{
            await agent.Activities.attend(this.selectedActivity!.id);
            runInAction(() => {
                if (this.selectedActivity && this.selectedActivity.isGoing){ //cant use this.selectedActivity?.isGoing
                    if (this.selectedActivity.attendees) { //cant use this.selectedActivity.attendees?.filter(
                        this.selectedActivity.attendees = 
                            this.selectedActivity.attendees.filter(a => a.username !== username); //cant use a => a.username !== user?.username
                    }
                    
                    this.selectedActivity.isGoing = false;
                }
                else {
                    const attendee = new Profile(user!);

                    if (this.selectedActivity && this.selectedActivity.attendees){
                        this.selectedActivity.attendees.push(attendee); //cant use this.selectedActivity?.attendees?.push(attendee);
                    }
                    
                    this.selectedActivity!.isGoing = true;
                }
                this.activityRegistry.set(this.selectedActivity!.id, this.selectedActivity!);
            })
        } 
        catch(error) {
            console.log(error);
        }
        finally {
            runInAction(() => this.loading = false);
        }

    }

    cancellActivityToggle = async () => {
        this.loading = true;
        try {
            await agent.Activities.attend(this.selectedActivity!.id);
            runInAction(() => {
                this.selectedActivity!.isCancelled = !this.selectedActivity || !this.selectedActivity.isCancelled; //cant use !this.selectedActivity?.isCancelled;
                this.activityRegistry.set(this.selectedActivity!.id, this.selectedActivity!);
            })
        } catch (error) {
            console.log(error);
        } finally {
            runInAction( () => this.loading = false);
        }
    }

    clearSelectedActivity = () => {
        this.selectedActivity = undefined;
    }

    updateAttendeeFollowing = (username: string) => {
        this.activityRegistry.forEach(activity => {
            activity.attendees.forEach(attendee => {
                if (attendee.username == username) {
                    attendee.following ? attendee.followersCount-- : attendee.followingCount++;
                    attendee.following = !attendee.following;
                }
            })
        })
    }

}