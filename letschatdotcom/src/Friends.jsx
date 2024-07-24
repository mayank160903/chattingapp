import React from 'react'
import Avatar from './Avatar';

const Friends = ({id , username ,onClick, selected, online }) => {
  return (
    
      <div key={id}
        onClick={() => onClick(id)} 
        className={'p-1 border-b border-gray-600 flex items-center gap-2 cursor-pointer ' + (selected ? 'bg-gray-900 bg-opacity-60' : '')}
        >
            {selected && (
                <div className='w-1 bg-green-500 h-11 rounded-r-md'>
                </div>
            )}

            <div className='flex gap-2 py-2 pl-4 items-center'>
            <Avatar online={online} username={username} userId={id} />
            <span className='text-gray-300'>
            {username}
            </span>
            </div>   
        </div>
  )
}

export default Friends
