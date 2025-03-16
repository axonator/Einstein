const express = require('express');
const router = express.Router();
const helper = require('../helper/helpers')
const taskHelper = require('../helper/taskHelper');

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

module.exports = router;
