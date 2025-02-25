const express = require('express');
const router = express.Router();
const helper = require('../helper/helpers')
const taskHelper = require('../helper/taskHelper');
const contactHelpers = require('../helper/contactHelper')

  router.post('/addNewRows', async (req, res) => {
    try {
      
      const { table_name, columns, values,onlyValues } = req.body;
      // Validate the request body
      if (!table_name || !Array.isArray(columns) || !Array.isArray(values)) {
        return res.status(400).json({ error: "Invalid input. Please provide table_name, columns, and values." });
      }

      // Construct column names and values string for SQL query
      const column_names = `(${columns.join(", ")})`;
      const values_string = values
        .map(valueRow => {
          return `(${valueRow
            .map(val => {
              return typeof val === 'string' ? `'${val}'` : val; // Format value
            })
            .join(", ")})`;
        })
        .join(", ");

      // Call the helper function to insert rows
      const response = await helper.addNewRow(table_name, column_names, values_string,onlyValues);
      res.status(200).json(response);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to insert rows into the database." });
    }
  });
  // API endpoint to get task lists
  router.post('/get_list', async (req, res) => {
    const table_name = req.body.table_name;
    const column_name = req.body.column_name;
    const condition = req.body.condition;
    try {
      const task_list = await helper.get_names(table_name,column_name,condition)
      
      res.json(task_list);
    } catch (err) {
      console.error(err);
      res.status(500).send(err);
    }
  });

  //ADD NEW TASK IN TASK TABLE WITH CUSTOM FIELDS
  router.post('/add_task', async (req, res) => {
    try {
      let formFields = req.body;
      const counterName = formFields.counter_name;
      const tableName = formFields.table_name;
      const latest_counter = await helper.getLatestCounter(counterName);
      formFields['counter'] = latest_counter;
      if (tableName == "task") {
        const results = await taskHelper.addNewTask(formFields);
        res.status(200).json({ message: `${tableName} added successfully`, id: results.insertId });
      }else{
        const results = await contactHelpers.addNewContact(formFields);
        res.status(200).json({ message: `${tableName} added successfully`, id: results.insertId });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send(err);
    }
  });

  // ADD NEW TASK WITH CUSTOM FIELDS
  router.post('/addTaskCustomFields', async (req, res) => {
    try {
      const customFields = req.body.customFields;
      const table_name = req.body.table_name;

      // Check if customFields is a string and parse it
      if (typeof customFields === "string") {
        customFields = JSON.parse(customFields);
    }
      
      // Extract newTaskId
      const newTaskId = customFields.newTaskId;

      // Remove newTaskId from customFields for processing
      delete customFields.newTaskId;

      const results = await taskHelper.addNewTaskCustomFields(customFields, newTaskId, table_name);
      res.status(200).json({ message: 'Custom Fields Added', results });
    } catch (err) {
      console.error(err);
      res.status(500).send(err);
    }
  });

  //get all avalible custom fields for task type
  router.post('/getCustomFields', async (req, res) => {
    try {
      let taskTypeId = req.body.taskTypeId;
      const customFileds = await taskHelper.get_all_availble_customFields_for_taskType(taskTypeId)
      res.json(customFileds)
    } catch (err) {
      console.error(err);
      res.status(500).send(err);
    }
  });

  //GET ALL TABS FOR MENTIONED TASK TYPE
  router.post('/get_tabs', async (req, res) => {
    const { display_name_singular } = req.body;

    try {
      const parent_task_type_id = await taskHelper.get_task_type_id(display_name_singular);
      const allowed_type_ids = await taskHelper.get_allowed_type_ids(parent_task_type_id);

      // Retrieve task type names for all allowed type IDs
      const taskTypeDetails = await Promise.all(
        allowed_type_ids.map(async (typeId) => {
          try {
            const result = await taskHelper.get_task_type_name(typeId);
            return {
              taskId: typeId,
              display_name_plural: result[0].display_name_plural,
              display_name_singular: result[0].display_name_singular,
            };
          } catch (err) {
            console.error(`Error fetching name for task type ID ${typeId}:`, err);
            return null; // Optionally skip this ID
          }
        })
      );

      // Filter out null entries (in case of errors)
      const filteredTaskTypeDetails = taskTypeDetails.filter((detail) => detail !== null);

      // Create the response structure
      const response = {
        tabsid: filteredTaskTypeDetails.map((detail) => detail.taskId),
        display_name_plural: filteredTaskTypeDetails.map((detail) => detail.display_name_plural),
        display_name_singular: filteredTaskTypeDetails.map((detail) => detail.display_name_singular),
      };

      res.json(response);
    } catch (error) {
      console.error(error);
      res.status(500).send(error);
    }
  });

  //GET ALL THE TASK FROM THE TASK TABLE FOR THE MENTIONED TASK TYPE
  router.post('/get_scope', async (req, res) => {
    const { 
      taskTypeCode,
      parent_task_id,
      FilteredCFT,
      FilteredCFTValue,
      selected_tab_id,
      page_size,
      page_number,
      tags } = req.body;
    
    ParentId = taskTypeCode == "all" ? taskTypeCode : parent_task_id;
    
    try {
      const identifier = 'fk_task_type_id';
      let alltasks = await taskHelper.getTaskDetails(selected_tab_id, identifier, ParentId, page_size, page_number, tags);
      let total = await taskHelper.countTotal(selected_tab_id,identifier,ParentId);      
      for (const task of alltasks) {
        // Fetch and format custom fields
        const {customFieldsFormatted,customFields} = await helper.getCutsomDetails(task.task_id, 'task_id');
        task.custom_fields = customFieldsFormatted;
      }
      // Apply filtering logic if FilteredCFT is not 'Filters'
      if (FilteredCFT !== 'Filters') {
          alltasks = alltasks.filter(task => 
              task.custom_fields &&
              task.custom_fields.hasOwnProperty(FilteredCFT) &&
              task.custom_fields[FilteredCFT]['value'] === FilteredCFTValue
          );
      }
      // Return all tasks with custom fields
      res.json({alltasks : alltasks, total : total});
    } catch (err) {
      console.error(err);
      res.status(500).send(err);
    }
  });


  //DELET TASK FROM TASK TABLE
  router.delete('/:id', async (req, res) => {
    try {
      
      const id = req.params.id;
      const { deleteChildren, table_name, column_name } = req.body; // Add a parameter to check if child tasks should be deleted

      // Delete child tasks if the checkbox is checked
      if (table_name == 'task') {
        if (deleteChildren) {
          await helper.deleterow(table_name, ['parent_task_id'],[id]);
  
        } else {
          const columnValues = { parent_task_id: 404 };
          const condition = { parent_task_id: id};
          await helper.updateTableData(table_name, columnValues, condition)
        }
      }

      // Delete the task
      const result = await helper.deleterow(table_name, [column_name],[id]);
      res.json(result);
    } catch (err) {
        res.status(500).json({ error: err });
    }
  });

  //GET all FIELDS FOR TASK ID FROM TASK TABLE
  router.post('/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const combinedData = await taskHelper.getCombinedTaskDetails(id, 'task_id');
      
      // Send both arrays as JSON
      res.json(combinedData);
    } catch (err) {
        res.status(500).json({ error: err });
    }
  });

  router.post('/updateTaskCustomFields/:id', async (req, res) => {
    try {
      const taskId = req.params.id; // Extract task ID from route parameter
      const {newId, customFieldId} = req.body
      const columnValues = { value: newId };
      const condition = { fk_custom_field_id: customFieldId ,fk_task_id:taskId};
      const table_name = 'custom_field__task';
      await helper.updateTableData(table_name, columnValues, condition); // Call helper to update DB
      res.status(200).json({ message: "Task updated successfully." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update task." });
    }
  });

  router.post('/updateTaskFields/:id', async (req, res) => {
    try {
      const formData = req.body.formData
      const columnValues = { task_data: formData.taskData,display_name:formData.name,fk_status_id:formData.statusId };
      const condition = { task_id:req.params.id};
      const table_name = 'task';

      await helper.updateTableData(table_name, columnValues, condition); // Call helper to update DB

      res.status(200).json({ message: "Task updated successfully." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update task ." });
    }
  });
  
  

module.exports = router;
