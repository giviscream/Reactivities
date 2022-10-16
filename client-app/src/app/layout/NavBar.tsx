import { observer } from 'mobx-react-lite';
import React from 'react'
import { Link, NavLink } from 'react-router-dom';
import { Button, Container, Dropdown, Image, Menu } from 'semantic-ui-react'
import { useStore } from '../stores/store';

export default observer(function NavBar(){
    const {userStore: {user, logout}} = useStore();
    let userImage, userDispName, userName;

    if (user)
    {
        userImage = user.image;
        userDispName = user.displayName;
        userName = user.username;
    }
    else
    {
        userImage = '/assets/user.png';
    }

    return (
        <Menu inverted fixed='top'>
            <Container>
                <Menu.Item as={NavLink} to='/' exact header>
                    <img src="assets/logo.png" alt="logo" style={{marginRight: '10px'}}/>
                    Reactivities
                </Menu.Item>
                <Menu.Item as={NavLink} to='/activities' name='Activities'/>
                <Menu.Item as={NavLink} to='/errors' name='Errors'/>
                <Menu.Item>
                    <Button as={NavLink} to='/createActivity' positive content='Create Activity' />
                </Menu.Item>
                <Menu.Item position='right'>
                    <Image src={userImage} avatar spaced='right'/>
                    <Dropdown pointing='top left' text={userDispName}>
                        <Dropdown.Menu>
                            <Dropdown.Item as={Link} to={`/profile/${userName}`} text='My Profile' icon='user'/>
                            <Dropdown.Item onClick={logout} text='Logout' icon='power' />
                        </Dropdown.Menu>
                    </Dropdown>
                </Menu.Item>
            </Container>
        </Menu>
    )
})