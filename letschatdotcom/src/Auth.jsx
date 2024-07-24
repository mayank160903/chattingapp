import React, { useContext, useState } from "react";
import axios from "axios";
import UserContext from "./UserContext";

const Auth = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLogOrReg, setIsLogOrReg] = useState("register");
  const [image, setImage] = useState(null);
  const [error, setError] = useState("");

  const { setUsername: setLoggedInUserName, setId } = useContext(UserContext);

  async function handleSubmit(ev) {
    ev.preventDefault();

    const url = isLogOrReg === 'register' ? '/register' : '/login';

    try {
      if (isLogOrReg === 'register') {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        if (image) {
          formData.append('image', image);
        }

        const { data } = await axios.post(url, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        setLoggedInUserName(username);
        setId(data.id);
      } else {
        const { data } = await axios.post(url, { username, password }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        setLoggedInUserName(username);
        setId(data.id);
      }
      setError("");
    } catch (error) {
      console.error(error);
      setError(error.response?.data || 'Login/Register failed');
    }
    
  }

  return (
    <div className=" h-screen items-center"
    style={{ backgroundImage: `url('https://i.pinimg.com/originals/3d/f4/37/3df437922930cf2e2cbbe9f5b22132d3.jpg')` , backgroundPosition: 'center' }} 
    >
      <div className="text-center text-green-400 text-3xl font-bold p-5">
        WELCOME TO LETSCHAT.COM!
      </div>
      <div className="text-center text-green-200 text-xl font-bold p-5">
        Register below and start chatting !
      </div>

      <form action="" className="w-64 py-5 mx-auto mb-12" onSubmit={handleSubmit}>
      {error && <div className="text-red-500 text-center mb-2">Error : {error}</div>}
        <input
          type="text"
          value={username}
          onChange={(ev) => setUsername(ev.target.value)}
          placeholder="username"
          required={true}
          className="block bg-black text-white bg-opacity-60 w-full rounded-sm p-2 mb-2 border"
        />
        <input
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          type="password"
          placeholder="password"
          required={true}
          className="block bg-black text-white bg-opacity-60 w-full rounded-sm p-2 mb-2 border"
        />

        {isLogOrReg === 'register' && (
          <div className="text-center text-white text-opacity-55">
            Choose your Profile Picture!
          </div>
        )}

        {isLogOrReg === 'register' && (
          <input
            type="file"
            onChange={(ev) => setImage(ev.target.files[0])}
            className="block text-white bg-black bg-opacity-60 w-full rounded-sm p-2 mb-2"
          />
        )}

        
        <button className="bg-green-400 text-black block w-full rounder-sm p-2">
          {isLogOrReg === 'register' ? 'Register' : 'Login'}
        </button>

        <div className="text-center mt-2 ">
          {isLogOrReg === 'register' && (
            <div className="text-white">
              Already a member?{" "}
              <button className="text-white underline" onClick={() => setIsLogOrReg("login")}>
                Login here!
              </button>
            </div>
          )}
          {isLogOrReg === 'login' && (
            <div className="text-white">
            Don't have an account?{" "}
            <button
            className="underline"
            onClick={() => setIsLogOrReg("register")}>
              Register
            </button>
          </div>

          )}
        </div>
      </form>
    </div>
  );
};

export default Auth



