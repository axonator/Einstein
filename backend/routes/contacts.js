const express = require('express');
const router = express.Router();
const helpers = require('../helper/helpers');
const contactHelpers = require('../helper/contactHelper')
const taskHelper = require('../helper/taskHelper')
const { parse, Parser } = require('json2csv');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { type } = require('os');
const { json } = require('body-parser');
// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });


  // router.post('/get_table_data', async (req, res) => {
  //   try {
  //     let table_name = req.body.table_name;
  //     // Execute the main query
  //     let result = await helpers.get_names(table_name,"*")
  //     res.json(result);
  //   } catch (err) {
  //     res.status(500).json({ error: err.message });
  //   }
  // });

  router.post('/', async (req, res) => {
    try {
      const { 
        page_size,
        page_number,
        TableName,
        Columns,
        Condition
      } = req.body;
      const offset = (page_number - 1) * page_size;
      const limit = `LIMIT ${page_size} OFFSET ${offset}`
      
      let allcontacts = await helpers.get_names(TableName, Columns, `${Condition} ${limit}`);
      
      let tableColumns = allcontacts.length > 0 ? Object.keys(allcontacts[0]).filter(key => key) : [];
      let total = await helpers.countTotal(TableName, "*", Condition);
            
      for (const contact of allcontacts) {
        const {customFieldsFormatted,customFields} = await helpers.getCutsomDetails(contact.id, 'id',"contact");
        contact.custom_fields = customFieldsFormatted;
        // Merge arrays and keep unique values
        tableColumns = [...new Set([...tableColumns, ...customFields])];
      }
      // Return all contacts with custom fields
      res.json({allcontacts : allcontacts, total : total, tableColumns:tableColumns});
    } catch (err) {
      console.error(err);
      res.status(500).send(err);
    }
  });

  // Get a single contact by ID
  router.get('/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const combinedData = await contactHelpers.getCombinedDetails(id,'id');
      
      // Send both arrays as JSON
      res.json(combinedData);
    } catch (err) {
        res.status(500).json({ error: err });
    }
  });

  //insert new contact
  // router.post('/', async (req, res) => {
  //   try {
  //     const results = await contactHelpers.add_new_contact(req)
  //     res.status(200).json({ message: 'Contact added successfully', id: results.insertId });
  //   } catch (err) {
  //     res.status(500).json({ error: err.message });
  //   }
  // });

  //edit contact
  router.put('/:id', async (req, res) => {
    try {
        // Execute the main query
        const results = await contactHelpers.update_contact(req)
        if (results.affectedRows === 0) {
          return res.status(404).json({ error: 'Contact not found' });
        }
        res.json({ message: 'Contact updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
    
  });

  // Delete a contact by ID
  router.delete('/:id', async (req, res) => {
    try {
      const id =req.params.id;
      const result = await helpers.deleterow(id,'contact','id');

      res.json(result);
    } catch (err) {
        res.status(500).json({ error: err });
    }
  });

  // Export contacts as CSV
  router.get('/export/csv', async (req, res) => {
    try {
        // Fetch all contacts from the database
        const contacts_json = await contactHelpers.get_contacts(req);
        let contacts = contacts_json.data[0]
        // Convert JSON data to CSV format
        if (contacts.length === 0) {
          return res.status(404).json({ message: 'No contacts found to export.' });
        }
    
        // Specify fields to include in the CSV
        const fields = Object.keys(contacts[0]).filter(
          (field) => !['city_id', 'state_id', 'country_id', 'industry_id'].includes(field)
        );
        
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(contacts);
        
        // Set headers to prompt file download
        res.setHeader('Content-Disposition', 'attachment; filename=contacts.csv');
        res.setHeader('Content-Type', 'text/csv');

        // Send the CSV data as a response
        res.send(csv);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
  });


  router.post('/import/csv', upload.single('file'), async(req,res)=>{
    try { 
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fixedColumns = ['first_name','last_name','order_number']
      const availableCustomFields = await taskHelper.get_all_availble_customFields_for_taskType(26);
      
      const customFieldsFormatted = {};
      const availableCustomFieldsName = [];
      const availableCustomFieldsIds = [];
      availableCustomFields.forEach(field => {
        customFieldsFormatted[field.display_name_singular] = {
          plural: field.display_name_plural,
          value: field.value,
          type: field.type,
          custom_field_id: field.custom_field_id,
          lookupId: field.lookup_id,
        };
        availableCustomFieldsName.push(field.display_name_singular);
        availableCustomFieldsIds.push(field.custom_field_id);
      });

      let lookupTable_Rows = await helpers.getIdsByNames('`option`, lookup_id, fk_custom_field_id','lookup','fk_custom_field_id',availableCustomFieldsIds)
      let lookupTable = lookupTable_Rows.reduce((map, row) => {
        if (!map[row.fk_custom_field_id]) {
          map[row.fk_custom_field_id] = {};
        }
        map[row.fk_custom_field_id][row.option] = row.lookup_id;
        return map;
      }, {});
      
      const counter_name = 'contacts';
      const table_name = 'contact' ;
      const defaulOptionCustomFields = [10, 26, 33]
      const default_lookup_ids = {
        10: 58,
        26 : 186,
        33 : 771
      }
      const addNewLookupCustomFields = [];

      async function processRow(row, latest_counter) {
        return new Promise(async (resolve, reject) => {
        try {
          // Function to normalize column names (convert _ and - to spaces and capitalize)
          const normalizeKey = (key) => {
            return key
              .toLowerCase()
              .replace(/[_-]/g, ' ')
              .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
          };
          const normalizedRow = {};
          Object.keys(row).forEach((key, value) => {
            normalizedRow[normalizeKey(key)] = row[key];
          });
          
          
          const custom_fields = {}
          let addNewlookup = {
            "lookup_table_name": "lookup",
            "columns": ["fk_custom_field_id", "`option`"],
            "values": [],
            "onlyValues":[]
          };
    
          Object.keys(normalizedRow).forEach((key) => {
            const value = normalizedRow[key];
            if (availableCustomFieldsName.includes(key) && customFieldsFormatted[key]['type'] != 'choice') {
              const cf_id = customFieldsFormatted[key]['custom_field_id'];
              value.length > 0 ? custom_fields[cf_id] = value : null;
            }else if(availableCustomFieldsName.includes(key) && customFieldsFormatted[key]['type'] == 'choice'){
    
              const cf_id = customFieldsFormatted[key]['custom_field_id'];
              const LookupIds = lookupTable[cf_id];
              const currentlookupid = LookupIds[value]
    
              if(defaulOptionCustomFields.includes(cf_id)){
                custom_fields[cf_id] = currentlookupid ? currentlookupid : default_lookup_ids[cf_id]
              }else if (addNewLookupCustomFields.includes(cf_id)){
                //add new company name into addnewlookup
                let newValue = [cf_id, value];
                addNewlookup['values'].push(newValue);
                addNewlookup['onlyValues'].push(value);
              }
              else{
                custom_fields[cf_id] = currentlookupid ? currentlookupid : LookupIds['Other']
              }
            }
          });
    
          if (addNewlookup['values'].length > 0) {
            const lookup_table_name = addNewlookup['lookup_table_name'];
            const column_names = addNewlookup['columns']
            const onlyValues = addNewlookup['onlyValues']
    
            const response = await helpers.addNewRow(lookup_table_name, column_names, onlyValues, onlyValues);
            
            // Replace `customFields` values with corresponding IDs
            const responseMapping = response.data;
            Object.entries(custom_fields).forEach(([key, value]) => {
              if (responseMapping[value]) {
                custom_fields[key] = responseMapping[value];
              }
            });
          }
    
          // Extract first name and last name
          const firstName = normalizedRow['First Name'] || "First Name";
          const lastName = normalizedRow['Last Name'] || 'Last Name';
    
          // Format names (capitalize first letter of each word)
          const formatName = (name) => {
            return name
              .toLowerCase()
              .replace(/\b\w/g, (char) => char.toUpperCase());
          };
    
          //add new contact in contact table and get newTaskId
          const formFields={
            first_name: formatName(firstName),
            last_name: formatName(lastName),
            counter_name: counter_name,
            table_name: table_name
          }

          const { first_name,last_name } = formFields;
          const nextOrderNumber = latest_counter + 1000;
          const values = [first_name,last_name, nextOrderNumber];
          const addResult = await helpers.addNewRow(table_name, fixedColumns, values, ['contact_id'])
          const newTaskId = addResult.contact_id;
 
          if (campaignDetails) {
            let Body = campaignDetails?.raw_body ?? "THIS IS TEST BODY";
            Body = helpers.replacePlaceholders(Body,formFields);
    
            let Subject = campaignDetails?.raw_subject ?? "THIS IS TEST SUBJECT";
            Subject = helpers.replacePlaceholders(Subject, formFields);
    
            const status = 'Draft';
            helpers.addNewRow("campaign_schedule", ["fk_contact_id", "body","subject","status","fk_campaign_id"], [newTaskId, Body, Subject, status, campaignDetails.id]);
          }
    
          await taskHelper.addNewTaskCustomFields(custom_fields, newTaskId, table_name);
          resolve(); // Resolve the promise when row processing is complete
        } catch (error) {
          console.error(`Error processing row, ${row}: ${error.message}`);
          errors.push(`Error processing row, ${row}: ${error.message}`); // Collect error
          reject(error); // Reject the promise if an error occurs
        }
      });
      }
      const campaignDetails = JSON.parse(req.body.campaignDetails);
      const filePath = req.file.path;
      const errors = []; // Store errors here
      const processCSV = async () => {
        return new Promise((resolve, reject) => {
          let totalRows = 0;
          const processingTasks = []; // Collect promises here
          const stream = fs.createReadStream(filePath).pipe(csv());

          stream.on('data', async (row) => {
            const latest_counter = await helpers.getLatestCounter('contacts');
            totalRows++; // Increment row counter
            const updatedCounter = latest_counter + (1000 * totalRows);
            // Store the promise but don't await here
            const processingTask = processRow(row, updatedCounter, campaignDetails);
            processingTasks.push(processingTask);
          })

          stream.on('end', async () => {
            try {
              await Promise.all(processingTasks); // Wait for all rows to finish processing
              fs.unlinkSync(filePath); // Delete CSV file after processing all rows
              console.log("CSV processing completed.");
              resolve();
            } catch (error) {
              reject(error);
            }
          });
  
          stream.on('error', (err) => {
            console.error("Error reading CSV file:", err.message);
            errors.push(`Error reading CSV file: ${err.message}`);
            reject(err); // Reject on stream error
          });

        });
      }
      await processCSV();

      if (errors.length > 0) {
        return res.status(500).json({ message: "CSV imported with errors", errors });
      }

      res.status(200).json({ message: "CSV imported successfully" });
      
    } catch (error) {
      console.error(`Error processing CSV: ${error.message}`);
      res.status(500).json({ error: `Error processing CSV: ${error.message}` });
    }
  })
  
module.exports = router