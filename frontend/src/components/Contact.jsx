// App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // Import Bootstrap JS (with bundle to include Popper)


const Contact = () => {
  const serverUrl = import.meta.env.VITE_LOCAL_URL;
  const [contacts, setContacts] = useState([]);
  const [filters, setFilters] = useState({ country_id: [], industry_id: [], email: '' });
  // const [showForm, setShowForm] = useState(false);
  const [newContact, setNewContact] = useState({ email: '', first_name: '', last_name: '', assigned_to: '', lead_source: '', company_name: '', job_title: '', phone_number: '', linked_in: '', address: '', city_id: '', state_id: '', country_id: '', industry_id: '', website: '', company_hq: '', notes: ''});
  const [users, setUsers] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [countries, setCountries] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [pageSize, setPageSize] = useState(10); // Default page size

  const fetchContacts = async (page = 1, limit = pageSize) => {
    try {
      const result = await axios.get(serverUrl+'/api/contacts', {
        params: { ...filters, page, limit },
        paramsSerializer: (params) => {
          return Object.keys(params)
            .map((key) => {
              if (Array.isArray(params[key])) {
                return `${key}=${params[key].join(',')}`; // Convert array to comma-separated string
              }
              return `${key}=${params[key]}`;
            })
            .join('&');
          },
        });
      let contact_list = result.data.data[0]
      setContacts(contact_list); // Set the paginated contacts
      setPagination({
        page: result.data.page,
        totalPages: result.data.totalPages,
        total: result.data.total,
      });
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const handlePageChange = (newPage) => {
    fetchContacts(newPage, pageSize); // Fetch the next page with the selected page size
  };

  const handlePageSizeChange = (event) => {
    const newSize = parseInt(event.target.value, 10);
    setPageSize(newSize); // Update page size and fetch data
    fetchContacts(1, newSize); // Always fetch the first page when page size changes
  };
  
  
  useEffect(() => {
    
    fetchContacts();
    // Fetch foreign key data from the backend
    axios.post(serverUrl + '/api/contacts/get_table_data', { table_name: 'industry' })
      .then(response => setIndustries(response.data))
      .catch(error => console.error('Error fetching industries:', error));
    
    axios.post(serverUrl + '/api/contacts/get_table_data', { table_name: 'user' })
      .then(response => setUsers(response.data))
      .catch(error => console.error('Error fetching users:', error));
    
    axios.post(serverUrl + '/api/contacts/get_table_data', { table_name: 'city' })
      .then(response => setCities(response.data))
      .catch(error => console.error('Error fetching cities:', error));
      
    axios.post(serverUrl + '/api/contacts/get_table_data', { table_name: 'state' })
      .then(response => setStates(response.data))
      .catch(error => console.error('Error fetching states:', error));

    axios.post(serverUrl + '/api/contacts/get_table_data', { table_name: 'country' })
      .then(response => setCountries(response.data))
      .catch(error => console.error('Error fetching countries:', error));

  }, [filters]);

  // Generic handler for both text-based and multi-select filters
  const handleFilterChange = (e, filterName) => {
    let newFilterValue;
  
    if (e && e.target) {
      // Handle text-based filters (like email)
      if (e.target.value !== undefined) {
        newFilterValue = e.target.value;
      }
    } else if (e) {
      // Handle multi-select filters (like country_id, industry_id)
      newFilterValue = e.map(option => option.value); // Keep it as an array of IDs
    }
  
    // Update the filter state
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterName]: newFilterValue  // Set the filter to the updated value
    }));
  
    // Trigger data fetching after filter change
    // fetchContacts();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewContact({
      ...newContact,
      [name]: value
    });
  };

  const resetNewContact = () => {
    setNewContact({
      email: '', first_name: '', last_name: '', assigned_to: '', lead_source: '', company_name: '', job_title: '', phone_number: '', linked_in: '', address: '', city_id: '', state_id: '', country_id: '', industry_id: '', website: '', company_hq: '', notes: ''
    });
  };

  const handleSubmit = async (e) => {
    var not_to_be_submitted = ['assigned_to_name', 'city_name', 'state_name', 'country_name', 'industry_name', 'full_name'];
    e.preventDefault();
    
    // Remove keys with blank values (empty string, null, or undefined) from newContact
    const sanitizedContact = Object.keys(newContact).reduce((acc, key) => {
      const value = newContact[key];
      
      // Skip keys with blank values (empty string, null, or undefined)
      if (value !== '' && value !== null && value !== undefined && !not_to_be_submitted.includes(key)) {
        acc[key] = value;
      } else {
        // Optionally, set undefined for blank values instead of skipping them
        acc[key] = undefined;
      }
      
      return acc;
    }, {});
    
    try {
      // Make the API call with the sanitized contact object
      if (newContact.id) {
        await axios.put(serverUrl+`/api/contacts/${newContact.id}`, sanitizedContact);
      }
      else {
        await axios.post(serverUrl+'/api/contacts', sanitizedContact);
      }
      
      // Reset contact form and apply filters after successful submission
      resetNewContact();
      setFilters({ ...filters });

      // Dismiss the offcanvas using Bootstrap's API
      // const offcanvasElement = document.getElementById('addContactOffcanvas');
      // const offcanvas = new Offcanvas(offcanvasElement);
      // offcanvas.hide(); // Hide the offcanvas
      
    } catch (error) {
      console.error(error);
    }
  };

  const delete_contact = async (id) =>{
    try {
      const result = await axios.delete(serverUrl+`/api/contacts/${id}`);
      fetchContacts();
    } catch (error) {
      console.error('Error fetching contact by id:', error);
    }
  }

  // open the same side drawer form of add new contact to edit the contact and prefill the form with the contact details
  const openEditContactForm = async (contact) => {
      try {
        //   const result = await axios.get(serverUrl+`/api/contacts/${id}`);
        setNewContact(contact);
      } catch (error) {
        console.error('Error fetching contact by id:', error);
      }
    };

    const exportContacts = async () => {
      try {
        // Call the backend API to export contacts as CSV
        const response = await axios.get(serverUrl+'/api/contacts/export/csv', {
          responseType: 'blob', // Ensures the response is treated as a downloadable file
        });
  
        // Create a URL for the CSV file
        const url = window.URL.createObjectURL(new Blob([response.data]));
        
        // Create a temporary link element
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'contacts.csv'); // Set the filename for the downloaded file
        
        // Append the link to the body, click it, and remove it
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Error exporting contacts:', error);
        // Show error toast with detailed response
        showToast("Failed to export contacts. Please try again.\n"+error, 'danger', 10000);
      }
    };

  // Function to open excel or csv file selector to import contacts
  const importContacts = async () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await axios.post(serverUrl+'/api/contacts/import/csv', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      
        // Show success toast with response details
        showToast(
          `Contacts imported successfully!<br>Total Records: ${response.data.totalRecords}<br>Processed: ${response.data.processedCount}, Skipped: ${response.data.skippedCount} <br>Error Log File: <a className="text-white" href="${serverUrl}/${response.data.skippedRecordsFile}" target="_blank" data-bs-toggle="tooltip" title="${response.data.skippedRecordsFile}" download>${response.data.skippedRecordsFile}</a>`,
          'success', 20000
        );
      
        // Fetch contacts after successful import
        fetchContacts();
      } catch (error) {
        // Log the error
        console.error('Error importing contacts:', error);
      
        // Extract error response or fallback to a default message
        const errorMessage =
          error.response?.data?.error ||
          `Failed to import contacts.<br>Status: ${error.response?.status || 'Unknown'}<br>Message: ${
            error.message
          }`;
      
        // Show error toast with detailed response
        showToast(errorMessage, 'danger', 10000);
      }
    };
    fileInput.click();
  }

  // Function to display a Bootstrap toast
  function showToast(message, type, duration = 7000) {
    const toastContainer = document.getElementById('toast-container');
    const toastElement = document.createElement('div');
    toastElement.className = `toast align-items-center text-bg-${type} border-0 show`;
    toastElement.role = 'alert';
    toastElement.innerHTML = `
      <div className="d-flex">
        <div className="toast-body">
          ${message}
        </div>
        <button type="button" className="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;
    toastContainer.appendChild(toastElement);

    // Auto remove the toast after 7 seconds
    setTimeout(() => {
      toastElement.remove();
    }, duration);
  }

  return (
    
    <div style={{ display: 'flex', height: '100vh' }}>
    {/* Left Panel (Filters) */}
      <div style={{ width: '25%', padding: '1rem', borderRight: '1px solid #ddd', overflowY: 'auto' }}>
        <h2>Filters</h2>
        {/* Multi-select filter for countries */}
          <label>Country</label>
          <Select
          isMulti
          options={countries.map(country => ({ value: country.id, label: country.name }))}
          placeholder="Filter by country"
          value={filters.country_id
            .map(id => {
              const country = countries.find(country => country.id === id);
              return country ? { value: country.id, label: country.name } : null;
            })
            .filter(option => option !== null)} // Ensure only valid options
          onChange={(selectedOptions) => handleFilterChange(selectedOptions, 'country_id')}
          className="mb-2"
        />

        {/* Multi-select filter for industries */}
          <label>Industry</label>
          <Select
          isMulti
          options={industries.map(industry => ({ value: industry.id, label: industry.name }))}
          placeholder="Filter by industry"
          value={filters.industry_id
            .map(id => {
              const industry = industries.find(industry => industry.id === id);
              return industry ? { value: industry.id, label: industry.name } : null;
            })
            .filter(option => option !== null)} // Ensure only valid options}
          onChange={(selectedOptions) => handleFilterChange(selectedOptions, 'industry_id')} // Handle industry filter
          className="mb-2"
        />

        {/* Text input filter for email */}
        <div className="form-group mb-2">
          <label>Email</label>
          <input
            type="text"
            value={filters.email}
            onChange={(e) => handleFilterChange(e, 'email')} // Handle email filter
            placeholder="Filter by email"
            className="form-control"
          />
        </div>

        {/* Add more filters here */}
      </div>
    {/* Main Content (75%) */}
    <div style={{ width: '75%', padding: '1rem' }}>
      <div className="container">
      <div className="d-flex justify-content-between align-items-center my-4 mb-4">
        <h1 className="mb-0">Contacts</h1>
        
        <div className="d-flex gap-2">
          {/* Import Button */}
          <button className="btn btn-outline-secondary d-flex align-items-center" onClick={importContacts}>
            <i className="bi bi-download me-2"></i> Import
          </button>

          {/* Export Button */}
          <button className="btn btn-outline-secondary d-flex align-items-center" onClick={exportContacts}>
            <i className="bi bi-upload me-2"></i> Export
          </button>

          {/* Add Contact Button */}
          <button
            className="btn btn-primary"
            type="button"
            data-bs-toggle="offcanvas"
            data-bs-target="#addContactOffcanvas"
            aria-controls="addContactOffcanvas"
          ><i className="bi bi-plus-circle m-2"></i>
            New Contact
          </button>
        </div>
      </div>
      <div className="mb-4">
              Total: {pagination.total}
            </div>


        {/* Contacts List */}
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Email</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Assigned To</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr key={contact.id}>
                <td>{contact.email}</td>
                <td>{contact.first_name}</td>
                <td>{contact.last_name}</td>
                <td>{contact.assigned_to_name}</td>
                <td>
                  {/* Edit/Delete buttons (can be added later) */}
                  <button className="btn btn-outline-warning btn-sm me-2"
                   data-bs-toggle="offcanvas"
                   data-bs-target="#addContactOffcanvas"
                   aria-controls="addContactOffcanvas"
                   onClick={() => openEditContactForm(contact)} >Edit</button>
                  <button className="btn btn-outline-danger btn-sm ms-2"
                  onClick={() => delete_contact(contact.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="d-flex justify-content-end align-items-center mb-3">
          {/* Page Size Dropdown */}
          <div className="d-flex align-items-center me-3">
            <label className="me-2 mb-0">Records per page:</label>
            <select 
              value={pageSize} 
              onChange={handlePageSizeChange} 
              className="form-select form-select-sm"
            >
              <option value={2}>2</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={100}>100</option>
              <option value={150}>150</option>
            </select>
          </div>

          {/* Pagination Buttons */}
          <div className="d-flex align-items-center">
            <button 
              onClick={() => handlePageChange(parseInt(pagination.page) - 1)} 
              disabled={parseInt(pagination.page) === 1}
              className={`btn btn-sm ${parseInt(pagination.page) === 1 ? 'btn-outline-secondary' : 'btn-outline-primary'} me-2`}
            >
              Previous
            </button>
            <span className="me-2">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button 
              onClick={() => handlePageChange(parseInt(pagination.page) + 1)} 
              disabled={parseInt(pagination.page) === parseInt(pagination.totalPages)}
              className={`btn btn-sm ${parseInt(pagination.page) === parseInt(pagination.totalPages) ? 'btn-outline-secondary' : 'btn-outline-primary'}`}
            >
              Next
            </button>
            
          </div>
        </div>
        {/* Pagination Controls */}




        {/* Add New Contact Offcanvas */}
        <div
          className="offcanvas offcanvas-end"
          style={{ width: "35%" }}
          tabIndex="-1"
          id="addContactOffcanvas"
          aria-labelledby="addContactOffcanvasLabel"
        >
          <div className="offcanvas-header">
            <h5 id="addContactOffcanvasLabel">Add New Contact</h5>
            <button
              type="button"
              className="btn-close text-reset"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
            ></button>
          </div>
          <div className="offcanvas-body">
            <form onSubmit={handleSubmit}>
              {/* Basic Fields */}
              
              <div className="form-group mb-2">
                <label>First Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="first_name"
                  value={newContact.first_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group mb-2">
                <label>Last Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="last_name"
                  value={newContact.last_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group mb-2">
                <label>Email</label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={newContact.email}
                  onChange={handleChange}
                  required
                />
              </div>
              
              {/* Dropdowns for Foreign Keys */}
              <div className="form-group mb-2">
                <label>Assigned To (User)</label>
                <select
                  className="form-control"
                  name="assigned_to"
                  value={newContact.assigned_to}
                  onChange={handleChange}
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                      
                      <option 
                      key={user.user_id} 
                      value={user.user_id}
                      >
                      {user.first_name} {user.last_name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Repeat similar dropdowns for other fields... */}

              <div className="form-group mb-2">
                <label>Lead Source</label>
                <input
                  type="text"
                  className="form-control"
                  name="lead_source"
                  value={newContact.lead_source}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group mb-2">
                <label>Company Name</label>
                <input
                  type="text"
                  className="form-control"
                  name="company_name"
                  value={newContact.company_name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group mb-2">
                <label>Industry</label>
                <select
                  className="form-control"
                  name="industry_id"
                  value={newContact.industry_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Industry</option>
                  {industries.map(industry => (
                    <option key={industry.id} value={industry.id}>
                      {industry.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-2">
                <label>City</label>
                <select
                  className="form-control"
                  name="city_id"
                  value={newContact.city_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select City</option>
                  {cities.map(city => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-2">
                <label>State</label>
                <select
                  className="form-control"
                  name="state_id"
                  value={newContact.state_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select State</option>
                  {states.map(state => (
                    <option key={state.id} value={state.id}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-2">
                <label>Country</label>
                <select
                  className="form-control"
                  name="country_id"
                  value={newContact.country_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Country</option>
                  {countries.map(country => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* More fields */}
              <div className="form-group mb-2">
                <label>Job Title</label>
                <input
                  type="text"
                  className="form-control"
                  name="job_title"
                  value={newContact.job_title}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group mb-2">
                <label>Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  name="phone_number"
                  value={newContact.phone_number}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group mb-2">
                <label>LinkedIn</label>
                <input
                  type="text"
                  className="form-control"
                  name="linked_in"
                  value={newContact.linked_in}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group mb-2">
                <label>Website</label>
                <input
                  type="text"
                  className="form-control"
                  name="website"
                  value={newContact.website}
                  onChange={handleChange}
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Add Contact
              </button>
            </form>
          </div>
        </div>
        {/* Add New Contact Form ends here */}


        <div id="toast-container" className="position-fixed bottom-0 end-0 p-3"></div>

      </div>
    </div>
  </div>
  );
};

export default Contact;

