const express = require('express');
const router = express.Router();
const helpers = require('../helper/helpers');
const contactHelpers = require('../helper/contactHelper')
const taskHelper = require('../helper/taskHelper')
const { parse, Parser } = require('json2csv');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');


router.post('/get_table_data', async (req, res) => {
  try {
    let table_name = req.body.table_name;
    // Execute the main query
    let result = await helpers.get_names(table_name,"*")
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

  router.post('/', async (req, res) => {
    try {
      const { 
        page_size,
        page_number,
      } = req.body;
      const offset = (page_number - 1) * page_size;
      const limit = `LIMIT ${page_size} OFFSET ${offset}`
      let allcontacts = await helpers.get_names('contact', '*', limit);
      
      let columns = Object.keys(allcontacts[0]).filter(key=>key);
      let total = await helpers.countTotal('contact');
            
      for (const contact of allcontacts) {
        const {customFieldsFormatted,customFields} = await helpers.getCutsomDetails(contact.id, 'id','contact');
        contact.custom_fields = customFieldsFormatted;
        // Merge arrays and keep unique values
        columns = [...new Set([...columns, ...customFields])];
      }
      // Return all contacts with custom fields
      res.json({allcontacts : allcontacts, total : total, columns:columns});
    } catch (err) {
      console.error(err);
      res.status(500).send(err);
    }
  });

// Get a single contact by ID
  router.get('/:id', async (req, res) => {
    try {
      const id = req.params.id;
      console.log("alo",id);
      const combinedData = await contactHelpers.getCombinedDetails(id,'id');
      
      // Send both arrays as JSON
      res.json(combinedData);
    } catch (err) {
        res.status(500).json({ error: err });
    }
  });

//insert new contact
router.post('/', async (req, res) => {
    try {
      const results = await contactHelpers.add_new_contact(req)
      res.status(200).json({ message: 'Contact added successfully', id: results.insertId });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

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

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

router.post('/import/csv', upload.single('file'), async(req,res)=>{
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fixedColumns = ['first_name','last_name']
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

    const filePath = req.file.path;
    const errors = []; // Store errors here
    const processCSV = async () => {
      return new Promise((resolve, reject) => {
        const stream = fs.createReadStream(filePath)
          .pipe(csv());

          stream.on('data', async (row) => {
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
                "table_name": "lookup",
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
                  // Construct column names and values string for SQL query
                  const columns = addNewlookup['columns']
                  const onlyValues = addNewlookup['onlyValues']

                  const column_names = `(${columns.join(", ")})`;

                  const values_string = addNewlookup['values']
                    .map(valueRow => {
                      return `(${valueRow
                        .map(val => {
                          return typeof val === 'string' ? `'${val}'` : val; // Format value
                        })
                        .join(", ")})`;
                    })
                    .join(", ");
                  
                  const response = await helpers.addNewRow(addNewlookup['table_name'], column_names, values_string,onlyValues);
                  
                  // Replace `customFields` values with corresponding IDs
                  const responseMapping = response.data;
                  console.log("responseMapping",responseMapping);
                  
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
              const latest_counter = await helpers.getLatestCounter(counter_name);
              formFields['counter'] = latest_counter;
  
              const add_contact_results = await contactHelpers.addNewContact(formFields);
              const newTaskId = add_contact_results.insertId;
  
  
              const add_custom_fields_results = await taskHelper.addNewTaskCustomFields(custom_fields, newTaskId, table_name);
            } catch (error) {
              console.error(`Error processing row, ${row}: ${error.message}`);
              errors.push(`Error processing row, ${row}: ${error.message}`); // Collect error
            }
          })

          stream.on('end', () => {
            console.log("CSV processing completed.");
            resolve(); // Resolve once processing is finished
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

router.post('/import/csvOLD', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log("alo");
    

    const filePath = req.file.path;
    const skippedRecords = [];
    const processedRecords = [];
    const errorsFilePath = `uploads/errors_${Date.now()}.csv`;
    let totalRecords = 0;

    // Read the CSV file and process each row
    const processCSV = async () => {
      return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', async (row) => {
            const first_name = row['First Name']
            const last_name = row['Last Name']
            console.log("rowwwwwwwwwww",row['First Name']);
            
            totalRecords++;
            try {
              // Validate required fields
              if (!row.Email || !row['First Name'] || !row['Last Name']) {
                
                skippedRecords.push({
                  record: row,
                  reason: 'Missing required fields (email, first_name, last_name)',
                });
                return;
              }

              // Check for duplicate email
              const [existingContact] = await helpers.findContactByEmail(row.email);
              if (existingContact) {
                skippedRecords.push({
                  record: row,
                  reason: 'Email already exists',
                });
                return;
              }

              // Map foreign keys (country and industry)
              const countryId = row.country ? await helpers.getIdByName('country', row.country) : null;
              const industryId = row.industry ? await helpers.getIdByName('industry', row.industry) : null;

              // Skip records with missing foreign key mappings
              if (row.country && !countryId) {
                skippedRecords.push({
                  record: row,
                  reason: 'Foreign key mapping failed for Country',
                });
                return;
              }
              if (row.industry && !industryId) {
                skippedRecords.push({
                  record: row,
                  reason: 'Foreign key mapping failed for Industry',
                });
                return;
              }

              // Insert valid record into the database
              await helpers.insertContact({
                email: row.email,
                first_name: row.first_name,
                last_name: row.last_name,
                phone_number: row.phone_number || null,
                company_name: row.company_name || null,
                country_id: countryId,
                industry_id: industryId,
                assigned_to: row.assigned_to || null,
                lead_source: row.lead_source || null,
                job_title: row.job_title || null,
                linked_in: row.linked_in || null,
                address: row.address || null,
                website: row.website || null,
                company_hq: row.company_hq || null,
                notes: row.notes || null,
              });

              processedRecords.push(row);
            } catch (err) {
              skippedRecords.push({
                record: row,
                reason: `Error: ${err.message}`,
              });
            }
          })
          .on('end', () => {
            resolve();
          })
          .on('error', (err) => {
            reject(err);
          });
      });
    };

    // Process the CSV file
    await processCSV();

    // Write skipped records to a CSV file
    const writeSkippedRecords = () => {
      return new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(errorsFilePath);
        writeStream.write('email,first_name,last_name,phone,company,reason\n');
        skippedRecords.forEach(({ record, reason }) => {
          const recordValues = Object.values(record).join(',');
          writeStream.write(`${recordValues},${reason}\n`);
        });
        writeStream.end();
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });
    };

    await writeSkippedRecords();

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    // Respond with results
    res.json({
      message: 'Contacts imported successfully with some skipped records',
      totalRecords,
      processedCount: processedRecords.length,
      skippedCount: skippedRecords.length,
      skippedRecordsFile: errorsFilePath,
    });
  } catch (err) {
    res.status(500).json({ error: `Error processing CSV: ${err.message}` });
  }
});
  
module.exports = router