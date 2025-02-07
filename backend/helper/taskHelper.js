const { initDatabase } = require('../database');
const db = initDatabase();

const helper = require('./helpers');

async function getCombinedTaskDetails(task_id, identifier,parent_id="all",page_size=10,page_number=1) {
  const [taskDetails] = await getTaskDetails(task_id, identifier, parent_id, page_size=10, page_number=1);
  const customFieldsFormatted = await getTaskCustomDetails(task_id);
  return { taskDetails, customFields: customFieldsFormatted };
}

async function get_task_type_name(task_type_id) {
  const query = `SELECT display_name_plural, display_name_singular FROM manager_db.task_type WHERE task_type_id = ${task_type_id};`;
  try {
    const [result] = await db.execute(query);
    return result;
  } catch (err) {
    throw new Error(`Error fetching task type name for id - ${task_type_id}: ${err}`);
  }
}

async function getTaskCustomDetails(task_id) {
  const query = `
    SELECT 
      t.task_id,
      t.display_name AS task_name,
      cf.custom_field_id,
      cf.display_name_singular,
      cf.display_name_plural,
      CASE 
          WHEN cft.ischoice = TRUE THEN l.option 
          ELSE cft.value                         
      END AS value,
      cf.type AS type,
      CASE 
          WHEN cft.ischoice = TRUE THEN l.lookup_id
          ELSE NULL
      END AS lookup_id
    FROM 
      task t
    JOIN 
      custom_field__task cft ON t.task_id = cft.fk_task_id
    JOIN 
      custom_field cf ON cft.fk_custom_field_id = cf.custom_field_id
    LEFT JOIN 
      lookup l ON cft.ischoice = TRUE AND cft.value = l.lookup_id
    WHERE 
      t.task_id = ${task_id};`;

  try {
    const [result] = await db.execute(query);
    // Transform CustomFields into the desired format
    const customFieldsFormatted = {};
    result.forEach(field => {
      customFieldsFormatted[field.display_name_singular] = {
        plural: field.display_name_plural,
        value: field.value,
        type: field.type,
        custom_field_id: field.custom_field_id,
        lookupId: field.lookup_id,
      };
    });
    return customFieldsFormatted;
  } catch (err) {
    throw new Error(`Error fetching custom fields for task id ${task_id}: ${err}`);
  }
}

async function getTaskDetails(task_id, identifier, parent_id,page_size=10,page_number=1) {
  const offset = (page_number - 1) * page_size;
  const query = `
    SELECT 
        task.task_id, 
        task.display_name AS task_name, 
        task.task_data, 
        task.fk_task_type_id AS task_type_id, 
        task_type.display_name_singular AS task_type, 
        task.fk_status_id AS status_id, 
        status.display_name AS status, 
        task.order_number, 
        task.parent_task_id, 
        parent_task.display_name AS parent_task_name,
        parent_task.fk_task_type_id AS parent_task_type_id,
        parent_task_type.display_name_singular AS parent_task_type
    FROM 
        task 
    LEFT JOIN 
        task_type ON task.fk_task_type_id = task_type.task_type_id 
    LEFT JOIN 
        status ON task.fk_status_id = status.status_id 
    LEFT JOIN 
        task AS parent_task ON task.parent_task_id = parent_task.task_id 
    LEFT JOIN 
        task_type AS parent_task_type ON parent_task.fk_task_type_id = parent_task_type.task_type_id 
    WHERE 
        task.${identifier} = ${task_id} 
        ${parent_id == "all" ? "" : `AND task.parent_task_id = ${parent_id}`} 
        LIMIT ${page_size} OFFSET ${offset};`;

  try {
    const [result] = await db.execute(query);
    return result;
  } catch (err) {
    throw new Error(`Error fetching tasks for task_type_id: ${err}`);
  }
}

async function countTotal(task_id, identifier, parent_id) {
  // Count total records
  const countQuery = `
  SELECT COUNT(*) AS total
  FROM task
  WHERE task.${identifier} = ? 
  ${parent_id !== "all" ? "AND task.parent_task_id = ?" : ""};`;

  
  try {
    // Calculate total (Avoid fetching all rows)
    const countParams = parent_id !== "all" ? [task_id, parent_id] : [task_id];
    const [countResult] = await db.execute(countQuery, countParams);
    
    // Extract total count
    const total = countResult[0]?.total || 0;
    return total;
  } catch (err) {
    throw new Error(`Error total count: ${err}`);
  }
}

