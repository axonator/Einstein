const { initDatabase } = require('../database');
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
  
  async function getIdsByNames(tableName, names) {
    const query = `SELECT id, name FROM ${tableName} WHERE name IN (?);`;
    try {
      const [rows] = await db.execute(query, [names]);
      return rows.reduce((map, row) => {
        map[row.name] = row.id;
        return map;
      }, {});
    } catch (err) {
      throw new Error(`Error fetching IDs from ${tableName}: ${err.message}`);
    }
  }
  
  async function deleterow(id, table_name, column_name) {
    const query = `DELETE FROM ${table_name} WHERE ${column_name} = ?;`;
    try {
      const [result] = await db.execute(query, [id]);
      if (result.affectedRows > 0) {
        return { message: `Row with ID ${id} successfully deleted.` };
      } else {
        throw new Error(`No row found with ID ${id}`);
      }
    } catch (err) {
      throw new Error(`Error deleting row with ID ${id}: ${err.message}`);
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
  

module.exports = {
  get_names,
  getIdsByNames,
  deleterow,
  getLatestCounter,
  updateTableData,
  addNewRow
};
