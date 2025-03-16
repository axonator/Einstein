const { initDatabase } = require('../database');
const db = initDatabase();
const helpers = require('../helper/helpers');

async function getCombinedDetails(contact_id, identifier,page_size=10,page_number=1) {
  const [taskDetails] = await getcontactDetails(contact_id, identifier, page_size, page_number);
  const {customFieldsFormatted,customFields} = await helpers.getCutsomDetails(contact_id,'id','contact');
  return { taskDetails, customFields: customFieldsFormatted };
}

async function getcontactDetails(contact_id,identifier='id',page_size=10,page_number=1, tagIds = []) {

  // Extract tag_id values from tagIds array
  const tagIdValues = tagIds.map(tag => tag.tag_id);

  const offset = (page_number - 1) * page_size;
  // Check if we need to join contact__tag table
  const tagJoin = tagIdValues.length > 0 ? "INNER JOIN contact__tag ON contact.contact_id = contact__tag.fk_contact_id" : "";
  const tagFilter = tagIdValues.length > 0 ? `AND contact__tag.fk_tag_id IN (${tagIdValues.join(",")})` : "";

  const query = `
    SELECT DISTINCT
        contact.id, 
        contact.first_name, 
        contact.last_name, 
        contact.order_number
    FROM 
        contact 
    ${tagJoin}
    WHERE 
        contact.${identifier} = ${contact_id}
        ${tagFilter} 
        LIMIT ${page_size} OFFSET ${offset};`;

  try {
    const [result] = await db.execute(query);
    return result;
  } catch (err) {
    throw new Error(`Error fetching contacts for contact_type_id: ${err}`);
  }
}


// async function add_new_contact(request) {
//     const {
//         email, first_name, last_name, assigned_to, lead_source, company_name, job_title,
//         phone_number, linked_in, city_id, state_id, country_id, industry_id,
//         website,
//     } = request.body;

//     const values = [
//         email, first_name, last_name, assigned_to, lead_source, company_name, job_title,
//         phone_number, linked_in, city_id, state_id, country_id, industry_id,
//         website,
//     ];

//     const query = `INSERT INTO contact (
//         email, first_name, last_name, assigned_to, lead_source, company_name, job_title,
//         phone_number, linked_in, city_id, state_id, country_id, industry_id, website
//     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
//     try {
//         const [result] = await db.execute(query, values);
//         return [result];
//     } catch (err) {
//         throw new Error(`Error adding new contact: ${err.message}`);
//     }
// }

async function update_contact(request) {
    const fields = request.body;
    const id = fields.id;

    // Ensure fields are provided for update
    if (Object.keys(fields).length === 0) {
        return res.status(400).json({ error: 'No fields provided to update' });
    }

    // Dynamically construct the SET clause and values
    const setClause = Object.keys(fields)
        .map((field) => `${field} = ?`)
        .join(', ');
    const values = Object.values(fields);

    // Add the ID to the values array for the WHERE clause
    values.push(id);
    const query = `UPDATE contact SET ${setClause} WHERE id = ?`;

    try {
        const [result] = await db.execute(query, values);
        return [result];
    } catch (err) {
        throw new Error(`Error updating contact details for ${id}: ${err.message}`);
    }
}

module.exports = {
    getcontactDetails,
    update_contact,
    getCombinedDetails,
};
