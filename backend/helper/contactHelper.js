const { initDatabase } = require('../database');
const db = initDatabase();
const helpers = require('../helper/helpers');

async function getCombinedDetails(contact_id, identifier,page_size=10,page_number=1) {
  const [taskDetails] = await getcontactDetails(contact_id, identifier, page_size, page_number);
  const {customFieldsFormatted,customFields} = await helpers.getCutsomDetails(contact_id,'id','contact');
  return { taskDetails, customFields: customFieldsFormatted };
}

async function addNewContact(fields) {
  const { first_name,last_name, counter } = fields;
  const nextOrderNumber = counter + 1000;
  
  const query = `INSERT INTO contact 
    (first_name, last_name, order_number) 
    VALUES (?, ?, ?)`;

  const values = [first_name,last_name, nextOrderNumber || null];

  // Update counter
  const columnValues = { latest_counter: nextOrderNumber };
  const condition = { counter_name: 'contacts' };
  const counter_table_name = 'counter';

  try {
    const [result] = await db.execute(query, values);
    await helpers.updateTableData(counter_table_name, columnValues, condition);
    return result;
  } catch (err) {
    throw new Error(`Error adding new contact: ${JSON.stringify(fields)} - ${err.message}`);
  }
}

async function old_get_contacts(req) {
    const { country_id, industry_id, city_id, state_id, email, page = 1, limit = 10, ...otherFilters } = req.query;
    
    // Base query
    let query = `
    SELECT 
        c.*,
        CONCAT(user.first_name, ' ', user.last_name) AS assigned_to_name,
        country.name AS country_name,
        industry.name AS industry_name,
        city.name AS city_name,
        state.name AS state_name
    FROM 
        contact c
    LEFT JOIN 
        user ON c.assigned_to = user.user_id
    LEFT JOIN 
        country ON c.country_id = country.id
    LEFT JOIN 
        industry ON c.industry_id = industry.id
    LEFT JOIN 
        city ON c.city_id = city.id
    LEFT JOIN 
        state ON c.state_id = state.id
    WHERE 
        1=1
    `;

    // Helper function for array-based filters
    const handleArrayFilter = (filterName) => {
        if (req.query[filterName]) {
            const filterValues = req.query[filterName].split(',').map(value => value.trim());
            const placeholders = filterValues.map(() => '?').join(','); // Expand for IN clause
            query += ` AND c.${filterName} IN (${placeholders})`;
        }
    };

    // Apply array-based filters
    handleArrayFilter('country_id');
    handleArrayFilter('industry_id');
    handleArrayFilter('city_id');
    handleArrayFilter('state_id');

    // Apply text-based filters
    if (email) {
        query += ` AND c.email LIKE ?`;
    }

    // Handle dynamic filters
    Object.keys(otherFilters).forEach((filter) => {
        const filterValue = req.query[filter];
        if (filterValue) {
            query += ` AND c.${filter} LIKE ?`;
        }
    });

    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT ${parseInt(limit, 10)} OFFSET ${parseInt(offset, 10)};`;

    try {
        const result = await db.execute(query);


        // Calculate total (Avoid fetching all rows)
        const countQuery = `
            SELECT COUNT(*) AS total
            FROM contact c
            WHERE 1=1
        `;
        const [countResult] = await db.execute(countQuery, []);
        const total = countResult[0]?.total || 0;
        const totalPages = Math.ceil(total / limit);
        

        return {
            data: result,
            page: parseInt(page, 10),
            totalPages,
            total
        };
    } catch (err) {
        console.error(`Error fetching contacts: ${err.message}`);
        throw new Error(`Error fetching contacts: ${err.message}`);
    }
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

async function countTotal(task_id, identifier, parent_id) {
  // Count total records
  const countQuery = `
  SELECT COUNT(*) AS total
  FROM contact;`;
  
  try {
    // Calculate total (Avoid fetching all rows)
    const [countResult] = await db.execute(countQuery);
    
    // Extract total count
    const total = countResult[0]?.total || 0;
    return total;
  } catch (err) {
    throw new Error(`Error total count: ${err}`);
  }
}


async function add_new_contact(request) {
    const {
        email, first_name, last_name, assigned_to, lead_source, company_name, job_title,
        phone_number, linked_in, city_id, state_id, country_id, industry_id,
        website,
    } = request.body;

    const values = [
        email, first_name, last_name, assigned_to, lead_source, company_name, job_title,
        phone_number, linked_in, city_id, state_id, country_id, industry_id,
        website,
    ];

    const query = `INSERT INTO contact (
        email, first_name, last_name, assigned_to, lead_source, company_name, job_title,
        phone_number, linked_in, city_id, state_id, country_id, industry_id, website
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    try {
        const [result] = await db.execute(query, values);
        return [result];
    } catch (err) {
        throw new Error(`Error adding new contact: ${err.message}`);
    }
}

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

async function get_contact_details(req) {
    const id = req.params.id;

    // SQL query to fetch the contact by ID
    const query = `
    SELECT 
    c.*,
    CONCAT(user.first_name, ' ', user.last_name) AS assigned_to_name,
    country.name AS country_name,
    industry.name AS industry_name,
    city.name AS city_name,
    state.name AS state_name
        FROM 
        contact c
        LEFT JOIN 
        user ON c.assigned_to = user.user_id
        LEFT JOIN 
        country ON c.country_id = country.id
        LEFT JOIN 
        industry ON c.industry_id = industry.id
        LEFT JOIN 
        city ON c.city_id = city.id
        LEFT JOIN 
        state ON c.state_id = state.id
        WHERE 
        c.id = ?;
    `;

    try {
        const [result] = await db.execute(query, [id]);
        if (result.length === 0) {
            throw new Error(`Contact not found`);
        }
        return result;
    } catch (err) {
        throw new Error(`Error fetching contact details for ${id}: ${err.message}`);
    }
}

module.exports = {
    getcontactDetails,
    add_new_contact,
    update_contact,
    get_contact_details,
    getCombinedDetails,
    addNewContact
};
