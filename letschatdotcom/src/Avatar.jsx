import React, { useEffect, useState } from 'react'
import axios from 'axios';

const Avatar = ({userId , username , online}) => {

    const colors = [ 'bg-green-200' , 'bg-purple-200' , 'bg-blue-200' , 'bg-yellow-200' , 'bg-teal-200' , 'bg-red-200' , 'bg-orange-200' , 'bg-pink-200' , 'bg-rose-500' ];

    const userIdBase10 = parseInt(userId , 16);
    const colorId = userIdBase10 % colors.length;
    const color = colors[colorId];
    const [imagePath, setImagePath] = useState(null);

    useEffect(() => {
        async function fetchImagePath() {
          try {
            const { data } = await axios.get(`/user/${userId}`);
            
            setImagePath(data.imagePath);
          } catch (error) {
            console.error(error);
          }
        }
        fetchImagePath();
      }, [userId]);
    
  return (
    <div className={"w-9 h-9 relative rounded-full  flex items-center " + color}>
        {imagePath ? (
        <img src={axios.defaults.baseURL + '/' + imagePath.replace(/\\/g, '/')} alt="Profile" className="w-full h-full rounded-full object-cover" />
      ) : (
        <div className="text-center w-full opacity-70">
          {username[0]}
        </div>
      )}
        {online && (
            <div className='absolute w-2 h-2 bg-green-400 bottom-0 right-0 rounded-full border border-white shadow-lg shadow-black'></div>
        )}
        {!online && (
            <div className='absolute w-2 h-2 bg-gray-400 bottom-0 right-0 rounded-full border border-white shadow-lg shadow-black'></div>

        )}
    </div>
  )
}

export default Avatar