async function get_allowed_type_ids(parent_id) {
  const query = `SELECT allowed_type_id FROM manager_db.task_type__hierarchy WHERE parent_id = ${parent_id};`;

  try {
    const [result] = await db.execute(query);
    return result.map(row => row.allowed_type_id);
  } catch (err) {
    throw new Error(`Error fetching tasks for parent_id ${parent_id}: ${err}`);
  }
}

async function get_all_availble_customFields_for_taskType(taskTypeId) {
  const query = `SELECT 
      cf.custom_field_id, 
      cf.display_name_singular, 
      cf.display_name_plural, 
      cf.type
  FROM 
      manager_db.custom_field cf
  JOIN 
      manager_db.task_type__custom_field tcf 
      ON cf.custom_field_id = tcf.fk_custom_field_id
  WHERE 
      tcf.fk_task_type_id = ${taskTypeId};`;

  try {
    const [result] = await db.execute(query);
    return result;
  } catch (err) {
    throw new Error(`Error fetching available custom fields for ${taskTypeId}: ${err}`);
  }
}

async function get_task_type_id(display_name_singular) {
  const query = `SELECT task_type_id FROM task_type WHERE display_name_singular = "${display_name_singular}";`;

  try {
    const [result] = await db.execute(query);
    if (result.length > 0) {
      return result[0].task_type_id;
    } else {
      throw new Error(`No task found for display_name_singular ${display_name_singular}`);
    }
  } catch (err) {
    throw new Error(`Error fetching display_name_singular ${display_name_singular}: ${err}`);
  }
}

async function addNewTask(fields) {
  const { task_type_id, statusId, taskData, name, counter, parent_task_id } = fields;
  const nextOrderNumber = counter + 1000;
  
  const query = `INSERT INTO task 
    (display_name, task_data, fk_task_type_id, fk_status_id, order_number, parent_task_id) 
    VALUES (?, ?, ?, ?, ?, ?)`;

  const values = [name, taskData, task_type_id, statusId, nextOrderNumber, parent_task_id || null];

  // Update counter
  const columnValues = { latest_counter: nextOrderNumber };
  const condition = { counter_name: 'tasks' };
  const counter_table_name = 'counter';

  try {
    const [result] = await db.execute(query, values);
    await helper.updateTableData(counter_table_name, columnValues, condition);
    return result;
  } catch (err) {
    throw new Error(`Error adding new task: ${JSON.stringify(fields)} - ${err.message}`);
  }
}


async function addNewTaskCustomFields(fields, newTaskId) {
  try {
    if (Object.keys(fields).length === 0) {
      return { message: "No custom fields to insert" };
    }
    const getChoiceIdsQuery = "SELECT custom_field_id FROM custom_field WHERE type = 'choice';";
    const [choiceIds] = await db.execute(getChoiceIdsQuery);
    const isChoiceList = choiceIds.map(item => item.custom_field_id);
  
  
    const queries = [];
    const values = [];
  
    // Construct queries for each custom field
    for (const [fk_custom_field_id, value] of Object.entries(fields)) {
      const isChoice = isChoiceList.includes(Number(fk_custom_field_id)) ? 1 : 0;
      queries.push("(?, ?, ?, ?)");
      values.push(fk_custom_field_id, newTaskId, value, isChoice);
    }
  
    const finalQuery = `INSERT INTO custom_field__task (fk_custom_field_id, fk_task_id, value, ischoice) VALUES ${queries.join(", ")};`;
    const [result] = await db.execute(finalQuery, values);
    return result;
  } catch (err) {
    throw new Error(`Error adding custom fields: ${err.message}`);
  }
}


module.exports = {
  get_allowed_type_ids,
  get_task_type_id,
  get_task_type_name,
  getTaskDetails,
  countTotal,
  addNewTask,
  getCombinedTaskDetails,
  get_all_availble_customFields_for_taskType,
  addNewTaskCustomFields,
  getTaskCustomDetails
};
