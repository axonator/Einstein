const { initDatabase,executeQuery } = require('../database');
const db = initDatabase();

  async function addNewRow(table_name, column_names, values, VALUES) {
    const query = `INSERT IGNORE INTO ${table_name} ${column_names} VALUES ${values};`;
    
    try {
      const [result] = await db.execute(query);

      // Calculate the inserted IDs for each row
      const insertedIds = {};
      const insertIdStart = result.insertId; // Start ID from the first inserted row
      const affectedRows = result.affectedRows;

      // Loop through the affected rows and format the response as { "value": id }
      for (let i = 0; i < affectedRows; i++) {
        insertedIds[`${VALUES[i]}`] = insertIdStart + i;
      }

      return insertedIds; // Return the inserted IDs array
    } catch (err) {
      throw new Error(`Error Inserting: ${err.message}`);
    }
  }

  async function get_names(table_name, column_name, condition = '') {
    const query = `SELECT ${column_name} FROM ${table_name} ${condition};`;
    try {
      const [rows] = await db.execute(query);
      return rows;
    } catch (err) {
      throw new Error(`Error fetching ${column_name} from ${table_name}: ${err.message}`);
    }
  }

  async function getTasktags(taskId) {
    const query = `SELECT tag_id,display_name FROM task__tag LEFT JOIN tag ON fk_tag_id = tag_id WHERE fk_task_id = ?;`;
    try {
      const [rows] = await db.execute(query,[taskId]);
      return rows;
    } catch (err) {
      throw new Error(`Error fetching ${column_name} from ${table_name}: ${err.message}`);
    }
  }
  
  async function getIdsByNames(column_names,tableName, conditionColumn, values) {
    const placeholders = values.map(() => '?').join(',');
    const query = `SELECT ${column_names} FROM ${tableName} WHERE ${conditionColumn} IN (${placeholders});`;
    try {
      const [rows] = await db.execute(query, values);
      return rows;
    } catch (err) {
      throw new Error(`Error fetching IDs from ${tableName}: ${err.message}`);
    }
  }
  
  // async function deleterow(id, table_name, column_name) {
  //   const query = `DELETE FROM ${table_name} WHERE ${column_name} = ?;`;
  //   try {
  //     const [result] = await db.execute(query, [id]);
  //     if (result.affectedRows > 0) {
  //       return { message: `Row with ID ${id} successfully deleted.` };
  //     } else {
  //       throw new Error(`No row found with ID ${id}`);
  //     }
  //   } catch (err) {
  //     throw new Error(`Error deleting row with ID ${id}: ${err.message}`);
  //   }
  // }

  async function deleterow(table_name, col_names, col_values) {
    if (col_names.length !== col_values.length) {
        throw new Error("Column names and values must have the same length.");
    }

    const conditions = col_names.map(col => `${col} = ?`).join(" AND ");
    const query = `DELETE FROM ${table_name} WHERE ${conditions};`;

    try {
        const [result] = await db.execute(query, col_values);
        if (result.affectedRows > 0) {
            return { message: `Rows successfully deleted with conditions: ${conditions}` };
        } else {
            throw new Error(`No rows found matching the given conditions`);
        }
    } catch (err) {
        throw new Error(`Error deleting rows: ${err.message}`);
    }
}



  async function getLatestCounter(counterName) {
    // SQL query to fetch the latest counter based on counterName
    const query = `SELECT latest_counter FROM counter WHERE counter_name = ?;`;
  
    try {
      const [rows] = await db.execute(query, [counterName]);
      if (rows.length > 0) {
        const { latest_counter } = rows[0];
        return latest_counter;
      } else {
        throw new Error(`No counter found with name ${counterName}`);
      }
    } catch (err) {
      throw new Error(`Error fetching latest counter with name ${counterName}: ${err.message}`);
    }
  }
  
  async function updateTableData(tableName, columnValues, condition) {
    // Construct the SET clause dynamically from columnValues
    const setClause = Object.keys(columnValues)
    .map(column => `${column} = ?`)
    .join(', ');
    
    // Construct the WHERE clause dynamically from condition
    const whereClause = Object.keys(condition)
    .map(column => `${column} = ?`)
    .join(' AND ');
    
    const query = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`;
    const values = [...Object.values(columnValues), ...Object.values(condition)];
  
    try {
      const [result] = await db.execute(query, values);
      return { message: `Successfully updated ${result.affectedRows} rows in ${tableName}.` };
    } catch (err) {
      throw new Error(`Error updating data in ${tableName}: ${err.message}`);
    }
  }

  async function countTotal( table_name, count_paramater='*', condition='') {
    // Count total records
    const countQuery = `
    SELECT COUNT(${count_paramater}) AS total
    FROM ${table_name} ${condition};`;
    
    try {
      // Calculate total (Avoid fetching all rows)
      const [countResult] = await executeQuery(countQuery);
      return countResult.total || 0;
    } catch (err) {
      throw new Error(`Error total count: ${err}`);
    }
  }

  async function getCutsomDetails(id,identifier='task_id',table_name='task') {
    const query = `
      SELECT 
        t.${identifier},
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
        ${table_name} t
      JOIN 
        custom_field__${table_name} cft ON t.${identifier} = cft.fk_${table_name}_id
      JOIN 
        custom_field cf ON cft.fk_custom_field_id = cf.custom_field_id
      LEFT JOIN 
        lookup l ON cft.ischoice = TRUE AND cft.value = l.lookup_id
      WHERE 
        t.${identifier} = ${id};`;
  
    try {
      const [result] = await db.execute(query);
      // Transform CustomFields into the desired format
      const customFieldsFormatted = {};
      const customFields = []
      result.forEach(field => {
        customFieldsFormatted[field.display_name_singular] = {
          plural: field.display_name_plural,
          value: field.value,
          type: field.type,
          custom_field_id: field.custom_field_id,
          lookupId: field.lookup_id,
        };
        customFields.push(field.display_name_singular);
      });
      
      return {customFieldsFormatted: customFieldsFormatted, customFields : customFields};
    } catch (err) {
      throw new Error(`Error fetching custom fields for task id ${id}: ${err}`);
    }
  }
  

module.exports = {
  get_names,
  getTasktags,
  getIdsByNames,
  deleterow,
  getLatestCounter,
  updateTableData,
  addNewRow,
  countTotal,
  getCutsomDetails
};
