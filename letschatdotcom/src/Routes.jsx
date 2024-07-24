import React, { useContext } from 'react'
import Auth from './Auth'
import UserContext from './UserContext'
import Chat from './Chat';

const Routes = () => {
    const {username , id} = useContext(UserContext);

    if(username){
        return <Chat />
    }
  return (
    <Auth />
  )
}

export default Routes
