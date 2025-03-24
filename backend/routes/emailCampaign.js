const express = require('express');
const router = express.Router();
const helper = require('../helper/helpers');
const emailHelper = require('../helper/emailHelper')

async function runContinuously() {
    const now = new Date();
    // const today = now.toLocaleDateString(); // Full date 4/3/2025
    // const currentDate = now.getDate(); //4
    // const currentMonth = now.getMonth() + 1; // Month 3
    // const currentYear = now.getFullYear(); // Year 2025
    // const currentTime = now.toLocaleTimeString(); // Full time in hh:mm:ss format 2:07:57 pm
    // const currentSeconds = now.getSeconds(); // Seconds (0-59) 57
    let dayofweek = now.getDay(); // "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
    const currentHour = now.getHours(); // Hours (0-23) 14
    const currentMinutes = now.getMinutes(); // Minutes (0-59) 7

    dayofweek = dayofweek == 0 ? 6 : dayofweek - 1

    // Format YYYY-MM-DD
    const today = now.getFullYear() + '-' + 
        String(now.getMonth() + 1).padStart(2, '0') + '-' + 
        String(now.getDate()).padStart(2, '0');

    const CampaignDetails = await emailHelper.getDueCampaignList()
    const contacts = await emailHelper.getSendEmailList(today,currentHour,currentMinutes)
    
    if (CampaignDetails.campaignIds.length > 0) {
      emailHelper.processCampaigns(CampaignDetails.result,CampaignDetails.campaignIds);
    }
    
    for (const contact of contacts) {
      emailHelper.sendEmail(contact);
    }
    setTimeout(runContinuously, 10 * 1000);
}

// Start the continuous function
runContinuously();


// Get all email campaigns
router.post('/allCampaigns', async (req, res) => {
    try {
      const { 
        page_size = 10,
        page_number = 1,
        search = false
      } = req.body;
      const table_name = 'campaign'
      const offset = (page_number - 1) * page_size;
      const limit = `LIMIT ${page_size} OFFSET ${offset}`

      let searchCondition = "";
      if (search) {
          searchCondition = `WHERE name LIKE '%${search}%' OR description LIKE '%${search}%'`; 
      }
      let allCampaigns = await helper.get_names(table_name, '*', `${searchCondition} ${limit}`);
      
      let columns = allCampaigns.length > 0 ? Object.keys(allCampaigns[0]).filter(key => key) : [];
      let total = await helper.countTotal(table_name,"*",searchCondition);
            
    //   for (const campaign of allCampaigns) {
    //     const {customFieldsFormatted,customFields} = await helper.getCutsomDetails(campaign.id, 'id',table_name);
    //     campaign.custom_fields = customFieldsFormatted;
    //     // Merge arrays and keep unique values
    //     columns = [...new Set([...columns, ...customFields])];
    //   }

      // Return all campaigns with custom fields
      res.json({allCampaigns : allCampaigns, total : total, columns:columns});
    } catch (err) {
      console.error(err);
      res.status(500).send(err);
    }
  });

router.get('/:id', async (req, res) => {

});

router.put('/:id', async (req, res) => {

});

router.delete('/:id', async (req, res) => {

});











module.exports = router;
