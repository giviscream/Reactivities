import { observer } from "mobx-react-lite";
import React from "react";
import { Container, Header, Segment } from "semantic-ui-react";
import { useStore } from "../../app/stores/store";

export default observer(function ServerError() {
    const {commonStore} = useStore();

    let message = null;
    let details = null;
    
    if (commonStore.error !== null && commonStore.error !== undefined){
        message = commonStore.error.message;
        details = commonStore.error.details;
    }

    return (
        <Container>
            <Header as='h1' content='Server Error' />
            <Header sub as='h5' color='red' content={message} />
            {details && 
                <Segment>
                    <Header as='h4' content='Stack trace' color='teal' />
                    <code style={{marginTop: '10px'}}>{details}</code>
                </Segment>
            }
        </Container>
    )
})