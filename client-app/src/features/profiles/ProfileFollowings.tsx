import { observer } from "mobx-react-lite";
import React from "react";
import { Card, Grid, GridColumn, Header, Tab } from "semantic-ui-react";
import { useStore } from "../../app/stores/store";
import ProfileCard from "./ProfileCard";

export default observer(function ProfileFollowings(){
    const {profileStore} = useStore();
    const {profile, followings, loadingFollowings, activeTab} = profileStore;

    let displayName;
    if (profile)
        displayName = profile.displayName;

    return (
        <Tab.Pane loading={loadingFollowings}>
            <Grid>
                <Grid.Column width={16}>
                    <Header 
                        floated='left' 
                        icon='user' 
                        content={activeTab === 3 ? `People following ${displayName}` : `People ${displayName} is following`} />
                </Grid.Column>
                <GridColumn width={16}>
                    <Card.Group itemsPerRow={4}>
                        {followings.map(profile => (
                            <ProfileCard key={profile.username} profile={profile}/>
                        ))}
                    </Card.Group>
                </GridColumn>
            </Grid>
        </Tab.Pane>
    )
})