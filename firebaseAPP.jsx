import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { useEffect, useState } from "react";
import './App.css'; // Ensure this file exists and is correctly configured
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import SingleView from './components/SingleView.jsx';
import Contact from './components/Contact.jsx';
import Top_Navbar from './components/navbars/top_navbar.jsx'
import Side_Navbar from './components/navbars/side_nav_bar.jsx';

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBw_4QCFUv0PhQlN3HDgl24pifuGE7m2r4",
  authDomain: "einstein-axo.firebaseapp.com",
  projectId: "einstein-axo",
  storageBucket: "einstein-axo.firebasestorage.app",
  messagingSenderId: "143357552357",
  appId: "1:143357552357:web:f3d89c35c051dbb742560c",
  measurementId: "G-Y040EEZP9T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Define your routes
const router = createBrowserRouter([
    { path: "/view", element: <SingleView/> },
    {path : "/contacts", element: <Contact/>}
  ]);

  function App() {
    const [user, setUser] = useState(null);
  
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
      });
      return () => unsubscribe();
    }, []);
  
    const handleSignIn = () => {
      signInWithPopup(auth, provider)
        .then((result) => {
          console.log("User signed in: ", result.user);
        })
        .catch((error) => console.error("Error signing in: ", error));
    };
  
    const handleSignOut = () => {
      signOut(auth)
        .then(() => console.log("User signed out"))
        .catch((error) => console.error("Error signing out: ", error));
    };
  
    return (
      <div>
        {/* Full-width Navbar */}
        <Top_Navbar />
  
        <div className="row">
          <Side_Navbar />
  
          {/* Main Content */}
          <div className="col-md-11">
            {user ? (
              <div>
                <p>Welcome, {user.displayName}</p>
                <button onClick={handleSignOut}>Sign Out</button>
              </div>
            ) : (
              <button onClick={handleSignIn}>Sign In with Google</button>
            )}
            <RouterProvider router={router} />
          </div>
        </div>
      </div>
    );
  }
  
  export default App;