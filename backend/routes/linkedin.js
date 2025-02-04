const express = require('express');
const router = express.Router();
const axios = require('axios');



// API endpoint to get task lists
router.post('/', async (req, res) => {
    const linkedin_url = req.body.linkedinUrl;

    const options = {
        method: 'GET',
        url: 'https://fresh-linkedin-profile-data.p.rapidapi.com/get-linkedin-profile',
        params: {
          linkedin_url: linkedin_url,
          include_skills: 'false',
          include_certifications: 'false',
          include_publications: 'false',
          include_honors: 'false',
          include_volunteers: 'false',
          include_projects: 'false',
          include_patents: 'false',
          include_courses: 'false',
          include_organizations: 'false',
          include_profile_status: 'false',
          include_company_public_url: 'false'
        },
        headers: {
          'x-rapidapi-key': '04131557a7msh78da259e9b88654p1b8c45jsn0e54907ef12f',
          'x-rapidapi-host': 'fresh-linkedin-profile-data.p.rapidapi.com'
        }
      };
    
    
    try {
        const response = await axios.request(options);
        console.log(response.data);
        res.json(response.data.data)
    } catch (error) {
        console.error(error);
    }
  });

module.exports = router;