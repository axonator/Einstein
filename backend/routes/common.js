const express = require('express');
const router = express.Router();
const helper = require('../helper/helpers');
const taskHelper = require('../helper/taskHelper')

router.post('/addNewRows', async (req, res) => {
    try {
      const { table_name, columns, values,onlyValues } = req.body;
      
      // Validate the request body
      if (!table_name || !Array.isArray(columns) || !Array.isArray(values)) {
        return res.status(400).json({ error: "Invalid input. Please provide table_name, columns, and values." });
      }

      // Call the helper function to insert rows
      const response = await helper.addNewRow(table_name, columns, values,onlyValues);
      res.status(200).json(response);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to insert rows into the database." });
    }
  });

  //ADD NEW Data IN TABLE
  router.post('/add_new', async (req, res) => {
    try {
      // Destructure request body
      const { counter_name, table_name, column_names, ...formFields } = req.body;

      // Fetch latest counter and prepare new order number
      const latest_counter = await helper.getLatestCounter(counter_name);
      const nextOrderNumber = latest_counter + 1000;

      // Define reusable values
      const counter_table_name = 'counter';
      const insertedIds = ['id'];
      const condition = { counter_name };
      let updateCounter = true;
      let addResult = {};

      if (table_name == "task") {
        const { task_type_id, statusId, taskData, name, parent_task_id } = formFields;
        const values = [name, taskData, task_type_id, statusId, nextOrderNumber, parent_task_id];
        addResult = await helper.addNewRow(table_name, column_names, values, insertedIds)
      }else if(table_name == 'contact'){
        const { first_name,last_name } = formFields;
        const values = [first_name,last_name, nextOrderNumber];
        addResult = await helper.addNewRow(table_name, column_names, values, insertedIds)
      }else if(table_name == 'campaign'){
        updateCounter = false;
        const { name,description } = formFields;
        const values = [name,description];
        addResult = await helper.addNewRow(table_name, column_names, values, insertedIds)
      }

      // Update counter and respond
      updateCounter && await helper.updateTableData(counter_table_name, { latest_counter: nextOrderNumber }, condition);
      res.status(200).json({ message: `${table_name} added successfully`, id: addResult.id });

    } catch (err) {
      console.error(err);
      res.status(500).send(err);
    }
  });

  // API endpoint to get lists
  router.post('/get_list', async (req, res) => {
    const table_name = req.body.table_name;
    const column_name = req.body.column_name;
    const condition = req.body.condition;
    try {
      const list = await helper.get_names(table_name,column_name,condition)
      
      res.json(list);
    } catch (err) {
      console.error(err);
      res.status(500).send(err);
    }
  });

  // ADD NEW row WITH CUSTOM FIELDS
  router.post('/addCustomFields', async (req, res) => {
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

  router.post('/updateCustomFields/:id', async (req, res) => {
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

  router.post('/updateFields/:id', async (req, res) => {
    try {
      const formData = req.body.formData
      const columnValues = { task_data: formData.taskData,display_name:formData.name,fk_status_id:formData.statusId };
      const condition = { task_id:req.params.id};
      const table_name = formData.table_name;   

      await helper.updateTableData(table_name, columnValues, condition); // Call helper to update DB

      res.status(200).json({ message: "Task updated successfully." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update task ." });
    }
  });

  router.post('/updateData', async (req, res) => {
    try {
      const { table_name, columnValues, condition } = req.body;
      await helper.updateTableData(table_name, columnValues, condition); // Call helper to update DB

      res.status(200).json({ message: `${table_name} updated successfully` });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Failed to update ${tableName}` });
    }
  });
  
//Delete row FROM TABLE
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

// Get all availabe tags
router.get('/getAvailableTags', async (req, res) => {
    try {
      const results = await helper.get_names("tag","*")
      res.json(results);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

router.post('/taskTags/:id', async (req, res) => {
try {
    const id = req.params.id;
    const results = await helper.getTasktags(id)
    res.json(results);
} catch (err) {
    res.status(500).json({ error: err.message });
}
});

router.post('/addtaskTag/:id', async (req, res) => {
    try {
        const taskId = req.params.id;
        const {tagId} = req.body;
        const table_name = "task__tag";
        const column_names = ["fk_task_id","fk_tag_id"]
        const values = [taskId, tagId]
        const results = await helper.addNewRow(table_name, column_names, values)
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
    });

router.post('/addNewTag', async (req, res) => {
    try {
        const {tagName} = req.body; 
        const table_name = "tag";
        const column_names = ["display_name"]
        const values = [tagName]
        const InsertedIds = ['tag_id']
        const results = await helper.addNewRow(table_name, column_names, values, InsertedIds)
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
    });

router.delete('/taskTags/:id', async (req, res) => {
    try {
        const taskId = req.params.id;
        const {tagId} = req.body;
        const tableName = 'task__tag'
        helper.deleterow(tableName, ['fk_tag_id', 'fk_task_id'], [tagId, taskId])
        .then(response => res.json(response))
        .catch(error => console.error(error));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
    });
  

module.exports = router;
