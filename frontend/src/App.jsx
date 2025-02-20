import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import './App.css'; // Ensure this file exists and is correctly configured
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import SingleView from './components/SingleView.jsx';
import Contact from './components/Contact.jsx';
import Email from './components/Email.jsx';
import Top_Navbar from './components/navbars/top_navbar.jsx'
import Side_Navbar from './components/navbars/side_nav_bar.jsx';
// Define your routes
const router = createBrowserRouter([
    { path: "/view", element: <SingleView/> },
    {path : "/contacts", element: <Contact/>},
    {path : "/emails/all", element: <Email/>},
    {path : "/emails/:campaignId", element: <Email/>}
  ]);

function App() {
  return (
    <div>
      {/* Full-width Navbar */}
      <Top_Navbar />

      <div className="row vh-100">
        <Side_Navbar/>
        

        {/* Main Content */}
        <div className="col-md-11">
          <RouterProvider router={router} />
        </div>
      </div>
    </div>
  );
}

export default App;
