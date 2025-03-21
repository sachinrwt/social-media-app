import { Navigate, Route, Routes } from "react-router-dom"

import HomePage from "./pages/home/HomePage.jsx"
import LogInPage from "./pages/auth/login/LogInPage.jsx"
import SignUpPage from "./pages/auth/signup/SignUpPage.jsx"
import NotificationPage from "./pages/notification/NotificationPage.jsx"
import ProfilePage from "./pages/profile/ProfiePage.jsx"

import Sidebar from "./components/common/Sidebar.jsx"
import RightPanel from "./components/common/RightPanel.jsx"
import { Toaster } from 'react-hot-toast'
import { useQuery } from "@tanstack/react-query"
import LoadingSpinner from "./components/common/LoadingSpinner.jsx"

 
function App() {
  const {data:authUser, isLoading} = useQuery({
    //Thi queryKey is udes to give a unique name to our query and refer to it later
    queryKey : ['authUser'],
    queryFn : async()=>{
      try {
        const res = await fetch("/api/auth/me")
        const data = await res.json();

        if(data.error) return null;

        if(!res.ok){
          throw new Error(data.error || "Something went wrong!")
        }

        console.log("authUser is here:", data);
        return data;

      } 
      catch (error) {
          throw new Error(error);
      }
    },
    retry: false,
  }) 

  if(isLoading){
    return(
      <div className="h-screen flex justify-center items-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  //console.log(authUser)

  return (
    <div className="flex max-w-6xl mx-auto">
      {/* common components because notwrapped with routes  */}
      { authUser && <Sidebar /> }
        <Routes>
          {/* <Navigate to="/"/> - this is the home page  */}
          <Route path='/'  element={ authUser ? <HomePage/> : <Navigate to="/login"/>} />
          <Route path='/login'  element={ !authUser ? <LogInPage/> : <Navigate to="/"/>} />
          <Route path='/signUp'  element={ !authUser ? <SignUpPage /> : <Navigate to="/"/>} />
          <Route path='/notifications'  element={ authUser ? <NotificationPage/> : <Navigate to="/login"/>} />
          <Route path='/profile/:username'  element={ authUser ? <ProfilePage /> : <Navigate to="/login"/>} />
        </Routes>
      { authUser && <RightPanel/> }
      <Toaster/>
    </div>
  )
}

export default App
